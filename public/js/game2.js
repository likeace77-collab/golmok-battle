// 새 게임: 재화 아이콘, 메가스톤, 튜토리얼, 스카우트, 내 골목몬, 보상(출석·퀘스트·업적), 시즌 패스, 설문, 개복치 키우기
/* global G, app, api, toast, esc, openSheet, closeSheet, monsterSVG, typeChip, typesOf, showLobby, STAT_LABEL, sigTag, moveLine, avatarSVG, MEGA_ART */

const fmt = (n) => Number(n || 0).toLocaleString('ko-KR');
const hhmmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
const hashOf = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
let svgSeq = 0;

/* ---------- 재화 아이콘 ---------- */
const ICON = {
  gpt(size = 22) { // 길P: 방패 모양 길드 포인트
    const id = `gpt${svgSeq++}`;
    return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c2ff"/><stop offset=".5" stop-color="#7a2cff"/><stop offset="1" stop-color="#3b0a8e"/></linearGradient></defs>
      <path d="M20 2 35 7v12c0 9-6.500 15-15 19C11.500 34 5 28 5 19V7z" fill="url(#${id})" stroke="#1a1433" stroke-width="2.600" stroke-linejoin="round"/><path d="M20 6.500 31 10v9c0 6.500-4.500 11-11 14.500" fill="none" stroke="#fff" stroke-width="1.600" opacity=".55"/>
      <text x="20" y="25" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="13" fill="#fff" stroke="#1a1433" stroke-width=".8" paint-order="stroke">길P</text></svg>`;
  },
  gp(size = 22) {
    const id = `gpg${svgSeq++}`;
    return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><defs><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#c98a00"/></radialGradient></defs>
      <circle cx="20" cy="20" r="18" fill="url(#${id})" stroke="#1a1433" stroke-width="2.6"/><circle cx="20" cy="20" r="13.5" fill="none" stroke="#a86f00" stroke-width="1.6" stroke-dasharray="2 2"/>
      <text x="20" y="25.5" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="15" fill="#7a4d00">GP</text><path d="M10 13q4-5 10-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
  },
  ticket(size = 22) {
    const g = `tkg${svgSeq++}`, h = `tkh${svgSeq++}`;
    return `<svg class="ic" width="${size * 1.5}" height="${size}" viewBox="0 0 60 40" aria-hidden="true"><defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".5" stop-color="#ffb02e"/><stop offset="1" stop-color="#ff6a2b"/></linearGradient>
      <linearGradient id="${h}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff5fb0"/><stop offset=".25" stop-color="#ffd23f"/><stop offset=".5" stop-color="#4dffb0"/><stop offset=".75" stop-color="#4dc3ff"/><stop offset="1" stop-color="#b55cff"/></linearGradient></defs>
      <path d="M4 4h52v10a6 6 0 0 0 0 12v10H4V26a6 6 0 0 0 0-12z" fill="url(#${g})" stroke="#1a1433" stroke-width="2.4" stroke-linejoin="round"/>
      <rect x="9" y="8" width="5" height="24" rx="2" fill="url(#${h})" opacity=".9"/>
      <path d="M41 6v28" stroke="#1a1433" stroke-width="1.6" stroke-dasharray="2.5 2.5"/>
      <circle cx="27" cy="20" r="9" fill="#fff" stroke="#1a1433" stroke-width="2"/><path d="M18 20h18" stroke="#1a1433" stroke-width="2"/><path d="M18.2 20a9 9 0 0 1 17.6 0z" fill="#E8402C" stroke="#1a1433" stroke-width="2"/><circle cx="27" cy="20" r="3" fill="#fff" stroke="#1a1433" stroke-width="2"/>
      <path d="M46 14l2 4 4 .5-3 3 .8 4-3.8-2-3.8 2 .8-4-3-3 4-.5z" fill="#fff" stroke="#1a1433" stroke-width="1.2"/></svg>`;
  },
  skip(size = 22) {
    const g = `skg${svgSeq++}`;
    return `<svg class="ic" width="${size * 1.5}" height="${size}" viewBox="0 0 60 40" aria-hidden="true"><defs>
      <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff7ff"/><stop offset=".5" stop-color="#4dc3ff"/><stop offset="1" stop-color="#3d5bff"/></linearGradient></defs>
      <path d="M4 4h52v10a6 6 0 0 0 0 12v10H4V26a6 6 0 0 0 0-12z" fill="url(#${g})" stroke="#1a1433" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="21" cy="20" r="10" fill="#fff" stroke="#1a1433" stroke-width="2"/><path d="M21 13v7l5 3" stroke="#1a1433" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M33 12l7 8-7 8M40 12l7 8-7 8" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 12l7 8-7 8M40 12l7 8-7 8" stroke="#1a1433" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="21" y="37.5" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="6.5" fill="#1a1433">1H</text></svg>`;
  },
  pass(size = 22) { return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#b55cff" stroke="#1a1433" stroke-width="2.4" stroke-linejoin="round"/><text x="20" y="25" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="9" fill="#fff">P</text></svg>`; },
};

/* ---------- 메가스톤: 골목몬마다 모양·색·속 무늬가 다름 ---------- */
const STONE_SHAPES = [
  'M50 4 L84 20 L96 54 L78 88 L50 98 L22 88 L4 54 L16 20 Z', // 둥근 브릴리언트
  'M50 4 L92 28 L92 74 L50 98 L8 74 L8 28 Z', // 육각
  'M50 2 C76 30 92 50 92 66 A42 34 0 0 1 8 66 C8 50 24 30 50 2 Z', // 물방울
  'M50 2 L96 50 L50 98 L4 50 Z', // 마름모
  'M32 4 H68 L96 32 V68 L68 96 H32 L4 68 V32 Z', // 팔각
  'M50 2 L88 30 L72 96 H28 L12 30 Z', // 오각 방패
];
function stoneSVG(id, size = 48, { lock = false } = {}) {
  const sp = G.data.MONSTERS[id];
  const h = hashOf(id), shape = STONE_SHAPES[h % STONE_SHAPES.length];
  const c1 = G.data.TYPES[sp.types[0]].c, c2 = G.data.TYPES[sp.types[1] || sp.types[0]].c;
  const k = svgSeq++, g = `sg${k}`, cl = `sc${k}`, gl = `sl${k}`;
  const rot = (h >> 3) % 360;
  const art = MEGA_ART?.[id] ? `<g clip-path="url(#${cl})"><svg x="22" y="22" width="56" height="56" viewBox="-6 -6 212 212" opacity=".95">${MEGA_ART[id]}</svg></g>` : `<text x="50" y="58" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="22" fill="#fff">${esc(sp.n[0])}</text>`;
  return `<svg class="stone ${lock ? 'lock' : ''}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="${esc(sp.n)} 메가스톤"><defs>
    <linearGradient id="${g}" gradientTransform="rotate(${rot} .5 .5)"><stop offset="0" stop-color="${c1}"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".85"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="${gl}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".7" stop-color="${c1}" stop-opacity=".35"/><stop offset="1" stop-color="${c2}" stop-opacity=".1"/></radialGradient>
    <clipPath id="${cl}"><circle cx="50" cy="50" r="26"/></clipPath></defs>
    <path d="${shape}" fill="url(#${g})" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/>
    <path d="${shape}" fill="none" stroke="#fff" stroke-width="1.4" stroke-linejoin="round" opacity=".7" transform="translate(50 50) scale(.84) translate(-50 -50)"/>
    <path d="M50 4 L50 24 M96 54 L76 50 M4 54 L24 50 M50 98 L50 76" stroke="#fff" stroke-width="1.6" opacity=".55"/>
    <circle cx="50" cy="50" r="27" fill="url(#${gl})" stroke="#1a1433" stroke-width="2.6"/>
    ${art}
    <path d="M50 23 C62 33 62 43 50 50 C38 57 38 67 50 77" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>
    <path d="M30 22 Q40 12 54 12" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M80 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#fff"/></svg>`;
}

/* ---------- 보상 표시 ---------- */
function rewardChips(r) {
  const out = [];
  if (r.gp) out.push(`<span class="rw">${ICON.gp(18)}${fmt(r.gp)}</span>`);
  if (r.tickets) out.push(`<span class="rw">${ICON.ticket(16)}×${r.tickets}</span>`);
  if (r.skips) out.push(`<span class="rw">${ICON.skip(16)}×${r.skips}</span>`);
  if (r.rerolls) out.push(`<span class="rw">🎲 리롤권 ×${r.rerolls}</span>`);
  if (r.stones) out.push(`<span class="rw"><span class="rw-stone">💎</span>메가스톤${typeof r.stones === 'number' ? ` ×${r.stones}` : ''}</span>`);
  if (r.pass) out.push(`<span class="rw">${ICON.pass(16)}${r.pass}</span>`);
  if (r.mon) out.push(`<span class="rw">${esc(G.data.MONSTERS[r.mon].n)}</span>`);
  if (r.gpt) out.push(`<span class="rw">${ICON.gpt(18)}${fmt(r.gpt)}</span>`);
  return out.join('');
}
function gotItem(x) {
  if (x.k === 'gp') return `<div class="got-i">${ICON.gp(54)}<b>${fmt(x.n)} GP</b>${x.why ? `<small>${esc(x.why)}</small>` : ''}</div>`;
  if (x.k === 'ticket') return `<div class="got-i">${ICON.ticket(46)}<b>골목몬 입수권 ×${x.n}</b></div>`;
  if (x.k === 'reroll') return `<div class="got-i"><span class="got-dice">🎲</span><b>리롤권 ×${x.n}</b><small>스카우트 후보 다시 뽑기 1번</small></div>`;
  if (x.k === 'skip') return `<div class="got-i">${ICON.skip(46)}<b>1시간 스킵권 ×${x.n}</b></div>`;
  if (x.k === 'stone') return `<div class="got-i">${stoneSVG(x.id, 60)}<b>${esc(G.data.MONSTERS[x.id].n)} 메가스톤</b></div>`;
  if (x.k === 'gpt') return `<div class="got-i">${ICON.gpt(52)}<b>길P +${fmt(x.n)}</b></div>`;
  if (x.k === 'pass') return `<div class="got-i">${ICON.pass(50)}<b>패스 포인트 +${x.n}</b></div>`;
  if (x.k === 'mon') return `<div class="got-i got-mon${x.shiny ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[G.data.MONSTERS[x.id].types[0]].c}">${x.shiny ? SHINY_TAG : ''}${monArt(x.id, x.shiny)}<b>${esc(G.data.MONSTERS[x.id].n)}</b></div>`;
  return '';
}
function showGot(got, title = '받았어요!', then) {
  if (!got?.length) { then?.(); return; }
  const bg = openSheet(`<div class="got"><s aria-hidden="true"></s><h2>${esc(title)}</h2><div class="got-list">${got.map(gotItem).join('')}</div><button class="btn wide" data-x>좋아요!</button></div>`);
  bg.querySelector('[data-x]').onclick = () => { closeSheet(); then?.(); };
}
const walletHTML = (u = G.user) => `<div class="wallet"><span title="GP">${ICON.gp(20)}<b>${fmt(u.gp)}</b></span><span title="골목몬 입수권">${ICON.ticket(18)}<b>${fmt(u.tickets)}</b></span><span title="1시간 스킵권">${ICON.skip(18)}<b>${fmt(u.skips)}</b></span>${u.rerolls ? `<span title="리롤권 (스카우트 후보 다시 뽑기)">🎲<b>${fmt(u.rerolls)}</b></span>` : ''}<span class="wl-stone" title="내 메가스톤 보기" role="button" tabindex="0" data-gostones>💎<b>${u.stones.length}</b></span>${u.guild || u.gpt ? `<span title="길P (길드 포인트)">${ICON.gpt(18)}<b>${fmt(u.gpt || 0)}</b></span>` : ''}</div>`;
const topbar = (title, back = 'lobby') => `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>${title}</h1></div>${walletHTML()}`;
const setUser = (r) => { if (r?.user) G.user = r.user; };

/* ---------- 튜토리얼 ---------- */
const TUTORIAL = [
  { h: '골목대전에 온 걸 환영해요!', p: '골목 곳곳에 사는 <b>골목몬</b>을 모아 덱을 짜고, 친구나 골목대장과 붙는 게임이에요. 처음엔 골목몬이 하나도 없어요. 지금부터 모으는 방법을 알려 줄게요!', art: () => ['yeontan', 'deungsin', 'chijeu'].map((id) => `<span class="tu-mon">${monsterSVG(id)}</span>`).join('') },
  { h: '스카우트로 골목몬 모으기', p: '<b>20시간마다</b> 스카우트를 할 수 있어요. 후보 <b>8마리</b> 중 마음에 드는 1마리를 골라 <b>2500GP</b>나 <b>골목몬 입수권</b> 1장으로 데려와요. 같은 골목몬도 여러 마리 가질 수 있어요.', art: () => `${ICON.ticket(60)}${ICON.gp(64)}` },
  { h: '기다리기 싫다면 스킵권!', p: '남은 시간을 시간 단위로 올림한 만큼 <b>1시간 스킵권</b>을 쓰면 바로 스카우트할 수 있어요. 스킵권이 모자라면 1장당 <b>100GP</b>로 대신해요.', art: () => `${ICON.skip(64)}<b class="tu-x">→</b>${ICON.ticket(60)}` },
  { h: '메가진화에는 메가스톤', p: '이제 메가진화를 하려면 그 골목몬의 <b>메가스톤</b>이 있어야 해요. 골목몬마다 생김새가 다른 스톤이에요. 업적·퀘스트·시즌 패스에서 얻거나, GP로 살 수 있어요.', art: () => ['yeontan', 'kettle', 'tuhon', 'deungsin'].map((id) => stoneSVG(id, 62)).join('') },
  { h: '기술과 도구', p: '골목몬의 기술은 처음에 정해져 있어요. <b>500GP</b>를 내면 배울 수 있는 다른 기술로 바꿀 수 있어요. <b>도구는 전부 무료</b>고 몇 개든 쓸 수 있어요.', art: () => '<span class="tu-big">🧪🎒🧤</span>' },
  { h: '보상 받기', p: '매일 <b>출석</b>하고, <b>퀘스트</b>와 <b>업적</b>을 깨면 GP·입수권·스킵권·메가스톤을 줘요. 대전하면 <b>시즌 패스</b> 포인트가 쌓여요. 시즌은 2주마다 새로 시작해요!', art: () => `${ICON.pass(60)}${ICON.gp(56)}` },
];
async function showTutorial(step = 0) {
  G.screen = 'tutorial';
  app.className = '';
  if (step >= TUTORIAL.length) return showStarters();
  const t = TUTORIAL[step];
  app.innerHTML = `<section class="tu"><button class="btn small paper tu-skip" id="tu-skip">건너뛰기 ›</button>
    <div class="tu-dots">${TUTORIAL.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tu-art">${t.art()}</div><h2>${t.h}</h2><p>${t.p}</p>
    <div class="row tu-nav">${step ? '<button class="btn paper" id="tu-prev">이전</button>' : ''}<button class="btn" id="tu-next">${step === TUTORIAL.length - 1 ? '스타터 덱 고르러 가기' : '다음'}</button></div></section>`;
  app.querySelector('#tu-skip').onclick = () => showStarters();
  app.querySelector('#tu-next').onclick = () => showTutorial(step + 1);
  app.querySelector('#tu-prev')?.addEventListener('click', () => showTutorial(step - 1));
}
async function showStarters() {
  G.screen = 'starters';
  app.innerHTML = '<p class="wait">불러오는 중...</p>';
  let r;
  try { r = await api('GET', '/api/starters'); } catch (e) { toast(e.message); return; }
  const rw = r.reward;
  app.innerHTML = `<section class="panel tu-head"><h2>스타터 덱 고르기</h2><p>골목몬 6마리가 든 덱 8개 중 <b>1개를 무료</b>로 가져가요. 덱을 고르면 시작 선물도 함께 받아요.</p>
      <div class="tu-gift"><b>시작 선물</b>${rewardChips({ gp: rw.gp, tickets: rw.tickets, skips: rw.skips })}<span class="rw">💎 메가스톤 ${rw.stones}종 (무작위)</span></div></section>
    ${r.starters.map((s, i) => `<button class="starter" data-st="${i}"><h3>${esc(s.name)}</h3><p>${esc(s.d)}</p>
      <span class="mini big">${s.mons.map((id) => monsterSVG(id)).join('')}</span><small>${s.mons.map((id) => esc(G.data.MONSTERS[id].n)).join(' · ')}</small></button>`).join('')}`;
  app.querySelectorAll('[data-st]').forEach((b) => {
    b.onclick = () => {
      const s = r.starters[+b.dataset.st];
      const bg = openSheet(`<h2>${esc(s.name)}</h2><p class="muted">${esc(s.d)}</p>
        <div class="st-mons">${s.mons.map((id) => `<div style="--tc:${G.data.TYPES[G.data.MONSTERS[id].types[0]].c}">${monsterSVG(id)}<b>${esc(G.data.MONSTERS[id].n)}</b><span>${typesOf(id)}</span></div>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn paper" data-x>다시 고르기</button><button class="btn" data-ok>이 덱으로 시작!</button></div>`);
      bg.querySelector('[data-x]').onclick = closeSheet;
      bg.querySelector('[data-ok]').onclick = async (ev) => {
        ev.currentTarget.disabled = true;
        try {
          const res = await api('POST', '/api/tutorial', { starter: +b.dataset.st });
          setUser(res); closeSheet();
          showGot(res.got, '골목대전 시작 선물!', () => { toast('스카우트로 골목몬을 더 모아 보세요!'); showLobby(); });
        } catch (e) { toast(e.message); ev.currentTarget.disabled = false; }
      };
    };
  });
}

/* ---------- 스카우트 ---------- */
const ownCount = (id) => G.user.mons.filter((m) => m.species === id).length;
async function showScout() {
  G.screen = 'scout';
  app.className = '';
  app.innerHTML = `${topbar('스카우트')}<p class="wait">불러오는 중...</p>`;
  app.querySelector('#back').onclick = showLobby;
  let st;
  try { const r = await api('GET', '/api/scout'); st = r.scout; setUser(r); } catch (e) { toast(e.message); return; }
  clearInterval(G.scoutTimer);
  const render = () => {
    if (G.screen !== 'scout') return clearInterval(G.scoutTimer);
    const u = G.user;
    if (st.cands) {
      app.innerHTML = `${topbar('스카우트')}<section class="sc-head"><s aria-hidden="true"></s><h2>오늘의 후보 8마리</h2><p>1마리를 골라 <b>${ICON.gp(16)} 2500GP</b> 또는 <b>${ICON.ticket(14)} 입수권 1장</b>으로 데려와요.</p>
        ${G.user.rerolls > 0 ? `<button class="btn small sc-reroll" id="sc-reroll" data-pay="ticket">🎲 후보 다시 뽑기 <span>리롤권 1장 · ${fmt(G.user.rerolls)}장 보유</span></button>` : ''}
        <button class="btn small sc-reroll ${G.user.rerolls > 0 ? 'paper' : ''}" id="sc-reroll-gp" data-pay="gp" ${G.user.gp < (st.reroll || 500) ? 'disabled' : ''}>🎲 ${G.user.rerolls > 0 ? 'GP로' : '후보'} 다시 뽑기 <span>${ICON.gp(14)} ${fmt(st.reroll || 500)}</span></button></section>
        <div class="sc-grid">${st.cands.map((id, i) => { const sp = G.data.MONSTERS[id], n = ownCount(id); const tot = Object.values(sp.base).reduce((a, b) => a + b, 0);
          const sh = (st.shiny || []).includes(id); return `<button class="sc-card${sh ? ' is-shiny' : ''}" data-pick="${id}" style="--tc:${G.data.TYPES[sp.types[0]].c};--d:${i * 70}ms">${sh ? SHINY_TAG : n ? `<em class="sc-own">보유 ${n}</em>` : '<em class="sc-new">NEW</em>'}${monArt(id, sh)}<b>${esc(sp.n)}</b><span>${typesOf(id)}</span><small>능력치 합계 ${tot}</small></button>`; }).join('')}</div>`;
    } else {
      const left = Math.max(0, st.next - Date.now()), need = Math.ceil(left / 36e5);
      const have = Math.min(u.skips, need), gp = Math.max(0, need - u.skips) * 100;
      if (left <= 0) { showScout(); return; }
      app.innerHTML = `${topbar('스카우트')}<section class="panel sc-wait"><h2>다음 스카우트까지</h2><div class="sc-clock">${hhmmss(left)}</div>
        <p class="muted">20시간마다 무료로 후보 8마리가 나와요.</p>
        <button class="btn wide" id="sc-skip">${ICON.skip(18)} 바로 스카우트하기<small>스킵권 ${need}장 필요${gp ? ` · ${have}장 + ${fmt(gp)}GP` : ''}</small></button></section>`;
      app.querySelector('#sc-skip').onclick = async () => {
        if (!confirm(`스킵권 ${have}장${gp ? `과 ${fmt(gp)}GP` : ''}를 써서 바로 스카우트할까요?`)) return;
        try { const r = await api('POST', '/api/scout/skip'); setUser(r); st = r.scout; render(); } catch (e) { toast(e.message); }
      };
    }
    app.querySelector('#back').onclick = () => { clearInterval(G.scoutTimer); showLobby(); };
    app.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => pickSheet(b.dataset.pick); });
    app.querySelectorAll('#sc-reroll, #sc-reroll-gp').forEach((btn) => btn.addEventListener('click', async (e) => {
      const el = e.currentTarget; el.disabled = true;
      try { const r = await api('POST', '/api/scout/reroll', { pay: el.dataset.pay }); setUser(r); st = r.scout; toast(el.dataset.pay === 'ticket' ? '리롤권으로 후보를 새로 뽑았어요!' : '후보를 새로 뽑았어요!'); render(); }
      catch (err) { toast(err.message); el.disabled = false; }
    }));
  };
  const pickSheet = (id) => {
    const sp = G.data.MONSTERS[id], u = G.user;
    const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>${esc(sp.n)}</h2><button class="btn small paper" data-x>닫기</button></div>
      <div class="row" style="align-items:flex-start;margin-bottom:10px"><div class="detail-pic${(st.shiny || []).includes(id) ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${(st.shiny || []).includes(id) ? SHINY_TAG : ''}${monArt(id, (st.shiny || []).includes(id))}</div>
        <div style="flex:1;min-width:0"><p style="margin-bottom:4px">${typesOf(id)}</p>${Object.entries(sp.base).map(([k, v]) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${v}</span><i style="width:${Math.min(100, v / 1.3)}%"></i></div>`).join('')}</div></div>
      <p class="muted" style="margin-bottom:8px">${sp.flavor}</p>${sp.trait ? `<p class="trait"><b>특성 ${sp.trait.n}</b> ${sp.trait.d}</p>` : ''}
      <p class="muted">처음 기술: ${(window.defaultMoves?.(id) || []).map((m) => G.data.MOVES[m].n).join(', ')}</p>
      <div class="sc-pay"><button class="btn" data-pay="ticket" ${u.tickets ? '' : 'disabled'}>${ICON.ticket(20)} 입수권 1장<small>보유 ${u.tickets}장</small></button>
        <button class="btn mint" data-pay="gp" ${u.gp >= 2500 ? '' : 'disabled'}>${ICON.gp(20)} 2500GP<small>보유 ${fmt(u.gp)}GP</small></button></div>`);
    bg.querySelector('[data-x]').onclick = closeSheet;
    bg.querySelectorAll('[data-pay]').forEach((b) => {
      b.onclick = async () => {
        b.disabled = true;
        try {
          const r = await api('POST', '/api/scout/pick', { species: id, pay: b.dataset.pay });
          setUser(r); st = r.scout; closeSheet(); const w = app.querySelector('.wallet'); if (w) w.outerHTML = walletHTML();
          showGot([{ k: 'mon', id }], `${sp.n} 스카우트 성공!`, render);
        } catch (e) { toast(e.message); b.disabled = false; }
      };
    });
  };
  render();
  G.scoutTimer = setInterval(() => { if (G.screen !== 'scout') return clearInterval(G.scoutTimer); const c = app.querySelector('.sc-clock'); if (c) { const left = st.next - Date.now(); if (left <= 0) showScout(); else c.textContent = hhmmss(left); } }, 1000);
}
// 서버와 같은 규칙의 처음 기술(미리보기용)
window.defaultMoves = (id) => {
  const sp = G.data.MONSTERS[id], M = G.data.MOVES;
  const worth = (m) => { const v = M[m], st = v.cat === 'p' ? sp.base.atk : sp.base.spa, hits = v.hits ? (v.hits[0] + v.hits[1]) / 2 : 1; return v.pow * hits * ((v.acc ?? 100) / 100) * st * (sp.types.includes(v.type) ? 1.5 : 1); };
  const attacks = sp.moves.filter((m) => M[m].cat !== 'x').sort((a, b) => worth(b) - worth(a));
  const chosen = [];
  for (const m of [...(M[sp.sig]?.cat !== 'x' ? [sp.sig] : []), ...attacks]) { if (chosen.length >= 3) break; if (!chosen.includes(m) && !chosen.some((c) => M[c].type === M[m].type)) chosen.push(m); }
  const rank = (id2) => { const m = M[id2]; return m.sig ? 6 : m.self ? 5 : m.heal ? 4 : m.st ? 3 : m.seed || m.hazard ? 2 : m.weather ? 1 : 0; };
  const extras = sp.moves.filter((m) => M[m].cat === 'x' && !M[m].protect).sort((a, b) => rank(b) - rank(a));
  return [...chosen, ...extras, ...attacks.filter((m) => !chosen.includes(m))].slice(0, 4);
};

/* ---------- 내 골목몬 ---------- */
function showBox() {
  G.screen = 'box';
  app.className = '';
  const order = Object.keys(G.data.MONSTERS);
  const mons = [...G.user.mons].sort((a, b) => order.indexOf(a.species) - order.indexOf(b.species) || a.at - b.at);
  const uniq = new Set(mons.map((m) => m.species)).size;
  app.innerHTML = `${topbar('내 골목몬')}<p class="box-sum">${mons.length}마리 · ${uniq}종 / ${order.filter((id) => !(G.data.BANNED || []).includes(id)).length}종</p>
    <div class="box-grid">${mons.map((m) => { const sp = G.data.MONSTERS[m.species]; return `<button class="box-card${m.shiny ? ' is-shiny' : ''}" data-uid="${m.uid}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${m.shiny ? '<em class="shiny-dot" title="이로치">✨</em>' : ''}${m.plus ? `<em class="plus-dot">+${m.plus}</em>` : ''}${monArt(m.species, m.shiny)}<b>${esc(sp.n)}</b>${G.user.stones.includes(m.species) ? `<span class="box-stone">${stoneSVG(m.species, 26)}</span>` : ''}</button>`; }).join('') || '<p class="wait">아직 골목몬이 없어요. 스카우트로 모아 보세요!</p>'}</div>`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelectorAll('[data-uid]').forEach((b) => { b.onclick = () => openMon(b.dataset.uid, showBox); });
}
// 골목몬 한 마리: 기술 바꾸기(500GP), 메가스톤 사기(상점 가격)
// 강화 칸: 같은 골목몬(덱·원정·교환에 안 걸린 것)을 먹여 +1
// 강화 고유 효과 한 줄: 단계마다 얼마, 지금 합계
function perkLine(species, n) {
  const p = G.data.PERKS?.[species];
  if (!p) return '';
  const now = p.d.replace(/([+-]?)(\d+(?:\.\d+)?)/, (_, sg, num) => sg + +(num * n).toFixed(2)); // 설명 속 숫자 × 단계
  return `<p class="perk"><b>✦ 고유 효과</b> 단계마다 ${esc(p.d)}${n ? ` <em>지금 +${n}: ${esc(now)}</em>` : ''}</p>`;
}
function enhanceBox(m) {
  const n = m.plus || 0, sp = G.data.MONSTERS[m.species];
  const deckUids = new Set((G.user.decks[G.user.active]?.team || []).map((t) => t.uid));
  const food = G.user.mons.filter((x) => x.uid !== m.uid && x.species === m.species);
  return `<section class="enh"><h3 class="dex-h">강화 <b class="plus-tag">${n ? `+${n}` : '+0'}</b> <small class="muted">+1마다 모든 능력치 4% (최대 +5)</small></h3>
    <div class="enh-bar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>
    ${perkLine(m.species, n)}
    ${n >= 5 ? '<p class="muted">최대로 강화했어요! 🔥</p>' : food.length ? `<p class="muted" style="font-size:13px">같은 ${esc(sp.n)}을(를) 먹이면 +1. 비용 ${ICON.gp(14)} ${fmt((n + 1) * 1000)}GP</p>
      <div class="enh-food">${food.map((f) => `<button class="tr-pick" data-food="${f.uid}"><div class="tr-mon${f.shiny ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${f.plus ? `<em class="plus-dot">+${f.plus}</em>` : ''}${f.shiny ? '<em class="shiny-dot">✨</em>' : ''}${monArt(f.species, f.shiny)}<b>${deckUids.has(f.uid) ? '덱에 있음' : '먹이기'}</b></div></button>`).join('')}</div>`
      : `<p class="muted" style="font-size:13px">같은 골목몬이 한 마리 더 있으면 먹여서 강화할 수 있어요. 스카우트나 교환으로 모아 보세요!</p>`}
  </section>`;
}

function openMon(uid, after) {
  const m = G.user.mons.find((x) => x.uid === uid);
  if (!m) return;
  const sp = G.data.MONSTERS[m.species], stone = G.user.stones.includes(m.species);
  const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>${esc(sp.n)}</h2><button class="btn small paper" data-x>닫기</button></div>
    <div class="row" style="align-items:flex-start;margin-bottom:10px"><div class="detail-pic${m.shiny ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${m.shiny ? SHINY_TAG : ''}${monArt(m.species, m.shiny)}</div>
      <div style="flex:1;min-width:0"><p style="margin-bottom:4px">${typesOf(m.species)}</p>${Object.entries(sp.base).map(([k, v]) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${v}</span><i style="width:${Math.min(100, v / 1.3)}%"></i></div>`).join('')}</div></div>
    ${sp.trait ? `<p class="trait"><b>특성 ${sp.trait.n}</b> ${sp.trait.d}</p>` : ''}
    ${m.shiny ? `<section class="shiny-forms"><h3 class="dex-h">✨ 이로치 변신 모습</h3><div><figure class="is-shiny">${monArt(m.species, true, '', true)}<figcaption>메가진화 · ${esc(sp.mega.n)}</figcaption></figure>${typeof GMAX_ART !== 'undefined' && GMAX_ART[m.species] ? `<figure class="is-shiny">${shinify(gmaxSVG(m.species), m.species)}<figcaption>거다이맥스</figcaption></figure>` : ''}</div></section>` : ''}
    ${enhanceBox(m)}
    <section class="mon-stone ${stone ? 'have' : ''}">${stoneSVG(m.species, 64, { lock: !stone })}<div><b>${esc(sp.n)} 메가스톤</b><p>${stone ? `있어요! 대전에서 <b>${esc(sp.mega.n)}</b>(으)로 메가진화할 수 있어요.` : '없으면 이 골목몬은 메가진화를 못 해요.'}</p>
      ${stone ? '' : `<button class="btn small" data-stone>${ICON.gp(16)} ${fmt(STONE_PRICE)}GP로 사기</button>`}</div></section>
    <h3 class="dex-h">기술 <small class="muted">하나 바꿀 때마다 500GP</small></h3>
    ${[0, 1, 2, 3].map((i) => { const id = m.moves[i]; return id ? `<div class="mv mvrow">${typeChip(G.data.MOVES[id].type)}<b>${G.data.MOVES[id].n}</b>${sigTag(id)}<small>${moveLine(id)}</small><button class="btn small paper" data-slot="${i}">바꾸기</button></div>` : `<div class="mv mvrow"><b class="muted">빈 칸</b><button class="btn small paper" data-slot="${i}">기술 넣기</button></div>`; }).join('')}`);
  bg.querySelector('[data-x]').onclick = () => { closeSheet(); after?.(); };
  bg.querySelectorAll('[data-food]').forEach((b) => { b.onclick = async () => {
    const f = G.user.mons.find((x) => x.uid === b.dataset.food);
    if (!confirm(`${sp.n}${f?.plus ? ` +${f.plus}` : ''}${f?.shiny ? ' (이로치)' : ''}을(를) 먹여서 강화할까요? 먹인 골목몬은 사라져요.`)) return;
    try { const r = await api('POST', '/api/mon/enhance', { uid, food: b.dataset.food }); setUser(r); toast(`✨ ${sp.n} +${r.plus} 강화 성공!${r.shinyMoved ? ' 이로치가 옮겨 붙었어요!' : ''}`); openMon(uid, after); } catch (e) { toast(e.message); }
  }; });
  bg.querySelector('[data-stone]')?.addEventListener('click', async () => {
    buyStoneSheet(m.species, () => openMon(uid, after));
  });
  bg.querySelectorAll('[data-slot]').forEach((b) => {
    b.onclick = () => {
      const slot = +b.dataset.slot;
      const opts = sp.moves.filter((id) => !m.moves.includes(id));
      const bg2 = openSheet(`<div class="row" style="margin-bottom:8px"><h2>어떤 기술로 바꿀까요?</h2><button class="btn small paper" data-x>취소</button></div>
        <p class="muted" style="margin-bottom:8px">${m.moves[slot] ? `<b>${G.data.MOVES[m.moves[slot]].n}</b> 대신 배울 기술을 고르세요.` : '새로 배울 기술을 고르세요.'} ${ICON.gp(14)} 500GP (보유 ${fmt(G.user.gp)})</p>
        ${opts.map((id) => `<button class="mv" data-mv="${id}">${typeChip(G.data.MOVES[id].type)}<b>${G.data.MOVES[id].n}</b>${sigTag(id)}<small>${moveLine(id)}</small></button>`).join('')}`);
      bg2.querySelector('[data-x]').onclick = () => openMon(uid, after);
      bg2.querySelectorAll('[data-mv]').forEach((x) => {
        x.onclick = async () => {
          try { const r = await api('POST', '/api/mon/move', { uid, slot, move: x.dataset.mv }); setUser(r); toast(`${G.data.MOVES[x.dataset.mv].n}(으)로 바꿨어요! -500GP`); openMon(uid, after); } catch (e) { toast(e.message); }
        };
      });
    };
  });
}

/* ---------- 보상: 출석, 퀘스트, 업적 ---------- */
async function showRewards(tab = 'attend') {
  G.screen = 'rewards';
  app.className = '';
  app.innerHTML = `${topbar('보상')}<p class="wait">불러오는 중...</p>`;
  app.querySelector('#back').onclick = showLobby;
  let v;
  try { v = await api('GET', '/api/rewards'); } catch (e) { toast(e.message); return; }
  const claim = async (url, body) => { try { const r = await api('POST', url, body); setUser(r); v = r; showGot(r.got, '보상을 받았어요!', render); } catch (e) { toast(e.message); } };
  const bar = (p, g) => `<div class="qbar"><i style="width:${Math.min(100, (p / g) * 100)}%"></i><span>${fmt(p)} / ${fmt(g)}</span></div>`;
  const quest = (q, url) => `<div class="quest ${q.done ? 'done' : ''}"><div><b>${esc(q.n)}</b><div class="rws">${rewardChips(q.r)}</div>${bar(q.prog, q.goal)}</div>
    <button class="btn small ${q.prog >= q.goal && !q.done ? '' : 'paper'}" data-claim="${q.id}" data-url="${url}" ${q.done || q.prog < q.goal ? 'disabled' : ''}>${q.done ? '받음' : q.prog >= q.goal ? '받기' : '진행 중'}</button></div>`;
  const render = () => {
    if (G.screen !== 'rewards') return;
    const b = v.badges || {};
    let body = '';
    if (tab === 'attend') {
      const a = v.attend;
      body = `<section class="panel"><h2>출석 보상</h2><p class="muted">매일 들어오면 7일 동안 보상이 커져요. 하루라도 빠지면 1일차부터 다시!</p>
        <div class="att">${a.list.map((r, i) => `<div class="att-d ${i < (a.can ? a.day : a.day + 1) ? 'got' : ''} ${i === a.day && a.can ? 'today' : ''}"><small>${i + 1}일차</small><div class="rws">${rewardChips(r)}</div>${i < (a.can ? a.day : a.day + 1) ? '<em>✓</em>' : ''}</div>`).join('')}</div>
        <button class="btn wide" id="att" ${a.can ? '' : 'disabled'}>${a.can ? `오늘(${a.day + 1}일차) 보상 받기` : '오늘은 받았어요. 내일 또 와요!'}</button></section>`;
    } else if (tab === 'quest') {
      const q = v.quests, left = (t) => { const h = Math.max(0, Math.ceil((t - Date.now()) / 36e5)); return h > 24 ? `${Math.ceil(h / 24)}일` : `${h}시간`; };
      body = `<section class="panel"><h2>일일 퀘스트 <small class="muted">${left(q.dayEnds)} 뒤 초기화</small></h2>${q.daily.map((x) => quest(x, '/api/quest/claim')).join('')}</section>
        <section class="panel"><h2>주간 퀘스트 <small class="muted">${left(q.weekEnds)} 뒤 초기화</small></h2>${q.weekly.map((x) => quest(x, '/api/quest/claim')).join('')}</section>`;
    } else {
      body = `<section class="panel"><h2>업적</h2>${[...v.ach].sort((x, y) => (x.done - y.done) || ((y.prog >= y.goal) - (x.prog >= x.goal))).map((x) => quest(x, '/api/ach/claim')).join('')}</section>`;
    }
    app.innerHTML = `${topbar('보상')}<div class="tabs rtabs">${[['attend', '출석', b.attend], ['quest', '퀘스트', b.quest], ['ach', '업적', b.ach]].map(([k, n, c]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}${c ? `<em class="mailbadge">${c}</em>` : ''}</button>`).join('')}</div>${body}
      <button class="btn wide passbtn" id="to-pass">${ICON.pass(22)} 시즌 패스 보러 가기${b.pass ? `<em class="mailbadge">${b.pass}</em>` : ''}</button>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelector('#to-pass').onclick = () => showPass();
    app.querySelectorAll('[data-tab]').forEach((x) => { x.onclick = () => { tab = x.dataset.tab; render(); }; });
    app.querySelector('#att')?.addEventListener('click', () => claim('/api/attend'));
    app.querySelectorAll('[data-claim]').forEach((x) => { x.onclick = () => claim(x.dataset.url, { id: x.dataset.claim }); });
  };
  render();
}

/* ---------- 시즌 패스 ---------- */
async function showPass() {
  G.screen = 'pass';
  app.className = '';
  app.innerHTML = `${topbar('시즌 패스')}<p class="wait">불러오는 중...</p>`;
  app.querySelector('#back').onclick = showLobby;
  let v;
  try { v = await api('GET', '/api/rewards'); } catch (e) { toast(e.message); return; }
  const render = (keepScroll) => {
    if (G.screen !== 'pass') return;
    const p = v.pass, days = Math.max(0, Math.ceil((p.ends - Date.now()) / 864e5));
    const into = p.pts - p.lv * p.per;
    const y = keepScroll ? app.querySelector('.ps-track')?.scrollLeft : null;
    app.innerHTML = `${topbar('시즌 패스')}
      <section class="ps-head ${p.premium ? 'prem' : ''}"><s aria-hidden="true"></s><small>SEASON ${p.season}</small><h2>골목대전 시즌 ${p.season}</h2><p>${days}일 뒤 끝나요 · 2주마다 새 시즌</p>
        <div class="ps-lv"><b>Lv.${p.lv}</b><div class="qbar"><i style="width:${p.lv >= p.max ? 100 : (into / p.per) * 100}%"></i><span>${p.lv >= p.max ? 'MAX' : `${into} / ${p.per}`}</span></div><b>${p.max}</b></div>
        <p class="ps-how">대전을 하면 패스 포인트가 쌓여요. 친구와 대전 승리 60 · 패배 30, 태그전 50/25, 연습전 30/15 (연습전은 하루 600점까지)</p>
        ${p.premium ? '<em class="ps-badge">👑 프리미엄 패스 보유</em>' : '<em class="ps-badge off">프리미엄 패스는 운영팀에게 잘 보이면 받을 수 있어요 😉</em>'}</section>
      <div class="ps-track">${p.levels.map((l) => { const open = l.lv <= p.lv;
        const cell = (track, r, got, lock) => `<div class="ps-cell ${track} ${got ? 'got' : ''} ${open && !got && !lock ? 'ready' : ''}">${track === 'prem' ? '<i class="ps-crown">👑</i>' : ''}<div class="rws">${rewardChips(r)}</div>
          ${got ? '<em>✓ 받음</em>' : open && !lock ? `<button class="btn small" data-lv="${l.lv}" data-track="${track}">받기</button>` : `<em>${lock && open ? '🔒 프리미엄' : `Lv.${l.lv}`}</em>`}</div>`;
        return `<div class="ps-col ${open ? 'open' : ''}"><b class="ps-n">${l.lv}</b>${cell('free', l.free, l.freeGot, false)}${cell('prem', l.prem, l.premGot, !p.premium)}</div>`; }).join('')}</div>
      <button class="btn wide" id="ps-all">받을 수 있는 보상 모두 받기</button>`;
    app.querySelector('#back').onclick = showLobby;
    const tr = app.querySelector('.ps-track');
    if (y != null) tr.scrollLeft = y; else tr.scrollLeft = Math.max(0, (p.lv - 2) * 104);
    const claimOne = async (lv, track) => { const r = await api('POST', '/api/pass/claim', { lv, track }); setUser(r); v = r; return r.got; };
    app.querySelectorAll('[data-lv]').forEach((b) => { b.onclick = async () => { try { const got = await claimOne(+b.dataset.lv, b.dataset.track); showGot(got, `Lv.${b.dataset.lv} 보상!`, () => render(true)); } catch (e) { toast(e.message); } }; });
    app.querySelector('#ps-all').onclick = async () => {
      const todo = v.pass.levels.filter((l) => l.lv <= v.pass.lv).flatMap((l) => [...(!l.freeGot ? [[l.lv, 'free']] : []), ...(v.pass.premium && !l.premGot ? [[l.lv, 'prem']] : [])]);
      if (!todo.length) return toast('지금 받을 보상이 없어요.');
      const all = [];
      try { for (const [lv, t] of todo) all.push(...await claimOne(lv, t)); } catch (e) { toast(e.message); }
      showGot(all, '패스 보상을 모두 받았어요!', () => render(true));
    };
  };
  render();
}

/* ---------- 설문조사 ---------- */
const SURVEY_FUN = ['대전', '골목몬 디자인', '꾸미기', '스카우트', '이벤트', '훈련장', '태그전', '도감'];
const SURVEY_WANT = ['랭킹전', '골목몬 교환', '길드·친구', '스토리 모드', '새 골목몬', '미니게임', '채팅', '레이드(협동 보스전)'];
async function showSurvey() {
  G.screen = 'survey';
  app.className = '';
  app.innerHTML = `${topbar('설문조사')}<p class="wait">불러오는 중...</p>`;
  app.querySelector('#back').onclick = () => showEvents();
  let v;
  try { v = await api('GET', '/api/survey'); } catch (e) { toast(e.message); return; }
  const m = v.mine || { rate: 0, fun: [], want: [], wantEtc: '', bad: '', say: '' };
  const chips = (name, list, on) => `<div class="sv-chips">${list.map((x) => `<button type="button" data-${name}="${esc(x)}" aria-pressed="${on.includes(x)}">${esc(x)}</button>`).join('')}</div>`;
  const results = v.all ? `<section class="panel sv-res"><h2>설문 결과 <small class="muted">개발자에게만 보여요 · ${v.all.length}명</small></h2>
    ${v.all.length ? `<p>평균 만족도 <b>${(v.all.reduce((a, x) => a + x.rate, 0) / v.all.length).toFixed(1)}</b> / 5 ${'★'.repeat(Math.round(v.all.reduce((a, x) => a + x.rate, 0) / v.all.length))}</p>
      <h3>재미있는 것</h3>${SURVEY_FUN.map((x) => { const n = v.all.filter((a) => a.fun.includes(x)).length; return n ? `<div class="sv-bar"><span>${esc(x)}</span><i style="width:${(n / v.all.length) * 100}%"></i><b>${n}</b></div>` : ''; }).join('')}
      <h3>원하는 시스템</h3>${SURVEY_WANT.map((x) => { const n = v.all.filter((a) => a.want.includes(x)).length; return n ? `<div class="sv-bar"><span>${esc(x)}</span><i style="width:${(n / v.all.length) * 100}%"></i><b>${n}</b></div>` : ''; }).join('')}
      <h3>하나하나 보기</h3>${v.all.map((a) => `<div class="sv-one"><b>${esc(a.user)}</b> ${'★'.repeat(a.rate)}${'☆'.repeat(5 - a.rate)}${a.wantEtc ? `<p>원하는 것: ${esc(a.wantEtc)}</p>` : ''}${a.bad ? `<p>아쉬운 점: ${esc(a.bad)}</p>` : ''}${a.say ? `<p>한마디: ${esc(a.say)}</p>` : ''}</div>`).join('')}` : '<p class="muted">아직 답한 사람이 없어요.</p>'}</section>` : '';
  app.innerHTML = `${topbar('설문조사')}<section class="panel sv">
      <p class="muted">${v.mine ? '이미 답했어요. 고쳐서 다시 보내도 돼요.' : '처음 답하면 <b>1,000GP</b>를 드려요! 솔직하게 알려 주세요.'}</p>
      <h3>1. 지금 골목대전, 얼마나 만족하나요?</h3><div class="sv-stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rate="${n}" aria-pressed="${n <= m.rate}">★</button>`).join('')}</div>
      <h3>2. 가장 재미있는 건 뭐예요? <small>여러 개 골라도 돼요</small></h3>${chips('fun', SURVEY_FUN, m.fun)}
      <h3>3. 앞으로 생겼으면 하는 시스템은? <small>여러 개</small></h3>${chips('want', SURVEY_WANT, m.want)}
      <input id="sv-etc" maxlength="200" placeholder="그 밖에 원하는 시스템" value="${esc(m.wantEtc)}">
      <h3>4. 아쉽거나 불편한 점</h3><textarea id="sv-bad" rows="3" maxlength="500" placeholder="예: 어떤 골목몬이 너무 세요">${esc(m.bad)}</textarea>
      <h3>5. 개발자에게 한마디</h3><textarea id="sv-say" rows="3" maxlength="500">${esc(m.say)}</textarea>
      <button class="btn wide" id="sv-send">${v.mine ? '다시 보내기' : '보내고 1,000GP 받기'}</button></section>${results}`;
  app.querySelector('#back').onclick = () => showEvents();
  let rate = m.rate;
  app.querySelectorAll('[data-rate]').forEach((b) => { b.onclick = () => { rate = +b.dataset.rate; app.querySelectorAll('[data-rate]').forEach((x) => x.setAttribute('aria-pressed', +x.dataset.rate <= rate)); }; });
  app.querySelectorAll('[data-fun],[data-want]').forEach((b) => { b.onclick = () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') !== 'true'); });
  app.querySelector('#sv-send').onclick = async () => {
    if (!rate) return toast('1번 만족도를 골라 주세요.');
    const sel = (k) => [...app.querySelectorAll(`[data-${k}][aria-pressed=true]`)].map((x) => x.dataset[k]);
    try {
      const r = await api('POST', '/api/survey', { rate, fun: sel('fun'), want: sel('want'), wantEtc: app.querySelector('#sv-etc').value, bad: app.querySelector('#sv-bad').value, say: app.querySelector('#sv-say').value });
      setUser(r);
      if (r.got?.length) showGot(r.got, '설문 고마워요!', showSurvey); else { toast('고쳐서 보냈어요. 고마워요!'); showSurvey(); }
    } catch (e) { toast(e.message); }
  };
}

/* ---------- 미니게임: 개복치 키우기 ---------- */
// 해파리·새우를 먹고 쑥쑥 크기. 비닐봉지·플라스틱을 먹으면 목숨이 줄어요(3개). 300cm가 되면 성공!
function showSunfish() {
  G.screen = 'sunfish';
  app.className = '';
  app.innerHTML = `${topbar('개복치 키우기')}<section class="panel sf">
    <p class="muted">손가락(마우스)으로 개복치를 움직여 <b>해파리🪼·새우🦐</b>를 먹여요. <b>비닐봉지·플라스틱</b>은 피하세요! 3번 먹으면 돌연사... <b>300cm</b>까지 키우면 성공!</p>
    <p class="sf-prize">${G.user.sunfish ? '🎉 이미 성공해서 <b>등신</b>을 받았어요. 그래도 또 해 볼 수 있어요!' : '🎁 처음 성공하면 골목몬 <b>등신</b>을 무료로 드려요!'}</p>
    <div class="sf-wrap"><canvas id="sf" width="360" height="480" aria-label="개복치 키우기 게임 화면"></canvas><div class="sf-over" id="sf-over"><h2>개복치 키우기</h2><p>지금 크기 30cm</p><button class="btn" id="sf-go">시작!</button></div></div></section>`;
  app.querySelector('#back').onclick = () => { G.screen = ''; showEvents(); };
  const cv = app.querySelector('#sf'), ctx = cv.getContext('2d'), W = 360, H = 480, over = app.querySelector('#sf-over');
  let st = null;
  const fish = (x, y, r, t, dead) => {
    ctx.save(); ctx.translate(x, y); if (dead) ctx.scale(1, -1);
    ctx.rotate(Math.sin(t / 300) * .08);
    ctx.lineWidth = 2.5; ctx.strokeStyle = '#1a1433';
    ctx.fillStyle = dead ? '#9a9aa6' : '#8aa0b8';
    ctx.beginPath(); ctx.moveTo(-r * .1, -r * .8); ctx.lineTo(-r * .35, -r * 1.7); ctx.lineTo(r * .3, -r * .75); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .1, r * .8); ctx.lineTo(-r * .35, r * 1.7); ctx.lineTo(r * .3, r * .75); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dead ? '#b6b6c0' : '#a9bccf'; ctx.beginPath(); ctx.ellipse(-r * .95, 0, r * .25, r * .6, 0, 0, 7); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, dead ? '#ddd' : '#cfdbe8'); g.addColorStop(1, dead ? '#888' : '#6f86a2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r, r * .85, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r * .5, -r * .2, r * .22, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1433'; ctx.beginPath(); if (dead) { ctx.font = `${r * .4}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('x', r * .5, -r * .08); } else { ctx.arc(r * .45, -r * .28, r * .08, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(r * .9, r * .15, r * .07, r * .1, 0, 0, 7); ctx.fill();
    ctx.restore();
  };
  const KINDS = [
    { e: '🪼', grow: 10, good: true, w: 5 }, { e: '🦐', grow: 6, good: true, w: 4 },
    { e: '🛍️', bad: '비닐봉지를 먹었다!', w: 2 }, { e: '🥤', bad: '플라스틱 컵을 먹었다!', w: 1.4 },
  ];
  const pickKind = () => { const tot = KINDS.reduce((a, k) => a + k.w, 0); let r = Math.random() * tot; for (const k of KINDS) { if ((r -= k.w) < 0) return k; } return KINDS[0]; };
  const loop = (t) => {
    if (G.screen !== 'sunfish' || !st) return;
    const dt = Math.min(40, t - (st.last || t)); st.last = t; st.time += dt;
    // 배경: 바닷속
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#3fd0ff'); bg.addColorStop(1, '#0b3a8a'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = .25; ctx.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { const x = (i * 71 + st.time * .02) % W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x - 40, H); ctx.lineTo(x - 70, H); ctx.fill(); } ctx.globalAlpha = 1;
    // 떨어지는 것들 (크면 조금씩 빨라짐, 그래도 느긋하게)
    const speed = .07 + st.size / 4000;
    st.spawn -= dt;
    if (st.spawn <= 0) { st.items.push({ k: pickKind(), x: 20 + Math.random() * (W - 40), y: -20, wob: Math.random() * 6 }); st.spawn = 520 - Math.min(220, st.size); }
    const r = 16 + Math.min(40, st.size / 9);
    st.fx += (st.tx - st.fx) * Math.min(1, dt / 90); st.fy += (st.ty - st.fy) * Math.min(1, dt / 90);
    ctx.font = '28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of st.items) {
      it.y += speed * dt; const x = it.x + Math.sin(it.y / 30 + it.wob) * 10;
      ctx.fillText(it.k.e, x, it.y);
      if (!it.gone && Math.hypot(x - st.fx, it.y - st.fy) < r + 14) {
        it.gone = true;
        if (it.k.good) { st.size += it.k.grow; st.pops.push({ x, y: it.y, s: `+${it.k.grow}cm`, c: '#fff6a8', t: 0 }); }
        else { st.lives--; st.hurt = 500; st.pops.push({ x, y: it.y, s: it.k.bad, c: '#ff4d6d', t: 0 }); }
      }
    }
    st.items = st.items.filter((it) => !it.gone && it.y < H + 30);
    fish(st.fx, st.fy, r, t, st.lives <= 0);
    if (st.hurt > 0) { st.hurt -= dt; ctx.fillStyle = `rgba(255,40,60,${st.hurt / 1500})`; ctx.fillRect(0, 0, W, H); }
    ctx.font = "bold 15px 'Black Han Sans', sans-serif";
    for (const p of st.pops) { p.t += dt; ctx.globalAlpha = Math.max(0, 1 - p.t / 900); ctx.fillStyle = p.c; ctx.strokeStyle = '#1a1433'; ctx.lineWidth = 4; ctx.strokeText(p.s, p.x, p.y - p.t / 20); ctx.fillText(p.s, p.x, p.y - p.t / 20); }
    ctx.globalAlpha = 1; st.pops = st.pops.filter((p) => p.t < 900);
    // 위쪽 표시
    ctx.fillStyle = 'rgba(26,20,51,.7)'; ctx.fillRect(0, 0, W, 40);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.font = "18px 'Black Han Sans', sans-serif"; ctx.fillText(`${st.size}cm / 300cm`, 10, 21);
    ctx.textAlign = 'right'; ctx.fillText('❤️'.repeat(Math.max(0, st.lives)) + '🖤'.repeat(3 - Math.max(0, st.lives)), W - 8, 21);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(10, 34, (W - 20) * Math.min(1, st.size / 300), 4);
    if (st.lives <= 0) return end(false);
    if (st.size >= 300) return end(true);
    requestAnimationFrame(loop);
  };
  const end = async (win) => {
    const size = st.size; st = null;
    over.style.display = '';
    if (!win) { over.innerHTML = `<h2 class="sf-dead">wasted!!</h2><p>개복치가 ${size}cm에서 돌연사했어요...</p><button class="btn" id="sf-go">다시 키우기</button>`; app.querySelector('#sf-go').onclick = start; return; }
    over.innerHTML = `<h2>🎉 300cm 달성!</h2><p>개복치가 바다의 왕만큼 컸어요!</p><p class="wait">기록 확인 중...</p>`;
    try {
      const r = await api('POST', '/api/sunfish/clear', { size });
      setUser(r);
      over.innerHTML = `<h2>🎉 ${size}cm 달성!</h2><p>${r.again ? '이번에도 성공! (등신은 처음 한 번만 줘요)' : '골목몬 등신을 받았어요!'}</p><button class="btn" id="sf-go">한 번 더</button>`;
      app.querySelector('#sf-go').onclick = start;
      if (r.got?.length) showGot(r.got, '개복치 키우기 성공!');
    } catch (e) { over.innerHTML = `<h2>앗</h2><p>${esc(e.message)}</p><button class="btn" id="sf-go">다시 하기</button>`; app.querySelector('#sf-go').onclick = start; }
  };
  const start = async () => {
    try { await api('POST', '/api/sunfish/start'); } catch (e) { return toast(e.message); }
    over.style.display = 'none';
    st = { size: 30, lives: 3, items: [], pops: [], spawn: 300, time: 0, fx: W / 2, fy: H - 90, tx: W / 2, ty: H - 90, hurt: 0, last: 0 };
    requestAnimationFrame(loop);
  };
  const aim = (e) => { if (!st) return; const rc = cv.getBoundingClientRect(); st.tx = ((e.clientX - rc.left) / rc.width) * W; st.ty = Math.max(60, ((e.clientY - rc.top) / rc.height) * H); };
  cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); aim(e); });
  cv.addEventListener('pointermove', aim);
  app.querySelector('#sf-go').onclick = start;
}

/* ---------- 이로치: 색이 다른 희귀한 골목몬 ---------- */
// 골목몬마다 정해진 색 바꿈 각도 (항상 같은 이로치 색)
const shinyHue = (id) => { let h = 7; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 9973; return 100 + (h % 160); };
// 모습이 바뀌는 골목몬은 모습마다 이로치 색이 따로 (단조: 재질마다 다른 금속 빛)
const SHINY_FORM = {
  // 까모는 검은 까마귀라 색만 돌리면 그대로라서, 이로치는 황금 까마귀 / 메가는 서리빛 대왕
  kkamo: { base: 'sepia(1) saturate(3.2) hue-rotate(2deg) brightness(1.3) contrast(1.15)', mega: 'sepia(1) saturate(2.5) hue-rotate(170deg) brightness(1.35)' },
  // 선생님: 분필 초록빛 선생님 / 1타강사는 보랏빛 스타 강사
  seonsaeng: { base: 'hue-rotate(120deg) saturate(1.8) brightness(1.05)', mega: 'hue-rotate(250deg) saturate(1.8) brightness(1.05)' },
  danjo: {
    base: 'sepia(.7) hue-rotate(55deg) saturate(1.8) brightness(1.05)', // 나무 → 이끼 낀 초록 나무
    t1: 'sepia(1) saturate(4.5) hue-rotate(8deg) brightness(1.2)', // 철 → 노란 철
    t2: 'hue-rotate(295deg) saturate(1.5) brightness(1.05)', // 금 → 장밋빛 금
    t3: 'sepia(.6) hue-rotate(215deg) saturate(3.5) brightness(1.05)', // 다이아 → 보랏빛 자수정
    t4: 'hue-rotate(85deg) saturate(1.8) brightness(1.1)', // 네더라이트 → 핏빛
    mega: 'hue-rotate(180deg) saturate(1.3)',
  },
};
function shinify(svg, id) {
  const blob = /href="(blob:[^"]+)"/.exec(svg)?.[1], bk = blob && typeof CLEAN_KEY !== 'undefined' ? CLEAN_KEY[blob] : '';
  const form = bk ? (bk.endsWith('-mega') ? 'mega' : 'base') : (svg.match(/img\/mon\/[a-z]+(?:-(t\d|f\d|s\d|mega))?(?:-m)?\.webp/) || [])[1] || 'base';
  const st = `--shue:${shinyHue(id)}deg;--sf:${SHINY_FORM[id]?.[form] || `hue-rotate(${shinyHue(id)}deg) saturate(1.35) brightness(1.05)`}`;
  const head = svg.slice(0, svg.indexOf('>'));
  return /\sstyle="/.test(head) ? svg.replace(/\sstyle="/, ` data-shiny="1" style="${st};`) : svg.replace('<svg', `<svg data-shiny="1" style="${st}"`);
}
const monArt = (id, shiny, ...rest) => (shiny ? shinify(monsterSVG(id, ...rest), id) : monsterSVG(id, ...rest));
const SHINY_TAG = '<em class="shiny-tag">✨ 이로치</em>';

/* ---------- 이벤트 던전 ---------- */
async function showDungeon(back = showLobby) {
  G.screen = 'dungeon'; app.className = '';
  app.innerHTML = `${topbar('이벤트 던전')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/dungeon')).dungeon; } catch (e) { return toast(e.message); }
  if (G.screen !== 'dungeon') return;
  const r = v.rule, days = ['일', '월', '화', '수', '목', '금', '토'];
  app.innerHTML = `${topbar('이벤트 던전')}
    <section class="dg-hero"><s aria-hidden="true"></s><span class="dg-ic">${r.icon}</span><h2>오늘의 던전: ${esc(r.n)}</h2><p>${esc(r.d)}</p><small>${r.size}대${r.size} · 골목대장 ${v.floors}연전 · 매일 자정에 새 규칙</small></section>
    <section class="panel dg-tower">
      ${Array.from({ length: v.floors }, (_, i) => v.floors - 1 - i).map((f) => { const st = f < v.floor ? 'done' : f === v.floor && !v.cleared ? 'now' : 'lock';
        return `<div class="dg-floor ${st}"><b>${f + 1}층</b><div>${rewardChips(v.floorR[f])}</div><span>${st === 'done' ? '✅' : st === 'now' ? '⚔️' : '🔒'}</span></div>`; }).join('')}
      <div class="dg-clear ${v.cleared ? 'done' : ''}"><b>🏆 완전 정복 보상</b><div>${rewardChips(v.clearR)}</div></div>
      <button class="btn wide dg-go" id="dg-go" ${v.cleared ? 'disabled' : ''}>${v.cleared ? '오늘은 다 깼어요! 내일 또 와요' : `${v.floor + 1}층 도전하기`}</button>
      <p class="muted" style="font-size:12px;text-align:center">져도 다시 도전할 수 있어요. 층 보상과 정복 보상은 하루 한 번씩.</p>
    </section>
    <section class="panel"><h2>이번 주 던전</h2>${v.week.map((w) => `<div class="dg-week ${w.id === r.id ? 'on' : ''}"><b>${days[w.day]}</b><span>${w.icon}</span><div><b>${esc(w.n)}</b><small>${esc(w.d)}</small></div></div>`).join('')}</section>`;
  app.querySelector('#back').onclick = back;
  app.querySelector('#dg-go').onclick = () => wsSend({ t: 'dungeon' });
}

/* ---------- 랭크전 ---------- */
let rankWaiting = false;
async function showRank(back = showLobby) {
  G.screen = 'rank'; app.className = '';
  app.innerHTML = `${topbar('랭크전')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let r; try { r = await api('GET', '/api/rank'); } catch (e) { return toast(e.message); }
  if (G.screen !== 'rank') return;
  rankWaiting = r.queued;
  const v = r.rank, T = v.tiers, t = T[v.tier];
  const pct = v.next ? ((v.pts - v.floor) / (v.next - v.floor)) * 100 : 100;
  const rw = (x) => rewardChips(x.r);
  app.innerHTML = `${topbar('랭크전')}
    <section class="rk-hero" style="--rc:${t.c}"><s aria-hidden="true"></s>
      <div class="rk-badge"><span>${t.icon}</span><b>${t.n}</b></div>
      <div class="rk-pts"><b>${v.pts}</b><small>점</small></div>
      <div class="qbar rk-bar"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i><span>${v.next ? `${T[v.tier + 1].icon} ${T[v.tier + 1].n}까지 ${v.next - v.pts}점` : '최고 티어!'}</span></div>
      <p>시즌 ${esc(v.season)} · ${v.w}승 ${v.l}패${v.streak > 1 ? ` · 🔥 ${v.streak}연승` : ''} · 이번 시즌 최고 ${T[v.best].icon} ${T[v.best].n}</p>
      <button class="btn rk-go" id="rk-go">${rankWaiting ? '⏳ 상대 찾는 중… (취소)' : `⚔️ 랭크전 시작 (${v.size}대${v.size})`}</button>
      <small class="rk-rule">상대를 15초 동안 못 찾으면 내 티어에 맞는 골목대장과 붙어요. 사람과 이기면 +25(연승 보너스 최대 +10), 지면 -20 · 골목대장 상대는 +12 / -10</small>
    </section>
    <section class="panel"><h2>🏅 이번 시즌 순위</h2>
      ${r.board.map((p, i) => `<div class="rk-row ${p.name === G.user.name ? 'me' : ''}"><b class="rk-n">${i + 1}</b><div class="ava">${avatarSVG(p.avatar)}</div><div class="rk-who"><b>${esc(p.name)}</b><small>${p.w}승 ${p.l}패</small></div><span class="rk-t" style="--rc:${T[p.tier].c}">${T[p.tier].icon} ${p.pts}</span></div>`).join('') || '<p class="wait">아직 이번 시즌 랭크전을 한 사람이 없어요. 1등이 되어 보세요!</p>'}
    </section>
    <section class="panel"><h2>티어와 시즌 보상 <small class="muted">시즌이 끝나면 최고 티어 보상이 우편으로</small></h2>
      ${T.map((x, i) => `<div class="rk-tier ${i === v.tier ? 'on' : ''}" style="--rc:${x.c}"><span>${x.icon}</span><b>${x.n}</b><small>${x.min ? `${x.min}점~` : '시작'}</small><div>${rw(x)}</div></div>`).join('')}
      <p class="muted" style="font-size:12px;margin-top:6px">골드·다이아·마스터·골목대장에 처음 오르면 랭크 칭호가 열려요. 새 시즌엔 점수가 1000점 쪽으로 반쯤 돌아가요.</p>
    </section>`;
  app.querySelector('#back').onclick = () => { if (rankWaiting) wsSend({ t: 'rank_cancel' }); back(); };
  app.querySelector('#rk-go').onclick = () => { if (rankWaiting) { wsSend({ t: 'rank_cancel' }); } else { wsSend({ t: 'rank_queue' }); } };
}
function onRankMsg(m) {
  if (m.t === 'rank_wait') { rankWaiting = true; toast('상대를 찾는 중이에요…'); }
  if (m.t === 'rank_cancel') { rankWaiting = false; toast('랭크전 찾기를 그만뒀어요.'); }
  if (m.t === 'rank_found') { rankWaiting = false; toast(m.bot ? '사람 상대가 없어 골목대장과 랭크전!' : '랭크전 상대를 찾았어요!'); }
  const b = document.getElementById('rk-go');
  if (b && G.screen === 'rank') b.textContent = rankWaiting ? '⏳ 상대 찾는 중… (취소)' : '⚔️ 랭크전 시작 (3대3)';
}

/* ---------- 원정 ---------- */
async function showExpe(back = showLobby) {
  G.screen = 'expe'; app.className = '';
  app.innerHTML = `${topbar('원정')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let st; try { st = (await api('GET', '/api/expe')).expe; } catch (e) { return toast(e.message); }
  let pickDest = st.dests[0].id, tick;
  const T = G.data.TYPES;
  const hms = (ms) => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? `${h}시간 ${m}분` : m ? `${m}분 ${s % 60}초` : `${s % 60}초`; };
  const rwText = (d) => [`${ICON.gp(14)} ${fmt(d.r.gp)}`, `${ICON.skip(14)} ${d.r.skips}`, d.r.tickets && `${ICON.ticket(14)} ${d.r.tickets}`, d.luck.tickets && `입수권 ${Math.round(d.luck.tickets * 100)}%`, d.luck.stones && `💎 ${Math.round(d.luck.stones * 100)}%`, d.luck.gpt && `길P ${Math.round(d.luck.gpt * 100)}%`].filter(Boolean).join(' · ');
  const draw = () => {
    clearInterval(tick);
    if (G.screen !== 'expe') return;
    const away = new Set(st.list.map((e) => e.uid)), deck = new Set((G.user.decks[G.user.active]?.team || []).map((t) => t.uid));
    const done = st.list.filter((e) => e.done).length, free = st.slots - st.list.length, d = st.dests.find((x) => x.id === pickDest);
    app.innerHTML = `${topbar('원정')}
      <section class="ex-hero"><s aria-hidden="true"></s><h2>🧭 골목몬 원정</h2><p>쉬는 골목몬을 골목 곳곳에 보내 두면, 시간이 지나 보상을 들고 돌아와요. 원정지가 좋아하는 타입이면 <b>보상 1.5배</b>!</p></section>
      <section class="panel"><h2>원정 중 <small class="muted">${st.list.length} / ${st.slots}</small></h2>
        ${st.list.map((e) => { const dd = st.dests.find((x) => x.id === e.dest), m = G.user.mons.find((x) => x.uid === e.uid); const pct = Math.min(100, ((Date.now() - e.start) / (e.end - e.start)) * 100);
          return `<div class="ex-run ${e.done ? 'done' : ''}"><div class="ex-mon">${monArt(e.species, m?.shiny)}</div><div class="ex-inf"><b>${dd.icon} ${esc(dd.n)}</b><small>${esc(G.data.MONSTERS[e.species].n)}${e.bonus > 1 ? ` · 보너스 ×${e.bonus.toFixed(1)}` : ''}</small>
            <div class="qbar"><i style="width:${pct}%"></i><span data-left="${e.end}">${e.done ? '돌아왔어요!' : hms(e.end - Date.now())}</span></div></div>
            ${e.done ? `<button class="btn small" data-exc="${e.uid}">받기</button>` : `<button class="btn small paper" data-exr="${e.uid}" title="불러오기 (보상 없음)">↩</button>`}</div>`; }).join('') || '<p class="wait">원정 간 골목몬이 없어요.</p>'}
        ${done > 1 ? '<button class="btn wide" id="ex-all">돌아온 골목몬 보상 모두 받기</button>' : ''}
      </section>
      ${free ? `<section class="panel"><h2>원정 보내기</h2>
        <div class="ex-dests">${st.dests.map((x) => `<button class="ex-dest ${x.id === pickDest ? 'on' : ''}" data-dest="${x.id}"><span>${x.icon}</span><b>${esc(x.n)}</b><small>${x.hours}시간</small></button>`).join('')}</div>
        <p class="ex-info"><b>${d.icon} ${esc(d.n)}</b> · ${d.hours}시간 · 좋아하는 타입 ${d.like.map((t) => typeChip(t)).join('')}<br><small>${rwText(d)}</small></p>
        <h3 class="ex-h">보낼 골목몬 <small>지금 덱에 있는 골목몬은 못 보내요</small></h3>
        <div class="tr-grid">${G.user.mons.filter((m) => !away.has(m.uid)).map((m) => { const sp = G.data.MONSTERS[m.species], like = sp.types.some((t) => d.like.includes(t)), off = deck.has(m.uid);
          return `<button class="tr-pick ex-pick" data-exs="${m.uid}" ${off ? 'disabled' : ''}><div class="tr-mon${m.shiny ? ' is-shiny' : ''}${like ? ' like' : ''}" style="--tc:${T[sp.types[0]].c}">${like ? '<em class="ex-like">×1.5</em>' : ''}${off ? '<em class="ex-deck">덱</em>' : ''}${monArt(m.species, m.shiny)}<b>${esc(sp.n)}</b></div></button>`; }).join('')}</div>
      </section>` : '<p class="wait">원정 자리가 꽉 찼어요. 돌아오면 다시 보낼 수 있어요.</p>'}`;
    app.querySelector('#back').onclick = () => { clearInterval(tick); back(); };
    app.querySelectorAll('[data-dest]').forEach((b) => { b.onclick = () => { pickDest = b.dataset.dest; const y = scrollY; draw(); scrollTo(0, y); }; });
    const call = async (path, body, title) => { try { const r = await api('POST', path, body); setUser(r); st = r.expe; if (r.got) showGot(r.got, title, draw); else draw(); } catch (e) { toast(e.message); } };
    app.querySelectorAll('[data-exs]').forEach((b) => { b.onclick = () => call('/api/expe/send', { uid: b.dataset.exs, dest: pickDest }); });
    app.querySelectorAll('[data-exc]').forEach((b) => { b.onclick = () => call('/api/expe/claim', { uid: b.dataset.exc }, '원정에서 돌아왔어요!'); });
    app.querySelector('#ex-all')?.addEventListener('click', () => call('/api/expe/claim', { uid: 'all' }, '원정에서 돌아왔어요!'));
    app.querySelectorAll('[data-exr]').forEach((b) => { b.onclick = () => { if (confirm('지금 불러오면 보상을 못 받아요. 불러올까요?')) call('/api/expe/recall', { uid: b.dataset.exr }); }; });
    tick = setInterval(() => {
      if (G.screen !== 'expe') return clearInterval(tick);
      let flip = false;
      app.querySelectorAll('[data-left]').forEach((el) => { const left = +el.dataset.left - Date.now(); if (left <= 0) flip = true; else el.textContent = hms(left); });
      if (flip) { st.list.forEach((e) => { e.done = Date.now() >= e.end; }); draw(); }
    }, 1000);
  };
  draw();
}

/* ---------- 메가스톤 ---------- */
const STONE_PRICE = 5000;
const megaIds = () => Object.keys(G.data.MONSTERS).filter((id) => G.data.MONSTERS[id].mega && !(G.data.BANNED || []).includes(id));
// 메가스톤 사기 확인 창 (상점·골목몬 상세에서 같이 씀)
function buyStoneSheet(id, after) {
  const sp = G.data.MONSTERS[id], u = G.user, ok = u.gp >= STONE_PRICE;
  const bg = openSheet(`<div class="buy">${stoneSVG(id, 110)}<h2>${esc(sp.n)} 메가스톤</h2>
    <p>${esc(sp.n)}을(를) <b>${esc(sp.mega.n)}</b>(으)로 메가진화시켜요.</p>
    <p class="buy-price">${ICON.gp(22)} <b>${fmt(STONE_PRICE)} GP</b> <small>보유 ${fmt(u.gp)} GP${ok ? ` → 남는 GP ${fmt(u.gp - STONE_PRICE)}` : ''}</small></p>
    ${ok ? '' : `<p class="buy-no">GP가 ${fmt(STONE_PRICE - u.gp)} 모자라요.</p>`}
    <div class="sc-pay"><button class="btn paper" data-x>취소</button><button class="btn" data-buy ${ok ? '' : 'disabled'}>사기</button></div></div>`);
  bg.querySelector('[data-x]').onclick = () => { closeSheet(); after?.(); };
  bg.querySelector('[data-buy]').onclick = async (e) => {
    e.target.disabled = true;
    try { const r = await api('POST', '/api/stone/buy', { species: id }); setUser(r); closeSheet(); showGot([{ k: 'stone', id }], '메가스톤을 샀어요!', after); }
    catch (err) { toast(err.message); e.target.disabled = false; }
  };
}
const stoneCard = (id, own, extra = '') => { const sp = G.data.MONSTERS[id]; return `<div class="st-card ${own ? 'own' : 'lock'}" data-sid="${id}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${stoneSVG(id, 72, { lock: !own })}<b>${esc(sp.n)}</b><small>${esc(sp.mega.n)}</small>${extra}</div>`; };

// 내 메가스톤 모아 보기
function showStones(back = showLobby) {
  G.screen = 'stones'; app.className = '';
  const all = megaIds(), mine = all.filter((id) => G.user.stones.includes(id)), rest = all.filter((id) => !G.user.stones.includes(id));
  const hasMon = new Set(G.user.mons.map((m) => m.species));
  app.innerHTML = `${topbar('내 메가스톤')}
    <section class="panel st-head"><div class="st-count"><b>${mine.length}</b> / ${all.length}종</div><div class="qbar"><i style="width:${(mine.length / all.length) * 100}%"></i></div>
      <p class="muted">메가스톤이 있는 골목몬만 대전에서 메가진화할 수 있어요. 없는 스톤은 <b>상점</b>에서 살 수 있어요.</p>
      <button class="btn small" id="to-shop">🛒 상점 가기</button></section>
    <h3 class="st-h">가지고 있는 메가스톤 <small>${mine.length}개</small></h3>
    <div class="st-grid">${mine.map((id) => stoneCard(id, true, hasMon.has(id) ? '<em class="st-ok">골목몬 있음</em>' : '<em class="st-no">골목몬 없음</em>')).join('') || '<p class="wait">아직 메가스톤이 없어요.</p>'}</div>
    <h3 class="st-h">아직 없는 메가스톤 <small>${rest.length}개</small></h3>
    <div class="st-grid">${rest.map((id) => stoneCard(id, false)).join('')}</div>`;
  app.querySelector('#back').onclick = back;
  app.querySelector('#to-shop').onclick = () => showShop(() => showStones(back));
  app.querySelectorAll('.st-card.lock').forEach((c) => { c.onclick = () => buyStoneSheet(c.dataset.sid, () => showStones(back)); });
}

// 상점: 탭마다 물건 칸. 꾸미기는 data.js에서 cond: ['shop', 가격]만 달면 자동으로 진열돼요.
let shopTab = 'stone';
const SHOP_TABS = [['stone', '💎 스톤'], ['titles', '🏷️ 칭호'], ['cards', '🃏 카드'], ['pins', '📌 핀']];
const shopItems = (kind) => G.data.COSMETICS[kind].filter((x) => x.cond?.[0] === 'shop');
function cosLook(kind, item, big) {
  if (kind === 'titles') return `<div class="sh-look sh-title">${titleTag(item.id)}</div>`;
  if (kind === 'cards') return `<div class="sh-look sh-card">${big ? battleCard({ name: G.user.name, avatar: G.user.avatar, style: { ...G.user.style, card: item.id }, record: recordText(G.user) }) : `<span class="cswatch bc-${item.id}"></span>`}</div>`;
  return `<div class="sh-look sh-pin">${pinSVG(item.id)}</div>`;
}
function buyCosSheet(kind, item, after, cur = { have: G.user.gp, icon: ICON.gp, unit: 'GP', path: '/api/shop/cosmetic' }) {
  const u = G.user, price = item.cond[1], ok = cur.have >= price, KN = { titles: '칭호', cards: '전투카드', pins: '핀' }[kind];
  const bg = openSheet(`<div class="buy">${cosLook(kind, item, true)}<h2>${kind === 'titles' ? '' : esc(item.n)}</h2><p>${KN}${kind === 'titles' ? ` · ${TITLE_TIERS[item.tier || 0]} 등급` : ''}</p>
    <p class="buy-price">${cur.icon(22)} <b>${fmt(price)} ${cur.unit}</b> <small>보유 ${fmt(cur.have)} ${cur.unit}${ok ? ` → 남는 ${cur.unit} ${fmt(cur.have - price)}` : ''}</small></p>
    ${ok ? '' : `<p class="buy-no">${cur.unit}가 ${fmt(price - cur.have)} 모자라요.</p>`}
    <div class="sc-pay"><button class="btn paper" data-x>취소</button><button class="btn" data-buy ${ok ? '' : 'disabled'}>사기</button></div></div>`);
  bg.querySelector('[data-x]').onclick = closeSheet;
  bg.querySelector('[data-buy]').onclick = async (e) => {
    e.target.disabled = true;
    try {
      const r = await api('POST', cur.path, { ref: `${kind}:${item.id}` }); setUser(r);
      const bg2 = openSheet(`<div class="buy">${cosLook(kind, item, true)}<h2>샀어요! 🎉</h2><p>꾸미기에서 바로 장착할 수 있어요.</p>
        <div class="sc-pay"><button class="btn paper" data-x>계속 쇼핑</button><button class="btn" data-go>꾸미기로 가기</button></div></div>`);
      bg2.querySelector('[data-x]').onclick = () => { closeSheet(); after(); };
      bg2.querySelector('[data-go]').onclick = () => { closeSheet(); showAvatar(); };
    } catch (err) { toast(err.message); e.target.disabled = false; }
  };
}
function showShop(back = showLobby) {
  G.screen = 'shop'; app.className = '';
  const again = () => { const y = scrollY; showShop(back); scrollTo(0, y); };
  let body = '';
  if (shopTab === 'stone') {
    const all = megaIds(), rest = all.filter((id) => !G.user.stones.includes(id)), mine = all.filter((id) => G.user.stones.includes(id));
    body = `<h3 class="st-h">💎 메가스톤 <small>하나에 ${fmt(STONE_PRICE)} GP</small></h3>
    <div class="st-grid">${rest.map((id) => stoneCard(id, true, `<span class="st-price">${ICON.gp(14)}${fmt(STONE_PRICE)}</span>`)).join('') || '<p class="wait">메가스톤을 전부 모았어요! 🎉</p>'}</div>
    ${mine.length ? `<details class="st-owned"><summary>이미 가진 메가스톤 ${mine.length}개 보기</summary><div class="st-grid">${mine.map((id) => stoneCard(id, true, '<em class="st-ok">보유</em>')).join('')}</div></details>` : ''}`;
  } else {
    const kind = shopTab, owned = new Set(G.user.owned || []);
    body = `<h3 class="st-h">${{ titles: '🏷️ 칭호', cards: '🃏 전투카드', pins: '📌 핀' }[kind]} <small>상점에서만 파는 ${{ titles: '칭호', cards: '전투카드', pins: '핀' }[kind]}</small></h3>
    <div class="sh-grid ${kind}">${shopItems(kind).map((x) => { const have = owned.has(`${kind}:${x.id}`) || G.user.dev; return `<button class="sh-item ${have ? 'have' : ''}" data-cos="${x.id}" ${have ? 'disabled' : ''}>
      ${cosLook(kind, x)}<b>${kind === 'titles' ? `${TITLE_TIERS[x.tier || 0]} 등급` : esc(x.n)}</b>${have ? '<em class="st-ok">보유</em>' : `<span class="st-price">${ICON.gp(14)}${fmt(x.cond[1])}</span>`}</button>`; }).join('')}</div>`;
  }
  app.innerHTML = `${topbar('상점')}
    <section class="shop-banner"><s aria-hidden="true"></s><h2>골목 상점</h2><p>GP로 필요한 걸 사요. 물건은 앞으로 더 들어올 거예요!</p></section>
    <div class="tabs sh-tabs">${SHOP_TABS.map(([k, n]) => `<button data-stab="${k}" aria-selected="${shopTab === k}">${n}</button>`).join('')}</div>
    ${body}`;
  app.querySelector('#back').onclick = back;
  app.querySelectorAll('[data-stab]').forEach((b) => { b.onclick = () => { shopTab = b.dataset.stab; showShop(back); }; });
  app.querySelectorAll('.st-grid [data-sid]').forEach((c) => { if (!c.closest('.st-owned')) c.onclick = () => buyStoneSheet(c.dataset.sid, again); });
  app.querySelectorAll('[data-cos]').forEach((b) => { b.onclick = () => buyCosSheet(shopTab, shopItems(shopTab).find((x) => x.id === b.dataset.cos), again); });
}
// 지갑의 💎를 누르면 어디서든 내 메가스톤으로
document.addEventListener('click', (e) => {
  if (!e.target.closest?.('[data-gostones]')) return;
  const here = G.screen, again = { box: showBox, shop: showShop, scout: showScout, rewards: showRewards, pass: showPass }[here];
  if (here === 'stones') return;
  showStones(again ? () => again() : showLobby);
});
