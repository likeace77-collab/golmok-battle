// 레이드: 거다이 레이드 · 흑화 메가배틀 (최대 4명이 한 팀)
let raidRoom = null;
const darkArt = (species, shiny) => `<div class="dark-art">${monArt(species, shiny, '', true)}</div>`;

async function showRaid(back = showLobby) {
  G.screen = 'raid'; app.className = '';
  app.innerHTML = `${topbar('레이드')}<p class="wait">불러오는 중…</p>`;
  app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/raid')).raid; } catch (e) { return toast(e.message); }
  if (G.screen !== 'raid') return;
  raidRoom = v.room;
  const me = G.user.name;
  const rules = `<p class="muted" style="font-size:12px">최대 ${v.max}명이 한 팀 · 각자 ${v.size}마리 · ${v.limit}턴 안에 보스를 쓰러뜨려야 해요. 보스는 모든 공격이 광역이고, 2턴마다 충격파를 날려요. 사람이 모자라면 골목 용병(봇)이 빈 자리를 채워요. 이긴 보상은 하루 ${v.daily}번 (오늘 <b>${v.left}번</b> 남음).</p>`;
  let body;
  if (v.room) {
    const r = v.room, host = r.hostKey === G.user.key || r.host === me;
    const art = r.mode === 'dark' ? darkArt(r.target.species, r.target.shiny) : `<div class="rd-gx">${gmaxSVG(v.boss.species)}</div>`;
    const empty = v.max - r.members.length;
    const invites = v.friends.filter((f) => !r.members.some((m) => m.name === f.name));
    body = `<section class="rd-room ${r.mode}"><s aria-hidden="true"></s>${art}
        <h2>${r.mode === 'dark' ? '💜 흑화 메가배틀' : '🔥 거다이 레이드'}</h2><b class="rd-title">${esc(r.title)}</b>
        <div class="rd-mem">${r.members.map((m) => `<div class="${m.online ? '' : 'off'}"><span class="ava">${avatarSVG(m.avatar)}</span><b>${esc(m.name)}</b>${m.name === r.host ? '<small>👑 방장</small>' : ''}</div>`).join('')}
          ${Array.from({ length: empty }, () => `<div class="rd-empty"><span class="ava">${r.bots ? '🤖' : '＋'}</span><b>${r.bots ? '골목 용병' : '빈 자리'}</b></div>`).join('')}</div>
        ${host ? `<label class="rd-bots"><input type="checkbox" id="rd-bots" ${r.bots ? 'checked' : ''}> 빈 자리는 골목 용병(봇)으로 채우기</label>
          <button class="btn wide rd-go" id="rd-start">⚔️ 출발! (${r.bots ? v.max : r.members.length}명)</button>` : '<p class="wait">방장이 출발하기를 기다리는 중…</p>'}
        <button class="btn paper small" id="rd-leave">대기실 나가기</button>
      </section>
      <section class="panel"><h2>친구 초대</h2>${invites.length ? invites.map((f) => `<div class="rd-fr"><span class="ava">${avatarSVG(f.avatar)}</span><b>${esc(f.name)}</b><small>${f.busy ? '대전 중' : f.online ? '🟢 접속 중' : '접속 안 함'}</small><button class="btn small" data-inv="${esc(f.key)}" ${f.online && !f.busy ? '' : 'disabled'}>초대</button></div>`).join('') : '<p class="muted">초대할 친구가 없어요. 길드원·친구는 레이드 화면에서 이 방을 보고 들어올 수 있어요.</p>'}</section>`;
  } else {
    body = `<section class="rd-hero"><s aria-hidden="true"></s><div class="rd-gx">${gmaxSVG(v.boss.species)}</div>
        <small>오늘의 거다이 레이드</small><h2>거다이 ${esc(v.boss.name)}</h2><p>${esc(v.boss.gname)} · +5 강화 · 판 내내 거다이맥스</p>
        <div class="rws">${rewardChips(v.reward.gmax)}</div>
        <button class="btn wide rd-go" id="rd-gmax">🔥 레이드 방 만들기</button></section>
      <section class="rd-hero dark"><s aria-hidden="true"></s>
        <small>흑화 메가배틀 · 1 대 4</small><h2>흑화한 친구를 정화하라!</h2><p>친구의 에이스가 어둠에 물들어 +5 강화·메가진화한 채로 나타나요. 이기면 그 친구에게도 정화 선물이 가요.</p>
        <div class="rws">${rewardChips(v.reward.dark)}</div>
        <div class="rd-pick">${v.friends.length ? v.friends.map((f) => `<button class="rd-f" data-dark="${esc(f.key)}" ${f.ace ? '' : 'disabled'}>${f.ace ? darkArt(f.ace.species, f.ace.shiny) : '<div class="dark-art">❔</div>'}<b>${esc(f.name)}</b><small>${f.ace ? `${esc(G.data.MONSTERS[f.ace.species].n)}${f.ace.plus ? ` +${f.ace.plus}` : ''}` : '덱이 비었어요'}</small></button>`).join('') : '<p>친구를 먼저 추가해 보세요!</p>'}</div>
      </section>`;
  }
  const open = v.open.length ? `<section class="panel"><h2>친구·길드원의 레이드</h2>${v.open.map((l) => `<div class="rd-fr"><span class="ava">${l.mode === 'dark' ? '💜' : '🔥'}</span><b>${esc(l.title)}</b><small>${esc(l.host)} · ${l.members.length}/${v.max}명</small><button class="btn small" data-join="${l.id}">참가</button></div>`).join('')}</section>` : '';
  app.innerHTML = `${topbar('레이드')}${body}${open}<section class="panel">${rules}</section>`;
  app.querySelector('#back').onclick = back;
  const $ = (s) => app.querySelector(s);
  if ($('#rd-gmax')) $('#rd-gmax').onclick = () => wsSend({ t: 'raid_open', mode: 'gmax' });
  app.querySelectorAll('[data-dark]').forEach((b) => { b.onclick = () => wsSend({ t: 'raid_open', mode: 'dark', friend: b.dataset.dark }); });
  app.querySelectorAll('[data-join]').forEach((b) => { b.onclick = () => wsSend({ t: 'raid_join', id: b.dataset.join }); });
  app.querySelectorAll('[data-inv]').forEach((b) => { b.onclick = () => { wsSend({ t: 'raid_invite', to: b.dataset.inv }); b.disabled = true; b.textContent = '보냄'; }; });
  if ($('#rd-bots')) $('#rd-bots').onchange = (e) => wsSend({ t: 'raid_bots', on: e.target.checked });
  if ($('#rd-start')) $('#rd-start').onclick = () => wsSend({ t: 'raid_start' });
  if ($('#rd-leave')) $('#rd-leave').onclick = () => wsSend({ t: 'raid_leave' });
}

function onRaidMsg(m) {
  if (m.t === 'raid_room') { raidRoom = m.room; if (G.screen === 'raid') showRaid(); else if (m.room && G.screen !== 'battle') showRaid(); return; }
  if (m.t === 'raid_invite') {
    if (G.screen === 'battle') return toast(`${m.from}님이 레이드에 초대했어요: ${m.title}`);
    const bg = openSheet(`<h2>${m.mode === 'dark' ? '💜' : '🔥'} 레이드 초대</h2><p><b>${esc(m.from)}</b>님이 <b>${esc(m.title)}</b> 레이드에 초대했어요!</p>
      <div class="row"><button class="btn" id="ri-ok">참가하기</button><button class="btn paper" id="ri-no">나중에</button></div>`);
    bg.querySelector('#ri-ok').onclick = () => { closeSheet(); wsSend({ t: 'raid_join', id: m.id }); };
    bg.querySelector('#ri-no').onclick = closeSheet;
  }
}
