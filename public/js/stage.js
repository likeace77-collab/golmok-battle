// 무대: 캐릭터를 크게 세워 보여 주는 화면 (로비 프로필, 랭크전 결과)
const has3DStage = () => typeof Avatar3D !== 'undefined' && !!Avatar3D;
const stageDeco = '<i class="stg-floor" aria-hidden="true"></i><i class="stg-beam a" aria-hidden="true"></i><i class="stg-beam b" aria-hidden="true"></i><i class="stg-stripe" aria-hidden="true"></i>';

// 로비 위쪽 프로필 무대
function lobbyStageHTML(u) {
  if (!has3DStage()) return battleCard({ name: u.name, avatar: u.avatar, style: u.style }, 'big');
  const st = u.stats || {}, rk = u.rank || { pts: 1000, tier: 0 };
  const tiers = ['브론즈', '실버', '골드', '플래티넘', '다이아', '마스터', '골목대장'], icons = ['🥉', '🥈', '🥇', '💠', '💎', '👑', '🔥'];
  return `<div class="stg lobby-stg">${stageDeco}<canvas class="stg-cv" id="lobby-stage" aria-label="내 캐릭터. 옆으로 밀면 돌아갑니다"></canvas>
    <div class="stg-info">${titleTag(u.style?.title)}<b class="stg-name">${esc(u.name)}</b>${(u.style?.pins || []).filter((id) => PIN_ART[id]).length ? `<div class="bc-pins stg-pins">${u.style.pins.filter((id) => PIN_ART[id]).map(pinSVG).join('')}</div>` : ''}
      <span class="stg-chip">${icons[rk.tier || 0]} ${tiers[rk.tier || 0]} · ${rk.pts}점</span>
      ${st.streak > 1 ? `<span class="stg-chip hot">🔥 ${st.streak}연승 중</span>` : ''}
      <button class="btn small paper stg-edit" id="go-ava2">👕 꾸미기</button></div></div>`;
}
function mountLobbyStage(u) {
  const cv = document.getElementById('lobby-stage');
  if (!cv || !has3DStage()) return;
  const live = Avatar3D.mount(cv, u.avatar, { drag: true, facing: .35 });
  cv.addEventListener('click', () => live.play(['cheer', 'command', 'mega'][Math.floor(Math.random() * 3)]));
}

// 랭크전 결과 무대 (서버가 판이 끝나고 보내 줌)
function showRankStage(m) {
  document.querySelector('.rank-stage')?.remove();
  const el = document.createElement('div');
  el.className = `rank-stage ${m.won ? 'win' : 'lose'}`;
  const nextMin = m.next ? m.next.min : m.pts, span = Math.max(1, nextMin - m.min), pct = m.next ? Math.max(0, Math.min(100, ((m.pts - m.min) / span) * 100)) : 100;
  el.innerHTML = `<div class="stg rs-stage">${stageDeco}${has3DStage() ? '<canvas class="stg-cv" id="rs-cv"></canvas>' : `<div class="rs-flat">${avatarSVG(G.user.avatar, '', true)}</div>`}</div>
    <div class="rs-top"><small>랭크 배틀</small><b>${m.won ? (m.streak > 1 ? `${m.streak}연승 중!` : '승리!') : '아쉬운 패배…'}</b></div>
    <div class="rs-panels">
      <section class="rs-p rs-tier" style="--tc:${m.tierColor}"><h3>${m.bonus ? '연승 보너스' : '랭크'}</h3>
        <div class="rs-row"><span class="rs-ico">${m.tierIcon}</span><div><b class="rs-tn">${esc(m.tierName)}</b>${m.up ? '<em class="rs-up">승급!</em>' : ''}<small>${m.pts}점</small></div></div></section>
      <section class="rs-p"><div class="rs-row sp"><span>획득 점수</span><b class="${m.delta >= 0 ? 'plus' : 'minus'}">${m.delta >= 0 ? '+' : ''}${m.delta}점</b></div>
        ${m.bonus ? `<div class="rs-row sp small"><span>연승 보너스</span><b class="plus">+${m.bonus}</b></div>` : ''}</section>
      <section class="rs-p"><div class="rs-row sp small"><span>${m.next ? `${esc(m.next.n)}까지` : '최고 티어'}</span><span>${m.next ? `${m.pts}/${m.next.min}` : '👑'}</span></div><div class="rs-bar"><i style="width:${pct}%"></i></div></section>
      <button class="btn wide" id="rs-ok">확인</button></div>`;
  document.body.appendChild(el);
  let live = null;
  const cv = el.querySelector('#rs-cv');
  if (cv) { live = Avatar3D.mount(cv, G.user.avatar, { facing: .45 }); setTimeout(() => live.play(m.won ? 'cheer' : 'sad', { hold: !m.won }), 450); }
  const close = () => { live?.destroy(); el.remove(); };
  el.querySelector('#rs-ok').onclick = close;
}
