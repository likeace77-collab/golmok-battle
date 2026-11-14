// 골목 도박장: 슬롯머신 · 룰렛 · 더블업 · 복권 긁기 (게임 재화만 걸어요. 결과는 서버가 정해요)
const CasSfx = (() => {
  let a = null;
  const ac = () => { a ||= new (window.AudioContext || window.webkitAudioContext)(); if (a.state === 'suspended') a.resume(); return a; };
  function tone(f, d, { type = 'square', vol = .06, at = 0, to = null } = {}) {
    try {
      const c = ac(), t = c.currentTime + .01 + at, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .05);
    } catch { /* 소리 없이 */ }
  }
  return {
    tick: () => tone(1800, .03, { vol: .04 }),
    stop: () => { tone(220, .08, { vol: .12, type: 'triangle' }); tone(110, .1, { vol: .1, type: 'triangle', at: .02 }); },
    lose: () => { tone(330, .18, { vol: .07, to: 220 }); tone(247, .3, { vol: .07, to: 150, at: .16 }); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, { vol: .07, at: i * .08 })),
    big: () => { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .16, { vol: .08, at: i * .09 })); for (let i = 0; i < 14; i++) tone(2400 + Math.random() * 1800, .1, { vol: .04, type: 'triangle', at: .7 + i * .05 }); },
    flip: () => { for (let i = 0; i < 8; i++) tone(3000 - i * 150, .02, { vol: .03, at: i * .07 }); },
    scratch: () => tone(800 + Math.random() * 1600, .025, { type: 'sawtooth', vol: .015 }),
  };
})();

const CAS = { v: null, tab: 'slot', cur: 'gp', bet: {} };
const casBet = (cur = CAS.cur) => CAS.bet[cur] ?? (cur === 'gp' ? 1000 : 1);
const casName = (cur) => CAS.v?.cur[cur]?.n || cur;
const casIcon = (cur, s = 18) => ({ gp: ICON.gp(s + 2), tickets: ICON.ticket(s), skips: ICON.skip(s), rerolls: '🎲' }[cur]);

async function showCasino(back = showLobby) {
  G.screen = 'casino'; app.className = 'casino-mode';
  app.innerHTML = `${topbar('🎰 골목 도박장')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = () => { app.className = ''; back(); };
  try { CAS.v = (await api('GET', '/api/casino')).casino; } catch (e) { return toast(e.message); }
  CAS.back = back; casDraw();
}
function casSet(r) { setUser(r); if (r.casino) CAS.v = r.casino; const w = app.querySelector('.wallet'); if (w) w.outerHTML = walletHTML(); casHead(); }
function casHead() {
  const v = CAS.v, el = app.querySelector('#cs-head'); if (!el) return;
  const net = Object.entries(v.net || {}).filter(([, n]) => n).map(([k, n]) => `<span class="${n > 0 ? 'up' : 'dn'}">${casName(k)} ${n > 0 ? '+' : ''}${fmt(n)}</span>`).join('');
  el.innerHTML = `<div class="cs-jp"><small>💎 슬롯 잭팟</small><b>${fmt(v.jackpot)} GP</b></div><div class="cs-meta"><span>오늘 ${v.plays}/${v.max}판</span>${net ? `<span class="cs-net">오늘 손익 ${net}</span>` : ''}</div>`;
}
function casDraw() {
  const v = CAS.v, tabs = [['slot', '🎰', '슬롯머신'], ['roulette', '🎡', '룰렛'], ['double', '🪙', '더블업'], ['scratch', '🎫', '복권']];
  app.innerHTML = `${topbar('🎰 골목 도박장')}
    <section class="cs-hero"><div class="cs-lights" aria-hidden="true">${'<i></i>'.repeat(18)}</div><div id="cs-head"></div>
      <p class="cs-warn">게임 안 재화만 걸 수 있어요 (진짜 돈 X). 대박은 <b>극악의 확률</b>이고, 길게 하면 대부분 잃어요. 하루 ${v.max}판까지.</p></section>
    <nav class="cs-tabs">${tabs.map(([k, i, n]) => `<button class="${CAS.tab === k ? 'on' : ''}" data-tab="${k}"><span>${i}</span>${n}</button>`).join('')}</nav>
    <div id="cs-game"></div>
    <section class="panel cs-wins"><h2>🏆 최근 대박</h2>${v.wins.length ? v.wins.map((w) => `<div><b>${esc(w.name)}</b> ${esc(w.game)} <em>${casName(w.cur)} ${fmt(w.n)}</em> <small>×${fmt(w.mult)}</small></div>`).join('') : '<p class="muted">아직 대박이 없어요. 첫 주인공이 돼 보세요!</p>'}</section>`;
  app.querySelector('#back').onclick = () => { app.className = ''; CAS.back(); };
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { if (CAS.busy) return; CAS.tab = b.dataset.tab; casDraw(); }; });
  casHead();
  ({ slot: casSlot, roulette: casRoulette, double: casDouble, scratch: casScratch })[CAS.tab](app.querySelector('#cs-game'));
}
// 무엇을 얼마나 걸지 (GP·아이템)
function betBar(box, { gpOnly = false } = {}) {
  const v = CAS.v, curs = gpOnly ? ['gp'] : Object.keys(v.cur);
  if (gpOnly) CAS.cur = 'gp';
  const c = v.cur[CAS.cur], have = v.wallet[CAS.cur] ?? G.user[CAS.cur] ?? 0;
  const steps = CAS.cur === 'gp' ? [100, 500, 1000, 5000, 10000, 50000] : [1, 2, 3, 5, 10, 20, 50].filter((n) => n <= c.max);
  box.innerHTML = `<div class="cs-bet">${curs.length > 1 ? `<div class="cs-cur">${curs.map((k) => `<button class="${k === CAS.cur ? 'on' : ''}" data-cur="${k}">${casIcon(k)}${v.cur[k].n}<small>${fmt(v.wallet[k] ?? 0)}</small></button>`).join('')}</div>` : ''}
    <div class="cs-amt"><button data-d="-1">−</button><b>${casIcon(CAS.cur, 20)} ${fmt(casBet())}</b><button data-d="1">+</button></div>
    <div class="cs-quick">${steps.map((n) => `<button data-n="${n}" class="${casBet() === n ? 'on' : ''}">${fmt(n)}</button>`).join('')}<button data-n="max">최대</button></div>
    <small class="muted">한 번에 ${fmt(c.min)}~${fmt(c.max)} · 가진 ${c.n} ${fmt(have)}</small></div>`;
  const set = (n) => { CAS.bet[CAS.cur] = Math.max(c.min, Math.min(c.max, n)); betBar(box, { gpOnly }); };
  box.querySelectorAll('[data-cur]').forEach((b) => { b.onclick = () => { if (CAS.busy) return; CAS.cur = b.dataset.cur; betBar(box, { gpOnly }); }; });
  box.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => set(b.dataset.n === 'max' ? Math.min(c.max, Math.max(c.min, have)) : +b.dataset.n); });
  box.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { const i = steps.findIndex((n) => n >= casBet()); const j = Math.max(0, Math.min(steps.length - 1, (i < 0 ? steps.length - 1 : i) + +b.dataset.d)); set(steps[j]); }; });
}
async function casPost(url, body) { try { return await api('POST', url, body); } catch (e) { toast(e.message); return null; } }
function casCelebrate(win, mult, cur) {
  if (mult >= 30) { CasSfx.big(); fxBurst(app.querySelector('#cs-game'), { chars: ['💰', '✦', '💎', '🪙'], colors: ['#FFD23F', '#fff', '#2EF2FF'], n: 28, spread: 200, size: [18, 34], dur: 1600 }); const b = document.createElement('div'); b.className = 'cs-bigwin'; b.innerHTML = `<small>대박!</small><b>×${fmt(mult)}</b><span>${casName(cur)} +${fmt(win)}</span>`; document.body.appendChild(b); setTimeout(() => b.remove(), 2600); }
  else if (win > 0) CasSfx.win(); else CasSfx.lose();
}

/* 🎰 슬롯머신 */
function casSlot(box) {
  const v = CAS.v, sym = v.slot.sym, rows = Object.entries(v.slot.triple).reverse();
  box.innerHTML = `<section class="panel cs-slot"><div class="sl-machine"><div class="sl-top">GOLMOK SLOTS</div>
      <div class="sl-reels">${[0, 1, 2].map((i) => `<div class="sl-reel" data-r="${i}"><div class="sl-strip">${sym[i * 2 % sym.length]}</div></div>`).join('')}</div>
      <p class="sl-msg" id="sl-msg">레버를 당겨요!</p></div>
    <div id="cs-bet"></div><button class="btn wide cs-go" id="sl-go">🎰 돌리기</button>
    <details class="cs-pay"><summary>배당표</summary><table>${rows.map(([s, m]) => `<tr><td>${s}${s}${s}</td><td>×${fmt(m)}${s === '💎' ? ' + 잭팟' : ''}</td><td>${s}${s} ×${v.slot.pair[s]}</td></tr>`).join('')}</table><p class="muted">💎💎💎는 약 12만 5천 번에 한 번. GP로 걸면 쌓인 잭팟을 통째로 가져가요 (아이템은 ×100). 같은 그림 2개면 작은 배당.</p></details></section>`;
  betBar(box.querySelector('#cs-bet'));
  const go = box.querySelector('#sl-go');
  go.onclick = async () => {
    if (CAS.busy) return; CAS.busy = true; go.disabled = true;
    box.querySelector('.sl-machine').scrollIntoView({ behavior: 'smooth', block: 'center' });
    const cur = CAS.cur, reels = [...box.querySelectorAll('.sl-strip')];
    reels.forEach((r) => r.parentNode.classList.add('spin'));
    const ti = setInterval(() => { reels.forEach((r) => { if (r.parentNode.classList.contains('spin')) r.textContent = sym[Math.floor(Math.random() * sym.length)]; }); CasSfx.tick(); }, 70);
    const r = await casPost('/api/casino/slot', { cur, bet: casBet() });
    if (!r) { clearInterval(ti); reels.forEach((x) => x.parentNode.classList.remove('spin')); CAS.busy = false; go.disabled = false; return; }
    for (let i = 0; i < 3; i++) { await new Promise((ok) => setTimeout(ok, 450 + i * 350)); reels[i].parentNode.classList.remove('spin'); reels[i].textContent = r.reels[i]; CasSfx.stop(); }
    clearInterval(ti);
    const msg = box.querySelector('#sl-msg'), mult = Math.round(r.win / casBet(cur));
    msg.innerHTML = r.kind === 'jackpot' ? `💎 잭팟!!! +${fmt(r.win)}` : r.win ? `${r.kind === 'triple' ? '트리플!' : '짝!'} ${casName(cur)} +${fmt(r.win)}` : '꽝… 한 번 더?';
    msg.className = `sl-msg ${r.win ? r.win >= casBet(cur) ? 'w' : 'm' : 'l'}`;
    box.querySelector('.sl-machine').classList.toggle('jp', r.kind === 'jackpot' || mult >= 30);
    casCelebrate(r.win, mult, cur); casSet(r); betBar(box.querySelector('#cs-bet'));
    CAS.busy = false; go.disabled = false;
  };
}

/* 🎡 룰렛 */
const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_N = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
function wheelSVG() {
  const seg = 360 / 37, R = 100, pt = (a, r) => `${(110 + r * Math.sin(a * Math.PI / 180)).toFixed(2)} ${(110 - r * Math.cos(a * Math.PI / 180)).toFixed(2)}`;
  return `<svg viewBox="0 0 220 220" class="rl-svg"><circle cx="110" cy="110" r="108" fill="#5a2e10" stroke="#1a1433" stroke-width="4"/><g class="rl-rot" id="rl-rot">${WHEEL.map((n, i) => { const a0 = i * seg - seg / 2, a1 = a0 + seg, c = n === 0 ? '#1f9d55' : RED_N.has(n) ? '#d62839' : '#1a1433';
    return `<path d="M110 110 L${pt(a0, R)} A${R} ${R} 0 0 1 ${pt(a1, R)}Z" fill="${c}" stroke="#E7B23A" stroke-width=".8"/><text x="110" y="${110 - R + 13}" transform="rotate(${i * seg} 110 110)" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">${n}</text>`; }).join('')}
    <circle cx="110" cy="110" r="58" fill="#7a4420" stroke="#E7B23A" stroke-width="3"/><circle cx="110" cy="110" r="16" fill="#E7B23A" stroke="#1a1433" stroke-width="3"/>${[0, 90, 180, 270].map((a) => `<path d="M110 110 L${pt(a, 50)}" stroke="#E7B23A" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
    <path d="M110 4 L100 -10 L120 -10Z" fill="#FFD23F"/><path d="M102 2 L118 2 L110 22Z" fill="#FFD23F" stroke="#1a1433" stroke-width="3" stroke-linejoin="round"/></svg>`;
}
function casRoulette(box) {
  CAS.rk ||= { kind: 'red', pick: null };
  const opts = [['red', '🔴 빨강', 2], ['black', '⚫ 검정', 2], ['odd', '홀', 2], ['even', '짝', 2], ['low', '1~18', 2], ['high', '19~36', 2]];
  box.innerHTML = `<section class="panel cs-rl"><div class="rl-wrap">${wheelSVG()}</div><p class="sl-msg" id="rl-msg">어디에 걸지 골라요</p>
    <div class="rl-opts">${opts.map(([k, n, m]) => `<button data-k="${k}" class="${CAS.rk.kind === k ? 'on' : ''}">${n}<small>×${m}</small></button>`).join('')}
      ${[1, 2, 3].map((d) => `<button data-k="dozen" data-p="${d}" class="${CAS.rk.kind === 'dozen' && CAS.rk.pick === d ? 'on' : ''}">${d * 12 - 11}~${d * 12}<small>×3</small></button>`).join('')}</div>
    <details class="rl-nums" ${CAS.rk.kind === 'num' ? 'open' : ''}><summary>숫자 하나에 걸기 (×36)</summary><div class="rl-grid">${Array.from({ length: 37 }, (_, n) => `<button data-k="num" data-p="${n}" class="${n === 0 ? 'z' : RED_N.has(n) ? 'r' : 'b'}${CAS.rk.kind === 'num' && CAS.rk.pick === n ? ' on' : ''}">${n}</button>`).join('')}</div></details>
    <div id="cs-bet"></div><button class="btn wide cs-go" id="rl-go">🎡 돌리기</button><p class="muted">0이 나오면 숫자 0에 건 사람 말고는 다 잃어요.</p></section>`;
  betBar(box.querySelector('#cs-bet'));
  box.querySelectorAll('[data-k]').forEach((b) => { b.onclick = () => { if (CAS.busy) return; CAS.rk = { kind: b.dataset.k, pick: b.dataset.p !== undefined ? +b.dataset.p : null }; casRoulette(box); }; });
  const go = box.querySelector('#rl-go');
  go.onclick = async () => {
    if (CAS.busy) return; CAS.busy = true; go.disabled = true;
    box.querySelector('.rl-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
    const cur = CAS.cur, bet = casBet(), r = await casPost('/api/casino/roulette', { cur, bet, kind: CAS.rk.kind, pick: CAS.rk.pick });
    if (!r) { CAS.busy = false; go.disabled = false; return; }
    const rot = box.querySelector('#rl-rot'), idx = WHEEL.indexOf(r.n), prev = CAS.rlDeg || 0;
    const target = prev - (prev % 360) + 360 * 6 + (360 - idx * 360 / 37);
    CAS.rlDeg = target; rot.style.transition = 'transform 4s cubic-bezier(.15,.7,.2,1)'; rot.style.transform = `rotate(${target}deg)`;
    let k = 0; const ti = setInterval(() => { if (++k % (1 + Math.floor(k / 12)) === 0) CasSfx.tick(); }, 60);
    await new Promise((ok) => setTimeout(ok, 4100)); clearInterval(ti); CasSfx.stop();
    const msg = box.querySelector('#rl-msg');
    msg.innerHTML = `<span class="rl-n ${r.n === 0 ? 'z' : r.red ? 'r' : 'b'}">${r.n}</span> ${r.hit ? `당첨! ${casName(cur)} +${fmt(r.win)}` : '아쉬워요…'}`;
    msg.className = `sl-msg ${r.hit ? 'w' : 'l'}`;
    casCelebrate(r.win, r.mult, cur); casSet(r); betBar(box.querySelector('#cs-bet'));
    CAS.busy = false; go.disabled = false;
  };
}

/* 🪙 더블업: 맞히면 두 배, 틀리면 다 잃음. 언제든 받고 나갈 수 있어요 */
function casDouble(box) {
  const d = CAS.v.dbl;
  const ladder = Array.from({ length: 10 }, (_, i) => `<i class="${d && d.step > i ? 'on' : ''}${d && d.step === i ? ' next' : ''}">×${2 ** (i + 1)}</i>`).join('');
  box.innerHTML = `<section class="panel cs-dbl"><div class="db-coin${CAS.side === 'tail' ? ' tl' : ''}" id="db-coin"><div class="db-face h">앞</div><div class="db-face t">뒤</div></div>
    <div class="db-ladder">${ladder}</div>
    ${d ? `<div class="db-pot"><small>지금 판돈</small><b>${casIcon(d.cur, 22)} ${fmt(d.pot)}</b><small>${d.step}번 맞힘 · 10번이면 ×1024 자동 지급</small></div>
      <div class="db-pick"><button class="btn" data-f="head">앞면!</button><button class="btn" data-f="tail">뒷면!</button></div>
      <button class="btn wide paper" id="db-cash" ${d.step ? '' : 'disabled'}>💰 ${fmt(d.pot)} 받고 그만하기</button>`
    : `<p class="sl-msg">동전 앞뒤를 맞히면 판돈이 두 배! 틀리면 다 잃어요.<br><small>한 번 맞힐 확률 47% · 10번 연속이면 ×1024 (약 1900번에 한 번)</small></p><div id="cs-bet"></div><button class="btn wide cs-go" id="db-go">🪙 판돈 걸기</button>`}</section>`;
  if (!d) betBar(box.querySelector('#cs-bet'));
  box.querySelector('#db-go')?.addEventListener('click', async () => { const r = await casPost('/api/casino/double', { cur: CAS.cur, bet: casBet() }); if (r) { casSet(r); casDouble(box); } });
  box.querySelector('#db-cash')?.addEventListener('click', async () => { const r = await casPost('/api/casino/cash', {}); if (r) { casCelebrate(r.cashed, 2 ** d.step, r.cur); toast(`${casName(r.cur)} ${fmt(r.cashed)} 받았어요!`); casSet(r); casDouble(box); } });
  box.querySelectorAll('[data-f]').forEach((b) => { b.onclick = async () => {
    if (CAS.busy) return; CAS.busy = true; box.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    const cur = d.cur, r = await casPost('/api/casino/flip', { pick: b.dataset.f });
    if (!r) { CAS.busy = false; casDouble(box); return; }
    const coin = box.querySelector('#db-coin'); CasSfx.flip();
    coin.style.setProperty('--end', r.side === 'head' ? '1800deg' : '1980deg'); coin.classList.add('flip');
    await new Promise((ok) => setTimeout(ok, 1300)); CAS.busy = false; CAS.side = r.side;
    if (r.max) { casCelebrate(r.cashed, 1024, cur); toast(`10연속!!! ${casName(cur)} ${fmt(r.cashed)}`); }
    else if (r.win) { CasSfx.win(); toast(`${r.side === 'head' ? '앞면' : '뒷면'}! 맞혔어요 → ${fmt(r.dbl.pot)}`); }
    else { CasSfx.lose(); toast(`${r.side === 'head' ? '앞면' : '뒷면'}… ${casName(cur)} ${fmt(r.lost)}을(를) 잃었어요.`); }
    casSet(r); casDouble(box);
  }; });
}

/* 🎫 복권 긁기: 손가락으로 칸을 긁어요. 같은 금액 3개면 당첨 */
function casScratch(box) {
  const s = CAS.v.scratch;
  box.innerHTML = `<section class="panel cs-sc"><div class="sc-ticket" id="sc-t"><div class="lt-head"><b>골목 즉석복권</b><small>같은 금액 3개 = 당첨 · 1등 ${fmt(s.prizes[0])}GP</small></div>
      <div class="sc-grid" id="sc-grid">${Array.from({ length: 9 }, () => '<div class="sc-cell idle">?</div>').join('')}</div></div>
    <p class="sl-msg" id="sc-msg">한 장 ${fmt(s.price)}GP</p>
    <div class="db-pick"><button class="btn" id="sc-buy">🎫 한 장 사기 (${fmt(s.price)}GP)</button><button class="btn paper" id="sc-all" disabled>다 긁기</button></div>
    <details class="cs-pay"><summary>당첨금</summary><p class="muted">${s.prizes.map((p, i) => `${i + 1}등 ${fmt(p)}GP`).join(' · ')}<br>1등은 20만 장에 한 장꼴이에요.</p></details></section>`;
  let cur = null, opened = 0, grid = box.querySelector('#sc-grid');
  const finish = () => {
    const msg = box.querySelector('#sc-msg'); box.querySelector('#sc-all').disabled = true;
    grid.querySelectorAll('.sc-cell').forEach((c) => { if (cur.prize && +c.dataset.v === cur.prize) c.classList.add('hit'); });
    msg.innerHTML = cur.prize ? `당첨! +${fmt(cur.prize)}GP` : '꽝… 다음 장은 될지도?'; msg.className = `sl-msg ${cur.prize ? 'w' : 'l'}`;
    casCelebrate(cur.prize, cur.prize / s.price, 'gp'); casSet(cur.r); cur = null; box.querySelector('#sc-buy').disabled = false;
  };
  const reveal = (c) => { if (!cur || c.classList.contains('open')) return; c.classList.add('open'); c.textContent = fmt(c.dataset.v); CasSfx.scratch(); if (++opened === 9) finish(); };
  box.querySelector('#sc-buy').onclick = async () => {
    if (cur) return; const r = await casPost('/api/casino/scratch', {}); if (!r) return;
    setUser(r); const w = app.querySelector('.wallet'); if (w) w.outerHTML = walletHTML();
    cur = { prize: r.prize, r }; opened = 0;
    grid.innerHTML = r.cells.map((n) => `<div class="sc-cell" data-v="${n}"></div>`).join('');
    box.querySelector('#sc-buy').disabled = true; box.querySelector('#sc-all').disabled = false; box.querySelector('#sc-msg').textContent = '손가락으로 문질러 긁어요!'; box.querySelector('#sc-msg').className = 'sl-msg';
  };
  box.querySelector('#sc-all').onclick = () => grid.querySelectorAll('.sc-cell').forEach(reveal);
  let down = false;
  grid.addEventListener('pointerdown', (e) => { down = true; const c = e.target.closest('.sc-cell'); if (c) reveal(c); });
  window.addEventListener('pointerup', () => { down = false; }, { once: false });
  grid.addEventListener('pointermove', (e) => { if (!down) return; const c = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.sc-cell'); if (c && grid.contains(c)) reveal(c); });
  grid.style.touchAction = 'none';
}
