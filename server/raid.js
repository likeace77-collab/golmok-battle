'use strict';
// 레이드: 최대 4명이 한 팀으로 보스 한 마리와 싸웁니다.
//  - 거다이 레이드: 날마다 바뀌는 거다이맥스 보스 (판 내내 거다이맥스)
//  - 흑화 메가배틀: 친구 한 명의 에이스가 흑화해 메가진화한 채로 등장 (+5 강화)
const Data = require('./data');
const E = require('./engine');

const KST = 9 * 3600e3;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
const MAX = 4, SIZE = 3, DAILY = 3, LIMIT = 15;
// 사람 수(봇 동료 포함)별 보스 체력 배수: 봇끼리 300판씩 돌려 승률 55~70%쯤
const HP = { gmax: [0, 1.6, 6.5, 10, 17], dark: [0, 1.9, 7.5, 11.5, 19.5] };
const REWARD = {
  gmax: { gp: 6000, tickets: 1, stones: 1, gpt: 60, rerolls: 3 },
  dark: { gp: 8000, tickets: 1, stones: 1, gpt: 80, rerolls: 3 },
  lose: { gp: 1000 },
  target: { gp: 2000 }, // 흑화했던 친구에게 (정화 선물)
};

const pool = () => Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id) && id !== 'deungsin');
// 오늘의 거다이 보스: 날짜로 정해짐
function todayBoss() {
  const ids = pool(), d = dayKey();
  let h = 0; for (const c of d) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const species = ids[h % ids.length];
  return { species, name: Data.MONSTERS[species].n, gname: Data.GMAX_MOVES[species] || '' };
}
// 친구의 에이스: 덱에서 강화가 가장 높은 골목몬 (같으면 앞자리)
function aceOf(team) {
  const list = team.filter((m) => !Data.BANNED.includes(m.species) && m.species !== 'deungsin');
  if (!list.length) return null;
  return list.reduce((a, m) => ((m.plus || 0) > (a.plus || 0) ? m : a), list[0]);
}

function book(u) {
  const d = dayKey();
  if (u.raid?.day !== d) u.raid = { day: d, n: 0 };
  return u.raid;
}
const left = (u) => Math.max(0, DAILY - book(u).n);

function boss(mode, target) {
  if (mode === 'dark') {
    const sp = target.ace;
    return {
      name: `흑화한 ${target.name}`, avatar: target.avatar, style: target.style, deck: '흑화 메가배틀',
      team: [{ species: sp.species, moves: sp.moves, plus: 5, ...(sp.shiny ? { shiny: true } : {}) }],
    };
  }
  const b = todayBoss();
  return { name: `거다이 ${b.name}`, avatar: null, style: null, deck: '거다이 레이드', team: [{ species: b.species, moves: E.smartMoves(b.species, []), plus: 5 }] };
}
const raidOpts = (mode, n, title) => ({ ...(mode === 'dark' ? { mega: true, dark: true } : { gmax: true }), hpMul: HP[mode][Math.max(1, Math.min(MAX, n))], limit: LIMIT, shock: mode === 'dark' ? 0.12 : 0.1, title });

module.exports = { MAX, SIZE, DAILY, LIMIT, REWARD, HP, todayBoss, aceOf, book, left, boss, raidOpts, dayKey };
