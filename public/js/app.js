// 이벤트 목록: ends(마감 시각)가 지나면 '진행 중'에서 빠집니다.
const EVENTS = [
  { id: 'contest', title: '신캐 만들기 공모전', ends: Date.parse('2026-11-13T23:59:59+09:00'), period: '11월 13일(금)까지' },
];
const liveEvents = () => EVENTS.filter((e) => !e.ends || Date.now() <= e.ends);
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
    </section>
    <section class="panel">
      <h2>비밀번호 바꾸기</h2>
      ${u.tempPw ? '<p class="pw-warn">지금 임시 비밀번호를 쓰고 있어요. 새 비밀번호로 바꿔 주세요!</p>' : ''}
      <form id="pwform" class="pwform">
        <input type="password" name="old" placeholder="${u.tempPw ? '임시 비밀번호' : '지금 비밀번호'}" autocomplete="current-password" required>
        <input type="password" name="pw" placeholder="새 비밀번호 (6자 이상)" autocomplete="new-password" minlength="6" required>
        <input type="password" name="pw2" placeholder="새 비밀번호 한 번 더" autocomplete="new-password" minlength="6" required>
        <button class="btn">바꾸기</button>
      </form>
    </section>`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelector('#pwform').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.pw.value !== f.pw2.value) return toast('새 비밀번호 두 개가 서로 달라요.');
    try { G.user = (await api('PUT', '/api/password', { old: f.old.value, password: f.pw.value })).user; toast('비밀번호를 바꿨어요!'); showSettings(); }
    catch (err) { toast(err.message); }
  };
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

function showLobby() { G.screen = 'lobby'; app.className = ''; closeSheet(); renderLobby(); if (G.user?.tempPw && !G.pwNag) { G.pwNag = true; toast('임시 비밀번호로 들어왔어요. 설정에서 새 비밀번호로 바꿔 주세요!'); } }

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
        <button class="btn paper" id="go-fields">필드 효과</button>
        <button class="btn paper" id="go-players">플레이어 목록</button>
        <button class="btn paper mailbtn" id="go-mail">우편함${u.mailNew ? `<em class="mailbadge">${u.mailNew}</em>` : ''}</button>
        <button class="btn paper" id="go-settings">설정</button>
      </div>
    </section>
    <button class="evtab" id="go-event" aria-label="이벤트"><s aria-hidden="true"></s><b>EVENT</b><small>${liveEvents().length ? `진행 중 ${liveEvents().length}개` : '준비 중'}</small></button>
    <section class="panel">
      <div class="row" style="justify-content:space-between;margin-bottom:8px">
        <h2 style="margin:0">대전 인원</h2>
        <div class="seg">
          ${[1, 3, 6].map((n) => `<button data-size="${n}" aria-pressed="${G.size === n}">${n}대${n}</button>`).join('')}
        </div>
      </div>
      <h2 style="margin-top:12px">사용할 덱</h2>
      <div class="chips deckpick">${u.decks.map((d, i) => `<button data-deck="${i}" aria-pressed="${i === u.active}">${esc(d.name)}</button>`).join('')}</div>
      <div class="mini big">${u.decks[u.active].team.map((m, i) => `<span class="${i < G.size ? '' : 'off'}">${monsterSVG(m.species)}</span>`).join('')}</div>
      <p class="muted">${G.size === 1 ? '덱 맨 앞의 골목몬 1마리끼리 맞붙습니다. 교체 없는 진검승부!' : `덱 앞에서부터 ${G.size}마리가 나갑니다. 대전 전에 상대 덱을 보고 먼저 낼 골목몬을 고릅니다.`}</p>
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
      <p class="muted" style="margin-bottom:10px">체력 1000, 타입 없는 더미를 마음껏 때려 보세요. 모든 골목몬으로 바꿀 수 있고 기술 10개를 전부 쓸 수 있습니다. 준 피해가 쌓이면 훈련장 칭호, 전투카드, 핀이 열립니다.</p>
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
  app.querySelector('#go-fields').onclick = showFields;
  app.querySelector('#go-players').onclick = showPlayers;
  app.querySelector('#go-settings').onclick = showSettings;
  app.querySelector('#go-mail').onclick = showMail;
  app.querySelector('#go-event').onclick = showEvents;
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
    <p style="color:#fff;margin-bottom:12px">덱 ${decks.length}개. 덱을 눌러 이름과 골목몬, 기술을 바꿉니다.</p>
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
            <div class="mvs item-line">${m.item && G.data.ITEMS?.[m.item] ? `${G.data.ITEMS[m.item].i} ${G.data.ITEMS[m.item].n}` : '도구 없음'}</div>
          </button>
          <div class="ord">
            <button data-up="${i}" aria-label="${sp.n} 앞으로" ${i ? '' : 'disabled'}>▲</button>
            <button data-rm="${i}" aria-label="${sp.n} 빼기" ${team.length > 3 ? '' : 'disabled'}>✕</button>
          </div></div>`;
      }).join('')}
      ${team.length < 6 ? '<button class="slot empty" id="add">골목몬 추가</button>' : ''}
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

// 밴된 골목몬: 개발자 계정은 쓸 수 있음
const isBanned = (id) => (G.data.BANNED || []).includes(id) && !G.user?.dev;
const isSecret = isBanned; // 공개 전: 개발자 말고는 그림·이름·정보를 숨김

function pickMonster(team, done) {
  const used = new Set(team.map((m) => m.species));
  const bg = openSheet(`<div class="row"><h2>골목몬 고르기</h2><button class="btn small paper" data-x>닫기</button></div>
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
      <h3 style="font-family:var(--ui);font-weight:400;margin-bottom:6px">도구 <small class="muted">${slot.item && G.data.ITEMS[slot.item] ? `${G.data.ITEMS[slot.item].i} ${G.data.ITEMS[slot.item].n}` : '없음'}</small></h3>
      <div class="items">${Object.entries(G.data.ITEMS || {}).map(([id, it]) => `<button class="itm" data-item="${id}" aria-pressed="${slot.item === id}" title="${esc(it.d)}"><span class="ii">${it.i}</span><b>${it.n}</b></button>`).join('')}</div>
      <p class="item-desc muted">${slot.item && G.data.ITEMS[slot.item] ? `${G.data.ITEMS[slot.item].n}: ${G.data.ITEMS[slot.item].d}` : '도구를 누르면 들려 주고, 다시 누르면 뺍니다.'}</p>
      <h3 style="font-family:var(--ui);font-weight:400;margin-bottom:6px">기술 ${slot.moves.length}/4</h3>
      ${sp.moves.map((id) => `<button class="mv" data-mv="${id}" aria-pressed="${slot.moves.includes(id)}">
        ${typeChip(G.data.MOVES[id].type)}<b>${G.data.MOVES[id].n}</b>${sigTag(id)}<small>${moveLine(id)}</small></button>`).join('')}`);
    bg.querySelector('[data-x]').onclick = () => { closeSheet(); done(); };
    bg.querySelectorAll('[data-item]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.item;
        if (slot.item === id) delete slot.item; else slot.item = id;
        const top = sheetRoot.querySelector('.sheet').scrollTop;
        render();
        sheetRoot.querySelector('.sheet').scrollTop = top;
      };
    });
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
        ${G.user.dev && !p.me ? `<p class="pmeta"><button class="btn small paper" data-resetpw="${esc(p.name)}">🔑 비밀번호 초기화</button></p>` : ''}
        ${p.me ? '' : `<div class="note"><input data-note="${esc(p.key)}" maxlength="100" placeholder="누군지 메모 (예: 회사 동기 민수)" value="${esc(p.note)}" autocomplete="off"><button class="btn small" data-save="${esc(p.key)}">저장</button></div>`}
      </section>`).join('') || '<p class="wait">찾는 플레이어가 없습니다.</p>'}`;
    app.querySelector('#back').onclick = showLobby;
    const pq = app.querySelector('#pq');
    pq.oninput = () => { const pos = pq.selectionStart; render(pq.value.trim().toLowerCase()); const n = app.querySelector('#pq'); n.focus(); n.setSelectionRange(pos, pos); };
    app.querySelectorAll('[data-resetpw]').forEach((b) => {
      b.onclick = () => {
        const name = b.dataset.resetpw;
        const bg = openSheet(`<h2>비밀번호 초기화</h2><p style="margin:8px 0"><b>${esc(name)}</b>님의 비밀번호를 임시 비밀번호로 바꿀까요?</p><p class="muted" style="font-size:13px">원래 비밀번호는 암호화돼 있어서 아무도 볼 수 없어요. 바꾸면 그 계정은 모든 기기에서 로그아웃돼요.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn paper" data-x style="flex:1">취소</button><button class="btn" data-go style="flex:1">초기화</button></div>`);
        bg.querySelector('[data-x]').onclick = closeSheet;
        bg.querySelector('[data-go]').onclick = async () => {
          try {
            const r = await api('POST', '/api/dev/resetpw', { name });
            const bg2 = openSheet(`<h2>임시 비밀번호</h2><p style="margin:8px 0"><b>${esc(r.name)}</b>님께 알려 주세요.</p><p class="temppw">${esc(r.temp)}</p><p class="muted" style="font-size:13px">로그인한 뒤 <b>설정 → 비밀번호 바꾸기</b>에서 새 비밀번호로 바꾸라고 해 주세요. 이 창을 닫으면 다시 볼 수 없어요.</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn paper" data-copy style="flex:1">복사</button><button class="btn" data-x style="flex:1">닫기</button></div>`);
            bg2.querySelector('[data-x]').onclick = closeSheet;
            bg2.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(r.temp); toast('복사했어요.'); } catch { toast('복사가 안 돼요. 직접 적어 주세요.'); } };
          } catch (e) { toast(e.message); closeSheet(); }
        };
      };
    });
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
        <p class="muted" style="margin-bottom:8px">골목몬 ${list.length}마리</p>
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
        <p class="muted" style="margin-bottom:8px">가로줄이 <b>공격하는 기술의 타입</b>, 세로줄이 <b>맞는 골목몬의 타입</b>입니다. 타입이 둘인 골목몬은 두 배율을 곱합니다(2×2=4배, 2×½=1배). 칸을 누르면 그 상성을 알려 줍니다.</p>
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
          return `${head(pa)} 기술로 ${head(pd)} 골목몬을 때리면 <b>${e === 2 ? '2배 (효과가 굉장했다!)' : e === .5 ? '절반 (효과가 별로인 듯하다...)' : e === 0 ? '효과 없음' : '보통 (1배)'}</b>`;
        })() : '칸을 눌러 보세요.'}</p>
      </section>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-a]').forEach((td) => { td.onclick = () => { pick = [td.dataset.a, td.dataset.d]; render(); }; });
  };
  render();
}

// 필드 효과 목록: 날씨 4가지, 그래스필드, 압정. 기술은 게임 데이터에서 찾아 보여 줍니다.
function showEvents() {
  G.screen = 'events';
  app.className = '';
  const dday = (t) => { if (Date.now() > t) return '마감'; const d = Math.ceil((t - Date.now()) / 86400000) - 1; return d > 0 ? `D-${d}` : 'D-DAY'; }; // 마감일 자정 기준
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>EVENT</h1></div>
    ${EVENTS.length ? EVENTS.map((e) => `<button class="ev-card ev-${e.id}" data-ev="${e.id}">
      <span class="ev-badge ${Date.now() > e.ends ? 'off' : ''}">${dday(e.ends)}</span>
      <h2>${esc(e.title)}</h2><small>${esc(e.period)}</small>
      <p>나만의 골목몬을 만들어 올려 주세요! 우승작은 실제 게임에 출시되고, 만든 사람에게 그 골목몬의 신화 등급 칭호를 드려요.</p>
      <b class="ev-go">자세히 보기 ›</b></button>`).join('')
    : '<section class="panel"><div class="ev-empty"><b>🎪</b><h2>진행 중인 이벤트가 없어요</h2><p>새 이벤트가 열리면 여기에서 알려 드릴게요!</p></div></section>'}`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelectorAll('[data-ev]').forEach((b) => { b.onclick = () => showContest(); });
}

/* ---------- 신캐 만들기 공모전 ---------- */
const typeChips = (ts) => (ts || []).map(typeChip).join('');
const CT_STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const CT_CAT = { p: '물리', s: '특수', x: '변화' };
const tColor = (t) => G.data.TYPES[t]?.c || '#ccc';
// 출품작 목록 카드 (누르면 도감처럼 자세히)
function entryCard(e, { dev = false, mine = false, closed = false } = {}) {
  return `<article class="ct-entry ${e.winner ? 'win' : ''}">
    ${e.winner ? '<em class="ct-win">🏆 우승</em>' : ''}
    <button class="ct-open" data-open="${e.id}">${e.image ? `<img src="${e.image}" alt="${esc(e.name)} 디자인">` : '<div class="ct-noimg">그림 없음</div>'}</button>
    <div class="ct-body"><h3>${esc(e.name)} ${typeChips(e.types)}</h3>
      <small>${esc(e.user)} · ${new Date(e.at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${e.editedAt ? ' (수정함)' : ''}</small>
      <p class="ct-desc">${esc(e.desc)}</p>
      <div class="row ct-acts">
        <button class="btn small" data-open="${e.id}">📖 도감처럼 보기</button>
        ${dev ? `<button class="btn small ${e.winner ? 'paper' : ''}" data-win="${e.id}">${e.winner ? '우승 취소' : '🏆 우승으로 뽑기'}</button>` : ''}
        ${mine && !closed ? `<button class="btn small paper" data-edit="${e.id}">✏️ 수정하기</button>` : ''}
        ${dev || (mine && !closed) ? `<button class="btn small paper" data-del="${e.id}">지우기</button>` : ''}
      </div></div></article>`;
}
// 출품작을 도감 화면과 같은 모양으로
function openContestDex(e) {
  const tc = tColor(e.types?.[0]);
  const base = e.base && CT_STATS.some((k) => e.base[k]) ? e.base : null;
  const total = base ? CT_STATS.reduce((a, k) => a + (base[k] || 0), 0) : 0;
  const pic = (src, alt) => `<div class="detail-pic ct-pic" style="--tc:${tc}">${src ? `<img src="${src}" alt="${esc(alt)}">` : '<span>그림 없음</span>'}</div>`;
  const trait = typeof e.trait === 'string' ? (e.trait ? { n: '', d: e.trait } : null) : e.trait?.n || e.trait?.d ? e.trait : null;
  const mega = e.mega && (e.mega.n || e.mega.d || e.mega.image) ? e.mega : null;
  const boostSum = mega?.boost ? CT_STATS.reduce((a, k) => a + (mega.boost[k] || 0), 0) : 0;
  const z = e.z && e.z.n ? e.z : null;
  const moves = Array.isArray(e.moves) ? e.moves.filter((m) => m.n) : null;
  const mline = (m) => [CT_CAT[m.cat] || '', m.pow ? `위력 ${m.pow}` : '', m.acc ? `명중 ${m.acc}` : '', m.pp ? `PP ${m.pp}` : ''].filter(Boolean).join(', ') + (m.d ? `. ${esc(m.d)}` : '');
  const bg = openSheet(`<div class="row" style="margin-bottom:10px"><h2>${e.winner ? '🏆 ' : ''}${esc(e.name)}</h2><button class="btn small paper" data-x>닫기</button></div>
    <p class="muted" style="margin:-6px 0 10px">만든 사람 ${esc(e.user)} · 신캐 공모전 출품작</p>
    <div class="row" style="align-items:flex-start;margin-bottom:12px">
      ${pic(e.image, e.name)}
      <div style="flex:1;min-width:0">
        <p style="margin-bottom:4px">${typeChips(e.types) || '<span class="muted">타입 없음</span>'}</p>
        ${base ? `${CT_STATS.map((k) => `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${base[k] || 0}</span><i style="width:${Math.min(100, (base[k] || 0) / 1.3)}%"></i></div>`).join('')}
        <p class="muted" style="text-align:right;line-height:1.3">합계 ${total}</p>` : '<p class="muted">능력치 없음</p>'}
      </div>
    </div>
    <p style="margin-bottom:12px;white-space:pre-wrap">${esc(e.desc)}</p>
    ${trait ? `<p class="trait"><b>특성${trait.n ? ' ' + esc(trait.n) : ''}</b> ${esc(trait.d || '')}</p>` : ''}
    ${mega ? `<section class="megabox"><h3>메가진화: ${esc(mega.n || '(이름 없음)')}</h3>
      <div class="row" style="align-items:flex-start">${pic(mega.image, mega.n || '메가진화')}
        <div style="flex:1;min-width:0">${base ? CT_STATS.map((k) => { const up = mega.boost?.[k] || 0, now = (base[k] || 0) + up; return `<div class="stat"><span>${STAT_LABEL[k]}</span><span>${now}${up ? ` <b>+${up}</b>` : ''}</span><i style="width:${Math.min(100, now / 1.7)}%"></i></div>`; }).join('') + `<p style="text-align:right;line-height:1.3;font-size:14px">합계 ${total + boostSum}</p>` : ''}</div></div>
      ${mega.d ? `<p style="margin-top:8px;font-size:15px;line-height:1.4;white-space:pre-wrap">${esc(mega.d)}</p>` : ''}</section>` : ''}
    ${z ? `<section class="zbox" style="--zc:${tColor(z.type)}"><span>Z기술</span><b>${esc(z.n)}</b>
      <small>${z.type ? typeChip(z.type) : ''}${CT_CAT[z.cat] || ''}${z.pow ? `, 위력 ${z.pow}` : ''}, 반드시 명중.${z.d ? ' ' + esc(z.d) : ''}</small></section>` : ''}
    ${e.types?.length ? `<h3 class="dex-h">타입 상성</h3>${matchups(e.types)}` : ''}
    ${moves ? `<h3 class="dex-h">배울 수 있는 스킬 ${moves.length}개</h3>
      ${moves.map((m) => `<div class="mv">${m.type ? typeChip(m.type) : ''}<b>${esc(m.n)}</b>${m.sig ? '<em class="sigtag">전용기</em>' : ''}<small>${mline(m)}</small></div>`).join('')}`
    : e.moves ? `<h3 class="dex-h">기술셋</h3><p style="white-space:pre-wrap">${esc(e.moves)}</p>` : ''}`);
  bg.querySelector('[data-x]').onclick = closeSheet;
}
async function showContest(tab = 'info') {
  G.screen = 'contest';
  app.className = '';
  app.innerHTML = '<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>공모전</h1></div><p class="wait">불러오는 중...</p>';
  app.querySelector('#back').onclick = showEvents;
  let v;
  try { v = await api('GET', '/api/contest'); } catch (e) { toast(e.message); return; }
  const render = () => {
    if (G.screen !== 'contest') return;
    const { info } = v, closed = info.closed;
    const left = Math.max(0, info.ends - Date.now()), days = Math.floor(left / 86400000), hours = Math.floor((left % 86400000) / 3600000);
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>공모전</h1></div>
      <section class="ct-hero"><s aria-hidden="true"></s><small>EVENT</small><h2>신캐 만들기 공모전</h2>
        <p class="ct-due">${closed ? '접수 마감' : `11월 13일(금) 자정까지 · ${days}일 ${hours}시간 남음`}</p></section>
      ${v.winner ? `<section class="panel ct-winner">🏆 우승작: <b>${esc(v.winner.name)}</b> (${esc(v.winner.user)})</section>` : ''}
      <section class="panel ct-rules">
        <h3>이렇게 참가해요</h3>
        <ol><li>새 골목몬의 <b>디자인</b>을 직접 그리거나 사진으로 올려요.</li>
          <li><b>이름</b>, <b>타입</b>, <b>설명</b>을 적어요. 설명은 꼭 넣어 주세요! 어떤 골목몬인지, 성격이나 생김새, 사연까지 자세할수록 좋아요.</li>
          <li><b>특성</b>과 <b>기술셋</b>도 생각해 둔 게 있으면 적어 주세요.</li></ol>
        <h3>상품</h3>
        <ul class="ct-prize"><li>🎮 우승한 골목몬을 <b>실제 게임에 출시</b></li><li>👑 그 골목몬과 관련된 <b>신화 등급 칭호</b> 지급</li></ul>
        <p class="muted">마감 후 개발자가 출품작 중 하나를 뽑아요. 한 사람당 ${info.perUser}개까지 낼 수 있어요. 지금까지 ${info.count}개가 들어왔어요.</p>
        ${closed ? '' : `<button class="btn wide" id="ct-new" ${v.mine.length >= info.perUser ? 'disabled' : ''}>${v.mine.length >= info.perUser ? '더 낼 수 없어요 (최대 ' + info.perUser + '개)' : '✏️ 신캐 만들어서 내기'}</button>`}
      </section>
      ${v.mine.length ? `<h2 class="ct-sec">내 출품작</h2>${v.mine.map((e) => entryCard(e, { mine: true, closed })).join('')}` : ''}
      ${v.dev ? `<h2 class="ct-sec">전체 출품작 (${v.all.length}) <small>개발자에게만 보여요</small></h2>${v.all.length ? v.all.map((e) => entryCard(e, { dev: true, closed })).join('') : '<section class="panel"><p class="muted">아직 출품작이 없어요.</p></section>'}` : ''}`;
    app.querySelector('#back').onclick = showEvents;
    app.querySelector('#ct-new')?.addEventListener('click', () => showContestForm());
    app.querySelectorAll('[data-del]').forEach((b) => { b.onclick = async () => { if (!confirm('이 출품작을 지울까요?')) return; try { v = await api('POST', '/api/contest/delete', { id: b.dataset.del }); render(); toast('지웠어요.'); } catch (e) { toast(e.message); } }; });
    const every = [...v.mine, ...(v.all || [])];
    app.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => { const e = v.mine.find((x) => x.id === b.dataset.edit); if (e) showContestForm(e); }; });
    app.querySelectorAll('[data-open]').forEach((b) => { b.onclick = () => { const e = every.find((x) => x.id === b.dataset.open); if (e) openContestDex(e); }; });
    app.querySelectorAll('[data-win]').forEach((b) => { b.onclick = async () => { try { v = await api('POST', '/api/contest/winner', { id: b.dataset.win }); render(); } catch (e) { toast(e.message); } }; });
  };
  render();
}

// 손가락이나 마우스로 그리는 그림판 (사진을 올려 그 위에 그릴 수도 있음)
// 사진 열기: 휴대폰 사진의 회전 정보도 반영. HEIC는 브라우저가 못 여는 경우가 많아 안내.
async function loadPicture(f) {
  if (f.size > 25e6) throw new Error('사진이 너무 커요 (25MB까지).');
  try { return await createImageBitmap(f, { imageOrientation: 'from-image' }); } catch { /* 아래 방법으로 */ }
  const url = URL.createObjectURL(f);
  try {
    return await new Promise((ok, no) => { const img = new Image(); img.onload = () => ok(img); img.onerror = no; img.src = url; });
  } catch {
    throw new Error(/hei[cf]/i.test(f.type + f.name) ? 'HEIC 사진은 열 수 없어요. 스크린샷을 찍거나 JPG/PNG로 올려 주세요.' : '그림 파일을 열 수 없어요. JPG나 PNG로 올려 주세요.');
  } finally { setTimeout(() => URL.revokeObjectURL(url), 2000); }
}
function drawPad(root) {
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const N = 480; cv.width = cv.height = N;
  const blank = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, N, N); };
  blank();
  let color = '#1a1433', size = 6, erase = false, down = false, used = false, last = null;
  const hist = [];
  const snap = () => { hist.push(ctx.getImageData(0, 0, N, N)); if (hist.length > 25) hist.shift(); };
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * N, y: ((e.clientY - r.top) / r.height) * N }; };
  const line = (a, b) => { ctx.strokeStyle = erase ? '#fff' : color; ctx.lineWidth = erase ? size * 3 : size; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); snap(); down = true; used = true; last = pos(e); line(last, { x: last.x + .1, y: last.y }); });
  cv.addEventListener('pointermove', (e) => { if (!down) return; const p = pos(e); line(last, p); last = p; });
  const up = () => { down = false; };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  root.querySelectorAll('[data-col]').forEach((b) => { b.onclick = () => { color = b.dataset.col; erase = false; root.querySelectorAll('[data-col],[data-tool]').forEach((x) => x.classList.toggle('on', x === b)); }; });
  root.querySelectorAll('[data-size]').forEach((b) => { b.onclick = () => { size = +b.dataset.size; root.querySelectorAll('[data-size]').forEach((x) => x.classList.toggle('on', x === b)); }; });
  root.querySelector('[data-tool=erase]').onclick = (ev) => { erase = true; root.querySelectorAll('[data-col],[data-tool]').forEach((x) => x.classList.toggle('on', x === ev.currentTarget)); };
  root.querySelector('[data-tool=undo]').onclick = () => { const h = hist.pop(); if (h) ctx.putImageData(h, 0, 0); };
  root.querySelector('[data-tool=clear]').onclick = () => { snap(); blank(); used = false; };
  const file = root.querySelector('input[type=file]');
  root.querySelector('[data-tool=photo]').onclick = () => file.click();
  file.onchange = async () => {
    const f = file.files?.[0]; file.value = '';
    if (!f) return;
    try {
      const img = await loadPicture(f);
      snap(); blank();
      const iw = img.width || img.naturalWidth, ih = img.height || img.naturalHeight;
      const k = Math.min(N / iw, N / ih), w = iw * k, h = ih * k;
      ctx.drawImage(img, (N - w) / 2, (N - h) / 2, w, h);
      img.close?.();
      used = true;
      toast('사진을 넣었어요. 위에 덧그려도 돼요!');
    } catch (e) { toast(e.message); }
  };
  const load = (src) => new Promise((ok) => { const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0, N, N); used = true; ok(); }; img.onerror = ok; img.src = src; });
  return { load, used: () => used, data: () => { for (const q of [.85, .7, .55]) { const d = cv.toDataURL('image/jpeg', q); if (d.length < 380000) return d; } return cv.toDataURL('image/jpeg', .4); } };
}

function showContestForm(edit = null) {
  G.screen = 'contest-form';
  const types = Object.entries(G.data.TYPES).filter(([k]) => k !== 'none');
  const COLS = ['#1a1433', '#ffffff', '#E8402C', '#FF8A00', '#FFD23F', '#4CD964', '#2F7DE1', '#7FB8A4', '#9A4FB8', '#F27FA5', '#A9713A', '#7C8798'];
  const padHTML = (id) => `<div class="pad" id="${id}">
      <canvas aria-label="그림판"></canvas>
      <div class="pad-tools">${COLS.map((c, i) => `<button type="button" class="pc ${i ? '' : 'on'}" data-col="${c}" style="--c:${c}" aria-label="색"></button>`).join('')}</div>
      <div class="pad-tools">
        ${[3, 6, 12, 22].map((n) => `<button type="button" class="ps ${n === 6 ? 'on' : ''}" data-size="${n}" aria-label="굵기 ${n}"><i style="width:${n / 1.4 + 2}px;height:${n / 1.4 + 2}px"></i></button>`).join('')}
        <button type="button" class="pt" data-tool="erase">지우개</button><button type="button" class="pt" data-tool="undo">되돌리기</button><button type="button" class="pt" data-tool="clear">전부 지우기</button>
        <button type="button" class="pt pfile" data-tool="photo">📷 사진 넣기</button><input type="file" accept="image/*" class="vh">
      </div></div>`;
  const typeSel = (cls, none = '타입') => `<select class="${cls}"><option value="">${none}</option>${types.map(([k, t]) => `<option value="${k}">${t.n}</option>`).join('')}</select>`;
  const statInputs = (cls, ph) => CT_STATS.map((k) => `<label class="ct-stat"><span>${STAT_LABEL[k]}</span><input type="number" inputmode="numeric" min="0" max="${cls === 'b' ? 255 : 100}" class="ct-${cls}" data-k="${k}" placeholder="${ph}"><i></i></label>`).join('');
  const moveRow = (i) => `<div class="ct-mv" data-i="${i}">
      <div class="ct-mv-top"><b>${i + 1}</b><input class="m-n" maxlength="16" placeholder="기술 이름"></div>
      <div class="ct-mv-sel">${typeSel('m-type')}<select class="m-cat"><option value="p">물리</option><option value="s">특수</option><option value="x">변화</option></select>
        <label class="m-sigl"><input class="m-sig" type="checkbox"> 전용기</label></div>
      <div class="ct-mv-nums"><label>위력<input class="m-pow" type="number" inputmode="numeric" min="0" max="300" placeholder="80"></label><label>명중<input class="m-acc" type="number" inputmode="numeric" min="0" max="100" placeholder="100"></label><label>PP<input class="m-pp" type="number" inputmode="numeric" min="1" max="40" placeholder="10"></label></div>
      <input class="m-d" maxlength="120" placeholder="효과 (예: 30% 확률로 화상)"></div>`;
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>${edit ? '출품작 수정' : '신캐 만들기'}</h1></div>
    <p class="ct-tip">도감과 같은 모양으로 만들어요. <b>이름과 설명</b>만 꼭 쓰면 되고, 나머지는 생각해 둔 만큼만 채워 주세요.</p>
    <section class="panel ct-form">
      <label class="fl">이름 <small>12자까지</small><input id="ct-name" maxlength="12" placeholder="예: 등신"></label>
      <div class="fl">타입 <small>2개까지</small><div class="ct-types">${types.map(([k, t]) => `<button type="button" data-type="${k}" style="--tc:${t.c}">${t.n}</button>`).join('')}</div></div>
      <h3 class="dex-h">디자인 <small>직접 그리거나 사진을 넣어요 (사진 위에 덧그려도 돼요)</small></h3>
      ${padHTML('pad-base')}
      <h3 class="dex-h">능력치 <small>0~255</small></h3>
      <div class="ct-stats">${statInputs('b', '80')}<p class="ct-sum">합계 <b id="sum-b">0</b></p></div>
      <label class="fl">설명 <small>꼭 써 주세요! 어떤 골목몬인지, 생김새·성격·사연</small><textarea id="ct-desc" rows="4" maxlength="1000" placeholder="예: 구멍 스물두 개로 숨을 쉰다. 다 타면 하얗게 삐친다."></textarea></label>
      <div class="ct-traitbox"><b>특성</b><input id="ct-tn" maxlength="12" placeholder="특성 이름 (예: 불꽃의무장)"><textarea id="ct-td" rows="2" maxlength="300" placeholder="특성 효과 (예: 얼음 상태가 되지 않는다)"></textarea></div>
      <section class="megabox ct-megaf"><h3>메가진화 <small>선택</small></h3>
        <input id="ct-mn" maxlength="16" placeholder="메가진화 이름 (예: 불판 연탄대왕)">
        ${padHTML('pad-mega')}
        <p class="ct-mhint">능력치 증가 (+)</p>
        <div class="ct-stats">${statInputs('m', '+0')}<p class="ct-sum">증가 합계 <b id="sum-m">0</b></p></div>
        <textarea id="ct-md" rows="3" maxlength="400" placeholder="메가진화 설명"></textarea></section>
      <section class="zbox ct-zf" style="--zc:#E8402C"><span>Z기술 <small>선택</small></span>
        <input id="ct-zn" maxlength="16" placeholder="Z기술 이름 (예: 구공탄 대폭발)">
        <div class="ct-zrow">${typeSel('z-type')}<select class="z-cat"><option value="p">물리</option><option value="s">특수</option></select></div>
        <label class="ct-zpow">위력<input class="z-pow" type="number" inputmode="numeric" min="0" max="400" placeholder="180"></label>
        <input id="ct-zd" maxlength="160" placeholder="Z기술 효과"></section>
      <h3 class="dex-h">배울 수 있는 스킬 <small>10개까지 · 이름을 쓴 칸만 들어가요</small></h3>
      <div id="ct-moves">${[0, 1, 2, 3].map(moveRow).join('')}</div>
      <button type="button" class="btn small paper" id="ct-addmv">+ 기술 칸 추가</button>
      <button class="btn wide" id="ct-send">${edit ? '수정한 내용 저장' : '공모전에 내기'}</button>
    </section>`;
  app.querySelector('#back').onclick = () => showContest();
  const pad = drawPad(app.querySelector('#pad-base')), mpad = drawPad(app.querySelector('#pad-mega'));
  const picked = [];
  app.querySelectorAll('[data-type]').forEach((b) => {
    b.onclick = () => {
      const t = b.dataset.type, i = picked.indexOf(t);
      if (i >= 0) picked.splice(i, 1); else { if (picked.length >= 2) picked.shift(); picked.push(t); }
      app.querySelectorAll('[data-type]').forEach((x) => x.setAttribute('aria-pressed', picked.includes(x.dataset.type)));
    };
  });
  const sums = () => {
    for (const c of ['b', 'm']) {
      let sum = 0;
      app.querySelectorAll(`.ct-${c}`).forEach((inp) => { const n = Math.max(0, +inp.value || 0); sum += n; inp.nextElementSibling.style.width = `${Math.min(100, n / (c === 'b' ? 1.3 : .6))}%`; });
      app.querySelector(`#sum-${c}`).textContent = sum;
    }
  };
  app.querySelectorAll('.ct-b, .ct-m').forEach((i) => { i.oninput = sums; });
  app.querySelector('#ct-addmv').onclick = (ev) => {
    const box = app.querySelector('#ct-moves'), n = box.children.length;
    if (n >= 10) return toast('기술은 10개까지예요.');
    box.insertAdjacentHTML('beforeend', moveRow(n));
    if (n + 1 >= 10) ev.currentTarget.disabled = true;
  };
  const num = (el) => (el && el.value !== '' ? Math.round(+el.value) : 0);
  // 수정: 예전에 낸 내용 채우기
  if (edit) {
    const set = (sel, v) => { const el = app.querySelector(sel); if (el && v != null) el.value = v; };
    set('#ct-name', edit.name); set('#ct-desc', edit.desc);
    (edit.types || []).forEach((t) => app.querySelector(`[data-type="${t}"]`)?.click());
    for (const k of CT_STATS) { if (edit.base?.[k]) set(`.ct-b[data-k=${k}]`, edit.base[k]); if (edit.mega?.boost?.[k]) set(`.ct-m[data-k=${k}]`, edit.mega.boost[k]); }
    const tr = typeof edit.trait === 'string' ? { n: '', d: edit.trait } : edit.trait || {};
    set('#ct-tn', tr.n); set('#ct-td', tr.d);
    set('#ct-mn', edit.mega?.n); set('#ct-md', edit.mega?.d);
    set('#ct-zn', edit.z?.n); set('.z-type', edit.z?.type || ''); set('.z-cat', edit.z?.cat || 'p'); if (edit.z?.pow) set('.z-pow', edit.z.pow); set('#ct-zd', edit.z?.d);
    const list = Array.isArray(edit.moves) ? edit.moves : typeof edit.moves === 'string' && edit.moves ? [{ n: '기술셋', cat: 'x', d: edit.moves.slice(0, 120) }] : [];
    while (app.querySelectorAll('.ct-mv').length < Math.min(10, list.length)) app.querySelector('#ct-addmv').click();
    const rows = app.querySelectorAll('.ct-mv');
    list.slice(0, 10).forEach((m, i) => {
      const r = rows[i], put = (c, v) => { const el = r.querySelector(c); if (el && v) el.value = v; };
      put('.m-n', m.n); put('.m-type', m.type); put('.m-cat', m.cat); put('.m-pow', m.pow); put('.m-acc', m.acc); put('.m-pp', m.pp); put('.m-d', m.d);
      r.querySelector('.m-sig').checked = !!m.sig;
    });
    sums();
    if (edit.image) pad.load(edit.image);
    if (edit.mega?.image) mpad.load(edit.mega.image);
  }
  app.querySelector('#ct-send').onclick = async (ev) => {
    const val = (id) => app.querySelector(id).value.trim();
    if (!val('#ct-name')) return toast('골목몬 이름을 넣어 주세요.');
    if (!val('#ct-desc')) return toast('골목몬 설명을 넣어 주세요.');
    const stats = (c) => Object.fromEntries([...app.querySelectorAll(`.ct-${c}`)].map((i) => [i.dataset.k, num(i)]));
    const moves = [...app.querySelectorAll('.ct-mv')].map((r) => ({
      n: r.querySelector('.m-n').value.trim(), type: r.querySelector('.m-type').value, cat: r.querySelector('.m-cat').value,
      pow: num(r.querySelector('.m-pow')), acc: num(r.querySelector('.m-acc')), pp: num(r.querySelector('.m-pp')), d: r.querySelector('.m-d').value.trim(), sig: r.querySelector('.m-sig').checked,
    })).filter((m) => m.n);
    const body = {
      name: val('#ct-name'), types: picked, desc: val('#ct-desc'), base: stats('b'),
      trait: { n: val('#ct-tn'), d: val('#ct-td') },
      mega: { n: val('#ct-mn'), d: val('#ct-md'), boost: stats('m'), image: mpad.used() ? mpad.data() : '' },
      z: { n: val('#ct-zn'), type: app.querySelector('.z-type').value, cat: app.querySelector('.z-cat').value, pow: num(app.querySelector('.z-pow')), d: val('#ct-zd') },
      moves, image: pad.used() ? pad.data() : '',
    };
    const btn = ev.currentTarget; btn.disabled = true; btn.textContent = '보내는 중...';
    try {
      if (edit) body.id = edit.id;
      await api('POST', '/api/contest', body);
      toast(edit ? '수정했어요!' : '공모전에 냈어요! 행운을 빌어요 🍀');
      showContest();
    } catch (e) { toast(e.message); btn.disabled = false; btn.textContent = edit ? '수정한 내용 저장' : '공모전에 내기'; }
  };
}

function showFields() {
  G.screen = 'fields';
  const M = G.data.MOVES, MON = G.data.MONSTERS;
  const byMove = (f) => Object.entries(M).filter(([, m]) => !m.z && f(m)).map(([id]) => id);
  const learners = (id) => Object.keys(MON).filter((k) => MON[k].moves.includes(id) && !isSecret(k));
  const moveChip = (id) => `<span class="fe-move" style="--tc:${G.data.TYPES[M[id].type].c}">${M[id].n}</span>`;
  const monChip = (id) => (isSecret(id) ? '' : `<span class="fe-mon">${monsterSVG(id)}<b>${MON[id].n}</b>${MON[id].trait ? `<small>${MON[id].trait.n}</small>` : ''}</span>`);
  const moveRow = (ids) => ids.map((id) => `<div class="fe-mrow">${moveChip(id)}<span class="fe-who">${learners(id).map((k) => MON[k].n).join(', ')}</span></div>`).join('');
  const FIELDS = [
    { id: 'sun', name: '땡볕', kind: '날씨 · 5턴', bg: 'linear-gradient(#FFB52E, #FFD23F)',
      fx: ['불 기술 위력 1.5배', '물 기술 위력 절반', '붕빵이가 바삭해짐 (크리스피)'],
      moves: byMove((m) => m.weather === 'sun'), traits: [], related: ['bungbbang'] },
    { id: 'rain', name: '소나기', kind: '날씨 · 5턴', bg: 'linear-gradient(#5b6a8a, #6f7f9e)',
      fx: ['물 기술 위력 1.5배', '불 기술 위력 절반', '역류·우산살 찌르기는 위력 2배', '빗물받이 Z기술 대범람 위력 1.5배', '붕빵이가 눅눅해짐 (크리스피)'],
      moves: byMove((m) => m.weather === 'rain'), traits: ['usan'], related: ['batji', 'bungbbang'] },
    { id: 'dust', name: '황사', kind: '날씨 · 5턴', bg: 'linear-gradient(#C9A25A, #D9B66A)',
      fx: ['매 턴 끝에 땅·쇠 타입이 아닌 골목몬은 최대 체력의 1/16 피해'],
      moves: byMove((m) => m.weather === 'dust'), traits: ['hwangsari'], related: [] },
    { id: 'snow', name: '눈', kind: '날씨 · 5턴', bg: 'linear-gradient(#9fb4cc, #c3d3e4)',
      fx: ['얼음 타입 골목몬의 방어 1.5배 (물리 공격을 덜 받음)', '대야몽의 방어·특방 2배 (김장)'],
      moves: byMove((m) => m.weather === 'snow'), traits: ['bingsu'], related: ['daeya'] },
    { id: 'grass', name: '그래스필드', kind: '깐 쪽 바닥 · 5턴', bg: 'linear-gradient(#3FA34D, #7ed957)',
      fx: ['깐 쪽(콩시루 편)에만 깔림', '그 편의 풀 기술 위력 1.3배', '매 턴 끝에 그 편 골목몬이 최대 체력의 1/16 회복'],
      moves: [], traits: ['kongsiru'], trigger: '콩시루가 공격에 맞으면 펼쳐짐', related: [] },
    { id: 'tack', name: '압정', kind: '상대 쪽 바닥 · 치울 때까지', bg: 'linear-gradient(#5C5A72, #8a8f98)',
      fx: ['압정이 깔린 쪽으로 새로 나오는 골목몬은 최대 체력의 1/8 피해', '바람 타입과 오락이(돈지랄)는 피해 없음'],
      moves: byMove((m) => m.hazard), traits: [], related: ['orak'],
      clear: byMove((m) => m.clearHazard) },
  ];
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>필드 효과</h1></div>
    <section class="panel">
      <p class="muted">날씨와 바닥은 한 번에 하나씩만 깔립니다. 새 날씨가 오면 이전 날씨는 사라집니다. 싸리비(정리정돈)가 나오면 날씨, 그래스필드, 싸리비 쪽 압정이 치워집니다.</p>
      <div class="fe-jump">${FIELDS.map((f) => `<button data-jump="${f.id}" style="background:${f.bg}">${f.name}</button>`).join('')}</div>
    </section>
    <div class="fe-list">${FIELDS.map((f) => `<section class="panel fe" id="fe-${f.id}">
      <div class="fe-head" style="background:${f.bg}"><h2>${f.name}</h2><span>${f.kind}</span></div>
      <h3>효과</h3><ul>${f.fx.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h3>일으키는 방법</h3>
      ${f.moves.length ? moveRow(f.moves) : ''}
      ${f.traits.map((k) => `<div class="fe-mrow">${monChip(k)}<span class="fe-who">${f.trigger || '싸움에 나오면 자동으로 깔림'}</span></div>`).join('')}
      ${f.clear ? `<h3>치우는 방법</h3>${moveRow(f.clear)}<div class="fe-mrow">${monChip('ssaribi')}<span class="fe-who">싸움에 나오면 치움</span></div>` : ''}
      ${f.related.length ? `<h3>영향받는 특성</h3><div class="fe-mons">${f.related.map(monChip).join('')}</div>` : ''}
    </section>`).join('')}</div>`;
  app.querySelector('#back').onclick = showLobby;
  app.querySelectorAll('[data-jump]').forEach((b) => { b.onclick = () => app.querySelector(`#fe-${b.dataset.jump}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
}

function matchups(id) {
  const groups = {};
  const types = Array.isArray(id) ? id : G.data.MONSTERS[id].types;
  for (const atk of Object.keys(G.data.TYPES)) {
    if (atk === 'none') continue;
    const eff = types.reduce((x, t) => x * (G.data.CHART[atk]?.[t] ?? 1), 1);
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
