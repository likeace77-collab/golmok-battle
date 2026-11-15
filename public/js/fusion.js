'use strict';
/* 🧬 합체: 골목몬 두 마리를 합쳐 세상에 하나뿐인 새 골목몬 탄생 · 합체 트리 */
const FZ_GP = 3000, FZ_NO = new Set(['dummy']);
let FZ_N = 0;

/* ---------- 합체몬 그림: 두 골목몬 그림을 이음새로 꿰매 붙여요 ---------- */
function fusionSVG(id, cls = '', mega = false) { // mega: 두 부모의 메가진화 모습을 꿰매 붙임
  const sp = G.data.MONSTERS[id], [pa, pb] = sp.parents || [], L = sp.look || {}, k = `fzc${++FZ_N}`;
  const inner = (pid) => (G.data.MONSTERS[pid] ? monsterSVG(pid, '', mega && !!G.data.MONSTERS[pid].mega) : '<svg></svg>').replace('<svg', '<svg x="0" y="0" width="200" height="200"');
  const S = [];
  for (let i = 0; i <= 10; i++) {
    const w = i % 2 ? 7 : -7;
    if (L.split === 'h') S.push([i * 20, 96 + w]);
    else if (L.split === 'd') S.push([34 + i * 13.2 + w * 0.8, i * 20]);
    else S.push([100 + w, i * 20]);
  }
  const pts = (a) => a.map((p) => p.join(',')).join(' ');
  const A = L.split === 'h' ? [...S, [200, 0], [0, 0]] : [[0, 0], ...S, [0, 200]];
  const B = L.split === 'h' ? [...S, [200, 200], [0, 200]] : [[200, 0], ...S, [200, 200]];
  const tc = G.data.TYPES[sp.types[0]]?.c || '#B44BFF', tc2 = G.data.TYPES[sp.types[1] || sp.types[0]]?.c || tc;
  const mid = S[5];
  const stitches = L.mark === 1 ? S.filter((_, i) => i % 2 === 1 && i < 10).map(([x, y]) => L.split === 'h' ? `<path d="M${x} ${y - 9}V${y + 9}" stroke="#1a1433" stroke-width="3" stroke-linecap="round"/>` : `<path d="M${x - 9} ${y}H${x + 9}" stroke="#1a1433" stroke-width="3" stroke-linecap="round"/>`).join('') : '';
  const mark = L.mark === 2 ? `<path transform="translate(${mid[0]} ${mid[1]})" d="M0 -16L4 -4 16 0 4 4 0 16 -4 4 -16 0 -4 -4Z" fill="#fff" stroke="${tc}" stroke-width="2.5"/>`
    : L.mark === 3 ? `<path transform="translate(${mid[0] - 2} ${mid[1] - 14})" d="M6 0L-6 16H2L-4 30 10 10H2L8 0Z" fill="#FFD23F" stroke="#1a1433" stroke-width="2"/>` : '';
  const tint = L.tint ? ` style="filter:hue-rotate(${L.hue || 0}deg) saturate(1.25)"` : '';
  return `<svg class="fz-art ${cls}" viewBox="0 0 200 200" aria-hidden="true"><defs><clipPath id="${k}a"><polygon points="${pts(A)}"/></clipPath><clipPath id="${k}b"><polygon points="${pts(B)}"/></clipPath>
    <radialGradient id="${k}g"><stop offset="0" stop-color="${tc}" stop-opacity=".35"/><stop offset="1" stop-color="${tc2}" stop-opacity="0"/></radialGradient></defs>
    ${mega ? `<linearGradient id="${k}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5FA2"/><stop offset=".5" stop-color="#FFD23F"/><stop offset="1" stop-color="#2EF2FF"/></linearGradient>` : ''}
    <ellipse cx="100" cy="108" rx="96" ry="92" fill="url(#${k}g)"/>${mega ? `<ellipse class="fz-mega-ring" cx="100" cy="106" rx="94" ry="90" fill="none" stroke="url(#${k}m)" stroke-width="5" stroke-dasharray="14 8" opacity=".9"/>` : ''}
    <g clip-path="url(#${k}a)">${inner(pa)}</g><g clip-path="url(#${k}b)"${tint}>${inner(pb)}</g>
    <polyline points="${pts(S)}" fill="none" stroke="#fff" stroke-width="6" stroke-linejoin="round" opacity=".9"/><polyline class="fz-seam" points="${pts(S)}" fill="none" stroke="${tc}" stroke-width="2.6" stroke-linejoin="round" stroke-dasharray="7 5"/>
    ${stitches}${mark}${mega ? `<g transform="translate(176 22)"><circle r="16" fill="url(#${k}m)" stroke="#1a1433" stroke-width="2.5"/><text y="6" text-anchor="middle" font-size="17" font-weight="900" fill="#1a1433">M</text></g>` : ''}</svg>`;
}
(() => { // monsterSVG가 합체몬을 만나면 이음새 그림으로
  if (typeof monsterSVG !== 'function') return;
  const orig = monsterSVG;
  monsterSVG = function (id, cls = '', ...rest) { const sp = G.data?.MONSTERS?.[id]; return sp?.fz ? fusionSVG(id, cls, !!rest[0]) : orig(id, cls, ...rest); }; // eslint-disable-line no-global-assign
})();

const fzName = (id) => esc(G.data.MONSTERS[id]?.n || '???');
const fzOk = (m) => { const sp = G.data.MONSTERS[m.species]; return sp && !sp.fz && !FZ_NO.has(m.species) && !(G.data.BANNED || []).includes(m.species); };

/* ---------- 내 골목몬 상세: 합체몬이면 어디서 왔는지 ---------- */
function fzMonBox(m) {
  const sp = G.data.MONSTERS[m.species], [a, b] = sp.parents || [];
  return `<section class="fz-box" data-uid="${m.uid}"><h3 class="dex-h">🧬 합체몬 <small class="muted">No.${sp.no || '?'} · ${esc(sp.by || '')}</small></h3>
    <div class="fz-fam"><span>${monArt(a)}<small>${fzName(a)}</small></span><b>＋</b><span>${monArt(b)}<small>${fzName(b)}</small></span></div>
    ${sp.trait ? `<div class="fz-rt"><span>✨ 특성 <b>${esc(sp.trait.n)}</b></span><button class="btn small" data-retrait="ticket">🎲 다시 뽑기 (리롤권 3)</button><button class="btn small paper" data-retrait="gp">1,500GP로 뽑기</button></div>` : ''}
    <p class="muted" style="font-size:12.5px">세상에 하나뿐인 골목몬이에요. 더 합체할 수 없고, 메가스톤 없이 메가진화할 수 있어요. ${(() => { const c = sp.moves.filter((id) => G.data.MOVES[id]?.fzMove).map((id) => `<b>${esc(G.data.MOVES[id].n)}</b>`); return c.length ? `합체기 ${c.join('·')}를 쓸 수 있어요.` : ''; })()}</p></section>`;
}

// 상세 화면의 특성 다시 뽑기 버튼 (openMon이 그린 뒤 연결)
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-retrait]'); if (!b) return;
  const uid = document.querySelector('.fz-box')?.dataset.uid; if (!uid) return;
  if (!confirm(`특성을 다시 뽑을까요? (${b.dataset.retrait === 'gp' ? '1,500GP' : '리롤권 3장'}) 지금 특성은 사라져요.`)) return;
  b.disabled = true;
  try { const r = await api('POST', '/api/fusion/retrait', { uid, pay: b.dataset.retrait }); fzRegisterAll([r.fusion]); setUser(r); toast(`✨ 새 특성: ${r.trait.n}! (${r.old} → ${r.trait.n})`); openMon(uid, typeof G.fzBack === 'function' ? G.fzBack : undefined); } catch (err) { toast(err.message); b.disabled = false; }
});

/* ---------- 🧬 합체 화면 ---------- */
async function showFusion() {
  G.screen = 'fusion'; app.className = '';
  const sel = [null, null];
  const deckUids = new Set((G.user.decks || []).flatMap((d) => d.team.map((t) => t.uid)));
  const draw = () => {
    const mons = G.user.mons.filter(fzOk);
    const pick = (i) => { const m = sel[i] && G.user.mons.find((x) => x.uid === sel[i]); return m ? `<button class="fz-slot on${m.shiny ? ' is-shiny' : ''}" data-slot="${i}">${monArt(m.species, m.shiny)}<b>${fzName(m.species)}${m.plus ? ` +${m.plus}` : ''}</b><small>빼기</small></button>` : `<div class="fz-slot"><i>?</i><small>${i ? '두 번째' : '첫 번째'} 골목몬</small></div>`; };
    const ready = sel[0] && sel[1];
    const sp0 = sel[0] && G.user.mons.find((x) => x.uid === sel[0])?.species;
    app.innerHTML = `${topbar('🧬 합체')}
      <section class="fz-hero"><div class="fz-pair">${pick(0)}<b class="fz-plus">＋</b>${pick(1)}<b class="fz-arrow">➜</b><div class="fz-slot fz-mystery${ready ? ' ready' : ''}"><i>?</i><small>${ready ? '무엇이 태어날까…?' : '새 골목몬'}</small></div></div>
        <p>두 골목몬을 합쳐 <b>세상에 하나뿐인 새 골목몬</b>을 탄생시켜요. 능력치는 두 골목몬의 평균에서 조금 흔들리고, 기술은 둘의 기술 중 <b>8개</b>를 물려받고, 두 기술을 <b>합친</b> 합체기 <b>2개</b>가 생겨요.</p>
        <p class="fz-warn">⚠️ 모습·이름·기술·능력치는 <b>합체해 봐야 알아요.</b> 되돌릴 수 없고, 두 골목몬은 사라져요. 합체몬은 다시 합체할 수 없어요.</p>
        <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn" id="fz-go" ${ready ? '' : 'disabled'}>🧬 합체하기 (${ICON.gp(14)}${fmt(FZ_GP)})</button><button class="btn paper" id="fz-tree">🌳 합체 트리</button></div></section>
      <section class="panel"><h2>합체할 골목몬 고르기 <small class="muted">${mons.length}마리 · 이미 합체한 골목몬은 안 보여요</small></h2>
        <div class="box-grid fz-grid">${mons.map((m) => { const sp = G.data.MONSTERS[m.species], on = sel.includes(m.uid), same = !on && sp0 && sel[0] !== m.uid && m.species === sp0 && !sel[1]; return `<button class="box-card${m.shiny ? ' is-shiny' : ''}${on ? ' fz-on' : ''}" data-uid="${m.uid}" ${same ? 'disabled title="같은 골목몬끼리는 합체할 수 없어요"' : ''} style="--tc:${G.data.TYPES[sp.types[0]].c}">${m.shiny ? '<em class="shiny-dot">✨</em>' : ''}${m.plus ? `<em class="plus-dot">+${m.plus}</em>` : ''}${monArt(m.species, m.shiny)}<b>${esc(sp.n)}</b>${deckUids.has(m.uid) ? '<small class="fz-deck">덱</small>' : ''}</button>`; }).join('') || '<p class="wait">합체할 수 있는 골목몬이 없어요.</p>'}</div></section>`;
    app.querySelector('#back').onclick = () => { app.className = ''; showLobby(); };
    app.querySelector('#fz-tree').onclick = () => showFusionTree(showFusion);
    app.querySelectorAll('[data-slot]').forEach((b) => { b.onclick = () => { sel[+b.dataset.slot] = null; if (!sel[0] && sel[1]) { sel[0] = sel[1]; sel[1] = null; } draw(); }; });
    app.querySelectorAll('.fz-grid [data-uid]').forEach((b) => { b.onclick = () => {
      const uid = b.dataset.uid, i = sel.indexOf(uid);
      if (i >= 0) sel[i] = null;
      else if (!sel[0]) sel[0] = uid;
      else if (!sel[1]) { const a = G.user.mons.find((x) => x.uid === sel[0]), c = G.user.mons.find((x) => x.uid === uid); if (a.species === c.species) return toast('같은 골목몬끼리는 합체할 수 없어요.'); sel[1] = uid; }
      else return toast('두 마리를 이미 골랐어요. 위에서 하나를 빼 주세요.');
      if (!sel[0] && sel[1]) { sel[0] = sel[1]; sel[1] = null; }
      draw();
    }; });
    app.querySelector('#fz-go').onclick = () => confirmFuse(sel, draw);
  };
  draw();
}
function confirmFuse(sel, redraw) {
  const [a, b] = sel.map((uid) => G.user.mons.find((x) => x.uid === uid));
  if (!a || !b) return;
  const deckUids = new Set((G.user.decks || []).flatMap((d) => d.team.map((t) => t.uid)));
  const bg = openSheet(`<div class="fz-confirm"><h2>정말 합체할까요?</h2>
    <div class="fz-pair small"><span class="${a.shiny ? 'is-shiny' : ''}">${monArt(a.species, a.shiny)}<small>${fzName(a.species)}${a.plus ? ` +${a.plus}` : ''}</small></span><b class="fz-plus">＋</b><span class="${b.shiny ? 'is-shiny' : ''}">${monArt(b.species, b.shiny)}<small>${fzName(b.species)}${b.plus ? ` +${b.plus}` : ''}</small></span></div>
    <ul class="fz-list"><li>두 골목몬은 <b>사라지고</b> 되돌릴 수 없어요.${a.plus || b.plus ? ' 강화(+)도 사라져요.' : ''}</li>${deckUids.has(a.uid) || deckUids.has(b.uid) ? '<li>덱에서도 빠져요.</li>' : ''}${a.shiny || b.shiny ? '<li>✨ 이로치가 있으면 합체몬도 이로치!</li>' : ''}<li>어떤 골목몬이 나올지는 아무도 몰라요.</li><li>비용 ${ICON.gp(14)}${fmt(FZ_GP)} (보유 ${fmt(G.user.gp)})</li></ul>
    <div class="row" style="gap:6px"><button class="btn paper" data-x>그만두기</button><button class="btn fz-big" data-go>🧬 합체!</button></div></div>`);
  bg.querySelector('[data-x]').onclick = closeSheet;
  bg.querySelector('[data-go]').onclick = async (e) => {
    e.currentTarget.disabled = true;
    let r; try { r = await api('POST', '/api/fusion', { a: a.uid, b: b.uid }); } catch (err) { closeSheet(); return toast(err.message); }
    fzRegisterAll([r.fusion]); setUser(r); closeSheet();
    sel[0] = sel[1] = null;
    await fusionCine(a, b, r.mon);
    fusionResult(r.mon, redraw);
  };
}

/* ---------- 합체 연출: 두 골목몬이 빙글빙글 하나로… 섬광 … 실루엣 … 등장! ---------- */
async function fusionCine(a, b, mon) {
  const el = document.createElement('div'); el.className = 'fz-cine';
  el.innerHTML = `<div class="fz-ring"></div><div class="fz-l ${a.shiny ? 'is-shiny' : ''}">${monArt(a.species, a.shiny)}</div><div class="fz-r ${b.shiny ? 'is-shiny' : ''}">${monArt(b.species, b.shiny)}</div>
    <div class="fz-new ${mon.shiny ? 'is-shiny' : ''}">${monArt(mon.species, mon.shiny)}</div><div class="fz-flash"></div><p class="fz-cap">${fzName(a.species)}와(과) ${fzName(b.species)}이(가)…</p>`;
  document.body.appendChild(el);
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms)), cap = el.querySelector('.fz-cap');
  const sfx = (k) => { try { typeof CasSfx !== 'undefined' && CasSfx[k]?.(); } catch { /* 소리 없이 */ } };
  let skip = false; el.onclick = () => { skip = true; };
  const step = async (cls, ms, text) => { if (text) cap.innerHTML = text; el.classList.add(cls); if (!skip) await wait(ms); };
  sfx('flip'); await step('s1', 1500, '빙글빙글… 두 골목몬이 하나로 섞여요!');
  sfx('win'); await step('s2', 700);
  await step('s3', 1500, '…이 모습은…?!');
  sfx('big'); await step('s4', 400);
  el.classList.add('s5'); cap.innerHTML = `🧬 <b>${fzName(mon.species)}</b> 탄생!`;
  await new Promise((ok) => { el.onclick = ok; setTimeout(ok, skip ? 600 : 2400); });
  el.remove();
}
function fusionResult(mon, back) {
  const sp = G.data.MONSTERS[mon.species], tot = Object.values(sp.base).reduce((x, y) => x + y, 0);
  const bg = openSheet(`<div class="fz-res"><h2>🧬 ${esc(sp.n)}</h2><div class="detail-pic${mon.shiny ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[sp.types[0]].c};margin:0 auto 8px">${mon.shiny ? SHINY_TAG : ''}${monArt(mon.species, mon.shiny)}</div>
    <p style="text-align:center">${typesOf(mon.species)}</p><p class="muted" style="font-size:13px">${esc(sp.flavor)}</p>
    ${sp.trait ? `<p class="trait fz-trait"><b>✨ 특성 ${esc(sp.trait.n)}</b> ${esc(sp.trait.d)}</p>` : ''}
    ${sp.mega ? `<section class="mon-stone have"><div class="fz-megapic">${monArt(mon.species, mon.shiny, '', true)}</div><div><b>메가진화: ${esc(sp.mega.n)}</b><p>메가스톤 없이 대전에서 메가진화!</p></div></section>` : ''}
    ${Object.entries(sp.base).map(([k, v]) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${v}</span><i style="width:${Math.min(100, v / 1.3)}%"></i></div>`).join('')}<p class="muted" style="text-align:right">합계 ${tot}</p>
    <h3 class="dex-h">기술 ${sp.moves.length}개</h3><div class="fz-moves">${sp.moves.map((id) => { const mv = G.data.MOVES[id]; return mv ? `<span class="${mv.fzMove ? 'fz-combo' : ''}">${typeChip(mv.type)}${esc(mv.n)}${mv.fzMove ? ' <b>합체기</b>' : ''}</span>` : ''; }).join('')}</div>
    <div class="row fz-btns" style="gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn" data-mon>🔍 자세히</button><button class="btn paper" data-tree>🌳 합체 트리</button><button class="btn paper" data-x>닫기</button></div></div>`);
  bg.querySelector('[data-x]').onclick = () => { closeSheet(); back?.(); };
  bg.querySelector('[data-mon]').onclick = () => { closeSheet(); back?.(); openMon(mon.uid, back); };
  bg.querySelector('[data-tree]').onclick = () => { closeSheet(); showFusionTree(showFusion); };
}

/* ---------- 🌳 합체 트리: 내가 탄생시킨 합체몬 기록 ---------- */
async function showFusionTree(back = showLobby) {
  G.screen = 'fztree'; app.className = '';
  app.innerHTML = `${topbar('🌳 합체 트리')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = () => back();
  let t; try { t = (await api('GET', '/api/fusion/tree')).tree; } catch (e) { return toast(e.message); }
  if (G.screen !== 'fztree') return;
  fzRegisterAll(t.list.map((e) => e.fusion));
  const parent = (p) => `<span class="fz-tn${p.shiny ? ' is-shiny' : ''}">${monArt(p.species, p.shiny)}<small>${fzName(p.species)}${p.plus ? ` +${p.plus}` : ''}</small></span>`;
  app.innerHTML = `${topbar('🌳 합체 트리')}
    <section class="fz-hero"><h2>내 합체몬 ${t.list.length}마리</h2><p>내가 탄생시킨 합체몬이 모두 기록돼요. 교환으로 떠나도 기록은 남아요. 지금까지 골목 전체에서 <b>${fmt(t.total)}</b>마리의 합체몬이 태어났어요.</p>
      <button class="btn" id="fz-new">🧬 새로 합체하기</button></section>
    <div class="fz-forest">${t.list.map((e) => { const sp = e.fusion.sp; return `<article class="fz-tree${e.alive ? '' : ' gone'}">
      <div class="fz-par">${parent(e.a)}${parent(e.b)}</div>
      <svg class="fz-lines" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M50 0V14Q50 22 60 22H140Q150 22 150 14V0M100 22V40" fill="none" stroke="currentColor" stroke-width="3"/></svg>
      <button class="fz-child" ${e.alive ? `data-uid="${e.uid}"` : 'disabled'}>${monArt(e.fusion.id)}<b>${esc(sp.n)}</b><span>${sp.types.map(typeChip).join('')}</span>${sp.trait ? `<em class="fz-tt">✨ ${esc(sp.trait.n)}</em>` : ''}<small>No.${sp.no || '?'} · ${dateStr(e.at)}${e.alive ? '' : ' · 떠남'}</small></button></article>`; }).join('') || '<p class="wait">아직 합체한 골목몬이 없어요. 첫 합체몬을 탄생시켜 보세요!</p>'}</div>`;
  app.querySelector('#back').onclick = () => back();
  app.querySelector('#fz-new').onclick = () => showFusion();
  app.querySelectorAll('.fz-child[data-uid]').forEach((b) => { b.onclick = () => openMon(b.dataset.uid, () => showFusionTree(back)); });
}
