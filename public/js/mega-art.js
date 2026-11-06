// 메가진화 그림. 전부 코드로 그린 오리지널 SVG입니다.
const MEGA_ART = (() => {
const L = (s) => `<g stroke="#1a1433" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
const glowEye = (x, y, dir = 1, c = '#FFE45C') => `<path d="M${x - 15 * dir} ${y - 7}L${x + 15 * dir} ${y + 4}Q${x} ${y + 11} ${x - 15 * dir} ${y - 7}z" fill="${c}"/>`;
const range = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const flame = (x, y, s, c1 = '#F2622E', c2 = '#FFD23F') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -30C14 -12 18 -2 12 10-3 18-14 10-13 -2-13 -10-6 -14-3 -8-5 -18-3 -24 0 -30z" fill="${c1}"/><path d="M1 -12C7 -4 8 2 4 7-2 10-6 6-5 1-4 -4-1 -6 1 -12z" fill="${c2}" stroke-width="2"/></g>`;
const dumbEye = (x, y, r = 11) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 2}" r="${r * .45}" fill="#1a1433"/>`;
const puff = (x, y, s = 1, c = '#fff') => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-16 8a10 10 0 0 1 2-19 12 12 0 0 1 22-4 11 11 0 0 1 10 21z" fill="${c}"/></g>`;

return {
 yeontan: L(`
  ${flame(100, 40, 1.5)}${flame(62, 52, 1.05)}${flame(138, 52, 1.05)}${flame(82, 40, .75)}${flame(118, 40, .75)}
  <path d="M40 78L12 92 8 118l14 8 20-16z" fill="#2e2a33"/><path d="M160 78l28 14 4 26-14 8-20-16z" fill="#2e2a33"/>
  <path d="M6 116l-2 26 18 6 12-22z" fill="#3b3640"/><path d="M194 116l2 26-18 6-12-22z" fill="#3b3640"/>
  ${flame(12, 158, .75)}${flame(188, 158, .75)}
  <path d="M42 70h116v104q-58 20-116 0z" fill="#2a2630"/>
  <ellipse cx="100" cy="70" rx="58" ry="19" fill="#4a4450"/>
  ${[[64, 66], [78, 62], [92, 60], [108, 60], [122, 62], [136, 66], [70, 74], [84, 72], [100, 70], [116, 72], [130, 74], [90, 80], [110, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#FF8A1A" stroke-width="2"/>`).join('')}
  <path d="M46 110l16 8-6 16 14 12-4 18M154 106l-14 10 8 14-14 14 4 22M92 168l6-14-6-8 10-8" fill="none" stroke="#FF8A1A" stroke-width="6"/>
  <path d="M46 110l16 8-6 16 14 12-4 18M154 106l-14 10 8 14-14 14 4 22M92 168l6-14-6-8 10-8" fill="none" stroke="#FFE45C" stroke-width="2"/>
  ${glowEye(76, 108, 1, '#FF8A1A')}${glowEye(124, 108, -1, '#FF8A1A')}
  <path d="M72 130l8 7 7-7 7 7 6-7 6 7 7-7 7 7 8-7v8l-8 8H80l-8-8z" fill="#FFD23F"/>`),
 kkaebi: L(`
  <path d="M34 92q-20 54-10 96h152q10-42-10-96z" fill="#C21F2B"/><path d="M34 92q-14 40-12 96h26q-6-52 6-92z" fill="#8f1420"/>
  <path d="M170 150L196 14" stroke="#4a2c1a" stroke-width="9"/>
  <path d="M168 66l14-58 18 6 2 66-14 10z" fill="#E7B23A"/>${range(6, (i) => `<circle cx="${178 + (i % 2) * 11}" cy="${22 + i * 12}" r="3.4" fill="#fff3a0" stroke-width="2"/>`)}
  <path d="M58 40L34 2l40 22z" fill="#FFD23F"/><path d="M142 40l24-38-40 22z" fill="#FFD23F"/><path d="M92 22l8-20 8 20z" fill="#FFD23F"/>
  <path d="M46 72q0-50 54-50t54 50q2 26-16 44H62Q44 98 46 72z" fill="#3B2F8C"/>
  <path d="M34 112q-12 14-8 42l34 12 8-40zM166 112q12 14 8 42l-34 12-8-40z" fill="#3B2F8C"/>
  <path d="M60 116h80l10 66H50z" fill="#3B2F8C"/>
  <path d="M60 118q40 22 80 0l-6 22q-34 12-68 0z" fill="#E7B23A"/><path d="M68 150q32 10 64 0M72 166q28 8 56 0" fill="none" stroke="#6c60d0"/>
  <path d="M50 178h100l6 12H44z" fill="#E7B23A"/>
  ${glowEye(74, 70, 1, '#6CF2C2')}${glowEye(126, 70, -1, '#6CF2C2')}
  <path d="M76 88h48l-6 16H82z" fill="#fff"/><path d="M78 90l-8-14 14 10M122 90l8-14-14 10" fill="#fff"/><path d="M88 88v16M100 88v16M112 88v16" fill="none" stroke-width="2"/>
  <path d="M118 54l10 18" stroke="#E8402C"/>`),
 jangseung: L(`
  <path d="M20 190l14-30h132l14 30z" fill="#7a5a3a"/>
  <path d="M46 180V60q0-34 54-34t54 34v120z" fill="#8C5A2B"/>
  <path d="M62 180V52M138 180V52M100 180V140" fill="none" stroke="#6c4220" stroke-width="2"/>
  <path d="M24 44q76-34 152 0l-14 18q-62-22-124 0z" fill="#1d1a24"/><path d="M78 30V8h44v22z" fill="#1d1a24"/><path d="M78 16h44" fill="none" stroke="#E7B23A" stroke-width="4"/>
  ${flame(100, 8, .5, '#E8402C', '#FFD23F')}
  <path d="M60 76q20-18 38 0M102 76q20-18 38 0" fill="none" stroke-width="7"/>
  <circle cx="79" cy="88" r="13" fill="#fff"/><circle cx="121" cy="88" r="13" fill="#fff"/><circle cx="79" cy="88" r="6" fill="#E8402C"/><circle cx="121" cy="88" r="6" fill="#E8402C"/>
  <path d="M100 92l-12 28h24z" fill="#a9713a"/>
  <path d="M64 128h72v28H64z" fill="#fff"/><path d="M64 142h72M76 128v28M88 128v28M100 128v28M112 128v28M124 128v28" fill="none" stroke-width="2"/>
  <path d="M68 128l-8-22 14 18M132 128l8-22-14 18" fill="#fff"/>
  <path d="M14 196V24" stroke="#59402a" stroke-width="6"/><path d="M14 24l-8 18h16zM14 6l-5 18h10z" fill="#c7cdd6"/><path d="M186 196V24" stroke="#59402a" stroke-width="6"/><path d="M186 24l-16 8 16 26 16-26zM186 6l-5 18h10z" fill="#c7cdd6"/>
  <path d="M14 46q-12 18 8 34" fill="none" stroke="#E8402C" stroke-width="5"/><path d="M186 58q12 18-8 32" fill="none" stroke="#2F7DE1" stroke-width="5"/>
  <path d="M54 170h92" fill="none" stroke="#E8402C" stroke-width="7"/>`),
 jeonbot: L(`
  <path d="M100 4L66 196h22l12-74 12 74h22z" fill="#59606c"/>
  <path d="M90 60L110 94M110 60L90 94M84 94l32 36M116 94l-32 36M78 130l44 44M122 130l-44 44" fill="none" stroke="#2c303a" stroke-width="3"/>
  <path d="M38 46h124l-16 10H54zM22 82h156l-18 10H40zM44 118h112l-14 10H58z" fill="#8a8f98"/>
  ${[42, 158, 26, 174, 48, 152].map((x, i) => `<rect x="${x - 4}" y="${[46, 46, 82, 82, 118, 118][i] + 8}" width="8" height="16" fill="#fff"/>`).join('')}
  <path d="M38 62Q10 56 2 72M162 62q28-6 36 10" fill="none"/>
  <path d="M26 104l-18 34 18-4-14 40 34-56-20 4 16-20zM174 104l18 34-18-4 14 40-34-56 20 4-16-20z" fill="#FFE45C"/>
  ${glowEye(88, 30, 1, '#6CF2C2')}${glowEye(112, 30, -1, '#6CF2C2')}
  <path d="M100 2l-7 14h6l-4 12 14-16h-7l5-10z" fill="#FFE45C" stroke-width="2"/>
  <rect x="88" y="134" width="24" height="34" fill="#FFD23F"/><path d="M100 138l-7 14h6l-3 12 10-16h-6l4-10z" fill="#E8402C" stroke-width="1.5"/>`),
 horong: L(`
  <path d="M100 2v22" fill="none" stroke-width="5"/>
  <path d="M70 26h60v8H70z" fill="#E7B23A"/>
  <path d="M62 34q-22 40 0 112h76q22-72 0-112z" fill="#E8402C"/>
  <path d="M62 34h76q9 20 9 42H53q0-22 9-42z" fill="#2F5FB5"/>
  <path d="M52 76h96" fill="none" stroke="#E7B23A" stroke-width="6"/>
  <path d="M80 34q-10 54 0 112M120 34q10 54 0 112M100 34v112" fill="none" stroke="#1a1433" stroke-width="2"/>
  ${flame(100, 116, 1.15, '#4B6BFF', '#BFE4FF')}
  <path d="M60 146h80l-6 10H66z" fill="#E7B23A"/>
  <path d="M74 156q-4 18-14 28M100 156v36M126 156q4 18 14 28M86 156q-2 14-6 24M114 156q2 14 6 24" fill="none" stroke="#E7B23A" stroke-width="4"/>
  ${glowEye(80, 58, 1, '#BFE4FF')}${glowEye(120, 58, -1, '#BFE4FF')}
  ${flame(22, 62, .95, '#4B6BFF', '#BFE4FF')}${flame(178, 62, .95, '#4B6BFF', '#BFE4FF')}${flame(30, 136, .7, '#4B6BFF', '#BFE4FF')}${flame(170, 136, .7, '#4B6BFF', '#BFE4FF')}${flame(14, 104, .55, '#4B6BFF', '#BFE4FF')}${flame(186, 104, .55, '#4B6BFF', '#BFE4FF')}`),
 manhol: L(`
  <ellipse cx="100" cy="166" rx="94" ry="28" fill="#17121f"/>
  ${[[20, 150, -30, 60, 16], [180, 150, 214, 60, 196], [54, 170, 10, 96, 34], [146, 170, 190, 96, 166]].map(([x, y, cx, cy, ex]) => `<path d="M${x} ${y}Q${cx} ${cy} ${ex} ${40}" fill="none" stroke="#3f8f6a" stroke-width="13"/><path d="M${x} ${y}Q${cx} ${cy} ${ex} ${40}" fill="none" stroke="#6CE0A8" stroke-width="5"/><circle cx="${ex}" cy="40" r="9" fill="#6CE0A8"/><circle cx="${ex}" cy="40" r="3.5" fill="#1a1433" stroke="none"/>`)}
  <path d="M14 134a86 30 0 0 0 172 0v-22H14z" fill="#3a3c46"/>
  <ellipse cx="100" cy="106" rx="86" ry="58" fill="#6e7380"/>
  <ellipse cx="100" cy="106" rx="72" ry="46" fill="#4a4d58"/>
  ${range(12, (i) => { const a = i * .5236; return `<path d="M${100 + Math.cos(a) * 44} ${106 + Math.sin(a) * 28}L${100 + Math.cos(a) * 72} ${106 + Math.sin(a) * 46}" stroke="#8a8f98" stroke-width="4"/>`; })}
  <ellipse cx="100" cy="106" rx="42" ry="28" fill="#0d0a14"/>
  <path d="M60 106q40-34 80 0-40 34-80 0z" fill="#FFD23F"/><ellipse cx="100" cy="106" rx="9" ry="20" fill="#1a1433"/>
  <path d="M42 44q58-40 116 0l-10 20-14-14-12 8-12-16-10 16-14-16-12 12-12-8-12 14z" fill="#8a8f98"/>
  <path d="M62 30l-6-16 14 8 8-14 8 14 12-14 8 14 12-14 8 14 14-8-6 16z" fill="#E7B23A"/>`),
 bungbbang: L(`
  <path d="M60 134l-22 8-6 44 20 4 8-30 14-4zM122 134l22 8 6 44-20 4-8-30-14-4z" fill="#F2C9A0"/>
  <path d="M22 186h34v12H18zM130 186h34l4 12h-38z" fill="#fff"/><path d="M18 192h38M130 192h38" stroke="#E8402C" stroke-width="3" fill="none"/>
  <path d="M46 96L12 62l-10 12 26 40 26 6zM140 96l34-34 10 12-26 40-26 6z" fill="#F2C9A0"/>
  <path d="M12 62Q0 52 4 40l14 2 4 12zM174 62q12-10 8-22l-14 2-4 12z" fill="#F2C9A0"/>
  <path d="M152 86l36-32q2 36-4 62z" fill="#D9903A" transform="translate(0 2)"/>
  <path d="M14 96q22-62 86-58 44 2 56 54-10 48-58 52-62 2-84-48z" fill="#E7A84B"/>
  <path d="M84 44q12 42 0 98M104 42q10 46 0 100M124 48q8 42 0 88" fill="none" stroke="#B87426"/>
  <path d="M64 124q10 12 30 8 2 14-12 18-14-6-18-26z" fill="#5a1f2a"/><path d="M78 146q-2 12 4 18M90 142q2 12 0 22" fill="none" stroke="#5a1f2a" stroke-width="5"/>
  <path d="M26 78h44q0 16-20 16-10 0-14-8h-8z" fill="#1a1433"/><path d="M70 78h26q0 14-14 14-12 0-12-14z" fill="#1a1433"/><path d="M34 84h14" stroke="#fff" fill="none"/>
  <path d="M20 112q18 10 36 0" fill="none" stroke-width="3"/>
  <path d="M34 126q24 14 56 2l-2 8q-26 12-52-2z" fill="#FFD23F"/>
  <path d="M84 134l6 12 8-12" fill="none"/>`),
 bongdari: L(`
  <path d="M60 58q-26-46-4-54 16 16 16 50zM140 58q26-46 4-54-16 16-16 50z" fill="#E8E0B8"/>
  <path d="M28 54q72 22 144 0 34 56 10 110-14 32-82 32t-82-32q-24-54 10-110z" fill="#F4ECC4"/>
  <path d="M58 60q-30 50-14 120M144 60q26 52 12 116M100 70v118" fill="none" stroke="#c8bd8c" stroke-width="2.5"/>
  <rect x="48" y="96" width="104" height="58" fill="#fff"/><path d="M48 96h104v14H48z" fill="#E8402C"/>
  <text x="100" y="134" font-size="26" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">100L</text>
  <text x="100" y="149" font-size="10.5" text-anchor="middle" fill="#1a1433" stroke="none">일반 쓰레기 전용</text>
  <path d="M80 52q-4-26 6-40l8 4-2 38zM110 54l14-40 8 3-10 38z" fill="#3FA34D"/><path d="M78 56l18 2-1 12-16-3zM110 56l18 2-3 12-16-4z" fill="#F4F2E6"/>
  <path d="M136 58l10-30 16 8-8 26z" fill="#E8402C"/><path d="M146 28l-4-10 8 2z" fill="#3FA34D"/>
  ${[[60, 76], [130, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#fff"/><circle cx="${x + 2}" cy="${y + 2}" r="5" fill="#1a1433"/>`).join('')}
  <path d="M84 84q12 6 24 0" fill="none"/><path d="M168 150q14 4 22-2M30 150q-14 4-22-2M170 170q10 10 22 8" fill="none" stroke="#c8bd8c"/>`),
 daeya: L(`
  <path d="M100 4q-40 0-52 28-22 8-14 30 66 18 132 0 8-22-14-30-12-28-52-28z" fill="#6c4a8a"/>
  ${[[52, 34], [72, 20], [94, 14], [116, 16], [138, 24], [150, 40], [60, 52], [84, 40], [108, 38], [130, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="#8a60ad"/>`).join('')}
  <path d="M78 58q-4-8 0-16h44q4 8 0 16z" fill="#F2C9A0"/>
  <path d="M20 70h160q6 0 4 10-2 10-10 10H26q-8 0-10-10-2-10 4-10z" fill="#C22C24"/>
  <path d="M24 90q10 92 40 96h72q30-4 40-96z" fill="#E8402C"/>
  <path d="M42 96q14 10 28-2 14 12 30 0 16 12 30 0 14 12 28 2l-8 14H50z" fill="#E7EFC0"/>
  <path d="M26 92L2 58l12-10 22 26z" fill="#FFB43C"/><path d="M174 92l24-34-12-10-22 26z" fill="#FFB43C"/>
  <path d="M16 48L4 28l6-4 8 14 0-18 8 0 0 18 8-14 6 4-8 18zM184 48l12-20-6-4-8 14 0-18-8 0 0 18-8-14-6 4 8 18z" fill="#FFB43C"/>
  ${[[150, 134], [126, 160], [66, 158]].map(([x, y]) => `<path d="M${x - 8} ${y}a8 8 0 1 0 16 0q-6-6-8-14-2 8-8 14z" fill="#3FA34D" stroke-width="0"/>`).join('')}
  <circle cx="74" cy="128" r="11" fill="#fff"/><circle cx="126" cy="128" r="11" fill="#fff"/><circle cx="76" cy="130" r="5" fill="#1a1433"/><circle cx="124" cy="130" r="5" fill="#1a1433"/>
  <path d="M60 110l26 8M140 110l-26 8" fill="none" stroke-width="5"/>
  <path d="M80 150h40q-2 16-20 16t-20-16z" fill="#fff"/><path d="M80 158h40" fill="none" stroke-width="2"/>`),
 ppeong: L(`
  <path d="M28 150q2 46 72 46t72-46z" fill="#F4F6FA"/>
  <path d="M44 28h112v50H44z" fill="#F4F6FA"/><path d="M36 22h128v12H36z" fill="#d9dfe6"/>
  <rect x="134" y="44" width="14" height="8" rx="2" fill="#AEB7C2"/>
  <path d="M16 96q0-20 84-20t84 20q0 34-84 60-84-26-84-60z" fill="#fff"/>
  <ellipse cx="100" cy="96" rx="62" ry="15" fill="#2F7DE1"/><path d="M50 96q12-8 24 0t26 0 26 0 24 0" fill="none" stroke="#BFE4FF" stroke-width="2"/>
  <path d="M100 96V40" stroke="#C9924F" stroke-width="10"/><path d="M78 96q0-28 22-30 22 2 22 30z" fill="#D52C2C" transform="translate(0 -46)"/>
  <path d="M64 14l-6-14 14 8 8-8 8 8 12-8 12 8 8-8 8 8 14-8-6 14z" fill="#FFD23F" transform="translate(0 8)" />
  ${[[70, 130], [130, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff"/><circle cx="${x}" cy="${y}" r="5" fill="#1a1433"/>`).join('')}
  <path d="M84 146q16 10 32 0" fill="none"/>
  <path d="M60 170q40 12 80 0" fill="none" stroke="#AEB7C2"/>
  <path d="M28 150L2 134l-2 12 22 16zM172 150l26-16 2 12-22 16z" fill="#AEB7C2"/>`),
 tteokppo: L(`
  <path d="M38 34q62-22 124 0l-6 40H44z" fill="#fff"/><path d="M44 74h112l4 10H40z" fill="#E8402C"/>
  ${range(6, (i) => `<rect x="${60 + (i % 2) * 44}" y="${94 + Math.floor(i / 2) * 26}" width="38" height="22" rx="10" fill="#FFF3D9"/>`)}
  <path d="M46 84q-26 32-18 68l26 6 8-40zM154 84q26 32 18 68l-26 6-8-40z" fill="#FFF3D9"/>
  <path d="M52 84h96l6 92H46z" fill="#d9301f" fill-opacity=".92"/>
  ${range(6, (i) => `<rect x="${60 + (i % 2) * 44}" y="${94 + Math.floor(i / 2) * 26}" width="36" height="22" rx="10" fill="#FFF3D9"/>`)}
  <path d="M28 152l-8 16 14 8 14-14zM172 152l8 16-14 8-14-14z" fill="#FFF3D9"/>
  <path d="M46 176h108l14 20H32z" fill="#2e8f6f"/><path d="M38 186h124" fill="none" stroke="#7fd8b8" stroke-width="2"/>
  <circle cx="78" cy="52" r="9" fill="#fff"/><circle cx="122" cy="52" r="9" fill="#fff"/><circle cx="80" cy="54" r="4" fill="#1a1433"/><circle cx="120" cy="54" r="4" fill="#1a1433"/>
  <path d="M66 40l20 6M134 40l-20 6" fill="none" stroke-width="5"/>
  <path d="M86 64h28q-2 8-14 8t-14-8z" fill="#fff"/>
  <path d="M176 44l6 20M188 72l-10-4 2 10" fill="none"/><path d="M14 56q-4 8 0 14 6-6 0-14zM186 30q-4 8 0 14 6-6 0-14z" fill="#7fc8e8"/>`),
 meokarak: L(`
  <path d="M46 196q-2-20 20-26h68q22 6 20 26z" fill="#E7E2D5"/>
  <circle cx="100" cy="98" r="76" fill="#FFD9B8"/>
  <path d="M46 62q20-34 52-36-30 14-36 44z" fill="#fff" fill-opacity=".75" stroke="none"/>
  <path d="M100 22Q96 2 112 6t8 14-14 2" fill="none" stroke-width="3"/>
  ${[[64, 106], [136, 106]].map(([x, y]) => `<path d="M${x - 17} ${y}q17-16 34 0" fill="none" stroke-width="5"/>`).join('')}
  <circle cx="64" cy="112" r="7" fill="#1a1433"/><circle cx="136" cy="112" r="7" fill="#1a1433"/>
  <path d="M60 128q6 22 12 26M140 128q-6 22-12 26" fill="none" stroke="#7fc8e8" stroke-width="7"/>
  <path d="M84 134q16 12 32 0" fill="none"/>
  <path d="M18 92l-14-4M182 92l14-4M26 58L12 46M174 58l14-12" fill="none" stroke="#FFD23F" stroke-width="5"/>
  <path d="M86 176q14 8 28 0v20H86z" fill="#2F7DE1"/>`),
 kettle: L(`
  ${puff(30, 30, 1.25)}${puff(168, 22, 1.05)}${puff(186, 60, .8)}
  <path d="M146 112l36-40 14 8-22 52z" fill="#9b6a2e"/><path d="M182 72l14 8-4 6-14-8z" fill="#E7B23A"/>
  <path d="M44 72q-34 6-30 46 2 26 30 30" fill="none" stroke-width="13"/><path d="M44 72q-34 6-30 46 2 26 30 30" fill="none" stroke="#E7B23A" stroke-width="6"/>
  <path d="M28 126q-2-76 72-78t72 78q0 60-72 60t-72-60z" fill="#B97A35"/>
  <ellipse cx="100" cy="54" rx="48" ry="13" fill="#7c4f22"/><path d="M84 42q16-34 32 0z" fill="#E7B23A"/><circle cx="100" cy="24" r="7" fill="#E8402C"/>
  ${[[42, 90], [32, 126], [42, 164], [158, 90], [168, 126], [158, 164], [70, 62], [130, 62], [70, 182], [130, 182]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#E7B23A" stroke-width="2"/>`).join('')}
  <path d="M30 102q70 12 140 0M30 150q70 12 140 0" fill="none" stroke="#7c4f22" stroke-width="4"/>
  ${glowEye(72, 104, 1, '#FF8A1A')}${glowEye(128, 104, -1, '#FF8A1A')}
  <circle cx="100" cy="146" r="23" fill="#F4ECD8"/><path d="M100 146l13-14" stroke="#E8402C" stroke-width="4"/><path d="M84 146h6M110 146h6M100 130v6M100 156v6" fill="none" stroke-width="2.5"/><circle cx="100" cy="146" r="3.5" fill="#1a1433"/>`),
 usan: L(`
  <path d="M100 196V100" stroke-width="7"/><path d="M100 196q0 8 12 6 10-2 8-12" fill="none" stroke-width="7"/>
  <path d="M100 18q90 4 96 88l-20-14-10 40-22-30-14 56-30-58-30 58-14-56-22 30-10-40-20 14Q10 22 100 18z" fill="#1F2E5C"/>
  <path d="M100 18Q60 50 62 110M100 18q40 32 38 92M100 18Q24 40 22 90M100 18q76 22 78 72" fill="none" stroke="#5B7AC7" stroke-width="3"/>
  <path d="M100 18V2" stroke-width="7"/>
  ${[[24, 96], [54, 132], [100, 150], [146, 132], [176, 96]].map(([x, y]) => `<path d="M${x} ${y}l-4 16 8-2 2 10" fill="none" stroke="#c7cdd6" stroke-width="3"/>`).join('')}
  <path d="M60 66q40-26 80 0-8 34-40 34T60 66z" fill="#0d0a14"/>
  ${glowEye(80, 72, 1, '#6CF2C2')}${glowEye(120, 72, -1, '#6CF2C2')}
  <path d="M86 90l6 8 8-8 8 8 6-8" fill="none" stroke="#6CF2C2" stroke-width="3"/>
  ${[[18, 146], [182, 146], [40, 176], [160, 176]].map(([x, y]) => `<path d="M${x} ${y - 11}c7 9 8 17 0 18-8-1-7-9 0-18z" fill="#2F7DE1"/>`).join('')}`),
 ssaribi: L(`
  <path d="M52 52q48-20 96 0l28 8-152 0z" fill="#1d1a24"/><path d="M72 52q0-28 28-28t28 28z" fill="#1d1a24"/><path d="M72 44q28 8 56 0" fill="none" stroke="#E7B23A" stroke-width="4"/>
  <path d="M42 196q0-96 34-124h48q34 28 34 124z" fill="#EDE6D2"/>
  <path d="M100 74l-16 122M100 74l18 122" fill="none" stroke="#c9bfa4" stroke-width="2"/>
  <path d="M70 72h60v8H70z" fill="#E8402C"/>
  <path d="M74 58h52v24q-26 14-52 0z" fill="#E9C9A0"/>
  ${glowEye(86, 68, 1, '#1a1433')}${glowEye(114, 68, -1, '#1a1433')}
  <path d="M78 110h44l6 18H72z" fill="#3B2F8C"/>
  <path d="M26 192L170 34" stroke="#8B5A2B" stroke-width="8"/>
  <path d="M166 38l16-18M174 46l18-14" fill="none" stroke="#E7B23A" stroke-width="3"/>
  <path d="M170 30l24-22q8 18 2 28-14 2-26-6z" fill="#fff" fill-opacity=".0"/>
  <path d="M20 200q-10-24 8-44l30 24q-14 20-38 20z" fill="#C7A64B"/>
  <path d="M30 170l-6 22M42 176l-12 20" fill="none" stroke="#8d7330" stroke-width="2"/>
  <path d="M40 150l22 18-8 8-22-18z" fill="#E8402C"/>
  <path d="M12 120q40-10 56 6M186 90q-10 40-40 44" fill="none" stroke="#fff" stroke-width="3"/>
  <path d="M60 136q-16 6-26 24l10 6q12-12 26-14zM140 136q18-4 22-36l-12-4q-4 18-20 24z" fill="#EDE6D2"/>`),
 ttaengcho: L(`
  ${flame(100, 26, 1.1)}${flame(60, 44, .85)}${flame(140, 44, .85)}
  <path d="M76 44q24-14 48 0l6 16H70z" fill="#1F7A34"/><path d="M70 58l-10-16 20 8 8-14 12 12 12-12 8 14 20-8-10 16z" fill="#2FA34D"/>
  <path d="M60 62q40-14 80 0 16 14 12 34-10 56-50 100-4 4-8 0-44-48-48-100-2-20 14-34z" fill="#D31C12"/>
  <path d="M70 76q-4 42 14 80" fill="none" stroke="#ff8a78" stroke-width="6"/>
  <path d="M40 92L8 72l6 26 22 10zM160 92l32-20-6 26-22 10z" fill="#1F7A34"/>
  ${glowEye(80, 92, 1)}${glowEye(120, 92, -1)}
  <path d="M76 118q24 16 48 0l-5 18-7-7-6 12-6-12-7 12-6-12-7 7z" fill="#FFE45C"/>
  ${[[22, 136], [178, 132]].map(([x, y]) => flame(x, y, .75)).join('')}
  <path d="M40 150q20 2 26 16M160 150q-20 2-26 16" fill="none" stroke="#FFD23F" stroke-width="4"/>`),
 orak: L(`
  <path d="M44 150L14 176l10 14 40-26zM156 150l30 26-10 14-40-26z" fill="#3b2f8c"/>
  <path d="M42 18h116l10 150H32z" fill="#3B2F8C"/>
  <path d="M38 6h124v20H38z" fill="#E8402C"/><text x="100" y="22" font-size="14" font-weight="900" text-anchor="middle" fill="#FFE45C" stroke="none">FINAL BOSS</text>
  <rect x="52" y="34" width="96" height="68" rx="6" fill="#0d1a2c"/>
  <g fill="#6CF2C2" stroke="none">${[[72, 46, 56, 8], [64, 54, 72, 26], [72, 80, 8, 8], [88, 80, 8, 8], [104, 80, 8, 8], [120, 80, 8, 8]].map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('')}</g>
  <g fill="#0d1a2c" stroke="none"><rect x="76" y="60" width="14" height="12"/><rect x="110" y="60" width="14" height="12"/><rect x="96" y="72" width="8" height="8"/></g>
  <g fill="#E8402C" stroke="none"><rect x="80" y="64" width="6" height="6"/><rect x="114" y="64" width="6" height="6"/></g>
  <path d="M30 112h140l10 22H20z" fill="#F2B705"/>
  <circle cx="58" cy="122" r="7" fill="#E8402C"/><path d="M58 122v-14" stroke-width="4"/>
  ${[[100, 124, '#2F7DE1'], [120, 124, '#E8402C'], [140, 124, '#3FA34D']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${c}"/>`).join('')}
  <rect x="80" y="144" width="40" height="14" fill="#1a1433"/><rect x="90" y="148" width="20" height="4" fill="#FFD23F" stroke="none"/>
  <path d="M18 80l-16-8M18 100H0M182 80l16-8M182 100h18" fill="none" stroke="#FFE45C" stroke-width="4"/>`),
 bangpae: L(`
  <path d="M100 100L4 34l34 74L4 176l96-40 96 40-34-68 34-74z" fill="#FFE45C"/>
  <path d="M34 22h132v142H34z" fill="#fff5d8"/>
  <path d="M34 22h132v24H34z" fill="#E8402C"/><path d="M34 164l18-38 18 38M130 164l18-38 18 38" fill="#2F7DE1"/>
  <path d="M34 22l132 142M166 22L34 164M100 22v142M34 93h132" fill="none" stroke-width="2"/>
  <circle cx="100" cy="93" r="31" fill="#17273e"/>
  <path d="M100 62a31 31 0 0 1 0 62 15.500 15.500 0 0 1 0-31 15.500 15.500 0 0 0 0-31z" fill="#FFE45C"/>
  ${glowEye(86, 90, 1, '#fff')}${glowEye(114, 90, -1, '#1a1433')}
  <path d="M100 164q-24 8-8 18t-4 18M60 164q-10 12 0 22M140 164q10 12 0 22" fill="none" stroke="#F2B705" stroke-width="4"/>
  <path d="M90 6l-6 12h6l-3 10 12-14h-6l5-8zM22 96l-7 13h6l-3 11 12-15h-6l4-9z" fill="#FFE45C" stroke-width="2"/>`),
 bonaeng: L(`
  ${[[26, 70, 40], [58, 42, 30], [94, 26, 28], [130, 42, 28], [170, 66, 38]].map(([x, y, h]) => `<path d="M${x - 14} ${y + 26}L${x} ${y - h}l14 ${h + 26}z" fill="#BCE9F2"/>`).join('')}
  <path d="M12 92h176v18H12z" fill="#EAF7FB"/>
  <path d="M6 58v-8M100 6V0" fill="none"/>
  <rect x="16" y="108" width="168" height="80" rx="4" fill="#1F5FB5"/>
  <path d="M16 188h168l8 10H8z" fill="#c7cdd6"/>
  <rect x="6" y="104" width="16" height="20" fill="#c7cdd6"/><rect x="178" y="104" width="16" height="20" fill="#c7cdd6"/>
  ${glowEye(68, 132, 1, '#BCE9F2')}${glowEye(132, 132, -1, '#BCE9F2')}
  <path d="M60 156h80v18H60z" fill="#0d1a2c"/><path d="M60 156l10 18 10-18 10 18 10-18 10 18 10-18 10 18 10-18" fill="#EAF7FB" stroke-width="2"/>
  <path d="M28 108l8 22 6-14 8 10 4-18M172 108l-8 22-6-14-8 10-4-18" fill="#BCE9F2" stroke-width="2"/>`),
 maetdol: L(`
  <path d="M138 42L188 6" stroke="#59402a" stroke-width="10"/><path d="M178 10l18-10 4 12-14 12z" fill="#c7cdd6"/>
  ${range(14, (i) => { const a = i * .4488; return `<path d="M${100 + Math.cos(a) * 92} ${146 + Math.sin(a) * 34}l${Math.cos(a) * 14} ${Math.sin(a) * 6 + 2}" stroke-width="7"/>`; })}
  <path d="M8 138h184v30q-92 34-184 0z" fill="#5c5b54"/>
  <ellipse cx="100" cy="138" rx="92" ry="26" fill="#7c7b73"/>
  <path d="M26 66q74-28 148 0v60q-74 28-148 0z" fill="#6c6b63"/>
  <ellipse cx="100" cy="66" rx="74" ry="22" fill="#94938a"/><ellipse cx="100" cy="66" rx="20" ry="8" fill="#17121f"/>
  ${flame(100, 54, .6, '#E8402C', '#FFD23F')}
  <path d="M26 118l20 8 16-6 18 10 20-4 20 4 18-10 16 6 20-8" fill="none" stroke="#E8402C" stroke-width="5"/>
  ${glowEye(68, 104, 1, '#E8402C')}${glowEye(132, 104, -1, '#E8402C')}
  <path d="M70 120l10 12 10-10 10 12 10-12 10 10 10-12" fill="#fff"/>
  <path d="M14 140q10 26 40 36M186 140q-10 26-40 36" fill="none" stroke="#E8402C" stroke-width="3"/>`),
 fan: L(`
  <path d="M84 150h32l8 26H76z" fill="#d9dfe6"/><path d="M40 192q0-18 22-18h76q22 0 22 18v6H40z" fill="#2F7DE1"/>
  ${[0, 1, 2, 3].map((i) => `<rect x="${64 + i * 19}" y="182" width="13" height="10" fill="${i === 3 ? '#E8402C' : '#fff'}" stroke-width="2"/>`).join('')}
  <circle cx="100" cy="82" r="76" fill="#CFEDE1"/>
  <path d="M100 82Q70 30 104 16q24 28-4 66zM100 82q54-14 60 18-38 20-60-18zM100 82q-6 56-38 46-8-38 38-46z" fill="#7FB8A4"/>
  ${[[32, 52], [168, 46], [26, 118], [172, 126]].map(([x, y]) => `<path d="M${x} ${y}l8 4" fill="none"/>`).join('')}
  <path d="M100 6a76 76 0 0 1 0 152M100 6a76 76 0 0 0 0 152M24 82h152" fill="none" stroke="#9ec9b9" stroke-width="2"/>
  <circle cx="100" cy="82" r="42" fill="#FFD9B8"/>
  ${dumbEye(84, 74, 8)}${dumbEye(118, 74, 8)}
  <path d="M58 62q-22 8-36 2 14 14 32 12zM142 62q22 8 36 2-14 14-32 12zM62 92q-20 12-40 8 16 12 40 6zM138 92q20 12 40 8-16 12-40 6z" fill="#FFD9B8"/>
  <path d="M86 98q14-6 32 2-6 14-18 12t-14-14z" fill="#fff"/>
  <path d="M6 30q20 8 36 2M194 30q-20 8-36 2M6 150q20-8 36-2M194 150q-20-8-36-2" fill="none" stroke="#7FB8A4" stroke-width="3"/>`),
 kkangtong: L(`
  <path d="M60 134h26v48H60zM114 134h26v48h-26z" fill="#AEB7C2"/>
  <path d="M46 180h46v16H46zM108 180h46v16h-46z" fill="#fff"/>
  <path d="M42 28q58-16 116 0l8 22-8 18 6 26-10 26 4 22q-58 16-116 0l6-24-10-24 8-26-8-20z" fill="#AEB7C2"/>
  <ellipse cx="100" cy="30" rx="58" ry="13" fill="#d7dde5"/>
  <path d="M34 68q66 12 132 0l-6 40q-60 12-120 0z" fill="#E8402C"/>
  <path d="M78 22l40-10 4 10-22 10z" fill="#7C8798"/><circle cx="118" cy="16" r="6" fill="#fff"/>
  <path d="M38 88L6 66v22l24 24zM162 88l32-22v22l-24 24z" fill="#BFE4FF" fill-opacity=".85"/><path d="M6 66l-2-12h10zM194 66l2-12h-10z" fill="#3FA34D"/>
  ${dumbEye(78, 84, 12)}${dumbEye(122, 90, 8)}
  <path d="M76 114l10-4 8 6 10-6 8 6 10-4" fill="none"/>
  <path d="M90 130h20M100 130v-8" fill="none" stroke="#3FA34D" stroke-width="3"/>
  <path d="M86 142l14-10 14 10-8 1 3 10h-18l3-10z" fill="#3FA34D" stroke-width="2"/>`),
 sigung: L(`
  <path d="M34 112q-20 44-14 84h160q6-40-14-84z" fill="#6E1822"/><path d="M26 184h148v14H24z" fill="#E7E2D5"/>
  ${[44, 70, 96, 122, 148].map((x) => `<circle cx="${x}" cy="190" r="3" fill="#1a1433" stroke="none"/>`).join('')}
  <path d="M172 150q30 6 22-22-6-16-20-10" fill="none" stroke="#c78b8f" stroke-width="7"/>
  <circle cx="46" cy="50" r="24" fill="#5e5c50"/><circle cx="46" cy="50" r="12" fill="#c78b8f"/>
  <circle cx="154" cy="50" r="24" fill="#5e5c50"/><circle cx="154" cy="50" r="12" fill="#c78b8f"/>
  <path d="M42 100q0-62 58-62t58 62q2 44-58 44t-58-44z" fill="#6c6a5c"/>
  <path d="M58 142q10-16 22 0 10 12 20 0 10-14 22 0t20 0v16H58z" fill="#3f8f4a"/>
  <path d="M64 42l-10-30 22 14 10-22 14 18 14-18 10 22 22-14-10 30z" fill="#E7B23A"/><path d="M64 42h72" fill="none" stroke="#E8402C" stroke-width="5"/>
  ${glowEye(76, 88, 1, '#FFE45C')}${glowEye(124, 88, -1, '#FFE45C')}
  <ellipse cx="100" cy="106" rx="9" ry="7" fill="#c78b8f"/>
  <path d="M82 118q18 10 36 0" fill="none"/><path d="M90 122l3 14 7-10zM110 122l-3 14-7-10z" fill="#fff" stroke-width="2.500"/>
  <path d="M34 112l-16-20-8 8 14 22z" fill="#6c6a5c"/><path d="M6 106L26 76" stroke="#c7cdd6" stroke-width="6"/><path d="M26 76l12-18" stroke="#E7B23A" stroke-width="6"/>`),
 batji: L(`
  ${[[20, 30], [176, 34], [24, 126], [178, 122]].map(([x, y]) => `<path d="M${x} ${y}c9 11 11 20 0 22-11-2-9-11 0-22z" fill="#2F7DE1"/>`).join('')}
  <rect x="18" y="30" width="164" height="150" rx="8" fill="#3a3f4b"/>
  <rect x="32" y="44" width="136" height="122" fill="#0a0d1a"/>
  <path d="M32 140q24-16 46 0t44 0 46 0v26H32z" fill="#2F7DE1"/><path d="M32 140q24-16 46 0t44 0 46 0" fill="none" stroke="#BFE4FF" stroke-width="3"/>
  ${glowEye(74, 82, 1, '#E8402C')}${glowEye(126, 82, -1, '#E8402C')}
  <path d="M74 112l8 10 8-10 10 12 10-12 8 10 8-10" fill="none" stroke="#fff" stroke-width="3"/>
  ${[60, 100, 140].map((x) => `<rect x="${x - 6}" y="40" width="12" height="130" fill="#8a8f98"/>`).join('')}
  <path d="M38 96h26l4 12-6 10-6-6-4 8-6-7-5 8-5-6-2-11zM162 96h-26l-4 12 6 10 6-6 4 8 6-7 5 8 5-6 2-11z" fill="#3F8F7A"/>
  <path d="M8 188q18-12 36 0t36 0 36 0 36 0 36 0" fill="none" stroke="#7fc8e8" stroke-width="5"/>`),
 kongsiru: L(`
  <path d="M64 86q-20-56 2-74M84 80q-8-56 8-74M104 80q0-50 12-72M124 86q12-48 30-62M50 94Q18 64 16 40M142 92q30-20 40-46" fill="none" stroke-width="11"/><path d="M64 86q-20-56 2-74M84 80q-8-56 8-74M104 80q0-50 12-72M124 86q12-48 30-62M50 94Q18 64 16 40M142 92q30-20 40-46" fill="none" stroke="#F4EFC8" stroke-width="6"/>
  ${[[66, 12], [92, 6], [116, 8], [154, 24], [16, 40], [182, 46]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="12" ry="8" fill="#F2D64B" transform="rotate(${i * 25 - 40} ${x} ${y})"/>`).join('')}
  <path d="M28 104h144l-14 80H42z" fill="#3a2a2a"/><path d="M18 94h164l-8 16H26z" fill="#2a1d1d"/>
  <ellipse cx="100" cy="96" rx="78" ry="12" fill="#E8D9A0"/>
  ${[[60, 92], [84, 96], [112, 94], [138, 96]].map(([x, y]) => `<path d="M${x - 8} ${y}q8-6 16 0" fill="none" stroke="#3FA34D"/>`).join('')}
  <path d="M60 132q14-10 28 0M112 132q14-10 28 0" fill="none" stroke-width="5"/>
  <path d="M62 138q12 6 24 0M114 138q12 6 24 0" fill="none" stroke-width="3"/>
  <circle cx="74" cy="134" r="4" fill="#E8402C" stroke="none"/><circle cx="126" cy="134" r="4" fill="#E8402C" stroke="none"/>
  <path d="M84 158q16-8 32 0" fill="none"/>
  <path d="M90 164q-4 16 4 22 8-4 4-20" fill="#BFE4FF"/>
  <path d="M28 104L6 152l14 10 14-22" fill="#3a2a2a"/><path d="M172 104l22 48-14 10-14-22" fill="#3a2a2a"/>
  <path d="M34 186h132l6 10H28z" fill="#8F4A2B"/>`),
 bingsu: L(`
  <path d="M42 186l-14-32h144l-14 32z" fill="#BCE9F2"/>
  <path d="M60 196h80l-10-10H70z" fill="#BCE9F2"/>
  <g transform="rotate(7 100 150)">
   <path d="M40 156q-6-22 14-26 74-8 96 0 18 6 12 26z" fill="#F7FBFF"/>
   <path d="M54 132q-4-20 16-22 42-6 62 0 16 2 12 22z" fill="#FFD8E4"/>
   <path d="M68 112q-2-20 12-20h32q16 0 12 20z" fill="#D7F2B4"/>
   <path d="M80 92q-2-22 10-22h16q12 0 10 22z" fill="#F7E08C"/>
   <path d="M86 70q-2-18 14-18t14 18z" fill="#F7FBFF"/>
   <path d="M90 52q8-14 20 0z" fill="#7a2f3a"/>
   ${[[72, 148, '#7a2f3a'], [96, 150, '#E8402C'], [124, 146, '#7ED0B4'], [78, 122, '#E8402C'], [112, 124, '#fff'], [92, 104, '#7a2f3a']].map(([x, y, c]) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="3" fill="${c}" stroke-width="2"/>`).join('')}
  </g>
  <circle cx="122" cy="34" r="10" fill="#D31C12"/><path d="M122 24q2-14 12-16" fill="none" stroke="#3FA34D" stroke-width="3"/>
  ${dumbEye(78, 168, 8)}${dumbEye(116, 168, 8)}
  <path d="M86 180q12 7 24 0" fill="none" stroke-width="3"/>
  <path d="M36 22q-8 4-6 14M170 80q10-4 12 8M20 110q8 2 8 12" fill="none" stroke-width="3"/>
  <path d="M28 46l-8 22M178 106l10 26" fill="none" stroke="#7fc8e8" stroke-width="4"/>`),
 jangdok: L(`
  ${puff(100, 44, 2.1, '#9A4FB8')}${puff(52, 60, 1.25, '#7c3a99')}${puff(150, 60, 1.25, '#7c3a99')}
  <circle cx="84" cy="36" r="8" fill="#fff"/><circle cx="116" cy="36" r="8" fill="#fff"/><path d="M90 52h20M94 48v8M100 48v8M106 48v8" fill="none" stroke="#fff" stroke-width="3"/>
  <path d="M100 2l-2 0" fill="none"/>
  <path d="M64 18l6-14 54 6 6 12z" fill="#59402a" transform="rotate(-18 96 12) translate(66 -12)"/>
  <path d="M60 86h80q-4 10 12 22 22 22 16 50-8 36-68 40-60-4-68-40-6-28 16-50 16-12 12-22z" fill="#7a4a2a"/>
  <ellipse cx="100" cy="86" rx="40" ry="9" fill="#17121f"/>
  <path d="M34 124q66-20 132 0" fill="none" stroke="#a97a50" stroke-width="3"/>
  ${dumbEye(76, 142, 12)}${dumbEye(124, 142, 12)}
  <path d="M74 166q26 18 52 0-8 20-26 20t-26-20z" fill="#fff"/>
  <path d="M46 150q-8 6-6 16M154 150q8 6 6 16" fill="none" stroke="#7fc8e8" stroke-width="5"/>`),
 sundae: L(`
  <ellipse cx="100" cy="178" rx="96" ry="18" fill="#F4F2E6"/>
  <path d="M44 170c-14-40 6-68 22-70 2-26 66-26 68 0 18 2 36 30 22 70-20 14-92 14-112 0z" fill="#3b2b33"/>
  <path d="M66 100q-8 34 0 72M134 100q8 34 0 72M100 92v84" fill="none" stroke="#1a1433" stroke-width="2"/>
  ${[[56, 130], [80, 110], [120, 112], [144, 134], [76, 156], [122, 158], [100, 146]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#d9c6a8" stroke="none"/>`).join('')}
  <path d="M68 86l-6-18 18 10 20-16 20 16 18-10-6 18z" fill="#E7B23A"/>
  ${dumbEye(80, 122, 10)}${dumbEye(120, 122, 10)}
  <path d="M84 142q16 8 32 0" fill="none"/>
  <path d="M6 170q0-34 26-30 22 4 16 34-22 12-42-4z" fill="#6E2A2A"/>${dumbEye(20, 158, 5)}${dumbEye(34, 158, 5)}
  <path d="M152 174q-6-32 18-34 28 0 26 30-20 14-44 4z" fill="#E7A5A0"/>${dumbEye(166, 158, 5)}${dumbEye(182, 158, 5)}
  <path d="M86 18h28v12q-2 8 6 10-20 16-40 0 8-2 6-10z" fill="#fff"/><text x="100" y="27" font-size="11" font-weight="900" text-anchor="middle" fill="#1a1433" stroke="none">소금</text>
  <path d="M96 42q-2 8 4 14 6-6 4-14" fill="#fff" stroke-width="2"/>`),
 eomuk: L(`
  <path d="M6 58q94-56 188 0l-12 18H18z" fill="#E8402C"/><path d="M36 42l-12 34M72 28l-8 48M128 28l8 48M164 42l12 34M100 24v52" fill="none" stroke="#fff" stroke-width="5"/>
  <path d="M26 76v116M174 76v116" stroke="#59402a" stroke-width="7"/>
  <path d="M18 76h164l-6 14H24z" fill="#E7E2D5"/>
  ${[42, 72, 102, 132, 162].map((x) => `<circle cx="${x}" cy="94" r="7" fill="#FFD23F"/>`).join('')}
  <path d="M100 14v176" stroke="#c9924f" stroke-width="7"/>
  <path d="M60 100q40-14 80 0-12 16 0 28-40 14-80 0 12-14 0-28z" fill="#E7C98A"/>
  <path d="M56 134q44-14 88 0-12 14 0 26-44 14-88 0 12-12 0-26z" fill="#E7C98A"/>
  ${dumbEye(82, 112, 8)}${dumbEye(118, 112, 8)}<path d="M90 124q10 6 20 0" fill="none"/>
  <path d="M20 168h160v26H20z" fill="#2F7DE1"/><path d="M20 168q20-10 40 0t40 0 40 0 40 0" fill="none" stroke="#BFE4FF" stroke-width="3"/>
  <path d="M40 150q-6-10 0-18M160 150q6-10 0-18" fill="none" stroke="#fff" stroke-width="3"/>`),
 hotteok: L(`
  <path d="M64 142l-18 54h108l-18-54z" fill="#FFE45C" fill-opacity=".6" stroke-width="0"/>
  ${[64, 100, 136].map((x, i) => `<circle cx="${x}" cy="${172 + (i % 2) * 14}" r="9" fill="#E7A020"/>`).join('')}
  <path d="M60 58q0-44 40-44t40 44z" fill="#BFE4FF" fill-opacity=".8"/>
  <path d="M6 96q0-34 94-40t94 40-94 52T6 96z" fill="#C98438"/>
  <path d="M6 96q94 44 188 0" fill="none" stroke="#8d5420" stroke-width="3"/>
  ${[[34, 106, '#E8402C'], [68, 122, '#FFE45C'], [100, 128, '#3FA34D'], [132, 122, '#FFE45C'], [166, 106, '#E8402C']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6.500" fill="${c}"/>`).join('')}
  ${dumbEye(84, 44, 7)}${dumbEye(116, 44, 7)}<path d="M92 54q8 5 16 0" fill="none" stroke-width="3"/>
  ${[[52, 76], [84, 66], [118, 68], [150, 78]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#3a2010" stroke-width="1.5"/>`).join('')}
  <path d="M20 64L6 22l8-4 14 40zM180 64l14-42-8-4-14 40z" fill="#c7cdd6"/><path d="M0 8h22v14H0zM178 8h22v14h-22z" fill="#AEB7C2"/>`),
 ppeondegi: L(`
  <path d="M100 74Q40 10 8 26q-8 50 34 70-22 18-20 46 42 10 66-30zM100 74q60-64 92-48 8 50-34 70 22 18 20 46-42 10-66-30z" fill="#8c5c30"/>
  <path d="M32 44l26 26M170 44l-26 26M30 76l22 2M170 76l-22 2" fill="none" stroke="#3b2413" stroke-width="3"/>
  ${[[34, 56], [166, 56], [46, 118], [154, 118]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#FFD23F"/><circle cx="${x}" cy="${y}" r="4" fill="#1a1433"/>`).join('')}
  <path d="M74 86h52l6 76H68z" fill="#23263a"/>
  <path d="M86 86l14 20 14-20z" fill="#fff"/><path d="M96 92h8l2 6-3 22-3 6-3-6-3-22z" fill="#E8402C" stroke-width="2.500"/>
  <path d="M68 162h24l-2 34H70zM108 162h24l-2 34h-20z" fill="#23263a"/><path d="M64 192h28v8H62zM106 192h28l2 8h-30z" fill="#1a1433"/>
  <path d="M74 100L52 134l10 8 20-26zM126 100l22 34-10 8-20-26z" fill="#23263a"/>
  <rect x="136" y="134" width="22" height="16" rx="2" fill="#59402a"/><path d="M142 134v-5h10v5" fill="none" stroke-width="3"/>
  <path d="M72 62q0-30 28-30t28 30q0 26-28 26T72 62z" fill="#a8743c"/>
  <path d="M74 54h52M72 66h56M76 78h48" fill="none" stroke="#3b2413" stroke-width="2"/>
  ${dumbEye(88, 60, 6)}${dumbEye(112, 60, 6)}
  <path d="M90 78h20" fill="none"/>
  <path d="M84 34Q72 14 62 12M116 34q12-20 22-22" fill="none"/>`),
};
})();
