const test = require('node:test');
const assert = require('node:assert');
const { MONSTERS, MOVES, CHART } = require('../server/data');
const E = require('../server/engine');

const teamOf = (ids) => ids.map((species) => ({ species, moves: MONSTERS[species].moves.slice(0, 4) }));
const battle = (a, b, seed = 7) => E.createBattle([{ name: '가', team: a }, { name: '나', team: b }], seed);
const move = (b, s, id) => {
  const i = E.activeOf(b, s).moves.findIndex((m) => m.id === id);
  return E.choose(b, s, { type: 'move', index: i });
};
const custom = (species, moves) => [{ species, moves }, { species: 'daeya', moves: ['tackle'] }];

test('모든 요괴의 기술과 상성 데이터가 올바르다', () => {
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.ok(m.moves.length >= 4, id);
    for (const mv of m.moves) assert.ok(MOVES[mv], `${id}: ${mv}`);
    for (const t of m.types) assert.ok(CHART[t], t);
  }
});

test('조사가 받침에 맞게 붙는다', () => {
  assert.equal(E.josa('깨비', '은/는'), '깨비는');
  assert.equal(E.josa('장독', '이/가'), '장독이');
});

test('상성 면역: 땅 타입은 전기 공격을 받지 않는다', () => {
  const b = battle(custom('orak', ['highvolt']), custom('maetdol', ['tackle']));
  const hp = E.activeOf(b, 1).hp;
  E.choose(b, 0, { type: 'move', index: 0 });
  E.choose(b, 1, { type: 'move', index: 0 });
  assert.equal(E.activeOf(b, 1).hp, hp);
});

test('2배 상성은 1배보다 약 2배 피해를 주고, 절반 상성은 약 절반이다', () => {
  const dmg = (species) => {
    const b = battle(custom('horong', ['flame']), custom(species, ['tackle']), 11);
    const foe = b.sides[1].mons[0];
    foe.stats = { ...foe.stats, spd: 100, spe: 1 };
    foe.hp = foe.maxHp = 2000;
    E.choose(b, 0, { type: 'move', index: 0 });
    E.choose(b, 1, { type: 'move', index: 0 });
    return 2000 - foe.hp;
  };
  const neutral = dmg('kkaebi'), strong = dmg('kongsiru'), weak = dmg('daeya');
  assert.ok(Math.abs(strong / neutral - 2) < .1, `${strong}/${neutral}`);
  assert.ok(Math.abs(weak / neutral - .5) < .1, `${weak}/${neutral}`);
});

test('선제 기술은 스피드가 느려도 먼저 나간다', () => {
  const b = battle(custom('jangseung', ['ambush']), custom('bangpae', ['highvolt']));
  move(b, 0, 'ambush');
  const { events } = move(b, 1, 'highvolt');
  assert.equal(events.find((e) => e.t === 'move').side, 0);
});

test('막기는 공격을 막는다', () => {
  const b = battle(custom('kkaebi', ['club']), custom('maetdol', ['guard']));
  const hp = E.activeOf(b, 1).hp;
  move(b, 0, 'club');
  move(b, 1, 'guard');
  assert.equal(E.activeOf(b, 1).hp, hp);
});

test('독/쇠 면역과 교체 시 능력치 초기화', () => {
  const b = battle(custom('jangdok', ['fog', 'tackle']), custom('kkangtong', ['armor']));
  for (let i = 0; i < 5; i++) { move(b, 0, 'fog'); move(b, 1, 'armor'); if (b.phase !== 'choose') break; }
  assert.equal(E.activeOf(b, 1).status, null);
  assert.ok(E.activeOf(b, 1).stages.def > 0);
  const mon = E.activeOf(b, 1);
  E.choose(b, 0, { type: 'move', index: 1 });
  E.choose(b, 1, { type: 'switch', index: 1 });
  assert.equal(mon.stages.def, 0);
});

test('압정은 교체해 들어온 요괴에게 피해를 준다', () => {
  const b = battle(custom('kettle', ['tacks']), custom('daeya', ['tackle']));
  move(b, 0, 'tacks');
  E.choose(b, 1, { type: 'move', index: 0 });
  E.choose(b, 0, { type: 'move', index: 0 });
  E.choose(b, 1, { type: 'switch', index: 1 });
  const m = E.activeOf(b, 1);
  assert.ok(m.hp < m.maxHp);
});

test('쓰러지면 교체 단계로 넘어가고, 쓰러진 쪽만 고른다', () => {
  const b = battle(custom('kkaebi', ['soulrush']), custom('horong', ['ember']), 3);
  b.sides[1].mons[0].hp = 1;
  E.choose(b, 0, { type: 'move', index: 0 });
  E.choose(b, 1, { type: 'move', index: 0 });
  assert.equal(b.phase, 'switch');
  assert.deepEqual(b.needs, [false, true]);
  assert.equal(E.choose(b, 0, { type: 'move', index: 0 }).ok, false);
  assert.ok(E.choose(b, 1, { type: 'switch', index: 1 }).events);
  assert.equal(b.phase, 'choose');
});

test('불법 행동을 거부한다', () => {
  const b = battle(custom('kkaebi', ['club']), custom('horong', ['ember']));
  assert.equal(E.choose(b, 0, { type: 'move', index: 3 }).ok, false);
  assert.equal(E.choose(b, 0, { type: 'switch', index: 0 }).ok, false);
  assert.equal(E.choose(b, 0, null).ok, false);
  b.sides[0].mons[1].hp = 0;
  assert.equal(E.choose(b, 0, { type: 'switch', index: 1 }).ok, false);
});

test('PP가 다 떨어지면 악쓰기로 싸운다', () => {
  const b = battle(custom('kkaebi', ['club']), custom('daeya', ['guard']));
  E.activeOf(b, 0).moves[0].pp = 0;
  assert.deepEqual(E.legalActions(b, 0)[0], { type: 'move', index: -1 });
  const r1 = E.choose(b, 0, { type: 'move', index: -1 });
  assert.equal(r1.ok, true);
  const { events } = E.choose(b, 1, { type: 'move', index: 0 });
  assert.equal(events.find((e) => e.t === 'move' && e.side === 0).move, '악쓰기');
});

test('상대 정보가 뷰에서 숨겨진다', () => {
  const b = battle(teamOf(['kkaebi', 'horong', 'daeya']), teamOf(['maetdol', 'fan', 'orak']));
  const v = E.viewFor(b, 0);
  assert.equal(v.opp.active.moves, undefined);
  assert.equal(v.opp.mons, undefined);
  assert.equal(v.opp.left, 3);
});

test('봇끼리 3000판: 항상 끝나고 예외가 없으며, 체력이 범위를 벗어나지 않는다', () => {
  const ids = Object.keys(MONSTERS);
  let seed = 1, maxTurn = 0, draws = 0;
  const wins = Object.fromEntries(ids.map((i) => [i, 0]));
  const plays = Object.fromEntries(ids.map((i) => [i, 0]));
  const pick = () => {
    const pool = [...ids];
    return Array.from({ length: 6 }, () => {
      const id = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const mv = [...MONSTERS[id].moves].sort(() => Math.random() - .5).slice(0, 4);
      return { species: id, moves: mv };
    });
  };
  for (let g = 0; g < 3000; g++) {
    const t0 = pick(), t1 = pick();
    const b = battle(t0, t1, seed++);
    let guard = 0;
    while (b.phase !== 'over') {
      assert.ok(++guard < 3000, '전투가 끝나지 않음');
      for (const s of [0, 1]) {
        if (b.phase === 'over' || !b.needs[s] || b.pending[s]) continue;
        const r = E.choose(b, s, E.botAction(b, s));
        assert.ok(r.ok, 'botAction이 불법 행동을 골랐다');
        if (r.events) for (const e of r.events) if (e.t === 'hp') assert.ok(e.hp >= 0 && e.hp <= e.maxHp);
      }
    }
    maxTurn = Math.max(maxTurn, b.turn);
    if (b.winner === null) draws++;
    else (b.winner === 0 ? t0 : t1).forEach((m) => wins[m.species]++);
    [...t0, ...t1].forEach((m) => plays[m.species]++);
  }
  const rate = ids.map((i) => [MONSTERS[i].n, Math.round((wins[i] / plays[i]) * 100)]).sort((a, c) => c[1] - a[1]);
  console.log(`최장 ${maxTurn}턴, 무승부 ${draws}판`);
  console.log(rate.map((r) => r.join(' ') + '%').join(', '));
  assert.ok(rate[0][1] < 72, `밸런스 이상: ${rate[0]}`);
  assert.ok(rate[rate.length - 1][1] > 28, `밸런스 이상: ${rate[rate.length - 1]}`);
});
