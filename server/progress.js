// 새 게임(v2) 진행: 보유 골목몬, 재화, 스카우트, 출석·퀘스트·업적, 시즌 패스, 튜토리얼
const crypto = require('crypto');
const Data = require('./data');
const E = require('./engine');

const HOUR = 3600e3, DAY = 24 * HOUR;
const SCOUT_HOURS = 20, SKIP_GP = 100, SCOUT_GP = 2500, STONE_GP = 5000, STONE_DUPE_GP = 3000, MOVE_GP = 500; // 메가스톤: 상점 5000GP, 겹치면 3000GP로 바꿔 줌
const KST = 9 * HOUR;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
const weekKey = (t = Date.now()) => { const d = new Date(t + KST); const wd = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10); };

// 공개된 골목몬 (스카우트·메가스톤 후보)
const released = () => Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id));
const rnd = (n) => crypto.randomInt(n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 스타터 덱 8개 ---------- */
const STARTERS = [
  { name: '골목 기본 덱', d: '처음 골목에 온 친구들. 불·물·풀·전기·땅·혼이 골고루.', mons: ['yeontan', 'kettle', 'kongsiru', 'orak', 'maetdol', 'kkaebi'] },
  { name: '불꽃 포장마차', d: '뜨끈한 분식 군단. 화끈한 불 공격으로 밀어붙여요.', mons: ['bungbbang', 'tteokppo', 'hotteok', 'eomuk', 'ttaengcho', 'horong'] },
  { name: '물바다 골목', d: '비 오는 날의 골목. 물 타입이 끈질기게 버텨요.', mons: ['daeya', 'usan', 'sigung', 'batji', 'ppeong', 'setakbot'] },
  { name: '바람의 옥상', d: '옥상 위 바람잡이들. 빠르고 날쌔요.', mons: ['ssaribi', 'bangpae', 'fan', 'bongdari', 'baedalbot', 'hwangsari'] },
  { name: '강철 공장', d: '단단한 쇳덩이들. 잘 안 쓰러져요.', mons: ['jeonbot', 'kkangtong', 'manhol', 'danjo', 'jabanbot', 'bonaeng'] },
  { name: '으스스 밤골목', d: '해가 지면 나오는 골목몬들. 혼과 요상한 기술.', mons: ['jangseung', 'meokarak', 'godeuri', 'yeonji', 'mimik', 'neonna'] },
  { name: '이세계 모험단', d: '트럭에 치여 넘어온 이세계 친구들.', mons: ['hwansaeng', 'malrang', 'seonggeom', 'madoseo', 'yangmeori', 'ppogeuri'] },
  { name: '벌레·동물 친구들', d: '골목의 진짜 주인들. 개성이 넘쳐요.', mons: ['maemmaem', 'wengweng', 'dakdulgi', 'chijeu', 'basaeng', 'ppeondegi'] },
];

/* ---------- 재화와 보상 ---------- */
// 보상: { gp, tickets(골목몬 입수권), skips(1시간 스킵권), stones: 'random'|species|숫자(랜덤 n개), pass(패스 포인트), mon: species }
const newProgress = () => ({ gp: 0, tickets: 0, skips: 0, stones: [], mons: [], decks: [], active: 0, tutorial: false, scout: { next: 0, cands: null }, attend: { last: '', streak: 0 }, daily: null, weekly: null, achieved: [], pass: null, counts: { scouts: 0, wins: 0, games: 0, pvpWins: 0 } });

const newUid = () => crypto.randomBytes(5).toString('hex');
// 이로치: 색이 다른 희귀한 골목몬 (능력은 같음)
const SHINY_SCOUT = 1 / 40, SHINY_GIFT = 1 / 64;
const rollShiny = (p) => Math.random() < p;
function addMon(u, species, moves, shiny = false) {
  const sp = Data.MONSTERS[species];
  const m = { uid: newUid(), species, moves: moves || E.smartMoves(species, []), at: Date.now(), ...(shiny ? { shiny: true } : {}) };
  if (shiny) u.counts.shiny = (u.counts.shiny || 0) + 1;
  m.moves = m.moves.filter((id) => sp.moves.includes(id)).slice(0, 4);
  u.mons.push(m);
  return m;
}
function addStones(u, what, got) {
  const n = typeof what === 'number' ? what : 1;
  for (let i = 0; i < n; i++) {
    let id = typeof what === 'string' && what !== 'random' ? what : null;
    if (!id) { const left = released().filter((x) => !u.stones.includes(x)); if (!left.length) { u.gp += STONE_DUPE_GP; got.push({ k: 'gp', n: STONE_DUPE_GP, why: '메가스톤을 다 모아 GP로' }); continue; } id = left[rnd(left.length)]; }
    if (u.stones.includes(id)) { u.gp += STONE_DUPE_GP; got.push({ k: 'gp', n: STONE_DUPE_GP, why: '이미 있는 메가스톤이라 GP로' }); continue; }
    u.stones.push(id); got.push({ k: 'stone', id });
  }
}
// 보상을 지급하고, 받은 목록을 돌려줍니다.
function grant(u, r) {
  const got = [];
  if (r.gp) { u.gp += r.gp; got.push({ k: 'gp', n: r.gp }); }
  if (r.tickets) { u.tickets += r.tickets; got.push({ k: 'ticket', n: r.tickets }); }
  if (r.skips) { u.skips += r.skips; got.push({ k: 'skip', n: r.skips }); }
  if (r.rerolls) { u.rerolls = (u.rerolls || 0) + r.rerolls; got.push({ k: 'reroll', n: r.rerolls }); } // 리롤권: 스카우트 후보 다시 뽑기 1번
  if (r.stones) addStones(u, r.stones, got);
  if (r.mon) { const m = addMon(u, r.mon === 'random' ? released()[rnd(released().length)] : r.mon, null, r.shiny || (r.mon === 'random' && rollShiny(SHINY_GIFT))); got.push({ k: 'mon', id: m.species, ...(m.shiny ? { shiny: true } : {}) }); }
  if (r.pass) { addPass(u, r.pass); got.push({ k: 'pass', n: r.pass }); }
  if (r.gpt) { u.gpt = (u.gpt || 0) + r.gpt; got.push({ k: 'gpt', n: r.gpt }); } // 길드 포인트(길P)
  return got;
}

/* ---------- 튜토리얼 ---------- */
const TUTORIAL_REWARD = { gp: 10000, tickets: 4, skips: 100, stones: 15 };
function finishTutorial(u, starter) {
  if (u.tutorial) return { error: '튜토리얼은 이미 끝났습니다.' };
  const st = STARTERS[starter];
  if (!st) return { error: '스타터 덱을 골라 주세요.' };
  const team = st.mons.map((sp) => ({ uid: addMon(u, sp).uid }));
  u.decks = [{ name: st.name, team }];
  u.active = 0;
  u.tutorial = true;
  const got = [...st.mons.map((id) => ({ k: 'mon', id })), ...grant(u, TUTORIAL_REWARD)];
  return { got };
}

/* ---------- 스카우트 ---------- */
function scoutState(u, now = Date.now()) {
  const s = u.scout;
  if (!s.cands && now >= s.next) { s.cands = shuffle(released()).slice(0, 8); s.shiny = s.cands.filter(() => rollShiny(SHINY_SCOUT)); }
  const left = s.cands ? 0 : Math.max(0, s.next - now);
  const need = Math.ceil(left / HOUR);
  return { cands: s.cands, next: s.next, left, skipNeed: need, skipHave: Math.min(u.skips, need), skipGp: Math.max(0, need - u.skips) * SKIP_GP, cost: SCOUT_GP, reroll: REROLL_GP, shiny: s.cands ? s.shiny || [] : [] };
}
function scoutSkip(u) {
  const st = scoutState(u);
  if (st.cands) return { error: '이미 스카우트 후보가 나와 있어요.' };
  const useSkip = st.skipHave, gp = st.skipGp;
  if (u.gp < gp) return { error: `1시간 스킵권이 ${st.skipNeed - useSkip}장 모자라요. 대신 ${gp}GP가 필요해요.` };
  u.skips -= useSkip; u.gp -= gp; u.scout.next = 0;
  return { used: { skips: useSkip, gp } };
}
// 후보 다시 뽑기: 500GP. 지금 후보와 최대한 다른 8마리로
const REROLL_GP = 500;
function scoutReroll(u, pay = 'gp') {
  const st = scoutState(u);
  if (!st.cands) return { error: '스카우트 후보가 나와 있을 때만 다시 뽑을 수 있어요.' };
  if (pay === 'ticket') { if (!(u.rerolls > 0)) return { error: '리롤권이 없어요.' }; u.rerolls--; }
  else { if (u.gp < REROLL_GP) return { error: `GP가 모자라요. (${REROLL_GP}GP 필요)` }; u.gp -= REROLL_GP; }
  const fresh = shuffle(released().filter((x) => !st.cands.includes(x)));
  u.scout.cands = [...fresh, ...shuffle(st.cands)].slice(0, 8);
  u.scout.shiny = u.scout.cands.filter(() => rollShiny(SHINY_SCOUT));
  u.counts.rerolls = (u.counts.rerolls || 0) + 1;
  return { ok: true };
}
function scoutPick(u, species, pay) {
  const st = scoutState(u);
  if (!st.cands?.includes(species)) return { error: '스카우트 후보가 아니에요.' };
  if (pay === 'ticket') { if (u.tickets < 1) return { error: '골목몬 입수권이 없어요.' }; u.tickets--; }
  else { if (u.gp < SCOUT_GP) return { error: `GP가 모자라요. (${SCOUT_GP}GP 필요)` }; u.gp -= SCOUT_GP; }
  const m = addMon(u, species, null, (u.scout.shiny || []).includes(species));
  u.scout = { next: Date.now() + SCOUT_HOURS * HOUR, cands: null };
  u.counts.scouts++;
  bump(u, 'scout');
  return { mon: m };
}

/* ---------- 기술 바꾸기, 메가스톤 사기 ---------- */
/* ---------- 강화: 같은 골목몬을 먹여 +1 (최대 +5), +1마다 능력치 4% ---------- */
const PLUS_MAX = 5, PLUS_PCT = 0.04, plusCost = (n) => (n + 1) * 1000;
function enhance(u, uid, food, busy) {
  const m = u.mons.find((x) => x.uid === uid), f = u.mons.find((x) => x.uid === food);
  if (!m || !f || uid === food) return { error: '강화할 골목몬과 먹일 골목몬을 다시 골라 주세요.' };
  if (m.species !== f.species) return { error: '같은 골목몬만 먹일 수 있어요.' };
  const n = m.plus || 0;
  if (n >= PLUS_MAX) return { error: `이미 최대 강화(+${PLUS_MAX})예요.` };
  if (busy.has(food)) return { error: '원정 중이거나 교환에 걸린 골목몬은 먹일 수 없어요.' };
  const cost = plusCost(n);
  if (u.gp < cost) return { error: `GP가 모자라요. (${cost.toLocaleString('ko-KR')}GP 필요)` };
  u.gp -= cost;
  u.mons = u.mons.filter((x) => x !== f);
  (u.decks || []).forEach((d) => { d.team = d.team.filter((t) => t.uid !== food); });
  require('./decks').pruneDecks(u);
  m.plus = n + 1 + Math.min(PLUS_MAX - n - 1, f.plus || 0); // 강화된 골목몬을 먹이면 그만큼 더
  const shinyMoved = f.shiny && !m.shiny; if (shinyMoved) m.shiny = true; // 이로치를 먹이면 이로치가 옮겨 붙음
  u.counts.enhance = (u.counts.enhance || 0) + 1;
  return { ok: true, plus: m.plus, shinyMoved };
}

function changeMove(u, uid, slot, move) {
  const m = u.mons.find((x) => x.uid === uid);
  if (!m) return { error: '없는 골목몬이에요.' };
  const sp = Data.MONSTERS[m.species];
  if (!sp.moves.includes(move)) return { error: '이 골목몬이 배울 수 없는 기술이에요.' };
  if (m.moves.includes(move)) return { error: '이미 쓰고 있는 기술이에요.' };
  if (!Number.isInteger(slot) || slot < 0 || slot > 3) return { error: '바꿀 칸을 골라 주세요.' };
  if (u.gp < MOVE_GP) return { error: `GP가 모자라요. (${MOVE_GP}GP 필요)` };
  u.gp -= MOVE_GP;
  if (slot >= m.moves.length) m.moves.push(move); else m.moves[slot] = move;
  return { mon: m };
}
function buyStone(u, species) {
  if (!Data.MONSTERS[species] || Data.BANNED.includes(species)) return { error: '살 수 없는 메가스톤이에요.' };
  if (u.stones.includes(species)) return { error: '이미 가지고 있어요.' };
  if (u.gp < STONE_GP) return { error: `GP가 모자라요. (${STONE_GP}GP 필요)` };
  u.gp -= STONE_GP; u.stones.push(species);
  return {};
}

/* ---------- 출석 ---------- */
// 보상량: GP 4배, 1시간 스킵권 5배로 올림 (2026-11-11)
const ATTEND = [{ gp: 2000 }, { skips: 25, rerolls: 2 }, { gp: 4000 }, { tickets: 1 }, { gp: 6000, rerolls: 3 }, { skips: 50 }, { tickets: 1, stones: 'random', rerolls: 5 }];
function attendState(u) {
  const today = dayKey(), yest = dayKey(Date.now() - DAY);
  const a = u.attend;
  const can = a.last !== today;
  const nextIdx = can ? (a.last === yest ? a.streak % 7 : 0) : (a.streak - 1) % 7;
  return { can, day: nextIdx, streak: a.streak, list: ATTEND };
}
function attend(u) {
  const st = attendState(u);
  if (!st.can) return { error: '오늘 출석 보상은 이미 받았어요.' };
  u.attend = { last: dayKey(), streak: st.day + 1 };
  return { got: grant(u, ATTEND[st.day]) };
}

/* ---------- 퀘스트 ---------- */
const DAILY = [
  { id: 'battle3', n: '대전 3판 하기', k: 'battle', goal: 3, r: { gp: 2000, rerolls: 1, pass: 50 } },
  { id: 'win1', n: '대전 1번 이기기', k: 'win', goal: 1, r: { skips: 15, pass: 50 } },
  { id: 'mega1', n: '메가진화 1번 하기', k: 'mega', goal: 1, r: { gp: 1200, pass: 30 } },
  { id: 'scout1', n: '스카우트로 골목몬 얻기', k: 'scout', goal: 1, r: { gp: 1200, rerolls: 2, pass: 30 } },
  { id: 'friendpvp1', n: '🤝 친구와 대전 1판', k: 'friendpvp', goal: 1, r: { gp: 1500, pass: 40 } },
];
const WEEKLY = [
  { id: 'win10', n: '대전 10번 이기기', k: 'win', goal: 10, r: { tickets: 1, rerolls: 5, pass: 150 } },
  { id: 'battle25', n: '대전 25판 하기', k: 'battle', goal: 25, r: { stones: 'random', rerolls: 5, pass: 150 } },
  { id: 'pvp3', n: '친구와 대전 3판', k: 'pvp', goal: 3, r: { gp: 12000, pass: 100 } },
  { id: 'z5', n: 'Z기술 5번 쓰기', k: 'z', goal: 5, r: { skips: 50, pass: 100 } },
  { id: 'friendtag2', n: '🤝 친구와 같은 팀으로 태그전 2번 이기기', k: 'friendtag', goal: 2, r: { tickets: 1, gp: 4000, pass: 150 } },
];
function questBook(u) {
  if (u.daily?.day !== dayKey()) u.daily = { day: dayKey(), prog: {}, done: [] };
  if (u.weekly?.week !== weekKey()) u.weekly = { week: weekKey(), prog: {}, done: [] };
  return { daily: u.daily, weekly: u.weekly };
}
function bump(u, k, n = 1) {
  const { daily, weekly } = questBook(u);
  daily.prog[k] = (daily.prog[k] || 0) + n;
  weekly.prog[k] = (weekly.prog[k] || 0) + n;
}
function questState(u) {
  const { daily, weekly } = questBook(u);
  const view = (list, book) => list.map((q) => ({ ...q, prog: Math.min(q.goal, book.prog[q.k] || 0), done: book.done.includes(q.id) }));
  return { daily: view(DAILY, daily), weekly: view(WEEKLY, weekly), dayEnds: Date.parse(`${dayKey()}T00:00:00+09:00`) + DAY, weekEnds: Date.parse(`${weekKey()}T00:00:00+09:00`) + 7 * DAY };
}
function claimQuest(u, id) {
  const { daily, weekly } = questBook(u);
  const q = DAILY.find((x) => x.id === id) ? [DAILY.find((x) => x.id === id), daily] : WEEKLY.find((x) => x.id === id) ? [WEEKLY.find((x) => x.id === id), weekly] : null;
  if (!q) return { error: '없는 퀘스트예요.' };
  const [quest, book] = q;
  if (book.done.includes(id)) return { error: '이미 받았어요.' };
  if ((book.prog[quest.k] || 0) < quest.goal) return { error: '아직 다 못 했어요.' };
  book.done.push(id);
  return { got: grant(u, quest.r) };
}

/* ---------- 업적 ---------- */
const uniqueSpecies = (u) => new Set(u.mons.map((m) => m.species)).size;
const ACH = [
  ...[[10, { gp: 8000 }], [20, { tickets: 1 }], [30, { tickets: 2, stones: 1 }], [45, { tickets: 3, stones: 2 }], [55, { tickets: 5, stones: 3 }]].map(([n, r]) => ({ id: `col${n}`, n: `골목몬 ${n}종 모으기`, val: uniqueSpecies, goal: n, r })),
  ...[[1, { gp: 2000 }], [10, { gp: 4000 }], [50, { skips: 100 }], [100, { tickets: 1 }], [300, { tickets: 2, stones: 1 }]].map(([n, r]) => ({ id: `win${n}`, n: `대전 ${n}번 이기기`, val: (u) => u.counts.wins, goal: n, r })),
  ...[[5, { stones: 1 }], [30, { tickets: 1 }]].map(([n, r]) => ({ id: `pvp${n}`, n: `친구와의 대전 ${n}번 이기기`, val: (u) => u.counts.pvpWins, goal: n, r })),
  ...[[1, { gp: 2000 }], [30, { stones: 1 }]].map(([n, r]) => ({ id: `mega${n}`, n: `메가진화 ${n}번`, val: (u) => u.stats.megas, goal: n, r })),
  ...[[1, { gp: 5000, tickets: 1 }], [5, { tickets: 3, stones: 1 }]].map(([n, r]) => ({ id: `shiny${n}`, n: `✨ 이로치 골목몬 ${n}마리 만나기`, val: (u) => u.counts.shiny || 0, goal: n, r })),
  ...[[1, { gp: 2000 }], [30, { stones: 1 }]].map(([n, r]) => ({ id: `z${n}`, n: `Z기술 ${n}번`, val: (u) => u.stats.zmoves, goal: n, r })),
  ...[[5, { tickets: 1, rerolls: 5 }], [20, { tickets: 2, rerolls: 10 }]].map(([n, r]) => ({ id: `scout${n}`, n: `스카우트 ${n}번`, val: (u) => u.counts.scouts, goal: n, r })),
  ...[[10, { rerolls: 5 }], [50, { rerolls: 15, gp: 5000 }]].map(([n, r]) => ({ id: `reroll${n}`, n: `🎲 스카우트 후보 ${n}번 다시 뽑기`, val: (u) => u.counts.rerolls || 0, goal: n, r })),
  { id: 'stone30', n: '메가스톤 30종 모으기', val: (u) => u.stones.length, goal: 30, r: { tickets: 2 } },
  { id: 'flawless1', n: '한 마리도 안 쓰러지고 이기기', val: (u) => u.stats.flawless, goal: 1, r: { gp: 4000 } },
  { id: 'dupe', n: '같은 골목몬 2마리 갖기', val: (u) => { const c = {}; for (const m of u.mons) c[m.species] = (c[m.species] || 0) + 1; return Math.max(0, ...Object.values(c)); }, goal: 2, r: { gp: 4000 } },
];
const achState = (u) => ACH.map((a) => ({ id: a.id, n: a.n, goal: a.goal, r: a.r, prog: Math.min(a.goal, a.val(u)), done: u.achieved.includes(a.id) }));
function claimAch(u, id) {
  const a = ACH.find((x) => x.id === id);
  if (!a) return { error: '없는 업적이에요.' };
  if (u.achieved.includes(id)) return { error: '이미 받았어요.' };
  if (a.val(u) < a.goal) return { error: '아직 다 못 했어요.' };
  u.achieved.push(id);
  return { got: grant(u, a.r) };
}

/* ---------- 시즌 패스 (2주마다 새 시즌) ---------- */
const SEASON_EPOCH = Date.parse('2026-11-09T00:00:00+09:00'), SEASON_LEN = 14 * DAY, PASS_LV = 30, PASS_PER = 80;
const seasonOf = (t = Date.now()) => Math.floor((t - SEASON_EPOCH) / SEASON_LEN) + 1;
const seasonEnds = (s) => SEASON_EPOCH + s * SEASON_LEN;
const freeReward = (lv) => (lv % 10 === 0 ? { tickets: 1, stones: 'random' } : lv % 5 === 0 ? { tickets: 1 } : lv % 3 === 0 ? { stones: 'random' } : lv % 2 ? { gp: 2000 } : { skips: 15, rerolls: lv % 4 === 0 ? 2 : 1 });
const premReward = (lv) => (lv % 10 === 0 ? { tickets: 2, stones: 2, gp: 12000 } : lv % 5 === 0 ? { tickets: 1, stones: 'random' } : lv % 3 === 0 ? { tickets: 1 } : lv % 2 ? { gp: 4000 } : { skips: 30, rerolls: 3, stones: lv % 4 === 0 ? 'random' : 0 });
function passBook(u) {
  const s = seasonOf();
  if (u.pass?.season !== s) u.pass = { season: s, pts: 0, free: [], prem: [], premium: !!u.premiumSeasons?.includes(s), practiceDay: '', practicePts: 0 };
  u.pass.premium = !!u.premiumSeasons?.includes(s);
  return u.pass;
}
function addPass(u, n) { const p = passBook(u); p.pts = Math.min(PASS_LV * PASS_PER, p.pts + n); }
// 대전 결과로 패스 포인트 (연습전은 하루 600점까지)
function battlePass(u, kind, won) {
  const pts = { pvp: won ? 60 : 30, tag: won ? 50 : 25, practice: won ? 30 : 15 }[kind] || 0;
  const p = passBook(u);
  if (kind === 'practice') {
    if (p.practiceDay !== dayKey()) { p.practiceDay = dayKey(); p.practicePts = 0; }
    const room = Math.max(0, 600 - p.practicePts);
    const add = Math.min(room, pts);
    p.practicePts += add; addPass(u, add);
    return add;
  }
  addPass(u, pts);
  return pts;
}
function passState(u) {
  const p = passBook(u);
  const lv = Math.floor(p.pts / PASS_PER);
  return {
    season: p.season, ends: seasonEnds(p.season), pts: p.pts, per: PASS_PER, max: PASS_LV, lv, premium: p.premium,
    levels: Array.from({ length: PASS_LV }, (_, i) => ({ lv: i + 1, free: freeReward(i + 1), prem: premReward(i + 1), freeGot: p.free.includes(i + 1), premGot: p.prem.includes(i + 1) })),
  };
}
function claimPass(u, lv, track) {
  const p = passBook(u);
  if (!Number.isInteger(lv) || lv < 1 || lv > PASS_LV) return { error: '없는 단계예요.' };
  if (Math.floor(p.pts / PASS_PER) < lv) return { error: '아직 이 단계에 못 갔어요.' };
  const list = track === 'prem' ? p.prem : p.free;
  if (track === 'prem' && !p.premium) return { error: '프리미엄 패스가 있어야 받을 수 있어요.' };
  if (list.includes(lv)) return { error: '이미 받았어요.' };
  list.push(lv);
  const r = { ...(track === 'prem' ? premReward(lv) : freeReward(lv)) };
  if (!r.stones) delete r.stones;
  return { got: grant(u, r) };
}
// 받을 수 있는 보상 개수 (로비 배지)
/* ---------- 원정: 골목몬을 보내 두면 시간이 지나 보상을 들고 와요 ---------- */
const EXPE_SLOTS = 3;
const EXPE = [ // 보상은 처음의 절반 (2026-11-14 너프)
  { id: 'cvs', n: '편의점 골목', icon: '🏪', hours: 1, like: ['elec', 'steel'], r: { gp: 600, skips: 2 }, luck: { rerolls: 0.1 } },
  { id: 'hill', n: '뒷산 약수터', icon: '⛰️', hours: 4, like: ['grass', 'earth', 'water'], r: { gp: 2500, skips: 5 }, luck: { tickets: 0.075, rerolls: 0.2 } },
  { id: 'night', n: '야시장', icon: '🏮', hours: 8, like: ['fire', 'spirit', 'poison'], r: { gp: 5000, skips: 10 }, luck: { tickets: 0.175, stones: 0.06, rerolls: 0.3 } },
  { id: 'sea', n: '바닷가 방파제', icon: '🌊', hours: 12, like: ['water', 'ice', 'wind'], r: { gp: 8000, skips: 15 }, luck: { tickets: 0.5, stones: 0.125, gpt: 0.15, rerolls: 0.4 } },
];
const expeOf = (u) => (u.expe ||= []);
const awayUids = (u) => new Set(expeOf(u).map((e) => e.uid));
function expeBonus(u, e) { const m = u.mons.find((x) => x.uid === e.uid), d = EXPE.find((x) => x.id === e.dest); if (!m || !d) return 1; const sp = Data.MONSTERS[m.species]; return (sp.types.some((t) => d.like.includes(t)) ? 1.5 : 1) * (m.shiny ? 1.2 : 1); }
function expeState(u, now = Date.now()) {
  return { slots: EXPE_SLOTS, dests: EXPE.map(({ id, n, icon, hours, like, r, luck }) => ({ id, n, icon, hours, like, r, luck })),
    list: expeOf(u).map((e) => ({ ...e, done: now >= e.end, left: Math.max(0, e.end - now), bonus: expeBonus(u, e) })) };
}
function expeSend(u, uid, dest, inDeck) {
  const d = EXPE.find((x) => x.id === dest), m = u.mons.find((x) => x.uid === uid);
  if (!d || !m) return { error: '골목몬과 원정지를 다시 골라 주세요.' };
  if (expeOf(u).length >= EXPE_SLOTS) return { error: `원정은 동시에 ${EXPE_SLOTS}마리까지예요.` };
  if (awayUids(u).has(uid)) return { error: '이미 원정 중인 골목몬이에요.' };
  if (inDeck.has(uid)) return { error: '지금 쓰는 덱에 있는 골목몬은 보낼 수 없어요. 다른 덱으로 바꾸거나 다른 골목몬을 골라 주세요.' };
  const now = Date.now();
  expeOf(u).push({ uid, species: m.species, dest, start: now, end: now + d.hours * HOUR });
  return { ok: true };
}
function expeClaim(u, uid) {
  const list = expeOf(u), now = Date.now(), all = uid === 'all';
  const ready = list.filter((e) => now >= e.end && (all || e.uid === uid));
  if (!ready.length) return { error: '아직 돌아온 골목몬이 없어요.' };
  const got = [];
  for (const e of ready) {
    const d = EXPE.find((x) => x.id === e.dest), k = expeBonus(u, e), r = {};
    for (const [key, v] of Object.entries(d.r)) r[key] = key === 'tickets' ? v : Math.round(v * k);
    for (const [key, p] of Object.entries(d.luck)) if (Math.random() < p * k) r[key] = (key === 'gpt' ? 100 : 1) + (r[key] || 0);
    got.push(...grant(u, r));
    u.counts.expe = (u.counts.expe || 0) + 1;
  }
  u.expe = list.filter((e) => !ready.includes(e));
  const sum = []; for (const x of got) { const s = sum.find((y) => y.k === x.k && !x.id && !y.id); if (s) s.n += x.n; else sum.push({ ...x }); }
  return { ok: true, got: sum, n: ready.length };
}
function expeRecall(u, uid) { const before = expeOf(u).length; u.expe = expeOf(u).filter((e) => e.uid !== uid); return before === u.expe.length ? { error: '원정 중이 아니에요.' } : { ok: true }; }

function claimable(u) {
  const q = questState(u), a = achState(u), ps = passState(u);
  return {
    attend: attendState(u).can ? 1 : 0,
    quest: [...q.daily, ...q.weekly].filter((x) => !x.done && x.prog >= x.goal).length,
    ach: a.filter((x) => !x.done && x.prog >= x.goal).length,
    pass: ps.levels.filter((l) => l.lv <= ps.lv && (!l.freeGot || (ps.premium && !l.premGot))).length,
    expe: expeOf(u).filter((e) => Date.now() >= e.end).length,
  };
}

// 대전이 끝났을 때 (훈련장 제외)
function afterBattle(u, kind, won, side) {
  u.counts.games++;
  if (won) u.counts.wins++;
  if (won && kind === 'pvp') u.counts.pvpWins++;
  bump(u, 'battle');
  if (won) bump(u, 'win');
  if (kind === 'pvp') bump(u, 'pvp');
  if (side?.megaUsed) bump(u, 'mega');
  if (side?.zUsed) bump(u, 'z');
  return battlePass(u, kind, won);
}

module.exports = {
  SCOUT_HOURS, SKIP_GP, SCOUT_GP, STONE_GP, STONE_DUPE_GP, MOVE_GP, STARTERS, TUTORIAL_REWARD, ATTEND, DAILY, WEEKLY,
  newProgress, addMon, grant, finishTutorial, scoutState, scoutSkip, scoutReroll, enhance, PLUS_MAX, PLUS_PCT, plusCost, expeState, expeSend, expeClaim, expeRecall, awayUids, scoutPick, changeMove, buyStone,
  bump, attendState, attend, questState, claimQuest, achState, claimAch, passState, claimPass, claimable, afterBattle, seasonOf, passBook, dayKey, released,
};
