// 배틀 화면과 연출
const Battle = (() => {
  let view = null, disp = null, note = '', menu = 'moves', practice = false;
  let queue = Promise.resolve(), playing = false, skip = null;
  let deadline = 0, tick = null, gen = 0;
  const SPEED = Number(new URLSearchParams(location.search).get('speed') ?? 1); // ?speed=0 이면 연출 생략

  const wait = (ms) => new Promise((res) => {
    const t = setTimeout(res, ms * SPEED);
    skip = () => { clearTimeout(t); res(); };
  });
  const STATUS = { brn: '화상', psn: '독', par: '마비', slp: '수면', frz: '얼음' };
  const WEATHER = { sun: '땡볕', rain: '소나기', dust: '황사' };
  const $ = (s) => app.querySelector(s);

  const SCENE = `<svg class="bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="300" fill="#F27A4B"/><rect y="70" width="400" height="60" fill="#F7A24B"/>
    <circle cx="300" cy="96" r="34" fill="#FFD23F"/>
    <path d="M0 150V96l34-18 34 18v-6h52v-22l44-14 40 14v30h34V72l52-16 52 16v22h58v56z" fill="#6A3A8C"/>
    <path d="M0 160v-34h80v-30l40-12 40 12v30h60v-22h76v22h50V96h54v64z" fill="#3B2A78"/>
    <g fill="#FFD23F"><rect x="22" y="134" width="12" height="12"/><rect x="124" y="108" width="12" height="12"/><rect x="238" y="124" width="12" height="12"/><rect x="346" y="112" width="12" height="12"/><rect x="366" y="134" width="12" height="12"/></g>
    <rect x="186" y="34" width="9" height="130" fill="#1a1433"/><rect x="162" y="48" width="56" height="6" fill="#1a1433"/>
    <path d="M0 40Q90 74 162 50M218 50q90 26 182-12M0 60q90 34 166 0" fill="none" stroke="#1a1433" stroke-width="2"/>
    <rect y="160" width="400" height="140" fill="#5C5A72"/><rect y="160" width="400" height="9" fill="#3a3550"/>
    <path d="M0 232h400" stroke="#FFD23F" stroke-width="4" stroke-dasharray="30 22"/>
    <ellipse cx="288" cy="166" rx="74" ry="15" fill="#1a143355"/><ellipse cx="106" cy="274" rx="92" ry="18" fill="#1a143355"/>
  </svg>`;

  const mine = () => disp.me.mons[disp.me.active];
  const sideKey = (s) => (s === view.you ? 'me' : 'opp');

  function enter(m) {
    practice = m.practice;
    const fresh = !view || G.screen !== 'battle';
    view = m.view; note = m.oppOnline ? '' : '상대가 나갔습니다. 곧 돌아오지 않으면 승리합니다.';
    closeSheet();
    G.screen = 'battle';
    app.className = 'in-battle';
    setClock(m.remain);
    menu = 'moves';
    queue = Promise.resolve(); playing = false; gen++; // 재접속하면 재생 중이던 연출은 버림
    scrollTo(0, 0);
    if (view.phase === 'preview') return renderPreview();
    disp = clone(view);
    if (fresh || !$('.scene')) renderFrame();
    if (fresh) say(`${view.opp.name}: ${view.opp.active.name}, 나가!`);
    syncAll();
    if (document.querySelector('.mon.opp')) { document.querySelectorAll('.mon').forEach((n) => n.classList.add('enter')); }
    renderPanel();
  }

  const clone = (x) => JSON.parse(JSON.stringify(x));

  const headHTML = () => `<div class="bhead">
      <div class="ava">${avatarSVG(view.opp.avatar)}</div>
      <div class="who">${esc(view.opp.name)}<div class="pips" id="pips"></div></div>
      <div class="clock" id="clock"></div>
    </div>`;

  // 대전 전: 상대 덱을 보고 먼저 낼 요괴를 고릅니다.
  function renderPreview() {
    const waiting = !view.mustAct;
    app.innerHTML = `${headHTML()}
      <section class="panel">
        <h2>상대 덱: ${esc(view.opp.deck)}</h2>
        <div class="grid pv">${view.opp.roster.map((m) => `<div class="card" style="--tc:${G.data.TYPES[m.types[0]].c}">${monsterSVG(m.species)}<span>${m.name}</span><p>${m.types.map(typeChip).join('')}</p></div>`).join('')}</div>
      </section>
      <section class="panel">
        <h2>${waiting ? '상대가 고르는 중입니다' : `먼저 내보낼 요괴를 고르세요`}</h2>
        <p class="muted" style="margin-bottom:6px">내 덱: ${esc(view.me.deck)}</p>
        ${view.me.mons.map((m, i) => `<button class="sw pv-lead ${view.lead === i ? 'picked' : ''}" data-lead="${i}" ${waiting ? 'disabled' : ''}>
          ${monsterSVG(m.species)}
          <div class="inf">${m.name} ${m.types.map(typeChip).join('')}
            <small>${m.moves.map((x) => G.data.MOVES[x.id].n).join(', ')}</small></div>
          ${view.lead === i ? '<em>선봉</em>' : ''}</button>`).join('')}
      </section>
      ${note ? `<p class="wait">${note}</p>` : ''}
      <button class="btn paper wide" id="ff">기권</button>`;
    drawPipsFrom(view.opp.roster);
    app.querySelectorAll('[data-lead]').forEach((b) => {
      b.onclick = () => { wsSend({ t: 'action', action: { type: 'lead', index: +b.dataset.lead } }); app.querySelectorAll('[data-lead]').forEach((x) => { x.disabled = true; }); };
    });
    bindForfeit();
  }

  function bindForfeit() {
    const ff = app.querySelector('#ff');
    ff.onclick = () => {
      if (ff.dataset.sure) wsSend({ t: 'forfeit' });
      else { ff.dataset.sure = 1; ff.textContent = '정말 기권'; ff.classList.add('red'); }
    };
  }

  function renderFrame() {
    app.innerHTML = `${headHTML()}
      <section class="scene" id="scene">
        ${SCENE}
        <div class="mon opp" id="m-opp"></div>
        <div class="mon me" id="m-me"></div>
        <div class="fx"></div>
        <div class="plate opp" id="p-opp"></div>
        <div class="plate me" id="p-me"></div>
        <div class="tag" id="wtag" hidden></div>
      </section>
      <div class="say" id="say" role="status"></div>
      <div id="panel"></div>`;
    $('#say').onclick = () => skip?.();
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
    $(`#p-${key}`).innerHTML = `<div class="nm">${m.name}
      ${m.status ? `<span class="badge">${STATUS[m.status]}</span>` : ''}
      ${stages.map(([k, v]) => `<span class="badge">${lb[k]}${v > 0 ? '+' : ''}${v}</span>`).join('')}</div>
      <div class="bar"><i></i></div>${key === 'me' ? '<div class="num"></div>' : ''}`;
    setBar(key, m);
  }

  function drawMon(key, m) {
    const box = $(`#m-${key}`);
    box.className = `mon ${key}`;
    box.innerHTML = monsterSVG(m.species);
  }

  const dispMon = (key) => (key === 'me' ? mine() : disp.opp.active);

  function drawPips() {
    drawPipsFrom(disp.opp.roster);
  }

  function drawPipsFrom(roster) {
    $('#pips').innerHTML = roster.map((m) => `<span class="${m.out ? 'out' : ''}">${monsterSVG(m.species)}</span>`).join('');
  }

  function drawWeather() {
    const s = $('#scene'), tag = $('#wtag');
    s.className = `scene${disp.weather ? ` w-${disp.weather}` : ''}`;
    tag.hidden = !disp.weather;
    tag.textContent = disp.weather ? WEATHER[disp.weather] : '';
  }

  function syncAll() {
    for (const key of ['me', 'opp']) {
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
        if (e.cat !== 'x') anim(key, 'lunge', 340);
        await wait(800); break;
      case 'miss': await wait(800); break;
      case 'hp': {
        const m = dispMon(key);
        m.hp = e.hp; m.maxHp = e.maxHp;
        setBar(key, m);
        if (e.dmg !== undefined) {
          if (e.moveType) {
            anim(key, 'hit', 800);
            burst(key, G.data.TYPES[e.moveType].c);
            pop(key, e.crit ? `급소! ${e.dmg}` : e.eff > 1 ? `${e.dmg}!` : String(e.dmg), e.crit || e.eff > 1);
          } else pop(key, String(e.dmg));
        } else if (e.healed) pop(key, '회복');
        await wait(620); break;
      }
      case 'faint': {
        const box = $(`#m-${key}`);
        box.classList.remove('hit', 'lunge', 'enter');
        box.classList.add('faint');
        if (key === 'opp') {
          const r = disp.opp.roster.find((x) => x.species === disp.opp.active.species);
          if (r) r.out = true;
          drawPips();
        }
        await wait(1000);
        box.classList.remove('faint'); box.classList.add('hide');
        break;
      }
      case 'recall': $(`#m-${key}`).classList.add('hide'); await wait(600); break;
      case 'switch': {
        if (key === 'me') {
          disp.me.active = disp.me.mons.findIndex((x) => x.species === e.mon.species);
          Object.assign(mine(), e.mon);
        } else disp.opp.active = e.mon;
        drawMon(key, dispMon(key)); drawPlate(key, dispMon(key));
        anim(key, 'enter', 420);
        await wait(900); break;
      }
      case 'status':
        dispMon(key).status = e.status; drawPlate(key, dispMon(key));
        await wait(850); break;
      case 'stage':
        dispMon(key).stages[e.stat] = e.value; drawPlate(key, dispMon(key));
        pop(key, e.up ? '상승' : '하락');
        await wait(800); break;
      case 'weather':
        disp.weather = e.weather; drawWeather();
        await wait(1000); break;
      case 'hazard': await wait(900); break;
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
        view = m.view; disp = clone(view); renderFrame(); syncAll();
        document.querySelectorAll('.mon').forEach((n) => n.classList.add('hide'));
      }
      $('#panel').innerHTML = '';
      note = '';
      for (const e of m.events) { await step(e); if (g !== gen) return; }
      playing = false;
      view = m.view; disp = clone(view);
      syncAll();
      setClock(m.remain);
      menu = 'moves';
      renderPanel();
    }).catch((err) => { console.error(err); playing = false; });
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
  const act = (action) => { wsSend({ t: 'action', action }); $('#panel').innerHTML = '<p class="wait">기다리는 중...</p>'; };

  function effHint(mv) {
    if (mv.cat === 'x') return '';
    const eff = view.opp.active.types.reduce((x, t) => x * (G.data.CHART[mv.type][t] ?? 1), 1);
    if (eff === 0) return '효과 없음';
    if (eff !== 1) return `상대에게 ${eff}배`;
    return '';
  }

  function renderPanel() {
    const panel = $('#panel');
    if (!panel || playing) return;
    if (view.phase === 'over') return showResult();
    if (!view.mustAct) {
      panel.innerHTML = `<p class="wait">${note || '상대의 선택을 기다리는 중입니다.'}</p>`;
      return;
    }
    if (view.phase === 'switch') { say('다음에 나갈 요괴를 고르세요.'); return renderSwitch(panel, false); }
    if (menu === 'switch') return renderSwitch(panel, true);

    const cur = view.me.mons[view.me.active];
    say(note || `${cur.name}, 뭘 할까?`);
    const noPP = cur.moves.every((x) => x.pp <= 0);
    panel.innerHTML = `<div class="moves">
      ${noPP ? `<button class="mb" data-mv="-1" style="--tc:${G.data.TYPES.none.c}"><b>악쓰기</b><small>기술을 다 써서 몸으로 부딪힌다</small></button>`
        : cur.moves.map((x, i) => {
          const mv = G.data.MOVES[x.id];
          const dark = ['elec', 'ice', 'wind', 'none'].includes(mv.type);
          const hint = effHint(mv);
          return `<button class="mb ${dark ? 'dark' : ''}" data-mv="${i}" style="--tc:${G.data.TYPES[mv.type].c}" ${x.pp > 0 ? '' : 'disabled'}>
            <b>${mv.n}</b>
            <small>${G.data.TYPES[mv.type].n}${mv.pow ? `, 위력 ${mv.pow}` : ''}, PP ${x.pp}/${mv.pp}</small>
            <small class="eff">${hint || mv.d}</small></button>`;
        }).join('')}
      </div>
      <div class="bar-actions">
        <button class="btn paper" id="to-sw">교체</button>
        <button class="btn paper" id="ff">기권</button>
      </div>`;
    panel.querySelectorAll('[data-mv]').forEach((b) => { b.onclick = () => act({ type: 'move', index: +b.dataset.mv }); });
    panel.querySelector('#to-sw').onclick = () => { menu = 'switch'; renderPanel(); };
    bindForfeit();
  }

  function renderSwitch(panel, canBack) {
    panel.innerHTML = `${view.me.mons.map((m, i) => {
      const off = m.hp <= 0 || i === view.me.active;
      return `<button class="sw" data-sw="${i}" ${off ? 'disabled' : ''}>
        ${monsterSVG(m.species)}
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
    const win = view.winner === view.you, draw = view.winner === null;
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `<div class="ava lg">${avatarSVG(win || draw ? view.me.avatar : view.opp.avatar)}</div>
      <h1 class="title">${draw ? '무승부' : win ? '승리' : '패배'}</h1>
      <p style="color:#fff">${esc(view.me.name)} 대 ${esc(view.opp.name)}, ${view.turn - 1}턴${practice ? ' (연습)' : ''}</p>
      <button class="btn" id="to-lobby">로비로 돌아가기</button>`;
    app.appendChild(div);
    div.querySelector('#to-lobby').onclick = () => { view = null; showLobby(); };
  }

  return { enter, onTurn, onChosen, setNote, onNoBattle };
})();
