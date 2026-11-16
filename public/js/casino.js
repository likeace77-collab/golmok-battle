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
    coin: () => { tone(1975, .07, { vol: .05, type: 'triangle' }); tone(2637, .12, { vol: .05, type: 'triangle', at: .05 }); },
  };
})();

const CAS = { v: null, tab: 'slot', cur: 'coins', bet: {} };
const casBet = (cur = CAS.cur) => CAS.bet[cur] ?? (cur === 'coins' ? 10 : 1);
const casName = (cur) => CAS.v?.cur[cur]?.n || cur;
const coinIco = (s = 18) => `<i class="cs-ci" style="--s:${s}px"></i>`;
const casIcon = (cur, s = 18) => ({ coins: coinIco(s), gp: ICON.gp(s + 2), tickets: ICON.ticket(s), skips: ICON.skip(s), rerolls: '🎲' }[cur]);

async function showCasino(back = showLobby) {
  G.screen = 'casino'; app.className = 'casino-mode';
  app.innerHTML = `${topbar('🎰 골목 도박장')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = () => { app.className = ''; back(); };
  try { CAS.v = (await api('GET', '/api/casino')).casino; } catch (e) { return toast(e.message); }
  if (!CAS.v.cur[CAS.cur]) CAS.cur = 'coins';
  CAS.back = back; if (!CAS.v.wallet.coins && CAS.tab !== 'xchg' && !CAS.seenX) { CAS.tab = 'xchg'; CAS.seenX = true; } casDraw();
}
function casSet(r) { setUser(r); if (r.casino) CAS.v = r.casino; else if (CAS.v) CAS.v.wallet.coins = G.user.coins || 0; const w = app.querySelector('.wallet'); if (w) w.outerHTML = walletHTML(); casHead(); }
function casHead() {
  const v = CAS.v, el = app.querySelector('#cs-head'); if (!el) return;
  const net = Object.entries(v.net || {}).filter(([, n]) => n).map(([k, n]) => `<span class="${n > 0 ? 'up' : 'dn'}">${casName(k)} ${n > 0 ? '+' : ''}${fmt(n)}</span>`).join('');
  const coins = v.wallet.coins || 0, from = CAS.shownCoins ?? coins;
  el.innerHTML = `<div class="cs-jp"><small>💎 슬롯 잭팟</small><b>${coinIco(22)} ${fmt(v.jackpot)}</b></div>
    <button class="cs-purse" id="cs-purse" title="환전소">${coinIco(26)}<b id="cs-coins">${fmt(from)}</b><small>도박코인 · 💱 환전</small></button>
    <div class="cs-meta"><span>오늘 ${v.plays}/${v.max}판</span>${net ? `<span class="cs-net">오늘 손익 ${net}</span>` : ''}</div>`;
  el.querySelector('#cs-purse').onclick = () => { if (CAS.busy) return; CAS.tab = 'xchg'; casDraw(); };
  casCount(from, coins);
}
// 지갑 코인 숫자가 굴러가며 바뀌어요
function casCount(from, to) {
  CAS.shownCoins = to; const el = app.querySelector('#cs-coins'); if (!el || from === to) { if (el) el.textContent = fmt(to); return; }
  const t0 = performance.now(), d = Math.min(1200, 350 + Math.abs(to - from) * 4), up = to > from;
  el.parentNode.classList.remove('up', 'dn'); void el.offsetWidth; el.parentNode.classList.add(up ? 'up' : 'dn');
  const step = (t) => { const k = Math.min(1, (t - t0) / d), e = 1 - (1 - k) ** 3; el.textContent = fmt(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
// 🪙 금화가 튀어 올랐다가 지갑으로 빨려 들어가요
function casCoinRain(n, src) {
  const purse = app.querySelector('#cs-purse'); if (!purse) return;
  const a = (src || app.querySelector('#cs-game') || document.body).getBoundingClientRect(), b = purse.getBoundingClientRect();
  const sx = a.left + a.width / 2, sy = a.top + Math.min(a.height / 2, 220), tx = b.left + 22, ty = b.top + b.height / 2;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i'); c.className = 'cs-fly'; document.body.appendChild(c);
    const ang = Math.random() * Math.PI * 2, r = 50 + Math.random() * 120, mx = sx + Math.cos(ang) * r, my = sy + Math.sin(ang) * r * .7 - 60;
    const dur = 900 + Math.random() * 500, delay = i * 28;
    c.animate([
      { transform: `translate(${sx}px,${sy}px) scale(.3) rotateY(0deg)`, opacity: 0 },
      { transform: `translate(${mx}px,${my}px) scale(1.15) rotateY(540deg)`, opacity: 1, offset: .45 },
      { transform: `translate(${tx}px,${ty}px) scale(.45) rotateY(1080deg)`, opacity: .9 },
    ], { duration: dur, delay, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'both' }).onfinish = () => { c.remove(); purse.classList.remove('gulp'); void purse.offsetWidth; purse.classList.add('gulp'); if (i % 3 === 0) CasSfx.coin(); };
  }
}
function casDraw() {
  const v = CAS.v, tabs = [['slot', '🎰', '슬롯머신'], ['roulette', '🎡', '룰렛'], ['double', '🪙', '더블업'], ['hilo', '🃏', '하이로우'], ['scratch', '🎫', '복권'], ['race', '🏇', '경마'], ['lotto', '🎱', '로또'], ['box', '🎁', '상자'], ['xchg', '💱', '환전소']];
  app.innerHTML = `${topbar('🎰 골목 도박장')}
    <section class="cs-hero"><div class="cs-lights" aria-hidden="true">${'<i></i>'.repeat(18)}</div><div id="cs-head"></div>
      <p class="cs-warn"><b>도박코인</b>(1개 = 100GP)과 아이템만 걸 수 있어요. GP는 💱 환전소에서 바꿔요 (진짜 돈 X). 대박은 <b>극악의 확률</b>이고, 길게 하면 대부분 잃어요. 하루 ${v.max}판까지.</p></section>
    <nav class="cs-tabs">${tabs.map(([k, i, n]) => `<button class="${CAS.tab === k ? 'on' : ''}" data-tab="${k}"><span>${i}</span>${n}</button>`).join('')}</nav>
    <div id="cs-game"></div>
    <section class="panel cs-wins"><h2>🏆 최근 대박</h2>${v.wins.length ? v.wins.map((w) => `<div><b>${esc(w.name)}</b> ${esc(w.game)} <em>${casName(w.cur)} ${fmt(w.n)}</em> <small>×${fmt(w.mult)}</small></div>`).join('') : '<p class="muted">아직 대박이 없어요. 첫 주인공이 돼 보세요!</p>'}</section>`;
  app.querySelector('#back').onclick = () => { app.className = ''; CAS.back(); };
  app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { if (CAS.busy) return; CAS.tab = b.dataset.tab; casDraw(); }; });
  casHead();
  ({ slot: casSlot, roulette: casRoulette, double: casDouble, scratch: casScratch, hilo: casHilo, race: casRace, lotto: casLotto, box: casBox, xchg: casExchange })[CAS.tab](app.querySelector('#cs-game'));
}
// 무엇을 얼마나 걸지 (도박코인·아이템)
function betBar(box, { gpOnly = false } = {}) { // gpOnly: 도박코인만 (경마)
  const v = CAS.v, curs = gpOnly ? ['coins'] : Object.keys(v.cur);
  if (gpOnly || !v.cur[CAS.cur]) CAS.cur = 'coins';
  const c = v.cur[CAS.cur], have = v.wallet[CAS.cur] ?? G.user[CAS.cur] ?? 0;
  const steps = CAS.cur === 'coins' ? [1, 5, 10, 50, 100, 500].filter((n) => n <= c.max) : [1, 2, 3, 5, 10, 20, 50].filter((n) => n <= c.max);
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
function casCelebrate(win, mult, cur, src) {
  const game = src || app.querySelector('#cs-game');
  if (win > 0 && cur === 'coins') casCoinRain(Math.max(4, Math.min(36, Math.round(4 + Math.log2(1 + mult) * 5))), game);
  if (mult >= 30) {
    CasSfx.big();
    const tier = mult >= 300 ? ['JACKPOT', 'jp'] : mult >= 100 ? ['MEGA WIN', 'mega'] : ['BIG WIN', 'big'];
    const b = document.createElement('div'); b.className = `cs-bigwin ${tier[1]}`;
    b.innerHTML = `<div class="bw-rays"></div><small>${tier[0]}</small><b>×${fmt(mult)}</b><span>${casIcon(cur, 26)} +<em>0</em></span>`;
    document.body.appendChild(b);
    const em = b.querySelector('em'), t0 = performance.now();
    const roll = (t) => { const k = Math.min(1, (t - t0) / 1600); em.textContent = fmt(Math.round(win * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(roll); else CasSfx.coin(); };
    requestAnimationFrame(roll);
    fxBurst(document.body, { chars: ['✦', '💎', '★'], colors: ['#FFD23F', '#fff', '#2EF2FF'], n: 34, spread: 300, size: [16, 34], dur: 1800 });
    b.onclick = () => b.remove(); setTimeout(() => b.classList.add('out'), 2900); setTimeout(() => b.remove(), 3400);
  } else if (win > 0) { CasSfx.win(); game?.classList.remove('cs-glow'); void game?.offsetWidth; game?.classList.add('cs-glow'); }
  else { CasSfx.lose(); game?.classList.remove('cs-miss'); void game?.offsetWidth; game?.classList.add('cs-miss'); }
}

/* 🎰 슬롯머신 */
function casSlot(box) {
  const v = CAS.v, sym = v.slot.sym, rows = Object.entries(v.slot.triple).reverse();
  box.innerHTML = `<section class="panel cs-slot"><div class="sl-machine"><div class="sl-top">GOLMOK SLOTS</div>
      <div class="sl-reels">${[0, 1, 2].map((i) => `<div class="sl-reel" data-r="${i}"><div class="sl-strip">${sym[i * 2 % sym.length]}</div></div>`).join('')}</div>
      <p class="sl-msg" id="sl-msg">레버를 당겨요!</p></div>
    <div id="cs-bet"></div><button class="btn wide cs-go" id="sl-go">🎰 돌리기</button>
    <details class="cs-pay"><summary>배당표</summary><table>${rows.map(([s, m]) => `<tr><td>${s}${s}${s}</td><td>×${fmt(m)}${s === '💎' ? ' + 잭팟' : ''}</td><td>${s}${s} ×${v.slot.pair[s]}</td></tr>`).join('')}</table><p class="muted">💎💎💎는 약 12만 5천 번에 한 번. 도박코인으로 걸면 쌓인 잭팟을 통째로 가져가요 (아이템은 ×100). 같은 그림 2개면 작은 배당.</p></details></section>`;
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
    <div id="cs-bet"></div><button class="btn wide cs-go" id="rl-go">🎡 돌리기</button><p class="muted">0이 나오면 빨강·검정·홀짝·1~18/19~36에 건 판돈은 절반을 돌려받아요. 묶음·숫자는 잃어요 (숫자 0에 건 사람만 당첨).</p></section>`;
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
    msg.innerHTML = `<span class="rl-n ${r.n === 0 ? 'z' : r.red ? 'r' : 'b'}">${r.n}</span> ${r.hit ? `당첨! ${casName(cur)} +${fmt(r.win)}` : r.half ? `0! 판돈 절반 ${fmt(r.win)} 돌려받음` : '아쉬워요…'}`;
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
    : `<p class="sl-msg">동전 앞뒤를 맞히면 판돈이 두 배! 틀리면 다 잃어요.<br><small>한 번 맞힐 확률 49% · 10번 연속이면 ×1024 (약 1250번에 한 번)</small></p><div id="cs-bet"></div><button class="btn wide cs-go" id="db-go">🪙 판돈 걸기</button>`}</section>`;
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
  box.innerHTML = `<section class="panel cs-sc"><div class="sc-ticket" id="sc-t"><div class="lt-head"><b>골목 즉석복권</b><small>같은 금액 3개 = 당첨 · 1등 ${fmt(s.prizes[0])}코인</small></div>
      <div class="sc-grid" id="sc-grid">${Array.from({ length: 9 }, () => '<div class="sc-cell idle">?</div>').join('')}</div></div>
    <p class="sl-msg" id="sc-msg">한 장 도박코인 ${fmt(s.price)}개</p>
    <div class="db-pick"><button class="btn" id="sc-buy">🎫 한 장 사기 (${coinIco(16)} ${fmt(s.price)})</button><button class="btn paper" id="sc-all" disabled>다 긁기</button></div>
    <details class="cs-pay"><summary>당첨금</summary><p class="muted">${s.prizes.map((p, i) => `${i + 1}등 ${fmt(p)}코인`).join(' · ')}<br>1등은 20만 장에 한 장꼴이에요.</p></details></section>`;
  let cur = null, opened = 0, grid = box.querySelector('#sc-grid');
  const finish = () => {
    const msg = box.querySelector('#sc-msg'); box.querySelector('#sc-all').disabled = true;
    grid.querySelectorAll('.sc-cell').forEach((c) => { if (cur.prize && +c.dataset.v === cur.prize) c.classList.add('hit'); });
    msg.innerHTML = cur.prize ? `당첨! 도박코인 +${fmt(cur.prize)}` : '꽝… 다음 장은 될지도?'; msg.className = `sl-msg ${cur.prize ? 'w' : 'l'}`;
    casCelebrate(cur.prize, cur.prize / s.price, 'coins'); casSet(cur.r); cur = null; box.querySelector('#sc-buy').disabled = false;
  };
  const reveal = (c) => { if (!cur || c.classList.contains('open')) return; c.classList.add('open'); c.textContent = fmt(c.dataset.v); CasSfx.scratch(); if (++opened === 9) finish(); };
  box.querySelector('#sc-buy').onclick = async () => {
    if (cur) return; const r = await casPost('/api/casino/scratch', {}); if (!r) return;
    setUser(r); if (r.casino) { CAS.v = r.casino; casHead(); }
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

/* 💱 환전소: GP ↔ 도박코인 (1개 = 100GP, 한도 없음) */
function casExchange(box) {
  const v = CAS.v, rate = v.rate || 100, gp = G.user.gp || 0, coins = v.wallet.coins || 0;
  CAS.xd ||= 'buy'; CAS.xn ||= 10;
  const buy = CAS.xd === 'buy', maxN = buy ? Math.floor(gp / rate) : coins;
  box.innerHTML = `<section class="panel cs-xc"><div class="xc-board"><div class="xc-side"><small>내 GP</small><b>${ICON.gp(22)} ${fmt(gp)}</b></div>
      <div class="xc-arrow ${buy ? '' : 'rev'}"><span>⇄</span><small>1 : ${rate}</small></div>
      <div class="xc-side"><small>내 도박코인</small><b>${coinIco(22)} ${fmt(coins)}</b></div></div>
    <div class="xc-tabs"><button data-xd="buy" class="${buy ? 'on' : ''}">GP → 도박코인</button><button data-xd="sell" class="${buy ? '' : 'on'}">도박코인 → GP</button></div>
    <div class="cs-amt"><button data-xs="-1">−</button><b>${coinIco(22)} <input id="xc-n" type="number" min="1" inputmode="numeric" value="${CAS.xn}"></b><button data-xs="1">+</button></div>
    <div class="cs-quick">${[1, 10, 50, 100, 500, 1000].map((n) => `<button data-xq="${n}">${fmt(n)}</button>`).join('')}<button data-xq="max">전부 (${fmt(maxN)})</button></div>
    <p class="sl-msg" id="xc-msg"></p>
    <button class="btn wide cs-go" id="xc-go">💱 환전하기</button>
    <p class="muted" style="font-size:12px">도박코인은 도박장에서만 써요. 환전 한도 없음, 수수료 없음 · 도박코인 1개 = 100GP</p></section>`;
  const inp = box.querySelector('#xc-n'), msg = box.querySelector('#xc-msg');
  const sync = () => { const n = Math.max(0, Math.floor(+inp.value || 0)); CAS.xn = n || 1; msg.innerHTML = buy ? `${ICON.gp(18)} ${fmt(n * rate)} → ${coinIco(18)} ${fmt(n)}` : `${coinIco(18)} ${fmt(n)} → ${ICON.gp(18)} ${fmt(n * rate)}`; msg.className = `sl-msg ${n > maxN ? 'l' : ''}`; box.querySelector('#xc-go').disabled = !n || n > maxN; };
  inp.oninput = sync; sync();
  box.querySelectorAll('[data-xd]').forEach((b) => { b.onclick = () => { CAS.xd = b.dataset.xd; casExchange(box); }; });
  box.querySelectorAll('[data-xq]').forEach((b) => { b.onclick = () => { inp.value = b.dataset.xq === 'max' ? maxN : b.dataset.xq; sync(); }; });
  box.querySelectorAll('[data-xs]').forEach((b) => { b.onclick = () => { inp.value = Math.max(1, (Math.floor(+inp.value) || 0) + +b.dataset.xs * (inp.value >= 100 ? 10 : 1)); sync(); }; });
  box.querySelector('#xc-go').onclick = async () => {
    if (CAS.busy) return; CAS.busy = true;
    const r = await casPost('/api/casino/exchange', { dir: CAS.xd, n: CAS.xn }); CAS.busy = false; if (!r) return;
    box.querySelector('.xc-arrow').classList.add('spin');
    if (r.dir === 'buy') casCoinRain(Math.min(30, 6 + Math.round(Math.log2(r.n) * 3)), box.querySelector('.xc-board')); else CasSfx.coin();
    toast(r.dir === 'buy' ? `🪙 도박코인 ${fmt(r.n)}개로 바꿨어요!` : `💰 ${fmt(r.gp)}GP로 바꿨어요!`);
    casSet(r); setTimeout(() => { if (CAS.tab === 'xchg') casExchange(box); }, 650);
  };
}
