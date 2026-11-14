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

  const ruins = [[-6, 24, 22, '#5a1a1a'], [16, 20, 32, '#2a3a5a'], [164, 20, 28, '#2a4a2a'], [182, 24, 20, '#5a3a1a']].map(([x, w, h, c]) =>
    `<path d="M${x} 202V${202 - h}l${w * .3} 4 ${w * .2}-6 ${w * .5} 3V202z" fill="#4a4250" stroke-width="2.4"/><path d="M${x - 3} ${202 - h}L${x + w * .4} ${202 - h - 10}L${x + w + 3} ${202 - h + 4}z" fill="${c}" stroke-width="2.4"/><path d="M${x + w * .3} ${202 - h + 8}l4 6-3 5" fill="none" stroke="#ff5a2a" stroke-width="1.6"/>`).join('');
  /* ---------- 거다이맥스: 반전! 가면 벗은 구미호 ----------
     귀여운 여우비 얼굴은 사실 금 간 가면이었다. 반쪽이 깨져 떨어진 자리엔 텅 빈 어둠과 바늘 같은 눈동자들.
     가면 아래로 귀까지 찢어진 입, 가늘고 긴 이빨, 뚝뚝 떨어지는 핏물. 앙상한 갈비뼈, 땅까지 늘어진 긴 손톱,
     아홉 개의 검은 꼬리 끝마다 눈알이 달려 이쪽을 본다. 붉은 달, 깔린 안개, 무너진 골목. */
  const tailEye = (a, L, w) => {
    const r = a * Math.PI / 180, ex = 100 + Math.cos(r) * L, ey = 150 + Math.sin(r) * L, mx = 100 + Math.cos(r + .25) * L * .55, my = 150 + Math.sin(r + .25) * L * .55;
    return `<path d="M100 150Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#1a1433" stroke-width="${w + 6}"/><path d="M100 150Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="url(#ybD)" stroke-width="${w}"/>`
      + `<g transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${a + 90})"><ellipse rx="11" ry="13" fill="#3a0a14"/><ellipse rx="8" ry="5.5" fill="#f2ead2" stroke-width="2"/><circle r="3.4" fill="#d1102a" stroke="none" class="gx-eye"/><circle r="1.3" fill="#000" stroke="none"/><path d="M-8 0q8-7 16 0" fill="none" stroke-width="1.6"/></g>`;
  };
  const pin = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="#ff0a2a" opacity=".22" stroke="none"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffe8e8" stroke="none" class="gx-eye"/><circle cx="${x}" cy="${y}" r="${r * .45}" fill="#ff1030" stroke="none"/>`;
  const needleGrin = (x, y, w, h, n) => {
    let t = '';
    for (let k = 0; k < n; k++) { const u = (k + .5) / n, px = x - w / 2 + w * u, curve = Math.sin(Math.PI * u) * h * .5, top = y - h * .1 + curve * .3, len = h * (.45 + .25 * Math.sin(Math.PI * u));
      t += `<path d="M${(px - 2.4).toFixed(1)} ${top.toFixed(1)}L${px.toFixed(1)} ${(top + len).toFixed(1)}L${(px + 2.4).toFixed(1)} ${top.toFixed(1)}Z"/>`;
      const bt = y + h * 1.25 + curve * .2; t += `<path d="M${(px + 1).toFixed(1)} ${bt.toFixed(1)}L${(px + 3.2).toFixed(1)} ${(bt - len * .8).toFixed(1)}L${(px + 5.4).toFixed(1)} ${bt.toFixed(1)}Z"/>`; }
    return `<path d="M${x - w / 2 - 10} ${y - h * .4}Q${x} ${y + h * .1} ${x + w / 2 + 10} ${y - h * .4}Q${x + w * .46} ${y + h * 1.7} ${x} ${y + h * 1.6}Q${x - w * .46} ${y + h * 1.7} ${x - w / 2 - 10} ${y - h * .4}Z" fill="#120006"/>`
      + `<path d="M${x - w * .28} ${y + h * 1.1}Q${x} ${y + h * .8} ${x + w * .28} ${y + h * 1.1}Q${x} ${y + h * 1.5} ${x - w * .28} ${y + h * 1.1}Z" fill="#5a0618" stroke="none"/>`
      + `<g fill="#e9e2cc" stroke-width="1.2">${t}</g>`;
  };
  const blood = (x, y, L) => `<path d="M${x - 3} ${y}Q${x - 3} ${y + L} ${x} ${y + L + 4}Q${x + 3} ${y + L} ${x + 3} ${y}Z" fill="#a8061e" stroke="#1a1433" stroke-width="1.6"/><circle cx="${x}" cy="${y + L + 10}" r="2.2" fill="#a8061e" stroke="none"/>`;
  const longClaw = (x, y, d) => `<g transform="translate(${x} ${y}) scale(${d} 1)"><path d="M-14 -40Q-22 -10 -16 8Q0 16 16 8Q20 -10 10 -40Z" fill="url(#ybD)"/>${[-12, -4, 4, 12].map((cx, k) => `<path d="M${cx - 3} 8Q${cx - 6 + k} 30 ${cx - 14 + k * 4} 46Q${cx + 2} 30 ${cx + 3} 8Z" fill="#d9d0b8" stroke-width="1.8"/>`).join('')}<path d="M-10 -30v14M-2 -32v16M6 -30v14" stroke="#000" stroke-width="1.4" opacity=".6"/></g>`;
  const GMAX = `<defs>
    <linearGradient id="ybF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b088"/><stop offset="1" stop-color="#b8703c"/></linearGradient>
    <radialGradient id="ybE" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#9be7ff"/><stop offset=".6" stop-color="#4a9cff"/><stop offset="1" stop-color="#3a2a8a"/></radialGradient>
    <radialGradient id="ybN" cx=".5" cy=".2" r=".95"><stop offset="0" stop-color="#3a0412"/><stop offset=".5" stop-color="#120208"/><stop offset="1" stop-color="#020103"/></radialGradient>
    <radialGradient id="ybMo" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#ff6a4a"/><stop offset=".55" stop-color="#a80018"/><stop offset="1" stop-color="#3a0008"/></radialGradient>
    <linearGradient id="ybD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2228"/><stop offset="1" stop-color="#0e080c"/></linearGradient>
    <linearGradient id="ybB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a2a"/><stop offset=".6" stop-color="#22121a"/><stop offset="1" stop-color="#0a0608"/></linearGradient>
    <linearGradient id="ybFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a7a90" stop-opacity="0"/><stop offset="1" stop-color="#8a7a90" stop-opacity=".55"/></linearGradient>
    <radialGradient id="ybG" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#ff0a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff0a2a" stop-opacity="0"/></radialGradient>
    <clipPath id="ybK"><path d="M0 0H108L100 22 112 40 98 58 110 78 96 96 106 116 94 140H0Z"/></clipPath></defs>` + D(`
    <rect x="-6" y="-10" width="212" height="212" rx="20" fill="url(#ybN)" stroke="none"/>
    <circle cx="100" cy="30" r="86" fill="url(#ybG)" stroke="none"/>
    <circle cx="100" cy="30" r="38" fill="url(#ybMo)" stroke-width="3"/><path d="M78 14l12 12-8 12 6 8M120 20l-10 12 8 10" fill="none" stroke="#1a0004" stroke-width="2.4"/>${blood(92, 66, 10)}${blood(112, 64, 16)}
    <path d="M-6 150L6 112 10 150 18 96 26 150M180 150L188 104 194 150 200 120 206 150" fill="none" stroke="#0a0608" stroke-width="3"/>
    ${[-176, -156, -136, -118, -62, -44, -24, -4, -90].map((a, k) => tailEye(a, k === 8 ? 140 : 104 + (k % 2) * 10, 12)).join('')}
    <path d="M30 202Q26 150 52 128L62 134 72 124 84 132 100 126 116 132 128 124 138 134 148 128Q174 150 170 202Z" fill="url(#ybB)"/>
    <g fill="none" stroke="#6a5058" stroke-width="3">${[148, 160, 172, 184].map((y, k) => `<path d="M${74 + k * 2} ${y}Q100 ${y + 8} ${126 - k * 2} ${y}"/>`).join('')}<path d="M100 140V196" stroke-width="2.4"/></g>
    ${ruins.replace(/#ff5a2a/g, '#a8061e')}
    ${longClaw(40, 160, 1)}${longClaw(160, 160, -1)}
    <path d="M44 74L22 -6 50 22 56 10 64 28 92 44Z" fill="url(#ybB)"/><path d="M50 62L34 14 52 32 74 46Z" fill="#000" stroke-width="2.2"/><path d="M38 20l6 10-4 4" fill="none" stroke="#a8061e" stroke-width="2"/>
    <path d="M156 74L178 -6 150 22 144 10 136 28 108 44Z" fill="url(#ybB)"/><path d="M150 62L166 14 148 32 126 46Z" fill="#000" stroke-width="2.2"/>
    <path d="M100 38Q154 38 164 78L184 88 162 96 176 112 150 114Q130 152 100 152Q70 152 50 114L24 112 38 96 16 88 36 78Q46 38 100 38Z" fill="url(#ybB)"/>
    <ellipse cx="128" cy="92" rx="30" ry="40" fill="#040002"/>
    ${pin(130, 82, 4.2)}${pin(142, 100, 2.4)}${pin(118, 104, 2)}${pin(134, 116, 1.6)}${pin(146, 74, 1.4)}
    <path d="M108 60q10 8 4 20M150 64q-6 12 2 22" fill="none" stroke="#3a0010" stroke-width="2"/>
    ${needleGrin(100, 138, 120, 18, 16)}
    ${blood(62, 156, 14)}${blood(140, 158, 22)}${blood(100, 168, 10)}${blood(80, 162, 18)}
    <g transform="rotate(-9 82 92)"><g clip-path="url(#ybK)" opacity=".96">${face(102, 90, 1.08, 'ybE', false)}</g>
      <path d="M108 50L100 72 112 90 98 108 106 128" fill="none" stroke-width="2.6"/><path d="M60 80l10 8-4 10M70 120l8-6" fill="none" stroke="#5a2a1a" stroke-width="2"/>
      <path d="M78 108q-2 14 0 30" fill="none" stroke="#2a4aa8" stroke-width="3" opacity=".8"/></g>
    <path d="M112 186l8-6 6 8-10 4zM124 194l6-2 2 6z" fill="#e8b088" stroke-width="2"/>
    <rect x="-6" y="150" width="212" height="52" fill="url(#ybFog)" stroke="none"/>
    <path d="M-6 184Q30 172 60 184T120 184T206 182" fill="none" stroke="#a89ab0" stroke-width="5" opacity=".35"/>`);

  if (typeof NEW_ART !== 'undefined') NEW_ART.yeoubi = BASE;
  if (typeof MEGA_ART !== 'undefined') MEGA_ART.yeoubi = MEGA;
  if (typeof GMAX_ART !== 'undefined') GMAX_ART.yeoubi = GMAX;
  if (typeof window !== 'undefined') window.FOX_ART = { BASE, MEGA, GMAX };
})();
