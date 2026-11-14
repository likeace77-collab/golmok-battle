'use strict';
// 골목몬을 먹이거나(강화) 교환해서 덱에서 빠졌을 때: 없는 골목몬은 지우고, 텅 빈 덱은 없앱니다.
// (빈 덱이 남아 있으면 덱 저장이 통째로 막혔음)
function pruneDecks(u) {
  if (!Array.isArray(u.decks) || !u.mons?.length) return; // 골목몬 정보가 아직 없는 옛 계정은 건드리지 않음
  const have = new Set((u.mons || []).map((m) => m.uid));
  const cur = u.decks[u.active];
  for (const d of u.decks) d.team = d.team.filter((t) => have.has(t.uid));
  let kept = u.decks.filter((d) => d.team.length);
  if (!kept.length && u.mons?.length) kept = [{ name: u.decks[0]?.name || '골목 기본 덱', team: [{ uid: u.mons[0].uid }] }];
  u.decks = kept;
  const i = u.decks.indexOf(cur);
  u.active = i >= 0 ? i : 0;
}
module.exports = { pruneDecks };
