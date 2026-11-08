// 화면 전환, 로그인, 로비, 아바타, 팀 편성
const app = document.getElementById('app');
const sheetRoot = document.getElementById('sheet-root');
const BOT_LEVELS = [
  ['쉬움', '기술을 아무거나 쓰고 교체도 메가진화도 안 합니다.'],
  ['보통', '상성을 보고 싸우고, 메가진화도 씁니다.'],
  ['어려움', '위험하면 교체하고, 보조 기술과 메가진화를 잘 씁니다.'],
  ['지옥', '내 덱을 보고 팀을 짜고, 내 기술까지 알고 싸웁니다.'],
];
function savedLevel() { try { const v = +localStorage.getItem('botLevel'); return localStorage.getItem('botLevel') !== null && BOT_LEVELS[v] ? v : 1; } catch { return 1; } }
const G = { botLevel: savedLevel(), data: null, user: null, ws: null, lobby: { players: [], incoming: [], outgoing: null }, size: 3, screen: 'auth' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

async function api(method, url, body) {
  const r = await fetch(url, {
    method, headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || '서버에 연결할 수 없습니다.'), { status: r.status });
  return j;
}

const typeChip = (t) => `<span class="type t-${t}" style="background:${G.data.TYPES[t].c}">${G.data.TYPES[t].n}</span>`;
const typesOf = (id) => G.data.MONSTERS[id].types.map(typeChip).join('');

/* ---------- 시작 화면 ---------- */
function showAuth(mode = 'login') {
  G.screen = 'auth';
  app.className = '';
  const signup = mode === 'signup';
  app.innerHTML = `<div class="auth">
    <h1 class="title">골목대전</h1>
    <div class="lineup">${['kkaebi', 'bungbbang', 'jangdok', 'bongdari'].map((m) => monsterSVG(m)).join('')}</div>
    <form class="panel" id="f">
      <div class="tabs" role="tablist">
        <button type="button" role="tab" aria-selected="${!signup}" data-m="login">로그인</button>
        <button type="button" role="tab" aria-selected="${signup}" data-m="signup">계정 만들기</button>
      </div>
      <label class="field">아이디<input name="name" autocomplete="username" required maxlength="12"></label>
      <label class="field">비밀번호<input name="password" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" required></label>
      ${signup ? `<label class="field">태어난 해<input name="birthYear" type="number" inputmode="numeric" min="1900" max="${new Date().getFullYear()}" placeholder="예: 1998" required></label>
        <p class="muted" style="margin:-4px 0 10px;font-size:13px">19세 이하는 일부 캐릭터 의상이 모자이크로 보입니다. 나중에 바꿀 수 없어요.</p>` : ''}
      ${signup && G.data.inviteRequired ? '<label class="field">초대 코드<input name="invite" required></label>' : ''}
      <p class="err" id="err"></p>
      <button class="btn wide">${signup ? '계정 만들기' : '로그인'}</button>
    </form></div>`;
  app.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => showAuth(b.dataset.m); });
  app.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      if (body.birthYear) body.birthYear = Number(body.birthYear);
      const { user } = await api('POST', signup ? '/api/signup' : '/api/login', body);
      G.user = user; enterGame();
    } catch (err) { app.querySelector('#err').textContent = err.message; }
  };
}

// 로그인 뒤: 나이를 안 정한 계정은 나이 설정부터
function enterGame() {
  if (G.user.needAge) return showAgeGate();
  connect(); showLobby();
}

function showAgeGate() {
  G.screen = 'age';
  app.className = '';
  const y = new Date().getFullYear();
  app.innerHTML = `<div class="auth">
    <h1 class="title">골목대전</h1>
    <form class="panel" id="af">
      <h2>나이 설정</h2>
      <p style="margin-bottom:10px">게임을 계속하려면 태어난 해를 설정해야 합니다. 19세 이하는 루미나, 실비아의 의상이 모자이크로 보입니다.</p>
      <label class="field">태어난 해<input name="birthYear" type="number" inputmode="numeric" min="1900" max="${y}" placeholder="예: 1998" required></label>
      <p class="muted" style="margin:-4px 0 10px;font-size:13px">한 번 설정하면 바꿀 수 없어요.</p>
      <p class="err" id="err"></p>
      <button class="btn wide">설정하고 시작하기</button>
      <button type="button" class="btn paper wide" id="out" style="margin-top:8px">로그아웃</button>
    </form></div>`;
  app.querySelector('#af').onsubmit = async (e) => {
    e.preventDefault();
    const birthYear = Number(new FormData(e.target).get('birthYear'));
    try { G.user = (await api('PUT', '/api/age', { birthYear })).user; enterGame(); }
    catch (err) { app.querySelector('#err').textContent = err.message; }
  };
  app.querySelector('#out').onclick = async () => { await api('POST', '/api/logout').catch(() => {}); G.user = null; showAuth(); };
}

// 우편함: 운영팀 우편과 보상
async function showMail() {
  G.screen = 'mail';
  app.innerHTML = '<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>우편함</h1></div><p class="wait">불러오는 중...</p>';
  app.querySelector('#back').onclick = showLobby;
  let mail = [];
  try { mail = (await api('GET', '/api/mail')).mail; } catch (e) { toast(e.message); return; }
  const kindName = { titles: '칭호', cards: '전투카드', pins: '핀' };
  const preview = (r) => (r.kind === 'titles' ? titleTag(r.id) : r.kind === 'pins' ? `<span class="cpin">${pinSVG(r.id)}</span>` : `<span class="cswatch bc-${r.id}"></span>`);
  const render = (open = null) => {
    if (G.screen !== 'mail') return;
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>우편함</h1></div>
      ${mail.length ? mail.map((m) => `<section class="panel mail ${m.read ? '' : 'unread'} ${open === m.id ? 'open' : ''}" data-mail="${m.id}">
        <div class="mail-head"><span class="mail-ico">${m.claimed ? '✉' : '🎁'}</span>
          <div><b>${esc(m.title)}</b><small>${esc(m.from)} · ${new Date(m.at).toLocaleDateString('ko-KR')}</small></div>
          ${!m.claimed ? '<em class="mail-new">보상</em>' : !m.read ? '<em class="mail-new">새 우편</em>' : ''}</div>
        ${open === m.id ? `<p class="mail-body">${esc(m.body)}</p>
          ${m.reward.length ? `<div class="mail-reward">${m.reward.map((r) => `<div class="mr">${preview(r)}<small>${kindName[r.kind]} · ${esc(r.n)}</small></div>`).join('')}</div>` : ''}
          ${m.reward.length ? `<button class="btn wide ${m.claimed ? 'paper' : ''}" data-claim="${m.id}" ${m.claimed ? 'disabled' : ''}>${m.claimed ? '받음' : '받기'}</button>` : ''}` : ''}
      </section>`).join('') : '<section class="panel"><p class="muted">우편이 없습니다.</p></section>'}`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-mail]').forEach((el) => {
      el.querySelector('.mail-head').onclick = async () => {
        const id = el.dataset.mail;
        render(open === id ? null : id);
        const m = mail.find((x) => x.id === id);
        if (!m.read) { try { const r = await api('POST', '/api/mail/read', { id }); mail = r.mail; G.user = r.user; render(id); } catch { /* 다음에 다시 */ } }
      };
    });
    app.querySelectorAll('[data-claim]').forEach((b) => {
      b.onclick = async () => {
        try {
          const r = await api('POST', '/api/mail/claim', { id: b.dataset.claim });
          mail = r.mail; G.user = r.user;
          render(b.dataset.claim);
          if (r.got.length) showGift(r.got);
        } catch (e) { toast(e.message); }
      };
    });
  };
  render();
}

// 보상 받는 연출
function showGift(items) {
  const el = document.createElement('div');
  el.className = 'gift-pop';
  el.innerHTML = `<div class="gift-card"><p class="gift-kick">획득!</p>${items.map((r) => `<div class="gift-item">${r.kind === 'titles' ? titleTag(r.id) : r.n}</div>`).join('')}
    <p class="muted" style="color:#fff">꾸미기에서 장착할 수 있어요.</p><button class="btn" id="gift-ok">확인</button></div>`;
  document.body.appendChild(el);
  el.querySelector('#gift-ok').onclick = () => el.remove();
}

function showSettings() {
  G.screen = 'settings';
  const u = G.user, age = new Date().getFullYear() - u.birthYear;
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>설정</h1></div>
    <section class="panel">
      <h2>나이</h2>
      <p>태어난 해 <b>${u.birthYear}</b> (${age}세)</p>
      <p class="muted" style="font-size:13px">나이는 한 번만 설정할 수 있습니다.</p>
    </section>
    <section class="panel">
      <h2>캐릭터 모자이크</h2>
      ${u.adult ? `<label class="toggle"><input type="checkbox" id="mosaic" ${u.settings.mosaic ? 'checked' : ''}> 루미나, 실비아 의상에 모자이크 켜기</label>
        <p class="muted" style="font-size:13px;margin-top:6px">켜면 성인 계정도 모자이크로 보입니다.</p>`
        : '<p>19세 이하 계정이라 루미나, 실비아의 의상이 모자이크로 보입니다.</p>'}
    </section>`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelector('#mosaic')?.addEventListener('change', async (e) => {
    try { G.user = (await api('PUT', '/api/settings', { mosaic: e.target.checked })).user; toast(e.target.checked ? '모자이크를 켰습니다.' : '모자이크를 껐습니다.'); }
    catch (err) { toast(err.message); }
  });
}

/* ---------- 실시간 연결 ---------- */
let reconnectDelay = 500;
function connect() {
  if (G.ws && G.ws.readyState <= 1) return;
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
  G.ws = ws;
  ws.onopen = () => { reconnectDelay = 500; };
  ws.onmessage = (e) => onServer(JSON.parse(e.data));
  ws.onclose = (e) => {
    if (e.code === 4000) { toast('다른 곳에서 접속해 이 연결을 닫았습니다.'); return; }
    if (!G.user) return;
    setTimeout(connect, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 8000);
  };
}
const wsSend = (msg) => { if (G.ws?.readyState === 1) G.ws.send(JSON.stringify(msg)); };

function onServer(m) {
  switch (m.t) {
    case 'lobby':
      if (G.screen !== 'lobby' && G.screen !== 'battle' && m.incoming.length > G.lobby.incoming.length) toast(`${m.incoming.at(-1).name}님이 대전을 신청했습니다. 로비에서 받을 수 있습니다.`);
      G.lobby = m;
      if (G.screen === 'lobby') renderLobby();
      break;
    case 'toast': toast(m.text); break;
    case 'me': G.user = m.user; if (G.screen === 'lobby') renderLobby(); break;
    case 'no_battle': Battle.onNoBattle(); break;
    case 'battle': Battle.enter(m); break;
    case 'turn': Battle.onTurn(m); break;
    case 'chosen': Battle.onChosen(m); break;
    case 'opp_ready': Battle.setNote('상대가 행동을 골랐습니다.'); break;
    case 'opp_conn': Battle.setNote(m.online ? `${m.name}님이 돌아왔습니다.` : `${m.name}님이 나갔습니다. ${m.grace}초 안에 돌아오지 않으면 ${m.tag ? '골목대장이 자리를 맡습니다' : '승리합니다'}.`); break;
    case 'kicked': if (m.text) toast(m.text); Battle.exit(); break;
    case 'need_age': G.user.needAge = true; showAgeGate(); break;
    default:
  }
}

/* ---------- 로비 ---------- */
function liveHTML(L) {
  const list = (L.live || []);
  return `<section class="panel"><h2>진행 중인 대전</h2>
    ${list.length ? list.map((r) => `<div class="player"><div class="nm">${r.names.map(esc).join(r.tag ? ', ' : ' 대 ')}
      <small>${r.tag ? '태그 2대2' : r.training ? '훈련장' : r.practice ? '연습전' : '1대1'}${r.watchers ? `, ${r.watchers}명 관전 중` : ''}</small></div>
      <button class="btn small" data-watch="${esc(r.id)}" ${r.names.includes(G.user.name) ? 'disabled' : ''}>관전</button></div>`).join('')
      : '<p class="muted">지금 진행 중인 대전이 없습니다.</p>'}</section>`;
}

function tagSlot(room, seat, mine) {
  const p = room.slots[seat];
  if (p) return `<div class="tslot"><div class="ava">${avatarSVG(p.avatar)}</div><span>${esc(p.name)}${room.host === p.key ? ' (방장)' : ''}</span></div>`;
  return `<button class="tslot empty" data-room="${esc(room.id)}" data-seat="${seat}">${mine ? '여기로 이동' : '참가'}<small>비우면 골목대장</small></button>`;
}

function tagHTML(L) {
  const me = G.user.name.toLowerCase();
  const rooms = L.tags || [];
  const mine = rooms.find((r) => r.slots.some((p) => p?.key === me));
  if (mine) {
    const host = mine.host === me;
    return `<section class="panel"><h2>태그 2대2 방</h2>
      <div class="tteams">
        <div><b>1팀</b>${tagSlot(mine, 0, true)}${tagSlot(mine, 1, true)}</div>
        <div><b>2팀</b>${tagSlot(mine, 2, true)}${tagSlot(mine, 3, true)}</div>
      </div>
      <p class="muted" style="margin:8px 0 4px">빈자리 골목대장 난이도</p>
      <div class="seg levels">${BOT_LEVELS.map(([n], i) => `<button data-tlevel="${i}" aria-pressed="${mine.level === i}" ${host ? '' : 'disabled'}>${n}</button>`).join('')}</div>
      <p class="muted" style="margin:6px 0 10px">각자 사용할 덱의 앞 3마리가 나갑니다.</p>
      <div class="row">
        <button class="btn paper" id="tag-leave">방 나가기</button>
        <button class="btn mint" id="tag-start" style="flex:1" ${host ? '' : 'disabled'}>${host ? '대전 시작' : '방장을 기다리는 중'}</button>
      </div></section>`;
  }
  return `<section class="panel"><h2>태그 2대2</h2>
    ${rooms.map((r) => `<div class="troom"><p class="muted">${r.slots.filter(Boolean).map((p) => esc(p.name)).join(', ')}의 방</p>
      <div class="tteams">
        <div><b>1팀</b>${tagSlot(r, 0)}${tagSlot(r, 1)}</div>
        <div><b>2팀</b>${tagSlot(r, 2)}${tagSlot(r, 3)}</div>
      </div></div>`).join('')}
    <button class="btn wide" id="tag-new">태그 방 만들기</button></section>`;
}

function showLobby() { G.screen = 'lobby'; app.className = ''; closeSheet(); renderLobby(); }

function renderLobby() {
  const u = G.user, L = G.lobby;
  const others = L.players.filter((p) => p.name !== u.name);
  const rival = Object.entries(u.h2h || {}).map(([n, r]) => `${esc(n)}: ${r.w}승 ${r.l}패${r.d ? ` ${r.d}무` : ''}`).join(', ');
  app.innerHTML = `
    ${L.incoming.map((c) => `<div class="notice"><b>${esc(c.name)}님의 ${c.size}대${c.size} 대전 신청</b>
      <p style="margin-bottom:8px">내 덱: ${esc(u.decks[u.active].name)}</p>
      <div class="row"><button class="btn mint" data-acc="${esc(c.from)}">받기</button><button class="btn paper" data-dec="${esc(c.from)}">거절</button></div></div>`).join('')}
    <section class="panel">
      <div class="profile">
        ${battleCard({ name: u.name, avatar: u.avatar, style: u.style }, 'big')}
        <p class="muted">${recordText(u)}${u.stats?.streak > 1 ? `, ${u.stats.streak}연승 중` : ''}</p>
        ${rival ? `<p class="muted">${rival}</p>` : ''}
      </div>
      <div class="nav">
        <button class="btn paper" id="go-team">덱 관리</button>
        <button class="btn paper" id="go-ava">꾸미기</button>
        <button class="btn mint" id="go-dex">도감</button>
        <button class="btn paper" id="go-types">타입 상성표</button>
        <button class="btn paper" id="go-players">플레이어 목록</button>
        <button class="btn paper mailbtn" id="go-mail">우편함${u.mailNew ? `<em class="mailbadge">${u.mailNew}</em>` : ''}</button>
        <button class="btn paper" id="go-settings">설정</button>
      </div>
    </section>
    <section class="panel">
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <h2 style="margin:0">대전 인원</h2>
        <div class="seg">
          ${[3, 6].map((n) => `<button data-size="${n}" aria-pressed="${G.size === n}">${n}대${n}</button>`).join('')}
        </div>
      </div>
      <h2 style="margin-top:12px">사용할 덱</h2>
      <div class="chips deckpick">${u.decks.map((d, i) => `<button data-deck="${i}" aria-pressed="${i === u.active}">${esc(d.name)}</button>`).join('')}</div>
      <div class="mini big">${u.decks[u.active].team.map((m, i) => `<span class="${i < G.size ? '' : 'off'}">${monsterSVG(m.species)}</span>`).join('')}</div>
      <p class="muted">덱 앞에서부터 ${G.size}마리가 나갑니다. 대전 전에 상대 덱을 보고 먼저 낼 요괴를 고릅니다.</p>
    </section>
    <section class="panel">
      <h2>접속 중인 친구</h2>
      ${others.length ? others.map((p) => {
        const out = L.outgoing?.to === p.key;
        return `<div class="player"><div class="ava">${avatarSVG(p.avatar)}</div>
          <div class="nm">${p.style ? `<span class="ptitle">${titleTag(p.style.title)}</span>` : ''}${esc(p.name)}<small>${p.busy ? '대전 중' : `${p.wins}승 ${p.losses}패`}</small></div>
          ${out ? '<button class="btn small paper" data-cancel>신청 취소</button>'
            : `<button class="btn small" data-ch="${esc(p.key)}" ${p.busy ? 'disabled' : ''}>대전 신청</button>`}
        </div>`;
      }).join('') : '<p class="muted">아직 아무도 없습니다. 친구에게 이 주소를 보내세요.</p>'}
    </section>
    ${liveHTML(L)}
    ${tagHTML(L)}
    <section class="panel">
      <h2>혼자 연습</h2>
      <div class="seg levels">${BOT_LEVELS.map(([n], i) => `<button data-level="${i}" aria-pressed="${G.botLevel === i}">${n}</button>`).join('')}</div>
      <p class="muted" style="margin:6px 0 10px">${BOT_LEVELS[G.botLevel][1]}</p>
      <button class="btn wide mint" id="go-bot">골목대장(${BOT_LEVELS[G.botLevel][0]})과 ${G.size}대${G.size}</button>
    </section>
    <section class="panel train-card">
      <h2>훈련장</h2>
      <p class="muted" style="margin-bottom:10px">체력 1000, 타입 없는 더미를 마음껏 때려 보세요. 모든 요괴로 바꿀 수 있고 기술 10개를 전부 쓸 수 있습니다. 준 피해가 쌓이면 훈련장 칭호, 전투카드, 핀이 열립니다.</p>
      <p class="muted" style="margin-bottom:10px">누적 피해 <b>${(u.stats?.dummyDmg || 0).toLocaleString('ko-KR')}</b>, 한 턴 최고 <b>${(u.stats?.dummyBest || 0).toLocaleString('ko-KR')}</b></p>
      <button class="btn wide" id="go-train">훈련장 들어가기</button>
    </section>
    <p style="text-align:center;margin-top:16px"><button class="btn small paper" id="logout">로그아웃</button></p>`;
  app.querySelector('#go-team').onclick = showDecks;
  app.querySelectorAll('[data-watch]').forEach((b) => { b.onclick = () => wsSend({ t: 'spectate', id: b.dataset.watch }); });
  app.querySelector('#tag-new')?.addEventListener('click', () => wsSend({ t: 'tag_create' }));
  app.querySelector('#tag-leave')?.addEventListener('click', () => wsSend({ t: 'tag_leave' }));
  app.querySelector('#tag-start')?.addEventListener('click', () => wsSend({ t: 'tag_start' }));
  app.querySelectorAll('[data-seat]').forEach((b) => { b.onclick = () => wsSend({ t: 'tag_seat', id: b.dataset.room, seat: +b.dataset.seat }); });
  app.querySelectorAll('[data-tlevel]').forEach((b) => { b.onclick = () => wsSend({ t: 'tag_level', level: +b.dataset.tlevel }); });
  app.querySelector('#go-ava').onclick = showAvatar;
  app.querySelector('#go-dex').onclick = showDex;
  app.querySelector('#go-types').onclick = showTypeChart;
  app.querySelector('#go-players').onclick = showPlayers;
  app.querySelector('#go-settings').onclick = showSettings;
  app.querySelector('#go-mail').onclick = showMail;
  app.querySelector('#go-bot').onclick = () => wsSend({ t: 'practice', size: G.size, level: G.botLevel });
  app.querySelector('#go-train').onclick = () => wsSend({ t: 'training' });
  app.querySelectorAll('[data-level]').forEach((b) => {
    b.onclick = () => {
      G.botLevel = +b.dataset.level;
      try { localStorage.setItem('botLevel', G.botLevel); } catch { /* 저장 못 해도 이번 접속에는 적용 */ }
      renderLobby();
    };
  });
  app.querySelector('#logout').onclick = async () => {
    await api('POST', '/api/logout'); G.user = null; G.ws?.close(); showAuth();
  };
  app.querySelectorAll('[data-size]').forEach((b) => { b.onclick = () => { G.size = +b.dataset.size; renderLobby(); }; });
  app.querySelectorAll('[data-deck]').forEach((b) => {
    b.onclick = async () => {
      try { await saveDecks(cloneDecks(), +b.dataset.deck); renderLobby(); } catch (e) { toast(e.message); }
    };
  });
  app.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => wsSend({ t: 'challenge', to: b.dataset.ch, size: G.size }); });
  app.querySelectorAll('[data-cancel]').forEach((b) => { b.onclick = () => wsSend({ t: 'cancel' }); });
  app.querySelectorAll('[data-acc]').forEach((b) => { b.onclick = () => wsSend({ t: 'accept', from: b.dataset.acc }); });
  app.querySelectorAll('[data-dec]').forEach((b) => { b.onclick = () => wsSend({ t: 'decline', from: b.dataset.dec }); });
}

/* ---------- 꾸미기 ---------- */
function condText(item) {
  if (!item.cond) return '처음부터 사용 가능';
  if (item.cond[0] === 'dev') return '개발자 계정 전용';
  if (item.cond[0] === 'gift') return '우편 보상으로 받은 아이템';
  const [k, n] = item.cond;
  const dmg = k.startsWith('dummy'), f = (x) => x.toLocaleString('ko-KR');
  return `${G.data.STAT_NAMES[k]} ${f(n)}${k === 'streakBest' ? '연승' : dmg ? '' : '회'} (${f(Math.min(statOf(G.user, k), n))}/${f(n)})`;
}

function showAvatar() {
  G.screen = 'avatar';
  const draft = { ...G.user.avatar };
  const style = { ...G.user.style, pins: [...(G.user.style.pins || [])] };
  let tab = 'avatar', cat = 'hair';
  const cats = AVATAR_ORDER.filter((k) => G.data.AVATAR_OPTIONS[k]);
  let live = null;
  const render = () => {
    const me = { name: G.user.name, avatar: draft, style, record: recordText(G.user) };
    let body = '';
    if (tab === 'avatar') {
      const n = G.data.AVATAR_OPTIONS[cat], sw = AVATAR_SWATCH[cat];
      body = `<div class="chips cats">${cats.map((k) => `<button data-cat="${k}" aria-pressed="${k === cat}">${AVATAR_LABELS[k]}</button>`).join('')}</div>
        <div class="avgrid ${sw ? 'swatch' : ''}">${Array.from({ length: n }, (_, i) => `<button data-k="${cat}" data-v="${i}" aria-pressed="${(draft[cat] || 0) === i}" aria-label="${AVATAR_LABELS[cat]} ${AVATAR_NAMES[cat]?.[i] || i + 1}"
          ${sw ? `style="background:${sw[i]}"` : ''}>${sw ? '' : avatarSVG({ ...draft, [cat]: i })}${AVATAR_NAMES[cat] ? `<span class="avname">${AVATAR_NAMES[cat][i]}</span>` : ''}</button>`).join('')}</div>
        <button class="btn paper small" id="rand" style="margin-top:10px">무작위로 섞기</button>`;
    } else {
      const kind = { title: 'titles', card: 'cards', pin: 'pins' }[tab];
      const devOnly = (x) => (x.cond?.[0] === 'dev' && !G.user.dev) || (x.cond?.[0] === 'gift' && !unlocked(G.user, x)); // 개발자 전용, 못 받은 우편 보상은 안 보임
      const list = (kind === 'titles' ? [...G.data.COSMETICS.titles].sort((x, y) => (x.tier || 0) - (y.tier || 0)) : G.data.COSMETICS[kind]).filter((x) => !devOnly(x));
      body = list.map((item) => {
        const open = unlocked(G.user, item);
        const on = tab === 'pin' ? style.pins.includes(item.id) : style[tab] === item.id;
        const look = tab === 'title' ? `<span class="ctitle">${titleTag(item.id)}<small>${TITLE_TIERS[item.tier || 0]}</small></span>` : tab === 'card' ? `<span class="cswatch bc-${item.id}"></span>` : tab === 'pin' ? `<span class="cpin">${pinSVG(item.id)}</span>` : '';
        return `<button class="citem ${on ? 'on' : ''}" data-pick="${item.id}" ${open ? '' : 'disabled'}>
          ${look}<span class="cinfo"><b>${open ? '' : '🔒 '}${tab === 'title' ? '' : esc(item.n)}</b><small>${condText(item)}</small></span>${on ? '<em>장착</em>' : ''}</button>`;
      }).join('');
      if (tab === 'pin') body = `<p class="muted" style="margin-bottom:8px">핀은 3개까지 달 수 있습니다. (${style.pins.length}/3)</p>${body}`;
    }
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>꾸미기</h1></div>
      ${typeof Avatar3D !== 'undefined' && Avatar3D ? `<div class="stage3d"><canvas id="av3d" aria-label="3D 아바타 미리보기. 옆으로 밀면 돌아갑니다"></canvas>
        <div class="stage3d-btns">${[['cheer', '환호'], ['command', '지시'], ['mega', '기합'], ['z', 'Z 안무']].map(([k, n]) => `<button class="btn small paper" data-act="${k}">${n}</button>`).join('')}</div></div>` : ''}
      <div class="preview-card">${battleCard(me, 'big')}</div>
      <div class="tabs styletabs">${[['avatar', '아바타'], ['title', '칭호'], ['card', '전투카드'], ['pin', '핀']].map(([k, n]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      <section class="panel">${body}</section>
      <button class="btn wide" id="save" style="margin-top:14px">저장하기</button>`;
    app.querySelector('#back').onclick = () => { live?.destroy(); showLobby(); };
    const cv = app.querySelector('#av3d');
    if (cv) {
      const rot = live ? live.rot : 0;
      live?.destroy();
      live = Avatar3D.mount(cv, draft, { drag: true, facing: .3 + rot });
      live.rot = rot;
      app.querySelectorAll('[data-act]').forEach((b) => { b.onclick = () => live.play(b.dataset.act, { type: ['fire', 'water', 'elec', 'fairy', 'earth', 'spirit'][Math.floor(Math.random() * 6)] }); });
    }
    app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; render(); }; });
    app.querySelectorAll('[data-cat]').forEach((b) => { b.onclick = () => { cat = b.dataset.cat; render(); }; });
    app.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { draft[b.dataset.k] = +b.dataset.v; const y = scrollY; render(); scrollTo(0, y); }; });
    app.querySelector('#rand')?.addEventListener('click', () => {
      for (const [k, n] of Object.entries(G.data.AVATAR_OPTIONS)) draft[k] = Math.floor(Math.random() * n);
      render();
    });
    app.querySelectorAll('[data-pick]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.pick;
        if (tab === 'pin') {
          const at = style.pins.indexOf(id);
          if (at >= 0) style.pins.splice(at, 1);
          else if (style.pins.length >= 3) return toast('핀은 3개까지입니다. 하나를 먼저 빼세요.');
          else style.pins.push(id);
        } else style[tab] = id;
        const y = scrollY; render(); scrollTo(0, y);
      };
    });
    app.querySelector('#save').onclick = async () => {
      try {
        await api('PUT', '/api/avatar', draft);
        G.user = (await api('PUT', '/api/style', style)).user;
        toast('저장했습니다.'); showLobby();
      } catch (e) { toast(e.message); }
    };
  };
  render();
}

/* ---------- 팀 편성 ---------- */
const STAT_LABEL = { hp: '체력', atk: '공격', def: '방어', spa: '특공', spd: '특방', spe: '스피드' };

const cloneDecks = () => JSON.parse(JSON.stringify(G.user.decks));

async function saveDecks(decks, active) {
  G.user = (await api('PUT', '/api/decks', { decks, active })).user;
}

function showDecks() {
  G.screen = 'decks';
  const decks = G.user.decks;
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>덱 관리</h1></div>
    <p style="color:#fff;margin-bottom:12px">덱 ${decks.length}개. 덱을 눌러 이름과 요괴, 기술을 바꿉니다.</p>
    ${decks.map((d, i) => `<div class="deck ${i === G.user.active ? 'on' : ''}">
      <button class="deck-main" data-open="${i}">
        <b>${esc(d.name)}</b>${i === G.user.active ? '<em>대전에 사용</em>' : ''}
        <span class="mini">${d.team.map((m) => monsterSVG(m.species)).join('')}</span>
      </button>
      <div class="deck-acts">
        <button class="btn small mint" data-use="${i}" ${i === G.user.active ? 'disabled' : ''}>사용</button>
        <button class="btn small paper" data-del="${i}" ${decks.length > 1 ? '' : 'disabled'}>삭제</button>
      </div></div>`).join('')}
    <button class="slot empty" id="new-deck">새 덱 만들기</button>`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => showTeam(+b.dataset.open); });
  app.querySelectorAll('[data-use]').forEach((b) => {
    b.onclick = async () => {
      try { await saveDecks(cloneDecks(), +b.dataset.use); showDecks(); } catch (e) { toast(e.message); }
    };
  });
  app.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = '정말 삭제'; b.classList.add('red'); return; }
      const i = +b.dataset.del, next = cloneDecks();
      next.splice(i, 1);
      const act = G.user.active;
      try { await saveDecks(next, act === i ? 0 : act > i ? act - 1 : act); showDecks(); } catch (e) { toast(e.message); }
    };
  });
  app.querySelector('#new-deck')?.addEventListener('click', () => {
    const base = G.user.decks[G.user.active].team;
    showTeam(G.user.decks.length, { name: `새 덱 ${G.user.decks.length + 1}`, team: JSON.parse(JSON.stringify(base)) });
  });
}

function showTeam(index, draft) {
  G.screen = 'team';
  const deck = draft || JSON.parse(JSON.stringify(G.user.decks[index]));
  const team = deck.team;
  const render = () => {
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">취소</button><h1>덱 편집</h1></div>
      <section class="panel" style="margin-bottom:14px">
        <label class="field" style="margin:0">덱 이름<input id="deck-name" value="${esc(deck.name)}" autocomplete="off"></label>
      </section>
      ${team.map((m, i) => {
        const sp = G.data.MONSTERS[m.species];
        return `<div class="slot">
          <div class="pic">${monsterSVG(m.species)}</div>
          <button class="inf" data-edit="${i}" style="background:none;border:0;text-align:left;padding:0">
            <div class="nm">${i + 1}. ${sp.n} ${typesOf(m.species)}</div>
            <div class="mvs">${m.moves.map((id) => G.data.MOVES[id].n).join(', ')}</div>
          </button>
          <div class="ord">
            <button data-up="${i}" aria-label="${sp.n} 앞으로" ${i ? '' : 'disabled'}>▲</button>
            <button data-rm="${i}" aria-label="${sp.n} 빼기" ${team.length > 3 ? '' : 'disabled'}>✕</button>
          </div></div>`;
      }).join('')}
      ${team.length < 6 ? '<button class="slot empty" id="add">요괴 추가</button>' : ''}
      <button class="btn wide" id="save">덱 저장하기</button>`;
    app.querySelector('#deck-name').oninput = (e) => { deck.name = e.target.value; };
    app.querySelector('#back').onclick = showDecks;
    app.querySelector('#save').onclick = async () => {
      deck.name = app.querySelector('#deck-name').value; // 한글 조합 중이어도 입력칸의 값을 그대로 씀
      if ([...deck.name.trim()].length > 12) return toast('덱 이름은 12자까지입니다.');
      const decks = cloneDecks();
      decks[index] = deck;
      try { await saveDecks(decks, G.user.active); toast('덱을 저장했습니다.'); showDecks(); }
      catch (e) { toast(e.message); }
    };
    app.querySelector('#add')?.addEventListener('click', () => pickMonster(team, render));
    app.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => editMon(team, +b.dataset.edit, render); });
    app.querySelectorAll('[data-up]').forEach((b) => {
      b.onclick = () => { const i = +b.dataset.up; [team[i - 1], team[i]] = [team[i], team[i - 1]]; render(); };
    });
    app.querySelectorAll('[data-rm]').forEach((b) => { b.onclick = () => { team.splice(+b.dataset.rm, 1); render(); }; });
  };
  render();
}

function openSheet(html) {
  sheetRoot.innerHTML = `<div class="sheet-bg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const bg = sheetRoot.firstElementChild;
  bg.onclick = (e) => { if (e.target === bg) closeSheet(); };
  return bg;
}
function closeSheet() { sheetRoot.innerHTML = ''; }

// 밴된 요괴: 개발자 계정은 쓸 수 있음
const isBanned = (id) => (G.data.BANNED || []).includes(id) && !G.user?.dev;
const isSecret = isBanned; // 공개 전: 개발자 말고는 그림·이름·정보를 숨김

function pickMonster(team, done) {
  const used = new Set(team.map((m) => m.species));
  const bg = openSheet(`<div class="row"><h2>요괴 고르기</h2><button class="btn small paper" data-x>닫기</button></div>
    <div class="grid">${Object.entries(G.data.MONSTERS).map(([id, m]) => { const ban = isBanned(id); return ban ? `<button class="card secret" disabled><span class="soon-art" aria-hidden="true">?</span><span>???</span><em class="bantag soon">곧 공개!</em></button>`
      : `<button class="card" data-id="${id}" ${used.has(id) ? 'disabled' : ''}
      style="--tc:${G.data.TYPES[m.types[0]].c}">${monsterSVG(id)}<span>${m.n}</span></button>`; }).join('')}</div>`);
  bg.querySelector('[data-x]').onclick = closeSheet;
  bg.querySelectorAll('[data-id]').forEach((b) => {
    b.onclick = () => {
      const all = G.data.MONSTERS[b.dataset.id].moves;
      const atk = all.filter((m) => G.data.MOVES[m].cat !== 'x').slice(0, 3);
      const rest = all.filter((m) => !atk.includes(m));
      team.push({ species: b.dataset.id, moves: [...atk, ...rest].slice(0, 4) });
      done();
      editMon(team, team.length - 1, done);
    };
  });
}

const sigTag = (id) => (G.data.MOVES[id].sig ? '<em class="sigtag">전용기</em>' : '');

function moveLine(id) {
  const m = G.data.MOVES[id];
  const kind = { p: '물리', s: '특수', x: '변화' }[m.cat];
  const pow = m.pow ? `위력 ${m.pow}` : '';
  const acc = m.acc ? `명중 ${m.acc}` : '';
  return `${[kind, pow, acc, `PP ${m.pp}`].filter(Boolean).join(', ')}. ${m.d}`;
}

function editMon(team, i, done) {
  const slot = team[i], sp = G.data.MONSTERS[slot.species];
  const render = () => {
    const bg = openSheet(`<div class="row" style="margin-bottom:10px"><h2>${sp.n}</h2><button class="btn small" data-x>완료</button></div>
      <div class="row" style="align-items:flex-start;margin-bottom:12px">
        <div class="detail-pic" style="--tc:${G.data.TYPES[sp.types[0]].c}">${monsterSVG(slot.species)}</div>
        <div style="flex:1;min-width:0">
          <p style="margin-bottom:4px">${typesOf(slot.species)}</p>
          ${Object.entries(sp.base).map(([k, v]) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${v}</span><i style="width:${Math.min(100, v / 1.3)}%"></i></div>`).join('')}
        </div>
      </div>
      <p class="muted" style="margin-bottom:10px">${sp.flavor}</p>
      ${sp.trait ? `<p class="trait"><b>특성 ${sp.trait.n}</b> ${sp.trait.d}</p>` : ''}
      <h3 style="font-family:var(--ui);font-weight:400;margin-bottom:6px">기술 ${slot.moves.length}/4</h3>
      ${sp.moves.map((id) => `<button class="mv" data-mv="${id}" aria-pressed="${slot.moves.includes(id)}">
        ${typeChip(G.data.MOVES[id].type)}<b>${G.data.MOVES[id].n}</b>${sigTag(id)}<small>${moveLine(id)}</small></button>`).join('')}`);
    bg.querySelector('[data-x]').onclick = () => { closeSheet(); done(); };
    bg.querySelectorAll('[data-mv]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.mv, at = slot.moves.indexOf(id);
        if (at >= 0) { if (slot.moves.length > 1) slot.moves.splice(at, 1); else return toast('기술은 1개 이상 있어야 합니다.'); }
        else if (slot.moves.length >= 4) return toast('기술은 4개까지입니다. 하나를 먼저 빼세요.');
        else slot.moves.push(id);
        const top = sheetRoot.querySelector('.sheet').scrollTop;
        render();
        sheetRoot.querySelector('.sheet').scrollTop = top;
      };
    });
  };
  render();
}

/* ---------- 플레이어 목록 ---------- */
function ago(t) {
  if (!t) return '기록 없음';
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m / 60)}시간 전`;
  if (m < 43200) return `${Math.floor(m / 1440)}일 전`;
  return new Date(t).toLocaleDateString('ko-KR');
}

async function showPlayers() {
  G.screen = 'players';
  app.className = '';
  app.innerHTML = '<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>플레이어 목록</h1></div><p class="wait">불러오는 중...</p>';
  app.querySelector('#back').onclick = showLobby;
  let players;
  try { ({ players } = await api('GET', '/api/players')); } catch (e) { toast(e.message); return; }
  if (G.screen !== 'players') return;
  const render = (q = '') => {
    const list = players.filter((p) => !q || p.name.toLowerCase().includes(q) || p.note.toLowerCase().includes(q));
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>플레이어 목록</h1></div>
      <section class="panel" style="margin-bottom:14px">
        <p class="muted" style="margin-bottom:8px">가입한 사람 ${players.length}명, 지금 접속 ${players.filter((p) => p.online).length}명. 메모는 나에게만 보입니다.</p>
        <input id="pq" class="search" placeholder="이름이나 메모로 찾기" value="${esc(q)}" autocomplete="off">
      </section>
      ${list.map((p) => `<section class="panel pl">
        ${battleCard({ name: p.name + (p.me ? ' (나)' : ''), avatar: p.avatar, style: p.style })}
        <p class="pmeta"><i class="dot ${p.online ? 'on' : ''}"></i>${p.online ? (p.busy ? '대전 중' : '접속 중') : `마지막 접속 ${ago(p.lastSeen)}`}, ${recordText(p)}${p.createdAt ? `, ${new Date(p.createdAt).toLocaleDateString('ko-KR')} 가입` : ''}</p>
        ${p.me ? '' : `<div class="note"><input data-note="${esc(p.key)}" maxlength="100" placeholder="누군지 메모 (예: 회사 동기 민수)" value="${esc(p.note)}" autocomplete="off"><button class="btn small" data-save="${esc(p.key)}">저장</button></div>`}
      </section>`).join('') || '<p class="wait">찾는 플레이어가 없습니다.</p>'}`;
    app.querySelector('#back').onclick = showLobby;
    const pq = app.querySelector('#pq');
    pq.oninput = () => { const pos = pq.selectionStart; render(pq.value.trim().toLowerCase()); const n = app.querySelector('#pq'); n.focus(); n.setSelectionRange(pos, pos); };
    app.querySelectorAll('[data-save]').forEach((b) => {
      b.onclick = async () => {
        const key = b.dataset.save;
        const input = app.querySelector(`[data-note="${CSS.escape(key)}"]`);
        try {
          await api('PUT', '/api/notes', { key, text: input.value });
          players.find((p) => p.key === key).note = input.value.trim();
          toast('메모를 저장했습니다.');
        } catch (e) { toast(e.message); }
      };
    });
  };
  render();
}

/* ---------- 도감 ---------- */
function showDex() {
  G.screen = 'dex';
  const ids = Object.keys(G.data.MONSTERS);
  const types = Object.keys(G.data.TYPES).filter((t) => t !== 'none');
  G.dexType ??= 'all';
  const render = () => {
    const list = ids.filter((id) => G.dexType === 'all' || G.data.MONSTERS[id].types.includes(G.dexType));
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>도감</h1></div>
      <section class="panel">
        <p class="muted" style="margin-bottom:8px">요괴 ${list.length}마리</p>
        <div class="chips">
          <button data-t="all" aria-pressed="${G.dexType === 'all'}">전체</button>
          ${types.map((t) => `<button data-t="${t}" aria-pressed="${G.dexType === t}" style="background:${G.data.TYPES[t].c};color:${['elec', 'ice', 'wind'].includes(t) ? 'var(--ink)' : '#fff'}">${G.data.TYPES[t].n}</button>`).join('')}
        </div>
        <div class="grid">${list.map((id) => isSecret(id) ? `<button class="card secret" data-soon="${id}"><span class="soon-art" aria-hidden="true">?</span><span>${ids.indexOf(id) + 1}. ???</span><em class="bantag soon">곧 공개!</em></button>`
          : `<button class="card" data-dex="${id}" style="--tc:${G.data.TYPES[G.data.MONSTERS[id].types[0]].c}">${monsterSVG(id)}<span>${ids.indexOf(id) + 1}. ${G.data.MONSTERS[id].n}</span>${(G.data.BANNED || []).includes(id) ? '<em class="bantag">개발자 전용</em>' : ''}</button>`).join('')}</div>
      </section>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { G.dexType = b.dataset.t; render(); }; });
    app.querySelectorAll('[data-dex]').forEach((b) => { b.onclick = () => openDexEntry(b.dataset.dex); });
    app.querySelectorAll('[data-soon]').forEach((b) => { b.onclick = () => toast('곧 공개합니다!'); });
  };
  render();
}

// 타입 상성표: 가로줄이 공격 타입, 세로줄이 맞는 타입. 칸을 누르면 그 줄과 칸이 강조됩니다.
function showTypeChart() {
  G.screen = 'types';
  const types = Object.keys(G.data.TYPES).filter((t) => t !== 'none');
  const T = G.data.TYPES, C = G.data.CHART;
  const dark = (t) => ['elec', 'ice', 'wind'].includes(t);
  const head = (t) => `<span class="tc-type" style="background:${T[t].c};color:${dark(t) ? 'var(--ink)' : '#fff'}">${T[t].n}</span>`;
  const mark = (e) => (e === 2 ? ['2', 'x2'] : e === .5 ? ['½', 'xh'] : e === 0 ? ['0', 'x0'] : ['', '']);
  let pick = null; // [공격, 방어]
  const render = () => {
    const [pa, pd] = pick || [];
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>타입 상성표</h1></div>
      <section class="panel">
        <p class="muted" style="margin-bottom:8px">가로줄이 <b>공격하는 기술의 타입</b>, 세로줄이 <b>맞는 요괴의 타입</b>입니다. 타입이 둘인 요괴는 두 배율을 곱합니다(2×2=4배, 2×½=1배). 칸을 누르면 그 상성을 알려 줍니다.</p>
        <div class="tc-legend"><span class="x2">2</span> 효과 굉장 (2배) <span class="xh">½</span> 별로 (절반) <span class="x0">0</span> 효과 없음 <span class="x1"></span> 보통 (1배)</div>
        <div class="tc-wrap"><table class="tchart">
          <thead><tr><th class="tc-corner tc-c0"><small>공격↓<br>방어→</small></th>${types.map((d) => `<th class="${d === pd ? 'on' : ''}">${head(d)}</th>`).join('')}</tr></thead>
          <tbody>${types.map((a) => `<tr class="${a === pa ? 'on' : ''}"><th>${head(a)}</th>${types.map((d) => {
            const [txt, cls] = mark(C[a][d] ?? 1);
            return `<td class="${cls || 'x1'}${a === pa && d === pd ? ' sel' : ''}${d === pd ? ' col' : ''}" data-a="${a}" data-d="${d}">${txt}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table></div>
        <p class="tc-say" aria-live="polite">${pick ? (() => {
          const e = C[pa][pd] ?? 1;
          return `${head(pa)} 기술로 ${head(pd)} 요괴를 때리면 <b>${e === 2 ? '2배 (효과가 굉장했다!)' : e === .5 ? '절반 (효과가 별로인 듯하다...)' : e === 0 ? '효과 없음' : '보통 (1배)'}</b>`;
        })() : '칸을 눌러 보세요.'}</p>
      </section>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-a]').forEach((td) => { td.onclick = () => { pick = [td.dataset.a, td.dataset.d]; render(); }; });
  };
  render();
}

function matchups(id) {
  const groups = {};
  for (const atk of Object.keys(G.data.TYPES)) {
    if (atk === 'none') continue;
    const eff = G.data.MONSTERS[id].types.reduce((x, t) => x * (G.data.CHART[atk][t] ?? 1), 1);
    if (eff !== 1) (groups[eff] ||= []).push(atk);
  }
  return [[4, '4배로 받음'], [2, '2배로 받음'], [.5, '절반만 받음'], [.25, '1/4만 받음'], [0, '안 받음']]
    .filter(([e]) => groups[e])
    .map(([e, label]) => `<div class="mu"><span>${label}</span><p>${groups[e].map(typeChip).join('')}</p></div>`).join('');
}

function openDexEntry(id) {
  const sp = G.data.MONSTERS[id];
  const total = Object.values(sp.base).reduce((a, b) => a + b, 0);
  const no = Object.keys(G.data.MONSTERS).indexOf(id) + 1;
  const bg = openSheet(`<div class="row" style="margin-bottom:10px"><h2>${no}. ${sp.n}</h2><button class="btn small paper" data-x>닫기</button></div>
    <div class="row" style="align-items:flex-start;margin-bottom:12px">
      <div class="detail-pic" style="--tc:${G.data.TYPES[sp.types[0]].c}">${monsterSVG(id)}</div>
      <div style="flex:1;min-width:0">
        <p style="margin-bottom:4px">${typesOf(id)}</p>
        ${Object.entries(sp.base).map(([k, v]) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${v}</span><i style="width:${Math.min(100, v / 1.3)}%"></i></div>`).join('')}
        <p class="muted" style="text-align:right;line-height:1.3">합계 ${total}</p>
      </div>
    </div>
    <p style="margin-bottom:12px">${sp.flavor}</p>
    ${sp.trait ? `<p class="trait"><b>특성 ${sp.trait.n}</b> ${sp.trait.d}</p>` : ''}
    <section class="megabox">
      <h3>메가진화: ${sp.mega.n}</h3>
      <div class="row" style="align-items:flex-start">
        <div class="detail-pic" style="--tc:${G.data.TYPES[sp.types[0]].c}">${monsterSVG(id, '', true)}</div>
        <div style="flex:1;min-width:0">
          ${Object.entries(sp.base).map(([k, v]) => { const up = sp.mega.boost[k], now = v + up; return `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${now}${up ? ` <b>+${up}</b>` : ''}</span><i style="width:${Math.min(100, now / 1.7)}%"></i></div>`; }).join('')}
          <p style="text-align:right;line-height:1.3;font-size:14px">합계 ${total + 100}</p>
        </div>
      </div>
      <p style="margin-top:8px;font-size:15px;line-height:1.4">${sp.mega.d}</p>
    </section>
    ${sp.z ? `<section class="zbox" style="--zc:${G.data.TYPES[G.data.MOVES[sp.z].type].c}"><span>Z기술</span><b>${G.data.MOVES[sp.z].n}</b>
      <small>${typeChip(G.data.MOVES[sp.z].type)}${G.data.MOVES[sp.z].cat === 'p' ? '물리' : '특수'}, 위력 ${G.data.MOVES[sp.z].pow}, 반드시 명중. ${G.data.MOVES[sp.z].d}</small></section>` : ''}
    <h3 class="dex-h">타입 상성</h3>
    ${matchups(id)}
    <h3 class="dex-h">배울 수 있는 스킬 ${sp.moves.length}개</h3>
    ${sp.moves.map((m) => `<div class="mv">${typeChip(G.data.MOVES[m].type)}<b>${G.data.MOVES[m].n}</b>${sigTag(m)}<small>${moveLine(m)}</small></div>`).join('')}`);
  bg.querySelector('[data-x]').onclick = closeSheet;
}

/* ---------- 시작 ---------- */
(async () => {
  G.data = await api('GET', '/api/data');
  try {
    G.user = (await api('GET', '/api/me')).user;
    enterGame();
  } catch { showAuth(); }
})();
