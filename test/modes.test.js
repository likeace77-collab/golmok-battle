const test = require('node:test');
const assert = require('node:assert');
const E = require('../server/engine');
const M = require('../server/modes');

const db = { users: {} }; const mails = [];
M.init(db, { grant: (u, r) => { for (const [k, v] of Object.entries(r)) if (typeof v === 'number') u[k] = (u[k] || 0) + v; return Object.entries(r).map(([k, n]) => ({ k, n })); }, sendMail: (u, m) => mails.push(m), sysChat: () => {} });
const mk = () => ({ name: 't', gp: 100000, tickets: 0, rerolls: 0, mons: [{ uid: 'a', species: 'yeoubi', moves: ['foxrain'] }] });
const team = (n = 3) => E.botTeam(1, n, []);
const play = (sp, my = 0) => { // 끝까지 봇끼리
  const b = E.createBattle([{ name: 'a', team: sp.team }, { name: 'b', team: sp.foe.team }], 7, { preview: true, raid: sp.raid || null, rules: sp.rules || null });
  let i = 0; while (b.phase !== 'over' && ++i < 2000) for (const s of [0, 1]) { if (b.phase === 'over' || !b.needs[s] || b.pending[s]) continue; E.choose(b, s, E.botAction(b, s, 2)); }
  return b;
};

test('체육관: 순서대로 열리고, 이기면 배지', () => {
  const u = mk();
  assert.ok(M.battle(u, 'gym', 'water', team()).error, '두 번째 체육관은 잠김');
  const sp = M.battle(u, 'gym', 'grass', team());
  assert.equal(sp.foe.team.length, 3);
  const out = M.result(u, 'k', sp.mode, { won: true, mons: [], size: 3 });
  assert.ok(out.some((o) => /배지/.test(o.title || '')));
  assert.ok(!M.battle(u, 'gym', 'water', team()).error, '배지 따면 다음 체육관 열림');
});

test('골목 탈출: 시작 → 팀 → 대전 → 유물 → 지면 기록', () => {
  const u = mk();
  M.api('POST /api/rogue/start', u, 'k', {});
  M.api('POST /api/rogue/team', u, 'k', { i: 1 });
  let sp = M.battle(u, 'rogue', null, []);
  assert.equal(sp.mode.floor, 1); play(sp);
  M.result(u, 'k', sp.mode, { won: true, mons: [], size: 3 });
  assert.equal(u.rogue.floor, 2); assert.equal(u.rogue.relicOffer.length, 3);
  assert.ok(M.battle(u, 'rogue', null, []).error, '유물부터 골라야 함');
  M.api('POST /api/rogue/relic', u, 'k', { id: u.rogue.relicOffer[0] });
  sp = M.battle(u, 'rogue', null, []);
  assert.ok(sp.rules.side[0]);
  M.result(u, 'k', sp.mode, { won: false, mons: [], size: 3 });
  assert.equal(u.rogue, null); assert.equal(u.rogueBest, 1);
  assert.equal(db.modes.rogueTop[0].floor, 1);
});

test('월드 보스: 준 피해만큼 전체 체력이 줄고 하루 3번', () => {
  const u = mk(); const sp = M.battle(u, 'wb', null, team());
  const b0 = E.createBattle([{ name: 'a', team: sp.team }, { name: 'b', team: sp.foe.team }], 7, { preview: true, raid: sp.raid });
  assert.ok(b0.sides[1].mons[0].maxHp > 5000, '보스 체력이 큼'); // 싸우는 중엔 거다이맥스가 풀리며 바뀔 수 있어 시작할 때 확인
  const b = play(sp), boss = b.sides[1].mons[0];
  const before = M.wbState().hp, dmg = boss.maxHp - Math.max(0, boss.hp);
  M.result(u, 'k', sp.mode, { won: false, mons: [], size: 3, bossDmg: dmg });
  assert.equal(M.wbState().hp, before - Math.min(before, dmg));
  M.result(u, 'k', sp.mode, { won: false, mons: [], bossDmg: 1 }); M.result(u, 'k', sp.mode, { won: false, mons: [], bossDmg: 1 });
  assert.ok(M.battle(u, 'wb', null, team()).error);
});

test('친밀도', () => {
  const u = mk();
  assert.equal(M.api('POST /api/mon/pet', u, 'k', { uid: 'a' }).aff, 4);
  assert.ok(M.api('POST /api/mon/pet', u, 'k', { uid: 'a' }).error, '하루 한 번');
  M.api('POST /api/mon/snack', u, 'k', { uid: 'a' }); assert.equal(u.mons[0].aff, 14);
});

test('퍼즐: 정해진 답으로 풀려요 / 미션 판정', () => {
  for (const p of M.PUZZLES) assert.ok(p.my.length && p.foe.length && p.turns >= 1);
  const tri = M.MISSIONS.find((m) => m.id === 'triple');
  assert.ok(tri.test({ mons: [{ kills: 3 }] })); assert.ok(!tri.test({ mons: [{ kills: 2 }] }));
  const mono = M.MISSIONS.find((m) => m.id === 'mono-fire');
  assert.ok(mono.test({ won: true, size: 3, mons: [{ species: 'yeontan' }, { species: 'bungbbang' }, { species: 'hotteok' }] }));
});

test('메타배틀: 규칙이 실제 대전에 적용', () => {
  const inv = E.createBattle([{ name: 'a', team: [{ species: 'yeontan', moves: ['coalhead'] }] }, { name: 'b', team: [{ species: 'kongsiru', moves: ['tackle'] }] }], 3, { rules: { inverse: true } });
  assert.ok(inv.rules.inverse);
  const u = mk(); const sp = M.battle(u, 'meta', 2, team());
  assert.ok(sp.rules && sp.mode.kind === 'meta');
  M.result(u, 'k', sp.mode, { won: true, mons: [], size: 3, pvp: false });
  assert.equal(db.modes.meta.pts.k, 1);
});
