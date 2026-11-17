'use strict';
// 새 모드: 체육관 도전 · 골목 탈출(기록 스토리) · 월드 보스 · 친밀도 · 오늘의 퍼즐과 미션 · 메타배틀
const Data = require('./data');
const E = require('./engine');

let db = null, H = null; // H: grant, sendMail, sysChat, keyOf
function init(_db, helpers) { db = _db; H = helpers; db.modes ||= {}; }
const err = (error) => ({ error });
const KST = 9 * 3600e3, DAY = 864e5;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
const weekKey = (t = Date.now()) => { const d = new Date(t + KST); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }; // 월요일 기준
const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const pool = () => Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id) && id !== 'deungsin');
const total = (id) => Object.values(Data.MONSTERS[id].base).reduce((a, b) => a + b, 0);
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const spec = (sp, foe = [], extra = {}) => ({ species: sp, moves: E.smartMoves(sp, foe.map((f) => Data.MONSTERS[f.species || f].types)), ...extra });
const TN = (t) => Data.TYPES[t]?.n || t;

/* ===================== 1. 체육관 도전 ===================== */
const GYMS = [
  { id: 'grass', leader: '새싹 관장 푸름', icon: '🌿', badge: '새싹 배지', level: 1, plus: 0, rule: { side: [null, { types: { grass: 1.2 } }] }, rd: '관장 쪽 풀 기술이 1.2배', line: '풀은 밟혀도 다시 일어나! 너도 그럴 수 있어?' },
  { id: 'water', leader: '물살 관장 소나', icon: '💧', badge: '물방울 배지', level: 1, plus: 0, rule: { weather: 'rain' }, rd: '내내 소나기', line: '비 오는 날 골목은 내 무대야.' },
  { id: 'fire', leader: '불꽃 관장 화끈', icon: '🔥', badge: '불꽃 배지', level: 1, plus: 1, rule: { weather: 'sun' }, rd: '내내 땡볕', line: '뜨겁게 붙어 보자고!' },
  { id: 'elec', leader: '번개 관장 찌릿', icon: '⚡', badge: '번개 배지', level: 2, plus: 1, rule: { side: [null, { spe: 1.2 }] }, rd: '관장 쪽 스피드 1.2배', line: '내 속도를 따라올 수 있을까?' },
  { id: 'ice', leader: '얼음 관장 서리', icon: '❄️', badge: '눈꽃 배지', level: 2, plus: 2, rule: { weather: 'snow' }, rd: '내내 눈', line: '차갑게 식혀 줄게.' },
  { id: 'earth', leader: '대지 관장 바위', icon: '⛰️', badge: '바위 배지', level: 2, plus: 2, rule: { weather: 'dust', side: [null, { guard: 0.9 }] }, rd: '내내 황사, 관장 쪽 받는 피해 -10%', line: '골목의 땅은 단단하지.' },
  { id: 'spirit', leader: '혼령 관장 으스', icon: '👻', badge: '혼불 배지', level: 3, plus: 3, rule: { side: [null, { critMul: 1.5 }] }, rd: '관장 쪽 급소 피해 ×1.5', line: '밤의 골목에서… 길을 잃지 마.' },
  { id: 'steel', leader: '강철 관장 무쇠', icon: '⚙️', badge: '강철 배지', level: 3, plus: 4, rule: { side: [null, { guard: 0.85 }] }, rd: '관장 쪽 받는 피해 -15%', line: '마지막 관문이다. 부숴 봐!' },
];
const CHAMP = { id: 'champ', leader: '골목 챔피언 대장', icon: '👑', badge: '챔피언 트로피', level: 3, plus: 5, size: 6, rule: {}, rd: '6대6, 챔피언 덱 강화 +5', line: '배지 8개를 모았다고? 좋아, 진짜 골목대장을 보여 주지.' };
const GYM_R = (i) => ({ gp: 3000 + i * 1000, ...(i % 2 ? { tickets: 1 } : { rerolls: 2 }) });
const CHAMP_R = { gp: 30000, tickets: 3, stones: 2, rerolls: 10 };
const gymBook = (u) => (u.gym ||= { badges: [], champ: 0 });
function gymFoe(g, enemy) {
  if (g.id === 'champ') return E.botTeam(3, 6, enemy).map((m) => ({ ...m, plus: g.plus }));
  const list = pool().filter((id) => Data.MONSTERS[id].types.includes(g.id)).sort((a, b) => total(b) - total(a));
  const pick = shuffle(list.slice(0, 6)).slice(0, 3);
  while (pick.length < 3) pick.push(shuffle(pool())[0]);
  return pick.map((sp) => spec(sp, enemy, g.plus ? { plus: g.plus } : {}));
}
function gymView(u) {
  const b = gymBook(u);
  return { gyms: [...GYMS, CHAMP].map((g, i) => ({ id: g.id, leader: g.leader, icon: g.icon, badge: g.badge, type: g.id === 'champ' ? null : g.id, typeN: g.id === 'champ' ? '모든 타입' : TN(g.id), rd: g.rd, line: g.line, size: g.size || 3,
    open: i === 0 || b.badges.includes((GYMS[i - 1] || {}).id) || (g.id === 'champ' && b.badges.length >= GYMS.length), done: g.id === 'champ' ? b.champ > 0 : b.badges.includes(g.id), reward: g.id === 'champ' ? CHAMP_R : GYM_R(i) })), champ: b.champ };
}

/* ===================== 2. 골목 탈출: 빌린 골목몬으로 층을 오르며 기록을 세우는 스토리 ===================== */
const STORY = [
  '해가 진 골목. 집에 가는 길이 이상하게 길다. 가로등 아래 낯선 골목몬 셋이 따라온다.',
  '전봇대 전단지가 바람에 날린다. 「이 골목에서 나가고 싶다면, 끝까지 이겨라.」',
  '편의점 불빛이 깜빡인다. 계산대 뒤에서 누군가 웃는다.',
  '같은 갈림길을 세 번째 지난다. 벽의 낙서가 조금씩 바뀌어 있다.',
  '⚠️ 골목 지킴이가 길을 막았다! 「여기서부턴 못 지나가!」',
  '지킴이를 넘자 골목이 비틀린다. 계단이 아래로도 위로도 이어진다.',
  '빨랫줄에 걸린 옷들이 손을 흔든다. 모른 척 지나간다.',
  '포장마차 아주머니가 국물을 건넨다. 「아직 반도 안 왔어.」',
  '고양이 한 마리가 길을 알려 주듯 앞서 걷는다.',
  '⚠️ 시장 골목의 주인이 나타났다! 「장 볼 시간은 끝났단다.」',
  '시장을 빠져나오자 하늘이 보랏빛이다. 시계가 거꾸로 돈다.',
  '지붕 위로 길이 이어진다. 멀리 진짜 집 불빛이 보이는 것 같다.',
  '비가 오기 시작한다. 우산 없는 골목몬들이 내 뒤로 숨는다.',
  '굴다리 아래, 내 이름을 부르는 목소리가 울린다.',
  '⚠️ 굴다리의 그림자가 일어섰다! 「돌아갈 곳은 없어.」',
  '그림자를 걷어 내자 골목에 아침 냄새가 난다. 조금만 더.',
  '익숙한 놀이터. 어릴 적 묻어 둔 구슬이 반짝인다.',
  '골목 끝이 보인다. 하지만 길이 자꾸 멀어진다.',
  '함께 온 골목몬들이 내 손을 잡는다. 같이 나가자.',
  '⚠️ 골목의 끝을 지키는 「골목 그 자체」가 깨어났다!',
];
const STORY_AFTER = '골목을 빠져나왔다…? 아니, 또 다른 골목이다. 끝없는 골목에서 기록은 계속된다.';
const RELICS = [
  { id: 'fang', n: '날카로운 송곳니', icon: '🦷', d: '내 공격 피해 +15%', fx: { all: 1.15 } },
  { id: 'shell', n: '단단한 껍데기', icon: '🐚', d: '받는 피해 -15%', fx: { guard: 0.85 } },
  { id: 'shoes', n: '바람 운동화', icon: '👟', d: '스피드 +20%', fx: { spe: 1.2 } },
  { id: 'heart', n: '커다란 심장', icon: '❤️', d: '체력 +25%', fx: { hp: 1.25 } },
  { id: 'coin', n: '행운의 동전', icon: '🪙', d: '급소 피해 ×1.5', fx: { critMul: 1.5 } },
  { id: 'hammer', n: '대장간 망치', icon: '🔨', d: '내 팀 모두 강화 +1', fx: { plus: 1 } },
  ...['fire', 'water', 'grass', 'elec', 'spirit', 'ice', 'earth', 'fairy'].map((t) => ({ id: `amu-${t}`, n: `${TN(t)} 부적`, icon: '🧿', d: `${TN(t)} 기술 피해 +40%`, fx: { types: { [t]: 1.4 } } })),
];
const ROGUE_DAILY_WINS = 25, ROGUE_WIN_GP = 300;
const rogueOf = (u) => u.rogue || null;
function rogueRules(run) {
  const me = { all: 1, guard: 1, spe: 1, critMul: 1, types: {} }; let hp = 1;
  for (const id of run.relics) { const f = RELICS.find((r) => r.id === id)?.fx || {};
    if (f.all) me.all *= f.all; if (f.guard) me.guard *= f.guard; if (f.spe) me.spe *= f.spe; if (f.critMul) me.critMul *= f.critMul; if (f.hp) hp *= f.hp;
    for (const [t, v] of Object.entries(f.types || {})) me.types[t] = (me.types[t] || 1) * v; }
  const boss = run.floor % 5 === 0;
  return { side: [me, boss ? { all: 1 + Math.floor(run.floor / 5) * 0.08 } : null], sideHp: [hp, boss ? 1.3 : 1] };
}
const rogueBook = (u) => { const d = dayKey(); if (u.rogueDay?.day !== d) u.rogueDay = { day: d, wins: 0 }; return u.rogueDay; };
function rogueView(u) {
  const run = rogueOf(u), top = (db.modes.rogueTop || []).slice(0, 10);
  return { run: run && { ...run, story: STORY[run.floor - 1] || STORY_AFTER, relicsFull: run.relics.map((id) => RELICS.find((r) => r.id === id)).filter(Boolean), boss: run.floor % 5 === 0 },
    best: u.rogueBest || 0, top, story: STORY.length, todayWins: rogueBook(u).wins, dailyWins: ROGUE_DAILY_WINS, relics: RELICS.length };
}
function rogueStart(u) {
  if (rogueOf(u)?.alive) return err('진행 중인 탈출이 있어요.');
  const ids = shuffle(pool());
  u.rogue = { alive: false, floor: 1, relics: [], team: null, offer: [0, 1, 2].map((i) => ids.slice(i * 3, i * 3 + 3).map((sp) => spec(sp))), relicOffer: null, at: Date.now() };
  return { rogue: rogueView(u) };
}
function roguePickTeam(u, i) {
  const r = rogueOf(u); if (!r || r.alive || !r.offer?.[i]) return err('먼저 탈출을 시작해 주세요.');
  r.team = r.offer[i]; r.offer = null; r.alive = true;
  return { rogue: rogueView(u) };
}
function roguePickRelic(u, id) {
  const r = rogueOf(u); if (!r?.alive || !r.relicOffer?.includes(id)) return err('고를 수 있는 유물이 아니에요.');
  r.relics.push(id); r.relicOffer = null;
  if (id === 'hammer') r.team = r.team.map((m) => ({ ...m, plus: Math.min(5, (m.plus || 0) + 1) }));
  return { rogue: rogueView(u) };
}
function rogueQuit(u) { const r = rogueOf(u); if (!r) return err('진행 중인 탈출이 없어요.'); endRun(u, r); return { rogue: rogueView(u) }; }
function endRun(u, r) {
  const rec = r.floor - 1;
  if (rec > (u.rogueBest || 0)) u.rogueBest = rec;
  if (rec > 0) {
    const top = (db.modes.rogueTop ||= []); top.push({ name: u.name, floor: rec, relics: r.relics.length, team: r.team.map((m) => m.species), at: Date.now() });
    top.sort((a, b) => b.floor - a.floor || a.at - b.at); db.modes.rogueTop = top.slice(0, 30);
  }
  u.rogue = null;
  return rec;
}

/* ===================== 3. 월드 보스: 서버 모두가 한 주 동안 체력을 함께 깎음 ===================== */
const WB_HP = 300000, WB_DAILY = 3, WB_MUL = 40, WB_LIMIT = 10;
const WB_KILL_R = { gp: 15000, tickets: 2, stones: 1, rerolls: 5 }, WB_TOP_R = [{ gp: 30000, tickets: 3, stones: 2 }, { gp: 20000, tickets: 2, stones: 1 }, { gp: 10000, tickets: 1 }];
function wbState() {
  const wk = weekKey(), s = db.modes.wb;
  if (!s || s.week !== wk) {
    if (s) settleWb(s);
    const ids = pool(); const species = ids[hash(wk) % ids.length];
    db.modes.wb = { week: wk, species, hp: WB_HP, max: WB_HP, dmg: {}, names: {}, killed: 0 };
  }
  return db.modes.wb;
}
function settleWb(s) { // 지난주 피해량 1~3위 보상 (지갑 + 우편 알림)
  Object.entries(s.dmg).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([k, d], i) => {
    const u = db.users[k]; if (!u) return;
    H.grant(u, WB_TOP_R[i]);
    H.sendMail(u, { from: '월드 보스', title: `🌍 지난주 월드 보스 피해량 ${i + 1}위!`, body: `지난주 거다이 ${Data.MONSTERS[s.species].n}에게 ${d.toLocaleString('ko-KR')} 피해를 줬어요. 순위 보상은 지갑에 들어갔어요.`, reward: [] });
  });
}
const wbBook = (u) => { const d = dayKey(); if (u.wbDay?.day !== d) u.wbDay = { day: d, n: 0 }; return u.wbDay; };
function wbView(u, key) {
  const s = wbState(), sp = Data.MONSTERS[s.species];
  const rank = Object.entries(s.dmg).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, d]) => ({ name: s.names[k] || '?', dmg: d, me: k === key }));
  return { species: s.species, name: `거다이 ${sp.n}`, gname: Data.GMAX_MOVES[s.species] || '', hp: s.hp, max: s.max, killed: s.killed, mine: s.dmg[key] || 0, rank, left: Math.max(0, WB_DAILY - wbBook(u).n), daily: WB_DAILY, limit: WB_LIMIT, killR: WB_KILL_R, topR: WB_TOP_R, ends: Date.parse(`${s.week}T00:00:00+09:00`) + 7 * DAY };
}

/* ===================== 4. 친밀도 ===================== */
const AFF_PET = 4, AFF_SNACK = 10, SNACK_GP = 300, SNACK_DAY = 3;
const PET_LINES = ['꼬리를 살랑살랑 흔들어요!', '기분 좋은지 눈을 감아요.', '손에 머리를 부벼요.', '깡총 뛰어올라요!', '부끄러운지 고개를 돌려요.', '「또 해 줘!」 하는 눈빛이에요.'];
const monOf = (u, uid) => u.mons.find((m) => m.uid === uid);
function petBook(m) { const d = dayKey(); if (m.petDay !== d) { m.petDay = d; m.petN = 0; m.snackN = 0; } }
function pet(u, uid) {
  const m = monOf(u, uid); if (!m) return err('골목몬을 찾지 못했어요.');
  petBook(m); if (m.petN >= 1) return err('오늘은 이미 쓰다듬었어요. 내일 또 해 주세요!');
  m.petN++; m.aff = Math.min(100, (m.aff || 0) + AFF_PET);
  return { ok: true, aff: m.aff, line: PET_LINES[Math.floor(Math.random() * PET_LINES.length)] };
}
function snack(u, uid) {
  const m = monOf(u, uid); if (!m) return err('골목몬을 찾지 못했어요.');
  petBook(m); if (m.snackN >= SNACK_DAY) return err(`간식은 하루 ${SNACK_DAY}번까지예요.`);
  if ((m.aff || 0) >= 100) return err('친밀도가 이미 최대예요! 💗');
  if (u.gp < SNACK_GP) return err('GP가 모자라요.');
  u.gp -= SNACK_GP; m.snackN++; m.aff = Math.min(100, (m.aff || 0) + AFF_SNACK);
  return { ok: true, aff: m.aff, line: '냠냠! 맛있게 먹었어요.' };
}

/* ===================== 6. 오늘의 퍼즐과 미션 ===================== */
// 퍼즐: 정해진 골목몬·체력으로 N턴 안에 이기기. (모두 봇 대 봇으로 풀리는 걸 확인함)
const PUZZLES = [
  { id: 'p1', n: '상성 한 방', d: '풀 타입 콩시루의 체력이 조금 남았어요. 딱 1턴 안에 이겨요!', turns: 1, my: [{ species: 'yeontan', moves: ['tackle', 'quake', 'coalhead', 'guard'] }], foe: [{ species: 'kongsiru', moves: ['tackle'], hpPct: 40 }] },
  { id: 'p2', n: '먼저 치는 자가 이긴다', d: '내 까모는 체력이 얼마 없고, 상대가 훨씬 빨라요(스피드 2배). 1턴 안에 이겨요!', turns: 1, rules: { side: [null, { spe: 2 }] }, my: [{ species: 'kkamo', moves: ['club', 'ambush', 'gust', 'guard'], hpPct: 20 }], foe: [{ species: 'horong', moves: ['club'], hpPct: 45 }] },
  { id: 'p3', n: '두 마리 연속', d: '상대 둘 다 체력이 조금 남았어요. 2턴 안에 둘 다 쓰러뜨려요!', turns: 2, my: [{ species: 'kkamo', moves: ['club', 'ambush', 'windcut', 'guard'] }], foe: [{ species: 'bungbbang', moves: ['tackle'], hpPct: 30 }, { species: 'hotteok', moves: ['tackle'], hpPct: 30 }] },
  { id: 'p4', n: '빗속의 여우', d: '소나기가 내려요. 빗나가면 끝! 1턴 안에 이겨요.', turns: 1, rules: { weather: 'rain' }, my: [{ species: 'yeoubi', moves: ['foxrain', 'hose', 'tackle', 'guard'] }], foe: [{ species: 'maetdol', moves: ['tackle'], hpPct: 65 }] },
  { id: 'p5', n: '느림보의 반격', d: '이번 판은 느린 쪽이 먼저 움직여요! 맷돌이는 체력이 거의 없어요. 1턴 안에 이겨요.', turns: 1, rules: { slowFirst: true }, my: [{ species: 'maetdol', moves: ['tackle', 'rockthrow', 'quake', 'guard'], hpPct: 15 }], foe: [{ species: 'horong', moves: ['ember'], hpPct: 55 }] },
];
const MISSIONS = [
  ...['fire', 'water', 'grass', 'elec', 'spirit', 'earth'].map((t) => ({ id: `mono-${t}`, n: `${TN(t)} 타입만으로 이기기`, d: `출전한 골목몬이 모두 ${TN(t)} 타입인 덱으로 3대3 이상 이기기`, test: (c) => c.won && c.size >= 3 && c.mons.every((m) => Data.MONSTERS[m.species].types.includes(t)) })),
  { id: 'triple', n: '한 마리로 3킬', d: '한 골목몬으로 상대 3마리를 쓰러뜨리기', test: (c) => c.mons.some((m) => (m.kills || 0) >= 3) },
  { id: 'pure', n: '맨몸 승부', d: '메가진화·Z기술·거다이맥스를 하나도 안 쓰고 3대3 이상 이기기', test: (c) => c.won && c.size >= 3 && !c.mega && !c.z && !c.gmax },
  { id: 'fast', n: '번개 같은 승리', d: '6턴 안에 3대3 이상 이기기', test: (c) => c.won && c.size >= 3 && c.turns <= 7 },
  { id: 'flawless', n: '완벽한 승리', d: '한 마리도 쓰러지지 않고 3대3 이상 이기기', test: (c) => c.won && c.size >= 3 && c.mons.every((m) => m.hp > 0) },
  { id: 'shiny', n: '반짝이는 결정타', d: '이로치 골목몬으로 상대를 쓰러뜨리기', test: (c) => c.mons.some((m) => m.shiny && (m.kills || 0) > 0) },
  { id: 'zwin', n: 'Z로 끝내기', d: 'Z기술을 쓰고 이기기', test: (c) => c.won && c.z },
  { id: 'gwin', n: '거대한 승리', d: '거다이맥스하고 이기기', test: (c) => c.won && c.gmax },
  { id: 'underdog', n: '약자의 반란', d: '능력치 합 490 이하 골목몬만으로 3대3 이상 이기기', test: (c) => c.won && c.size >= 3 && c.mons.every((m) => total(m.species) <= 490) },
  { id: 'solo', n: '진검승부', d: '1대1에서 이기기', test: (c) => c.won && c.size === 1 },
];
const MISSION_R = { gp: 1500, rerolls: 1 }, MISSION_ALL_R = { tickets: 1, gp: 2000 }, PUZZLE_R = { gp: 3000, rerolls: 2 };
const todayPuzzle = () => PUZZLES[hash(dayKey()) % PUZZLES.length];
const todayMissions = () => { const h = hash(`m${dayKey()}`), ids = [...MISSIONS]; const out = []; let x = h; while (out.length < 3) { const i = x % ids.length; out.push(ids.splice(i, 1)[0]); x = hash(x); } return out; };
const missionBook = (u) => { const d = dayKey(); if (u.mis?.day !== d) u.mis = { day: d, done: [], claimed: [], all: false, puzzle: false }; return u.mis; };
function missionView(u) {
  const b = missionBook(u), p = todayPuzzle();
  return { puzzle: { id: p.id, n: p.n, d: p.d, turns: p.turns, my: p.my, foe: p.foe, rules: p.rules || null, solved: b.puzzle, reward: PUZZLE_R },
    missions: todayMissions().map((m) => ({ id: m.id, n: m.n, d: m.d, done: b.done.includes(m.id), claimed: b.claimed.includes(m.id) })), reward: MISSION_R, allReward: MISSION_ALL_R, all: b.all };
}
function missionClaim(u, id) {
  const b = missionBook(u);
  if (id === 'all') { if (b.all || todayMissions().some((m) => !b.claimed.includes(m.id))) return err('세 미션을 모두 받아야 해요.'); b.all = true; return { got: H.grant(u, MISSION_ALL_R), missions: missionView(u) }; }
  if (!todayMissions().some((m) => m.id === id) || !b.done.includes(id)) return err('아직 깨지 않은 미션이에요.');
  if (b.claimed.includes(id)) return err('이미 받았어요.');
  b.claimed.push(id); return { got: H.grant(u, MISSION_R), missions: missionView(u) };
}

/* ===================== 7. 메타배틀: 주마다 바뀌는 특별 규칙으로 따로 겨루는 대전 ===================== */
const METAS = [
  { id: 'inverse', n: '뒤집힌 상성', icon: '🔄', d: '타입 상성이 전부 반대! 효과가 굉장하던 기술은 별로, 안 통하던 기술은 2배.', rules: { inverse: true } },
  { id: 'slow', n: '느림보 골목', icon: '🐢', d: '느린 골목몬이 먼저 움직여요.', rules: { slowFirst: true } },
  { id: 'sure', n: '백발백중', icon: '🎯', d: '모든 기술이 반드시 맞아요.', rules: { sureHit: true } },
  { id: 'giant', n: '거인의 골목', icon: '🗿', d: '모든 골목몬 체력 2배. 길고 묵직한 싸움!', rules: { hpMul: 2 } },
  { id: 'bare', n: '맨손 골목', icon: '✊', d: '도구·메가진화·Z기술·거다이맥스 모두 금지.', rules: { noItems: true, noMega: true, noZ: true, noGmax: true } },
  { id: 'storm', n: '끝나지 않는 장마', icon: '⛈️', d: '내내 소나기, 전기 기술 1.3배.', rules: { weather: 'rain', typeMul: { elec: 1.3 } } },
  { id: 'heat', n: '불볕더위', icon: '🥵', d: '내내 땡볕, 불 기술 1.2배·얼음 기술 0.7배.', rules: { weather: 'sun', typeMul: { fire: 1.2, ice: 0.7 } } },
  { id: 'glass', n: '유리대포', icon: '💥', d: '모든 골목몬 체력 절반. 먼저 때리는 쪽이 이긴다!', rules: { hpMul: 0.5 } },
];
const META_DAILY = 5, META_WIN_R = { gp: 800 }, META_TOP_R = [{ gp: 20000, tickets: 2, stones: 1 }, { gp: 12000, tickets: 1 }, { gp: 6000, rerolls: 5 }];
function metaState() {
  const wk = weekKey(), s = db.modes.meta;
  if (!s || s.week !== wk) {
    if (s) Object.entries(s.pts).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([k, p], i) => { const u = db.users[k]; if (!u) return; H.grant(u, META_TOP_R[i]); H.sendMail(u, { from: '메타배틀', title: `🧪 지난주 메타배틀 ${i + 1}위!`, body: `지난주 「${METAS.find((m) => m.id === s.rule)?.n}」에서 ${p}점으로 ${i + 1}위를 했어요. 순위 보상은 지갑에 들어갔어요.`, reward: [] }); });
    db.modes.meta = { week: wk, rule: METAS[hash(`meta${wk}`) % METAS.length].id, pts: {}, names: {} };
  }
  return db.modes.meta;
}
const metaRule = () => METAS.find((m) => m.id === metaState().rule);
const metaBook = (u) => { const d = dayKey(); if (u.metaDay?.day !== d) u.metaDay = { day: d, wins: 0 }; return u.metaDay; };
function metaView(u, key) {
  const s = metaState(), r = metaRule();
  return { rule: { id: r.id, n: r.n, icon: r.icon, d: r.d }, all: METAS.map((m) => ({ id: m.id, n: m.n, icon: m.icon })), pts: s.pts[key] || 0,
    rank: Object.entries(s.pts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, p]) => ({ name: s.names[k] || '?', pts: p, me: k === key })),
    todayWins: metaBook(u).wins, daily: META_DAILY, winR: META_WIN_R, topR: META_TOP_R, ends: Date.parse(`${s.week}T00:00:00+09:00`) + 7 * DAY };
}

/* ===================== 대전 만들기 / 결과 ===================== */
// kind: gym(arg=체육관 id) · rogue · wb · puzzle · meta(arg=골목대장 수준)
function battle(u, kind, arg, myTeam) {
  if (kind === 'gym') {
    const v = gymView(u), g = [...GYMS, CHAMP].find((x) => x.id === arg), gv = v.gyms.find((x) => x.id === arg);
    if (!g || !gv?.open) return err('아직 도전할 수 없는 체육관이에요.');
    const size = g.size || 3, team = myTeam.slice(0, size);
    if (team.length < size) return err(`덱에 골목몬이 ${size}마리 있어야 해요.`);
    return { size, level: g.level, team, foe: { name: `${g.icon} ${g.leader}`, deck: g.id === 'champ' ? '챔피언 덱' : `${TN(g.id)} 체육관`, team: gymFoe(g, team) }, rules: g.rule, mode: { kind, id: g.id }, intro: `「${g.line}」` };
  }
  if (kind === 'rogue') {
    const r = rogueOf(u);
    if (!r?.alive) return err('먼저 탈출을 시작하고 골목몬을 골라 주세요.');
    if (r.relicOffer) return err('먼저 유물을 골라 주세요.');
    const boss = r.floor % 5 === 0, lv = r.floor <= 3 ? 1 : r.floor <= 9 ? 2 : 3, plus = Math.min(5, Math.floor(r.floor / 4) + (boss ? 1 : 0));
    const foe = E.botTeam(lv, 3, r.team).map((m) => ({ ...m, ...(plus ? { plus } : {}) }));
    return { size: 3, level: lv, team: r.team, foe: { name: boss ? `⚠️ ${r.floor}층 골목 보스` : `${r.floor}층 골목몬`, deck: '골목 탈출', team: foe }, rules: rogueRules(r), mode: { kind, floor: r.floor }, intro: STORY[r.floor - 1] || STORY_AFTER };
  }
  if (kind === 'wb') {
    const s = wbState();
    if (s.hp <= 0) return err('이번 주 월드 보스는 이미 쓰러졌어요! 다음 주를 기다려요.');
    if (wbBook(u).n >= WB_DAILY) return err(`월드 보스는 하루 ${WB_DAILY}번까지 도전할 수 있어요.`);
    const team = myTeam.slice(0, 3); if (team.length < 3) return err('덱에 골목몬이 3마리 있어야 해요.');
    return { size: 3, level: 2, team, raid: { gmax: true, hpMul: WB_MUL, limit: WB_LIMIT, shock: 0.08, title: '월드 보스' }, foe: { name: `🌍 거다이 ${Data.MONSTERS[s.species].n}`, deck: '월드 보스', team: [{ species: s.species, moves: E.smartMoves(s.species, []), plus: 5 }] }, mode: { kind } };
  }
  if (kind === 'puzzle') {
    const p = todayPuzzle();
    return { size: p.my.length, level: 2, team: p.my.map((m) => ({ ...m })), foe: { name: '🧩 퍼즐 골목대장', deck: p.n, team: p.foe.map((m) => ({ ...m })) }, rules: { noMega: true, noZ: true, noGmax: true, ...(p.rules || {}) }, mode: { kind, id: p.id, turns: p.turns }, noStones: true, intro: `🧩 ${p.n}: ${p.d}` };
  }
  if (kind === 'meta') {
    const lv = [1, 2, 3].includes(arg) ? arg : 2, team = myTeam.slice(0, 3);
    if (team.length < 3) return err('덱에 골목몬이 3마리 있어야 해요.');
    const r = metaRule();
    return { size: 3, level: lv, team, foe: { name: `${r.icon} 메타 골목대장`, deck: r.n, team: E.botTeam(lv, 3, team) }, rules: r.rules, mode: { kind, rule: r.id, bot: lv }, intro: `${r.icon} 이번 주 메타: ${r.n} — ${r.d}` };
  }
  return err('없는 모드예요.');
}
// 대전이 끝나면: 모드 보상 + (모든 대전) 친밀도·경험치·미션
function result(u, key, mode, ctx) {
  const out = [];
  if (mode?.kind === 'gym') {
    const b = gymBook(u), i = [...GYMS, CHAMP].findIndex((g) => g.id === mode.id), g = [...GYMS, CHAMP][i];
    if (ctx.won) {
      if (mode.id === 'champ') { const first = !b.champ; b.champ++; if (first) out.push({ title: '👑 골목 챔피언 등극!', got: H.grant(u, CHAMP_R), mail: { title: '👑 골목 챔피언이 되었어요!', body: '배지 8개를 모으고 골목 챔피언을 쓰러뜨렸어요! 칭호 「골목 챔피언」을 받아 가세요.', reward: ['titles:gymchamp'] } }); else out.push({ title: '👑 챔피언 방어전 승리!', got: H.grant(u, { gp: 3000 }) }); if (first) H.sysChat?.(`👑 ${u.name}님이 골목 챔피언이 되었어요!`); }
      else if (!b.badges.includes(mode.id)) { b.badges.push(mode.id); out.push({ title: `${g.icon} ${g.badge} 획득!`, got: H.grant(u, GYM_R(i)) }); }
      else out.push({ title: `${g.icon} 재도전 승리`, got: H.grant(u, { gp: 500 }) });
    }
  }
  if (mode?.kind === 'rogue') {
    const r = rogueOf(u);
    if (r?.alive && r.floor === mode.floor) {
      if (ctx.won) {
        const bk = rogueBook(u); let got = [];
        if (bk.wins < ROGUE_DAILY_WINS) { bk.wins++; got = H.grant(u, { gp: ROGUE_WIN_GP + (r.floor % 5 === 0 ? 1200 : 0), ...(r.floor % 5 === 0 ? { tickets: 1 } : {}) }); }
        if (r.floor === STORY.length && !u.rogueEscaped) { u.rogueEscaped = true; out.push({ mail: { title: '🚪 골목을 탈출했어요!', body: '20층 「골목 그 자체」를 쓰러뜨리고 골목을 빠져나왔어요. 칭호 「골목 탈출자」를 받아 가세요. (기록은 끝없는 골목에서 계속돼요!)', reward: ['titles:escapee'] } }); H.sysChat?.(`🚪 ${u.name}님이 골목 탈출에 성공했어요!`); }
        r.floor++; r.relicOffer = shuffle(RELICS).slice(0, 3).map((x) => x.id); // 같은 유물도 겹쳐서 가질 수 있어요
        out.push({ title: `🚪 ${mode.floor}층 돌파!`, got });
      } else { const rec = endRun(u, r); out.push({ title: `💀 ${mode.floor}층에서 쓰러졌어요… 기록 ${rec}층`, got: [] }); }
    }
  }
  if (mode?.kind === 'wb') {
    const s = wbState(), dmg = Math.max(0, Math.min(s.hp, ctx.bossDmg || 0)), bk = wbBook(u);
    bk.n++; s.hp -= dmg; s.dmg[key] = (s.dmg[key] || 0) + dmg; s.names[key] = u.name;
    const got = H.grant(u, { gp: Math.min(5000, 500 + Math.floor(dmg / 4)) });
    out.push({ title: `🌍 월드 보스에게 ${dmg.toLocaleString('ko-KR')} 피해! (남은 체력 ${Math.max(0, s.hp).toLocaleString('ko-KR')})`, got });
    if (s.hp <= 0 && !s.killed) {
      s.killed = Date.now(); H.sysChat?.(`🌍 월드 보스 거다이 ${Data.MONSTERS[s.species].n} 토벌 성공! 마지막 일격: ${u.name}`);
      for (const k of Object.keys(s.dmg)) { const p = db.users[k]; if (!p) continue; H.grant(p, WB_KILL_R); H.sendMail(p, { from: '월드 보스', title: '🌍 월드 보스 토벌 성공!', body: `모두 함께 거다이 ${Data.MONSTERS[s.species].n}을(를) 쓰러뜨렸어요! 토벌 보상이 지갑에 들어갔어요.`, reward: [] }); }
    }
  }
  if (mode?.kind === 'puzzle') {
    const b = missionBook(u);
    if (ctx.won && ctx.turns <= mode.turns + 1) { if (!b.puzzle) { b.puzzle = true; out.push({ title: '🧩 퍼즐 해결!', got: H.grant(u, PUZZLE_R) }); } else out.push({ title: '🧩 또 풀었어요!', got: [] }); }
    else if (ctx.won) out.push({ title: `🧩 이겼지만 ${mode.turns}턴을 넘겼어요. 다시 도전!`, got: [] });
  }
  if (mode?.kind === 'meta' || ctx.meta) {
    const s = metaState(), bk = metaBook(u);
    if (ctx.won) { const p = ctx.pvp ? 3 : 1; s.pts[key] = (s.pts[key] || 0) + p; s.names[key] = u.name; let got = []; if (bk.wins < META_DAILY) { bk.wins++; got = H.grant(u, META_WIN_R); } out.push({ title: `🧪 메타배틀 승리! +${p}점`, got }); }
  }
  // 모든 대전: 같이 이기면 친밀도 (훈련장·퍼즐·탈출(빌린 골목몬) 제외)
  if (!ctx.training && mode?.kind !== 'puzzle' && mode?.kind !== 'rogue') {
    for (const bm of ctx.mons) { const m = bm.uid && monOf(u, bm.uid); if (!m) continue;
      if (ctx.won && (m.aff || 0) < 100 && Math.random() < 0.5) m.aff = Math.min(100, (m.aff || 0) + 1); }
  }
  // 오늘의 미션 (골목대장 보통 이상 또는 친구 대전, 퍼즐·탈출 제외)
  if (!ctx.training && (ctx.pvp || (ctx.botLevel || 0) >= 1) && mode?.kind !== 'puzzle' && mode?.kind !== 'rogue') {
    const b = missionBook(u);
    for (const m of todayMissions()) if (!b.done.includes(m.id) && m.test(ctx)) { b.done.push(m.id); out.push({ toast: `🎯 미션 달성: ${m.n}! (미션 화면에서 받아요)` }); }
  }
  return out;
}

function api(route, u, key, b) {
  switch (route) {
    case 'GET /api/gym': return { gym: gymView(u) };
    case 'GET /api/rogue': return { rogue: rogueView(u) };
    case 'POST /api/rogue/start': return rogueStart(u);
    case 'POST /api/rogue/team': return roguePickTeam(u, Number(b.i));
    case 'POST /api/rogue/relic': return roguePickRelic(u, String(b.id || ''));
    case 'POST /api/rogue/quit': return rogueQuit(u);
    case 'GET /api/wb': return { wb: wbView(u, key) };
    case 'POST /api/mon/pet': return pet(u, String(b.uid || ''));
    case 'POST /api/mon/snack': return snack(u, String(b.uid || ''));
    case 'GET /api/missions': return { missions: missionView(u) };
    case 'POST /api/missions/claim': return missionClaim(u, String(b.id || ''));
    case 'GET /api/meta': return { meta: metaView(u, key) };
    default: return undefined;
  }
}
module.exports = { init, api, battle, result, PUZZLES, MISSIONS, METAS, RELICS, GYMS, CHAMP, SNACK_GP, wbState, metaRule, rogueRules };
