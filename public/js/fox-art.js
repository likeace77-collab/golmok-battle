'use strict';
/* 여우비: 해가 떠 있는데 비가 오는 날(여우비)에만 나타나는 아기 여우. 꼬리 끝이 몽실한 비구름.
   기본 · 메가진화(아홉꼬리 무지개 여우비) · 거다이맥스(하늘을 덮는 여우비) */
(() => {
  const D = (s) => `<g stroke="#1a1433" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
  // 반짝반짝 큰 눈: 진한 타원 + 그라데이션 눈동자 + 큰 하이라이트 두 개
  const eye = (x, y, rx, ry, g, star = false) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#2a1638"/>`
    + `<ellipse cx="${x}" cy="${y + ry * .28}" rx="${rx * .78}" ry="${ry * .6}" fill="url(#${g})" stroke="none"/>`
    + (star ? `<path d="M${x} ${y - ry * .2}l${rx * .14} ${ry * .3} ${rx * .34} ${ry * .04}-${rx * .26} ${ry * .2} ${rx * .08} ${ry * .34}-${rx * .3}-${ry * .18}-${rx * .3} ${ry * .18} ${rx * .08}-${ry * .34}-${rx * .26}-${ry * .2} ${rx * .34}-${ry * .04}z" fill="#fff6a8" stroke="none"/>` : '')
    + `<ellipse cx="${x - rx * .32}" cy="${y - ry * .38}" rx="${rx * .36}" ry="${ry * .3}" fill="#fff" stroke="none"/>`
    + `<circle cx="${x + rx * .38}" cy="${y + ry * .36}" r="${rx * .17}" fill="#fff" stroke="none"/>`
    + `<circle cx="${x + rx * .05}" cy="${y - ry * .62}" r="${rx * .09}" fill="#fff" stroke="none" opacity=".8"/>`;
  const drop = (x, y, s = 1, c = '#7fd0ff') => `<path d="M${x} ${y - 8 * s}Q${x + 6 * s} ${y} ${x} ${y + 4 * s}Q${x - 6 * s} ${y} ${x} ${y - 8 * s}Z" fill="${c}" stroke-width="${1.8 * Math.min(1.2, s)}"/><circle cx="${x - 1.6 * s}" cy="${y - .5 * s}" r="${1.1 * s}" fill="#fff" stroke="none"/>`;
  const spark = (x, y, r, c = '#fff6a8') => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}" stroke-width="1.4"/>`;
  const cloud = (x, y, s, fill) => `<path d="M${x - 22 * s} ${y + 8 * s}Q${x - 32 * s} ${y + 8 * s} ${x - 30 * s} ${y - 2 * s}Q${x - 28 * s} ${y - 12 * s} ${x - 16 * s} ${y - 10 * s}Q${x - 12 * s} ${y - 24 * s} ${x + 2 * s} ${y - 20 * s}Q${x + 14 * s} ${y - 28 * s} ${x + 22 * s} ${y - 12 * s}Q${x + 34 * s} ${y - 12 * s} ${x + 32 * s} ${y + 2 * s}Q${x + 32 * s} ${y + 10 * s} ${x + 20 * s} ${y + 8 * s}Z" fill="${fill}"/>`;
  const sun = (x, y, r) => `<g>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<path d="M${(x + Math.cos(a) * r * 1.25).toFixed(1)} ${(y + Math.sin(a) * r * 1.25).toFixed(1)}L${(x + Math.cos(a) * r * 1.7).toFixed(1)} ${(y + Math.sin(a) * r * 1.7).toFixed(1)}" stroke="#FFB627" stroke-width="${r * .3}"/>`; }).join('')}<circle cx="${x}" cy="${y}" r="${r}" fill="#FFD23F" stroke-width="2.2"/><circle cx="${x - r * .3}" cy="${y - r * .3}" r="${r * .3}" fill="#fff6c8" stroke="none"/></g>`;
  // 얼굴 (머리 중심 x,y · 크기 s). 메가는 별눈
  const face = (x, y, s, g, star) => `
    <path d="M${x - 48 * s} ${y + 4 * s}Q${x - 54 * s} ${y - 40 * s} ${x} ${y - 44 * s}Q${x + 54 * s} ${y - 40 * s} ${x + 48 * s} ${y + 4 * s}L${x + 64 * s} ${y + 12 * s}L${x + 52 * s} ${y + 20 * s}L${x + 60 * s} ${y + 30 * s}L${x + 42 * s} ${y + 32 * s}Q${x + 26 * s} ${y + 46 * s} ${x} ${y + 46 * s}Q${x - 26 * s} ${y + 46 * s} ${x - 42 * s} ${y + 32 * s}L${x - 60 * s} ${y + 30 * s}L${x - 52 * s} ${y + 20 * s}L${x - 64 * s} ${y + 12 * s}Z" fill="url(#ybF)"/>
    <path d="M${x - 58 * s} ${y + 14 * s}Q${x - 28 * s} ${y + 6 * s} ${x - 12 * s} ${y + 18 * s}Q${x} ${y + 8 * s} ${x + 12 * s} ${y + 18 * s}Q${x + 28 * s} ${y + 6 * s} ${x + 58 * s} ${y + 14 * s}L${x + 50 * s} ${y + 21 * s}L${x + 56 * s} ${y + 28 * s}L${x + 41 * s} ${y + 31 * s}Q${x + 26 * s} ${y + 45 * s} ${x} ${y + 45 * s}Q${x - 26 * s} ${y + 45 * s} ${x - 41 * s} ${y + 31 * s}L${x - 56 * s} ${y + 28 * s}L${x - 50 * s} ${y + 21 * s}Z" fill="#FFF6EA" stroke-width="${2.6 * s}"/>
    <path d="M${x - 8 * s} ${y - 42 * s}q${8 * s} ${10 * s} ${16 * s} 0" fill="none" stroke-width="${2.4 * s}"/>
    ${eye(x - 22 * s, y + 4 * s, 12 * s, 15 * s, g, star)}${eye(x + 22 * s, y + 4 * s, 12 * s, 15 * s, g, star)}
    <ellipse cx="${x - 36 * s}" cy="${y + 22 * s}" rx="${8 * s}" ry="${4.6 * s}" fill="#FF8FB1" stroke="none" opacity=".75"/><ellipse cx="${x + 36 * s}" cy="${y + 22 * s}" rx="${8 * s}" ry="${4.6 * s}" fill="#FF8FB1" stroke="none" opacity=".75"/>
    <path d="M${x - 4 * s} ${y + 19 * s}Q${x} ${y + 16 * s} ${x + 4 * s} ${y + 19 * s}Q${x} ${y + 24 * s} ${x - 4 * s} ${y + 19 * s}Z" fill="#3a1f2e" stroke-width="${1.8 * s}"/>
    <path d="M${x - 8 * s} ${y + 26 * s}q${4 * s} ${5 * s} ${8 * s} 0q${4 * s} ${5 * s} ${8 * s} 0" fill="none" stroke-width="${2.4 * s}"/>
    <path d="M${x - 3 * s} ${y + 29 * s}q${3 * s} ${6 * s} ${6 * s} 0z" fill="#FF6B8B" stroke-width="${1.6 * s}"/>`;
  const ears = (x, y, s, tip = '#7a3a1c') => [-1, 1].map((d) => `
    <path d="M${x + d * 14 * s} ${y - 38 * s}Q${x + d * 30 * s} ${y - 70 * s} ${x + d * 50 * s} ${y - 76 * s}Q${x + d * 60 * s} ${y - 50 * s} ${x + d * 54 * s} ${y - 12 * s}Z" fill="url(#ybF)"/>
    <path d="M${x + d * 24 * s} ${y - 36 * s}Q${x + d * 36 * s} ${y - 60 * s} ${x + d * 48 * s} ${y - 64 * s}Q${x + d * 54 * s} ${y - 44 * s} ${x + d * 48 * s} ${y - 20 * s}Z" fill="#FFB3C7" stroke-width="${2.2 * s}"/>
    <path d="M${x + d * 40 * s} ${y - 72 * s}Q${x + d * 50 * s} ${y - 77 * s} ${x + d * 56 * s} ${y - 62 * s}Q${x + d * 48 * s} ${y - 66 * s} ${x + d * 40 * s} ${y - 72 * s}Z" fill="${tip}" stroke-width="${2 * s}"/>`).join('');
  const DEFS = (extra = '') => `<defs>
    <linearGradient id="ybF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB86B"/><stop offset="1" stop-color="#FF8A3D"/></linearGradient>
    <radialGradient id="ybE" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#9be7ff"/><stop offset=".6" stop-color="#4a9cff"/><stop offset="1" stop-color="#3a2a8a"/></radialGradient>
    <radialGradient id="ybM" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#ffe9a8"/><stop offset=".55" stop-color="#ff7ac8"/><stop offset="1" stop-color="#7a2ab8"/></radialGradient>
    <linearGradient id="ybT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB86B"/><stop offset="1" stop-color="#FF7A2A"/></linearGradient>
    <linearGradient id="ybC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d4ecff"/></linearGradient>${extra}</defs>`;

  /* ---------- 기본: 여우비 ---------- */
  const BASE = DEFS() + D(`
    <ellipse cx="100" cy="184" rx="62" ry="8" fill="#000" fill-opacity=".22" stroke="none"/>
    <path d="M122 178Q190 188 190 126Q190 96 172 86Q162 118 150 134Q138 150 120 154Z" fill="url(#ybT)"/>
    <path d="M150 170Q180 164 184 130" fill="none" stroke="#FFD9A8" stroke-width="4" opacity=".8"/>
    ${cloud(176, 96, .7, 'url(#ybC)')}
    ${drop(186, 118, .8)}${drop(198, 110, .6)}${drop(164, 116, .7)}
    <path d="M64 182Q56 140 76 124Q100 112 124 124Q144 140 136 182Z" fill="url(#ybF)"/>
    <path d="M82 182Q78 150 100 140Q122 150 118 182Z" fill="#FFF6EA" stroke-width="2.6"/>
    <path d="M76 182q-4-14 8-16q10 2 8 16zM108 182q-2-14 8-16q12 2 8 16z" fill="#FFF6EA" stroke-width="2.6"/>
    <path d="M84 176v6M88 176v6M116 176v6M120 176v6" stroke-width="1.8"/>
    ${ears(100, 98, 1)}
    ${face(100, 98, 1, 'ybE', false)}
    ${sun(140, 50, 6)}
    ${spark(36, 70, 6)}${spark(28, 120, 4, '#bfe8ff')}${drop(40, 150, .8)}`);

  /* ---------- 메가진화: 아홉꼬리 무지개 여우비 ---------- */
  const RAIN = ['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#748FFC', '#B197FC', '#F783AC', '#FFFFFF'];
  const tails = RAIN.map((c, i) => {
    const a = -186 + i * (192 / 8), L = 104, w = 17, cx = 100, cy = 150;
    const tf = `translate(${cx} ${cy}) rotate(${a.toFixed(1)})`;
    return `<g transform="${tf}"><ellipse cx="${L * .55}" cy="0" rx="${L * .45}" ry="${w}" fill="${c}"/><path d="M${L * .14} ${-w * .9}Q${L * .7} ${-w * 1.25} ${L * .72} 0Q${L * .7} ${w * 1.25} ${L * .14} ${w * .9}Z" fill="url(#ybT)" stroke="none"/><path d="M${L * .72} ${-w * .96}Q${L * .66} 0 ${L * .72} ${w * .96}" fill="none" stroke-width="2.4"/><path d="M${L * .3} ${-w * .4}Q${L * .5} ${-w * .7} ${L * .64} ${-w * .5}" fill="none" stroke="#FFD9A8" stroke-width="3"/></g>`;
  }).join('');
  const MEGA = DEFS(`<radialGradient id="ybH" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff6a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>`) + D(`
    <circle cx="100" cy="110" r="96" fill="url(#ybH)" stroke="none"/>
    <path d="M14 120A86 86 0 0 1 186 120" fill="none" stroke="#FF6B6B" stroke-width="5" opacity=".55"/><path d="M22 120A78 78 0 0 1 178 120" fill="none" stroke="#FFD43B" stroke-width="5" opacity=".55"/><path d="M30 120A70 70 0 0 1 170 120" fill="none" stroke="#4DABF7" stroke-width="5" opacity=".55"/>
    ${tails}
    <ellipse cx="100" cy="186" rx="66" ry="8" fill="#000" fill-opacity=".22" stroke="none"/>
    <path d="M62 184Q54 140 76 124Q100 112 124 124Q146 140 138 184Z" fill="url(#ybF)"/>
    <path d="M82 184Q78 150 100 140Q122 150 118 184Z" fill="#FFF6EA" stroke-width="2.6"/>
    <path d="M74 184q-4-14 8-16q10 2 8 16zM110 184q-2-14 8-16q12 2 8 16z" fill="#FFF6EA" stroke-width="2.6"/>
    <path d="M70 132Q100 150 130 132" fill="none" stroke="#E8402C" stroke-width="7"/><path d="M70 132Q100 150 130 132" fill="none" stroke="#ff8a8a" stroke-width="2"/>
    <circle cx="100" cy="146" r="8" fill="#FFD23F" stroke-width="2.4"/><path d="M96 148h8" stroke-width="1.6"/><path d="M100 154l-6 14h12z" fill="#ff4d8a" stroke-width="2"/><path d="M97 168v10M103 168v10" stroke="#ff4d8a" stroke-width="2.4"/>
    ${ears(100, 96, 1, '#ffffff')}
    ${face(100, 96, 1, 'ybM', true)}
    <path d="M100 48l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#FFD23F" stroke-width="2"/>
    ${cloud(26, 26, .45, 'url(#ybC)')}${cloud(176, 22, .42, 'url(#ybC)')}
    ${drop(20, 42, .6)}${drop(32, 48, .5)}${drop(180, 38, .55)}
    ${spark(22, 160, 6)}${spark(180, 164, 7)}${spark(170, 70, 4, '#ffb3e0')}${spark(30, 84, 4, '#bfe8ff')}`);

  /* ---------- 거다이맥스: 하늘을 덮는 여우비 ---------- */
  const houses = [[-4, 22, 24, '#E8402C'], [18, 20, 34, '#4DABF7'], [162, 20, 30, '#69DB7C'], [182, 22, 22, '#FFA94D']].map(([x, w, h, c]) =>
    `<path d="M${x} 200V${200 - h}h${w}V200z" fill="#f4ecdc" stroke-width="2.4"/><path d="M${x - 3} ${200 - h}L${x + w / 2} ${200 - h - 12}L${x + w + 3} ${200 - h}z" fill="${c}" stroke-width="2.4"/><rect x="${x + w / 2 - 4}" y="${200 - h + 8}" width="8" height="8" fill="#FFE45C" stroke-width="1.8"/>`).join('');
  const bigTails = [-165, -138, -42, -15].map((a, i) => {
    const r = (a * Math.PI) / 180, L = 104, cx = 100, cy = 120, x2 = cx + Math.cos(r) * L, y2 = cy + Math.sin(r) * L, w = 22, nx = -Math.sin(r) * w, ny = Math.cos(r) * w;
    return `<path d="M${(cx + nx * .3).toFixed(1)} ${(cy + ny * .3).toFixed(1)}Q${(cx + Math.cos(r) * L * .55 + nx).toFixed(1)} ${(cy + Math.sin(r) * L * .55 + ny).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}Q${(cx + Math.cos(r) * L * .55 - nx).toFixed(1)} ${(cy + Math.sin(r) * L * .55 - ny).toFixed(1)} ${(cx - nx * .3).toFixed(1)} ${(cy - ny * .3).toFixed(1)}Z" fill="url(#ybT)"/>`
      + cloud(cx + Math.cos(r) * (L - 6), cy + Math.sin(r) * (L - 6), .55, 'url(#ybC)');
  }).join('');
  const GMAX = DEFS(`<linearGradient id="ybS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#ffe2b8"/></linearGradient>`) + D(`
    <rect x="-6" y="-10" width="212" height="212" rx="20" fill="url(#ybS)" stroke="none" opacity=".55"/>
    ${[['#FF6B6B', 96], ['#FFA94D', 89], ['#FFD43B', 82], ['#69DB7C', 75], ['#4DABF7', 68], ['#B197FC', 61]].map(([c, r]) => `<path d="M${100 - r} 140A${r} ${r} 0 0 1 ${100 + r} 140" fill="none" stroke="${c}" stroke-width="7" opacity=".75"/>`).join('')}
    ${bigTails}
    <path d="M28 200Q20 150 52 128Q100 104 148 128Q180 150 172 200Z" fill="url(#ybF)"/>
    <path d="M70 200Q66 158 100 146Q134 158 130 200Z" fill="#FFF6EA" stroke-width="2.8"/>
    ${houses}
    <path d="M44 200q-6-20 12-24q16 2 14 24zM130 200q-2-22 14-24q18 4 12 24z" fill="#FFF6EA" stroke-width="2.8"/>
    ${ears(100, 96, 1.18, '#ffffff')}
    ${face(100, 96, 1.18, 'ybE', true)}
    ${sun(100, 8, 9)}
    ${Array.from({ length: 16 }, (_, i) => drop(8 + (i * 37) % 190, 16 + ((i * 53) % 150), .6 + (i % 3) * .15)).join('')}
    ${spark(16, 40, 6)}${spark(186, 50, 7)}${spark(186, 120, 4, '#bfe8ff')}`);

  if (typeof NEW_ART !== 'undefined') NEW_ART.yeoubi = BASE;
  if (typeof MEGA_ART !== 'undefined') MEGA_ART.yeoubi = MEGA;
  if (typeof GMAX_ART !== 'undefined') GMAX_ART.yeoubi = GMAX;
  if (typeof window !== 'undefined') window.FOX_ART = { BASE, MEGA, GMAX };
})();
