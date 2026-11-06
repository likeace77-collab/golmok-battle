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
  const read = (f) => require('fs').readFileSync(require('path').join(__dirname, '../public/js', f), 'utf8');
  const art = read('art.js'), mega = read('mega-art.js'), newArt = read('new-art.js');
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.match(art + newArt, new RegExp(`\\b${id}: (wrap|L)\\(`), id);
    assert.match(mega + newArt, new RegExp(`\\b${id}: L\\(`), `메가 ${id}`);
    assert.equal(new Set(m.moves).size, m.moves.length, id);
  }
  assert.equal(Object.keys(MONSTERS).length, 36);
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

test('모든 스킬에 전용 연출이 있다', () => {
  const fx = require('fs').readFileSync(require('path').join(__dirname, '../public/js/fx.js'), 'utf8');
  const body = fx.slice(fx.indexOf('const MOVE_FX'), fx.indexOf('function weatherFx'));
  for (const id of [...Object.keys(MOVES), 'struggle']) {
    assert.match(body, new RegExp(`\\n    ${id}(:|\\()`), id);
  }
});

test('모든 요괴에게 전용기가 있고 다른 요괴는 배울 수 없다', () => {
  const owner = {};
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.ok(m.sig && MOVES[m.sig].sig, id);
    assert.equal(m.moves[0], m.sig);
    owner[m.sig] = (owner[m.sig] || 0) + 1;
    assert.equal(Object.values(m.mega.boost).reduce((a, c) => a + c), 100, id);
  }
  assert.equal(Object.keys(owner).length, 36);
  for (const m of Object.values(MONSTERS)) for (const mv of m.moves) if (MOVES[mv].sig) assert.equal(mv, m.sig);
});

test('메가진화: 행동을 쓰지 않고, 능력치가 오르며, 한 판에 한 번만 된다', () => {
  const b = battle([{ species: 'kkaebi', moves: ['club', 'guard'] }, { species: 'horong', moves: ['ember'] }], custom('daeya', ['tackle']), 4);
  const m = E.activeOf(b, 0), atk = m.stats.atk, maxHp = m.maxHp;
  m.hp = maxHp - 10;
  assert.equal(E.choose(b, 0, { type: 'switch', index: 1, mega: true }).ok, false);
  E.choose(b, 0, { type: 'move', index: 0, mega: true });
  const { events } = E.choose(b, 1, { type: 'move', index: 0 });
  const iMega = events.findIndex((e) => e.t === 'mega'), iMove = events.findIndex((e) => e.t === 'move' && e.side === 0);
  assert.ok(iMega >= 0 && iMove > iMega, '메가 뒤 같은 턴에 공격');
  assert.equal(m.name, '도깨비대장');
  assert.ok(m.stats.atk > atk);
  assert.equal(E.viewFor(b, 0).canMega, false);
  E.choose(b, 0, { type: 'switch', index: 1 });
  E.choose(b, 1, { type: 'move', index: 0 });
  assert.equal(E.choose(b, 0, { type: 'move', index: 0, mega: true }).ok, false);
  assert.equal(E.canMega(b, 1), true);
  assert.equal(E.viewFor(b, 0).me.mons[0].mega, true);
});

test('모든 요괴의 배울 수 있는 기술은 10개다', () => {
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.equal(m.moves.length, 10, id);
    assert.equal(new Set(m.moves).size, 10, id);
  }
});

test('난이도가 높을수록 이긴다', () => {
  const fight = (hi, lo, games = 240) => {
    let wins = 0, played = 0, seed = 1000 + hi * 7 + lo;
    for (let g = 0; g < games; g++) {
      const t0 = E.botTeam(lo, 3);
      const t1 = E.botTeam(hi, 3, t0);
      const flip = g % 2;
      const b = E.createBattle([{ name: '가', team: flip ? t1 : t0 }, { name: '나', team: flip ? t0 : t1 }], seed++, { preview: true });
      const level = flip ? [hi, lo] : [lo, hi];
      let guard = 0;
      while (b.phase !== 'over' && ++guard < 3000) {
        for (const s of [0, 1]) {
          if (b.phase === 'over' || !b.needs[s] || b.pending[s]) continue;
          assert.ok(E.choose(b, s, E.botAction(b, s, level[s])).ok, `불법 행동 level ${level[s]}`);
        }
      }
      assert.equal(b.phase, 'over');
      if (b.winner === null) continue;
      played++;
      if (b.winner === (flip ? 0 : 1)) wins++;
    }
    return Math.round((wins / played) * 100);
  };
  const r = [fight(1, 0), fight(2, 1), fight(3, 2), fight(3, 0)];
  console.log(`보통>쉬움 ${r[0]}%, 어려움>보통 ${r[1]}%, 지옥>어려움 ${r[2]}%, 지옥>쉬움 ${r[3]}%`);
  assert.ok(r[0] > 70, `보통 대 쉬움 ${r[0]}`);
  assert.ok(r[1] > 55, `어려움 대 보통 ${r[1]}`);
  assert.ok(r[2] > 60, `지옥 대 어려움 ${r[2]}`);
});

test('태그: 네 자리 대전이 팀 단위로 끝나고 대상을 고를 수 있다', () => {
  const t = () => E.botTeam(1, 3);
  const players = [t(), t(), t(), t()].map((team, i) => ({ name: `선수${i}`, team }));
  const b = E.createBattle(players, 77, { preview: true });
  const v = E.viewFor(b, 1);
  assert.equal(v.doubles, true);
  assert.equal(v.ally.seat, 0);
  assert.deepEqual(v.opps.map((o) => o.seat), [2, 3]);
  assert.equal(v.opps[0].active, null);
  [0, 1, 2, 3].forEach((s) => E.choose(b, s, { type: 'lead', index: 0 }));
  assert.equal(b.phase, 'choose');

  const mon = (id) => ({ species: id, moves: ['guard'] });
  const c = E.createBattle([0, 1, 2, 3].map((i) => ({ name: `${i}`, team: [{ species: 'kkaebi', moves: ['club'] }, mon('maetdol')] })), 5);
  E.choose(c, 0, { type: 'move', index: 0, target: 3 });
  E.choose(c, 1, { type: 'switch', index: 1 });
  E.choose(c, 2, { type: 'switch', index: 1 });
  const { events } = E.choose(c, 3, { type: 'switch', index: 1 });
  assert.equal(events.find((e) => e.t === 'move').target, 3);
  c.sides[2].mons.forEach((m) => { m.hp = 0; });
  assert.equal(E.choose(c, 0, { type: 'move', index: 0, target: 2 }).ok, true);

  const d = E.createBattle([0, 1, 2, 3].map((i) => ({ name: `${i}`, team: [{ species: 'kettle', moves: ['tacks', 'squirt'] }, mon('daeya')] })), 8);
  [0, 1, 2, 3].forEach((s) => E.choose(d, s, { type: 'move', index: 0 }));
  assert.ok(d.sides[0].hazard && d.sides[1].hazard && d.sides[2].hazard && d.sides[3].hazard, '압정은 팀 양쪽에 깔린다');
});

test('태그: 봇 넷이서 200판 모두 끝나고 불법 행동이 없다', () => {
  for (let g = 0; g < 200; g++) {
    const lv = g % 4;
    const players = [0, 1, 2, 3].map((i) => ({ name: `선수${i}`, team: E.botTeam(lv, 3) }));
    const b = E.createBattle(players, 300 + g, { preview: true });
    let guard = 0;
    while (b.phase !== 'over') {
      assert.ok(++guard < 4000, '태그 전투가 끝나지 않음');
      for (const s of [0, 1, 2, 3]) {
        if (b.phase === 'over' || !b.needs[s] || b.pending[s]) continue;
        const r = E.choose(b, s, E.botAction(b, s, lv));
        assert.ok(r.ok, `불법 행동 ${lv} ${b.phase}`);
      }
    }
  }
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
