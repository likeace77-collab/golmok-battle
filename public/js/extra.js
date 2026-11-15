// 추가 시스템 화면: 소식(공지·패치노트), 관리자, 전적 통계, 도감 보상, 친구 선물, 스킨, 스킨 공모전, 토너먼트, 밴픽, 리플레이, 이벤트, 푸시 알림

/* 왁뿌말랑왕: 말랑왕을 감싼 왁뿌볼(왁스 껍질). crack = 맞은 횟수 → 조각이 하나씩 떨어져 나감 (6번이면 다 깨짐) */
const WAX_CHUNKS = [
  'M100 52L196 52L196 120L150 118L128 96L112 100Z', 'M4 100L70 92L84 118L62 140L4 150Z', 'M84 108L118 104L136 128L120 160L86 162L66 136Z',
  'M150 118L196 120L196 210L120 210L120 160L136 128Z', 'M4 150L62 140L86 162L80 210L4 210Z', 'M4 52L100 52L112 100L84 108L70 92L4 100Z',
];
let WAX_UID = 0;
function waxShell(crack = 0, big = false) {
  const n = Math.max(0, Math.min(6, crack | 0)), id = `wx${++WAX_UID}`;
  const cx = 100, cy = big ? 132 : 132, rx = big ? 86 : 80, ry = big ? 68 : 64;
  const crumbs = n >= 6 ? [[52, 150, '#FFB3D9'], [138, 168, '#B9F3E4'], [96, 182, '#D9C6FF'], [70, 110, '#FFF1A8'], [150, 132, '#FFB3D9']].map(([x, y, c], k) => `<path d="M${x} ${y}l${6 + k} -4 4 ${7 - k} -9 3z" fill="${c}" stroke="#1a1433" stroke-width="2"/>`).join('') : '';
  if (n >= 6) return `<g class="wax-done">${crumbs}</g>`;
  const holes = WAX_CHUNKS.slice(0, n).map((d) => `<path d="${d}" fill="#000"/>`).join('');
  const next = WAX_CHUNKS.slice(n, n + 2).map((d, k) => `<path d="${d}" fill="none" stroke="#1a1433" stroke-width="${k ? 1.6 : 2.6}" stroke-linejoin="miter" opacity="${k ? .45 : .85}"/>`).join('');
  return `<g class="wax-ball"><defs>
      <radialGradient id="${id}g" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".18" stop-color="#FFE3F1"/><stop offset=".55" stop-color="#FFB3D9"/><stop offset="1" stop-color="#E88BC0"/></radialGradient>
      <mask id="${id}m"><rect x="0" y="0" width="200" height="210" fill="#fff"/>${holes}</mask>
      <clipPath id="${id}c"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>
    <g mask="url(#${id}m)">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}g)" stroke="#1a1433" stroke-width="4.5"/>
      <g clip-path="url(#${id}c)" opacity=".85">
        <path d="M20 120Q60 92 96 118T180 110" fill="none" stroke="#B9F3E4" stroke-width="16" stroke-linecap="round"/>
        <path d="M24 158Q70 134 104 160T184 150" fill="none" stroke="#D9C6FF" stroke-width="14" stroke-linecap="round"/>
        <path d="M40 186Q90 170 160 188" fill="none" stroke="#FFF1A8" stroke-width="12" stroke-linecap="round"/>
        <g clip-path="url(#${id}c)">${next}</g>
      </g>
      <ellipse cx="${cx - 34}" cy="${cy - 36}" rx="22" ry="10" fill="#fff" opacity=".8" transform="rotate(-24 ${cx - 34} ${cy - 36})"/>
      <circle cx="${cx + 44}" cy="${cy - 30}" r="5" fill="#fff" opacity=".85"/>
    </g>
    </g>`;
}
// (스킨 그림은 아래 SKIN_FX / skinArt)
/* 바삭바삭 왁스 부서지는 소리 (WebAudio로 직접 만듦) + 진동 */
let WAX_AC = null;
document.addEventListener('pointerdown', () => { try { WAX_AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (WAX_AC.state === 'suspended') WAX_AC.resume(); } catch { /* 소리 없이 */ } }, { capture: true });
function waxCrunch(power = 1) {
  try {
    WAX_AC ||= new (window.AudioContext || window.webkitAudioContext)();
    const ac = WAX_AC; if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime + .01;
    if (!WAX_AC.noise) { const b = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; WAX_AC.noise = b; }
    const out = ac.createGain(); out.gain.value = .9; out.connect(ac.destination);
    const crack = (t, len, freq, q, vol) => {
      const src = ac.createBufferSource(); src.buffer = WAX_AC.noise; src.playbackRate.value = .8 + Math.random() * .6;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .0015); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out); src.start(t, Math.random() * .4, len + .02);
    };
    // 첫 '빠각': 크고 날카로운 금
    crack(now, .05, 2600, 1.2, .9 * power);
    // 오도독 갈라지는 잔금들
    const n = 9 + Math.floor(power * 8);
    for (let i = 0; i < n; i++) { const t = now + .012 + Math.pow(Math.random(), 1.6) * .19; crack(t, .006 + Math.random() * .018, 1800 + Math.random() * 5200, 1 + Math.random() * 4, (.18 + Math.random() * .45) * power); }
    // 부스러기 떨어지는 사각사각 꼬리
    for (let i = 0; i < 7; i++) crack(now + .2 + Math.random() * .28, .004 + Math.random() * .01, 5000 + Math.random() * 4000, 2, .05 + Math.random() * .09);
    // 묵직한 톡 (말랑 속살)
    const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(55, now + .09);
    og.gain.setValueAtTime(.35 * power, now); og.gain.exponentialRampToValueAtTime(.001, now + .12); o.connect(og); og.connect(out); o.start(now); o.stop(now + .14);
  } catch { /* 소리를 못 내도 게임은 계속 */ }
  try { navigator.vibrate?.([14, 18, 8, 12, 6]); } catch { /* 진동 없음 */ }
}
// 껍질 조각이 튀어 나가는 연출 (el: 골목몬 그림 상자)
function waxShards(el, n = 9) {
  if (!el) return;
  const r = el.getBoundingClientRect(); const cols = ['#FFB3D9', '#B9F3E4', '#D9C6FF', '#FFF1A8', '#FFE3F1'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = 'wax-shard';
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.style.cssText = `left:${r.left + r.width * (.3 + Math.random() * .4)}px;top:${r.top + r.height * (.35 + Math.random() * .4)}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d * .6 - 30}px;--rot:${(Math.random() - .5) * 720}deg;width:${6 + Math.random() * 10}px;height:${5 + Math.random() * 8}px`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 950);
  }
}
/* ---------- 스킨: 골목몬 전용 (외형 변화 + 이펙트 + 사운드) ---------- */
let SKIN_UID = 0;
// 소리: WebAudio로 직접 만든 짧은 효과음
const Sfx = (() => {
  const ac = () => { WAX_AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (WAX_AC.state === 'suspended') WAX_AC.resume(); return WAX_AC; };
  const noiseBuf = (a) => { if (!a.noise) { const b = a.createBuffer(1, a.sampleRate * .5, a.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; a.noise = b; } return a.noise; };
  function tone(freq, dur, { type = 'sine', vol = .2, at = 0, to = null, attack = .004 } = {}) {
    const a = ac(), t = a.currentTime + .01 + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .05);
  }
  function noise(dur, { freq = 3000, q = 1, vol = .2, at = 0, to = null, type = 'bandpass' } = {}) {
    const a = ac(), t = a.currentTime + .01 + at, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf(a); f.type = type; f.frequency.setValueAtTime(freq, t); if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur); f.Q.value = q;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .003); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    s.connect(f); f.connect(g); g.connect(a.destination); s.start(t, Math.random() * .3, dur + .05);
  }
  const safe = (f) => (...x) => { try { f(...x); } catch { /* 소리 없이 */ } };
  return {
    ice: safe(() => { tone(2637, .5, { vol: .16 }); tone(3951, .4, { vol: .1, at: .04 }); tone(5274, .3, { vol: .06, at: .08 }); for (let i = 0; i < 6; i++) noise(.02, { freq: 7000, q: 3, vol: .08, at: i * .03 }); }),
    iceCrack: safe(() => { noise(.06, { freq: 5200, q: 1.5, vol: .5 }); tone(1800, .18, { type: 'triangle', vol: .12, to: 900 }); for (let i = 0; i < 8; i++) noise(.015, { freq: 4000 + Math.random() * 5000, q: 4, vol: .12, at: .02 + Math.random() * .15 }); }),
    frost: safe(() => noise(.6, { freq: 6000, q: .7, vol: .12, to: 2500 })),
    whistle: safe(() => { tone(1900, .55, { vol: .12, to: 2800, attack: .05 }); tone(1910, .55, { vol: .06, to: 2820, attack: .05 }); noise(.6, { freq: 3500, q: .8, vol: .12, attack: .1 }); }),
    bell: safe(() => { for (const [f, v] of [[880, .18], [1320, .1], [1760, .08], [2640, .05]]) tone(f, 1.3, { vol: v }); }),
    coins: safe(() => { for (let i = 0; i < 6; i++) tone(2400 + Math.random() * 1600, .12, { vol: .07, at: i * .05, type: 'triangle' }); }),
    zap: safe(() => { tone(1500, .2, { type: 'square', vol: .08, to: 110 }); tone(750, .2, { type: 'sawtooth', vol: .05, to: 60, at: .02 }); noise(.05, { freq: 8000, vol: .08 }); }),
    bleep: safe(() => { tone(1250, .06, { type: 'square', vol: .07 }); tone(620, .08, { type: 'square', vol: .07, at: .07 }); noise(.04, { freq: 9000, vol: .05, at: .02 }); }),
    glitch: safe(() => { for (let i = 0; i < 5; i++) tone(200 + Math.random() * 2400, .04, { type: 'square', vol: .05, at: i * .035 }); }),
    beat: safe(() => { for (const at of [0, .28]) { tone(150, .18, { vol: .45, to: 40, at }); } for (const at of [.14, .42]) noise(.05, { freq: 9000, type: 'highpass', vol: .12, at }); noise(.12, { freq: 1800, q: .7, vol: .14, at: .28 }); }),
    scratch: safe(() => { noise(.12, { freq: 700, q: 3, vol: .25, to: 2600 }); noise(.12, { freq: 2600, q: 3, vol: .2, to: 600, at: .12 }); }),
    squish: safe(() => { tone(420, .2, { type: 'triangle', vol: .18, to: 140 }); noise(.1, { freq: 900, q: 2, vol: .08, type: 'lowpass' }); }),
  };
})();
// 그림 상자(el) 주변으로 터지는 파티클. kinds: 글자/이모지 또는 색 조각
function fxBurst(el, { chars = null, colors = ['#fff'], n = 10, spread = 90, rise = 0, size = [14, 24], dur = 900 } = {}) {
  if (!el) return; const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = 'skin-p';
    const a = Math.random() * Math.PI * 2, d = spread * (.4 + Math.random() * .6), sz = size[0] + Math.random() * (size[1] - size[0]);
    s.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height * .5}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d * .7 - rise}px;--rot:${(Math.random() - .5) * 540}deg;--dur:${dur}ms;font-size:${sz}px;color:${colors[i % colors.length]}`;
    if (chars) s.textContent = chars[i % chars.length]; else s.style.cssText += `;width:${sz * .5}px;height:${sz * .4}px;background:${colors[i % colors.length]};border:2px solid #1a1433;border-radius:3px`;
    document.body.appendChild(s); setTimeout(() => s.remove(), dur + 100);
  }
}
function fxFlash(el, cls, ms = 600) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); }
// 스킨 정의: filter(색 바꾸기 행렬), over(덧그림), attack/hit/enter(이펙트+사운드)
const SKIN_FX = {
  wakppu: { name: '왁뿌말랑왕', only: 'malrang', over: (o) => waxShell(o.crack || 0, o.big),
    attack: (el) => { Sfx.squish(); fxBurst(el, { chars: ['●', '◆', '●'], colors: ['#FFB3D9', '#B9F3E4', '#D9C6FF', '#FFF1A8'], n: 10, spread: 70, size: [10, 18] }); },
    hit: (el, m) => { const n = m?.hits || 1; waxCrunch(n >= 6 ? 1.3 : 1); waxShards(el, n >= 6 ? 18 : 10); fxFlash(el, 'wax-hit', 300); },
    enter: (el) => { Sfx.squish(); fxFlash(el, 'wax-hit', 300); } },
  icecoal: { name: '빙하 연탄', only: 'yeontan', filter: '0.35 0.35 0.2 0 0.12  0.35 0.45 0.25 0 0.2  0.4 0.45 0.4 0 0.38  0 0 0 1 0',
    over: () => `<g class="sk-ice"><path d="M62 50 L70 14 L80 46 L92 4 L104 46 L116 10 L126 46 L138 18 L142 52 Q100 64 62 50Z" fill="#E8F7FF" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M76 40l4-14M100 38l4-20M124 40l4-12" stroke="#fff" stroke-width="3"/>${[[40, 90], [162, 110], [52, 160], [150, 168]].map(([x, y], i) => `<path class="sk-tw" style="animation-delay:${i * .4}s" d="M${x} ${y - 9}v18M${x - 8} ${y - 5}l16 10M${x - 8} ${y + 5}l16-10" stroke="#BFF0FF" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`,
    attack: (el) => { Sfx.ice(); fxBurst(el, { chars: ['❄', '❅', '✦'], colors: ['#BFF0FF', '#fff', '#7FD8FF'], n: 14, spread: 120 }); },
    hit: (el) => { Sfx.iceCrack(); fxBurst(el, { colors: ['#E8F7FF', '#BFF0FF', '#7FD8FF'], n: 10, spread: 80, size: [10, 18] }); fxFlash(el, 'sk-frosthit', 400); },
    enter: (el) => { Sfx.frost(); fxBurst(el, { chars: ['❄'], colors: ['#fff'], n: 8, spread: 60, rise: 40 }); } },
  goldkettle: { name: '황금 주전자', only: 'kettle', filter: '0.45 0.6 0.15 0 0.18  0.35 0.5 0.1 0 0.08  0.1 0.15 0.05 0 0  0 0 0 1 0',
    over: () => `<g class="sk-gold">${[[46, 70, 10], [156, 64, 8], [168, 140, 7], [36, 150, 6], [120, 40, 6]].map(([x, y, r], i) => `<path class="sk-tw" style="animation-delay:${i * .3}s" d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="#FFF6C8" stroke="#E7B23A" stroke-width="1.5"/>`).join('')}</g>`,
    attack: (el) => { Sfx.whistle(); fxBurst(el, { chars: ['☁', '☁'], colors: ['#fff', '#eef'], n: 8, spread: 60, rise: 80, size: [22, 34], dur: 1200 }); setTimeout(() => { Sfx.coins(); fxBurst(el, { chars: ['🪙', '✦'], colors: ['#FFD23F'], n: 10, spread: 110 }); }, 250); },
    hit: (el) => { Sfx.bell(); fxBurst(el, { chars: ['✦'], colors: ['#FFD23F', '#FFF6C8'], n: 8, spread: 80 }); fxFlash(el, 'sk-goldhit', 400); },
    enter: (el) => { Sfx.coins(); fxFlash(el, 'sk-shine', 900); } },
  neoncrow: { name: '네온 까마귀', only: 'kkamo', cls: 'sk-neon', filter: '0.25 0.15 0.1 0 0.02  0.15 0.3 0.15 0 0.05  0.2 0.3 0.4 0 0.12  0 0 0 1 0',
    over: () => `<g class="sk-scan" opacity=".35">${Array.from({ length: 16 }, (_, i) => `<rect x="10" y="${30 + i * 10}" width="180" height="2" fill="#2EF2FF"/>`).join('')}</g><g class="sk-tw"><path d="M150 40l8-14 4 10 10-6-6 14" fill="none" stroke="#FF3DCB" stroke-width="3"/></g>`,
    attack: (el) => { Sfx.zap(); fxBurst(el, { chars: ['╱', '╲', '▮'], colors: ['#2EF2FF', '#FF3DCB', '#fff'], n: 12, spread: 120, size: [18, 30], dur: 500 }); fxFlash(el, 'sk-glitch', 450); },
    hit: (el) => { Sfx.bleep(); fxFlash(el, 'sk-glitch', 450); fxBurst(el, { colors: ['#2EF2FF', '#FF3DCB'], n: 8, spread: 70, size: [8, 14], dur: 500 }); },
    enter: (el) => { Sfx.glitch(); fxFlash(el, 'sk-glitch', 600); } },
  djkong: { name: 'DJ 콩나물', only: 'kongsiru',
    over: () => `<g class="sk-dj"><path d="M36 100 Q36 20 100 20 Q164 20 164 100" fill="none" stroke="#1a1433" stroke-width="12"/><path d="M36 100 Q36 20 100 20 Q164 20 164 100" fill="none" stroke="#FF3DCB" stroke-width="6"/><rect x="20" y="84" width="28" height="44" rx="12" fill="#2B2B38" stroke="#1a1433" stroke-width="4"/><rect x="152" y="84" width="28" height="44" rx="12" fill="#2B2B38" stroke="#1a1433" stroke-width="4"/><circle cx="34" cy="106" r="7" fill="#2EF2FF"/><circle cx="166" cy="106" r="7" fill="#2EF2FF"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect class="sk-eq" style="animation-delay:${(i % 4) * .12}s" x="${58 + i * 13}" y="170" width="9" height="22" fill="${['#FF3DCB', '#FFD23F', '#2EF2FF', '#7CFF4F'][i % 4]}" stroke="#1a1433" stroke-width="2"/>`).join('')}</g>`,
    attack: (el) => { Sfx.beat(); fxBurst(el, { chars: ['♪', '♫', '♬'], colors: ['#FF3DCB', '#2EF2FF', '#FFD23F', '#7CFF4F'], n: 12, spread: 110, rise: 30 }); fxFlash(el, 'sk-bump', 600); },
    hit: (el) => { Sfx.scratch(); fxFlash(el, 'sk-bump', 400); fxBurst(el, { chars: ['♪'], colors: ['#FF3DCB'], n: 4, spread: 60 }); },
    enter: (el) => { Sfx.beat(); fxBurst(el, { chars: ['♫'], colors: ['#2EF2FF', '#FF3DCB'], n: 6, spread: 70, rise: 40 }); } },
};
// 골목몬 그림(svg 문자열)에 스킨을 입힘. opts.crack: 맞은 횟수, opts.big: 메가진화
function skinArt(svg, id, opts = {}) {
  const k = SKIN_FX[id];
  if (!k || typeof svg !== 'string') return svg;
  const open = svg.indexOf('>') + 1, close = svg.lastIndexOf('</svg>');
  if (open <= 0 || close < open) return svg;
  let head = svg.slice(0, open).replace(/<svg\b/, `<svg data-skin="${id}"`), body = svg.slice(open, close);
  if (k.cls) head = head.replace(/class="/, `class="${k.cls} `).replace(/<svg data-skin="([^"]+)"(?![^>]*class=)/, `<svg data-skin="$1" class="${k.cls}"`);
  if (k.filter) { const fid = `skf${++SKIN_UID}`; body = `<defs><filter id="${fid}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${k.filter}"/></filter></defs><g filter="url(#${fid})">${body}</g>`; }
  const vb = /viewBox="([\d.\-]+) ([\d.\-]+) ([\d.]+) ([\d.]+)"/.exec(head), sc = vb ? +vb[3] / 200 : 1, ox = vb ? +vb[1] : 0, oy = vb ? +vb[2] : 0; // 그림 크기(120 또는 200)에 맞춰 덧그림 크기 조절
  return `${head}${body}<g class="skin-over" transform="translate(${ox} ${oy}) scale(${sc})">${k.over ? k.over(opts) : ''}</g></svg>`;
}
const cosArt = skinArt; // 예전 이름
// 스킨 이펙트 실행 (kind: attack | hit | enter)
function skinFx(id, kind, el, m) { try { SKIN_FX[id]?.[kind]?.(el, m); } catch { /* 연출 실패는 무시 */ } }
// 스킨 미리보기 그림 (그 골목몬 + 스킨)
const skinIcon = (id, size = 64, opts = {}) => { const k = SKIN_FX[id]; if (!k) return ''; return `<span class="skin-ic" style="width:${size}px;height:${size}px">${skinArt(monArt(k.only, false), id, opts)}</span>`; };
(function patchGot() {
  if (typeof gotItem !== 'function') return;
  const orig = gotItem;
  window.gotItem = gotItem = (x) => {
    if (x.k === 'costume') return `<div class="got-i got-cos">${skinIcon(x.id, 96)}<b>스킨: ${esc(x.n || x.id)}</b><small>${esc(G.data.MONSTERS[SKIN_FX[x.id]?.only]?.n || '')} 전용 · 내 골목몬에서 입혀요</small></div>`;
    if (x.k === 'jelly') return `<div class="got-i"><span class="got-dice">🍮</span><b>말랑 젤리 ×${x.n}</b></div>`;
    if (x.k === 'fp') return `<div class="got-i"><span class="got-dice">💝</span><b>우정 포인트 +${x.n}</b></div>`;
    return orig(x);
  };
})();


const timeAgo = (t) => { const s = Math.round((Date.now() - t) / 1000); if (s < 60) return '방금'; if (s < 3600) return `${Math.floor(s / 60)}분 전`; if (s < 86400) return `${Math.floor(s / 3600)}시간 전`; return `${Math.floor(s / 86400)}일 전`; };
const dateStr = (t) => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const KIND_N = { pvp: '친구 대전', rank: '랭크전', practice: '연습전', tag: '태그전', raid: '레이드', dungeon: '던전', tourney: '토너먼트' };

/* ---------- 소식: 공지·패치노트 ---------- */
async function showNews(back = showLobby) {
  G.screen = 'news'; app.className = '';
  app.innerHTML = `${topbar('📢 소식')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = await api('GET', '/api/news'); } catch (e) { return toast(e.message); }
  api('POST', '/api/news/seen').then(() => { if (G.user.badges) G.user.badges.news = 0; }).catch(() => {});
  let tab = 'all';
  const draw = () => {
    const list = v.list.filter((n) => tab === 'all' || n.kind === tab);
    app.innerHTML = `${topbar('📢 소식')}
      <div class="tabs styletabs">${[['all', '전체'], ['notice', '📌 공지'], ['patch', '🛠 패치노트']].map(([k, n]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      ${G.user.dev ? `<section class="panel"><h2>✍️ 글쓰기 (개발자)</h2><form id="nw" class="gd-form"><select name="kind"><option value="notice">공지</option><option value="patch">패치노트</option></select>
        <input name="title" maxlength="60" placeholder="제목" required><textarea name="body" rows="5" placeholder="내용 (줄바꿈 그대로 보여요)"></textarea><label class="rd-bots"><input type="checkbox" name="pin"> 맨 위에 고정 + 로비 띠 공지</label><button class="btn">올리기</button></form></section>` : ''}
      ${list.map((n) => `<article class="news ${n.kind} ${n.pin ? 'pin' : ''} ${n.at > v.seen ? 'new' : ''}"><header><em>${n.pin ? '📌 ' : ''}${n.kind === 'patch' ? '패치노트' : '공지'}</em>${n.at > v.seen ? '<b class="nw-new">NEW</b>' : ''}<small>${dateStr(n.at)}</small></header>
        <h3>${esc(n.title)}</h3><p>${esc(n.body).replace(/\n/g, '<br>')}</p>${G.user.dev && n.id.startsWith('n') ? `<button class="btn small paper" data-del="${n.id}">지우기</button>` : ''}</article>`).join('') || '<section class="panel"><p class="muted">아직 소식이 없어요.</p></section>'}`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; draw(); }; });
    app.querySelector('#nw')?.addEventListener('submit', async (e) => { e.preventDefault(); const f = e.target; try { v.list = (await api('POST', '/api/dev/news', { kind: f.kind.value, title: f.title.value, body: f.body.value, pin: f.pin.checked })).list; NEWS_PIN = v.list.find((n) => n.pin) || null; toast('올렸어요!'); draw(); } catch (err) { toast(err.message); } });
    app.querySelectorAll('[data-del]').forEach((b) => { b.onclick = async () => { if (!confirm('지울까요?')) return; try { v.list = (await api('POST', '/api/dev/news/delete', { id: b.dataset.del })).list; NEWS_PIN = v.list.find((n) => n.pin) || null; draw(); } catch (err) { toast(err.message); } }; });
  };
  draw();
}
// 로비 위쪽 고정 공지 띠
let NEWS_PIN = null;
function newsBanner() { return NEWS_PIN ? `<button class="news-band" id="news-band">📌 <b>${esc(NEWS_PIN.title)}</b><span>자세히 ›</span></button>` : ''; }
function loadNewsPin() { G.newsAt = Date.now(); api('GET', '/api/news').then((v) => { const p = v.list.find((n) => n.pin); const changed = (p?.id || null) !== (NEWS_PIN?.id || null); NEWS_PIN = p || null; if (changed && G.screen === 'lobby') renderLobby(); }).catch(() => {}); }

/* ---------- 관리자 대시보드 ---------- */
async function showAdmin(back = showLobby) {
  G.screen = 'admin'; app.className = '';
  app.innerHTML = `${topbar('🛠 관리자')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let d; try { d = (await api('GET', '/api/dev/dash')).dash; } catch (e) { return toast(e.message); }
  const g = d.gist, ok = !g.on || (g.lastOkAgoSec !== null && g.lastOkAgoSec < 180 && !g.lastErr);
  app.innerHTML = `${topbar('🛠 관리자')}
    <section class="adm-grid">${[['접속 중', d.online], ['대전 중', d.battles], ['전체 계정', d.users], ['오늘 접속', d.today], ['이번 주 접속', d.week], ['길드', d.guilds], ['메모리', `${d.mem}MB`], ['켜진 지', `${Math.floor(d.uptime / 3600)}시간 ${Math.floor(d.uptime / 60) % 60}분`]].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</section>
    <section class="panel adm-gist ${ok ? 'ok' : 'bad'}"><h2>${ok ? '✅' : '⚠️'} 데이터 백업 (Gist)</h2>
      <p>${!g.on ? 'Gist 백업이 꺼져 있어요 (로컬 저장만).' : `마지막 백업: ${g.lastOkAgoSec === null ? '아직 없음' : `${g.lastOkAgoSec}초 전`}${g.dirty ? ' · 올릴 변경 있음' : ''}${g.fails ? ` · 연속 실패 ${g.fails}번` : ''}`}</p>${g.lastErr ? `<p class="muted">최근 오류: ${esc(g.lastErr)}</p>` : ''}</section>
    <section class="panel"><h2>🔎 유저 찾기 · 지급</h2><form id="adm-find" class="row"><input name="name" placeholder="닉네임" required style="flex:1"><button class="btn small">찾기</button></form><div id="adm-user"></div></section>
    <section class="panel"><h2>🏆 토너먼트</h2><p class="muted">토요일 21시에 자동으로 열려요. 지금 바로 이번 회차를 진행할 수도 있어요.</p><button class="btn small" id="adm-tour">지금 토너먼트 진행하기</button></section>
    <section class="panel"><h2>👥 최근 접속</h2>${d.recent.map((r) => `<div class="adm-row"><b>${r.online ? '🟢' : '⚪'} ${esc(r.name)}</b><small>${timeAgo(r.at)}</small></div>`).join('')}</section>
    <section class="panel"><h2>📜 지급 기록</h2>${d.log.length ? d.log.map((l) => `<div class="adm-row"><b>${esc(l.to)}</b><small>${dateStr(l.at)} · ${esc(Object.entries(l.r).map(([k, v]) => `${k} ${v}`).join(', '))}${l.note ? ` · ${esc(l.note)}` : ''}</small></div>`).join('') : '<p class="muted">아직 없어요.</p>'}</section>`;
  app.querySelector('#back').onclick = back;
  app.querySelector('#adm-tour').onclick = async () => { if (!confirm('이번 회차 토너먼트를 지금 진행할까요? 신청한 사람들의 경기가 바로 치러져요.')) return; try { await api('POST', '/api/dev/tourney/run', {}); toast('토너먼트를 진행했어요!'); showTourney(() => showAdmin(back)); } catch (e) { toast(e.message); } };
  const box = app.querySelector('#adm-user');
  const drawUser = (u) => {
    box.innerHTML = `<div class="adm-card"><h3>${u.online ? '🟢' : '⚪'} ${esc(u.name)} <small>${u.guild ? `· ${esc(u.guild)}` : ''}</small></h3>
      <p>GP ${fmt(u.gp)} · 입수권 ${u.tickets} · 스킵권 ${u.skips} · 리롤권 ${u.rerolls} · 메가스톤 ${u.stones} · 길P ${u.gpt} · 우정 ${u.fp} · 젤리 ${u.jelly}</p>
      <p>골목몬 ${u.mons}마리 (${u.species}종) · 이로치: ${u.shinies.length ? esc(u.shinies.join(', ')) : '없음'}</p>
      <p>${u.wins}승 ${u.losses}패 · 랭크 ${u.rank}점 · 가입 ${u.createdAt ? dateStr(u.createdAt) : '-'} · 마지막 접속 ${u.lastSeen ? timeAgo(u.lastSeen) : '-'}</p>
      <form id="adm-give" class="adm-give"><h4>지급 (빼려면 음수)</h4>
        ${[['gp', 'GP'], ['tickets', '입수권'], ['skips', '스킵권'], ['rerolls', '리롤권'], ['stones', '메가스톤(랜덤)'], ['gpt', '길P']].map(([k, n]) => `<label>${n}<input type="number" name="${k}" value="0"></label>`).join('')}
        <label>골목몬<select name="mon"><option value="">없음</option><option value="random">랜덤</option>${Object.entries(G.data.MONSTERS).map(([id, m]) => `<option value="${id}">${esc(m.n)}</option>`).join('')}</select></label>
        <label class="ck"><input type="checkbox" name="shiny"> 이로치로</label>
        <label>스킨<select name="costume"><option value="">없음</option>${Object.entries(SKIN_FX).map(([id, k]) => `<option value="${id}">${k.name} (${esc(G.data.MONSTERS[k.only]?.n || '')})</option>`).join('')}</select></label>
        <label class="wide">편지 내용 (비우면 기본 문구)<input name="note" maxlength="200" placeholder="예: 데이터 복구 보상이에요"></label>
        <button class="btn wide">🎁 지급하기</button></form></div>`;
    box.querySelector('#adm-give').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target;
      const r = {}; for (const k of ['gp', 'tickets', 'skips', 'rerolls', 'stones', 'gpt']) if (+f[k].value) r[k] = +f[k].value;
      if (f.mon.value) { r.mon = f.mon.value; if (f.shiny.checked) r.shiny = true; }
      if (f.costume.value) r.costume = f.costume.value;
      if (!Object.keys(r).length) return toast('지급할 것을 하나 이상 넣어 주세요.');
      if (!confirm(`${u.name}님에게 지급할까요?`)) return;
      try { drawUser((await api('POST', '/api/dev/give', { name: u.name, r, note: f.note.value })).info); toast('지급했어요!'); } catch (err) { toast(err.message); }
    };
  };
  app.querySelector('#adm-find').onsubmit = async (e) => { e.preventDefault(); try { drawUser((await api('POST', '/api/dev/user', { name: e.target.name.value.trim() })).info); } catch (err) { box.innerHTML = `<p class="muted">${esc(err.message)}</p>`; } };
}

/* ---------- 전적 통계 ---------- */
async function showStats(back = showLobby) {
  G.screen = 'stats'; app.className = '';
  app.innerHTML = `${topbar('📊 전적')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let s; try { s = (await api('GET', '/api/stats')).stats; } catch (e) { return toast(e.message); }
  const t = s.total, games = t.wins + t.losses + t.draws, rate = games ? Math.round((t.wins / games) * 100) : 0;
  const maxG = Math.max(1, ...s.daily.map((d) => d.g));
  app.innerHTML = `${topbar('📊 전적')}
    <section class="st-hero"><div class="st-ring" style="--p:${rate}"><b>${rate}%</b><small>승률</small></div>
      <div><b class="st-big">${t.wins}승 ${t.losses}패${t.draws ? ` ${t.draws}무` : ''}</b><p>최고 ${t.streakBest}연승 · 무피해 승 ${t.flawless} · 메가 ${t.megas} · Z기술 ${t.zmoves}</p><p>레이드 승 ${t.raidWins} · 태그 승 ${t.tagWins} · 연습 승 ${t.botWins} · 훈련장 최고 ${fmt(t.dummyBest)}</p></div></section>
    ${s.daily.length ? `<section class="panel"><h2>최근 2주 대전 수</h2><div class="st-bars">${s.daily.map((d) => `<div title="${d.d}: ${d.g}판 ${d.w}승"><i style="height:${(d.g / maxG) * 100}%"><u style="height:${d.g ? (d.w / d.g) * 100 : 0}%"></u></i><small>${d.d.slice(8)}</small></div>`).join('')}</div><p class="muted" style="font-size:12px">진한 부분이 이긴 판</p></section>` : ''}
    <section class="panel"><h2>골목몬별 기록</h2>${s.mons.length ? `<div class="st-mons">${s.mons.map((m) => `<div class="st-mon"><div class="st-art">${monArt(m.sp)}</div><div><b>${esc(m.n)}</b><small>${m.g}판 · 승률 ${Math.round((m.w / m.g) * 100)}% · 평균 딜 ${fmt(Math.round(m.dmg / m.g))} · ${m.kills}킬 · 최고 ${fmt(m.best)}</small><div class="qbar"><i style="width:${(m.w / m.g) * 100}%"></i></div></div></div>`).join('')}</div>` : '<p class="muted">대전을 하면 여기에 쌓여요. (이번 업데이트부터 기록돼요)</p>'}</section>
    ${s.h2h.length ? `<section class="panel"><h2>상대 전적</h2>${s.h2h.map((h) => `<div class="adm-row"><b>vs ${esc(h.n)}</b><small>${h.w}승 ${h.l}패${h.d ? ` ${h.d}무` : ''}</small></div>`).join('')}</section>` : ''}
    <section class="panel"><h2>최근 대전 · 리플레이</h2>${s.matches.length ? s.matches.map((m) => `<div class="st-match ${m.draw ? 'draw' : m.won ? 'win' : 'lose'}"><em>${m.draw ? '무' : m.won ? '승' : '패'}</em><div><b>${KIND_N[m.kind] || m.kind} · vs ${esc(m.opp || '?')}</b><small>${timeAgo(m.at)} · ${m.turns}턴 · ${m.mons.map((x) => esc(G.data.MONSTERS[x.s]?.n || x.s)).join(', ')}</small></div>${m.rep ? `<span class="st-repb"><button class="btn small" data-rep="${m.rep}">▶ 다시 보기</button><button class="btn small paper" data-share="${m.rep}" title="공유">🔗 공유</button></span>` : ''}</div>`).join('') : '<p class="muted">아직 기록이 없어요.</p>'}</section>`;
  app.querySelector('#back').onclick = back;
  app.querySelectorAll('[data-rep]').forEach((b) => { b.onclick = () => playReplay(b.dataset.rep, () => showStats(back)); });
  app.querySelectorAll('[data-share]').forEach((b) => { b.onclick = () => shareReplay(b.dataset.share); });
}

/* ---------- 리플레이 ---------- */
// 📼 리플레이 공유: 채팅방(전체·길드·친구)에 「▶ 보기」 카드로 올리거나 링크 복사
async function shareReplay(id) {
  if (!Social.view) { try { await loadSocial(); } catch { /* 친구 목록 없이 */ } }
  const fr = Social.view?.friends || [];
  const url = `${location.origin}/?replay=${encodeURIComponent(id)}`;
  const bg = openSheet(`<div class="rp-share"><h2>📼 리플레이 공유</h2>
    <label class="rp-msg">한마디 <input id="rp-txt" maxlength="120" placeholder="예: 이거 역전한 거 봐!!"></label>
    <div class="rp-dest"><button class="btn" data-to="world">🌏 전체 채팅에</button>${G.user.guild ? `<button class="btn" data-to="guild">${G.user.guild.emblem} 길드 채팅에</button>` : ''}
      ${fr.map((f) => `<button class="btn paper" data-to="dm:${esc(f.key)}">💬 ${esc(f.name)}에게</button>`).join('')}</div>
    <div class="rp-link"><input readonly value="${esc(url)}"><button class="btn small" data-copy>🔗 링크 복사</button></div>
    <p class="muted" style="font-size:12px">링크를 열면 로그인한 뒤 바로 리플레이가 재생돼요. 오래된 리플레이는 지워질 수 있어요.</p>
    <div class="row"><button class="btn paper" data-x>닫기</button></div></div>`);
  bg.querySelector('[data-x]').onclick = closeSheet;
  bg.querySelectorAll('[data-to]').forEach((b) => { b.onclick = () => { wsSend({ t: 'chat', ch: b.dataset.to, text: bg.querySelector('#rp-txt').value.trim(), rep: id }); toast('📼 채팅에 올렸어요!'); closeSheet(); }; });
  bg.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(url); toast('🔗 링크를 복사했어요!'); } catch { bg.querySelector('.rp-link input').select(); toast('링크를 길게 눌러 복사해 주세요.'); } };
}
let REPLAY_BACK = null;
async function playReplay(id, back = showLobby) {
  let r; try { r = (await api('GET', `/api/replay?id=${encodeURIComponent(id)}`)).replay; } catch (e) { return toast(e.message); }
  REPLAY_BACK = back;
  G.replaying = true;
  Battle.enter({ t: 'battle', view: { ...r.start, spectator: true, mustAct: false }, spectator: true, practice: true, replay: true });
  toast(`▶ 리플레이: ${r.names.join(' vs ')}`);
  for (const t of r.turns) Battle.onTurn({ t: 'turn', events: t.events, view: { ...t.view, spectator: true, mustAct: false } });
  document.querySelector('.rp-exit')?.remove();
  const x = document.createElement('button');
  x.className = 'btn small paper rp-exit'; x.textContent = '✕ 리플레이 나가기';
  x.onclick = () => endReplay();
  document.body.appendChild(x);
}
function endReplay() { // 남은 장면 재생을 멈춰야 나간 뒤에 다시 대전 화면으로 끌려가지 않음
  G.replaying = false; document.querySelector('.rp-exit')?.remove();
  Battle.stop(); app.className = '';
  (REPLAY_BACK || showLobby)();
}
// 관전 나가기 버튼을 누르면 리플레이에서는 서버에 알리지 않고 돌아감
document.addEventListener('click', (e) => {
  if (!G.replaying) return;
  const b = e.target.closest('#leave-spec, #to-lobby, .rp-exit, .result-card .btn');
  if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  endReplay();
}, true);

/* ---------- 도감 수집 보상 ---------- */
async function showDexRewards(back) {
  let v; try { v = (await api('GET', '/api/dex/rewards')).dex; } catch (e) { return toast(e.message); }
  const draw = () => {
    const can = v.filter((g) => g.can).length;
    const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>📚 도감 수집 보상</h2><button class="btn small paper" data-x>닫기</button></div>
      ${can ? `<button class="btn wide" id="dx-all" style="margin-bottom:10px">받을 수 있는 보상 ${can}개 모두 받기</button>` : ''}
      <div class="dx-list">${v.map((g) => `<div class="dx-row ${g.got ? 'got' : g.can ? 'can' : ''}"><div><b>${esc(g.n)}</b><div class="qbar"><i style="width:${(g.val / g.goal) * 100}%"></i><span>${g.val} / ${g.goal}</span></div><div class="rws">${rewardChips(g.r)}${g.r.costume ? `<span class="rw">🎨 스킨</span>` : ''}</div></div>${g.got ? '<em>✓ 받음</em>' : g.can ? `<button class="btn small" data-dx="${g.id}">받기</button>` : ''}</div>`).join('')}</div>`);
    bg.querySelector('[data-x]').onclick = closeSheet;
    const claim = async (id) => { try { const r = await api('POST', '/api/dex/claim', { id }); setUser(r); v = r.dex; closeSheet(); showGot(r.got, '도감 보상!', () => { draw(); }); } catch (e) { toast(e.message); } };
    bg.querySelector('#dx-all')?.addEventListener('click', () => claim('all'));
    bg.querySelectorAll('[data-dx]').forEach((b) => { b.onclick = () => claim(b.dataset.dx); });
  };
  draw();
}

/* ---------- 친구 선물 (우정 포인트) ---------- */
async function friendGiftPanel(el, friends) {
  let v; try { v = (await api('GET', '/api/fgift')).fgift; } catch { return; }
  const draw = () => {
    el.innerHTML = `<section class="panel fg"><h2>💝 우정 선물 <small class="muted">오늘 ${v.left}/${v.max}번 남음 · 우정 포인트 ${fmt(v.fp)}</small></h2>
      <p class="muted" style="font-size:13px">하루에 친구마다 한 번 선물을 보낼 수 있어요. 받은 친구는 우정 포인트 ${v.each}점을 얻어요.</p>
      <div class="row" style="flex-wrap:wrap;gap:6px">${v.inbox ? `<button class="btn small" id="fg-claim">🎁 받은 선물 ${v.inbox}개 받기</button>` : ''}${friends.length ? `<button class="btn small paper" id="fg-all" ${v.left ? '' : 'disabled'}>모든 친구에게 보내기</button>` : ''}<button class="btn small paper" id="fg-shop">우정 상점</button></div>
      <div class="fg-list">${friends.map((f) => `<div class="adm-row"><b>${esc(f.name)}</b>${v.sent.includes(f.key) ? '<small>✓ 보냄</small>' : `<button class="btn small" data-fg="${esc(f.key)}" ${v.left ? '' : 'disabled'}>💝 보내기</button>`}</div>`).join('')}</div></section>`;
    el.querySelector('#fg-claim')?.addEventListener('click', async () => { try { const r = await api('POST', '/api/fgift/claim'); setUser(r); v = r.fgift; showGot(r.got, `${r.from.slice(0, 3).join(', ')}${r.from.length > 3 ? ' 외' : ''}님의 우정 선물`, draw); } catch (e) { toast(e.message); } });
    el.querySelector('#fg-all')?.addEventListener('click', async () => { try { const r = await api('POST', '/api/fgift/sendall'); v = r.fgift; toast(`${r.n}명에게 보냈어요!`); draw(); } catch (e) { toast(e.message); } });
    el.querySelectorAll('[data-fg]').forEach((b) => { b.onclick = async () => { try { v = (await api('POST', '/api/fgift/send', { key: b.dataset.fg })).fgift; toast('보냈어요!'); draw(); } catch (e) { toast(e.message); } }; });
    el.querySelector('#fg-shop').onclick = () => {
      const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>💝 우정 상점</h2><button class="btn small paper" data-x>닫기</button></div><p class="muted">우정 포인트 ${fmt(v.fp)}점</p>
        ${v.shop.map((it) => `<div class="adm-row"><b>${it.costume ? skinIcon(it.costume, 40) : ''}${esc(it.n)}</b><button class="btn small" data-fs="${it.id}" ${v.fp >= it.fp ? '' : 'disabled'}>💝 ${it.fp}</button></div>`).join('')}`);
      bg.querySelector('[data-x]').onclick = closeSheet;
      bg.querySelectorAll('[data-fs]').forEach((b) => { b.onclick = async () => { try { const r = await api('POST', '/api/fgift/shop', { id: b.dataset.fs }); setUser(r); v = r.fgift; closeSheet(); showGot(r.got, '교환 완료!', draw); } catch (e) { toast(e.message); } }; });
    };
  };
  draw();
}

/* ---------- 스킨 입히기 / 스킨 도감 ---------- */
let SKIN_LIST = null;
const loadSkins = async () => (SKIN_LIST = (await api('GET', '/api/costumes')).list);
// 미리보기 상자: 누르면 공격·맞기 연출과 소리 (왁뿌말랑왕은 맞을수록 깨짐)
function bindSkinDemo(root, species, shiny, id) {
  const box = root.querySelector('.sk-demo'); if (!box) return;
  let hits = 0;
  const draw = () => { box.innerHTML = skinArt(monArt(species, shiny), id, { crack: hits }); };
  root.querySelector('[data-demo=attack]')?.addEventListener('click', () => skinFx(id, 'attack', box));
  root.querySelector('[data-demo=hit]')?.addEventListener('click', () => { hits = hits >= 6 ? 0 : hits + 1; draw(); skinFx(id, 'hit', box, { hits }); });
  root.querySelector('[data-demo=enter]')?.addEventListener('click', () => { hits = 0; draw(); skinFx(id, 'enter', box); });
}
const demoBtns = () => '<div class="sk-demo-btns"><button class="btn small paper" data-demo="attack">⚔️ 공격</button><button class="btn small paper" data-demo="hit">💥 맞기</button><button class="btn small paper" data-demo="enter">✨ 등장</button></div><p class="muted sk-sound">🔊 소리를 켜고 눌러 보세요</p>';
async function costumeSheet(mon, after) {
  try { await loadSkins(); } catch (e) { return toast(e.message); }
  const sp = G.data.MONSTERS[mon.species], mine = SKIN_LIST.filter((c) => c.only === mon.species);
  const draw = (pick = mon.costume || mine[0]?.id || '') => {
    const c = mine.find((x) => x.id === pick);
    const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>🎨 ${esc(sp.n)} 스킨</h2><button class="btn small paper" data-x>닫기</button></div>
      ${mine.length ? `<div class="sk-demo cos-prev${mon.shiny ? ' is-shiny' : ''}" style="--tc:${G.data.TYPES[sp.types[0]].c}">${pick ? skinArt(monArt(mon.species, mon.shiny), pick) : monArt(mon.species, mon.shiny)}</div>
        ${pick ? demoBtns() : ''}
        <div class="cos-grid"><button class="cos-it ${!pick ? 'on' : ''}" data-sk=""><span class="cos-none">✕</span><b>기본 모습</b></button>
          ${mine.map((x) => `<button class="cos-it ${pick === x.id ? 'on' : ''} ${x.own ? 'own' : ''}" data-sk="${x.id}">${skinIcon(x.id, 64)}${gradeTag(x.grade)}<b>${esc(x.n)}</b><small>${x.own ? '보유' : x.price ? `${fmt(x.price)}GP` : `🍮 ${x.jelly}`}</small></button>`).join('')}</div>
        ${c ? `<p class="sk-d">${esc(c.d)}</p><ul class="sk-fx">${(c.fx || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
        <div class="sc-pay">${!pick ? (mon.costume ? '<button class="btn wide" id="sk-wear">기본 모습으로 돌리기</button>' : '') : c?.own ? (mon.costume === pick ? '<p class="muted">지금 입고 있어요!</p>' : `<button class="btn wide" id="sk-wear">${esc(c.n)} 입히기</button>`) : `${c?.price ? `<button class="btn" id="sk-buy">${ICON.gp(18)} ${fmt(c.price)}GP에 사기</button>` : ''}${c?.jelly ? `<button class="btn mint" id="sk-jelly">🍮 젤리 ${c.jelly}개로 사기</button>` : ''}`}</div>`
      : `<p class="muted" style="margin:10px 0">${esc(sp.n)}은(는) 아직 스킨이 없어요. 스킨 공모전에 직접 만들어 내 보세요! 우승작은 진짜 스킨으로 나와요.</p><button class="btn wide" id="sk-contest">🎨 스킨 공모전 가기</button>`}
      <button class="btn small paper" id="sk-all" style="margin-top:8px;width:100%">다른 골목몬 스킨 둘러보기</button>`);
    bg.querySelector('[data-x]').onclick = closeSheet;
    bg.querySelectorAll('[data-sk]').forEach((b) => { b.onclick = () => { closeSheet(); draw(b.dataset.sk); }; });
    if (pick) bindSkinDemo(bg, mon.species, mon.shiny, pick);
    bg.querySelector('#sk-wear')?.addEventListener('click', async () => { try { setUser(await api('POST', '/api/costume/wear', { uid: mon.uid, id: pick })); mon.costume = pick || undefined; closeSheet(); toast(pick ? '스킨을 입혔어요!' : '기본 모습으로 돌렸어요.'); after?.(); } catch (e) { toast(e.message); } });
    const buy = async (pay) => { try { const r = await api('POST', '/api/costume/buy', { id: pick, pay }); setUser(r); await loadSkins(); closeSheet(); showGot(r.got, '스킨을 샀어요!', () => { mine.splice(0, mine.length, ...SKIN_LIST.filter((x) => x.only === mon.species)); draw(pick); }); } catch (e) { toast(e.message); } };
    bg.querySelector('#sk-buy')?.addEventListener('click', () => buy('gp'));
    bg.querySelector('#sk-jelly')?.addEventListener('click', () => buy('jelly'));
    bg.querySelector('#sk-contest')?.addEventListener('click', () => { closeSheet(); showSkinContest(); });
    bg.querySelector('#sk-all').onclick = () => { closeSheet(); showSkins(() => { showBox(); }); };
  };
  draw();
}
const skinSheet = costumeSheet;
// 스킨 도감: 모든 스킨 둘러보기 + 미리 듣기 + 사기
async function showSkins(back = showLobby) {
  G.screen = 'skins'; app.className = '';
  app.innerHTML = `${topbar('🎨 스킨')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  try { await loadSkins(); } catch (e) { return toast(e.message); }
  let gf = 'all';
  const RANK = { rare: 1, srare: 2, hero: 3, myth: 4, legend: 5 };
  const draw = () => {
    const list = SKIN_LIST.filter((c) => gf === 'all' || (gf === 'own' ? c.own : c.grade === gf)).sort((a, b) => (RANK[b.grade] || 0) - (RANK[a.grade] || 0) || (b.limited ? 1 : 0) - (a.limited ? 1 : 0));
    app.innerHTML = `${topbar('🎨 스킨')}<p style="margin:0 4px 10px;color:#fff;opacity:.9;font-size:14px">스킨은 골목몬마다 전용이에요. 외형이 바뀌고, 공격·맞기·등장할 때 전용 이펙트와 소리가 나요. 등급: 희귀 → 초희귀 → 영웅 → 신화 → 전설. 🎁 미스터리 상자에서도 나와요!</p>
      <div class="sk-filter">${[['all', `전체 ${SKIN_LIST.length}`], ['legend', '전설'], ['myth', '신화'], ['hero', '영웅'], ['srare', '초희귀'], ['rare', '희귀'], ['own', `보유 ${SKIN_LIST.filter((c) => c.own).length}`]].map(([k, n]) => `<button class="${gf === k ? 'on' : ''} g-${k}" data-gf="${k}">${n}</button>`).join('')}</div>
      ${list.map((c) => `<section class="panel sk-card g-${c.grade || 'x'}${c.limited ? ' limited' : ''}" data-id="${c.id}"><div class="sk-row"><div class="sk-demo cos-prev" style="--tc:${G.data.TYPES[G.data.MONSTERS[c.only].types[0]].c}">${skinArt(monArt(c.only, false), c.id)}</div>
        <div class="sk-info">${gradeTag(c.grade)}${c.limited ? '<em class="sk-limited">한정판</em>' : ''}<b>${esc(c.n)}</b><small>${esc(c.onlyN)} 전용</small><p>${esc(c.d)}</p><ul class="sk-fx">${(c.fx || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        ${c.own ? '<em class="sk-own">✓ 보유 · 내 골목몬에서 입혀요</em>' : `<div class="row" style="gap:6px;flex-wrap:wrap">${c.price ? `<button class="btn small" data-buy="${c.id}">${ICON.gp(14)} ${fmt(c.price)}</button>` : ''}${c.jelly ? `<button class="btn small mint" data-jelly="${c.id}">🍮 ${c.jelly}</button>` : ''}</div>`}</div></div>${demoBtns()}</section>`).join('')}
      <button class="btn wide" id="sk-contest">🎨 스킨 공모전: 내가 만든 스킨 내기</button>`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-gf]').forEach((b) => { b.onclick = () => { gf = b.dataset.gf; draw(); }; });
    app.querySelectorAll('.sk-card').forEach((card) => bindSkinDemo(card, SKIN_LIST.find((c) => c.id === card.dataset.id).only, false, card.dataset.id));
    const buy = async (id, pay) => { try { const r = await api('POST', '/api/costume/buy', { id, pay }); setUser(r); await loadSkins(); showGot(r.got, '스킨을 샀어요!', draw); } catch (e) { toast(e.message); } };
    app.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => buy(b.dataset.buy, 'gp'); });
    app.querySelectorAll('[data-jelly]').forEach((b) => { b.onclick = () => buy(b.dataset.jelly, 'jelly'); });
    app.querySelector('#sk-contest').onclick = () => showSkinContest(() => showSkins(back));
  };
  draw();
}

/* ---------- 스킨 공모전 ---------- */
async function showSkinContest(back = showEvents) {
  G.screen = 'skincontest'; app.className = '';
  app.innerHTML = `${topbar('🎨 스킨 공모전')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = await api('GET', '/api/skincontest'); } catch (e) { return toast(e.message); }
  let tab = 'all';
  const img = (e, n = 1) => `/api/skincontest/img?id=${e.id}&n=${n}&t=${e.editedAt || e.at}`;
  const draw = () => {
    const i = v.info, mine = v.list.filter((e) => e.mine), list = tab === 'mine' ? mine : v.list;
    app.innerHTML = `${topbar('🎨 스킨 공모전')}
      <section class="skc-hero"><s aria-hidden="true"></s><small>EVENT · ${dateStr(i.start)} ~ ${dateStr(i.ends)}</small><h2>골목몬 스킨 공모전</h2>
        <p>좋아하는 골목몬의 <b>전용 스킨</b>을 디자인해 주세요! 스킨은 꼭 <b>외형 변화 · 이펙트 · 사운드</b> 세 가지가 있어야 해요. 우승작은 실제 게임에 스킨으로 출시되고, 만든 사람에게 그 스킨을 드려요.</p>
        <p class="muted" style="color:#fffc">한 사람당 ${i.perUser}개 · 지금까지 ${i.count}개 · 마음에 드는 작품에 ❤️를 눌러 주세요</p>
        ${i.closed ? '<b class="skc-closed">접수 마감</b>' : mine.length < i.perUser ? '<button class="btn wide" id="skc-new">✏️ 스킨 내기</button>' : '<p>최대 개수까지 냈어요. 고치거나 지우고 다시 낼 수 있어요.</p>'}</section>
      <div class="tabs styletabs">${[['all', `전체 ${v.list.length}`], ['mine', `내 작품 ${mine.length}`]].map(([k, n]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      ${list.map((e) => `<article class="skc-e ${e.winner ? 'win' : ''}">${e.winner ? '<em class="ct-win">🏆 출시 확정</em>' : ''}
        <div class="skc-imgs"><img src="${img(e)}" alt="${esc(e.name)} 스킨" loading="lazy">${e.img2 ? `<img src="${img(e, 2)}" alt="변화한 모습" loading="lazy">` : ''}</div>
        <div class="skc-b"><h3>${esc(e.name)} <small>· ${esc(G.data.MONSTERS[e.species]?.n || e.species)} 전용</small></h3><small class="muted">${esc(e.user)} · ${dateStr(e.at)}${e.editedAt ? ' (수정)' : ''}</small>
          <dl><dt>👕 외형</dt><dd>${esc(e.look)}</dd><dt>✨ 이펙트</dt><dd>${esc(e.fx)}</dd><dt>🔊 사운드</dt><dd>${esc(e.sound)}</dd></dl>
          <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small ${e.liked ? '' : 'paper'}" data-like="${e.id}" ${e.mine ? 'disabled' : ''}>❤️ ${e.likes}</button>
            ${e.mine && !i.closed ? `<button class="btn small paper" data-edit="${e.id}">고치기</button>` : ''}${(e.mine && !i.closed) || v.dev ? `<button class="btn small paper" data-del="${e.id}">지우기</button>` : ''}
            ${v.dev ? `<button class="btn small ${e.winner ? 'paper' : ''}" data-win="${e.id}">${e.winner ? '우승 취소' : '🏆 우승'}</button>` : ''}</div></div></article>`).join('') || '<section class="panel"><p class="muted">아직 작품이 없어요. 첫 번째 스킨을 내 보세요!</p></section>'}`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; draw(); }; });
    app.querySelector('#skc-new')?.addEventListener('click', () => skinContestForm(null, (nv) => { v = nv; tab = 'mine'; draw(); }, () => showSkinContest(back)));
    const post = async (path, body, msg) => { try { v = await api('POST', path, body); if (msg) toast(msg); draw(); } catch (e) { toast(e.message); } };
    app.querySelectorAll('[data-like]').forEach((b) => { b.onclick = () => post('/api/skincontest/like', { id: b.dataset.like }); });
    app.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { if (confirm('이 작품을 지울까요?')) post('/api/skincontest/delete', { id: b.dataset.del }, '지웠어요.'); }; });
    app.querySelectorAll('[data-win]').forEach((b) => { b.onclick = () => post('/api/skincontest/winner', { id: b.dataset.win }); });
    app.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => skinContestForm(v.list.find((e) => e.id === b.dataset.edit), (nv) => { v = nv; draw(); }, () => showSkinContest(back)); });
  };
  draw();
}
function skinContestForm(old, done, back) {
  G.screen = 'skincontest-form';
  const COLS = ['#1a1433', '#ffffff', '#E8402C', '#FF8A00', '#FFD23F', '#4CD964', '#2F7DE1', '#7FB8A4', '#9A4FB8', '#F27FA5', '#A9713A', '#7C8798'];
  const pad = (id) => `<div class="pad" id="${id}"><canvas aria-label="그림판"></canvas>
    <div class="pad-tools">${COLS.map((c, i) => `<button type="button" class="pc ${i ? '' : 'on'}" data-col="${c}" style="--c:${c}" aria-label="색"></button>`).join('')}</div>
    <div class="pad-tools">${[3, 6, 12, 22].map((n) => `<button type="button" class="ps ${n === 6 ? 'on' : ''}" data-size="${n}" aria-label="굵기 ${n}"><i style="width:${n / 1.4 + 2}px;height:${n / 1.4 + 2}px"></i></button>`).join('')}
      <button type="button" class="pt" data-tool="erase">지우개</button><button type="button" class="pt" data-tool="undo">되돌리기</button><button type="button" class="pt" data-tool="clear">전부 지우기</button>
      <button type="button" class="pt pfile" data-tool="photo">📷 사진 넣기</button><input type="file" accept="image/*" class="vh"></div></div>`;
  const ids = Object.keys(G.data.MONSTERS).filter((id) => !(G.data.BANNED || []).includes(id));
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>${old ? '스킨 고치기' : '스킨 내기'}</h1></div>
    <form id="skc-f">
      <section class="panel"><h2>1. 어떤 골목몬의 스킨인가요?</h2><select name="species" required><option value="">골목몬 고르기</option>${ids.map((id) => `<option value="${id}" ${old?.species === id ? 'selected' : ''}>${esc(G.data.MONSTERS[id].n)}</option>`).join('')}</select>
        <div class="skc-ref" id="skc-ref"></div>
        <input name="name" maxlength="14" placeholder="스킨 이름 (예: 왁뿌말랑왕)" value="${esc(old?.name || '')}" required></section>
      <section class="panel"><h2>2. 스킨 그림 (외형)</h2><p class="muted" style="font-size:13px">스킨을 입은 모습을 그려 주세요. 사진을 넣고 그 위에 그려도 돼요.${old ? ' 비워 두면 예전 그림 그대로예요.' : ''}</p>${pad('pad-1')}</section>
      <section class="panel"><h2>3. 변화한 모습 (선택)</h2><p class="muted" style="font-size:13px">맞거나 공격할 때 모습이 바뀐다면 그 모습을 그려 주세요. (예: 왁스 껍질이 깨진 모습)</p>${pad('pad-2')}</section>
      <section class="panel"><h2>4. 스킨 설명 (셋 다 필수)</h2>
        <label class="skc-l">👕 외형 변화<textarea name="look" maxlength="400" rows="3" placeholder="어떻게 생겼는지, 맞으면 어떻게 바뀌는지">${esc(old?.look || '')}</textarea></label>
        <label class="skc-l">✨ 이펙트<textarea name="fx" maxlength="400" rows="3" placeholder="공격·맞기·등장할 때 어떤 효과가 나는지">${esc(old?.fx || '')}</textarea></label>
        <label class="skc-l">🔊 사운드<textarea name="sound" maxlength="400" rows="3" placeholder="어떤 소리가 나는지 (예: 바삭바삭 왁스 깨지는 ASMR)">${esc(old?.sound || '')}</textarea></label></section>
      <button class="btn wide" id="skc-send">${old ? '고친 내용 저장' : '공모전에 내기'}</button></form>`;
  app.querySelector('#back').onclick = back;
  const p1 = drawPad(app.querySelector('#pad-1')), p2 = drawPad(app.querySelector('#pad-2'));
  const sel = app.querySelector('[name=species]'), ref = app.querySelector('#skc-ref');
  const showRef = () => { ref.innerHTML = sel.value ? `<span>참고: 지금 모습</span>${monArt(sel.value)}` : ''; };
  sel.onchange = showRef; showRef();
  app.querySelector('#skc-f').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = app.querySelector('#skc-send');
    if (!old && !p1.used()) return toast('스킨 그림을 그려 주세요.');
    btn.disabled = true; btn.textContent = '올리는 중…';
    try {
      const r = await api('POST', '/api/skincontest', { id: old?.id, species: f.species.value, name: f.name.value, look: f.look.value, fx: f.fx.value, sound: f.sound.value, image: p1.used() ? p1.data() : '', image2: p2.used() ? p2.data() : '' });
      toast(old ? '고쳤어요!' : '공모전에 냈어요! 🎉'); done(r);
    } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = old ? '고친 내용 저장' : '공모전에 내기'; }
  };
}
if (typeof EVENTS !== 'undefined') EVENTS.unshift({ id: 'skincontest', title: '🎨 스킨 공모전', period: '11월 15일 ~ 11월 29일', desc: '골목몬 전용 스킨(외형·이펙트·사운드)을 디자인해 주세요! 우승작은 실제 스킨으로 출시돼요.', ends: Date.parse('2026-11-29T23:59:59+09:00'), open: () => showSkinContest() });


/* ---------- 주간 토너먼트 ---------- */
async function showTourney(back = showLobby) {
  G.screen = 'tourney'; app.className = '';
  app.innerHTML = `${topbar('🏆 토너먼트')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/tourney')).tourney; } catch (e) { return toast(e.message); }
  const draw = () => {
    const c = v.cur, left = Math.max(0, c.run - Date.now()), d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60;
    const bracket = (x) => x.rounds.map((games, ri) => `<div class="tb-round"><h4>${games.length === 1 ? '결승' : games.length === 2 ? '4강' : `${games.length * 2}강`}</h4>${games.map((g) => `<div class="tb-game"><span class="${g.w === 0 ? 'w' : ''}">${esc(g.an)}</span><span class="${g.w === 1 ? 'w' : ''}">${esc(g.bn)}</span>${g.rep ? `<button class="btn small paper" data-rep="${g.rep}">▶</button>` : ''}</div>`).join('')}</div>`).join('');
    app.innerHTML = `${topbar('🏆 토너먼트')}
      <section class="tb-hero"><s aria-hidden="true"></s><small>골목 주간 토너먼트</small><h2>${c.done ? '이번 회차 끝!' : `${d ? `${d}일 ` : ''}${h}시간 ${m}분 뒤 시작`}</h2>
        <p>매주 <b>토요일 밤 9시</b>, 신청한 사람들의 덱 앞 ${c.size}마리로 AI가 대신 싸워요. 경기는 리플레이로 볼 수 있어요. 인원이 모자라면 골목대장이 채워요.</p>
        <div class="tb-rw"><b>🥇 우승</b><div class="rws">${rewardChips(v.reward[1])}<span class="rw">👑 칭호</span></div></div>
        <div class="tb-rw"><b>🥈 준우승</b><div class="rws">${rewardChips(v.reward[2])}<span class="rw">칭호</span></div></div>
        <div class="tb-rw"><b>🥉 4강</b><div class="rws">${rewardChips(v.reward[4])}</div></div>
        <div class="tb-rw"><b>참가</b><div class="rws">${rewardChips(v.reward.all)}</div></div>
        ${c.done ? '' : `<div class="tb-team">${c.team.map((t) => `<span class="${t.shiny ? 'is-shiny' : ''}">${monArt(t.species, t.shiny)}</span>`).join('')}<small>지금 덱 앞 ${c.size}마리로 나가요</small></div>
        <button class="btn wide ${c.joined ? 'paper' : ''}" id="tb-join">${c.joined ? '✓ 신청함 (누르면 취소)' : '🏆 참가 신청'}</button>`}
        <p class="muted" style="margin-top:6px">신청 ${c.count}명${c.entrants.length ? `: ${c.entrants.map(esc).join(', ')}` : ''}</p></section>
      ${c.done && c.rounds.length ? `<section class="panel"><h2>🏆 우승: ${esc(c.champion)}</h2><div class="tb-bracket">${bracket(c)}</div></section>` : ''}
      ${v.last ? `<section class="panel"><h2>지난 회차 (${v.last.week}) · 🏆 ${esc(v.last.champion || '-')}</h2><div class="tb-bracket">${bracket(v.last)}</div></section>` : ''}`;
    app.querySelector('#back').onclick = back;
    app.querySelector('#tb-join')?.addEventListener('click', async () => { try { v = (await api('POST', '/api/tourney/join', { on: !v.cur.joined })).tourney; toast(v.cur.joined ? '신청했어요! 토요일 밤 9시에 만나요.' : '신청을 취소했어요.'); draw(); } catch (e) { toast(e.message); } });
    app.querySelectorAll('[data-rep]').forEach((b) => { b.onclick = () => playReplay(b.dataset.rep, () => showTourney(back)); });
  };
  draw();
}

/* ---------- 밴픽 대전 ---------- */
let DRAFT_TIMER = null;
function onDraftMsg(m) {
  G.screen = 'draft'; app.className = '';
  clearInterval(DRAFT_TIMER);
  const card = (x, i, ban) => `<button class="df-mon${x.shiny ? ' is-shiny' : ''}${ban ? ' ban' : ''}" ${ban !== undefined ? `data-ban="${i}"` : ''} style="--tc:${G.data.TYPES[G.data.MONSTERS[x.species].types[0]].c}">${cosArt(monArt(x.species, x.shiny), x.costume)}<b>${esc(G.data.MONSTERS[x.species].n)}</b>${ban ? '<em>🚫 금지</em>' : ''}</button>`;
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="df-leave">나가기</button><h1>🚫 밴픽</h1><b class="df-clock" id="df-clock"></b></div>
    <section class="panel"><h2>${esc(m.oppName)}님의 덱 · 1마리를 금지하세요</h2><p class="muted">금지한 골목몬은 이번 대전에 못 나와요. 남은 ${m.size}마리로 싸워요.</p>
      <div class="df-grid">${m.opp.map((x, i) => card(x, i, m.myBan === null ? false : i === m.myBan)).join('')}</div>
      <p class="wait">${m.myBan === null ? '눌러서 금지할 골목몬을 고르세요' : m.oppDone ? '곧 시작해요!' : '상대가 고르는 중…'}</p></section>
    <section class="panel"><h2>내 덱</h2><div class="df-grid mine">${m.mine.map((x) => card(x, 0)).join('')}</div><p class="muted">${m.bot ? '골목대장은 벌써 금지할 골목몬을 골랐어요. (시작할 때 공개)' : m.oppDone ? '상대가 금지를 골랐어요. (시작할 때 공개)' : '상대도 내 덱에서 1마리를 금지해요.'}</p></section>`;
  app.querySelector('#df-leave').onclick = () => { if (confirm('밴픽을 나가면 이번 대전이 취소돼요. 나갈까요?')) wsSend({ t: 'draft_leave' }); };
  if (m.myBan === null) app.querySelectorAll('[data-ban]').forEach((b) => { b.onclick = () => { if (confirm(`${G.data.MONSTERS[m.opp[+b.dataset.ban].species].n}을(를) 금지할까요?`)) wsSend({ t: 'draft_ban', id: m.id, index: +b.dataset.ban }); }; });
  const tick = () => { const el = document.getElementById('df-clock'); if (!el) return clearInterval(DRAFT_TIMER); el.textContent = `${Math.max(0, Math.ceil((m.end - Date.now()) / 1000))}초`; };
  tick(); DRAFT_TIMER = setInterval(tick, 500);
}

/* ---------- 기간 한정 이벤트: 말랑말랑 축제 ---------- */
async function showMallang(back = showEvents) {
  G.screen = 'mallang'; app.className = '';
  app.innerHTML = `${topbar('🍮 말랑말랑 축제')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/event')).event; } catch (e) { return toast(e.message); }
  const draw = () => {
    app.innerHTML = `${topbar('🍮 말랑말랑 축제')}
      <section class="ml-hero"><s aria-hidden="true"></s><div class="ml-crown">${skinIcon('wakppu', 150)}</div><small>기간 한정 이벤트 · ${dateStr(v.start)} ~ ${dateStr(v.end - 1)}</small><h2>말랑말랑 축제</h2><p>${esc(v.d)}</p>
        <div class="ml-jelly"><b>🍮 ${fmt(v.jelly)}</b><small>오늘 대전으로 ${v.today}/${v.dailyCap}개 · 매일 첫 접속 +${v.login}</small></div>
        <p class="muted" style="color:#fff9">친구 대전 승 4·패 2 · 태그·레이드 3·1 · 연습 2·1</p></section>
      <section class="panel"><h2>🛍️ 이벤트 상점</h2>${v.shop.map((it) => `<div class="ml-item">${it.costume ? skinIcon(it.costume, 54) : '<span class="ml-ic">🎁</span>'}<div><b>${esc(it.n)}</b><small>${it.left !== null ? `남은 교환 ${it.left}번` : ''}</small></div>${it.own ? '<em>✓ 보유</em>' : `<button class="btn small" data-eb="${it.id}" ${v.live && v.jelly >= it.jelly && (it.left === null || it.left > 0) ? '' : 'disabled'}>🍮 ${it.jelly}</button>`}</div>`).join('')}</section>`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-eb]').forEach((b) => { b.onclick = async () => { try { const r = await api('POST', '/api/event/buy', { id: b.dataset.eb }); setUser(r); v = r.event; showGot(r.got, '교환 완료!', draw); } catch (e) { toast(e.message); } }; });
  };
  draw();
}
if (typeof EVENTS !== 'undefined') EVENTS.unshift({ id: 'mallang', title: '🍮 말랑말랑 축제', period: '11월 15일 ~ 11월 30일', desc: '대전하고 말랑 젤리를 모아 말랑왕 전용 스킨 「왁뿌말랑왕」으로 바꿔요!', ends: Date.parse('2026-12-01T00:00:00+09:00') - 1, open: () => showMallang() });

/* ---------- 푸시 알림 ---------- */
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
let SW_REG = null;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then((r) => { SW_REG = r; }).catch(() => {});
const b64uToBytes = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
async function pushEnable() {
  if (!pushSupported()) return toast('이 브라우저는 푸시 알림을 못 써요. 홈 화면에 추가한 앱이나 크롬에서 해 보세요.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return toast('알림 권한을 허용해야 받을 수 있어요.');
  const reg = SW_REG || await navigator.serviceWorker.ready;
  const { key } = await api('GET', '/api/push/key');
  if (!key) return toast('서버 알림 키가 아직 없어요. 잠시 뒤 다시 해 주세요.');
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) });
  await api('POST', '/api/push/sub', { sub: sub.toJSON() });
  await api('POST', '/api/push/test');
  toast('🔔 푸시 알림을 켰어요! 시험 알림이 곧 와요.');
}
async function pushDisable() {
  try { const reg = SW_REG || await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); await api('POST', '/api/push/unsub', { endpoint: sub?.endpoint || '' }); await sub?.unsubscribe(); } catch { /* 이미 꺼져 있음 */ }
  toast('푸시 알림을 껐어요.');
}
const IN_APP = / GolmokApp\//.test(navigator.userAgent);
const APK_URL = 'https://github.com/likeace77-collab/golmok-battle/releases/download/app-latest/golmok.apk';
function pushSettingsHTML() {
  return `${IN_APP ? '' : /Android/i.test(navigator.userAgent) ? `<section class="panel"><h2>📱 안드로이드 앱</h2><p class="muted" style="font-size:13px">앱으로 하면 크롬이 아니라 「골목대전」 앱 사용 시간으로 잡혀요. 받은 파일(golmok.apk)을 눌러 설치하세요. 처음엔 「출처를 알 수 없는 앱 설치」를 허용해야 할 수 있어요.</p><a class="btn wide" href="${APK_URL}" style="display:block;text-align:center;text-decoration:none">⬇️ 골목대전 앱 받기</a></section>` : ''}<section class="panel"><h2>🔊 대전 효과음</h2><p class="muted" style="font-size:13px">기술마다 다른 소리가 나요. 무음 모드면 안 들릴 수 있어요.</p>
    <div class="row"><button class="btn small ${MoveSfx.off() ? 'paper' : ''}" id="sfx-on">켜기</button><button class="btn small ${MoveSfx.off() ? '' : 'paper'}" id="sfx-off">끄기</button><button class="btn small paper" id="sfx-test">들어보기</button></div></section>
    ${IN_APP ? '<section class="panel"><h2>🔔 푸시 알림</h2><p class="muted" style="font-size:13px">앱에서는 푸시 알림을 받을 수 없어요. 알림이 필요하면 크롬에서 켜 주세요.</p></section>' : `<section class="panel"><h2>🔔 푸시 알림</h2><p class="muted" style="font-size:13px">스카우트 준비, 원정 귀환, 대전 신청, 레이드 초대, 우정 선물, 토너먼트 결과를 휴대폰 알림으로 받아요. 게임을 보고 있을 때는 알림이 뜨지 않아요.</p>
    <div class="row"><button class="btn small" id="push-on">알림 켜기</button><button class="btn small paper" id="push-off">끄기</button><button class="btn small paper" id="push-test">시험 알림</button></div></section>`}`;
}
function bindPushSettings(root = app) {
  const sfxBtns = () => { root.querySelector('#sfx-on')?.classList.toggle('paper', MoveSfx.off()); root.querySelector('#sfx-off')?.classList.toggle('paper', !MoveSfx.off()); };
  root.querySelector('#sfx-on')?.addEventListener('click', () => { MoveSfx.toggle(true); sfxBtns(); toast('효과음을 켰어요.'); });
  root.querySelector('#sfx-off')?.addEventListener('click', () => { MoveSfx.toggle(false); sfxBtns(); toast('효과음을 껐어요.'); });
  root.querySelector('#sfx-test')?.addEventListener('click', () => { const ids = Object.keys(G.data.MOVES); let i = 0; const go = () => { const id = ids[Math.floor(Math.random() * ids.length)], mv = G.data.MOVES[id]; MoveSfx.attack({ id, type: mv.type, cat: mv.cat }); toast(`${mv.n} (${G.data.TYPES[mv.type]?.n || mv.type})`); if (++i < 4) setTimeout(go, 1100); }; go(); });
  root.querySelector('#push-on')?.addEventListener('click', () => pushEnable().catch((e) => toast(e.message)));
  root.querySelector('#push-off')?.addEventListener('click', () => pushDisable());
  root.querySelector('#push-test')?.addEventListener('click', () => api('POST', '/api/push/test').then(() => toast('시험 알림을 보냈어요.')).catch((e) => toast(e.message)));
}

/* ---------- 아이콘 공모전 ---------- */
async function showIconContest(back = showEvents) {
  G.screen = 'iconcontest'; app.className = '';
  app.innerHTML = `${topbar('📱 아이콘 공모전')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = await api('GET', '/api/iconcontest'); } catch (e) { return toast(e.message); }
  let tab = 'all';
  const img = (e) => `/api/iconcontest/img?id=${e.id}&t=${e.editedAt || e.at}`;
  const draw = () => {
    const i = v.info, mine = v.list.filter((e) => e.mine), list = tab === 'mine' ? mine : v.list;
    app.innerHTML = `${topbar('📱 아이콘 공모전')}
      <section class="skc-hero icc-hero"><s aria-hidden="true"></s><small>EVENT · ${dateStr(i.start)} ~ ${dateStr(i.ends)}</small><h2>골목대전 아이콘 공모전</h2>
        <p>휴대폰 홈 화면에 들어갈 <b>골목대전 앱 아이콘</b>을 그려 주세요! 우승작은 <b>진짜 앱 아이콘</b>이 되고, 만든 사람에게 <b>${fmt(i.prize)}GP</b>와 신화 칭호 <b>「${esc(i.titleName)}」</b>을 드려요.</p>
        <p class="muted" style="color:#fffc">한 사람당 ${i.perUser}개 · 지금까지 ${i.count}개 · 마음에 드는 작품에 ❤️를 눌러 주세요</p>
        ${i.closed ? '<b class="skc-closed">접수 마감</b>' : mine.length < i.perUser ? '<button class="btn wide" id="icc-new">✏️ 아이콘 내기</button>' : '<p>최대 개수까지 냈어요. 고치거나 지우고 다시 낼 수 있어요.</p>'}</section>
      <div class="tabs styletabs">${[['all', `전체 ${v.list.length}`], ['mine', `내 작품 ${mine.length}`]].map(([k, n]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      <div class="icc-grid">${list.map((e) => `<article class="icc-e ${e.winner ? 'win' : ''}">${e.winner ? '<em class="ct-win">🏆 우승</em>' : ''}
        <div class="icc-phone"><img class="icc-big" src="${img(e)}" alt="${esc(e.name)}" loading="lazy"><div class="icc-home"><img src="${img(e)}" alt="" loading="lazy"><small>골목대전</small></div></div>
        <h3>${esc(e.name)}</h3><small class="muted">${esc(e.user)} · ${dateStr(e.at)}${e.editedAt ? ' (수정)' : ''}</small>
        ${e.desc ? `<p class="icc-d">${esc(e.desc)}</p>` : ''}
        <div class="row" style="gap:6px;flex-wrap:wrap"><button class="btn small ${e.liked ? '' : 'paper'}" data-like="${e.id}" ${e.mine ? 'disabled' : ''}>❤️ ${e.likes}</button>
          ${e.mine && !i.closed ? `<button class="btn small paper" data-edit="${e.id}">고치기</button>` : ''}${(e.mine && !i.closed) || v.dev ? `<button class="btn small paper" data-del="${e.id}">지우기</button>` : ''}
          ${v.dev ? `<button class="btn small ${e.winner ? 'paper' : ''}" data-win="${e.id}">${e.winner ? '우승 취소' : '🏆 우승'}</button>` : ''}</div></article>`).join('')}</div>
      ${list.length ? '' : '<section class="panel"><p class="muted">아직 작품이 없어요. 첫 번째 아이콘을 내 보세요!</p></section>'}`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; draw(); }; });
    app.querySelector('#icc-new')?.addEventListener('click', () => iconContestForm(null, (nv) => { v = nv; tab = 'mine'; draw(); }, () => showIconContest(back)));
    const post = async (path, body, msg) => { try { v = await api('POST', path, body); if (msg) toast(msg); draw(); } catch (e) { toast(e.message); } };
    app.querySelectorAll('[data-like]').forEach((b) => { b.onclick = () => post('/api/iconcontest/like', { id: b.dataset.like }); });
    app.querySelectorAll('[data-del]').forEach((b) => { b.onclick = () => { if (confirm('이 작품을 지울까요?')) post('/api/iconcontest/delete', { id: b.dataset.del }, '지웠어요.'); }; });
    app.querySelectorAll('[data-win]').forEach((b) => { b.onclick = () => post('/api/iconcontest/winner', { id: b.dataset.win }); });
    app.querySelectorAll('[data-edit]').forEach((b) => { b.onclick = () => iconContestForm(v.list.find((e) => e.id === b.dataset.edit), (nv) => { v = nv; draw(); }, () => showIconContest(back)); });
  };
  draw();
}
function iconContestForm(old, done, back) {
  G.screen = 'iconcontest-form';
  const COLS = ['#1a1433', '#ffffff', '#E8402C', '#FF8A00', '#FFD23F', '#4CD964', '#2F7DE1', '#7FB8A4', '#9A4FB8', '#F27FA5', '#A9713A', '#7C8798'];
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">돌아가기</button><h1>${old ? '아이콘 고치기' : '아이콘 내기'}</h1></div>
    <form id="icc-f">
      <section class="panel"><h2>1. 아이콘 그리기</h2><p class="muted" style="font-size:13px">네모 칸 전체가 아이콘이 돼요. 휴대폰에서는 모서리가 둥글게 잘리니 중요한 건 가운데에 그려 주세요. 사진을 넣고 그 위에 그려도 돼요.${old ? ' 비워 두면 예전 그림 그대로예요.' : ''}</p>
        <div class="pad" id="icc-pad"><canvas aria-label="그림판"></canvas>
        <div class="pad-tools">${COLS.map((c, i) => `<button type="button" class="pc ${i ? '' : 'on'}" data-col="${c}" style="--c:${c}" aria-label="색"></button>`).join('')}</div>
        <div class="pad-tools">${[3, 6, 12, 22].map((n) => `<button type="button" class="ps ${n === 6 ? 'on' : ''}" data-size="${n}" aria-label="굵기 ${n}"><i style="width:${n / 1.4 + 2}px;height:${n / 1.4 + 2}px"></i></button>`).join('')}
          <button type="button" class="pt" data-tool="erase">지우개</button><button type="button" class="pt" data-tool="undo">되돌리기</button><button type="button" class="pt" data-tool="clear">전부 지우기</button>
          <button type="button" class="pt pfile" data-tool="photo">📷 사진 넣기</button><input type="file" accept="image/*" class="vh"></div></div>
        <div class="icc-prev"><span>홈 화면 미리보기</span><div class="icc-home"><canvas id="icc-mini" width="96" height="96"></canvas><small>골목대전</small></div></div></section>
      <section class="panel"><h2>2. 작품 이름과 설명</h2>
        <input name="name" maxlength="16" placeholder="작품 이름 (예: 네온 골목)" value="${esc(old?.name || '')}" required>
        <label class="skc-l" style="margin-top:8px">설명 (선택)<textarea name="desc" maxlength="300" rows="3" placeholder="어떤 느낌으로 그렸는지 알려 주세요">${esc(old?.desc || '')}</textarea></label></section>
      <button class="btn wide" id="icc-send">${old ? '고친 내용 저장' : '공모전에 내기'}</button></form>`;
  app.querySelector('#back').onclick = back;
  const pad = drawPad(app.querySelector('#icc-pad')), big = app.querySelector('#icc-pad canvas'), mini = app.querySelector('#icc-mini').getContext('2d');
  const sync = () => mini.drawImage(big, 0, 0, 96, 96);
  if (old) { const im = new Image(); im.onload = () => { mini.drawImage(im, 0, 0, 96, 96); }; im.src = `/api/iconcontest/img?id=${old.id}&t=${old.editedAt || old.at}`; }
  ['pointerup', 'pointermove'].forEach((ev) => big.addEventListener(ev, () => { if (pad.used()) sync(); }));
  app.querySelector('#icc-pad').addEventListener('click', () => setTimeout(() => { if (pad.used()) sync(); }, 60));
  app.querySelector('#icc-pad input[type=file]').addEventListener('change', () => setTimeout(sync, 400));
  app.querySelector('#icc-f').onsubmit = async (e) => {
    e.preventDefault(); const f = e.target, btn = app.querySelector('#icc-send');
    if (!old && !pad.used()) return toast('아이콘을 그려 주세요.');
    btn.disabled = true; btn.textContent = '올리는 중…';
    try {
      const r = await api('POST', '/api/iconcontest', { id: old?.id, name: f.name.value, desc: f.desc.value, image: pad.used() ? pad.data() : '' });
      toast(old ? '고쳤어요!' : '공모전에 냈어요! 🎉'); done(r);
    } catch (err) { toast(err.message); btn.disabled = false; btn.textContent = old ? '고친 내용 저장' : '공모전에 내기'; }
  };
}
if (typeof EVENTS !== 'undefined') EVENTS.unshift({ id: 'iconcontest', title: '📱 아이콘 공모전', period: '11월 15일 ~ 11월 29일', desc: '골목대전 앱 아이콘을 그려 주세요! 우승작은 진짜 앱 아이콘이 되고 50,000GP + 신화 칭호를 드려요.', ends: Date.parse('2026-11-29T23:59:59+09:00'), open: () => showIconContest() });
