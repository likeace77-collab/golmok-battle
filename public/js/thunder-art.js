'use strict';
/* ⚡ 썬더 거다이맥스 「거다이 광속 무한 질주」: 붉은 거다이 구름 위로 거대한 ∞ 빛길, 노란 잔상 셋, 도는 수리검, 갈라진 땅 */
(() => {
  const shuri = (x, y, s, cls, delay) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="${cls}" style="animation-delay:${delay}s">
    <path d="M0-30L7-7 30 0 7 7 0 30-7 7-30 0-7-7Z" fill="url(#thg-gold)" stroke="#3a1a00" stroke-width="2.5" stroke-linejoin="round"/>
    <circle r="6" fill="#ff6a1c" stroke="#3a1a00" stroke-width="2"/><circle r="2.5" fill="#fff6c2"/></g></g>`;
  const bolt = (d, delay) => `<path class="thg-bolt" style="animation-delay:${delay}s" d="${d}" fill="none" stroke="#FFF59A" stroke-width="3.2" stroke-linejoin="round" filter="url(#thg-glow)"/>`;
  const GMAX = `<defs>
      <radialGradient id="thg-bg" cx="50%" cy="58%" r="60%"><stop offset="0" stop-color="#ffdf5a" stop-opacity=".95"/><stop offset=".35" stop-color="#ff7a1c" stop-opacity=".55"/><stop offset=".7" stop-color="#b0124a" stop-opacity=".35"/><stop offset="1" stop-color="#2a0030" stop-opacity="0"/></radialGradient>
      <linearGradient id="thg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#FFD23F"/><stop offset="1" stop-color="#e07a00"/></linearGradient>
      <linearGradient id="thg-road" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFE45C" stop-opacity="0"/><stop offset=".3" stop-color="#FFE45C"/><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#FFB800" stop-opacity=".2"/></linearGradient>
      <filter id="thg-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="thg-ghost"><feColorMatrix type="matrix" values="1 .3 0 0 .25  .6 .6 0 0 .2  0 0 .2 0 0  0 0 0 .6 0"/></filter>
    </defs>
    <ellipse class="thg-pulse" cx="100" cy="112" rx="112" ry="104" fill="url(#thg-bg)"/>
    <g opacity=".6">${[[12, 192, .6], [56, 198, .5], [146, 198, .55], [190, 190, .6], [100, 202, .45]].map(([x, y, s], i) => `<g transform="translate(${x} ${y}) scale(${s})"><g class="thg-cloud" style="animation-delay:${-i * .5}s"><ellipse rx="30" ry="13" fill="#d81b4a"/><ellipse cx="12" cy="-7" rx="18" ry="11" fill="#ff4d6d"/><ellipse cx="-14" cy="-5" rx="14" ry="9" fill="#ff7a8c"/></g></g>`).join('')}</g>
    <g class="thg-inf" filter="url(#thg-glow)"><path d="M100 104C70 60 6 62 6 104S70 148 100 104 194 60 194 104 130 148 100 104" fill="none" stroke="url(#thg-road)" stroke-width="9" stroke-linecap="round" stroke-dasharray="70 26"/>
      <path d="M100 104C70 60 6 62 6 104S70 148 100 104 194 60 194 104 130 148 100 104" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="30 66" class="thg-inf2"/></g>
    ${bolt('M14 30l14 12-8 4 16 14', 0)}${bolt('M186 24l-12 14 8 3-14 16', -.4)}${bolt('M30 150l12-6-2 10 14-8', -.8)}${bolt('M176 146l-10-8 2 10-14-6', -.2)}
    <path d="M10 196l30-14 18 8 24-12 20 10 26-14 20 12 24-8 22 14" fill="none" stroke="#FFD23F" stroke-width="3" filter="url(#thg-glow)" opacity=".85"/>
    <g class="thg-ghosts"><image class="thg-gh1" href="img/mon/thunder-atk.webp" x="-36" y="-2" width="210" height="210" filter="url(#thg-ghost)" opacity=".28"/>
      <image class="thg-gh2" href="img/mon/thunder-atk.webp" x="-18" y="-6" width="216" height="216" filter="url(#thg-ghost)" opacity=".45"/></g>
    <image class="thg-main" href="img/mon/thunder-atk.webp" x="-8" y="-14" width="226" height="226"/>
    <g class="thg-inf front" opacity=".8"><path d="M100 104C70 60 6 62 6 104S70 148 100 104 194 60 194 104 130 148 100 104" fill="none" stroke="#FFF59A" stroke-width="3" stroke-linecap="round" stroke-dasharray="18 60" filter="url(#thg-glow)"/></g>
    <g class="thg-speed" opacity=".7">${[30, 52, 74, 140, 160].map((y, i) => `<path d="M-6 ${y}h${40 + (i % 3) * 18}" stroke="#fff6c2" stroke-width="2" stroke-linecap="round" style="animation-delay:${-i * .09}s"/>`).join('')}</g>
    ${shuri(22, 40, .5, 'thg-spin', 0)}${shuri(186, 52, .62, 'thg-spin', -.3)}${shuri(178, 150, .45, 'thg-spin', -.6)}${shuri(26, 138, .42, 'thg-spin', -.9)}
    <g class="thg-sparks">${Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, r = 86 + (i % 3) * 8; return `<circle cx="${(100 + Math.cos(a) * r).toFixed(1)}" cy="${(108 + Math.sin(a) * r * .8).toFixed(1)}" r="${1.6 + (i % 3)}" fill="#fff6a8" style="animation-delay:${-i * .12}s"/>`; }).join('')}</g>`;
  if (typeof GMAX_ART !== 'undefined') GMAX_ART.thunder = GMAX;
})();
