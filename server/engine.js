// 배틀 엔진. 서버에서만 돌고, 모든 판정은 여기서 결정됩니다.
const { CHART, MOVES, STRUGGLE, MONSTERS, STRIP, BANNED, TIERS } = require('./data');

const LEVEL = 50;
// 요괴가 너무 빨리 쓰러지지 않도록 모든 요괴의 체력을 1.3배로 (훈련장 더미 1000은 그대로)
const HP_MUL = 1.3;
const STATUS_NAME = { brn: '화상', psn: '독', par: '마비', slp: '수면', frz: '얼음' };
const STAT_NAME = { atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드', acc: '명중률' };
const WEATHER_NAME = { sun: '땡볕', rain: '소나기', dust: '황사', snow: '눈' };

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
    hp: Math.floor((Math.floor(((2 * base.hp + 31) * LEVEL) / 100) + LEVEL + 10) * HP_MUL),
    atk: other(base.atk), def: other(base.def), spa: other(base.spa), spd: other(base.spd), spe: other(base.spe),
  };
}

function makeMon(spec) {
  const sp = MONSTERS[spec.species];
  const stats = calcStats(sp.base);
  return {
    species: spec.species, name: sp.n, types: sp.types, stats, mega: false,
    hp: stats.hp, maxHp: stats.hp,
    status: null, statusTurns: 0,
    moves: spec.moves.map((id) => ({ id, pp: MOVES[id].pp })),
    ...freshVolatile(),
  };
}
const freshVolatile = () => ({
  stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0 },
  seeded: false, flinched: false, protecting: false, protectStreak: 0, reflecting: null,
});

// 훈련장 더미: 타입 없음, 체력 1000. 공격하지 않고, 부서지면 바로 새 더미가 나옵니다.
const DUMMY_HP = 1000;
function makeDummy() {
  return {
    species: 'dummy', name: '훈련용 더미', types: [], mega: false,
    stats: { hp: DUMMY_HP, atk: 1, def: 100, spa: 1, spd: 100, spe: 1 },
    hp: DUMMY_HP, maxHp: DUMMY_HP, status: null, statusTurns: 0, moves: [], ...freshVolatile(),
  };
}
// 훈련장: 모든 요괴가 기술 10개를 다 가진 채로 나옵니다.
function createTraining(player, seed, exclude = []) {
  const team = Object.entries(MONSTERS).filter(([species]) => !exclude.includes(species)).map(([species, m]) => ({ species, moves: m.moves }));
  const b = createBattle([{ ...player, team }, { name: '훈련장', avatar: null, style: null, deck: '더미', team: [] }], seed);
  b.training = true;
  b.sides[1].mons = [makeDummy()];
  b.dummy = { total: 0, best: 0, turn: 0, hits: 0, breaks: 0 };
  b.needs = [true, false];
  return b;
}

function createBattle(players, seed = (Math.random() * 2 ** 31) | 0, { preview = false } = {}) {
  const b = {
    seed, turn: 1, phase: preview ? 'preview' : 'choose', winner: null, weather: null, weatherTurns: 0,
    pending: players.map(() => null), needs: players.map(() => true),
    sides: players.map((p) => ({
      name: p.name, avatar: p.avatar, style: p.style, deck: p.deck, active: 0, hazard: false,
      mons: p.team.map(makeMon),
    })),
  };
  return b;
}

// 자리: 1대1은 0, 1번. 태그는 0·1번이 한 팀, 2·3번이 한 팀입니다.
const seats = (b) => b.sides.map((_, i) => i);
const isDoubles = (b) => b.sides.length === 4;
const teamOf = (b, s) => (isDoubles(b) ? (s < 2 ? 0 : 1) : s);
const foesOf = (b, s) => seats(b).filter((i) => teamOf(b, i) !== teamOf(b, s));
const matesOf = (b, s) => seats(b).filter((i) => teamOf(b, i) === teamOf(b, s));
const teamName = (b, t) => seats(b).filter((i) => teamOf(b, i) === t).map((i) => b.sides[i].name).join(', ');

const activeOf = (b, s) => b.sides[s].mons[b.sides[s].active];
// 노린 상대가 쓰러졌으면 남은 상대를 공격합니다.
function targetOf(b, s, want) {
  const foes = foesOf(b, s);
  if (foes.includes(want) && activeOf(b, want).hp > 0) return want;
  return foes.find((i) => activeOf(b, i).hp > 0) ?? foes[0];
}
const alive = (m) => m.hp > 0;
const effOf = (moveType, types) =>
  types.reduce((x, t) => x * (CHART[moveType][t] ?? 1), 1);
// 요괴 특성까지 따진 상성 (보냉이 아이스박스: 불 기술을 1배로 받음)
const effMon = (moveType, mon) => (mon.species === 'bonaeng' && moveType === 'fire' ? 1 : effOf(moveType, mon.types));
// 호롱이 그림자밟기: 상대 자리에 호롱이가 서 있으면 교체할 수 없음
const trapped = (b, s) => !b.training && foesOf(b, s).some((i) => { const m = activeOf(b, i); return m.species === 'horong' && alive(m); });

function legalActions(b, s) {
  const side = b.sides[s];
  if (b.phase === 'over' || !b.needs[s]) return [];
  if (b.phase === 'preview') return side.mons.map((_, i) => ({ type: 'lead', index: i }));
  const switches = side.mons
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => alive(m) && i !== side.active)
    .map(({ i }) => ({ type: 'switch', index: i }));
  if (b.phase === 'switch') return switches;
  if (trapped(b, s)) switches.length = 0;
  const moves = activeOf(b, s).moves
    .map((mv, i) => ({ mv, i }))
    .filter(({ mv }) => mv.pp > 0)
    .map(({ i }) => ({ type: 'move', index: i }));
  return [...(moves.length ? moves : [{ type: 'move', index: -1 }]), ...switches];
}

// 메가진화는 한 판에 한 번. 행동을 쓰지 않고 그 턴의 기술을 바로 이어서 씁니다.
const canMega = (b, s) => b.phase === 'choose' && !b.sides[s].megaUsed && !activeOf(b, s).mega && alive(activeOf(b, s));

function doMega(b, s, ev) {
  const m = activeOf(b, s);
  const sp = MONSTERS[m.species];
  const base = Object.fromEntries(Object.entries(sp.base).map(([k, v]) => [k, v + sp.mega.boost[k]]));
  const oldName = m.name, oldMax = m.maxHp;
  m.stats = calcStats(base);
  m.maxHp = m.stats.hp + tierHp(m);
  m.hp += m.maxHp - oldMax;
  m.name = sp.mega.n; m.mega = true;
  b.sides[s].megaUsed = true;
  ev.push({ t: 'mega', side: s, mon: publicMon(m), text: `${josa(oldName, '이/가')} 메가진화했다! ${m.name}!` });
}

// Z기술도 한 판에 한 번. 메가진화와는 따로 셉니다.
const canZ = (b, s) => b.phase === 'choose' && !b.sides[s].zUsed && alive(activeOf(b, s));

// 플레이어 선택을 받습니다. 양쪽이 다 정하면 턴을 처리하고 이벤트를 돌려줍니다.
function choose(b, s, action) {
  const legal = legalActions(b, s);
  if (!legal.some((a) => a.type === action?.type && a.index === action?.index)) return { ok: false };
  if (b.pending[s]) return { ok: false };
  if (action.mega && (action.type !== 'move' || !canMega(b, s))) return { ok: false };
  if (action.z && (action.type !== 'move' || !canZ(b, s))) return { ok: false };
  b.pending[s] = { type: action.type, index: action.index, mega: !!action.mega, z: !!action.z, target: action.target };
  const ready = seats(b).every((i) => !b.needs[i] || b.pending[i]);
  return ready ? { ok: true, events: resolve(b) } : { ok: true, events: null };
}

function resolve(b) {
  const ev = [];
  if (b.phase === 'preview') {
    for (const s of seats(b)) b.sides[s].active = b.pending[s].index;
    for (const s of seats(b)) {
      const m = activeOf(b, s);
      ev.push({ t: 'switch', side: s, mon: publicMon(m), text: `${b.sides[s].name}: 가라, ${m.name}!` });
    }
    for (const s of seats(b)) onEntry(b, s, activeOf(b, s), ev);
  } else if (b.phase === 'switch') {
    for (const s of seats(b)) if (b.pending[s]) doSwitch(b, s, b.pending[s].index, ev);
  } else {
    ev.push({ t: 'turn', turn: b.turn });
    runTurn(b, ev);
  }
  b.pending = b.pending.map(() => null);
  updatePhase(b, ev);
  return ev;
}

function speedOf(b, s) {
  const m = activeOf(b, s);
  let v = m.stats.spe * stageMul(m.stages.spe) * stripMul(m);
  if (m.species === 'godeuri' && m.hp * 2 <= m.maxHp) v *= 1.5; // 특성 녹아내림
  if (m.status === 'par') v *= .5;
  return v;
}
const stageMul = (n) => (n >= 0 ? (2 + n) / 2 : 2 / (2 - n));

function runTurn(b, ev) {
  if (b.training) b.dummy.turn = 0;
  const acts = seats(b).filter((s) => b.pending[s]).map((s) => ({ s, a: b.pending[s] }));
  for (const { s, a } of acts) if (a.mega) doMega(b, s, ev);
  // 교체가 먼저
  for (const { s, a } of acts) if (a.type === 'switch') doSwitch(b, s, a.index, ev);

  const movers = acts.filter(({ a }) => a.type === 'move').map((o) => {
    const mon = activeOf(b, o.s);
    const mv = o.a.z ? MOVES[MONSTERS[mon.species].z] : o.a.index === -1 ? STRUGGLE : MOVES[mon.moves[o.a.index].id];
    const ride = mon.species === 'bangpae' && mon.hp === mon.maxHp && mv.type === 'wind' ? 1 : 0; // 방패연 바람타기
    return { ...o, pri: mv.pri + ride, spe: speedOf(b, o.s), tie: rand(b) };
  });
  movers.sort((x, y) => y.pri - x.pri || y.spe - x.spe || x.tie - y.tie);

  for (const { s, a } of movers) {
    if (b.phase === 'over') break;
    const mon = activeOf(b, s);
    if (alive(mon)) useMove(b, s, a.index, ev, a.target, a.z);
    if (checkOver(b, ev)) break;
  }
  if (b.phase !== 'over') endOfTurn(b, ev);
  if (b.training) trainingReset(b, ev);
  b.turn++;
}

// 훈련장에서는 턴이 끝날 때마다 내 요괴가 다 회복되고 PP, 메가진화, Z기술도 다시 쓸 수 있습니다.
function trainingReset(b, ev) {
  const d = b.dummy;
  if (d.turn > d.best) d.best = d.turn;
  ev.push({ t: 'dummy', turn: d.turn, total: d.total, best: d.best });
  const side = b.sides[0];
  side.megaUsed = false; side.zUsed = false;
  side.mons.forEach((m, i) => {
    for (const x of m.moves) x.pp = MOVES[x.id].pp;
    if (m.hp < m.maxHp || m.status) {
      m.hp = m.maxHp; m.status = null; m.statusTurns = 0; m.faintedShown = false;
      if (i === side.active) hpEvent(b, 0, m, ev, { healed: 1, quiet: true });
    }
  });
}

function msg(ev, text) { ev.push({ t: 'msg', text }); }

function hpEvent(b, s, m, ev, extra = {}) {
  ev.push({ t: 'hp', side: s, hp: m.hp, maxHp: m.maxHp, ...extra });
}

// 의상 각성 단계 (옷이 바뀌는 요괴만). 단계마다 공격·특공·스피드 배율이 조금씩 오릅니다.
const stripOf = (m) => Math.min(m.hits || 0, MONSTERS[m.species]?.stages || 0);
const stripMul = (m) => 1 + stripOf(m) * STRIP.boost;
// 강화 단계 (단조): 공격·방어 배율과 늘어난 체력
const tierOf = (m) => (MONSTERS[m.species]?.tiers ? m.tier || 0 : 0);
const tierAtk = (m) => (MONSTERS[m.species]?.tiers ? TIERS.atk[tierOf(m)] : 1);
const tierDef = (m) => (MONSTERS[m.species]?.tiers ? TIERS.def[tierOf(m)] : 1);
const tierHp = (m) => Math.round(m.stats.hp * TIERS.hp) * tierOf(m);

function hurt(b, s, m, amount, ev, extra) {
  const dmg = Math.min(m.hp, Math.max(1, Math.floor(amount)));
  m.hp -= dmg;
  const before = stripOf(m);
  if (extra?.moveType) m.hits = (m.hits || 0) + 1; // 공격에 맞은 횟수 (옷이 바뀌는 요괴용)
  hpEvent(b, s, m, ev, { dmg, ...extra, ...(extra?.moveType ? { hits: m.hits } : {}) });
  // 특성 의상 각성: 옷이 바뀌면 조금 강해지고 체력 회복
  if (stripOf(m) > before && m.hp > 0) {
    ev.push({ t: 'msg', text: `${m.name}의 옷이 바뀌었다! 의상 각성 ${stripOf(m)}단계, 힘이 솟는다!` });
    heal(b, s, m, STRIP.heal, ev);
  }
  if (b.training && m.species === 'dummy') {
    const d = b.dummy;
    d.total += dmg; d.turn += dmg; d.hits++;
    if (m.hp === 0) { // 부서지면 새 더미
      d.breaks++;
      Object.assign(m, makeDummy());
      ev.push({ t: 'msg', text: '더미가 부서졌다! 새 더미가 나왔다.' });
      hpEvent(b, s, m, ev, { healed: DUMMY_HP });
    }
  }
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
    hp: m.hp, maxHp: m.maxHp, status: m.status, stages: m.stages, seeded: m.seeded, mega: m.mega, hits: m.hits || 0, strip: stripOf(m), tier: tierOf(m),
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
  side.lastSwitch = b.turn;
  const m = activeOf(b, s);
  Object.assign(m, freshVolatile());
  ev.push({ t: 'switch', side: s, mon: publicMon(m), text: `${side.name}: 가라, ${m.name}!` });
  onEntry(b, s, m, ev);
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
  a *= stageMul(as) * stripMul(atk) * (phys ? tierAtk(atk) : 1); d *= stageMul(ds) * tierDef(def);
  if (def.species === 'daeya' && (mv.type === 'ice' || b.weather === 'snow')) d *= 2; // 특성 김장
  if (b.weather === 'snow' && phys && def.types.includes('ice')) d *= 1.5; // 눈: 얼음 타입 방어 1.5배
  let dmg = (((2 * LEVEL) / 5 + 2) * mv.pow * a) / d / 50 + 2;
  if (b.weather === 'sun') dmg *= mv.type === 'fire' ? 1.5 : mv.type === 'water' ? .5 : 1;
  if (b.weather === 'rain') dmg *= mv.type === 'water' ? 1.5 : mv.type === 'fire' ? .5 : 1;
  if (mv.rainBoost && b.weather === 'rain') dmg *= 2;
  if (crit) dmg *= 1.5;
  dmg *= roll;
  if (atk.types.includes(mv.type)) dmg *= 1.5;
  dmg *= effMon(mv.type, def);
  if (mv.sound && atk.species === 'harmonium') dmg *= 1.3; // 특성 펑크록
  if (mv.sound && def.species === 'harmonium') dmg *= .5;
  if (atk.species === 'yangmeori' && mv.type === (isHot(b) ? 'fire' : 'ice')) dmg *= 1.3; // 특성 온탕냉탕
  if (phys && atk.status === 'brn') dmg *= .5;
  return Math.max(1, Math.floor(dmg));
}

// 특성검술: 무작위 속성 (상대에게 효과가 없는 속성은 빼고)
const BLADES = {
  fire: ['화염', { st: { s: 'brn', ch: 60 } }], water: ['파도', { foe: { spe: -2 } }], grass: ['신록', { drain: .5 }],
  elec: ['뇌광', { st: { s: 'par', ch: 50 } }], ice: ['빙결', { st: { s: 'frz', ch: 35 } }], earth: ['대지', { foe: { def: -2 } }],
  wind: ['질풍', { critAll: true }], poison: ['맹독', { st: { s: 'psn', ch: 80 } }], spirit: ['혼백', { fl: 50, foe: { spd: -1 } }],
  fairy: ['성광', { foe: { atk: -2 } }], steel: ['강철', { pow: 130 }],
};
function elemBlade(b, s, me, mv, want) {
  const foe = activeOf(b, targetOf(b, s, want));
  const ok = Object.keys(BLADES).filter((t) => effMon(t, foe) > 0);
  const type = ok[Math.floor(rand(b) * ok.length)] || 'steel';
  const [name, extra] = BLADES[type];
  return { ...mv, ...extra, type, n: `특성검술 · ${name}`, blade: type };
}

// 특성 온탕냉탕: 홀수 턴은 온탕, 짝수 턴은 냉탕
const isHot = (b) => b.turn % 2 === 1;
// 등장할 때 발동하는 특성
function onEntry(b, s, m, ev) {
  if (!alive(m) || b.phase === 'over') return;
  const sky = { hwangsari: ['dust', '황사 경보', '황사가 불기 시작했다!'], usan: ['rain', '폭우', '비가 쏟아지기 시작했다!'], bingsu: ['snow', '설경', '눈이 내리기 시작했다!'] }[m.species];
  if (sky && b.weather !== sky[0]) {
    b.weather = sky[0]; b.weatherTurns = 5;
    ev.push({ t: 'weather', weather: sky[0], trait: true, text: `${m.name}의 ${sky[1]}! ${sky[2]}` });
  }
  const drop = { jangdok: ['acc', '발효'], jangseung: ['atk', '위협'] }[m.species];
  if (drop) {
    msg(ev, `${m.name}의 ${drop[1]}!`);
    for (const o of foesOf(b, s)) { const f = activeOf(b, o); if (alive(f)) changeStage(b, o, f, drop[0], -1, ev); }
  }
  if (m.species === 'ssaribi') { // 정리정돈: 날씨와 압정을 모두 치움
    const had = b.weather || seats(b).some((i) => b.sides[i].hazard);
    msg(ev, `${m.name}의 정리정돈!${had ? '' : ' 하지만 치울 것이 없었다.'}`);
    if (b.weather) { ev.push({ t: 'weather', weather: null, text: `${josa(WEATHER_NAME[b.weather], '이/가')} 깨끗이 걷혔다!` }); b.weather = null; b.weatherTurns = 0; }
    for (const t of [0, 1]) {
      const team = seats(b).filter((i) => teamOf(b, i) === t);
      if (team.some((i) => b.sides[i].hazard)) {
        team.forEach((i) => { b.sides[i].hazard = false; });
        ev.push({ t: 'hazard', side: team[0], on: false, text: `${teamName(b, t)} 쪽 압정이 말끔히 치워졌다!` });
      }
    }
  }
  if (m.species === 'horong') msg(ev, `${m.name}의 그림자밟기! 상대는 교체할 수 없다.`);
}

function useMove(b, s, index, ev, want, z = false) {
  const o = targetOf(b, s, want);
  const me = activeOf(b, s);
  const slot = z || index === -1 ? null : me.moves[index];
  const zid = z ? MONSTERS[me.species].z : null;
  let mv = z ? MOVES[zid] : slot ? MOVES[slot.id] : STRUGGLE;

  if (mv.tierPow) mv = { ...mv, pow: mv.pow + Math.min(tierOf(me), TIERS.base) * mv.tierPow }; // 강화 단계만큼 위력 증가 (네더라이트까지)
  if (mv.elem) mv = elemBlade(b, s, me, mv, want);
  if (mv.bath) mv = isHot(b) ? { ...mv, type: 'fire', st: { s: 'brn', ch: 30 } } : { ...mv, type: 'ice', st: { s: 'frz', ch: 30 } };
  if (!canAct(b, s, me, mv, ev)) { me.protectStreak = 0; return; }
  if (slot) slot.pp--;
  if (z) {
    b.sides[s].zUsed = true;
    if (mv.rainZ && b.weather === 'rain') mv = { ...mv, pow: Math.round(mv.pow * 1.5) };
  }

  ev.push({
    t: 'move', side: s, target: o, id: z ? zid : slot ? slot.id : 'struggle', move: mv.n, type: mv.type, cat: mv.cat, z,
    player: b.sides[s].name, mon: publicMon(me),
    text: z ? `${josa(b.sides[s].name, '과/와')} ${me.name}의 Z기술! ${mv.n}!` : `${josa(me.name, '은/는')} ${josa(mv.n, '을/를')} 썼다!`,
  });

  if (mv.protect) {
    const ok = chance(b, 100 / 2 ** me.protectStreak);
    if (ok) {
      me.protecting = true; me.protectStreak++;
      msg(ev, `${josa(me.name, '은/는')} 몸을 웅크려 막을 준비를 했다!`);
    } else { me.protectStreak = 0; msg(ev, '그러나 실패했다!'); }
    return;
  }
  if (mv.reflect) {
    const ok = chance(b, 100 / 2 ** me.protectStreak);
    if (ok) {
      me.reflecting = { target: o, used: false }; me.protectStreak++;
      ev.push({ t: 'reflectReady', side: s, text: `${josa(me.name, '은/는')} 방패를 들고 반격 자세를 취했다!` });
    } else { me.protectStreak = 0; msg(ev, '그러나 실패했다!'); }
    return;
  }
  me.protectStreak = 0;

  if (mv.self_) return selfMove(b, s, me, mv, ev);

  // 광역기: 태그 배틀에서는 살아 있는 상대 모두를 공격 (위력 3/4)
  const targets = mv.spread && isDoubles(b) ? foesOf(b, s).filter((i) => alive(activeOf(b, i))) : [o];
  if (targets.length > 1) { msg(ev, '상대 모두를 공격했다!'); mv = { ...mv, pow: Math.round(mv.pow * .75) }; }
  for (const t of targets) { if (!alive(me) || b.phase === 'over') break; hitOne(b, s, me, t, mv, ev); }
}

function hitOne(b, s, me, o, mv, ev) {
  const foe = activeOf(b, o);
  const ref = foe.reflecting && mv.cat !== 'x' && alive(foe) ? foe.reflecting : null; // 리플렉터
  if (ref) ref.used = true;
  let counter = 0;
  if (!alive(foe)) { msg(ev, '그러나 맞힐 상대가 없었다!'); return; }
  if (foe.protecting) {
    if (mv.z && !mv.breakGuard) {
      msg(ev, `${foe.name}의 막기를 뚫었다! 하지만 위력이 줄었다.`);
      mv = { ...mv, pow: Math.round(mv.pow / 4) };
    } else if (!mv.breakGuard) { msg(ev, `${josa(foe.name, '은/는')} 공격을 막아냈다!`); return; } else msg(ev, `${foe.name}의 막기를 뚫었다!`);
  }

  if (mv.acc !== null) {
    const accuracy = mv.acc * stageMul(me.stages.acc);
    if (rand(b) * 100 >= accuracy) {
      ev.push({ t: 'miss', side: o, text: `${me.name}의 공격이 빗나갔다!` });
      return;
    }
  }

  if (mv.cat === 'x') return statusMove(b, s, me, o, foe, mv, ev);

  const eff = effMon(mv.type, foe);
  if (eff === 0) { msg(ev, `${foe.name}에게는 효과가 없는 것 같다...`); return; }

  const hits = mv.hits ? randInt(b, mv.hits[0], mv.hits[1]) : 1;
  let total = 0, landed = 0;
  for (let i = 0; i < hits && alive(foe); i++) {
    const crit = mv.critAll || rand(b) < (mv.crit ? 1 / 8 : 1 / 24);
    let dmg = damageOf(b, me, foe, mv, crit, .85 + rand(b) * .15);
    if (ref) {
      const full = dmg;
      dmg = Math.max(1, Math.floor(full * .1));
      if (mv.cat === 'p') counter += Math.floor(full * .9);
      if (!landed) ev.push({ t: 'reflect', side: o, by: s, counter: mv.cat === 'p', text: mv.cat === 'p' ? `${josa(foe.name, '은/는')} 방패로 막아냈다!` : `${josa(foe.name, '은/는')} 방패로 막아냈다! 피해가 10%로 줄었다.` });
    }
    if (foe.species === 'ppogeuri' && !foe.popped) { // 특성 거품막
      foe.popped = true; dmg = Math.max(1, Math.floor(dmg / 2));
      msg(ev, `${foe.name}의 거품막이 피해를 줄였다! 거품이 터졌다.`);
    }
    total += hurt(b, o, foe, dmg, ev, { eff, crit, moveType: mv.type });
    landed++;
    if (crit) msg(ev, '급소에 맞았다!');
  }
  if (hits > 1) msg(ev, `${landed}번 맞았다!`);
  if (counter > 0 && alive(me) && alive(foe)) {
    ev.push({ t: 'counter', side: o, target: s, text: `${josa(foe.name, '이/가')} 검으로 찔러 피해를 돌려줬다!` });
    hurt(b, s, me, counter, ev, { counter: 1 });
  }
  if (eff > 1) msg(ev, '효과가 굉장했다!');
  else if (eff < 1) msg(ev, '효과가 별로인 듯하다...');

  if (landed && alive(me)) {
    // 땡초 하바네로분출: 물리(접촉) 공격을 한 상대를 화상
    if (foe.species === 'ttaengcho' && mv.cat === 'p' && !me.status && !me.types.includes('fire')) {
      msg(ev, `${foe.name}의 하바네로분출!`);
      applyStatus(b, s, me, 'brn', ev, true);
    }
  }
  if (mv.type === 'fire' && foe.status === 'frz' && alive(foe)) {
    foe.status = null;
    ev.push({ t: 'status', side: o, status: null, text: `${foe.name}의 얼음이 녹았다!` });
  }
  if (mv.clearHazard && b.sides[s].hazard) {
    matesOf(b, s).forEach((i) => { b.sides[i].hazard = false; });
    ev.push({ t: 'hazard', side: s, on: false, text: `${teamName(b, teamOf(b, s))} 쪽 압정이 말끔히 치워졌다!` });
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
    if (mv.clearFoe) {
      const ups = Object.entries(foe.stages).filter(([, v]) => v > 0);
      for (const [k] of ups) {
        foe.stages[k] = 0;
        ev.push({ t: 'stage', side: o, stat: k, value: 0, up: false, text: `${foe.name}의 ${josa(STAT_NAME[k], '이/가')} 원래대로 돌아왔다!` });
      }
      if (!ups.length) msg(ev, `${josa(foe.name, '은/는')} 이미 깨끗하다.`);
    }
    if (mv.foe && chance(b, mv.sc ?? 100)) {
      for (const [k, v] of Object.entries(mv.foe)) changeStage(b, o, foe, k, v, ev);
    }
  }
  if (!meDown && mv.selfAfter) {
    for (const [k, v] of Object.entries(mv.self)) changeStage(b, s, me, k, v, ev);
  }
  // 선풍이 돌풍: 공격한 상대를 날려 다른 요괴로 바꿔 버림
  if (landed && foe.species === 'fan' && alive(me) && !b.training) {
    const bench = b.sides[s].mons.map((m, i) => i).filter((i) => i !== b.sides[s].active && alive(b.sides[s].mons[i]));
    if (bench.length) {
      msg(ev, `${foe.name}의 돌풍! ${josa(me.name, '은/는')} 바람에 날려 갔다!`);
      doSwitch(b, s, bench[Math.floor(rand(b) * bench.length)], ev);
    }
  }
}

function selfMove(b, s, me, mv, ev) {
  if (mv.forge) {
    const max = MONSTERS[me.species]?.tiers || 0, t = tierOf(me);
    if (t >= max) { msg(ev, max ? `${josa(me.name, '은/는')} 이미 ${TIERS.names[t]} 단계다! 더는 강화할 수 없다.` : '그러나 아무 일도 일어나지 않았다!'); return; }
    const add = Math.round(me.stats.hp * TIERS.hp);
    me.tier = t + 1; me.maxHp += add; me.hp += add;
    ev.push({ t: 'forge', side: s, tier: me.tier, mon: publicMon(me), text: `강화 성공! ${TIERS.names[t]} → ${TIERS.names[me.tier]}! 체력과 공격, 방어가 올랐다!` });
    hpEvent(b, s, me, ev, { quiet: true });
    return;
  }
  if (mv.weather) {
    if (b.weather === mv.weather) { msg(ev, '그러나 실패했다!'); return; }
    b.weather = mv.weather; b.weatherTurns = 5;
    ev.push({ t: 'weather', weather: mv.weather, text: `${josa(WEATHER_NAME[mv.weather], '이/가')} 시작됐다!` });
    return;
  }
  if (mv.hazard) {
    const foes = foesOf(b, s);
    if (b.sides[foes[0]].hazard) { msg(ev, '그러나 실패했다!'); return; }
    foes.forEach((i) => { b.sides[i].hazard = true; });
    ev.push({ t: 'hazard', side: foes[0], on: true, text: `${teamName(b, teamOf(b, foes[0]))} 쪽 바닥에 압정이 흩뿌려졌다!` });
    return;
  }
  if (mv.heal) {
    const curable = mv.cure && me.status;
    if (me.hp === me.maxHp && !curable && !mv.self) { msg(ev, '체력이 이미 가득하다!'); return; }
    if (me.hp < me.maxHp) heal(b, s, me, me.maxHp * mv.heal, ev);
    if (curable) { me.status = null; ev.push({ t: 'status', side: s, status: null, text: `${me.name}의 상태이상이 나았다!` }); }
    msg(ev, `${josa(me.name, '은/는')} 기운을 되찾았다!`);
    if (mv.self) for (const [k, v] of Object.entries(mv.self)) changeStage(b, s, me, k, v, ev);
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
    foe.seededBy = s;
    ev.push({ t: 'seed', side: o, kind: foe.seeded, text: hair ? `머리카락이 ${foe.name}에게 엉겨붙었다!` : `${foe.name}에게 씨앗을 심었다!` });
    return;
  }
  if (mv.foe) for (const [k, v] of Object.entries(mv.foe)) changeStage(b, o, foe, k, v, ev);
}

function endOfTurn(b, ev) {
  // 리플렉터: 상대가 공격하지 않았으면 그냥 찌른다
  for (const s of seats(b)) {
    const m = activeOf(b, s), r = m.reflecting;
    if (!r) continue;
    m.reflecting = null;
    if (r.used || !alive(m) || b.phase === 'over') continue;
    const o = targetOf(b, s, r.target), foe = activeOf(b, o);
    if (!alive(foe)) continue;
    const stab = { n: '찌르기', type: 'steel', cat: 'p', pow: 80 };
    ev.push({ t: 'counter', side: s, target: o, stab: true, text: `상대가 공격하지 않자 ${josa(m.name, '이/가')} 검으로 찔렀다!` });
    const eff = effMon('steel', foe);
    if (!eff) { msg(ev, `${foe.name}에게는 효과가 없는 것 같다...`); continue; }
    hurt(b, o, foe, damageOf(b, m, foe, stab, false, .85 + rand(b) * .15), ev, { eff, moveType: 'steel' });
    faintCheck(b, o, foe, ev);
  }
  if (checkOver(b, ev)) return;
  for (const s of seats(b)) {
    const m = activeOf(b, s);
    m.protecting = false; m.flinched = false;
  }
  if (b.weather === 'dust') {
    for (const s of seats(b)) {
      const m = activeOf(b, s);
      if (alive(m) && !m.types.some((t) => t === 'earth' || t === 'steel')) {
        msg(ev, `${josa(m.name, '은/는')} 황사 때문에 콜록거린다!`);
        hurt(b, s, m, m.maxHp / 16, ev);
        faintCheck(b, s, m, ev);
      }
    }
  }
  for (const s of seats(b)) {
    const m = activeOf(b, s);
    if (!alive(m)) continue;
    if (m.status === 'brn' || m.status === 'psn') {
      msg(ev, `${josa(m.name, '은/는')} ${STATUS_NAME[m.status]} 피해를 입었다!`);
      hurt(b, s, m, m.maxHp / (m.status === 'brn' ? 16 : 8), ev);
      faintCheck(b, s, m, ev);
    }
    if (alive(m) && m.seeded) {
      const by = m.seededBy, foe = activeOf(b, by);
      msg(ev, `${m.seeded === 'hair' ? '머리카락' : '씨앗'}이 ${m.name}의 체력을 빨아들인다!`);
      const taken = hurt(b, s, m, m.maxHp / 8, ev);
      if (alive(foe)) heal(b, by, foe, taken, ev);
      faintCheck(b, s, m, ev);
    }
  }
  for (const s of seats(b)) {
    const m = activeOf(b, s);
    if (!alive(m)) continue;
    if (m.species === 'damjaengjeon' && m.hp < m.maxHp) { // 특성 광합성 충전
      msg(ev, `${josa(m.name, '은/는')} 광합성으로 충전했다!`);
      heal(b, s, m, m.maxHp / 16, ev);
    }
    if (m.species === 'yangmeori') msg(ev, isHot(b) ? `${josa(m.name, '은/는')} 냉탕으로 옮겼다! 얼음 기술이 강해진다.` : `${josa(m.name, '은/는')} 온탕으로 옮겼다! 불 기술이 강해진다.`);
  }
  if (b.weather && --b.weatherTurns <= 0) {
    ev.push({ t: 'weather', weather: null, text: `${josa(WEATHER_NAME[b.weather], '이/가')} 그쳤다.` });
    b.weather = null;
  }
  checkOver(b, ev);
}

function checkOver(b, ev) {
  if (b.phase === 'over') return true;
  if (b.training) return false;
  const out = [0, 1].map((t) => seats(b).filter((i) => teamOf(b, i) === t).every((i) => b.sides[i].mons.every((m) => !alive(m))));
  if (!out[0] && !out[1]) return false;
  b.phase = 'over';
  b.winner = out[0] && out[1] ? null : out[0] ? 1 : 0;
  ev.push({
    t: 'over', winner: b.winner,
    text: b.winner === null ? '모두 쓰러졌다. 무승부!' : `${josa(teamName(b, b.winner), '이/가')} 이겼다!`,
  });
  return true;
}

function updatePhase(b, ev) {
  if (b.training) { b.phase = 'choose'; b.needs = [true, false]; return; }
  if (checkOver(b, ev)) { b.needs = b.needs.map(() => false); return; }
  const down = seats(b).map((s) => !alive(activeOf(b, s)) && b.sides[s].mons.some(alive));
  if (down.some(Boolean)) { b.phase = 'switch'; b.needs = down; }
  else { b.phase = 'choose'; b.needs = seats(b).map((s) => alive(activeOf(b, s))); }
}

function forfeit(b, s, left = false) {
  const lost = teamOf(b, s);
  b.phase = 'over'; b.winner = 1 - lost; b.needs = b.needs.map(() => false); b.pending = b.pending.map(() => null);
  const how = left ? '게임을 나갔다' : '기권했다';
  return [{ t: 'over', winner: b.winner, text: `${josa(b.sides[s].name, '이/가')} ${how}. ${josa(teamName(b, b.winner), '이/가')} 이겼다!` }];
}

// 플레이어별 화면 정보. 상대의 기술과 안 나온 요괴는 숨깁니다.
function viewFor(b, s) {
  const me = b.sides[s];
  const lock = b.pending[s] !== null;
  const preview = b.phase === 'preview';
  const seatView = (i) => {
    const o = b.sides[i];
    return {
      seat: i, name: o.name, avatar: o.avatar, style: o.style, deck: o.deck, hazard: o.hazard,
      active: preview ? null : publicMon(activeOf(b, i)), // 고르기 전에는 선봉을 숨김
      roster: o.mons.map((m) => ({ species: m.species, name: m.name, types: m.types, out: !alive(m), mega: m.mega })),
    };
  };
  const opps = foesOf(b, s).map(seatView);
  const ally = matesOf(b, s).filter((i) => i !== s).map(seatView)[0] ?? null;
  return {
    you: s, team: teamOf(b, s), doubles: isDoubles(b), turn: b.turn, phase: b.phase, winner: b.winner,
    weather: b.weather, weatherTurns: b.weatherTurns,
    mustAct: b.needs[s] && !lock,
    canMega: canMega(b, s) && !lock,
    trapped: b.phase === 'choose' && trapped(b, s),
    canZ: canZ(b, s) && !lock,
    zUsed: !!me.zUsed,
    megaUsed: !!me.megaUsed,
    lead: preview && lock ? b.pending[s].index : null,
    training: b.training ? { ...b.dummy } : null,
    me: {
      name: me.name, avatar: me.avatar, style: me.style, deck: me.deck, active: me.active, hazard: me.hazard,
      mons: me.mons.map((m) => ({
        ...publicMon(m), stats: m.stats,
        moves: m.moves.map((x) => ({ id: x.id, pp: x.pp })),
      })),
    },
    ally, opps, opp: opps[0],
  };
}

// 보통: 예상 피해를 계산해 고르되, 약간의 변덕을 섞습니다.
function normalAction(b, s, o) {
  const acts = legalActions(b, s);
  if (!acts.length) return null;
  if (b.phase === 'preview') {
    const score = (mon) => foesOf(b, s).flatMap((i) => b.sides[i].mons).reduce((sum, f) => sum
      + Math.max(...mon.types.map((t) => effOf(t, f.types)))
      - Math.max(...f.types.map((t) => effOf(t, mon.types))), rand(b));
    return acts.map((a) => ({ a, v: score(b.sides[s].mons[a.index]) })).sort((x, y) => y.v - x.v)[0].a;
  }
  const foe = activeOf(b, o);
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
      if (mv.hazard && b.sides[o].hazard) v = 0;
      if (mv.weather && b.weather === mv.weather) v = 0;
    } else {
      const dmg = damageOf(b, me, foe, mv, false, .92) * (mv.hits ? mv.hits[0] : 1);
      v = (dmg * (mv.acc ?? 100)) / 100 / foe.maxHp * 100 * (.85 + rand(b) * .3);
      if (dmg >= foe.hp) v += 60;
    }
    return { a, v };
  }).sort((x, y) => y.v - x.v);
  const pick = scored[0].a;
  if (canMega(b, s) && (me.hp < me.maxHp * .8 || chance(b, 25))) return { ...pick, mega: true };
  return pick;
}


/* ---------- 골목대장 난이도: 0 쉬움, 1 보통, 2 어려움, 3 지옥 ---------- */
const pickRandom = (b, list) => list[Math.floor(rand(b) * list.length)];

function easyAction(b, s) {
  const acts = legalActions(b, s);
  if (b.phase !== 'choose') return pickRandom(b, acts);
  return pickRandom(b, acts.filter((a) => a.type === 'move'));
}

// 기술 하나의 예상 피해. 면역이면 0.
function rawDamage(b, atk, def, mv) {
  if (mv.cat === 'x' || effOf(mv.type, def.types) === 0) return 0;
  const hits = mv.hits ? (mv.hits[0] + mv.hits[1]) / 2 : 1;
  return damageOf(b, atk, def, mv, false, .92) * hits;
}

// 상대가 나에게 줄 수 있는 최대 피해. 지옥은 실제 기술을 알고, 어려움은 타입으로 짐작합니다.
function threatOf(b, foe, mon, level) {
  if (level >= 3) {
    return Math.max(0, ...foe.moves.filter((x) => x.pp > 0).map((x) => rawDamage(b, foe, mon, MOVES[x.id])));
  }
  const cat = foe.stats.atk >= foe.stats.spa ? 'p' : 's';
  return Math.max(...foe.types.map((type) => rawDamage(b, foe, mon, { type, cat, pow: 85, acc: 100 })));
}

function smartAction(b, s, level, o) {
  const acts = legalActions(b, s);
  const side = b.sides[s], foe = activeOf(b, o);
  const switches = acts.filter((a) => a.type === 'switch').map((a) => {
    const mon = side.mons[a.index];
    const risk = threatOf(b, foe, mon, level) / mon.hp;
    const reach = Math.max(0, ...mon.moves.map((x) => rawDamage(b, mon, foe, MOVES[x.id]))) / Math.max(1, foe.hp);
    return { a, risk, v: reach - risk };
  }).sort((x, y) => y.v - x.v);
  if (b.phase === 'switch') return switches[0].a;

  const me = activeOf(b, s);
  const moves = acts.filter((a) => a.type === 'move');
  if (moves[0].index === -1) return moves[0];
  const threat = threatOf(b, foe, me, level);
  const faster = speedOf(b, s) > speedOf(b, o);
  const finish = (a) => {
    if (!canMega(b, s)) return a;
    const go = b.turn >= 2 || threat >= me.hp * .5;
    return go ? { ...a, mega: true } : a;
  };

  const rows = moves.map((a) => ({ a, mv: MOVES[me.moves[a.index].id] })).map((r) => ({ ...r, raw: rawDamage(b, me, foe, r.mv) }));
  const kills = rows.filter((r) => r.raw >= foe.hp).sort((x, y) => y.mv.pri - x.mv.pri || (y.mv.acc ?? 100) - (x.mv.acc ?? 100));
  if (kills.length && (faster || kills[0].mv.pri > 0 || threat < me.hp)) return finish(kills[0].a);

  // 맞으면 쓰러지는데 먼저 못 때리면 잘 버티는 동료로 교체
  if (threat >= me.hp && !faster && switches.length && b.turn - (side.lastSwitch ?? -9) > 1 && switches[0].risk < .5) {
    return switches[0].a;
  }

  const foeStrong = foe.stats.atk >= foe.stats.spa;
  const left = b.sides[o].mons.filter(alive).length;
  const support = (mv) => {
    const acc = (mv.acc ?? 100) / 100;
    if (mv.protect) return (foe.seeded || foe.status === 'psn' || foe.status === 'brn') && me.protectStreak === 0 ? 30 : 0;
    if (mv.heal) return me.hp < me.maxHp * .5 && threat < me.maxHp * mv.heal * 1.2 ? 80 : 0;
    if (mv.nap) return me.hp < me.maxHp * .35 && threat < me.hp ? 60 : 0;
    if (mv.st) {
      const blocked = foe.status || (mv.immune && effOf(mv.type, foe.types) === 0)
        || foe.types.includes({ brn: 'fire', psn: 'poison', par: 'elec', frz: 'ice' }[mv.st.s])
        || (mv.st.s === 'psn' && foe.types.includes('steel'));
      if (blocked || foe.hp < foe.maxHp * .4) return 0;
      const worth = { slp: 52, brn: foeStrong ? 46 : 28, par: faster ? 26 : 46, psn: 30 }[mv.st.s] ?? 28;
      return worth * acc;
    }
    if (mv.seed) return foe.seeded || (mv.seed !== 'any' && foe.types.includes('grass')) ? 0 : 30 * acc;
    if (mv.hazard) return !b.sides[o].hazard && left >= 3 ? 30 : 0;
    if (mv.weather) {
      if (b.weather === mv.weather) return 0;
      const fit = { rain: 'water', sun: 'fire' }[mv.weather];
      return me.moves.some((x) => MOVES[x.id].type === fit && MOVES[x.id].cat !== 'x') ? 30 : 8;
    }
    if (mv.self) {
      const raised = Object.keys(mv.self).reduce((n, k) => n + Math.max(0, me.stages[k]), 0);
      return threat < me.hp * .35 && raised <= 1 ? 48 : 0;
    }
    if (mv.foe) return foe.hp > foe.maxHp * .5 ? 18 * acc : 0;
    return 0;
  };
  const value = (r) => (r.mv.cat === 'x'
    ? support(r.mv)
    : ((r.raw * (r.mv.acc ?? 100)) / 100 / foe.maxHp) * 100 * (r.mv.recoil && me.hp < me.maxHp * .35 ? .6 : 1));
  const best = rows.map((r) => ({ a: r.a, v: value(r) + rand(b) * 3 })).sort((x, y) => y.v - x.v)[0];
  return finish(best.a);
}

// 태그에서 봇이 노릴 상대: 쉬움은 무작위, 나머지는 체력이 적게 남은 쪽
function botTarget(b, s, level) {
  const foes = foesOf(b, s).filter((i) => alive(activeOf(b, i)));
  if (!foes.length) return foesOf(b, s)[0];
  if (level === 0) return pickRandom(b, foes);
  return foes.sort((x, y) => activeOf(b, x).hp / activeOf(b, x).maxHp - activeOf(b, y).hp / activeOf(b, y).maxHp)[0];
}

function botAction(b, s, level = 1) {
  const o = botTarget(b, s, level);
  let a;
  if (b.phase === 'preview' || level === 1) a = normalAction(b, s, o);
  else a = level === 0 ? easyAction(b, s) : smartAction(b, s, level, o);
  // 강화 용사: 체력이 넉넉하면 강화부터
  if (a && a.type === 'move' && level >= 1 && b.phase === 'choose') {
    const me = activeOf(b, s), fi = me.moves.findIndex((x) => MOVES[x.id].forge && x.pp > 0);
    const t = tierOf(me), want = t < TIERS.base ? (level >= 2 ? 65 : 45) : 20; // 네더라이트 뒤로는 가끔만
    if (fi >= 0 && t < (MONSTERS[me.species].tiers || 0) && me.hp > me.maxHp * .5 && chance(b, want)) return { type: 'move', index: fi, ...(isDoubles(b) ? { target: o } : {}) };
  }
  if (a && a.type === 'move' && level >= 1 && canZ(b, s)) {
    // Z기술: 쓰러뜨릴 수 있거나, 판이 무르익었을 때 씁니다.
    const me = activeOf(b, s), foe = activeOf(b, o);
    const dmg = rawDamage(b, me, foe, MOVES[MONSTERS[me.species].z]);
    if (dmg > 0 && (dmg >= foe.hp || (b.turn >= 3 && dmg >= foe.hp * .5 && chance(b, level >= 2 ? 60 : 35)))) a = { ...a, z: true };
  }
  return a && a.type === 'move' && isDoubles(b) ? { ...a, target: o } : a;
}

const shuffled = (list) => list.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);

// 어려움 이상은 강한 기술, 다른 타입 기술, 보조 기술을 고루 갖춥니다.
function smartMoves(species, enemyTypes) {
  const sp = MONSTERS[species];
  const worth = (id) => {
    const m = MOVES[id];
    const stat = m.cat === 'p' ? sp.base.atk : sp.base.spa;
    const hits = m.hits ? (m.hits[0] + m.hits[1]) / 2 : 1;
    const fit = enemyTypes.length ? enemyTypes.reduce((n, t) => n + effOf(m.type, t), 0) / enemyTypes.length : 1;
    return m.pow * hits * ((m.acc ?? 100) / 100) * stat * (sp.types.includes(m.type) ? 1.5 : 1) * fit;
  };
  const attacks = sp.moves.filter((m) => MOVES[m].cat !== 'x').sort((x, y) => worth(y) - worth(x));
  const chosen = [];
  const sigMove = MOVES[sp.sig].cat !== 'x' ? sp.sig : null;
  for (const m of [...(sigMove ? [sigMove] : []), ...attacks]) {
    if (chosen.length >= 3) break;
    if (!chosen.includes(m) && !chosen.some((c) => MOVES[c].type === MOVES[m].type)) chosen.push(m);
  }
  const rank = (id) => { const m = MOVES[id]; return m.sig ? 6 : m.self ? 5 : m.heal ? 4 : m.st ? 3 : m.seed || m.hazard ? 2 : m.weather ? 1 : 0; };
  const extras = sp.moves.filter((m) => MOVES[m].cat === 'x' && !MOVES[m].protect).sort((x, y) => rank(y) - rank(x));
  return [...chosen, ...extras, ...attacks.filter((m) => !chosen.includes(m))].slice(0, 4);
}

function botTeam(level, size, enemy = []) {
  const ids = Object.keys(MONSTERS).filter((id) => !BANNED.includes(id)); // 밴된 요괴는 봇이 안 씀
  const enemyTypes = enemy.map((m) => MONSTERS[m.species].types);
  if (level === 0) {
    return shuffled(ids).slice(0, size).map((species) => ({ species, moves: shuffled(MONSTERS[species].moves).slice(0, 4) }));
  }
  if (level === 1) {
    return shuffled(ids).slice(0, size).map((species) => {
      const all = MONSTERS[species].moves;
      const attacks = shuffled(all.filter((m) => MOVES[m].cat !== 'x')).slice(0, 3);
      return { species, moves: [...attacks, ...shuffled(all.filter((m) => !attacks.includes(m)))].slice(0, 4) };
    });
  }
  if (level === 2) return shuffled(ids).slice(0, size).map((species) => ({ species, moves: smartMoves(species, []) }));
  // 지옥: 내 덱의 타입을 보고 상성이 좋은 요괴로 팀을 짭니다.
  const score = (id) => {
    const mon = MONSTERS[id];
    const total = Object.values(mon.base).reduce((a, c) => a + c, 0) / 100;
    const edge = enemyTypes.reduce((n, types) => n
      + Math.max(...mon.types.map((t) => effOf(t, types)))
      - Math.max(...types.map((t) => effOf(t, mon.types))), 0);
    return total + edge + Math.random() * .6;
  };
  return ids.map((id) => [score(id), id]).sort((x, y) => y[0] - x[0]).slice(0, size)
    .map(([, species]) => ({ species, moves: smartMoves(species, enemyTypes) }));
}

module.exports = {
  createBattle, createTraining, DUMMY_HP, choose, speedOf, legalActions, viewFor, botAction, botTeam, forfeit, teamOf, canZ, calcStats, effOf, josa, activeOf, canMega,
};
