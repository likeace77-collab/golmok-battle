'use strict';
/* 🎉 친구 초대 · 🌱 뉴비 7일 연속 출석 */
const giftLine = (r) => [r.gp && `${fmt(r.gp)}GP`, r.tickets && `입수권 ${r.tickets}`, r.rerolls && `리롤권 ${r.rerolls}`, r.skips && `스킵권 ${r.skips}`, r.coins && `도박코인 ${r.coins}`, r.box && `${{ c: '일반', r: '희귀', l: '전설' }[r.box]} 상자${r.boxN > 1 ? ` ×${r.boxN}` : ''}`, r.mon && '✨이로치 골목몬', r.title && '칭호 「골목 새싹 졸업」'].filter(Boolean).join(' · ');

// 로비 위쪽 띠: 뉴비 출석 (+ 가입 때 추천 선물 안내)
function rookieBanner() {
  if (G.refWelcome && G.user.tutorial) {
    const w = G.refWelcome; G.refWelcome = null;
    if (w.error) toast(`추천인: ${w.error} (친구 초대 화면에서 다시 넣을 수 있어요)`);
    else setTimeout(() => showGot(w.got, `🎉 ${w.name}님의 초대로 온 환영 선물!`), 600);
  }
  const r = G.user.rookie; if (!r) return;
  const panel = app.querySelector('.panel'); if (!panel || app.querySelector('.rk-band')) return;
  const b = document.createElement('button'); b.className = `rk-band${r.can ? ' can' : ''}`;
  b.innerHTML = `<span>🌱</span><div><b>뉴비 7일 연속 출석 ${r.can ? r.next - 1 : r.streak}/7</b><small>${r.can ? `오늘 ${r.next}일째 선물 받기!${r.next === 7 ? ' 🎉 막대한 선물!' : ''}` : '내일 또 와요! 7일째엔 막대한 선물'}</small></div><i>${Array.from({ length: 7 }, (_, i) => `<em class="${i < (r.can ? r.next - 1 : r.streak) ? 'on' : ''}${i === 6 ? ' big' : ''}"></em>`).join('')}</i>`;
  b.onclick = () => showRookie();
  panel.before(b);
}
async function showRookie() {
  let r; try { r = (await api('GET', '/api/rookie')).rookie; } catch (e) { return toast(e.message); }
  const filled = r.can ? r.next - 1 : r.streak;
  const bg = openSheet(`<div class="rk-sheet"><h2>🌱 뉴비 7일 연속 출석</h2>
    <p class="muted">가입하고 ${30}일 안에, 하루도 빠짐없이 7일 접속하면 7일째에 <b>막대한 선물</b>! 하루라도 빠지면 1일째부터 다시 (이미 받은 날 선물은 다시 안 줘요). 남은 기간 ${r.left}일</p>
    <div class="rk-days">${r.list.map((x, i) => `<div class="rk-d${i < filled ? ' on' : ''}${r.can && i === r.next - 1 ? ' today' : ''}${i === 6 ? ' big' : ''}"><b>${i + 1}일째</b><span>${i === 6 ? '🎁👑' : i < filled || r.got.includes(i + 1) ? '✅' : '🎁'}</span><small>${giftLine(x)}</small></div>`).join('')}</div>
    <div class="row" style="gap:6px"><button class="btn wide" data-go ${r.can ? '' : 'disabled'}>${r.can ? `🎁 ${r.next}일째 선물 받기` : r.done ? '🎉 완주했어요!' : '오늘은 받았어요. 내일 또!'}</button></div></div>`);
  bg.querySelector('[data-go]').onclick = async () => {
    try {
      const x = await api('POST', '/api/rookie/claim'); setUser(x); closeSheet();
      if (x.day >= 7) { fxBurst(document.body, { chars: ['🎉', '✦', '👑', '🌱'], colors: ['#FFD23F', '#7fe07f'], n: 40, spread: 260, size: [18, 34], dur: 1800 }); try { CasSfx.big(); } catch { /* */ } }
      if (x.got.length) showGot(x.got, x.day >= 7 ? '🌱 7일 연속 출석 완주!! 막대한 선물!' : `🌱 뉴비 출석 ${x.day}일째!`); else toast(`🌱 ${x.day}일째! (이 날 선물은 전에 받았어요)`);
      if (G.screen === 'lobby') showLobby();
    } catch (e) { toast(e.message); }
  };
}

/* 🎉 친구 초대 화면 */
async function showInvite(back = showLobby) {
  G.screen = 'invite'; app.className = '';
  app.innerHTML = `${topbar('🎉 친구 초대')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = () => back();
  let v; try { const r = await api('GET', '/api/invite'); v = r.invite; const before = G.user.gp; setUser(r); if (G.user.gp > before) toast('🎁 밀려 있던 초대 선물을 받았어요!'); } catch (e) { return toast(e.message); }
  if (G.screen !== 'invite') return;
  const link = `${location.origin}/?ref=${encodeURIComponent(v.code)}`;
  app.innerHTML = `${topbar('🎉 친구 초대')}
    <section class="fz-hero iv-hero"><h2>친구를 골목으로 데려오세요!</h2>
      <p>친구가 가입할 때 <b>추천인 아이디</b>에 내 아이디 <b class="iv-code">${esc(v.code)}</b>를 넣으면</p>
      <ul class="iv-ul"><li>🎁 <b>친구</b>: 바로 ${giftLine(v.newbie)} · 일반 상자 2개</li><li>🎁 <b>나</b>: 친구가 대전 ${v.games}판을 하면 ${giftLine(v.friend)} · 희귀 상자 1개 (${v.max}명까지)</li><li>🎉 ${v.titleAt}명을 데려오면 칭호 「골목 마당발」</li><li>🌱 새로 온 친구는 7일 연속 접속하면 막대한 선물도!</li></ul>
      <div class="rp-link"><input readonly value="${esc(link)}"><button class="btn small" id="iv-copy">🔗 초대 링크 복사</button></div>
      <p style="font-size:12px;opacity:.85">링크로 들어오면 추천인 칸이 자동으로 채워져요.</p></section>
    ${v.canSet ? `<section class="panel"><h2>나를 초대한 친구가 있나요?</h2><p class="muted">가입 3일 안이면 지금 넣어도 선물을 받아요. 한 번만 넣을 수 있어요.</p><div class="rp-link"><input id="iv-ref" maxlength="12" placeholder="친구 아이디"><button class="btn small" id="iv-set">넣기</button></div></section>`
      : v.refBy ? `<section class="panel"><p>나를 초대한 친구: <b>${esc(v.refBy)}</b> 🤝</p></section>` : ''}
    <section class="panel"><h2>내가 초대한 친구 ${v.invited.length}명 <small class="muted">선물 받음 ${v.rewarded}명</small></h2>
      ${v.invited.map((x) => `<div class="iv-row"><b>${esc(x.name)}</b><small>${dateStr(x.at)}</small><span class="${x.done ? 'ok' : ''}">${x.done ? '🎁 선물 받음' : `대전 ${x.games}/${v.games}판`}</span></div>`).join('') || '<p class="muted">아직 없어요. 링크를 보내 보세요!</p>'}</section>`;
  app.querySelector('#back').onclick = () => back();
  app.querySelector('#iv-copy').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('🔗 초대 링크를 복사했어요!'); } catch { app.querySelector('.rp-link input').select(); toast('링크를 길게 눌러 복사해 주세요.'); } };
  app.querySelector('#iv-set')?.addEventListener('click', async () => {
    try { const r = await api('POST', '/api/invite/set', { name: app.querySelector('#iv-ref').value.trim() }); setUser(r); showGot(r.got, `🎉 ${r.ref}님의 초대 선물!`); showInvite(back); } catch (e) { toast(e.message); }
  });
}
