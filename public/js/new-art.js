// 페어리와 로봇 골목몬 그림. 200 크기로 그렸습니다.
const NEW_ART = (() => {
const L = (s) => `<g stroke="#1a1433" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
// 골목 사계절 신캐 (고드리·양머리·담쟁전·뽀글이·황사리)
const eyeN = (x, y, r, iris = '#1a1433') => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 1.5}" r="${r * .58}" fill="${iris}" stroke="none"/><circle cx="${x + 1}" cy="${y + 1.5}" r="${r * .28}" fill="#1a1433" stroke="none"/><circle cx="${x + r * .3}" cy="${y - r * .25}" r="${r * .22}" fill="#fff" stroke="none"/>`;
const glowN = (x, y, r, c, d = 1) => `<path d="M${x - r * 1.3} ${y + 2}q${r * 1.3}-${r * 1.6} ${r * 2.6} ${d > 0 ? -2 : 2}q-${r * 1.3} ${r * 1.3}-${r * 2.6} 2z" fill="#fff"/><circle cx="${x + 1}" cy="${y}" r="${r * .55}" fill="${c}" stroke="none"/><circle cx="${x + 1}" cy="${y}" r="${r * .22}" fill="#fff" stroke="none"/>`;
// 그라데이션은 페이지에 한 번만 둡니다 (같은 골목몬이 여러 번 그려져도 id가 겹치지 않게).
if (typeof document !== 'undefined') {
  const put = () => document.body.insertAdjacentHTML('afterbegin', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="gIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eafbff"/><stop offset=".6" stop-color="#a9e6fb"/><stop offset="1" stop-color="#6cc4ef"/></linearGradient>
 <radialGradient id="gFl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#e8fbff"/><stop offset=".45" stop-color="#5fd0ff"/><stop offset="1" stop-color="#2a5cff"/></radialGradient><linearGradient id="gMet" x1="0" x2="1"><stop offset="0" stop-color="#6f7c8a"/><stop offset=".45" stop-color="#b4c0cc"/><stop offset="1" stop-color="#5d6875"/></linearGradient><radialGradient id="gBub" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#dff7ff"/><stop offset=".6" stop-color="#ffd1f1"/><stop offset=".8" stop-color="#c9b8ff"/><stop offset="1" stop-color="#8fe6ff"/></radialGradient>
 <radialGradient id="gSm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#e2d4ff"/><stop offset="1" stop-color="#9ee9ff"/></radialGradient><radialGradient id="gDust" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#f7dc8f"/><stop offset=".7" stop-color="#d9a84a"/><stop offset="1" stop-color="#b07d2a"/></radialGradient><linearGradient id="mIce" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#9fe2ff"/><stop offset="1" stop-color="#3f8fe0"/></linearGradient>
 <radialGradient id="mFl" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#a98bff"/><stop offset="1" stop-color="#3a1fd1"/></radialGradient>
 <radialGradient id="mAura" cx=".5" cy=".5" r=".5"><stop offset=".5" stop-color="#7fd8ff" stop-opacity=".45"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/></radialGradient><linearGradient id="mSplit" x1="0" x2="1"><stop offset=".5" stop-color="#ff6a2b" stop-opacity=".55"/><stop offset=".5" stop-color="#4fb6ff" stop-opacity=".55"/></linearGradient><linearGradient id="mMet" x1="0" x2="1"><stop offset="0" stop-color="#3a4250"/><stop offset=".45" stop-color="#8b98a8"/><stop offset="1" stop-color="#2f3640"/></linearGradient>
 <radialGradient id="mGlow" cx=".5" cy=".5" r=".5"><stop offset=".3" stop-color="#b6ff5c" stop-opacity=".5"/><stop offset="1" stop-color="#b6ff5c" stop-opacity="0"/></radialGradient><radialGradient id="mBub" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".3" stop-color="#d8f6ff"/><stop offset=".55" stop-color="#ffc2ec"/><stop offset=".75" stop-color="#bba6ff"/><stop offset="1" stop-color="#6fdcff"/></radialGradient>
 <linearGradient id="mWing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe3f6"/><stop offset=".5" stop-color="#d9ccff"/><stop offset="1" stop-color="#a6f0ff"/></linearGradient><radialGradient id="mDust" cx=".45" cy=".35" r=".7"><stop offset="0" stop-color="#e9b85a"/><stop offset=".7" stop-color="#a8701f"/><stop offset="1" stop-color="#6e4310"/></radialGradient>
 <linearGradient id="mTor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b47a28"/><stop offset="1" stop-color="#6e4310"/></linearGradient></defs></svg>`);
  if (document.body) put(); else document.addEventListener('DOMContentLoaded', put);
}
// 하르모니움: 철골 아치 무대
const truss = (cx, cy, r1, r2, n, c, lc) => {
  const P = (r, a) => `${(cx + r * Math.cos(a)).toFixed(1)} ${(cy - r * Math.sin(a)).toFixed(1)}`;
  let z = '';
  for (let i = 0; i < n; i++) { const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n; z += `M${P(r1, a0)}L${P(r2, a1)}`; }
  return `<path d="M${P(r1, 0)}A${r1} ${r1} 0 0 0 ${P(r1, Math.PI)}L${P(r2, Math.PI)}A${r2} ${r2} 0 0 1 ${P(r2, 0)}z" fill="${c}"/><path d="${z}" fill="none" stroke="${lc}" stroke-width="2"/><path d="M${P(r1, 0)}A${r1} ${r1} 0 0 0 ${P(r1, Math.PI)}M${P(r2, Math.PI)}A${r2} ${r2} 0 0 1 ${P(r2, 0)}" fill="none"/>`;
};
const tower = (x, y, w, h, n, cone = '#C9A24A') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#3a3f48"/>${Array.from({ length: n }, (_, i) => { const cy = y + h / n * (i + .5); return `<circle cx="${x + w / 2}" cy="${cy}" r="${w * .34}" fill="${cone}"/><circle cx="${x + w / 2}" cy="${cy}" r="${w * .14}" fill="#2a2a30" stroke-width="1.6"/>`; }).join('')}`;
const can = (x, y, rot, iris, glow) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 -26v10" stroke-width="2"/><rect x="-13" y="-16" width="26" height="22" rx="4" fill="#2f343c"/><ellipse cx="0" cy="8" rx="15" ry="9" fill="${glow}"/><circle cx="1" cy="9" r="5.5" fill="${iris}" stroke="none"/><circle cx="1" cy="9" r="2.4" fill="#1a1433" stroke="none"/><circle cx="3" cy="7" r="1.6" fill="#fff" stroke="none"/></g>`;
const lady = ({ eyeY = 41, lip = '#D31C4A', iris = '#7A2BC9' }) => [91, 109].map((x, i) => {
  const d = i ? 1 : -1;
  return `<path d="M${x - 6} ${eyeY + 1}q6-7 12 0-6 5-12 0z" fill="#fff" stroke-width="1"/>
  <circle cx="${x}" cy="${eyeY}" r="3.1" fill="${iris}" stroke-width=".8"/><circle cx="${x}" cy="${eyeY}" r="1.3" fill="#1a1433" stroke="none"/><circle cx="${x + 1}" cy="${eyeY - 1}" r=".9" fill="#fff" stroke="none"/>
  <path d="M${x - 6.5} ${eyeY + 1}q6.500-8 13 0M${x + d * 6.500} ${eyeY + 1}l${d * 3}-2.500" fill="none" stroke-width="2"/>
  <path d="M${x - 5} ${eyeY - 7}q5-3 10 0" fill="none" stroke-width="1.2"/>
  <ellipse cx="${x + d * 4}" cy="${eyeY + 8}" rx="4" ry="2.400" fill="#F27FA5" fill-opacity=".4" stroke="none"/>`;
}).join('') + `<path d="M100 ${eyeY + 7}l-1 3" fill="none" stroke-width="1"/><path d="M94 ${eyeY + 14}q3-2.500 6-1 3-1.500 6 1-6 5-12 0z" fill="${lip}" stroke-width="1"/>`;
const ART = {
 neonna: L(`
  ${[[100, -1], [100, 1]].map(([, d]) => `<g fill="none"><path d="M${100 + d * 12} 76C${100 + d * 60} 8 ${100 + d * 104} 22 ${100 + d * 86} 66 ${100 + d * 76} 92 ${100 + d * 34} 94 ${100 + d * 12} 84" stroke="#ff4fa8" stroke-width="8"/><path d="M${100 + d * 12} 76C${100 + d * 60} 8 ${100 + d * 104} 22 ${100 + d * 86} 66 ${100 + d * 76} 92 ${100 + d * 34} 94 ${100 + d * 12} 84" stroke="#ffd6ec" stroke-width="3"/><path d="M${100 + d * 12} 94C${100 + d * 44} 96 ${100 + d * 78} 118 ${100 + d * 60} 142 ${100 + d * 40} 150 ${100 + d * 24} 124 ${100 + d * 12} 102" stroke="#37e0ff" stroke-width="7"/><path d="M${100 + d * 12} 94C${100 + d * 44} 96 ${100 + d * 78} 118 ${100 + d * 60} 142 ${100 + d * 40} 150 ${100 + d * 24} 124 ${100 + d * 12} 102" stroke="#d6f8ff" stroke-width="2.6"/></g>`).join('')}
  <path d="M70 62C60 26 82 14 102 14s42 14 32 50c-2 22 8 34 2 50-14-10-22-24-22-46l-30 0c0 22-6 36-16 42-8-16 6-30 4-48z" fill="#7A2BC9"/>
  <path d="M90 62h20v14q-10 8-20 0z" fill="#F7CFA6"/>
  <path d="M74 80q26-12 52 0l8 34-2 2-6 0q0-8-6-18l0 32H80l0-32q-6 10-6 18l-8 0-2-2z" fill="#F7CFA6"/>
  <path d="M84 84q16 12 32 0l2 16q-2 10-4 18l8 32 6 46H96l-6-40-12 40H70l10-74q2-10 0-20z" fill="#2A1450"/>
  <path d="M84 84q16 12 32 0" fill="none" stroke="#ff4fa8" stroke-width="3"/>
  <path d="M82 118q18 7 36 0" fill="none" stroke="#37e0ff" stroke-width="3"/>
  <path d="M96 156l-6 40h-8l2-26z" fill="#F7CFA6"/>
  <path d="M76 196h22l-2 4H66zM104 196h24l6 4h-30z" fill="#ff4fa8"/>
  <path d="M74 84q-14 8-18 26l-2 18 8 2 8-18 6-12z" fill="#F7CFA6"/>
  <path d="M126 84q16 2 22-14l-8-4q-6 8-16 8z" fill="#F7CFA6"/>
  <path d="M144 62l8-14" stroke="#c7cdd6" stroke-width="5"/><circle cx="154" cy="44" r="7" fill="#37e0ff"/>
  <path d="M78 42q0-24 22-24t22 24q0 24-22 26-22-2-22-26z" fill="#F7CFA6"/>
  ${lady({})}
  <path d="M76 44c-2-26 16-34 32-30 12 2 20 16 16 32-4-12-12-18-22-20-10 6-22 6-26 18z" fill="#9A3FE0"/>
  <circle cx="76" cy="60" r="3" fill="#37e0ff" stroke-width="1.5"/><circle cx="124" cy="60" r="3" fill="#37e0ff" stroke-width="1.5"/>`),
 yeonji: L(`
  ${[-1, 1].map((d) => `<path d="M${100 + d * 10} 74C${100 + d * 46} 16 ${100 + d * 100} 12 ${100 + d * 94} 62 ${100 + d * 90} 92 ${100 + d * 50} 92 ${100 + d * 14} 86z" fill="#FFB3CC"/><path d="M${100 + d * 10} 88C${100 + d * 50} 94 ${100 + d * 84} 112 ${100 + d * 64} 142 ${100 + d * 42} 152 ${100 + d * 22} 122 ${100 + d * 10} 100z" fill="#F27FA5"/><circle cx="${100 + d * 66}" cy="46" r="9" fill="#FFF3CF"/><circle cx="${100 + d * 48}" cy="118" r="7" fill="#FFF3CF"/>`).join('')}
  <circle cx="100" cy="12" r="11" fill="#1a1433"/>
  <path d="M74 12h52" stroke="#E7B23A" stroke-width="4"/><circle cx="128" cy="12" r="4.500" fill="#E8402C"/>
  <path d="M90 62h20v14q-10 8-20 0z" fill="#FFE0BD"/>
  <path d="M70 80q30-8 60 0l6 6q-36 16-72 0z" fill="#FFE0BD"/>
  <path d="M70 84q30 12 60 0l-6 26H76z" fill="#C21F4A"/>
  <path d="M76 104q24 8 48 0l-2 10q-22 6-44 0z" fill="#E7B23A"/>
  <path d="M78 114q22 7 44 0l6 28 12 58H106l-8-40-14 40H60l12-58z" fill="#1F2A6C"/>
  <path d="M100 118l-2 42" fill="none" stroke="#E7B23A" stroke-width="2.4"/>
  <path d="M98 160l14 40h-14z" fill="#FFE0BD"/>
  <path d="M60 198q40 6 80 0" fill="none" stroke="#E7B23A" stroke-width="3"/>
  <path d="M68 82q-12 2-16 18l-4 18 8 4 8-14 10-16z" fill="#FFE0BD"/><path d="M132 82q16 0 20-16l2-12-8-2-6 12-10 6z" fill="#FFE0BD"/>
  <rect x="146" y="30" width="10" height="20" rx="2" fill="#E7B23A"/><path d="M147 30l1-12 8 4 0 8z" fill="#D31C4A"/>
  <path d="M78 40q0-24 22-24t22 24q0 24-22 26-22-2-22-26z" fill="#FFE0BD"/>
  ${lady({ eyeY: 38, lip: '#E0123E', iris: '#4A2C1A' })}
  <path d="M76 42c-2-26 14-32 24-32s26 6 24 32c-6-12-14-18-24-18s-18 6-24 18z" fill="#1a1433"/>`),
 jabanbot: L(`
  <path d="M56 160h34v28H54zM110 160h34l2 28h-36z" fill="#59606c"/><path d="M48 186h46v12H46zM106 186h46l2 12h-48z" fill="#2c303a"/>
  <path d="M34 62L10 84l6 40 18-6-2-24 14-12z" fill="#8a8f98"/><path d="M4 122h24v22H4z" fill="#E8402C"/><path d="M6 134h20" fill="none"/><circle cx="16" cy="150" r="6" fill="#FFD23F"/>
  <path d="M166 62l24 22-6 40-18-6 2-24-14-12z" fill="#8a8f98"/><path d="M172 122h24v22h-24z" fill="#E8402C"/><circle cx="184" cy="150" r="6" fill="#FFD23F"/>
  <rect x="42" y="44" width="116" height="122" rx="6" fill="#D52C2C"/>
  <rect x="52" y="54" width="72" height="72" fill="#BFE4FF"/>
  ${[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${56 + c * 16}" y="${60 + r * 22}" width="11" height="18" rx="2" fill="${['#2F7DE1', '#FFD23F', '#3FA34D', '#E8402C'][(r + c) % 4]}" stroke-width="1.6"/>`).join('')).join('')}
  <rect x="130" y="56" width="20" height="30" fill="#2c303a"/><circle cx="140" cy="66" r="4" fill="#6CF2C2" stroke-width="1.6"/><rect x="134" y="74" width="12" height="3" fill="#FFD23F" stroke="none"/>
  <rect x="130" y="94" width="20" height="30" fill="#AEB7C2"/><rect x="135" y="100" width="10" height="4" fill="#1a1433" stroke="none"/>
  <rect x="52" y="134" width="96" height="22" fill="#1a1433"/><path d="M58 145h84" stroke="#FFD23F" stroke-width="3"/>
  <rect x="72" y="14" width="56" height="30" rx="6" fill="#8a8f98"/><rect x="78" y="20" width="44" height="14" fill="#0d1a2c"/><path d="M84 27h32" stroke="#6CF2C2" stroke-width="5"/>
  <path d="M100 14V2" stroke-width="4"/><circle cx="100" cy="2" r="3" fill="#E8402C"/>`),
 baedalbot: L(`
  <circle cx="58" cy="172" r="24" fill="#1a1433"/><circle cx="58" cy="172" r="10" fill="#AEB7C2"/>
  <circle cx="146" cy="172" r="24" fill="#1a1433"/><circle cx="146" cy="172" r="10" fill="#AEB7C2"/>
  <path d="M58 172l24-44h40l24 44" fill="none" stroke="#59606c" stroke-width="9"/>
  <rect x="120" y="44" width="62" height="56" rx="4" fill="#D7DDE5"/><path d="M120 62h62M150 44v56" fill="none" stroke-width="2"/><path d="M144 34h12v10h-12z" fill="#AEB7C2"/>
  <path d="M66 62h66l10 72H58z" fill="#E7B23A"/><path d="M62 96h78" fill="none" stroke="#1a1433" stroke-width="5"/><circle cx="100" cy="112" r="10" fill="#6CF2C2"/>
  <path d="M66 70L24 84l4 14 44-6z" fill="#8a8f98"/><path d="M26 70l6 30-12 2-6-30z" fill="#2c303a"/><circle cx="16" cy="66" r="6" fill="#FFD23F"/>
  <path d="M134 74l26 34-10 10-32-30z" fill="#8a8f98"/>
  <path d="M68 40q0-30 34-30t34 30v18H68z" fill="#E8402C"/>
  <path d="M74 34h56q2 20-4 24H78q-6-4-4-24z" fill="#17273e"/><path d="M82 44h40" stroke="#37e0ff" stroke-width="6"/>
  <path d="M2 150h24M6 136h18M0 164h18" fill="none" stroke="#fff" stroke-width="3"/>`),
 setakbot: L(`
  <path d="M58 158v30M142 158v30" stroke="#59606c" stroke-width="16"/><path d="M42 186h34v12H42zM124 186h34v12h-34z" fill="#2c303a"/>
  <path d="M34 78q-26 6-24 36 2 22 16 26" fill="none" stroke-width="13"/><path d="M34 78q-26 6-24 36 2 22 16 26" fill="none" stroke="#F4F2E6" stroke-width="7"/>
  <path d="M166 78q26 6 24 36-2 22-16 26" fill="none" stroke-width="13"/><path d="M166 78q26 6 24 36-2 22-16 26" fill="none" stroke="#F4F2E6" stroke-width="7"/>
  <path d="M26 140l-8 16h20z" fill="#2F7DE1"/><path d="M174 140l-10 16h20z" fill="#2F7DE1"/>
  <rect x="34" y="28" width="132" height="134" rx="12" fill="#EAF0F5"/>
  <rect x="34" y="28" width="132" height="26" rx="10" fill="#C7CDD6"/>
  <circle cx="58" cy="41" r="8" fill="#2F7DE1"/><rect x="74" y="35" width="44" height="12" fill="#0d1a2c"/><path d="M80 41h30" stroke="#6CF2C2" stroke-width="4"/><circle cx="138" cy="41" r="5" fill="#E8402C"/><circle cx="152" cy="41" r="5" fill="#FFD23F"/>
  <circle cx="100" cy="108" r="46" fill="#AEB7C2"/><circle cx="100" cy="108" r="36" fill="#17273e"/>
  <path d="M66 112q18-12 34 0t34 0a36 36 0 0 1-68 0z" fill="#2F7DE1"/>
  <path d="M100 76q22 10 14 34-6 10-16 4M100 140q-22-10-14-34" fill="none" stroke="#BFE4FF" stroke-width="3"/>
  <circle cx="100" cy="102" r="11" fill="#FFD23F"/><circle cx="100" cy="102" r="4.500" fill="#1a1433"/>
  ${[[52, 8], [150, 12], [14, 42], [186, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#BFE4FF"/>`).join('')}`),

 godeuri: L(`<g stroke-width="3.2">
 
 ${[38,54,146,162].map((x,i)=>`<path d="M${x-7} 40l7 ${[58,78,80,56][i]}l7-${[58,78,80,56][i]}z" fill="url(#gIce)" stroke-width="2.4"/>`).join('')}
 <path d="M56 40Q46 112 100 194Q154 112 144 40z" fill="url(#gIce)"/>
 <path d="M70 52Q64 108 96 168" fill="none" stroke="#fff" stroke-width="5" stroke-opacity=".8"/>
 <path d="M100 104c14 12 20 22 14 36-4 10-24 12-30 0-5-10 0-14 2-22 4 6 8 6 9 2 1-6-2-10 5-16z" fill="url(#gFl)" stroke="#2a5cff" stroke-width="2"/>
 <path d="M48 98q-16 6-18 22l12-4q2-10 10-12zM152 98q16 6 18 22l-12-4q-2-10-10-12z" fill="url(#gIce)" stroke-width="2.4"/>
 ${eyeN(84,72,9,'#2fb8ff')}${eyeN(116,72,9,'#2fb8ff')}
 <path d="M72 58l18 6M128 58l-18 6" fill="none"/>
 <path d="M86 90q14 10 28 0" fill="#fff"/><path d="M90 91l3 6 3-5M104 91l3 5 3-6" fill="#fff" stroke-width="1.6"/>
 <path d="M20 40h160" stroke="#3b4a66" stroke-width="3.2"/>
 <path d="M18 22h164v20H18z" fill="#4f5f80"/>
 ${[30,58,86,114,142,170].map(x=>`<path d="M${x-14} 42a14 12 0 0 0 28 0z" fill="#6c7da0"/>`).join('')}
 <path d="M18 22q40-10 82-10t82 10" fill="#fff" stroke-width="2.4"/>
 <path d="M80 14l-10-14 16 10zM120 14l10-14-16 10z" fill="#d9f6ff" stroke-width="2.4"/>
 ${[[30,150],[170,140],[24,96],[176,84]].map(([x,y])=>`<path d="M${x} ${y-6}v12M${x-6} ${y}h12M${x-4} ${y-4}l8 8M${x+4} ${y-4}l-8 8" stroke="#8fe0ff" stroke-width="2"/>`).join('')}
 </g>`),
 yangmeori: L(`<g stroke-width="3.2">
 <path d="M32 34q-6-8 0-14t0-14M42 32q-6-8 0-14t0-14M52 34q-6-8 0-14t0-14" fill="none" stroke="#ffb08a" stroke-width="3"/>
 <path d="M160 12v18M151 21h18M154 15l12 12M166 15l-12 12" stroke="#7fd4ff" stroke-width="2.6"/>
 <path d="M66 126q34-12 68 0l10 46q-44 14-88 0z" fill="#ff9a3c"/>
 <path d="M66 126q34 10 68 0" fill="none" stroke="#e46a12"/>
 <path d="M60 168q40 10 80 0l2 14q-42 10-84 0z" fill="#f2c94c"/>
 <path d="M76 182v12h16v-10M108 184v10h16v-12" fill="#ffd9b8"/>
 <circle cx="100" cy="84" r="46" fill="#ffe0c2"/>
 <path d="M54 76q-2-48 46-50 48 2 46 50-46-26-92 0z" fill="#ffffff"/>
 <path d="M58 64q42-22 84 0" fill="none" stroke="#f0d8ff" stroke-width="5"/>
 ${[[-1,52],[1,148]].map(([d,x])=>`<circle cx="${x}" cy="64" r="19" fill="#fff"/><path d="M${x} 64m-11 0a11 11 0 1 1 11 11a7 7 0 1 1-7-7a3 3 0 1 1 3 3" fill="none" stroke-width="2.4"/>`).join('')}
 <ellipse cx="74" cy="100" rx="13" ry="8" fill="#ff4d3d" fill-opacity=".55" stroke="none"/>
 <ellipse cx="126" cy="100" rx="13" ry="8" fill="#56b9ff" fill-opacity=".55" stroke="none"/>
 <path d="M120 96l12 8M126 94v12" stroke="#fff" stroke-width="1.6"/>
 ${eyeN(84,86,8,'#c2410c')}${eyeN(116,86,8,'#1e7fd8')}
 <path d="M90 108q10 9 20 0" fill="#c2410c"/>
 <path d="M64 134q-18 8-20 26" fill="none" stroke-width="12"/><path d="M64 134q-18 8-20 26" fill="none" stroke="#ff9a3c" stroke-width="6"/>
 <path d="M136 134q18 8 22 24" fill="none" stroke-width="12"/><path d="M136 134q18 8 22 24" fill="none" stroke="#ff9a3c" stroke-width="6"/>
 <path d="M28 150h26l-4 30H32z" fill="#fff"/><path d="M30 158h22l-2 20H33z" fill="#e9c58a" stroke="none"/>
 ${[[36,164],[44,168],[40,172],[47,162]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="1.8" ry="1.2" fill="#fffbe8" stroke="none"/>`).join('')}
 <path d="M38 150q2-6 8-4" fill="none" stroke="#e46a12" stroke-width="2"/>
 <ellipse cx="160" cy="164" rx="13" ry="16" fill="#8a4b2a"/><path d="M154 156q4-4 8-2" fill="none" stroke="#c8865b" stroke-width="2.4"/>
 </g>`),
 damjaengjeon: L(`<g stroke-width="3.2">
 
 ${[76,100,124].map(x=>`<path d="M${x} 50v-18" stroke-width="3"/><path d="M${x-7} 30h14M${x-6} 22h12M${x-5} 14h10" stroke="#a8562c" stroke-width="5"/><circle cx="${x}" cy="8" r="3" fill="#ddd"/>`).join('')}
 <path d="M76 8q-30-4-60 10M124 8q30-4 60 10" fill="none" stroke-width="2"/>
 <rect x="58" y="46" width="84" height="134" rx="12" fill="url(#gMet)"/>
 <path d="M58 60h84M58 166h84" fill="none" stroke-width="2.4"/>
 ${[72,86,114,128].map(x=>`<path d="M${x} 120v40" stroke="#4b5561" stroke-width="2"/>`).join('')}
 <path d="M64 180h-10v12h92v-12h-10" fill="#4b5561"/>
 <path d="M90 128l10-16 10 16z" fill="#ffd60a"/><path d="M100 117l-3 6h5l-3 6" fill="none" stroke-width="1.6"/>
 ${eyeN(84,90,9,'#38d430')}${eyeN(116,90,9,'#38d430')}
 <path d="M72 76l18 6M128 76l-18 6" fill="none" stroke-width="3.6"/>
 <path d="M90 108h20" fill="none"/>
 <path d="M48 186C40 150 56 130 60 140S110 150 146 132 156 80 148 62 100 46 64 56" fill="none" stroke="#2f7a24" stroke-width="7"/>
 ${[[48,168,-30],[54,140,0],[88,148,10],[124,140,40],[152,110,-20],[150,78,20],[130,56,-10],[98,50,30],[66,56,-40]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 8C-14 6-16-6-8-8-10-16 0-18 0-12 0-18 10-16 8-8 16-6 14 6 0 8z" fill="#4cbf3a" stroke-width="2.4"/><path d="M0 8V-10M0-2l-6-4M0-2l6-4" fill="none" stroke="#b6ff5c" stroke-width="1.8"/></g>`).join('')}
 ${[[34,60],[166,90],[30,110],[170,150]].map(([x,y])=>`<path d="M${x} ${y-14}l-6 12h8l-6 14" fill="none" stroke="#ffe14d" stroke-width="3.2"/>`).join('')}
 </g>`),
 ppogeuri: L(`<g stroke-width="3.2">
 
 ${[-1,1].map(d=>`<path d="M${100+d*44} 96C${100+d*80} 50 ${100+d*96} 76 ${100+d*86} 100 ${100+d*96} 120 ${100+d*76} 146 ${100+d*46} 120z" fill="#e8f9ff" fill-opacity=".85" stroke="#7fb8e6" stroke-width="2.4"/><path d="M${100+d*52} 106C${100+d*70} 84 ${100+d*82} 90 ${100+d*78} 100" fill="none" stroke="#ffb3e6" stroke-width="2"/>`).join('')}
 <circle cx="100" cy="110" r="56" fill="url(#gBub)" stroke="#6a8fd6"/>
 <path d="M66 86a40 40 0 0 1 30-24" fill="none" stroke="#fff" stroke-width="7"/>
 <circle cx="134" cy="138" r="5" fill="#fff" stroke="none"/>
 ${eyeN(84,112,10,'#ff6fb5')}${eyeN(116,112,10,'#ff6fb5')}
 <ellipse cx="70" cy="128" rx="8" ry="5" fill="#ff8ccb" fill-opacity=".55" stroke="none"/><ellipse cx="130" cy="128" rx="8" ry="5" fill="#ff8ccb" fill-opacity=".55" stroke="none"/>
 <path d="M94 130q6 7 12 0" fill="#ff6f8e" stroke-width="2.4"/>
 <path d="M100 56l-30-16q-6 14 2 26zM100 56l30-16q6 14-2 26z" fill="#39b54a"/>
 ${[[-1],[1]].map(([d])=>[0,1,2].map(i=>`<path d="M${100+d*(8+i*7)} ${50-i*2}l${d*2} ${10+i*2}" stroke="#1f7a2c" stroke-width="1.4"/>`).join('')).join('')}
 <rect x="92" y="48" width="16" height="14" rx="4" fill="#4fd162"/>
 ${[[42,170,12],[60,186,8],[148,172,11],[166,156,7],[30,138,7],[176,120,8],[140,190,6]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gSm)" stroke="#6a8fd6" stroke-width="2"/><circle cx="${x-r*.35}" cy="${y-r*.35}" r="${r*.25}" fill="#fff" stroke="none"/>`).join('')}
 ${[[34,40],[168,34],[150,24]].map(([x,y])=>`<path d="M${x} ${y-7}q1.500 5.500 7 7-5.500 1.500-7 7-1.500-5.500-7-7 5.500-1.500 7-7z" fill="#fff59a" stroke-width="1.6"/>`).join('')}
 </g>`),
 hwangsari: L(`<g stroke-width="3.2">
 
 <path d="M84 150q16 8 32 0l-6 14q-10 4-20 0zM90 164q10 4 20 0l-4 12q-6 2-12 0zM95 176q5 2 10 0l-3 14q-2 1-4 0z" fill="#c9963c"/>
 <path d="M50 150c-24 0-34-26-18-40-16-14-6-44 16-40 0-30 30-42 52-30 20-14 52-4 54 24 22 0 32 26 18 40 16 16 2 46-22 44-6 14-34 14-50 6-16 8-40 6-50-4z" fill="url(#gDust)"/>
 <path d="M44 96q16-10 30 0M126 96q16-10 30 0M60 60q16-12 34-4" fill="none" stroke="#fff3c9" stroke-width="3" stroke-opacity=".7"/>
 ${eyeN(80,92,9,'#7a4a12')}${eyeN(120,92,9,'#7a4a12')}
 <path d="M66 74l22 10M134 74l-22 10" fill="none" stroke-width="4"/>
 <path d="M70 108q30-8 60 0l-4 26q-26 10-52 0z" fill="#ffffff"/>
 <path d="M76 116q24-5 48 0M76 124q24-5 48 0" fill="none" stroke="#c9d3df" stroke-width="2"/>
 <path d="M100 108l2 30" fill="none" stroke="#c9d3df" stroke-width="2"/>
 <path d="M70 110q-20-4-24-18M130 110q20-4 24-18" fill="none" stroke-width="2.4"/>
 <text x="88" y="132" font-family="Arial Black,Arial" font-weight="900" font-size="8" fill="#5a6b80" stroke="none">KF94</text>
 ${[[24,60],[178,70],[22,140],[180,150],[40,30],[160,28],[64,182],[138,186],[14,104],[186,108]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${2+i%3}" fill="#c9963c" stroke-width="1.4"/>`).join('')}
 <path d="M10 70q20 6 28-4M162 182q18 4 30-8M8 180q14 0 22-10" fill="none" stroke="#d9a84a" stroke-width="3"/>
 </g>`),
 harmonium: L(`<g stroke-width="3">
 ${truss(100, 116, 78, 60, 9, '#6b7380', '#2b3038')}
 ${tower(14, 96, 36, 82, 3)}${tower(150, 96, 36, 82, 3)}
 ${[24, 34, 166, 176].map((x, i) => `<circle cx="${x}" cy="${i < 2 ? 88 : 88}" r="2.5" fill="#1a1433" stroke="none"/>`).join('')}
 <path d="M50 164h100l10 16H40z" fill="#B88A4E"/><path d="M62 164l-6 16M84 164l-2 16M116 164l2 16M138 164l6 16" fill="none" stroke="#8a6332" stroke-width="1.6"/>
 <path d="M40 180h120v14H40z" fill="#2f343c"/>
 <path d="M76 184q24 10 48 0" fill="#fff" stroke-width="2.4"/><path d="M86 185v4M100 186v5M114 185v4" stroke-width="1.4"/>
 ${can(84, 64, 12, '#3aa0ff', '#fff6c2')}${can(116, 64, -12, '#3aa0ff', '#fff6c2')}
 <path d="M80 50l4-12M120 50l-4-12" fill="none" stroke-width="2"/>
 <path d="M100 164v-36" stroke-width="3.4"/><path d="M90 164h20" stroke-width="3.4"/>
 <path d="M100 160c18 4 30 6 40 0s14-10 10-18" fill="none" stroke="#1a1433" stroke-width="2.6"/>
 <path d="M150 142c4-6 2-12-2-14" fill="none" stroke-width="2.6"/>
 <rect x="95" y="118" width="10" height="14" rx="2" fill="#2f343c"/>
 <circle cx="100" cy="110" r="11" fill="#cfd6df"/>
 <path d="M92 105q4 4 8 0t8 0M91 111q4 4 9 0t9 0" fill="none" stroke="#ff7ad9" stroke-width="2"/>
 <circle cx="96" cy="104" r="2.4" fill="#fff" stroke="none"/>
 ${[[100, 92], [88, 96], [112, 96]].map(([x, y], i) => `<path d="M${x} ${y}l${[0, -4, 4][i]}-6" stroke="#ff7ad9" stroke-width="2"/>`).join('')}
</g>`),
};
const glowEye = (x, y, dir = 1, c = '#FFE45C') => `<path d="M${x - 15 * dir} ${y - 7}L${x + 15 * dir} ${y + 4}Q${x} ${y + 11} ${x - 15 * dir} ${y - 7}z" fill="${c}"/>`;
const flame = (x, y, s, c1 = '#F2622E', c2 = '#FFD23F') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -30C14 -12 18 -2 12 10-3 18-14 10-13 -2-13 -10-6 -14-3 -8-5 -18-3 -24 0 -30z" fill="${c1}"/><path d="M1 -12C7 -4 8 2 4 7-2 10-6 6-5 1-4 -4-1 -6 1 -12z" fill="${c2}" stroke-width="2"/></g>`;
const neon = (d, a, b) => `<path d="${d}" fill="none" stroke="${a}" stroke-width="7"/><path d="${d}" fill="none" stroke="${b}" stroke-width="2.6"/>`;
const wingPair = (f) => [-1, 1].map(f).join('');
const MEGA = {
 neonna: L(`
  ${[20, 58, 142, 180].map((x, i) => `<path d="M${x} -6L${x + (i < 2 ? 34 : -34)} 200" stroke="#ff4fa8" stroke-opacity=".0"/>`).join('')}
  <path d="M100 0L34 200H166z" fill="#fff3a0" fill-opacity=".14" stroke="none"/>
  ${wingPair((d) => neon(`M${100 + d * 12} 72C${100 + d * 54} -6 ${100 + d * 112} 0 ${100 + d * 94} 62 ${100 + d * 82} 96 ${100 + d * 34} 92 ${100 + d * 12} 82`, '#ff4fa8', '#ffd6ec') + neon(`M${100 + d * 24} 66C${100 + d * 52} 26 ${100 + d * 90} 26 ${100 + d * 80} 58 ${100 + d * 70} 78 ${100 + d * 40} 78 ${100 + d * 24} 72`, '#FFE45C', '#fff') + neon(`M${100 + d * 12} 92C${100 + d * 50} 94 ${100 + d * 96} 120 ${100 + d * 70} 154 ${100 + d * 44} 166 ${100 + d * 24} 126 ${100 + d * 12} 102`, '#37e0ff', '#d6f8ff'))}
  <path d="M70 62C60 26 82 14 102 14s42 14 32 50c-2 22 8 34 2 50-14-10-22-24-22-46l-30 0c0 22-6 36-16 42-8-16 6-30 4-48z" fill="#D63FE0"/>
  <path d="M90 62h20v14q-10 8-20 0z" fill="#F7CFA6"/>
  <path d="M74 80q26-12 52 0l8 34-2 2-6 0q0-8-6-18l0 32H80l0-32q-6 10-6 18l-8 0-2-2z" fill="#F7CFA6"/>
  <path d="M84 84q16 12 32 0l2 16q-2 10-4 18l10 32 14 46H96l-6-40-16 40H56l24-74q2-10 0-20z" fill="#3A1470"/>
  ${[[92, 104], [108, 110], [98, 128], [110, 148], [84, 150], [118, 172], [72, 180], [102, 180]].map(([x, y]) => `<path d="M${x} ${y - 5}l1.500 3.500 3.500 1.500-3.500 1.500-1.500 3.500-1.500-3.500-3.500-1.500 3.500-1.500z" fill="#FFE45C" stroke-width="1"/>`).join('')}
  <path d="M84 84q16 12 32 0" fill="none" stroke="#FFE45C" stroke-width="3"/><path d="M82 118q18 7 36 0" fill="none" stroke="#37e0ff" stroke-width="3"/>
  <path d="M96 156l-6 40h-8l2-26z" fill="#F7CFA6"/>
  <path d="M74 84q-14 8-18 26l-2 18 8 2 8-18 6-12z" fill="#F7CFA6"/>
  <path d="M126 84q16 2 22-14l-8-4q-6 8-16 8z" fill="#F7CFA6"/>
  <path d="M144 62l8-14" stroke="#c7cdd6" stroke-width="5"/><circle cx="154" cy="44" r="8" fill="#FFE45C"/>
  <path d="M78 42q0-24 22-24t22 24q0 24-22 26-22-2-22-26z" fill="#F7CFA6"/>
  ${lady({ iris: '#D63FE0' })}
  <path d="M76 44c-2-26 16-34 32-30 12 2 20 16 16 32-4-12-12-18-22-20-10 6-22 6-26 18z" fill="#E86CF0"/>
  <path d="M78 22l-4-16 12 8 14-12 14 12 12-8-4 16q-22-8-44 0z" fill="#FFE45C"/><circle cx="100" cy="12" r="3.500" fill="#37e0ff"/>
  <circle cx="76" cy="60" r="3" fill="#FFE45C" stroke-width="1.500"/><circle cx="124" cy="60" r="3" fill="#FFE45C" stroke-width="1.500"/>`),
 yeonji: L(`
  ${wingPair((d) => `<path d="M${100 + d * 10} 72C${100 + d * 40} 2 ${100 + d * 112} -6 ${100 + d * 100} 60 ${100 + d * 94} 96 ${100 + d * 50} 92 ${100 + d * 14} 86z" fill="#C21F4A"/><path d="M${100 + d * 22} 66C${100 + d * 46} 22 ${100 + d * 92} 16 ${100 + d * 86} 58 ${100 + d * 80} 80 ${100 + d * 48} 80 ${100 + d * 24} 76z" fill="#FFB3CC"/><path d="M${100 + d * 10} 88C${100 + d * 54} 92 ${100 + d * 100} 122 ${100 + d * 70} 158 ${100 + d * 44} 170 ${100 + d * 22} 124 ${100 + d * 10} 100z" fill="#7A1230"/><circle cx="${100 + d * 66}" cy="46" r="11" fill="#FFD23F"/><circle cx="${100 + d * 66}" cy="46" r="4" fill="#C21F4A"/><circle cx="${100 + d * 54}" cy="124" r="8" fill="#FFD23F"/>`)}
  <path d="M68 196q32-24 64 0l50 4H18z" fill="#7A1230"/>
  <circle cx="100" cy="14" r="11" fill="#1a1433"/>
  <path d="M90 62h20v14q-10 8-20 0z" fill="#FFE0BD"/>
  <path d="M70 80q30-8 60 0l6 6q-36 16-72 0z" fill="#FFE0BD"/>
  <path d="M70 84q30 12 60 0l-6 26H76z" fill="#7A1230"/>
  <path d="M70 84q30 12 60 0" fill="none" stroke="#FFD23F" stroke-width="3"/>
  <path d="M76 104q24 8 48 0l-2 10q-22 6-44 0z" fill="#FFD23F"/>
  <path d="M78 114q22 7 44 0l8 28 18 56H106l-8-40-14 40H52l18-56z" fill="#111A52"/>
  ${[[74, 150], [126, 150], [64, 182], [136, 182], [88, 176], [118, 170]].map(([x, y]) => `<path d="M${x - 6} ${y}a6 6 0 0 1 12 0q-6 6-12 0z" fill="#FFD23F" stroke-width="1.200"/>`).join('')}
  <path d="M98 160l14 40h-14z" fill="#FFE0BD"/>
  <path d="M68 82q-12 2-16 18l-4 18 8 4 8-14 10-16z" fill="#FFE0BD"/><path d="M132 82q16 0 20-16l2-12-8-2-6 12-10 6z" fill="#FFE0BD"/>
  <path d="M150 120L150 40" stroke="none"/>
  <rect x="145" y="22" width="12" height="28" rx="2" fill="#FFD23F"/><path d="M146 22l1-16 10 6 0 10z" fill="#E0123E"/><path d="M151 50v60" stroke="#FFD23F" stroke-width="5"/>
  <path d="M78 40q0-24 22-24t22 24q0 24-22 26-22-2-22-26z" fill="#FFE0BD"/>
  ${lady({ eyeY: 38, lip: '#E0123E', iris: '#C21F4A' })}
  <path d="M76 42c-2-26 14-32 24-32s26 6 24 32c-6-12-14-18-24-18s-18 6-24 18z" fill="#1a1433"/>
  <path d="M74 22l-2-14 14 6 14-12 14 12 14-6-2 14q-28-8-52 0z" fill="#FFD23F"/>${[86, 100, 114].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? 12 : 17}" r="3" fill="#E0123E" stroke-width="1.200"/>`).join('')}
  <path d="M74 26l-4 18M126 26l4 18" fill="none" stroke="#FFD23F" stroke-width="2.400"/>`),
 jabanbot: L(`
  <path d="M50 160h40v28H46zM110 160h40l4 28h-44z" fill="#3a3f4b"/><path d="M38 184h56v14H36zM106 184h56l2 14h-58z" fill="#E7B23A"/>
  <path d="M26 30h34v30H26zM140 30h34v30h-34z" fill="#3a3f4b"/>
  ${[0, 1].map((i) => `<circle cx="${34 + i * 18}" cy="38" r="6" fill="#E8402C"/><circle cx="${34 + i * 18}" cy="52" r="6" fill="#FFD23F"/><circle cx="${148 + i * 18}" cy="38" r="6" fill="#E8402C"/><circle cx="${148 + i * 18}" cy="52" r="6" fill="#FFD23F"/>`).join('')}
  <path d="M34 66L6 88l4 46 22-6-2-30 16-14z" fill="#E7B23A"/><path d="M166 66l28 22-4 46-22-6 2-30-16-14z" fill="#E7B23A"/>
  <path d="M0 132h34v30H0zM166 132h34v30h-34z" fill="#E8402C"/><path d="M6 142h22M6 152h22M172 142h22M172 152h22" fill="none" stroke-width="2"/>
  <rect x="40" y="58" width="120" height="110" rx="6" fill="#B31220"/><path d="M40 70h120" fill="none" stroke="#E7B23A" stroke-width="5"/>
  <rect x="50" y="76" width="72" height="56" fill="#BFE4FF"/>
  ${[0, 1].map((r) => [0, 1, 2, 3].map((c) => `<rect x="${54 + c * 16}" y="${81 + r * 24}" width="11" height="20" rx="2" fill="${['#FFD23F', '#E8402C', '#FFD23F', '#37e0ff'][(r + c) % 4]}" stroke-width="1.600"/>`).join('')).join('')}
  <rect x="128" y="78" width="24" height="52" fill="#1a1433"/><text x="140" y="96" font-size="11" font-weight="900" text-anchor="middle" fill="#6CF2C2" stroke="none">MAX</text><circle cx="140" cy="112" r="7" fill="#E8402C"/>
  <rect x="50" y="138" width="100" height="22" fill="#1a1433"/><path d="M58 149h84" stroke="#FFD23F" stroke-width="3"/>
  <path d="M66 58l6-36h56l6 36z" fill="#E7B23A"/><path d="M60 32h12l4-20 10 12 14-16 14 16 10-12 4 20h12" fill="none"/>
  <rect x="78" y="32" width="44" height="14" fill="#0d1a2c"/>${glowEye(90, 38, 1, '#E8402C').replace(/15/g, '9')}${glowEye(110, 38, -1, '#E8402C').replace(/15/g, '9')}`),
 baedalbot: L(`
  ${flame(16, 164, 1, '#37e0ff', '#fff')}${flame(0, 134, .75, '#37e0ff', '#fff')}
  <path d="M0 174h44" stroke="#fff" stroke-width="4" fill="none"/>
  <circle cx="60" cy="168" r="28" fill="#1a1433"/><circle cx="60" cy="168" r="12" fill="#E7B23A"/>
  <circle cx="154" cy="168" r="28" fill="#1a1433"/><circle cx="154" cy="168" r="12" fill="#E7B23A"/>
  <path d="M44 150h116l-14-26H62z" fill="#E8402C"/>
  <path d="M58 130L28 96l16-8 30 32z" fill="#59606c"/><rect x="14" y="74" width="46" height="38" rx="4" fill="#D7DDE5"/><path d="M14 90h46M37 74v38" fill="none" stroke-width="2"/>
  <rect x="2" y="30" width="46" height="38" rx="4" fill="#D7DDE5"/><path d="M2 46h46M25 30v38" fill="none" stroke-width="2"/>
  <path d="M72 62h74l10 66H62z" fill="#E7B23A"/><path d="M66 96h86" fill="none" stroke="#1a1433" stroke-width="5"/><circle cx="110" cy="112" r="10" fill="#37e0ff"/>
  <path d="M138 70l44 18-4 14-46-8z" fill="#8a8f98"/><path d="M180 72l-6 34 12 2 8-34z" fill="#2c303a"/><circle cx="192" cy="68" r="6" fill="#FFD23F"/>
  <path d="M74 40q0-32 36-32t36 32v20H74z" fill="#E8402C"/><path d="M58 30L74 22 74 46zM162 30l-16-8 0 24z" fill="#FFD23F"/>
  <path d="M82 32h58q2 22-4 26H86q-6-4-4-26z" fill="#17273e"/>${glowEye(98, 44, 1, '#37e0ff').replace(/15/g, '10')}${glowEye(124, 44, -1, '#37e0ff').replace(/15/g, '10')}
  <path d="M110 8l-6 14h12z" fill="#FFD23F"/>`),
 setakbot: L(`
  <path d="M46 170v18M154 170v18" stroke="#59606c" stroke-width="18"/><path d="M26 186h42v12H26zM132 186h42v12h-42z" fill="#2c303a"/>
  <rect x="10" y="88" width="86" height="88" rx="10" fill="#EAF0F5"/><rect x="104" y="88" width="86" height="88" rx="10" fill="#EAF0F5"/>
  <rect x="56" y="8" width="88" height="88" rx="10" fill="#FFF3CF"/>
  ${[[53, 134, 30], [147, 134, 30], [100, 56, 30]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#AEB7C2"/><circle cx="${x}" cy="${y}" r="${r - 7}" fill="#17273e"/><path d="M${x - r + 7} ${y + 2}q${r / 2} -9 ${r - 7} 0t${r - 7} 0a${r - 7} ${r - 7} 0 0 1 -${(r - 7) * 2} 0z" fill="${['#2F7DE1', '#2F7DE1', '#E8402C'][i]}"/><path d="M${x} ${y - 16}q14 8 8 22" fill="none" stroke="#BFE4FF" stroke-width="2.600"/>`).join('')}
  ${glowEye(86, 52, 1, '#FFE45C').replace(/15/g, '10')}${glowEye(114, 52, -1, '#FFE45C').replace(/15/g, '10')}
  <rect x="62" y="12" width="76" height="10" fill="#C7CDD6"/><rect x="68" y="14" width="30" height="6" fill="#0d1a2c"/>
  <rect x="14" y="92" width="78" height="10" fill="#C7CDD6"/><rect x="108" y="92" width="78" height="10" fill="#C7CDD6"/>
  <text x="100" y="192" font-size="10.500" font-weight="900" text-anchor="middle" fill="#fff" stroke="none">코인세탁</text>
  ${[[20, 40], [184, 44], [36, 18], [170, 20], [8, 70], [192, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#BFE4FF"/>`).join('')}`),

 godeuri: L(`<g stroke-width="3.2">
 
 <circle cx="100" cy="104" r="98" fill="url(#mAura)" stroke="none"/>
 ${[[-1],[1]].map(([d])=>`<path d="M${100+d*40} 70L${100+d*92} 40 ${100+d*78} 66 ${100+d*98} 78 ${100+d*72} 90 ${100+d*86} 112 ${100+d*54} 104z" fill="url(#mIce)" stroke-width="2.6"/><path d="M${100+d*54} 116q${d*30} 6 ${d*36} 34l${-d*8}-4-4 10-6-12-8 4q0-18 ${-d*18}-26z" fill="url(#mIce)" stroke-width="2.4"/>`).join('')}
 <path d="M54 44Q40 120 100 198Q160 120 146 44z" fill="url(#mIce)"/>
 <path d="M66 58Q58 112 94 176" fill="none" stroke="#fff" stroke-width="5" stroke-opacity=".85"/>
 <path d="M100 98c20 14 28 30 18 48-6 12-32 14-38 0-7-14 0-20 3-30 5 8 10 8 11 2 1-8-3-12 6-20z" fill="url(#mFl)" stroke="#3a1fd1" stroke-width="2.2"/>
 <path d="M100 128l6 8-6 8-6-8z" fill="#fff" stroke="#3a1fd1" stroke-width="1.6"/>
 ${glowN(82,72,10,'#7a5cff')}${glowN(118,72,10,'#7a5cff',-1)}
 <path d="M68 60l24 6M132 60l-24 6" fill="none" stroke-width="3.6"/>
 <path d="M84 88q16 12 32 0z" fill="#1a1433"/><path d="M88 88l3 7 3-6M106 88l3 6 3-7" fill="#fff" stroke-width="1.4"/>
 <path d="M42 46l14-30 10 22 12-34 12 30 10-38 10 38 12-30 12 34 10-22 14 30z" fill="url(#mIce)"/>
 <path d="M42 46h116" stroke-width="3.6"/>
 <circle cx="100" cy="30" r="6" fill="#a98bff" stroke-width="2"/>
 ${[[22,150],[178,146],[18,98],[182,94],[40,186],[160,186]].map(([x,y])=>`<path d="M${x} ${y-8}v16M${x-8} ${y}h16M${x-5} ${y-5}l10 10M${x+5} ${y-5}l-10 10" stroke="#d6f3ff" stroke-width="2.2"/>`).join('')}
 </g>`),
 yangmeori: L(`<g stroke-width="3.2">
 
 <circle cx="100" cy="100" r="96" fill="url(#mSplit)" stroke="none" opacity=".6"/>
 ${[20,40,60,80].map((y,i)=>`<path d="M${14+i*6} ${y+110}q-10-20 4-34 2 12 10 14-2-14 8-26 6 24-2 40z" fill="#ff8a3d" stroke-width="2"/>`).join('')}
 ${[[176,120],[166,160],[182,80],[154,190]].map(([x,y])=>`<path d="M${x} ${y-12}l5 9 9 3-9 3-5 9-5-9-9-3 9-3z" fill="#bfeaff" stroke-width="2"/>`).join('')}
 <path d="M56 126q44-16 88 0l16 50q-60 18-120 0z" fill="#d42f6b"/>
 <path d="M56 126q44 12 88 0" fill="none" stroke="#ffd34d" stroke-width="4"/>
 <path d="M58 132l-30 52 30-8zM142 132l30 52-30-8z" fill="#fff"/>
 <path d="M52 172q48 12 96 0l2 14q-50 12-100 0z" fill="#ffd34d"/>
 <path d="M74 184v12h18v-10M108 186v10h18v-12" fill="#ffd9b8"/>
 <circle cx="100" cy="84" r="44" fill="#ffe0c2"/>
 <path d="M52 74q-2-50 48-52 50 2 48 52-48-26-96 0z" fill="#fff"/>
 <path d="M58 60q42-22 84 0" fill="none" stroke="#ffd34d" stroke-width="6"/>
 <path d="M100 20l-6 12h12z" fill="#ffd34d"/>
 ${[[-1,46],[1,154]].map(([d,x])=>`<path d="M${x} 60c${d*20}-4 ${d*26} 18 ${d*14} 30 ${-d*4} 4 ${d*2} 14 ${d*10} 10" fill="none" stroke-width="10"/><path d="M${x} 60c${d*20}-4 ${d*26} 18 ${d*14} 30 ${-d*4} 4 ${d*2} 14 ${d*10} 10" fill="none" stroke="${d<0?'#ffb36b':'#bfeaff'}" stroke-width="5"/><circle cx="${x}" cy="62" r="17" fill="#fff"/><path d="M${x} 62m-10 0a10 10 0 1 1 10 10a6 6 0 1 1-6-6" fill="none" stroke-width="2.4"/>`).join('')}
 <path d="M70 102q-6-14 4-22 2 8 8 8 0-8 6-12 4 16-4 28z" fill="#ff6a2b" fill-opacity=".8" stroke-width="1.6"/>
 <path d="M122 92l12 12M134 92l-12 12M128 88v20" stroke="#4fb6ff" stroke-width="2.4"/>
 ${glowN(84,84,8,'#ff4d1a')}${glowN(116,84,8,'#1e9bff',-1)}
 <path d="M72 70l16 6M128 70l-16 6" fill="none" stroke-width="3"/>
 <path d="M88 104q12 10 24 0z" fill="#8a1d1d"/><path d="M92 104h16" stroke="#fff" stroke-width="2"/>
 <ellipse cx="34" cy="96" rx="16" ry="20" fill="#5a2e14"/><path d="M28 86q4-6 10-4" fill="none" stroke="#ffb36b" stroke-width="3"/>
 <path d="M30 76q-4-10 2-16M38 76q-4-10 2-16" fill="none" stroke="#ff8a3d" stroke-width="2.6"/>
 <path d="M150 88h32l-4 40h-24z" fill="#e8f6ff"/><path d="M152 98h28l-3 28h-22z" fill="#e9c58a" stroke="none"/>
 <path d="M150 88h32" stroke-width="4"/><path d="M158 82l2-6M172 82l-2-6" stroke="#bfeaff" stroke-width="2"/>
 </g>`),
 damjaengjeon: L(`<g stroke-width="3.2">
 
 <circle cx="100" cy="104" r="98" fill="url(#mGlow)" stroke="none"/>
 <path d="M30 12l26 34-10 0 18 26M170 12l-26 34h10l-18 26M100 0v10" fill="none" stroke="#fff27a" stroke-width="4"/>
 <path d="M30 12l26 34-10 0 18 26M170 12l-26 34h10l-18 26" fill="none" stroke="#ffd60a" stroke-width="1.6"/>
 ${[64,82,100,118,136].map((x,i)=>`<path d="M${x} 46v-${[14,22,30,22,14][i]}" stroke-width="3"/>${[0,1,2,3].slice(0,[2,3,4,3,2][i]).map(j=>`<path d="M${x-7} ${42-j*8}h14" stroke="#8fff6a" stroke-width="5"/>`).join('')}<circle cx="${x}" cy="${46-[14,22,30,22,14][i]-4}" r="4" fill="#fffbd0" stroke-width="2"/>`).join('')}
 <path d="M50 46h100l6 140H44z" fill="url(#mMet)"/>
 <path d="M50 60h100M46 168h108" fill="none" stroke-width="2.4"/>
 <path d="M64 78h72l-6 22H70z" fill="#0d1a10"/>
 <path d="M70 84l20 8-20 4zM130 84l-20 8 20 4z" fill="#b6ff5c" stroke="#b6ff5c" stroke-width="1.5"/>
 <path d="M80 118h40v26H80z" fill="#ffd60a"/><path d="M102 122l-8 11h7l-5 9" fill="none" stroke-width="2.4"/>
 <path d="M38 186h124v10H38z" fill="#2f3640"/>
 <path d="M42 194C24 150 48 120 60 150S120 170 150 140 180 90 150 64 96 58 60 70 28 40 40 20" fill="none" stroke="#1f5c19" stroke-width="10"/>
 <path d="M42 194C24 150 48 120 60 150S120 170 150 140 180 90 150 64 96 58 60 70 28 40 40 20" fill="none" stroke="#3fa82f" stroke-width="5"/>
 ${[[36,170,-30],[48,128,0],[84,160,10],[120,158,30],[156,124,-20],[164,88,20],[140,62,-10],[60,66,30],[34,40,-40],[100,62,10]].map(([x,y,r])=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(1.15)"><path d="M0 8C-14 6-16-6-8-8-10-16 0-18 0-12 0-18 10-16 8-8 16-6 14 6 0 8z" fill="#2f9c25" stroke-width="2.2"/><path d="M0 8V-10M0-2l-6-4M0-2l6-4" fill="none" stroke="#d6ff5c" stroke-width="2"/></g>`).join('')}
 ${[[150,166],[46,104],[170,108]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="7" fill="#ff5fb0" stroke-width="2"/><circle cx="${x}" cy="${y}" r="2.6" fill="#ffe14d" stroke="none"/>`).join('')}
 </g>`),
 ppogeuri: L(`<g stroke-width="3.2">
 
 ${[-1,1].map(d=>`<path d="M${100+d*40} 90C${100+d*70} 20 ${100+d*104} 30 ${100+d*96} 76 ${100+d*92} 98 ${100+d*70} 104 ${100+d*48} 100z" fill="url(#mWing)" fill-opacity=".9" stroke="#7a8ee6" stroke-width="2.4"/><path d="M${100+d*44} 108C${100+d*86} 108 ${100+d*100} 138 ${100+d*82} 160 ${100+d*66} 172 ${100+d*52} 146 ${100+d*42} 120z" fill="url(#mWing)" fill-opacity=".9" stroke="#7a8ee6" stroke-width="2.4"/><circle cx="${100+d*80}" cy="58" r="7" fill="#fff" fill-opacity=".8" stroke="#ff9ad5" stroke-width="1.6"/><circle cx="${100+d*72}" cy="140" r="5" fill="#fff" fill-opacity=".8" stroke="#8fe6ff" stroke-width="1.6"/>`).join('')}
 <path d="M60 140q40 20 80 0l14 50q-54 16-108 0z" fill="#fff"/>
 ${[56,72,88,104,120,136].map(x=>`<circle cx="${x+4}" cy="${186+(x%3)}" r="9" fill="#fff"/>`).join('')}
 <path d="M64 150q36 14 72 0" fill="none" stroke="#c9b8ff" stroke-width="2"/>
 <path d="M92 56q-40 30-60 70M108 56q40 30 60 70" fill="none" stroke="#2fbf4a" stroke-width="6"/>
 <circle cx="100" cy="100" r="50" fill="url(#mBub)" stroke="#5f7fd6"/>
 <path d="M68 78a36 36 0 0 1 28-22" fill="none" stroke="#fff" stroke-width="7"/>
 ${glowN(84,102,10,'#ff3fa1')}${glowN(116,102,10,'#ff3fa1',-1)}
 <ellipse cx="70" cy="118" rx="8" ry="5" fill="#ff8ccb" fill-opacity=".6" stroke="none"/><ellipse cx="130" cy="118" rx="8" ry="5" fill="#ff8ccb" fill-opacity=".6" stroke="none"/>
 <path d="M92 120q8 9 16 0z" fill="#ff5c86" stroke-width="2.2"/>
 <path d="M100 52l-34-20q-8 16 2 30zM100 52l34-20q8 16-2 30z" fill="#2fbf4a"/>
 <rect x="91" y="44" width="18" height="16" rx="5" fill="#5ee874"/>
 ${[[100,18,11],[78,22,8],[122,22,8],[62,32,6],[138,32,6]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#mBub)" stroke="#5f7fd6" stroke-width="2"/><circle cx="${x-r*.35}" cy="${y-r*.35}" r="${r*.25}" fill="#fff" stroke="none"/>`).join('')}
 ${[[24,40],[176,36],[18,128],[184,120],[34,190],[168,192]].map(([x,y])=>`<path d="M${x} ${y-8}q2 6 8 8-6 2-8 8-2-6-8-8 6-2 8-8z" fill="#fff59a" stroke-width="1.6"/>`).join('')}
 </g>`),
 hwangsari: L(`<g stroke-width="3.2">
 
 <path d="M8 40q40-14 70 6M192 40q-40-14-70 6M4 120q30 20 60 6M196 120q-30 20-60 6" fill="none" stroke="#d9a84a" stroke-width="4" stroke-opacity=".7"/>
 <path d="M60 140q40 14 80 0l-12 18q-28 10-56 0zM70 158q30 10 60 0l-10 16q-20 6-40 0zM80 174q20 6 40 0l-8 14q-12 4-24 0zM90 188q10 3 20 0l-6 10q-4 2-8 0z" fill="url(#mTor)"/>
 <path d="M42 138c-30 0-40-32-20-48-18-18-4-54 24-50 2-36 40-48 62-30 26-16 62-2 62 30 28 0 38 32 20 48 20 20 2 54-28 52-8 16-42 16-60 6-20 10-50 6-60-8z" fill="url(#mDust)"/>
 <path d="M38 80q20-12 36 0M126 80q20-12 36 0M58 46q20-14 40-4" fill="none" stroke="#ffe0a0" stroke-width="3" stroke-opacity=".6"/>
 <path d="M58 72q42-18 84 0l-4 22q-38 10-76 0z" fill="#3a3f47"/>
 <circle cx="80" cy="82" r="13" fill="#ffb02e" stroke-width="3.6"/><circle cx="120" cy="82" r="13" fill="#ffb02e" stroke-width="3.6"/>
 <circle cx="80" cy="82" r="6" fill="#fff7d0" stroke="none"/><circle cx="120" cy="82" r="6" fill="#fff7d0" stroke="none"/>
 <path d="M66 66l24 8M134 66l-24 8" fill="none" stroke-width="4.5"/>
 <path d="M72 102q28-10 56 0l-6 26q-22 10-44 0z" fill="#d6dbe2"/>
 <circle cx="62" cy="120" r="13" fill="#5a6270"/><circle cx="138" cy="120" r="13" fill="#5a6270"/>
 ${[62,138].map(x=>`<path d="M${x-7} 120h14M${x} 113v14" stroke="#9aa3b0" stroke-width="2"/>`).join('')}
 <path d="M72 108l-10 12M128 108l10 12" stroke-width="3"/>
 ${[[18,30,8],[180,28,7],[14,170,9],[186,166,8],[100,8,6],[44,196,5],[160,198,6]].map(([x,y,r])=>`<path d="M${x-r} ${y}l${r*.6}-${r}h${r*.9}l${r*.6} ${r*.8}-${r*.6} ${r}h-${r}z" fill="#8a5a22" stroke-width="2"/>`).join('')}
 ${[[30,60],[170,64],[24,104],[178,100],[60,186],[140,184]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${2+i%3}" fill="#e9b85a" stroke-width="1.4"/>`).join('')}
 </g>`),
 harmonium: L(`<g stroke-width="3">
 ${[[30, 0, '#ff4fd8'], [170, 0, '#4fe3ff'], [60, 0, '#7dff6a'], [140, 0, '#ffe14d']].map(([x, , c], i) => `<path d="M${x} 12L${[4, 196, 40, 160][i]} 196" stroke="${c}" stroke-width="2.4" stroke-opacity=".75"/>`).join('')}
 ${truss(100, 120, 96, 82, 11, '#C9A24A', '#6b4f17')}
 ${truss(100, 120, 78, 62, 9, '#6b7380', '#2b3038')}
 <rect x="64" y="70" width="72" height="34" rx="4" fill="#120d22"/>
 <path d="M70 87h6l3-10 4 20 4-16 4 12 4-18 4 22 4-14 4 8 4-4h9" fill="none" stroke="#4fe3ff" stroke-width="2.2"/>
 ${tower(6, 86, 40, 100, 4, '#F2C94C')}${tower(154, 86, 40, 100, 4, '#F2C94C')}
 <path d="M46 168h108l10 16H36z" fill="#3b2a52"/>
 ${[56, 72, 88, 104, 120, 136].map((x, i) => `<circle cx="${x + 6}" cy="176" r="3" fill="${['#ff4fd8', '#4fe3ff', '#ffe14d', '#7dff6a', '#ff4fd8', '#4fe3ff'][i]}" stroke-width="1.2"/>`).join('')}
 <path d="M36 184h128v12H36z" fill="#2f343c"/>
 <path d="M70 186q30 12 60 0" fill="#fff" stroke-width="2.4"/><path d="M82 187l3 5 3-4M112 187l3 4 3-5" fill="none" stroke-width="1.4"/>
 ${can(78, 48, 18, '#ff3fa1', '#fff')}${can(122, 48, -18, '#ff3fa1', '#fff')}
 <path d="M72 50l-16 10M128 50l16 10" stroke="#fff27a" stroke-width="3" stroke-opacity=".8"/>
 <path d="M100 168v-34" stroke-width="3.4"/><path d="M88 168h24" stroke-width="3.4"/>
 <rect x="94" y="122" width="12" height="18" rx="3" fill="#C9A24A"/>
 <circle cx="100" cy="114" r="13" fill="#F2C94C"/>
 <path d="M91 109q4 4 9 0t9 0M90 116q5 4 10 0t10 0" fill="none" stroke="#8a5a00" stroke-width="2"/>
 <circle cx="95" cy="108" r="2.6" fill="#fff" stroke="none"/>
 ${[[-1], [1]].map(([d]) => `<path d="M${100 + d * 18} 112q${d * 6} 4 0 8M${100 + d * 24} 108q${d * 10} 8 0 16" fill="none" stroke="#fff27a" stroke-width="2.4"/>`).join('')}
 ${[[18, 40], [182, 44], [100, 6]].map(([x, y]) => `<path d="M${x} ${y - 9}q2 7 9 9-7 2-9 9-2-7-9-9 7-2 9-9z" fill="#fff59a" stroke-width="1.6"/>`).join('')}
 <text x="22" y="74" font-size="16" font-weight="900" fill="#ff7ad9" stroke-width="1.6">♪</text><text x="164" y="72" font-size="16" font-weight="900" fill="#4fe3ff" stroke-width="1.6">♫</text>
</g>`),
};
Object.assign(MEGA_ART, MEGA);
return ART;
})();
