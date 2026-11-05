// 배틀 엔진. 서버에서만 돌고, 모든 판정은 여기서 결정됩니다.
const { CHART, MOVES, STRUGGLE, MONSTERS } = require('./data');

const LEVEL = 50;
const STATUS_NAME = { brn: '화상', psn: '독', par: '마비', slp: '수면', frz: '얼음' };
const STAT_NAME = { atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드', acc: '명중률' };
const WEATHER_NAME = { sun: '땡볕', rain: '소나기', dust: '황사' };

// 한글 조사 처리: 마지막 글자의 받침 유무로 고름
function josa(word, pair) {
  const [withBatchim, without] = pair.split('/');
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  const has = code >= 0 && code <= 11171 && code % 28 !== 0;
  return word + (has ? withBatchim : without);
}

function rand(b) { // mulberry32: 시드가 같으면 전투가 재현됨
  b.seed = (b.seed + 0x6d2b79f5) | 0;
  let t = b.seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const chance = (b, pct) => rand(b) * 100 < pct;
const randInt = (b, lo, hi) => lo + Math.floor(rand(b) * (hi - lo + 1));

function calcStats(base) {
  const other = (v) => Math.floor(((2 * v + 31) * LEVEL) / 100) + 5;
  return {
    hp: Math.floor(((2 * base.hp + 31) * LEVEL) / 100) + LEVEL + 10,
    atk: other(base.atk), def: other(base.def), spa: other(base.spa), spd: other(base.spd), spe: other(base.spe),
  };
}

function makeMon(spec) {
  const sp = MONSTERS[spec.species];
  const stats = calcStats(sp.base);
  return {
    species: spec.species, name: sp.n, types: sp.types, stats,
    hp: stats.hp, maxHp: stats.hp,
    status: null, statusTurns: 0,
    moves: spec.moves.map((id) => ({ id, pp: MOVES[id].pp })),
    ...freshVolatile(),
  };
}
const freshVolatile = () => ({
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 },
  seeded: false, flinched: false, protecting: false, protectStreak: 0,
});

function createBattle(players, seed = (Math.random() * 2 ** 31) | 0, { preview = false } = {}) {
  const b = {
    seed, turn: 1, phase: preview ? 'preview' : 'choose', winner: null, weather: null, weatherTurns: 0,
    pending: [null, null], needs: [true, true],
    sides: players.map((p) => ({
      name: p.name, avatar: p.avatar, deck: p.deck, active: 0, hazard: false,
      mons: p.team.map(makeMon),
    })),
  };
  return b;
}

const activeOf = (b, s) => b.sides[s].mons[b.sides[s].active];
const alive = (m) => m.hp > 0;
const effOf = (moveType, types) =>
  types.reduce((x, t) => x * (CHART[moveType][t] ?? 1), 1);

function legalActions(b, s) {
  const side = b.sides[s];
  if (b.phase === 'over' || !b.needs[s]) return [];
  if (b.phase === 'preview') return side.mons.map((_, i) => ({ type: 'lead', index: i }));
  const switches = side.mons
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => alive(m) && i !== side.active)
    .map(({ i }) => ({ type: 'switch', index: i }));
  if (b.phase === 'switch') return switches;
  const moves = activeOf(b, s).moves
    .map((mv, i) => ({ mv, i }))
    .filter(({ mv }) => mv.pp > 0)
    .map(({ i }) => ({ type: 'move', index: i }));
  return [...(moves.length ? moves : [{ type: 'move', index: -1 }]), ...switches];
}

// 플레이어 선택을 받습니다. 양쪽이 다 정하면 턴을 처리하고 이벤트를 돌려줍니다.
function choose(b, s, action) {
  const legal = legalActions(b, s);
  if (!legal.some((a) => a.type === action?.type && a.index === action?.index)) return { ok: false };
  if (b.pending[s]) return { ok: false };
  b.pending[s] = { type: action.type, index: action.index };
  const ready = [0, 1].every((i) => !b.needs[i] || b.pending[i]);
  return ready ? { ok: true, events: resolve(b) } : { ok: true, events: null };
}

function resolve(b) {
  const ev = [];
  if (b.phase === 'preview') {
    for (const s of [0, 1]) b.sides[s].active = b.pending[s].index;
    for (const s of [0, 1]) {
      const m = activeOf(b, s);
      ev.push({ t: 'switch', side: s, mon: publicMon(m), text: `${b.sides[s].name}: 가라, ${m.name}!` });
    }
  } else if (b.phase === 'switch') {
    for (const s of [0, 1]) if (b.pending[s]) doSwitch(b, s, b.pending[s].index, ev);
  } else {
    ev.push({ t: 'turn', turn: b.turn });
    runTurn(b, ev);
  }
  b.pending = [null, null];
  updatePhase(b, ev);
  return ev;
}

function speedOf(b, s) {
  const m = activeOf(b, s);
  let v = m.stats.spe * stageMul(m.stages.spe);
  if (m.status === 'par') v *= .5;
  return v;
}
const stageMul = (n) => (n >= 0 ? (2 + n) / 2 : 2 / (2 - n));

function runTurn(b, ev) {
  const acts = [0, 1].map((s) => ({ s, a: b.pending[s] }));
  // 교체가 먼저
  for (const { s, a } of acts) if (a.type === 'switch') doSwitch(b, s, a.index, ev);

  const movers = acts.filter(({ a }) => a.type === 'move').map((o) => {
    const mon = activeOf(b, o.s);
    const mv = o.a.index === -1 ? STRUGGLE : MOVES[mon.moves[o.a.index].id];
    return { ...o, pri: mv.pri, spe: speedOf(b, o.s), tie: rand(b) };
  });
  movers.sort((x, y) => y.pri - x.pri || y.spe - x.spe || x.tie - y.tie);

  for (const { s, a } of movers) {
    if (b.phase === 'over') break;
    const mon = activeOf(b, s);
    if (alive(mon)) useMove(b, s, a.index, ev);
    if (checkOver(b, ev)) break;
  }
  if (b.phase !== 'over') endOfTurn(b, ev);
  b.turn++;
}

function msg(ev, text) { ev.push({ t: 'msg', text }); }

function hpEvent(b, s, m, ev, extra = {}) {
  ev.push({ t: 'hp', side: s, hp: m.hp, maxHp: m.maxHp, ...extra });
}

function hurt(b, s, m, amount, ev, extra) {
  const dmg = Math.min(m.hp, Math.max(1, Math.floor(amount)));
  m.hp -= dmg;
  hpEvent(b, s, m, ev, { dmg, ...extra });
  return dmg;
}
function heal(b, s, m, amount, ev) {
  const v = Math.min(m.maxHp - m.hp, Math.max(1, Math.floor(amount)));
  if (v <= 0) return 0;
  m.hp += v;
  hpEvent(b, s, m, ev, { healed: v });
  return v;
}
function faintCheck(b, s, m, ev) {
  if (m.hp === 0 && !m.faintedShown) {
    m.faintedShown = true;
    m.status = null;
    ev.push({ t: 'faint', side: s, text: `${josa(m.name, '은/는')} 쓰러졌다!` });
    return true;
  }
  return false;
}

function publicMon(m) {
  return {
    species: m.species, name: m.name, types: m.types,
    hp: m.hp, maxHp: m.maxHp, status: m.status, stages: m.stages, seeded: m.seeded,
  };
}

function doSwitch(b, s, idx, ev) {
  const side = b.sides[s];
  const out = activeOf(b, s);
  if (alive(out)) {
    Object.assign(out, freshVolatile());
    ev.push({ t: 'recall', side: s, text: `${side.name}: ${out.name}, 돌아와!` });
  }
  side.active = idx;
  const m = activeOf(b, s);
  Object.assign(m, freshVolatile());
  ev.push({ t: 'switch', side: s, mon: publicMon(m), text: `${side.name}: 가라, ${m.name}!` });
  if (side.hazard && !m.types.includes('wind')) {
    msg(ev, `${josa(m.name, '이/가')} 압정을 밟았다!`);
    hurt(b, s, m, m.maxHp / 8, ev);
    faintCheck(b, s, m, ev);
  }
}

function applyStatus(b, s, m, st, ev, quiet) {
  const immune = { brn: 'fire', psn: 'poison', par: 'elec', frz: 'ice' }[st];
  const steelImmune = st === 'psn' && m.types.includes('steel');
  if (m.status || m.hp === 0 || m.types.includes(immune) || steelImmune) {
    if (!quiet) msg(ev, '그러나 효과가 없었다.');
    return false;
  }
  m.status = st;
  m.statusTurns = st === 'slp' ? randInt(b, 2, 4) : 0; // 1~3턴 쉼
  const text = {
    brn: `${josa(m.name, '은/는')} 화상을 입었다!`,
    psn: `${josa(m.name, '은/는')} 독에 걸렸다!`,
    par: `${josa(m.name, '은/는')} 마비되었다!`,
    slp: `${josa(m.name, '은/는')} 잠들었다!`,
    frz: `${josa(m.name, '은/는')} 꽁꽁 얼어붙었다!`,
  }[st];
  ev.push({ t: 'status', side: s, status: st, text });
  return true;
}

function changeStage(b, s, m, stat, delta, ev) {
  const before = m.stages[stat];
  m.stages[stat] = Math.max(-6, Math.min(6, before + delta));
  if (m.stages[stat] === before) {
    msg(ev, `${m.name}의 ${josa(STAT_NAME[stat], '은/는')} 더 변하지 않는다.`);
    return;
  }
  const size = Math.abs(delta) >= 2 ? '크게 ' : '';
  ev.push({
    t: 'stage', side: s, stat, value: m.stages[stat], up: delta > 0,
    text: `${m.name}의 ${josa(STAT_NAME[stat], '이/가')} ${size}${delta > 0 ? '올랐다' : '떨어졌다'}!`,
  });
}

function canAct(b, s, m, mv, ev) {
  if (m.flinched) {
    m.flinched = false;
    msg(ev, `${josa(m.name, '은/는')} 풀이 죽어 움직이지 못했다!`);
    return false;
  }
  if (m.status === 'slp') {
    m.statusTurns--;
    if (m.statusTurns > 0) { msg(ev, `${josa(m.name, '은/는')} 쿨쿨 자고 있다.`); return false; }
    m.status = null;
    ev.push({ t: 'status', side: s, status: null, text: `${josa(m.name, '은/는')} 잠에서 깼다!` });
  }
  if (m.status === 'frz') {
    if (chance(b, 20) || mv.type === 'fire') {
      m.status = null;
      ev.push({ t: 'status', side: s, status: null, text: `${m.name}의 얼음이 녹았다!` });
    } else { msg(ev, `${josa(m.name, '은/는')} 얼어서 움직일 수 없다!`); return false; }
  }
  if (m.status === 'par' && chance(b, 25)) {
    msg(ev, `${josa(m.name, '은/는')} 몸이 저려서 움직일 수 없다!`);
    return false;
  }
  return true;
}

function damageOf(b, atk, def, mv, crit, roll) {
  const phys = mv.cat === 'p';
  let a = phys ? atk.stats.atk : atk.stats.spa;
  let d = phys ? def.stats.def : def.stats.spd;
  let as = phys ? atk.stages.atk : atk.stages.spa;
  let ds = phys ? def.stages.def : def.stages.spd;
  if (crit) { as = Math.max(as, 0); ds = Math.min(ds, 0); } // 급소는 불리한 변화 무시
  a *= stageMul(as); d *= stageMul(ds);
  let dmg = (((2 * LEVEL) / 5 + 2) * mv.pow * a) / d / 50 + 2;
  if (b.weather === 'sun') dmg *= mv.type === 'fire' ? 1.5 : mv.type === 'water' ? .5 : 1;
  if (b.weather === 'rain') dmg *= mv.type === 'water' ? 1.5 : mv.type === 'fire' ? .5 : 1;
  if (mv.rainBoost && b.weather === 'rain') dmg *= 2;
  if (crit) dmg *= 1.5;
  dmg *= roll;
  if (atk.types.includes(mv.type)) dmg *= 1.5;
  dmg *= effOf(mv.type, def.types);
  if (phys && atk.status === 'brn') dmg *= .5;
  return Math.max(1, Math.floor(dmg));
}

function useMove(b, s, index, ev) {
  const o = 1 - s;
  const me = activeOf(b, s);
  const slot = index === -1 ? null : me.moves[index];
  const mv = slot ? MOVES[slot.id] : STRUGGLE;

  if (!canAct(b, s, me, mv, ev)) { me.protectStreak = 0; return; }
  if (slot) slot.pp--;

  ev.push({
    t: 'move', side: s, id: slot ? slot.id : 'struggle', move: mv.n, type: mv.type, cat: mv.cat,
    text: `${josa(me.name, '은/는')} ${josa(mv.n, '을/를')} 썼다!`,
  });

  if (mv.protect) {
    const ok = chance(b, 100 / 2 ** me.protectStreak);
    if (ok) {
      me.protecting = true; me.protectStreak++;
      msg(ev, `${josa(me.name, '은/는')} 몸을 웅크려 막을 준비를 했다!`);
    } else { me.protectStreak = 0; msg(ev, '그러나 실패했다!'); }
    return;
  }
  me.protectStreak = 0;

  if (mv.self_) return selfMove(b, s, me, mv, ev);

  const foe = activeOf(b, o);
  if (!alive(foe)) { msg(ev, '그러나 맞힐 상대가 없었다!'); return; }
  if (foe.protecting) {
    if (!mv.breakGuard) { msg(ev, `${josa(foe.name, '은/는')} 공격을 막아냈다!`); return; }
    msg(ev, `${foe.name}의 막기를 뚫었다!`);
  }

  if (mv.acc !== null) {
    const accuracy = mv.acc * stageMul(me.stages.acc);
    if (rand(b) * 100 >= accuracy) {
      ev.push({ t: 'miss', side: o, text: `${me.name}의 공격이 빗나갔다!` });
      return;
    }
  }

  if (mv.cat === 'x') return statusMove(b, s, me, o, foe, mv, ev);

  const eff = effOf(mv.type, foe.types);
  if (eff === 0) { msg(ev, `${foe.name}에게는 효과가 없는 것 같다...`); return; }

  const hits = mv.hits ? randInt(b, mv.hits[0], mv.hits[1]) : 1;
  let total = 0, landed = 0;
  for (let i = 0; i < hits && alive(foe); i++) {
    const crit = rand(b) < (mv.crit ? 1 / 8 : 1 / 24);
    const dmg = damageOf(b, me, foe, mv, crit, .85 + rand(b) * .15);
    total += hurt(b, o, foe, dmg, ev, { eff, crit, moveType: mv.type });
    landed++;
    if (crit) msg(ev, '급소에 맞았다!');
  }
  if (hits > 1) msg(ev, `${landed}번 맞았다!`);
  if (eff > 1) msg(ev, '효과가 굉장했다!');
  else if (eff < 1) msg(ev, '효과가 별로인 듯하다...');

  if (mv.type === 'fire' && foe.status === 'frz' && alive(foe)) {
    foe.status = null;
    ev.push({ t: 'status', side: o, status: null, text: `${foe.name}의 얼음이 녹았다!` });
  }
  if (mv.clearHazard && b.sides[s].hazard) {
    b.sides[s].hazard = false;
    ev.push({ t: 'hazard', side: s, on: false, text: `${b.sides[s].name} 쪽 압정이 말끔히 치워졌다!` });
  }
  if (mv.drain && alive(me)) {
    if (heal(b, s, me, total * mv.drain, ev)) msg(ev, `${josa(me.name, '은/는')} 양분을 빨아들였다!`);
  }
  if (mv.recoil) {
    msg(ev, `${josa(me.name, '은/는')} 반동을 입었다!`);
    hurt(b, s, me, mv === STRUGGLE ? me.maxHp * mv.recoil : total * mv.recoil, ev);
  }
  const foeDown = faintCheck(b, o, foe, ev);
  const meDown = faintCheck(b, s, me, ev);

  if (!foeDown) {
    if (mv.st && chance(b, mv.st.ch)) applyStatus(b, o, foe, mv.st.s, ev, true);
    if (mv.fl && chance(b, mv.fl)) foe.flinched = true;
    if (mv.foe && chance(b, mv.sc ?? 100)) {
      for (const [k, v] of Object.entries(mv.foe)) changeStage(b, o, foe, k, v, ev);
    }
  }
  if (!meDown && mv.selfAfter) {
    for (const [k, v] of Object.entries(mv.self)) changeStage(b, s, me, k, v, ev);
  }
}

function selfMove(b, s, me, mv, ev) {
  if (mv.weather) {
    if (b.weather === mv.weather) { msg(ev, '그러나 실패했다!'); return; }
    b.weather = mv.weather; b.weatherTurns = 5;
    ev.push({ t: 'weather', weather: mv.weather, text: `${josa(WEATHER_NAME[mv.weather], '이/가')} 시작됐다!` });
    return;
  }
  if (mv.hazard) {
    const other = b.sides[1 - s];
    if (other.hazard) { msg(ev, '그러나 실패했다!'); return; }
    other.hazard = true;
    ev.push({ t: 'hazard', side: 1 - s, on: true, text: `${other.name} 쪽 바닥에 압정이 흩뿌려졌다!` });
    return;
  }
  if (mv.heal) {
    const curable = mv.cure && me.status;
    if (me.hp === me.maxHp && !curable) { msg(ev, '체력이 이미 가득하다!'); return; }
    if (me.hp < me.maxHp) heal(b, s, me, me.maxHp * mv.heal, ev);
    if (curable) { me.status = null; ev.push({ t: 'status', side: s, status: null, text: `${me.name}의 상태이상이 나았다!` }); }
    msg(ev, `${josa(me.name, '은/는')} 기운을 되찾았다!`);
    return;
  }
  if (mv.nap) {
    if (me.hp === me.maxHp) { msg(ev, '체력이 이미 가득하다!'); return; }
    me.hp = me.maxHp;
    me.status = 'slp'; me.statusTurns = 3; // 깨어나는 턴 포함, 실제로 2턴 쉼
    hpEvent(b, s, me, ev, { healed: 1 });
    ev.push({ t: 'status', side: s, status: 'slp', text: `${josa(me.name, '은/는')} 낮잠에 빠졌다!` });
    return;
  }
  if (mv.self) for (const [k, v] of Object.entries(mv.self)) changeStage(b, s, me, k, v, ev);
}

function statusMove(b, s, me, o, foe, mv, ev) {
  if (mv.immune && effOf(mv.type, foe.types) === 0) {
    msg(ev, `${foe.name}에게는 효과가 없는 것 같다...`);
    return;
  }
  if (mv.st) { applyStatus(b, o, foe, mv.st.s, ev, false); return; }
  if (mv.seed) {
    const hair = mv.seed === 'any';
    if (foe.seeded || (!hair && foe.types.includes('grass'))) { msg(ev, '그러나 효과가 없었다.'); return; }
    foe.seeded = hair ? 'hair' : 'seed';
    ev.push({ t: 'seed', side: o, kind: foe.seeded, text: hair ? `머리카락이 ${foe.name}에게 엉겨붙었다!` : `${foe.name}에게 씨앗을 심었다!` });
    return;
  }
  if (mv.foe) for (const [k, v] of Object.entries(mv.foe)) changeStage(b, o, foe, k, v, ev);
}

function endOfTurn(b, ev) {
  for (const s of [0, 1]) {
    const m = activeOf(b, s);
    m.protecting = false; m.flinched = false;
  }
  if (b.weather === 'dust') {
    for (const s of [0, 1]) {
      const m = activeOf(b, s);
      if (alive(m) && !m.types.some((t) => t === 'earth' || t === 'steel')) {
        msg(ev, `${josa(m.name, '은/는')} 황사 때문에 콜록거린다!`);
        hurt(b, s, m, m.maxHp / 16, ev);
        faintCheck(b, s, m, ev);
      }
    }
  }
  for (const s of [0, 1]) {
    const m = activeOf(b, s);
    if (!alive(m)) continue;
    if (m.status === 'brn' || m.status === 'psn') {
      msg(ev, `${josa(m.name, '은/는')} ${STATUS_NAME[m.status]} 피해를 입었다!`);
      hurt(b, s, m, m.maxHp / (m.status === 'brn' ? 16 : 8), ev);
      faintCheck(b, s, m, ev);
    }
    if (alive(m) && m.seeded) {
      const foe = activeOf(b, 1 - s);
      msg(ev, `${m.seeded === 'hair' ? '머리카락' : '씨앗'}이 ${m.name}의 체력을 빨아들인다!`);
      const taken = hurt(b, s, m, m.maxHp / 8, ev);
      if (alive(foe)) heal(b, 1 - s, foe, taken, ev);
      faintCheck(b, s, m, ev);
    }
  }
  if (b.weather && --b.weatherTurns <= 0) {
    ev.push({ t: 'weather', weather: null, text: `${josa(WEATHER_NAME[b.weather], '이/가')} 그쳤다.` });
    b.weather = null;
  }
  checkOver(b, ev);
}

function checkOver(b, ev) {
  if (b.phase === 'over') return true;
  const out = [0, 1].map((s) => b.sides[s].mons.every((m) => !alive(m)));
  if (!out[0] && !out[1]) return false;
  b.phase = 'over';
  b.winner = out[0] && out[1] ? null : out[0] ? 1 : 0;
  ev.push({
    t: 'over', winner: b.winner,
    text: b.winner === null ? '둘 다 쓰러졌다. 무승부!' : `${josa(b.sides[b.winner].name, '이/가')} 이겼다!`,
  });
  return true;
}

function updatePhase(b, ev) {
  if (checkOver(b, ev)) { b.needs = [false, false]; return; }
  const down = [0, 1].map((s) => !alive(activeOf(b, s)));
  if (down[0] || down[1]) { b.phase = 'switch'; b.needs = down; }
  else { b.phase = 'choose'; b.needs = [true, true]; }
}

function forfeit(b, s, left = false) {
  b.phase = 'over'; b.winner = 1 - s; b.needs = [false, false]; b.pending = [null, null];
  const how = left ? '게임을 나갔다' : '기권했다';
  return [{ t: 'over', winner: b.winner, text: `${josa(b.sides[s].name, '이/가')} ${how}. ${josa(b.sides[1 - s].name, '이/가')} 이겼다!` }];
}

// 플레이어별 화면 정보. 상대의 기술과 안 나온 요괴는 숨깁니다.
function viewFor(b, s) {
  const me = b.sides[s], opp = b.sides[1 - s];
  const lock = b.pending[s] !== null;
  const preview = b.phase === 'preview';
  return {
    you: s, turn: b.turn, phase: b.phase, winner: b.winner,
    weather: b.weather, weatherTurns: b.weatherTurns,
    mustAct: b.needs[s] && !lock,
    lead: preview && lock ? b.pending[s].index : null,
    me: {
      name: me.name, avatar: me.avatar, deck: me.deck, active: me.active, hazard: me.hazard,
      mons: me.mons.map((m) => ({
        ...publicMon(m), stats: m.stats,
        moves: m.moves.map((x) => ({ id: x.id, pp: x.pp })),
      })),
    },
    opp: {
      name: opp.name, avatar: opp.avatar, deck: opp.deck, hazard: opp.hazard,
      active: preview ? null : publicMon(activeOf(b, 1 - s)), // 고르기 전에는 선봉을 숨김
      roster: opp.mons.map((m) => ({ species: m.species, name: m.name, types: m.types, out: !alive(m) })),
    },
  };
}

// 연습 상대: 예상 피해를 계산해 고르되, 약간의 변덕을 섞습니다.
function botAction(b, s) {
  const acts = legalActions(b, s);
  if (!acts.length) return null;
  if (b.phase === 'preview') {
    const score = (mon) => b.sides[1 - s].mons.reduce((sum, f) => sum
      + Math.max(...mon.types.map((t) => effOf(t, f.types)))
      - Math.max(...f.types.map((t) => effOf(t, mon.types))), rand(b));
    return acts.map((a) => ({ a, v: score(b.sides[s].mons[a.index]) })).sort((x, y) => y.v - x.v)[0].a;
  }
  const foe = activeOf(b, 1 - s);
  const switches = acts.filter((a) => a.type === 'switch');
  const matchup = (mon) => {
    const off = Math.max(...mon.types.map((t) => effOf(t, foe.types)));
    const def = Math.max(...foe.types.map((t) => effOf(t, mon.types)));
    return off - def + mon.hp / mon.maxHp;
  };
  const best = (list) => list
    .map((a) => ({ a, v: matchup(b.sides[s].mons[a.index]) }))
    .sort((x, y) => y.v - x.v)[0];
  if (b.phase === 'switch') return best(switches).a;

  const me = activeOf(b, s);
  if (switches.length && matchup(me) < -.5 && chance(b, 40)) {
    const c = best(switches);
    if (c.v > matchup(me) + 1) return c.a;
  }
  const scored = acts.filter((a) => a.type === 'move').map((a) => {
    if (a.index === -1) return { a, v: 1 };
    const mv = MOVES[me.moves[a.index].id];
    let v;
    if (mv.cat === 'x') {
      v = 12 + rand(b) * 30;
      if (mv.protect && me.protectStreak > 0) v = 0;
      if ((mv.heal || mv.nap) && me.hp > me.maxHp * .5) v = 2;
      if (mv.st && foe.status) v = 0;
      if (mv.st && mv.immune && effOf(mv.type, foe.types) === 0) v = 0;
      if (mv.seed && (foe.seeded || (mv.seed !== 'any' && foe.types.includes('grass')))) v = 0;
      if (mv.hazard && b.sides[1 - s].hazard) v = 0;
      if (mv.weather && b.weather === mv.weather) v = 0;
    } else {
      const dmg = damageOf(b, me, foe, mv, false, .92) * (mv.hits ? mv.hits[0] : 1);
      v = (dmg * (mv.acc ?? 100)) / 100 / foe.maxHp * 100 * (.85 + rand(b) * .3);
      if (dmg >= foe.hp) v += 60;
    }
    return { a, v };
  }).sort((x, y) => y.v - x.v);
  return scored[0].a;
}

module.exports = {
  createBattle, choose, legalActions, viewFor, botAction, forfeit, calcStats, effOf, josa, activeOf,
};
