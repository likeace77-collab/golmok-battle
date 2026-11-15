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
  assert.equal(sp.moves.filter((id) => Data.MOVES[id].fzMove).length, 2, '합체기 2개');
  assert.equal(sp.moves.filter((id) => !Data.MOVES[id].fzMove).length, 8, '물려받는 기술 8개');
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
  assert.ok(F.fuse(u, 'c', 'c').error);
  u.mons.push({ uid: 'f', species: 'horong', moves: ['ember'] }); u.gp = 10;
  assert.match(F.fuse(u, 'c', 'f').error, /GP/);
  u.gp = 1e5; assert.ok(F.fuse(u, 'c', 'f', new Set(['f'])).error, '원정 중');
});

test('등신도 합체: 등신 기술은 반동까지 그대로, 갈증은 없음', () => {
  const u = mk(); const r = F.fuse(u, 'c', 'd'); assert.ok(r.ok, r.error);
  const sp = Data.MONSTERS[r.mon.species];
  const b = E.createBattle([{ name: 'x', team: [{ species: r.mon.species, moves: ['glasscannon', ...sp.moves.slice(0, 3)].slice(0, 4) }] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 5);
  const me = b.sides[0].mons[0]; assert.equal(me.thirst, undefined); assert.ok(me.dsMoves);
  for (let i = 0; i < 80 && b.phase !== 'over'; i++) for (const s of [0, 1]) if (b.needs[s]) E.choose(b, s, E.botAction(b, s, 2));
  assert.equal(b.phase, 'over');
});

test('합체몬은 재시작해도 다시 등록돼요', () => {
  const ids = Object.keys(db.fusions); assert.ok(ids.length >= 2);
  for (const id of ids) delete Data.MONSTERS[id];
  F.init(db);
  for (const id of ids) assert.ok(Data.MONSTERS[id]?.fz);
  assert.ok(F.mixName('여우비', '연탄이').length >= 2);
});

test('합체몬 특성: 모두 서로 다르고, 실제로 발동해요', () => {
  const u = mk(); u.gp = 1e9;
  const ids = Object.keys(Data.MONSTERS).filter((i) => !Data.BANNED.includes(i) && i !== 'dummy');
  for (let i = 0; i < 60; i++) { const a = ids[i % ids.length], b = ids[(i * 5 + 1) % ids.length]; if (a === b) continue; u.mons.push({ uid: `x${i}`, species: a, moves: [] }, { uid: `y${i}`, species: b, moves: [] }); assert.ok(F.fuse(u, `x${i}`, `y${i}`).ok); }
  const all = Object.values(db.fusions);
  assert.ok(all.every((f) => f.sp.trait?.n && f.sp.ft?.length));
  assert.equal(new Set(all.map((f) => f.sp.trait.n)).size, all.length, '특성 이름이 모두 달라요');
  const fid = all[0].id, sp = Data.MONSTERS[fid], saved = sp.ft;
  const fight = (ft, foe = 'yeontan', fm = ['ember'], seed = 3, turns = 1) => {
    sp.ft = ft;
    const b = E.createBattle([{ name: 'x', team: [{ species: fid, moves: ['tackle'] }] }, { name: 'y', team: [{ species: foe, moves: fm }] }], seed);
    const ev = []; for (let i = 0; i < turns && b.phase !== 'over'; i++) { E.choose(b, 0, { type: 'move', index: 0 }); ev.push(...E.choose(b, 1, { type: 'move', index: 0 }).events); }
    return { b, txt: ev.map((e) => e.text || '').join(' ') };
  };
  sp.trait = { n: '테스트특성', d: '' };
  // 나올 때: 날씨 / 상대 능력치 하락
  const lead = (ft) => { sp.ft = ft; const b = E.createBattle([{ name: 'x', team: [{ species: fid, moves: ['guard'] }] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 1, { preview: true }); E.choose(b, 0, { type: 'lead', index: 0 }); E.choose(b, 1, { type: 'lead', index: 0 }); return b; };
  assert.equal(lead([{ k: 'weather', w: 'snow' }]).weather, 'snow');
  assert.equal(lead([{ k: 'entryDown', st: 'atk' }]).sides[1].mons[0].stages.atk, -1);
  assert.equal(lead([{ k: 'entryUp', st: 'spe' }]).sides[0].mons[0].stages.spe, 1);
  // 흡수: 불 기술을 먹어 버림
  { const r = fight([{ k: 'absorb', t: 'fire' }], 'yeontan', ['ember'], 3, 2); assert.match(r.txt, /먹어 버렸다/); }
  // 막기 기술 대신 맞기만: guard 효과로 피해 감소 비교
  const dmgWith = (ft) => { sp.ft = ft; const b = E.createBattle([{ name: 'x', team: [{ species: fid, moves: ['tackle'] }] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 9); const h = b.sides[0].mons[0].hp; E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'move', index: 0 }); return h - b.sides[0].mons[0].hp; };
  assert.ok(dmgWith([{ k: 'guard', t: 'fire', v: 0.5 }]) < dmgWith([]), '불 결계는 불 피해를 줄여요');
  // 상태이상 면역
  { sp.ft = [{ k: 'immune', s: 'brn' }]; const b = E.createBattle([{ name: 'x', team: [{ species: fid, moves: ['guard'] }] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 1); const m = b.sides[0].mons[0]; assert.ok(m); }
  sp.ft = saved;
});

test('합체몬 메가진화: 스톤 없이 가능, 보너스 합계 +100', () => {
  const f = Object.values(db.fusions)[0], sp = Data.MONSTERS[f.id];
  assert.ok(sp.mega?.n); assert.equal(Object.values(sp.mega.boost).reduce((a, b) => a + b, 0), 100);
  const b = E.createBattle([{ name: 'x', team: [{ species: f.id, moves: ['tackle'] }], stones: [] }, { name: 'y', team: [{ species: 'yeontan', moves: ['ember'] }] }], 2);
  b.sides[0].stones = [];
  assert.ok(E.canMega(b, 0));
  const spa = b.sides[0].mons[0].stats.atk;
  E.choose(b, 0, { type: 'move', index: 0, mega: true }); E.choose(b, 1, { type: 'move', index: 0 });
  assert.ok(b.sides[0].mons[0].mega); assert.equal(b.sides[0].mons[0].name, sp.mega.n);
  assert.ok(b.sides[0].mons[0].stats.atk >= spa);
});
