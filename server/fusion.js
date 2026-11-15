'use strict';
// 🧬 합체: 골목몬 두 마리를 합쳐 새 골목몬을 탄생시킵니다.
// - 능력치는 두 골목몬의 평균에서 조금 흔들리고, 타입은 양쪽에서 하나씩.
// - 기술은 두 골목몬의 기술을 물려받고, 두 기술을 합친 합체기가 생겨요.
// - 합체몬은 다시 합체할 수 없고, 되돌릴 수 없어요. 결과는 합체하기 전엔 아무도 몰라요.
// 합체몬 종(種)은 db.fusions에 저장되고, Data.MONSTERS·MOVES에 "열거되지 않는" 항목으로 등록해
// 도감·스카우트·봇 풀(Object.keys로 고르는 곳)에는 섞이지 않게 합니다.
const Data = require('./data');

const FUSE_GP = 3000;
const NO_PARENT = new Set(['deungsin', 'dummy']); // 갈증 게이지처럼 자기 몸에 묶인 특성이 있는 골목몬
// 합체몬이 그대로 물려받으면 안 되는 기술 (그 골목몬 몸에만 있는 장치에 기대는 기술)
const BOUND_KEYS = ['forge', 'tierPow', 'elem', 'glass', 'kamikaze', 'vinyl', 'hydrate', 'ignite', 'overcome', 'dive', 'ouga', 'trial', 'heatEq', 'loop', 'techUp', 'record', 'rage'];
const SIMPLE = new Set(['n', 'type', 'cat', 'pow', 'acc', 'pp', 'pri', 'st', 'd', 'recoil', 'fl', 'crit', 'drain', 'self', 'foe', 'hits', 'selfAfter', 'sound', 'breakGuard', 'sig']);
const MIX_FROM_B = ['st', 'drain', 'foe', 'fl', 'crit', 'sound'];

let db = null;
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const isFusion = (id) => !!Data.MONSTERS[id]?.fz;
const inheritable = (id) => { const m = Data.MOVES[id]; return m && !m.z && !m.fzMove && !BOUND_KEYS.some((k) => m[k] != null); };
const comboBase = (id) => { const m = Data.MOVES[id]; return m && m.cat !== 'x' && m.pow > 0 && !m.z && Object.keys(m).every((k) => SIMPLE.has(k)); };
const hidden = (obj, id, v) => Object.defineProperty(obj, id, { value: v, enumerable: false, configurable: true, writable: true });

function register(f) {
  for (const [id, mv] of Object.entries(f.mv || {})) hidden(Data.MOVES, id, mv);
  hidden(Data.MONSTERS, f.id, f.sp);
}
function init(_db) { db = _db; db.fusions ||= {}; for (const f of Object.values(db.fusions)) register(f); }
const all = () => Object.values(db?.fusions || {}).map((f) => ({ id: f.id, sp: f.sp, mv: f.mv }));
const pubOf = (id) => { const f = db.fusions[id]; return f && { id: f.id, sp: f.sp, mv: f.mv }; };

/* ---------- 이름 짓기: 두 이름을 반씩 섞어요 ---------- */
const syl = (s) => [...s.replace(/\s/g, '')];
function mixName(a, b) {
  const A = syl(a), B = syl(b);
  const cut = (n, j) => Math.max(1, Math.min(n - 1, Math.ceil(n / 2) + j));
  for (let t = 0; t < 8; t++) {
    const front = A.slice(0, A.length < 2 ? 1 : cut(A.length, rnd(2) - (t > 3 ? 1 : 0))), back = B.slice(B.length < 2 ? 0 : cut(B.length, rnd(2) - 1));
    const n = [...front, ...back].slice(0, 6).join('');
    if (n !== a && n !== b && n.length >= 2) return n;
  }
  return `${A[0]}${B.slice(-2).join('')}`;
}
function mixMoveName(a, b) {
  const wa = a.split(' '), wb = b.split(' ');
  const head = wa.length > 1 ? wa[0] : a;
  return `${head} ${wb[wb.length - 1]}`;
}

/* ---------- 합체기: 한쪽 기술 몸에 다른 쪽 효과를 얹어요 ---------- */
function comboMove(id, aId, bId) {
  const A = Data.MOVES[aId], B = Data.MOVES[bId];
  const mv = { ...A, n: mixMoveName(A.n, B.n), pow: Math.min(140, Math.round(Math.max(A.pow, B.pow) * 1.1 / 5) * 5), pp: Math.max(5, Math.min(A.pp, B.pp)), sig: true, fzMove: true };
  delete mv.d; if (A.hits && A.pow * A.hits[1] > 120) mv.pow = Math.max(A.pow, B.pow > 60 ? 30 : B.pow); // 연속 공격 기술은 위력을 덜 올림
  if (mv.hits) mv.pow = Math.min(mv.pow, 40);
  const add = MIX_FROM_B.filter((k) => B[k] != null && A[k] == null);
  const k = add.length ? pick(add) : null; if (k) mv[k] = B[k];
  mv.d = `「${A.n}」+「${B.n}」 합체기.${A.d ? ` ${A.d}` : ''}${k && B.d ? ` / ${B.d}` : ''}`;
  return mv;
}

const LINES = ['둘의 마음이 하나가 되자 빛 속에서 태어났다.', '처음 보는 모습이지만 어딘가 낯이 익다.', '두 골목의 기억을 모두 가지고 있다고 한다.', '합체한 날 골목에 무지개가 떴다.', '가끔 두 목소리로 동시에 운다.', '누구에게서 태어났는지 아는 건 주인뿐이다.'];
const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

function makeFusion(u, A, B, sa, sb) {
  const n = Object.keys(db.fusions).length + 1;
  const id = `fz${Date.now().toString(36)}${rnd(1296).toString(36)}`;
  const base = Object.fromEntries(STATS.map((k) => [k, Math.max(20, Math.round((sa.base[k] + sb.base[k]) / 2 * (0.92 + Math.random() * 0.2)))]));
  const ta = pick(sa.types), tb = pick(sb.types), types = ta === tb ? [ta] : shuffle([ta, tb]);
  // 기술: 두 골목몬의 기술 중에서 물려받기 + 합체기 1~2개
  const pool = shuffle([...new Set([...sa.moves, ...sb.moves])].filter(inheritable));
  const sigs = [sa.sig, sb.sig].filter((x) => x && pool.includes(x));
  const inherit = [...sigs, ...pool.filter((x) => !sigs.includes(x))].slice(0, 8 + rnd(3));
  const ca = sa.moves.filter(comboBase), cb = sb.moves.filter(comboBase);
  const mv = {};
  const nCombo = ca.length && cb.length ? 1 + (Math.random() < 0.5 ? 1 : 0) : 0;
  for (let i = 0; i < nCombo; i++) { const flip = i % 2 === 1; const mid = `${id}_c${i}`; mv[mid] = comboMove(mid, flip ? pick(cb) : pick(ca), flip ? pick(ca) : pick(cb)); }
  const combos = Object.keys(mv);
  const moves = [...combos, ...inherit];
  const front = Math.random() < 0.5 ? 0 : 1, [P, Q] = front ? [sb, sa] : [sa, sb];
  const sp = {
    n: mixName(P.n, Q.n), types, base, moves, fz: true, parents: front ? [B.species, A.species] : [A.species, B.species],
    flavor: `${P.n}와(과) ${Q.n}이(가) 합체해 태어난 골목몬. ${pick(LINES)}`,
    ...(combos[0] ? { sig: combos[0] } : {}), ...(P.z ? { z: P.z } : Q.z ? { z: Q.z } : {}),
    look: { split: pick(['v', 'h', 'd']), hue: rnd(360), tint: Math.random() < 0.55, mark: rnd(4), eyes: rnd(3) },
    by: u.name, no: n, at: Date.now(),
  };
  return { id, sp, mv };
}

function fuse(u, uidA, uidB, busy = new Set()) {
  if (!uidA || !uidB || uidA === uidB) return { error: '합체할 골목몬 두 마리를 골라 주세요.' };
  const A = u.mons.find((m) => m.uid === uidA), B = u.mons.find((m) => m.uid === uidB);
  if (!A || !B) return { error: '골목몬을 찾지 못했어요.' };
  if (busy.has(uidA) || busy.has(uidB)) return { error: '원정 중이거나 교환에 걸린 골목몬은 합체할 수 없어요.' };
  const sa = Data.MONSTERS[A.species], sb = Data.MONSTERS[B.species];
  if (!sa || !sb) return { error: '골목몬 정보를 찾지 못했어요.' };
  if (sa.fz || sb.fz) return { error: '합체몬은 더 합체할 수 없어요.' };
  if (A.species === B.species) return { error: '서로 다른 골목몬끼리만 합체할 수 있어요.' };
  if (NO_PARENT.has(A.species) || NO_PARENT.has(B.species) || Data.BANNED.includes(A.species) || Data.BANNED.includes(B.species)) return { error: '이 골목몬은 합체할 수 없어요.' };
  if (u.gp < FUSE_GP) return { error: `합체에 ${FUSE_GP.toLocaleString('ko-KR')}GP가 필요해요.` };
  const f = makeFusion(u, A, B, sa, sb);
  db.fusions[f.id] = f; register(f);
  u.gp -= FUSE_GP;
  // 두 골목몬은 사라지고 새 골목몬 한 마리가 태어나요 (덱에서도 빠짐)
  u.mons = u.mons.filter((m) => m !== A && m !== B);
  (u.decks || []).forEach((d) => { d.team = d.team.filter((t) => t.uid !== uidA && t.uid !== uidB); });
  const shiny = !!(A.shiny || B.shiny);
  const m = { uid: `${Date.now().toString(36)}${rnd(1e6).toString(36)}`, species: f.id, moves: f.sp.moves.slice(0, 4), at: Date.now(), fused: true, ...(shiny ? { shiny: true } : {}), ...(A.aff || B.aff ? { aff: Math.round(((A.aff || 0) + (B.aff || 0)) / 2) } : {}) };
  u.mons.push(m);
  require('./decks').pruneDecks(u);
  u.fusionLog ||= [];
  u.fusionLog.unshift({ id: f.id, a: { species: A.species, shiny: !!A.shiny, plus: A.plus || 0 }, b: { species: B.species, shiny: !!B.shiny, plus: B.plus || 0 }, uid: m.uid, at: Date.now() });
  u.fusionLog = u.fusionLog.slice(0, 200);
  u.counts.fusions = (u.counts.fusions || 0) + 1;
  return { ok: true, mon: m, fusion: pubOf(f.id) };
}

function tree(u) {
  const have = new Set(u.mons.map((m) => m.uid));
  return { gp: FUSE_GP, list: (u.fusionLog || []).map((e) => ({ ...e, alive: have.has(e.uid), fusion: pubOf(e.id) })).filter((e) => e.fusion), total: Object.keys(db.fusions).length };
}

module.exports = { init, register, all, pubOf, fuse, tree, isFusion, mixName, inheritable, comboBase, FUSE_GP, NO_PARENT };
