'use strict';
// 운의 골목: 🏇 골목몬 경마(20분마다) · 🎱 주간 로또 · 🎁 미스터리 상자
// 모두 게임 안 재화만 써요. 결과는 서버가 정합니다.
const crypto = require('crypto');
const Data = require('./data');
const C = require('./casino');

let db = null, H = {};
const rnd = (n) => crypto.randomInt(n);
const err = (error) => ({ error });
const fmt = (n) => Number(n).toLocaleString('ko-KR');
const KST = 9 * 3600e3;
function init(_db, helpers) { db = _db; H = helpers; db.luck ||= {}; }
const L = () => (db.luck ||= {});

/* ===================== 🏇 골목몬 경마: 20분마다 한 판 ===================== */
const RACE_MS = 20 * 60e3, RACE_N = 5, RACE_LEGS = 12, RACE_MIN = 100, RACE_MAX = 20000, RACE_BETS = 5, RACE_EDGE = 0.9;
const nextRaceAt = (t = Date.now()) => Math.floor(t / RACE_MS) * RACE_MS + RACE_MS;
// 한 구간마다: 스피드 + 운(돌풍). 몇 번 미리 돌려 보고 배당을 정해요
function legs(horses, R = Math.random) {
  const pos = horses.map(() => 0), frames = [];
  for (let i = 0; i < RACE_LEGS; i++) {
    horses.forEach((h, j) => { pos[j] += h.spd * (0.55 + R() * 0.9) + (R() < 0.12 ? 22 : 0) - (R() < 0.1 ? 14 : 0); }); // 운이 크게: 느린 말도 가끔 이겨요
    frames.push([...pos]);
  }
  return frames;
}
function newRace(at) {
  const pool = Object.keys(Data.MONSTERS).filter((x) => !Data.BANNED.includes(x) && x !== 'dummy');
  const picks = []; while (picks.length < RACE_N) { const x = pool[rnd(pool.length)]; if (!picks.includes(x)) picks.push(x); }
  const horses = picks.map((species) => { const b = Data.MONSTERS[species].base; return { species, n: Data.MONSTERS[species].n, spd: 40 + b.spe * 0.12 + b.hp * 0.03, no: 0 }; });
  horses.forEach((h, i) => { h.no = i + 1; });
  const wins = horses.map(() => 0), T = 4000;
  for (let t = 0; t < T; t++) { const f = legs(horses).at(-1); wins[f.indexOf(Math.max(...f))]++; }
  horses.forEach((h, i) => { const p = Math.max(0.02, wins[i] / T); h.p = +p.toFixed(3); h.odds = Math.max(1.2, Math.round(RACE_EDGE / p * 10) / 10); });
  return { id: `r${at}`, at, horses, bets: [] };
}
function raceBook() {
  const l = L();
  if (!l.race) l.race = newRace(nextRaceAt());
  if (Date.now() >= l.race.at) { runRace(l.race); l.race = newRace(nextRaceAt()); }
  return l.race;
}
function runRace(r) {
  const R = () => rnd(1e9) / 1e9, frames = legs(r.horses, R), fin = frames.at(-1);
  const win = fin.indexOf(Math.max(...fin)), top = Math.max(...fin);
  const norm = frames.map((f) => f.map((x) => Math.round(x / top * 1000) / 10)); // 결승선 = 100
  const order = fin.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
  const payouts = [];
  for (const b of r.bets) {
    const u = db.users[b.key]; if (!u) continue;
    if (b.horse === win) { const n = Math.floor(b.bet * r.horses[win].odds); C.pay(u, 'gp', n); payouts.push({ key: b.key, name: u.name, n }); if (n >= 100000) C.bigWin(u, '경마', 'gp', n, r.horses[win].odds); }
  }
  const res = { id: r.id, at: r.at, horses: r.horses.map(({ species, n, odds, no }) => ({ species, n, odds, no })), win, order, frames: norm, bettors: new Set(r.bets.map((b) => b.key)).size, payouts: payouts.slice(0, 20) };
  L().races = [res, ...(L().races || [])].slice(0, 12);
  for (const k of new Set(r.bets.map((b) => b.key))) {
    const mine = r.bets.filter((b) => b.key === k), got = payouts.filter((p) => p.key === k).reduce((n, p) => n + p.n, 0), spent = mine.reduce((n, b) => n + b.bet, 0);
    H.notify?.(k, { t: 'race_done', id: r.id, win, winner: r.horses[win].n, got, spent });
  }
  if (r.bets.length) H.save?.();
}
function raceBet(u, key, horse, bet) {
  const r = raceBook();
  horse = Math.floor(Number(horse)); bet = Math.floor(Number(bet));
  if (!(horse >= 0 && horse < RACE_N)) return err('말을 골라 주세요.');
  if (r.at - Date.now() < 15e3) return err('곧 출발해요! 이번 판 베팅은 마감됐어요.');
  if (!(bet >= RACE_MIN && bet <= RACE_MAX)) return err(`한 번에 ${fmt(RACE_MIN)}~${fmt(RACE_MAX)}GP까지 걸 수 있어요.`);
  if (r.bets.filter((b) => b.key === key).length >= RACE_BETS) return err(`한 판에 ${RACE_BETS}번까지 걸 수 있어요.`);
  const e = C.takeBet(u, 'gp', bet); if (e) return err(e);
  r.bets.push({ key, horse, bet, at: Date.now() });
  return { ok: true };
}
function raceView(key) {
  const r = raceBook();
  return { cur: { id: r.id, at: r.at, horses: r.horses, pool: r.bets.reduce((n, b) => n + b.bet, 0), bettors: new Set(r.bets.map((b) => b.key)).size, mine: r.bets.filter((b) => b.key === key).map(({ horse, bet }) => ({ horse, bet })) },
    last: (L().races || []).slice(0, 6), min: RACE_MIN, max: RACE_MAX, maxBets: RACE_BETS, every: RACE_MS };
}

/* ===================== 🎱 주간 로또: 1~20 중 5개, 일요일 밤 8시 추첨 ===================== */
const LOTTO_N = 20, LOTTO_PICK = 5, LOTTO_PRICE = 1000, LOTTO_MAX = 10, LOTTO_BASE = 100000;
const LOTTO_FIX = { 4: 20000, 3: 2000, 2: 1000 }; // 5개 = 1등(쌓인 상금을 나눠 가짐)
function nextDraw(t = Date.now()) { const d = new Date(t + KST); const dow = d.getUTCDay(); let at = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + ((7 - dow) % 7), 20) - KST; if (at <= t) at += 7 * 864e5; return at; }
function lottoBook() {
  const l = L();
  l.lotto ||= { round: 1, at: nextDraw(), pot: LOTTO_BASE, tickets: [], hist: [] };
  if (Date.now() >= l.lotto.at) drawLotto();
  return l.lotto;
}
function drawLotto() {
  const t = L().lotto, nums = [];
  while (nums.length < LOTTO_PICK) { const x = 1 + rnd(LOTTO_N); if (!nums.includes(x)) nums.push(x); }
  nums.sort((a, b) => a - b);
  const hits = t.tickets.map((tk) => ({ ...tk, hit: tk.nums.filter((x) => nums.includes(x)).length }));
  const firsts = hits.filter((h) => h.hit === LOTTO_PICK), share = firsts.length ? Math.floor(t.pot / firsts.length) : 0;
  const win = { 1: [], 2: [], 3: [], 4: [] }, byUser = new Map();
  for (const h of hits) {
    const prize = h.hit === LOTTO_PICK ? share : LOTTO_FIX[h.hit] || 0; if (!prize) continue;
    const rank = h.hit === LOTTO_PICK ? 1 : LOTTO_PICK - h.hit + 1; win[rank].push(db.users[h.key]?.name || '?');
    byUser.set(h.key, (byUser.get(h.key) || 0) + prize);
  }
  for (const [k, n] of byUser) {
    const u = db.users[k]; if (!u) continue; C.pay(u, 'gp', n);
    H.sendMail?.(u, { from: '골목 로또', title: `🎱 ${t.round}회 로또 당첨!`, body: `당첨 번호 ${nums.join(', ')}. 당첨금 ${fmt(n)}GP는 지갑에 들어갔어요.`, reward: [] });
  }
  H.sysChat?.(`🎱 ${t.round}회 골목 로또 당첨 번호: ${nums.join(' · ')}${firsts.length ? ` — 1등 ${firsts.length}명! (${fmt(share)}GP씩)` : ` — 1등 없음! 상금 ${fmt(t.pot)}GP는 다음 회로 넘어가요`}`);
  t.hist = [{ round: t.round, at: t.at, nums, tickets: t.tickets.length, firsts: firsts.length, share, win: Object.fromEntries(Object.entries(win).map(([k, v]) => [k, v.length])) }, ...t.hist].slice(0, 10);
  const carry = firsts.length ? LOTTO_BASE : t.pot;
  Object.assign(t, { round: t.round + 1, at: nextDraw(t.at + 1000), pot: carry, tickets: [] });
  H.save?.();
}
function lottoBuy(u, key, nums) {
  const t = lottoBook();
  if (nums === 'auto') { nums = []; while (nums.length < LOTTO_PICK) { const x = 1 + rnd(LOTTO_N); if (!nums.includes(x)) nums.push(x); } }
  nums = [...new Set((nums || []).map(Number))].filter((x) => Number.isInteger(x) && x >= 1 && x <= LOTTO_N).sort((a, b) => a - b);
  if (nums.length !== LOTTO_PICK) return err(`1~${LOTTO_N} 중에서 숫자 ${LOTTO_PICK}개를 골라 주세요.`);
  if (t.at - Date.now() < 60e3) return err('곧 추첨해요! 이번 회 판매는 마감됐어요.');
  if (t.tickets.filter((x) => x.key === key).length >= LOTTO_MAX) return err(`한 회에 ${LOTTO_MAX}장까지 살 수 있어요.`);
  const e = C.takeBet(u, 'gp', LOTTO_PRICE); if (e) return err(e);
  t.pot += Math.floor(LOTTO_PRICE * 0.3); // 판매액의 30%가 1등 상금에 쌓여요
  t.tickets.push({ key, nums, at: Date.now() });
  return { ok: true, nums };
}
function lottoView(key) {
  const t = lottoBook();
  return { round: t.round, at: t.at, pot: t.pot, sold: t.tickets.length, mine: t.tickets.filter((x) => x.key === key).map((x) => x.nums), hist: t.hist, n: LOTTO_N, pick: LOTTO_PICK, price: LOTTO_PRICE, max: LOTTO_MAX, fix: LOTTO_FIX };
}

/* ===================== 🎁 미스터리 상자 ===================== */
const BOX = {
  c: { n: '일반 상자', price: 2000, icon: '📦' },
  r: { n: '희귀 상자', price: 8000, icon: '🎁' },
  l: { n: '전설 상자', price: 0, icon: '💠' }, // 사지 못하고 얻기만
};
const BOX_PITY = 40; // 상자를 40번 열 동안 이로치가 안 나오면 다음 상자는 이로치 확정
// [확률(천분율), 내용] — 위에서부터
const BOX_TABLE = {
  c: [[8, { mon: 'random', shiny: true }], [12, { skin: 'srare' }], [50, { skin: 'rare' }], [30, { stones: 1 }], [60, { tickets: 1 }], [140, { rerolls: 2 }], [140, { skips: 2 }], [560, 'gp:300-3000']],
  r: [[30, { mon: 'random', shiny: true }], [10, { skin: 'myth' }], [40, { skin: 'hero' }], [70, { skin: 'srare' }], [90, { stones: 2 }], [180, { tickets: 1 }], [180, { rerolls: 5 }], [400, 'gp:2000-15000']],
  l: [[200, { mon: 'random', shiny: true }], [50, { skin: 'legend' }], [130, { skin: 'myth' }], [170, { tickets: 3 }], [150, { stones: 3 }], [300, 'gp:20000-60000']],
};
const rollGp = (s) => { const [a, b] = s.slice(3).split('-').map(Number); return Math.round((a + rnd(b - a + 1)) / 100) * 100; };
function boxOpen(u, tier) {
  if (!BOX[tier]) return err('없는 상자예요.');
  u.boxes ||= { c: 0, r: 0, l: 0 };
  if (!(u.boxes[tier] > 0)) return err(`${BOX[tier].n}가 없어요.`);
  u.boxes[tier]--;
  u.boxPity = (u.boxPity || 0) + 1;
  let pickR;
  if (u.boxPity >= BOX_PITY) pickR = { mon: 'random', shiny: true };
  else { let x = rnd(1000); for (const [w, r] of BOX_TABLE[tier]) { if (x < w) { pickR = r; break; } x -= w; } }
  const reward = typeof pickR === 'string' ? { gp: rollGp(pickR) } : { ...pickR };
  if (reward.mon) u.boxPity = 0;
  let got;
  if (reward.skin) { // 🎨 스킨: 그 등급에서 아직 없는 스킨 하나 (한정판 제외). 다 있으면 스킨 값의 절반만큼 GP
    const SK = require('./extra').COSTUMES, G = require('./skins').GRADES[reward.skin];
    const pool = Object.entries(SK).filter(([id, c]) => c.grade === reward.skin && !c.limited && !(u.costumes || []).includes(id));
    if (pool.length) { const [id, c] = pool[rnd(pool.length)]; (u.costumes ||= []).push(id); got = [{ k: 'costume', id, n: c.n, grade: reward.skin }]; if (['myth', 'legend'].includes(reward.skin)) H.sysChat?.(`🎁 ${u.name}님이 ${BOX[tier].n}에서 ${G.n} 스킨 「${c.n}」을 뽑았어요!`); }
    else got = H.grant(u, { gp: Math.floor(G.price / 2) });
  } else got = H.grant(u, reward);
  const grade = reward.mon || reward.skin === 'legend' ? 'legend' : reward.skin === 'myth' ? 'epic' : reward.skin ? 'rare' : reward.tickets >= 3 || reward.stones >= 2 || reward.gp >= 20000 ? 'epic' : reward.tickets || reward.stones || reward.gp >= 5000 ? 'rare' : 'common';
  if (reward.mon) H.sysChat?.(`🎁 ${u.name}님이 ${BOX[tier].n}에서 ✨이로치 골목몬✨을 뽑았어요!`);
  return { ok: true, tier, got, grade, pity: u.boxPity, boxes: u.boxes };
}
function boxBuy(u, tier) {
  const b = BOX[tier]; if (!b?.price) return err('살 수 없는 상자예요.');
  if (u.gp < b.price) return err(`${fmt(b.price)}GP가 필요해요.`);
  u.gp -= b.price; u.boxes ||= { c: 0, r: 0, l: 0 }; u.boxes[tier]++;
  return { ok: true, boxes: u.boxes };
}
// 대전에서 이기면 가끔 상자 (연습·훈련·퍼즐 제외)
function boxDrop(u, kind) {
  if (['practice', 'training', 'puzzle'].includes(kind)) return null;
  const x = rnd(1000), tier = x < 5 ? 'l' : x < 35 ? 'r' : x < 150 ? 'c' : null;
  if (!tier) return null;
  u.boxes ||= { c: 0, r: 0, l: 0 }; u.boxes[tier]++;
  return { tier, n: BOX[tier].n, icon: BOX[tier].icon };
}
function giveBox(u, tier, n = 1) { u.boxes ||= { c: 0, r: 0, l: 0 }; u.boxes[tier] = (u.boxes[tier] || 0) + n; }
const boxView = (u) => ({ boxes: { c: 0, r: 0, l: 0, ...(u.boxes || {}) }, info: BOX, pity: u.boxPity || 0, pityMax: BOX_PITY, table: Object.fromEntries(Object.entries(BOX_TABLE).map(([k, rows]) => [k, rows.map(([w, r]) => [w / 10, typeof r === 'string' ? r : r])])) });

function api(route, u, key, b) {
  switch (route) {
    case 'GET /api/race': return { race: raceView(key) };
    case 'POST /api/race/bet': { const r = raceBet(u, key, b.horse, b.bet); return r.error ? r : { ...r, race: raceView(key) }; }
    case 'GET /api/lotto': return { lotto: lottoView(key) };
    case 'POST /api/lotto/buy': { const r = lottoBuy(u, key, b.auto ? 'auto' : b.nums); return r.error ? r : { ...r, lotto: lottoView(key) }; }
    case 'GET /api/boxes': return { box: boxView(u) };
    case 'POST /api/boxes/open': { const r = boxOpen(u, String(b.tier || '')); return r.error ? r : { ...r, box: boxView(u) }; }
    case 'POST /api/boxes/buy': { const r = boxBuy(u, String(b.tier || '')); return r.error ? r : { ...r, box: boxView(u) }; }
    default: return undefined;
  }
}
function tick() { try { raceBook(); lottoBook(); } catch (e) { console.error('운의 골목 오류', e.message); } }

module.exports = { init, api, tick, raceBook, runRace, lottoBook, drawLotto, boxOpen, boxDrop, giveBox, nextDraw, nextRaceAt, BOX, BOX_PITY, LOTTO_FIX, RACE_N };
