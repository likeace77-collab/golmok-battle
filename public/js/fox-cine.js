'use strict';
/* 여우비 거다이맥스 연출: 귀여운 얼굴(가면)에 금이 가고 → 깨지며 피가 튀고 → 어둠 속 눈들이 뜨고 → 실체(구미호)가 거대하게 솟아오른다.
   화면을 누르면 건너뛸 수 있어요. 소리는 WebAudio로 즉석 합성 (설정에서 효과음을 끄면 조용히). */
const FoxCine = (() => {
  let ac = null, out = null;
  const quiet = () => typeof MoveSfx !== 'undefined' && MoveSfx.off();
  function ctx() {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = .7; const c = ac.createDynamicsCompressor(); out.connect(c); c.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  let nb = null;
  const nbuf = (a) => { if (!nb) { nb = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; };
  function tone(f, dur, { type = 'sine', vol = .2, at = 0, to = null, attack = .01, vib = 0 } = {}) {
    if (quiet()) return; try {
      const a = ctx(), t = a.currentTime + .02 + at, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = vib; lg.gain.value = f * .05; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .1); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + .1);
    } catch { /* 소리 없이 */ }
  }
  function noise(dur, { freq = 1000, q = 1, vol = .3, at = 0, to = null, type = 'bandpass', attack = .005 } = {}) {
    if (quiet()) return; try {
      const a = ctx(), t = a.currentTime + .02 + at, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = nbuf(a); f.type = type; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur); f.Q.value = q;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random(), dur + .1);
    } catch { /* 소리 없이 */ }
  }
  const S = {
    musicbox: () => [1568, 1319, 1175, 1319, 1568, 1568, 1568].forEach((f, i) => tone(f * (1 - i * .012), .5, { type: 'triangle', vol: .08, at: i * .19, to: f * (1 - i * .03) })), // 오르골이 점점 늘어짐
    giggle: () => [0, .14, .26].forEach((t, i) => tone(900 - i * 60, .1, { vol: .06, at: t, to: 700 - i * 60, vib: 30 })),
    crack: (k = 1) => { noise(.08, { freq: 3500, q: 3, vol: .5 * k }); noise(.25, { freq: 900, q: 1.5, vol: .35 * k, at: .02, to: 300 }); tone(180, .12, { type: 'square', vol: .08 * k, to: 60 }); },
    heart: (at = 0) => { tone(55, .22, { vol: .7, to: 35, at }); tone(52, .2, { vol: .55, to: 32, at: at + .22 }); },
    shatter: () => { for (let i = 0; i < 18; i++) noise(.06 + Math.random() * .1, { freq: 2500 + Math.random() * 6000, q: 6, vol: .25, at: Math.random() * .35 }); noise(.6, { freq: 1200, q: .7, vol: .6, to: 200 }); tone(70, 1.2, { type: 'sawtooth', vol: .25, to: 28 }); },
    splat: () => { noise(.3, { freq: 400, q: 1, vol: .6, type: 'lowpass', to: 120 }); for (let i = 0; i < 8; i++) noise(.05, { freq: 600 + Math.random() * 600, q: 2, vol: .2, at: .1 + i * .06 }); },
    scream: () => { tone(620, 1.6, { type: 'sawtooth', vol: .12, to: 180, attack: .05, vib: 9 }); tone(640, 1.6, { type: 'square', vol: .05, to: 170, attack: .05, vib: 11 }); noise(1.6, { freq: 1800, q: 4, vol: .25, to: 400, attack: .05 }); },
    drone: () => { tone(41, 3.4, { type: 'sawtooth', vol: .22, attack: .4 }); tone(43.5, 3.4, { type: 'sawtooth', vol: .18, attack: .4 }); tone(61.7, 3.2, { vol: .2, attack: .6, vib: 3 }); },
    whisper: () => { for (let i = 0; i < 6; i++) noise(.35, { freq: 2500 + Math.random() * 2500, q: 8, vol: .07, at: i * .22 + Math.random() * .1, attack: .1 }); },
    boom: () => { tone(48, 1.8, { vol: .9, to: 22 }); noise(1.4, { freq: 160, type: 'lowpass', vol: .9, attack: .01 }); noise(.4, { freq: 4000, q: .5, vol: .3 }); },
    bell: () => tone(523 * .94, 2.4, { type: 'triangle', vol: .12, at: .2, vib: 4 }),
  };

  // 가면이 깨지는 조각 (중심점에서 테두리로 나뉜 다각형, % 단위)
  const C = [50, 47], RIM = [[0, 0], [28, 0], [55, 0], [80, 0], [100, 0], [100, 30], [100, 62], [100, 100], [70, 100], [42, 100], [14, 100], [0, 100], [0, 64], [0, 30]];
  const wobble = (p, k) => [p[0] + Math.sin(k * 7.1) * 6, p[1] + Math.cos(k * 3.7) * 6];
  const SHARDS = RIM.map((p, i) => { const q = RIM[(i + 1) % RIM.length], m = wobble([(p[0] + q[0]) / 2 * .55 + C[0] * .45, (p[1] + q[1]) / 2 * .55 + C[1] * .45], i); return [C, p, m, q]; });
  const CRACKS = [
    'M104 92L96 70 108 56 98 40', 'M104 92L126 98 140 120 160 126', 'M104 92L86 110 90 132 76 150', 'M104 92L112 118 104 140',
    'M96 70L78 64 62 70', 'M126 98L134 80 150 74', 'M86 110L64 104 50 112', 'M108 56L122 48', 'M90 132L106 150', 'M140 120L134 146',
  ];
  const sleep = (ms, sig) => new Promise((ok) => { const t = setTimeout(ok, ms); sig.push(() => { clearTimeout(t); ok(); }); });

  async function play() {
    if (typeof FOX_ART === 'undefined') return;
    const fast = matchMedia('(prefers-reduced-motion: reduce)').matches ? .5 : 1;
    const skip = []; let skipped = false;
    const root = document.createElement('div'); root.className = 'ybc';
    root.innerHTML = `<div class="ybc-in"><div class="ybc-bg"></div><div class="ybc-vig"></div>
      <div class="ybc-stage"><div class="ybc-face"><svg viewBox="-4 -6 208 212">${FOX_ART.BASE}</svg>
        <svg class="ybc-cracks" viewBox="-4 -6 208 212">${CRACKS.map((d, i) => `<path d="${d}" style="--i:${i}"/>`).join('')}</svg></div></div>
      <div class="ybc-shards"></div><div class="ybc-blood"></div><div class="ybc-drips"></div><div class="ybc-eyes"></div>
      <div class="ybc-real"><svg viewBox="-6 -10 212 212">${FOX_ART.GMAX}</svg></div>
      <div class="ybc-splat"></div></div><p class="ybc-t ybc-t1">후후…</p><p class="ybc-t ybc-t2">가면이… 깨졌다</p><p class="ybc-t ybc-t3"><small>가면 아래의 실체</small>구미호 각성</p>
      <button class="ybc-skip">건너뛰기 ▸</button>`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s);
    const end = () => { if (skipped) return; skipped = true; skip.forEach((f) => f()); };
    $('.ybc-skip').onclick = end;
    const W = (ms) => (skipped ? Promise.resolve() : sleep(ms * fast, skip));
    const shake = (el, px, ms) => el.animate(Array.from({ length: 10 }, (_, i) => ({ transform: `translate(${(Math.random() - .5) * px * (1 - i / 10)}px, ${(Math.random() - .5) * px * (1 - i / 10)}px)` })), { duration: ms });
    try {
      // 1. 귀여운 얼굴, 오르골, 키득
      root.classList.add('on'); S.musicbox();
      $('.ybc-face').animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
      await W(700); $('.ybc-t1').classList.add('show'); S.giggle(); await W(900);
      // 2. 금이 가기 시작 (심장 소리)
      $('.ybc-t1').classList.remove('show'); root.classList.add('dim');
      const cracks = [...root.querySelectorAll('.ybc-cracks path')];
      for (let i = 0; i < cracks.length; i++) {
        cracks[i].classList.add('go'); if (i % 3 === 0) { S.crack(.6 + i / 12); shake($('.ybc-stage'), 10 + i * 2, 260); }
        if (i === 4) { S.heart(); root.classList.add('glitch'); }
        await W(i < 4 ? 260 : 130);
      }
      S.heart(.1); $('.ybc-face').classList.add('bleed'); await W(500);
      // 3. 깨짐! 조각이 튀고 피가 쏟아진다
      S.shatter(); S.scream(); root.classList.add('flash');
      const box = $('.ybc-face').getBoundingClientRect(), sh = $('.ybc-shards');
      SHARDS.forEach((poly, i) => {
        const el = document.createElement('div'); el.className = 'ybc-shard';
        Object.assign(el.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`, clipPath: `polygon(${poly.map(([x, y]) => `${x}% ${y}%`).join(',')})` });
        el.innerHTML = `<svg viewBox="-4 -6 208 212">${FOX_ART.BASE}</svg>`; sh.appendChild(el);
        const cx = poly.reduce((s, p) => s + p[0], 0) / 4 - 50, cy = poly.reduce((s, p) => s + p[1], 0) / 4 - 47, d = 6 + Math.random() * 4;
        el.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${cx * d}px, ${cy * d + 260}px) rotate(${(Math.random() - .5) * 540}deg) scale(.7)`, opacity: 0 }], { duration: 1500 + Math.random() * 500, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' });
      });
      $('.ybc-face').style.visibility = 'hidden';
      const bl = $('.ybc-blood'), cxp = box.left + box.width / 2, cyp = box.top + box.height * .47;
      for (let i = 0; i < 70; i++) {
        const el = document.createElement('i'), a = Math.random() * Math.PI * 2, v = 120 + Math.random() * Math.max(innerWidth, innerHeight) * .6, s = 6 + Math.random() * 22;
        Object.assign(el.style, { left: `${cxp}px`, top: `${cyp}px`, width: `${s}px`, height: `${s * (1 + Math.random())}px` }); bl.appendChild(el);
        el.animate([{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * v}px), calc(-50% + ${Math.sin(a) * v + 140}px)) scale(1) rotate(${a}rad)`, opacity: .95 }], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.1,.8,.3,1)', fill: 'forwards' });
      }
      setTimeout(() => S.splat(), 120);
      const sp = $('.ybc-splat'); // 화면(렌즈)에 튄 핏자국
      for (let i = 0; i < 9; i++) { const el = document.createElement('i'), r = 30 + Math.random() * 90;
        const blob = Array.from({ length: 10 }, (_, k) => { const a = k / 10 * Math.PI * 2, rr = 38 + Math.random() * 14; return `${50 + Math.cos(a) * rr}% ${50 + Math.sin(a) * rr}%`; }).join(',');
        Object.assign(el.style, { left: `${8 + Math.random() * 78}%`, top: `${10 + Math.random() * 70}%`, width: `${r}px`, height: `${r}px`, clipPath: `polygon(${blob})` }); sp.appendChild(el);
        el.animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: .92 }], { duration: 160, delay: 80 + i * 40, fill: 'forwards' }); }
      const dr = $('.ybc-drips');
      for (let i = 0; i < 16; i++) { const el = document.createElement('i'); el.style.left = `${3 + i * 6.2 + Math.random() * 3}%`; el.style.setProperty('--w', `${6 + Math.random() * 14}px`); dr.appendChild(el);
        el.animate([{ height: '0%' }, { height: `${25 + Math.random() * 70}%` }], { duration: 2600 + Math.random() * 1600, delay: Math.random() * 500, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' }); }
      shake($('.ybc-in'), 40, 700); await W(500); $('.ybc-t2').classList.add('show'); await W(1100);
      // 4. 어둠 속에서 눈들이 뜬다
      $('.ybc-t2').classList.remove('show'); root.classList.remove('flash'); root.classList.add('dark'); S.drone(); S.whisper();
      const ey = $('.ybc-eyes');
      for (let i = 0; i < 22; i++) { const el = document.createElement('i'); const s = 6 + Math.random() * 16;
        Object.assign(el.style, { left: `${4 + Math.random() * 92}%`, top: `${4 + Math.random() * 80}%`, width: `${s * 2.2}px`, height: `${s}px`, animationDelay: `${i * 45}ms` }); ey.appendChild(el); }
      ey.classList.add('open'); await W(1100);
      // 5. 실체가 거대하게 솟아오른다
      S.boom(); S.bell(); root.classList.add('reveal');
      $('.ybc-real').animate([{ transform: 'translateY(30%) scale(.25)', filter: 'blur(14px) brightness(4) saturate(0)', opacity: 0 }, { transform: 'translateY(4%) scale(.9)', filter: 'blur(3px) brightness(1.6)', opacity: 1, offset: .55 }, { transform: 'translateY(0) scale(1.08)', filter: 'blur(0) brightness(1)', opacity: 1 }], { duration: 1500, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
      shake($('.ybc-in'), 60, 1200); await W(900); $('.ybc-t3').classList.add('show'); await W(1700);
    } finally {
      root.classList.add('out'); await new Promise((ok) => setTimeout(ok, skipped ? 150 : 600)); root.remove();
    }
  }
  return { play };
})();
