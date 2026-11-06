// 골목대전 서버: 계정, 아바타/팀 저장, 로비, 실시간 대전
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Data = require('./data');
const E = require('./engine');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const INVITE_CODE = process.env.INVITE_CODE || '';
const TURN_SECONDS = Number(process.env.TURN_SECONDS) || 90;
const LEAVE_GRACE_SECONDS = Number(process.env.LEAVE_GRACE_SECONDS) || 15; // 끊긴 뒤 패배까지 기다리는 시간
const PUBLIC = path.join(__dirname, '..', 'public');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SESSION_DAYS = 30;
const MAX_DECKS = 5;

/* ---------- 저장소 ---------- */
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : { users: {}, sessions: {} };

// 재시작하면 파일이 지워지는 무료 호스팅용: GIST_ID와 GIST_TOKEN을 넣으면 비밀 Gist에도 저장합니다.
const GIST_ID = process.env.GIST_ID || '';
const GIST_TOKEN = process.env.GIST_TOKEN || '';
const GIST_API = process.env.GIST_API || 'https://api.github.com';
const gistHeaders = {
  Authorization: `Bearer ${GIST_TOKEN}`, Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json', 'User-Agent': 'golmok-battle',
};

async function loadGist() {
  const r = await fetch(`${GIST_API}/gists/${GIST_ID}`, { headers: gistHeaders });
  if (!r.ok) throw new Error(`Gist 읽기 실패: ${r.status}`);
  const file = (await r.json()).files?.['db.json'];
  if (!file) return; // 처음 실행
  const text = file.truncated ? await (await fetch(file.raw_url, { headers: gistHeaders })).text() : file.content;
  Object.assign(db, JSON.parse(text));
}

let gistDirty = false, gistBusy = false, gistTimer = null;
async function pushGist() {
  if (gistBusy || !gistDirty) return;
  gistBusy = true; gistDirty = false;
  try {
    const r = await fetch(`${GIST_API}/gists/${GIST_ID}`, {
      method: 'PATCH', headers: gistHeaders,
      body: JSON.stringify({ files: { 'db.json': { content: JSON.stringify(db) } } }),
    });
    if (!r.ok) throw new Error(String(r.status));
  } catch (e) {
    gistDirty = true;
    console.error('Gist 저장 실패, 다음 변경 때 다시 시도합니다:', e.message);
  }
  gistBusy = false;
}
function queueGist() {
  if (!GIST_ID) return;
  gistDirty = true;
  clearTimeout(gistTimer);
  gistTimer = setTimeout(async () => { await pushGist(); if (gistDirty) queueGist(); }, 3000);
}

let saveTimer = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_FILE); // 쓰다 죽어도 파일이 깨지지 않게
    queueGist();
  }, 200);
}

/* ---------- 계정 ---------- */
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const keyOf = (name) => name.toLowerCase();

const defaultTeam = () => ['yeontan', 'kettle', 'kongsiru', 'orak', 'maetdol', 'kkaebi'].map((species) => {
  const moves = {
    yeontan: ['coalhead', 'quake', 'firerush', 'guard'],
    kettle: ['bucket', 'magnet', 'flame', 'nap'],
    kongsiru: ['sapdrain', 'pollen', 'seed', 'sunbathe'],
    orak: ['highvolt', 'scold', 'shock', 'charge'],
    maetdol: ['quake', 'rockthrow', 'ironhead', 'wall'],
    kkaebi: ['club', 'ambush', 'ttukttak', 'wisp'],
  }[species];
  return { species, moves };
});

const randomAvatar = () => Object.fromEntries(
  Object.entries(Data.AVATAR_OPTIONS).map(([k, n]) => [k, crypto.randomInt(k === 'hat' ? 1 : n)])
);

function validAvatar(a) {
  if (!a || typeof a !== 'object') return null;
  const out = {};
  for (const [k, n] of Object.entries(Data.AVATAR_OPTIONS)) {
    if (!Number.isInteger(a[k]) || a[k] < 0 || a[k] >= n) return null;
    out[k] = a[k];
  }
  return out;
}

function validDecks(list) {
  if (!Array.isArray(list) || list.length < 1 || list.length > MAX_DECKS) return null;
  const out = [];
  for (const d of list) {
    const name = String(d?.name ?? '').trim();
    const team = validTeam(d?.team);
    if (!team || !name || [...name].length > 12 || /[\u0000-\u001f]/.test(name)) return null;
    out.push({ name, team });
  }
  return out;
}
const deckOf = (u) => u.decks[u.active];

// 예전의 팀 하나짜리 계정을 덱 구조로 옮깁니다.
function migrate() {
  let changed = false;
  for (const u of Object.values(db.users)) {
    if (u.decks) continue;
    u.decks = [{ name: '기본 덱', team: u.team || defaultTeam() }];
    u.active = 0;
    delete u.team;
    changed = true;
  }
  if (changed) save();
}

function validTeam(t) {
  if (!Array.isArray(t) || t.length < 3 || t.length > 6) return null;
  const seen = new Set(), out = [];
  for (const m of t) {
    const sp = Data.MONSTERS[m?.species];
    if (!sp || seen.has(m.species) || !Array.isArray(m.moves)) return null;
    const mv = [...new Set(m.moves)];
    if (mv.length < 1 || mv.length > 4 || mv.length !== m.moves.length) return null;
    if (!mv.every((id) => sp.moves.includes(id))) return null;
    seen.add(m.species);
    out.push({ species: m.species, moves: mv });
  }
  return out;
}

const publicUser = (u) => ({
  name: u.name, avatar: u.avatar, decks: u.decks, active: u.active,
  wins: u.wins, losses: u.losses, draws: u.draws, h2h: u.h2h,
});

function createSession(res, req, key) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(token)] = { user: key, exp: Date.now() + SESSION_DAYS * 864e5 };
  save();
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `sid=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 86400}${secure}`);
}

function userFromReq(req) {
  const m = /(?:^|;\s*)sid=([a-f0-9]{64})/.exec(req.headers.cookie || '');
  if (!m) return null;
  const hashed = sha(m[1]);
  const s = db.sessions[hashed];
  if (!s) return null;
  if (s.exp < Date.now()) { delete db.sessions[hashed]; save(); return null; }
  return db.users[s.user] ? { key: s.user, hashed } : null;
}

// 로그인 무차별 대입 방지: IP당 1분에 15회
const attempts = new Map();
function limited(req) {
  const ip = req.socket.remoteAddress;
  const now = Date.now();
  const a = attempts.get(ip);
  if (!a || a.reset < now) { attempts.set(ip, { n: 1, reset: now + 60000 }); return false; }
  return ++a.n > 15;
}

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' ws: wss:; img-src 'self' data:",
};

function json(res, code, body) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 20000) { reject(new Error('too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
  });
}

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/data') {
    const { TYPES, CHART, MOVES, MONSTERS, AVATAR_OPTIONS } = Data;
    return json(res, 200, { TYPES, CHART, MOVES, MONSTERS, AVATAR_OPTIONS, inviteRequired: !!INVITE_CODE });
  }
  if (route === 'POST /api/signup' || route === 'POST /api/login') {
    if (limited(req)) return json(res, 429, { error: '시도가 너무 많습니다. 1분 뒤에 다시 해 주세요.' });
    const body = await readBody(req);
    const name = String(body.name ?? '').trim(), password = String(body.password ?? '');
    const key = keyOf(name);
    if (route === 'POST /api/login') {
      const u = db.users[key];
      const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(password, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
      if (!ok) return json(res, 401, { error: '아이디나 비밀번호가 맞지 않습니다.' });
      createSession(res, req, key);
      return json(res, 200, { user: publicUser(u) });
    }
    if (INVITE_CODE && body.invite !== INVITE_CODE) return json(res, 403, { error: '초대 코드가 맞지 않습니다.' });
    if (!/^[a-zA-Z0-9가-힣_]{2,12}$/.test(name)) return json(res, 400, { error: '아이디는 한글, 영문, 숫자로 2~12자여야 합니다.' });
    if (password.length < 6 || password.length > 100) return json(res, 400, { error: '비밀번호는 6자 이상이어야 합니다.' });
    if (db.users[key]) return json(res, 409, { error: '이미 있는 아이디입니다.' });
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[key] = {
      name, salt, hash: hashPw(password, salt), avatar: randomAvatar(), decks: [{ name: '기본 덱', team: defaultTeam() }], active: 0,
      wins: 0, losses: 0, draws: 0, h2h: {},
    };
    createSession(res, req, key);
    return json(res, 200, { user: publicUser(db.users[key]) });
  }

  const auth = userFromReq(req);
  if (!auth) return json(res, 401, { error: '로그인이 필요합니다.' });
  const user = db.users[auth.key];

  if (route === 'GET /api/me') return json(res, 200, { user: publicUser(user) });
  if (route === 'POST /api/logout') {
    delete db.sessions[auth.hashed]; save();
    res.setHeader('Set-Cookie', 'sid=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
    return json(res, 200, {});
  }
  if (route === 'PUT /api/avatar') {
    const a = validAvatar(await readBody(req));
    if (!a) return json(res, 400, { error: '아바타 값이 올바르지 않습니다.' });
    user.avatar = a; save(); broadcastLobby();
    return json(res, 200, { user: publicUser(user) });
  }
  if (route === 'PUT /api/decks') {
    const body = await readBody(req);
    const decks = validDecks(body.decks);
    if (!decks) return json(res, 400, { error: '덱은 1~5개, 이름은 12자 이내, 요괴는 서로 다른 3~6마리, 기술은 1~4개여야 합니다.' });
    const active = Number.isInteger(body.active) && body.active >= 0 && body.active < decks.length ? body.active : 0;
    user.decks = decks; user.active = active; save();
    return json(res, 200, { user: publicUser(user) });
  }
  return json(res, 404, { error: '없는 경로입니다.' });
}

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
  let url, rel;
  try {
    url = new URL(req.url, 'http://x');
    rel = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).slice(1);
  } catch { res.writeHead(400); return res.end('Bad request'); }
  if (url.pathname.startsWith('/api/')) {
    try { return await api(req, res, url); }
    catch { return json(res, 400, { error: '요청이 올바르지 않습니다.' }); }
  }
  const file = path.resolve(PUBLIC, rel);
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
});

/* ---------- 실시간 ---------- */
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
const online = new Map();   // 유저 키 → 소켓
const battles = new Map();  // 대전 id → room
const inBattle = new Map(); // 유저 키 → room
const challenges = new Map(); // 신청자 키 → { to, size }
const notices = new Map();    // 다음 접속 때 알려 줄 말

const send = (ws, msg) => { if (ws?.readyState === 1) ws.send(JSON.stringify(msg)); };
const toast = (key, text) => send(online.get(key), { t: 'toast', text });

function broadcastLobby() {
  const players = [...online.keys()].map((k) => {
    const u = db.users[k];
    return { key: k, name: u.name, avatar: u.avatar, wins: u.wins, losses: u.losses, busy: inBattle.has(k) };
  });
  for (const [k, ws] of online) {
    const incoming = [...challenges].filter(([, c]) => c.to === k).map(([from, c]) => ({ from, name: db.users[from].name, size: c.size }));
    send(ws, { t: 'lobby', players, incoming, outgoing: challenges.get(k) || null });
  }
}

function clearChallenges(key) {
  challenges.delete(key);
  for (const [from, c] of challenges) if (c.to === key) challenges.delete(from);
}

const BOT = 'bot';
const BOT_LEVELS = ['쉬움', '보통', '어려움', '지옥'];

function startBattle(keys, size, level = 1) {
  const players = keys.map((k) => (k === BOT
    ? { name: `골목대장(${BOT_LEVELS[level]})`, avatar: randomAvatar(), deck: `${BOT_LEVELS[level]} 덱`, team: E.botTeam(level, size, deckOf(db.users[keys[0]]).team.slice(0, size)) }
    : { name: db.users[k].name, avatar: db.users[k].avatar, deck: deckOf(db.users[k]).name, team: deckOf(db.users[k]).team.slice(0, size) }));
  const room = { id: crypto.randomUUID(), keys, b: E.createBattle(players, undefined, { preview: true }), deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: level };
  battles.set(room.id, room);
  keys.forEach((k) => { if (k !== BOT) { inBattle.set(k, room); clearChallenges(k); } });
  armTimer(room);
  keys.forEach((k, s) => { if (k !== BOT) syncBattle(room, s); });
  pumpBot(room);
  broadcastLobby();
}

const remaining = (room) => (room.deadline ? Math.max(0, room.deadline - Date.now()) : null);

function syncBattle(room, s) {
  const k = room.keys[s];
  send(online.get(k), {
    t: 'battle', view: E.viewFor(room.b, s), remain: remaining(room),
    oppOnline: room.keys[1 - s] === BOT || online.has(room.keys[1 - s]),
    practice: room.keys.includes(BOT),
  });
}

function armTimer(room) {
  clearTimeout(room.timer);
  if (room.b.phase === 'over' || room.keys.includes(BOT)) { room.deadline = 0; return; }
  room.deadline = Date.now() + TURN_SECONDS * 1000;
  room.timer = setTimeout(() => onTimeout(room), TURN_SECONDS * 1000 + 300);
}

function onTimeout(room) {
  if (room.ended) return;
  if (!room.keys.some((k) => online.has(k))) return dissolve(room); // 둘 다 나갔으면 무효
  // 시간 안에 못 고른 쪽은 자동으로 행동합니다.
  for (const s of [0, 1]) {
    if (room.b.phase !== 'over' && room.b.needs[s] && !room.b.pending[s]) {
      toast(room.keys[s], '시간이 지나 자동으로 골랐습니다.');
      apply(room, s, E.botAction(room.b, s));
    }
  }
}

function dissolve(room) {
  room.ended = true;
  clearTimeout(room.timer); clearTimeout(room.idle);
  Object.values(room.leaveTimers).forEach(clearTimeout);
  room.keys.forEach((k) => inBattle.delete(k));
  battles.delete(room.id);
  broadcastLobby();
}

// 대전 중 나간 사람은 패배, 상대는 승리. 새로고침과 잠깐의 끊김은 유예 시간 안에 돌아오면 이어집니다.
function onLeaveTimeout(room, key) {
  if (room.ended || online.has(key)) return;
  const s = room.keys.indexOf(key);
  if (!online.has(room.keys[1 - s])) return dissolve(room); // 둘 다 나갔으면 무효
  notices.set(key, '대전을 나가서 패배 처리되었습니다.');
  afterTurn(room, E.forfeit(room.b, s, true));
}

function apply(room, s, action) {
  const r = E.choose(room.b, s, action);
  if (!r.ok) { toast(room.keys[s], '지금은 할 수 없는 행동입니다.'); return; }
  if (!r.events) {
    const other = room.keys[1 - s];
    send(online.get(room.keys[s]), { t: 'chosen', view: E.viewFor(room.b, s) });
    if (other !== BOT) send(online.get(other), { t: 'opp_ready' });
    pumpBot(room);
    return;
  }
  afterTurn(room, r.events);
}

function pumpBot(room) {
  const s = room.keys.indexOf(BOT);
  if (s < 0 || room.ended) return;
  const { b } = room;
  if (b.phase !== 'over' && b.needs[s] && !b.pending[s]) {
    // 교체 단계에서 사람도 골라야 하면 먼저 골라 두고, 봇만 고르면 되면 바로 처리
    if (b.phase === 'choose' && !b.pending[1 - s]) return;
    apply(room, s, E.botAction(b, s, room.botLevel));
  }
}

function afterTurn(room, events) {
  armTimer(room);
  room.keys.forEach((k, s) => {
    if (k === BOT) return;
    send(online.get(k), { t: 'turn', events, view: E.viewFor(room.b, s), remain: remaining(room) });
  });
  if (room.b.phase === 'over') return finish(room);
  pumpBot(room);
}

function finish(room) {
  const { winner } = room.b;
  if (!room.keys.includes(BOT)) {
    const [a, b] = room.keys.map((k) => db.users[k]);
    const h = (u, o, f) => { (u.h2h[o.name] ||= { w: 0, l: 0, d: 0 })[f]++; };
    if (winner === null) { a.draws++; b.draws++; h(a, b, 'd'); h(b, a, 'd'); }
    else {
      const [w, l] = winner === 0 ? [a, b] : [b, a];
      w.wins++; l.losses++; h(w, l, 'w'); h(l, w, 'l');
    }
    save();
    room.keys.forEach((k) => send(online.get(k), { t: 'me', user: publicUser(db.users[k]) }));
  }
  dissolve(room);
}

function onMessage(key, msg) {
  const room = inBattle.get(key);
  switch (msg?.t) {
    case 'action': {
      if (!room) return;
      apply(room, room.keys.indexOf(key), msg.action);
      break;
    }
    case 'forfeit': {
      if (!room) return;
      const events = E.forfeit(room.b, room.keys.indexOf(key));
      afterTurn(room, events);
      break;
    }
    case 'practice': {
      if (room) return;
      const size = msg.size === 6 ? 6 : 3;
      if (deckOf(db.users[key]).team.length < size) return toast(key, `선택한 덱에 요괴가 ${size}마리 있어야 합니다.`);
      startBattle([key, BOT], size, [0, 1, 2, 3].includes(msg.level) ? msg.level : 1);
      break;
    }
    case 'challenge': {
      const to = keyOf(String(msg.to ?? ''));
      const size = msg.size === 6 ? 6 : 3;
      if (room || to === key || !online.has(to)) return toast(key, '지금은 신청할 수 없습니다.');
      if (inBattle.has(to)) return toast(key, '상대가 대전 중입니다.');
      if (deckOf(db.users[key]).team.length < size) return toast(key, `선택한 덱에 요괴가 ${size}마리 있어야 합니다.`);
      challenges.set(key, { to, size });
      broadcastLobby();
      break;
    }
    case 'cancel': challenges.delete(key); broadcastLobby(); break;
    case 'decline': {
      const from = keyOf(String(msg.from ?? ''));
      if (challenges.get(from)?.to === key) {
        challenges.delete(from);
        toast(from, `${db.users[key].name}님이 대전을 거절했습니다.`);
        broadcastLobby();
      }
      break;
    }
    case 'accept': {
      const from = keyOf(String(msg.from ?? ''));
      const c = challenges.get(from);
      if (!c || c.to !== key || room || !online.has(from) || inBattle.has(from)) return toast(key, '이미 끝난 신청입니다.');
      if (deckOf(db.users[key]).team.length < c.size) return toast(key, `선택한 덱에 요괴가 ${c.size}마리 있어야 합니다.`);
      if (deckOf(db.users[from]).team.length < c.size) return toast(key, '상대의 덱 인원이 모자랍니다.');
      startBattle([from, key], c.size);
      break;
    }
    default:
  }
}

server.on('upgrade', (req, socket, head) => {
  const auth = userFromReq(req);
  const origin = req.headers.origin;
  let sameOrigin = false;
  try { sameOrigin = new URL(origin).host === req.headers.host; } catch { /* 잘못된 Origin */ }
  if (!auth || !sameOrigin || !req.url.startsWith('/ws')) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    return socket.destroy();
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const key = auth.key;
    online.get(key)?.close(4000, 'replaced'); // 새 탭/기기로 접속하면 이전 연결은 닫음
    online.set(key, ws);
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      try { onMessage(key, JSON.parse(raw)); }
      catch (e) { console.error('메시지 처리 오류', e); }
    });
    ws.on('close', () => {
      if (online.get(key) !== ws) return;
      online.delete(key);
      challenges.delete(key);
      const room = inBattle.get(key);
      if (room) {
        const s = room.keys.indexOf(key);
        const other = room.keys[1 - s];
        if (other === BOT) room.idle = setTimeout(() => { if (!online.has(key)) dissolve(room); }, 10 * 60000);
        else {
          send(online.get(other), { t: 'opp_conn', online: false, grace: LEAVE_GRACE_SECONDS });
          room.leaveTimers[key] = setTimeout(() => onLeaveTimeout(room, key), LEAVE_GRACE_SECONDS * 1000);
        }
      }
      broadcastLobby();
    });

    send(ws, { t: 'me', user: publicUser(db.users[key]) });
    if (notices.has(key)) { send(ws, { t: 'toast', text: notices.get(key) }); notices.delete(key); }
    const room = inBattle.get(key);
    if (!room) send(ws, { t: 'no_battle' });
    if (room) {
      clearTimeout(room.idle);
      clearTimeout(room.leaveTimers[key]);
      syncBattle(room, room.keys.indexOf(key));
      const other = room.keys[1 - room.keys.indexOf(key)];
      if (other !== BOT) send(online.get(other), { t: 'opp_conn', online: true });
    }
    broadcastLobby();
  });
});

setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.alive) { ws.terminate(); continue; }
    ws.alive = false; ws.ping();
  }
}, 15000).unref();

(async () => {
  if (GIST_ID) {
    // 읽기에 실패한 채로 켜지면 빈 데이터로 덮어쓰게 되므로 아예 시작하지 않습니다.
    try { await loadGist(); }
    catch (e) { console.error(e.message); process.exit(1); }
  }
  migrate();
  server.listen(PORT, () => console.log(`골목대전 서버 실행 중: http://localhost:${PORT}`));
})();

process.on('SIGTERM', async () => {
  if (GIST_ID) { clearTimeout(gistTimer); gistBusy = false; await pushGist(); }
  process.exit(0);
});
