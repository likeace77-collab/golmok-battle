// 골목대전 서버: 계정, 아바타/팀 저장, 로비, 실시간 대전
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const Data = require('./data');
const E = require('./engine');
const P = require('./progress');
const S = require('./social'); // 친구·길드·채팅·협업 퀘스트
const R = require('./rank'); // 랭크전
const DG = require('./dungeon'); // 이벤트 던전
const RD = require('./raid');
const BUILD = Date.now().toString(36); // 서버가 켜질 때마다 바뀌는 판 번호 // 레이드·흑화 메가배틀

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
const isUnlocked = (u, item) => !item.cond || isDev(u) || owns(u, REF.get(item)) || (item.cond[0] === 'gift' ? owns(u, item.cond[1])
  : item.cond[0] === 'guild' ? S.roleOk(u, item.cond[1]) : item.cond[0] === 'rank' ? (u.rank?.ever || 0) >= item.cond[1] : !['dev', 'shop', 'gshop'].includes(item.cond[0]) && statOf(u, item.cond[0]) >= item.cond[1]);
// 길드 직책이 바뀌어 못 쓰게 된 꾸미기는 기본으로 되돌림
function fixStyle(u) {
  if (!u.style) return;
  const ok = (kind, id) => Data.COSMETICS[kind].some((x) => x.id === id && isUnlocked(u, x));
  if (!ok('titles', u.style.title)) u.style.title = Data.COSMETICS.titles.find((x) => !x.cond).id;
  if (!ok('cards', u.style.card)) u.style.card = Data.COSMETICS.cards.find((x) => !x.cond).id;
  u.style.pins = (u.style.pins || []).filter((p) => ok('pins', p));
}

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

/* ---------- 특별 지급 ---------- */
// 긴급 보상: 2026-11-11 (한국시간) 자정 전에 접속하면 한 번
const EMERGENCY = { id: 'emg-20261111', until: Date.parse('2026-11-12T00:00:00+09:00'), title: '긴급 보상 도착!', r: { skips: 50, tickets: 3, gp: 5000 } };
// 한 번씩 뿌리는 선물: before 전에 만든 계정이 다음 접속 때 받아요 (until이 있으면 그때까지 접속해야 함)
const GIFTS = [
  EMERGENCY,
  { id: 'startup-20261112', before: Date.parse('2026-11-13T00:00:00+09:00'), title: '🏰 길드 창업 지원금 도착!', r: { gp: 3000, tickets: 1 } },
  { id: 'night-20261113', until: Date.parse('2026-11-14T00:00:00+09:00'), title: '🌙 오늘 밤 접속 보상!', r: { gp: 15000 } },
];
// 새 게임으로 바뀌기 전부터 있던 계정에 '차원을 넘어온 자' 칭호
const DIMENSION_BEFORE = Date.parse('2026-11-12T00:00:00+09:00');
function specialGrants(u) {
  u.flags ||= {};
  let changed = false;
  if (!u.flags.dimension && (u.createdAt || 0) < DIMENSION_BEFORE) {
    u.flags.dimension = true; changed = true;
    (u.owned ||= []).includes('titles:dimension') || u.owned.push('titles:dimension');
    sendMail(u, { from: '골목대전 운영진', title: '차원을 넘어온 자', body: '골목대전이 새로운 차원으로 넘어왔습니다. 처음부터 함께해 준 골목몬꾼에게 특별 칭호 「차원을 넘어온 자」를 드립니다. 꾸미기 → 칭호에서 장착해 보세요!' });
  }
  return changed;
}
function pendingGifts(u) {
  u.flags ||= {};
  const out = [];
  for (const g of GIFTS) {
    if (u.flags[g.id] || (g.until && Date.now() >= g.until) || (g.before && (u.createdAt || 0) >= g.before)) continue;
    u.flags[g.id] = true;
    out.push({ title: g.title, got: P.grant(u, g.r) });
  }
  // 공모전 출시작을 만든 사람에게: 내가 만든 골목몬(이로치) + 10000GP
  for (const [id, sp] of Object.entries(Data.MONSTERS)) {
    if (!sp.contest || sp.contest.by !== u.name || u.flags[`creator-${id}`]) continue;
    u.flags[`creator-${id}`] = true;
    out.push({ title: `🎉 내가 만든 ${sp.n} 정식 출시! 기념 선물`, got: P.grant(u, { mon: id, shiny: true, gp: 10000 }) });
  }
  return out;
}

/* ---------- 쿠폰 ---------- */
// 코드(대소문자 무시) → 보상. 계정마다 한 번. until을 넣으면 그때까지만
const COUPONS = {
  'golmok-champions': { r: { mon: 'random', stones: 1, skips: 30, tickets: 2 }, title: '쿠폰 보상!' },
  'tikitikitikitikitiki': { r: { gp: 10000, tickets: 1 }, title: '티키티키 쿠폰 보상!' },
  'ay yo what the f**k': { r: { gp: 20000, tickets: 5, skips: 100 }, title: '쿠폰 보상!' },
};
const couponKey = (code) => String(code || '').trim().replace(/\s+/g, ' ').toLowerCase();
// 개발자 화면: 코드에 들어 있는 쿠폰 + 개발자가 만든 쿠폰(db.coupons)
function couponList() {
  const used = (k) => Object.values(db.users).filter((u) => (u.coupons || []).includes(k)).length;
  const all = { ...COUPONS, ...(db.coupons || {}) };
  return Object.entries(all).map(([code, c]) => ({ code, title: c.title, r: c.r, until: c.until || null, used: used(code), fixed: !!COUPONS[code] && !(db.coupons || {})[code], at: c.at || 0 })).sort((a, b) => b.at - a.at);
}
function couponMake(b) {
  const code = couponKey(b.code);
  if (code.length < 2 || code.length > 60) return { error: '쿠폰 코드는 2~60자로 정해 주세요.' };
  const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  const r = {}; for (const [k, max] of [['gp', 10000000], ['tickets', 1000], ['skips', 10000], ['stones', 60], ['gpt', 100000]]) { const v = n(b.r?.[k], max); if (v) r[k] = v; }
  if (b.r?.mon === 'random' || Data.MONSTERS[b.r?.mon]) r.mon = b.r.mon;
  if (b.r?.mon && b.r?.shiny) r.shiny = true;
  if (!Object.keys(r).length) return { error: '보상을 하나 이상 넣어 주세요.' };
  const until = b.until ? Date.parse(b.until) : 0;
  if (b.until && !until) return { error: '기한 날짜가 이상해요.' };
  (db.coupons ||= {})[code] = { r, title: String(b.title || '쿠폰 보상!').slice(0, 30), ...(until ? { until } : {}), at: Date.now() };
  return { ok: true, list: couponList() };
}
function useCoupon(u, code) {
  const k = couponKey(code), c = (db.coupons || {})[k] || COUPONS[k];
  if (!k) return { error: '쿠폰 코드를 입력해 주세요.' };
  if (!c || (c.until && Date.now() > c.until)) return { error: '없거나 기간이 끝난 쿠폰이에요.' };
  u.coupons ||= [];
  if (u.coupons.includes(k)) return { error: '이미 사용한 쿠폰이에요.' };
  u.coupons.push(k);
  return { ok: true, title: c.title, got: P.grant(u, c.r) };
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
    if (Array.isArray(d?.team) && !d.team.some((x) => monOf(u, String(x?.uid ?? '')))) { out.push(null); continue; } // 골목몬이 다 없어진 덱은 건너뜀
    const team = validTeam(u, d?.team);
    if (!team || !name || [...name].length > 12 || /[\u0000-\u001f]/.test(name)) return null;
    out.push({ name, team });
  }
  return out;
}
const deckOf = (u) => u.decks[u.active] || { name: '', team: [] };
const monOf = (u, uid) => u.mons.find((m) => m.uid === uid);
// 대전에 나갈 팀: 덱의 칸(uid, 도구)을 내 골목몬(종류, 기술)으로 바꿉니다.
const deckLive = (u) => { const away = P.awayUids(u), all = deckOf(u).team, left = all.filter((t) => !away.has(t.uid)); return left.length ? left : all; }; // 원정 간 골목몬은 빼고 (전부 원정이면 그대로)
const battleTeam = (u) => deckLive(u).map((t) => { const m = monOf(u, t.uid); return m && { species: m.species, moves: m.moves, ...(m.shiny ? { shiny: true } : {}), ...(m.plus ? { plus: m.plus } : {}), ...(t.item ? { item: t.item } : {}) }; }).filter(Boolean);
const deckView = (u) => u.decks.map((d) => ({ name: d.name, team: d.team.map((t) => { const m = monOf(u, t.uid); return m && { uid: m.uid, species: m.species, moves: m.moves, ...(m.shiny ? { shiny: true } : {}), ...(m.plus ? { plus: m.plus } : {}), ...(t.item ? { item: t.item } : {}) }; }).filter(Boolean) }));

// 예전의 팀 하나짜리 계정을 덱 구조로 옮깁니다.
function migrate() {
  let changed = false;
  for (const u of Object.values(db.users)) {
    for (const k of Object.keys(Data.AVATAR_OPTIONS)) if (!Number.isInteger(u.avatar[k])) { u.avatar[k] = 0; changed = true; }
    if (!u.stats) { u.stats = newStats(); changed = true; }
    if (Array.isArray(u.decks) && u.decks.some((d) => !d.team.length || d.team.some((t) => !u.mons?.some((m) => m.uid === t.uid)))) { require('./decks').pruneDecks(u); changed = true; } // 빈 덱 정리
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
    if (specialGrants(u)) changed = true;
    // 개발자 계정: 모든 골목몬 1마리씩과 모든 메가스톤 (꾸미기는 isUnlocked에서 전부 열림)
    if (isDev(u)) {
      const have = new Set(u.mons.map((m) => m.species));
      for (const sp of Object.keys(Data.MONSTERS)) if (!have.has(sp)) { P.addMon(u, sp); changed = true; }
      const shinyHave = new Set(u.mons.filter((m) => m.shiny).map((m) => m.species)); // 이로치도 1마리씩
      for (const sp of Object.keys(Data.MONSTERS)) if (!shinyHave.has(sp)) { P.addMon(u, sp, null, true); changed = true; }
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
    // 신캐 공모전 출시작을 만든 사람에게 신화 칭호
    { id: 'kids-title', user: 'pshrocket', why: '선생님 제작', notice: '우편함에 신화 등급 칭호가 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '선생님을 만들어 주셔서 감사합니다', body: '신캐 공모전 출시작 "선생님"을 만들어 주셔서 감사합니다. 오늘도 교실을 지키는 모든 선생님께 경의를 표하며, 신화 등급 칭호 "이놈의 아이들"을 드립니다!', reward: ['titles:kids'] }) },
    { id: 'kkaak-title', user: '티키티키펑크', why: '까모 제작', notice: '우편함에 신화 등급 칭호가 도착했습니다!',
      apply: (u) => sendMail(u, { from: '골목대전 운영팀', title: '까모를 만들어 주셔서 감사합니다', body: '신캐 공모전 출시작 "까모"를 만들어 주셔서 감사합니다. 골목길 전선 위에서 세상을 내려다보는 까마귀처럼, 신화 등급 칭호 "까악까악"을 드립니다!', reward: ['titles:kkaak'] }) },
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
  const uids = new Set(), out = [];
  for (const x of t) {
    const m = monOf(u, String(x?.uid ?? ''));
    if (!m) continue; // 강화·교환으로 없어진 골목몬은 조용히 뺌
    if (uids.has(m.uid)) return null; // 같은 골목몬 여러 마리 OK (같은 개체는 한 번만)
    uids.add(m.uid);
    const item = Data.ITEMS[x.item] ? x.item : undefined; // 도구 (없거나 모르는 도구면 빈손)
    out.push({ uid: m.uid, ...(item ? { item } : {}) });
  }
  return out.length ? out : null;
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
  premium: P.passState(u).premium, badges: { ...P.claimable(u), social: (u.freq?.in?.length || 0) + (db.guilds ? S.guildClaimable(u, keyOf(u.name)) + S.tradeIn(keyOf(u.name)) : 0) }, guild: u.guild && db.guilds?.[u.guild] ? { id: u.guild, name: db.guilds[u.guild].name, emblem: db.guilds[u.guild].emblem, color: db.guilds[u.guild].color, role: S.roleOf(u) } : null, gpt: u.gpt || 0, friendsN: (u.friends || []).length, rank: u.rank ? { pts: u.rank.pts, tier: R.tierOf(u.rank.pts), ever: u.rank.ever || 0 } : { pts: 1000, tier: 0, ever: 0 }, scoutReady: !!P.scoutState(u).cands, surveyDone: !!db.surveys?.[keyOf(u.name)], sunfish: !!u.sunfishDone,
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
    return json(res, 200, { ITEMS: Data.ITEMS, FORMS: Data.FORMS.names, TIERS: Data.TIERS.names, BANNED, TYPES, CHART, MOVES, MONSTERS, AVATAR_OPTIONS, COSMETICS, STAT_NAMES, PERKS: Data.PERKS, GMAX: E.gmaxInfo(), inviteRequired: !!INVITE_CODE });
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
    const raw = validDecks(user, body.decks);
    const decks = raw && raw.filter(Boolean);
    if (decks && !decks.length) return json(res, 400, { error: '덱에 골목몬을 한 마리 이상 넣어 주세요.' });
    if (raw) body.active = raw.slice(0, Number.isInteger(body.active) ? body.active + 1 : 1).filter(Boolean).length - (raw[body.active] ? 1 : 0); // 빈 덱이 빠진 만큼 번호 당기기
    if (!decks) return json(res, 400, { error: '덱은 1~20개, 이름은 12자 이내, 덱마다 내 골목몬 1~6마리여야 합니다.' });
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
  { const sr = S.api(route, user, auth.key, body); if (sr !== undefined) return done(sr); }
  if (route === 'POST /api/coupon') return done(useCoupon(user, body.code));
  if (route === 'GET /api/scout') return json(res, 200, { scout: P.scoutState(user), user: publicUser(user) });
  if (route === 'GET /api/raid') return done({ ok: true }, { raid: raidView(auth.key) });
  if (route === 'GET /api/dungeon') return done({ ok: true }, { dungeon: DG.view(user) });
  if (route === 'GET /api/rank') { const v = R.view(user); return done({ ok: true }, { rank: v, board: R.board(db.users, v.season), queued: rankQ.has(auth.key) }); }
  if (route === 'GET /api/expe') return done({ ok: true }, { expe: P.expeState(user) });
  if (route === 'POST /api/expe/send') return done(P.expeSend(user, String(body.uid || ''), String(body.dest || ''), new Set(deckOf(user).team.map((t) => t.uid))), { expe: P.expeState(user) });
  if (route === 'POST /api/expe/claim') return done(P.expeClaim(user, String(body.uid || 'all')), { expe: P.expeState(user) });
  if (route === 'POST /api/expe/recall') return done(P.expeRecall(user, String(body.uid || '')), { expe: P.expeState(user) });
  if (route === 'POST /api/scout/reroll') return done(P.scoutReroll(user), { scout: P.scoutState(user) });
  if (route === 'POST /api/scout/skip') return done(P.scoutSkip(user), { scout: P.scoutState(user) });
  if (route === 'POST /api/scout/pick') { const r = P.scoutPick(user, String(body.species ?? ''), body.pay === 'ticket' ? 'ticket' : 'gp'); return done(r, { scout: P.scoutState(user) }); }
  if (route === 'POST /api/mon/enhance') {
    const busy = new Set([...P.awayUids(user), ...Object.values(db.trades || {}).filter((t) => t.from === auth.key || t.to === auth.key).flatMap((t) => [t.give, t.want])]);
    return done(P.enhance(user, String(body.uid || ''), String(body.food || ''), busy));
  }
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
  if (route === 'GET /api/dev/coupons') { if (!isDev(user)) return json(res, 403, { error: '개발자만 할 수 있어요.' }); return json(res, 200, { list: couponList() }); }
  if (route === 'POST /api/dev/coupon') { if (!isDev(user)) return json(res, 403, { error: '개발자만 할 수 있어요.' }); return done(couponMake(body)); }
  if (route === 'POST /api/dev/coupon/delete') {
    if (!isDev(user)) return json(res, 403, { error: '개발자만 할 수 있어요.' });
    const k = couponKey(body.code);
    if (!(db.coupons || {})[k]) return json(res, 400, { error: COUPONS[k] ? '코드에 들어 있는 쿠폰이라 여기서는 못 지워요. 기한 끝내기를 쓰세요.' : '없는 쿠폰이에요.' });
    delete db.coupons[k];
    return done({ ok: true, list: couponList() });
  }
  if (route === 'POST /api/dev/coupon/end') { // 코드에 든 쿠폰도 지금 끝내기 (db에 같은 이름으로 덮어씀)
    if (!isDev(user)) return json(res, 403, { error: '개발자만 할 수 있어요.' });
    const k = couponKey(body.code), c = (db.coupons || {})[k] || COUPONS[k];
    if (!c) return json(res, 400, { error: '없는 쿠폰이에요.' });
    (db.coupons ||= {})[k] = { ...c, until: Date.now() - 1, at: c.at || Date.now() };
    return done({ ok: true, list: couponList() });
  }
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
// 출시된 공모전 골목몬 그림: 출품작에 올린 그림을 그대로 내보냄 (메가 그림이 없으면 기본 그림)
function contestArt(res, info, mega, dl = false) {
  const e = contest.entries.find((x) => x.name === info.name && x.user === info.by) || contest.entries.find((x) => x.name === info.name);
  const src = (mega && e?.mega?.image) || e?.image;
  const m = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(src || '');
  if (!m) { // 출품작을 못 찾으면 물음표 그림
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-cache' });
    return res.end(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect x="30" y="30" width="140" height="140" rx="24" fill="#FFF3B0" stroke="#1a1433" stroke-width="6"/><text x="100" y="128" font-size="90" text-anchor="middle" font-family="sans-serif" fill="#1a1433">?</text></svg>`);
  }
  const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[m[1]];
  res.writeHead(200, { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=3600', ...(dl ? { 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`${info.name}${mega ? '-메가' : ''}.${ext}`)}` } : {}) }); // ?dl=1이면 내려받기
  res.end(Buffer.from(m[2], 'base64'));
}
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
  const cm = /^img\/mon\/([a-z]+)(-mega)?\.webp$/.exec(rel);
  if (cm && Data.MONSTERS[cm[1]]?.contest) return contestArt(res, Data.MONSTERS[cm[1]].contest, !!cm[2], url.searchParams.has('dl'));
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
  if (path.basename(serve) === 'index.html') { // 배포할 때마다 css·js 주소가 바뀌어 옛 파일을 붙들고 있지 않게
    const html = fs.readFileSync(serve, 'utf8').replace(/(href="style\.css|src="(?:js|vendor)\/[\w.-]+\.js)"/g, `$1?v=${BUILD}"`);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
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
// 랭크전 대기열: 사람끼리 먼저, 15초 안에 상대가 없으면 내 티어에 맞는 골목대장과
const rankQ = new Map(); // key → { at, timer }
function rankLeave(key) { const q = rankQ.get(key); if (q) { clearTimeout(q.timer); rankQ.delete(key); } }
const REACTS = new Set(['kk', 'gg', 'nice', 'wow', 'oops', 'sorry', 'hi', 'gl', 'fire', 'cry', 'clap', 'think']), reactAt = new Map();

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
const isPractice = (room) => !room.tag && !room.raid && room.keys.includes(BOT);
const BOT_LEVELS = ['쉬움', '보통', '어려움', '지옥'];

// 훈련장: 더미와 1대1. 시간 제한, 승패, 기록 없음. 더미에게 준 피해만 쌓입니다.
const shinyOwned = (u) => [...new Set(u.mons.filter((m) => m.shiny).map((m) => m.species))];
function startTraining(key) {
  const u = db.users[key];
  const room = { id: crypto.randomUUID(), keys: [key, BOT], b: E.createTraining({ name: u.name, avatar: u.avatar, style: u.style, deck: '모든 골목몬' }, undefined, bannedFor(u), shinyOwned(u)), deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: 0, tag: false, training: true, counted: 0, spectators: new Set() };
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

function startBattle(keys, size, level = 1, tag = false, ranked = false, dungeon = null) {
  const foeDeck = (i) => {
    const mine = tag ? (i < 2 ? 0 : 1) : i;
    const human = keys.find((k, j) => k !== BOT && (tag ? (j < 2 ? 0 : 1) : j) !== mine) ?? keys.find((k) => k !== BOT);
    return battleTeam(db.users[human]).slice(0, size);
  };
  const players = keys.map((k, i) => (k === BOT
    ? (dungeon ? { name: `${dungeon.rule.icon} ${dungeon.floor + 1}층 골목대장`, avatar: randomAvatar(true), style: randomStyle(), deck: dungeon.rule.n, team: DG.foeTeam(dungeon.rule, dungeon.floor, foeDeck(i)), ...(dungeon.rule.noMega ? { stones: [] } : {}) }
      : { name: `골목대장(${BOT_LEVELS[level]})`, avatar: randomAvatar(true), style: randomStyle(), deck: `${BOT_LEVELS[level]} 덱`, team: E.botTeam(level, size, foeDeck(i)) })
    : { name: db.users[k].name, avatar: db.users[k].avatar, style: db.users[k].style, deck: deckOf(db.users[k]).name, team: battleTeam(db.users[k]).slice(0, size), stones: dungeon?.rule.noMega ? [] : db.users[k].stones }));
  openRoom({ id: crypto.randomUUID(), keys, b: E.createBattle(players, undefined, { preview: true }), deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: level, tag, ranked, dungeon, spectators: new Set() });
}
function openRoom(room) {
  const { keys } = room;
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
  if (!room.tag && !room.raid && !online.has(room.keys[1 - s])) return dissolve(room); // 둘 다 나갔으면 무효
  if (room.tag || room.raid) return seatToBot(room, key, '대전을 나가서 골목대장이 자리를 맡았습니다.');
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
    if (!room.tag && !room.raid && room.keys[1 - s] !== BOT) send(online.get(room.keys[1 - s]), { t: 'opp_ready' });
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
    if (room.raid) raidResult(room, k, won);
    else if (room.tag) { st.tagGames++; if (won) st.tagWins++; }
    else if (!pvp && won) { st[`p${room.botLevel}`]++; st.botWins++; }
    const pts = P.afterBattle(db.users[k], room.tag || room.raid ? 'tag' : pvp ? 'pvp' : 'practice', won, room.b.sides[s]);
    { const team = E.teamOf(room.b, s); const mates = humans.filter(([k2, s2]) => k2 !== k && E.teamOf(room.b, s2) === team).map(([k2]) => k2), foes = humans.filter(([, s2]) => E.teamOf(room.b, s2) !== team).map(([k2]) => k2);
      S.afterBattle(k, { won, mega: !!room.b.sides[s].megaUsed, mates, foes, kind: room.tag || room.raid ? 'tag' : pvp ? 'pvp' : 'practice' }); }
    if (pts) { if (online.has(k)) toast(k, `시즌 패스 포인트 +${pts}`); else notices.set(k, [notices.get(k), `시즌 패스 포인트 +${pts}`].filter(Boolean).join(' · ')); }
    if (room.dungeon) {
      const dr = DG.result(db.users[k], room.dungeon.floor, won, P.grant);
      if (dr) setTimeout(() => send(online.get(k), { t: 'gift', title: dr.cleared ? `🏆 ${room.dungeon.rule.n} 완전 정복!` : `${room.dungeon.floor + 1}층 돌파!`, got: dr.got }), 1800);
    }
    if (room.ranked && winner !== null) {
      const rr = R.result(db.users[k], won, room.keys.includes(BOT)), T = R.TIERS[rr.tier];
      const msg = `🏆 랭크 ${rr.delta >= 0 ? '+' : ''}${rr.delta}점 (${T.icon} ${T.n} ${rr.pts})${rr.up ? ` · ${T.n} 승급!` : ''}`;
      if (online.has(k)) setTimeout(() => toast(k, msg), 1500); else notices.set(k, [notices.get(k), msg].filter(Boolean).join(' · '));
    }
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
  if (room.raid && winner === 0) raidTarget(room);
  save();
  humans.forEach(([k]) => send(online.get(k), { t: 'me', user: publicUser(db.users[k]) }));
  dissolve(room);
}

/* ---------- 레이드 대기실 ---------- */
const raidRooms = new Map(); // id -> { id, host, mode, target, members, bots, title }
const raidOf = (key) => [...raidRooms.values()].find((l) => l.members.includes(key));
const isMate = (u, k) => u.friends.includes(k) || (u.guild && db.users[k]?.guild === u.guild);
function raidLobbyView(l) {
  return { id: l.id, host: l.host === undefined ? null : db.users[l.host]?.name, hostKey: l.host, mode: l.mode, title: l.title, bots: l.bots,
    target: l.target ? { name: l.target.name, species: l.target.ace.species, shiny: !!l.target.ace.shiny } : null,
    members: l.members.map((k) => ({ key: k, name: db.users[k].name, avatar: db.users[k].avatar, online: online.has(k) })) };
}
function raidPush(l) { for (const k of l.members) send(online.get(k), { t: 'raid_room', room: raidLobbyView(l) }); }
function raidLeave(key, quiet = false) {
  const l = raidOf(key);
  if (!l) return;
  l.members = l.members.filter((k) => k !== key);
  if (!quiet) send(online.get(key), { t: 'raid_room', room: null });
  if (!l.members.length) { raidRooms.delete(l.id); return; }
  if (l.host === key) l.host = l.members[0];
  raidPush(l);
}
function raidView(key) {
  const u = db.users[key], gb = RD.todayBoss(), mine = raidOf(key);
  const friends = u.friends.map((k) => db.users[k]).filter(Boolean).map((f) => { const ace = RD.aceOf(battleTeam(f)); return { key: keyOf(f.name), name: f.name, avatar: f.avatar, online: online.has(keyOf(f.name)), busy: inBattle.has(keyOf(f.name)), ace: ace && { species: ace.species, plus: ace.plus || 0, shiny: !!ace.shiny } }; });
  const open = [...raidRooms.values()].filter((l) => l !== mine && l.members.length < RD.MAX && (isMate(u, l.host) || l.members.some((k) => isMate(u, k)))).map(raidLobbyView);
  return { boss: gb, left: RD.left(u), daily: RD.DAILY, limit: RD.LIMIT, max: RD.MAX, size: RD.SIZE, reward: RD.REWARD, friends, open, room: mine ? raidLobbyView(mine) : null };
}
function startRaid(l) {
  const ok = [], size = RD.SIZE;
  for (const k of l.members) {
    const u = db.users[k], team = battleTeam(u).slice(0, size);
    if (!online.has(k) || inBattle.has(k)) continue;
    if (team.length < size || bannedIn(u, team).length || secretIn(team).length) { toast(k, `레이드는 덱에 공개된 골목몬이 ${size}마리 있어야 해요. 이번 판은 빠졌어요.`); continue; }
    ok.push(k);
  }
  if (!ok.length) return toast(l.host, '출발할 수 있는 사람이 없어요.');
  raidRooms.delete(l.id);
  for (const k of l.members) if (!ok.includes(k)) send(online.get(k), { t: 'raid_room', room: null });
  const n = l.bots ? RD.MAX : ok.length, keys = [...ok];
  while (keys.length < n) keys.push(BOT);
  keys.push(BOT); // 마지막 자리 = 보스
  const bossSide = RD.boss(l.mode, l.target);
  const players = keys.map((k, i) => (i === keys.length - 1 ? { ...bossSide, avatar: bossSide.avatar || randomAvatar(true), style: bossSide.style || randomStyle() }
    : k === BOT ? { name: `골목 용병 ${i + 1}`, avatar: randomAvatar(true), style: randomStyle(), deck: '용병 덱', team: E.botTeam(2, size, []) }
    : { name: db.users[k].name, avatar: db.users[k].avatar, style: db.users[k].style, deck: deckOf(db.users[k]).name, team: battleTeam(db.users[k]).slice(0, size), stones: db.users[k].stones }));
  const b = E.createBattle(players, undefined, { preview: true, raid: RD.raidOpts(l.mode, n, l.title) });
  openRoom({ id: crypto.randomUUID(), keys, b, deadline: 0, timer: null, ended: false, leaveTimers: {}, botLevel: 2, tag: false, ranked: false, dungeon: null, raid: { mode: l.mode, target: l.target?.key || null, targetName: l.target?.name || '' }, spectators: new Set() });
}
function raidResult(room, k, won) {
  const u = db.users[k], st = u.stats, bk = RD.book(u), mode = room.raid.mode;
  if (won) { st.raidWins = (st.raidWins || 0) + 1; if (mode === 'dark') st.darkWins = (st.darkWins || 0) + 1; }
  let got = [], title;
  if (bk.n < RD.DAILY) {
    if (won) { bk.n++; got = P.grant(u, RD.REWARD[mode]); title = mode === 'dark' ? `💜 ${room.raid.targetName}님을 정화했어요!` : '🔥 레이드 클리어!'; }
    else { got = P.grant(u, RD.REWARD.lose); title = '레이드 실패... 참가 보상'; }
  }
  if (got.length) setTimeout(() => send(online.get(k), { t: 'gift', title: `${title} (오늘 보상 ${RD.DAILY - bk.n}번 남음)`, got }), 1800);
}
function raidTarget(room) {
  const tk = room.raid.target, t = tk && db.users[tk];
  if (!t) return;
  const names = room.keys.filter((k) => k !== BOT).map((k) => db.users[k].name);
  P.grant(t, RD.REWARD.target);
  sendMail(t, { from: '골목대전 레이드', title: '💜 친구들이 흑화한 당신을 정화했어요!', body: `${names.join(', ')}님이 흑화 메가배틀에서 흑화한 당신을 쓰러뜨려 정화했어요. 정화 선물 ${RD.REWARD.target.gp.toLocaleString('ko-KR')}GP가 지갑에 들어왔어요.` });
  if (online.has(tk)) send(online.get(tk), { t: 'me', user: publicUser(t) });
}

function onMessage(key, msg) {
  if (!db.users[key].birthYear) return send(online.get(key), { t: 'need_age' });
  if (!db.users[key].tutorial && ['raid_open', 'raid_join', 'raid_start', 'dungeon', 'rank_queue', 'practice', 'challenge', 'accept', 'tag_create', 'tag_seat', 'tag_start', 'training'].includes(msg?.t)) return toast(key, '튜토리얼을 먼저 끝내 주세요.');
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
      if (room.tag || room.raid) return seatToBot(room, key, room.raid ? '레이드에서 나왔습니다. 골목 용병이 자리를 맡았습니다.' : '대전에서 나왔습니다. 골목대장이 자리를 맡았습니다.');
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
    case 'rank_queue': {
      if (room || rankQ.has(key)) return;
      const u = db.users[key], size = R.SIZE, team = battleTeam(u).slice(0, size);
      if (team.length < size) return toast(key, `랭크전은 덱에 골목몬이 ${size}마리 있어야 해요.`);
      if (bannedIn(u, team).length || secretIn(team).length) return toast(key, '덱에 공개 전 골목몬이 있어 랭크전을 할 수 없어요.');
      const other = [...rankQ.keys()].find((k) => k !== key && online.has(k) && !inBattle.has(k));
      if (other) { rankLeave(other); send(online.get(other), { t: 'rank_found' }); send(online.get(key), { t: 'rank_found' }); startBattle([other, key], size, 1, false, true); break; }
      const timer = setTimeout(() => {
        if (!rankQ.has(key)) return; rankLeave(key);
        if (!online.has(key) || inBattle.has(key)) return;
        send(online.get(key), { t: 'rank_found', bot: true });
        startBattle([key, BOT], size, R.botLevel(db.users[key]), false, true);
      }, 15000);
      rankQ.set(key, { at: Date.now(), timer });
      send(online.get(key), { t: 'rank_wait', n: rankQ.size });
      break;
    }
    case 'dungeon': {
      if (room) return;
      const u = db.users[key], v = DG.view(u);
      if (v.cleared) return toast(key, '오늘 던전은 이미 다 깼어요! 내일 새 규칙으로 열려요.');
      const size = v.rule.size, team = battleTeam(u).slice(0, size);
      if (team.length < size) return toast(key, `덱에 골목몬이 ${size}마리 있어야 해요.`);
      if (bannedIn(u, team).length || secretIn(team).length) return toast(key, '덱에 공개 전 골목몬이 있어 들어갈 수 없어요.');
      startBattle([key, BOT], size, DG.LEVELS[v.floor], false, false, { rule: v.rule, floor: v.floor });
      break;
    }
    case 'rank_cancel': rankLeave(key); send(online.get(key), { t: 'rank_cancel' }); break;
    case 'raid_open': {
      if (room) return;
      const u = db.users[key], mode = msg.mode === 'dark' ? 'dark' : 'gmax';
      let target = null;
      if (mode === 'dark') {
        const fk = String(msg.friend ?? ''), f = db.users[fk];
        if (!f || !u.friends.includes(fk)) return toast(key, '흑화시킬 친구를 골라 주세요.');
        const ace = RD.aceOf(battleTeam(f));
        if (!ace) return toast(key, `${f.name}님 덱에 골목몬이 없어요.`);
        target = { key: fk, name: f.name, avatar: f.avatar, style: f.style, ace };
      }
      raidLeave(key, true);
      const gb = RD.todayBoss();
      const l = { id: crypto.randomUUID().slice(0, 8), host: key, mode, target, members: [key], bots: msg.bots !== false, title: mode === 'dark' ? `흑화한 ${target.name}` : `거다이 ${gb.name}` };
      raidRooms.set(l.id, l); raidPush(l);
      break;
    }
    case 'raid_join': {
      if (room) return;
      const l = raidRooms.get(String(msg.id ?? ''));
      if (!l) return toast(key, '이미 출발했거나 없어진 레이드예요.');
      if (l.members.includes(key)) return raidPush(l);
      if (l.members.length >= RD.MAX) return toast(key, `레이드는 ${RD.MAX}명까지예요.`);
      raidLeave(key, true);
      l.members.push(key); raidPush(l);
      for (const k of l.members) if (k !== key) toast(k, `${db.users[key].name}님이 레이드에 들어왔어요!`);
      break;
    }
    case 'raid_leave': raidLeave(key); break;
    case 'raid_bots': { const l = raidOf(key); if (l && l.host === key) { l.bots = !!msg.on; raidPush(l); } break; }
    case 'raid_invite': {
      const l = raidOf(key), to = String(msg.to ?? ''), u = db.users[key];
      if (!l || !db.users[to] || !isMate(u, to)) return;
      if (!online.has(to)) return toast(key, `${db.users[to].name}님은 지금 접속해 있지 않아요.`);
      if (inBattle.has(to)) return toast(key, `${db.users[to].name}님은 대전 중이에요.`);
      send(online.get(to), { t: 'raid_invite', id: l.id, from: u.name, title: l.title, mode: l.mode });
      toast(key, `${db.users[to].name}님에게 초대를 보냈어요.`);
      break;
    }
    case 'raid_start': {
      if (room) return;
      const l = raidOf(key);
      if (!l || l.host !== key) return;
      startRaid(l);
      break;
    }
    case 'react': { // 대전 응원·이모티콘: 같은 방 사람과 관전자에게
      const r = String(msg.r || '');
      if (!REACTS.has(r) && !(r.startsWith('s:') && Data.MONSTERS[r.slice(2)])) break;
      const now = Date.now(); if (now - (reactAt.get(key) || 0) < 1200) break; reactAt.set(key, now);
      const room = inBattle.get(key) || spectating.get(key);
      if (!room || room.training || room.ended) break;
      const out = { t: 'react', r, name: db.users[key].name, seat: room.keys.indexOf(key) };
      for (const k of room.keys) if (k !== BOT) send(online.get(k), out);
      for (const k of room.spectators) send(online.get(k), out);
      break;
    }
    case 'chat': S.chatSend(key, msg.ch, msg.text); break;
    case 'chat_hist': send(online.get(key), { t: 'chat_hist', ch: String(msg.ch || ''), list: S.chatHistory(key, msg.ch) }); break;
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
    case 'train_shiny': { // 훈련장: 가진 이로치로 바꾸기·되돌리기
      if (!room?.training) return;
      const m = room.b.sides[0].mons[Number(msg.slot)];
      if (!m || !shinyOwned(db.users[key]).includes(m.species)) return toast(key, '이 골목몬의 이로치를 아직 갖고 있지 않아요.');
      m.shiny = !m.shiny;
      syncBattle(room, 0);
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
    { const u = db.users[key]; specialGrants(u); require('./decks').pruneDecks(u); const gifts = pendingGifts(u); if (gifts.length) { save(); send(ws, { t: 'me', user: publicUser(u) }); send(ws, { t: 'gift', title: gifts.length > 1 ? '선물이 도착했어요!' : gifts[0].title, got: gifts.flatMap((x) => x.got) }); } }
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      try { onMessage(key, JSON.parse(raw)); }
      catch (e) { console.error('메시지 처리 오류', e); }
    });
    ws.on('close', () => {
      if (online.get(key) !== ws) return;
      online.delete(key); rankLeave(key); raidLeave(key, true);
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
  R.init({ seasonOf: P.seasonOf, grant: P.grant, sendMail });
  S.init(db, { keyOf, online, send, toast, publicUser, save, grant: P.grant, bump: P.bump, isDev, inBattle, sendMail, fixStyle, seasonOf: P.seasonOf, cosmetic: (kind, id) => Data.COSMETICS[kind]?.find((x) => x.id === id), owns });
  server.listen(PORT, () => console.log(`골목대전 서버 실행 중: http://localhost:${PORT}`));
})();

process.on('SIGTERM', async () => {
  if (GIST_ID) { clearTimeout(gistTimer); gistBusy = false; await pushGist(); }
  process.exit(0);
});
