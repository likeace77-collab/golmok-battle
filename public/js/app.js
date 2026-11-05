// 화면 전환, 로그인, 로비, 아바타, 팀 편성
const app = document.getElementById('app');
const sheetRoot = document.getElementById('sheet-root');
const G = { data: null, user: null, ws: null, lobby: { players: [], incoming: [], outgoing: null }, size: 3, screen: 'auth' };
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
      ${signup && G.data.inviteRequired ? '<label class="field">초대 코드<input name="invite" required></label>' : ''}
      <p class="err" id="err"></p>
      <button class="btn wide">${signup ? '계정 만들기' : '로그인'}</button>
    </form></div>`;
  app.querySelectorAll('[data-m]').forEach((b) => { b.onclick = () => showAuth(b.dataset.m); });
  app.querySelector('#f').onsubmit = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.target));
    try {
      const { user } = await api('POST', signup ? '/api/signup' : '/api/login', body);
      G.user = user; connect(); showLobby();
    } catch (err) { app.querySelector('#err').textContent = err.message; }
  };
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
    case 'opp_conn': Battle.setNote(m.online ? '상대가 돌아왔습니다.' : `상대가 나갔습니다. ${m.grace}초 안에 돌아오지 않으면 승리합니다.`); break;
    default:
  }
}

/* ---------- 로비 ---------- */
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
        <div class="ava lg">${avatarSVG(u.avatar)}</div>
        <div>
          <h1>${esc(u.name)}</h1>
          <p class="muted">${u.wins}승 ${u.losses}패${u.draws ? ` ${u.draws}무` : ''}</p>
          ${rival ? `<p class="muted">${rival}</p>` : ''}
        </div>
      </div>
      <div class="nav">
        <button class="btn paper" id="go-team">덱 관리</button>
        <button class="btn paper" id="go-ava">아바타 꾸미기</button>
        <button class="btn mint" id="go-dex" style="grid-column:1/-1">도감</button>
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
          <div class="nm">${esc(p.name)}<small>${p.busy ? '대전 중' : `${p.wins}승 ${p.losses}패`}</small></div>
          ${out ? '<button class="btn small paper" data-cancel>신청 취소</button>'
            : `<button class="btn small" data-ch="${esc(p.key)}" ${p.busy ? 'disabled' : ''}>대전 신청</button>`}
        </div>`;
      }).join('') : '<p class="muted">아직 아무도 없습니다. 친구에게 이 주소를 보내세요.</p>'}
    </section>
    <section class="panel">
      <h2>혼자 연습</h2>
      <button class="btn wide mint" id="go-bot">골목대장과 ${G.size}대${G.size}</button>
    </section>
    <p style="text-align:center;margin-top:16px"><button class="btn small paper" id="logout">로그아웃</button></p>`;
  app.querySelector('#go-team').onclick = showDecks;
  app.querySelector('#go-ava').onclick = showAvatar;
  app.querySelector('#go-dex').onclick = showDex;
  app.querySelector('#go-bot').onclick = () => wsSend({ t: 'practice', size: G.size });
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

/* ---------- 아바타 ---------- */
function showAvatar() {
  G.screen = 'avatar';
  const draft = { ...G.user.avatar };
  const swatch = { skin: SKIN, hairColor: HAIR_C, outfitColor: CLOTH_C, bg: BG_C };
  const render = () => {
    app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>아바타 꾸미기</h1></div>
      <div class="ava-hero">${avatarSVG(draft)}</div>
      <section class="panel">
        ${Object.entries(G.data.AVATAR_OPTIONS).map(([k, n]) => `<div class="opt"><span>${AVATAR_LABELS[k]}</span><div class="chips">
          ${Array.from({ length: n }, (_, i) => `<button data-k="${k}" data-v="${i}" aria-pressed="${draft[k] === i}" aria-label="${AVATAR_LABELS[k]} ${i + 1}"
            ${swatch[k] ? `style="background:${swatch[k][i]}"` : ''}>${swatch[k] ? '' : k === 'hat' && i === 0 ? '없음' : i + 1}</button>`).join('')}
        </div></div>`).join('')}
        <div class="row" style="margin-top:12px">
          <button class="btn paper" id="rand">무작위</button>
          <button class="btn" id="save" style="flex:1">저장하기</button>
        </div>
      </section>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { draft[b.dataset.k] = +b.dataset.v; const y = scrollY; render(); scrollTo(0, y); }; });
    app.querySelector('#rand').onclick = () => {
      for (const [k, n] of Object.entries(G.data.AVATAR_OPTIONS)) draft[k] = Math.floor(Math.random() * n);
      render();
    };
    app.querySelector('#save').onclick = async () => {
      try { G.user = (await api('PUT', '/api/avatar', draft)).user; toast('아바타를 저장했습니다.'); showLobby(); }
      catch (e) { toast(e.message); }
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
    <p style="color:#fff;margin-bottom:12px">덱 ${decks.length}/5개. 덱을 눌러 이름과 요괴, 기술을 바꿉니다.</p>
    ${decks.map((d, i) => `<div class="deck ${i === G.user.active ? 'on' : ''}">
      <button class="deck-main" data-open="${i}">
        <b>${esc(d.name)}</b>${i === G.user.active ? '<em>대전에 사용</em>' : ''}
        <span class="mini">${d.team.map((m) => monsterSVG(m.species)).join('')}</span>
      </button>
      <div class="deck-acts">
        <button class="btn small mint" data-use="${i}" ${i === G.user.active ? 'disabled' : ''}>사용</button>
        <button class="btn small paper" data-del="${i}" ${decks.length > 1 ? '' : 'disabled'}>삭제</button>
      </div></div>`).join('')}
    ${decks.length < 5 ? '<button class="slot empty" id="new-deck">새 덱 만들기</button>' : ''}`;
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
        <label class="field" style="margin:0">덱 이름<input id="deck-name" maxlength="12" value="${esc(deck.name)}"></label>
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

function pickMonster(team, done) {
  const used = new Set(team.map((m) => m.species));
  const bg = openSheet(`<div class="row"><h2>요괴 고르기</h2><button class="btn small paper" data-x>닫기</button></div>
    <div class="grid">${Object.entries(G.data.MONSTERS).map(([id, m]) => `<button class="card" data-id="${id}" ${used.has(id) ? 'disabled' : ''}
      style="--tc:${G.data.TYPES[m.types[0]].c}">${monsterSVG(id)}<span>${m.n}</span></button>`).join('')}</div>`);
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
      <h3 style="font-family:var(--ui);font-weight:400;margin-bottom:6px">기술 ${slot.moves.length}/4</h3>
      ${sp.moves.map((id) => `<button class="mv" data-mv="${id}" aria-pressed="${slot.moves.includes(id)}">
        ${typeChip(G.data.MOVES[id].type)}<b>${G.data.MOVES[id].n}</b><small>${moveLine(id)}</small></button>`).join('')}`);
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
        <div class="grid">${list.map((id) => `<button class="card" data-dex="${id}" style="--tc:${G.data.TYPES[G.data.MONSTERS[id].types[0]].c}">${monsterSVG(id)}<span>${ids.indexOf(id) + 1}. ${G.data.MONSTERS[id].n}</span></button>`).join('')}</div>
      </section>`;
    app.querySelector('#back').onclick = showLobby;
    app.querySelectorAll('[data-t]').forEach((b) => { b.onclick = () => { G.dexType = b.dataset.t; render(); }; });
    app.querySelectorAll('[data-dex]').forEach((b) => { b.onclick = () => openDexEntry(b.dataset.dex); });
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
    <h3 class="dex-h">타입 상성</h3>
    ${matchups(id)}
    <h3 class="dex-h">배울 수 있는 스킬 ${sp.moves.length}개</h3>
    ${sp.moves.map((m) => `<div class="mv">${typeChip(G.data.MOVES[m].type)}<b>${G.data.MOVES[m].n}</b><small>${moveLine(m)}</small></div>`).join('')}`);
  bg.querySelector('[data-x]').onclick = closeSheet;
}

/* ---------- 시작 ---------- */
(async () => {
  G.data = await api('GET', '/api/data');
  try {
    G.user = (await api('GET', '/api/me')).user;
    showLobby(); connect();
  } catch { showAuth(); }
})();
