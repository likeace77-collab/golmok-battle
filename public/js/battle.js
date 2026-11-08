// 배틀 화면과 연출
const Battle = (() => {
  let view = null, disp = null, note = '', menu = 'moves', practice = false, training = false;
  let queue = Promise.resolve(), playing = false, skip = null, armed = false;
  let spectating = false, tag = false, moveDraft = null, zLockTurn = -1;
  let trainers = {};
  const has3D = () => typeof Avatar3D !== 'undefined' && !!Avatar3D;
  const avatarOf = (key) => (key === 'me' ? view.me : key === 'ally' ? view.ally : key === 'opp' ? view.opps[0] : view.opps[1])?.avatar;
  const trainer = (key) => trainers[key];
  let deadline = 0, tick = null, gen = 0;
  const SPEED = Number(new URLSearchParams(location.search).get('speed') ?? 1); // ?speed=0 이면 연출 생략

  const wait = (ms) => new Promise((res) => {
    const t = setTimeout(res, ms * SPEED);
    skip = () => { clearTimeout(t); res(); };
  });
  const STATUS = { brn: '화상', psn: '독', par: '마비', slp: '수면', frz: '얼음' };
  const WEATHER = { sun: '땡볕', rain: '소나기', dust: '황사', snow: '눈' };
  const $ = (s) => app.querySelector(s);

  // 바닥에 깔린 압정. 자리는 쪽마다 고정이라 판 내내 같은 곳에 보입니다.
  function tackLayer(side, cx, cy, rx, ry) {
    const spots = [[-.9, .1], [-.62, -.5], [-.5, .55], [-.2, -.1], [-.05, .8], [.1, -.7], [.32, .3], [.55, -.35], [.7, .6], [.92, -.05]];
    return `<g class="tk tk-${side}">${spots.map(([x, y], i) => {
      const tx = cx + x * rx, ty = cy + y * ry;
      return `<g transform="translate(${tx} ${ty}) rotate(${(i * 47) % 40 - 20})"><path d="M-1 0L0 7L1 0z" fill="#C7CDD6" stroke="#1a1433" stroke-width="1"/><ellipse rx="5" ry="2.5" fill="#F2B705" stroke="#1a1433" stroke-width="1.2"/></g>`;
    }).join('')}</g>`;
  }

  const SCENE = `<svg class="bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect class="sky" width="400" height="300" fill="#F27A4B"/><rect class="sky2" y="70" width="400" height="60" fill="#F7A24B"/>
    <g class="wx wx-sun"><g class="rays">${Array.from({ length: 12 }, (_, i) => `<path d="M0 -62L10 -130L-10 -130Z" fill="#FFE45C" transform="rotate(${i * 30})"/>`).join('')}</g></g>
    <circle class="sun" cx="300" cy="96" r="34" fill="#FFD23F"/>
    <path d="M0 150V96l34-18 34 18v-6h52v-22l44-14 40 14v30h34V72l52-16 52 16v22h58v56z" fill="#6A3A8C"/>
    <path d="M0 160v-34h80v-30l40-12 40 12v30h60v-22h76v22h50V96h54v64z" fill="#3B2A78"/>
    <g fill="#FFD23F"><rect x="22" y="134" width="12" height="12"/><rect x="124" y="108" width="12" height="12"/><rect x="238" y="124" width="12" height="12"/><rect x="346" y="112" width="12" height="12"/><rect x="366" y="134" width="12" height="12"/></g>
    <rect x="186" y="34" width="9" height="130" fill="#1a1433"/><rect x="162" y="48" width="56" height="6" fill="#1a1433"/>
    <path d="M0 40Q90 74 162 50M218 50q90 26 182-12M0 60q90 34 166 0" fill="none" stroke="#1a1433" stroke-width="2"/>
    <rect class="road" y="160" width="400" height="140" fill="#5C5A72"/><rect y="160" width="400" height="9" fill="#3a3550"/>
    <path d="M0 232h400" stroke="#FFD23F" stroke-width="4" stroke-dasharray="30 22"/>
    <g class="wx wx-rain"><path d="M0 0h400v46q-18 16-40 4-20 18-46 2-24 18-52 0-22 16-48 0-26 16-50-2-24 14-46 0-24 14-44 2-34 16-74-4z" fill="#3a3550"/>
      <path d="M0 0h400v24q-30 12-60 0-34 14-70 0-30 12-66 0-34 12-68 0-34 14-70 0-30 12-66 0z" fill="#59606c"/>
      <ellipse cx="60" cy="196" rx="44" ry="7" fill="#7fc8e8aa"/><ellipse cx="346" cy="250" rx="46" ry="8" fill="#7fc8e8aa"/><ellipse cx="206" cy="282" rx="52" ry="8" fill="#7fc8e8aa"/></g>
    <g class="wx wx-dust"><path d="M0 170q50-40 110-16t110-12 180 10v148H0z" fill="#D9B66A88"/></g>
    <g class="wx wx-snow"><path d="M0 168q60-10 120 0t140-4 140 6v130H0z" fill="#ffffffcc"/>
      ${Array.from({ length: 34 }, (_, i) => `<circle class="flake" cx="${(i * 53) % 400}" cy="${(i * 37) % 160}" r="${1.6 + (i % 3)}" fill="#fff" style="animation-delay:${-(i % 7) * .6}s"/>`).join('')}</g>
    <ellipse cx="288" cy="166" rx="74" ry="15" fill="#1a143355"/><ellipse cx="106" cy="274" rx="92" ry="18" fill="#1a143355"/>
    ${tackLayer('opp', 288, 172, 74, 14)}${tackLayer('me', 106, 268, 94, 20)}
  </svg>`;

  const mine = () => disp.me.mons[disp.me.active];
  const keysNow = () => (view.doubles ? ['me', 'ally', 'opp', 'opp2'] : ['me', 'opp']);
  const sideKey = (s) => {
    if (s === view.you) return 'me';
    if (view.ally?.seat === s) return 'ally';
    return view.opps[0].seat === s ? 'opp' : 'opp2';
  };
  const seatOf = (key) => ({ ally: disp.ally, opp: disp.opps[0], opp2: disp.opps[1] }[key]);
  const liveOpps = () => view.opps.filter((o) => o.active && o.active.hp > 0);
  const oppNames = () => view.opps.map((o) => o.name).join(', ');
  const myNames = () => [view.me.name, view.ally?.name].filter(Boolean).join(', ');

  function enter(m) {
    practice = m.practice; spectating = !!m.spectator; tag = !!m.tag; training = !!m.training || !!m.view?.training;
    const fresh = !view || G.screen !== 'battle';
    view = m.view; note = m.oppOnline ? '' : '나간 사람이 있습니다. 재접속을 기다립니다.';
    closeSheet();
    G.screen = 'battle';
    app.className = 'in-battle';
    setClock(m.remain);
    menu = 'moves';
    queue = Promise.resolve(); playing = false; gen++; // 재접속하면 재생 중이던 연출은 버림
    scrollTo(0, 0);
    if (view.phase === 'preview') return renderPreview();
    disp = cloneView(view);
    if (fresh || !$('.scene')) renderFrame();
    if (fresh) say(training ? '훈련장에 오신 걸 환영합니다! 더미를 마음껏 때려 보세요.' : `${view.opp.name}: ${view.opp.active.name}, 나가!`);
    syncAll();
    if (document.querySelector('.mon.opp')) { document.querySelectorAll('.mon').forEach((n) => n.classList.add('enter')); }
    renderPanel();
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));
  const cloneView = (v) => { const d = clone(v); d.opp = d.opps[0]; return d; };

  const fmt = (n) => Number(n || 0).toLocaleString('ko-KR');
  const meterHTML = (d) => `<span><small>이번 턴</small><b id="dm-turn">${fmt(d.turn)}</b></span><span><small>최고</small><b id="dm-best">${fmt(d.best)}</b></span><span><small>누적</small><b id="dm-total">${fmt(d.total)}</b></span>`;
  const headHTML = () => (training ? `<div class="bhead train"><div class="who">훈련장<small>턴마다 모두 회복, 메가진화·Z기술 무제한</small></div>
      <div class="dmeter" id="dmeter">${meterHTML(view.training)}</div></div>` : `<div class="bhead">
      ${view.opps.map((o) => `<div class="ava">${avatarSVG(o.avatar)}</div>`).join('')}
      <div class="who">${esc(oppNames())}<div class="pips" id="pips"></div></div>
      <div class="clock" id="clock"></div>
    </div>`);

  // 대전 전: 상대 덱을 보고 먼저 낼 요괴를 고릅니다.
  function renderPreview() {
    const waiting = !view.mustAct;
    const rosterHTML = (o) => `<div class="grid pv">${o.roster.map((m) => `<div class="card" style="--tc:${G.data.TYPES[m.types[0]].c}">${monsterSVG(m.species)}<span>${m.name}</span><p>${m.types.map(typeChip).join('')}</p></div>`).join('')}</div>`;
    const vsCard = (x) => battleCard({ name: x.name, avatar: x.avatar, style: x.style });
    app.innerHTML = `${headHTML()}
      <section class="vs ${view.doubles ? 'dbl' : ''}">
        <div class="vs-side">${vsCard(view.me)}${view.ally ? vsCard(view.ally) : ''}</div>
        <b class="vs-mark">VS</b>
        <div class="vs-side">${view.opps.map(vsCard).join('')}</div>
      </section>
      ${view.opps.map((o) => `<section class="panel">
        <h2>${view.doubles ? esc(o.name) : '상대'} 덱: ${esc(o.deck)}</h2>${rosterHTML(o)}
      </section>`).join('')}
      ${view.ally ? `<section class="panel"><h2>팀원 ${esc(view.ally.name)} 덱: ${esc(view.ally.deck)}</h2>${rosterHTML(view.ally)}</section>` : ''}
      <section class="panel">
        <h2>${spectating ? '선봉을 고르는 중입니다' : waiting ? '다른 사람이 고르는 중입니다' : '먼저 내보낼 요괴를 고르세요'}</h2>
        <p class="muted" style="margin-bottom:6px">내 덱: ${esc(view.me.deck)}</p>
        ${view.me.mons.map((m, i) => `<button class="sw pv-lead ${view.lead === i ? 'picked' : ''}" data-lead="${i}" ${waiting ? 'disabled' : ''}>
          ${monsterSVG(m.species)}
          <div class="inf">${m.name} ${m.types.map(typeChip).join('')}
            <small>${m.moves.map((x) => G.data.MOVES[x.id].n).join(', ')}</small></div>
          ${view.lead === i ? '<em>선봉</em>' : ''}</button>`).join('')}
      </section>
      ${note ? `<p class="wait">${note}</p>` : ''}
      ${spectating ? '<button class="btn paper wide" id="leave-spec">관전 나가기</button>' : `<button class="btn paper wide" id="ff">${tag ? '나가기' : '기권'}</button>`}`;
    drawPipsFrom(view.opps.flatMap((o) => o.roster));
    app.querySelectorAll('[data-lead]').forEach((b) => {
      b.onclick = () => { wsSend({ t: 'action', action: { type: 'lead', index: +b.dataset.lead } }); app.querySelectorAll('[data-lead]').forEach((x) => { x.disabled = true; }); };
    });
    bindForfeit();
  }

  function bindForfeit() {
    const ff = app.querySelector('#ff');
    if (ff) {
      ff.onclick = () => {
        if (ff.dataset.sure || training) wsSend({ t: 'forfeit' });
        else { ff.dataset.sure = 1; ff.textContent = tag ? '정말 나가기' : '정말 기권'; ff.classList.add('red'); }
      };
    }
    app.querySelector('#leave-spec')?.addEventListener('click', () => { wsSend({ t: 'unspectate' }); exit(); });
  }

  function exit() {
    Object.values(trainers).forEach((t) => t.destroy());
    trainers = {};
    view = null; gen++; playing = false; clearInterval(tick);
    showLobby();
  }

  function renderFrame() {
    Object.values(trainers).forEach((t) => t.destroy());
    trainers = {};
    const showTr = has3D() && !view.doubles;
    app.innerHTML = `${headHTML()}
      <section class="scene ${showTr ? 'has-tr' : ''}" id="scene">
        ${SCENE}
        ${showTr ? `${training ? '' : '<canvas class="trainer t-opp" id="tr-opp"></canvas>'}<canvas class="trainer t-me" id="tr-me"></canvas>` : ''}
        ${keysNow().map((k) => `<div class="mon ${k}" id="m-${k}"></div>`).join('')}
        <div class="fx"></div>
        <canvas class="fxc" id="fxc"></canvas>
        ${keysNow().map((k) => `<div class="plate ${k}" id="p-${k}"></div>`).join('')}
        <div class="fieldbar" id="field"></div>
      </section>
      <div class="say" id="say" role="status"></div>
      <div id="panel"></div>`;
    $('#say').onclick = () => skip?.();
    Fx.attach($('#scene'), $('#fxc'));
    if (showTr) {
      trainers.me = Avatar3D.mount($('#tr-me'), view.me.avatar, { facing: .75 });
      if (!training) trainers.opp = Avatar3D.mount($('#tr-opp'), view.opps[0].avatar, { facing: -.6 });
    }
  }

  function say(text) { const s = $('#say'); if (s) s.textContent = text; }

  function setClock(ms) {
    clearInterval(tick);
    deadline = ms == null ? 0 : Date.now() + ms;
    const draw = () => {
      const c = $('#clock');
      if (!c) return;
      if (!deadline) { c.textContent = ''; return; }
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      c.textContent = left;
      c.classList.toggle('low', left <= 15);
    };
    draw();
    tick = setInterval(draw, 500);
  }

  function setBar(key, m) {
    const pct = Math.max(0, (m.hp / m.maxHp) * 100);
    const plate = $(`#p-${key}`);
    const bar = plate.querySelector('.bar i');
    bar.style.width = `${pct}%`;
    bar.className = pct <= 20 ? 'low' : pct <= 50 ? 'mid' : '';
    const num = plate.querySelector('.num');
    if (num) num.textContent = `${m.hp} / ${m.maxHp}`;
  }

  function drawPlate(key, m) {
    const stages = Object.entries(m.stages || {}).filter(([, v]) => v);
    const lb = { atk: '공', def: '방', spa: '특공', spd: '특방', spe: '속', acc: '명' };
    const owner = view.doubles ? esc(key === 'me' ? view.me.name : seatOf(key).name) : '';
    $(`#p-${key}`).innerHTML = `${owner ? `<div class="owner">${owner}</div>` : ''}<div class="nm">${m.name}
      ${m.status ? `<span class="badge">${STATUS[m.status]}</span>` : ''}
      ${m.seeded ? `<span class="badge">${m.seeded === 'hair' ? '머리카락' : '씨앗'}</span>` : ''}
      ${m.strip ? `<span class="badge strip">각성${m.strip}</span>` : ''}
      ${G.data.MONSTERS[m.species]?.tiers ? `<span class="badge tier tb${Math.min(m.tier || 0, 4)}${(m.tier || 0) > 4 ? ' tplus' : ''}">${G.data.TIERS?.[m.tier || 0] || ''}</span>` : ''}
      ${stages.map(([k, v]) => `<span class="badge">${lb[k]}${v > 0 ? '+' : ''}${v}</span>`).join('')}</div>
      <div class="bar"><i></i></div><div class="num"></div>`;
    setBar(key, m);
  }

  // 루미나·실비아: 각성 단계 오라
  const AWAKEN = { lumina: true, silvia: true };
  const auraClass = (m) => (AWAKEN[m.species] && m.strip ? ` aura-${m.species} aw${m.strip}` : '');
  async function awakenCut(key, m) {
    const sp = G.data.MONSTERS[m.species];
    const cut = document.createElement('div');
    cut.className = `awx awx-${m.species} ${key === 'me' || key === 'ally' ? 'mine' : 'theirs'} aw${m.strip}`;
    cut.style.setProperty('--zs', `${SPEED}`);
    cut.innerHTML = `<div class="awx-band"><div class="awx-shards"></div>
        <div class="awx-face">${bust(m)}</div>
        <div class="awx-txt"><small>${esc(m.name)} · 의상 각성</small><b>AWAKEN <em>${ROMAN[m.strip] || m.strip}</em></b>
          <p>공격·특공·스피드 +${Math.round(m.strip * (G.data.MONSTERS[m.species].stages ? 4 : 0))}% · 체력 +20</p></div>
        <div class="awx-meter">${Array.from({ length: sp.stages || 4 }, (_, i) => `<i class="${i < m.strip ? 'on' : ''}${i === m.strip - 1 ? ' now' : ''}"></i>`).join('')}</div>
      </div><div class="awx-flash"></div>`;
    document.body.appendChild(cut);
    await wait(1150);
    cut.classList.add('out');
    setTimeout(() => cut.remove(), 300 * SPEED);
  }
  async function awakenShow(key, m) {
    const box = $(`#m-${key}`);
    await awakenCut(key, m);
    const ms = Fx.awaken(key, m.species, m.strip);
    const tag = document.createElement('div');
    tag.className = `awaken-tag at-${m.species} ${key}`;
    tag.innerHTML = `<small>의상 각성</small><b>${m.strip}<em>단계</em></b>`;
    $('#scene')?.appendChild(tag);
    setTimeout(() => tag.remove(), 1500);
    await wait(560);
    if (box) { box.innerHTML = monsterSVG(m.species, '', m.mega, m.hits, m.tier); box.className = `mon ${key}${m.mega ? ' mega' : ''}${auraClass(m)} swapfx`; setTimeout(() => box.classList.remove('swapfx'), 500); }
    await wait(Math.max(0, ms - 560));
  }

  function drawMon(key, m) {
    const box = $(`#m-${key}`);
    box.className = `mon ${key}${m.mega ? ' mega' : ''}${auraClass(m)}`;
    box.innerHTML = monsterSVG(m.species, '', m.mega, m.hits, m.tier);
  }

  const dispMon = (key) => (key === 'me' ? mine() : seatOf(key).active);
  function putMon(key, mon) {
    if (key === 'me') {
      disp.me.active = disp.me.mons.findIndex((x) => x.species === mon.species);
      Object.assign(mine(), mon);
    } else seatOf(key).active = mon;
  }
  const rosterEntry = (key, species) => (key === 'me' ? null : seatOf(key).roster.find((x) => x.species === species));

  function drawPips() {
    drawPipsFrom(disp.opps.flatMap((o) => o.roster));
  }

  function drawPipsFrom(roster) {
    const el = $('#pips');
    if (el) el.innerHTML = roster.map((m) => `<span class="${m.out ? 'out' : ''}">${monsterSVG(m.species, '', m.mega)}</span>`).join('');
  }

  function drawWeather() {
    const s = $('#scene');
    s.className = `scene${s.classList.contains('has-tr') ? ' has-tr' : ''}${view.doubles ? ' dbl' : ''}${disp.weather ? ` w-${disp.weather}` : ''}${disp.terrain ? ` tr-${disp.terrain}` : ''}${disp.me.hazard ? ' haz-me' : ''}${disp.opp.hazard ? ' haz-opp' : ''}`;
    const chips = [];
    if (disp.weather) chips.push(`<span class="f-${disp.weather}">${WEATHER[disp.weather]} ${disp.weatherTurns}턴</span>`);
    if (disp.terrain) chips.push(`<span class="f-grassfield">그래스필드 ${disp.terrainTurns}턴</span>`);
    if (disp.opp.hazard) chips.push(`<span class="f-tack">${spectating ? `${esc(oppNames())} 쪽` : '상대 쪽'} 압정</span>`);
    if (disp.me.hazard) chips.push(`<span class="f-tack">${spectating ? `${esc(myNames())} 쪽` : '내 쪽'} 압정</span>`);
    $('#field').innerHTML = chips.join('');
  }

  function syncAll() {
    for (const key of keysNow()) {
      const m = dispMon(key);
      drawMon(key, m); drawPlate(key, m);
      if (m.hp <= 0) $(`#m-${key}`).classList.add('hide');
    }
    drawPips(); drawWeather();
  }

  function burst(key, color) {
    const box = $(`#m-${key}`);
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 100 100');
    s.classList.add('burst');
    s.innerHTML = `<path d="M50 2l9 30 26-18-14 28 28 8-28 8 14 28-26-18-9 30-9-30-26 18 14-28-28-8 28-8-14-28 26 18z" fill="${color}" stroke="#1a1433" stroke-width="3"/>`;
    box.appendChild(s);
    setTimeout(() => s.remove(), 420);
  }
  function pop(key, text, big) {
    const d = document.createElement('div');
    d.className = `pop${big ? ' big' : ''}`;
    d.textContent = text;
    $(`#m-${key}`).appendChild(d);
    setTimeout(() => d.remove(), 800);
  }
  function anim(key, cls, ms) {
    const box = $(`#m-${key}`);
    box.classList.remove('lunge', 'hit', 'enter');
    void box.offsetWidth;
    box.classList.add(cls);
    setTimeout(() => box.classList.remove(cls), ms);
  }

  async function step(e) {
    if (e.text) say(e.text);
    const key = e.side === undefined ? null : sideKey(e.side);
    switch (e.t) {
      case 'turn': break;
      case 'msg': await wait(850); break;
      case 'move':
        if (e.z) { await zCinematic(e, key); break; }
        trainer(key)?.play('command');
        await wait(Math.max(760, Fx.play(e.id, key, sideKey(e.target), e)));
        break;
      case 'reflectReady': await wait(Fx.reflectReady(key)); break;
      case 'reflect': await wait(Fx.reflect(key, sideKey(e.by), e.counter)); break;
      case 'counter': anim(key, 'lunge', 600); await wait(Fx.counter(key, sideKey(e.target), e.stab)); break;
      case 'miss': await wait(800); break;
      case 'hp': {
        const m = dispMon(key);
        m.hp = e.hp; m.maxHp = e.maxHp;
        setBar(key, m);
        let awoke = false;
        if (e.hits !== undefined && e.hits !== m.hits) { // 맞은 횟수가 바뀌면 각성 단계 확인 (옷 바뀌는 요괴)
          const sp = G.data.MONSTERS[m.species], was = m.strip || 0;
          m.hits = e.hits;
          if (sp?.stages) { m.strip = Math.min(m.hits, sp.stages); awoke = m.strip > was && m.hp > 0; }
        }
        if (e.quiet) break;
        if (e.dmg !== undefined) {
          if (e.moveType) {
            trainer(key)?.play('flinch');
            anim(key, 'hit', 800);
            burst(key, G.data.TYPES[e.moveType].c);
            pop(key, e.crit ? `급소! ${e.dmg}` : e.eff > 1 ? `${e.dmg}!` : String(e.dmg), e.crit || e.eff > 1);
          } else pop(key, String(e.dmg));
        } else if (e.healed) { pop(key, '회복'); Fx.heal(key); }
        if (awoke) { await wait(380); drawPlate(key, m); await awakenShow(key, m); break; }
        await wait(620); break;
      }
      case 'faint': {
        const box = $(`#m-${key}`);
        box.classList.remove('hit', 'lunge', 'enter');
        box.classList.add('faint');
        trainer(key)?.play('sad');
        const r = rosterEntry(key, dispMon(key).species);
        if (r) { r.out = true; drawPips(); }
        await wait(1000);
        box.classList.remove('faint'); box.classList.add('hide');
        break;
      }
      case 'recall': $(`#m-${key}`).classList.add('hide'); await wait(600); break;
      case 'switch': {
        putMon(key, e.mon);
        drawMon(key, dispMon(key)); drawPlate(key, dispMon(key));
        anim(key, 'enter', 420);
        if (AWAKEN[e.mon.species]) Fx.entrance(key, e.mon.species);
        await wait(900); break;
      }
      case 'mega': {
        trainer(key)?.play('mega', { dur: 2 });
        Fx.megaStart(key);
        await wait(1100);
        putMon(key, e.mon);
        const r = rosterEntry(key, e.mon.species);
        if (r) { r.mega = true; drawPips(); }
        drawMon(key, dispMon(key)); drawPlate(key, dispMon(key));
        Fx.megaEnd(key);
        await wait(900);
        break;
      }
      case 'status':
        dispMon(key).status = e.status; drawPlate(key, dispMon(key));
        Fx.status(key, e.status);
        await wait(850); break;
      case 'seed':
        dispMon(key).seeded = e.kind; drawPlate(key, dispMon(key));
        await wait(850); break;
      case 'stage':
        dispMon(key).stages[e.stat] = e.value; drawPlate(key, dispMon(key));
        pop(key, e.up ? '상승' : '하락');
        Fx.stage(key, e.up);
        await wait(800); break;
      case 'weather':
        disp.weather = e.weather; disp.weatherTurns = e.weather ? 5 : 0; drawWeather();
        await wait(Math.max(1000, e.trait ? Fx.weather(e.weather) : 0)); break;
      case 'terrain':
        disp.terrain = e.terrain; disp.terrainTurns = e.terrain ? 5 : 0; drawWeather();
        if (e.terrain) Fx.terrain?.(e.terrain);
        await wait(1000); break;
      case 'hazard':
        disp[key === 'me' || key === 'ally' ? 'me' : 'opp'].hazard = e.on; drawWeather();
        await wait(900); break;
      case 'dummy': {
        const m = $('#dmeter');
        if (m) {
          m.innerHTML = meterHTML(e);
          if (e.turn && e.turn >= e.best) m.classList.add('record');
          else m.classList.remove('record');
        }
        if (e.turn) { say(`이번 턴 피해 ${fmt(e.turn)}!${e.turn >= e.best ? ' 최고 기록!' : ''}`); await wait(700); }
        break;
      }
      case 'forge': {
        const m = dispMon(key);
        Object.assign(m, e.mon);
        const box = $(`#m-${key}`);
        const ms = Fx.forge(key, e.tier);
        await wait(520);
        if (box) { box.innerHTML = monsterSVG(m.species, '', m.mega, m.hits, m.tier); box.classList.add('swapfx', 'forged'); setTimeout(() => box.classList.remove('swapfx', 'forged'), 700); }
        drawPlate(key, m);
        const tag = document.createElement('div');
        tag.className = `forge-tag ft${Math.min(e.tier, 4)} ${key}`;
        tag.innerHTML = `<small>강화 성공!</small><b>${G.data.TIERS?.[e.tier] || ''}</b>`;
        $('#scene')?.appendChild(tag);
        setTimeout(() => tag.remove(), 1500);
        await wait(Math.max(700, ms - 520));
        break;
      }
      case 'over': await wait(1200); break;
      default:
    }
  }

  function onTurn(m) {
    const g = gen;
    queue = queue.then(async () => {
      if (g !== gen) return;
      playing = true;
      if (!$('.scene')) { // 대전 전 화면에서 넘어옴
        view = m.view; disp = cloneView(view); renderFrame(); syncAll();
        document.querySelectorAll('.mon').forEach((n) => n.classList.add('hide'));
      }
      $('#panel').innerHTML = '';
      note = '';
      for (const e of m.events) { await step(e); if (g !== gen) return; }
      playing = false;
      view = m.view; disp = cloneView(view);
      syncAll();
      setClock(m.remain);
      menu = 'moves'; armed = false;
      renderPanel();
    }).catch((err) => { console.error(err); playing = false; });
  }

  // Z기술 컷인: 화면을 덮는 컷인 뒤에 타입별 필살 연출
  // Z기술: 트레이너와 요괴가 같은 안무를 추며 유대를 보여 주는 컷인, 이어서 필살 연출
  // 루미나·실비아 전용 Z 연출 (약 3.6초): 등장 → 기 모으기 → 발사
  const ROMAN = ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'];
  // 얼굴만 잘라 보이는 컷: eyes는 눈매 클로즈업, head는 머리와 어깨
  const crop = (m, cls, box) => monsterSVG(m.species, cls, m.mega, m.hits, m.tier).replace('viewBox="0 0 200 200"', `viewBox="${box}" preserveAspectRatio="xMidYMid slice"`);
  // 메가진화 그림은 얼굴 위치가 달라서 따로 자릅니다.
  const FACE = { 'lumina-mega': ['64 29 60 60', '71 44 45 18'], 'silvia-mega': ['35 21 60 60', '43 36 45 18'] };
  const face = (m) => FACE[`${m.species}${m.mega ? '-mega' : ''}`] || ['70 0 70 70', '75 17 60 24'];
  const bust = (m) => crop(m, 'zx-bust', face(m)[0]);
  const eyes = (m) => crop(m, 'zx-bust', face(m)[1]);
  const magicCircle = (c1, c2) => `<svg class="zx-mc" viewBox="-100 -100 200 200" aria-hidden="true">
    <g fill="none" stroke="${c1}" stroke-width="1.6">
      <circle r="96"/><circle r="88" stroke-dasharray="2 4"/><circle r="62" stroke="${c2}"/><circle r="40"/>
      <polygon points="${Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * 6.283 - 1.571; return `${(Math.cos(a) * 88).toFixed(1)},${(Math.sin(a) * 88).toFixed(1)}`; }).join(' ')}" stroke="${c2}"/>
      <polygon points="${Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * 6.283 - 1.047; return `${(Math.cos(a) * 88).toFixed(1)},${(Math.sin(a) * 88).toFixed(1)}`; }).join(' ')}" stroke="${c2}"/>
      ${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.283; return `<path d="M${(Math.cos(a) * 66).toFixed(1)} ${(Math.sin(a) * 66).toFixed(1)}L${(Math.cos(a) * 84).toFixed(1)} ${(Math.sin(a) * 84).toFixed(1)}"/>`; }).join('')}
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<circle cx="${(Math.cos(a) * 75).toFixed(1)}" cy="${(Math.sin(a) * 75).toFixed(1)}" r="3.2" fill="${i % 2 ? c1 : c2}"/>`; }).join('')}
    </g></svg>`;
  async function zSpecial(e, key) {
    const mine = key === 'me' || key === 'ally';
    const sp = e.mon.species, av = avatarOf(key), duo = has3D() && av;
    const lum = sp === 'lumina';
    const cut = document.createElement('div');
    cut.className = `zx zx-${sp} ${mine ? 'mine' : 'theirs'}`;
    cut.style.setProperty('--zs', `${SPEED}`);
    const bolts = lum ? Array.from({ length: 7 }, (_, i) => {
      let x = 8 + i * 14 + (i % 2 ? 4 : -3), d = `M${x} -2`;
      for (let y = 0; y < 100; y += 12) { x += (Math.random() - .5) * 9; d += ` L${x.toFixed(1)} ${y + 12}`; }
      return `<path d="${d}" style="--d:${(i * 0.06).toFixed(2)}"/>`;
    }).join('') : '';
    cut.innerHTML = `<div class="zx-bg"></div>
      <div class="zx-ring">${lum ? magicCircle('#37E0FF', '#FF7FD0') : magicCircle('#6CF2C2', '#ffffff')}</div>
      <div class="zx-vortex"></div><div class="zx-lines"></div>
      <div class="zx-art">${monsterSVG(sp, '', e.mon.mega, e.mon.hits, e.mon.tier)}</div>
      <div class="zx-eye">${eyes(e.mon)}<i class="zx-glint"></i></div>
      ${duo ? '<canvas class="zx-tr"></canvas><div class="zx-bond">유대 MAX</div>' : ''}
      <div class="zx-title"><small>Z기술 · ${esc(e.player)} × ${esc(e.mon.name)}</small><b>${esc(e.move)}</b></div>
      <div class="zx-fin">${lum ? `<svg class="zx-bolts" viewBox="0 0 100 100" preserveAspectRatio="none">${bolts}</svg>` : '<div class="zx-arrow"><i></i></div><div class="zx-trail"></div>'}</div>
      <div class="zx-shock"></div><div class="zx-flash"></div>`;
    document.body.appendChild(cut);
    let tr = null;
    if (duo) { tr = Avatar3D.mount(cut.querySelector('.zx-tr'), av, { facing: mine ? .55 : -.55 }); tr.play('z', { type: e.type, dur: 3.2 * SPEED, hold: true }); }
    setTimeout(() => cut.classList.add('shake'), 2350 * SPEED);
    await wait(3600);
    cut.classList.add('out');
    await wait(260);
    tr?.destroy(); cut.remove();
    trainer(key)?.play('thrust', { dur: 2 });
    await wait(Fx.zmove(e.type, key, sideKey(e.target), sp));
  }

  async function zCinematic(e, key) {
    if (AWAKEN[e.mon.species]) return zSpecial(e, key);
    const color = G.data.TYPES[e.type].c;
    const mine = key === 'me' || key === 'ally';
    const av = avatarOf(key);
    const duo = has3D() && av;
    const cut = document.createElement('div');
    const sp = AWAKEN[e.mon.species] ? e.mon.species : '';
    cut.className = `zcut ${mine ? 'mine' : 'theirs'} ${duo ? 'duo' : ''} zt-${e.type}${sp ? ` zsp zsp-${sp}` : ''}`;
    cut.style.setProperty('--zc', color);
    cut.style.setProperty('--zs', `${SPEED}`);
    cut.innerHTML = `${sp ? `<div class="zc-sp"><i></i><i></i><i></i></div>` : ''}<div class="zc-lines"></div>
      <div class="zc-band">
        <div class="zc-pair">
          ${duo ? '<canvas class="zc-tr"></canvas>' : ''}
          <div class="zc-bond"><i></i><i></i><i></i><b>유대 MAX</b></div>
          <div class="zc-mon">${monsterSVG(e.mon.species, '', e.mon.mega, e.mon.hits, e.mon.tier)}</div>
        </div>
        <div class="zc-text"><span class="zc-kick">Z기술 · ${esc(e.player)} × ${esc(e.mon.name)}</span><b class="zc-name">${esc(e.move)}</b></div>
      </div>
      <div class="zc-flash"></div>`;
    document.body.appendChild(cut);
    let tr = null;
    if (duo) {
      tr = Avatar3D.mount(cut.querySelector('.zc-tr'), av, { facing: mine ? .55 : -.55 });
      tr.play('z', { type: e.type, dur: 2.6 * SPEED, hold: true });
    }
    await wait(2700);
    cut.classList.add('out');
    await wait(260);
    tr?.destroy();
    cut.remove();
    trainer(key)?.play('thrust', { dur: 2 });
    await wait(Fx.zmove(e.type, key, sideKey(e.target)));
  }

  function onChosen(m) { view = m.view; if (view.phase === 'preview') renderPreview(); else renderPanel(); }
  function onNoBattle() {
    // 끊긴 사이 대전이 끝났으면 멈춘 화면에 남지 않게 로비로 돌아감
    if (G.screen === 'battle' && !playing && !document.querySelector('.result')) { view = null; showLobby(); }
  }
  function setNote(text) {
    note = text;
    if (playing) return;
    if (view?.phase === 'preview') renderPreview(); else renderPanel();
  }
  const act = (action) => { armed = false; wsSend({ t: 'action', action }); $('#panel').innerHTML = '<p class="wait">기다리는 중...</p>'; };

  const effOn = (mv, mon) => (mon.species === 'bonaeng' && mv.type === 'fire' ? 1 : mon.types.reduce((x, t) => x * (G.data.CHART[mv.type][t] ?? 1), 1)); // 보냉이 아이스박스
  function effHint(mv) {
    if (mv.cat === 'x' || view.doubles) return '';
    const eff = effOn(mv, view.opp.active);
    if (eff === 0) return '효과 없음';
    if (eff !== 1) return `상대에게 ${eff}배`;
    return '';
  }

  function renderPanel() {
    const panel = $('#panel');
    if (!panel || playing) return;
    if (view.phase === 'over') return showResult();
    if (spectating) {
      say(`${myNames()} 대 ${oppNames()}`);
      panel.innerHTML = '<p class="wait">관전 중입니다.</p><button class="btn paper wide" id="leave-spec">관전 나가기</button>';
      return bindForfeit();
    }
    if (!view.mustAct) {
      const out = view.me.mons.every((m) => m.hp <= 0);
      panel.innerHTML = `<p class="wait">${note || (out ? '내 요괴가 모두 쓰러졌습니다. 팀원을 응원하세요.' : '다른 사람의 선택을 기다리는 중입니다.')}</p>`;
      return;
    }
    if (view.phase === 'switch') { say('다음에 나갈 요괴를 고르세요.'); return renderSwitch(panel, false); }
    if (menu === 'switch') return renderSwitch(panel, true);
    if (menu === 'target') return renderTarget(panel);

    const cur = view.me.mons[view.me.active];
    say(armed ? `메가진화! ${cur.name}의 기술을 고르세요.` : note || `${cur.name}, 뭘 할까?`);
    const noPP = cur.moves.every((x) => x.pp <= 0 || x.off);
    panel.innerHTML = `<div class="moves ${cur.moves.length > 4 ? 'ten' : ''}">
      ${noPP ? `<button class="mb" data-mv="-1" style="--tc:${G.data.TYPES.none.c}"><b>악쓰기</b><small>기술을 다 써서 몸으로 부딪힌다</small></button>`
        : cur.moves.map((x, i) => {
          const mv = G.data.MOVES[x.id];
          const dark = ['elec', 'ice', 'wind', 'none'].includes(mv.type);
          const hint = effHint(mv);
          return `<button class="mb ${dark ? 'dark' : ''}" data-mv="${i}" style="--tc:${G.data.TYPES[mv.type].c}" ${x.pp > 0 && !x.off ? '' : 'disabled'}>
            <b>${mv.n}${x.off ? ' (봉인)' : ''}</b>
            <small>${G.data.TYPES[mv.type].n}${mv.pow ? `, 위력 ${mv.pow}` : ''}, PP ${x.pp}/${mv.pp}</small>
            <small class="eff">${hint || mv.d}</small></button>`;
        }).join('')}
      </div>
      <div class="bar-actions">
        <button class="btn mega ${armed ? 'on' : ''}" id="to-mega" ${view.canMega ? '' : 'disabled'} aria-pressed="${armed}">${view.megaUsed ? '메가 사용함' : armed ? '메가 취소' : '메가진화'}</button>
        <button class="btn zbtn" id="to-z" ${view.canZ && zLockTurn !== view.turn ? '' : 'disabled'}>${view.zUsed ? 'Z 사용함' : zLockTurn === view.turn ? '다음 턴에' : 'Z기술'}<small>${G.data.MOVES[G.data.MONSTERS[cur.species].z].n}</small></button>
        <button class="btn paper" id="to-sw" ${armed ? 'disabled' : ''}>교체</button>
        <button class="btn paper" id="ff">${tag || training ? '나가기' : '기권'}</button>
      </div>`;
    panel.querySelectorAll('[data-mv]').forEach((b) => {
      b.onclick = () => {
        const index = +b.dataset.mv;
        const mv = index >= 0 ? G.data.MOVES[cur.moves[index].id] : null;
        const live = liveOpps();
        // 태그에서는 상대 둘 중 누구를 칠지 고릅니다.
        if (view.doubles && live.length > 1 && !(mv && (mv.self_ || mv.protect))) {
          moveDraft = { index, mega: armed, mv };
          menu = 'target';
          return renderPanel();
        }
        act({ type: 'move', index, mega: armed, target: live[0]?.seat });
      };
    });
    panel.querySelector('#to-mega').onclick = () => { armed = !armed; renderPanel(); };
    panel.querySelector('#to-z').onclick = async () => {
      const zid = G.data.MONSTERS[cur.species].z, zmv = G.data.MOVES[zid];
      const ok = await ZMission.run({ moveName: zmv.n, monName: cur.name, color: G.data.TYPES[zmv.type].c });
      if (ok === null) return; // 그만두기: 다시 시도 가능
      if (!ok) { zLockTurn = view.turn; toast('호흡이 어긋났다! 이번 턴에는 Z기술을 쓸 수 없다.'); return renderPanel(); }
      const index = noPP ? -1 : cur.moves.findIndex((x) => x.pp > 0);
      const live = liveOpps();
      if (view.doubles && live.length > 1) {
        moveDraft = { index, mega: armed, mv: zmv, z: true };
        menu = 'target';
        return renderPanel();
      }
      act({ type: 'move', index, mega: armed, z: true, target: live[0]?.seat });
    };
    panel.querySelector('#to-sw').onclick = () => { menu = 'switch'; renderPanel(); };
    bindForfeit();
  }

  function renderTarget(panel) {
    say(`${moveDraft.mv ? moveDraft.mv.n : '악쓰기'}, 누구에게 쓸까요?`);
    panel.innerHTML = `${liveOpps().map((o) => {
      const eff = moveDraft.mv && moveDraft.mv.cat !== 'x' ? effOn(moveDraft.mv, o.active) : 1;
      return `<button class="sw tg" data-tg="${o.seat}">${monsterSVG(o.active.species, '', o.active.mega, o.active.hits, o.active.tier)}
        <div class="inf">${o.active.name} ${o.active.types.map(typeChip).join('')}
          <small>${esc(o.name)}${eff === 0 ? ', 효과 없음' : eff !== 1 ? `, 상성 ${eff}배` : ''}</small></div></button>`;
    }).join('')}<button class="btn paper wide" id="tg-back">기술 고르기로 돌아가기</button>`;
    panel.querySelectorAll('[data-tg]').forEach((b) => {
      b.onclick = () => { menu = 'moves'; act({ type: 'move', index: moveDraft.index, mega: moveDraft.mega, z: !!moveDraft.z, target: +b.dataset.tg }); };
    });
    panel.querySelector('#tg-back').onclick = () => { menu = 'moves'; renderPanel(); };
  }

  function renderSwitch(panel, canBack) {
    if (training) {
      say('어떤 요괴로 바꿀까요?');
      panel.innerHTML = `<div class="swgrid">${view.me.mons.map((m, i) => `<button data-sw="${i}" ${i === view.me.active ? 'disabled' : ''} aria-label="${m.name}">
        ${monsterSVG(m.species, '', m.mega, m.hits, m.tier)}<span>${m.name}</span></button>`).join('')}</div>
        <button class="btn paper wide" id="sw-back">기술 고르기로 돌아가기</button>`;
      panel.querySelectorAll('[data-sw]').forEach((b) => { b.onclick = () => { menu = 'moves'; act({ type: 'switch', index: +b.dataset.sw }); }; });
      panel.querySelector('#sw-back').onclick = () => { menu = 'moves'; renderPanel(); };
      return;
    }
    const stuck = canBack && view.trapped; // 호롱이 그림자밟기
    if (stuck) say('그림자밟기 때문에 교체할 수 없다!');
    panel.innerHTML = `${view.me.mons.map((m, i) => {
      const off = m.hp <= 0 || i === view.me.active || stuck;
      return `<button class="sw" data-sw="${i}" ${off ? 'disabled' : ''}>
        ${monsterSVG(m.species, '', m.mega, m.hits, m.tier)}
        <div class="inf">${m.name} ${m.types.map(typeChip).join('')}
          <div class="bar" style="max-width:190px"><i class="${m.hp / m.maxHp <= .2 ? 'low' : m.hp / m.maxHp <= .5 ? 'mid' : ''}" style="width:${(m.hp / m.maxHp) * 100}%"></i></div>
          <small>${m.hp <= 0 ? '쓰러짐' : `${m.hp} / ${m.maxHp}`}${m.status ? `, ${STATUS[m.status]}` : ''}${i === view.me.active && m.hp > 0 ? ', 싸우는 중' : ''}</small>
        </div></button>`;
    }).join('')}
    ${canBack ? '<button class="btn paper wide" id="sw-back">기술 고르기로 돌아가기</button>' : ''}`;
    panel.querySelectorAll('[data-sw]').forEach((b) => { b.onclick = () => act({ type: 'switch', index: +b.dataset.sw }); });
    panel.querySelector('#sw-back')?.addEventListener('click', () => { menu = 'moves'; renderPanel(); });
  }

  function showResult() {
    clearInterval(tick);
    const c = $('#clock'); if (c) c.textContent = '';
    const win = view.winner === view.team, draw = view.winner === null;
    const winners = win ? myNames() : oppNames();
    const div = document.createElement('div');
    div.className = 'result';
    const champ = win || draw ? view.me : view.opp;
    if (!draw) { trainer('me')?.play(win ? 'cheer' : 'sad', { hold: true, dur: 1.6 }); trainer('opp')?.play(win ? 'sad' : 'cheer', { hold: true, dur: 1.6 }); }
    div.innerHTML = `<div class="result-card">${battleCard({ name: champ.name, avatar: champ.avatar, style: champ.style }, 'big')}</div>
      <h1 class="title ${spectating ? 'small' : ''}">${draw ? '무승부' : spectating ? `${esc(winners)} 승리` : win ? '승리' : '패배'}</h1>
      <p style="color:#fff">${esc(myNames())} 대 ${esc(oppNames())}, ${view.turn - 1}턴${practice ? ' (연습)' : ''}${spectating ? ' (관전)' : ''}</p>
      <button class="btn" id="to-lobby">로비로 돌아가기</button>`;
    app.appendChild(div);
    div.querySelector('#to-lobby').onclick = () => { view = null; showLobby(); };
  }

  return { enter, onTurn, onChosen, setNote, onNoBattle, exit };
})();
