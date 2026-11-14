// 대전 효과음: 기술마다 다른 소리 (WebAudio로 즉석 합성, 파일 없음)
// 타입이 소리의 재료(불=타닥 화르륵, 물=보글 철썩 …)를 정하고, 기술 이름(id)으로 음높이·리듬·무늬를 바꿔서 216개 기술이 모두 다르게 들려요.
// 물리(p)는 끝에 "퍽", 특수(s)는 날아가는 소리, 변화(x)는 반짝이는 소리. 위력이 셀수록 크고 길어요.
const MoveSfx = (() => {
  let ac = null, master = null;
  const off = () => { try { return localStorage.getItem('sfx-off') === '1'; } catch { return false; } };
  function ctx() {
    if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .55; const comp = ac.createDynamicsCompressor(); master.connect(comp); comp.connect(ac.destination); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  let nb = null;
  const noiseBuf = (a) => { if (!nb) { nb = a.createBuffer(1, a.sampleRate, a.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; };
  // 소리 재료
  function tone(f, dur, { type = 'sine', vol = .2, at = 0, to = null, attack = .005, vib = 0, detune = 0 } = {}) {
    const a = ctx(), t = a.currentTime + .01 + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.detune.value = detune; o.frequency.setValueAtTime(Math.max(20, f), t); if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = vib; lg.gain.value = f * .04; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + .05); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, { freq = 2000, q = 1, vol = .2, at = 0, to = null, type = 'bandpass', attack = .004 } = {}) {
    const a = ctx(), t = a.currentTime + .01 + at, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a); f.type = type; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur); f.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .4, dur + .05);
  }
  const thump = (at, p, k = 1) => { tone(130 * p, .22, { vol: .5 * k, to: 45, at }); noise(.08, { freq: 900, q: .8, vol: .3 * k, at, type: 'lowpass' }); };
  // 기술 id → 늘 같은 난수 (그래서 같은 기술은 늘 같은 소리)
  function seeded(id) { let h = 2166136261; for (const c of String(id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }

  // 타입별 소리. r = 기술 고유 난수, p = 음높이 배율, n = 반복 수, k = 세기, v = 무늬(0~2)
  const TYPE = {
    fire: (r, p, n, k, v) => { noise(.5 + k * .3, { freq: 500 * p, q: .6, vol: .8 * k, to: 2400 * p, type: 'lowpass' }); for (let i = 0; i < 6 + n * 3; i++) noise(.02, { freq: 3000 + r() * 4000, q: 5, vol: .3, at: r() * (.4 + k * .2) }); if (v) tone(90 * p, .5, { type: 'sawtooth', vol: .16 * k, to: 220 * p, attack: .08 }); },
    water: (r, p, n, k, v) => { for (let i = 0; i < 2 + n * 2; i++) { const f = (300 + r() * 500) * p; tone(f, .09, { vol: .18, to: f * (v === 1 ? .6 : 2.4), at: i * (.05 + r() * .05) }); } noise(.35 + k * .2, { freq: 1200 * p, q: .5, vol: .45 * k, at: .12, to: 400, attack: .02 }); },
    grass: (r, p, n, k, v) => { for (let i = 0; i < 3 + n * 2; i++) noise(.06, { freq: 5000 * p + r() * 2000, q: 2, vol: .14, at: i * .05, type: 'highpass' }); for (let i = 0; i < 1 + (v ? n : 0); i++) tone((300 + r() * 300) * p, .15, { type: 'triangle', vol: .2, to: 120 * p, at: .05 + i * .09 }); },
    elec: (r, p, n, k, v) => { for (let i = 0; i < 3 + n * 2; i++) tone((600 + r() * 1800) * p, .04 + r() * .04, { type: 'square', vol: .14, at: i * .04, to: v === 2 ? 3000 : 80 }); tone(60 * p, .35 * k + .1, { type: 'sawtooth', vol: .12 * k, vib: 30 }); noise(.05, { freq: 8000, vol: .15 }); },
    ice: (r, p, n, k, v) => { const base = [2093, 2637, 3136, 3951, 4699]; for (let i = 0; i < 2 + n; i++) tone(base[Math.floor(r() * 5)] * p * (v === 2 ? .5 : 1), .4, { vol: .09, at: i * .06 }); noise(.06, { freq: 6000, q: 2, vol: .3 * k, at: .1 + n * .05 }); for (let i = 0; i < 5; i++) noise(.015, { freq: 4000 + r() * 5000, q: 4, vol: .1, at: .14 + r() * .2 }); },
    earth: (r, p, n, k, v) => { for (let i = 0; i < 1 + Math.floor(n / 2) + (v ? 1 : 0); i++) { tone(70 * p, .4, { vol: .5 * k, to: 30, at: i * .14 }); noise(.3, { freq: 300 * p, vol: .35 * k, type: 'lowpass', at: i * .14 }); } for (let i = 0; i < 4 + n; i++) noise(.03, { freq: 1500 + r() * 1500, q: 3, vol: .1, at: .1 + r() * .35 }); },
    wind: (r, p, n, k, v) => { for (let i = 0; i < 1 + (v ? n : 1); i++) noise(.3 + k * .15, { freq: (500 + r() * 400) * p, q: 2, vol: .8, to: (2500 + r() * 2000) * p, at: i * .16, attack: .06 }); if (v === 2) tone(900 * p, .3, { vol: .05, to: 1800 * p, attack: .1 }); },
    poison: (r, p, n, k, v) => { for (let i = 0; i < 3 + n * 2; i++) { const f = (120 + r() * 160) * p; tone(f, .12, { type: v ? 'triangle' : 'sine', vol: .22, to: f * 2.2, at: i * .07 }); } tone(180 * p, .45, { type: 'sawtooth', vol: .05 * k, vib: 7, to: 90 * p }); },
    steel: (r, p, n, k, v) => { for (let i = 0; i < 1 + Math.floor(n / 2); i++) { const f = (330 + r() * 300) * p; for (const m of [1, 2.76, 5.4, 8.93]) tone(f * m, .6 / m + .1, { vol: .14 / Math.sqrt(m), at: i * .16, type: v === 1 ? 'triangle' : 'sine' }); noise(.02, { freq: 7000, vol: .25, at: i * .16 }); } },
    spirit: (r, p, n, k, v) => { const f = (220 + r() * 200) * p; tone(f, .7 + k * .2, { vol: .14, to: f * (v === 1 ? 2 : .5), vib: 6, attack: .12 }); tone(f * 1.01, .7, { vol: .08, to: f * .49, vib: 5, attack: .15, detune: 25 }); if (v === 2) for (let i = 0; i < n; i++) tone(f * 3, .08, { vol: .05, at: .2 + i * .1 }); },
    fairy: (r, p, n, k, v) => { const sc = [1, 1.25, 1.5, 2, 2.5, 3]; for (let i = 0; i < 4 + n * 2; i++) tone(880 * p * sc[(i * (v + 1)) % 6], .25, { type: v === 2 ? 'triangle' : 'sine', vol: .08, at: i * .05 }); noise(.4, { freq: 9000, type: 'highpass', vol: .06, attack: .1 }); },
    normal: (r, p, n, k, v) => { for (let i = 0; i < Math.max(1, n - 1); i++) noise(.1, { freq: (900 + r() * 600) * p, q: 1.5, vol: .22, to: 2600 * p, at: i * .1 }); if (v === 2) tone(500 * p, .1, { type: 'triangle', vol: .12, to: 900 * p }); },
    none: (r, p, n, k) => noise(.15, { freq: 1500 * p, q: 1, vol: .2 * k }),
  };

  function attack(e) {
    if (off()) return;
    try {
      const mv = G.data.MOVES?.[e.id] || {}, type = e.type || mv.type || 'normal', cat = e.cat || mv.cat || 'p';
      const r = seeded(e.id || type), pow = e.z || e.gmax ? 160 : mv.pow || 60;
      const k = Math.min(1.5, .55 + pow / 140), p = .7 + r() * .7, n = 1 + Math.floor(r() * 4), v = Math.floor(r() * 3);
      if (cat === 'x') { // 변화 기술: 반짝 + 타입 맛을 살짝
        const up = r() > .3, f = (500 + r() * 400) * p;
        for (let i = 0; i < 3 + n; i++) tone(f * (up ? 1 + i * .25 : 2 - i * .2), .18, { type: 'triangle', vol: .08, at: i * .06 });
        (TYPE[type] || TYPE.none)(r, p, 1, .45, v);
        return;
      }
      if (cat === 's') noise(.22, { freq: 600 * p, q: 2, vol: .35, to: 3000 * p, attack: .05 }); // 쏘는 소리
      (TYPE[type] || TYPE.none)(r, p, n, k, v);
      if (cat === 'p') thump(.18 + n * .04, .8 + r() * .5, k);
      if (e.z || e.gmax) { tone(55, 1.2, { type: 'sawtooth', vol: .25, to: 30 }); noise(1, { freq: 200, type: 'lowpass', vol: .4, attack: .2 }); }
    } catch { /* 소리 없이 */ }
  }
  // 맞는 소리: 급소는 "쩍", 효과 굉장은 크고 "쨍", 별로면 둔탁
  function hit(e) {
    if (off()) return;
    try {
      const k = e.eff > 1 ? 1.3 : e.eff < 1 ? .55 : 1;
      tone(e.eff < 1 ? 110 : 170, .16, { vol: .4 * k, to: 50 }); noise(.07, { freq: e.eff < 1 ? 600 : 2200, q: .8, vol: .3 * k });
      if (e.crit) { noise(.04, { freq: 6000, q: 2, vol: .4 }); tone(1600, .12, { type: 'square', vol: .06, to: 800, at: .02 }); }
      if (e.eff > 1) tone(1320, .35, { type: 'triangle', vol: .08, at: .04 });
    } catch { /* 소리 없이 */ }
  }
  function faint() { if (off()) return; try { tone(440, .7, { type: 'triangle', vol: .15, to: 110, attack: .02 }); tone(330, .7, { type: 'triangle', vol: .1, to: 80, at: .1 }); } catch { /* */ } }
  function toggle(on) { try { localStorage.setItem('sfx-off', on ? '0' : '1'); } catch { /* */ } }
  return { attack, hit, faint, toggle, off };
})();
