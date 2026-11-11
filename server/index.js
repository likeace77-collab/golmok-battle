// 골목대전 서버: 계정, 아바타/팀 저장, 로비, 실시간 대전
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Data = require('./data');
const E = require('./engine');
const P = require('./progress');

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const INVITE_CODE = process.env.INVITE_CODE || '';
const TURN_SECONDS = Number(process.env.TURN_SECONDS) || 90;
const LEAVE_GRACE_SECONDS = Number(process.env.LEAVE_GRACE_SECONDS) || 15; // 끊긴 뒤 패배까지 기다리는 시간
const PUBLIC = path.join(__dirname, '..', 'public');
// 새 게임(v2)은 다른 파일에 저장합니다. 예전 게임(db.json)은 건드리지 않고 그대로 남겨 둡니다.
const OLD_DB_FILE = path.join(DATA_DIR, 'db.json');
const DB_FILE = path.join(DATA_DIR, 'db2.json');
const SESSION_DAYS = 30;

/* ---------- 저장소 ---------- */
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = { users: {}, sessions: {} };
function loadLocal() { // 아래에서 쓰는 함수들이 다 정의된 뒤에 부릅니다.
  if (fs.existsSync(DB_FILE)) replaceDb(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
  else if (fs.existsSync(OLD_DB_FILE)) { replaceDb(fromOldGame(JSON.parse(fs.readFileSync(OLD_DB_FILE, 'utf8')))); save(); }
}
function replaceDb(next) { for (const k of Object.keys(db)) delete db[k]; Object.assign(db, next); }

// 재시작하면 파일이 지워지는 무료 호스팅용: GIST_ID와 GIST_TOKEN을 넣으면 비밀 Gist에도 저장합니다.
const GIST_ID = process.env.GIST_ID || '';
const GIST_TOKEN = process.env.GIST_TOKEN || '';
const GIST_API = process.env.GIST_API || 'https://api.github.com';
// 버전마다 같은 Gist 안의 다른 파일에 저장합니다 (예: db-lumina.json).
const GIST_FILE = process.env.GIST_FILE || 'db.json';
const GIST_FILE2 = GIST_FILE.replace(/\.json$/, '') + '-v2.json'; // 새 게임 저장 파일
const gistHeaders = {
  Authorization: `Bearer ${GIST_TOKEN}`, Accept: 'application/vnd.github+json',
  'Content-Type': 'application/json', 'User-Agent': 'golmok-battle',
};

// 신캐 공모전 출품작은 그림이 커서 따로 저장합니다 (게임 기록 저장이 무거워지지 않게).
const CONTEST_FILE = path.join(DATA_DIR, 'contest.json');
const GIST_CONTEST_OLD = GIST_FILE.replace(/\.json$/, '') + '-contest.json'; // 원래 게임 서버 것 (읽기만)
const GIST_CONTEST = GIST_FILE.replace(/\.json$/, '') + '-v2-contest.json';
const contest = fs.existsSync(CONTEST_FILE) ? JSON.parse(fs.readFileSync(CONTEST_FILE, 'utf8')) : { entries: [] };

async function loadGist() {
  const r = await fetch(`${GIST_API}/gists/${GIST_ID}`, { headers: gistHeaders });
  if (!r.ok) throw new Error(`Gist 읽기 실패: ${r.status}`);
  const files = (await r.json()).files || {};
  const read = async (f) => (f.truncated ? (await fetch(f.raw_url, { headers: gistHeaders })).text() : f.content);
  if (files[GIST_CONTEST]) Object.assign(contest, JSON.parse(await read(files[GIST_CONTEST])));
  else if (files[GIST_CONTEST_OLD]) Object.assign(contest, JSON.parse(await read(files[GIST_CONTEST_OLD]))); // 처음엔 원래 게임 출품작을 복사
  if (files[GIST_FILE2]) return replaceDb(JSON.parse(await read(files[GIST_FILE2])));
  if (files[GIST_FILE]) { replaceDb(fromOldGame(JSON.parse(await read(files[GIST_FILE])))); queueGist(); } // 처음 새 게임으로 넘어올 때
}

let gistDirty = false, contestDirty = false, gistBusy = false, gistTimer = null;
async function pushGist() {
  if (gistBusy || (!gistDirty && !contestDirty)) return;
  gistBusy = true;
  const files = {}, was = [gistDirty, contestDirty];
  if (gistDirty) files[GIST_FILE2] = { content: JSON.stringify(db) };
  if (contestDirty) files[GIST_CONTEST] = { content: JSON.stringify(contest) };
  gistDirty = contestDirty = false;
  try {
    const r = await fetch(`${GIST_API}/gists/${GIST_ID}`, { method: 'PATCH', headers: gistHeaders, body: JSON.stringify({ files }) });
    if (!r.ok) throw new Error(String(r.status));
  } catch (e) {
    gistDirty ||= was[0]; contestDirty ||= was[1];
    console.error('Gist 저장 실패, 다음 변경 때 다시 시도합니다:', e.message);
  }
  gistBusy = false;
}
function queueGist(kind = 'db') {
  if (!GIST_ID) return;
  if (kind === 'contest') contestDirty = true; else gistDirty = true;
  clearTimeout(gistTimer);
  gistTimer = setTimeout(async () => { await pushGist(); if (gistDirty || contestDirty) queueGist(contestDirty ? 'contest' : 'db'); }, 3000);
}
function saveContest() {
  const tmp = `${CONTEST_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(contest));
  fs.renameSync(tmp, CONTEST_FILE);
  queueGist('contest');
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

const NONE_FIRST = ['hat', 'glasses', 'face', 'brow', 'gloves', 'neck', 'back', 'hand', 'aura', 'pose', 'body'];
const randomAvatar = (any = false) => Object.fromEntries(
  Object.entries(Data.AVATAR_OPTIONS).map(([k, n]) => [k, !any && NONE_FIRST.includes(k) ? 0 : crypto.randomInt(n)])
);
const pick = (list) => list[crypto.randomInt(list.length)].id;
const randomStyle = () => ({ title: pick(Data.COSMETICS.titles), card: pick(Data.COSMETICS.cards), pins: [pick(Data.COSMETICS.pins), pick(Data.COSMETICS.pins)] });
const newStats = () => ({ games: 0, streak: 0, streakBest: 0, p0: 0, p1: 0, p2: 0, p3: 0, tagGames: 0, tagWins: 0, megas: 0, zmoves: 0, botWins: 0, dummyDmg: 0, dummyBest: 0, flawless: 0 });
const defaultStyle = () => ({ title: 'rookie', card: 'basic', pins: [] });
const statOf = (u, k) => (k === 'wins' || k === 'losses' || k === 'draws' ? u[k] || 0 : u.stats?.[k] || 0);
// 개발자 계정은 모든 꾸미기를 씁니다. 'dev' 조건은 개발자 계정 전용, 'gift'는 우편 보상으로 받은 것만.
const owns = (u, ref) => (u.owned || []).includes(ref);
const REF = new Map(Object.entries(Data.COSMETICS).flatMap(([kind, list]) => list.map((x) => [x, `${kind}:${x.id}`])));
const isUnlocked = (u, item) => !item.cond || isDev(u) || owns(u, REF.get(item)) || (item.cond[0] === 'gift' ? owns(u, item.cond[1]) : !['dev', 'shop'].includes(item.cond[0]) && statOf(u, item.cond[0]) >= item.cond[1]);

// 예전 게임 계정을 새 게임으로: 아이디·비밀번호·아바타·칭호(연 꾸미기 전부)·우편만 옮기고 나머지는 처음부터.
function fromOldGame(old) {
  const users = {};
  for (const [k, u] of Object.entries(old.users || {})) {
    const opened = [...REF].filter(([item]) => item.cond && item.cond[0] !== 'dev' && item.cond[0] !== 'gift' && statOf(u, item.cond[0]) >= item.cond[1]).map(([, ref]) => ref);
    users[k] = {
      ...P.newProgress(),
      name: u.name, salt: u.salt, hash: u.hash, avatar: u.avatar, style: u.style, owned: [...new Set([...(u.owned || []), ...opened])],
      grants: u.grants || [], mail: u.mail || [], birthYear: u.birthYear, settings: u.settings || { mosaic: false },
      createdAt: u.createdAt, lastSeen: u.lastSeen, notes: u.notes || {}, stats: newStats(), wins: 0, losses: 0, draws: 0, h2h: {},
      legacy: { wins: u.wins || 0, losses: u.losses || 0 },
    };
  }
  console.log(`예전 게임 계정 ${Object.keys(users).length}개를 새 게임으로 옮겼습니다.`);
  return { users, sessions: old.sessions || {}, v: 2 };
}

/* ---------- 우편함 ---------- */
// reward: ['titles:day1', 'cards:gold', ...] 꾸미기 아이템
function sendMail(u, { from, title, body, reward = [] }) {
  (u.mail ||= []).unshift({ id: crypto.randomBytes(6).toString('hex'), from, title, body, reward, at: Date.now(), read: false, claimed: !reward.length });
  if (u.mail.length > 50) u.mail.length = 50;
}
const rewardItem = (ref) => { const [kind, id] = ref.split(':'); const it = Data.COSMETICS[kind]?.find((x) => x.id === id); return it ? { kind, id, n: it.n } : null; };
const mailView = (u) => (u.mail || []).map((m) => ({ ...m, reward: m.reward.map(rewardItem).filter(Boolean) }));
function validStyle(u, s) {
  if (!s || typeof s !== 'object') return null;
  const find = (kind, id) => Data.COSMETICS[kind].find((x) => x.id === id && isUnlocked(u, x));
  const pins = Array.isArray(s.pins) ? [...new Set(s.pins)] : [];
  if (!find('titles', s.title) || !find('cards', s.card) || pins.length > 3 || !pins.every((p) => find('pins', p))) return null;
  return { title: s.title, card: s.card, pins };
}

function validAvatar(a) {
  if (!a || typeof a !== 'object') return null;
  const out = {};
  for (const [k, n] of Object.entries(Data.AVATAR_OPTIONS)) {
    if (!Number.isInteger(a[k]) || a[k] < 0 || a[k] >= n) return null;
    out[k] = a[k];
  }
  return out;
}

function validDecks(u, list) {
  if (!Array.isArray(list) || list.length < 1 || list.length > 20) return null;
  const out = [];
  for (const d of list) {
    const name = String(d?.name ?? '').trim();
    const team = validTeam(u, d?.team);
    if (!team || !name || [...name].length > 12 || /[\u0000-\u001f]/.test(name)) return null;
    out.push({ name, team });
  }
  return out;
}
const deckOf = (u) => u.decks[u.active] || { name: '', team: [] };
const monOf = (u, uid) => u.mons.find((m) => m.uid === uid);
// 대전에 나갈 팀: 덱의 칸(uid, 도구)을 내 골목몬(종류, 기술)으로 바꿉니다.
const battleTeam = (u) => deckOf(u).team.map((t) => { const m = monOf(u, t.uid); return m && { species: m.species, moves: m.moves, ...(t.item ? { item: t.item } : {}) }; }).filter(Boolean);
const deckView = (u) => u.decks.map((d) => ({ name: d.name, team: d.team.map((t) => { const m = monOf(u, t.uid); return m && { uid: m.uid, species: m.species, moves: m.moves, ...(t.item ? { item: t.item } : {}) }; }).filter(Boolean) }));

// 예전의 팀 하나짜리 계정을 덱 구조로 옮깁니다.
function migrate() {
  let changed = false;
  for (const u of Object.values(db.users)) {
    for (const k of Object.keys(Data.AVATAR_OPTIONS)) if (!Number.isInteger(u.avatar[k])) { u.avatar[k] = 0; changed = true; }
    if (!u.stats) { u.stats = newStats(); changed = true; }
    for (const [k, v0] of Object.entries(newStats())) if (!Number.isInteger(u.stats[k])) { u.stats[k] = v0; changed = true; }
    if (!u.style) { u.style = defaultStyle(); changed = true; }
    for (const [k, v0] of Object.entries(P.newProgress())) if (u[k] === undefined) { u[k] = v0; changed = true; }
    for (const [k, v0] of Object.entries(P.newProgress().counts)) if (!Number.isInteger(u.counts[k])) { u.counts[k] = v0; changed = true; }
    // 골목몬 기술이 바뀌었을 때: 더는 못 배우는 기술은 빼고, 비면 앞에서부터 채웁니다.
    for (const m of u.mons) {
      const sp = Data.MONSTERS[m.species];
      if (!sp) continue;
      const ok = m.moves.filter((id) => sp.moves.includes(id));
      if (ok.length === m.moves.length && ok.length) continue;
      for (const id of sp.moves) if (ok.length < 4 && !ok.includes(id)) ok.push(id);
      m.moves = ok; changed = true;
    }
    // 개발자 계정: 모든 골목몬 1마리씩과 모든 메가스톤 (꾸미기는 isUnlocked에서 전부 열림)
    if (isDev(u)) {
      const have = new Set(u.mons.map((m) => m.species));
      for (const sp of Object.keys(Data.MONSTERS)) if (!have.has(sp)) { P.addMon(u, sp); changed = true; }
      for (const sp of Object.keys(Data.MONSTERS)) if (Data.MONSTERS[sp].mega && !u.stones.includes(sp)) { u.stones.push(sp); changed = true; }
    }
  }
  // 운영 보상: 버그로 기록이 날아간 계정에 한 번만 지급 (grants에 남겨 다시 주지 않음)
  const GRANTS = [
    { id: 'suho-dummy1000', user: 'suho', why: '훈련장 1000딜 기록이 업데이트 중 사라짐', notice: '버그로 사라졌던 훈련장 기록(한 턴 1000)을 복구했습니다. 칭호 "더미 일격 분쇄"가 열렸어요!', apply: (u) => { u.stats.dummyBest = Math.max(u.stats.dummyBest || 0, 1000); u.stats.dummyDmg = Math.max(u.stats.dummyDmg || 0, 1000); } },
    // 게임 첫날부터 함께한 계정: Day 1 칭호를 우편으로
    ...['suho', '티키티키펑크', 'PEGADORA'].map((name) => ({
      id: 'day1-title', user: name, why: '첫날부터 함께한 플레이어', notice: '우편함에 특별한 선물이 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '첫날부터 함께해 줘서 고마워요', body: '골목대전이 처음 문을 연 날부터 함께한 플레이어에게만 드리는 전용 칭호입니다. 앞으로도 골목을 지켜 주세요!', reward: ['titles:day1'] }),
    })),
    // 게임을 만드는 데 가장 애쓴 계정: 신급 칭호 LEGENDARY LABORER
    ...['suho', 'PEGADORA', '티키티키펑크'].map((name) => ({
      id: 'laborer-title', user: name, why: '게임 제작에 가장 힘쓴 플레이어', notice: '우편함에 신급 칭호가 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '골목대전을 함께 만든 당신에게', body: '골목대전을 만드는 데 누구보다 애쓰고 열심히 해 준 분께만 드리는 신급 칭호입니다. 전설보다 높은 단 하나의 등급, LEGENDARY LABORER. 고생 많았어요!', reward: ['titles:laborer'] }),
    })),
    // 신화 칭호 등신
    { id: 'deungsin-title', user: 'suho', why: '신화 칭호 등신', notice: '우편함에 신화 등급 칭호가 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '신화가 된 당신에게', body: '전설도, 신도 넘어선 단 하나의 등급, 신화. 오직 당신만을 위한 칭호 "등신"을 드립니다. 바다의 왕처럼 당당하게 달고 다니세요!', reward: ['titles:deungsin'] }) },
    // 신화 칭호 소음공해죄: 하르모니움을 만들어 준 고마움
    { id: 'noisecrime-title', user: '티키티키펑크', why: '하르모니움 제작', notice: '우편함에 신화 등급 칭호가 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '하르모니움을 만들어 주셔서 감사합니다', body: '하르모니움을 만들어 주셔서 감사합니다. 골목에 울려 퍼진 그 금속음에 경의를 표하며, 신화 등급 칭호 "소음공해죄"를 드립니다!', reward: ['titles:noisecrime'] }) },
  ];
  for (const g of GRANTS) {
    const u = db.users[keyOf(g.user)];
    if (!u || (u.grants || []).includes(g.id)) continue;
    g.apply(u);
    (u.grants ||= []).push(g.id);
    if (g.notice) notices.set(keyOf(g.user), g.notice);
    console.log(`보상 지급: ${g.id} (${g.why})`);
    changed = true;
  }
  if (changed) save();
}

// 개발자 계정과 밴
const isDev = (u) => Data.DEV_ACCOUNTS.includes(u?.name);
const bannedFor = (u) => (isDev(u) ? [] : Data.BANNED);
const bannedIn = (u, team) => team.filter((m) => bannedFor(u).includes(m.species)).map((m) => Data.MONSTERS[m.species].n);
// 공개 전 골목몬: 다른 사람과 하는 대전에는 개발자 계정도 못 가지고 나감 (연습전·훈련장만)
const secretIn = (team) => team.filter((m) => Data.BANNED.includes(m.species)).map((m) => Data.MONSTERS[m.species].n);
const SECRET_TEXT = '공개 전 골목몬은 다른 사람과의 대전에 데려갈 수 없습니다. 덱에서 빼 주세요.';
const BAN_TEXT = (names) => `${names.join(', ')}${names.length > 1 ? '는' : '는'} 지금 테스트 중이라 쓸 수 없습니다. 덱에서 빼 주세요.`;

// 덱의 칸: 내가 가진 골목몬(uid)과 도구. 한 덱에 같은 종류는 한 마리만.
function validTeam(u, t) {
  if (!Array.isArray(t) || t.length < 1 || t.length > 6) return null;
  const uids = new Set(), species = new Set(), out = [];
  for (const x of t) {
    const m = monOf(u, String(x?.uid ?? ''));
    if (!m || uids.has(m.uid) || species.has(m.species)) return null;
    uids.add(m.uid); species.add(m.species);
    const item = Data.ITEMS[x.item] ? x.item : undefined; // 도구 (없거나 모르는 도구면 빈손)
    out.push({ uid: m.uid, ...(item ? { item } : {}) });
  }
  return out;
}

// 나이: 태어난 해로 셉니다. 19세 이하는 루미나·실비아 의상에 모자이크.
const THIS_YEAR = () => new Date().getFullYear();
const validYear = (y) => Number.isInteger(y) && y >= 1900 && y <= THIS_YEAR();
const ageOf = (u) => (u?.birthYear ? THIS_YEAR() - u.birthYear : null);
const isAdult = (u) => ageOf(u) !== null && ageOf(u) > 19;
const uncensored = (u) => isAdult(u) && !u.settings?.mosaic;

const publicUser = (u) => ({
  dev: isDev(u), owned: u.owned || [], mailNew: (u.mail || []).filter((m) => !m.read || !m.claimed).length, tempPw: !!u.tempPw, birthYear: u.birthYear || null, needAge: !u.birthYear, adult: isAdult(u), uncensored: uncensored(u), settings: { mosaic: !!u.settings?.mosaic },
  name: u.name, avatar: u.avatar, decks: deckView(u), active: u.active, stats: u.stats, style: u.style,
  wins: u.wins, losses: u.losses, draws: u.draws, h2h: u.h2h,
  tutorial: !!u.tutorial, gp: u.gp, tickets: u.tickets, skips: u.skips, stones: u.stones, mons: u.mons,
  premium: P.passState(u).premium, badges: P.claimable(u), scoutReady: !!P.scoutState(u).cands, surveyDone: !!db.surveys?.[keyOf(u.name)], sunfish: !!u.sunfishDone,
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
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
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
      if (raw.length > 5000000) { reject(new Error('too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
  });
}

async function api(req, res, url) {
  const route = `${req.method} ${url.pathname}`;
  if (route === 'GET /api/data') {
    const { BANNED, TYPES, CHART, MOVES, MONSTERS, AVATAR_OPTIONS, COSMETICS, STAT_NAMES } = Data;
    return json(res, 200, { ITEMS: Data.ITEMS, FORMS: Data.FORMS.names, TIERS: Data.TIERS.names, BANNED, TYPES, CHART, MOVES, MONSTERS, AVATAR_OPTIONS, COSMETICS, STAT_NAMES, inviteRequired: !!INVITE_CODE });
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
      if (isDev(u)) { migrate(); save(); }
      createSession(res, req, key);
      return json(res, 200, { user: publicUser(u) });
    }
    if (INVITE_CODE && body.invite !== INVITE_CODE) return json(res, 403, { error: '초대 코드가 맞지 않습니다.' });
    if (!/^[a-zA-Z0-9가-힣_]{2,12}$/.test(name)) return json(res, 400, { error: '아이디는 한글, 영문, 숫자로 2~12자여야 합니다.' });
    if (password.length < 6 || password.length > 100) return json(res, 400, { error: '비밀번호는 6자 이상이어야 합니다.' });
    if (db.users[key]) return json(res, 409, { error: '이미 있는 아이디입니다.' });
    const birthYear = Number(body.birthYear);
    if (!validYear(birthYear)) return json(res, 400, { error: '태어난 해를 정확히 넣어 주세요. (예: 1998)' });
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[key] = {
      ...P.newProgress(),
      name, salt, hash: hashPw(password, salt), avatar: randomAvatar(), createdAt: Date.now(), lastSeen: Date.now(), notes: {}, stats: newStats(), style: defaultStyle(),
      wins: 0, losses: 0, draws: 0, h2h: {}, birthYear, settings: { mosaic: false },
    };
    if (isDev(db.users[key])) { migrate(); save(); }
    createSession(res, req, key);
    return json(res, 200, { user: publicUser(db.users[key]) });
  }

  const auth = userFromReq(req);
  if (!auth) return json(res, 401, { error: '로그인이 필요합니다.' });
  const user = db.users[auth.key];

  if (route === 'GET /api/me') return json(res, 200, { user: publicUser(user) });
  if (route === 'PUT /api/age') {
    if (user.birthYear) return json(res, 400, { error: '나이는 한 번만 설정할 수 있습니다.' });
    const y = Number((await readBody(req)).birthYear);
    if (!validYear(y)) return json(res, 400, { error: '태어난 해를 정확히 넣어 주세요. (예: 1998)' });
    user.birthYear = y; user.settings ||= { mosaic: false }; save();
    return json(res, 200, { user: publicUser(user) });
  }
  // 나이를 아직 안 정한 계정은 나이 설정과 로그아웃 말고는 아무것도 못 합니다.
  if (!user.birthYear && route !== 'POST /api/logout') return json(res, 403, { error: '먼저 나이를 설정해 주세요.', needAge: true });
  if (route === 'GET /api/mail') {
    return json(res, 200, { mail: mailView(user) });
  }
  if (route === 'POST /api/mail/read' || route === 'POST /api/mail/claim') {
    const id = String((await readBody(req)).id ?? '');
    const m = (user.mail || []).find((x) => x.id === id);
    if (!m) return json(res, 404, { error: '없는 우편입니다.' });
    m.read = true;
    let got = [];
    if (route === 'POST /api/mail/claim' && !m.claimed) {
      user.owned ||= [];
      for (const ref of m.reward) if (!user.owned.includes(ref)) user.owned.push(ref);
      m.claimed = true;
      got = m.reward.map(rewardItem).filter(Boolean);
    }
    save();
    return json(res, 200, { mail: mailView(user), user: publicUser(user), got });
  }
  // 비밀번호 바꾸기 (지금 비밀번호 확인)
  if (route === 'PUT /api/password') {
    const b = await readBody(req);
    const old = String(b.old ?? ''), pw = String(b.password ?? '');
    if (!crypto.timingSafeEqual(Buffer.from(hashPw(old, user.salt), 'hex'), Buffer.from(user.hash, 'hex'))) return json(res, 400, { error: '지금 비밀번호가 맞지 않습니다.' });
    if (pw.length < 6 || pw.length > 100) return json(res, 400, { error: '새 비밀번호는 6자 이상이어야 합니다.' });
    user.salt = crypto.randomBytes(16).toString('hex'); user.hash = hashPw(pw, user.salt); delete user.tempPw;
    for (const [h, s] of Object.entries(db.sessions)) if (s.user === auth.key && h !== auth.hashed) delete db.sessions[h]; // 다른 기기는 로그아웃
    save();
    return json(res, 200, { user: publicUser(user) });
  }
  // 개발자: 비밀번호 잊은 친구 계정을 임시 비밀번호로 초기화 (원래 비밀번호는 암호화돼 있어 볼 수 없음)
  if (route === 'POST /api/dev/resetpw') {
    if (!isDev(user)) return json(res, 403, { error: '개발자만 할 수 있어요.' });
    const b = await readBody(req);
    const tk = keyOf(String(b.name ?? '')), t = db.users[tk];
    if (!t) return json(res, 404, { error: '없는 계정이에요.' });
    if (isDev(t)) return json(res, 400, { error: '개발자 계정은 여기서 초기화할 수 없어요.' });
    const ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
    const temp = Array.from({ length: 8 }, () => ABC[crypto.randomInt(ABC.length)]).join('');
    t.salt = crypto.randomBytes(16).toString('hex'); t.hash = hashPw(temp, t.salt); t.tempPw = true;
    for (const [h, s] of Object.entries(db.sessions)) if (s.user === tk) delete db.sessions[h];
    save();
    return json(res, 200, { name: t.name, temp });
  }
  if (route === 'PUT /api/settings') {
    const b = await readBody(req);
    user.settings = { ...(user.settings || {}), mosaic: !!b.mosaic };
    save();
    return json(res, 200, { user: publicUser(user) });
  }
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
  if (route === 'GET /api/players') {
    const notes = user.notes || {};
    const players = Object.entries(db.users).map(([k, u]) => ({
      key: k, name: u.name, avatar: u.avatar, style: u.style, wins: u.wins, losses: u.losses, draws: u.draws, mons: new Set((u.mons || []).map((m) => m.species)).size,
      online: online.has(k), busy: inBattle.has(k), createdAt: u.createdAt || null, lastSeen: online.has(k) ? Date.now() : u.lastSeen || null,
      note: notes[k] || '', me: k === auth.key, premium: (u.premiumSeasons || []).includes(P.seasonOf()),
    })).sort((a, b) => b.online - a.online || (b.lastSeen || 0) - (a.lastSeen || 0));
    return json(res, 200, { players });
  }
  if (route === 'PUT /api/notes') {
    const body = await readBody(req);
    const key = String(body.key ?? '');
    const text = String(body.text ?? '').trim();
    if (!db.users[key]) return json(res, 404, { error: '없는 플레이어입니다.' });
    if ([...text].length > 100) return json(res, 400, { error: '메모는 100자까지입니다.' });
    user.notes ||= {};
    if (text) user.notes[key] = text; else delete user.notes[key];
    save();
    return json(res, 200, { ok: true });
  }
  if (route === 'PUT /api/style') {
    const st = validStyle(user, await readBody(req));
    if (!st) return json(res, 400, { error: '아직 얻지 못한 칭호, 카드, 핀이 있습니다. 핀은 3개까지입니다.' });
    user.style = st; save(); broadcastLobby();
    return json(res, 200, { user: publicUser(user) });
  }
  if (route === 'PUT /api/decks') {
    const body = await readBody(req);
    const decks = validDecks(user, body.decks);
    if (!decks) return json(res, 400, { error: '덱은 1~20개, 이름은 12자 이내, 골목몬은 내가 가진 서로 다른 종류 1~6마리여야 합니다.' });
    const sp = (d) => d.team.map((t) => monOf(user, t.uid)).filter(Boolean);
    const banned = bannedIn(user, decks.flatMap(sp)).filter((n, i, a) => a.indexOf(n) === i);
    if (banned.length) {
      // 예전에 넣어 둔 덱은 그대로 둘 수 있게, 새로 넣은 경우만 막습니다.
      const had = new Set(bannedIn(user, (user.decks || []).flatMap(sp)));
      const added = banned.filter((n) => !had.has(n));
      if (added.length) return json(res, 400, { error: BAN_TEXT(added) });
    }
    const active = Number.isInteger(body.active) && body.active >= 0 && body.active < decks.length ? body.active : 0;
    user.decks = decks; user.active = active; save();
    return json(res, 200, { user: publicUser(user) });
  }
  if (route.endsWith(' /api/contest') || route.startsWith('POST /api/contest/')) return contestApi(req, res, route, auth, user);
  return progressApi(req, res, route, auth, user);
}

/* ---------- 새 게임: 튜토리얼, 스카우트, 보상, 패스, 설문, 미니게임 ---------- */
async function progressApi(req, res, route, auth, user) {
  const done = (r, extra = {}) => {
    if (r?.error) return json(res, 400, { error: r.error });
    save();
    send(online.get(auth.key), { t: 'me', user: publicUser(user) });
    return json(res, 200, { ...r, ...extra, user: publicUser(user) });
  };
  const body = route.startsWith('GET ') ? {} : await readBody(req);
  if (route === 'GET /api/starters') return json(res, 200, { starters: P.STARTERS, reward: P.TUTORIAL_REWARD });
  if (route === 'POST /api/tutorial') return done(P.finishTutorial(user, Number(body.starter)));
  if (!user.tutorial) return json(res, 403, { error: '튜토리얼을 먼저 끝내 주세요.', needTutorial: true });
  if (route === 'GET /api/scout') return json(res, 200, { scout: P.scoutState(user), user: publicUser(user) });
  if (route === 'POST /api/scout/skip') return done(P.scoutSkip(user), { scout: P.scoutState(user) });
  if (route === 'POST /api/scout/pick') { const r = P.scoutPick(user, String(body.species ?? ''), body.pay === 'ticket' ? 'ticket' : 'gp'); return done(r, { scout: P.scoutState(user) }); }
  if (route === 'POST /api/mon/move') return done(P.changeMove(user, String(body.uid ?? ''), Number(body.slot), String(body.move ?? '')));
  if (route === 'POST /api/stone/buy') return done(P.buyStone(user, String(body.species ?? '')));
  // 상점 꾸미기 (칭호·전투카드·핀): ref = 'titles:id' 같은 꼴
  if (route === 'POST /api/shop/cosmetic') {
    const ref = String(body.ref ?? ''), [kind, id] = ref.split(':');
    const item = (Data.COSMETICS[kind] || []).find((x) => x.id === id);
    if (!item || item.cond?.[0] !== 'shop') return json(res, 400, { error: '상점에 없는 물건이에요.' });
    if (owns(user, ref)) return json(res, 400, { error: '이미 가지고 있어요.' });
    const price = item.cond[1];
    if (user.gp < price) return json(res, 400, { error: `GP가 ${(price - user.gp).toLocaleString('ko-KR')} 모자라요.` });
    user.gp -= price; (user.owned ||= []).push(ref);
    return done({ ok: true });
  }
  if (route === 'GET /api/rewards') return json(res, 200, rewardsView(user));
  if (route === 'POST /api/attend') return done(P.attend(user), rewardsView(user));
  if (route === 'POST /api/quest/claim') return done(P.claimQuest(user, String(body.id ?? '')), rewardsView(user));
  if (route === 'POST /api/ach/claim') return done(P.claimAch(user, String(body.id ?? '')), rewardsView(user));
  if (route === 'POST /api/pass/claim') return done(P.claimPass(user, Number(body.lv), body.track === 'prem' ? 'prem' : 'free'), rewardsView(user));
  if (route === 'POST /api/dev/premium') {
    if (!isDev(user)) return json(res, 403, { error: '개발자만 줄 수 있어요.' });
    const t = db.users[keyOf(String(body.name ?? ''))];
    if (!t) return json(res, 404, { error: '없는 플레이어예요.' });
    const s = P.seasonOf();
    t.premiumSeasons ||= [];
    const on = !t.premiumSeasons.includes(s);
    if (on) { t.premiumSeasons.push(s); sendMail(t, { from: '골목대전 운영팀', title: `시즌 ${s} 프리미엄 패스 도착!`, body: '운영팀이 보내는 선물이에요. 이번 시즌 패스의 프리미엄 보상을 모두 받을 수 있어요!' }); notices.set(keyOf(t.name), `시즌 ${s} 프리미엄 패스가 생겼어요!`); }
    else t.premiumSeasons = t.premiumSeasons.filter((x) => x !== s);
    P.passBook(t); save();
    send(online.get(keyOf(t.name)), { t: 'me', user: publicUser(t) });
    return json(res, 200, { name: t.name, premium: on });
  }
  if (route === 'GET /api/survey') {
    const mine = db.surveys?.[auth.key] || null;
    return json(res, 200, { mine, all: isDev(user) ? Object.values(db.surveys || {}) : undefined });
  }
  if (route === 'POST /api/survey') {
    const pickList = (v, allowed) => (Array.isArray(v) ? v.filter((x) => allowed.includes(x)) : []).filter((x, i, a) => a.indexOf(x) === i);
    const rate = Math.round(Number(body.rate));
    if (!(rate >= 1 && rate <= 5)) return json(res, 400, { error: '만족도를 골라 주세요.' });
    const first = !db.surveys?.[auth.key];
    (db.surveys ||= {})[auth.key] = {
      user: user.name, at: Date.now(), rate,
      fun: pickList(body.fun, SURVEY.fun), want: pickList(body.want, SURVEY.want),
      wantEtc: cut(body.wantEtc, 200), bad: cut(body.bad, 500), say: cut(body.say, 500),
    };
    const got = first ? P.grant(user, { gp: 1000 }) : [];
    return done({ got });
  }
  if (route === 'POST /api/sunfish/start') { user.sunfishRun = Date.now(); save(); return json(res, 200, { ok: true }); }
  if (route === 'POST /api/sunfish/clear') {
    const size = Number(body.size);
    if (!user.sunfishRun || Date.now() - user.sunfishRun < 6000 || !(size >= SUNFISH_GOAL)) return json(res, 400, { error: '기록을 확인할 수 없어요. 다시 해 주세요.' });
    user.sunfishRun = 0;
    user.sunfishBest = Math.max(user.sunfishBest || 0, Math.min(999, size));
    if (user.sunfishDone) return done({ got: [], again: true });
    user.sunfishDone = true;
    return done({ got: P.grant(user, { mon: 'deungsin' }) });
  }
  return json(res, 404, { error: '없는 경로입니다.' });
}

const rewardsView = (u) => ({ attend: P.attendState(u), quests: P.questState(u), ach: P.achState(u), pass: P.passState(u), badges: P.claimable(u) });
const SURVEY = { fun: ['대전', '골목몬 디자인', '꾸미기', '스카우트', '이벤트', '훈련장', '태그전', '도감'], want: ['랭킹전', '골목몬 교환', '길드·친구', '스토리 모드', '새 골목몬', '미니게임', '채팅', '레이드(협동 보스전)'] };
const SUNFISH_GOAL = 300; // 개복치 키우기: 300cm까지 키우면 등신

/* ---------- 신캐 만들기 공모전 ---------- */
const CONTEST = { title: '신캐 만들기 공모전', ends: Date.parse(process.env.CONTEST_ENDS || '2026-11-13T23:59:59+09:00') };
const PER_USER = 3, MAX_ENTRIES = 200, MAX_IMAGE = 400000;
const cut = (v, n) => [...String(v ?? '').trim()].slice(0, n).join('');
const entryView = (e, full) => ({ id: e.id, user: e.user, at: e.at, editedAt: e.editedAt, name: e.name, types: e.types, desc: e.desc, base: e.base, trait: e.trait, mega: e.mega, z: e.z, moves: e.moves, image: full ? e.image : undefined, hasImage: !!e.image, winner: !!e.winner });
const CT_STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const okType = (t) => (Data.TYPES[t] && t !== 'none' ? t : '');
const intIn = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : 0; };
const statsIn = (o, hi) => Object.fromEntries(CT_STATS.map((k) => [k, intIn(o?.[k], 0, hi)]));
const imageIn = (v) => (typeof v === 'string' && v ? v : '');
const badImage = (v) => v && (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v) || v.length > MAX_IMAGE);
async function contestApi(req, res, route, auth, user) {
  const dev = isDev(user), closed = Date.now() > CONTEST.ends;
  const mine = (e) => e.key === auth.key;
  const view = () => {
    const w = contest.entries.find((e) => e.winner);
    return {
      info: { ...CONTEST, closed, count: contest.entries.length, perUser: PER_USER },
      mine: contest.entries.filter(mine).map((e) => entryView(e, true)),
      all: dev ? contest.entries.map((e) => entryView(e, true)) : undefined,
      winner: w ? { name: w.name, user: w.user } : null, dev,
    };
  };
  if (route === 'GET /api/contest') return json(res, 200, view());
  const body = await readBody(req);
  if (route === 'POST /api/contest') {
    if (closed) return json(res, 403, { error: '공모전 접수가 마감되었습니다.' });
    const old = body.id ? contest.entries.find((x) => x.id === String(body.id)) : null; // 수정
    if (body.id && !(old && mine(old))) return json(res, 403, { error: '내 출품작만 고칠 수 있어요.' });
    if (!old && contest.entries.filter(mine).length >= PER_USER) return json(res, 400, { error: `한 사람당 ${PER_USER}개까지 낼 수 있어요. 기존 작품을 지우고 다시 내 주세요.` });
    if (!old && contest.entries.length >= MAX_ENTRIES) return json(res, 400, { error: '출품작이 너무 많아 더 받을 수 없습니다.' });
    const name = cut(body.name, 12), desc = cut(body.desc, 1000);
    if (!name) return json(res, 400, { error: '골목몬 이름을 넣어 주세요.' });
    if (!desc) return json(res, 400, { error: '골목몬 설명을 넣어 주세요.' });
    const types = (Array.isArray(body.types) ? body.types : []).filter((t) => Data.TYPES[t] && t !== 'none').filter((t, i, a) => a.indexOf(t) === i).slice(0, 2);
    const image = imageIn(body.image), m = body.mega || {}, mimage = imageIn(m.image);
    if (badImage(image) || badImage(mimage)) return json(res, 400, { error: '그림이 너무 크거나 형식이 맞지 않아요.' });
    const z = body.z || {};
    const moves = (Array.isArray(body.moves) ? body.moves : []).slice(0, 10).map((x) => ({
      n: cut(x?.n, 16), type: okType(x?.type), cat: ['p', 's', 'x'].includes(x?.cat) ? x.cat : 'p',
      pow: intIn(x?.pow, 0, 300), acc: intIn(x?.acc, 0, 100), pp: intIn(x?.pp, 0, 40), d: cut(x?.d, 120), sig: !!x?.sig,
    })).filter((x) => x.n);
    const fields = {
      name, types, desc, image,
      base: statsIn(body.base, 255),
      trait: typeof body.trait === 'string' ? { n: '', d: cut(body.trait, 300) } : { n: cut(body.trait?.n, 12), d: cut(body.trait?.d, 300) },
      mega: { n: cut(m.n, 16), d: cut(m.d, 400), boost: statsIn(m.boost, 100), image: mimage },
      z: { n: cut(z.n, 16), type: okType(z.type), cat: z.cat === 's' ? 's' : 'p', pow: intIn(z.pow, 0, 400), d: cut(z.d, 160) },
      moves,
    };
    if (old) Object.assign(old, fields, { editedAt: Date.now() });
    else contest.entries.push({ id: crypto.randomBytes(6).toString('hex'), key: auth.key, user: user.name, at: Date.now(), ...fields });
    saveContest();
    return json(res, 200, view());
  }
  const e = contest.entries.find((x) => x.id === String(body.id ?? ''));
  if (!e) return json(res, 404, { error: '없는 출품작입니다.' });
  if (route === 'POST /api/contest/delete') {
    if (!dev && !(mine(e) && !closed)) return json(res, 403, { error: '지울 수 없는 출품작입니다.' });
    contest.entries = contest.entries.filter((x) => x !== e);
    saveContest();
    return json(res, 200, view());
  }
  if (route === 'POST /api/contest/winner') {
    if (!dev) return json(res, 403, { error: '개발자만 뽑을 수 있습니다.' });
    const on = !e.winner;
    for (const x of contest.entries) x.winner = false;
    e.winner = on;
    saveContest();
    return json(res, 200, view());
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
  // 루미나·실비아 원본 그림은 성인(모자이크 끔) 계정에만 보냅니다. 나머지는 모자이크 그림.
  let serve = file;
  if (/^img\/mon\/(lumina|silvia)/.test(rel)) {
    const a = userFromReq(req);
    // 공개 전: 개발자 계정만 그림을 받음
    if (!(a && isDev(db.users[a.key]))) { res.writeHead(404); return res.end('Not found'); }
  }
  if (/^img\/mon\/(lumina|silvia)(-s\d|-mega)?\.webp$/.test(rel)) {
    const a = userFromReq(req);
    if (!(a && uncensored(db.users[a.key]))) serve = file.replace(/\.webp$/, '-m.webp');
    res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('Vary', 'Cookie');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(serve)] || 'application/octet-stream', ...(res.getHeader('Cache-Control') ? {} : { 'Cache-Control': 'no-cache' }) });
  fs.createReadStream(serve).pipe(res);
});

/* ---------- 실시간 ---------- */
const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
const online = new Map();   // 유저 키 → 소켓
const battles = new Map();  // 대전 id → room
const inBattle = new Map(); // 유저 키 → room
const challenges = new Map(); // 신청자 키 → { to, size }
const notices = new Map();    // 다음 접속 때 알려 줄 말
const tagRooms = new Map();   // 태그 방 id → { id, host, level, slots }
const spectating = new Map(); // 유저 키 → 관전 중인 room

const send = (ws, msg) => { if (ws?.readyState === 1) ws.send(JSON.stringify(msg)); };
const toast = (key, text) => send(online.get(key), { t: 'toast', text });

function broadcastLobby() {
  const players = [...online.keys()].map((k) => {
    const u = db.users[k];
    return { key: k, name: u.name, avatar: u.avatar, style: u.style, wins: u.wins, losses: u.losses, busy: inBattle.has(k) };
  });
  const tags = [...tagRooms.values()].map((r) => ({
    id: r.id, host: r.host, level: r.level,
    slots: r.slots.map((k) => (k ? { key: k, name: db.users[k].name, avatar: db.users[k].avatar } : null)),
  }));
  const live = [...battles.values()].filter((r) => !r.ended).map((r) => ({
    id: r.id, tag: r.tag, practice: isPractice(r), training: !!r.training, watchers: r.spectators.size,
    names: r.b.sides.map((x) => x.name),
  }));
  for (const [k, ws] of online) {
    const incoming = [...challenges].filter(([, c]) => c.to === k).map(([from, c]) => ({ from, name: db.users[from].name, size: c.size }));
    send(ws, { t: 'lobby', players, incoming, outgoing: challenges.get(k) || null, tags, live });
  }
}

const tagOf = (key) => [...tagRooms.values()].find((r) => r.slots.includes(key));
function removeFromTag(key) {
  const r = tagOf(key);
  if (!r) return;
  r.slots[r.slots.indexOf(key)] = null;
  const humans = r.slots.filter(Boolean);
  if (!humans.length) tagRooms.delete(r.id);
  else if (r.host === key) [r.host] = humans;
}

function clearChallenges(key) {
  challenges.delete(key);
  for (const [from, c] of challenges) if (c.to === key) challenges.delete(from);
}

const BOT = 'bot';
const isPractice = (room) => !room.tag && room.keys.includes(BOT);
const BOT_LEVELS = ['쉬움', '보통', '어려움', '지옥'];

// 훈련장: 더미와 1대1. 시간 제한, 승패, 기록 없음. 더미에게 준 피해만 쌓입니다.
function startTraining(key) {
  const u = db.users[key];
  const room = { id: crypto.randomUUID(), keys: [key, BOT], b: E.createTraining({ name: u.name, avatar: u.avatar, style: u.style, deck: '모든 골목몬' }, undefined, bannedFor(u)), deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: 0, tag: false, training: true, counted: 0, spectators: new Set() };
  battles.set(room.id, room);
  inBattle.set(key, room); clearChallenges(key); removeFromTag(key); stopWatching(key);
  syncBattle(room, 0);
  broadcastLobby();
}

// 더미 피해를 계정 기록에 더하고, 새로 열린 꾸미기를 알려 줍니다.
function countTraining(room) {
  const key = room.keys[0], u = db.users[key], d = room.b.dummy;
  const before = unlockedIds(u);
  u.stats.dummyDmg += d.total - room.counted;
  room.counted = d.total;
  u.stats.dummyBest = Math.max(u.stats.dummyBest, d.best);
  const fresh = unlockedIds(u).filter((x) => !before.includes(x));
  save();
  send(online.get(key), { t: 'me', user: publicUser(u) });
  if (fresh.length) toast(key, `새로 열림: ${fresh.map((x) => x.split(':')[1]).join(', ')}`);
}
const KIND_NAME = { titles: '칭호', cards: '전투카드', pins: '핀' };
const unlockedIds = (u) => Object.entries(Data.COSMETICS).flatMap(([kind, list]) => list.filter((x) => x.cond && isUnlocked(u, x)).map((x) => `${kind}:${KIND_NAME[kind]} ${x.n}`));

function startBattle(keys, size, level = 1, tag = false) {
  const foeDeck = (i) => {
    const mine = tag ? (i < 2 ? 0 : 1) : i;
    const human = keys.find((k, j) => k !== BOT && (tag ? (j < 2 ? 0 : 1) : j) !== mine) ?? keys.find((k) => k !== BOT);
    return battleTeam(db.users[human]).slice(0, size);
  };
  const players = keys.map((k, i) => (k === BOT
    ? { name: `골목대장(${BOT_LEVELS[level]})`, avatar: randomAvatar(true), style: randomStyle(), deck: `${BOT_LEVELS[level]} 덱`, team: E.botTeam(level, size, foeDeck(i)) }
    : { name: db.users[k].name, avatar: db.users[k].avatar, style: db.users[k].style, deck: deckOf(db.users[k]).name, team: battleTeam(db.users[k]).slice(0, size), stones: db.users[k].stones }));
  const room = { id: crypto.randomUUID(), keys, b: E.createBattle(players, undefined, { preview: true }), deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: level, tag, spectators: new Set() };
  battles.set(room.id, room);
  keys.forEach((k) => { if (k !== BOT) { inBattle.set(k, room); clearChallenges(k); removeFromTag(k); stopWatching(k); } });
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
    oppOnline: room.keys.every((x) => x === BOT || online.has(x)),
    practice: isPractice(room), tag: room.tag, training: !!room.training,
  });
}

const watchView = (room) => ({ ...E.viewFor(room.b, 0), mustAct: false, canMega: false, spectator: true });
function stopWatching(key) {
  const room = spectating.get(key);
  if (!room) return;
  room.spectators.delete(key);
  spectating.delete(key);
}

function armTimer(room) {
  clearTimeout(room.timer);
  if (room.b.phase === 'over' || isPractice(room)) { room.deadline = 0; return; }
  room.deadline = Date.now() + TURN_SECONDS * 1000;
  room.timer = setTimeout(() => onTimeout(room), TURN_SECONDS * 1000 + 300);
}

function onTimeout(room) {
  if (room.ended) return;
  if (!room.keys.some((k) => online.has(k))) return dissolve(room); // 둘 다 나갔으면 무효
  // 시간 안에 못 고른 쪽은 자동으로 행동합니다.
  for (const s of room.keys.keys()) {
    if (room.keys[s] !== BOT && room.b.phase !== 'over' && room.b.needs[s] && !room.b.pending[s]) {
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
  for (const k of room.spectators) {
    spectating.delete(k);
    if (room.b.phase !== 'over') send(online.get(k), { t: 'kicked', text: '대전이 끝났습니다.' });
  }
  battles.delete(room.id);
  broadcastLobby();
}

// 대전 중 나간 사람은 패배, 상대는 승리. 새로고침과 잠깐의 끊김은 유예 시간 안에 돌아오면 이어집니다.
function onLeaveTimeout(room, key) {
  if (room.ended || online.has(key)) return;
  const s = room.keys.indexOf(key);
  if (!room.tag && !online.has(room.keys[1 - s])) return dissolve(room); // 둘 다 나갔으면 무효
  if (room.tag) return seatToBot(room, key, '대전을 나가서 골목대장이 자리를 맡았습니다.');
  notices.set(key, '대전을 나가서 패배 처리되었습니다.');
  afterTurn(room, E.forfeit(room.b, s, true));
}

// 태그에서 나가면 그 자리는 봇이 이어서 싸웁니다.
function seatToBot(room, key, text) {
  const s = room.keys.indexOf(key);
  room.keys[s] = BOT;
  inBattle.delete(key);
  if (online.has(key)) send(online.get(key), { t: 'kicked', text });
  else notices.set(key, text);
  if (room.keys.every((k) => k === BOT)) return dissolve(room);
  room.keys.forEach((k) => { if (k !== BOT) toast(k, `${room.b.sides[s].name}님 자리를 골목대장이 맡습니다.`); });
  pumpBot(room);
  broadcastLobby();
}

function apply(room, s, action) {
  const r = E.choose(room.b, s, action);
  if (!r.ok) { toast(room.keys[s], '지금은 할 수 없는 행동입니다.'); return; }
  if (!r.events) {
    send(online.get(room.keys[s]), { t: 'chosen', view: E.viewFor(room.b, s) });
    if (!room.tag && room.keys[1 - s] !== BOT) send(online.get(room.keys[1 - s]), { t: 'opp_ready' });
    pumpBot(room);
    return;
  }
  afterTurn(room, r.events);
}

function pumpBot(room) {
  const { b } = room;
  if (room.ended || b.phase === 'over') return;
  // 기술 고르기는 사람이 다 고른 뒤에 움직입니다. 사람의 선택을 보지는 않습니다.
  const humansReady = room.keys.every((k, i) => k === BOT || !b.needs[i] || b.pending[i]);
  for (const s of room.keys.keys()) {
    if (room.keys[s] !== BOT || !b.needs[s] || b.pending[s]) continue;
    if (b.phase === 'choose' && !humansReady) continue;
    apply(room, s, E.botAction(b, s, room.botLevel));
    return; // 나머지는 apply 뒤 다시 불립니다.
  }
}

function afterTurn(room, events) {
  armTimer(room);
  if (room.training) countTraining(room);
  room.keys.forEach((k, s) => {
    if (k === BOT) return;
    send(online.get(k), { t: 'turn', events, view: E.viewFor(room.b, s), remain: remaining(room) });
  });
  for (const k of room.spectators) send(online.get(k), { t: 'turn', events, view: watchView(room), remain: remaining(room) });
  if (room.b.phase === 'over') return finish(room);
  pumpBot(room);
}

function finish(room) {
  const { winner } = room.b;
  const pvp = !room.tag && !room.keys.includes(BOT);
  const humans = room.keys.map((k, s) => [k, s]).filter(([k]) => k !== BOT);
  for (const [k, s] of humans) {
    const st = db.users[k].stats;
    if (room.b.sides[s].megaUsed) st.megas++;
    if (room.b.sides[s].zUsed) st.zmoves++;
    const won = winner !== null && E.teamOf(room.b, s) === winner;
    // ez: 기권승이 아니고, 내 골목몬이 한 마리도 쓰러지지 않은 승리
    if (won && !room.b.forfeited && room.b.sides[s].mons.every((m) => m.hp > 0)) st.flawless++;
    if (room.tag) { st.tagGames++; if (won) st.tagWins++; }
    else if (!pvp && won) { st[`p${room.botLevel}`]++; st.botWins++; }
    const pts = P.afterBattle(db.users[k], room.tag ? 'tag' : pvp ? 'pvp' : 'practice', won, room.b.sides[s]);
    if (pts) { if (online.has(k)) toast(k, `시즌 패스 포인트 +${pts}`); else notices.set(k, [notices.get(k), `시즌 패스 포인트 +${pts}`].filter(Boolean).join(' · ')); }
  }
  if (pvp) {
    const [a, b] = room.keys.map((k) => db.users[k]);
    const h = (u, o, f) => { (u.h2h[o.name] ||= { w: 0, l: 0, d: 0 })[f]++; };
    a.stats.games++; b.stats.games++;
    if (winner === null) { a.draws++; b.draws++; h(a, b, 'd'); h(b, a, 'd'); }
    else {
      const [w, l] = winner === 0 ? [a, b] : [b, a];
      w.wins++; l.losses++; h(w, l, 'w'); h(l, w, 'l');
      w.stats.streak++; w.stats.streakBest = Math.max(w.stats.streakBest, w.stats.streak);
      l.stats.streak = 0;
    }
  }
  save();
  humans.forEach(([k]) => send(online.get(k), { t: 'me', user: publicUser(db.users[k]) }));
  dissolve(room);
}

function onMessage(key, msg) {
  if (!db.users[key].birthYear) return send(online.get(key), { t: 'need_age' });
  if (!db.users[key].tutorial && ['practice', 'challenge', 'accept', 'tag_create', 'tag_seat', 'tag_start', 'training'].includes(msg?.t)) return toast(key, '튜토리얼을 먼저 끝내 주세요.');
  const room = inBattle.get(key);
  switch (msg?.t) {
    case 'action': {
      if (!room) return;
      apply(room, room.keys.indexOf(key), msg.action);
      break;
    }
    case 'forfeit': {
      if (!room) return;
      if (room.training) { dissolve(room); send(online.get(key), { t: 'kicked', text: '훈련장에서 나왔습니다.' }); break; }
      if (room.tag) return seatToBot(room, key, '대전에서 나왔습니다. 골목대장이 자리를 맡았습니다.');
      const events = E.forfeit(room.b, room.keys.indexOf(key));
      afterTurn(room, events);
      break;
    }
    case 'spectate': {
      const target = battles.get(String(msg.id ?? ''));
      if (room || !target || target.ended) return toast(key, '지금은 관전할 수 없습니다.');
      if (!isDev(db.users[key]) && target.b.sides.some((sd) => sd.mons.some((m) => Data.BANNED.includes(m.species)))) return toast(key, '공개 전 골목몬이 나오는 대전이라 관전할 수 없습니다.');
      stopWatching(key);
      target.spectators.add(key);
      spectating.set(key, target);
      send(online.get(key), { t: 'battle', view: watchView(target), remain: remaining(target), oppOnline: true, practice: isPractice(target), tag: target.tag, spectator: true });
      broadcastLobby();
      break;
    }
    case 'unspectate': stopWatching(key); broadcastLobby(); break;
    case 'tag_create': {
      if (room || tagOf(key)) return;
      const id = crypto.randomUUID();
      tagRooms.set(id, { id, host: key, level: 1, slots: [key, null, null, null] });
      broadcastLobby();
      break;
    }
    case 'tag_seat': {
      const r = tagRooms.get(String(msg.id ?? ''));
      if (room || !r || !Number.isInteger(msg.seat) || msg.seat < 0 || msg.seat > 3 || r.slots[msg.seat]) return;
      removeFromTag(key);
      if (!tagRooms.has(r.id)) tagRooms.set(r.id, r);
      r.slots[msg.seat] = key;
      if (!r.host || !r.slots.includes(r.host)) r.host = key;
      broadcastLobby();
      break;
    }
    case 'tag_leave': removeFromTag(key); broadcastLobby(); break;
    case 'tag_level': {
      const r = tagOf(key);
      if (r?.host === key && [0, 1, 2, 3].includes(msg.level)) { r.level = msg.level; broadcastLobby(); }
      break;
    }
    case 'tag_start': {
      const r = tagOf(key);
      if (r?.host !== key) return;
      const humans = r.slots.filter(Boolean);
      if (humans.some((k) => inBattle.has(k) || !online.has(k))) return toast(key, '참가자 중 대전 중인 사람이 있습니다.');
      const short = humans.find((k) => battleTeam(db.users[k]).length < 3);
      if (short) return toast(key, `${db.users[short].name}님의 덱에 골목몬이 3마리 있어야 합니다.`);
      const bk = humans.find((k) => secretIn(battleTeam(db.users[k]).slice(0, 3)).length);
      if (bk) return toast(key, `${db.users[bk].name}님의 덱에 공개 전 골목몬이 있습니다.`);
      tagRooms.delete(r.id);
      startBattle(r.slots.map((k) => k || BOT), 3, r.level, true);
      break;
    }
    case 'training': {
      if (room) return;
      startTraining(key);
      break;
    }
    case 'practice': {
      if (room) return;
      const size = [1, 3, 6].includes(msg.size) ? msg.size : 3;
      if (battleTeam(db.users[key]).length < size) return toast(key, `선택한 덱에 골목몬이 ${size}마리 있어야 합니다.`);
      { const bn = bannedIn(db.users[key], battleTeam(db.users[key]).slice(0, size)); if (bn.length) return toast(key, BAN_TEXT(bn)); }
      startBattle([key, BOT], size, [0, 1, 2, 3].includes(msg.level) ? msg.level : 1);
      break;
    }
    case 'challenge': {
      const to = keyOf(String(msg.to ?? ''));
      const size = [1, 3, 6].includes(msg.size) ? msg.size : 3;
      if (room || to === key || !online.has(to)) return toast(key, '지금은 신청할 수 없습니다.');
      if (inBattle.has(to)) return toast(key, '상대가 대전 중입니다.');
      if (battleTeam(db.users[key]).length < size) return toast(key, `선택한 덱에 골목몬이 ${size}마리 있어야 합니다.`);
      { const bn = bannedIn(db.users[key], battleTeam(db.users[key]).slice(0, size)); if (bn.length) return toast(key, BAN_TEXT(bn)); }
      if (secretIn(battleTeam(db.users[key]).slice(0, size)).length) return toast(key, SECRET_TEXT);
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
      if (battleTeam(db.users[key]).length < c.size) return toast(key, `선택한 덱에 골목몬이 ${c.size}마리 있어야 합니다.`);
      if (battleTeam(db.users[from]).length < c.size) return toast(key, '상대의 덱 인원이 모자랍니다.');
      { const bn = bannedIn(db.users[key], battleTeam(db.users[key]).slice(0, c.size)); if (bn.length) return toast(key, BAN_TEXT(bn)); }
      if (secretIn(battleTeam(db.users[key]).slice(0, c.size)).length) return toast(key, SECRET_TEXT);
      if (bannedIn(db.users[from], battleTeam(db.users[from]).slice(0, c.size)).length || secretIn(battleTeam(db.users[from]).slice(0, c.size)).length) return toast(key, '상대 덱에 공개 전 골목몬이 있어 시작할 수 없습니다.');
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
    db.users[key].lastSeen = Date.now(); save();
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
      db.users[key].lastSeen = Date.now(); save();
      challenges.delete(key);
      removeFromTag(key);
      stopWatching(key);
      const room = inBattle.get(key);
      if (room) {
        if (isPractice(room)) room.idle = setTimeout(() => { if (!online.has(key)) dissolve(room); }, 10 * 60000);
        else {
          const name = db.users[key].name;
          room.keys.forEach((k) => { if (k !== key && k !== BOT) send(online.get(k), { t: 'opp_conn', online: false, grace: LEAVE_GRACE_SECONDS, name, tag: room.tag }); });
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
      room.keys.forEach((k) => { if (k !== key && k !== BOT) send(online.get(k), { t: 'opp_conn', online: true, name: db.users[key].name }); });
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
  loadLocal();
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
