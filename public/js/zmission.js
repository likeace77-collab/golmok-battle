// Z기술 호흡 미션: 스와이프 방향 맞추기, 리듬 맞추기 중 하나가 무작위로 나옵니다.
const ZMission = (() => {
  const ARROWS = { up: '↑', down: '↓', left: '←', right: '→' };
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };

  const wa = (w) => { const c = w.charCodeAt(w.length - 1) - 0xac00; return w + (c >= 0 && c <= 11171 && c % 28 ? '과' : '와'); };

  function run({ moveName, monName, color }) {
    return new Promise((resolve) => {
      if (window.__zAuto !== undefined) return resolve(!!window.__zAuto); // 자동 테스트용
      const root = document.createElement('div');
      root.className = 'zm';
      root.style.setProperty('--zc', color);
      document.body.appendChild(root);
      let done = false;
      const cleanups = [];
      const finish = (ok) => {
        if (done) return;
        done = true;
        cleanups.forEach((f) => f());
        root.querySelector('.zm-box').innerHTML = `<p class="zm-result ${ok ? 'ok' : 'bad'}">${ok ? '호흡 완벽!' : '호흡이 어긋났다...'}</p>`;
        setTimeout(() => { root.remove(); resolve(ok); }, ok ? 700 : 1100);
      };
      root.innerHTML = `<div class="zm-box">
        <p class="zm-kicker">Z기술 ${esc(moveName)}</p>
        <h2 class="zm-title">${esc(wa(monName))} 호흡을 맞춰라!</h2>
        <div class="zm-stage"></div>
        <div class="zm-time"><i></i></div>
        <button class="btn small paper zm-cancel">그만두기</button>
      </div>`;
      root.querySelector('.zm-cancel').onclick = () => { if (done) return; done = true; cleanups.forEach((f) => f()); root.remove(); resolve(null); };
      (Math.random() < .5 ? swipe : rhythm)(root.querySelector('.zm-stage'), root.querySelector('.zm-time i'), finish, cleanups);
    });
  }

  // 화살표 4개를 순서대로 스와이프(또는 화살표 키, 버튼)
  function swipe(stage, bar, finish, cleanups) {
    const dirs = Object.keys(ARROWS);
    const seq = Array.from({ length: 4 }, () => dirs[Math.floor(Math.random() * 4)]);
    let at = 0;
    const LIMIT = 8000, t0 = performance.now();
    stage.innerHTML = `<p class="zm-help">화살표 방향으로 화면을 밀어라</p>
      <div class="zm-seq">${seq.map((d, i) => `<span data-i="${i}">${ARROWS[d]}</span>`).join('')}</div>
      <div class="zm-pad">${['up', 'left', 'right', 'down'].map((d) => `<button data-dir="${d}" aria-label="${d}">${ARROWS[d]}</button>`).join('')}</div>`;
    const mark = () => stage.querySelectorAll('.zm-seq span').forEach((s, i) => { s.className = i < at ? 'hit' : i === at ? 'now' : ''; });
    const input = (d) => {
      if (d !== seq[at]) { stage.querySelector(`[data-i="${at}"]`).className = 'miss'; return finish(false); }
      at++; mark();
      if (at === seq.length) finish(true);
    };
    mark();
    // 태블릿·폰마다 터치 이벤트가 달라서: 포인터 + 터치 둘 다 받고, 취소(pointercancel)돼도 마지막 위치로 판정
    let sx = 0, sy = 0, lx = 0, ly = 0, down = false, lastSwipe = 0;
    const start = (x, y, t) => { if (t?.closest?.('button')) return; down = true; sx = lx = x; sy = ly = y; };
    const move = (x, y) => { if (down) { lx = x; ly = y; } };
    const end = () => {
      if (!down) return; down = false;
      const dx = lx - sx, dy = ly - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      const now = performance.now(); if (now - lastSwipe < 120) return; lastSwipe = now; // 포인터·터치가 같이 와도 한 번만
      input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    const pd = (e) => start(e.clientX, e.clientY, e.target), pm = (e) => move(e.clientX, e.clientY), pu = (e) => { move(e.clientX, e.clientY); end(); };
    const ts = (e) => { const t = e.changedTouches[0]; if (t) start(t.clientX, t.clientY, e.target); }, tm = (e) => { const t = e.changedTouches[0]; if (t) move(t.clientX, t.clientY); if (down) e.preventDefault(); }, te = (e) => { const t = e.changedTouches[0]; if (t) move(t.clientX, t.clientY); end(); };
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); input(KEYS[e.key]); } };
    const box = stage.closest('.zm');
    const L = [['pointerdown', pd], ['pointermove', pm], ['pointerup', pu], ['pointercancel', end], ['touchstart', ts], ['touchmove', tm], ['touchend', te], ['touchcancel', end]];
    L.forEach(([ev, f]) => box.addEventListener(ev, f, { passive: ev !== 'touchmove' }));
    addEventListener('keydown', kd);
    stage.querySelectorAll('[data-dir]').forEach((b) => { b.onclick = () => input(b.dataset.dir); });
    const timer = setInterval(() => {
      const p = (performance.now() - t0) / LIMIT;
      bar.style.width = `${Math.max(0, 1 - p) * 100}%`;
      if (p >= 1) finish(false);
    }, 50);
    cleanups.push(() => { clearInterval(timer); L.forEach(([ev, f]) => box.removeEventListener(ev, f)); removeEventListener('keydown', kd); });
  }

  // 줄어드는 고리가 가운데 원에 겹칠 때 눌러라. 4번 중 3번 성공
  function rhythm(stage, bar, finish, cleanups) {
    const BEATS = 4, GAP = 1100, SHRINK = 900, WINDOW = 220; // 태블릿 터치 지연까지 봐서 넉넉하게
    const t0 = performance.now() + 500;
    let hits = 0, judged = 0;
    const hitTimes = Array.from({ length: BEATS }, (_, i) => t0 + i * GAP + SHRINK);
    const used = new Set();
    stage.innerHTML = `<p class="zm-help">고리가 원에 닿는 순간 눌러라 (4번 중 3번)</p>
      <button class="zm-drum" aria-label="누르기"><i class="zm-ring"></i><b>누르기</b></button>
      <p class="zm-score">${'○'.repeat(BEATS)}</p>`;
    const ring = stage.querySelector('.zm-ring'), score = stage.querySelector('.zm-score'), drum = stage.querySelector('.zm-drum');
    const marks = Array(BEATS).fill('○');
    const judge = (i, ok) => {
      if (used.has(i)) return;
      used.add(i); judged++;
      if (ok) hits++;
      marks[i] = ok ? '●' : '✕';
      score.textContent = marks.join('');
      drum.classList.remove('good', 'bad'); void drum.offsetWidth; drum.classList.add(ok ? 'good' : 'bad');
      if (hits >= 3) return finish(true);
      if (judged - hits > 1) return finish(false);
      if (judged === BEATS) finish(hits >= 3);
    };
    let lastTap = 0;
    const tap = (e) => {
      const now = e && e.timeStamp > 1 && e.timeStamp <= performance.now() + 5 ? e.timeStamp : performance.now(); // 실제로 누른 순간 (화면이 늦게 처리해도)
      if (now - lastTap < 90) return; lastTap = now;
      const i = hitTimes.findIndex((t, j) => !used.has(j) && Math.abs(now - t) < GAP / 2);
      if (i >= 0) judge(i, Math.abs(now - hitTimes[i]) <= WINDOW);
    };
    drum.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(e); });
    drum.addEventListener('touchstart', (e) => { e.preventDefault(); tap(e); }, { passive: false }); // 포인터 이벤트가 늦거나 안 오는 기기
    const kd = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(e); } };
    addEventListener('keydown', kd);
    let raf = 0;
    const loop = (now) => {
      const i = hitTimes.findIndex((t, j) => !used.has(j) && now < t + WINDOW + 10);
      const nextEnd = hitTimes[i];
      if (i >= 0) {
        const p = Math.min(1, Math.max(0, (now - (nextEnd - SHRINK)) / SHRINK));
        ring.style.transform = `translate(-50%, -50%) scale(${2.1 - p * 1.1})`;
        ring.style.opacity = now < nextEnd - SHRINK ? 0 : 1;
      }
      hitTimes.forEach((t, j) => { if (!used.has(j) && now > t + WINDOW) judge(j, false); });
      const total = hitTimes[BEATS - 1] + WINDOW - (t0 - 500);
      bar.style.width = `${Math.max(0, 1 - (now - (t0 - 500)) / total) * 100}%`;
      if (!document.body.contains(stage)) return;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener('keydown', kd); });
  }

  return { run };
})();
