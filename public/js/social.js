'use strict';
/* 친구 · 길드 · 채팅 · 협업 퀘스트 (game2.js, app.js 다음에 불러요) */

const Social = { chats: {}, unread: {}, cur: 'world', view: null };
const timeText = (t) => { const d = new Date(t), now = new Date(); const hm = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' }); return d.toDateString() === now.toDateString() ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`; };
const onlineDot = (p) => `<i class="dot ${p.busy ? 'busy' : p.online ? 'on' : ''}" title="${p.busy ? '대전 중' : p.online ? '접속 중' : '오프라인'}"></i>`;
const unreadTotal = () => Object.values(Social.unread).reduce((a, b) => a + b, 0);
function refreshChatBadge() {
  const n = unreadTotal();
  document.querySelectorAll('[data-chatbadge]').forEach((e) => { e.textContent = n > 99 ? '99+' : n; e.hidden = !n; });
}
async function loadSocial() { const r = await api('GET', '/api/social'); setUser(r); Social.view = r.view; return r.view; }

/* ---------- 실시간 채팅 메시지 (app.js의 ws에서 불러요) ---------- */
function onSocialMsg(m) {
  if (m.t === 'chat') {
    (Social.chats[m.ch] ||= []).push(m.m);
    if (G.screen === 'chat' && Social.cur === m.ch) { drawChatLog(true); return; }
    if (m.m.from && m.m.from !== keyOfMe()) {
      Social.unread[m.ch] = (Social.unread[m.ch] || 0) + 1;
      if (m.ch !== 'world' && G.screen !== 'battle') toast(`💬 ${m.m.name}: ${m.m.text.slice(0, 30)}`);
    }
    refreshChatBadge();
    if (G.screen === 'chat') drawChatTabs();
  } else if (m.t === 'chat_hist') {
    Social.chats[m.ch] = m.list;
    if (G.screen === 'chat' && Social.cur === m.ch) drawChatLog(true);
  } else if (m.t === 'chat_del') {
    Social.chats[m.ch] = (Social.chats[m.ch] || []).filter((x) => x.at !== m.at);
    if (G.screen === 'chat' && Social.cur === m.ch) drawChatLog();
  }
}
const keyOfMe = () => G.user.name.toLowerCase();

/* ---------- 친구 ---------- */
async function showFriends(back = showLobby) {
  G.screen = 'friends'; app.className = '';
  app.innerHTML = `${topbar('친구')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let v; try { v = await loadSocial(); } catch (e) { return toast(e.message); }
  if (G.screen !== 'friends') return;
  const row = (p, btns) => `<div class="fr-row"><div class="ava">${avatarSVG(p.avatar)}</div><div class="fr-name">${onlineDot(p)}<b>${esc(p.name)}</b>${p.guild ? `<small>🏰 ${esc(p.guild)}</small>` : ''}<small>${p.busy ? '대전 중' : p.online ? '접속 중' : '오프라인'}</small></div><div class="fr-btns">${btns}</div></div>`;
  app.innerHTML = `${topbar('친구')}
    <section class="panel">
      <h2>친구 추가</h2>
      <form class="fr-add" id="fr-add"><input name="name" placeholder="친구 이름" maxlength="20" autocomplete="off" required><button class="btn">신청</button></form>
      <p class="muted" style="font-size:13px;margin-top:6px">친구와 1:1 채팅, 바로 대전 신청, 🤝 협업 퀘스트(친구와 같은 팀 태그전·친구 대전)를 할 수 있어요.</p>
    </section>
    ${v.reqIn.length ? `<section class="panel"><h2>받은 신청 <em class="mailbadge">${v.reqIn.length}</em></h2>${v.reqIn.map((p) => row(p, `<button class="btn small" data-acc="${p.key}">수락</button><button class="btn small paper" data-dec="${p.key}">거절</button>`)).join('')}</section>` : ''}
    <section class="panel"><h2>내 친구 <small class="muted">${v.friends.length}명</small></h2>
      ${v.friends.map((p) => row(p, `<button class="btn small" data-dm="${p.key}" title="1:1 채팅">💬</button>${p.online && !p.busy ? `<button class="btn small mint" data-vs="${p.key}" title="대전 신청">⚔️</button>` : ''}<button class="btn small paper" data-rm="${p.key}" title="친구 삭제">✕</button>`)).join('') || '<p class="wait">아직 친구가 없어요. 위에서 이름으로 신청해 보세요!</p>'}
    </section>
    ${v.reqOut.length ? `<section class="panel"><h2>보낸 신청</h2>${v.reqOut.map((p) => row(p, `<button class="btn small paper" data-cancel="${p.key}">취소</button>`)).join('')}</section>` : ''}`;
  app.querySelector('#back').onclick = back;
  const act = async (path, body, msg) => { try { const r = await api('POST', path, body); setUser(r); if (r.msg || msg) toast(r.msg || msg); showFriends(back); } catch (e) { toast(e.message); } };
  app.querySelector('#fr-add').onsubmit = (e) => { e.preventDefault(); act('/api/friend/request', { name: e.target.name.value }); };
  app.querySelectorAll('[data-acc]').forEach((b) => { b.onclick = () => act('/api/friend/accept', { key: b.dataset.acc }); });
  app.querySelectorAll('[data-dec]').forEach((b) => { b.onclick = () => act('/api/friend/decline', { key: b.dataset.dec }, '거절했어요.'); });
  app.querySelectorAll('[data-cancel]').forEach((b) => { b.onclick = () => act('/api/friend/cancel', { key: b.dataset.cancel }, '신청을 취소했어요.'); });
  app.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { if (confirm('친구를 삭제할까요?')) act('/api/friend/remove', { key: b.dataset.rm }, '친구를 삭제했어요.'); }; });
  app.querySelectorAll('[data-dm]').forEach((b) => { b.onclick = () => showChat(`dm:${b.dataset.dm}`, () => showFriends(back)); });
  app.querySelectorAll('[data-vs]').forEach((b) => { b.onclick = () => { wsSend({ t: 'challenge', to: b.dataset.vs, size: G.size || 3 }); toast(`${G.size || 3}대${G.size || 3} 대전을 신청했어요! 로비에서 기다려요.`); showLobby(); }; });
}

/* ---------- 길드 ---------- */
const emblemTag = (g, big) => `<span class="gd-emb${big ? ' big' : ''}" style="--gc:${g.color}">${g.emblem}</span>`;
async function showGuild(back = showLobby) {
  G.screen = 'guild'; app.className = '';
  app.innerHTML = `${topbar('길드')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let v; try { v = await loadSocial(); } catch (e) { return toast(e.message); }
  if (G.screen !== 'guild') return;
  const again = () => showGuild(back);
  const act = async (path, body, after = again) => { try { const r = await api('POST', path, body); setUser(r); if (r.got) showGot(r.got, '협업 퀘스트 보상!', after); else { if (r.msg) toast(r.msg); after(); } } catch (e) { toast(e.message); } };
  if (!v.guild) {
    app.innerHTML = `${topbar('길드')}
      <section class="gd-hero"><s aria-hidden="true"></s><h2>🏰 길드</h2><p>친구들과 길드를 만들어 <b>협업 퀘스트</b>를 함께 깨고, 길드 채팅으로 수다 떨어요!</p></section>
      <section class="panel"><h2>길드 만들기 <small class="muted">${ICON.gp(14)} ${fmt(v.guildGp)} GP</small></h2>
        <form id="gd-new" class="gd-form">
          <input name="name" placeholder="길드 이름 (2~12자)" maxlength="12" required autocomplete="off">
          <input name="intro" placeholder="한 줄 소개 (선택)" maxlength="60" autocomplete="off">
          <div class="gd-pick" data-k="emblem">${v.emblems.map((e, i) => `<button type="button" data-v="${e}" aria-pressed="${!i}">${e}</button>`).join('')}</div>
          <div class="gd-pick colors" data-k="color">${v.colors.map((c, i) => `<button type="button" data-v="${c}" aria-pressed="${i === 6}" style="background:${c}"></button>`).join('')}</div>
          <button class="btn">만들기</button>
        </form></section>
      <section class="panel"><h2>길드 찾기 <small class="muted">${v.guilds.length}개</small></h2>
        ${v.guilds.map((g) => `<div class="gd-row">${emblemTag(g)}<div class="gd-info"><b>${esc(g.name)}</b><small>${esc(g.intro || '소개가 없어요')}</small><small>👑 ${esc(g.leader)} · ${g.count}/${g.max}명 · 접속 ${g.online}명</small></div>
          <button class="btn small" data-join="${g.id}" ${g.count >= g.max ? 'disabled' : ''}>${g.count >= g.max ? '꽉 참' : '가입'}</button></div>`).join('') || '<p class="wait">아직 길드가 없어요. 첫 길드를 만들어 보세요!</p>'}
      </section>`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('.gd-pick').forEach((box) => box.querySelectorAll('button').forEach((b) => { b.onclick = () => { box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }; }));
    app.querySelector('#gd-new').onsubmit = (e) => {
      e.preventDefault();
      const pick = (k) => app.querySelector(`.gd-pick[data-k="${k}"] [aria-pressed="true"]`)?.dataset.v;
      act('/api/guild/create', { name: e.target.name.value, intro: e.target.intro.value, emblem: pick('emblem'), color: pick('color') });
    };
    app.querySelectorAll('[data-join]').forEach((b) => { b.onclick = () => act('/api/guild/join', { id: b.dataset.join }); });
    return;
  }
  const g = v.guild, me = keyOfMe(), lead = g.leader === me, vice = g.vices.includes(me);
  const passCan = g.pass.levels.filter((l) => l.can).length;
  const left = Math.max(0, g.weekEnds - Date.now()), days = Math.floor(left / 864e5), hrs = Math.floor((left % 864e5) / 36e5);
  app.innerHTML = `${topbar('길드')}
    <section class="gd-head" style="--gc:${g.color}"><s aria-hidden="true"></s>${emblemTag(g, true)}<div><h2>${esc(g.name)}</h2><p>${esc(g.intro || '소개가 없어요')}</p><small>${g.members.length}/${g.max}명 · 이번 주 내 기여 ${g.myContrib}판</small></div></section>
    <div class="gd-acts"><button class="btn" id="gd-chat">💬 길드 채팅${Social.unread.guild ? ` <em class="mailbadge">${Social.unread.guild}</em>` : ''}</button>${lead ? '<button class="btn paper" id="gd-edit">✏️ 꾸미기</button>' : ''}<button class="btn paper" id="gd-leave">나가기</button></div>
    <div class="gd-big"><button class="gd-tile pass" id="gd-pass"><span>🎫</span><b>길드 패스</b><small>Lv ${g.pass.lv} / ${g.pass.max}</small>${passCan ? `<em class="mailbadge">${passCan}</em>` : ''}</button>
      <button class="gd-tile shop" id="gd-shop"><span>🛍️</span><b>길드 상점</b><small>${ICON.gpt(14)} ${fmt(g.gpt)} 길P</small></button></div>
    <section class="panel"><h2>🤝 협업 퀘스트 <small class="muted">${days}일 ${hrs}시간 뒤 초기화</small></h2>
      <p class="muted" style="font-size:13px;margin-bottom:6px">길드원 모두의 대전이 합쳐져요. 목표를 채우면 <b>이번 주에 한 판이라도 한 길드원</b>이 각자 보상을 받아요.</p>
      ${g.quests.map((q) => `<div class="quest ${q.got ? 'got' : ''}"><div class="qt"><b>${esc(q.n)}</b>${rewardChips(q.r)}<div class="qbar"><i style="width:${(q.v / q.goal) * 100}%"></i><span>${Math.floor(q.v)} / ${q.goal}</span></div></div>
        <button class="btn small" data-gq="${q.id}" ${q.can ? '' : 'disabled'}>${q.got ? '받음' : q.can ? '받기' : q.done ? '한 판 하면 받기' : '진행 중'}</button></div>`).join('')}
    </section>
    <section class="panel"><h2>길드원</h2>
      ${g.members.map((p) => `<div class="fr-row"><div class="ava">${avatarSVG(p.avatar)}</div><div class="fr-name">${onlineDot(p)}<b>${p.key === g.leader ? '👑 ' : g.vices.includes(p.key) ? '🥈 ' : ''}${esc(p.name)}</b><small>${p.key === g.leader ? '길드장 · ' : g.vices.includes(p.key) ? '부길드장 · ' : ''}이번 주 ${p.contrib}판</small></div>
        <div class="fr-btns">${lead && p.key !== me ? `<button class="btn small ${g.vices.includes(p.key) ? '' : 'paper'}" data-vice="${p.key}" data-on="${g.vices.includes(p.key) ? 0 : 1}" title="${g.vices.includes(p.key) ? '부길드장 해제' : '부길드장 지정'}">🥈</button><button class="btn small paper" data-lead="${p.key}" title="길드장 넘기기">👑</button>` : ''}${(lead && p.key !== me) || (vice && p.key !== me && p.key !== g.leader && !g.vices.includes(p.key)) ? `<button class="btn small paper" data-kick="${p.key}" title="내보내기">✕</button>` : ''}</div></div>`).join('')}
      ${lead ? `<p class="muted" style="font-size:12px;margin-top:6px">🥈 부길드장은 ${g.viceMax}명까지 뽑을 수 있어요. 부길드장은 네온 칭호 「길드 부마」를 받고, 일반 길드원을 내보낼 수 있어요.</p>` : ''}
    </section>`;
  app.querySelector('#back').onclick = back;
  app.querySelector('#gd-chat').onclick = () => showChat('guild', again);
  app.querySelector('#gd-leave').onclick = () => { if (confirm(lead && g.members.length > 1 ? '길드장이 나가면 다음 사람이 길드장이 돼요. 나갈까요?' : '길드에서 나갈까요?')) act('/api/guild/leave', {}); };
  app.querySelectorAll('[data-gq]').forEach((b) => { b.onclick = () => act('/api/guild/claim', { id: b.dataset.gq }); });
  app.querySelectorAll('[data-kick]').forEach((b) => { b.onclick = () => { if (confirm('이 길드원을 내보낼까요?')) act('/api/guild/kick', { key: b.dataset.kick }); }; });
  app.querySelectorAll('[data-vice]').forEach((b) => { b.onclick = () => act('/api/guild/edit', { vice: b.dataset.vice, on: b.dataset.on === '1' }); });
  app.querySelector('#gd-pass').onclick = () => showGuildPass(again);
  app.querySelector('#gd-shop').onclick = () => showGuildShop(again);
  app.querySelectorAll('[data-lead]').forEach((b) => { b.onclick = () => { if (confirm('길드장을 넘길까요?')) act('/api/guild/edit', { leader: b.dataset.lead }); }; });
  app.querySelector('#gd-edit')?.addEventListener('click', () => {
    const bg = openSheet(`<h2>길드 꾸미기</h2><form id="gd-ed" class="gd-form">
      <input name="intro" value="${esc(g.intro || '')}" placeholder="한 줄 소개" maxlength="60">
      <div class="gd-pick" data-k="emblem">${v.emblems.map((e) => `<button type="button" data-v="${e}" aria-pressed="${e === g.emblem}">${e}</button>`).join('')}</div>
      <div class="gd-pick colors" data-k="color">${v.colors.map((c) => `<button type="button" data-v="${c}" aria-pressed="${c === g.color}" style="background:${c}"></button>`).join('')}</div>
      <div class="sc-pay"><button type="button" class="btn paper" data-x>취소</button><button class="btn">저장</button></div></form>`);
    bg.querySelectorAll('.gd-pick').forEach((box) => box.querySelectorAll('button').forEach((b) => { b.onclick = () => box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); }));
    bg.querySelector('[data-x]').onclick = closeSheet;
    bg.querySelector('#gd-ed').onsubmit = (e) => {
      e.preventDefault();
      const pick = (k) => bg.querySelector(`.gd-pick[data-k="${k}"] [aria-pressed="true"]`)?.dataset.v;
      closeSheet(); act('/api/guild/edit', { intro: e.target.intro.value, emblem: pick('emblem'), color: pick('color') });
    };
  });
}

/* ---------- 길드 패스 ---------- */
async function showGuildPass(back) {
  G.screen = 'gpass'; app.className = '';
  let v; try { v = await loadSocial(); } catch (e) { return toast(e.message); }
  if (!v.guild) return showGuild();
  const g = v.guild, P = g.pass, inLv = P.lv >= P.max ? P.per : P.pts % P.per, can = P.levels.filter((l) => l.can).length;
  const again = () => { const y = scrollY; showGuildPass(back); scrollTo(0, y); };
  app.innerHTML = `${topbar('길드 패스')}
    <section class="gp-head" style="--gc:${g.color}"><s aria-hidden="true"></s>
      <div class="gp-top">${emblemTag(g)}<div><b>${esc(g.name)}</b><small>시즌 ${P.season} 길드 패스</small></div><div class="gp-lv"><small>LV</small>${P.lv}</div></div>
      <div class="qbar gp-bar"><i style="width:${P.lv >= P.max ? 100 : (inLv / P.per) * 100}%"></i><span>${P.lv >= P.max ? 'MAX' : `${inLv} / ${P.per}`}</span></div>
      <p>길드원 <b>누구든</b> 대전하면 함께 올라가요. 친구 대전 20·10, 태그전 16·8, 연습전 6·3점 (이김·짐), 협업 퀘스트를 달성하면 +150!</p>
      ${can ? `<button class="btn" id="gp-all">받을 수 있는 보상 ${can}개 모두 받기</button>` : ''}</section>
    <div class="gp-track">${P.levels.map((l) => `<div class="gp-cell ${l.got ? 'got' : l.can ? 'can' : l.lv <= P.lv ? '' : 'lock'}"><span class="gp-n">${l.lv}</span><div class="gp-r">${rewardChips(l.r)}</div>
      ${l.got ? '<em class="st-ok">받음</em>' : l.can ? `<button class="btn small" data-gl="${l.lv}">받기</button>` : '<em class="gp-lock">🔒</em>'}</div>`).join('')}</div>`;
  app.querySelector('#back').onclick = back;
  const claim = async (lv) => { try { const r = await api('POST', '/api/guild/pass', { lv }); setUser(r); showGot(r.got, '길드 패스 보상!', again); } catch (e) { toast(e.message); } };
  app.querySelector('#gp-all')?.addEventListener('click', () => claim('all'));
  app.querySelectorAll('[data-gl]').forEach((b) => { b.onclick = () => claim(Number(b.dataset.gl)); });
}

/* ---------- 길드 상점 (길P) ---------- */
let gshopTab = 'titles';
async function showGuildShop(back) {
  G.screen = 'gshop'; app.className = '';
  let v; try { v = await loadSocial(); } catch (e) { return toast(e.message); }
  if (!v.guild) return showGuild();
  const again = () => { const y = scrollY; showGuildShop(back); scrollTo(0, y); };
  const items = (k) => G.data.COSMETICS[k].filter((x) => x.cond?.[0] === 'gshop'), owned = new Set(G.user.owned || []);
  const roles = G.data.COSMETICS.titles.filter((x) => x.cond?.[0] === 'guild');
  app.innerHTML = `${topbar('길드 상점')}
    <section class="shop-banner gshop-banner"><s aria-hidden="true"></s><h2>길드 상점</h2><p>길드 패스·협업 퀘스트로 모은 <b>길P</b>로만 살 수 있는 특별한 물건!</p></section>
    <div class="tabs sh-tabs">${[['titles', '🏷️ 칭호'], ['cards', '🃏 카드'], ['pins', '📌 핀']].map(([k, n]) => `<button data-gtab="${k}" aria-selected="${gshopTab === k}">${n}</button>`).join('')}</div>
    <div class="sh-grid ${gshopTab}">${items(gshopTab).map((x) => { const have = owned.has(`${gshopTab}:${x.id}`) || G.user.dev; return `<button class="sh-item ${have ? 'have' : ''}" data-gcos="${x.id}" ${have ? 'disabled' : ''}>
      ${cosLook(gshopTab, x)}<b>${gshopTab === 'titles' ? `${TITLE_TIERS[x.tier || 0]} 등급` : esc(x.n)}</b>${have ? '<em class="st-ok">보유</em>' : `<span class="st-price gpt">${ICON.gpt(14)}${fmt(x.cond[1])}</span>`}</button>`; }).join('')}</div>
    ${gshopTab === 'titles' ? `<h3 class="st-h">길드 직책 칭호 <small>사지 않아도 직책이 있으면 열려요</small></h3>
    <div class="sh-grid titles">${roles.map((x) => `<div class="sh-item ${unlocked(G.user, x) ? 'have' : ''}">${cosLook('titles', x)}<b>${TITLE_TIERS[x.tier]} 등급</b><em class="${unlocked(G.user, x) ? 'st-ok' : 'st-no'}">${{ master: '길드장', vice: '부길드장', member: '길드원 모두' }[x.cond[1]]}</em></div>`).join('')}</div>` : ''}`;
  app.querySelector('#back').onclick = back;
  app.querySelectorAll('[data-gtab]').forEach((b) => { b.onclick = () => { gshopTab = b.dataset.gtab; again(); }; });
  app.querySelectorAll('[data-gcos]').forEach((b) => { b.onclick = () => buyCosSheet(gshopTab, items(gshopTab).find((x) => x.id === b.dataset.gcos), again, { have: G.user.gpt || 0, icon: ICON.gpt, unit: '길P', path: '/api/guild/shop' }); });
}

/* ---------- 채팅 ---------- */
let chatBack = null;
async function showChat(ch = Social.cur, back) {
  if (back) chatBack = back;
  G.screen = 'chat'; app.className = 'chat-mode';
  Social.cur = ch;
  if (!Social.view) { try { await loadSocial(); } catch {} }
  app.innerHTML = `${topbar('채팅')}
    <div class="ch-tabs" id="ch-tabs"></div>
    <section class="ch-box"><div class="ch-log" id="ch-log"></div>
      <form class="ch-in" id="ch-in"><input name="t" maxlength="200" placeholder="메시지 보내기" autocomplete="off" enterkeyhint="send"><button class="btn">보내기</button></form></section>
    <p class="muted ch-rule">서로 기분 좋게! 욕설·도배·개인정보(전화번호, 주소)는 올리지 말아 주세요.</p>`;
  app.querySelector('#back').onclick = () => { app.className = ''; (chatBack || showLobby)(); };
  drawChatTabs();
  Social.chats[ch] = Social.chats[ch] || [];
  drawChatLog(true);
  wsSend({ t: 'chat_hist', ch });
  const f = app.querySelector('#ch-in');
  f.onsubmit = (e) => { e.preventDefault(); const t = f.t.value.trim(); if (!t) return; wsSend({ t: 'chat', ch: Social.cur, text: t }); f.t.value = ''; f.t.focus(); };
}
function drawChatTabs() {
  const box = document.getElementById('ch-tabs'); if (!box) return;
  const v = Social.view || { friends: [] };
  const tabs = [['world', '🌏 전체'], ...(G.user.guild ? [['guild', `${G.user.guild.emblem} 길드`]] : []),
    ...v.friends.map((f) => [`dm:${f.key}`, `${f.online ? '🟢' : '⚪'} ${f.name}`])];
  if (Social.cur.startsWith('dm:') && !tabs.some(([k]) => k === Social.cur)) tabs.push([Social.cur, `💬 ${Social.cur.slice(3)}`]);
  box.innerHTML = tabs.map(([k, n]) => `<button data-ch="${esc(k)}" aria-selected="${k === Social.cur}">${esc(n)}${Social.unread[k] ? `<em class="mailbadge">${Social.unread[k]}</em>` : ''}</button>`).join('')
    + (G.user.guild ? '' : '<button data-goguild class="ch-hint">🏰 길드 찾기</button>');
  box.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => showChat(b.dataset.ch); });
  box.querySelector('[data-goguild]')?.addEventListener('click', () => { app.className = ''; showGuild(() => showChat()); });
  box.querySelector('[aria-selected="true"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' });
}
function drawChatLog(stick) {
  const log = document.getElementById('ch-log'); if (!log) return;
  const ch = Social.cur, list = Social.chats[ch] || [], me = keyOfMe();
  if (Social.unread[ch]) { Social.unread[ch] = 0; drawChatTabs(); }
  refreshChatBadge();
  const near = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  log.innerHTML = list.length ? list.map((m) => m.sys ? `<p class="ch-sys">${esc(m.text)}</p>` : `<div class="ch-msg ${m.from === me ? 'me' : ''}">
      ${m.from === me ? '' : `<div class="ava">${avatarSVG(m.avatar)}</div>`}
      <div class="ch-b">${m.from === me ? '' : `<span class="ch-who">${m.guild ? `${m.guild} ` : ''}<b>${esc(m.name)}</b>${m.title ? ` ${titleTag(m.title, 'mini')}` : ''}</span>`}
        <p>${esc(m.text)}</p><time>${timeText(m.at)}${G.user.dev && ch === 'world' ? ` <button class="ch-del" data-del="${m.at}" title="지우기">🗑</button>` : ''}</time></div></div>`).join('')
    : `<p class="wait">${ch === 'world' ? '아직 아무도 말하지 않았어요. 첫 인사를 남겨 보세요! 👋' : ch === 'guild' ? '길드 채팅방이에요. 반갑게 인사해요!' : '친구와의 1:1 채팅방이에요.'}</p>`;
  if (stick || near) log.scrollTop = log.scrollHeight;
  log.querySelectorAll('[data-del]').forEach((b) => { b.onclick = async () => { try { await api('POST', '/api/chat/delete', { ch: 'world', at: Number(b.dataset.del) }); } catch (e) { toast(e.message); } }; });
}
