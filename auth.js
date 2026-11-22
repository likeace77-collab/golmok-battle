// 계정 / 로그인 / 저장
// - 비밀번호는 scrypt 해시로만 저장
// - 로그인하면 세션 토큰을 주고, 클라이언트는 localStorage에 보관 → API·소켓에 같이 보냄
// - 저장: GIST_ID + GIST_TOKEN 환경변수가 있으면 비밀 Gist(파일: GIST_FILE)에, 없으면 data/db.json
//   (Render 무료 서버는 재시작하면 디스크가 지워지므로 Gist 설정 권장)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const GIST_ID = process.env.GIST_ID || '';
const GIST_TOKEN = process.env.GIST_TOKEN || '';
const GIST_FILE = process.env.GIST_FILE || 'jungbo-brawl.json';   // 골목대전과 같은 Gist를 써도 파일이 달라서 안 섞임 (게임 이름이 호수중 브롤로 바뀌어도 저장 파일 이름은 그대로 — 바꾸면 계정이 사라짐)
const SESSION_DAYS = 60;

let db = { users: {}, sessions: {} };
let dirty = false, busy = false, ready = false;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashPw = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');
const gistHeaders = { Authorization: `Bearer ${GIST_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'User-Agent': 'jungbo-brawl' };

async function load() {
  try {
    if (GIST_ID && GIST_TOKEN) {
      const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { headers: gistHeaders });
      if (!r.ok) throw new Error('Gist 읽기 실패 ' + r.status);
      const f = (await r.json()).files[GIST_FILE];
      if (f) db = JSON.parse(f.truncated ? await (await fetch(f.raw_url, { headers: gistHeaders })).text() : f.content);
      console.log(`[계정] Gist에서 불러옴: 유저 ${Object.keys(db.users).length}명`);
    } else if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      console.log(`[계정] 파일에서 불러옴: 유저 ${Object.keys(db.users).length}명 (Gist 미설정 — 서버 재시작 시 지워질 수 있음)`);
    } else console.log('[계정] 새 DB 시작 (Gist 미설정)');
  } catch (e) { console.error('[계정] 불러오기 실패:', e.message); }
  db.users ||= {}; db.sessions ||= {};
  ready = true;
}
const save = () => { dirty = true; };
async function flush() {
  if (!dirty || busy || !ready) return;
  busy = true; dirty = false;
  const body = JSON.stringify(db);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, body);
    if (GIST_ID && GIST_TOKEN) {
      const r = await fetch(`https://api.github.com/gists/${GIST_ID}`, { method: 'PATCH', headers: gistHeaders, body: JSON.stringify({ files: { [GIST_FILE]: { content: body } } }) });
      if (!r.ok) throw new Error('Gist 저장 실패 ' + r.status);
    }
  } catch (e) { console.error('[계정] 저장 실패:', e.message); dirty = true; }
  busy = false;
}
setInterval(flush, 5000);
process.on('SIGTERM', async () => { await flush(); process.exit(0); });

// ── 세션 ──
function newSession(key) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[sha(token)] = { user: key, exp: Date.now() + SESSION_DAYS * 864e5 };
  save();
  return token;
}
function userFromToken(token) {
  if (!token || typeof token !== 'string') return null;
  const s = db.sessions[sha(token)];
  if (!s) return null;
  if (s.exp < Date.now()) { delete db.sessions[sha(token)]; save(); return null; }
  const u = db.users[s.user];
  return u ? { key: s.user, u } : null;
}
const publicUser = (u) => (fixBt(u), { name: u.name, trophies: u.trophies, best: Math.max(u.best || 0, u.trophies || 0), bt: u.bt, stats: u.stats, prefs: u.prefs || {} });

// ── 트로피 (서버가 직접 지급) ──
// 브롤러별 트로피(bt). 총 트로피 = 예전 트로피(legacy) + 브롤러별 합
function fixBt(u) {
  if (!u.bt) { u.bt = {}; u.legacy = u.trophies || 0; }
  return u;
}
const totalOf = (u) => (u.legacy || 0) + Object.values(u.bt || {}).reduce((a, v) => a + v, 0);
function addTrophies(key, n, field, bid) {
  const u = db.users[key]; if (!u) return null;
  fixBt(u);
  if (bid) {
    // 프레스티지(브롤스타즈 트로피 3.0): 그 브롤러가 한 번 넘은 1000 단위 아래로는 안 떨어짐
    u.bbest = u.bbest || {};
    const floor = Math.floor((u.bbest[bid] || 0) / 1000) * 1000;
    u.bt[bid] = Math.max(0, floor, (u.bt[bid] || 0) + n);
    u.bbest[bid] = Math.max(u.bbest[bid] || 0, u.bt[bid]);
  }
  else u.legacy = Math.max(0, (u.legacy || 0) + n);
  u.trophies = totalOf(u);
  u.best = Math.max(u.best || 0, u.trophies);       // 최고 트로피
  if (field) u.stats[field] = (u.stats[field] || 0) + 1;
  save();
  return u.trophies;
}
const brawlerTrophies = (key) => (db.users[key] ? fixBt(db.users[key]).bt : {});
function addStat(key, field) { const u = db.users[key]; if (u) { u.stats[field] = (u.stats[field] || 0) + 1; save(); } }

// ── 로그인 시도 제한 (IP당 1분에 10번) ──
const tries = new Map();
function limited(ip) {
  const now = Date.now(), t = (tries.get(ip) || []).filter((x) => now - x < 60000);
  t.push(now); tries.set(ip, t);
  return t.length > 10;
}

const NAME_RE = /^[가-힣a-zA-Z0-9_]{2,10}$/;
function routes(app) {
  const bearer = (req) => (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  app.post('/api/signup', (req, res) => {
    if (limited(req.ip)) return res.status(429).json({ error: '잠시 후 다시 시도해주세요.' });
    const name = String(req.body.name || '').trim(), pw = String(req.body.password || '');
    if (!NAME_RE.test(name)) return res.status(400).json({ error: '닉네임은 2~10자 (한글·영문·숫자·_)' });
    if (pw.length < 4 || pw.length > 100) return res.status(400).json({ error: '비밀번호는 4자 이상' });
    const key = name.toLowerCase();
    if (db.users[key]) return res.status(409).json({ error: '이미 있는 닉네임이에요.' });
    const salt = crypto.randomBytes(16).toString('hex');
    db.users[key] = { name, salt, hash: hashPw(pw, salt), trophies: 0, stats: { kills: 0, wins: 0, games: 0 }, prefs: {}, createdAt: Date.now(), lastSeen: Date.now() };
    res.json({ token: newSession(key), user: publicUser(db.users[key]) });
  });
  app.post('/api/login', (req, res) => {
    if (limited(req.ip)) return res.status(429).json({ error: '잠시 후 다시 시도해주세요.' });
    const key = String(req.body.name || '').trim().toLowerCase(), pw = String(req.body.password || '');
    const u = db.users[key];
    const ok = u && crypto.timingSafeEqual(Buffer.from(hashPw(pw, u.salt), 'hex'), Buffer.from(u.hash, 'hex'));
    if (!ok) return res.status(401).json({ error: '닉네임 또는 비밀번호가 틀렸어요.' });
    u.lastSeen = Date.now(); save();
    res.json({ token: newSession(key), user: publicUser(u) });
  });
  app.get('/api/me', (req, res) => {
    const a = userFromToken(bearer(req));
    if (!a) return res.status(401).json({ error: '로그인 필요' });
    a.u.lastSeen = Date.now(); save();
    res.json({ user: publicUser(a.u) });
  });
  app.post('/api/logout', (req, res) => { delete db.sessions[sha(bearer(req))]; save(); res.json({ ok: true }); });
  // 선택한 브롤러·모드·로드아웃을 계정에 저장 (다른 기기에서도 그대로)
  app.put('/api/prefs', (req, res) => {
    const a = userFromToken(bearer(req));
    if (!a) return res.status(401).json({ error: '로그인 필요' });
    const p = req.body || {};
    const prefs = a.u.prefs || (a.u.prefs = {});
    if (typeof p.brawler === 'string') prefs.brawler = p.brawler.slice(0, 20);
    if (typeof p.mode === 'string') prefs.mode = p.mode.slice(0, 20);
    if (typeof p.icon === 'string') prefs.icon = p.icon.slice(0, 20);   // 프로필 아이콘 (브롤러 id)
    if (p.loadouts && typeof p.loadouts === 'object' && JSON.stringify(p.loadouts).length < 4000) prefs.loadouts = p.loadouts;
    save();
    res.json({ ok: true });
  });
}

const trophiesOf = (key) => (db.users[key] ? db.users[key].trophies || 0 : 0);

// 가입한 전체 플레이어 (공개 정보만)
function allUsers() {
  return Object.entries(db.users).map(([key, u]) => ({
    key, name: u.name, trophies: u.trophies || 0, kills: (u.stats && u.stats.kills) || 0, wins: (u.stats && u.stats.wins) || 0,
    games: (u.stats && u.stats.games) || 0, icon: (u.prefs && u.prefs.icon) || null, lastSeen: u.lastSeen || u.createdAt || 0, createdAt: u.createdAt || 0,
  }));
}

// 플레이어 프로필 (공개 정보: 트로피·최고 트로피·브롤러별 트로피·전적·아이콘)
function profileOf(name) {
  const key = String(name || '').trim().toLowerCase(), u = db.users[key];
  if (!u) return null;
  fixBt(u);
  return { key, name: u.name, trophies: u.trophies || 0, best: Math.max(u.best || 0, u.trophies || 0), bt: u.bt, stats: u.stats || {}, icon: (u.prefs && u.prefs.icon) || null, createdAt: u.createdAt || 0, lastSeen: u.lastSeen || 0 };
}

module.exports = { profileOf, load, routes, userFromToken, addTrophies, brawlerTrophies, addStat, trophiesOf, allUsers, flush };
