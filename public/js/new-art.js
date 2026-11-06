// 페어리와 로봇 요괴 그림. 200 크기로 그렸습니다.
const NEW_ART = (() => {
const L = (s) => `<g stroke="#1a1433" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
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
};
Object.assign(MEGA_ART, MEGA);
return ART;
})();
