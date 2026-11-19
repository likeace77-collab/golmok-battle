'use strict';
// 🧬 합체: 골목몬 두 마리를 합쳐 새 골목몬을 탄생시킵니다.
// - 능력치는 두 골목몬의 평균에서 조금 흔들리고, 타입은 양쪽에서 하나씩.
// - 기술은 두 골목몬의 기술을 물려받고, 두 기술을 합친 합체기가 생겨요.
// - 합체몬은 다시 합체할 수 없고, 되돌릴 수 없어요. 결과는 합체하기 전엔 아무도 몰라요.
// 합체몬 종(種)은 db.fusions에 저장되고, Data.MONSTERS·MOVES에 "열거되지 않는" 항목으로 등록해
// 도감·스카우트·봇 풀(Object.keys로 고르는 곳)에는 섞이지 않게 합니다.
const Data = require('./data');

const FUSE_GP = 3000, FUSE3_GP = 6000; // 2단 합체 · 3단 합체
const GREAT = { p: 0.05 }; // ✨ 합체 대성공 확률 (테스트에서 바꿀 수 있게 객체로)
const NO_PARENT = new Set(['dummy']); // 훈련장 허수아비만 빼고 모두 합체 가능 (등신도 OK: 기술은 물려받고 갈증·돌연사 특성은 안 물려받음)
// 합체몬이 그대로 물려받으면 안 되는 기술 (그 골목몬 몸에만 있는 장치에 기대는 기술)
const BOUND_KEYS = ['forge', 'tierPow', 'elem', 'hydrate', 'dive', 'ouga', 'trial', 'heatEq', 'loop', 'techUp', 'record', 'rage'];
const SIMPLE = new Set(['n', 'type', 'cat', 'pow', 'acc', 'pp', 'pri', 'st', 'd', 'recoil', 'fl', 'crit', 'drain', 'self', 'foe', 'hits', 'selfAfter', 'sound', 'breakGuard', 'sig']);
const MIX_FROM_B = ['st', 'drain', 'foe', 'fl', 'crit', 'sound'];

let db = null, H = {}; // H: 우편·지급 같은 서버 기능 (setHooks)
const jo = (w, a, b) => { const c = String(w).charCodeAt(String(w).length - 1) - 0xac00; return `${w}${c >= 0 && c <= 11171 && c % 28 ? a : b}`; }; // 받침 따라 조사
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
function init(_db) { db = _db; db.fusions ||= {}; for (const f of Object.values(db.fusions)) register(f); oneTimeFixes(); fillSuho(); giveTraits(); }
// 특성이 생기기 전에 태어난 합체몬에게도 (태어난 순서대로) 서로 다른 특성을
// 한 번만: suho님의 「콩시락이」 기술이 10개가 되게 채움 (합체기가 2개 미만이면 합체기, 아니면 부모 기술 하나) (2026-11-15 요청)
function fillSuho() {
  for (const f of Object.values(db.fusions)) {
    if (f.fixes?.includes('suho-ten') || f.sp.n !== '콩시락이' || String(f.sp.by || '').toLowerCase() !== 'suho') continue;
    const [pa, pb] = (f.sp.parents || []).map((x) => Data.MONSTERS[x]);
    if (!pa || !pb) continue;
    const dmg = (x) => Data.MOVES[x] && Data.MOVES[x].cat !== 'x' && Data.MOVES[x].pow > 0 && !Data.MOVES[x].z;
    for (let guard = 0; f.sp.moves.length < 10 && guard < 5; guard++) {
      const combos = f.sp.moves.filter((x) => Data.MOVES[x]?.fzMove);
      if (combos.length < 2) {
        const used = new Set(Object.values(f.mv || {}).map((m) => m.n));
        let made = null;
        for (let t = 0; t < 30 && !made; t++) { const A = t % 2 ? pb : pa, B = t % 2 ? pa : pb; const base = A.moves.filter(comboBase), mixes = B.moves.filter(dmg); if (base.length && mixes.length) { const c = comboMove('', pick(base), pick(mixes)); if (!used.has(c.n)) made = c; } }
        if (!made) break;
        let i = 0; while (f.mv?.[`${f.id}_c${i}`]) i++;
        f.mv ||= {}; f.mv[`${f.id}_c${i}`] = made; f.sp.moves.splice(combos.length, 0, `${f.id}_c${i}`);
      } else {
        const cand = shuffle([...new Set([...pa.moves, ...pb.moves])].filter((x) => inheritable(x) && x !== 'static' && !f.sp.moves.includes(x)));
        if (!cand.length) break;
        f.sp.moves.push(cand[0]);
      }
    }
    (f.fixes ||= []).push('suho-ten');
    register(f);
    console.log(`합체몬 손질: ${f.sp.n} 기술 ${f.sp.moves.length}개`);
  }
}
function giveTraits() {
  for (const f of Object.values(db.fusions).sort((a, b) => (a.sp.at || 0) - (b.sp.at || 0))) {
    if (!f.sp.ft) Object.assign(f.sp, pickTrait(f.sp, f.id));
    if (!f.sp.mega) f.sp.mega = megaOf(f.sp);
    if (!f.sp.gmaxN) f.sp.gmaxN = gmaxNameOf(f.sp);
    register(f);
  }
}
// 합체몬 거다이맥스: 두 부모의 거다이 기술 이름을 섞은 전용 거다이 기술 (모습은 두 부모의 거다이맥스를 꿰매 붙임)
function gmaxNameOf(sp) {
  const nm = (id) => (Data.GMAX_MOVES[id] || `거다이 ${Data.MONSTERS[id]?.n || ''}`).replace(/^거다이\s*/, '').trim();
  const ps = (sp.parents || []).map(nm), a = ps[0], b = ps[ps.length - 1];
  if (ps.length >= 3) { const w = ps.map((x) => (x || sp.n).split(' ')); return `거다이 ${w[0][0]} ${w[1][0]} ${w[2][w[2].length - 1]}`; } // 3단: 셋의 이름을 하나씩
  const wa = (a || sp.n).split(' '), wb = (b || sp.n).split(' ');
  const n = wa.length > 1 || wb.length > 1 ? `${wa[0]} ${wb[wb.length - 1]}` : mixName(a, b);
  return `거다이 ${n === `${a}` ? `${sp.n} 대폭주` : n}`;
}
// 합체몬 메가진화: 두 부모의 메가진화 보너스를 반씩 섞음 (합계 +100). 메가스톤 없이도 할 수 있음
const MEGA_W = ['폭주', '각성', '극한', '초월', '진(眞)', '울트라'];
function megaOf(sp) {
  const ps = (sp.parents || []).map((x) => Data.MONSTERS[x]), [pa, pb] = ps;
  const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  const raw = Object.fromEntries(keys.map((k) => [k, ps.reduce((n, p) => n + (p?.mega?.boost?.[k] || 0), 0) / (ps.length || 1) + Math.random() * 6]));
  const tot = keys.reduce((n, k) => n + raw[k], 0) || 1;
  const boost = Object.fromEntries(keys.map((k) => [k, Math.round(raw[k] / tot * 100)]));
  const fix = 100 - keys.reduce((n, k) => n + boost[k], 0); const top = keys.reduce((a, k) => (boost[k] > boost[a] ? k : a), 'atk'); boost[top] += fix;
  const w = MEGA_W[Math.abs([...sp.n].reduce((h, c) => h * 31 + c.charCodeAt(0), 7)) % MEGA_W.length];
  const mn = (p) => p?.mega?.n || p?.n || '?';
  return { n: `${w} ${sp.n}`, d: `${ps.length >= 3 ? `${mn(ps[0])}, ${jo(mn(ps[1]), '과', '와')} ${mn(ps[2])}` : `${jo(mn(pa), '과', '와')} ${mn(pb)}`}의 힘이 한 몸에서 깨어났다. 합체몬은 메가스톤 없이도 메가진화할 수 있다.`, boost, fz: true };
}
// 한 번만 하는 손질: suho님의 「콩시락이」에서 정전기를 빼고 합체기 하나 추가 (2026-11-15 요청)
function oneTimeFixes() {
  for (const f of Object.values(db.fusions)) {
    if (f.fixes?.includes('suho-static') || f.sp.n !== '콩시락이' || String(f.sp.by || '').toLowerCase() !== 'suho') continue;
    const [pa, pb] = (f.sp.parents || []).map((x) => Data.MONSTERS[x]);
    if (!pa || !pb) continue;
    const dmg = (x) => Data.MOVES[x] && Data.MOVES[x].cat !== 'x' && Data.MOVES[x].pow > 0 && !Data.MOVES[x].z;
    const used = new Set(Object.values(f.mv || {}).map((m) => m.n));
    let made = null;
    for (let t = 0; t < 30 && !made; t++) {
      const flip = t % 2 === 1, A = flip ? pb : pa, B = flip ? pa : pb;
      const base = A.moves.filter(comboBase), mixes = B.moves.filter(dmg);
      if (!base.length || !mixes.length) continue;
      const c = comboMove('', pick(base), pick(mixes));
      if (!used.has(c.n)) made = c;
    }
    if (!made) continue;
    let i = 0; while (f.mv?.[`${f.id}_c${i}`]) i++;
    const mid = `${f.id}_c${i}`;
    f.mv ||= {}; f.mv[mid] = made;
    f.sp.moves = [mid, ...f.sp.moves.filter((x) => x !== 'static' && x !== mid)];
    for (const u of Object.values(db.users || {})) for (const m of u.mons || []) {
      if (m.species !== f.id) continue;
      m.moves = m.moves.map((x) => (x === 'static' ? mid : x));
      if (!m.moves.includes(mid) && m.moves.length < 4) m.moves.push(mid);
    }
    (f.fixes ||= []).push('suho-static');
    register(f);
    console.log(`합체몬 손질: ${f.sp.n} (${f.id}) 정전기 → ${made.n}`);
  }
}
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
function mixName3(a, b, c) { // 3단: 앞·가운데·뒤를 한 조각씩
  const A = syl(a), B = syl(b), C = syl(c);
  for (let t = 0; t < 10; t++) {
    const f = A.slice(0, Math.max(1, Math.floor(A.length / 2) - (t % 2))), mi = Math.min(B.length - 1, Math.floor(B.length / 3) + rnd(2)), m = B.slice(mi, mi + 1), k = C.slice(-Math.max(1, Math.floor(C.length / 2) + (t > 4 ? 1 : 0)));
    const n = [...f, ...m, ...k].slice(0, 6).join('');
    if (![a, b, c].includes(n) && n.length >= 3) return n;
  }
  return `${A[0]}${B[0]}${C.slice(-1).join('')}`;
}
function comboMove3(aId, bId, cId) { // 3단 합체기: A 몸에 B·C 효과를 하나씩
  const A = Data.MOVES[aId], B = Data.MOVES[bId], C = Data.MOVES[cId];
  const mv = { ...A, n: `${A.n.split(' ')[0]} ${B.n.split(' ')[0]} ${C.n.split(' ').slice(-1)[0]}`, pow: Math.min(150, Math.round(Math.max(A.pow, B.pow, C.pow) * 1.15 / 5) * 5), pp: Math.max(5, Math.min(A.pp, B.pp, C.pp)), sig: true, fzMove: true };
  delete mv.d; if (mv.hits) mv.pow = Math.min(mv.pow, 40);
  const got = [];
  for (const X of [B, C]) { const add = MIX_FROM_B.filter((k) => X[k] != null && mv[k] == null); if (add.length) { const k = pick(add); mv[k] = X[k]; got.push(X); } }
  mv.d = `「${A.n}」+「${B.n}」+「${C.n}」 3단 합체기.${A.d ? ` ${A.d}` : ''}${got.map((X) => (X.d ? ` / ${X.d}` : '')).join('')}`;
  return mv;
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


/* ---------- 🧬 합체몬 특성: 합체몬마다 서로 다른 특성 하나 ---------- */
const TN = (t) => Data.TYPES[t]?.n || t;
const SN = { atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드', acc: '명중률' };
const SNG = { atk: '공격이', def: '방어가', spa: '특공이', spd: '특방이', spe: '스피드가', acc: '명중률이' };
const STN = { brn: '화상', par: '마비', psn: '독', slp: '잠듦', frz: '얼음' };
const TYPES = () => Object.keys(Data.TYPES).filter((t) => t !== 'none');
const pct = (v) => `${Math.round(Math.abs(v - 1) * 100)}%`;
// 특성 후보 전부: [서명, 효과, 이름, 설명]
function traitCatalog() {
  const L = [];
  const add = (e, n, d) => L.push({ sig: JSON.stringify(e), e, n, d });
  for (const t of TYPES()) {
    [[1.2, '기운'], [1.3, '심장'], [1.4, '폭주']].forEach(([v, w]) => add({ k: 'boost', t, v }, `${TN(t)} ${w}`, `${TN(t)} 기술의 위력이 ${pct(v)} 세진다.`));
    [[0.7, '막이'], [0.6, '방패'], [0.5, '결계']].forEach(([v, w]) => add({ k: 'guard', t, v }, `${TN(t)} ${w}`, `${TN(t)} 기술에 받는 피해가 ${pct(v)} 줄어든다.`));
    add({ k: 'absorb', t }, `${TN(t)} 먹보`, `${TN(t)} 기술을 맞으면 피해 대신 체력을 1/4 회복한다.`);
  }
  for (const [st, n] of [['brn', '내열 피부'], ['par', '절연 몸'], ['psn', '해독 체질'], ['slp', '불면증'], ['frz', '보온 털']]) add({ k: 'immune', s: st }, n, `${STN[st]} 상태가 되지 않는다.`);
  for (const [st, n] of [['atk', '투지 시동'], ['def', '단단 시동'], ['spa', '집중 시동'], ['spd', '평정 시동'], ['spe', '질주 시동']]) add({ k: 'entryUp', st }, n, `싸움에 나오면 자신의 ${SNG[st]} 오른다.`);
  for (const [st, n] of [['atk', '위압감'], ['def', '겁주기'], ['spa', '방해 전파'], ['spd', '야유'], ['spe', '끈끈이 발'], ['acc', '모래 뿌리기']]) add({ k: 'entryDown', st }, n, `싸움에 나오면 상대의 ${SNG[st]} 떨어진다.`);
  for (const [w, n, d] of [['sun', '햇살 부르기', '땡볕'], ['rain', '비 부르기', '비'], ['snow', '눈 부르기', '눈'], ['dust', '황사 부르기', '황사']]) add({ k: 'weather', w }, n, `싸움에 나오면 5턴 동안 ${d}.`);
  [[1 / 16, '재생'], [1 / 10, '초재생']].forEach(([v, n]) => add({ k: 'regen', v }, n, `턴이 끝날 때마다 체력을 1/${Math.round(1 / v)} 회복한다.`));
  for (const [st, n] of [['brn', '불꽃 가시'], ['par', '전기 털'], ['psn', '독 가시'], ['slp', '꿀잠 가루'], ['frz', '냉기 비늘']]) add({ k: 'contact', s: st, v: 30 }, n, `물리 공격을 받으면 30% 확률로 상대를 ${STN[st]} 상태로 만든다.`);
  for (const [st, n] of [['atk', '승리의 함성'], ['def', '승리의 갑옷'], ['spa', '승리의 영감'], ['spd', '승리의 미소'], ['spe', '승리의 질주']]) add({ k: 'moxie', st }, n, `상대를 쓰러뜨리면 자신의 ${SNG[st]} 오른다.`);
  [[0.25, '비상 간식'], [0.33, '비상 도시락'], [0.5, '비상 보약']].forEach(([v, n]) => add({ k: 'pinchHeal', v }, n, `체력이 1/3 이하가 되면 한 번, 최대 체력의 ${Math.round(v * 100)}%를 회복한다.`));
  [[1.2, '약점 찌르기'], [1.3, '약점 사냥꾼']].forEach(([v, n]) => add({ k: 'sePow', v }, n, `효과가 굉장한 기술의 위력이 ${pct(v)} 세진다.`));
  [[0.75, '튼튼 체질'], [0.65, '철벽 체질']].forEach(([v, n]) => add({ k: 'seGuard', v }, n, `효과가 굉장한 기술에 받는 피해가 ${pct(v)} 줄어든다.`));
  [[0.75, '첫 방 막기'], [0.6, '멀티스케일'], [0.5, '천하무적 첫인상']].forEach(([v, n]) => add({ k: 'fullGuard', v }, n, `체력이 가득할 때 받는 피해가 ${pct(v)} 줄어든다.`));
  [[1.3, '약자 괴롭히기'], [1.4, '상처 후벼파기']].forEach(([v, n]) => add({ k: 'statusPow', v }, n, `상태이상인 상대에게 주는 피해가 ${pct(v)} 세진다.`));
  [['p', 1.2, '근육'], ['p', 1.3, '철권'], ['s', 1.2, '두뇌'], ['s', 1.3, '천재']].forEach(([c, v, n]) => add({ k: 'catPow', c, v }, n, `${c === 'p' ? '물리' : '특수'} 기술의 위력이 ${pct(v)} 세진다.`));
  [['p', 0.8, '두꺼운 가죽'], ['p', 0.7, '강철 피부'], ['s', 0.8, '마법 막'], ['s', 0.7, '마력 결계']].forEach(([c, v, n]) => add({ k: 'catGuard', c, v }, n, `${c === 'p' ? '물리' : '특수'} 기술에 받는 피해가 ${pct(v)} 줄어든다.`));
  [[1.3, '역경'], [1.5, '배수진']].forEach(([v, n]) => add({ k: 'pinchPow', v }, n, `체력이 절반 이하이면 주는 피해가 ${pct(v)} 세진다.`));
  [[1.2, '날쌘 발'], [1.3, '번개 발']].forEach(([v, n]) => add({ k: 'quick', v }, n, `스피드가 ${pct(v)} 빨라진다.`));
  return L;
}
const traitSig = (ft) => ft.map((e) => JSON.stringify(e)).sort().join('|');
// 아직 아무 합체몬도 안 가진 특성을 골라요. 몸에 맞는 타입(자기 타입·기술 타입)을 더 자주. 다 쓰면 두 개를 묶어 새 특성
function pickTrait(sp, skipId) {
  const used = new Set(Object.values(db.fusions).filter((f) => f.id !== skipId && f.sp.ft).map((f) => traitSig(f.sp.ft)));
  const usedNames = new Set(Object.values(db.fusions).filter((f) => f.id !== skipId && f.sp.trait).map((f) => f.sp.trait.n));
  const all = traitCatalog();
  const mvTypes = new Set(sp.moves.map((x) => Data.MOVES[x]?.type));
  const fit = (c) => (c.e.t ? (sp.types.includes(c.e.t) ? 4 : mvTypes.has(c.e.t) ? 2 : 0.4) : 1.5);
  const free = all.filter((c) => !used.has(traitSig([c.e])) && !usedNames.has(c.n));
  const roll = (list) => { const tot = list.reduce((n, c) => n + fit(c), 0); let x = Math.random() * tot; for (const c of list) { x -= fit(c); if (x <= 0) return c; } return list[list.length - 1]; };
  if (free.length) { const c = roll(free); return { ft: [c.e], trait: { n: c.n, d: c.d } }; }
  for (let t = 0; t < 500; t++) { // 두 특성 묶기
    const a = roll(all), b2 = roll(all.filter((c) => c.e.k !== a.e.k));
    const ft = [a.e, b2.e], n = `${a.n}·${b2.n}`;
    if (!used.has(traitSig(ft)) && !usedNames.has(n)) return { ft, trait: { n, d: `${a.d} 그리고 ${b2.d}` } };
  }
  const c = roll(all); return { ft: [c.e], trait: { n: `${c.n} ${Object.keys(db.fusions).length}`, d: c.d } };
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
  const inherit = [...sigs, ...pool.filter((x) => !sigs.includes(x))].slice(0, 8); // 물려받는 기술은 딱 8개
  // 합체기는 딱 2개: 한쪽 몸에 다른 쪽 효과 한 번, 반대로 한 번 (한쪽에 쓸 기술이 없으면 다른 쪽 기술끼리)
  const dmg = (x) => Data.MOVES[x] && Data.MOVES[x].cat !== 'x' && Data.MOVES[x].pow > 0 && !Data.MOVES[x].z;
  // 몸(A)은 효과가 단순한 공격 기술, 섞을 기술(B)은 반대쪽 골목몬의 아무 공격 기술. 한쪽에 몸으로 쓸 기술이 없으면 다른 쪽 걸로
  const ba = sa.moves.filter(comboBase), bb = sb.moves.filter(comboBase), xa = sa.moves.filter(dmg), xb = sb.moves.filter(dmg);
  const body = (own, other) => (own.length ? own : other.length ? other : [...xa, ...xb]);
  const mix = (own, avoid) => { const c = own.filter((x) => x !== avoid); return c.length ? c : [...xa, ...xb].filter((x) => x !== avoid); };
  const mv = {};
  for (let i = 0; i < 2; i++) {
    const A1 = pick(body(i ? bb : ba, i ? ba : bb)), B1 = pick(mix(i ? xa : xb, A1));
    if (A1 && B1) mv[`${id}_c${i}`] = comboMove(`${id}_c${i}`, A1, B1);
  }
  const combos = Object.keys(mv);
  const moves = [...combos, ...inherit];
  const front = Math.random() < 0.5 ? 0 : 1, [P, Q] = front ? [sb, sa] : [sa, sb];
  const sp = {
    n: mixName(P.n, Q.n), types, base, moves, fz: true, parents: front ? [B.species, A.species] : [A.species, B.species],
    flavor: `${jo(P.n, '과', '와')} ${jo(Q.n, '이', '가')} 합체해 태어난 골목몬. ${pick(LINES)}`,
    ...(combos[0] ? { sig: combos[0] } : {}), ...(P.z ? { z: P.z } : Q.z ? { z: Q.z } : {}),
    look: { split: pick(['v', 'h', 'd']), hue: rnd(360), tint: Math.random() < 0.55, mark: rnd(4), eyes: rnd(3) },
    by: u.name, no: n, at: Date.now(),
  };
  Object.assign(sp, pickTrait(sp, id)); sp.mega = megaOf(sp); sp.gmaxN = gmaxNameOf(sp);
  return { id, sp, mv };
}

const LINES3 = ['셋의 마음이 하나가 되자 번개 속에서 태어났다.', '세 골목의 기억이 한 몸에서 소용돌이친다.', '세 목소리로 동시에 울면 골목이 흔들린다.', '셋 중 누구를 닮았는지 아무도 정하지 못했다.', '3단 합체의 빛은 사흘 동안 꺼지지 않았다고 한다.'];
function makeFusion3(u, mons, sps) {
  const n = Object.keys(db.fusions).length + 1;
  const id = `fz${Date.now().toString(36)}${rnd(1296).toString(36)}`;
  const order = shuffle([0, 1, 2]), P = order.map((i) => sps[i]), PM = order.map((i) => mons[i]);
  const base = Object.fromEntries(STATS.map((k) => [k, Math.max(20, Math.round(sps.reduce((x, s2) => x + s2.base[k], 0) / 3 * (0.92 + Math.random() * 0.2)))]));
  // 타입: 세 골목몬 중 두 마리에게서 하나씩
  const two = shuffle(P).slice(0, 2), ta = pick(two[0].types), tb = pick(two[1].types.filter((t) => t !== ta).length ? two[1].types.filter((t) => t !== ta) : two[1].types);
  const types = ta === tb ? [ta] : [ta, tb];
  const pool = shuffle([...new Set(P.flatMap((x) => x.moves))].filter(inheritable));
  const sigs = P.map((x) => x.sig).filter((x) => x && pool.includes(x));
  const inherit = [...sigs, ...pool.filter((x) => !sigs.includes(x))].slice(0, 8);
  const dmg = (x) => Data.MOVES[x] && Data.MOVES[x].cat !== 'x' && Data.MOVES[x].pow > 0 && !Data.MOVES[x].z;
  const bases = P.map((x) => x.moves.filter(comboBase)), xs = P.map((x) => x.moves.filter(dmg)), anyX = xs.flat();
  const mv = {};
  for (let i = 0; i < 2; i++) { // 몸을 맡는 골목몬을 바꿔 가며 2개
    const bi = [i, i + 1, 2, 0].find((j) => bases[j % 3]?.length) % 3, rest = [0, 1, 2].filter((j) => j !== bi);
    const A1 = pick(bases[bi].length ? bases[bi] : anyX);
    const B1 = pick(xs[rest[0]].filter((x) => x !== A1).length ? xs[rest[0]].filter((x) => x !== A1) : anyX.filter((x) => x !== A1));
    const C1 = pick(xs[rest[1]].filter((x) => x !== A1 && x !== B1).length ? xs[rest[1]].filter((x) => x !== A1 && x !== B1) : anyX.filter((x) => x !== A1 && x !== B1));
    if (A1 && B1 && C1) mv[`${id}_c${i}`] = comboMove3(A1, B1, C1);
  }
  const combos = Object.keys(mv);
  const sp = {
    n: mixName3(P[0].n, P[1].n, P[2].n), types, base, moves: [...combos, ...inherit], fz: true, tri: true, parents: PM.map((m) => m.species),
    flavor: `${P[0].n}, ${jo(P[1].n, '과', '와')} ${jo(P[2].n, '이', '가')} 3단 합체해 태어난 골목몬. ${pick(LINES3)}`,
    ...(combos[0] ? { sig: combos[0] } : {}), ...((P.find((x) => x.z) || {}).z ? { z: P.find((x) => x.z).z } : {}),
    look: { split: pick(['y', 'v3', 'h3']), hue: rnd(360), tint: Math.random() < 0.55, mark: rnd(4) },
    by: u.name, no: n, at: Date.now(),
  };
  Object.assign(sp, pickTrait(sp, id)); sp.mega = megaOf(sp); sp.gmaxN = gmaxNameOf(sp);
  return { id, sp, mv };
}

// 3단 합체: 서로 다른 골목몬 세 마리 → 새 골목몬 한 마리
function fuse3(u, uids, busy = new Set()) {
  uids = [...new Set((uids || []).map(String))];
  if (uids.length !== 3) return { error: '3단 합체할 골목몬 세 마리를 골라 주세요.' };
  const ms = uids.map((x) => u.mons.find((m) => m.uid === x));
  if (ms.some((m) => !m)) return { error: '골목몬을 찾지 못했어요.' };
  if (uids.some((x) => busy.has(x))) return { error: '원정 중이거나 교환에 걸린 골목몬은 합체할 수 없어요.' };
  const sps = ms.map((m) => Data.MONSTERS[m.species]);
  if (sps.some((x) => !x)) return { error: '골목몬 정보를 찾지 못했어요.' };
  if (sps.some((x) => x.fz)) return { error: '합체몬은 더 합체할 수 없어요.' };
  if (new Set(ms.map((m) => m.species)).size !== 3) return { error: '서로 다른 골목몬끼리만 합체할 수 있어요.' };
  if (ms.some((m) => NO_PARENT.has(m.species) || Data.BANNED.includes(m.species))) return { error: '이 골목몬은 합체할 수 없어요.' };
  const free = !(u.fzFreeUsed || {})[3]; // 🎁 3단 합체 첫 번째는 무료
  if (!free && u.gp < FUSE3_GP) return { error: `3단 합체에 ${FUSE3_GP.toLocaleString('ko-KR')}GP가 필요해요.` };
  const f = makeFusion3(u, ms, sps); if (Math.random() < GREAT.p) greatUp(f, sps);
  db.fusions[f.id] = f; register(f);
  if (free) (u.fzFreeUsed ||= {})[3] = Date.now(); else u.gp -= FUSE3_GP;
  u.mons = u.mons.filter((m) => !ms.includes(m));
  (u.decks || []).forEach((d) => { d.team = d.team.filter((t) => !uids.includes(t.uid)); });
  const shiny = ms.some((m) => m.shiny), aff = Math.round(ms.reduce((n, m) => n + (m.aff || 0), 0) / 3);
  const m = { uid: `${Date.now().toString(36)}${rnd(1e6).toString(36)}`, species: f.id, moves: f.sp.moves.slice(0, 4), at: Date.now(), fused: true, ...(shiny ? { shiny: true } : {}), ...(aff ? { aff } : {}) };
  u.mons.push(m);
  require('./decks').pruneDecks(u);
  const rec = (x) => ({ species: x.species, shiny: !!x.shiny, plus: x.plus || 0 });
  u.fusionLog ||= [];
  u.fusionLog.unshift({ id: f.id, a: rec(ms[0]), b: rec(ms[1]), c: rec(ms[2]), uid: m.uid, at: Date.now() });
  u.fusionLog = u.fusionLog.slice(0, 200);
  u.counts.fusions = (u.counts.fusions || 0) + 1;
  return { ok: true, mon: m, fusion: pubOf(f.id), great: !!f.sp.great, free };
}

// ✨ 대성공: 능력치가 부모 평균 ×1.2~1.3, 합체기 하나 더, 금빛 테두리
function greatUp(f, sps) {
  const sp = f.sp;
  sp.base = Object.fromEntries(STATS.map((k) => [k, Math.max(20, Math.round(sps.reduce((n, x) => n + x.base[k], 0) / sps.length * (1.2 + Math.random() * 0.1)))]));
  const dmg = (x) => Data.MOVES[x] && Data.MOVES[x].cat !== 'x' && Data.MOVES[x].pow > 0 && !Data.MOVES[x].z;
  const used = new Set(Object.values(f.mv).map((m) => m.n));
  for (let t = 0; t < 30; t++) {
    const P = shuffle(sps), base = P[0].moves.filter(comboBase), mix = P[1].moves.filter(dmg);
    if (!base.length || !mix.length) continue;
    const c = comboMove('', pick(base), pick(mix.filter((x) => x !== base[0]).length ? mix : mix));
    if (used.has(c.n)) continue;
    c.pow = Math.min(150, c.pow + 10); c.d = `✨대성공 합체기. ${c.d}`;
    const id = `${f.id}_c${Object.keys(f.mv).length}`; f.mv[id] = c; sp.moves.splice(Object.keys(f.mv).length - 1, 0, id);
    break;
  }
  sp.great = true; sp.mega = megaOf(sp);
  sp.flavor = `✨ 합체 대성공으로 태어난 특별한 골목몬! ${sp.flavor}`;
  H.sysChat?.(`✨ ${sp.by}님 합체 대성공!! 특별한 합체몬 「${sp.n}」 탄생!`);
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
  const free = !(u.fzFreeUsed || {})[2]; // 🎁 2단 합체 첫 번째는 무료
  if (!free && u.gp < FUSE_GP) return { error: `합체에 ${FUSE_GP.toLocaleString('ko-KR')}GP가 필요해요.` };
  const f = makeFusion(u, A, B, sa, sb); if (Math.random() < GREAT.p) greatUp(f, [sa, sb]);
  db.fusions[f.id] = f; register(f);
  if (free) (u.fzFreeUsed ||= {})[2] = Date.now(); else u.gp -= FUSE_GP;
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
  return { ok: true, mon: m, fusion: pubOf(f.id), great: !!f.sp.great, free };
}

// 특성 다시 뽑기: 리롤권 3장 또는 1,500GP. 지금 특성과 다른 특성, 여전히 다른 합체몬과 안 겹침
const RETRAIT_TK = 3, RETRAIT_GP = 1500;
function retrait(u, uid, pay) {
  const m = u.mons.find((x) => x.uid === uid), f = m && db.fusions[m.species];
  if (!f) return { error: '합체몬을 골라 주세요.' };
  if (pay === 'gp') { if (u.gp < RETRAIT_GP) return { error: `${RETRAIT_GP.toLocaleString('ko-KR')}GP가 필요해요.` }; }
  else if ((u.rerolls || 0) < RETRAIT_TK) return { error: `리롤권이 ${RETRAIT_TK}장 필요해요. (지금 ${u.rerolls || 0}장)` };
  const old = f.sp.trait?.n;
  let next = null; for (let t = 0; t < 20 && (!next || next.trait.n === old); t++) next = pickTrait(f.sp, f.id);
  if (pay === 'gp') u.gp -= RETRAIT_GP; else u.rerolls -= RETRAIT_TK;
  Object.assign(f.sp, next); register(f);
  return { ok: true, old, trait: f.sp.trait, fusion: pubOf(f.id) };
}

function tree(u) {
  const have = new Set(u.mons.map((m) => m.uid));
  return { gp: FUSE_GP, gp3: FUSE3_GP, list: (u.fusionLog || []).map((e) => ({ ...e, alive: have.has(e.uid), fusion: pubOf(e.id) })).filter((e) => e.fusion), total: Object.keys(db.fusions).length };
}

/* ---------- 🖼️ 합체몬 갤러리 · 주간 하트 투표 ---------- */
const KST = 9 * 3600e3;
const weekKey = (t = Date.now()) => { const d = new Date(t + KST); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const VOTE_R = [{ gp: 10000 }, { gp: 5000 }, { gp: 3000 }];
function setHooks(h) { H = h; }
const voteBook = () => { db.fzVote ||= { week: weekKey(), hearts: {}, hist: [] }; return db.fzVote; };
function settleVotes() { // 주가 바뀌면 지난주 1~3등 합체몬 주인에게 상
  const v = voteBook(), wk = weekKey();
  if (v.week === wk) return false;
  const top = Object.entries(v.hearts).map(([id, ks]) => [id, ks.length]).filter(([id, n]) => n > 0 && db.fusions[id]).sort((a, b) => b[1] - a[1] || (db.fusions[a[0]].sp.at - db.fusions[b[0]].sp.at)).slice(0, 3);
  top.forEach(([id, n], i) => {
    const f = db.fusions[id]; f.sp.crowns = (f.sp.crowns || 0) + (i === 0 ? 1 : 0);
    const owner = H.keyOf && db.users?.[H.keyOf(f.sp.by)];
    if (owner && H.grant) { H.grant(owner, VOTE_R[i]); H.sendMail?.(owner, { from: '합체몬 갤러리', title: `🧬 지난주 합체몬 투표 ${i + 1}위!`, body: `내가 만든 「${f.sp.n}」이(가) 하트 ${n}개로 ${i + 1}위를 했어요! ${VOTE_R[i].gp.toLocaleString('ko-KR')}GP는 지갑에 들어갔어요.${i === 0 ? ' 칭호 「이 주의 합체몬」을 받아 가세요.' : ''}`, reward: i === 0 ? ['titles:fzstar'] : [] }); }
  });
  if (top[0]) H.sysChat?.(`🧬 지난주 최고의 합체몬은 ${db.fusions[top[0][0]].sp.by}님의 「${db.fusions[top[0][0]].sp.n}」! (하트 ${top[0][1]}개)`);
  v.hist.unshift({ week: v.week, top: top.map(([id, n]) => ({ id, n: db.fusions[id].sp.n, by: db.fusions[id].sp.by, hearts: n })) }); v.hist = v.hist.slice(0, 12);
  v.week = wk; v.hearts = {};
  return true;
}
function gallery(u, key, sort = 'hot') {
  settleVotes();
  const v = voteBook(), alive = new Set(Object.values(db.users || {}).flatMap((x) => (x.mons || []).map((m) => m.species).filter((sp) => db.fusions[sp])));
  let list = Object.values(db.fusions).map((f) => ({ id: f.id, hearts: (v.hearts[f.id] || []).length, all: (f.sp.heartsAll || 0), mine: (v.hearts[f.id] || []).includes(key), own: f.sp.by === u.name, alive: alive.has(f.id), crowns: f.sp.crowns || 0, at: f.sp.at || 0 }));
  if (sort === 'new') list.sort((a, b) => b.at - a.at); else if (sort === 'mine') list = list.filter((x) => x.own).sort((a, b) => b.at - a.at); else list.sort((a, b) => b.hearts - a.hearts || b.all - a.all || b.at - a.at);
  const ids = list.slice(0, 80).map((x) => x.id);
  return { week: v.week, list: list.slice(0, 80), fusions: ids.map(pubOf), last: v.hist[0] || null, total: Object.keys(db.fusions).length, myHearts: Object.values(v.hearts).filter((ks) => ks.includes(key)).length, maxHearts: HEART_MAX };
}
const HEART_MAX = 5; // 한 주에 하트 5개까지 (합체몬마다 하나)
function heart(u, key, id) {
  settleVotes();
  const f = db.fusions[id]; if (!f) return { error: '없는 합체몬이에요.' };
  if (f.sp.by === u.name) return { error: '내가 만든 합체몬에는 하트를 줄 수 없어요.' };
  const v = voteBook(), ks = (v.hearts[id] ||= []), i = ks.indexOf(key);
  if (i >= 0) { ks.splice(i, 1); f.sp.heartsAll = Math.max(0, (f.sp.heartsAll || 1) - 1); return { ok: true, on: false, hearts: ks.length }; }
  if (Object.values(v.hearts).filter((x) => x.includes(key)).length >= HEART_MAX) return { error: `하트는 한 주에 ${HEART_MAX}개까지 줄 수 있어요. 다른 하트를 빼고 주세요.` };
  ks.push(key); f.sp.heartsAll = (f.sp.heartsAll || 0) + 1;
  return { ok: true, on: true, hearts: ks.length };
}

module.exports = { GREAT, setHooks, gallery, heart, settleVotes, weekKey, HEART_MAX, fuse3, FUSE3_GP, mixName3, retrait, RETRAIT_TK, RETRAIT_GP, init, register, all, pubOf, fuse, tree, isFusion, mixName, inheritable, comboBase, FUSE_GP, NO_PARENT };
