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

test('모든 요괴에게 그림이 있고 스킬이 겹치지 않는다', () => {
  const art = require('fs').readFileSync(require('path').join(__dirname, '../public/js/art.js'), 'utf8');
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.match(art, new RegExp(`\\b${id}: wrap`), id);
    assert.equal(new Set(m.moves).size, m.moves.length, id);
  }
  assert.equal(Object.keys(MONSTERS).length, 31);
});

test('역류는 소나기에서 2배, 뻥 뚫기는 막기를 뚫고 압정을 치운다', () => {
  const hit = (weather) => {
    const b = battle(custom('batji', ['backflow']), custom('kkaebi', ['tackle']), 5);
    b.weather = weather; b.weatherTurns = 5;
    const foe = b.sides[1].mons[0]; foe.hp = foe.maxHp = 3000; foe.stats = { ...foe.stats, spe: 1 };
    E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'move', index: 0 });
    return 3000 - foe.hp;
  };
  const dry = hit(null), wet = hit('rain');
  assert.ok(wet / dry > 2.5, `소나기 1.5배 + 역류 2배: ${wet}/${dry}`);

  const c = battle(custom('ppeong', ['plunge']), custom('kkaebi', ['guard']));
  c.sides[0].hazard = true;
  const hp = E.activeOf(c, 1).hp;
  E.choose(c, 0, { type: 'move', index: 0 }); E.choose(c, 1, { type: 'move', index: 0 });
  assert.ok(E.activeOf(c, 1).hp < hp);
  assert.equal(c.sides[0].hazard, false);
});

test('엉겨붙기는 풀 타입에도 걸리고, 씨앗 심기는 안 걸린다', () => {
  const b = battle(custom('meokarak', ['tangle']), custom('kongsiru', ['guard']), 9);
  for (let i = 0; i < 12 && !E.activeOf(b, 1).seeded; i++) {
    E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'switch', index: 1 });
    E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'switch', index: 0 });
  }
  const anySeeded = b.sides[1].mons.some((m) => m.seeded === 'hair');
  assert.ok(anySeeded);
});

test('국물 리필은 회복하고 상태이상을 고치며, 허물 벗기는 능력치를 바꾼다', () => {
  const b = battle(custom('eomuk', ['refill']), custom('ppeondegi', ['molt']));
  const m = E.activeOf(b, 0);
  m.status = 'psn'; m.hp = 50;
  E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'move', index: 0 });
  assert.equal(m.status, null);
  assert.ok(m.hp > 50);
  assert.deepEqual(E.activeOf(b, 1).stages, { atk: 1, def: -1, spa: 1, spd: -1, spe: 1, acc: 0 });
});

test('나가면 나간 쪽이 진다', () => {
  const b = battle(custom('kkaebi', ['club']), custom('horong', ['ember']));
  const ev = E.forfeit(b, 1, true);
  assert.equal(b.winner, 0);
  assert.match(ev[0].text, /나갔다/);
});

test('대전 전: 선봉을 고르기 전까지 숨기고, 고른 요괴가 나온다', () => {
  const players = [{ name: '가', team: teamOf(['kkaebi', 'horong', 'daeya']) }, { name: '나', team: teamOf(['maetdol', 'fan', 'orak']) }];
  const b = E.createBattle(players, 3, { preview: true });
  const v = E.viewFor(b, 0);
  assert.equal(v.phase, 'preview');
  assert.equal(v.opp.active, null);
  assert.equal(v.opp.roster.length, 3);
  assert.equal(v.opp.roster[0].moves, undefined);
  assert.equal(E.choose(b, 0, { type: 'move', index: 0 }).ok, false);
  assert.equal(E.choose(b, 0, { type: 'lead', index: 3 }).ok, false);
  assert.equal(E.choose(b, 0, { type: 'lead', index: 2 }).events, null);
  assert.equal(E.viewFor(b, 1).opp.active, null);
  assert.equal(E.viewFor(b, 0).lead, 2);
  const { events } = E.choose(b, 1, E.botAction(b, 1));
  assert.equal(events.filter((e) => e.t === 'switch').length, 2);
  assert.equal(b.phase, 'choose');
  assert.equal(E.activeOf(b, 0).species, 'daeya');
  assert.equal(E.viewFor(b, 1).opp.active.species, 'daeya');
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
  assert.equal(v.opp.roster.filter((m) => !m.out).length, 3);
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
