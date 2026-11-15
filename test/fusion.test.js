'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Data = require('../server/data');
const E = require('../server/engine');
const F = require('../server/fusion');

const db = {}; F.init(db);
const mk = () => ({ name: '합체왕', gp: 100000, mons: [
  { uid: 'a', species: 'yeoubi', moves: ['foxrain'], shiny: true, aff: 40 }, { uid: 'b', species: 'yeontan', moves: ['ember'], plus: 2 },
  { uid: 'c', species: 'yeontan', moves: ['ember'] }, { uid: 'd', species: 'deungsin', moves: Data.MONSTERS.deungsin.moves.slice(0, 4) }],
decks: [{ name: 'd', team: [{ uid: 'a' }, { uid: 'b' }] }], active: 0, counts: {} });

test('합체: 두 마리가 사라지고 새 골목몬 한 마리가 태어나요', () => {
  const u = mk(), n = Object.keys(Data.MONSTERS).length;
  const r = F.fuse(u, 'a', 'b');
  assert.ok(r.ok, r.error);
  assert.equal(u.mons.length, 3); assert.ok(!u.mons.some((m) => m.uid === 'a' || m.uid === 'b'));
  assert.equal(u.gp, 100000 - F.FUSE_GP);
  const sp = Data.MONSTERS[r.mon.species];
  assert.ok(sp.fz && sp.parents.includes('yeoubi') && sp.parents.includes('yeontan'));
  assert.equal(Object.keys(Data.MONSTERS).length, n, '도감·스카우트 목록에는 안 섞여요');
  assert.ok(r.mon.shiny, '이로치가 있으면 합체몬도 이로치');
  // 능력치는 평균 근처, 타입은 양쪽에서 하나씩
  for (const k of Object.keys(sp.base)) { const avg = (Data.MONSTERS.yeoubi.base[k] + Data.MONSTERS.yeontan.base[k]) / 2; assert.ok(sp.base[k] >= Math.floor(avg * 0.9) && sp.base[k] <= Math.ceil(avg * 1.13), k); }
  assert.ok(sp.types.some((t) => Data.MONSTERS.yeoubi.types.includes(t)) && sp.types.some((t) => Data.MONSTERS.yeontan.types.includes(t)));
  // 기술은 두 골목몬에게서 + 합체기
  assert.ok(sp.moves.every((id) => Data.MOVES[id]));
  assert.ok(sp.moves.some((id) => Data.MOVES[id].fzMove), '합체기');
  assert.ok(sp.moves.filter((id) => !Data.MOVES[id].fzMove).every((id) => Data.MONSTERS.yeoubi.moves.includes(id) || Data.MONSTERS.yeontan.moves.includes(id)));
  assert.equal(u.decks[0].team.length, 1, '덱에서도 빠져요');
  // 트리에 기록
  const t = F.tree(u); assert.equal(t.list.length, 1); assert.equal(t.list[0].a.species, 'yeoubi'); assert.ok(t.list[0].alive);
  // 합체몬끼리 대전도 문제없이
  const b = E.createBattle([{ name: 'x', team: [{ species: r.mon.species, moves: sp.moves.slice(0, 4) }] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 3);
  for (let i = 0; i < 80 && b.phase !== 'over'; i++) for (const s of [0, 1]) if (b.needs[s]) E.choose(b, s, E.botAction(b, s, 2));
  assert.equal(b.phase, 'over');
});

test('합체 제한: 합체몬은 다시 못 하고, 같은 골목몬·등신·GP 부족은 안 돼요', () => {
  const u = mk();
  const r = F.fuse(u, 'a', 'b');
  assert.match(F.fuse(u, r.mon.uid, 'c').error, /더 합체/);
  u.mons.push({ uid: 'e', species: 'yeontan', moves: ['ember'] });
  assert.match(F.fuse(u, 'c', 'e').error, /서로 다른/);
  assert.ok(F.fuse(u, 'c', 'd').error, '등신은 합체 불가');
  assert.ok(F.fuse(u, 'c', 'c').error);
  u.mons.push({ uid: 'f', species: 'horong', moves: ['ember'] }); u.gp = 10;
  assert.match(F.fuse(u, 'c', 'f').error, /GP/);
  u.gp = 1e5; assert.ok(F.fuse(u, 'c', 'f', new Set(['f'])).error, '원정 중');
});

test('합체몬은 재시작해도 다시 등록돼요', () => {
  const ids = Object.keys(db.fusions); assert.ok(ids.length >= 2);
  for (const id of ids) delete Data.MONSTERS[id];
  F.init(db);
  for (const id of ids) assert.ok(Data.MONSTERS[id]?.fz);
  assert.ok(F.mixName('여우비', '연탄이').length >= 2);
});
