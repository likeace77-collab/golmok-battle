'use strict';
// 랭크전: 점수(시작 1000)와 티어, 시즌(시즌 패스와 같은 2주) 보상
const TIERS = [
  { id: 'bronze', n: '브론즈', min: 0, icon: '🥉', c: '#c8873a', r: { gp: 3000, rerolls: 5 } },
  { id: 'silver', n: '실버', min: 1100, icon: '🥈', c: '#b8c4d0', r: { gp: 6000, skips: 20, rerolls: 10 } },
  { id: 'gold', n: '골드', min: 1250, icon: '🥇', c: '#FFD23F', r: { gp: 10000, tickets: 1, rerolls: 15 } },
  { id: 'plat', n: '플래티넘', min: 1400, icon: '💠', c: '#6CF2C2', r: { gp: 15000, tickets: 2, stones: 1, rerolls: 20 } },
  { id: 'dia', n: '다이아', min: 1550, icon: '💎', c: '#2EF2FF', r: { gp: 20000, tickets: 3, stones: 1, rerolls: 25 } },
  { id: 'master', n: '마스터', min: 1700, icon: '👑', c: '#B44BFF', r: { gp: 30000, tickets: 4, stones: 2, rerolls: 30 } },
  { id: 'boss', n: '골목대장', min: 1850, icon: '🔥', c: '#ff3a4a', r: { gp: 50000, tickets: 6, stones: 3, rerolls: 40 } },
];
const START = 1000, WIN = 25, LOSS = 20, BOT_WIN = 12, BOT_LOSS = 10, SIZE = 3;
const tierOf = (pts) => { let t = 0; TIERS.forEach((x, i) => { if (pts >= x.min) t = i; }); return t; };

let H; // { seasonOf, grant, sendMail }
const init = (h) => { H = h; };

// 시즌이 바뀌면: 지난 시즌 최고 티어 보상을 우편으로, 점수는 반쯤 되돌림
function book(u) {
  const s = H.seasonOf();
  if (!u.rank) u.rank = { season: s, pts: START, w: 0, l: 0, best: 0, streak: 0, ever: 0 };
  const r = u.rank;
  if (r.season !== s) {
    if (r.w + r.l > 0) {
      const t = TIERS[r.best];
      const got = H.grant(u, t.r);
      H.sendMail(u, { from: '골목대전 랭크전', title: `시즌 ${r.season} 랭크 보상: ${t.icon} ${t.n}`, body: `지난 시즌 최고 티어 ${t.n}! 보상이 지갑에 들어왔어요. (${got.map((x) => x.k === 'gp' ? `${x.n}GP` : x.k === 'ticket' ? `입수권 ${x.n}` : x.k === 'skip' ? `스킵권 ${x.n}` : x.k === 'reroll' ? `리롤권 ${x.n}` : x.k === 'stone' ? '메가스톤' : '').filter(Boolean).join(', ')})` });
    }
    r.season = s; r.pts = Math.round(START + Math.max(0, r.pts - START) / 2); r.w = 0; r.l = 0; r.streak = 0; r.best = tierOf(r.pts);
  }
  return r;
}
function view(u) {
  const r = book(u), t = tierOf(r.pts), next = TIERS[t + 1];
  return { season: r.season, pts: r.pts, w: r.w, l: r.l, streak: r.streak, tier: t, best: r.best, ever: r.ever || 0, next: next ? next.min : null, floor: TIERS[t].min, tiers: TIERS, size: SIZE };
}
// 대전 결과 반영 → 바뀐 점수
function result(u, won, vsBot) {
  const r = book(u), before = r.pts;
  if (won) { r.w++; r.streak = Math.max(0, r.streak) + 1; r.pts += (vsBot ? BOT_WIN : WIN) + (vsBot ? 0 : Math.min(10, (r.streak - 1) * 2)); }
  else { r.l++; r.streak = 0; r.pts = Math.max(START - 200, r.pts - (vsBot ? BOT_LOSS : LOSS)); }
  r.best = Math.max(r.best, tierOf(r.pts)); r.ever = Math.max(r.ever || 0, r.best);
  return { delta: r.pts - before, pts: r.pts, tier: tierOf(r.pts), up: tierOf(r.pts) > tierOf(before) };
}
function board(users, season) {
  return Object.values(users).filter((u) => u.rank?.season === season && u.rank.w + u.rank.l > 0)
    .sort((a, b) => b.rank.pts - a.rank.pts).slice(0, 30)
    .map((u) => ({ name: u.name, avatar: u.avatar, pts: u.rank.pts, tier: tierOf(u.rank.pts), w: u.rank.w, l: u.rank.l }));
}
// 봇 상대 수준: 내 티어에 맞춰
const botLevel = (u) => Math.min(3, 1 + Math.floor(tierOf(book(u).pts) / 2));

module.exports = { TIERS, SIZE, init, book, view, result, board, tierOf, botLevel };
