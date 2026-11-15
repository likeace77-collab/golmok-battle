'use strict';
/* 새 모드 화면: 🏟️ 체육관 · 🚪 골목 탈출 · 🌍 월드 보스 · 🧩 퍼즐과 미션 · 🧪 메타배틀 · 💗 친밀도 · 🔮 관전 승부 예측 */
const modeBack = () => { app.className = ''; showLobby(); };
async function modeLoad(title, path) {
  G.screen = 'mode'; app.className = '';
  app.innerHTML = `${topbar(title)}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = modeBack;
  try { return await api('GET', path); } catch (e) { toast(e.message); return null; }
}
const teamStrip = (team) => `<div class="md-team">${team.map((m) => `<span class="${m.shiny ? 'is-shiny' : ''}">${monArt(m.species, m.shiny)}${m.hpPct ? `<i class="md-hp"><b style="width:${m.hpPct}%"></b></i>` : ''}<small>${esc(G.data.MONSTERS[m.species].n)}${m.plus ? ` +${m.plus}` : ''}</small></span>`).join('')}</div>`;
const modeGo = (kind, arg) => wsSend({ t: 'mode_battle', kind, arg });

/* ---------- 💗 친밀도 (내 골목몬 상세) ---------- */
function modeMonBox(m) {
  const aff = m.aff || 0, nat = G.data.NATURES?.[m.nature], SN = { atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드' };
  const natBox = nat ? `<div class="md-nat"><h3 class="dex-h">🌱 성격 <b>${esc(nat.n)}</b></h3>
      <p>${nat.up ? `<span class="up">${SN[nat.up]} ▲10%</span> <span class="down">${SN[nat.down]} ▼10%</span>` : '<span class="muted">능력치 변화 없음 (무난한 성격)</span>'}</p>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small" data-nat="ticket">🎲 성격 바꾸기 (리롤권 1)</button><button class="btn small paper" data-nat="gp">1,000GP로 바꾸기</button></div></div>` : '';
  return `<section class="md-mon">${natBox}
    <div class="md-aff"><h3 class="dex-h">💗 친밀도 <b>${aff}</b><small class="muted">/100</small></h3>
      <div class="md-hearts">${Array.from({ length: 10 }, (_, i) => `<i class="${aff >= (i + 1) * 10 ? 'on' : aff > i * 10 ? 'half' : ''}">♥</i>`).join('')}</div>
      <p class="muted" style="font-size:12.5px">70 이상: 쓰러질 공격을 가끔 버텨요 · 90 이상: 상태이상을 가끔 털어내요. 쓰다듬기(하루 1번), 간식, 같이 이기면 올라요.</p>
      <div class="row" style="gap:6px"><button class="btn small" id="md-pet">🤚 쓰다듬기</button><button class="btn small paper" id="md-snack">🍪 간식 (${ICON.gp(14)}300)</button></div></div></section>`;
}
function bindModeMon(bg, m, reopen) {
  const heartBurst = (el) => { const r = el.getBoundingClientRect(); for (let i = 0; i < 8; i++) { const h = document.createElement('i'); h.className = 'md-burst'; h.textContent = '♥'; h.style.left = `${r.left + r.width / 2}px`; h.style.top = `${r.top}px`; document.body.appendChild(h); h.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 1 }, { transform: `translate(${(Math.random() - .5) * 140}px, ${-60 - Math.random() * 80}px) scale(1.3)`, opacity: 0 }], { duration: 900 + Math.random() * 300, easing: 'ease-out' }).onfinish = () => h.remove(); } };
  const act = async (path, btn) => { try { const r = await api('POST', path, { uid: m.uid }); setUser(r); heartBurst(btn); toast(`${G.data.MONSTERS[m.species].n}: ${r.line} (친밀도 ${r.aff})`); setTimeout(reopen, 500); } catch (e) { toast(e.message); } };
  bg.querySelectorAll('[data-nat]').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(`성격을 다시 뽑을까요? (${b.dataset.nat === 'gp' ? '1,000GP' : '리롤권 1장'})`)) return;
    b.disabled = true;
    try { const r = await api('POST', '/api/mon/nature', { uid: m.uid, pay: b.dataset.nat }); setUser(r); toast(`🌱 성격이 바뀌었어요: ${r.old} → ${r.nature}`); reopen(); } catch (e) { toast(e.message); b.disabled = false; }
  }));
  bg.querySelector('#md-pet')?.addEventListener('click', (e) => act('/api/mon/pet', e.currentTarget));
  bg.querySelector('#md-snack')?.addEventListener('click', (e) => act('/api/mon/snack', e.currentTarget));
}

/* ---------- 🏟️ 체육관 ---------- */
async function showGym() {
  const r = await modeLoad('🏟️ 골목 체육관', '/api/gym'); if (!r) return;
  const v = r.gym, badges = v.gyms.filter((g) => g.id !== 'champ');
  app.innerHTML = `${topbar('🏟️ 골목 체육관')}
    <section class="md-hero md-gymhero"><h2>배지 ${badges.filter((g) => g.done).length} / 8</h2><div class="md-badges">${badges.map((g) => `<i class="${g.done ? 'on' : ''}" title="${esc(g.badge)}">${g.done ? g.icon : '?'}</i>`).join('')}</div>
      <p>타입별 관장 8명을 차례로 쓰러뜨리고 배지를 모아요. 8개를 모으면 <b>골목 챔피언</b>에게 도전! 이기면 칭호 「골목 챔피언」.</p></section>
    ${v.gyms.map((g) => `<section class="md-gym ${g.open ? '' : 'lock'} ${g.done ? 'done' : ''} ${g.id === 'champ' ? 'champ' : ''}">
      <div class="md-gi">${g.icon}</div><div class="md-gb"><h3>${esc(g.leader)} ${g.done ? '<em>✅ 클리어</em>' : ''}</h3><small>${esc(g.typeN)} · ${g.size}대${g.size} · ${esc(g.rd)}</small>
        <p class="md-line">「${esc(g.line)}」</p><div class="md-rw">${g.done ? '<span class="muted">다시 이기면 500GP</span>' : `처음 이기면 ${rewardChips(g.reward)}`}</div></div>
      <button class="btn ${g.open ? '' : 'paper'}" data-gym="${g.id}" ${g.open ? '' : 'disabled'}>${g.open ? '도전' : '🔒'}</button></section>`).join('')}`;
  app.querySelector('#back').onclick = modeBack;
  app.querySelectorAll('[data-gym]').forEach((b) => { b.onclick = () => modeGo('gym', b.dataset.gym); });
}

/* ---------- 🚪 골목 탈출 ---------- */
async function showRogue() {
  const r = await modeLoad('🚪 골목 탈출', '/api/rogue'); if (!r) return;
  rogueDraw(r.rogue);
}
function rogueDraw(v) {
  const run = v.run;
  const top = `<section class="panel md-top"><h2>🏆 탈출 기록 TOP 10</h2>${v.top.length ? v.top.map((t, i) => `<div><b>${i + 1}</b> ${esc(t.name)} <em>${t.floor}층</em> <span class="mini">${t.team.map((s) => monArt(s)).join('')}</span></div>`).join('') : '<p class="muted">아직 기록이 없어요. 첫 기록의 주인공이 돼 보세요!</p>'}</section>`;
  let body;
  if (!run) body = `<section class="md-hero md-roguehero"><h2>골목 탈출</h2><p>해가 진 골목, 집에 가는 길이 끝나지 않는다… 골목몬 <b>3마리를 빌려</b> 층을 올라가며 탈출해요. 이길 때마다 <b>유물</b>을 하나 골라 강해지고, 지면 거기서 끝! <b>몇 층까지 갔는지</b>가 기록으로 남아요. 20층이 골목의 끝… 일까요?</p>
      <p>내 최고 기록 <b>${v.best}층</b> · 오늘 보상 받은 승리 ${v.todayWins}/${v.dailyWins}</p><button class="btn wide" id="rg-start">🚪 탈출 시작</button></section>${top}`;
  else if (run.offer) body = `<section class="panel"><h2>함께 갈 골목몬을 골라요</h2><p class="muted">빌린 골목몬이라 내 골목몬은 다치지 않아요.</p>${run.offer.map((t, i) => `<button class="md-pick" data-team="${i}">${teamStrip(t)}</button>`).join('')}</section>`;
  else if (run.relicOffer) body = `<section class="md-hero md-roguehero"><h2>${run.floor - 1}층 돌파! 유물을 하나 골라요</h2><div class="md-relics">${run.relicOffer.map((id) => { const x = RELIC_INFO[id] || { n: id, d: '', icon: '🧿' }; return `<button class="md-relic" data-relic="${id}"><span>${x.icon}</span><b>${esc(x.n)}</b><small>${esc(x.d)}</small></button>`; }).join('')}</div></section>`;
  else body = `<section class="md-hero md-roguehero ${run.boss ? 'boss' : ''}"><small>${run.boss ? '⚠️ 보스 층' : '이야기'}</small><h2>${run.floor}층</h2><p class="md-story">${esc(run.story)}</p>
      ${teamStrip(run.team)}<div class="md-relics small">${run.relicsFull.map((x) => `<span title="${esc(x.d)}">${x.icon} ${esc(x.n)}</span>`).join('') || '<span class="muted">아직 유물이 없어요</span>'}</div>
      <button class="btn wide" id="rg-go">⚔️ ${run.floor}층 도전</button><button class="btn paper wide" id="rg-quit" style="margin-top:6px">포기하고 기록 남기기 (${run.floor - 1}층)</button></section>${top}`;
  app.innerHTML = `${topbar('🚪 골목 탈출')}${body}`;
  app.querySelector('#back').onclick = modeBack;
  const post = async (path, b) => { try { const r = await api('POST', path, b); rogueDraw(r.rogue); } catch (e) { toast(e.message); } };
  app.querySelector('#rg-start')?.addEventListener('click', () => post('/api/rogue/start', {}));
  app.querySelectorAll('[data-team]').forEach((b) => { b.onclick = () => post('/api/rogue/team', { i: +b.dataset.team }); });
  app.querySelectorAll('[data-relic]').forEach((b) => { b.onclick = () => post('/api/rogue/relic', { id: b.dataset.relic }); });
  app.querySelector('#rg-go')?.addEventListener('click', () => modeGo('rogue'));
  app.querySelector('#rg-quit')?.addEventListener('click', () => { if (confirm('여기서 그만두고 기록을 남길까요?')) post('/api/rogue/quit', {}); });
}
const RELIC_INFO = (() => { const t = { fire: '불', water: '물', grass: '풀', elec: '전기', spirit: '혼', ice: '얼음', earth: '땅', fairy: '페어리' };
  return { fang: { n: '날카로운 송곳니', icon: '🦷', d: '내 공격 피해 +15%' }, shell: { n: '단단한 껍데기', icon: '🐚', d: '받는 피해 -15%' }, shoes: { n: '바람 운동화', icon: '👟', d: '스피드 +20%' }, heart: { n: '커다란 심장', icon: '❤️', d: '체력 +25%' }, coin: { n: '행운의 동전', icon: '🪙', d: '급소 피해 ×1.5' }, hammer: { n: '대장간 망치', icon: '🔨', d: '내 팀 모두 강화 +1' },
    ...Object.fromEntries(Object.entries(t).map(([k, n]) => [`amu-${k}`, { n: `${n} 부적`, icon: '🧿', d: `${n} 기술 피해 +40%` }])) }; })();

/* ---------- 🌍 월드 보스 ---------- */
async function showWb() {
  const r = await modeLoad('🌍 월드 보스', '/api/wb'); if (!r) return;
  const v = r.wb, pct = Math.max(0, v.hp / v.max * 100);
  app.innerHTML = `${topbar('🌍 월드 보스')}
    <section class="md-hero md-wbhero"><small>이번 주 · ${dateStr(v.ends)}까지</small><h2>${esc(v.name)}</h2><div class="md-wbart">${typeof gmaxSVG === 'function' ? gmaxSVG(v.species) : monArt(v.species)}</div>
      <div class="md-wbhp"><b style="width:${pct}%"></b><span>${fmt(Math.max(0, v.hp))} / ${fmt(v.max)}</span></div>
      <p>서버의 모두가 <b>한 주 동안</b> 함께 체력을 깎아요. 한 번 싸울 때 <b>${v.limit}턴</b>, 하루 <b>${v.daily}번</b>. 준 피해만큼 GP를 받고, 쓰러뜨리면 참가한 모두에게 ${rewardChips(v.killR)}!</p>
      ${v.killed ? '<p class="md-killed">🎉 이번 주 보스는 쓰러졌어요! 다음 주 새 보스를 기다려요.</p>' : `<button class="btn wide" id="wb-go" ${v.left ? '' : 'disabled'}>⚔️ 도전 (오늘 ${v.left}/${v.daily}번 남음)</button>`}</section>
    <section class="panel md-top"><h2>💥 피해량 순위</h2><p class="muted">내 피해량 <b>${fmt(v.mine)}</b> · 주말에 1~3위 보상: ${v.topR.map((x, i) => `${i + 1}위 ${rewardChips(x)}`).join(' ')}</p>
      ${v.rank.length ? v.rank.map((x, i) => `<div class="${x.me ? 'me' : ''}"><b>${i + 1}</b> ${esc(x.name)} <em>${fmt(x.dmg)}</em></div>`).join('') : '<p class="muted">아직 아무도 도전하지 않았어요.</p>'}</section>`;
  app.querySelector('#back').onclick = modeBack;
  app.querySelector('#wb-go')?.addEventListener('click', () => modeGo('wb'));
}

/* ---------- 🧩 오늘의 퍼즐과 미션 ---------- */
async function showMissions() {
  const r = await modeLoad('🧩 퍼즐과 미션', '/api/missions'); if (!r) return;
  missionDraw(r.missions);
}
function missionDraw(v) {
  const p = v.puzzle, allClaimed = v.missions.every((m) => m.claimed);
  app.innerHTML = `${topbar('🧩 퍼즐과 미션')}
    <section class="md-hero md-puzhero"><small>오늘의 퍼즐 ${p.solved ? '· ✅ 해결' : ''}</small><h2>🧩 ${esc(p.n)}</h2><p>${esc(p.d)}</p>
      <div class="md-vs"><div><small>내 골목몬</small>${teamStrip(p.my)}</div><b>VS</b><div><small>상대</small>${teamStrip(p.foe)}</div></div>
      <p class="muted" style="color:#fffc">${p.turns}턴 안에 이기면 해결! ${p.solved ? '' : `보상 ${rewardChips(p.reward)}`}</p><button class="btn wide" id="pz-go">🧩 퍼즐 풀기</button></section>
    <section class="panel"><h2>🎯 오늘의 미션</h2><p class="muted" style="font-size:13px">골목대장(보통 이상)이나 친구와의 대전에서 달성하면 돼요. 미션마다 ${rewardChips(v.reward)}</p>
      ${v.missions.map((m) => `<div class="md-mis ${m.done ? 'done' : ''}"><div><b>${esc(m.n)}</b><small>${esc(m.d)}</small></div>${m.claimed ? '<em>받음 ✅</em>' : m.done ? `<button class="btn small" data-mis="${m.id}">받기</button>` : '<em class="muted">도전 중</em>'}</div>`).join('')}
      <div class="md-mis all"><div><b>세 미션 모두 받기</b><small>보너스 ${rewardChips(v.allReward)}</small></div>${v.all ? '<em>받음 ✅</em>' : `<button class="btn small" data-mis="all" ${allClaimed ? '' : 'disabled'}>보너스 받기</button>`}</div></section>`;
  app.querySelector('#back').onclick = modeBack;
  app.querySelector('#pz-go').onclick = () => modeGo('puzzle');
  app.querySelectorAll('[data-mis]').forEach((b) => { b.onclick = async () => { try { const r = await api('POST', '/api/missions/claim', { id: b.dataset.mis }); setUser(r); showGot(r.got, '미션 보상!'); missionDraw(r.missions); } catch (e) { toast(e.message); } }; });
}

/* ---------- 🧪 메타배틀 ---------- */
async function showMeta() {
  const r = await modeLoad('🧪 메타배틀', '/api/meta'); if (!r) return;
  const v = r.meta, others = (G.lobby?.players || []).filter((p) => p.name !== G.user.name);
  app.innerHTML = `${topbar('🧪 메타배틀')}
    <section class="md-hero md-metahero"><small>이번 주 규칙 · ${dateStr(v.ends)}까지</small><h2>${v.rule.icon} ${esc(v.rule.n)}</h2><p>${esc(v.rule.d)}</p>
      <p>평소 대전과 따로 하는 <b>규칙 대전</b>이에요. 이기면 점수(친구전 3점, 골목대장전 1점), 하루 ${v.daily}번까지 ${rewardChips(v.winR)}. 주말 순위 1~3위 보상!</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">${[[1, '보통'], [2, '어려움'], [3, '지옥']].map(([l, n]) => `<button class="btn" data-mb="${l}">🤖 골목대장(${n})</button>`).join('')}</div></section>
    <section class="panel"><h2>⚔️ 친구에게 메타배틀 신청 (3대3)</h2>${others.length ? others.map((p) => `<div class="player"><div class="nm">${esc(p.name)}</div><button class="btn small" data-mch="${esc(p.key)}" ${p.busy ? 'disabled' : ''}>${p.busy ? '대전 중' : '신청'}</button></div>`).join('') : '<p class="muted">지금 접속한 친구가 없어요.</p>'}</section>
    <section class="panel md-top"><h2>🏆 이번 주 순위</h2><p class="muted">내 점수 <b>${v.pts}</b> · 오늘 승리 보상 ${v.todayWins}/${v.daily}</p>${v.rank.length ? v.rank.map((x, i) => `<div class="${x.me ? 'me' : ''}"><b>${i + 1}</b> ${esc(x.name)} <em>${x.pts}점</em></div>`).join('') : '<p class="muted">아직 아무도 없어요.</p>'}</section>
    <section class="panel"><h2>📅 규칙들 (주마다 바뀌어요)</h2><div class="md-metas">${v.all.map((m) => `<span class="${m.id === v.rule.id ? 'on' : ''}">${m.icon} ${esc(m.n)}</span>`).join('')}</div></section>`;
  app.querySelector('#back').onclick = modeBack;
  app.querySelectorAll('[data-mb]').forEach((b) => { b.onclick = () => modeGo('meta', +b.dataset.mb); });
  app.querySelectorAll('[data-mch]').forEach((b) => { b.onclick = () => { wsSend({ t: 'challenge', to: b.dataset.mch, size: 3, meta: true }); toast('메타배틀을 신청했어요!'); }; });
}

/* ---------- 🔮 관전 승부 예측 ---------- */
let BET_AMT = 500;
function onBets(m) {
  let el = document.getElementById('bet-bar');
  if (G.screen !== 'battle') { el?.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'bet-bar'; el.className = 'bet-bar'; document.body.appendChild(el); }
  const tot = m.pools[0] + m.pools[1], odds = (t) => (m.pools[t] ? (1 + Math.max(0.3, (m.pools[1 - t] * 0.9) / m.pools[t])).toFixed(2) : '1.30+');
  el.innerHTML = `<b>🔮 승부 예측</b>${m.mine ? `<span>내 예측: <b>${esc(m.names[m.mine.team])}</b> ${fmt(m.mine.amt)}GP</span>` : m.open ? `<div class="bet-amt">${[100, 500, 1000, 5000].map((n) => `<button data-amt="${n}" class="${BET_AMT === n ? 'on' : ''}">${fmt(n)}</button>`).join('')}</div>
    <div class="bet-sides">${[0, 1].map((t) => `<button data-team="${t}">${esc(m.names[t])}<small>${fmt(m.pools[t])}GP · ×${odds(t)}</small></button>`).join('')}</div>` : '<span>예측 마감 (3턴까지)</span>'}
    <small>${tot ? `모인 GP ${fmt(tot)}` : '3턴까지 누가 이길지 GP를 걸 수 있어요'}</small><button class="bet-x" aria-label="닫기">✕</button>`;
  el.querySelector('.bet-x').onclick = () => el.remove();
  el.querySelectorAll('[data-amt]').forEach((b) => { b.onclick = () => { BET_AMT = +b.dataset.amt; onBets(m); }; });
  el.querySelectorAll('[data-team]').forEach((b) => { b.onclick = () => { if (confirm(`${m.names[+b.dataset.team]} 쪽에 ${fmt(BET_AMT)}GP를 걸까요?`)) wsSend({ t: 'bet', team: +b.dataset.team, amount: BET_AMT }); }; });
}
