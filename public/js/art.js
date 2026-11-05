// 요괴와 아바타 그림. 전부 코드로 그린 오리지널 SVG입니다.
const K = '#1a1433';
const wrap = (inner) => `<g stroke="${K}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${inner}</g>`;
const eye = (x, y, r = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + 1}" cy="${y + 1}" r="${r * .5}" fill="${K}" stroke="none"/>`;
const eyes = (x1, x2, y, r) => eye(x1, y, r) + eye(x2, y, r);
const angry = (x1, x2, y) => `<path d="M${x1 - 8} ${y - 10}l13 5M${x2 + 8} ${y - 10}l-13 5" fill="none"/>`;
const smile = (x, y, w = 8) => `<path d="M${x - w} ${y}q${w} ${w} ${w * 2} 0" fill="none"/>`;
const frown = (x, y, w = 7) => `<path d="M${x - w} ${y + 4}q${w} ${-w} ${w * 2} 0" fill="none"/>`;
const grin = (x, y, w = 10) => `<path d="M${x - w} ${y}h${w * 2}q-2 9-${w} 9t-${w}-9z" fill="#fff"/>`;

const ART = {
  yeontan: wrap(`
    <path d="M60 4c9 9 15 13 13 21 5-2 7-5 7-9 7 8 6 18-1 24H41c-8-5-10-14-4-22 1 4 3 6 6 7-3-8 8-13 17-21z" fill="#F28A1E"/>
    <path d="M60 20c5 5 8 8 5 14H55c-3-6 1-9 5-14z" fill="#FFD23F" stroke-width="2"/>
    <path d="M24 42h72v60q-36 14-72 0z" fill="#3b3640"/>
    <ellipse cx="60" cy="42" rx="36" ry="12" fill="#57505c"/>
    ${[[48, 39], [60, 37], [72, 39], [50, 46], [62, 46], [72, 45]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#F28A1E" stroke-width="1.5"/>`).join('')}
    ${eyes(46, 74, 70, 7)}${angry(46, 74, 70)}${frown(60, 86)}`),
  bungbbang: wrap(`
    <path d="M92 60l22-18q-3 18 0 38z" fill="#D9903A"/>
    <path d="M8 62q18-38 58-34 22 2 30 32-8 28-34 30Q24 94 8 62z" fill="#E7A84B"/>
    <path d="M48 34q6 24 0 52M60 33q6 26 0 54M72 36q5 24 0 48" fill="none" stroke="#B87426"/>
    <path d="M54 26q10-12 20-8-2 8-6 12z" fill="#D9903A"/>
    <path d="M56 92q8 10 18 7-1-7-5-10z" fill="#D9903A"/>
    ${eye(28, 54, 8)}${smile(26, 70, 7)}`),
  horong: wrap(`
    <path d="M60 4c12 14 17 22 12 33-3 7-20 7-24 0-5-11 2-19 12-33z" fill="#F2622E"/>
    <path d="M60 18c6 7 8 11 5 17-2 3-8 3-10 0-3-6 0-10 5-17z" fill="#FFD23F" stroke-width="2"/>
    <rect x="54" y="40" width="12" height="9" fill="#ded7c8"/>
    <path d="M30 62q0-16 30-16t30 16q4 30-8 36H38Q26 92 30 62z" fill="#3E7D6C"/>
    <path d="M28 100h64l6 10H22z" fill="#6c4a2e"/>
    ${eyes(47, 73, 70, 7)}${smile(60, 84, 6)}`),
  kettle: wrap(`
    <path d="M36 28q24-30 48 0" fill="none" stroke-width="6"/>
    <path d="M90 58l22-20 3 10-14 26z" fill="#c4ccd6"/>
    <path d="M18 72q0-40 42-42t42 42q0 30-42 30T18 72z" fill="#D7DDE5"/>
    <ellipse cx="60" cy="33" rx="26" ry="8" fill="#AEB7C2"/>
    <circle cx="60" cy="24" r="6" fill="#E8402C"/>
    <path d="M30 62q8-12 16-14" fill="none" stroke="#fff" stroke-width="5"/>
    ${eyes(45, 73, 68, 8)}${frown(59, 84, 7)}
    <path d="M112 30q6-6 0-12M100 22q6-6 0-12" fill="none" stroke="#7fc8e8"/>`),
  daeya: wrap(`
    <ellipse cx="60" cy="48" rx="50" ry="14" fill="#C22C24"/>
    <path d="M14 50q6 50 28 50h36q22 0 28-50" fill="#E8402C"/>
    <ellipse cx="60" cy="48" rx="40" ry="9" fill="#2F7DE1"/>
    <path d="M36 48q12 5 24 0t24 0" fill="none" stroke="#bfe4ff" stroke-width="2"/>
    ${eyes(44, 76, 72, 8)}${grin(60, 84, 9)}`),
  usan: wrap(`
    <path d="M60 104V50" fill="none" stroke-width="5"/>
    <path d="M60 108q0 6 8 6 7 0 7-7" fill="none" stroke-width="5"/>
    <path d="M60 8q50 2 54 50-8-8-18 0-8-9-18 0-9-9-18 0-9-9-18 0-9-9-18 0-9-9-20 0Q10 12 60 8z" fill="#3D6FB5"/>
    <path d="M60 8q-20 18-18 50M60 8q20 18 18 50" fill="none"/>
    <path d="M60 8v-6" stroke-width="5"/>
    ${eyes(42, 78, 36, 7)}${smile(60, 46, 5)}
    <path d="M22 74q-3 6 0 8 4-2 0-8zM98 74q-3 6 0 8 4-2 0-8z" fill="#7fc8e8" stroke-width="2"/>`),
  kongsiru: wrap(`
    ${[30, 44, 58, 72, 86].map((x, i) => `<path d="M${x} 56q${i % 2 ? -8 : 8}-22 ${i % 2 ? 2 : -4}-34" fill="none" stroke="#E9E2B5" stroke-width="5"/><ellipse cx="${x + (i % 2 ? 2 : -4)}" cy="18" rx="8" ry="6" fill="#F2D64B"/>`).join('')}
    <path d="M16 56h88l-10 50q-34 8-68 0z" fill="#8F4A2B"/>
    <ellipse cx="60" cy="56" rx="44" ry="8" fill="#6f3820"/>
    ${[[30, 96], [48, 100], [68, 100], [86, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="${K}" stroke="none"/>`).join('')}
    ${eyes(46, 74, 76, 6)}${smile(60, 86, 5)}`),
  ssaribi: wrap(`
    <path d="M78 6L56 58" stroke="#8B5A2B" stroke-width="7" fill="none"/>
    <path d="M42 50l32 14q-2 24-30 50-4-14-16-12 2-10-12-14 20-12 26-38z" fill="#C7A64B"/>
    <path d="M52 62q-8 22-24 36M62 68q-8 22-18 36" fill="none" stroke="#8d7330" stroke-width="2"/>
    <path d="M44 50l32 14 4-8-30-13z" fill="#E8402C"/>
    ${eyes(40, 62, 74, 6)}${angry(40, 62, 74)}${smile(50, 86, 4)}`),
  ttaengcho: wrap(`
    <path d="M60 28Q52 12 66 6l6 6q-10 4-6 16z" fill="#3FA34D"/>
    <path d="M38 34q22-12 44 0 6 6 2 16-4 34-26 62-3 4-6 0Q32 74 34 46q0-8 4-12z" fill="#E22B1F"/>
    <path d="M36 34q10 8 14 0 10 8 16-2 8 8 16 4-4-10-24-10T36 34z" fill="#3FA34D"/>
    <path d="M44 46q0 20 8 34" fill="none" stroke="#ff9a8c" stroke-width="4"/>
    ${eyes(50, 72, 58, 6)}${angry(50, 72, 58)}${frown(60, 72, 5)}`),
  jeonbot: wrap(`
    <path d="M52 112V22h16v90z" fill="#8a8f98"/>
    <path d="M22 26h76v8H22zM32 44h56v7H32z" fill="#59606c"/>
    ${[26, 94, 38, 82].map((x, i) => `<rect x="${x - 3}" y="${i < 2 ? 16 : 36}" width="6" height="10" fill="#fff"/>`).join('')}
    <path d="M26 16Q4 22 2 40M94 16q22 6 24 24" fill="none"/>
    <path d="M54 80h12v18H54z" fill="#FFD23F"/>
    <path d="M102 56l-8 13h8l-6 13" fill="none" stroke="#F2B705" stroke-width="4"/>
    ${eyes(54, 66, 62, 5)}`),
  orak: wrap(`
    <path d="M26 12h68l6 88H20z" fill="#6243B8"/>
    <rect x="26" y="4" width="68" height="12" fill="#E8402C"/>
    <rect x="34" y="24" width="52" height="38" rx="4" fill="#17273e"/>
    <g stroke="#6CF2C2" stroke-width="3"><circle cx="48" cy="40" r="4" fill="#6CF2C2"/><circle cx="72" cy="40" r="4" fill="#6CF2C2"/><path d="M50 52h20" fill="none"/></g>
    <path d="M20 68h80l6 14H14z" fill="#F2B705"/>
    <circle cx="36" cy="74" r="4" fill="#E8402C"/><path d="M36 74v-8" stroke-width="3"/>
    <circle cx="66" cy="75" r="3" fill="#2F7DE1"/><circle cx="78" cy="75" r="3" fill="#E8402C"/>
    <rect x="52" y="90" width="16" height="6" fill="${K}"/>`),
  bangpae: wrap(`
    <path d="M18 12h84v90H18z" fill="#fff5d8"/>
    <path d="M18 12l84 90M102 12l-84 90M60 12v90M18 57h84" fill="none" stroke-width="2"/>
    <path d="M18 12h84v14H18z" fill="#E8402C"/>
    <path d="M18 102l10-22 10 22M82 102l10-22 10 22" fill="#2F7DE1"/>
    <circle cx="60" cy="57" r="17" fill="#FFD23F"/>
    ${eyes(53, 68, 54, 5)}${smile(60, 63, 4)}
    <path d="M60 102q-8 8 0 16" fill="none" stroke="#F2B705" stroke-width="3"/>`),
  bingsu: wrap(`
    <path d="M22 58q-2-26 14-30 4-18 24-18t24 18q16 4 14 30z" fill="#eafaff"/>
    <path d="M42 30q18-14 36 0l-6 12H48z" fill="#7a2f3a"/>
    <rect x="46" y="12" width="9" height="9" rx="2" fill="#fff" transform="rotate(14 50 16)"/>
    <rect x="64" y="14" width="9" height="9" rx="2" fill="#7ED0B4" transform="rotate(-10 68 18)"/>
    <path d="M16 56h88l-14 46H30z" fill="#BCE9F2"/>
    <path d="M42 112h36l-6-10H48z" fill="#BCE9F2"/>
    ${eyes(46, 74, 74, 7)}${smile(60, 87, 6)}`),
  bonaeng: wrap(`
    <path d="M36 28q24-22 48 0" fill="none" stroke-width="5"/>
    <rect x="16" y="24" width="88" height="24" rx="5" fill="#fff"/>
    <rect x="20" y="46" width="80" height="58" rx="5" fill="#2F7DE1"/>
    <rect x="14" y="44" width="10" height="10" fill="#c7cdd6"/><rect x="96" y="44" width="10" height="10" fill="#c7cdd6"/>
    ${eyes(44, 76, 68, 7)}${angry(44, 76, 68)}${grin(60, 82, 8)}`),
  jangdok: wrap(`
    <path d="M38 22h44l-4-10H42z" fill="#59402a"/>
    <path d="M60 12V6" stroke-width="5"/>
    <path d="M30 26h60q-2 6 8 16 12 16 8 36-6 26-46 30-40-4-46-30-4-20 8-36 10-10 8-16z" fill="#7a4a2a"/>
    <path d="M18 54q42-14 84 0" fill="none" stroke="#a97a50" stroke-width="3"/>
    <path d="M86 26q14-10 20 2-4 8-12 4 2 12-8 12" fill="#9A4FB8" stroke-width="2"/>
    ${eyes(46, 74, 72, 7)}${frown(60, 88, 8)}`),
  maetdol: wrap(`
    <path d="M84 30l26-14" stroke="#8B5A2B" stroke-width="7"/>
    <path d="M14 66h92v30q-46 16-92 0z" fill="#8c8b84"/>
    <ellipse cx="60" cy="66" rx="46" ry="13" fill="#a9a8a0"/>
    <path d="M22 34q38-14 76 0v30q-38 14-76 0z" fill="#9c9b93"/>
    <ellipse cx="60" cy="34" rx="38" ry="11" fill="#bdbcb4"/>
    <ellipse cx="60" cy="34" rx="9" ry="4" fill="#57564f"/>
    ${eyes(44, 76, 58, 7)}${angry(44, 76, 58)}${frown(60, 66, 6)}`),
  jangseung: wrap(`
    <path d="M34 112V26q0-20 26-20t26 20v86z" fill="#A9713A"/>
    <path d="M28 28q32-22 64 0v8q-32-10-64 0z" fill="#3b3640"/>
    <path d="M40 58q10-12 20 0M60 58q10-12 20 0" fill="none" stroke-width="4"/>
    ${eyes(48, 72, 62, 8)}
    <path d="M58 68l-5 14h14z" fill="#c78c52"/>
    <path d="M42 86h36v12H42z" fill="#fff"/><path d="M48 86v12M60 86v12M72 86v12" fill="none" stroke-width="2"/>`),
  fan: wrap(`
    <path d="M52 76h16l4 22H48z" fill="#d9dfe6"/>
    <path d="M26 104q0-8 10-8h48q10 0 10 8v6H26z" fill="#2F7DE1"/>
    <circle cx="60" cy="46" r="40" fill="#CFEDE1"/>
    <path d="M60 46Q44 18 62 12q14 16-2 34zM60 46q30-8 32 10-20 10-32-10zM60 46q-4 30-22 24 -4-20 22-24z" fill="#7FB8A4"/>
    <circle cx="60" cy="46" r="11" fill="#FFD23F"/>
    ${eyes(55, 66, 44, 3)}
    <rect x="50" y="100" width="6" height="5" fill="#fff" stroke-width="1.5"/><rect x="62" y="100" width="6" height="5" fill="#E8402C" stroke-width="1.5"/>`),
  kkaebi: wrap(`
    <path d="M90 94L104 22" stroke="#6c4a2e" stroke-width="5"/>
    <path d="M92 40l12-30 12 8-4 28z" fill="#8B5A2B"/>
    <path d="M36 28l-10-20 22 12zM84 28l10-20-22 12z" fill="#F2B705"/>
    <path d="M22 50q2-30 38-30t38 30q2 26-10 40H32Q20 76 22 50z" fill="#4B3F9E"/>
    <path d="M30 92h60l6 20H24z" fill="#E8402C"/>
    <path d="M30 92h60" fill="none"/><path d="M24 112h72" fill="none"/>
    ${eyes(44, 76, 52, 9)}${angry(44, 76, 50)}${grin(60, 70, 13)}`),
  kkangtong: wrap(`
    <path d="M26 30l68-6v76l-68 8z" fill="#AEB7C2"/>
    <ellipse cx="60" cy="27" rx="34" ry="8" fill="#ced4dc"/>
    <path d="M26 56l68-6v24l-68 6z" fill="#E8402C"/>
    <path d="M50 22l24-6 2 6-12 6z" fill="#7C8798"/>
    <path d="M30 100q6-8 12 0M74 96q6-8 12 0" fill="#9A4FB8" stroke-width="2"/>
    ${eyes(46, 74, 64, 7)}${frown(60, 78, 6)}`),
  bongdari: wrap(`
    <path d="M24 34q-8-24 8-28 8 8 6 22M96 34q8-24-8-28-8 8-6 22" fill="#23202b"/>
    <path d="M26 30q34 12 68 0 18 32 2 64-8 14-36 14T24 94Q8 62 26 30z" fill="#2f2b38"/>
    <path d="M38 40q-8 24-4 50M84 44q6 22 2 44" fill="none" stroke="#5b5667" stroke-width="2"/>
    <path d="M60 108q-4 6 2 10M44 104q-8 4-6 10M78 104q6 4 6 10" fill="none" stroke="#9A4FB8" stroke-width="3"/>
    ${eyes(46, 74, 60, 8)}${smile(60, 78, 8)}`),
};

Object.assign(ART, {
 manhol: wrap(`
  <ellipse cx="60" cy="94" rx="50" ry="17" fill="#17121f"/>
  <path d="M10 88a50 18 0 0 0 100 0v-14H10z" fill="#4a4d58"/>
  <ellipse cx="60" cy="72" rx="50" ry="34" fill="#6e7380"/>
  <ellipse cx="60" cy="72" rx="40" ry="26" fill="none" stroke-width="2"/>
  <path d="M26 58l68 28M94 58L26 86M60 46v52M20 72h80" fill="none" stroke="#4a4d58" stroke-width="2"/>
  <path d="M80 44h22v8H80z" fill="#a9713a" stroke-width="2"/>
  ${eyes(44,76,68,8)}${angry(44,76,68)}${frown(60,84,8)}`),
 sigung: wrap(`
  <path d="M86 92q26 2 22-16-3-12-14-8" fill="none" stroke="#c78b8f" stroke-width="6"/>
  <circle cx="34" cy="28" r="15" fill="#6c6a5c"/><circle cx="34" cy="28" r="7" fill="#c78b8f"/>
  <circle cx="82" cy="28" r="15" fill="#6c6a5c"/><circle cx="82" cy="28" r="7" fill="#c78b8f"/>
  <path d="M18 74q0-52 40-52t42 52q2 32-42 32T18 74z" fill="#7d7a68"/>
  <path d="M26 96q6-12 12 0 6 10 14 0 8-8 16 0t14 0 10-4v10q-34 14-66-6z" fill="#5fae4a"/>
  <path d="M42 34q-8 10-4 18M78 34q6 10 4 18" fill="none" stroke-width="2"/>
  ${eyes(44,74,56,8)}${angry(44,74,56)}
  <ellipse cx="59" cy="68" rx="6" ry="5" fill="#c78b8f"/>
  <path d="M46 78q13 7 26 0" fill="none"/><path d="M53 81l2 9 5-7zM61 83l5 7 2-9z" fill="#fff" stroke-width="2"/>
  <path d="M14 60l-10-3M14 68H3M104 60l10-3M104 68h11" fill="none" stroke-width="2"/>`),
 batji: wrap(`
  <rect x="8" y="14" width="104" height="94" rx="6" fill="#59606c"/>
  <rect x="20" y="26" width="80" height="70" fill="#101323"/>
  <path d="M20 86q14-10 26 0t28 0 26 0v10H20z" fill="#2F7DE1"/>
  <circle cx="45" cy="52" r="9" fill="#FFD23F"/><circle cx="75" cy="52" r="9" fill="#FFD23F"/>
  <circle cx="45" cy="53" r="3.5" fill="${K}" stroke="none"/><circle cx="75" cy="53" r="3.5" fill="${K}" stroke="none"/>
  ${[30,60,90].map(x=>`<rect x="${x-3}" y="24" width="7" height="74" fill="#8a8f98"/>`).join('')}
  <path d="M16 106q0 8-3 9-3-1-3-5M104 106q0 6 3 8 3-1 3-4" fill="#7fc8e8" stroke-width="2"/>`),
 meokarak: wrap(`
  <path d="M60 110C20 112 2 86 14 58 6 44 22 22 38 26 48 8 74 8 82 26c20-2 32 22 22 36 12 26-8 50-44 48z" fill="#1d1a24"/>
  <path d="M22 36q-14 16-6 34M36 22q-8 4-8 16M84 24q12 6 10 18M102 58q6 14 0 26M30 96q-12-4-16-16M62 12q8-6 16-2" fill="none" stroke="#5b5270" stroke-width="2"/>
  <path d="M30 88q10 6 14-2t12 2 12-4 14 4M34 48q10-8 20-2M66 42q12-6 22 4M38 100q12 4 22 0t22-2" fill="none" stroke="#5b5270" stroke-width="2"/>
  <path d="M14 112q8-8 2-16M108 110q-6-8-2-16M60 118q-4-5 0-9" fill="none" stroke-width="3"/>
  ${eye(46,62,10)}${eye(76,66,6)}
  <path d="M50 84q8-5 16 0t14-2" fill="none" stroke="#FFF" stroke-width="2"/>`),
 ppeong: wrap(`
  <path d="M54 8h12v44H54z" fill="#c9924f"/>
  <path d="M60 46c30 0 42 26 44 48q0 10-10 10H26q-10 0-10-10c2-22 14-48 44-48z" fill="#D52C2C"/>
  <path d="M16 96q44-12 88 0v10q0 6-8 6H24q-8 0-8-6z" fill="#8f1b1b"/>
  <path d="M38 60q-8 8-10 22" fill="none" stroke="#ff9a8c" stroke-width="4"/>
  ${eyes(46,74,74,7)}${angry(46,74,74)}${grin(60,86,9)}`),
 tteokppo: wrap(`
  <path d="M6 58h108q2 46-54 48Q4 104 6 58z" fill="#2e8f6f"/>
  <ellipse cx="60" cy="58" rx="54" ry="20" fill="#d9301f"/>
  ${[[34,50,20],[58,44,-16],[82,52,24],[46,62,-10],[72,64,14]].map(([x,y,r])=>`<rect x="${x-13}" y="${y-5}" width="26" height="10" rx="5" fill="#fff3d9" transform="rotate(${r} ${x} ${y})" stroke-width="2"/>`).join('')}
  <path d="M52 56l14-5 6 9-16 5z" fill="#E7A84B" stroke-width="2"/>
  ${eyes(44,76,84,7)}${smile(60,94,6)}
  <path d="M28 30q-6-8 0-14M60 24q-6-8 0-14M92 30q6-8 0-14" fill="none" stroke="#d9301f"/>`),
 sundae: wrap(`
  <path d="M14 66c-8 28 14 42 30 30 8 10 28 10 36 0 16 12 36-2 28-30-2-34-26-46-48-46S16 32 14 66z" fill="#3b2b33"/>
  <path d="M28 40q-8 24 2 54M92 40q8 24-2 54M46 26q-6 34 0 72M74 26q6 34 0 72" fill="none" stroke="#1a1433" stroke-width="2"/>
  ${[[34,50],[52,38],[70,44],[86,62],[30,76],[62,92],[86,84],[48,88]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.5" fill="#d9c6a8" stroke="none"/>`).join('')}
  <path d="M100 20l10-8 4 5-8 10z" fill="#c9924f" stroke-width="2"/><path d="M100 24L80 42" stroke="#c9924f" stroke-width="5"/>
  ${eyes(44,76,58,8)}${smile(60,74,8)}`),
 eomuk: wrap(`
  <path d="M60 2v116" stroke="#c9924f" stroke-width="5"/>
  <path d="M34 16q20-10 50 0-8 8 0 14-28 10-52 0 8-8 2-14z" fill="#E7C98A"/>
  <path d="M28 38q30-12 62 0-8 12 0 20-32 12-64 0 10-10 2-20z" fill="#E7C98A"/>
  <path d="M26 66q32-12 66 0-10 12 0 22-34 12-68 0 12-12 2-22z" fill="#E7C98A"/>
  <path d="M6 92h108l-10 22H16z" fill="#2F7DE1"/><path d="M6 92q14-8 27 0t27 0 27 0 27 0" fill="none" stroke="#bfe4ff" stroke-width="2"/>
  <path d="M30 80q0-12 8-6M90 22q6 4 0 10" fill="none" stroke="#a97a50" stroke-width="2"/>
  ${eyes(46,74,46,7)}${smile(60,58,6)}`),
 hotteok: wrap(`
  <path d="M8 66c0-30 24-44 52-44s52 14 52 44-24 40-52 40S8 96 8 66z" fill="#C98438"/>
  <path d="M18 62c2-22 20-30 42-30s40 8 42 30" fill="none" stroke="#8d5420" stroke-width="2"/>
  <path d="M84 96q6 16 16 12 2-8-6-14-2-10-10 2z" fill="#6c2f12"/>
  ${[[34,46],[50,40],[70,42],[86,52]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="4" ry="2.5" fill="#3a2010" stroke-width="1"/>`).join('')}
  ${eyes(44,76,66,8)}${angry(44,76,66)}${grin(60,80,10)}
  <path d="M30 22q-5-6 0-12M90 22q5-6 0-12" fill="none" stroke="#fff"/>`),
 ppeondegi: wrap(`
  <path d="M24 56h72l-12 58H36z" fill="#F4ECD8"/>
  <path d="M24 72h72M26 82h68" fill="none" stroke="#E8402C" stroke-width="3"/>
  ${[[34,50],[52,44],[70,46],[86,52]].map(([x,y],i)=>`<g transform="rotate(${i%2?20:-20} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="10" ry="15" fill="#7a4f28"/><path d="M${x-9} ${y-6}h18M${x-10} ${y}h20M${x-9} ${y+6}h18" fill="none" stroke="#3b2413" stroke-width="2"/></g>`).join('')}
  <path d="M50 24q10-14 24 0 6 8 2 20H50q-6-10 0-20z" fill="#8c5c30"/>
  <path d="M50 30h26M48 37h29" fill="none" stroke="#3b2413" stroke-width="2"/>
  ${eyes(52,70,96,6)}${frown(61,104,4)}`),
});

function monsterSVG(id, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">${ART[id] || ''}</svg>`;
}

/* ---------- 아바타 ---------- */
const SKIN = ['#FFE0BD', '#F7CFA6', '#E8B98A', '#C98F5E', '#8D5A3B', '#5E3A26'];
const HAIR_C = ['#1a1433', '#4A2C1A', '#8B5A2B', '#D9A441', '#E8402C', '#2F7DE1', '#3FA34D', '#E6E0D5'];
const CLOTH_C = ['#E8402C', '#2F7DE1', '#3FA34D', '#F2B705', '#9A4FB8', '#FFFFFF', '#2B2B38', '#F27FA5'];
const BG_C = ['#2340A8', '#E8402C', '#F2B705', '#3CC9A7', '#9A4FB8', '#F27FA5'];

const AVATAR_LABELS = {
  skin: '피부', hair: '머리 모양', hairColor: '머리 색', eyes: '눈', mouth: '입',
  outfit: '옷', outfitColor: '옷 색', hat: '모자', bg: '배경',
};

function avatarSVG(a, cls = '') {
  const skin = SKIN[a.skin], hc = HAIR_C[a.hairColor], cc = CLOTH_C[a.outfitColor];
  const back = {
    2: `<path d="M26 48q-2 40 8 44h32q10-4 8-44z" fill="${hc}"/>`,
    3: `<path d="M26 48q-2 22 6 28h36q8-6 6-28z" fill="${hc}"/>`,
    4: `<path d="M72 40q18 6 12 34-8-8-12-10z" fill="${hc}"/>`,
    6: `<circle cx="50" cy="16" r="10" fill="${hc}"/>`,
  }[a.hair] || '';
  const top = [
    '',
    `<path d="M28 44q-2-26 22-26t22 26q-8-10-22-10T28 44z" fill="${hc}"/>`,
    `<path d="M27 46q-3-30 23-30t23 30q-6-14-14-16-16 8-26 4-4 4-6 12z" fill="${hc}"/>`,
    `<path d="M27 48q-3-32 23-32t23 32q-4-12-10-14H37q-6 2-10 14z" fill="${hc}"/>`,
    `<path d="M28 44q-2-26 22-26t22 26q-10-14-30-8-8 2-14 8z" fill="${hc}"/>`,
    `<path d="M26 42q-6-8 2-14-2-10 10-10 4-8 14-4 12-4 16 6 10 4 6 14 4 6 2 10-4-8-10-12-16 6-32 2-6 2-8 8z" fill="${hc}"/>`,
    `<path d="M28 44q-2-24 22-24t22 24q-6-12-22-12T28 44z" fill="${hc}"/>`,
    `<path d="M50 18l-8 14-4-8-2 10-8-2 8 10q4-8 14-8t14 8l8-10-8 2-2-10-4 8z" fill="${hc}"/>`,
    `<path d="M29 40q6-14 21-14t21 14q-4-4-21-4t-21 4z" fill="${hc}" opacity=".55" stroke="none"/>`,
  ][a.hair];
  const ey = [
    `<circle cx="41" cy="49" r="3.5" fill="${K}"/><circle cx="59" cy="49" r="3.5" fill="${K}"/>`,
    `<path d="M36 49q5-5 10 0M54 49q5-5 10 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
    `<circle cx="41" cy="49" r="5.5" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="59" cy="49" r="5.5" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="42" cy="50" r="2.5" fill="${K}"/><circle cx="60" cy="50" r="2.5" fill="${K}"/>`,
    `<path d="M35 45l11 3M65 45l-11 3" stroke="${K}" stroke-width="2.5"/><circle cx="41" cy="51" r="3" fill="${K}"/><circle cx="59" cy="51" r="3" fill="${K}"/>`,
    `<path d="M36 49h10M54 49h10" stroke="${K}" stroke-width="3"/>`,
  ][a.eyes];
  const mo = [
    `<path d="M44 60q6 5 12 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
    `<path d="M43 59h14q-1 8-7 8t-7-8z" fill="#fff" stroke="${K}" stroke-width="2"/>`,
    `<path d="M45 61h10" stroke="${K}" stroke-width="2.5"/>`,
    `<circle cx="50" cy="62" r="3.5" fill="${K}"/>`,
    `<path d="M44 62q6-5 12 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
  ][a.mouth];
  const clothes = [
    `<path d="M14 100q2-26 24-28h24q22 2 24 28z" fill="${cc}"/>`,
    `<path d="M12 100q2-28 26-30h24q24 2 26 30z" fill="${cc}"/><path d="M36 72q14 14 28 0v6q-14 12-28 0z" fill="#00000030"/><path d="M50 84v16" stroke="${K}" stroke-width="2"/>`,
    `<path d="M14 100q2-26 24-28h24q22 2 24 28z" fill="#2B2B38"/><path d="M38 72l12 16 12-16 6 2-18 26-18-26z" fill="#fff"/><path d="M48 84h4l2 14h-8z" fill="${cc}"/>`,
    `<path d="M14 100q2-26 24-28h24q22 2 24 28z" fill="${cc}"/><path d="M24 78l-4 22M76 78l4 22" stroke="#fff" stroke-width="4"/><path d="M50 74v26" stroke="${K}" stroke-width="2"/>`,
    `<path d="M14 100q2-26 24-28h24q22 2 24 28z" fill="#fff"/><path d="M32 100V78h6v8h24v-8h6v22z" fill="${cc}"/>`,
  ][a.outfit];
  const hat = [
    '',
    `<path d="M27 34q2-20 23-20t23 20z" fill="${cc}"/><path d="M27 34h46l14 5H27z" fill="${K}"/>`,
    `<path d="M27 36q0-24 23-24t23 24z" fill="${cc}"/><path d="M25 32h50v8H25z" fill="#fff"/><circle cx="50" cy="11" r="5" fill="#fff"/>`,
    `<path d="M28 34q22-8 44 0v6q-22-8-44 0z" fill="#E8402C"/><path d="M72 36l12-4-3 8 3 7-12-6z" fill="#E8402C"/>`,
    `<path d="M22 36q8-22 28-22t28 22q-28-8-56 0z" fill="#E7C98A"/><path d="M12 38q38-12 76 0-38-6-76 0z" fill="#E7C98A"/>`,
    `<path d="M34 40l-4-14 12 8 8-16 8 16 12-8-4 14z" fill="#F2B705"/>`,
  ][a.hat];
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <rect width="100" height="100" fill="${BG_C[a.bg]}"/>
    <g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">
      ${back}${clothes}
      <path d="M42 64h16v12q-8 6-16 0z" fill="${skin}"/>
      <ellipse cx="50" cy="46" rx="23" ry="26" fill="${skin}"/>
      <ellipse cx="26" cy="50" rx="3.5" ry="5" fill="${skin}"/><ellipse cx="74" cy="50" rx="3.5" ry="5" fill="${skin}"/>
      ${top}
    </g>
    ${ey}${mo}
    <g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">${hat}</g>
  </svg>`;
}
