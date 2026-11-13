'use strict';
// 주간 이벤트 던전: 요일마다 규칙이 바뀌는 골목대장 5연전. 층마다 작은 보상, 5층을 다 깨면 큰 보상 (하루 한 번)
const Data = require('./data');
const E = require('./engine');

const KST = 9 * 3600e3;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);
const weekday = (t = Date.now()) => new Date(t + KST).getUTCDay(); // 0=일

const RULES = [
  { day: 0, id: 'chaos', n: '혼돈의 골목', icon: '🌀', d: '적이 강화 +2된 랜덤 덱으로 나와요.', size: 3, plus: 2 },
  { day: 1, id: 'fire', n: '불타는 골목', icon: '🔥', d: '적이 모두 불 타입이에요. 물·땅 골목몬을 챙겨요!', size: 3, type: 'fire' },
  { day: 2, id: 'water', n: '물바다 골목', icon: '🌊', d: '적이 모두 물 타입이에요. 풀·전기로 맞서요!', size: 3, type: 'water' },
  { day: 3, id: 'nomega', n: '맨주먹 골목', icon: '🚫', d: '양쪽 모두 메가진화를 못 해요. 순수 실력 승부!', size: 3, noMega: true },
  { day: 4, id: 'spirit', n: '으스스 골목', icon: '👻', d: '적이 모두 혼 타입이에요.', size: 3, type: 'spirit' },
  { day: 5, id: 'boss', n: '강적 러시', icon: '💪', d: '적이 강화 +4! 각오하고 들어가요.', size: 3, plus: 4 },
  { day: 6, id: 'solo', n: '1대1 연전', icon: '🥊', d: '한 마리씩 붙는 1대1 다섯 판이에요.', size: 1, plus: 1 },
];
const FLOORS = 5;
const FLOOR_R = [{ gp: 1500 }, { gp: 2000, skips: 3 }, { gp: 2500 }, { gp: 3000, skips: 5 }, { gp: 4000 }];
const CLEAR_R = { gp: 10000, tickets: 2, stones: 1, gpt: 100 };
const LEVELS = [1, 1, 2, 2, 3]; // 층별 골목대장 수준

const today = () => RULES.find((r) => r.day === weekday());
function book(u) {
  const d = dayKey();
  if (u.dungeon?.day !== d) u.dungeon = { day: d, floor: 0, cleared: false };
  return u.dungeon;
}
function view(u) {
  const b = book(u), r = today();
  return { rule: r, floor: b.floor, cleared: b.cleared, floors: FLOORS, floorR: FLOOR_R, clearR: CLEAR_R, week: RULES };
}
// 이번 층 적 팀
function foeTeam(rule, floor, enemy) {
  const level = LEVELS[floor];
  const ids = Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id));
  let team;
  if (rule.type) {
    const pool = ids.filter((id) => Data.MONSTERS[id].types.includes(rule.type));
    team = pool.sort(() => Math.random() - 0.5).slice(0, rule.size).map((species) => ({ species, moves: E.smartMoves(species, []) }));
  } else team = E.botTeam(level, rule.size, enemy);
  const plus = Math.min(5, (rule.plus || 0) + (floor >= 3 ? 1 : 0));
  return team.map((m) => ({ ...m, ...(plus ? { plus } : {}) }));
}
// 대전 결과
function result(u, floor, won, grant) {
  const b = book(u);
  if (!won || floor !== b.floor || b.cleared) return null;
  const got = grant(u, FLOOR_R[floor]);
  b.floor++;
  if (b.floor >= FLOORS) { b.cleared = true; got.push(...grant(u, CLEAR_R)); u.counts.dungeon = (u.counts.dungeon || 0) + 1; }
  return { got, floor: b.floor, cleared: b.cleared };
}

module.exports = { today, book, view, foeTeam, result, LEVELS, FLOORS };
