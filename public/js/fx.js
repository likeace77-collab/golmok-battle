// 스킬 연출. 전투 장면 위 캔버스에 그리고, 골목몬에게는 동작 클래스를 붙입니다.
const Fx = (() => {
  const INK = '#1a1433';
  const SPEED = Number(new URLSearchParams(location.search).get('speed') ?? 1);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scene, cv, ctx, W = 1, H = 1, u = 1, raf = 0, items = [], OFF = 0, UNDER = false; // OFF: 전용기 컷인 동안 본 연출을 미루는 시간

  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, p) => a + (b - a) * p;
  const out = (p) => 1 - (1 - p) ** 2;
  const fade = (p, tail = .3) => (p > 1 - tail ? (1 - p) / tail : 1);

  function attach(sceneEl, canvas) { scene = sceneEl; cv = canvas; ctx = cv.getContext('2d'); measure(); }

  function measure() {
    const r = scene.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(r.width * dpr)) {
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
    }
    W = r.width; H = r.height; u = W / 400;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spot(key) {
    const s = scene.getBoundingClientRect();
    const m = document.getElementById(`m-${key}`).getBoundingClientRect();
    const size = m.width || W * .35;
    const x = m.left - s.left + size / 2, y = m.top - s.top + size / 2;
    return { x, y, r: size / 2, foot: y + size * .42 };
  }

  function add(dur, draw, delay = 0) {
    const it = { t0: performance.now() + (delay + OFF) * SPEED, dur: dur * SPEED, draw };
    if (UNDER) items.unshift(it); else items.push(it); // UNDER: 다른 그림 밑에 깔기
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function loop(now) {
    ctx.clearRect(0, 0, W, H);
    items = items.filter((it) => {
      const p = (now - it.t0) / it.dur;
      if (p < 0) return true;
      if (p >= 1) return false;
      ctx.save();
      it.draw(p);
      ctx.restore();
      return true;
    });
    raf = items.length ? requestAnimationFrame(loop) : 0;
    if (!raf) ctx.clearRect(0, 0, W, H);
  }

  /* ---------- 작은 그림 ---------- */
  const line = (w = 1.2) => { ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; };
  const paint = (fill, w) => { ctx.fillStyle = fill; ctx.fill(); line(w); ctx.stroke(); };
  const blob = (fill) => { ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); paint(fill); };
  const teardrop = (fill) => {
    ctx.beginPath(); ctx.moveTo(0, -11); ctx.bezierCurveTo(9, -1, 8, 8, 0, 8); ctx.bezierCurveTo(-8, 8, -9, -1, 0, -11); paint(fill);
  };
  const star = (fill, n = 4, inner = .3) => {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = (i * Math.PI) / n, r = i % 2 ? 10 * inner : 10;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); paint(fill, .9);
  };
  const SPRITE = {
    flame() { teardrop('#F2622E'); ctx.scale(.5, .5); ctx.translate(0, 3); teardrop('#FFD23F'); },
    wisp() { teardrop('#4B6BFF'); ctx.scale(.5, .5); ctx.translate(0, 3); teardrop('#BFE4FF'); },
    drop() { teardrop('#2F7DE1'); },
    broth() { teardrop('#D9301F'); },
    honey() { blob('#E7A020'); },
    mustard() { blob('#7A4A2A'); },
    glob() { blob('#9A4FB8'); },
    bubble() { ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fillStyle = '#C993DD'; ctx.fill(); line(); ctx.stroke(); ctx.beginPath(); ctx.arc(-3, -3, 2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); },
    leaf() { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(0, -9, 11, 0); ctx.quadraticCurveTo(0, 9, -11, 0); paint('#3FA34D'); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke(); },
    shard() { ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, 0); ctx.lineTo(0, 12); ctx.lineTo(-5, 0); ctx.closePath(); paint('#BCE9F2'); },
    snow() { star('#fff', 6, .4); },
    rock() { ctx.beginPath(); [[-9, -3], [-3, -9], [6, -8], [10, 1], [4, 9], [-7, 7]].forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); paint('#8c8b84'); },
    dirt() { ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); paint('#A9713A'); },
    dust() { ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fillStyle = '#D9B66A'; ctx.fill(); },
    tack() {
      ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(0, 10); ctx.lineTo(2, 1); ctx.closePath(); paint('#C7CDD6', .8);
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 3.5, 0, 0, 7); paint('#F2B705', .9);
    },
    spark() { star('#FFE45C', 4, .28); },
    sparkle() { star('#fff', 4, .22); },
    petal() { ctx.beginPath(); ctx.ellipse(0, 0, 8, 4, 0, 0, 7); paint('#FFD23F', .9); },
    spore() { ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); paint('#D7F2B4', .8); },
    seed() { ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 7, 0, 0, 7); paint('#8B5A2B'); },
    coin() { ctx.beginPath(); ctx.ellipse(0, 0, 8, 8, 0, 0, 7); paint('#FFD23F'); ctx.beginPath(); ctx.rect(-2.5, -2.5, 5, 5); ctx.stroke(); },
    scrap() { ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(0, -9); ctx.lineTo(9, 3); ctx.closePath(); paint('#AEB7C2'); },
    needle() { ctx.beginPath(); ctx.moveTo(-14, -2); ctx.lineTo(14, 0); ctx.lineTo(-14, 2); ctx.closePath(); paint('#9A4FB8', .9); },
    crescent() { ctx.beginPath(); ctx.arc(0, 0, 14, -1.3, 1.3); ctx.arc(-9, 0, 15, .95, -.95, true); ctx.closePath(); paint('#E6FFF4', 1); },
    hair() { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.bezierCurveTo(-6, -9, -2, 9, 3, 0); ctx.bezierCurveTo(6, -6, 9, 5, 12, -2); ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.stroke(); },
    z() { ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.strokeText('Z', 0, 0); ctx.fillStyle = '#fff'; ctx.fillText('Z', 0, 0); },
    arrowUp() { ctx.beginPath(); [[0, -11], [9, 0], [3.5, 0], [3.5, 10], [-3.5, 10], [-3.5, 0], [-9, 0]].forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); paint('#E8402C'); },
    arrowDown() { ctx.rotate(Math.PI); ctx.beginPath(); [[0, -11], [9, 0], [3.5, 0], [3.5, 10], [-3.5, 10], [-3.5, 0], [-9, 0]].forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); paint('#2F7DE1'); },
    plate() { ctx.beginPath(); ctx.rect(-10, -7, 20, 14); paint('#D7DDE5'); ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(0, -3); ctx.strokeStyle = '#fff'; ctx.stroke(); },
    brick() { ctx.beginPath(); ctx.rect(-12, -6, 24, 12); paint('#B5502F'); },
    heart() { ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-13, -2, -6, -11, 0, -4); ctx.bezierCurveTo(6, -11, 13, -2, 0, 8); paint('#7BE08A', .9); },
    /* 큰 소품 */
    hammer() { ctx.fillStyle = '#8B5A2B'; ctx.beginPath(); ctx.rect(-2.5, -2, 5, 20); paint('#8B5A2B'); ctx.beginPath(); ctx.rect(-11, -11, 22, 11); paint('#7C8798'); },
    bucket() { ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(10, -8); ctx.lineTo(7, 10); ctx.lineTo(-7, 10); ctx.closePath(); paint('#AEB7C2'); ctx.beginPath(); ctx.arc(0, -8, 10, Math.PI, 0); ctx.stroke(); },
    club() { ctx.beginPath(); ctx.moveTo(-3, 16); ctx.lineTo(3, 16); ctx.lineTo(8, -12); ctx.quadraticCurveTo(0, -18, -8, -12); ctx.closePath(); paint('#8B5A2B'); [[-3, -8], [3, -4], [-1, 2]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fillStyle = '#FFD23F'; ctx.fill(); ctx.stroke(); }); },
    lid() { ctx.beginPath(); ctx.ellipse(0, 0, 13, 13, 0, 0, 7); paint('#6e7380'); ctx.beginPath(); ctx.ellipse(0, 0, 8, 8, 0, 0, 7); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke(); },
    magnet() { ctx.beginPath(); ctx.arc(0, -2, 10, Math.PI, 0); ctx.lineTo(10, 10); ctx.lineTo(4, 10); ctx.lineTo(4, -2); ctx.arc(0, -2, 4, 0, Math.PI, true); ctx.lineTo(-4, 10); ctx.lineTo(-10, 10); ctx.closePath(); paint('#E8402C'); },
    plunger() { ctx.beginPath(); ctx.rect(-2, -16, 4, 18); paint('#C9924F'); ctx.beginPath(); ctx.moveTo(-11, 12); ctx.quadraticCurveTo(-10, 0, 0, 0); ctx.quadraticCurveTo(10, 0, 11, 12); ctx.closePath(); paint('#D52C2C'); },
    teeth() { ctx.beginPath(); [[-12, -6], [-8, 3], [-4, -6], [0, 3], [4, -6], [8, 3], [12, -6]].forEach(([x, y]) => ctx.lineTo(x, y)); ctx.closePath(); paint('#fff'); },
    fist() { ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); paint('#FFD23F'); ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-3, -2); ctx.moveTo(3, -9); ctx.lineTo(3, -2); ctx.stroke(); },
    pheart() { ctx.beginPath(); ctx.moveTo(0, 8); ctx.bezierCurveTo(-13, -2, -6, -11, 0, -4); ctx.bezierCurveTo(6, -11, 13, -2, 0, 8); paint('#F27FA5', .9); },
    lips() { ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-5, -7, 0, -3); ctx.quadraticCurveTo(5, -7, 11, 0); ctx.quadraticCurveTo(0, 9, -11, 0); paint('#E0123E'); },
    bag() { ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(-13, -14); ctx.lineTo(-6, -8); ctx.quadraticCurveTo(0, -5, 6, -8); ctx.lineTo(13, -14); ctx.lineTo(11, -6); ctx.quadraticCurveTo(15, 12, 0, 13); ctx.quadraticCurveTo(-15, 12, -11, -6); paint('#2f2b38'); },
    can() { ctx.beginPath(); ctx.rect(-8, -11, 16, 22); paint('#AEB7C2'); ctx.beginPath(); ctx.rect(-8, -3, 16, 8); paint('#E8402C', .9); },
    redbean() { ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, .3, 0, 7); paint('#6a1a24', 1.4); ctx.beginPath(); ctx.ellipse(-2, -1.5, 2, 1, .3, 0, 7); ctx.fillStyle = '#c45a66'; ctx.fill(); },
    bean() { ctx.beginPath(); ctx.moveTo(0, 12); ctx.quadraticCurveTo(-3, 0, 3, -6); ctx.strokeStyle = '#E9E2B5'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.ellipse(4, -8, 5, 3.5, .4, 0, 7); paint('#F2D64B', .9); },
    bread() { ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, 7); paint('#E7A84B'); ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(19, -6); ctx.lineTo(19, 6); ctx.closePath(); paint('#D9903A'); },
    paddle() { ctx.beginPath(); ctx.rect(-2, 2, 4, 16); paint('#A9713A'); ctx.beginPath(); ctx.rect(-6, -16, 12, 18); paint('#C9924F'); },
    slime() { ctx.beginPath(); ctx.moveTo(-10, 6); ctx.quadraticCurveTo(-11, -9, 0, -9); ctx.quadraticCurveTo(11, -9, 10, 6); ctx.quadraticCurveTo(0, 10, -10, 6); paint('#6be3a4'); ctx.beginPath(); ctx.arc(-4, -4, 2, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); },
    page() { ctx.beginPath(); ctx.rect(-8, -10, 16, 20); paint('#fff6de'); ctx.beginPath(); ctx.moveTo(-5, -5); ctx.lineTo(5, -5); ctx.moveTo(-5, 0); ctx.lineTo(4, 0); ctx.moveTo(-5, 5); ctx.lineTo(3, 5); ctx.strokeStyle = '#c9603a'; ctx.lineWidth = 1; ctx.stroke(); },
    sword() { ctx.beginPath(); ctx.moveTo(-2.5, -16); ctx.lineTo(0, -20); ctx.lineTo(2.5, -16); ctx.lineTo(2.5, 10); ctx.lineTo(-2.5, 10); ctx.closePath(); paint('#eaf6ff'); ctx.beginPath(); ctx.rect(-8, 10, 16, 3.4); paint('#FFD23F'); ctx.beginPath(); ctx.rect(-1.8, 13, 3.6, 7); paint('#3d7bff'); },
    feather() { ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(0, -8, 12, -2); ctx.quadraticCurveTo(0, 6, -12, 2); paint('#d4d8e2', .9); ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(10, -1); ctx.stroke(); },
    vinyl() { ctx.globalAlpha *= .85; ctx.beginPath(); ctx.moveTo(-11, -6); ctx.lineTo(-13, -14); ctx.lineTo(-6, -8); ctx.quadraticCurveTo(0, -5, 6, -8); ctx.lineTo(13, -14); ctx.lineTo(11, -6); ctx.quadraticCurveTo(15, 12, 0, 13); ctx.quadraticCurveTo(-15, 12, -11, -6); paint('#f4f6fb'); },
  };

  function sprite(kind, x, y, size, rot = 0, alpha = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale((size * u) / 10, (size * u) / 10);
    ctx.globalAlpha = alpha;
    SPRITE[kind]();
    ctx.restore();
  }

  /* ---------- 기본 동작 ---------- */
  function act(key, name, ms) {
    if (OFF) { const o = OFF; OFF = 0; setTimeout(() => act(key, name, ms), o * SPEED); OFF = o; return; }
    const el = document.getElementById(`m-${key}`);
    if (!el) return;
    el.style.setProperty('--d', `${ms * SPEED}ms`);
    el.classList.remove('lunge', 'hit', 'enter');
    [...el.classList].filter((c) => c.startsWith('act-')).forEach((c) => el.classList.remove(c));
    void el.offsetWidth;
    el.classList.add(`act-${name}`);
    setTimeout(() => el.classList.remove(`act-${name}`), ms * SPEED);
  }
  function tint(key, name, ms, delay = 0) {
    delay += OFF;
    setTimeout(() => {
      const el = document.getElementById(`m-${key}`);
      if (!el) return;
      el.style.setProperty('--t', `${ms * SPEED}ms`);
      el.classList.add(`tint-${name}`);
      setTimeout(() => el.classList.remove(`tint-${name}`), ms * SPEED);
    }, delay * SPEED);
  }
  function shake(mag, dur, delay = 0) {
    add(dur, (p) => {
      const m = mag * u * (1 - p);
      scene.style.transform = p > .96 ? '' : `translate(${rnd(-m, m)}px,${rnd(-m, m)}px)`;
    }, delay);
    setTimeout(() => { scene.style.transform = ''; }, (dur + delay + OFF + 60) * SPEED);
  }
  const flash = (color, dur, delay = 0, a = .55) => add(dur, (p) => { ctx.globalAlpha = a * (1 - p); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }, delay);

  // from에서 to로 물체를 날립니다. arc는 포물선 높이.
  function spray(kind, from, to, { n = 8, dur = 420, gap = 50, size = 9, spread = 14, arc = 0, spin = 0, delay = 0, grow = 0, aim = false } = {}) {
    for (let i = 0; i < n; i++) {
      const ox = rnd(-spread, spread) * u, oy = rnd(-spread, spread) * u, r0 = rnd(0, 6), sp = rnd(.6, 1) * spin * (Math.random() < .5 ? -1 : 1);
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      add(dur, (p) => {
        const e = out(p);
        const x = lerp(from.x, to.x + ox, e), y = lerp(from.y, to.y + oy, e) - Math.sin(p * Math.PI) * arc * u;
        sprite(kind, x, y, size * (1 + grow * p), aim ? angle : spin ? r0 + sp * p : 0, fade(p, .15));
      }, delay + i * gap);
    }
    return delay + n * gap + dur;
  }
  function burst(kind, at, { n = 10, dist = 60, dur = 450, size = 8, delay = 0, spin = 3 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), d = rnd(.5, 1) * dist * u, r0 = rnd(0, 6);
      add(dur, (p) => {
        const e = out(p);
        sprite(kind, at.x + Math.cos(a) * d * e, at.y + Math.sin(a) * d * e + p * p * 14 * u, size * (1 - p * .4), r0 + spin * p, fade(p));
      }, delay + rnd(0, 60));
    }
    return delay + dur + 60;
  }
  function rise(kind, at, { n = 8, dur = 800, size = 8, spread = 40, height = 70, delay = 0, gap = 70 } = {}) {
    for (let i = 0; i < n; i++) {
      const ox = rnd(-spread, spread) * u, sway = rnd(-10, 10) * u;
      add(dur, (p) => sprite(kind, at.x + ox + Math.sin(p * 6) * sway, at.y + 20 * u - height * u * p, size, 0, fade(p, .4)), delay + i * gap);
    }
    return delay + n * gap + dur;
  }
  function fall(kind, at, { n = 10, dur = 450, size = 9, spread = 40, height = 180, delay = 0, gap = 60, rot = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const ox = rnd(-spread, spread) * u;
      add(dur, (p) => sprite(kind, at.x + ox, at.y - height * u * (1 - p * p), size, rot, fade(p, .12)), delay + i * gap);
    }
    return delay + n * gap + dur;
  }
  function orbit(kind, at, { n = 8, r = 50, dur = 900, size = 8, delay = 0, turns = 1.5, rising = 0, squash = .4 } = {}) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.28;
      add(dur, (p) => {
        const a = a0 + p * turns * 6.28;
        sprite(kind, at.x + Math.cos(a) * r * u * (1 - p * .15), at.y + Math.sin(a) * r * u * squash - rising * u * p, size, a, fade(p));
      }, delay);
    }
    return delay + dur;
  }
  function ring(at, { color = '#fff', r0 = 10, r1 = 80, dur = 450, w = 4, delay = 0, squash = 1 } = {}) {
    add(dur, (p) => {
      ctx.globalAlpha = 1 - p; ctx.strokeStyle = color; ctx.lineWidth = w * u * (1 - p * .7);
      ctx.beginPath(); ctx.ellipse(at.x, at.y, lerp(r0, r1, out(p)) * u, lerp(r0, r1, out(p)) * u * squash, 0, 0, 7); ctx.stroke();
    }, delay);
    return delay + dur;
  }
  function cloud(at, colors, { n = 12, dur = 1000, size = 24, spread = 50, delay = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const ox = rnd(-spread, spread) * u, oy = rnd(-spread * .6, spread * .6) * u, c = colors[i % colors.length];
      add(dur, (p) => {
        ctx.globalAlpha = .75 * Math.sin(Math.min(1, p * 1.2) * Math.PI) ** .6;
        ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(at.x + ox, at.y + oy - p * 12 * u, size * u * (.5 + p * .7), 0, 7); ctx.fill();
      }, delay + i * 35);
    }
    return delay + n * 35 + dur;
  }
  function beam(a, b, { color = '#7fc8e8', core = '#fff', w = 16, dur = 600, delay = 0 } = {}) {
    add(dur, (p) => {
      const on = Math.min(1, p * 5), wid = w * u * Math.sin(Math.min(1, p * 1.15) * Math.PI) ** .5 * (1 + Math.sin(p * 40) * .12);
      const x = lerp(a.x, b.x, on), y = lerp(a.y, b.y, on);
      ctx.lineCap = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = wid + 3 * u; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = wid; ctx.stroke();
      ctx.strokeStyle = core; ctx.lineWidth = wid * .35; ctx.stroke();
    }, delay);
    return delay + dur;
  }
  function jag(a, b, wob) {
    const n = 7, pts = [[a.x, a.y]];
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push([lerp(a.x, b.x, t) + rnd(-wob, wob) * u, lerp(a.y, b.y, t) + rnd(-wob, wob) * u]);
    }
    pts.push([b.x, b.y]);
    return pts;
  }
  // 번개: 프레임마다 모양이 바뀌어 지지직거립니다.
  function bolt(a, b, { dur = 600, w = 4, wob = 16, color = '#FFE45C', delay = 0, flick = 3 } = {}) {
    let pts = jag(a, b, wob), last = -1;
    add(dur, (p) => {
      const step = Math.floor(p * dur * SPEED / (28 * flick));
      if (step !== last) { pts = jag(a, b, wob); last = step; }
      if (step % 4 === 3) return;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      const path = () => { ctx.beginPath(); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.stroke(); };
      ctx.strokeStyle = INK; ctx.lineWidth = (w + 3) * u; path();
      ctx.strokeStyle = color; ctx.lineWidth = w * u; path();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = w * .35 * u; path();
    }, delay);
    return delay + dur;
  }
  function whip(a, b, { color = '#3FA34D', dur = 420, delay = 0, curve = 70, w = 6 } = {}) {
    add(dur, (p) => {
      const c = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - curve * u * (1 - p * 2) };
      const reach = Math.min(1, p * 2.2);
      ctx.lineCap = 'round';
      const path = () => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, lerp(a.x, b.x, reach), lerp(a.y, b.y, reach)); ctx.stroke(); };
      ctx.globalAlpha = fade(p, .25);
      ctx.strokeStyle = INK; ctx.lineWidth = (w + 3) * u; path();
      ctx.strokeStyle = color; ctx.lineWidth = w * u; path();
    }, delay);
    return delay + dur;
  }
  function slash(at, { angle = -.8, len = 90, color = '#fff', dur = 260, delay = 0, w = 7 } = {}) {
    add(dur, (p) => {
      const dx = Math.cos(angle) * len * u, dy = Math.sin(angle) * len * u, h = Math.min(1, p * 2), t = Math.max(0, p * 2 - 1);
      ctx.lineCap = 'round';
      const path = () => { ctx.beginPath(); ctx.moveTo(at.x - dx * (.5 - t), at.y - dy * (.5 - t)); ctx.lineTo(at.x - dx * (.5 - h), at.y - dy * (.5 - h)); ctx.stroke(); };
      ctx.strokeStyle = INK; ctx.lineWidth = (w + 3) * u; path();
      ctx.strokeStyle = color; ctx.lineWidth = w * u; path();
    }, delay);
    return delay + dur;
  }
  // 커다란 소품을 움직입니다.
  function prop(kind, { from, to, dur = 500, size = 40, rot0 = 0, rot1 = 0, delay = 0, hold = 0 } = {}) {
    add(dur + hold, (p) => {
      const q = Math.min(1, p * (dur + hold) / dur), e = q * q;
      sprite(kind, lerp(from.x, to.x, e), lerp(from.y, to.y, e), size, lerp(rot0, rot1, e), fade(p, .15));
    }, delay);
    return delay + dur;
  }
  function tornado(at, { dur = 1000, kind = 'dust', color = '#CFEDE1', delay = 0 } = {}) {
    add(dur, (p) => {
      const b = at.foot, top = at.y - 70 * u;
      ctx.globalAlpha = fade(p, .25);
      for (let i = 0; i < 9; i++) {
        const t = i / 8, y = lerp(b, top, t), rx = lerp(8, 56, t) * u, ph = p * 26 + i;
        ctx.strokeStyle = INK; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.ellipse(at.x + Math.sin(ph) * 6 * u, y, rx, rx * .28, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = 3 * u; ctx.stroke();
      }
    }, delay);
    return delay + dur;
  }
  function windLines(a, b, { n = 7, dur = 340, delay = 0, gap = 50, spread = 34, color = '#E6FFF4', len = .35 } = {}) {
    for (let i = 0; i < n; i++) {
      const o = rnd(-spread, spread) * u;
      add(dur, (p) => {
        const t0 = Math.max(0, p * 1.4 - len), t1 = Math.min(1, p * 1.4);
        ctx.lineCap = 'round';
        const pt = (t) => [lerp(a.x, b.x, t), lerp(a.y, b.y, t) + o + Math.sin(t * 6) * 6 * u];
        const path = () => { ctx.beginPath(); ctx.moveTo(...pt(t0)); ctx.lineTo(...pt(t1)); ctx.stroke(); };
        ctx.strokeStyle = INK; ctx.lineWidth = 5 * u; path();
        ctx.strokeStyle = color; ctx.lineWidth = 2.5 * u; path();
      }, delay + i * gap);
    }
    return delay + n * gap + dur;
  }
  function cracks(at, { delay = 0, dur = 900 } = {}) {
    const rays = Array.from({ length: 7 }, () => { const a = rnd(0, 6.28); return [Math.cos(a), Math.sin(a) * .35, rnd(50, 110)]; });
    add(dur, (p) => {
      ctx.globalAlpha = fade(p, .3); ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.lineJoin = 'round';
      rays.forEach(([dx, dy, l]) => {
        const len = l * u * Math.min(1, p * 5);
        ctx.beginPath(); ctx.moveTo(at.x, at.foot); ctx.lineTo(at.x + dx * len * .5 + 6 * u, at.foot + dy * len * .5); ctx.lineTo(at.x + dx * len, at.foot + dy * len); ctx.stroke();
      });
    }, delay);
  }


  /* ---------- 화려한 연출용 도구 ---------- */
  const TYPE_C = { fire: '#FF6A2B', water: '#3A9BFF', grass: '#4CD964', elec: '#FFE45C', ice: '#8FEFFF', earth: '#D9A066', wind: '#9FF5D8', poison: '#C77DFF', steel: '#E3E8EF', spirit: '#8C7CFF', fairy: '#FF8CCB', normal: '#F5EBD0', none: '#ffffff' };
  const TYPE_P = { fire: 'flame', water: 'drop', grass: 'leaf', elec: 'spark', ice: 'shard', earth: 'rock', wind: 'crescent', poison: 'glob', steel: 'scrap', spirit: 'wisp', fairy: 'sparkle', normal: 'sparkle', none: 'sparkle' };
  const CLEAR = 'rgba(0,0,0,0)';
  const later = (fn, ms) => { const o = OFF; setTimeout(fn, (ms + o) * SPEED); };
  // 빛 번짐 (더하기 합성)
  function glow(at, color, { r = 90, dur = 400, delay = 0, a = .9, grow = .3 } = {}) {
    add(dur, (p) => {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a * Math.sin(Math.min(1, p) * Math.PI);
      const R = r * u * (1 + grow * p);
      const g = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, R);
      g.addColorStop(0, '#fff'); g.addColorStop(.25, color); g.addColorStop(1, CLEAR);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at.x, at.y, R, 0, 7); ctx.fill();
    }, delay);
    return delay + dur;
  }
  // 만화식 집중선
  function speedLines(T, { color = '#fff', dur = 380, delay = 0, n = 28, inner = 70 } = {}) {
    const rays = Array.from({ length: n }, () => [rnd(0, 6.283), rnd(.6, 1.3), rnd(1.5, 4.5)]);
    add(dur, (p) => {
      ctx.globalAlpha = .8 * fade(p, .5); ctx.strokeStyle = color; ctx.lineCap = 'round';
      const R = Math.hypot(W, H);
      rays.forEach(([a, k, w]) => {
        const r0 = (inner + 50 * (1 - p)) * u * k;
        ctx.lineWidth = w * u;
        ctx.beginPath(); ctx.moveTo(T.x + Math.cos(a) * r0, T.y + Math.sin(a) * r0); ctx.lineTo(T.x + Math.cos(a) * R, T.y + Math.sin(a) * R); ctx.stroke();
      });
    }, delay);
    return delay + dur;
  }
  // 터지는 별 모양
  function starburst(at, { color = '#fff', r = 70, dur = 260, delay = 0, n = 12 } = {}) {
    const ks = Array.from({ length: n * 2 }, (_, i) => (i % 2 ? rnd(.32, .48) : rnd(.85, 1.2)));
    add(dur, (p) => {
      const R = r * u * out(Math.min(1, p * 1.6));
      ctx.globalAlpha = fade(p, .45);
      ctx.beginPath();
      ks.forEach((k, i) => { const a = (i / ks.length) * 6.283; ctx.lineTo(at.x + Math.cos(a) * R * k, at.y + Math.sin(a) * R * k); });
      ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3 * u; ctx.lineJoin = 'round'; ctx.stroke();
    }, delay);
    return delay + dur;
  }
  // 맞는 순간: 별, 빛, 고리, 파편
  function impact(T, color, { delay = 0, big = 1, kind = 'sparkle' } = {}) {
    starburst(T, { color: '#fff', r: 64 * big, dur: 230, delay });
    starburst(T, { color, r: 42 * big, dur: 210, delay: delay + 30 });
    glow(T, color, { r: 120 * big, dur: 380, delay });
    ring(T, { color: '#fff', r0: 16, r1: 130 * big, dur: 380, w: 6, delay });
    ring(T, { color, r0: 10, r1: 96 * big, dur: 440, w: 4, delay: delay + 60 });
    burst(kind, T, { delay, n: Math.round(12 * big), dist: 90 * big, size: 9, dur: 520 });
    shake(5 * big, 240, delay);
  }
  // 하늘에서 내려오는 빛기둥
  function pillar(at, color, { w = 56, dur = 700, delay = 0, top = -10 } = {}) {
    add(dur, (p) => {
      const k = Math.sin(Math.min(1, p) * Math.PI) ** .6, ww = w * u * k * (1 + Math.sin(p * 50) * .06);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(at.x - ww, 0, at.x + ww, 0);
      g.addColorStop(0, CLEAR); g.addColorStop(.28, color); g.addColorStop(.5, '#fff'); g.addColorStop(.72, color); g.addColorStop(1, CLEAR);
      ctx.globalAlpha = .9; ctx.fillStyle = g; ctx.fillRect(at.x - ww, top, ww * 2, at.foot - top);
    }, delay);
    ring(ground(at), { color, r0: 10, r1: 120, squash: .3, dur: dur * .6, delay, w: 7 });
    return delay + dur;
  }
  // 땅을 따라 퍼지는 충격파
  function shockwave(at, color = '#fff', { delay = 0, r = 170 } = {}) {
    ring(ground(at), { color: INK, r0: 10, r1: r, squash: .28, dur: 520, w: 14, delay });
    ring(ground(at), { color, r0: 10, r1: r, squash: .28, dur: 520, w: 8, delay });
    burst('dust', ground(at), { delay, n: 14, dist: r * .7, size: 12 });
    return delay + 520;
  }
  const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
  // 세운 마법진 (빙글 돌며 열림). squash로 비스듬히 보이게.
  function magicCircle(at, { color = '#FF6A2B', glow: gc = '#FFD23F', r = 70, dur = 1000, delay = 0, spin = 1.2, squash = .5, star = 6, tilt = 0 } = {}) {
    add(dur, (p) => {
      const R = r * u * out(Math.min(1, p * 3.2));
      ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(tilt); ctx.scale(squash, 1);
      ctx.globalAlpha = fade(p, .2);
      ctx.shadowColor = color; ctx.shadowBlur = 18 * u;
      ctx.strokeStyle = color; ctx.lineWidth = 5 * u;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
      ctx.lineWidth = 2 * u;
      ctx.beginPath(); ctx.arc(0, 0, R * .8, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * .3, 0, 7); ctx.stroke();
      ctx.save(); ctx.rotate(p * spin * 6.283);
      ctx.strokeStyle = gc; ctx.lineWidth = 2.6 * u; ctx.beginPath();
      const v = (i) => [Math.cos((i / star) * 6.283) * R * .8, Math.sin((i / star) * 6.283) * R * .8];
      for (let i = 0; i < star; i++) { ctx.moveTo(...v(i)); ctx.lineTo(...v(i + 2)); }
      ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.rotate(-p * spin * 4);
      ctx.font = `${11 * u}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = gc;
      for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate((i / 16) * 6.283); ctx.fillText(RUNES[i % RUNES.length], 0, -R * .9); ctx.restore(); }
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 0;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .55); g.addColorStop(0, '#fff'); g.addColorStop(.5, color); g.addColorStop(1, CLEAR);
      ctx.globalAlpha = .55 * fade(p, .2) * (.7 + Math.sin(p * 30) * .3); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * .55, 0, 7); ctx.fill();
      ctx.restore();
    }, delay);
    return delay + dur;
  }
  // 빛나는 구슬이 꼬리를 끌며 날아감
  function comet(a, b, { color = '#fff', size = 14, dur = 360, delay = 0, arc = 0, trail = 9 } = {}) {
    add(dur, (p) => {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = trail; i >= 0; i--) {
        const q = Math.max(0, out(p) - i * .035);
        const x = lerp(a.x, b.x, q), y = lerp(a.y, b.y, q) - Math.sin(q * Math.PI) * arc * u;
        const r = size * u * (1 - i / (trail + 1)) * 1.7;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, '#fff'); g.addColorStop(.4, color); g.addColorStop(1, CLEAR);
        ctx.globalAlpha = (1 - i / (trail + 1)) * fade(p, .08);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      }
    }, delay);
    return delay + dur;
  }
  // 빛나는 광선
  function laser(a, b, { color = '#fff', w = 22, dur = 520, delay = 0 } = {}) {
    add(dur, (p) => {
      const on = Math.min(1, p * 6), k = Math.sin(Math.min(1, p * 1.1) * Math.PI) ** .4, ww = w * u * k * (1 + Math.sin(p * 60) * .1);
      const x = lerp(a.x, b.x, on), y = lerp(a.y, b.y, on);
      ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      [[ww * 2.4, .22, color], [ww, .85, color], [ww * .38, 1, '#fff']].forEach(([lw, al, c]) => { ctx.globalAlpha = al; ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(x, y); ctx.stroke(); });
    }, delay);
    glow(b, color, { r: w * 4, dur, delay: delay + dur * .15 });
    return delay + dur;
  }
  // 만화 효과음 글자
  function bang(at, str, { color = '#FFD23F', size = 30, dur = 720, delay = 0, rot = -.14 } = {}) {
    add(dur, (p) => {
      const s = p < .18 ? out(p / .18) * 1.3 : 1.3 - .3 * Math.min(1, (p - .18) / .2);
      ctx.save(); ctx.translate(at.x, at.y - 12 * u * p); ctx.rotate(rot); ctx.scale(s, s);
      ctx.globalAlpha = fade(p, .25);
      ctx.font = `${size * u}px 'Black Han Sans', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 8 * u; ctx.strokeStyle = INK; ctx.strokeText(str, 0, 0);
      ctx.lineWidth = 3 * u; ctx.strokeStyle = '#fff'; ctx.strokeText(str, 0, 0);
      ctx.fillStyle = color; ctx.fillText(str, 0, 0);
      ctx.restore();
    }, delay);
    return delay + dur;
  }
  // 임팩트 프레임 (검은 화면 → 흰 화면)
  const frame = (delay = 0) => { flash('#05060c', 80, delay, .85); flash('#ffffff', 130, delay + 80, .8); };
  // 빛 알갱이가 소용돌이치며 모여듦
  function gather(at, color, { n = 20, r = 130, dur = 520, delay = 0 } = {}) {
    for (let i = 0; i < n; i++) {
      const a0 = rnd(0, 6.283), rr = rnd(.6, 1) * r * u, d = rnd(0, dur * .4);
      add(dur * .6, (p) => {
        const q = out(p), a = a0 + q * 2.4, R = rr * (1 - q);
        const x = at.x + Math.cos(a) * R, y = at.y + Math.sin(a) * R;
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .4 + q * .6;
        ctx.strokeStyle = color; ctx.lineWidth = 3 * u; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(at.x + Math.cos(a - .35) * (R + 18 * u), at.y + Math.sin(a - .35) * (R + 18 * u)); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 2.4 * u, 0, 7); ctx.fill();
      }, delay + d);
    }
    glow(at, color, { r: 70, dur, delay, a: .7 });
    return delay + dur;
  }
  // 빛나는 초승달 베기
  function swoosh(at, { color = '#fff', r = 70, a0 = -2.4, a1 = .7, w = 14, dur = 280, delay = 0, flip = 1, tilt = 0 } = {}) {
    add(dur, (p) => {
      const h = out(Math.min(1, p * 1.7)), t = Math.max(0, (p - .35) / .65);
      const s = lerp(a0, a1, t), e = lerp(a0, a1, h);
      if (e - s < .01) return;
      ctx.save(); ctx.translate(at.x, at.y); ctx.rotate(tilt); ctx.scale(flip, 1);
      ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      [[w * 2.2, .28, color], [w, .9, color], [w * .35, 1, '#fff']].forEach(([lw, al, c]) => { ctx.globalAlpha = al * fade(p, .3); ctx.strokeStyle = c; ctx.lineWidth = lw * u; ctx.beginPath(); ctx.arc(0, 0, r * u, s, e); ctx.stroke(); });
      ctx.restore();
    }, delay);
    return delay + dur;
  }
  // 소리 파동이 날아감
  function soundWaves(A, T, { color = '#FFE45C', n = 6, gap = 90, dur = 520, delay = 0 } = {}) {
    const d = { a: Math.atan2(T.y - A.y, T.x - A.x) };
    for (let i = 0; i < n; i++) {
      add(dur, (p) => {
        const x = lerp(A.x, T.x, p), y = lerp(A.y, T.y, p), R = (20 + p * 40) * u;
        ctx.save(); ctx.translate(x, y); ctx.rotate(d.a);
        ctx.globalAlpha = fade(p, .3); ctx.lineCap = 'round';
        ctx.strokeStyle = INK; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.arc(0, 0, R, -1, 1); ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = 4.5 * u; ctx.stroke();
        ctx.restore();
      }, delay + i * gap);
    }
    return delay + (n - 1) * gap + dur;
  }
  // 이름이 화면을 가로지르는 컷인 (전용기)
  function cutIn(name, color, mine, { dur = 640, delay = 0 } = {}) {
    add(dur, (p) => {
      const inn = out(Math.min(1, p * 4)), go = Math.max(0, (p - .72) / .28) ** 2;
      const h = 50 * u, side = mine ? -1 : 1;
      ctx.save(); ctx.translate(W / 2 + side * W * (1 - inn) - side * W * go * 1.3, H * .48); ctx.rotate(-.1);
      ctx.fillStyle = INK; ctx.fillRect(-W, -h / 2 - 6 * u, W * 2, h + 12 * u);
      const g = ctx.createLinearGradient(-W * .6, 0, W * .6, 0); g.addColorStop(0, color); g.addColorStop(.5, '#fff8e0'); g.addColorStop(1, color);
      ctx.fillStyle = g; ctx.fillRect(-W, -h / 2, W * 2, h);
      ctx.globalAlpha = .3; ctx.fillStyle = INK;
      for (let i = 0; i < 9; i++) ctx.fillRect(-W + ((p * 1400 + i * 173) * u % (W * 2)), -h / 2 + (i + .5) * h / 9, 70 * u, 1.6 * u);
      ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.font = `${12 * u}px 'Do Hyeon', sans-serif`; ctx.fillStyle = INK; ctx.fillText('전용기', -W * .3, -h * .32);
      ctx.font = `${30 * u}px 'Black Han Sans', sans-serif`;
      ctx.lineWidth = 7 * u; ctx.strokeStyle = INK; ctx.strokeText(name, 0, 4 * u); ctx.fillStyle = '#fff'; ctx.fillText(name, 0, 4 * u);
      ctx.restore();
    }, delay);
    return delay + dur;
  }
  function sigIntro(A, key, name, color) {
    darken(820, .5);
    act(key, 'charge', 560);
    glow(A, color, { r: 120, dur: 640, a: .8 });
    ring(A, { color, r0: 150, r1: 12, dur: 380, w: 6 });
    ring(A, { color: '#fff', r0: 120, r1: 10, dur: 380, w: 3, delay: 140 });
    cutIn(name, color, /^(me|ally)/.test(key));
    return 560;
  }

  /* ---------- 스킬별 연출: 값은 총 재생 시간(ms) ---------- */
  const above = (p, h = 120) => ({ x: p.x, y: Math.max(52 * u, p.y - h * u), foot: p.foot, r: p.r });
  const ground = (p) => ({ x: p.x, y: p.foot, foot: p.foot, r: p.r });

  const MOVE_FX = {
    // 불
    ember: (A, T, k, t) => { act(k, 'cast', 420); spray('flame', A, T, { n: 6, gap: 70, arc: 24, size: 8 }); burst('flame', T, { delay: 500, n: 6, dist: 34 }); return 850; },
    flame: (A, T, k, t) => { act(k, 'cast', 800); spray('flame', A, T, { n: 24, gap: 26, dur: 340, size: 10, grow: .7, spread: 18 }); tint(t, 'burn', 600, 350); return 1050; },
    blaze(A, T, k, t) { act(k, 'charge', 620); orbit('flame', A, { n: 8, r: 46, dur: 520, size: 8 }); prop('flame', { from: above(A, 40), to: T, delay: 520, dur: 300, size: 50 }); ring(T, { color: '#F2622E', delay: 820, r1: 130, w: 9 }); ring(T, { color: '#FFD23F', delay: 900, r1: 100 }); burst('flame', T, { delay: 820, n: 22, dist: 110, size: 12 }); flash('#FFB52E', 420, 820); shake(10, 450, 820); tint(t, 'burn', 600, 820); return 1400; },
    coalhead(A, T, k, t) { orbit('flame', A, { n: 6, r: 40, dur: 340, size: 7 }); act(k, 'dash', 640); burst('flame', T, { delay: 320, n: 14, dist: 70, size: 10 }); ring(T, { color: '#F28A1E', delay: 320 }); return 900; },
    firerush(A, T, k, t) { act(k, 'dash', 720); spray('flame', A, T, { n: 16, gap: 18, dur: 300, size: 12, spread: 24 }); burst('flame', T, { delay: 340, n: 20, dist: 95, size: 12 }); flash('#F2622E', 280, 340, .4); shake(8, 300, 340); return 1050; },
    heatwave(A) { return weatherFx('sun'); },
    // 물
    squirt: (A, T, k) => { act(k, 'cast', 400); beam(A, T, { color: '#7fc8e8', w: 7, dur: 400 }); burst('drop', T, { delay: 240, n: 7, dist: 36, size: 6 }); return 760; },
    bucket(A, T, k) {
      act(k, 'throw', 420);
      const top = above(T, 92);
      prop('bucket', { from: above(T, 170), to: top, dur: 300, size: 34 });
      prop('bucket', { from: top, to: top, delay: 300, dur: 160, size: 34, rot0: 0, rot1: 2.4, hold: 300 });
      fall('drop', T, { delay: 420, n: 16, gap: 16, dur: 240, height: 88, spread: 26, size: 8 });
      burst('drop', ground(T), { delay: 640, n: 12, dist: 62, size: 6 });
      return 1050;
    },
    hose(A, T, k) { act(k, 'cast', 950); beam(A, T, { color: '#2F7DE1', core: '#BFE4FF', w: 26, dur: 880 }); burst('drop', T, { delay: 240, n: 26, dist: 95, size: 8, dur: 620 }); shake(6, 500, 300); return 1150; },
    paddle(A, T, k) { act(k, 'lunge', 440); prop('paddle', { from: above(T, 56), to: { x: T.x + 8 * u, y: T.y - 6 * u }, dur: 240, size: 38, rot0: -1.4, rot1: 1, delay: 90 }); burst('drop', T, { delay: 320, n: 12, dist: 62 }); return 800; },
    rainy() { return weatherFx('rain'); },
    // 풀
    leafcut(A, T, k) { act(k, 'cast', 380); spray('leaf', A, T, { n: 8, gap: 42, dur: 300, size: 10, spin: 14 }); slash(T, { delay: 360, color: '#D7F2B4' }); slash(T, { delay: 440, angle: .8, color: '#D7F2B4' }); return 780; },
    vinewhip(A, T, k) { act(k, 'cast', 620); whip(A, T, { curve: 80 }); whip(A, T, { delay: 300, curve: -60 }); slash(T, { delay: 190, color: '#7ED08A', w: 5 }); slash(T, { delay: 480, angle: .7, color: '#7ED08A', w: 5 }); return 860; },
    sapdrain(A, T, k, t) { act(k, 'cast', 900); tint(t, 'drain', 800); spray('heart', T, A, { n: 12, gap: 55, dur: 420, size: 7, arc: 24, spread: 20 }); rise('sparkle', A, { delay: 620, n: 5, dur: 420, size: 6 }); return 1150; },
    pollen(A, T, k) { act(k, 'cast', 500); cloud(T, ['#FFE9A0', '#FFD23F'], { delay: 280, n: 10, dur: 800, size: 22 }); orbit('petal', T, { delay: 160, n: 16, r: 66, dur: 950, turns: 1.2, rising: 20 }); spray('petal', A, T, { n: 10, gap: 26, dur: 340, spin: 8, size: 9 }); return 1250; },
    seed(A, T, k) { act(k, 'throw', 400); spray('seed', A, ground(T), { n: 4, gap: 90, arc: 70, dur: 460, spin: 10, size: 8, spread: 18 }); burst('leaf', ground(T), { delay: 700, n: 8, dist: 42, size: 7 }); return 1050; },
    sunbathe(A, T, k) { act(k, 'charge', 900); fall('sparkle', A, { n: 10, gap: 60, height: 130, size: 9, dur: 520 }); rise('leaf', A, { n: 8, dur: 750, size: 7 }); ring(A, { color: '#FFE45C', r1: 76, delay: 180, dur: 700 }); return 1150; },
    lullaby(A, T, k, t) { act(k, 'sway', 900); spray('spore', A, T, { n: 16, gap: 36, dur: 620, arc: 40, size: 9, spread: 26 }); rise('z', T, { delay: 650, n: 4, gap: 110, dur: 620, size: 9, spread: 24 }); return 1250; },
    // 전기
    static(A, T, k, t) { act(k, 'cast', 380); bolt(A, T, { dur: 260, w: 2.2, wob: 11 }); burst('spark', T, { delay: 160, n: 8, dist: 38, size: 7 }); tint(t, 'zap', 340, 170); return 720; },
    // 고압 전류: 선이 이어진 채로 지지직 지지는 연출
    highvolt(A, T, k, t) {
      act(k, 'charge', 1050);
      [0, 90, 180].forEach((d) => bolt(A, T, { delay: d, dur: 950 - d, w: 4, wob: 22 }));
      for (let i = 0; i < 5; i++) {
        const a = rnd(0, 6.28);
        bolt(T, { x: T.x + Math.cos(a) * T.r, y: T.y + Math.sin(a) * T.r }, { delay: 150 + i * 150, dur: 240, w: 2.4, wob: 8 });
      }
      burst('spark', T, { delay: 180, n: 12, dist: 62, size: 8, dur: 380 });
      burst('spark', T, { delay: 520, n: 12, dist: 62, size: 8, dur: 380 });
      [160, 420, 680].forEach((d) => flash('#FFF7C2', 130, d, .35));
      tint(t, 'zap', 900, 140);
      shake(4, 820, 140);
      return 1250;
    },
    bolt(A, T, k, t) {
      act(k, 'charge', 520);
      cloud({ x: T.x, y: 24 * u }, ['#3a3550', '#59606c'], { n: 8, dur: 1000, size: 28, spread: 58 });
      const top = { x: T.x + 14 * u, y: 8 * u };
      [420, 520, 640].forEach((d) => bolt(top, T, { delay: d, dur: 240, w: 9, wob: 30, flick: 2 }));
      flash('#fff', 260, 420, .85); flash('#FFF7C2', 260, 640, .5);
      ring(ground(T), { color: '#FFE45C', delay: 460, r1: 110, squash: .35, w: 7 });
      burst('spark', T, { delay: 450, n: 18, dist: 92, size: 10 });
      tint(t, 'zap', 620, 430); shake(12, 460, 430);
      return 1280;
    },
    shortfist(A, T, k, t) { act(k, 'lunge', 440); prop('fist', { from: A, to: T, dur: 210, size: 28, delay: 70 }); bolt(A, T, { delay: 80, dur: 200, w: 2.6 }); burst('spark', T, { delay: 270, n: 14, dist: 64, size: 8 }); tint(t, 'zap', 380, 270); return 800; },
    shock(A, T, k, t) { act(k, 'cast', 420); ring(T, { color: '#FFE45C', r0: 90, r1: 18, dur: 400 }); for (let i = 0; i < 6; i++) { const a = i * 1.05; bolt({ x: T.x + Math.cos(a) * 92 * u, y: T.y + Math.sin(a) * 60 * u }, T, { delay: 160 + i * 40, dur: 260, w: 2.6, wob: 10 }); } tint(t, 'zap', 460, 280); return 900; },
    charge(A, T, k) { act(k, 'charge', 920); for (let i = 0; i < 7; i++) { const a = i * .9; bolt({ x: A.x + Math.cos(a) * 110 * u, y: A.y + Math.sin(a) * 90 * u }, A, { delay: i * 90, dur: 260, w: 2.4, wob: 12 }); } ring(A, { color: '#FFE45C', r1: 86, delay: 600 }); rise('spark', A, { n: 7, dur: 500, size: 7, delay: 340 }); return 1150; },
    // 얼음
    frost(A, T, k, t) { act(k, 'cast', 420); windLines(A, T, { n: 6, color: '#BFE4FF' }); spray('snow', A, T, { n: 10, gap: 34, size: 6, spin: 5 }); tint(t, 'cold', 360, 420); return 840; },
    icestorm(A, T, k, t) { act(k, 'cast', 620); orbit('shard', T, { n: 12, r: 72, dur: 800, size: 10, turns: 1.6 }); orbit('snow', T, { n: 8, r: 44, dur: 800, size: 6, turns: -1.2 }); burst('shard', T, { delay: 720, n: 12, dist: 74, size: 9 }); tint(t, 'cold', 500, 600); return 1180; },
    blizzard(A, T, k, t) {
      act(k, 'charge', 620); add(1100, (p) => { ctx.globalAlpha = .55 * Math.sin(p * Math.PI); ctx.fillStyle = '#E8F8FF'; ctx.fillRect(0, 0, W, H); });
      const left = { x: W + 20 * u, y: 20 * u }, c = { x: -20 * u, y: H * .9 };
      spray('snow', left, c, { n: 70, gap: 13, dur: 520, size: 7, spread: 120, spin: 6 });
      spray('shard', A, T, { n: 8, gap: 70, delay: 300, dur: 300, size: 11, aim: false });
      tint(t, 'cold', 620, 660);
      return 1360;
    },
    icicle(A, T, k, t) { act(k, 'throw', 420); const a = Math.atan2(T.y - A.y, T.x - A.x) + 1.57; const sp = above(A, 56); prop('shard', { from: sp, to: sp, dur: 260, size: 28, rot0: a, rot1: a }); prop('shard', { from: sp, to: T, delay: 260, dur: 200, size: 28, rot0: a, rot1: a }); burst('snow', T, { delay: 450, n: 12, dist: 62 }); tint(t, 'cold', 380, 450); return 880; },
    brainfrz(A, T, k, t) { act(k, 'cast', 420); const h = above(T, 44); spray('snow', A, h, { n: 8, gap: 34, size: 7 }); ring(h, { color: '#4CC3D9', delay: 400, r1: 58 }); prop('shard', { from: above(T, 88), to: h, delay: 380, dur: 170, size: 22, rot0: 0 }); tint(t, 'cold', 500, 450); shake(5, 280, 450); return 1000; },
    // 땅
    dirt(A, T, k) { act(k, 'throw', 380); spray('dirt', ground(A), T, { n: 16, gap: 18, arc: 40, dur: 380, size: 8, spread: 26 }); cloud(T, ['#A9713A88', '#D9B66A88'], { delay: 360, n: 6, dur: 420, size: 18, spread: 34 }); return 900; },
    quake(A, T, k, t) { act(k, 'jump', 520); shake(14, 720, 420); ring(ground(A), { color: '#A9713A', delay: 420, r1: 230, squash: .28, w: 8, dur: 640 }); cracks(T, { delay: 480 }); burst('rock', ground(T), { delay: 500, n: 14, dist: 84, size: 9 }); burst('dust', ground(T), { delay: 460, n: 16, dist: 92, size: 12 }); return 1250; },
    rockthrow(A, T, k) { act(k, 'throw', 400); spray('rock', A, T, { n: 1, dur: 400, arc: 80, size: 24, spin: 7, spread: 0, delay: 120 }); burst('dirt', T, { delay: 480, n: 12, dist: 60 }); shake(5, 200, 500); return 880; },
    grind(A, T, k) { act(k, 'cast', 500); const l = { x: T.x - 30 * u, y: T.y }, r = { x: T.x + 30 * u, y: T.y }; prop('rock', { from: { x: l.x - 70 * u, y: l.y }, to: l, dur: 340, size: 38, rot1: 6 }); prop('rock', { from: { x: r.x + 70 * u, y: r.y }, to: r, dur: 340, size: 38, rot1: -6 }); burst('dirt', T, { delay: 320, n: 10, dist: 50 }); return 800; },
    wall(A, T, k) { act(k, 'charge', 760); [[-26, 32], [26, 32], [-26, 8], [26, 8], [0, 20], [0, -6]].forEach(([x, y], i) => { const to = { x: A.x + (k === 'me' ? 52 : -52) * u + x * .4 * u, y: A.y + y * u }; prop('brick', { from: above(to, 120), to, delay: i * 90, dur: 240, size: 13, hold: 500 }); }); return 1200; },
    dust() { return weatherFx('dust'); },
    // 바람
    gust(A, T, k) { act(k, 'cast', 420); windLines(A, T, { n: 10, gap: 34, spread: 40 }); spray('leaf', A, T, { n: 3, gap: 80, spin: 9, size: 6 }); return 820; },
    twister(A, T, k, t) { act(k, 'spin', 620); tornado(T, { dur: 1050, color: '#CFEDE1' }); orbit('leaf', T, { n: 8, r: 54, dur: 950, size: 6, turns: 3, rising: 50 }); act(t, 'lift', 980); return 1220; },
    razorwind(A, T, k) { act(k, 'lunge', 380); spray('crescent', A, T, { n: 3, gap: 110, dur: 260, size: 18, spread: 18, aim: true }); slash(T, { delay: 310, color: '#E6FFF4' }); slash(T, { delay: 420, angle: .9, color: '#E6FFF4' }); slash(T, { delay: 520, angle: 0, color: '#E6FFF4' }); return 860; },
    windcut(A, T, k) { act(k, 'dash', 420); windLines(A, T, { n: 8, gap: 18, dur: 240, spread: 44 }); slash(T, { delay: 210, angle: -.3, len: 120 }); return 680; },
    breeze(A, T, k) { act(k, 'spin', 620); orbit('leaf', A, { n: 6, r: 62, dur: 800, size: 6, turns: 2, rising: 30 }); ring(ground(A), { color: '#CFEDE1', r1: 90, squash: .3, dur: 620 }); return 1000; },
    // 독
    spit(A, T, k, t) { act(k, 'throw', 380); spray('glob', A, T, { n: 3, gap: 100, arc: 36, dur: 340, size: 10 }); burst('bubble', T, { delay: 520, n: 8, dist: 44, size: 6 }); tint(t, 'poison', 380, 520); return 960; },
    sting(A, T, k) { act(k, 'lunge', 380); spray('needle', A, T, { n: 3, gap: 80, dur: 200, size: 15, aim: true, spread: 10 }); burst('bubble', T, { delay: 360, n: 7, dist: 38, size: 5 }); return 760; },
    sludge(A, T, k, t) { act(k, 'charge', 420); spray('glob', A, T, { n: 1, delay: 300, dur: 400, arc: 92, size: 34, spread: 0 }); burst('glob', T, { delay: 700, n: 18, dist: 88, size: 9 }); ring(T, { color: '#9A4FB8', delay: 700, r1: 96, w: 7 }); tint(t, 'poison', 480, 700); shake(5, 220, 700); return 1240; },
    fog(A, T, k, t) { act(k, 'cast', 480); cloud(T, ['#9A4FB8', '#6c3a86', '#C993DD'], { n: 16, dur: 880, delay: 160, size: 26, spread: 62 }); rise('bubble', T, { n: 6, delay: 300, dur: 560, size: 6 }); tint(t, 'poison', 660, 460); return 1300; },
    stench(A, T, k) { act(k, 'cast', 500); [0, 180, 360].forEach((d) => spray('hair', A, T, { n: 3, gap: 60, delay: d, dur: 520, size: 13, spread: 26, arc: 14 })); cloud(T, ['#9CAE5A', '#7A8E3E'], { n: 9, delay: 340, dur: 640, size: 22, spread: 50 }); return 1200; },
    // 쇠
    ironhead(A, T, k) { act(k, 'dash', 560); ring(T, { delay: 280, color: '#D7DDE5', r1: 76, w: 7 }); burst('sparkle', T, { delay: 280, n: 12, dist: 74, size: 10 }); flash('#fff', 150, 280, .4); shake(6, 220, 280); return 820; },
    // 해머: 위에서 커다랗게 떨어짐
    hammer(A, T, k) { act(k, 'jump', 440); const top = above(T, 124); prop('hammer', { from: top, to: top, dur: 320, size: 48, rot0: .3, rot1: -1.2 }); prop('hammer', { from: top, to: above(T, 26), delay: 320, dur: 190, size: 48, rot0: -1.2, rot1: 1.1, hold: 220 }); shake(13, 340, 510); ring(ground(T), { delay: 510, color: '#AEB7C2', r1: 120, squash: .3, w: 8 }); burst('scrap', T, { delay: 510, n: 12, dist: 82 }); cracks(T, { delay: 510, dur: 520 }); return 1140; },
    scrap(A, T, k) { act(k, 'throw', 380); spray('scrap', A, T, { n: 16, gap: 28, dur: 300, spin: 12, size: 7, spread: 28 }); return 800; },
    magnet(A, T, k) { act(k, 'charge', 760); const front = { x: lerp(A.x, T.x, .22), y: lerp(A.y, T.y, .22) }; prop('magnet', { from: above(front, 34), to: front, dur: 200, size: 28, hold: 560 }); [0, 130, 260, 390].forEach((d) => ring(T, { delay: 180 + d, color: '#E8402C', r0: 106, r1: 12, dur: 280, w: 5 })); spray('scrap', T, front, { delay: 300, n: 7, gap: 46, dur: 280, size: 6, spin: 8 }); return 1040; },
    // 압정: 손을 휘둘러 상대 쪽 바닥에 흩뿌림. 바닥에 남는 것은 필드 표시가 맡음.
    tacks(A, T, k) {
      act(k, 'throw', 460);
      const g = ground(T);
      for (let i = 0; i < 14; i++) {
        const x = g.x + rnd(-78, 78) * u, y = g.y + rnd(-16, 18) * u, h = rnd(50, 96), r0 = rnd(0, 6);
        add(560, (p) => {
          const px = lerp(A.x, x, p), py = lerp(A.y, y, p) - Math.sin(p * Math.PI) * h * u;
          sprite('tack', px, py, 8, r0 + p * 12);
        }, 120 + i * 28);
        add(260, (p) => sprite('tack', x, y - Math.abs(Math.sin(p * 6.28)) * 8 * u * (1 - p), 8, 0, fade(p, .3)), 680 + i * 28);
      }
      return 1250;
    },
    armor(A, T, k) { act(k, 'charge', 760); for (let i = 0; i < 6; i++) { const a = i * 1.05, from = { x: A.x + Math.cos(a) * 120 * u, y: A.y + Math.sin(a) * 90 * u }; prop('plate', { from, to: { x: A.x + Math.cos(a) * 18 * u, y: A.y + Math.sin(a) * 18 * u }, delay: i * 70, dur: 260, size: 14, rot0: a, rot1: a + 3, hold: 120 }); } ring(A, { color: '#D7DDE5', delay: 620, r1: 84 }); burst('sparkle', A, { delay: 640, n: 8, dist: 64 }); return 1120; },
    // 혼
    wisp(A, T, k, t) { act(k, 'sway', 760); orbit('wisp', A, { n: 3, r: 54, dur: 500, size: 11, turns: 1 }); spray('wisp', A, T, { n: 3, delay: 480, gap: 90, dur: 340, arc: 44, size: 13, spread: 18 }); tint(t, 'burn', 460, 840); return 1250; },
    scold(A, T, k, t) { act(k, 'cast', 560); [0, 130, 260, 390].forEach((d) => { ring(A, { delay: d, color: '#7A6BE0', r0: 22, r1: 160, dur: 460, w: 6 }); }); ring(T, { delay: 400, color: '#4B3F9E', r1: 86, w: 7 }); tint(t, 'hex', 420, 460); return 1000; },
    ambush(A, T, k) {
      act(k, 'vanish', 640);
      const back = { x: T.x + (k === 'me' ? 46 : -46) * u, y: T.y };
      add(280, (p) => { ctx.globalAlpha = .75 * fade(p, .4); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(back.x, back.y, 26 * u, 46 * u * Math.min(1, p * 2.4), 0, 0, 7); ctx.fill(); }, 210);
      slash(T, { delay: 340, color: '#7A6BE0', len: 110, w: 9 });
      return 760;
    },
    nightmare(A, T, k, t) { act(k, 'sway', 780); cloud(above(T, 26), ['#1a1433', '#3b2a78'], { n: 11, dur: 900, size: 26, spread: 56 }); add(800, (p) => { sprite('sparkle', T.x - 15 * u, T.y - 26 * u, 9, 0, Math.sin(p * 3.14)); sprite('sparkle', T.x + 15 * u, T.y - 26 * u, 9, 0, Math.sin(p * 3.14)); }, 160); rise('z', T, { n: 3, delay: 620, gap: 120, dur: 520, size: 9 }); tint(t, 'hex', 620, 430); return 1250; },
    club(A, T, k) { act(k, 'lunge', 460); const sign = k === 'me' ? -1 : 1; prop('club', { from: { x: T.x + sign * 62 * u, y: T.y - 72 * u }, to: { x: T.x + sign * 8 * u, y: T.y - 6 * u }, dur: 250, delay: 90, size: 52, rot0: sign * 1.5, rot1: -sign * .7, hold: 160 }); burst('coin', T, { delay: 340, n: 8, dist: 66, size: 7 }); shake(8, 230, 340); return 880; },
    ttukttak(A, T, k) { act(k, 'jump', 480); fall('coin', A, { n: 16, gap: 36, dur: 430, height: 140, size: 9, spread: 62 }); burst('sparkle', above(A, 44), { delay: 280, n: 10, dist: 66, size: 9 }); ring(A, { color: '#FFD23F', delay: 420, r1: 88 }); return 1100; },
    soulrush(A, T, k) { cloud(A, ['#1a1433', '#4B3F9E'], { n: 8, dur: 620, size: 22, spread: 42 }); act(k, 'dash', 640); spray('wisp', A, T, { n: 12, gap: 24, dur: 280, size: 11, spread: 24 }); ring(T, { delay: 320, color: '#7A6BE0', r1: 118, w: 9 }); flash('#4B3F9E', 300, 320, .5); shake(10, 300, 320); return 1040; },
    // 보통
    tackle(A, T, k) { act(k, 'dash', 480); ring(T, { delay: 240, color: '#fff', r1: 52, w: 5, dur: 260 }); return 660; },
    struggle(A, T, k) { act(k, 'dash', 520); burst('dust', T, { delay: 260, n: 8, dist: 46 }); return 720; },
    guard(A, T, k) { act(k, 'charge', 620); add(800, (p) => { ctx.globalAlpha = .7 * fade(p, .3); ctx.strokeStyle = INK; ctx.lineWidth = 6 * u; ctx.fillStyle = '#BFE4FF66'; ctx.beginPath(); ctx.arc(A.x, A.y, A.r * 1.2 * out(Math.min(1, p * 3)), 0, 7); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#BFE4FF'; ctx.lineWidth = 3 * u; ctx.stroke(); }); return 880; },
    nap(A, T, k) { act(k, 'sway', 900); rise('z', A, { n: 5, gap: 150, dur: 640, size: 9, spread: 26 }); rise('heart', A, { n: 8, dur: 620, size: 7 }); return 1250; },
    spirit_up(A, T, k) { act(k, 'charge', 620); rise('flame', A, { n: 8, gap: 40, dur: 500, size: 8 }); ring(ground(A), { color: '#E8402C', r1: 76, squash: .35 }); burst('sparkle', A, { delay: 420, n: 8, dist: 58 }); return 960; },
    // 신캐 전용
    lid(A, T, k) { act(k, 'throw', 420); prop('lid', { from: A, to: T, delay: 180, dur: 300, size: 34, rot1: 18 }); ring(T, { delay: 470, color: '#D7DDE5', r1: 74, w: 6 }); burst('scrap', T, { delay: 470, n: 8, dist: 58 }); shake(6, 240, 470); return 900; },
    gnaw(A, T, k) { act(k, 'dash', 460); const up = { x: T.x, y: T.y - 28 * u }, dn = { x: T.x, y: T.y + 28 * u }; add(360, (p) => { const c = Math.min(1, p * 2); sprite('teeth', T.x, lerp(up.y - 16 * u, T.y - 6 * u, c), 22, 0, fade(p)); sprite('teeth', T.x, lerp(dn.y + 16 * u, T.y + 6 * u, c), 22, 3.14, fade(p)); }, 150); burst('bubble', T, { delay: 320, n: 6, dist: 40, size: 5 }); return 700; },
    // 역류: 상대 발밑에서 물기둥이 솟구침
    backflow(A, T, k) {
      act(k, 'cast', 460);
      const g = ground(T);
      add(760, (p) => {
        const h = 170 * u * Math.sin(Math.min(1, p * 1.05) * 3.14), w = 44 * u;
        ctx.fillStyle = '#2F7DE1'; ctx.strokeStyle = INK; ctx.lineWidth = 3 * u;
        ctx.beginPath(); ctx.moveTo(g.x - w, g.y); ctx.quadraticCurveTo(g.x - w * .3, g.y - h * .5, g.x - w * .5, g.y - h); ctx.quadraticCurveTo(g.x, g.y - h - 16 * u, g.x + w * .5, g.y - h); ctx.quadraticCurveTo(g.x + w * .3, g.y - h * .5, g.x + w, g.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      }, 220);
      burst('drop', { x: g.x, y: g.y - 96 * u }, { delay: 440, n: 16, dist: 92, size: 7 });
      ring(g, { color: '#7fc8e8', delay: 220, r1: 88, squash: .3 });
      return 1080;
    },
    tangle(A, T, k) { act(k, 'sway', 700); for (let i = 0; i < 7; i++) whip(ground(T), { x: T.x + rnd(-36, 36) * u, y: T.y - rnd(0, 56) * u }, { delay: i * 70, color: '#3b3640', curve: rnd(-70, 70), dur: 520, w: 3 }); orbit('hair', T, { n: 8, r: 46, dur: 720, delay: 240, size: 12, turns: 1 }); return 1120; },
    // 뻥 뚫기: 뚫어뻥을 내리꽂고 뽑음
    plunge(A, T, k) { act(k, 'jump', 460); const top = above(T, 120), mid = above(T, 24); prop('plunger', { from: top, to: mid, delay: 150, dur: 240, size: 44, hold: 120 }); prop('plunger', { from: mid, to: above(T, 110), delay: 510, dur: 200, size: 44 }); ring(ground(T), { delay: 390, color: '#fff', r1: 122, squash: .34, w: 8 }); burst('dirt', T, { delay: 390, n: 14, dist: 78 }); shake(9, 260, 390); return 920; },
    broth(A, T, k, t) { act(k, 'throw', 420); spray('broth', A, T, { n: 16, gap: 18, dur: 380, arc: 62, size: 8, spread: 22 }); burst('broth', T, { delay: 500, n: 10, dist: 58, size: 6 }); rise('flame', T, { delay: 540, n: 4, gap: 50, dur: 360, size: 6 }); tint(t, 'burn', 420, 520); return 1000; },
    mustard(A, T, k) { act(k, 'lunge', 460); prop('mustard', { from: A, to: T, delay: 100, dur: 240, size: 22 }); burst('mustard', T, { delay: 340, n: 12, dist: 56, size: 6 }); return 800; },
    refill(A, T, k) { act(k, 'charge', 760); const top = above(A, 92); prop('bucket', { from: above(A, 170), to: top, dur: 240, size: 28, rot1: 2.4, hold: 400 }); fall('drop', A, { delay: 240, n: 14, gap: 26, dur: 260, height: 82, spread: 24, size: 7 }); rise('heart', A, { delay: 520, n: 7, dur: 560, size: 7 }); return 1200; },
    honeybomb(A, T, k) { act(k, 'dash', 620); prop('honey', { from: A, to: T, dur: 300, size: 28 }); ring(T, { delay: 300, color: '#E7A020', r1: 120, w: 9 }); burst('honey', T, { delay: 300, n: 18, dist: 92, size: 8 }); burst('flame', T, { delay: 340, n: 10, dist: 72, size: 8 }); flash('#FFD23F', 260, 300, .45); shake(9, 260, 300); return 1000; },
    // 페어리와 로봇
    pixiedust(A, T, k) { act(k, 'sway', 560); spray('sparkle', A, T, { n: 16, gap: 26, dur: 420, arc: 30, size: 8, spread: 26 }); burst('pheart', T, { delay: 560, n: 8, dist: 52 }); return 980; },
    charm(A, T, k, t) { act(k, 'sway', 620); spray('pheart', A, T, { n: 8, gap: 60, dur: 420, arc: 26, size: 10, spread: 22 }); tint(t, 'hex', 360, 620); return 1050; },
    fairydance(A, T, k) { act(k, 'spin', 760); orbit('sparkle', A, { n: 10, r: 62, dur: 820, size: 9, turns: 2, rising: 28 }); rise('pheart', A, { n: 6, dur: 560, size: 7 }); return 1040; },
    neonwink(A, T, k, t) { act(k, 'cast', 480); ['#ff4fa8', '#37e0ff'].forEach((c, i) => beam(A, T, { delay: i * 120, color: c, core: '#fff', w: 8, dur: 480 })); burst('pheart', T, { delay: 420, n: 10, dist: 66 }); flash('#ff4fa8', 240, 420, .35); tint(t, 'zap', 360, 430); return 1000; },
    forge(A, T, k) { act(k, 'charge', 700); for (let i = 0; i < 3; i++) { burst('spark', A, { delay: i * 140, n: 9, dist: 50, size: 6, dur: 240 }); ring(A, { delay: i * 140, color: '#FFD23F', r0: 14, r1: 54, dur: 220, w: 4 }); } return 760; },
    tierslash(A, T, k, t) { act(k, 'lunge', 420); slash(T, { delay: 200, angle: -.9, len: 150, color: '#fff', w: 9 }); slash(T, { delay: 290, angle: .5, len: 120, color: '#FFD23F', w: 6 }); burst('spark', T, { delay: 260, n: 12, dist: 60, size: 7 }); shake(6, 260, 240); return 820; },
    shieldbash(A, T, k, t) { act(k, 'dash', 420); ring(T, { delay: 240, color: '#C7CDD6', r0: 20, r1: 90, dur: 300, w: 9 }); burst('spark', T, { delay: 260, n: 10, dist: 54, size: 8 }); shake(8, 260, 250); return 760; },
    lionroar(A, T, k, t) { act(k, 'cast', 600); for (let i = 0; i < 4; i++) ring(A, { delay: i * 110, color: i % 2 ? '#FFD23F' : '#fff', r0: 30, r1: 170, dur: 420, w: 6 }); windLines(A, T, { delay: 200, n: 10, gap: 24, spread: 50 }); tint(t, 'hex', 400, 400); shake(6, 400, 200); return 1000; },
    crystalbolt(A, T, k, t) { act(k, 'cast', 480); beam(A, T, { color: '#7fe0ff', core: '#fff', w: 9, dur: 420 }); bolt(A, T, { delay: 120, dur: 260, w: 2.4, wob: 10 }); burst('sparkle', T, { delay: 380, n: 12, dist: 60 }); flash('#9ad8ff', 200, 380, .3); tint(t, 'zap', 340, 400); return 980; },
    focusmana(A, T, k) { act(k, 'charge', 900); ring(A, { color: '#9ad8ff', r1: 92, dur: 520 }); ring(A, { color: '#ff7fd0', r1: 70, delay: 260, dur: 480 }); rise('sparkle', A, { n: 10, dur: 520, size: 8, delay: 200 }); return 1100; },
    potion(A, T, k) { act(k, 'charge', 760); rise('bubble', A, { n: 10, gap: 40, dur: 520, size: 7 }); rise('heart', A, { delay: 360, n: 7, dur: 560, size: 7 }); return 1100; },
    sparkcircle(A, T, k, t) { act(k, 'cast', 420); ring(A, { color: '#FFE45C', r1: 60, dur: 300 }); bolt(A, T, { delay: 200, dur: 260, w: 2.6, wob: 12 }); ring(T, { color: '#9ad8ff', r0: 80, r1: 16, delay: 380, dur: 360 }); burst('spark', T, { delay: 420, n: 10, dist: 50, size: 7 }); tint(t, 'zap', 360, 420); return 940; },
    winksnipe(A, T, k, t) { act(k, 'cast', 420); burst('pheart', A, { n: 5, dist: 30 }); beam(A, T, { delay: 220, color: '#6CF2C2', core: '#fff', w: 4, dur: 200 }); slash(T, { delay: 380, angle: -.2, len: 110, color: '#fff' }); flash('#ffffff', 120, 400, .45); burst('sparkle', T, { delay: 420, n: 10, dist: 56 }); return 900; },
    arrowrain(A, T, k, t) { act(k, 'throw', 520); for (let i = 0; i < 5; i++) beam(A, T, { delay: i * 90, color: '#E6FFF4', core: '#fff', w: 3, dur: 160 }); windLines(A, T, { n: 6, gap: 40, dur: 220, spread: 40 }); burst('spark', T, { delay: 300, n: 10, dist: 48, size: 6 }); return 880; },
    snarearrow(A, T, k, t) { act(k, 'throw', 400); beam(A, T, { color: '#3FA34D', core: '#E6FFF4', w: 4, dur: 220 }); ring(T, { color: '#3FA34D', r0: 70, r1: 30, delay: 240, dur: 420 }); ring(T, { color: '#8FD694', r0: 60, r1: 24, delay: 360, dur: 420 }); return 860; },
    throwknife(A, T, k) { act(k, 'dash', 300); spray('scrap', A, T, { n: 2, gap: 60, dur: 200, spin: 18, size: 12, spread: 6 }); slash(T, { delay: 220, angle: .6, len: 90 }); return 620; },
    hawkeye(A, T, k) { act(k, 'charge', 820); ring(A, { color: '#6CF2C2', r1: 80, dur: 460 }); ring(A, { color: '#fff', r0: 90, r1: 10, delay: 300, dur: 420 }); rise('spark', A, { n: 6, dur: 480, size: 6, delay: 260 }); return 1000; },
    lipmark(A, T, k, t) { act(k, 'lunge', 480); prop('lips', { from: A, to: T, delay: 80, dur: 300, size: 30, hold: 300 }); burst('pheart', T, { delay: 380, n: 8, dist: 54 }); tint(t, 'hex', 340, 380); return 900; },
    canburst(A, T, k) { act(k, 'cast', 620); spray('can', A, T, { n: 8, gap: 56, dur: 240, size: 11, spin: 12, spread: 20 }); burst('scrap', T, { delay: 300, n: 8, dist: 52 }); return 880; },
    bulletdash(A, T, k) { act(k, 'dash', 420); windLines(A, T, { n: 10, gap: 12, dur: 220, spread: 40, color: '#FFE45C' }); prop('plate', { from: A, to: T, dur: 190, size: 22 }); ring(T, { delay: 190, color: '#FFD23F', r1: 76 }); return 640; },
    spincycle(A, T, k, t) { act(k, 'spin', 760); act(t, 'lift', 760); orbit('drop', T, { n: 12, r: 58, dur: 760, size: 8, turns: 3 }); orbit('bubble', T, { n: 8, r: 34, dur: 760, size: 6, turns: -2 }); ring(T, { color: '#BFE4FF', r1: 92, delay: 640 }); return 1040; },
    metalnoise(A, T, k, t) { act(k, 'cast', 700); for (let i = 0; i < 4; i++) ring(A, { delay: i * 110, color: ['#C9A24A', '#cfd6df'][i % 2], r0: 20, r1: 150, w: 5, dur: 420 }); for (let i = 0; i < 3; i++) ring(T, { delay: 300 + i * 110, color: '#ff7ad9', r0: 10, r1: 70, w: 4, dur: 300 }); shake(8, 420, 300); tint(t, 'hex', 420, 360); return 1000; },
    bangalzzuk(A, T, k, t, e) {
      // 붕빵이를 세로로 반 갈라 단면(속)을 보여 준 뒤, 속에 따라 다르게
      const open = splitOpen(k, e?.fill || 'pat');
      darken(open, .3);
      slash(A, { angle: -1.5708, len: 160, color: '#fff', w: 8, dur: 240 });
      flash('#ffffff', 120, 200, .35);
      const d = open - 300;
      if (e?.fill === 'cream') { rise('heart', A, { delay: d, n: 8, dur: 600, size: 9 }); burst('bubble', A, { delay: d, n: 10, dist: 50, size: 8 }); return open + 500; }
      if (e?.fill === 'pizza') { rise('arrowUp', A, { delay: d, n: 6, dur: 520, size: 10 }); burst('spark', A, { delay: d, n: 14, dist: 70, size: 8 }); ring(A, { delay: d, color: '#E8402C', r1: 110, w: 6 }); return open + 500; }
      later(() => act(k, 'throw', 420), d);
      spray('redbean', A, T, { delay: d, n: 16, gap: 24, dur: 300, size: 9, spread: 22, spin: 8 });
      burst('redbean', T, { delay: d + 340, n: 14, dist: 80, size: 8 }); ring(T, { delay: d + 340, color: '#5a1f2a', r1: 120, w: 7 });
      shake(10, 360, d + 340); tint(t, 'burn', 400, d + 360);
      return open + 700;
    },
    trucksudden(A, T, k, t) { flash('#fff7b0', 120, 0, .5); act(k, 'dash', 520); ring(A, { color: '#8ff6ff', r1: 70, w: 5, squash: .35 }); burst('sparkle', T, { delay: 260, n: 10, dist: 60 }); burst('scrap', T, { delay: 260, n: 8, dist: 70 }); shake(10, 320, 260); return 820; },
    jellypress(A, T, k, t) { act(k, 'dash', 560); burst('glob', T, { delay: 300, n: 14, dist: 64, size: 10 }); burst('drop', T, { delay: 320, n: 8, dist: 40 }); ring(T, { color: '#6be3a4', delay: 300, r1: 90, w: 8, squash: .5 }); burst('leaf', A, { delay: 620, n: 6, dist: 30 }); return 980; },
    holysword(A, T, k, t) { act(k, 'charge', 420); ring(A, { color: '#ffe46b', r1: 60, w: 6 }); prop('shard', { from: above(T, 170), to: T, delay: 380, dur: 200, size: 46 }); slash(T, { delay: 560, angle: -1.5, len: 130, color: '#fff6c2', w: 10 }); burst('sparkle', T, { delay: 580, n: 14, dist: 70 }); flash('#fff6c2', 200, 560, .45); shake(8, 300, 580); return 1100; },
    forbidpage(A, T, k, t) { act(k, 'cast', 760); orbit('flame', A, { n: 6, r: 44, dur: 420, size: 8 }); spray('flame', A, T, { n: 18, gap: 24, dur: 320, size: 11, spread: 22, delay: 380 }); burst('wisp', T, { delay: 700, n: 8, dist: 50 }); tint(t, 'burn', 500, 700); return 1200; },
    chomp(A, T, k, t) { act(k, 'dash', 520); burst('coin', A, { n: 8, dist: 40 }); slash(T, { delay: 300, angle: .6, len: 90, color: '#ff5c8a' }); slash(T, { delay: 360, angle: -.6, len: 90, color: '#ff5c8a' }); burst('wisp', T, { delay: 380, n: 8, dist: 50 }); shake(7, 260, 360); return 860; },
    cicadacry(A, T, k, t) { act(k, 'cast', 900); for (let i = 0; i < 5; i++) ring(A, { delay: i * 120, color: ['#ffe14d', '#7ed957'][i % 2], r0: 20, r1: 170, w: 5, dur: 420 }); burst('leaf', T, { delay: 500, n: 10, dist: 60 }); shake(9, 600, 300); return 1150; },
    bloodsuck(A, T, k, t) { act(k, 'dash', 480); bolt(A, T, { dur: 300, w: 2, color: '#b6ff3c' }); burst('drop', T, { delay: 300, n: 8, dist: 40 }); burst('glob', A, { delay: 620, n: 6, dist: 30 }); tint(t, 'poison', 400, 320); return 980; },
    flutter(A, T, k, t) { act(k, 'dash', 560); burst('crescent', T, { delay: 280, n: 12, dist: 80 }); burst('seed', T, { delay: 320, n: 10, dist: 60 }); burst('dust', T, { delay: 320, n: 8, dist: 50 }); return 900; },
    nyanpunch(A, T, k, t) { act(k, 'dash', 700); for (let i = 0; i < 4; i++) { prop('fist', { from: A, to: T, delay: i * 110, dur: 140, size: 26 }); burst('pheart', T, { delay: 140 + i * 110, n: 3, dist: 30 }); } burst('flame', T, { delay: 560, n: 6, dist: 36 }); return 1000; },
    roachrush(A, T, k, t) { act(k, 'dash', 420); flash('#2a1006', 160, 0, .55); burst('wisp', T, { delay: 220, n: 10, dist: 60 }); burst('dust', T, { delay: 220, n: 8, dist: 50 }); shake(12, 360, 220); tint(t, 'poison', 380, 260); return 820; },
    rageaxe(A, T, k, t) { return rageAxe(A, T, k, t); },
    elemblade(A, T, k, t, e) { return elemBlade(A, T, k, t, e?.type); },
    reflector(A, T, k) { act(k, 'cast', 400); return 500; },
    icicledrop(A, T, k, t) { act(k, 'cast', 420); const sp = above(T, 150); prop('shard', { from: sp, to: sp, dur: 240, size: 34, rot0: 3.14, rot1: 3.14 }); prop('shard', { from: sp, to: T, delay: 240, dur: 160, size: 34, rot0: 3.14, rot1: 3.14 }); burst('snow', T, { delay: 400, n: 14, dist: 64 }); burst('wisp', T, { delay: 420, n: 6, dist: 40 }); flash('#bfeaff', 160, 400, .35); tint(t, 'cold', 360, 420); return 900; },
    stoneegg(A, T, k, t) { act(k, 'throw', 420); prop('bean', { from: A, to: T, dur: 360, size: 26, rot1: 8 }); burst('flame', T, { delay: 360, n: 8, dist: 46 }); burst('snow', T, { delay: 360, n: 8, dist: 46 }); shake(6, 240, 360); return 860; },
    vineshock(A, T, k, t) { act(k, 'cast', 600); whip(A, T, { color: '#4cbf3a', dur: 420, w: 7 }); bolt(A, T, { delay: 220, dur: 380, w: 3 }); burst('leaf', T, { delay: 380, n: 8, dist: 44 }); tint(t, 'zap', 380, 420); return 960; },
    scrub(A, T, k, t) { act(k, 'dash', 420); orbit('bubble', T, { n: 14, r: 46, dur: 700, size: 8, turns: 2.5 }); for (let i = 0; i < 4; i++) slash(T, { delay: 120 + i * 120, angle: i % 2 ? .6 : -.6, len: 70, color: '#4fd162', w: 6 }); burst('sparkle', T, { delay: 700, n: 10, dist: 54 }); return 1020; },
    yellowgust(A, T, k, t) { act(k, 'dash', 360); tornado(T, { dur: 700, kind: 'dust', color: '#E9C77A' }); spray('dirt', A, T, { n: 18, gap: 22, dur: 280, size: 7, spread: 30 }); return 880; },
    // 전용기
    gugong(A, T, k, t) { act(k, 'dash', 640); orbit('flame', A, { n: 10, r: 44, dur: 300, size: 7 }); prop('brick', { from: A, to: T, dur: 300, size: 24, rot1: 8 }); ring(T, { delay: 310, color: '#F28A1E', r1: 124, w: 9 }); burst('flame', T, { delay: 310, n: 20, dist: 100, size: 11 }); burst('dirt', T, { delay: 320, n: 10, dist: 80 }); shake(8, 280, 310); return 1020; },
    headfirst(A, T, k) { spray('bread', A, T, { n: 1, dur: 220, size: 30, spread: 0 }); act(k, 'dash', 420); add(280, (p) => { const c = Math.min(1, p * 2.4); sprite('teeth', T.x, lerp(T.y - 44 * u, T.y - 7 * u, c), 24, 0, fade(p)); sprite('teeth', T.x, lerp(T.y + 44 * u, T.y + 7 * u, c), 24, 3.14, fade(p)); }, 170); burst('flame', T, { delay: 260, n: 8, dist: 52 }); return 660; },
    rekindle(A, T, k, t) { act(k, 'sway', 860); add(420, (p) => { ctx.globalAlpha = .45 * Math.sin(p * 3.14); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); }); spray('wisp', above(T, 100), T, { delay: 380, n: 8, gap: 42, dur: 260, size: 12, spread: 34 }); ring(T, { delay: 620, color: '#4B6BFF', r1: 100, w: 8 }); tint(t, 'burn', 460, 640); return 1140; },
    boil(A, T, k, t) { act(k, 'charge', 780); rise('bubble', A, { n: 8, gap: 34, dur: 420, size: 7 }); beam(A, T, { delay: 300, color: '#fff', core: '#7fc8e8', w: 20, dur: 520 }); cloud(T, ['#ffffffcc', '#ffffff99'], { delay: 420, n: 10, dur: 560, size: 22, spread: 46 }); tint(t, 'burn', 420, 620); return 1080; },
    kimjang(A, T, k) { act(k, 'jump', 480); prop('leaf', { from: above(T, 118), to: T, delay: 180, dur: 230, size: 40, rot1: 3 }); burst('broth', T, { delay: 410, n: 12, dist: 68 }); burst('leaf', T, { delay: 410, n: 8, dist: 58 }); shake(8, 240, 410); return 900; },
    umbrellastab(A, T, k) { act(k, 'lunge', 480); fall('drop', T, { n: 8, gap: 30, height: 110, spread: 44, size: 6 }); spray('needle', A, T, { n: 5, gap: 34, delay: 80, dur: 180, size: 16, aim: true, spread: 18 }); slash(T, { delay: 300, color: '#BFE4FF', angle: 0 }); return 780; },
    sprout(A, T, k) { act(k, 'charge', 780); for (let i = 0; i < 9; i++) add(600, (p) => sprite('bean', A.x + (i - 4) * 12 * u, A.foot - 74 * u * out(p), 14 * Math.min(1, p * 2), 0, fade(p, .2)), i * 34); ring(ground(A), { color: '#D7F2B4', r1: 86, squash: .34, delay: 200 }); rise('heart', A, { delay: 320, n: 6, dur: 480, size: 7 }); return 1060; },
    sweep(A, T, k) { act(k, 'dash', 560); windLines(A, T, { n: 8, gap: 20, dur: 260, spread: 40 }); slash(T, { delay: 240, angle: 0, len: 150, color: '#C7A64B', w: 10 }); burst('dust', ground(T), { delay: 260, n: 16, dist: 96, size: 10 }); burst('leaf', T, { delay: 270, n: 7, dist: 76 }); return 820; },
    cheongyang(A, T, k, t) { act(k, 'charge', 600); flash('#E8402C', 300, 0, .3); prop('flame', { from: A, to: T, delay: 300, dur: 230, size: 34 }); ring(T, { delay: 530, color: '#D31C12', r1: 112, w: 9 }); burst('flame', T, { delay: 530, n: 18, dist: 92, size: 11 }); flash('#E8402C', 280, 530, .42); tint(t, 'burn', 520, 530); shake(7, 260, 530); return 1060; },
    wirewrap(A, T, k, t) { act(k, 'lunge', 520); for (let i = 0; i < 4; i++) whip(A, { x: T.x + rnd(-30, 30) * u, y: T.y + rnd(-34, 34) * u }, { delay: i * 70, color: '#2b2b38', curve: 60 - i * 40, dur: 520, w: 3 }); orbit('spark', T, { delay: 260, n: 8, r: 48, dur: 520, size: 7 }); tint(t, 'zap', 520, 300); return 960; },
    mash(A, T, k, t) { act(k, 'cast', 500); for (let i = 0; i < 6; i++) spray('spark', A, T, { n: 1, delay: i * 90, dur: 180, size: 9, spread: 22 }); [0, 180, 360].forEach((d) => ring(T, { delay: 150 + d, color: '#6CF2C2', r1: 44, dur: 200 })); tint(t, 'zap', 340, 220); return 800; },
    kitefight(A, T, k) { act(k, 'sway', 620); whip(A, T, { color: '#fff5d8', curve: 80, w: 2.5, dur: 620 }); prop('crescent', { from: above(A, 70), to: T, delay: 180, dur: 300, size: 30, rot1: 12 }); slash(T, { delay: 460, color: '#fff5d8', angle: 1 }); windLines(A, T, { delay: 100, n: 5 }); return 860; },
    patmix(A, T, k, t) { act(k, 'spin', 620); orbit('shard', T, { n: 8, r: 60, dur: 620, size: 8, turns: 2 }); orbit('mustard', T, { n: 8, r: 36, dur: 620, size: 6, turns: -2 }); burst('snow', T, { delay: 560, n: 12, dist: 62 }); tint(t, 'cold', 420, 540); return 1020; },
    icepack(A, T, k, t) { act(k, 'lunge', 480); prop('plate', { from: above(T, 90), to: T, delay: 100, dur: 240, size: 34, rot0: -1, rot1: .6 }); burst('shard', T, { delay: 340, n: 12, dist: 68 }); ring(T, { delay: 340, color: '#BCE9F2', r1: 86, w: 7 }); tint(t, 'cold', 420, 340); return 860; },
    aged(A, T, k, t) { act(k, 'charge', 480); spray('mustard', A, T, { n: 8, gap: 34, arc: 56, dur: 400, size: 11, spread: 22 }); cloud(T, ['#7A4A2A', '#9A4FB8'], { delay: 420, n: 10, dur: 620, size: 22, spread: 46 }); tint(t, 'poison', 480, 480); return 1140; },
    eoi(A, T, k) { act(k, 'jump', 480); const top = above(T, 116); prop('hammer', { from: top, to: top, dur: 240, size: 44, rot0: -1.5, rot1: -.6 }); prop('hammer', { from: top, to: above(T, 22), delay: 240, dur: 180, size: 44, rot0: -.6, rot1: 1.5, hold: 200 }); shake(14, 360, 420); cracks(T, { delay: 420, dur: 620 }); burst('rock', ground(T), { delay: 420, n: 12, dist: 88 }); ring(ground(T), { delay: 420, color: '#A9713A', r1: 130, squash: .3, w: 9 }); return 1080; },
    glare(A, T, k, t) { act(k, 'charge', 700); add(640, (p) => { ctx.globalAlpha = .5 * Math.sin(p * 3.14); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); }); [-16, 16].forEach((o) => add(620, (p) => { ctx.globalAlpha = Math.sin(p * 3.14); ctx.fillStyle = '#E8402C'; ctx.beginPath(); ctx.arc(A.x + o * u, A.y - 10 * u, 7 * u, 0, 7); ctx.fill(); })); ring(T, { delay: 300, color: '#E8402C', r0: 90, r1: 20, dur: 340, w: 5 }); tint(t, 'hex', 420, 360); shake(4, 260, 360); return 960; },
    turbo(A, T, k) { act(k, 'spin', 760); orbit('crescent', A, { n: 3, r: 40, dur: 520, size: 16, turns: 3, squash: 1 }); windLines(A, T, { delay: 240, n: 12, gap: 26, spread: 56 }); return 1000; },
    wrestle(A, T, k, t) { act(k, 'dash', 620); act(t, 'lift', 620); slash(ground(T), { delay: 260, angle: 0, len: 130, color: '#FFD23F', w: 8 }); ring(ground(T), { delay: 440, color: '#fff', r1: 90, squash: .3 }); burst('dust', ground(T), { delay: 440, n: 12, dist: 74 }); shake(7, 220, 440); return 940; },
    kick(A, T, k) { act(k, 'throw', 400); prop('can', { from: ground(A), to: T, delay: 180, dur: 280, size: 22, rot1: 16 }); ring(T, { delay: 450, color: '#fff', r1: 78 }); burst('scrap', T, { delay: 450, n: 7, dist: 54 }); shake(5, 180, 450); return 840; },
    bagged(A, T, k, t) { act(k, 'sway', 640); prop('bag', { from: above(A, 70), to: T, dur: 420, size: 54, rot1: 6.28, hold: 340 }); add(340, (p) => { ctx.globalAlpha = .75 * fade(p); ctx.fillStyle = '#2f2b38'; ctx.beginPath(); ctx.arc(T.x, T.y, T.r * .9, 0, 7); ctx.fill(); }, 400); return 1000; },
    molt(A, T, k) { act(k, 'charge', 760); [0, 150, 300].forEach((d) => ring(A, { delay: d, color: '#E7C98A', r0: A.r, r1: A.r * 1.7 / u, dur: 480, w: 5 })); burst('seed', A, { delay: 380, n: 12, dist: 84, size: 8 }); rise('sparkle', A, { delay: 380, n: 7, dur: 460, size: 8 }); return 1120; },
  };


  /* ---------- 전용기 연출 (전부 새로) ---------- */
  // 값은 맞는 순간까지의 시간. 맞는 순간의 타입 임팩트는 play()가 덧붙입니다.
  const mid = (A, T, k = .5) => ({ x: lerp(A.x, T.x, k), y: lerp(A.y, T.y, k), foot: lerp(A.foot, T.foot, k), r: A.r });
  Object.assign(MOVE_FX, {
    gugong(A, T, k, t) {
      act(k, 'charge', 560); gather(A, '#FF6A2B', { dur: 520 });
      for (let i = 0; i < 9; i++) { const a = -1.57 + (i - 4) * .22; spray('flame', A, { x: A.x + Math.cos(a) * 90 * u, y: A.y + Math.sin(a) * 90 * u }, { delay: 300 + i * 20, n: 2, dur: 320, size: 10 }); }
      later(() => act(k, 'dash', 520), 520);
      comet(A, T, { delay: 560, color: '#FF6A2B', size: 22, dur: 280 });
      frame(830); glow(T, '#FF6A2B', { r: 170, delay: 840, dur: 600 });
      for (let i = 0; i < 3; i++) ring(T, { delay: 840 + i * 70, color: ['#fff', '#FFD23F', '#FF6A2B'][i], r1: 160, w: 9 - i * 2, dur: 480 });
      burst('flame', T, { delay: 840, n: 30, dist: 150, size: 13, dur: 620 }); cracks(T, { delay: 860 });
      bang(above(T, 70), '퍼펑!', { delay: 860, color: '#FF6A2B' }); shake(14, 420, 840);
      return 860;
    },
    headfirst(A, T, k, t) {
      speedLines(T, { color: '#FFE3B0', dur: 420 }); act(k, 'dash', 420);
      prop('bread', { from: A, to: T, dur: 240, size: 46, rot1: 12 });
      bang(above(T, 60), '와앙!', { delay: 220, color: '#E7A84B' }); burst('redbean', T, { delay: 240, n: 16, dist: 90, size: 9 });
      return 250;
    },
    rekindle(A, T, k, t) {
      darken(1200, .55, 0, '#050a24'); act(k, 'cast', 900);
      orbit('wisp', A, { n: 10, r: 60, dur: 700, size: 11, turns: 1.5, rising: 30 });
      for (let i = 0; i < 8; i++) spray('wisp', { x: A.x + rnd(-40, 40) * u, y: A.y - 40 * u }, T, { delay: 500 + i * 50, n: 1, dur: 380, size: 14, arc: rnd(40, 120) });
      pillar(T, '#4B6BFF', { delay: 900, dur: 700, w: 60 }); rise('wisp', T, { delay: 940, n: 12, gap: 30, dur: 600, size: 12, spread: 50 });
      tint(t, 'hex', 600, 900);
      return 940;
    },
    boil(A, T, k, t) {
      act(k, 'cast', 760); cloud(A, ['#ffffff', '#e8f2ff', '#cfe4ff'], { n: 10, dur: 700, size: 22, spread: 34 });
      gather(A, '#9fd8ff', { dur: 420 }); laser(A, T, { delay: 380, color: '#7fc8ff', w: 26, dur: 520 });
      cloud(T, ['#ffffff', '#e8f2ff'], { delay: 600, n: 14, dur: 800, size: 30, spread: 60 }); rise('bubble', T, { delay: 600, n: 10, gap: 30, dur: 520, size: 9 });
      bang(above(T, 70), '치이익!', { delay: 620, color: '#9fd8ff' }); tint(t, 'burn', 500, 620);
      return 620;
    },
    kimjang(A, T, k, t) {
      act(k, 'jump', 600);
      spray('broth', A, T, { n: 16, gap: 16, dur: 360, size: 11, arc: 60, spread: 26 });
      prop('bucket', { from: above(T, 230), to: T, delay: 300, dur: 260, size: 64, rot1: 3.1 });
      frame(560); shockwave(T, '#E8402C', { delay: 570 }); burst('broth', T, { delay: 570, n: 24, dist: 130, size: 11 });
      bang(above(T, 70), '김장 펀치!', { delay: 580, color: '#E8402C', size: 26 });
      return 580;
    },
    umbrellastab(A, T, k, t) {
      act(k, 'dash', 620); windLines(A, T, { n: 10, gap: 26, spread: 30 });
      const a = Math.atan2(T.y - A.y, T.x - A.x);
      for (let i = 0; i < 6; i++) { slash({ x: T.x + rnd(-14, 14) * u, y: T.y + rnd(-18, 18) * u }, { delay: 260 + i * 55, angle: a, len: 150, color: i % 2 ? '#9FF5D8' : '#fff', w: 6, dur: 180 }); }
      fall('drop', T, { delay: 200, n: 16, gap: 20, dur: 360, spread: 80 });
      bang(above(T, 70), '푹푹푹!', { delay: 420, color: '#9FF5D8' });
      return 600;
    },
    sprout(A, T, k) {
      act(k, 'lift', 900); pillar(A, '#7ED957', { dur: 900, w: 50 });
      rise('bean', A, { n: 16, gap: 35, dur: 620, size: 12, spread: 50, height: 110 });
      orbit('leaf', A, { n: 10, r: 70, dur: 900, size: 10, turns: 1.6, rising: 40 });
      bang(above(A, 90), '쑥쑥!', { delay: 400, color: '#7ED957' });
      return 900;
    },
    sweep(A, T, k, t) {
      act(k, 'spin', 760); tornado(A, { dur: 500, color: '#E6FFF4' });
      windLines(A, T, { delay: 300, n: 14, gap: 18, spread: 50 });
      for (let i = 0; i < 3; i++) swoosh(T, { delay: 420 + i * 90, color: '#9FF5D8', r: 70 + i * 10, flip: i % 2 ? -1 : 1, a0: 2.6, a1: .2 });
      burst('dust', T, { delay: 460, n: 20, dist: 120, size: 12 }); burst('tack', T, { delay: 500, n: 6, dist: 140, size: 9 });
      bang(above(T, 70), '싹-!', { delay: 520, color: '#9FF5D8' });
      return 640;
    },
    cheongyang(A, T, k, t) {
      flash('#ff2a1f', 400, 0, .3); act(k, 'charge', 520); gather(A, '#ff2a1f', { dur: 500 });
      comet(A, T, { delay: 480, color: '#ff2a1f', size: 20, dur: 260, arc: 30 });
      pillar(T, '#ff3b1f', { delay: 740, dur: 720, w: 64 }); burst('flame', T, { delay: 740, n: 28, dist: 130, size: 13 });
      bang(above(T, 80), '맵다!!', { delay: 760, color: '#ff3b1f', size: 34 }); tint(t, 'burn', 700, 760); shake(9, 360, 740);
      return 760;
    },
    wirewrap(A, T, k, t) {
      act(k, 'cast', 760);
      for (let i = 0; i < 4; i++) whip(A, { x: T.x + rnd(-20, 20) * u, y: T.y + rnd(-30, 30) * u }, { delay: i * 70, color: '#2b2b38', curve: rnd(-80, 80), dur: 520, w: 5 });
      for (let i = 0; i < 6; i++) bolt({ x: T.x + rnd(-60, 60) * u, y: T.y + rnd(-60, 60) * u }, { x: T.x + rnd(-20, 20) * u, y: T.y + rnd(-20, 20) * u }, { delay: 380 + i * 60, dur: 220, w: 5, wob: 14 });
      flash('#FFF7C2', 160, 400, .5); flash('#FFF7C2', 160, 560, .4); orbit('spark', T, { delay: 380, n: 10, r: 56, dur: 500, size: 10 });
      bang(above(T, 70), '지지직!', { delay: 420, color: '#FFE45C' }); tint(t, 'zap', 500, 420);
      return 460;
    },
    mash(A, T, k, t) {
      act(k, 'sway', 900);
      const keys = ['A!', 'B!', '→', 'A!', '↑', 'B!', 'A!'];
      keys.forEach((s, i) => { comet(A, T, { delay: i * 85, color: i % 2 ? '#FF5FB0' : '#4DE1FF', size: 10, dur: 200 }); bang({ x: T.x + rnd(-50, 50) * u, y: T.y + rnd(-60, 10) * u }, s, { delay: 180 + i * 85, size: 20, dur: 380, color: i % 2 ? '#FF5FB0' : '#4DE1FF' }); });
      return 760;
    },
    kitefight(A, T, k, t) {
      act(k, 'lift', 760);
      whip(A, { x: T.x - 30 * u, y: T.y - 80 * u }, { color: '#fff', curve: 90, dur: 520, w: 2 });
      whip(T, { x: T.x - 30 * u, y: T.y - 80 * u }, { delay: 100, color: '#fff', curve: -60, dur: 420, w: 2 });
      windLines(A, T, { n: 12, gap: 24, spread: 50 }); spray('crescent', A, T, { delay: 200, n: 10, gap: 26, dur: 300, size: 14, aim: true });
      for (let i = 0; i < 2; i++) swoosh(T, { delay: 380 + i * 110, color: '#9FF5D8', r: 64, flip: i ? -1 : 1 });
      bang(above(T, 70), '끊어라!', { delay: 420, color: '#9FF5D8' });
      return 520;
    },
    patmix(A, T, k, t) {
      act(k, 'cast', 900); cloud(T, ['#ffffff', '#e6f6ff'], { n: 10, dur: 900, size: 26, spread: 50 });
      orbit('snow', T, { n: 12, r: 70, dur: 800, size: 10, turns: 3, squash: .5 }); orbit('redbean', T, { n: 8, r: 46, dur: 800, size: 9, turns: -3, squash: .5 });
      burst('shard', T, { delay: 700, n: 20, dist: 120, size: 11 }); bang(above(T, 70), '사각사각', { delay: 300, color: '#bfefff', size: 24 }); tint(t, 'cold', 600, 700);
      return 720;
    },
    icepack(A, T, k, t) {
      act(k, 'jump', 560); gather(A, '#8FEFFF', { dur: 380 });
      prop('plate', { from: above(T, 220), to: T, delay: 300, dur: 240, size: 52 });
      frame(540); for (let i = 0; i < 2; i++) ring(T, { delay: 540 + i * 80, color: i ? '#8FEFFF' : '#fff', r1: 150, w: 8 }); burst('shard', T, { delay: 540, n: 26, dist: 140, size: 12 });
      bang(above(T, 70), '쩌억!', { delay: 560, color: '#8FEFFF' }); tint(t, 'cold', 600, 560);
      return 560;
    },
    aged(A, T, k, t) {
      darken(1100, .5, 0, '#1a0a12'); act(k, 'cast', 760);
      cloud(A, ['#6a3a1c', '#4a2a3a', '#8a5a2a'], { n: 10, dur: 700, size: 24, spread: 40 });
      comet(A, T, { delay: 380, color: '#9A4FB8', size: 22, dur: 360, arc: 70 });
      cloud(T, ['#9A4FB8', '#6c3a86', '#4a2a3a', '#8a5a2a'], { delay: 720, n: 18, dur: 900, size: 34, spread: 80 }); rise('bubble', T, { delay: 740, n: 12, gap: 30, dur: 600, size: 10 });
      bang(above(T, 80), '삼 년 묵은 맛', { delay: 760, color: '#C77DFF', size: 22 }); tint(t, 'poison', 700, 740);
      return 740;
    },
    eoi(A, T, k, t) {
      act(k, 'charge', 600); gather(A, '#D9A066', { dur: 560 }); bang(above(A, 80), '어이!', { delay: 100, color: '#D9A066' });
      later(() => act(k, 'dash', 520), 560);
      prop('lid', { from: A, to: T, delay: 560, dur: 300, size: 70, rot1: 14 });
      frame(860); shockwave(T, '#D9A066', { delay: 860, r: 200 }); cracks(T, { delay: 860 }); cracks(T, { delay: 880 });
      burst('rock', T, { delay: 860, n: 24, dist: 150, size: 12 }); shake(16, 460, 860);
      return 870;
    },
    glare(A, T, k, t) {
      darken(1000, .6, 0, '#140505'); act(k, 'charge', 700);
      const eyes = [{ x: A.x - 10 * u, y: A.y - 14 * u }, { x: A.x + 10 * u, y: A.y - 14 * u }];
      eyes.forEach((e, i) => { glow(e, '#ff2a2a', { r: 26, dur: 900 }); laser(e, { x: T.x + (i ? 8 : -8) * u, y: T.y - 10 * u }, { delay: 400, color: '#ff2a2a', w: 6, dur: 420 }); });
      speedLines(T, { color: '#ff9a9a', delay: 420, dur: 420 }); bang(above(T, 70), '!!', { delay: 460, color: '#ff2a2a', size: 40 });
      later(() => act(t, 'sway', 400), 460); tint(t, 'hex', 500, 460);
      return 820;
    },
    turbo(A, T, k, t) {
      act(k, 'spin', 1000); tornado(A, { dur: 800, color: '#CFEDE1' }); orbit('crescent', A, { n: 10, r: 66, dur: 700, size: 12, turns: 3 });
      windLines(A, T, { delay: 380, n: 22, gap: 14, spread: 60 }); tornado(T, { delay: 560, dur: 700, color: '#9FF5D8' });
      later(() => act(t, 'lift', 700), 560); bang(above(T, 90), '위이잉!', { delay: 600, color: '#9FF5D8' });
      return 700;
    },
    wrestle(A, T, k, t) {
      act(k, 'dash', 520); darken(900, .4, 0, '#0a0620'); orbit('wisp', T, { n: 8, r: 50, dur: 600, size: 10 });
      swoosh(ground(T), { delay: 260, color: '#8C7CFF', r: 50, a0: 3, a1: 0, w: 12 });
      later(() => act(t, 'lift', 500), 300); frame(640); shockwave(T, '#8C7CFF', { delay: 650 });
      bang(above(T, 70), '으라차!', { delay: 660, color: '#8C7CFF' });
      return 660;
    },
    kick(A, T, k, t) {
      act(k, 'dash', 440); prop('can', { from: A, to: T, delay: 220, dur: 220, size: 34, rot1: 20 }); comet(A, T, { delay: 220, color: '#E3E8EF', size: 10, dur: 220 });
      bang(above(T, 60), '깡!', { delay: 440, color: '#E3E8EF', size: 40 }); burst('scrap', T, { delay: 440, n: 14, dist: 100, size: 10 });
      return 440;
    },
    bagged(A, T, k, t) {
      act(k, 'throw', 520); windLines(A, T, { n: 8, gap: 30, spread: 40 });
      prop('bag', { from: above(T, 200), to: T, delay: 200, dur: 360, size: 66, hold: 500 });
      bang(above(T, 70), '부스럭', { delay: 560, color: '#E6E6E6', size: 24 }); tint(t, 'hex', 600, 560);
      return 760;
    },
    lid(A, T, k, t) {
      act(k, 'throw', 520); gather(A, '#E3E8EF', { dur: 300 });
      prop('lid', { from: A, to: T, delay: 260, dur: 260, size: 50, rot1: 18 }); comet(A, T, { delay: 260, color: '#9aa3b5', size: 12, dur: 260 });
      frame(520); burst('spark', T, { delay: 520, n: 18, dist: 120, size: 10 }); bang(above(T, 70), '쾅!', { delay: 530, color: '#E3E8EF', size: 40 });
      return 530;
    },
    gnaw(A, T, k, t) {
      act(k, 'vanish', 520); speedLines(T, { color: '#C77DFF', dur: 360 });
      prop('teeth', { from: above(T, 50), to: { x: T.x, y: T.y - 6 * u }, delay: 200, dur: 140, size: 38 });
      prop('teeth', { from: { x: T.x, y: T.y + 50 * u }, to: { x: T.x, y: T.y + 6 * u }, delay: 200, dur: 140, size: 38, rot0: 3.14, rot1: 3.14 });
      burst('glob', T, { delay: 340, n: 12, dist: 80, size: 9 }); bang(above(T, 60), '갉!', { delay: 340, color: '#C77DFF' });
      return 350;
    },
    backflow(A, T, k, t) {
      act(k, 'cast', 760); ring(ground(T), { color: '#3A9BFF', r0: 10, r1: 90, squash: .3, dur: 400, w: 6 });
      pillar(T, '#3A9BFF', { delay: 300, dur: 700, w: 54 }); rise('drop', T, { delay: 300, n: 22, gap: 16, dur: 520, size: 11, spread: 40, height: 150 });
      bang(above(T, 90), '콸콸콸!', { delay: 340, color: '#3A9BFF' });
      return 380;
    },
    tangle(A, T, k, t) {
      darken(1000, .5, 0, '#0a0614'); act(k, 'cast', 760);
      spray('hair', A, T, { n: 22, gap: 18, dur: 360, size: 16, spread: 30, spin: 6 });
      orbit('hair', T, { delay: 360, n: 14, r: 50, dur: 700, size: 16, turns: 2.4, squash: .6 });
      tint(t, 'hex', 700, 400); bang(above(T, 70), '스멀스멀', { delay: 420, color: '#8C7CFF', size: 22 });
      return 800;
    },
    plunge(A, T, k, t) {
      act(k, 'dash', 520); prop('plunger', { from: A, to: T, dur: 260, size: 48, rot0: 1.57, rot1: 1.57 });
      frame(270); ring(T, { delay: 270, color: '#D52C2C', r1: 140, w: 10 }); burst('dirt', T, { delay: 280, n: 20, dist: 130, size: 10 }); cracks(T, { delay: 280 });
      bang(above(T, 70), '뻥!!', { delay: 280, color: '#D52C2C', size: 42 });
      return 290;
    },
    broth(A, T, k, t) {
      act(k, 'throw', 520); spray('broth', A, T, { n: 26, gap: 12, dur: 360, size: 12, arc: 70, spread: 30, grow: .4 });
      cloud(T, ['#ffffff', '#ffe0d0'], { delay: 400, n: 12, dur: 700, size: 26, spread: 50 });
      bang(above(T, 70), '앗뜨!', { delay: 440, color: '#E8402C' }); tint(t, 'burn', 600, 440);
      return 460;
    },
    mustard(A, T, k, t) {
      act(k, 'dash', 520); spray('mustard', A, T, { n: 10, gap: 20, dur: 260, size: 11, spread: 20 });
      slash(T, { delay: 260, angle: 1.2, len: 120, color: '#E7A020', w: 9 }); slash(T, { delay: 320, angle: -1.2, len: 120, color: '#E7A020', w: 9 });
      bang(above(T, 70), '푹 찍!', { delay: 320, color: '#E7A020' });
      return 340;
    },
    refill(A, T, k) {
      act(k, 'lift', 900); pillar(A, '#ffb27a', { dur: 800, w: 40 }); fall('broth', A, { n: 16, gap: 30, dur: 360, spread: 40 });
      cloud(A, ['#ffffff', '#ffe0d0'], { delay: 300, n: 10, dur: 700, size: 22, spread: 40 }); rise('heart', A, { delay: 400, n: 8, gap: 50, dur: 520, size: 9 });
      bang(above(A, 90), '리필!', { delay: 300, color: '#ffb27a' });
      return 900;
    },
    honeybomb(A, T, k, t) {
      act(k, 'charge', 520); gather(A, '#E7A020', { dur: 480 });
      later(() => act(k, 'throw', 420), 480); prop('honey', { from: A, to: T, delay: 480, dur: 320, size: 34 }); comet(A, T, { delay: 480, color: '#E7A020', size: 16, dur: 320, arc: 60 });
      frame(800); glow(T, '#FFB02E', { delay: 800, r: 170, dur: 600 }); burst('honey', T, { delay: 800, n: 26, dist: 150, size: 12 }); burst('flame', T, { delay: 820, n: 16, dist: 120, size: 11 });
      bang(above(T, 80), '꿀폭탄!', { delay: 820, color: '#FFB02E' }); shake(14, 420, 800);
      return 820;
    },
    molt(A, T, k) {
      act(k, 'sway', 600); flash('#ffffff', 220, 560, .7);
      burst('leaf', A, { delay: 580, n: 20, dist: 120, size: 13 }); burst('scrap', A, { delay: 580, n: 10, dist: 100, size: 10 });
      glow(A, '#4CD964', { delay: 560, r: 140, dur: 600 }); ring(A, { delay: 580, color: '#4CD964', r1: 140, w: 8 }); rise('arrowUp', A, { delay: 700, n: 5, gap: 70, dur: 460, size: 10 });
      bang(above(A, 90), '탈피!', { delay: 600, color: '#4CD964' });
      return 1100;
    },
    neonwink(A, T, k, t) {
      darken(1000, .65, 0, '#07021a'); act(k, 'cast', 600);
      bang(above(A, 70), '찡긋♥', { color: '#FF5FB0', size: 24 });
      laser(A, T, { delay: 300, color: '#FF5FB0', w: 10, dur: 380 }); laser(A, T, { delay: 360, color: '#4DE1FF', w: 6, dur: 320 });
      burst('pheart', T, { delay: 600, n: 18, dist: 120, size: 12 });
      return 620;
    },
    lipmark(A, T, k, t) {
      act(k, 'dash', 520); prop('lips', { from: A, to: T, dur: 300, size: 56 });
      frame(300); bang(above(T, 70), '쪽♥', { delay: 310, color: '#E0123E', size: 40 }); burst('pheart', T, { delay: 310, n: 20, dist: 130, size: 12 });
      return 320;
    },
    crystalbolt(A, T, k, t) {
      act(k, 'cast', 760); magicCircle(mid(A, T, .22), { color: '#37E0FF', glow: '#FF7FD0', r: 54, dur: 900, star: 5 });
      laser(mid(A, T, .22), T, { delay: 380, color: '#7fe0ff', w: 20, dur: 460 }); bolt(A, T, { delay: 420, dur: 300, w: 3, wob: 14 });
      burst('shard', T, { delay: 700, n: 18, dist: 120, size: 11 }); tint(t, 'zap', 400, 700);
      return 720;
    },
    winksnipe(A, T, k, t) {
      act(k, 'cast', 600); darken(800, .45);
      add(380, (p) => { // 조준경
        ctx.globalAlpha = fade(p, .2); ctx.strokeStyle = '#6CF2C2'; ctx.lineWidth = 2.5 * u; const R = (60 - p * 30) * u;
        ctx.beginPath(); ctx.arc(T.x, T.y, R, 0, 7); ctx.moveTo(T.x - R * 1.4, T.y); ctx.lineTo(T.x + R * 1.4, T.y); ctx.moveTo(T.x, T.y - R * 1.4); ctx.lineTo(T.x, T.y + R * 1.4); ctx.stroke();
      }, 0);
      laser(A, T, { delay: 400, color: '#6CF2C2', w: 6, dur: 220 }); frame(560);
      return 580;
    },
    canburst(A, T, k, t) {
      act(k, 'sway', 900);
      for (let i = 0; i < 8; i++) { prop('can', { from: A, to: { x: T.x + rnd(-24, 24) * u, y: T.y + rnd(-24, 24) * u }, delay: i * 70, dur: 200, size: 24, rot1: 12 }); burst('spark', T, { delay: 200 + i * 70, n: 4, dist: 50, size: 8 }); }
      bang(above(T, 70), '철컹철컹!', { delay: 300, color: '#E3E8EF', size: 24 });
      return 760;
    },
    bulletdash(A, T, k, t) {
      speedLines(T, { color: '#fff', dur: 360 }); act(k, 'dash', 360); comet(A, T, { color: '#9FF5D8', size: 20, dur: 180, trail: 14 });
      windLines(A, T, { n: 8, gap: 12, spread: 30, dur: 240 }); bang(above(T, 70), '배달 왔습니다!', { delay: 200, color: '#9FF5D8', size: 20 });
      return 200;
    },
    spincycle(A, T, k, t) {
      act(k, 'spin', 900);
      add(900, (p) => { // 물 소용돌이
        ctx.globalAlpha = fade(p, .25); ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) { const R = (30 + i * 14) * u, a = p * 18 + i; ctx.strokeStyle = i % 2 ? '#3A9BFF' : '#bfe8ff'; ctx.lineWidth = 5 * u; ctx.beginPath(); ctx.ellipse(T.x, T.y, R, R * .6, 0, a, a + 2.4); ctx.stroke(); }
      }, 100);
      orbit('bubble', T, { delay: 100, n: 12, r: 70, dur: 800, size: 9, turns: 4, squash: .6 });
      bang(above(T, 80), '탈탈탈!', { delay: 300, color: '#3A9BFF' }); later(() => act(t, 'spin', 600), 200);
      return 860;
    },
    icicledrop(A, T, k, t) {
      act(k, 'cast', 600); add(500, (p) => { ctx.globalAlpha = .5 * Math.sin(p * 3.14); ctx.fillStyle = '#bfefff'; ctx.fillRect(0, 0, W, 24 * u); });
      for (let i = 0; i < 3; i++) prop('shard', { from: { x: T.x + (i - 1) * 40 * u, y: -60 * u }, to: { x: T.x + (i - 1) * 20 * u, y: T.y }, delay: 300 + i * 90, dur: 260, size: 50 - i * 8 });
      frame(560); burst('shard', T, { delay: 570, n: 24, dist: 130, size: 11 }); ring(T, { delay: 570, color: '#8FEFFF', r1: 150, w: 8 }); tint(t, 'cold', 600, 580);
      return 580;
    },
    stoneegg(A, T, k, t, e) {
      const hot = e?.type !== 'ice', c = hot ? '#FF6A2B' : '#8FEFFF';
      act(k, 'throw', 520); glow(A, c, { r: 80, dur: 400 });
      prop('rock', { from: A, to: T, delay: 200, dur: 320, size: 26, rot1: 10 }); comet(A, T, { delay: 200, color: c, size: 14, dur: 320, arc: 90 });
      burst(hot ? 'flame' : 'snow', T, { delay: 520, n: 22, dist: 120, size: 11 }); cloud(T, hot ? ['#ffffff', '#ffd0b0'] : ['#ffffff', '#d0f4ff'], { delay: 520, n: 8, dur: 600, size: 24, spread: 40 });
      bang(above(T, 70), hot ? '앗 뜨거!' : '앗 차가!', { delay: 540, color: c });
      return 540;
    },
    vineshock(A, T, k, t) {
      act(k, 'cast', 800);
      for (let i = 0; i < 3; i++) { const to = { x: T.x + (i - 1) * 18 * u, y: T.y + (i - 1) * 14 * u }; whip(A, to, { delay: i * 70, color: '#4CD964', curve: (i - 1) * 70, dur: 600, w: 8 }); bolt(A, to, { delay: 260 + i * 70, dur: 300, w: 4, wob: 12 }); }
      flash('#FFF7C2', 160, 420, .45); orbit('spark', T, { delay: 400, n: 8, r: 50, dur: 400, size: 9 }); tint(t, 'zap', 500, 440);
      bang(above(T, 70), '찌릿!', { delay: 440, color: '#FFE45C' });
      return 460;
    },
    scrub(A, T, k, t) {
      act(k, 'dash', 900);
      for (let i = 0; i < 6; i++) swoosh(T, { delay: 200 + i * 80, color: '#5fd36a', r: 40, flip: i % 2 ? -1 : 1, a0: -.4, a1: .9, w: 10, dur: 160 });
      burst('bubble', T, { delay: 300, n: 18, dist: 90, size: 9 }); burst('dust', T, { delay: 500, n: 10, dist: 80, size: 8 });
      bang(above(T, 70), '박박박!', { delay: 300, color: '#5fd36a' });
      return 720;
    },
    yellowgust(A, T, k, t) {
      add(1000, (p) => { ctx.globalAlpha = .45 * Math.sin(p * 3.14); ctx.fillStyle = '#C9A24A'; ctx.fillRect(0, 0, W, H); });
      act(k, 'cast', 800); spray('dust', { x: A.x, y: A.y }, T, { n: 40, gap: 12, dur: 420, size: 16, spread: 60 });
      windLines(A, T, { n: 14, gap: 30, spread: 70, color: '#F2D49B' }); burst('rock', T, { delay: 500, n: 16, dist: 110, size: 10 });
      bang(above(T, 80), '황사 경보!', { delay: 400, color: '#F2D49B', size: 24 });
      return 700;
    },
    metalnoise(A, T, k, t) {
      act(k, 'sway', 800); soundWaves(A, T, { color: '#E3E8EF', n: 7, gap: 70, dur: 420 });
      speedLines(T, { color: '#E3E8EF', delay: 300, dur: 500 }); burst('spark', T, { delay: 400, n: 14, dist: 90, size: 9 });
      bang(above(T, 80), '끼이이익!!', { delay: 300, color: '#E3E8EF', size: 26 }); later(() => act(t, 'sway', 500), 300);
      return 720;
    },
    trucksudden(A, T, k, t) {
      [A, { x: A.x + 26 * u, y: A.y }].forEach((h) => glow(h, '#FFF7B0', { r: 60, dur: 260 }));
      flash('#ffffff', 160, 80, .6); speedLines(T, { color: '#ffffff', delay: 60, dur: 360 }); act(k, 'dash', 420);
      comet(A, T, { delay: 120, color: '#FFF7B0', size: 30, dur: 200, trail: 14 });
      frame(320); magicCircle(T, { delay: 330, color: '#8ff6ff', glow: '#5b5bff', r: 80, dur: 700, squash: .9, star: 5 });
      bang(above(T, 80), '빵빵!!', { delay: 330, color: '#FFE14D', size: 38 });
      return 340;
    },
    jellypress(A, T, k, t) {
      act(k, 'jump', 700); prop('slime', { from: above(A, 30), to: T, delay: 120, dur: 380, size: 60 });
      frame(500); burst('slime', T, { delay: 500, n: 22, dist: 120, size: 11 }); shockwave(T, '#6be3a4', { delay: 500 });
      bang(above(T, 70), '말랑!', { delay: 510, color: '#6be3a4', size: 36 });
      return 510;
    },
    holysword(A, T, k, t) {
      darken(1200, .5, 0, '#0a0820'); act(k, 'charge', 700); pillar(A, '#FFE46B', { dur: 600, w: 34 });
      prop('sword', { from: above(T, 260), to: { x: T.x, y: T.y - 10 * u }, delay: 520, dur: 220, size: 76 });
      pillar(T, '#FFE46B', { delay: 700, dur: 700, w: 70 }); frame(740);
      for (let i = 0; i < 3; i++) ring(T, { delay: 740 + i * 80, color: ['#fff', '#FFE46B', '#FF8CCB'][i], r1: 170, w: 9 - i * 2 });
      burst('sparkle', T, { delay: 740, n: 26, dist: 150, size: 12 }); bang(above(T, 90), '성검 강림!', { delay: 760, color: '#FFE46B', size: 28 });
      return 760;
    },
    forbidpage(A, T, k, t) {
      // 마도서 앞에 마법진이 열리고, 진 안에서 불꽃 광선과 불덩이가 쏟아진다
      darken(1700, .6, 0, '#12020a'); act(k, 'cast', 1400);
      orbit('page', A, { n: 8, r: 64, dur: 1300, size: 13, turns: 1.8, squash: .55 });
      const C = mid(A, T, .3);
      magicCircle(C, { color: '#FF6A2B', glow: '#FFD23F', r: 74, dur: 1500, spin: 1.4, squash: .45, star: 6 });
      magicCircle(C, { color: '#C77DFF', glow: '#fff', r: 46, dur: 1400, delay: 120, spin: -2, squash: .45, star: 5 });
      for (let i = 0; i < 5; i++) comet({ x: C.x + rnd(-10, 10) * u, y: C.y + rnd(-40, 40) * u }, { x: T.x + rnd(-20, 20) * u, y: T.y + rnd(-20, 20) * u }, { delay: 520 + i * 90, color: '#FF6A2B', size: 16, dur: 260 });
      laser(C, T, { delay: 820, color: '#FF6A2B', w: 30, dur: 520 });
      pillar(T, '#FF4A1F', { delay: 900, dur: 600, w: 60 }); burst('flame', T, { delay: 900, n: 30, dist: 150, size: 13 });
      bang(above(T, 90), '금지된 주문!', { delay: 920, color: '#FF6A2B', size: 26 }); tint(t, 'burn', 600, 920);
      return 940;
    },
    chomp(A, T, k, t) {
      darken(900, .55, 0, '#14061c'); act(k, 'dash', 520); burst('coin', A, { n: 10, dist: 60, size: 10 });
      prop('teeth', { from: above(T, 90), to: { x: T.x, y: T.y - 10 * u }, delay: 280, dur: 160, size: 70 });
      prop('teeth', { from: { x: T.x, y: T.y + 90 * u }, to: { x: T.x, y: T.y + 10 * u }, delay: 280, dur: 160, size: 70, rot0: 3.14, rot1: 3.14 });
      frame(440); bang(above(T, 80), '덥석!!', { delay: 450, color: '#FF5C8A', size: 40 }); burst('wisp', T, { delay: 450, n: 12, dist: 90, size: 10 });
      return 460;
    },
    cicadacry(A, T, k, t) {
      act(k, 'sway', 1000); for (let i = 0; i < 4; i++) ring(A, { delay: i * 120, color: i % 2 ? '#FFE45C' : '#7ED957', r0: 20, r1: 200, w: 6, dur: 500 });
      soundWaves(A, T, { color: '#7ED957', n: 7, gap: 60, delay: 200 }); speedLines(T, { color: '#FFE45C', delay: 400, dur: 520 });
      bang(above(T, 80), '맴맴맴!!', { delay: 400, color: '#FFE45C', size: 30 }); later(() => act(t, 'sway', 500), 400);
      return 760;
    },
    bloodsuck(A, T, k, t) {
      act(k, 'dash', 520); speedLines(T, { color: '#B6FF3C', dur: 300 });
      laser(A, T, { delay: 160, color: '#B6FF3C', w: 5, dur: 260 }); bang(above(T, 60), '쪼옥', { delay: 260, color: '#ff4d6d' });
      spray('broth', T, A, { delay: 420, n: 10, gap: 30, dur: 340, size: 9, arc: 30 }); glow(A, '#ff4d6d', { delay: 600, r: 80 });
      return 400;
    },
    flutter(A, T, k, t) {
      act(k, 'lift', 700); spray('feather', A, T, { n: 18, gap: 18, dur: 420, size: 13, spread: 50, spin: 6 });
      spray('seed', A, T, { delay: 100, n: 12, gap: 20, dur: 380, size: 7, spread: 40 }); windLines(A, T, { n: 12, gap: 24, spread: 60 });
      burst('feather', T, { delay: 460, n: 14, dist: 110, size: 11 }); bang(above(T, 70), '푸드덕!', { delay: 460, color: '#E6E6F2' });
      return 480;
    },
    nyanpunch(A, T, k, t) {
      act(k, 'dash', 900);
      for (let i = 0; i < 5; i++) { const at = { x: T.x + rnd(-30, 30) * u, y: T.y + rnd(-30, 20) * u }; prop('fist', { from: A, to: at, delay: i * 100, dur: 120, size: 28 }); starburst(at, { delay: 120 + i * 100, color: '#FF8CCB', r: 34 }); bang({ x: at.x, y: at.y - 30 * u }, '냥!', { delay: 120 + i * 100, size: 20, dur: 360, color: '#FF8CCB' }); }
      burst('flame', T, { delay: 600, n: 10, dist: 70, size: 9 });
      return 640;
    },
    roachrush(A, T, k, t) {
      darken(1000, .8, 0, '#000000'); act(k, 'vanish', 600);
      speedLines(T, { color: '#c8743a', delay: 300, dur: 420 }); frame(300);
      bang({ x: W / 2, y: H * .4 }, '바선생이다!!!', { delay: 320, color: '#c8743a', size: 34, rot: -.08 });
      later(() => act(t, 'sway', 600), 340); tint(t, 'poison', 600, 400);
      return 480;
    },
    // ===== 등신 =====
    overcome(A, T, k) {
      act(k, 'jump', 700); ring(ground(A), { color: '#3A9BFF', r0: 20, r1: 120, squash: .3, w: 6, dur: 600 });
      burst('drop', ground(A), { n: 14, dist: 70, size: 9 }); bang(above(A, 90), '슬쩍...', { delay: 200, color: '#bfe8ff', size: 26 });
      return 800;
    },
    dice(A, T, k) { act(k, 'throw', 500); return 500; },
    mockspit(A, T, k, t) {
      act(k, 'cast', 600); bang(above(A, 80), '퉤!', { color: '#bfe8ff', size: 34 });
      spray('drop', A, T, { delay: 200, n: 5, gap: 40, dur: 300, size: 8, arc: 50 });
      bang(above(T, 80), '메롱~', { delay: 560, color: '#FF8CCB', size: 26 }); later(() => act(t, 'sway', 500), 560);
      return 900;
    },
    irontail(A, T, k, t) {
      act(k, 'charge', 560); glow(A, '#E3E8EF', { r: 110, dur: 560 }); orbit('spark', A, { n: 8, r: 54, dur: 520, size: 9 });
      bang(above(A, 90), '강철화!', { delay: 100, color: '#E3E8EF', size: 26 });
      later(() => act(k, 'dash', 520), 520);
      swoosh(T, { delay: 620, color: '#c7cdd6', r: 90, a0: -2.8, a1: .4, w: 18, dur: 260 });
      frame(860); shockwave(T, '#E3E8EF', { delay: 860, r: 190 }); cracks(T, { delay: 870 });
      bang(above(T, 90), '철컹!!', { delay: 880, color: '#E3E8EF', size: 38 }); shake(14, 420, 860);
      return 880;
    },
    glasscannon(A, T, k, t) {
      darken(1500, .6, 0, '#05060c'); act(k, 'charge', 900);
      gather(A, '#FFE45C', { dur: 800, n: 30, r: 160 }); orbit('shard', A, { n: 10, r: 60, dur: 900, size: 11, turns: 2 });
      bang(above(A, 90), '유리대포!!', { delay: 200, color: '#FFE45C', size: 30 });
      laser(A, T, { delay: 900, color: '#FFE45C', w: 44, dur: 600 }); bolt(A, T, { delay: 920, dur: 400, w: 6, wob: 26 });
      frame(1000); glow(T, '#FFE45C', { delay: 1000, r: 220, dur: 700 });
      for (let i = 0; i < 4; i++) ring(T, { delay: 1000 + i * 70, color: ['#fff', '#FFE45C', '#fff', '#3A9BFF'][i], r1: 220, w: 12 - i * 2 });
      burst('shard', A, { delay: 1100, n: 14, dist: 70, size: 9 }); shake(18, 600, 1000);
      return 1020;
    },
    ramdeath(A, T, k, t) {
      darken(1200, .55, 0, '#1a0000'); act(k, 'charge', 500); bang(above(A, 80), '돌연사-들이박기', { color: '#ff2a2a', size: 22 });
      later(() => act(k, 'dash', 500), 500); speedLines(T, { color: '#ff6a6a', delay: 480, dur: 400 });
      comet(A, T, { delay: 500, color: '#ff2a2a', size: 30, dur: 220, trail: 14 });
      frame(720); glow(mid(A, T, .7), '#ff2a2a', { delay: 720, r: 240, dur: 800 });
      for (let i = 0; i < 3; i++) ring(T, { delay: 720 + i * 80, color: ['#fff', '#ff2a2a', '#000'][i], r1: 240, w: 14 - i * 3 });
      burst('scrap', T, { delay: 720, n: 24, dist: 180, size: 12 }); bang({ x: W / 2, y: H * .35 }, '💀 쾅!! 💀', { delay: 740, color: '#ff2a2a', size: 36 }); shake(22, 700, 720);
      return 740;
    },
    vinyl(A, T, k) {
      act(k, 'jump', 700); prop('vinyl', { from: { x: A.x + 120 * u, y: A.y - 120 * u }, to: A, dur: 600, size: 40, rot1: 2 });
      bang(above(A, 70), '꿀꺽...', { delay: 600, color: '#ffffff' }); bang(above(A, 110), '?', { delay: 1000, color: '#FFD23F', size: 40 });
      return 1300;
    },
    pufferspike(A, T, k) {
      act(k, 'charge', 600); glow(A, '#C77DFF', { r: 110, dur: 600 });
      for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.283; add(500, (p) => sprite('needle', A.x + Math.cos(a) * (40 + 30 * out(p)) * u, A.y + Math.sin(a) * (40 + 30 * out(p)) * u, 14, a, fade(p, .2)), 120); }
      bang(above(A, 90), '뾰족!', { delay: 200, color: '#C77DFF', size: 34 });
      return 700;
    },
    hydrate(A, T, k) {
      act(k, 'lift', 800); pillar(A, '#3A9BFF', { dur: 700, w: 40 }); fall('drop', A, { n: 18, gap: 25, dur: 360, spread: 40 });
      rise('bubble', A, { delay: 300, n: 10, gap: 40, dur: 500, size: 9 }); bang(above(A, 90), '벌컥벌컥', { delay: 200, color: '#3A9BFF', size: 26 });
      return 900;
    },
    ignite(A, T, k) {
      darken(1200, .55, 0, '#1a0000'); act(k, 'charge', 900); flash('#ff2a1f', 300, 500, .5);
      pillar(A, '#ff3b1f', { delay: 300, dur: 900, w: 80 }); rise('flame', A, { delay: 300, n: 26, gap: 20, dur: 620, size: 14, spread: 60, height: 130 });
      bang({ x: W / 2, y: H * .38 }, '불타올라라!!', { delay: 450, color: '#ff3b1f', size: 36 }); shake(10, 500, 500);
      return 1100;
    },
  });
  // 등신 상태 연출
  // 주사위: 이름표에 가리지 않게 화면 맨 위(DOM)에 크게 띄웁니다.
  const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const dieSVG = (n) => `<svg viewBox="-50 -50 100 100"><rect x="-44" y="-44" width="88" height="88" rx="16" fill="#fff" stroke="${INK}" stroke-width="6"/>${PIPS[n].map(([x, y]) => `<circle cx="${x * 22}" cy="${y * 22}" r="${n === 1 ? 13 : 9}" fill="${n === 1 ? '#E8402C' : INK}"/>`).join('')}</svg>`;
  function dice(key, n) {
    if (REDUCED) return 900;
    measure();
    const box = document.createElement('div');
    box.className = 'dice-pop';
    box.style.setProperty('--sp', SPEED);
    box.innerHTML = `<div class="die">${dieSVG(1)}</div><b></b>`;
    scene.appendChild(box);
    const die = box.querySelector('.die');
    let f = 1;
    const spin = setInterval(() => { f = (f % 6) + 1; die.innerHTML = dieSVG(f); }, 70 * SPEED);
    const c = ['', '#E8402C', '#4CD964', '#FF6A2B', '#4CD964', '#FF8CCB', '#FFD23F'][n];
    setTimeout(() => {
      clearInterval(spin);
      die.innerHTML = dieSVG(n);
      box.classList.add('done');
      box.style.setProperty('--c', c);
      box.querySelector('b').textContent = n === 1 ? '1... 즉사!' : n === 6 ? '6! 대박!' : `${n}!`;
      const at = { x: W / 2, y: H * .42, r: 40 * u, foot: H * .5 };
      glow(at, c, { r: 110, dur: 500 }); ring(at, { color: c, r1: 120, w: 6 });
      if (n === 6) burst('sparkle', at, { n: 18, dist: 130, size: 11 });
    }, 800 * SPEED);
    setTimeout(() => box.remove(), 1700 * SPEED);
    return 1700;
  }
  function splash(key, foeKey) {
    if (REDUCED) return 600;
    measure(); const A = spot(key), T = spot(foeKey);
    act(key, 'throw', 420); comet(A, T, { color: '#3A9BFF', size: 18, dur: 300, arc: 60 }); spray('drop', A, T, { n: 12, gap: 14, dur: 300, size: 9, arc: 60, spread: 20 });
    impact(T, '#3A9BFF', { delay: 300, kind: 'drop' }); bang(above(T, 70), '촤악!', { delay: 320, color: '#3A9BFF', size: 34 });
    return 900;
  }
  function ignite(key, on) {
    if (REDUCED) return 600;
    measure(); const at = spot(key);
    if (on) { glow(at, '#ff3b1f', { r: 160, dur: 700 }); burst('flame', at, { n: 30, dist: 140, size: 13, dur: 600 }); ring(at, { color: '#ff3b1f', r1: 160, w: 10 }); shake(8, 300); return 900; }
    cloud(at, ['#5a5560', '#8a8590', '#3a3540'], { n: 10, dur: 700, size: 24, spread: 40 }); return 700;
  }
  function spiky(key, foeKey, e) {
    if (REDUCED) return 600;
    measure(); const at = spot(key);
    if (e?.on) { burst('needle', at, { n: 14, dist: 70, size: 13, spin: 0 }); glow(at, '#C77DFF', { r: 100 }); return 650; }
    if (foeKey) { const T = spot(foeKey); spray('needle', at, T, { n: 12, gap: 20, dur: 220, size: 14, aim: true }); starburst(T, { delay: 240, color: '#C77DFF', r: 50 }); bang(above(T, 60), '푹!', { delay: 250, color: '#C77DFF', size: 34 }); shake(8, 260, 240); return 820; }
    bang(above(at, 60), '아야!', { color: '#C77DFF', size: 30 }); burst('needle', at, { n: 10, dist: 40, size: 11 }); tint(key, 'poison', 400); return 800;
  }
  function hydrate(key) { if (REDUCED) return; measure(); const at = spot(key); rise('drop', at, { n: 8, gap: 40, dur: 500, size: 9 }); glow(at, '#3A9BFF', { r: 90, dur: 500 }); }

  function weatherFx(w) {
    if (w === 'sun') {
      const c = { x: W * .72, y: H * .2 };
      for (let i = 0; i < 12; i++) ring(c, { delay: i * 26, color: '#FFD23F', r0: 20, r1: 150, dur: 620, w: 5 });
      flash('#FFD23F', 700, 80, .5);
      return 1100;
    }
    if (w === 'rain') {
      cloud({ x: W / 2, y: 26 * u }, ['#3a3550', '#59606c', '#7a8298'], { n: 16, dur: 1000, size: 34, spread: 180 });
      for (let i = 0; i < 40; i++) {
        const x = rnd(0, W);
        add(420, (p) => sprite('drop', x, p * H, 6, 0, fade(p, .1)), 200 + i * 18);
      }
      return 1250;
    }
    if (w === 'snow') {
      cloud({ x: W / 2, y: 22 * u }, ['#dfe8f2', '#ffffff', '#c9d6e6'], { n: 14, dur: 1000, size: 34, spread: 180 });
      for (let i = 0; i < 46; i++) {
        const x = rnd(0, W), sway = rnd(-30, 30) * u;
        add(900, (p) => sprite('snow', x + Math.sin(p * 6) * sway, p * H, 7, p * 4, fade(p, .15)), 150 + i * 16);
      }
      flash('#ffffff', 700, 100, .4);
      return 1300;
    }
    if (w === 'dust') {
      const left = { x: -30 * u, y: H * .5 }, right = { x: W + 30 * u, y: H * .5 };
      spray('dust', left, right, { n: 60, gap: 12, dur: 620, size: 16, spread: 120 });
      flash('#D9B66A', 900, 100, .45);
      return 1250;
    }
    return 700;
  }

  /* ---------- 바깥에서 부르는 함수 ---------- */
  // 모든 기술: 타입 색 기 모으기 + 맞는 순간 임팩트. 전용기는 이름 컷인이 먼저 나옵니다.
  const NO_CUT = new Set(['bangalzzuk', 'forge', 'reflector']);
  function play(id, key, target, e) {
    const foe = target || (key === 'me' ? 'opp' : 'me');
    const run = MOVE_FX[id] || MOVE_FX.tackle;
    if (REDUCED) return 500;
    measure();
    const mv = typeof G !== 'undefined' ? G.data?.MOVES?.[id] : null;
    const type = e?.type || mv?.type || 'none', col = TYPE_C[type] || '#fff';
    const A = spot(key), T = spot(foe);
    const pre = mv?.sig && !NO_CUT.has(id) ? sigIntro(A, key, e?.move || mv.n, col) : 0;
    OFF = pre;
    let d;
    try {
      glow(A, col, { r: 70, dur: 320, a: .6 });
      d = run(spot(key), spot(foe), key, foe, e) || 700;
      UNDER = true;
      if ((e?.cat || mv?.cat) === 'p' && !mv?.sig) speedLines(T, { delay: Math.max(0, d - 120), dur: 260, n: 20, color: col });
      if ((e?.cat || mv?.cat) !== 'x' && id !== 'ramdeath' && id !== 'overcome') impact(T, col, { delay: Math.max(0, d - 40), big: mv?.sig ? 1.25 : .85, kind: TYPE_P[type] || 'sparkle' });
      else ring(A, { color: col, r0: 20, r1: 110, w: 5, dur: 480 });
    } finally { OFF = 0; UNDER = false; }
    return pre + d + (mv?.sig ? 260 : 160);
  }
  function status(key, s) {
    if (REDUCED || !s) return;
    measure();
    const at = spot(key);
    ({
      brn: () => { rise('flame', at, { n: 8, gap: 50, dur: 520, size: 8 }); tint(key, 'burn', 620); },
      psn: () => { rise('bubble', at, { n: 9, gap: 50, dur: 560, size: 7 }); tint(key, 'poison', 620); },
      par: () => { burst('spark', at, { n: 12, dist: 62, size: 8 }); tint(key, 'zap', 520); },
      slp: () => { rise('z', at, { n: 4, gap: 120, dur: 560, size: 9, spread: 24 }); },
      frz: () => { burst('shard', at, { n: 12, dist: 60, size: 9 }); ring(at, { color: '#BCE9F2', r1: 76 }); tint(key, 'cold', 620); },
    }[s] || (() => {}))();
  }
  function statusTick(key, s) { if (!REDUCED) status(key, s); }
  function heal(key) { if (!REDUCED) { measure(); rise('heart', spot(key), { n: 6, gap: 60, dur: 520, size: 7 }); } }
  function stage(key, up) { if (!REDUCED) { measure(); rise(up ? 'arrowUp' : 'arrowDown', spot(key), { n: 4, gap: 90, dur: 460, size: 9, spread: 34, height: up ? 60 : -40 }); } }
  /* ---------- Z기술 필살 연출 (약 2.5초) ---------- */
  function zAura(A, color) {
    act(A.key, 'charge', 900);
    add(900, (p) => {
      ctx.globalAlpha = .6 * Math.sin(p * 3.14);
      const g = ctx.createRadialGradient(A.x, A.y, 4, A.x, A.y, A.r * 2.2);
      g.addColorStop(0, '#fff'); g.addColorStop(.35, color); g.addColorStop(1, 'transparent');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(A.x, A.y, A.r * 2.2, 0, 7); ctx.fill();
    });
    for (let i = 0; i < 3; i++) ring(A, { delay: i * 220, color, r0: 170, r1: 14, dur: 380, w: 8 });
    orbit('sparkle', A, { n: 12, r: 70, dur: 880, size: 9, turns: 2.2, squash: .7 });
    add(900, (p) => { ctx.globalAlpha = .65 * Math.min(1, p * 3); ctx.fillStyle = '#0d0a14'; ctx.fillRect(0, 0, W, H); });
  }
  function zImpact(T, color, delay) {
    flash('#fff', 360, delay, .95);
    flash(color, 700, delay + 120, .55);
    ['#fff', color, '#FFD23F'].forEach((c, i) => ring(T, { delay: delay + i * 90, color: c, r1: 230, dur: 650, w: 14 - i * 3 }));
    burst('sparkle', T, { delay, n: 28, dist: 190, size: 14, dur: 700 });
    shake(16, 750, delay);
  }
  // 하늘에서 거대한 물체가 떨어지는 공통 연출
  const meteor = (kind, T, size, delay, dur = 420) => prop(kind, { from: { x: T.x + 60 * u, y: -60 * u }, to: T, delay, dur, size, rot1: 4 });
  const Z_FX = {
    fire(A, T) { for (let i = 0; i < 3; i++) meteor('flame', { x: T.x + (i - 1) * 46 * u, y: T.y }, 60 - i * 8, 900 + i * 120); burst('flame', T, { delay: 1300, n: 40, dist: 200, size: 16, dur: 800 }); return 1300; },
    water(A, T) {
      add(1100, (p) => {
        const x = lerp(-60 * u, W + 60 * u, out(p)), h = 220 * u * Math.sin(Math.min(1, p * 1.4) * 3.14);
        ctx.fillStyle = '#2F7DE1'; ctx.strokeStyle = INK; ctx.lineWidth = 4 * u;
        ctx.beginPath(); ctx.moveTo(x - 160 * u, H); ctx.quadraticCurveTo(x - 40 * u, H - h, x + 30 * u, H - h * .9); ctx.quadraticCurveTo(x + 70 * u, H - h * 1.05, x + 50 * u, H - h * .6); ctx.lineTo(x + 60 * u, H); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#BFE4FF'; ctx.lineWidth = 3 * u; ctx.beginPath(); ctx.moveTo(x - 120 * u, H - h * .5); ctx.quadraticCurveTo(x - 30 * u, H - h * .95, x + 30 * u, H - h * .85); ctx.stroke();
      }, 850);
      burst('drop', T, { delay: 1250, n: 36, dist: 180, size: 10 });
      return 1300;
    },
    grass(A, T) { for (let i = 0; i < 10; i++) whip(ground(T), { x: T.x + rnd(-80, 80) * u, y: T.y - rnd(30, 120) * u }, { delay: 880 + i * 45, color: i % 2 ? '#3FA34D' : '#7ED08A', curve: rnd(-90, 90), dur: 700, w: 9 }); orbit('leaf', T, { delay: 900, n: 22, r: 110, dur: 1000, size: 12, turns: 2.5 }); return 1250; },
    elec(A, T) { for (let i = 0; i < 8; i++) bolt({ x: T.x + rnd(-120, 120) * u, y: -10 }, { x: T.x + rnd(-40, 40) * u, y: T.y + rnd(-20, 30) * u }, { delay: 880 + i * 110, dur: 280, w: 9, wob: 34, flick: 2 }); [900, 1120, 1340].forEach((d) => flash('#FFF7C2', 160, d, .6)); tint(T.key, 'zap', 1100, 880); return 1350; },
    ice(A, T) { for (let i = 0; i < 9; i++) { const x = T.x + (i - 4) * 26 * u, h = 60 + (4 - Math.abs(i - 4)) * 22; add(900, (p) => { const k = out(Math.min(1, p * 2.5)); sprite('shard', x, T.foot - h * u * k / 2, h / 5 * k + 1, 0, fade(p, .25)); }, 880 + Math.abs(i - 4) * 60); } add(1100, (p) => { ctx.globalAlpha = .5 * Math.sin(p * 3.14); ctx.fillStyle = '#E8F8FF'; ctx.fillRect(0, 0, W, H); }, 880); tint(T.key, 'cold', 1000, 1000); return 1300; },
    earth(A, T) { meteor('rock', T, 90, 880, 380); cracks(T, { delay: 1260, dur: 900 }); cracks(T, { delay: 1300, dur: 900 }); burst('rock', ground(T), { delay: 1260, n: 30, dist: 190, size: 12 }); burst('dust', ground(T), { delay: 1240, n: 30, dist: 220, size: 18 }); return 1300; },
    wind(A, T) { tornado(T, { delay: 880, dur: 1300, color: '#E6FFF4' }); windLines({ x: -20, y: T.y }, { x: W + 20, y: T.y }, { delay: 880, n: 24, gap: 30, spread: 120 }); act(T.key, 'lift', 1300); return 1350; },
    poison(A, T) { cloud(T, ['#9A4FB8', '#6c3a86', '#C993DD', '#3a1a4a'], { delay: 880, n: 26, dur: 1100, size: 40, spread: 130 }); rise('bubble', T, { delay: 950, n: 18, gap: 40, dur: 800, size: 10, spread: 90 }); tint(T.key, 'poison', 1000, 1000); return 1350; },
    steel(A, T) { for (let i = 0; i < 12; i++) prop(i % 2 ? 'scrap' : 'can', { from: { x: T.x + rnd(-140, 140) * u, y: -40 * u }, to: { x: T.x + rnd(-40, 40) * u, y: T.y + rnd(-20, 20) * u }, delay: 880 + i * 50, dur: 260, size: 24, rot1: 9 }); meteor('hammer', T, 80, 1300, 220); return 1300; },
    spirit(A, T) { add(1200, (p) => { ctx.globalAlpha = .75 * Math.sin(p * 3.14); ctx.fillStyle = '#1a0a3a'; ctx.fillRect(0, 0, W, H); }, 880); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; spray('wisp', { x: T.x + Math.cos(a) * 200 * u, y: T.y + Math.sin(a) * 140 * u }, T, { n: 1, delay: 900 + i * 60, dur: 420, size: 18, spread: 0 }); } ring(T, { delay: 1300, color: '#7A6BE0', r1: 200, w: 14 }); return 1300; },
    fairy(A, T) { for (let i = 0; i < 3; i++) ring(T, { delay: 880 + i * 120, color: ['#F27FA5', '#fff', '#37e0ff'][i], r0: 220, r1: 10, dur: 400, w: 10 }); burst('pheart', T, { delay: 1300, n: 30, dist: 200, size: 13 }); burst('sparkle', T, { delay: 1300, n: 30, dist: 230, size: 12 }); return 1300; },
    none(A, T) { act(A.key, 'dash', 700); return 1100; },
    normal(A, T) { act(A.key, 'dash', 700); speedLines(T, { delay: 760, dur: 500 }); for (let i = 0; i < 3; i++) starburst(T, { delay: 900 + i * 110, color: ['#fff', '#F5EBD0', '#FFD23F'][i], r: 120 - i * 20 }); frame(880); return 1200; },
  };
  // 루미나·실비아 Z 마무리: 필드에 직접 떨어지는 전용 피니시
  function zFinish(species, A, T) {
    if (species === 'lumina') {
      darken(1500, .6);
      runeCircle(T, { color: '#37E0FF', glow: '#FF7FD0', r: 120, dur: 1400, spin: 3, star: 6 });
      runeCircle({ x: T.x, y: T.y - 150 * u, r: T.r }, { color: '#FF7FD0', glow: '#fff', r: 90, dur: 1300, spin: -2.4, squash: .35 });
      for (let i = 0; i < 9; i++) bolt({ x: T.x + rnd(-110, 110) * u, y: -20 }, { x: T.x + rnd(-30, 30) * u, y: T.y + rnd(-20, 30) * u }, { delay: 300 + i * 85, dur: 260, w: 9, wob: 30, color: i % 3 ? '#FFE45C' : '#9ad8ff', flick: 3 });
      ['#fff', '#37E0FF', '#FF7FD0', '#FFE45C'].forEach((c, i) => ring(T, { delay: 1050 + i * 80, color: c, r1: 230, dur: 600, w: 12 - i * 2 }));
      burst('shard', T, { delay: 1050, n: 34, dist: 220, size: 13, dur: 700 });
      flash('#E8F8FF', 320, 1040, .9);
      shake(22, 700, 1040);
      return 1900;
    }
    darken(1400, .55, 0, '#04140c');
    tornado(A, { dur: 900, color: '#B8FFD9' });
    for (let i = 0; i < 3; i++) beam(A, T, { delay: 420 + i * 60, color: i ? '#6CF2C2' : '#fff', core: '#fff', w: 30 - i * 8, dur: 360 });
    windLines(A, T, { delay: 380, n: 18, gap: 16, spread: 70, dur: 260 });
    spray('crescent', A, T, { delay: 420, n: 14, gap: 20, dur: 240, size: 18, spread: 40, aim: true });
    for (let i = 0; i < 4; i++) slash(T, { delay: 640 + i * 60, angle: rnd(-1.2, 1.2), len: 180, color: i % 2 ? '#6CF2C2' : '#fff', w: 9 });
    ['#fff', '#6CF2C2', '#3FA34D'].forEach((c, i) => ring(T, { delay: 680 + i * 80, color: c, r1: 230, dur: 560, w: 12 - i * 3 }));
    burst('leaf', T, { delay: 680, n: 30, dist: 210, size: 12, dur: 700 });
    flash('#E6FFF4', 280, 660, .85);
    shake(20, 650, 660);
    return 1550;
  }

  function zmove(type, key, target, species) {
    if (REDUCED) return 900;
    measure();
    const foe = target || (key === 'me' ? 'opp' : 'me');
    const A = { ...spot(key), key }, T = { ...spot(foe), key: foe };
    if (species === 'lumina' || species === 'silvia') return zFinish(species, A, T) + 200;
    const color = { fire: '#F2622E', water: '#2F7DE1', grass: '#3FA34D', elec: '#FFE45C', ice: '#7fe0f0', earth: '#C98F5E', wind: '#CFEDE1', poison: '#B86BE0', steel: '#D7DDE5', spirit: '#7A6BE0', fairy: '#F27FA5', normal: '#F5EBD0' }[type] || '#fff';
    zAura(A, color);
    beam(A, T, { delay: 760, color, core: '#fff', w: 36, dur: 520 });
    const hit = (Z_FX[type] || Z_FX.none)(A, T);
    zImpact(T, color, hit);
    return hit + 950;
  }

  // 메가진화: 빛을 모으는 앞부분과 변신이 끝나는 뒷부분
  function megaStart(key) {
    if (REDUCED) return;
    measure();
    const at = spot(key);
    act(key, 'charge', 1100);
    add(1100, (p) => { ctx.globalAlpha = .55 * Math.min(1, p * 2); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); });
    ['#E8402C', '#FFD23F', '#3CC9A7', '#2F7DE1', '#9A4FB8'].forEach((c, i) => ring(at, { delay: i * 170, color: c, r0: 150, r1: 16, dur: 420, w: 7 }));
    orbit('sparkle', at, { n: 10, r: 86, dur: 1050, size: 10, turns: 2, squash: .8 });
  }
  function megaEnd(key) {
    if (REDUCED) return;
    measure();
    const at = spot(key);
    flash('#fff', 460, 0, .95);
    ['#FFD23F', '#E8402C', '#9A4FB8'].forEach((c, i) => ring(at, { delay: i * 90, color: c, r1: 190, dur: 560, w: 10 }));
    burst('sparkle', at, { n: 26, dist: 170, size: 13, dur: 640 });
    shake(11, 420);
  }

  /* ---------- 루미나·실비아 전용 연출 ---------- */
  // 바닥에 눕힌 마법진 (돌면서 커짐)
  function runeCircle(at, { color = '#37E0FF', glow = '#fff', r = 90, dur = 1000, delay = 0, spin = 2, star = 6 } = {}) {
    add(dur, (p) => {
      const k = out(Math.min(1, p * 2.2)), R = r * u * k, a = p * spin * 3.14;
      ctx.save(); ctx.translate(at.x, at.foot); ctx.scale(1, .34); ctx.rotate(a);
      ctx.globalAlpha = fade(p, .3);
      ctx.shadowColor = color; ctx.shadowBlur = 18 * u;
      ctx.strokeStyle = color; ctx.lineWidth = 4 * u;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.stroke();
      ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(0, 0, R * .82, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, R * .36, 0, 7); ctx.stroke();
      ctx.strokeStyle = glow; ctx.lineWidth = 2.4 * u; ctx.beginPath();
      for (let i = 0; i <= star; i++) { const t = (i * 2 * 6.283) / star; const x = Math.cos(t) * R * .82, y = Math.sin(t) * R * .82; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      for (let i = 0; i < 24; i++) { const t = (i / 24) * 6.283; ctx.fillStyle = i % 3 ? color : glow; ctx.fillRect(Math.cos(t) * R * .91 - 2 * u, Math.sin(t) * R * .91 - 2 * u, 4 * u, 4 * u); }
      ctx.restore();
    }, delay);
  }
  function darken(dur, alpha = .55, delay = 0, color = '#05060c') { add(dur, (p) => { ctx.globalAlpha = alpha * Math.sin(Math.min(1, p) * 3.14); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); }, delay); }

  // 옷이 바뀔 때: 각성 연출 (단계가 높을수록 더 크게)
  function awaken(key, species, stage = 1) {
    if (REDUCED) return 600;
    measure();
    const at = spot(key), big = .8 + stage * .15;
    if (species === 'lumina') {
      darken(1300, .5 + stage * .06);
      runeCircle(at, { color: '#37E0FF', glow: '#FF7FD0', r: 95 * big, dur: 1300, spin: 2.4 });
      runeCircle(at, { color: '#FF7FD0', glow: '#fff', r: 60 * big, dur: 1200, delay: 120, spin: -3, star: 5 });
      act(key, 'charge', 1000);
      for (let i = 0; i < 2 + stage; i++) bolt({ x: at.x + rnd(-70, 70) * u, y: -10 }, { x: at.x + rnd(-14, 14) * u, y: at.y - at.r * .6 }, { delay: 280 + i * 120, dur: 260, w: 7, wob: 26, color: i % 2 ? '#FFE45C' : '#9ad8ff', flick: 2 });
      orbit('shard', at, { delay: 200, n: 8 + stage * 3, r: 70 * big, dur: 1000, size: 9, turns: 2, squash: .55 });
      ['#fff', '#37E0FF', '#FF7FD0'].forEach((c, i) => ring(at, { delay: 620 + i * 90, color: c, r1: 150 * big, dur: 560, w: 10 - i * 2 }));
      burst('sparkle', at, { delay: 620, n: 22 + stage * 4, dist: 140 * big, size: 11, dur: 640 });
      flash('#E8F8FF', 260, 600, .7);
    } else {
      darken(1300, .45 + stage * .06, 0, '#04140c');
      runeCircle(at, { color: '#6CF2C2', glow: '#fff', r: 90 * big, dur: 1300, spin: 3, star: 8 });
      tornado(at, { dur: 1100, color: '#B8FFD9' });
      windLines({ x: -20, y: at.y - 30 * u }, { x: W + 20, y: at.y + 20 * u }, { delay: 150, n: 10 + stage * 3, gap: 30, spread: 90 });
      orbit('leaf', at, { delay: 100, n: 10 + stage * 3, r: 80 * big, dur: 1100, size: 10, turns: 2.6, rising: 40, squash: .6 });
      for (let i = 0; i < 2 + stage; i++) slash(at, { delay: 500 + i * 70, angle: rnd(-1.4, 1.4), len: 130 * big, color: i % 2 ? '#6CF2C2' : '#fff', w: 6 });
      ['#fff', '#6CF2C2', '#3FA34D'].forEach((c, i) => ring(at, { delay: 620 + i * 90, color: c, r1: 150 * big, dur: 560, w: 10 - i * 2 }));
      burst('crescent', at, { delay: 620, n: 12 + stage * 2, dist: 150 * big, size: 13, dur: 600 });
      flash('#E6FFF4', 240, 600, .6);
    }
    shake(6 + stage * 3, 420, 620);
    return 1250;
  }
  // 강화 성공: 망치질 불꽃 → 재료 색 빛기둥 → 폭발
  const TIER_C = ['#C98F5E', '#8a8f98', '#FFD23F', '#9FF3FF', '#9A4FB8'];
  // ===== 단조: 특성검술과 리플렉터 =====
  const BLADE = {
    fire: ['#ff5a1f', '#ffd23f', 'flame'], water: ['#2f9bff', '#bfe8ff', 'drop'], grass: ['#3fbf4a', '#c8ff6a', 'leaf'],
    elec: ['#ffe14d', '#ffffff', 'spark'], ice: ['#7fdcff', '#ffffff', 'shard'], earth: ['#b07a3a', '#e6c48a', 'rock'],
    wind: ['#6fe0c0', '#e6fff4', 'crescent'], poison: ['#9a4fb8', '#e0a8ff', 'glob'], spirit: ['#6a5cff', '#c9b8ff', 'wisp'],
    fairy: ['#ff8ccb', '#ffffff', 'petal'], steel: ['#c7cdd6', '#ffffff', 'spark'],
  };
  function elemBlade(A, T, k, t, type) {
    const [c, c2, p] = BLADE[type] || BLADE.steel;
    darken(1500, .5);
    ring(A, { color: c, r0: 10, r1: 70, dur: 360, w: 6 }); ring(A, { delay: 120, color: c2, r0: 6, r1: 50, dur: 300, w: 4 });
    rise(p, A, { n: 10, dur: 420, size: 8, spread: 26, height: 70, gap: 25 });
    act(k, 'lunge', 620);
    windLines(A, T, { delay: 260, n: 8, gap: 14, dur: 200, spread: 30, color: c2 });
    slash(T, { delay: 340, angle: -.9, len: 180, color: c, w: 13, dur: 280 });
    slash(T, { delay: 430, angle: .75, len: 160, color: c2, w: 10, dur: 260 });
    slash(T, { delay: 520, angle: 0, len: 210, color: '#ffffff', w: 6, dur: 240 });
    flash(c, 200, 470, .45); flash('#ffffff', 120, 540, .35);
    ring(T, { delay: 470, color: c, r1: 170, w: 9, dur: 520 }); ring(T, { delay: 540, color: c2, r1: 120, w: 5, dur: 420 });
    burst(p, T, { delay: 470, n: 22, dist: 110, size: 11, dur: 560 });
    shake(12, 460, 470);
    const X = {
      fire: () => { rise('flame', T, { delay: 520, n: 16, dur: 700, size: 12, spread: 50, height: 140, gap: 30 }); tint(t, 'burn', 600, 520); },
      water: () => { orbit('drop', T, { delay: 480, n: 16, r: 74, dur: 760, size: 9, turns: 2 }); orbit('bubble', T, { delay: 520, n: 8, r: 40, dur: 700, size: 7, turns: -2 }); },
      grass: () => { whip(A, T, { delay: 120, color: c, w: 7 }); spray('leaf', T, A, { delay: 700, n: 10, gap: 30, dur: 380, size: 8, arc: 20 }); },
      elec: () => { bolt({ x: T.x, y: -20 }, T, { delay: 420, dur: 420, w: 6 }); bolt({ x: T.x - 40 * u, y: -20 }, T, { delay: 520, dur: 360, w: 3 }); tint(t, 'zap', 500, 480); },
      ice: () => { fall('shard', T, { delay: 420, n: 12, dur: 380, size: 14, spread: 60, gap: 35 }); burst('snow', T, { delay: 600, n: 16, dist: 90 }); tint(t, 'cold', 600, 520); },
      earth: () => { cracks(T, { delay: 480 }); burst('rock', ground(T), { delay: 500, n: 14, dist: 90, size: 10 }); burst('dust', ground(T), { delay: 480, n: 14, dist: 100, size: 12 }); },
      wind: () => { tornado(T, { delay: 400, dur: 800, color: c }); windLines(A, T, { delay: 500, n: 10, gap: 12, dur: 240, spread: 50, color: c }); },
      poison: () => { cloud(T, ['#9a4fb8', '#c77dff', '#5b2a7a'], { delay: 480, n: 12, dur: 800, size: 22, spread: 50 }); tint(t, 'poison', 600, 520); },
      spirit: () => { orbit('wisp', T, { delay: 420, n: 10, r: 70, dur: 800, size: 10, turns: 1.5 }); tint(t, 'hex', 600, 500); darken(500, .4, 600, '#1a0f40'); },
      fairy: () => { burst('sparkle', T, { delay: 520, n: 24, dist: 130, size: 10, dur: 640 }); rise('petal', T, { delay: 540, n: 12, dur: 700, size: 9, spread: 60, height: 110, gap: 30 }); },
      steel: () => { for (let i = 0; i < 3; i++) slash(T, { delay: 620 + i * 70, angle: -1.2 + i * 1.2, len: 140, color: '#fff', w: 5 }); burst('spark', T, { delay: 640, n: 20, dist: 90, size: 8 }); },
    };
    (X[type] || X.steel)();
    return 1500;
  }
  // 방패: 단조 앞에 빛나는 육각 방패
  function hexShield(at, toward, { delay = 0, dur = 900, color = '#FFD23F', size = 62 } = {}) {
    const dx = toward.x - at.x, dy = toward.y - at.y, d = Math.hypot(dx, dy) || 1;
    const cx = at.x + dx / d * at.r * .9, cy = at.y + dy / d * at.r * .5;
    add(dur, (p) => {
      const grow = out(Math.min(1, p * 3)), a = fade(p, .25), r = size * u * grow;
      ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(p * .6);
      const hex = (rr) => { ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = i / 6 * 6.283; ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); } ctx.closePath(); };
      ctx.shadowColor = color; ctx.shadowBlur = 24 * u;
      hex(r); ctx.fillStyle = 'rgba(255,230,140,.22)'; ctx.fill();
      ctx.lineWidth = 5 * u; ctx.strokeStyle = color; ctx.stroke();
      hex(r * .66); ctx.lineWidth = 2.5 * u; ctx.strokeStyle = '#fff'; ctx.stroke();
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const t = i / 6 * 6.283; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t) * r * .66, Math.sin(t) * r * .66); } ctx.lineWidth = 1.5 * u; ctx.stroke();
    }, delay);
    return { x: cx, y: cy, r: size * u };
  }
  function reflectReady(key) {
    if (REDUCED) return 600;
    measure();
    const at = spot(key), foe = spot(key === 'me' ? 'opp' : 'me');
    darken(900, .35);
    ring(ground(at), { color: '#FFD23F', r0: 20, r1: 110, squash: .3, w: 6, dur: 600 });
    hexShield(at, foe, { dur: 1000 });
    rise('sparkle', at, { delay: 100, n: 12, dur: 600, size: 8, spread: 50, height: 90, gap: 30 });
    flash('#fff3c2', 160, 200, .35);
    return 1000;
  }
  function reflect(key, by, counter) {
    if (REDUCED) return 600;
    measure();
    const at = spot(key), from = spot(by);
    const s = hexShield(at, from, { dur: 760, color: counter ? '#FFD23F' : '#9FF3FF', size: 70 });
    for (let i = 0; i < 3; i++) ring(s, { delay: 80 + i * 90, color: i % 2 ? '#fff' : (counter ? '#FFD23F' : '#9FF3FF'), r0: 20, r1: 110, w: 6 - i, dur: 380 });
    burst('shard', s, { delay: 80, n: 16, dist: 90, size: 9, dur: 420 });
    burst('spark', s, { delay: 60, n: 14, dist: 70, size: 7, dur: 320 });
    flash('#ffffff', 140, 60, .5); shake(8, 260, 60);
    return 720;
  }
  function counter(key, target, stab) {
    if (REDUCED) return 600;
    measure();
    const A = spot(key), T = spot(target);
    darken(1100, .55);
    act(key, 'lunge', 600);
    beam(A, T, { delay: 120, color: '#FFD23F', core: '#fff', w: 10, dur: 260 });
    windLines(A, T, { delay: 80, n: 10, gap: 10, dur: 180, spread: 26, color: '#fff3c2' });
    slash(T, { delay: 300, angle: -.15, len: 220, color: '#fff', w: 10, dur: 220 });
    if (!stab) { slash(T, { delay: 380, angle: -.9, len: 170, color: '#FFD23F', w: 9 }); slash(T, { delay: 450, angle: .9, len: 170, color: '#FFD23F', w: 9 }); }
    ring(T, { delay: 320, color: '#FFD23F', r1: 160, w: 9, dur: 480 }); ring(T, { delay: 380, color: '#fff', r1: 110, w: 5, dur: 400 });
    burst('spark', T, { delay: 320, n: 22, dist: 110, size: 9, dur: 480 });
    burst('shard', T, { delay: 360, n: 10, dist: 80, size: 8 });
    flash('#ffffff', 160, 320, .6); flash('#FFD23F', 220, 380, .3);
    shake(stab ? 9 : 14, 420, 320);
    tint(target, 'zap', 300, 340);
    return 1100;
  }

  // 투혼 광폭화: 폼이 오를수록 붉은 기운이 커짐
  const RAGE_C = ['#c7cdd6', '#ff8a3d', '#ff5a1f', '#ff2a2a', '#d4001a', '#ff0040'];
  function rage(key, form, up) {
    if (REDUCED) return 600;
    measure();
    const at = spot(key), c = RAGE_C[form] || '#ff2a2a', k = .6 + form * .2;
    if (!up) { ring(at, { color: '#9fd4ff', r1: 90, dur: 500, w: 4 }); return 600; }
    darken(900, .3 + form * .07, 0, '#2a0005');
    for (let i = 0; i < 2 + form; i++) ring(at, { delay: i * 80, color: i % 2 ? '#ffd23f' : c, r0: 20, r1: 110 * k, dur: 420, w: 7 });
    rise('flame', at, { delay: 100, n: 8 + form * 4, dur: 600, size: 10 + form, spread: 50, height: 100 + form * 15, gap: 22 });
    burst('spark', at, { delay: 180, n: 14 + form * 4, dist: 90 * k, size: 8 });
    if (form >= 3) burst('shard', at, { delay: 220, n: 12, dist: 120, size: 10 });
    flash(c, 260, 260, .25 + form * .06);
    shake(4 + form * 2, 420, 240);
    return 1000;
  }
  // 반갈쭉: 골목몬 그림을 두 쪽으로 나눠 벌리고, 가운데에 단면을 보여 줌
  const FILL_FACE = {
    pat: `<ellipse cx="20" cy="50" rx="12" ry="34" fill="#5a1f2a"/>${[[16, 32], [24, 44], [17, 58], [23, 70], [19, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.8" fill="#8a2f3a"/>`).join('')}`,
    cream: `<ellipse cx="20" cy="50" rx="12" ry="34" fill="#FFE39A"/><path d="M14 36q6 6 12 0M13 56q7 6 14 0" fill="none" stroke="#fff6cf" stroke-width="2.4"/>`,
    pizza: `<ellipse cx="20" cy="50" rx="12" ry="34" fill="#E8402C"/><path d="M10 40q10 6 20 0M10 62q10-6 20 0" fill="none" stroke="#FFD23F" stroke-width="3.4"/>${[[17, 30], [23, 52], [16, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#9e1b26" stroke="#1a1433" stroke-width="1"/>`).join('')}`,
  };
  const FILL_NAME = { pat: '팥', cream: '슈크림', pizza: '피자' };
  function splitOpen(key, fill) {
    const box = document.getElementById(`m-${key}`);
    const art = box?.querySelector('svg');
    if (!box || !art || REDUCED) return 600;
    const ms = 1100;
    const wrap = document.createElement('div');
    wrap.className = 'split-wrap';
    wrap.style.setProperty('--d', `${ms * SPEED}ms`);
    wrap.innerHTML = `<div class="split-half split-l">${art.outerHTML}</div><div class="split-half split-r">${art.outerHTML}</div>
      <svg class="split-face" viewBox="0 0 40 100" aria-hidden="true"><ellipse cx="20" cy="50" rx="18" ry="46" fill="#D9903A" stroke="#1a1433" stroke-width="3"/><ellipse cx="20" cy="50" rx="15" ry="42" fill="#F2C98A"/>${FILL_FACE[fill] || FILL_FACE.pat}</svg>
      <span class="split-tag">${FILL_NAME[fill] || ''}</span>`;
    art.style.visibility = 'hidden';
    box.appendChild(wrap);
    setTimeout(() => { wrap.remove(); art.style.visibility = ''; }, ms * SPEED);
    return ms - 200;
  }

  // 분노의 도끼
  function rageAxe(A, T, k, t) {
    darken(1100, .45, 0, '#2a0005');
    act(k, 'lunge', 560);
    rise('flame', A, { n: 8, dur: 420, size: 10, spread: 30, height: 80, gap: 20 });
    slash(T, { delay: 300, angle: -1.25, len: 200, color: '#ff5a1f', w: 16, dur: 260 });
    slash(T, { delay: 360, angle: -1.25, len: 170, color: '#ffd23f', w: 6, dur: 240 });
    cracks(T, { delay: 420 }); ring(ground(T), { delay: 420, color: '#ff5a1f', r1: 170, squash: .3, w: 8, dur: 520 });
    burst('flame', T, { delay: 420, n: 20, dist: 110, size: 12, dur: 560 }); burst('rock', ground(T), { delay: 440, n: 12, dist: 90, size: 9 });
    flash('#ff3a1a', 220, 420, .45); shake(16, 480, 420); tint(t, 'burn', 600, 460);
    return 1200;
  }

  function forge(key, tier = 1) {
    if (REDUCED) return 700;
    measure();
    const plus = Math.max(0, tier - 4); tier = Math.min(tier, 4);
    const at = spot(key), c = TIER_C[tier] || '#fff', big = .8 + tier * .14 + plus * .04;
    for (let i = 0; i < plus; i++) ring(at, { delay: 700 + i * 60, color: i % 2 ? '#ff4fd8' : '#b26bff', r1: 170 + i * 12, dur: 600, w: 5 });
    darken(1100, .35 + tier * .05);
    for (let i = 0; i < 3; i++) { burst('spark', { x: at.x + rnd(-20, 20) * u, y: at.y - at.r * .2 }, { delay: i * 150, n: 10, dist: 60, size: 7, dur: 260 }); ring(at, { delay: i * 150, color: '#FFD23F', r0: 20, r1: 60, dur: 220, w: 4 }); }
    shake(4, 150, 0); shake(4, 150, 150); shake(5, 150, 300);
    beam({ x: at.x, y: -20 }, { x: at.x, y: at.foot || at.y + at.r }, { delay: 460, color: c, core: '#fff', w: 60 * big, dur: 520 });
    ['#fff', c, '#FFD23F'].forEach((cc, i) => ring(at, { delay: 520 + i * 80, color: cc, r1: 150 * big, dur: 520, w: 10 - i * 2 }));
    burst(tier >= 3 ? 'shard' : 'sparkle', at, { delay: 520, n: 18 + tier * 5, dist: 140 * big, size: 11, dur: 620 });
    rise('spark', at, { delay: 600, n: 10 + tier * 2, dur: 600, size: 7, spread: 50, height: 120 });
    flash(tier >= 4 ? '#d9b3ff' : '#fff', 220, 520, .6 + tier * .05);
    shake(6 + tier * 2, 360, 540);
    return 1250;
  }
  // 등장할 때
  function entrance(key, species) {
    if (REDUCED) return;
    measure();
    const at = spot(key);
    if (species === 'lumina') {
      runeCircle(at, { color: '#37E0FF', glow: '#FF7FD0', r: 80, dur: 1100, spin: 2 });
      rise('sparkle', at, { delay: 200, n: 12, gap: 40, dur: 700, size: 9, spread: 60, height: 120 });
      bolt({ x: at.x, y: -10 }, { x: at.x, y: at.foot }, { delay: 120, dur: 240, w: 6, wob: 20, color: '#9ad8ff' });
      flash('#E8F8FF', 180, 150, .45);
    } else {
      runeCircle(at, { color: '#6CF2C2', glow: '#fff', r: 80, dur: 1100, spin: 3, star: 8 });
      fall('leaf', at, { n: 14, gap: 40, dur: 700, size: 10, spread: 90, height: 160 });
      ring(at, { delay: 160, color: '#B8FFD9', r1: 120, dur: 520, w: 6, squash: .4 });
      windLines({ x: at.x - 160 * u, y: at.y }, { x: at.x + 160 * u, y: at.y }, { delay: 100, n: 8, gap: 26, spread: 50 });
    }
  }
  function terrain(t) {
    if (REDUCED || t !== 'grass') return 700;
    measure();
    for (let i = 0; i < 26; i++) { const x = rnd(0, W); rise('leaf', { x, y: H * .92, r: 10 * u, foot: H }, { delay: i * 25, n: 1, dur: 700, size: 8, spread: 6, height: 90 }); }
    flash('#7ed957', 500, 80, .3);
    return 1000;
  }
  function weather(w) { if (REDUCED || !w) return 700; measure(); return weatherFx(w); }

  function item(key) { if (REDUCED) return; measure(); const at = spot(key); ring(at, { color: '#FFD23F', r0: 10, r1: 70, w: 4, dur: 380 }); burst('sparkle', at, { n: 8, dist: 46, size: 7 }); }
  return { attach, play, ignite, spiky, hydrate, dice, splash, reflectReady, reflect, counter, terrain, rage, item, status, statusTick, heal, stage, weather, megaStart, megaEnd, zmove, awaken, entrance, forge, ids: () => Object.keys(MOVE_FX) };
})();
