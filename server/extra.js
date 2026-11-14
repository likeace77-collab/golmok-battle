'use strict';
// 추가 시스템: 공지·패치노트, 관리자, 전적 통계, 도감 보상, 친구 선물, 코스튬, 기간 한정 이벤트
const Data = require('./data');

let db = null, H = null;
function init(_db, helpers) { db = _db; H = helpers; fix(); }
function fix() { db.news ||= []; }

const DAY = 864e5, KST = 9 * 3600e3;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
const err = (error) => ({ error });
const fmt = (n) => Number(n).toLocaleString('ko-KR');

/* ---------- 공지·패치노트 ---------- */
// 코드에 적어 두는 패치노트 (개발자가 화면에서 쓴 글은 db.news)
const PATCH_NOTES = [
  { id: 'p-1115b', kind: 'patch', at: Date.parse('2026-11-15T03:00:00+09:00'), title: '대형 업데이트: 토너먼트·밴픽·리플레이·코스튬·이벤트', body: '• 주간 토너먼트: 토요일 밤 9시, 신청한 사람들의 덱으로 자동 대진표 경기\n• 밴픽 대전: 친구 대전에서 서로 1마리씩 금지하고 시작\n• 리플레이: 최근 대전을 다시 보기\n• 골목몬 코스튬 13종 (왁뿌말랑왕 포함)\n• 기간 한정 이벤트 「말랑말랑 축제」: 말랑 젤리를 모아 이벤트 상점에서 교환\n• 전적 통계, 도감 수집 보상, 친구 선물(우정 포인트)\n• 푸시 알림: 스카우트 준비, 원정 귀환, 대전 신청\n• 앱 아이콘 변경' },
  { id: 'p-1115a', kind: 'patch', at: Date.parse('2026-11-15T01:30:00+09:00'), title: '저장이 되돌아가던 문제 수정', body: '• 배포할 때 데이터가 30분쯤 전으로 돌아가던 문제를 고쳤어요.\n• 길드 꾸미기: 문장 54종, 색 24종, 보조 색, 문장 모양, 배너 무늬, 길드 구호\n• 꾸미기: 배경 30종, 포즈 32종, 이펙트 16종' },
  { id: 'p-1114', kind: 'patch', at: Date.parse('2026-11-14T23:30:00+09:00'), title: '자동 리롤, 패스 보너스', body: '• 스카우트 자동 리롤: 원하는 골목몬·이로치가 나올 때까지\n• 시즌 패스를 다 채우면 100점마다 GP 보너스\n• 메가스톤은 패스 마지막 단계에서만' },
];
const newsList = () => [...db.news, ...PATCH_NOTES].sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.at - a.at).slice(0, 60);
const newsUnread = (u) => newsList().filter((n) => n.at > (u.newsSeen || 0)).length;
function newsWrite(b) {
  const title = String(b.title || '').trim().slice(0, 60), body = String(b.body || '').trim().slice(0, 3000);
  if (!title) return err('제목을 써 주세요.');
  db.news.unshift({ id: `n${Date.now().toString(36)}`, kind: b.kind === 'patch' ? 'patch' : 'notice', title, body, pin: !!b.pin, at: Date.now() });
  db.news = db.news.slice(0, 50);
  return { ok: true, list: newsList() };
}
function newsDelete(id) { const i = db.news.findIndex((n) => n.id === id); if (i < 0) return err('코드에 적힌 패치노트는 지울 수 없어요.'); db.news.splice(i, 1); return { ok: true, list: newsList() }; }

/* ---------- 관리자 ---------- */
const started = Date.now();
function dash() {
  const users = Object.values(db.users), now = Date.now();
  const active = (ms) => users.filter((u) => now - (u.lastSeen || 0) < ms).length;
  return {
    online: H.online.size, battles: H.battleCount(), users: users.length, today: active(DAY), week: active(7 * DAY),
    gist: H.gistInfo(), uptime: Math.round((now - started) / 1000), mem: Math.round(process.memoryUsage().rss / 1048576),
    gp: users.reduce((s, u) => s + (u.gp || 0), 0), guilds: Object.keys(db.guilds || {}).length,
    recent: users.filter((u) => u.lastSeen).sort((a, b) => b.lastSeen - a.lastSeen).slice(0, 12).map((u) => ({ name: u.name, at: u.lastSeen, online: H.online.has(H.keyOf(u.name)) })),
    log: (db.adminLog || []).slice(0, 30),
  };
}
function userInfo(name) {
  const u = db.users[H.keyOf(String(name || ''))];
  if (!u) return err('그런 계정이 없어요.');
  const mons = u.mons || [];
  return { info: {
    name: u.name, gp: u.gp || 0, tickets: u.tickets || 0, skips: u.skips || 0, rerolls: u.rerolls || 0, gpt: u.gpt || 0, fp: u.fp || 0, jelly: u.jelly || 0,
    stones: (u.stones || []).length, mons: mons.length, species: new Set(mons.map((m) => m.species)).size, shinies: mons.filter((m) => m.shiny).map((m) => Data.MONSTERS[m.species]?.n || m.species),
    wins: u.wins || 0, losses: u.losses || 0, rank: u.rank?.pts ?? 1000, guild: u.guild ? db.guilds?.[u.guild]?.name || '' : '', lastSeen: u.lastSeen || 0, createdAt: u.createdAt || 0,
    online: H.online.has(H.keyOf(u.name)), costumes: u.costumes || [],
  } };
}
function adminGive(by, b) {
  const u = db.users[H.keyOf(String(b.name || ''))];
  if (!u) return err('그런 계정이 없어요.');
  const n = (v, max) => Math.max(-max, Math.min(max, Math.floor(Number(v) || 0)));
  const r = {};
  for (const [k, max] of [['gp', 10000000], ['tickets', 1000], ['skips', 10000], ['rerolls', 10000], ['gpt', 100000], ['stones', 60]]) { const v = n(b.r?.[k], max); if (v) r[k] = v; }
  const take = Object.entries(r).filter(([, v]) => v < 0);
  for (const [k, v] of take) { if (k === 'stones') continue; u[k] = Math.max(0, (u[k] || 0) + v); delete r[k]; }
  if (r.stones < 0) delete r.stones;
  if (b.r?.mon && (b.r.mon === 'random' || Data.MONSTERS[b.r.mon])) { r.mon = b.r.mon; if (b.r.shiny) r.shiny = true; }
  if (b.r?.costume && COSTUMES[b.r.costume]) { (u.costumes ||= []); if (!u.costumes.includes(b.r.costume)) u.costumes.push(b.r.costume); }
  const got = Object.keys(r).length ? H.grant(u, r) : [];
  const note = String(b.note || '').slice(0, 200);
  if (b.mail !== false && (got.length || b.r?.costume)) H.sendMail(u, { from: '골목대전 운영팀', title: String(b.title || '운영팀 선물이 도착했어요').slice(0, 40), body: note || '운영팀이 선물을 보냈어요. 지갑과 내 골목몬을 확인해 보세요!' });
  if (H.online.has(H.keyOf(u.name))) { H.toast(H.keyOf(u.name), '운영팀 선물이 도착했어요!'); H.send(H.online.get(H.keyOf(u.name)), { t: 'me', user: H.publicUser(u) }); }
  (db.adminLog ||= []).unshift({ at: Date.now(), by, to: u.name, r: { ...r, ...(b.r?.costume ? { costume: b.r.costume } : {}), ...Object.fromEntries(take) }, note });
  db.adminLog = db.adminLog.slice(0, 100);
  return { ok: true, ...userInfo(u.name) };
}

/* ---------- 전적 통계 (대전이 끝날 때마다 쌓임) ---------- */
function recordBattle(u, rec) {
  const ms = (u.monStats ||= {});
  for (const m of rec.mons || []) {
    const x = (ms[m.species] ||= { g: 0, w: 0, dmg: 0, kills: 0, best: 0 });
    x.g++; if (rec.won) x.w++; x.dmg += m.dealt || 0; x.kills += m.kills || 0; x.best = Math.max(x.best, m.dealt || 0);
  }
  (u.matches ||= []).unshift({ at: Date.now(), kind: rec.kind, won: rec.won, draw: !!rec.draw, opp: rec.opp, mons: (rec.mons || []).map((m) => ({ s: m.species, sh: m.shiny ? 1 : 0, d: m.dealt || 0, k: m.kills || 0 })), rep: rec.rep || null, turns: rec.turns || 0 });
  u.matches = u.matches.slice(0, 20);
  const day = dayKey(); const h = (u.daily ||= {}); h[day] = h[day] || { g: 0, w: 0 }; h[day].g++; if (rec.won) h[day].w++;
  for (const k of Object.keys(h).sort().slice(0, -14)) delete h[k];
}
function statsView(u) {
  const ms = Object.entries(u.monStats || {}).map(([sp, x]) => ({ sp, n: Data.MONSTERS[sp]?.n || sp, ...x })).sort((a, b) => b.g - a.g);
  return {
    total: { wins: u.wins || 0, losses: u.losses || 0, draws: u.draws || 0, streakBest: u.stats?.streakBest || 0, megas: u.stats?.megas || 0, zmoves: u.stats?.zmoves || 0, flawless: u.stats?.flawless || 0, raidWins: u.stats?.raidWins || 0, dummyBest: u.stats?.dummyBest || 0, botWins: u.stats?.botWins || 0, tagWins: u.stats?.tagWins || 0 },
    mons: ms.slice(0, 30), matches: u.matches || [],
    h2h: Object.entries(u.h2h || {}).map(([n, r]) => ({ n, ...r })).sort((a, b) => (b.w + b.l + b.d) - (a.w + a.l + a.d)).slice(0, 10),
    daily: Object.entries(u.daily || {}).sort().map(([d, x]) => ({ d, ...x })),
  };
}

/* ---------- 도감 수집 보상 ---------- */
const released = () => Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id));
const DEX_GOALS = [
  ...[[10, { gp: 3000, rerolls: 3 }], [20, { gp: 6000, rerolls: 5 }], [30, { tickets: 2, rerolls: 8 }], [40, { tickets: 3, rerolls: 10 }], [50, { tickets: 5, rerolls: 15, gp: 20000 }]].map(([n, r]) => ({ id: `dex${n}`, n: `골목몬 ${n}종 모으기`, k: 'species', goal: n, r })),
  { id: 'dexall', n: '모든 골목몬 모으기 (도감 완성)', k: 'species', goal: 'all', r: { tickets: 10, gp: 50000, rerolls: 30, costume: 'crown' } },
  ...[[1, { gp: 2000 }], [5, { tickets: 1, rerolls: 5 }], [10, { tickets: 3, rerolls: 10 }], [20, { tickets: 5, gp: 30000, costume: 'halo' }]].map(([n, r]) => ({ id: `shiny${n}`, n: `이로치 ${n}종 모으기`, k: 'shinies', goal: n, r })),
  ...Object.keys(Data.TYPES).map((t) => ({ id: `type-${t}`, n: `${Data.TYPES[t].n} 타입 전부 모으기`, k: 'type', t, goal: 'type', r: { rerolls: 5, gp: 3000 } })),
];
function dexState(u) {
  const own = new Set((u.mons || []).map((m) => m.species)), shin = new Set((u.mons || []).filter((m) => m.shiny).map((m) => m.species)), all = released();
  const got = u.dexGot || [];
  return DEX_GOALS.map((g) => {
    let val, goal;
    if (g.k === 'species') { val = all.filter((x) => own.has(x)).length; goal = g.goal === 'all' ? all.length : g.goal; }
    else if (g.k === 'shinies') { val = shin.size; goal = g.goal; }
    else { const list = all.filter((x) => Data.MONSTERS[x].types.includes(g.t)); if (!list.length) return null; val = list.filter((x) => own.has(x)).length; goal = list.length; }
    return { id: g.id, n: g.n, val: Math.min(val, goal), goal, r: g.r, got: got.includes(g.id), can: val >= goal && !got.includes(g.id) };
  }).filter(Boolean);
}
function dexClaim(u, id) {
  const list = id === 'all' ? dexState(u).filter((g) => g.can) : dexState(u).filter((g) => g.id === id && g.can);
  if (!list.length) return err('받을 수 있는 보상이 없어요.');
  const got = [];
  for (const g of list) {
    (u.dexGot ||= []).push(g.id);
    const { costume, ...r } = g.r;
    got.push(...H.grant(u, r));
    if (costume) { (u.costumes ||= []); if (!u.costumes.includes(costume)) u.costumes.push(costume); got.push({ k: 'costume', id: costume, n: COSTUMES[costume].n }); }
  }
  return { got, dex: dexState(u) };
}
const dexClaimable = (u) => dexState(u).filter((g) => g.can).length;

/* ---------- 친구 선물 (우정 포인트) ---------- */
const FGIFT_MAX = 10, FP_EACH = 10;
const FSHOP = [
  { id: 'f-reroll', n: '리롤권 1장', fp: 40, r: { rerolls: 1 } },
  { id: 'f-skip', n: '1시간 스킵권 5장', fp: 30, r: { skips: 5 } },
  { id: 'f-gp', n: '1,500GP', fp: 50, r: { gp: 1500 } },
  { id: 'f-ticket', n: '골목몬 입수권 1장', fp: 300, r: { tickets: 1 } },
  { id: 'f-costume', n: '코스튬: 우정 리본', fp: 500, costume: 'ribbon' },
];
function fgiftBook(u) { const d = dayKey(); if (u.fgift?.day !== d) u.fgift = { day: d, sent: [] }; return u.fgift; }
function fgiftView(u) { const b = fgiftBook(u); return { sent: b.sent, max: FGIFT_MAX, left: FGIFT_MAX - b.sent.length, inbox: (u.fgiftIn || []).length, fp: u.fp || 0, shop: FSHOP, each: FP_EACH }; }
function fgiftSend(u, key, to) {
  if (!(u.friends || []).includes(to)) return err('친구에게만 보낼 수 있어요.');
  const b = fgiftBook(u);
  if (b.sent.includes(to)) return err('오늘은 이미 보냈어요. 내일 또 보내요!');
  if (b.sent.length >= FGIFT_MAX) return err(`하루 ${FGIFT_MAX}명까지 보낼 수 있어요.`);
  const f = db.users[to]; if (!f) return err('없는 계정이에요.');
  b.sent.push(to);
  (f.fgiftIn ||= []).push({ from: u.name, at: Date.now() });
  f.fgiftIn = f.fgiftIn.slice(-60);
  if (H.online.has(to)) { H.toast(to, `💝 ${u.name}님이 우정 선물을 보냈어요! 친구 화면에서 받아요.`); H.send(H.online.get(to), { t: 'me', user: H.publicUser(f) }); }
  H.push?.(to, { title: '💝 우정 선물', body: `${u.name}님이 우정 선물을 보냈어요!`, tag: 'fgift' });
  return { ok: true, fgift: fgiftView(u) };
}
function fgiftSendAll(u, key) {
  const b = fgiftBook(u); let n = 0;
  for (const to of u.friends || []) { if (b.sent.length >= FGIFT_MAX) break; if (b.sent.includes(to) || !db.users[to]) continue; fgiftSend(u, key, to); n++; }
  if (!n) return err('보낼 수 있는 친구가 없어요.');
  return { ok: true, n, fgift: fgiftView(u) };
}
function fgiftClaim(u) {
  const n = (u.fgiftIn || []).length;
  if (!n) return err('받은 선물이 없어요.');
  const from = [...new Set(u.fgiftIn.map((x) => x.from))];
  u.fgiftIn = []; u.fp = (u.fp || 0) + n * FP_EACH;
  return { ok: true, got: [{ k: 'fp', n: n * FP_EACH }], from, fgift: fgiftView(u) };
}
function fshopBuy(u, id) {
  const it = FSHOP.find((x) => x.id === id); if (!it) return err('없는 상품이에요.');
  if ((u.fp || 0) < it.fp) return err(`우정 포인트가 모자라요. (${it.fp} 필요)`);
  if (it.costume && (u.costumes || []).includes(it.costume)) return err('이미 가지고 있어요.');
  u.fp -= it.fp;
  if (it.costume) { (u.costumes ||= []).push(it.costume); return { ok: true, got: [{ k: 'costume', id: it.costume, n: COSTUMES[it.costume].n }], fgift: fgiftView(u) }; }
  return { ok: true, got: H.grant(u, it.r), fgift: fgiftView(u) };
}

/* ---------- 코스튬 (골목몬 머리 위에 씌우는 꾸미기) ---------- */
// price: GP, jelly: 이벤트 젤리. 그림은 public/js/extra.js의 COSTUME_ART
const COSTUMES = {
  wakppu: { n: '왁뿌말랑왕', d: '말랑말랑 젤리 왕관에 볼터치, 몸이 말랑말랑 흔들려요. 말랑말랑 축제 한정!', price: 20000, jelly: 40, fx: 'squish' },
  santa: { n: '산타 모자', price: 3000 },
  crown: { n: '황금 왕관', price: 0, d: '도감 완성 보상' },
  wizard: { n: '마법사 모자', price: 4000 },
  catears: { n: '고양이 귀', price: 3000 },
  halo: { n: '천사 링', price: 0, d: '이로치 20종 보상', fx: 'glow' },
  pirate: { n: '해적 모자', price: 4000 },
  party: { n: '파티 고깔', price: 2000 },
  flower: { n: '꽃 화관', price: 3000 },
  horns: { n: '악마 뿔', price: 4000 },
  grad: { n: '학사모', price: 3000 },
  headset: { n: '게이밍 헤드셋', price: 5000 },
  ribbon: { n: '우정 리본', price: 0, d: '우정 포인트 상점' },
};
const costumeList = (u) => Object.entries(COSTUMES).map(([id, c]) => ({ id, ...c, own: (u.costumes || []).includes(id) || !!u._dev }));
function costumeBuy(u, id, pay) {
  const c = COSTUMES[id]; if (!c) return err('없는 코스튬이에요.');
  if ((u.costumes || []).includes(id)) return err('이미 가지고 있어요.');
  if (pay === 'jelly') {
    if (!c.jelly || !eventLive()) return err('지금은 젤리로 살 수 없어요.');
    if ((u.jelly || 0) < c.jelly) return err(`말랑 젤리가 모자라요. (${c.jelly}개 필요)`);
    u.jelly -= c.jelly;
  } else {
    if (!c.price) return err('상점에서 팔지 않는 코스튬이에요. 보상으로 얻을 수 있어요.');
    if ((u.gp || 0) < c.price) return err(`GP가 모자라요. (${fmt(c.price)}GP 필요)`);
    u.gp -= c.price;
  }
  (u.costumes ||= []).push(id);
  return { ok: true, got: [{ k: 'costume', id, n: c.n }] };
}
function costumeWear(u, uid, id, dev) {
  const m = (u.mons || []).find((x) => x.uid === uid); if (!m) return err('없는 골목몬이에요.');
  if (id && !COSTUMES[id]) return err('없는 코스튬이에요.');
  if (id && !dev && !(u.costumes || []).includes(id)) return err('가지고 있지 않은 코스튬이에요.');
  if (id) m.costume = id; else delete m.costume;
  return { ok: true };
}

/* ---------- 기간 한정 이벤트: 말랑말랑 축제 ---------- */
const EVENT = { id: 'mallang', n: '말랑말랑 축제', start: Date.parse('2026-11-15T00:00:00+09:00'), end: Date.parse('2026-12-01T00:00:00+09:00'),
  d: '대전을 하면 말랑 젤리가 나와요! 모은 젤리로 이벤트 상점에서 왁뿌말랑왕 코스튬과 선물을 바꿔요.', dailyCap: 40, login: 5 };
const eventLive = (t = Date.now()) => t >= EVENT.start && t < EVENT.end;
const ESHOP = [
  { id: 'e-wakppu', n: '코스튬: 왁뿌말랑왕', jelly: 40, costume: 'wakppu' },
  { id: 'e-reroll', n: '리롤권 3장', jelly: 10, r: { rerolls: 3 }, limit: 10 },
  { id: 'e-skip', n: '1시간 스킵권 10장', jelly: 8, r: { skips: 10 }, limit: 10 },
  { id: 'e-gp', n: '3,000GP', jelly: 10, r: { gp: 3000 }, limit: 20 },
  { id: 'e-ticket', n: '골목몬 입수권 1장', jelly: 25, r: { tickets: 1 }, limit: 5 },
  { id: 'e-shiny', n: '이로치 골목몬 랜덤 1마리', jelly: 120, r: { mon: 'random', shiny: true }, limit: 1 },
];
function eventBook(u) { if (u.ev?.id !== EVENT.id) u.ev = { id: EVENT.id, day: '', today: 0, login: '', bought: {} }; const d = dayKey(); if (u.ev.day !== d) { u.ev.day = d; u.ev.today = 0; } return u.ev; }
function eventLogin(u) {
  if (!eventLive()) return null;
  const b = eventBook(u), d = dayKey();
  if (b.login === d) return null;
  b.login = d; u.jelly = (u.jelly || 0) + EVENT.login;
  return EVENT.login;
}
// 대전 뒤 젤리: 친구 대전 승 4/패 2, 태그·레이드 3/1, 연습 2/1 (하루 40개까지)
function eventBattle(u, kind, won) {
  if (!eventLive()) return 0;
  const b = eventBook(u);
  const n = Math.min(Math.max(0, EVENT.dailyCap - b.today), ({ pvp: won ? 4 : 2, tag: won ? 3 : 1, practice: won ? 2 : 1 })[kind] || 0);
  b.today += n; u.jelly = (u.jelly || 0) + n;
  return n;
}
function eventView(u) {
  const b = eventBook(u);
  return { ...EVENT, live: eventLive(), jelly: u.jelly || 0, today: b.today, shop: ESHOP.map((x) => ({ ...x, left: x.limit ? x.limit - (b.bought[x.id] || 0) : null, own: x.costume ? (u.costumes || []).includes(x.costume) : false })) };
}
function eventBuy(u, id) {
  if (!eventLive()) return err('이벤트가 끝났어요.');
  const it = ESHOP.find((x) => x.id === id); if (!it) return err('없는 상품이에요.');
  const b = eventBook(u);
  if (it.limit && (b.bought[id] || 0) >= it.limit) return err('교환 한도를 다 썼어요.');
  if (it.costume && (u.costumes || []).includes(it.costume)) return err('이미 가지고 있어요.');
  if ((u.jelly || 0) < it.jelly) return err(`말랑 젤리가 모자라요. (${it.jelly}개 필요)`);
  u.jelly -= it.jelly; b.bought[id] = (b.bought[id] || 0) + 1;
  if (it.costume) { (u.costumes ||= []).push(it.costume); return { ok: true, got: [{ k: 'costume', id: it.costume, n: COSTUMES[it.costume].n }], event: eventView(u) }; }
  return { ok: true, got: H.grant(u, it.r), event: eventView(u) };
}

/* ---------- 라우트 ---------- */
function api(route, u, key, b) {
  const dev = H.isDev(u);
  const devOnly = () => (dev ? null : err('개발자만 할 수 있어요.'));
  switch (route) {
    case 'GET /api/news': return { list: newsList(), seen: u.newsSeen || 0 };
    case 'POST /api/news/seen': u.newsSeen = Date.now(); return { ok: true };
    case 'POST /api/dev/news': return devOnly() || newsWrite(b);
    case 'POST /api/dev/news/delete': return devOnly() || newsDelete(String(b.id || ''));
    case 'GET /api/dev/dash': return devOnly() || { dash: dash() };
    case 'POST /api/dev/user': return devOnly() || userInfo(b.name);
    case 'POST /api/dev/give': return devOnly() || adminGive(u.name, b);
    case 'GET /api/stats': return { stats: statsView(u) };
    case 'GET /api/dex/rewards': return { dex: dexState(u) };
    case 'POST /api/dex/claim': return dexClaim(u, String(b.id || ''));
    case 'GET /api/fgift': return { fgift: fgiftView(u) };
    case 'POST /api/fgift/send': return fgiftSend(u, key, String(b.key || ''));
    case 'POST /api/fgift/sendall': return fgiftSendAll(u, key);
    case 'POST /api/fgift/claim': return fgiftClaim(u);
    case 'POST /api/fgift/shop': return fshopBuy(u, String(b.id || ''));
    case 'GET /api/costumes': return { list: costumeList({ ...u, _dev: dev }) };
    case 'POST /api/costume/buy': return costumeBuy(u, String(b.id || ''), b.pay === 'jelly' ? 'jelly' : 'gp');
    case 'POST /api/costume/wear': return costumeWear(u, String(b.uid || ''), b.id ? String(b.id) : '', dev);
    case 'GET /api/event': return { event: eventView(u) };
    case 'POST /api/event/buy': return eventBuy(u, String(b.id || ''));
    default: return undefined;
  }
}
// 로비 배지용
const badges = (u) => ({ news: newsUnread(u), dex: dexClaimable(u), fgift: (u.fgiftIn || []).length });

module.exports = { init, api, badges, recordBattle, eventBattle, eventLogin, eventLive, COSTUMES, EVENT };
