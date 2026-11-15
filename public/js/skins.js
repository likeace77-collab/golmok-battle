'use strict';
/* 🎨 등급별 스킨: 서버가 보내 준 SKIN_GEN(테마·색·덧그림·이펙트)으로 SKIN_FX를 채워요 */
const SKO = (() => {
  const R = (seed) => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const dots = (n, seed, f) => { const r = R(seed); return Array.from({ length: n }, (_, i) => f(r, i)).join(''); };
  return {
    grain: () => `<g class="sko-grain" opacity=".35">${dots(40, 7, (r) => `<rect x="${(r() * 200).toFixed(0)}" y="${(r() * 200).toFixed(0)}" width="2" height="${(2 + r() * 8).toFixed(0)}" fill="${r() < .5 ? '#000' : '#fff'}"/>`)}</g>`,
    frame: () => '<g fill="#3b2a18" opacity=".85"><path d="M4 4h34l-34 34z"/><path d="M196 4h-34l34 34z"/><path d="M4 196h34l-34-34z"/><path d="M196 196h-34l34-34z"/></g>',
    chips: () => `<g>${dots(12, 3, (r) => `<ellipse cx="${(40 + r() * 120).toFixed(0)}" cy="${(50 + r() * 110).toFixed(0)}" rx="5" ry="3.5" transform="rotate(${(r() * 180).toFixed(0)})" fill="#4a2c14" opacity=".85"/>`)}</g>`,
    petals: () => `<g class="sko-fall">${dots(9, 11, (r, i) => `<path transform="translate(${(r() * 190).toFixed(0)} ${(r() * 180).toFixed(0)}) rotate(${(r() * 360).toFixed(0)})" d="M0 0q6-8 12 0q-6 8-12 0z" fill="#ffc1dc" stroke="#e57aa8" stroke-width="1" style="animation-delay:${-i * .5}s"/>`)}</g>`,
    sparkle: () => `<g class="sko-twinkle">${dots(7, 5, (r, i) => `<path transform="translate(${(15 + r() * 170).toFixed(0)} ${(15 + r() * 170).toFixed(0)}) scale(${(.5 + r() * .7).toFixed(2)})" d="M0-10L2.5-2.5 10 0 2.5 2.5 0 10-2.5 2.5-10 0-2.5-2.5Z" fill="#fff" stroke="#ffd1ef" stroke-width="1.2" style="animation-delay:${-i * .3}s"/>`)}</g>`,
    moon: () => `<g><path d="M168 16a20 20 0 1 0 18 28a16 16 0 1 1 -18 -28z" fill="#ffe9a8" stroke="#1a1433" stroke-width="2"/></g>${SKO.sparkle()}`,
    bubbles: () => `<g class="sko-rise">${dots(8, 13, (r, i) => `<circle cx="${(20 + r() * 160).toFixed(0)}" cy="${(120 + r() * 70).toFixed(0)}" r="${(3 + r() * 6).toFixed(1)}" fill="#bff0ff55" stroke="#e8fbff" stroke-width="1.5" style="animation-delay:${-i * .4}s"/>`)}</g>`,
    scan: () => `<g opacity=".18">${Array.from({ length: 25 }, (_, i) => `<rect y="${i * 8}" width="200" height="3" fill="#2ef2ff"/>`).join('')}</g>`,
    embers: () => `<g class="sko-rise">${dots(10, 17, (r, i) => `<circle cx="${(20 + r() * 160).toFixed(0)}" cy="${(110 + r() * 80).toFixed(0)}" r="${(1.8 + r() * 2.5).toFixed(1)}" fill="${r() < .5 ? '#ffb02e' : '#ff4a1c'}" style="animation-delay:${-i * .35}s"/>`)}</g>`,
    snow: () => `<g class="sko-fall">${dots(10, 19, (r, i) => `<text x="${(r() * 190).toFixed(0)}" y="${(r() * 180).toFixed(0)}" font-size="${(9 + r() * 8).toFixed(0)}" fill="#fff" style="animation-delay:${-i * .45}s">❄</text>`)}</g>`,
    stars: () => `<g class="sko-twinkle">${dots(16, 23, (r, i) => `<circle cx="${(r() * 200).toFixed(0)}" cy="${(r() * 200).toFixed(0)}" r="${(.8 + r() * 1.8).toFixed(1)}" fill="#fff" style="animation-delay:${-i * .25}s"/>`)}</g><ellipse cx="100" cy="110" rx="80" ry="34" fill="#b37bff" opacity=".14" transform="rotate(-18 100 110)"/>`,
    shards: () => `<g class="sko-float">${dots(6, 29, (r, i) => `<path transform="translate(${(10 + r() * 180).toFixed(0)} ${(10 + r() * 170).toFixed(0)}) rotate(${(r() * 60 - 30).toFixed(0)})" d="M0-12L6 0 0 12-6 0Z" fill="#e8fdff" stroke="#6fd8ff" stroke-width="1.5" opacity=".9" style="animation-delay:${-i * .4}s"/>`)}</g>`,
    eyes: () => '<g class="sko-blink"><ellipse cx="22" cy="40" rx="6" ry="3" fill="#ff2a4a"/><ellipse cx="38" cy="40" rx="6" ry="3" fill="#ff2a4a"/><ellipse cx="166" cy="168" rx="5" ry="2.5" fill="#ff2a4a"/><ellipse cx="180" cy="168" rx="5" ry="2.5" fill="#ff2a4a"/></g>',
    crown: () => `<g class="sko-rays" opacity=".35">${Array.from({ length: 12 }, (_, i) => `<path transform="rotate(${i * 30} 100 104)" d="M100 104L94 -6H106Z" fill="#FFE27A"/>`).join('')}</g><g transform="translate(100 14)"><path d="M-26 14L-30 -10-14 2 0-16 14 2 30-10 26 14Z" fill="#FFD23F" stroke="#1a1433" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-2" r="4" fill="#ff3b6b" stroke="#1a1433" stroke-width="1.5"/><circle cx="-15" cy="6" r="2.6" fill="#2ef2ff"/><circle cx="15" cy="6" r="2.6" fill="#2ef2ff"/></g>`,
    halo: () => '<ellipse class="sko-halo" cx="100" cy="12" rx="34" ry="8" fill="none" stroke="#fff6a8" stroke-width="5"/>',
  };
})();
function skinsRegister(gen) {
  if (typeof SKIN_FX === 'undefined' || !gen) return;
  for (const [id, g] of Object.entries(gen)) {
    if (SKIN_FX[id]) continue;
    SKIN_FX[id] = { name: g.n, only: g.only, ...(g.mx ? { filter: g.mx } : {}), ...(g.cls ? { cls: g.cls } : {}),
      over: () => (SKO[g.over] ? SKO[g.over]() : ''),
      attack: (el) => { try { Sfx[g.snd]?.(); } catch { /* 소리 없이 */ } fxBurst(el, { chars: g.chars, colors: g.colors, n: 10, spread: 80, size: [12, 20] }); },
      hit: (el) => { fxBurst(el, { chars: g.chars, colors: g.colors, n: 6, spread: 50, size: [10, 16] }); fxFlash(el, 'sk-hit', 300); },
      enter: (el) => { fxBurst(el, { chars: g.chars, colors: g.colors, n: 14, spread: 100, rise: 20, size: [12, 22] }); } };
  }
}
// 등급 표시
const gradeTag = (g) => { const G2 = G.data.SKIN_GRADES?.[g]; return G2 ? `<em class="sk-grade g-${g}" style="--gc:${G2.c}">${G2.n}</em>` : ''; };
