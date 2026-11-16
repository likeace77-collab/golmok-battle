'use strict';
/* 🃏 하이로우 · 🏇 경마 · 🎱 로또 · 🎁 미스터리 상자 (도박장 탭) — 모두 게임 안 재화만 */
const CARD_V = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], CARD_S = ['♠', '♥', '♦', '♣'];
const cardHTML = (c, cls = '') => (c ? `<div class="hl-card ${c.s === 1 || c.s === 2 ? 'red' : ''} ${cls}"><b>${CARD_V[c.v]}</b><span>${CARD_S[c.s]}</span><b class="bt">${CARD_V[c.v]}</b></div>` : '<div class="hl-card back"></div>');

/* 🃏 하이로우: 다음 카드가 높을까 낮을까 */
function casHilo(box) {
  const h = CAS.v.hilo;
  box.innerHTML = `<section class="panel cs-hilo">
    ${h ? `<div class="hl-table">${(h.hist || []).slice(-4).map((c) => cardHTML(c, 'old')).join('')}${cardHTML(h.card, 'now')}<div class="hl-card back next"></div></div>
      <div class="db-pot"><small>지금 판돈 · ${h.step}번 맞힘 (10번이면 자동 지급)</small><b>${casIcon(h.cur, 22)} ${fmt(h.pot)}</b></div>
      <div class="hl-pick"><button class="btn" data-hl="hi" ${h.odds.hi ? '' : 'disabled'}>⬆ 높다!<small>×${h.odds.hi || '-'}</small></button><button class="btn" data-hl="lo" ${h.odds.lo ? '' : 'disabled'}>⬇ 낮다!<small>×${h.odds.lo || '-'}</small></button></div>
      <button class="btn wide paper" id="hl-cash" ${h.step ? '' : 'disabled'}>💰 ${fmt(h.pot)} 받고 그만하기</button>`
    : `<p class="sl-msg">카드 한 장을 보고, 다음 카드가 <b>높을지 낮을지</b> 맞혀요. 맞힐수록 판돈이 불어나요!<br><small>A가 가장 낮고 K가 가장 높아요 · 같은 숫자가 나오면 져요 · 언제든 받고 그만할 수 있어요</small></p><div id="cs-bet"></div><button class="btn wide cs-go" id="hl-go">🃏 카드 받기</button>`}</section>`;
  if (!h) betBar(box.querySelector('#cs-bet'));
  box.querySelector('#hl-go')?.addEventListener('click', async () => { const r = await casPost('/api/casino/hilo', { cur: CAS.cur, bet: casBet() }); if (r) { CasSfx.flip(); casSet(r); casHilo(box); } });
  box.querySelector('#hl-cash')?.addEventListener('click', async () => { const r = await casPost('/api/casino/hilo/cash', {}); if (r) { casCelebrate(r.cashed, Math.round(r.cashed / h.bet), r.cur); toast(`${casName(r.cur)} ${fmt(r.cashed)} 받았어요!`); casSet(r); casHilo(box); } });
  box.querySelectorAll('[data-hl]').forEach((b) => { b.onclick = async () => {
    if (CAS.busy) return; CAS.busy = true; box.querySelectorAll('button').forEach((x) => { x.disabled = true; });
    const cur = h.cur, r = await casPost('/api/casino/hilo/guess', { pick: b.dataset.hl });
    if (!r) { CAS.busy = false; casHilo(box); return; }
    const nx = box.querySelector('.hl-card.next'); CasSfx.flip(); nx.outerHTML = cardHTML(r.card, 'flip');
    await new Promise((ok) => setTimeout(ok, 900)); CAS.busy = false;
    if (r.max) { casCelebrate(r.cashed, Math.round(r.cashed / h.bet), cur); toast(`10연속!!! ${casName(cur)} ${fmt(r.cashed)}`); }
    else if (r.win) { CasSfx.win(); toast(`${CARD_V[r.card.v]}! 맞혔어요 → ${fmt(r.hilo.pot)}`); }
    else { CasSfx.lose(); toast(`${CARD_V[r.card.v]}… ${casName(cur)} ${fmt(r.lost)}을(를) 잃었어요.`); }
    casSet(r); casHilo(box);
  }; });
}

/* 🏇 골목몬 경마: 20분마다 출발 */
const RACE = { v: null, timer: null, played: null, pick: 0 };
const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
async function casRace(box, replay = false) {
  clearInterval(RACE.timer);
  try { RACE.v = (await api('GET', '/api/race')).race; } catch (e) { return toast(e.message); }
  if (CAS.tab !== 'race' || !box.isConnected) return;
  const v = RACE.v, c = v.cur, last = v.last[0];
  const myOn = (i) => c.mine.filter((b) => b.horse === i).reduce((n, b) => n + b.bet, 0);
  box.innerHTML = `<section class="panel cs-race">
    <div class="rc-head"><div><small>다음 경주 출발까지</small><b id="rc-cd">${mmss(c.at - Date.now())}</b></div><div><small>이번 판 판돈</small><b>${coinIco(18)} ${fmt(c.pool)}</b><small>${c.bettors}명 참가</small></div></div>
    <div class="rc-track" id="rc-track">${(replay && last ? last.horses : c.horses).map((h, i) => `<div class="rc-lane"><em>${i + 1}</em><div class="rc-runner" data-i="${i}">${monArt(h.species)}</div><span class="rc-goal">🏁</span></div>`).join('')}</div>
    <div class="rc-list">${c.horses.map((h, i) => `<button class="rc-h${RACE.pick === i ? ' on' : ''}" data-h="${i}"><em>${i + 1}</em>${monArt(h.species)}<span><b>${esc(h.n)}</b><small>배당 ×${h.odds}${myOn(i) ? ` · 내가 ${fmt(myOn(i))}` : ''}</small></span></button>`).join('')}</div>
    <div id="cs-bet"></div><button class="btn wide cs-go" id="rc-go">🏇 ${c.horses[RACE.pick].n}에게 걸기</button>
    <p class="muted" style="font-size:12px">한 번에 도박코인 ${fmt(v.min)}~${fmt(v.max)}개 · 한 판에 ${v.maxBets}번까지 · 출발 15초 전 마감 · 1등을 맞히면 건 돈 × 배당</p>
    ${last ? `<div class="rc-last"><b>지난 경주</b> 1등 <em>${last.win + 1}번 ${esc(last.horses[last.win].n)}</em> (×${last.horses[last.win].odds}) <button class="btn small paper" id="rc-replay">▶ 다시 보기</button></div>` : ''}</section>`;
  if (casBet('coins') > v.max) CAS.bet.coins = v.max; // 경마는 한 번에 200코인까지
  betBar(box.querySelector('#cs-bet'), { gpOnly: true });
  box.querySelectorAll('[data-h]').forEach((b) => { b.onclick = () => { RACE.pick = +b.dataset.h; casRace(box); }; });
  box.querySelector('#rc-go').onclick = async () => {
    const bet = Math.min(v.max, casBet('coins'));
    const r = await casPost('/api/race/bet', { horse: RACE.pick, bet }); if (!r) return;
    casSet(r); CasSfx.flip(); toast(`🏇 ${c.horses[RACE.pick].n}에게 도박코인 ${fmt(bet)}개!`); casRace(box);
  };
  box.querySelector('#rc-replay')?.addEventListener('click', () => raceAnim(box, last));
  RACE.timer = setInterval(() => {
    const el = box.querySelector('#rc-cd'); if (!el || CAS.tab !== 'race') return clearInterval(RACE.timer);
    const left = c.at - Date.now(); el.textContent = mmss(left);
    if (left < -2500) { clearInterval(RACE.timer); casRace(box).then(() => { const l = RACE.v?.last[0]; if (l && l.id === c.id && RACE.played !== l.id) { RACE.played = l.id; raceAnim(box, l); } }); }
  }, 500);
  if (replay && last) raceAnim(box, last);
}
// 경주 장면: 구간마다 위치(0~100)
async function raceAnim(box, r) {
  const track = box.querySelector('#rc-track'); if (!track || !r) return;
  track.innerHTML = r.horses.map((h, i) => `<div class="rc-lane"><em>${i + 1}</em><div class="rc-runner" data-i="${i}">${monArt(h.species)}</div><span class="rc-goal">🏁</span></div>`).join('');
  track.scrollIntoView({ block: 'center', behavior: 'smooth' });
  const runs = [...track.querySelectorAll('.rc-runner')];
  CasSfx.tick?.();
  for (const f of r.frames) {
    runs.forEach((el, i) => { el.style.left = `calc(${Math.min(100, f[i])}% * .82)`; });
    try { CasSfx.tick(); } catch { /* */ }
    await new Promise((ok) => setTimeout(ok, 520));
    if (!track.isConnected) return;
  }
  runs[r.win].classList.add('win');
  CasSfx.win();
  fxBurst(runs[r.win], { chars: ['🏆', '✦', '🎉'], colors: ['#FFD23F'], n: 14, spread: 90 });
}
function onRaceDone(m) {
  toast(m.got ? `🏇 ${m.winner} 1등! 도박코인 ${fmt(m.got)}개 받았어요!` : `🏇 ${m.winner} 1등! 이번엔 못 맞혔어요. (코인 ${fmt(m.spent)}개)`);
  if (m.got && typeof casCoinRain === 'function' && G.screen === 'casino') casCoinRain(Math.min(30, 8 + Math.round(Math.log2(m.got) * 2)), app.querySelector('#rc-track'));
  if (m.got && typeof api === 'function') api('GET', '/api/me').then((r) => { setUser(r); if (G.screen === 'casino' && CAS.v) { CAS.v.wallet.coins = G.user.coins || 0; casHead(); } }).catch(() => {});
}

/* 🎱 주간 로또: 1~20 중 5개 */
const LOTTO = { pick: [] };
async function casLotto(box) {
  let t; try { t = (await api('GET', '/api/lotto')).lotto; } catch (e) { return toast(e.message); }
  if (CAS.tab !== 'lotto' || !box.isConnected) return;
  const ball = (n, cls = '') => `<i class="lt-ball b${Math.ceil(n / 5)} ${cls}">${n}</i>`;
  box.innerHTML = `<section class="panel cs-lotto">
    <div class="rc-head"><div><small>${t.round}회 1등 상금 (쌓이는 중)</small><b>${coinIco(18)} ${fmt(t.pot)}</b></div><div><small>추첨</small><b>${dateStr(t.at)}</b><small>일요일 밤 8시 · ${fmt(t.sold)}장 팔림</small></div></div>
    <p class="sl-msg">1~${t.n} 중 숫자 <b>${t.pick}개</b>를 골라요. 한 장 도박코인 ${fmt(t.price)}개 · 한 회에 ${t.max}장까지<br><small>5개 = 1등(쌓인 상금 나눠 갖기) · 4개 ${fmt(t.fix[4])} · 3개 ${fmt(t.fix[3])} · 2개 ${fmt(t.fix[2])}코인 · 1등이 없으면 상금이 다음 회로!</small></p>
    <div class="lt-grid">${Array.from({ length: t.n }, (_, i) => i + 1).map((n) => `<button class="lt-n${LOTTO.pick.includes(n) ? ' on' : ''}" data-n="${n}">${n}</button>`).join('')}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn" id="lt-buy" ${LOTTO.pick.length === t.pick ? '' : 'disabled'}>🎱 이 번호로 사기 (${LOTTO.pick.length}/${t.pick})</button><button class="btn paper" id="lt-auto">🎲 자동으로 사기</button></div>
    <h3 class="dex-h">내 ${t.round}회 로또 ${t.mine.length}/${t.max}</h3><div class="lt-mine">${t.mine.map((ns) => `<div>${ns.map((n) => ball(n)).join('')}</div>`).join('') || '<p class="muted">아직 안 샀어요.</p>'}</div>
    ${t.hist.length ? `<h3 class="dex-h">지난 당첨 번호</h3>${t.hist.slice(0, 5).map((h) => `<div class="lt-hist"><small>${h.round}회</small>${h.nums.map((n) => ball(n)).join('')}<small>${h.firsts ? `1등 ${h.firsts}명 · ${fmt(h.share)}${h.round >= (t.coinFrom || 0) ? '코인' : 'GP'}씩` : '1등 없음 → 이월'}</small></div>`).join('')}` : ''}</section>`;
  box.querySelectorAll('[data-n]').forEach((b) => { b.onclick = () => { const n = +b.dataset.n, i = LOTTO.pick.indexOf(n); if (i >= 0) LOTTO.pick.splice(i, 1); else if (LOTTO.pick.length < t.pick) LOTTO.pick.push(n); casLotto(box); }; });
  const buy = async (body) => { const r = await casPost('/api/lotto/buy', body); if (r) { casSet(r); CasSfx.win(); toast(`🎱 ${r.nums.join(' · ')} 샀어요!`); LOTTO.pick = []; casLotto(box); } };
  box.querySelector('#lt-buy').onclick = () => buy({ nums: LOTTO.pick });
  box.querySelector('#lt-auto').onclick = () => buy({ auto: true });
}

/* 🎁 미스터리 상자 */
async function casBox(box) {
  let v; try { v = (await api('GET', '/api/boxes')).box; } catch (e) { return toast(e.message); }
  if (CAS.tab !== 'box' || !box.isConnected) return;
  const T = [['c', '#9bb4d6'], ['r', '#b07bff'], ['l', '#FFD23F']];
  box.innerHTML = `<section class="panel cs-box">
    <p class="sl-msg">상자를 열면 GP·리롤권·입수권·메가스톤·<b>등급 스킨</b>, 아주 드물게 <b>✨이로치 골목몬</b>이 나와요!<br><small>대전에서 이기면 가끔 주워요 · ${v.pityMax}번 동안 이로치가 안 나오면 다음 상자는 이로치 확정 (지금 ${v.pity}/${v.pityMax})</small></p>
    <div class="bx-row">${T.map(([k, c]) => `<div class="bx-it" style="--bc:${c}"><div class="bx-pic" data-pic="${k}">${v.info[k].icon}</div><b>${v.info[k].n}</b><small>${v.boxes[k] || 0}개</small>
      <button class="btn small" data-open="${k}" ${v.boxes[k] ? '' : 'disabled'}>열기</button>${v.info[k].price ? `<button class="btn small paper" data-buy="${k}">${coinIco(14)} ${fmt(v.info[k].price)}</button>` : '<small class="muted">사지 못해요</small>'}</div>`).join('')}</div>
    <details class="bx-odds"><summary>📋 확률 보기</summary>${T.map(([k]) => `<p><b>${v.info[k].n}</b> ${v.table[k].map(([p, r]) => `${typeof r === 'string' ? `GP ${r.slice(3).replace('-', '~')}` : r.mon ? '✨이로치 골목몬' : r.skin ? `${G.data.SKIN_GRADES?.[r.skin]?.n || ''} 스킨` : r.stones ? `메가스톤 ${r.stones}` : r.tickets ? `입수권 ${r.tickets}` : r.rerolls ? `리롤권 ${r.rerolls}` : r.skips ? `스킵권 ${r.skips}` : '?'} ${p}%`).join(' · ')}</p>`).join('')}</details></section>`;
  box.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = async () => { const r = await casPost('/api/boxes/buy', { tier: b.dataset.buy }); if (r) { casSet(r); toast(`${v.info[b.dataset.buy].icon} 상자를 샀어요!`); casBox(box); } }; });
  box.querySelectorAll('[data-open]').forEach((b) => { b.onclick = async () => {
    if (CAS.busy) return; CAS.busy = true;
    const k = b.dataset.open, r = await casPost('/api/boxes/open', { tier: k });
    if (!r) { CAS.busy = false; return; }
    const pic = box.querySelector(`[data-pic="${k}"]`); pic.classList.add('shake'); CasSfx.tick?.();
    await new Promise((ok) => setTimeout(ok, 1100)); pic.classList.remove('shake');
    CAS.busy = false; setUser(r);
    const gl = { common: '#9bb4d6', rare: '#4FA3FF', epic: '#FF3B6B', legend: '#FFD23F' }[r.grade];
    if (r.grade === 'legend' || r.grade === 'epic') casCelebrate(1, 50, 'gp'); else CasSfx.win();
    fxBurst(pic, { chars: ['✦', '★'], colors: [gl], n: 16, spread: 120 });
    const skin = r.got.find((g) => g.k === 'costume');
    if (skin) { const bg = openSheet(`<div class="bx-skin" style="--gc:${G.data.SKIN_GRADES[skin.grade]?.c}"><h2>🎨 스킨 획득!</h2>${gradeTag(skin.grade)}<div class="sk-demo cos-prev">${skinArt(monArt(SKIN_FX[skin.id]?.only || 'malrang'), skin.id)}</div><b>${esc(skin.n)}</b><p class="muted">내 골목몬 → 스킨에서 입혀요</p><button class="btn wide" data-x>좋아!</button></div>`); bg.querySelector('[data-x]').onclick = closeSheet; }
    else showGot(r.got, `${v.info[k].icon} ${v.info[k].n}에서!`);
    casBox(box);
  }; });
}
