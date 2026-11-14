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

  /* ---------- 거다이맥스: 반전! 피의 달 아래 깨어난 구미호 ----------
     귀엽던 여우비가 거대한 요괴로. 붉은 달, 아홉 개의 불타는 꼬리(끝에 푸른 여우불), 귀까지 찢어진 이빨 가득한 웃음,
     빛나는 세로 동공 눈 넷, 골목 지붕을 움켜쥔 발톱, 꼬리 끝 비구름은 시커먼 먹구름이 되어 번개를 친다. */
  const H = (x, y, r, a = 0) => { const p = []; for (let k = 0; k < 7; k++) { const t = (a + k * 360 / 7) * Math.PI / 180, rr = k % 2 ? r * .55 : r; p.push(`${(x + Math.cos(t) * rr).toFixed(1)} ${(y + Math.sin(t) * rr).toFixed(1)}`); } return p.join(' '); };
  // 여우불: 푸른 도깨비불
  const wisp = (x, y, s) => `<path d="M${x} ${y - 16 * s}Q${x + 10 * s} ${y - 4 * s} ${x + 7 * s} ${y + 6 * s}Q${x} ${y + 12 * s} ${x - 7 * s} ${y + 6 * s}Q${x - 10 * s} ${y - 4 * s} ${x - 2 * s} ${y - 8 * s}Q${x + 2 * s} ${y - 12 * s} ${x} ${y - 16 * s}Z" fill="url(#ybW)" stroke-width="2" class="gx-eye"/><path d="M${x} ${y - 4 * s}Q${x + 4 * s} ${y + 2 * s} ${x} ${y + 6 * s}Q${x - 4 * s} ${y + 2 * s} ${x} ${y - 4 * s}Z" fill="#fff" stroke="none"/>`;
  // 불꽃 꼬리: 톱날 가장자리, 끝에 여우불
  const fireTail = (a, L, w) => {
    const pts = [], n = 7;
    for (let k = 0; k <= n; k++) { const t = k / n, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * .25); pts.push([L * t, -ww - (k % 2 ? 5 : 0)]); }
    for (let k = n; k >= 0; k--) { const t = k / n, ww = w * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * .25); pts.push([L * t + (k % 2 ? 3 : 0), ww + (k % 2 ? 5 : 0)]); }
    return `<g transform="translate(100 150) rotate(${a})"><path d="M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z" fill="url(#ybR)" stroke="#ff6a2a" stroke-width="6" opacity=".35"/><path d="M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z" fill="url(#ybR)"/><path d="M${L * .2} 0Q${L * .55} ${-w * .3} ${L * .85} 0" fill="none" stroke="#ff5a2a" stroke-width="2.4" opacity=".8"/>${wisp(L + 4, 0, .9)}</g>`;
  };
  const fangs = (x, y, w, h, n) => { // 귀까지 찢어진 입
    let top = '', bot = '';
    for (let k = 0; k < n; k++) { const a = x - w / 2 + (w / n) * k, b = a + w / n, m = (a + b) / 2, cv = Math.sin(Math.PI * (k + .5) / n) * h * .35;
      top += `<path d="M${a.toFixed(1)} ${(y - h * .2 + cv * .2).toFixed(1)}L${m.toFixed(1)} ${(y + h * .25 + cv).toFixed(1)}L${b.toFixed(1)} ${(y - h * .2 + cv * .2).toFixed(1)}Z"/>`;
      bot += `<path d="M${(a + 2).toFixed(1)} ${(y + h * .9 + cv).toFixed(1)}L${(m + 2).toFixed(1)} ${(y + h * .35 + cv * .6).toFixed(1)}L${(b + 2).toFixed(1)} ${(y + h * .9 + cv).toFixed(1)}Z"/>`; }
    return `<path d="M${x - w / 2 - 6} ${y - h * .45}Q${x} ${y - h * .05} ${x + w / 2 + 6} ${y - h * .45}Q${x + w * .44} ${y + h * 1.4} ${x} ${y + h * 1.35}Q${x - w * .44} ${y + h * 1.4} ${x - w / 2 - 6} ${y - h * .45}Z" fill="#2a0410"/>`
      + `<path d="M${x - w * .3} ${y + h * .95}Q${x} ${y + h * .7} ${x + w * .3} ${y + h * .95}Q${x} ${y + h * 1.25} ${x - w * .3} ${y + h * .95}Z" fill="#8a0f2a" stroke="none"/>`
      + `<g fill="#f6eedc" stroke-width="1.6">${top}${bot}</g>`;
  };
  const evil = (x, y, r, d) => `<path d="M${x - r * d} ${y - r * .55}L${x + r * d} ${y + r * .1}Q${x} ${y + r * .85} ${x - r * d} ${y + r * .15}Z" fill="#FFE14D" class="gx-eye"/><ellipse cx="${x + r * .15 * d}" cy="${y + r * .18}" rx="${r * .13}" ry="${r * .42}" fill="#1a0006" stroke="none"/><circle cx="${x - r * .3 * d}" cy="${y - r * .05}" r="${r * .12}" fill="#fff" stroke="none"/>`;
  const ruins = [[-6, 24, 22, '#5a1a1a'], [16, 20, 32, '#2a3a5a'], [164, 20, 28, '#2a4a2a'], [182, 24, 20, '#5a3a1a']].map(([x, w, h, c]) =>
    `<path d="M${x} 202V${202 - h}l${w * .3} 4 ${w * .2}-6 ${w * .5} 3V202z" fill="#4a4250" stroke-width="2.4"/><path d="M${x - 3} ${202 - h}L${x + w * .4} ${202 - h - 10}L${x + w + 3} ${202 - h + 4}z" fill="${c}" stroke-width="2.4"/><path d="M${x + w * .3} ${202 - h + 8}l4 6-3 5" fill="none" stroke="#ff5a2a" stroke-width="1.6"/>`).join('');
  const claw = (x, y, d) => `<g transform="translate(${x} ${y}) scale(${d} 1)"><path d="M-22 6Q-24 -14 -6 -18Q12 -18 18 0Q20 10 10 12H-18Z" fill="url(#ybR)"/>${[-16, -6, 4, 13].map((cx, k) => `<path d="M${cx} -14Q${cx - 2} -30 ${cx + 6} -38Q${cx + 4} -26 ${cx + 6} -14Z" fill="#f6eedc" stroke-width="2"/>`).join('')}</g>`;
  const GMAX = `<defs>
    <radialGradient id="ybN" cx=".5" cy=".25" r=".9"><stop offset="0" stop-color="#5a0a1e"/><stop offset=".55" stop-color="#1e0820"/><stop offset="1" stop-color="#07040c"/></radialGradient>
    <radialGradient id="ybMo" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#ff8a6a"/><stop offset=".6" stop-color="#d1102a"/><stop offset="1" stop-color="#6a0012"/></radialGradient>
    <linearGradient id="ybR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a2a"/><stop offset=".5" stop-color="#a8201a"/><stop offset="1" stop-color="#2a0608"/></linearGradient>
    <linearGradient id="ybB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2602a"/><stop offset=".6" stop-color="#8a1c14"/><stop offset="1" stop-color="#3a0808"/></linearGradient>
    <radialGradient id="ybW" cx=".5" cy=".7" r=".7"><stop offset="0" stop-color="#e8fbff"/><stop offset=".45" stop-color="#5ad8ff"/><stop offset="1" stop-color="#6a3aff"/></radialGradient>
    <radialGradient id="ybG" cx=".5" cy=".5" r=".5"><stop offset=".4" stop-color="#ff2a4a" stop-opacity=".55"/><stop offset="1" stop-color="#ff2a4a" stop-opacity="0"/></radialGradient></defs>` + D(`
    <rect x="-6" y="-10" width="212" height="212" rx="20" fill="url(#ybN)" stroke="none"/>
    <circle cx="100" cy="40" r="80" fill="url(#ybG)" stroke="none"/><circle cx="70" cy="84" r="24" fill="url(#ybG)" stroke="none"/><circle cx="130" cy="84" r="24" fill="url(#ybG)" stroke="none"/>
    <circle cx="100" cy="40" r="40" fill="url(#ybMo)" stroke-width="3"/><path d="M80 22l10 14-6 10M118 30l-8 12 6 8" fill="none" stroke="#5a0010" stroke-width="2.4"/>
    ${[-182, -162, -142, -122, -58, -38, -18, 2, -100].map((a, k) => fireTail(a, k === 8 ? 112 : 118, 24)).join('')}
    ${cloud(22, 22, .6, '#2a2236')}${cloud(178, 20, .6, '#2a2236')}
    <path d="M24 32l-6 14 8-2-6 16M176 30l6 12-8-1 6 16" fill="none" stroke="#c8f0ff" stroke-width="3"/>
    ${Array.from({ length: 14 }, (_, k) => drop(6 + (k * 41) % 192, 50 + ((k * 59) % 120), .55, '#3a1a4a')).join('')}
    <path d="M18 202Q14 150 44 124L56 132 62 118 76 126 84 112 100 120 116 112 124 126 138 118 144 132 156 124Q186 150 182 202Z" fill="url(#ybB)"/>
    <path d="M68 202L72 170 80 176 86 160 94 168 100 152 106 168 114 160 120 176 128 170 132 202Z" fill="#6a5a58" stroke-width="2.8"/><path d="M80 186h40M84 194h32" stroke="#3a2a2a" stroke-width="2.4"/>
    ${ruins}
    <!-- 귀: 길고 찢어진, 끝에 여우불 -->
    <path d="M46 72L30 -2 52 20 58 12 64 26 90 46Z" fill="url(#ybB)"/><path d="M52 60L40 14 54 30 74 46Z" fill="#3a0612" stroke-width="2.2"/>${wisp(30, -4, .85)}
    <path d="M154 72L170 -2 148 20 142 12 136 26 110 46Z" fill="url(#ybB)"/><path d="M148 60L160 14 146 30 126 46Z" fill="#3a0612" stroke-width="2.2"/>${wisp(170, -4, .85)}
    <!-- 머리: 날카로운 볼털 -->
    <path d="M100 40Q150 40 160 76L190 82 164 94 186 108 158 112 172 128 140 126Q120 150 100 150Q80 150 60 126L28 128 42 112 14 108 36 94 10 82 40 76Q50 40 100 40Z" fill="url(#ybB)"/>
    <path d="M100 40l-6 14 6-4 6 4z" fill="#3a0808" stroke-width="2"/>
    <path d="M72 58l-8 6M128 58l8 6M86 50l-2 8M114 50l2 8" stroke="#3a0808" stroke-width="2.4"/>
    ${evil(70, 84, 16, 1)}${evil(130, 84, 16, -1)}${evil(82, 64, 7, 1)}${evil(118, 64, 7, -1)}
    <path d="M48 70L90 82M152 70L110 82" stroke-width="5"/>
    <path d="M96 98Q100 94 104 98Q100 104 96 98Z" fill="#1a0006"/>
    ${fangs(100, 116, 104, 16, 10)}
    <path d="M70 136q-2 10 2 18M128 136q2 8-1 14" fill="none" stroke="#ff4a6a" stroke-width="3" opacity=".9"/><circle cx="72" cy="156" r="2.6" fill="#ff4a6a" stroke="none"/>
    ${claw(36, 178, 1)}${claw(164, 178, -1)}
    ${wisp(12, 70, .8)}${wisp(190, 64, .9)}${wisp(22, 150, .7)}${wisp(182, 146, .7)}`);

  if (typeof NEW_ART !== 'undefined') NEW_ART.yeoubi = BASE;
  if (typeof MEGA_ART !== 'undefined') MEGA_ART.yeoubi = MEGA;
  if (typeof GMAX_ART !== 'undefined') GMAX_ART.yeoubi = GMAX;
  if (typeof window !== 'undefined') window.FOX_ART = { BASE, MEGA, GMAX };
})();
