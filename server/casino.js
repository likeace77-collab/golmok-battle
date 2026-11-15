'use strict';
// 골목 도박장: 게임 안 재화(GP·리롤권·스킵권·입수권)만 걸 수 있어요. 진짜 돈은 쓰지 않아요.
// 슬롯머신(잭팟), 룰렛, 더블업(동전), 복권 긁기. 결과는 서버가 정합니다.
const crypto = require('crypto');

let db = null, H = null;
function init(_db, helpers) { db = _db; H = helpers; }
const err = (error) => ({ error });
const rnd = (n) => crypto.randomInt(n);
const KST = 9 * 3600e3, dayKey = () => new Date(Date.now() + KST).toISOString().slice(0, 10);
const fmt = (n) => Number(n).toLocaleString('ko-KR');

// 걸 수 있는 것: 이름, 한 번에 최소·최대
const CUR = {
  gp: { n: 'GP', min: 100, max: 50000 },
  rerolls: { n: '리롤권', min: 1, max: 20 },
  skips: { n: '1시간 스킵권', min: 1, max: 50 },
  tickets: { n: '골목몬 입수권', min: 1, max: 3 },
};
const DAILY_PLAYS = 300, JACKPOT_BASE = 100000, JACKPOT_CUT = .03;
function book(u) { const d = dayKey(); if (u.casino?.day !== d) u.casino = { day: d, plays: 0, net: { ...(u.casino?.net || {}) } }; return u.casino; }
function cas() { db.casino ||= { jackpot: JACKPOT_BASE, wins: [] }; return db.casino; }
function takeBet(u, cur, bet) {
  const c = CUR[cur]; if (!c) return '걸 수 없는 거예요.';
  if (!Number.isInteger(bet) || bet < c.min || bet > c.max) return `${c.n}은(는) 한 번에 ${fmt(c.min)}~${fmt(c.max)}까지 걸 수 있어요.`;
  if ((u[cur] || 0) < bet) return `${c.n}이(가) 모자라요.`;
  const b = book(u); if (b.plays >= DAILY_PLAYS) return `오늘은 ${DAILY_PLAYS}판을 다 했어요. 내일 다시 와요!`;
  u[cur] -= bet; b.plays++; b.net[cur] = (b.net[cur] || 0) - bet;
  if (cur === 'gp') cas().jackpot += Math.floor(bet * JACKPOT_CUT);
  return null;
}
function pay(u, cur, n) { if (n > 0) { u[cur] = (u[cur] || 0) + n; const b = book(u); b.net[cur] = (b.net[cur] || 0) + n; } }
function bigWin(u, game, cur, n, mult) {
  const c = cas(); c.wins.unshift({ at: Date.now(), name: u.name, game, cur, n, mult }); c.wins = c.wins.slice(0, 15);
  if ((cur === 'gp' && n >= 200000) || (cur !== 'gp' && mult >= 50)) H.sysChat?.('world', `🎰 ${u.name}님이 ${game}에서 ${CUR[cur].n} ${fmt(n)} 대박! (×${mult})`);
}

/* 슬롯머신: 릴 3개. 💎💎💎 = 잭팟(쌓인 GP 전부 + ×1000) — 12만 5천 번에 한 번 꼴 */
const SYM = [['🍒', 30], ['🍋', 25], ['🔔', 18], ['🍀', 12], ['⭐', 8], ['7️⃣', 5], ['💎', 2]];
const TRIPLE = { '🍒': 5, '🍋': 8, '🔔': 15, '🍀': 30, '⭐': 80, '7️⃣': 300, '💎': 1000 };
const PAIR = { '🍒': .5, '🍋': .5, '🔔': 1, '🍀': 1.5, '⭐': 2, '7️⃣': 4, '💎': 8 };
const spinReel = () => { let r = rnd(100); for (const [s, w] of SYM) { if (r < w) return s; r -= w; } return '🍒'; };
function slot(u, cur, bet) {
  const e = takeBet(u, cur, bet); if (e) return err(e);
  const reels = [spinReel(), spinReel(), spinReel()];
  let mult = 0, jackpot = 0, kind = 'lose';
  if (reels[0] === reels[1] && reels[1] === reels[2]) { mult = TRIPLE[reels[0]]; kind = reels[0] === '💎' ? 'jackpot' : 'triple'; }
  else { const pair = reels.find((s, i) => reels.indexOf(s) !== i); if (pair) { mult = PAIR[pair]; kind = 'pair'; } }
  if (kind === 'jackpot' && cur === 'gp') { jackpot = cas().jackpot; cas().jackpot = JACKPOT_BASE; }
  if (kind === 'jackpot' && cur !== 'gp') mult = 100; // 아이템은 ×100까지
  const win = Math.floor(bet * mult) + jackpot;
  pay(u, cur, win);
  if (mult >= 30 || jackpot) bigWin(u, jackpot ? '슬롯 잭팟' : '슬롯머신', cur, win, Math.round(win / bet));
  return { reels, mult, kind, win, jackpot };
}

/* 룰렛: 0~36 (유럽식). 빨강/검정/홀/짝/1~18/19~36 ×2, 12개 묶음 ×3, 숫자 하나 ×36 */
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
function roulette(u, cur, bet, kind, pick) {
  const ok = { red: 2, black: 2, odd: 2, even: 2, low: 2, high: 2, dozen: 3, num: 36 };
  if (!ok[kind]) return err('어디에 걸지 골라 주세요.');
  if (kind === 'dozen' && ![1, 2, 3].includes(pick)) return err('1~12, 13~24, 25~36 중에 골라 주세요.');
  if (kind === 'num' && !(Number.isInteger(pick) && pick >= 0 && pick <= 36)) return err('0~36 중 숫자를 골라 주세요.');
  const e = takeBet(u, cur, bet); if (e) return err(e);
  const n = rnd(37);
  const hit = n !== 0 && ({ red: RED.has(n), black: !RED.has(n), odd: n % 2 === 1, even: n % 2 === 0, low: n <= 18, high: n >= 19, dozen: Math.ceil(n / 12) === pick })[kind] || (kind === 'num' && n === pick);
  const win = hit ? bet * ok[kind] : 0;
  pay(u, cur, win);
  if (hit && kind === 'num') bigWin(u, '룰렛', cur, win, 36);
  return { n, red: RED.has(n), hit, win, mult: hit ? ok[kind] : 0 };
}

/* 더블업: 동전 앞뒤를 맞히면 두 배, 틀리면 전부 잃음. 10번 연속 = ×1024. 한 번 맞힐 확률 47% */
function doubleStart(u, cur, bet) {
  if (u.dbl) return err('진행 중인 더블업이 있어요. 먼저 끝내 주세요.');
  const e = takeBet(u, cur, bet); if (e) return err(e);
  u.dbl = { cur, bet, pot: bet, step: 0 };
  return { dbl: u.dbl };
}
function doubleFlip(u, pick) {
  const d = u.dbl; if (!d) return err('먼저 걸어 주세요.');
  if (!['head', 'tail'].includes(pick)) return err('앞면이나 뒷면을 골라 주세요.');
  const win = rnd(100) < 47, side = win ? pick : pick === 'head' ? 'tail' : 'head';
  if (!win) { delete u.dbl; return { side, win: false, lost: d.pot, dbl: null }; }
  d.pot *= 2; d.step++;
  if (d.step >= 10) { pay(u, d.cur, d.pot); bigWin(u, '더블업', d.cur, d.pot, 1024); delete u.dbl; return { side, win: true, max: true, cashed: d.pot, cur: d.cur, dbl: null }; }
  return { side, win: true, dbl: d };
}
function doubleCash(u) {
  const d = u.dbl; if (!d) return err('받을 게 없어요.');
  if (!d.step) return err('한 번은 던져야 받을 수 있어요.');
  pay(u, d.cur, d.pot); delete u.dbl;
  if (d.step >= 6) bigWin(u, '더블업', d.cur, d.pot, 2 ** d.step);
  return { cashed: d.pot, cur: d.cur, dbl: null };
}

/* 하이로우: 카드 한 장을 보고 다음 카드가 높을지 낮을지. 맞히면 배당이 쌓이고, 언제든 멈추고 받기 (최대 10번)
   배당 = 0.95 × 13 / (이기는 카드 수). 같은 숫자가 나오면 짐 */
const HILO_MAX = 10;
const card = () => ({ v: 1 + rnd(13), s: rnd(4) });
const hiloOdds = (v) => ({ hi: 13 - v ? +(0.95 * 13 / (13 - v)).toFixed(2) : 0, lo: v - 1 ? +(0.95 * 13 / (v - 1)).toFixed(2) : 0 });
function hiloStart(u, cur, bet) {
  if (u.hilo) return err('진행 중인 하이로우가 있어요. 먼저 끝내 주세요.');
  const e = takeBet(u, cur, bet); if (e) return err(e);
  u.hilo = { cur, bet, pot: bet, step: 0, card: card(), hist: [] };
  return { hilo: { ...u.hilo, odds: hiloOdds(u.hilo.card.v) } };
}
function hiloGuess(u, pick) {
  const h = u.hilo; if (!h) return err('먼저 걸어 주세요.');
  if (!['hi', 'lo'].includes(pick)) return err('높음이나 낮음을 골라 주세요.');
  const odds = hiloOdds(h.card.v)[pick]; if (!odds) return err(pick === 'hi' ? 'K보다 높은 카드는 없어요!' : 'A보다 낮은 카드는 없어요!');
  const next = card(), win = pick === 'hi' ? next.v > h.card.v : next.v < h.card.v;
  h.hist.push(h.card); const prev = h.card; h.card = next;
  if (!win) { delete u.hilo; return { prev, card: next, win: false, lost: h.pot, hilo: null }; }
  h.pot = Math.floor(h.pot * odds); h.step++;
  if (h.step >= HILO_MAX) { pay(u, h.cur, h.pot); bigWin(u, '하이로우', h.cur, h.pot, Math.round(h.pot / h.bet)); delete u.hilo; return { prev, card: next, win: true, max: true, cashed: h.pot, cur: h.cur, hilo: null }; }
  return { prev, card: next, win: true, hilo: { ...h, odds: hiloOdds(next.v) } };
}
function hiloCash(u) {
  const h = u.hilo; if (!h) return err('받을 게 없어요.');
  if (!h.step) return err('한 번은 맞혀야 받을 수 있어요.');
  pay(u, h.cur, h.pot); delete u.hilo;
  if (h.pot / h.bet >= 30) bigWin(u, '하이로우', h.cur, h.pot, Math.round(h.pot / h.bet));
  return { cashed: h.pot, cur: h.cur, hilo: null };
}

/* 복권 긁기: 한 장 1,000GP. 1등 100만GP는 20만 장에 한 장 */
const SCRATCH_PRICE = 1000;
const PRIZES = [[1000000, 5], [100000, 50], [20000, 500], [5000, 5000], [2000, 30000], [1000, 250000], [500, 250000]]; // [상금, 100만 장 중 몇 장]
function scratch(u) {
  const e = takeBet(u, 'gp', SCRATCH_PRICE); if (e) return err(e);
  let r = rnd(1000000), prize = 0;
  for (const [p, w] of PRIZES) { if (r < w) { prize = p; break; } r -= w; }
  pay(u, 'gp', prize);
  if (prize >= 100000) bigWin(u, '복권', 'gp', prize, prize / SCRATCH_PRICE);
  // 그림 9칸: 같은 금액 3개가 나오면 당첨
  const amounts = [500, 1000, 2000, 5000, 20000, 100000, 1000000];
  let cells;
  do {
    cells = Array.from({ length: 9 }, () => amounts[rnd(amounts.length)]);
    if (prize) { const idx = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => rnd(3) - 1).slice(0, 3); idx.forEach((i) => { cells[i] = prize; }); }
  } while (amounts.some((a) => a !== prize && cells.filter((c) => c === a).length >= 3) || (prize && cells.filter((c) => c === prize).length !== 3));
  return { prize, cells };
}

function view(u) {
  const b = book(u);
  return { cur: CUR, wallet: Object.fromEntries(Object.keys(CUR).map((k) => [k, u[k] || 0])), jackpot: cas().jackpot, plays: b.plays, max: DAILY_PLAYS, net: b.net,
    wins: cas().wins, dbl: u.dbl || null, hilo: u.hilo ? { ...u.hilo, odds: hiloOdds(u.hilo.card.v) } : null, slot: { sym: SYM.map(([s]) => s), triple: TRIPLE, pair: PAIR }, scratch: { price: SCRATCH_PRICE, prizes: PRIZES.map(([p]) => p) } };
}
function api(route, u, key, b) {
  const cur = String(b.cur || 'gp'), bet = Math.floor(Number(b.bet));
  switch (route) {
    case 'GET /api/casino': return { casino: view(u) };
    case 'POST /api/casino/slot': { const r = slot(u, cur, bet); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/roulette': { const r = roulette(u, cur, bet, String(b.kind || ''), Number(b.pick)); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/double': { const r = doubleStart(u, cur, bet); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/flip': { const r = doubleFlip(u, String(b.pick || '')); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/cash': { const r = doubleCash(u); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/hilo': { const r = hiloStart(u, cur, bet); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/hilo/guess': { const r = hiloGuess(u, String(b.pick || '')); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/hilo/cash': { const r = hiloCash(u); return r.error ? r : { ...r, casino: view(u) }; }
    case 'POST /api/casino/scratch': { const r = scratch(u); return r.error ? r : { ...r, casino: view(u) }; }
    default: return undefined;
  }
}
module.exports = { takeBet, pay, bigWin, CUR, hiloOdds, init, api, SYM, TRIPLE, PAIR, PRIZES, SCRATCH_PRICE };
