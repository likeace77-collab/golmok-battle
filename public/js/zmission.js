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
    const LIMIT = 6000, t0 = performance.now();
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
    let sx = 0, sy = 0, down = false;
    const pd = (e) => { if (e.target.closest('button')) return; down = true; sx = e.clientX; sy = e.clientY; };
    const pu = (e) => {
      if (!down) return; down = false;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      input(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    };
    const kd = (e) => { if (KEYS[e.key]) { e.preventDefault(); input(KEYS[e.key]); } };
    const box = stage.closest('.zm');
    box.addEventListener('pointerdown', pd); box.addEventListener('pointerup', pu); addEventListener('keydown', kd);
    stage.querySelectorAll('[data-dir]').forEach((b) => { b.onclick = () => input(b.dataset.dir); });
    const timer = setInterval(() => {
      const p = (performance.now() - t0) / LIMIT;
      bar.style.width = `${Math.max(0, 1 - p) * 100}%`;
      if (p >= 1) finish(false);
    }, 50);
    cleanups.push(() => { clearInterval(timer); box.removeEventListener('pointerdown', pd); box.removeEventListener('pointerup', pu); removeEventListener('keydown', kd); });
  }

  // 줄어드는 고리가 가운데 원에 겹칠 때 눌러라. 4번 중 3번 성공
  function rhythm(stage, bar, finish, cleanups) {
    const BEATS = 4, GAP = 1050, SHRINK = 900, WINDOW = 150;
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
    const tap = () => {
      const now = performance.now();
      const i = hitTimes.findIndex((t, j) => !used.has(j) && Math.abs(now - t) < GAP / 2);
      if (i >= 0) judge(i, Math.abs(now - hitTimes[i]) <= WINDOW);
    };
    drum.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
    const kd = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); } };
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
