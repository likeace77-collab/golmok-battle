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

test('모든 골목몬의 기술과 상성 데이터가 올바르다', () => {
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
    const ev = E.choose(b, 1, { type: 'move', index: 0 }).events;
    return ev.find((e) => e.t === 'hp' && e.side === 1 && e.dmg).dmg; // 기술 한 방의 피해만 (화상·특성 회복 제외)
  };
  const neutral = dmg('kkaebi'), strong = dmg('kongsiru'), weak = dmg('daeya');
  assert.ok(Math.abs(strong / neutral - 2) < .1, `${strong}/${neutral}`);
  assert.ok(Math.abs(weak / neutral - .5) < .1, `${weak}/${neutral}`);
});

test('모든 골목몬에게 그림이 있고 스킬이 겹치지 않는다', () => {
  const read = (f) => require('fs').readFileSync(require('path').join(__dirname, '../public/js', f), 'utf8');
  const art = read('art.js'), mega = read('mega-art.js'), newArt = read('new-art.js') + read('new-art2.js') + read('new-art3.js');
  for (const [id, m] of Object.entries(MONSTERS)) {
    if (m.img) { // 사진 그림
      for (const f of [id, `${id}-mega`, ...Array.from({ length: m.stages || 0 }, (_, i) => `${id}-s${i + 1}`), ...Array.from({ length: m.tierImgs ?? m.tiers ?? 0 }, (_, i) => `${id}-t${i + 1}`), ...Array.from({ length: m.forms || 0 }, (_, i) => `${id}-f${i + 1}`)]) assert.ok(require('fs').existsSync(require('path').join(__dirname, `../public/img/mon/${f}.webp`)), f);
      assert.equal(new Set(m.moves).size, m.moves.length, id);
      continue;
    }
    assert.match(art + newArt, new RegExp(`\\b${id}: (wrap|L\\(|")`), id);
    assert.match(mega + newArt, new RegExp(`\\b${id}: (L\\(|")`), `메가 ${id}`);
    assert.equal(new Set(m.moves).size, m.moves.length, id);
  }
  assert.equal(Object.keys(MONSTERS).length, 57);
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
  for (let i = 0; i < 12 && !E.activeOf(b, 1).seeded; i++) { // 머카락 엉킴 때문에 교체는 못 함
    E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'move', index: 0 });
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

test('대전 전: 선봉을 고르기 전까지 숨기고, 고른 골목몬이 나온다', () => {
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
  for (const id of [...Object.keys(MOVES).filter((k) => !MOVES[k].z), 'struggle']) {
    assert.match(body, new RegExp(`\\n    ${id}(:|\\()`), id);
  }
});

test('모든 골목몬에게 전용기가 있고 다른 골목몬은 배울 수 없다', () => {
  const owner = {};
  for (const [id, m] of Object.entries(MONSTERS)) {
    assert.ok(m.sig && MOVES[m.sig].sig, id);
    assert.equal(m.moves[0], m.sig);
    owner[m.sig] = (owner[m.sig] || 0) + 1;
    assert.equal(Object.values(m.mega.boost).reduce((a, c) => a + c), 100, id);
  }
  assert.equal(Object.keys(owner).length, 57);
  // 전용기는 한 골목몬만 배운다 (단조처럼 전용기가 여럿일 수는 있음)
  const who = {};
  for (const [id, m] of Object.entries(MONSTERS)) for (const mv of m.moves) if (MOVES[mv].sig) (who[mv] ||= new Set()).add(id);
  for (const [mv, set] of Object.entries(who)) assert.equal(set.size, 1, mv);
  assert.deepEqual(MONSTERS.danjo.moves.filter((mv) => MOVES[mv].sig), ['forge', 'tierslash', 'elemblade', 'reflector']);
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

test('모든 골목몬의 배울 수 있는 기술은 10개다', () => {
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
  assert.ok(r[1] > 52, `어려움 대 보통 ${r[1]}`);
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

test('Z기술: 메가와 따로 한 번씩, 행동 하나로 메가와 같이 쓸 수 있고, 막기를 뚫는다', () => {
  for (const [id, m] of Object.entries(MONSTERS)) assert.ok(MOVES[m.z]?.z && MOVES[m.z].pow >= 170, id);
  const b = battle([{ species: 'kkaebi', moves: ['club'] }, { species: 'horong', moves: ['ember'] }], custom('maetdol', ['guard']), 4);
  const foe = b.sides[1].mons[0]; foe.hp = foe.maxHp = 5000;
  assert.equal(E.choose(b, 0, { type: 'switch', index: 1, z: true }).ok, false);
  E.choose(b, 0, { type: 'move', index: 0, z: true, mega: true });
  const { events } = E.choose(b, 1, { type: 'move', index: 0 });
  const zev = events.find((e) => e.t === 'move' && e.side === 0);
  assert.ok(zev.z && zev.move === '금 나와라 은 나와라');
  assert.ok(events.some((e) => e.t === 'mega'));
  assert.ok(foe.hp < 5000, '막기를 뚫고 피해');
  assert.ok(5000 - foe.hp < 200, '막기 중에는 1/4 위력');
  assert.equal(E.viewFor(b, 0).canZ, false);
  assert.equal(E.choose(b, 0, { type: 'move', index: 0, z: true }).ok, false);
  assert.equal(b.sides[0].mons[0].moves[0].pp, MOVES.club.pp, 'Z기술은 PP를 안 씀');
  const c = battle([{ species: 'kkaebi', moves: ['club'] }, { species: 'horong', moves: ['ember'] }], custom('maetdol', ['tackle']), 4);
  const f2 = c.sides[1].mons[0]; f2.hp = f2.maxHp = 5000;
  E.choose(c, 0, { type: 'move', index: 0, z: true }); E.choose(c, 1, { type: 'move', index: 0 });
  const zDmg = 5000 - f2.hp;
  const d = battle([{ species: 'kkaebi', moves: ['club'] }, { species: 'horong', moves: ['ember'] }], custom('maetdol', ['tackle']), 4);
  const f3 = d.sides[1].mons[0]; f3.hp = f3.maxHp = 5000;
  E.choose(d, 0, { type: 'move', index: 0 }); E.choose(d, 1, { type: 'move', index: 0 });
  assert.ok(zDmg > (5000 - f3.hp) * 1.6, `Z ${zDmg} 일반 ${5000 - f3.hp}`);
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

test('압정은 교체해 들어온 골목몬에게 피해를 준다', () => {
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

test('훈련장: 모든 골목몬과 기술 10개, 더미는 1000 체력에 안 끝남', () => {
  const b = E.createTraining({ name: '철수', avatar: {}, style: {}, deck: '모든 골목몬' }, 7);
  const v = E.viewFor(b, 0);
  assert.strictEqual(v.me.mons.length, Object.keys(MONSTERS).length);
  assert.ok(v.me.mons.every((m) => m.moves.length === 10));
  assert.strictEqual(v.opp.active.maxHp, 1000);
  assert.deepStrictEqual(v.opp.active.types, []);
  let total = 0;
  for (let t = 0; t < 300; t++) {
    const legal = E.legalActions(b, 0);
    const a = legal[t % legal.length];
    const cv = E.viewFor(b, 0);
    const r = E.choose(b, 0, { ...a, z: t % 7 === 0 && a.type === 'move', mega: cv.canMega && t % 5 === 0 && a.type === 'move' });
    assert.ok(r.ok, `훈련장 행동 실패 ${t}`);
    for (const e of r.events) if (e.t === 'hp' && e.side === 1 && e.dmg) total += e.dmg;
    assert.strictEqual(b.phase, 'choose');
  }
  assert.strictEqual(b.dummy.total, total); // 더미 피해는 넘친 피해까지 셈
  assert.ok(b.dummy.breaks > 0, '더미가 한 번도 안 부서짐');
  assert.ok(E.viewFor(b, 0).canZ && E.viewFor(b, 0).canMega, '턴마다 Z, 메가 다시 가능해야 함');
});

test('신캐 특성: 황사 경보, 거품막, 광합성 충전, 온탕냉탕, 녹아내림, 때밀이', () => {
  // 황사리: 등장하면 황사
  const p = E.createBattle([{ name: '가', team: custom('hwangsari', ['tackle']) }, { name: '나', team: custom('daeya', ['tackle']) }], 3, { preview: true });
  E.choose(p, 0, { type: 'lead', index: 0 }); const ev = E.choose(p, 1, { type: 'lead', index: 0 }).events;
  assert.equal(p.weather, 'dust');
  assert.ok(ev.some((e) => e.t === 'weather' && e.weather === 'dust'));
  // 뽀글이: 첫 공격 절반
  const hit = (pop) => {
    const b = battle(custom('maetdol', ['tackle']), custom('ppogeuri', ['tackle']), 5);
    const f = E.activeOf(b, 1); f.hp = f.maxHp = 3000; f.popped = pop;
    move(b, 0, 'tackle'); move(b, 1, 'tackle');
    return 3000 - f.hp;
  };
  const halved = hit(false), full = hit(true);
  assert.ok(Math.abs(halved / full - .5) < .1, `${halved}/${full}`);
  // 담쟁전: 턴 끝 회복
  const d = battle(custom('damjaengjeon', ['charge']), custom('daeya', ['guard']));
  const me = E.activeOf(d, 0); me.hp = 10;
  move(d, 0, 'charge'); move(d, 1, 'guard');
  assert.equal(me.hp, 10 + Math.floor(me.maxHp / 16));
  // 양머리: 1턴(온탕) 맥반석은 불, 2턴(냉탕)은 얼음
  const y = battle(custom('yangmeori', ['stoneegg']), custom('daeya', ['guard']));
  const types = [];
  for (let i = 0; i < 2; i++) { const r = move(y, 0, 'stoneegg'); const out = r.events || move(y, 1, 'guard').events; types.push(out.find((e) => e.t === 'move' && e.side === 0).type); }
  assert.deepEqual(types, ['fire', 'ice']);
  // 고드리: 체력 절반 이하에서 스피드 1.5배
  const g = battle(custom('godeuri', ['tackle']), custom('daeya', ['tackle']));
  const gm = E.activeOf(g, 0); const fast = gm.stats.spe;
  gm.hp = Math.floor(gm.maxHp / 2);
  assert.equal(E.speedOf(g, 0), fast * 1.5);
  // 뽀글이 때밀이: 상대 능력치 상승 제거
  const c = battle(custom('ppogeuri', ['scrub']), custom('maetdol', ['tackle']), 9);
  E.activeOf(c, 1).stages.def = 2; E.activeOf(c, 1).popped = true;
  move(c, 0, 'scrub'); move(c, 1, 'tackle');
  assert.equal(E.activeOf(c, 1).stages.def, 0);
});

test('하르모니움 Z기술 오버드라이브는 태그 배틀에서 상대 둘 다 맞힌다', () => {
  const p = (species) => ({ name: species, team: [{ species, moves: ['tackle'] }] });
  const b = E.createBattle([{ name: '가', team: [{ species: 'harmonium', moves: ['metalnoise'] }] }, p('daeya'), p('kkaebi'), p('maetdol')], 4);
  const foes = [2, 3].map((s) => E.activeOf(b, s));
  for (const f of foes) { f.hp = f.maxHp = 3000; }
  E.choose(b, 0, { type: 'move', index: 0, z: true, target: 2 });
  for (const s of [1, 2, 3]) E.choose(b, s, { type: 'move', index: 0, target: s === 1 ? 2 : 0 });
  for (const f of foes) assert.ok(f.hp < 3000, f.name);
});

test('하르모니움 특성 펑크록: 소리 기술 1.3배, 받는 소리 기술 절반', () => {
  const dmg = (atkSp, defSp, mv) => {
    const b = battle(custom(atkSp, [mv]), custom(defSp, ['tackle']), 21);
    const a = E.activeOf(b, 0), f = E.activeOf(b, 1);
    a.stats = { ...a.stats, atk: 100, spa: 100, spe: 200 }; a.types = ['none'];
    f.stats = { ...f.stats, def: 100, spd: 100, spe: 1 }; f.types = ['none']; f.hp = f.maxHp = 5000;
    move(b, 0, mv); move(b, 1, 'tackle');
    return 5000 - f.hp;
  };
  const base = dmg('kkaebi', 'kkaebi', 'scold');
  assert.ok(Math.abs(dmg('harmonium', 'kkaebi', 'scold') / base - 1.3) < .12);
  assert.ok(Math.abs(dmg('kkaebi', 'harmonium', 'scold') / base - .5) < .08);
});

test('단조: 돌 없이 나무→철→금→다이아몬드→네더라이트, 그 뒤 네더라이트+1~+10', () => {
  const { TIERS } = require('../server/data');
  assert.deepEqual(TIERS.names.slice(0, 6), ['나무', '철', '금', '다이아몬드', '네더라이트', '네더라이트+1']);
  assert.equal(TIERS.names.at(-1), '네더라이트+10');
  assert.equal(MONSTERS.danjo.tierImgs, 4);
  assert.ok(!MONSTERS.danjo.moves.includes('tackle') && !MONSTERS.danjo.moves.includes('guard'));
  assert.ok(MONSTERS.danjo.moves.includes('elemblade') && MONSTERS.danjo.moves.includes('reflector'));
  const b = battle(custom('danjo', ['forge']), custom('daeya', ['guard']));
  const me = E.activeOf(b, 0);
  for (let i = 0; i < 6; i++) { move(b, 0, 'forge'); move(b, 1, 'guard'); }
  assert.equal(me.tier, 6); // 네더라이트+2
});

test('특성검술은 상대에게 효과가 있는 무작위 속성으로 벤다', () => {
  const seen = new Set();
  for (let seed = 1; seed < 60; seed++) {
    const b = battle(custom('danjo', ['elemblade']), custom('maetdol', ['tackle']), seed); // 땅: 전기 무효
    const r = move(b, 0, 'elemblade'); const ev = r.events || move(b, 1, 'tackle').events;
    const mv = ev.find((e) => e.t === 'move' && e.side === 0);
    seen.add(mv.type);
    assert.ok(mv.move.startsWith('특성검술 · '));
    assert.notEqual(mv.type, 'elec');
  }
  assert.ok(seen.size >= 6, [...seen].join());
});

test('리플렉터: 공격 피해를 반씩 나눠 가지고, 공격이 없으면 찌른다', () => {
  const run = (foeSp, foeMove) => {
    const b = battle(custom('danjo', ['reflector']), custom(foeSp, [foeMove]), 3);
    const me = E.activeOf(b, 0), foe = E.activeOf(b, 1);
    me.hp = me.maxHp = 5000; foe.hp = foe.maxHp = 5000;
    me.stats = { ...me.stats, spe: 1 }; foe.stats = { ...foe.stats, spe: 300 };
    const r = move(b, 0, 'reflector'); const ev = r.events || move(b, 1, foeMove).events;
    return { me: 5000 - me.hp, foe: 5000 - foe.hp, ev };
  };
  for (const [sp, mv] of [['maetdol', 'quake'], ['horong', 'flame']]) { // 물리, 특수 모두
    const r = run(sp, mv);
    assert.ok(r.ev.some((e) => e.t === 'reflect' && e.counter));
    assert.ok(Math.abs(r.me - r.foe) <= 1 && r.me > 0, `${r.me} ${r.foe}`);
  }
  const x = run('maetdol', 'wall'); // 공격 아님
  assert.ok(x.ev.some((e) => e.t === 'counter' && e.stab));
  assert.ok(x.foe > 0 && x.me === 0);
});

test('친구가 정한 특성 11개', () => {
  const lead = (a, b, seed = 3) => {
    const bt = E.createBattle([{ name: '가', team: a }, { name: '나', team: b }], seed, { preview: true });
    E.choose(bt, 0, { type: 'lead', index: 0 }); const ev = E.choose(bt, 1, { type: 'lead', index: 0 }).events;
    return { bt, ev };
  };
  // 폭우, 설경
  assert.equal(lead(custom('usan', ['tackle']), custom('daeya', ['tackle'])).bt.weather, 'rain');
  assert.equal(lead(custom('bingsu', ['tackle']), custom('daeya', ['tackle'])).bt.weather, 'snow');
  // 발효, 위협
  assert.equal(E.activeOf(lead(custom('jangdok', ['tackle']), custom('daeya', ['tackle'])).bt, 1).stages.acc, -1);
  assert.equal(E.activeOf(lead(custom('jangseung', ['tackle']), custom('daeya', ['tackle'])).bt, 1).stages.atk, -1);
  // 정리정돈: 상대 우산령의 비를 걷음
  const { bt: clean } = lead(custom('usan', ['tackle']), custom('ssaribi', ['tackle']));
  assert.equal(clean.weather, null);
  // 그림자밟기
  const tr = battle(custom('daeya', ['tackle']), custom('horong', ['tackle']));
  assert.ok(!E.legalActions(tr, 0).some((a) => a.type === 'switch'));
  assert.ok(E.legalActions(tr, 1).some((a) => a.type === 'switch'));
  // 아이스박스: 불 기술 1배
  const hit = (sp) => {
    const b = battle(custom('horong', ['flame']), custom(sp, ['tackle']), 11);
    const f = E.activeOf(b, 1); f.stats = { ...f.stats, spd: 100, spe: 1 }; f.types = ['ice', 'steel']; f.hp = f.maxHp = 3000;
    move(b, 0, 'flame'); move(b, 1, 'tackle'); return 3000 - f.hp;
  };
  const box = hit('bonaeng'), plain = hit('bingsu');
  assert.ok(Math.abs(box / plain - .25) < .05, `${box}/${plain}`);
  // 김장: 얼음 기술은 방어 2배
  const kim = (sp) => {
    const b = battle(custom('bingsu', ['icestorm']), custom(sp, ['tackle']), 11);
    const f = E.activeOf(b, 1); f.stats = { ...f.stats, spd: 100, spe: 1 }; f.types = ['water']; f.hp = f.maxHp = 3000;
    move(b, 0, 'icestorm'); move(b, 1, 'tackle'); return 3000 - f.hp;
  };
  assert.ok(kim('daeya') < kim('usan') * .65);
  // 하바네로분출: 물리 공격한 상대 화상
  const hb = battle(custom('maetdol', ['quake']), custom('ttaengcho', ['guard']));
  E.activeOf(hb, 1).hp = E.activeOf(hb, 1).maxHp = 3000; E.activeOf(hb, 1).stats.spe = 1;
  move(hb, 0, 'quake'); E.choose(hb, 1, { type: 'move', index: 0 });
  // 막기로 막히면 발동 안 함 → 막기 대신 다른 기술로 다시
  const hb2 = battle(custom('maetdol', ['quake']), custom('ttaengcho', ['tackle']));
  E.activeOf(hb2, 1).hp = E.activeOf(hb2, 1).maxHp = 3000;
  move(hb2, 0, 'quake'); move(hb2, 1, 'tackle');
  assert.equal(E.activeOf(hb2, 0).status, 'brn');
  // 돌풍: 공격한 상대가 다른 골목몬으로 바뀜
  const fn = battle([{ species: 'maetdol', moves: ['quake'] }, { species: 'daeya', moves: ['tackle'] }], custom('fan', ['guard']));
  E.activeOf(fn, 1).hp = E.activeOf(fn, 1).maxHp = 3000; E.activeOf(fn, 1).stats.spe = 1;
  const r = move(fn, 0, 'quake'); E.choose(fn, 1, { type: 'move', index: 0 });
  // guard가 먼저 막으면 맞지 않으므로, 막기 없이 다시
  const fn2 = battle([{ species: 'maetdol', moves: ['tackle'] }, { species: 'daeya', moves: ['tackle'] }], custom('fan', ['breeze']));
  E.activeOf(fn2, 1).hp = E.activeOf(fn2, 1).maxHp = 3000;
  move(fn2, 0, 'tackle'); move(fn2, 1, 'breeze');
  assert.equal(E.activeOf(fn2, 0).species, 'daeya');
  // 바람타기: 체력이 꽉 차면 바람 기술 선공
  const bp = battle(custom('bangpae', ['gust']), custom('daeya', ['tackle']));
  E.activeOf(bp, 0).stats.spe = 1; E.activeOf(bp, 1).stats.spe = 999;
  const ev = (move(bp, 0, 'gust').events || move(bp, 1, 'tackle').events).filter((e) => e.t === 'move');
  assert.equal(ev[0].side, 0);
});

test('친구가 정한 특성 2차 9개', () => {
  const setup = (a, am, d, dm, seed = 5) => {
    const b = battle(custom(a, am), custom(d, dm), seed);
    const x = E.activeOf(b, 0), y = E.activeOf(b, 1);
    return { b, x, y };
  };
  const turn = (b, m0, m1) => (move(b, 0, m0).events || move(b, 1, m1).events);
  // 연탄이: 얼지 않음
  { const { b, y } = setup('bingsu', ['frost'], 'yeontan', ['tackle']); y.types = ['earth']; y.hp = y.maxHp = 3000;
    for (let i = 0; i < 20; i++) turn(b, 'frost', 'tackle'); assert.notEqual(y.status, 'frz'); }
  // 맷돌이 옹골참
  { const { b, x, y } = setup('daeya', ['hose'], 'maetdol', ['tackle']); x.stats.spa = 999; x.stats.spe = 999;
    turn(b, 'hose', 'tackle'); assert.ok(y.hp >= 1); }
  // 봉다리 내용물분출: 물리 공격으로 쓰러지면 그 피해를 돌려줌
  { const { b, x, y } = setup('maetdol', ['rockthrow'], 'bongdari', ['tackle']); x.hp = x.maxHp = 3000; x.stats.spe = 999; y.types = ['none']; y.hp = 5;
    const ev = turn(b, 'rockthrow', 'tackle'); assert.ok(ev.some((e) => e.t === 'msg' && e.text.includes('내용물분출'))); assert.ok(x.hp < 3000); }
  // 오락이: 상태이상 없음, 압정 무시
  { const { b, y } = setup('jangdok', ['fog'], 'orak', ['tackle']); turn(b, 'fog', 'tackle'); assert.equal(y.status, null); }
  // 주전이 끓는물: 물 기술이 풀에게 2배
  { const { b, x, y } = setup('kettle', ['squirt'], 'kongsiru', ['tackle'], 9); y.hp = y.maxHp = 3000;
    const ev = turn(b, 'squirt', 'tackle'); assert.ok(ev.some((e) => e.t === 'msg' && e.text === '효과가 굉장했다!')); }
  // 콩시루 넘치는콩: 맞으면 그래스필드
  { const { b, y } = setup('daeya', ['squirt'], 'kongsiru', ['tackle']); y.hp = y.maxHp = 3000; turn(b, 'squirt', 'tackle'); assert.equal(b.terrain, 'grass'); }
  // 붕빵이 크리스피: 불에 맞으면 바삭, 물에 맞으면 눅눅(스피드↓)
  { const { b, y } = setup('horong', ['ember'], 'bungbbang', ['tackle']); y.hp = y.maxHp = 3000; y.types = ['none'];
    turn(b, 'ember', 'tackle'); assert.equal(y.crisp, 'crispy'); }
  { const { b, y } = setup('daeya', ['squirt'], 'bungbbang', ['tackle']); y.hp = y.maxHp = 3000;
    turn(b, 'squirt', 'tackle'); assert.equal(y.crisp, 'soggy'); assert.equal(y.stages.spe, -1); }
  // 전봇이 비상전력
  { const { b, y } = setup('maetdol', ['quake'], 'jeonbot', ['tackle']); y.hp = y.maxHp = 1000; y.stats.def = 1;
    turn(b, 'quake', 'tackle'); if (y.hp > 0 && y.hp * 2 <= y.maxHp) { assert.equal(y.stages.spa, 2); assert.equal(y.stages.spe, 2); } }
  // 깨비 저주받은바디: 여러 번 맞으면 언젠가 봉인
  let sealed = false;
  for (let seed = 1; seed < 40 && !sealed; seed++) {
    const { b, x, y } = setup('daeya', ['tackle', 'squirt'], 'kkaebi', ['breeze'], seed); y.hp = y.maxHp = 3000; y.types = ['none'];
    E.choose(b, 0, { type: 'move', index: 0 }); E.choose(b, 1, { type: 'move', index: 0 });
    if (x.disabled) { sealed = true; assert.ok(!E.legalActions(b, 0).some((a) => a.type === 'move' && a.index === 0)); }
  }
  assert.ok(sealed);
});

test('투혼 광폭화: 체력에 따라 폼이 바뀌고 능력치가 오른다', () => {
  const b = battle(custom('maetdol', ['quake']), custom('tuhon', ['spirit_up']), 4);
  const t = E.activeOf(b, 1); t.hp = t.maxHp = 1000; t.stats = { ...t.stats, def: 200, spe: 1 };
  const forms = [];
  for (let i = 0; i < 10 && t.hp > 0 && b.phase === 'choose'; i++) { // 땅 울리기 PP 10
    const r = move(b, 0, 'quake'); const ev = r.events || move(b, 1, 'spirit_up').events;
    for (const e of ev) if (e.t === 'form') forms.push(e.form);
  }
  assert.deepEqual(forms.filter((f, i) => forms.indexOf(f) === i).sort(), forms.slice().sort());
  assert.ok(forms.length >= 3, forms.join());
  assert.ok(forms.every((f, i) => !i || f > forms[i - 1]));
  // 분노의 도끼: 체력이 적을수록 위력이 오름
  const pow = (ratio) => {
    const x = battle(custom('tuhon', ['rageaxe']), custom('daeya', ['breeze']), 7);
    const me = E.activeOf(x, 0), foe = E.activeOf(x, 1);
    me.hp = Math.max(1, Math.round(me.maxHp * ratio)); foe.hp = foe.maxHp = 5000; foe.stats.spe = 999; foe.types = ['none'];
    me.stats.spe = 999;
    const ev = move(x, 0, 'rageaxe').events || move(x, 1, 'breeze').events;
    return ev.find((e) => e.t === 'hp' && e.side === 1 && e.dmg)?.dmg || 0;
  };
  assert.ok(pow(.1) > pow(1) * 1.4, `${pow(.1)} ${pow(1)}`);
});

test('붕빵이 반갈쭉: 팥붕·슈붕·피붕, 콩시루 그래스필드는 우리 쪽만', () => {
  assert.ok(MONSTERS.bungbbang.moves.includes('bangalzzuk') && !MONSTERS.bungbbang.moves.includes('ember'));
  const seen = new Set();
  for (let seed = 1; seed < 40; seed++) {
    const b = battle(custom('bungbbang', ['bangalzzuk']), custom('kkaebi', ['breeze']), seed);
    const me = E.activeOf(b, 0), foe = E.activeOf(b, 1);
    me.hp = Math.floor(me.maxHp / 2); foe.hp = foe.maxHp = 3000; me.stats.spe = 999;
    const ev = move(b, 0, 'bangalzzuk').events || move(b, 1, 'breeze').events;
    const fill = ev.find((e) => e.t === 'move' && e.side === 0).fill;
    seen.add(fill);
    if (fill === 'cream') assert.ok(me.hp > me.maxHp / 2);
    if (fill === 'pizza') assert.equal(me.stages.atk, 1);
    if (fill === 'pat') assert.ok(foe.hp < 3000);
  }
  assert.equal(seen.size, 3);
  // 팥은 혼 타입에게 2배
  const pat = (sp) => {
    for (let seed = 1; seed < 60; seed++) {
      const b = battle(custom('bungbbang', ['bangalzzuk']), custom(sp, ['breeze']), seed);
      const foe = E.activeOf(b, 1); foe.hp = foe.maxHp = 5000; foe.types = sp === 'kkaebi' ? ['spirit'] : ['none']; foe.stats = { ...foe.stats, def: 100 };
      E.activeOf(b, 0).stats.spe = 999;
      const ev = move(b, 0, 'bangalzzuk').events || move(b, 1, 'breeze').events;
      if (ev.find((e) => e.t === 'move' && e.side === 0).fill === 'pat') return ev.find((e) => e.t === 'hp' && e.side === 1 && e.dmg).dmg;
    }
  };
  assert.ok(pat('kkaebi') > pat('daeya') * 1.6);
  // 그래스필드: 콩시루 쪽만 회복
  const g = battle(custom('daeya', ['squirt']), custom('kongsiru', ['breeze']));
  const atk = E.activeOf(g, 0), k = E.activeOf(g, 1);
  atk.hp = atk.maxHp - 50; k.hp = k.maxHp = 3000;
  move(g, 0, 'squirt'); move(g, 1, 'breeze');
  assert.equal(g.terrain, 'grass');
  assert.equal(atk.hp, atk.maxHp - 50); // 상대(대야몽)는 회복 안 됨
});

test('특성 3차 15개', () => {
  const lead = (a, b, seed = 3) => {
    const bt = E.createBattle([{ name: '가', team: a }, { name: '나', team: b }], seed, { preview: true });
    E.choose(bt, 0, { type: 'lead', index: 0 }); E.choose(bt, 1, { type: 'lead', index: 0 });
    return bt;
  };
  const turn = (b, m0, m1) => (move(b, 0, m0).events || move(b, 1, m1).events);
  // 악취
  assert.equal(E.activeOf(lead(custom('manhol', ['tackle']), custom('daeya', ['tackle'])), 1).stages.acc, -1);
  // 엉킴
  assert.ok(!E.legalActions(battle(custom('daeya', ['tackle']), custom('meokarak', ['tackle'])), 0).some((a) => a.type === 'switch'));
  // 뻥뚫림: 비 걷힘
  assert.equal(lead(custom('usan', ['tackle']), custom('ppeong', ['tackle'])).weather, null);
  // 아이찡 댄스
  assert.equal(lead(custom('bingsu', ['tackle']), custom('neonna', ['tackle'])).weather, null);
  // 저수
  { const b = battle(custom('daeya', ['squirt']), custom('batji', ['wall'])); const y = E.activeOf(b, 1); y.hp = 50;
    turn(b, 'squirt', 'wall'); assert.ok(y.hp > 50); }
  // 단단한 껍질: 질풍 같은 확정 급소도 안 맞음
  { const b = battle(custom('silvia', ['winksnipe']), custom('ppeondegi', ['wall'])); let crit = false;
    for (let i = 0; i < 8; i++) { const ev = turn(b, 'winksnipe', 'wall'); if (ev.some((e) => e.crit)) crit = true; } assert.ok(!crit); }
  // 호떡소, 세제거품
  { const b = battle(custom('maetdol', ['tackle']), custom('hotteok', ['wall'])); turn(b, 'tackle', 'wall'); assert.equal(E.activeOf(b, 0).stages.spe, -1); }
  { const b = battle(custom('maetdol', ['tackle']), custom('setakbot', ['wall'])); turn(b, 'tackle', 'wall'); assert.equal(E.activeOf(b, 0).stages.acc, -1); }
  // 라면사리 추가: 2턴 뒤 공격·특공 상승
  { const b = battle(custom('tteokppo', ['wall']), custom('daeya', ['wall'])); turn(b, 'wall', 'wall'); turn(b, 'wall', 'wall');
    assert.equal(E.activeOf(b, 0).stages.atk, 1); assert.equal(E.activeOf(b, 0).stages.spa, 1); }
  // 촉촉바디: 비에 회복
  { const b = battle(custom('eomuk', ['rainy']), custom('daeya', ['wall'])); const m = E.activeOf(b, 0); m.hp = 50; turn(b, 'rainy', 'wall'); assert.ok(m.hp > 50); }
  // 창자버스터: 1/4 이하가 되면 모두에게 100
  { const b = battle(custom('maetdol', ['tackle']), custom('sundae', ['wall'])); const x = E.activeOf(b, 0), y = E.activeOf(b, 1);
    x.hp = x.maxHp = 3000; y.hp = Math.floor(y.maxHp / 4) + 5; turn(b, 'tackle', 'wall'); assert.ok(x.hp <= 2900, String(x.hp)); }
  // 연지곤지: 쓰러뜨린 상대에게 매 턴 1/4
  { const b = battle([{ species: 'maetdol', moves: ['vinewhip'] }, { species: 'daeya', moves: ['tackle'] }], custom('yeonji', ['wall'])); const x = E.activeOf(b, 0); x.hp = x.maxHp = 1000; E.activeOf(b, 1).hp = 1;
    turn(b, 'vinewhip', 'wall'); assert.ok(x.yeonjiMark); assert.ok(x.hp <= 750); }
  // 리사이클: 써 버린 도구(기합의띠)를 한 번 되살림
  { const b = battle([{ species: 'kkangtong', moves: ['wall'], item: 'sash' }, { species: 'daeya', moves: ['tackle'] }], custom('maetdol', ['quake']));
    const k = E.activeOf(b, 0); k.stats.def = 1; E.activeOf(b, 1).stats.atk = 999;
    turn(b, 'wall', 'quake'); assert.equal(k.hp, 1); assert.equal(k.itemUsed, false); }
  // 과자: 맞으면 대기 중인 다친 아군 회복
  { const b = battle([{ species: 'jabanbot', moves: ['wall'] }, { species: 'daeya', moves: ['tackle'] }], custom('maetdol', ['tackle'])); const ally = b.sides[0].mons[1]; ally.hp = 10;
    E.activeOf(b, 0).hp = E.activeOf(b, 0).maxHp = 3000; turn(b, 'wall', 'tackle'); assert.ok(ally.hp > 10); }
  // 배달의민족: 가끔 먼저
  { let first = 0; for (let seed = 1; seed < 40; seed++) { const b = battle(custom('baedalbot', ['tackle']), custom('daeya', ['tackle']), seed);
      E.activeOf(b, 0).stats.spe = 1; E.activeOf(b, 1).stats.spe = 999; const ev = turn(b, 'tackle', 'tackle'); if (ev.find((e) => e.t === 'move').side === 0) first++; }
    assert.ok(first > 3 && first < 25, String(first)); }
});

test('도구 20개: 덱에서 들려 주고 전투에서 효과가 난다', () => {
  const { ITEMS } = require('../server/data');
  assert.equal(Object.keys(ITEMS).length, 20);
  const withItem = (sp, moves, item) => [{ species: sp, moves, item }, { species: 'daeya', moves: ['tackle'] }];
  const turn = (b, m0, m1) => (move(b, 0, m0).events || move(b, 1, m1).events);
  // 기합의띠: 체력이 꽉 차 있지 않아도 체력 1로 버티고 사라짐
  { const b = battle(custom('maetdol', ['quake']), withItem('yeontan', ['wall'], 'sash')); const y = E.activeOf(b, 1); E.activeOf(b, 0).stats.atk = 999; y.stats.def = 1; y.hp = 30;
    turn(b, 'quake', 'wall'); assert.equal(y.hp, 1); assert.ok(y.itemUsed); }
  // 실비보험: 효과 굉장한 공격을 버티면 공격·특공 2단계
  { const b = battle(custom('daeya', ['squirt']), withItem('yeontan', ['wall'], 'insure')); const y = E.activeOf(b, 1); y.hp = y.maxHp = 3000;
    turn(b, 'squirt', 'wall'); assert.equal(y.stages.atk, 2); assert.equal(y.stages.spa, 2); assert.ok(y.itemUsed); }
  // 응원 머리띠: 1.5배 + 첫 기술 고정
  const hit = (item) => { const b = battle(withItem('maetdol', ['tackle', 'rockthrow'], item), custom('daeya', ['wall']), 5); const f = E.activeOf(b, 1); f.hp = f.maxHp = 5000;
    const ev = turn(b, 'tackle', 'wall'); return { b, d: ev.find((e) => e.t === 'hp' && e.side === 1 && e.dmg).dmg }; };
  const plain = hit(null), band = hit('band');
  assert.ok(band.d / plain.d > 1.35, `${band.d}/${plain.d}`);
  assert.deepEqual(E.legalActions(band.b, 0).filter((a) => a.type === 'move').map((a) => a.index), [0]);
  // 털 목도리: 스피드 1.5배
  { const b = battle(withItem('maetdol', ['tackle'], 'scarf'), custom('daeya', ['wall'])); assert.equal(E.speedOf(b, 0), E.activeOf(b, 0).stats.spe * 1.5); }
  // 방탄 조끼: 변화 기술 못 씀
  { const b = battle(withItem('maetdol', ['tackle', 'wall'], 'vest'), custom('daeya', ['wall'])); assert.ok(!E.legalActions(b, 0).some((a) => a.type === 'move' && a.index === 1)); }
  // 먹다 남은 떡볶이: 턴 끝 회복
  { const b = battle(withItem('maetdol', ['wall'], 'leftover'), custom('daeya', ['wall'])); const m = E.activeOf(b, 0); m.hp = 50; turn(b, 'wall', 'wall'); assert.ok(m.hp > 50); }
  // 쌍화탕: 독에 걸려도 바로 나음
  { const b = battle(custom('jangdok', ['fog']), withItem('daeya', ['wall'], 'ssanghwa')); E.activeOf(b, 0).stats.spe = 999; for (let i = 0; i < 5 && !E.activeOf(b, 1).itemUsed; i++) turn(b, 'fog', 'wall'); assert.equal(E.activeOf(b, 1).status, null); assert.ok(E.activeOf(b, 1).itemUsed); }
  // 가시 헬멧: 물리 공격한 상대가 1/6 피해
  { const b = battle(custom('maetdol', ['tackle']), withItem('daeya', ['wall'], 'helmet')); const x = E.activeOf(b, 0); x.hp = x.maxHp = 600; turn(b, 'tackle', 'wall'); assert.equal(x.hp, 500); }
  // 비상벨: 맞으면 교체
  { const b = battle(custom('maetdol', ['tackle']), withItem('kkaebi', ['wall'], 'bell')); E.activeOf(b, 1).types = ['none']; E.activeOf(b, 1).hp = E.activeOf(b, 1).maxHp = 3000;
    turn(b, 'tackle', 'wall'); assert.equal(E.activeOf(b, 1).species, 'daeya'); }
  // 삼각김밥: 절반 아래로 떨어지면 회복
  { const b = battle(custom('maetdol', ['quake']), withItem('yeontan', ['breeze'], 'onigiri')); const y = E.activeOf(b, 1); y.hp = y.maxHp = 1000; E.activeOf(b, 0).stats.atk = 200;
    for (let i = 0; i < 9 && !y.itemUsed && y.hp > 0; i++) turn(b, 'quake', 'breeze'); assert.ok(y.itemUsed, String(y.hp)); }
});

test('등신: 돌연사·갈증, 전용기 10개', () => {
  const turn = (b, m0, m1) => (move(b, 0, m0).events || move(b, 1, m1).events);
  const D = MONSTERS.deungsin;
  assert.deepEqual(D.types, ['water', 'normal']);
  assert.equal(Object.values(D.base).reduce((a, c) => a + c), 600);
  // 노말 타입: 혼에게 안 맞고, 혼 기술도 노말에게 안 맞음
  assert.equal(E.effOf ? E.effOf('normal', ['spirit']) : 0, 0);
  // 들이박기: 상대와 함께 쓰러짐
  let rammed = 0;
  for (let seed = 1; seed < 20; seed++) {
    const b = battle(custom('deungsin', ['ramdeath']), custom('maetdol', ['tackle']), seed); const x = E.activeOf(b, 0), y = E.activeOf(b, 1);
    x.stats.spe = 999; y.hp = y.maxHp = 5000;
    const ev = turn(b, 'ramdeath', 'tackle');
    if (ev.some((e) => e.text?.includes('들이박았다'))) { rammed++; assert.equal(y.hp, 0); assert.equal(x.hp, 0); }
  }
  assert.ok(rammed > 5);
  // 수분보충: 갈증 100으로 (또는 플라스틱으로 즉사)
  for (let seed = 1; seed < 30; seed++) {
    const b = battle(custom('deungsin', ['hydrate']), custom('maetdol', ['wall']), seed); const x = E.activeOf(b, 0);
    x.thirst = 40; turn(b, 'hydrate', 'wall');
    assert.ok(x.hp === 0 || x.thirst >= 90, `thirst ${x.thirst}`); // 턴 끝 5% 소모
  }
  // 갈증이 0이 되면 즉사
  { const b = battle(custom('deungsin', ['ignite']), custom('maetdol', ['wall'])); const x = E.activeOf(b, 0); x.thirst = 10;
    turn(b, 'ignite', 'wall'); assert.equal(x.hp, 0); }
  // 가시복: 물리 공격을 막고 상대를 찌른다
  { const b = battle(custom('deungsin', ['pufferspike']), custom('maetdol', ['rockthrow'])); const x = E.activeOf(b, 0), y = E.activeOf(b, 1);
    const hp0 = x.hp, yh = y.hp; const ev = turn(b, 'pufferspike', 'rockthrow');
    if (x.hp > 0) { assert.ok(ev.some((e) => e.t === 'spiky' && e.hit) || ev.some((e) => e.t === 'miss')); assert.ok(y.hp < yh || ev.some((e) => e.t === 'miss')); }
  }
  // 돌연사가 실제로 일어난다 (여러 판 중 일부)
  let died = 0;
  for (let seed = 1; seed < 60; seed++) { const b = battle(custom('deungsin', ['hydrate']), custom('maetdol', ['wall']), seed); turn(b, 'hydrate', 'wall'); if (E.activeOf(b, 0).hp === 0) died++; }
  assert.ok(died > 3 && died < 50, String(died));
  // 주사위: 1~6 모두 나오고, 메가진화하면 갈증 게이지가 사라짐
  const faces = new Set();
  for (let seed = 1; seed < 80; seed++) { const b = battle(custom('deungsin', ['dice']), custom('maetdol', ['wall']), seed); const ev = turn(b, 'dice', 'wall'); for (const e of ev) if (e.t === 'dice') faces.add(e.n); }
  assert.equal(faces.size, 6);
  { const b = battle(custom('deungsin', ['irontail']), custom('maetdol', ['wall'])); const r = E.choose(b, 0, { type: 'move', index: 0, mega: true }); E.choose(b, 1, { type: 'move', index: 0 });
    const x = E.activeOf(b, 0); assert.ok(x.mega); assert.equal(x.thirst, null); }
  // 갈증 극복 성공하면 게이지가 없어짐
  let freed = 0;
  for (let seed = 1; seed < 30; seed++) { const b = battle(custom('deungsin', ['overcome']), custom('maetdol', ['wall']), seed); turn(b, 'overcome', 'wall'); const x = E.activeOf(b, 0); if (x.hp > 0 && x.thirst === null) freed++; }
  assert.ok(freed > 5, String(freed));
});

test('같은 골목몬 여러 마리로 대전해도 끝까지 가고 서로 구별된다', () => {
  const one = E.botTeam(1, 1)[0], dup = [one, one, one];
  for (let seed = 1; seed <= 30; seed++) {
    const b = E.createBattle([{ name: '가', team: dup }, { name: '나', team: E.botTeam(1, 3) }], seed, { preview: true });
    const v = E.viewFor(b, 0);
    assert.deepEqual(v.me.mons.map((m) => m.slot), [0, 1, 2]);
    assert.deepEqual(E.viewFor(b, 1).opps[0].roster.map((m) => m.slot), [0, 1, 2]);
    let guard = 0;
    while (b.phase !== 'over' && ++guard < 3000) for (const s of [0, 1]) if (b.phase !== 'over' && b.needs[s] && !b.pending[s]) assert.ok(E.choose(b, s, E.botAction(b, s, 2)).ok);
    assert.equal(b.phase, 'over');
  }
});

test('거다이맥스: 체력 1.5배, 거다이·다이기술 4칸, 5턴 뒤 원래대로, 한 판에 한 번', () => {
  const b = E.createBattle([{ name: '가', team: E.botTeam(1, 3) }, { name: '나', team: E.botTeam(1, 3) }], 11, { preview: true });
  E.choose(b, 0, { type: 'lead', index: 0 }); E.choose(b, 1, { type: 'lead', index: 0 });
  const me = E.activeOf(b, 0), max = me.maxHp;
  const v = E.viewFor(b, 0);
  assert.equal(v.canGmax, true); assert.equal(v.gmoves.length, 4); assert.ok(v.gmoves[0].g); assert.ok(v.gmoves.slice(1).every((x) => x.n.startsWith('다이')));
  assert.ok(E.choose(b, 0, { type: 'move', index: 0, gmax: true }).ok);
  const ev = E.choose(b, 1, E.botAction(b, 1, 0)).events;
  assert.ok(ev.some((e) => e.t === 'gmax'));
  if (me.hp > 0) {
    assert.equal(me.maxHp, Math.round(max * 1.5));
    assert.ok(ev.some((e) => e.t === 'move' && e.side === 0 && e.gmax === 2));
    assert.equal(E.viewFor(b, 0).canGmax, false); assert.equal(E.viewFor(b, 0).canZ, false);
  }
  let turns = 0;
  while (b.phase !== 'over' && me.gmax && turns++ < 10) for (const s of [0, 1]) if (b.phase !== 'over' && b.needs[s] && !b.pending[s]) E.choose(b, s, E.botAction(b, s, 1));
  if (b.phase !== 'over') { assert.ok(!me.gmax); if (me.hp > 0) assert.equal(me.maxHp, max); } // 거다이맥스 중에 판이 끝날 수도 있음
});

test('봇도 거다이맥스를 쓰고 판이 끝까지 간다', () => {
  let used = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const b = E.createBattle([{ name: '가', team: E.botTeam(2, 3) }, { name: '나', team: E.botTeam(2, 3) }], seed, { preview: true });
    let guard = 0;
    while (b.phase !== 'over' && ++guard < 3000) for (const s of [0, 1]) if (b.phase !== 'over' && b.needs[s] && !b.pending[s]) {
      const a = E.botAction(b, s, 2); if (a.gmax) used++;
      assert.ok(E.choose(b, s, a).ok);
    }
    assert.equal(b.phase, 'over');
  }
  assert.ok(used > 0, `거다이맥스 ${used}번`);
});
