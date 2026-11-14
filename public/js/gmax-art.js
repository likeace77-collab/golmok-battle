'use strict';
/* 거다이맥스: 골목몬이 거대한 괴수로 모습이 바뀐 그림 (200×200 기준, 골목 그림체: 굵은 잉크선 + 납작한 색 + 빛나는 타입색)
   GMAX_ART[id]에 골목몬마다 따로 그린 그림을 넣어요. */
const GMAX_ART = {};
const GMX = (() => {
  // 화난 눈: 안쪽으로 내려간 아몬드 + 세로 동공. dir 1=왼눈(안쪽이 오른쪽), -1=오른눈
  const eye = (x, y, r, col, dir = 1, pupil = '#1a1433') => {
    const s = dir;
    return `<path d="M${x - r * s} ${y - r * 0.5}L${x + r * s} ${y + r * 0.15}Q${x} ${y + r * 0.95} ${x - r * s} ${y + r * 0.2}Z" fill="${col}" class="gx-eye"/>`
      + `<ellipse cx="${x + r * 0.2 * s}" cy="${y + r * 0.22}" rx="${r * 0.16}" ry="${r * 0.42}" fill="${pupil}" stroke="none"/>`;
  };
  // 이빨 가득한 입
  const maw = (x, y, w, h, n = 6, inner = '#5a0f1e', tooth = '#fff6e0') => {
    let top = '', bot = '';
    for (let i = 0; i < n; i++) {
      const a = x - w / 2 + (w / n) * i, b = a + w / n, m = (a + b) / 2;
      top += `<path d="M${a} ${y - h * 0.42}L${m} ${y + h * 0.18}L${b} ${y - h * 0.42}Z"/>`;
      if (i < n - 1) bot += `<path d="M${m} ${y + h * 0.5}L${b} ${y - h * 0.08}L${b + w / n} ${y + h * 0.5}Z"/>`;
    }
    return `<path d="M${x - w / 2} ${y - h * 0.45}Q${x} ${y - h * 0.7} ${x + w / 2} ${y - h * 0.45}Q${x + w * 0.42} ${y + h * 0.75} ${x} ${y + h * 0.75}Q${x - w * 0.42} ${y + h * 0.75} ${x - w / 2} ${y - h * 0.45}Z" fill="${inner}"/>`
      + `<g fill="${tooth}" stroke-width="1.6">${top}${bot}</g>`;
  };
  const claw = (x, y, s = 1, rot = 0, col = '#efe6d0') => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})" fill="${col}" stroke-width="2.4">`
    + `<path d="M-12 0Q-16 -14 -8 -24Q-9 -12 -4 0Z"/><path d="M-3 2Q-4 -16 4 -28Q2 -14 5 2Z"/><path d="M6 1Q8 -12 16 -20Q12 -8 13 2Z"/></g>`;
  const spike = (x, y, a, L, w, fill) => {
    const r = (a * Math.PI) / 180, nx = Math.cos(r + Math.PI / 2) * w, ny = Math.sin(r + Math.PI / 2) * w;
    return `<path d="M${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}L${(x + Math.cos(r) * L).toFixed(1)} ${(y + Math.sin(r) * L).toFixed(1)}L${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}Z" fill="${fill}"/>`;
  };
  const spikes = (list, fill) => list.map(([x, y, a, L, w]) => spike(x, y, a, L, w, fill)).join('');
  const crack = (d, col, w = 3) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w + 4}" opacity=".45"/><path d="${d}" fill="none" stroke="${col}" stroke-width="${w}"/><path d="${d}" fill="none" stroke="#fff" stroke-width="${Math.max(0.8, w / 3)}"/>`;
  const ground = (col) => `<ellipse cx="100" cy="194" rx="92" ry="10" fill="${col}" opacity=".35" stroke="none"/>`;
  const W = (s) => `<g stroke="#1a1433" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
  return { eye, maw, claw, spikes, spike, crack, ground, W };
})();

/* ---------- 1차: 연탄이 · 붕빵이 · 호롱이 · 주전이 · 대야몽 · 우산령 · 콩시루 · 싸리비 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 연탄 화산거인: 연탄 세 장이 쌓인 몸, 구멍마다 용암, 꼭대기에서 분화
  GMAX_ART.yeontan = W(`${ground('#ff4a1c')}
    <path d="M70 34Q78 6 92 20Q98 -4 110 18Q124 2 128 30Q142 22 138 44L66 44Q56 26 70 34Z" fill="#ff7a2a"/><path d="M82 40Q88 22 98 32Q104 16 112 32Q120 24 120 40Z" fill="#FFD23F" stroke-width="2.4"/>
    ${spikes([[52, 70, 200, 30, 7], [50, 100, 190, 34, 8], [148, 70, -20, 30, 7], [150, 100, -10, 34, 8]], '#2b2630')}
    <path d="M30 120Q14 128 12 150L20 170 40 160 46 132Z" fill="#2e2a33"/><path d="M170 120Q186 128 188 150L180 170 160 160 154 132Z" fill="#2e2a33"/>
    ${claw(22, 168, 1, 160)}${claw(178, 168, 1, 200)}
    <path d="M56 44h88l6 46H50z" fill="#3a3540"/><path d="M50 90h100l6 48H44z" fill="#2e2a33"/><path d="M44 138h112l8 48H36z" fill="#25212a"/>
    <g fill="#ff6a1c" stroke-width="2">${[[72, 58], [100, 56], [128, 58], [86, 72], [114, 72]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5"/>`).join('')}</g>
    ${crack('M54 96L58 112 52 128M146 94L142 110 148 130M48 150L56 162 46 180M152 148L144 164 154 180', '#ff7a1c', 2.6)}
    ${eye(76, 104, 14, '#FFD23F', 1)}${eye(124, 104, 14, '#FFD23F', -1)}
    <path d="M60 92L90 100M140 92L110 100" stroke-width="5"/>
    ${maw(100, 150, 64, 30, 7, '#7a1a0a', '#ffe7c2')}
    <path d="M84 164q2 10-2 16M116 164q-2 9 3 14" stroke="#ff7a1c" stroke-width="4" fill="none"/>`);

  // 붕어빵 리바이어던: 갈라진 빵 껍질 사이로 끓는 팥, 칼날 지느러미, 쇠틀 무늬 갑옷
  GMAX_ART.bungbbang = W(`${ground('#E8402C')}
    ${spikes([[64, 52, -110, 40, 8], [86, 44, -95, 46, 8], [110, 44, -80, 46, 8], [132, 52, -65, 38, 7]], '#a85a18')}
    <path d="M150 96L196 56 188 100 198 146 150 112Z" fill="#c8741e"/><path d="M160 98L186 74M160 106L190 130" stroke-width="2.4"/>
    <path d="M20 104Q22 54 88 48Q150 46 156 104Q150 160 88 162Q22 158 20 104Z" fill="#d98a2a"/>
    <path d="M36 70Q90 58 148 80M30 104H156M36 138Q90 152 148 128" fill="none" stroke="#a85a18" stroke-width="3"/>
    <path d="M60 52V158M100 48V160M134 56V152" fill="none" stroke="#a85a18" stroke-width="2.4" stroke-dasharray="6 6"/>
    ${crack('M70 60L80 80 72 96 84 112M118 64L110 84 122 100M90 128L104 140 96 156', '#ff3a4a', 3)}
    <path d="M70 92q6 8 0 16M112 118q8 6 2 14" fill="#5a0f1e" stroke-width="2"/>
    <path d="M86 156Q74 182 56 186L70 162M120 154Q130 178 150 184L132 158" fill="#c8741e"/>
    ${eye(48, 86, 15, '#ff3a4a', 1)}
    <path d="M30 70L62 84" stroke-width="5"/>
    ${maw(40, 122, 40, 30, 5, '#5a0f1e', '#fff3d6')}
    <circle cx="26" cy="140" r="5" fill="#5a0f1e"/><circle cx="18" cy="152" r="3.5" fill="#5a0f1e"/>`);

  // 호롱 원령등: 깨진 유리 안에 해골 불꽃, 사슬과 유령 손
  GMAX_ART.horong = W(`${ground('#B44BFF')}
    <path d="M34 120Q4 104 10 70Q24 96 40 92Q30 70 44 52Q50 82 60 88Z" fill="#6a3aa8" opacity=".9"/><path d="M166 120Q196 104 190 70Q176 96 160 92Q170 70 156 52Q150 82 140 88Z" fill="#6a3aa8" opacity=".9"/>
    ${claw(22, 128, 1.1, 150, '#c9a8ff')}${claw(178, 128, 1.1, 210, '#c9a8ff')}
    <path d="M44 178h112l-8 14H52z" fill="#3a2a2a"/><path d="M56 160h88l10 18H46z" fill="#5a3a2a"/>
    <path d="M60 64Q100 44 140 64L148 160H52Z" fill="#7fe7d6" fill-opacity=".35"/>
    <path d="M100 30Q130 56 128 98Q126 136 100 148Q74 136 72 98Q70 56 100 30Z" fill="#ff7a2a"/><path d="M100 54Q118 74 116 104Q112 130 100 136Q88 130 84 104Q82 74 100 54Z" fill="#B44BFF"/>
    <path d="M84 96Q100 84 116 96L114 118Q100 126 86 118Z" fill="#f4ecff"/>
    ${eye(92, 102, 7, '#ff3a4a', 1)}${eye(108, 102, 7, '#ff3a4a', -1)}
    <path d="M92 116v6M100 116v7M108 116v6" stroke-width="2"/>
    <path d="M60 64Q100 44 140 64L148 160H52Z" fill="none"/><path d="M66 70L84 96 70 120M138 74L124 92 136 112 128 140" fill="none" stroke="#fff" stroke-width="2.4"/>
    <path d="M70 36h60l-10-12H80z" fill="#5a3a2a"/><path d="M84 22h32" stroke-width="5"/>
    <path d="M54 150q-14 10-10 26M146 150q14 10 10 26" fill="none" stroke="#c9c2d6" stroke-width="5" stroke-dasharray="6 4"/>`);

  // 주전자 증기거신: 주둥이가 짐승 머리, 투구 같은 뚜껑, 리벳 갑옷, 끓는 증기
  GMAX_ART.kettle = W(`${ground('#2F7DE1')}
    <path d="M18 60Q6 40 24 26Q20 44 34 46Q30 26 50 18Q44 40 58 44Z" fill="#e8f2ff" opacity=".9"/><path d="M182 50Q194 32 180 18Q182 34 170 36" fill="#e8f2ff" opacity=".9"/>
    <path d="M40 92Q20 92 14 116L24 150 44 140 50 110Z" fill="#9aa7b8"/>${claw(22, 150, 1, 165, '#dfe6f0')}
    <path d="M36 100Q36 56 100 52Q166 56 166 104Q168 170 100 174Q34 172 36 100Z" fill="#c3ccd8"/>
    <path d="M50 120Q100 132 152 118" fill="none" stroke="#7f8aa0" stroke-width="3"/>
    <g fill="#7f8aa0" stroke-width="1.6">${[[56, 80], [76, 70], [124, 70], [144, 80], [52, 140], [148, 140], [100, 160]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5"/>`).join('')}</g>
    <path d="M60 58Q100 30 140 58Z" fill="#7f8aa0"/>${spikes([[78, 46, -120, 26, 6], [100, 40, -90, 30, 6], [122, 46, -60, 26, 6]], '#5a6478')}
    <circle cx="100" cy="34" r="9" fill="#E8402C"/>
    <path d="M160 104Q186 94 194 66L176 60Q170 84 154 88Z" fill="#9aa7b8"/>
    <path d="M176 60L198 52 196 74Z" fill="#9aa7b8"/>${maw(186, 64, 18, 14, 3, '#123a7a', '#fff')}
    <path d="M186 46Q190 30 180 22M196 48Q206 36 200 24" fill="none" stroke="#e8f2ff" stroke-width="5"/>
    ${eye(78, 100, 14, '#6fd7ff', 1)}${eye(122, 100, 14, '#6fd7ff', -1)}
    <path d="M60 84L92 94M140 84L108 94" stroke-width="5"/>
    ${maw(100, 140, 58, 26, 6, '#123a7a', '#f2f8ff')}
    ${crack('M58 106L64 124M142 106L136 126', '#6fd7ff', 2.4)}`);

  // 대야 소용돌이 괴수: 대야 등껍질, 아가리는 소용돌이, 물 촉수
  GMAX_ART.daeya = W(`${ground('#2F7DE1')}
    <path d="M30 150Q4 160 6 186L20 182Q20 166 38 162Z" fill="#4aa8ff"/><path d="M170 150Q196 160 194 186L180 182Q180 166 162 162Z" fill="#4aa8ff"/>
    <path d="M44 170Q30 190 12 192M156 170Q170 190 188 192" fill="none" stroke="#4aa8ff" stroke-width="9"/>
    <path d="M18 100Q22 40 100 36Q178 40 182 100L170 150Q100 170 30 150Z" fill="#E8402C"/>
    <path d="M18 100Q100 120 182 100" fill="none" stroke="#a82a1a" stroke-width="4"/><path d="M30 70Q100 56 170 70" fill="none" stroke="#ff7a6a" stroke-width="3"/>
    ${spikes([[46, 52, -130, 26, 7], [74, 40, -105, 30, 7], [100, 36, -90, 32, 7], [126, 40, -75, 30, 7], [154, 52, -50, 26, 7]], '#a82a1a')}
    <ellipse cx="100" cy="134" rx="56" ry="26" fill="#123a7a"/><path d="M58 134Q100 110 142 134Q100 154 74 136Q100 124 120 136Q100 146 92 136" fill="none" stroke="#6fd7ff" stroke-width="3"/>
    ${maw(100, 134, 110, 46, 9, 'none', '#f2f8ff')}
    ${eye(66, 90, 15, '#6fd7ff', 1)}${eye(134, 90, 15, '#6fd7ff', -1)}
    <path d="M44 74L84 86M156 74L116 86" stroke-width="5"/>
    <circle cx="36" cy="58" r="4" fill="#6fd7ff"/><circle cx="168" cy="46" r="5" fill="#6fd7ff"/>`);

  // 우산 폭풍사신: 찢긴 우산살이 날개처럼, 손잡이는 낫, 천에 커다란 외눈
  GMAX_ART.usan = W(`${ground('#3a6ad8')}
    <path d="M100 26L4 96Q20 90 30 104Q40 92 54 102Q62 90 76 100Q86 90 100 98Q114 90 124 100Q138 90 146 102Q160 92 170 104Q180 90 196 96Z" fill="#2340A8"/>
    <path d="M100 26L30 104M100 26L76 100M100 26V98M100 26L124 100M100 26L170 104" stroke-width="2.4" fill="none"/>
    <path d="M20 98L8 120M54 102L46 124M146 102L154 124M180 98L192 120" stroke-width="3"/>
    <path d="M100 6V28" stroke-width="5"/><path d="M92 8L100 -2 108 8Z" fill="#c3ccd8"/>
    <path d="M100 98V168Q100 192 76 190Q56 186 60 166" fill="none" stroke-width="7"/><path d="M60 166Q48 160 40 172Q54 170 58 182Z" fill="#c3ccd8"/>
    <ellipse cx="100" cy="62" rx="22" ry="16" fill="#f4ecff"/>${eye(100, 60, 18, '#6fd7ff', 1)}
    <path d="M76 44L92 52M124 44L108 52" stroke-width="4"/>
    ${maw(100, 84, 44, 12, 6, '#0b1a4a', '#f2f8ff')}
    <g fill="#6fd7ff" stroke-width="1.6">${[[30, 130], [56, 148], [146, 136], [170, 150], [128, 164]].map(([x, y]) => `<path d="M${x} ${y - 10}L${x + 4} ${y}L${x} ${y + 6}L${x - 4} ${y}Z"/>`).join('')}</g>
    ${crack('M14 66L26 50 20 40 30 26M186 66L176 52 182 40 172 26', '#9fe2ff', 2.4)}`);

  // 콩나물 히드라: 깨진 시루에서 콩나물 머리 뱀들이 솟아오름
  GMAX_ART.kongsiru = W(`${ground('#3FA34D')}
    ${[[40, 40, -30], [70, 18, -10], [100, 10, 0], [130, 18, 10], [160, 40, 30]].map(([x, y, t]) => `<path d="M${100 + (x - 100) * 0.4} 112Q${x - 20} ${y + 60} ${x} ${y + 18}" fill="none" stroke="#f0f2c8" stroke-width="10"/>
      <g transform="translate(${x} ${y}) rotate(${t})"><ellipse rx="16" ry="13" fill="#FFD23F"/><path d="M-16 -2Q0 -14 16 -2" fill="none" stroke="#c9a400" stroke-width="2"/>${eye(-6, -2, 6, '#ff3a4a', 1)}${eye(6, -2, 6, '#ff3a4a', -1)}<path d="M-8 6L-5 11-2 6 1 11 4 6 7 11" fill="#fff" stroke-width="1.4"/></g>`).join('')}
    <path d="M28 112h144l-14 76H42z" fill="#8a5a3a"/><path d="M28 112h144v10H28z" fill="#6a4228"/>
    <g fill="#5a3a22" stroke="none">${[[50, 140], [70, 152], [96, 136], [124, 150], [148, 136], [60, 172], [110, 172], [140, 168]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
    ${crack('M70 122L80 148 70 170M128 122L120 146 134 178', '#7dff6a', 2.6)}
    ${eye(76, 140, 12, '#7dff6a', 1)}${eye(124, 140, 12, '#7dff6a', -1)}
    ${maw(100, 166, 44, 16, 6, '#2a1608', '#f0f2c8')}`);

  // 싸리비 회오리 야수: 빗자루 끝이 갈기 회오리로, 싸리 가지 발톱
  GMAX_ART.ssaribi = W(`${ground('#3FA34D')}
    <path d="M12 60Q40 20 90 30Q60 40 54 60M188 70Q170 30 120 26Q150 40 150 60" fill="none" stroke="#bfe8b0" stroke-width="5" opacity=".9"/>
    <path d="M30 150Q10 120 34 96Q24 126 50 132M170 150Q190 120 166 96Q176 126 150 132" fill="none" stroke="#bfe8b0" stroke-width="5" opacity=".9"/>
    <path d="M90 4L110 4 108 70 92 70Z" fill="#8a5a2a"/><path d="M86 62h28v14H86z" fill="#E8402C"/>
    <path d="M100 74L40 96 24 170 50 158 56 186 80 166 100 194 120 166 144 186 150 158 176 170 160 96Z" fill="#d9b25a"/>
    <path d="M100 74L60 186M100 74L84 190M100 74V194M100 74L116 190M100 74L140 186M100 74L36 150M100 74L164 150" fill="none" stroke="#a8842a" stroke-width="2.4"/>
    ${spikes([[40, 110, 200, 24, 6], [36, 140, 190, 26, 6], [160, 110, -20, 24, 6], [164, 140, -10, 26, 6]], '#a8842a')}
    ${eye(82, 110, 14, '#b6ff5a', 1)}${eye(118, 110, 14, '#b6ff5a', -1)}
    <path d="M62 94L94 104M138 94L106 104" stroke-width="5"/>
    ${maw(100, 144, 52, 22, 6, '#3a2a08', '#fff6d6')}
    ${claw(30, 180, 1, 170, '#d9b25a')}${claw(170, 180, 1, 190, '#d9b25a')}`);
})();

/* ---------- 2차: 전봇이 · 오락이 · 방패연 · 빙수리 · 보냉이 · 장독이 · 맷돌이 · 장승이 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;
  const bolt = (d, col = '#FFE45C') => crack(d, col, 2.6);

  // 전봇대 거신: 가로대 팔, 애자 눈, 엉킨 전깃줄 채찍, 변압기 가슴
  GMAX_ART.jeonbot = W(`${ground('#FFD23F')}
    ${bolt('M10 60L30 90 20 120 40 150M190 60L170 90 182 118 160 150')}
    <path d="M86 6h28l10 188H76z" fill="#8a8f9a"/><path d="M90 6v186M110 6v186" stroke="#6a6f7a" stroke-width="2"/>
    <path d="M14 40h172v14H14z" fill="#5a5f6a"/><path d="M30 70h140v12H30z" fill="#5a5f6a"/>
    ${spikes([[14, 40, 200, 18, 5], [186, 40, -20, 18, 5], [30, 70, 200, 14, 5], [170, 70, -20, 14, 5]], '#3a3f4a')}
    <g fill="#e8f2ff" stroke-width="2">${[24, 46, 154, 176].map((x) => `<rect x="${x - 5}" y="26" width="10" height="14" rx="3"/>`).join('')}</g>
    <path d="M18 54Q30 120 6 150M182 54Q170 120 194 150M40 82Q60 140 30 170M160 82Q140 140 170 170" fill="none" stroke="#2a2a33" stroke-width="4"/>
    <rect x="60" y="94" width="80" height="58" rx="8" fill="#6a7080"/><path d="M60 140h80v12H60z" fill="#FFD23F"/><path d="M66 140l8 12M82 140l8 12M98 140l8 12M114 140l8 12M130 140l8 12" stroke-width="3"/>
    ${eye(80, 112, 13, '#FFE45C', 1)}${eye(120, 112, 13, '#FFE45C', -1)}
    <path d="M62 98L94 106M138 98L106 106" stroke-width="5"/>
    ${maw(100, 132, 46, 14, 6, '#2a1a00', '#fff')}
    ${claw(26, 172, 1, 180, '#c3ccd8')}${claw(174, 172, 1, 180, '#c3ccd8')}
    ${bolt('M100 6L94 -2 104 -6 96 -14')}`);

  // 저주받은 오락기: 화면 얼굴에 픽셀 해골, 조이스틱 뿔, 동전 투입구 입, 케이블 촉수
  GMAX_ART.orak = W(`${ground('#B44BFF')}
    <path d="M40 150Q10 150 8 184M160 150Q190 150 192 184M56 170Q40 190 26 196M144 170Q160 190 174 196" fill="none" stroke="#2a2a33" stroke-width="6"/>
    <path d="M42 30L158 30 170 186H30Z" fill="#7a2cff"/><path d="M42 30L30 186M158 30L170 186" stroke-width="3"/>
    <path d="M52 40h96v70H52z" fill="#0b0a1a"/>
    <g fill="#ff3a8a" stroke="none">${[[64, 52], [72, 52], [80, 52], [120, 52], [128, 52], [136, 52], [64, 60], [80, 60], [120, 60], [136, 60], [64, 68], [72, 68], [80, 68], [120, 68], [128, 68], [136, 68], [92, 84], [100, 84], [108, 84], [84, 92], [92, 92], [100, 92], [108, 92], [116, 92], [88, 100], [104, 100], [112, 100]].map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="7"/>`).join('')}</g>
    <g fill="#6CF2C2" stroke="none"><rect x="72" y="60" width="7" height="7"/><rect x="128" y="60" width="7" height="7"/></g>
    <path d="M52 76h96M52 46h96" stroke="#6CF2C2" stroke-width="1" opacity=".5"/>
    ${spikes([[58, 30, -110, 30, 6], [142, 30, -70, 30, 6]], '#2a2a33')}
    <circle cx="56" cy="2" r="9" fill="#E8402C"/><circle cx="144" cy="2" r="9" fill="#E8402C"/>
    <path d="M40 120h120v20H40z" fill="#3a1a6a"/><circle cx="70" cy="130" r="7" fill="#FFD23F"/><circle cx="92" cy="130" r="7" fill="#2EF2FF"/><path d="M130 136v-16" stroke-width="5"/><circle cx="130" cy="118" r="6" fill="#E8402C"/>
    ${maw(100, 162, 56, 22, 7, '#0b0a1a', '#f4ecff')}
    ${claw(14, 186, 1, 160, '#c9a8ff')}${claw(186, 186, 1, 200, '#c9a8ff')}
    ${crack('M44 40L36 60M156 40L166 66', '#ff3a8a', 2.4)}`);

  // 폭풍 방패연 가오리: 가운데 구멍이 거대한 아가리, 연줄은 번개 꼬리
  GMAX_ART.bangpae = W(`${ground('#FFE45C')}
    <path d="M100 6L196 70 160 150 100 186 40 150 4 70Z" fill="#f4f0e0"/>
    <path d="M100 6L100 186M4 70L196 70M40 150L160 150" fill="none" stroke="#a8a090" stroke-width="2.4"/>
    <path d="M100 6L196 70 186 80 100 22 14 80 4 70Z" fill="#E8402C"/><path d="M40 150L100 186 160 150 150 142 100 170 50 142Z" fill="#2340A8"/>
    ${spikes([[4, 70, 180, 22, 6], [196, 70, 0, 22, 6], [40, 150, 150, 18, 5], [160, 150, 30, 18, 5]], '#a8a090')}
    <circle cx="100" cy="100" r="36" fill="#0b0a1a"/>${maw(100, 100, 66, 56, 8, 'none', '#fff6d6')}
    ${eye(62, 58, 13, '#FFE45C', 1)}${eye(138, 58, 13, '#FFE45C', -1)}
    <path d="M44 42L76 54M156 42L124 54" stroke-width="5"/>
    ${crack('M100 186L92 196 106 200 96 210', '#FFE45C', 2.6)}
    ${crack('M18 96L30 110 22 122M182 96L170 110 178 122', '#FFE45C', 2.2)}`);

  // 빙하 빙수 거인: 그릇 몸, 얼음 결정 산맥, 팥 용암 정수리
  GMAX_ART.bingsu = W(`${ground('#7fe7ff')}
    ${spikes([[30, 92, -140, 46, 10], [56, 74, -115, 60, 11], [100, 64, -90, 70, 12], [144, 74, -65, 60, 11], [170, 92, -40, 46, 10]], '#c8f2ff')}
    <path d="M24 96Q100 60 176 96Q170 120 100 124Q30 120 24 96Z" fill="#eafaff"/>
    <path d="M72 70Q100 46 128 70Q114 82 100 78Q86 82 72 70Z" fill="#7a2a3a"/><circle cx="92" cy="66" r="3" fill="#a84a5a" stroke="none"/><circle cx="108" cy="64" r="3" fill="#a84a5a" stroke="none"/>
    <path d="M28 104h144l-18 70H46z" fill="#7fc8ff"/><path d="M28 104h144" stroke-width="5"/><path d="M60 186h80l-6-12H66z" fill="#5aa8e0"/>
    ${eye(74, 128, 14, '#2EF2FF', 1)}${eye(126, 128, 14, '#2EF2FF', -1)}
    <path d="M54 114L88 122M146 114L112 122" stroke-width="5"/>
    ${maw(100, 156, 56, 22, 6, '#123a7a', '#eafaff')}
    ${claw(24, 176, 1, 165, '#eafaff')}${claw(176, 176, 1, 195, '#eafaff')}
    ${crack('M40 108L48 124 40 140M160 108L152 126 162 144', '#2EF2FF', 2.4)}`);

  // 아이스박스 냉동 아가리: 뚜껑이 턱처럼 열리고 고드름 이빨, 냉기 숨결
  GMAX_ART.bonaeng = W(`${ground('#7fe7ff')}
    <path d="M8 24Q40 4 70 20Q50 26 52 40M192 30Q166 8 140 22Q154 28 150 42" fill="none" stroke="#eafaff" stroke-width="6" opacity=".85"/>
    <path d="M30 20L170 20 178 62 22 62Z" fill="#2F7DE1"/><path d="M22 62L178 62" stroke-width="5"/>
    ${spikes([[46, 20, -120, 22, 6], [154, 20, -60, 22, 6]], '#c3ccd8')}
    <path d="M70 6h60v14H70z" fill="#c3ccd8"/>
    <g fill="#eafaff" stroke-width="2">${[36, 56, 76, 96, 116, 136, 156].map((x) => `<path d="M${x - 8} 62L${x} ${88 + (x % 3) * 6}L${x + 8} 62Z"/>`).join('')}</g>
    <path d="M22 104h156l-8 82H30z" fill="#f4f8ff"/><path d="M22 104h156v20H22z" fill="#2F7DE1"/>
    <g fill="#eafaff" stroke-width="2">${[44, 72, 100, 128, 156].map((x) => `<path d="M${x - 9} 104L${x} ${80}L${x + 9} 104Z"/>`).join('')}</g>
    <path d="M40 72Q100 96 160 72Q120 92 100 100Q80 92 40 72Z" fill="#0b2a5a" stroke="none" opacity=".8"/>
    ${eye(70, 140, 14, '#2EF2FF', 1)}${eye(130, 140, 14, '#2EF2FF', -1)}
    <path d="M50 126L86 134M150 126L114 134" stroke-width="5"/>
    <path d="M8 120h16v40H8zM176 120h16v40h-16z" fill="#c3ccd8"/>
    ${claw(18, 186, 1, 170, '#eafaff')}${claw(182, 186, 1, 190, '#eafaff')}
    ${crack('M60 160L72 176M140 160L128 178', '#2EF2FF', 2.2)}`);

  // 독장독 골렘: 금 간 뚜껑 사이로 독이 넘치고, 해골 연기
  GMAX_ART.jangdok = W(`${ground('#9A4FB8')}
    <path d="M60 30Q50 6 70 0Q66 16 80 18Q76 0 96 -4Q90 14 104 18" fill="none" stroke="#b46aff" stroke-width="6" opacity=".9"/><circle cx="130" cy="8" r="9" fill="#b46aff" opacity=".8"/><circle cx="148" cy="22" r="6" fill="#b46aff" opacity=".8"/>
    <path d="M44 44Q100 20 156 44L150 54H50Z" fill="#5a3a22"/><path d="M80 30L96 40 90 52M120 32L110 42 120 52" stroke="#2a1608" stroke-width="2.4" fill="none"/>
    <path d="M50 54Q90 40 150 54Q190 100 160 170Q100 196 40 170Q10 100 50 54Z" fill="#7a4a2a"/>
    <path d="M50 54Q100 70 150 54L150 78Q100 92 50 78Z" fill="#9AE05A"/><path d="M60 78q4 18-2 30M140 78q6 14 0 26M100 86q2 20-4 32" fill="none" stroke="#9AE05A" stroke-width="7"/>
    ${spikes([[22, 110, 190, 26, 8], [26, 140, 170, 24, 8], [178, 110, -10, 26, 8], [174, 140, 10, 24, 8]], '#5a3a22')}
    ${eye(72, 118, 14, '#9AE05A', 1)}${eye(128, 118, 14, '#9AE05A', -1)}
    <path d="M52 104L88 112M148 104L112 112" stroke-width="5"/>
    ${maw(100, 152, 60, 26, 7, '#2a0a3a', '#f0e6d0')}
    ${crack('M40 128L52 144 44 160M160 128L150 146 158 162', '#9AE05A', 2.4)}
    ${claw(30, 184, 1, 175, '#c8a070')}${claw(170, 184, 1, 185, '#c8a070')}`);

  // 맷돌 분쇄거신: 위아래 맷돌이 이빨 달린 턱, 손잡이는 뿔, 바위 주먹
  GMAX_ART.maetdol = W(`${ground('#C9A06A')}
    <path d="M150 40L176 4 186 12 164 46Z" fill="#8a5a2a"/>
    <path d="M30 70Q30 30 100 28Q170 30 170 70L170 86H30Z" fill="#8a8578"/><path d="M30 86h140" stroke-width="5"/>
    <ellipse cx="100" cy="40" rx="14" ry="6" fill="#5a564a"/>
    ${spikes([[40, 40, -140, 24, 7], [70, 30, -110, 26, 7], [130, 30, -70, 26, 7]], '#6a6558')}
    <g fill="#f0eadc" stroke-width="2">${[44, 62, 80, 98, 116, 134, 152].map((x) => `<path d="M${x} 86L${x + 9} 104L${x + 18} 86Z"/>`).join('')}</g>
    <path d="M30 128h140v14Q170 186 100 188Q30 186 30 142Z" fill="#7a7568"/>
    <g fill="#f0eadc" stroke-width="2">${[44, 62, 80, 98, 116, 134, 152].map((x) => `<path d="M${x} 128L${x + 9} 110L${x + 18} 128Z"/>`).join('')}</g>
    <path d="M44 108q56 14 112 0" fill="#3a0a0a" stroke="none" opacity=".7"/>
    ${eye(72, 60, 14, '#ffb347', 1)}${eye(128, 60, 14, '#ffb347', -1)}
    <path d="M50 46L88 54M150 46L112 54" stroke-width="5"/>
    <path d="M30 100Q8 104 6 132L16 150 34 140Z" fill="#8a8578"/><path d="M170 100Q192 104 194 132L184 150 166 140Z" fill="#8a8578"/>
    <circle cx="16" cy="156" r="14" fill="#6a6558"/><circle cx="184" cy="156" r="14" fill="#6a6558"/>
    ${crack('M46 150L60 162 52 178M154 150L140 164 150 180M100 150V170', '#ffb347', 2.4)}`);

  // 장승 수호거신: 하늘 찌르는 기둥 몸, 부릅뜬 눈, 송곳니, 혼불
  GMAX_ART.jangseung = W(`${ground('#B44BFF')}
    <path d="M30 40Q20 20 34 10Q32 26 44 26M170 40Q180 20 166 10Q168 26 156 26" fill="none" stroke="#b46aff" stroke-width="5"/>
    <circle cx="28" cy="70" r="9" fill="#b46aff" opacity=".85"/><circle cx="174" cy="64" r="11" fill="#b46aff" opacity=".85"/><circle cx="20" cy="120" r="6" fill="#b46aff" opacity=".85"/>
    <path d="M58 24Q100 0 142 24L148 62H52Z" fill="#2a1a12"/><path d="M60 36Q100 22 140 36" fill="none" stroke="#E8402C" stroke-width="4"/>
    ${spikes([[64, 24, -120, 24, 6], [100, 10, -90, 26, 6], [136, 24, -60, 24, 6]], '#2a1a12')}
    <path d="M52 62h96l8 132H44z" fill="#a8743a"/><path d="M60 70v120M140 70v120" stroke="#7a4a1a" stroke-width="2.4"/>
    <circle cx="74" cy="92" r="17" fill="#f4ecd8"/><circle cx="126" cy="92" r="17" fill="#f4ecd8"/>
    ${eye(74, 90, 13, '#ff3a4a', 1)}${eye(126, 90, 13, '#ff3a4a', -1)}
    <path d="M50 70L92 80M150 70L108 80" stroke-width="6"/>
    <path d="M92 96L100 126 108 96Z" fill="#c88a4a"/>
    ${maw(100, 146, 64, 26, 6, '#3a0a0a', '#fff6d6')}
    <path d="M74 136L66 168 82 146M126 136L134 168 118 146" fill="#fff6d6" stroke-width="2.4"/>
    <path d="M70 172h60v18H70z" fill="#1a1433" stroke="none" opacity=".25"/>
    <path d="M176 196V60" stroke="#5a3a1a" stroke-width="6"/><path d="M168 64L176 30 184 64Z" fill="#c3ccd8"/>
    ${crack('M56 120L64 140 56 160M144 120L136 142 146 164', '#b46aff', 2.2)}`);
})();

/* ---------- 3차: 선풍이 · 깨비 · 깡통이 · 봉다리 · 맨홀이 · 시궁이 · 빗물받이 · 머카락 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 선풍기 태풍거신: 망 속 날개가 이빨 아가리, 거미 다리 받침, 회오리
  GMAX_ART.fan = W(`${ground('#9fd8ff')}
    <path d="M8 40Q30 10 70 14M192 40Q170 10 130 14M10 120Q4 90 20 70M190 120Q196 90 180 70" fill="none" stroke="#dff2ff" stroke-width="5" opacity=".85"/>
    <path d="M92 120L60 150 30 196M108 120L140 150 170 196M96 124L84 170 70 196M104 124L116 170 130 196" fill="none" stroke="#5a6478" stroke-width="7"/>
    <path d="M92 120L60 150 30 196M108 120L140 150 170 196" fill="none" stroke="#1a1433" stroke-width="2"/>
    <circle cx="100" cy="72" r="66" fill="#c3ccd8"/><circle cx="100" cy="72" r="56" fill="#0b1a3a"/>
    <g fill="#e8f2ff" stroke-width="2">${[0, 60, 120, 180, 240, 300].map((a) => `<path transform="rotate(${a} 100 72)" d="M100 72L92 22Q100 14 108 22Z"/>`).join('')}</g>
    <g fill="none" stroke="#7f8aa0" stroke-width="2">${[0, 30, 60, 90, 120, 150].map((a) => `<path transform="rotate(${a} 100 72)" d="M100 8V136"/>`).join('')}</g>
    ${spikes([[42, 30, -140, 22, 6], [158, 30, -40, 22, 6], [34, 90, 170, 20, 6], [166, 90, 10, 20, 6]], '#7f8aa0')}
    <circle cx="100" cy="72" r="18" fill="#2F7DE1"/>${eye(93, 70, 7, '#2EF2FF', 1)}${eye(107, 70, 7, '#2EF2FF', -1)}
    <path d="M90 82L94 86 98 82 102 86 106 82 110 86" fill="none" stroke="#fff" stroke-width="2"/>
    ${claw(30, 196, 0.9, 180, '#c3ccd8')}${claw(170, 196, 0.9, 180, '#c3ccd8')}`);

  // 대도깨비: 큰 외뿔, 가시 박힌 방망이, 헝클어진 갈기, 송곳니, 도깨비불
  GMAX_ART.kkaebi = W(`${ground('#B44BFF')}
    <path d="M100 4L116 40H84Z" fill="#f4ecd8"/><path d="M60 26L72 50 54 52ZM140 26L128 50 146 52Z" fill="#f4ecd8"/>
    <path d="M40 60Q20 40 30 20Q40 40 56 44Q50 24 66 12Q68 34 80 40M160 60Q180 40 170 20Q160 40 144 44Q150 24 134 12Q132 34 120 40" fill="#4a1a6a"/>
    <path d="M34 70Q34 34 100 34Q166 34 166 70L170 150Q100 176 30 150Z" fill="#3a6ad8"/>
    <path d="M28 70Q16 90 26 110Q14 120 24 140M172 70Q184 90 174 110Q186 120 176 140" fill="none" stroke="#4a1a6a" stroke-width="10"/>
    ${eye(72, 84, 17, '#FFE45C', 1)}${eye(128, 84, 17, '#FFE45C', -1)}
    <path d="M48 62L94 76M152 62L106 76" stroke-width="7"/>
    <path d="M92 96L100 112 108 96Z" fill="#2a4aa8"/>
    ${maw(100, 132, 76, 32, 7, '#3a0a1a', '#fff6d6')}
    <path d="M72 120L64 148 80 128M128 120L136 148 120 128" fill="#fff6d6" stroke-width="2.4"/>
    <path d="M170 196L190 70" stroke="#8a5a2a" stroke-width="16"/><path d="M178 60h26l-6 60h-18z" fill="#8a5a2a" transform="rotate(10 190 90)"/>
    ${spikes([[180, 78, -10, 12, 3], [186, 96, 0, 12, 3], [180, 112, -10, 12, 3], [196, 70, 0, 10, 3]], '#c3ccd8')}
    <g fill="#6CF2C2" opacity=".9"><circle cx="16" cy="92" r="8"/><circle cx="24" cy="170" r="6"/><circle cx="10" cy="40" r="5"/></g>
    ${claw(40, 180, 1, 170, '#f4ecd8')}`);

  // 깡통 고철야수: 찢긴 뚜껑 이빨, 독 슬러지, 따개 뿔
  GMAX_ART.kkangtong = W(`${ground('#9AE05A')}
    <path d="M100 4Q118 4 120 18Q118 28 106 28L104 40H96L94 28Q82 28 80 18Q82 4 100 4Z" fill="#c3ccd8"/><circle cx="100" cy="16" r="5" fill="#1a1433"/>
    <path d="M40 46L50 30 60 46 70 26 80 46 90 32 100 46 110 30 120 46 130 26 140 46 150 32 160 46Z" fill="#dfe6f0"/>
    <path d="M36 46h128l-8 140H44z" fill="#E8402C"/><path d="M38 70h124M40 160h120" stroke="#a82a1a" stroke-width="4"/>
    <path d="M70 46L60 80 76 96 64 120M140 46L148 76 132 90 146 118" fill="none" stroke="#a82a1a" stroke-width="2.4"/>
    <path d="M36 70h128v40H36z" fill="#f4f0e0"/><path d="M60 80h80" stroke="#a82a1a" stroke-width="3"/>
    ${eye(76, 94, 13, '#9AE05A', 1)}${eye(124, 94, 13, '#9AE05A', -1)}
    <path d="M56 80L88 88M144 80L112 88" stroke-width="5"/>
    ${maw(100, 136, 70, 30, 7, '#1a2a08', '#e8f2ff')}
    <path d="M44 160q-6 18 2 30M156 156q8 16 0 32M120 170q2 12-4 22" fill="none" stroke="#9AE05A" stroke-width="8"/>
    ${spikes([[36, 90, 190, 24, 6], [36, 130, 170, 24, 6], [164, 90, -10, 24, 6], [164, 130, 10, 24, 6]], '#a82a1a')}
    ${claw(26, 186, 1, 170, '#dfe6f0')}${claw(174, 186, 1, 190, '#dfe6f0')}`);

  // 비닐봉지 망령: 부푼 봉지 몸, 손잡이 뿔, 매연 꼬리, 늘어난 비닐 이빨
  GMAX_ART.bongdari = W(`${ground('#9A4FB8')}
    <path d="M60 140Q40 170 60 196Q70 170 90 176Q86 190 110 196Q112 176 132 178Q130 192 150 190Q160 160 140 140Z" fill="#6a5a7a" opacity=".85"/>
    <path d="M54 34Q40 0 66 2Q84 4 80 34M146 34Q160 0 134 2Q116 4 120 34" fill="none" stroke="#f4f0f8" stroke-width="10"/>
    <path d="M54 34Q40 0 66 2Q84 4 80 34M146 34Q160 0 134 2Q116 4 120 34" fill="none" stroke="#1a1433" stroke-width="2"/>
    <path d="M44 34Q100 26 156 34Q196 90 170 150Q100 176 30 150Q4 90 44 34Z" fill="#f4f0f8" fill-opacity=".92"/>
    <path d="M60 50Q70 90 56 130M140 50Q132 96 146 134M100 40V70" fill="none" stroke="#c8bcd8" stroke-width="2.4"/>
    ${eye(74, 82, 15, '#c46aff', 1)}${eye(126, 82, 15, '#c46aff', -1)}
    <path d="M52 66L90 76M148 66L110 76" stroke-width="5"/>
    <path d="M60 112Q100 96 140 112Q130 150 100 154Q70 150 60 112Z" fill="#2a0a3a"/>
    <path d="M64 112L72 136 80 112 88 140 96 112 104 140 112 112 120 138 128 112 136 132" fill="none" stroke="#f4f0f8" stroke-width="3"/>
    ${claw(20, 120, 1, 140, '#f4f0f8')}${claw(180, 120, 1, 220, '#f4f0f8')}
    <circle cx="20" cy="40" r="10" fill="#6a5a7a" opacity=".7"/><circle cx="182" cy="30" r="13" fill="#6a5a7a" opacity=".7"/>`);

  // 맨홀 하수거수: 맨홀 뚜껑 얼굴판, 증기, 쇠사슬, 배관 촉수
  GMAX_ART.manhol = W(`${ground('#8a8578')}
    <path d="M30 40Q20 10 40 0Q40 20 54 20M170 40Q180 10 160 0Q160 20 146 20" fill="none" stroke="#e8f2ff" stroke-width="6" opacity=".8"/>
    <path d="M24 196Q10 150 34 120M176 196Q190 150 166 120M50 196Q40 170 56 150M150 196Q160 170 144 150" fill="none" stroke="#5a564a" stroke-width="12"/>
    <path d="M24 196Q10 150 34 120M176 196Q190 150 166 120" fill="none" stroke="#1a1433" stroke-width="2"/>
    <circle cx="100" cy="96" r="76" fill="#4a4a52"/><circle cx="100" cy="96" r="64" fill="#5a5a64"/>
    <g fill="none" stroke="#3a3a42" stroke-width="3">${[-40, -24, -8, 8, 24, 40].map((d) => `<path d="M${60} ${96 + d}H140"/>`).join('')}</g>
    ${spikes([[36, 60, -150, 22, 7], [60, 30, -120, 22, 7], [100, 20, -90, 24, 7], [140, 30, -60, 22, 7], [164, 60, -30, 22, 7]], '#3a3a42')}
    ${eye(74, 84, 15, '#ffb347', 1)}${eye(126, 84, 15, '#ffb347', -1)}
    <path d="M52 68L90 78M148 68L110 78" stroke-width="6"/>
    ${maw(100, 128, 72, 30, 8, '#1a0a0a', '#e8e2d0')}
    <path d="M24 96h-14M176 96h14" stroke-width="5"/><path d="M6 96q-6 20 4 40M194 96q6 20-4 40" fill="none" stroke="#8a8578" stroke-width="5" stroke-dasharray="6 4"/>
    ${crack('M40 120L52 138M160 120L148 140', '#ffb347', 2.2)}`);

  // 시궁쥐 슬러지 괴물: 흘러내리는 독 몸, 여러 개의 눈, 쥐 앞니
  GMAX_ART.sigung = W(`${ground('#6a8a3a')}
    <path d="M20 190Q14 120 40 80Q60 40 100 36Q140 40 160 80Q186 120 180 190Q160 176 146 192Q132 172 118 192Q104 174 92 192Q78 172 64 192Q48 176 34 194Z" fill="#6a7a3a"/>
    <path d="M40 80Q30 120 36 160M160 80Q170 120 164 160" fill="none" stroke="#4a5a22" stroke-width="3"/>
    <path d="M44 56L28 24 60 44ZM156 56L172 24 140 44Z" fill="#8a7a6a"/>
    <g fill="#c8e05a" stroke-width="1.6"><circle cx="58" cy="100" r="6"/><circle cx="146" cy="104" r="5"/><circle cx="70" cy="150" r="4"/><circle cx="138" cy="160" r="5"/></g>
    ${eye(78, 80, 14, '#c8ff3a', 1)}${eye(122, 80, 14, '#c8ff3a', -1)}${eye(100, 58, 9, '#c8ff3a', 1)}
    <path d="M58 64L92 74M142 64L108 74" stroke-width="5"/>
    <path d="M60 110Q100 96 140 110Q132 150 100 154Q68 150 60 110Z" fill="#2a1a08"/>
    <path d="M88 108h11v22H88zM101 108h11v22h-11z" fill="#f0d870"/>
    <path d="M64 112L70 128 76 112M124 112L130 128 136 112" fill="#f4f0e0" stroke-width="2"/>
    <path d="M30 170q-10 10-6 24M170 170q10 10 6 24" fill="none" stroke="#c8e05a" stroke-width="6"/>
    ${claw(30, 196, 1, 180, '#c8b8a0')}${claw(170, 196, 1, 180, '#c8b8a0')}`);

  // 빗물받이 해일 크라켄: 쇠창살 아가리, 물 촉수
  GMAX_ART.batji = W(`${ground('#2F7DE1')}
    ${[[20, 150, -40], [44, 170, -20], [156, 170, 20], [180, 150, 40]].map(([x, y, a]) => `<path d="M${x} ${y}Q${x + a} ${y - 60} ${x - a * 0.4} ${y - 110}" fill="none" stroke="#4aa8ff" stroke-width="13"/><path d="M${x} ${y}Q${x + a} ${y - 60} ${x - a * 0.4} ${y - 110}" fill="none" stroke="#1a1433" stroke-width="2"/>`).join('')}
    <path d="M30 60h140l10 126H20z" fill="#5a6478"/><path d="M30 60h140v16H30z" fill="#3a4250"/>
    ${spikes([[40, 60, -130, 22, 6], [70, 60, -100, 24, 6], [130, 60, -80, 24, 6], [160, 60, -50, 22, 6]], '#3a4250')}
    ${eye(72, 92, 14, '#2EF2FF', 1)}${eye(128, 92, 14, '#2EF2FF', -1)}
    <path d="M50 76L88 86M150 76L112 86" stroke-width="5"/>
    <path d="M36 112h128l-6 64H42z" fill="#0b1a3a"/>
    <g fill="#c3ccd8" stroke-width="2">${[46, 62, 78, 94, 110, 126, 142].map((x) => `<path d="M${x} 112h8v52l-4 10-4-10z"/>`).join('')}</g>
    <path d="M44 172q20-8 40 0t40 0 32 0" fill="none" stroke="#4aa8ff" stroke-width="4"/>
    ${crack('M34 140L24 160M166 140L176 160', '#2EF2FF', 2.4)}`);

  // 머리카락 원령: 거대한 머리카락 덩어리, 갈라진 틈 사이 외눈, 붙잡는 머리채
  GMAX_ART.meokarak = W(`${ground('#9A4FB8')}
    ${[[20, 196, 40, 120], [6, 150, 40, 100], [180, 196, 160, 120], [194, 150, 160, 100], [60, 198, 70, 150], [140, 198, 130, 150]].map(([x1, y1, x2, y2]) => `<path d="M${x2} ${y2}Q${(x1 + x2) / 2 + 14} ${(y1 + y2) / 2} ${x1} ${y1}" fill="none" stroke="#1a1020" stroke-width="7"/>`).join('')}
    <path d="M100 14Q160 14 176 70Q194 120 160 160Q130 184 100 176Q70 184 40 160Q6 120 24 70Q40 14 100 14Z" fill="#1a1020"/>
    <path d="M60 30Q50 80 64 130M84 20Q76 70 90 120M116 20Q124 70 110 120M140 30Q150 80 136 130M40 60Q36 110 54 150M160 60Q164 110 146 150" fill="none" stroke="#3a2a40" stroke-width="3"/>
    <path d="M62 74Q100 50 138 74Q132 104 100 108Q68 104 62 74Z" fill="#f4ecff"/>${eye(100, 78, 26, '#c46aff', 1)}
    <path d="M58 62L100 74 142 62" fill="none" stroke-width="6"/>
    <path d="M70 128Q100 118 130 128Q122 152 100 154Q78 152 70 128Z" fill="#5a0f1e"/>
    <path d="M74 130L80 142 86 130 92 144 98 130 104 144 110 130 116 142 122 130 126 138" fill="none" stroke="#f4ecff" stroke-width="2.4"/>
    ${claw(16, 112, 1, 140, '#d8c8e0')}${claw(184, 112, 1, 220, '#d8c8e0')}
    <g fill="#b46aff" opacity=".85"><circle cx="20" cy="40" r="7"/><circle cx="180" cy="34" r="8"/></g>`);
})();

/* ---------- 4차: 뚫어뻥 · 떡뽀끼 · 순대장 · 어묵이 · 호떡이 · 뻔데기 · 네온나 · 연지 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 뚫어뻥 흡착거수: 고무컵이 거대한 빨판 아가리, 자루 등뼈 가시
  GMAX_ART.ppeong = W(`${ground('#2F7DE1')}
    <path d="M92 4h16v90H92z" fill="#a8743a"/>${spikes([[92, 20, 190, 18, 5], [92, 44, 190, 18, 5], [92, 68, 190, 18, 5], [108, 32, -10, 18, 5], [108, 56, -10, 18, 5], [108, 80, -10, 18, 5]], '#7a4a1a')}
    <path d="M24 186Q14 110 100 88Q186 110 176 186Z" fill="#c8202a"/><path d="M40 120Q100 100 160 120" fill="none" stroke="#8a1018" stroke-width="3"/>
    <ellipse cx="100" cy="176" rx="72" ry="16" fill="#8a1018"/>
    <ellipse cx="100" cy="160" rx="54" ry="24" fill="#2a0a0a"/>${maw(100, 160, 96, 40, 9, 'none', '#f4ecd8')}
    ${eye(70, 128, 13, '#2EF2FF', 1)}${eye(130, 128, 13, '#2EF2FF', -1)}
    <path d="M50 114L86 122M150 114L114 122" stroke-width="5"/>
    <path d="M10 190q20-14 40-4M150 186q20-12 42 4" fill="none" stroke="#4aa8ff" stroke-width="6"/>
    <g fill="#4aa8ff" stroke-width="1.6"><circle cx="18" cy="160" r="5"/><circle cx="184" cy="150" r="6"/><circle cx="30" cy="140" r="3.5"/></g>`);

  // 떡볶이 용암뱀: 떡 마디로 된 뱀 몸, 끓는 소스, 어묵 지느러미
  GMAX_ART.tteokppo = W(`${ground('#E8402C')}
    <path d="M10 186Q40 150 30 120" fill="none" stroke="#E8402C" stroke-width="30"/>
    ${[[30, 176], [34, 150], [36, 124], [48, 100], [66, 82], [90, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="13" fill="#f4e8d8"/>`).join('')}
    <path d="M14 196Q100 160 186 196Z" fill="#c8202a"/>
    <path d="M70 70Q100 30 150 44Q190 60 186 104Q178 140 136 140Q96 138 84 104Z" fill="#f4e8d8"/>
    <path d="M84 104Q120 120 170 110" fill="none" stroke="#d8c8b0" stroke-width="2.4"/>
    <path d="M140 40L160 4 172 40ZM110 44L114 10 130 40Z" fill="#d8a24a"/><path d="M146 30L162 14M118 34L120 18" stroke-width="2"/>
    <path d="M70 70Q100 60 120 80Q100 76 80 92Z" fill="#E8402C" stroke="none" opacity=".85"/>
    ${eye(128, 76, 13, '#FFD23F', 1)}${eye(166, 80, 11, '#FFD23F', -1)}
    <path d="M112 62L142 70M182 66L156 72" stroke-width="5"/>
    ${maw(146, 116, 60, 26, 6, '#5a0a0a', '#fff6e0')}
    <path d="M120 128q-4 14 2 24M170 126q4 12-2 22" fill="none" stroke="#E8402C" stroke-width="5"/>
    <path d="M40 40Q30 20 44 8Q42 24 54 26M180 30Q194 16 186 2" fill="none" stroke="#ffb0a0" stroke-width="4" opacity=".8"/>`);

  // 순대 대지렁이: 마디진 순대 몸을 일으키고, 칠성장어 같은 원형 이빨 입
  GMAX_ART.sundae = W(`${ground('#8a5a3a')}
    <path d="M20 196Q30 150 70 150Q40 140 50 100Q60 60 100 50" fill="none" stroke="#3a1a2a" stroke-width="44"/>
    <path d="M20 196Q30 150 70 150Q40 140 50 100Q60 60 100 50" fill="none" stroke="#5a2a3a" stroke-width="36"/>
    ${[[26, 176], [44, 152], [56, 128], [52, 104], [62, 80], [80, 62]].map(([x, y]) => `<path d="M${x - 16} ${y - 4}Q${x} ${y + 8} ${x + 16} ${y - 4}" fill="none" stroke="#3a1a2a" stroke-width="3"/>`).join('')}
    <g fill="#a8506a" stroke="none">${[[30, 170], [48, 140], [60, 112], [70, 86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join('')}</g>
    <circle cx="128" cy="70" r="58" fill="#5a2a3a"/><circle cx="128" cy="70" r="42" fill="#2a0a14"/>
    <g fill="#f4e8d8" stroke-width="1.8">${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const x = 128 + Math.cos(a) * 42, y = 70 + Math.sin(a) * 42; const x2 = 128 + Math.cos(a) * 26, y2 = 70 + Math.sin(a) * 26; const n = 0.18; return `<path d="M${(128 + Math.cos(a - n) * 42).toFixed(1)} ${(70 + Math.sin(a - n) * 42).toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}L${(128 + Math.cos(a + n) * 42).toFixed(1)} ${(70 + Math.sin(a + n) * 42).toFixed(1)}Z"/>`; }).join('')}</g>
    <g fill="#f4e8d8" stroke-width="1.4">${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 + 0.3; return `<path d="M${(128 + Math.cos(a - 0.25) * 22).toFixed(1)} ${(70 + Math.sin(a - 0.25) * 22).toFixed(1)}L${(128 + Math.cos(a) * 10).toFixed(1)} ${(70 + Math.sin(a) * 10).toFixed(1)}L${(128 + Math.cos(a + 0.25) * 22).toFixed(1)} ${(70 + Math.sin(a + 0.25) * 22).toFixed(1)}Z"/>`; }).join('')}</g>
    ${eye(84, 34, 11, '#c8ff3a', 1)}${eye(172, 34, 11, '#c8ff3a', -1)}
    ${spikes([[100, 20, -110, 20, 5], [128, 12, -90, 22, 5], [156, 20, -70, 20, 5]], '#3a1a2a')}
    <path d="M150 140q10 20 30 22M172 120q16 10 22 30" fill="none" stroke="#9AE05A" stroke-width="5"/>`);

  // 어묵 꼬치 크라켄: 거대한 꼬치 창에 꿰인 어묵이 촉수처럼, 국물 김
  GMAX_ART.eomuk = W(`${ground('#ff7a2a')}
    <path d="M100 -4L94 20H106Z" fill="#c3ccd8"/><path d="M100 18V196" stroke="#a8743a" stroke-width="8"/>
    ${[[-1, 60], [1, 92], [-1, 124], [1, 156]].map(([d, y]) => `<path d="M100 ${y}Q${100 + d * 40} ${y - 20} ${100 + d * 70} ${y + 4}Q${100 + d * 86} ${y + 20} ${100 + d * 96} ${y + 2}" fill="none" stroke="#e8c27a" stroke-width="18"/><path d="M100 ${y}Q${100 + d * 40} ${y - 20} ${100 + d * 70} ${y + 4}Q${100 + d * 86} ${y + 20} ${100 + d * 96} ${y + 2}" fill="none" stroke="#1a1433" stroke-width="2" stroke-dasharray="4 10"/>`).join('')}
    <path d="M56 40Q60 20 100 22Q140 20 144 40L150 110Q100 124 50 110Z" fill="#f0d090"/><path d="M50 60Q100 74 150 60M52 84Q100 98 148 84" fill="none" stroke="#c8a060" stroke-width="3"/>
    ${eye(80, 56, 13, '#ff7a2a', 1)}${eye(120, 56, 13, '#ff7a2a', -1)}
    <path d="M60 42L92 50M140 42L108 50" stroke-width="5"/>
    ${maw(100, 92, 60, 24, 7, '#3a1a08', '#fff6e0')}
    <path d="M30 30Q20 10 36 0M170 26Q182 8 168 -4M60 14Q56 0 66 -8" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>
    <path d="M30 196Q100 176 170 196" fill="#c8741e" stroke="none" opacity=".6"/>`);

  // 호떡 용암원반: 갈라진 호떡 사이로 녹은 흑설탕, 뒤집개 발톱
  GMAX_ART.hotteok = W(`${ground('#ff7a2a')}
    ${spikes([[20, 100, 180, 26, 9], [36, 56, -140, 26, 9], [100, 30, -90, 28, 9], [164, 56, -40, 26, 9], [180, 100, 0, 26, 9]], '#a8641e')}
    <ellipse cx="100" cy="104" rx="86" ry="72" fill="#d9944a"/><ellipse cx="100" cy="100" rx="74" ry="60" fill="#e8aa5a"/>
    <path d="M40 80Q60 70 70 86M140 72Q150 60 166 74M60 140Q76 150 90 140" fill="none" stroke="#a8641e" stroke-width="3"/>
    ${crack('M44 104L62 110 56 126 74 136M156 100L140 112 150 128 130 140M100 40L96 56 106 66', '#ff6a1c', 3.4)}
    <path d="M58 116q-2 10 2 18M144 120q2 12-4 18" fill="none" stroke="#5a2a08" stroke-width="5"/>
    ${eye(74, 86, 15, '#FFD23F', 1)}${eye(126, 86, 15, '#FFD23F', -1)}
    <path d="M52 68L92 80M148 68L108 80" stroke-width="5"/>
    ${maw(100, 132, 72, 30, 7, '#5a1a08', '#fff6e0')}
    <path d="M100 146q-6 18 0 32" fill="none" stroke="#ff6a1c" stroke-width="8"/>
    <path d="M10 160L30 140 40 150 20 170ZM190 160L170 140 160 150 180 170Z" fill="#c3ccd8"/><path d="M30 140L48 120M170 140L152 120" stroke="#5a3a1a" stroke-width="6"/>`);

  // 번데기 나방괴수: 갈라진 번데기에서 독 나방 날개가 펼쳐짐, 큰 턱
  GMAX_ART.ppeondegi = W(`${ground('#9AE05A')}
    <path d="M90 70Q20 0 6 40Q0 90 60 110Q10 130 24 176Q60 190 92 130Z" fill="#6a8a2a"/><path d="M110 70Q180 0 194 40Q200 90 140 110Q190 130 176 176Q140 190 108 130Z" fill="#6a8a2a"/>
    <path d="M86 76Q40 30 24 50Q20 84 70 100M114 76Q160 30 176 50Q180 84 130 100" fill="none" stroke="#c8e05a" stroke-width="3"/>
    <circle cx="40" cy="62" r="12" fill="#c46aff"/><circle cx="160" cy="62" r="12" fill="#c46aff"/>${eye(40, 62, 8, '#FFD23F', 1)}${eye(160, 62, 8, '#FFD23F', -1)}
    <path d="M100 40Q130 46 132 90Q134 150 100 186Q66 150 68 90Q70 46 100 40Z" fill="#8a5a2a"/>
    ${[60, 80, 100, 120, 140, 160].map((y) => `<path d="M${70 + Math.abs(y - 100) * 0.1} ${y}Q100 ${y + 8} ${130 - Math.abs(y - 100) * 0.1} ${y}" fill="none" stroke="#5a3a1a" stroke-width="3"/>`).join('')}
    ${crack('M84 120L96 132 88 148M116 116L106 130 114 144', '#c8ff3a', 2.4)}
    ${eye(88, 64, 9, '#c8ff3a', 1)}${eye(112, 64, 9, '#c8ff3a', -1)}
    <path d="M86 84Q72 96 80 108L92 94ZM114 84Q128 96 120 108L108 94Z" fill="#f0e6c8"/>
    <path d="M92 40Q80 10 66 8M108 40Q120 10 134 8" fill="none" stroke-width="3"/><circle cx="66" cy="8" r="4" fill="#c8e05a"/><circle cx="134" cy="8" r="4" fill="#c8e05a"/>`);

  // 네온 사이렌: 네온관이 날개와 머리카락, 글리치 얼굴, 간판 틀
  GMAX_ART.neonna = W(`${ground('#ff3e9a')}
    <path d="M90 60Q30 10 8 50Q30 60 20 90Q50 80 70 100Z" fill="none" stroke="#ff3e9a" stroke-width="7"/><path d="M110 60Q170 10 192 50Q170 60 180 90Q150 80 130 100Z" fill="none" stroke="#2EF2FF" stroke-width="7"/>
    <path d="M90 60Q30 10 8 50Q30 60 20 90Q50 80 70 100Z" fill="none" stroke="#fff" stroke-width="2"/><path d="M110 60Q170 10 192 50Q170 60 180 90Q150 80 130 100Z" fill="none" stroke="#fff" stroke-width="2"/>
    <rect x="44" y="96" width="112" height="90" rx="10" fill="#14102a"/><rect x="52" y="104" width="96" height="74" rx="6" fill="none" stroke="#FFE45C" stroke-width="4"/>
    <path d="M60 196V186M140 196V186" stroke-width="6"/>
    <path d="M100 14Q140 14 142 56Q140 92 100 96Q60 92 58 56Q60 14 100 14Z" fill="#2a1a4a"/>
    <path d="M60 50Q50 10 100 8Q150 10 140 50Q130 30 116 26Q120 40 104 30Q90 40 92 26Q70 30 60 50Z" fill="none" stroke="#ff3e9a" stroke-width="5"/>
    ${eye(84, 54, 12, '#2EF2FF', 1)}${eye(116, 54, 12, '#2EF2FF', -1)}
    <path d="M66 42L94 50M134 42L106 50" stroke-width="4"/>
    ${maw(100, 78, 40, 16, 6, '#3a0a2a', '#fff')}
    <text x="100" y="152" text-anchor="middle" font-family="'Black Han Sans',sans-serif" font-size="30" fill="#ff3e9a" stroke="#fff" stroke-width="1">OPEN</text>
    <path d="M44 120h-10M156 120h10M30 120l-8 10M170 120l8 10" stroke="#FFE45C" stroke-width="3"/>`);

  // 연지 원령나비 여왕: 한복 소매가 거대한 나비 날개로, 연지 곤지가 불타는 눈처럼
  GMAX_ART.yeonji = W(`${ground('#ff6aa8')}
    <path d="M86 70Q10 -6 4 60Q2 110 70 120Q20 140 30 186Q70 196 92 140Z" fill="#ff8ac0"/><path d="M114 70Q190 -6 196 60Q198 110 130 120Q180 140 170 186Q130 196 108 140Z" fill="#ff8ac0"/>
    <path d="M80 76Q30 30 18 60Q14 96 66 110M120 76Q170 30 182 60Q186 96 134 110" fill="none" stroke="#c84a8a" stroke-width="3"/>
    <g fill="#E8402C" stroke-width="2"><circle cx="40" cy="70" r="10"/><circle cx="160" cy="70" r="10"/><circle cx="50" cy="160" r="8"/><circle cx="150" cy="160" r="8"/></g>
    <path d="M70 112Q100 100 130 112L146 190H54Z" fill="#2a2a6a"/><path d="M70 112Q100 132 130 112" fill="none" stroke="#E8402C" stroke-width="6"/>
    <path d="M100 30Q126 30 128 62Q126 94 100 98Q74 94 72 62Q74 30 100 30Z" fill="#f4e6ec"/>
    <path d="M70 52Q72 18 100 16Q128 18 130 52Q118 34 100 34Q82 34 70 52Z" fill="#1a1020"/><path d="M100 16V2" stroke-width="5"/><circle cx="100" cy="0" r="6" fill="#FFD23F"/>
    ${eye(88, 60, 10, '#E8402C', 1)}${eye(112, 60, 10, '#E8402C', -1)}
    <circle cx="80" cy="76" r="5" fill="#E8402C" stroke="none"/><circle cx="120" cy="76" r="5" fill="#E8402C" stroke="none"/><circle cx="100" cy="44" r="4" fill="#E8402C" stroke="none"/>
    ${maw(100, 84, 26, 10, 5, '#5a0a1e', '#fff')}
    <path d="M56 70Q60 40 70 30M144 70Q140 40 130 30" fill="none" stroke="#b46aff" stroke-width="3" opacity=".8"/>`);
})();

/* ---------- 5차: 자판봇 · 배달봇 · 세탁봇 · 고드리 · 양머리 · 담쟁전 · 뽀글이 · 황사리 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 자판기 요새: 상품 칸이 빛나는 이빨 줄, 동전 투입구 눈, 캔 발사 팔
  GMAX_ART.jabanbot = W(`${ground('#E8402C')}
    <path d="M34 80L8 70 4 96 30 104M166 80L192 70 196 96 170 104" fill="#7f8aa0"/><path d="M0 64h14v10H0zM186 64h14v10h-14z" fill="#E8402C"/>
    <path d="M4 96L2 130h20l8-26M196 96l2 34h-20l-8-26" fill="#5a6478"/><circle cx="12" cy="136" r="8" fill="#FFD23F"/><circle cx="188" cy="136" r="8" fill="#2EF2FF"/>
    <rect x="34" y="14" width="132" height="176" rx="10" fill="#c8202a"/><rect x="44" y="24" width="112" height="22" rx="4" fill="#14102a"/>
    ${spikes([[50, 14, -110, 20, 5], [100, 14, -90, 22, 5], [150, 14, -70, 20, 5]], '#8a1018')}
    ${eye(72, 34, 9, '#FFE45C', 1)}${eye(128, 34, 9, '#FFE45C', -1)}
    <rect x="44" y="54" width="112" height="72" rx="4" fill="#0b1a3a"/>
    <g stroke-width="1.6">${[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => `<path d="M${50 + c * 21} ${60 + r * 22}h14v16h-14z" fill="${['#FFD23F', '#2EF2FF', '#ff3e9a', '#9AE05A', '#ff7a2a'][(r + c) % 5]}"/>`).join('')).join('')}</g>
    ${maw(100, 152, 92, 28, 8, '#0b0a1a', '#f4f8ff')}
    <rect x="128" y="168" width="20" height="10" rx="2" fill="#FFD23F"/>
    <path d="M44 188v8h28v-8M128 188v8h28v-8" fill="#5a6478"/>`);

  // 로켓 배달기사: 투구 바이저, 제트 분사, 배달통 미사일 포드, 가시 무한궤도
  GMAX_ART.baedalbot = W(`${ground('#9fd8ff')}
    <path d="M40 120L14 196M160 120L186 196" fill="none" stroke="#ff7a2a" stroke-width="12" opacity=".7"/><path d="M40 120L24 180M160 120L176 180" fill="none" stroke="#FFE45C" stroke-width="5"/>
    <rect x="22" y="56" width="44" height="64" rx="6" fill="#E8402C"/><rect x="134" y="56" width="44" height="64" rx="6" fill="#E8402C"/>
    <g fill="#c3ccd8" stroke-width="2">${[[30, 66], [46, 66], [30, 88], [46, 88], [142, 66], [158, 66], [142, 88], [158, 88]].map(([x, y]) => `<path d="M${x} ${y + 14}V${y + 4}L${x + 6} ${y - 2}L${x + 12} ${y + 4}V${y + 14}Z"/>`).join('')}</g>
    <path d="M56 70Q56 20 100 18Q144 20 144 70V130Q100 146 56 130Z" fill="#f4b23a"/>
    <path d="M62 52Q100 34 138 52L134 82Q100 92 66 82Z" fill="#14102a"/>
    ${eye(84, 66, 11, '#2EF2FF', 1)}${eye(116, 66, 11, '#2EF2FF', -1)}
    ${spikes([[70, 22, -120, 24, 6], [100, 16, -90, 26, 6], [130, 22, -60, 24, 6]], '#c8202a')}
    ${maw(100, 110, 56, 22, 7, '#2a1a00', '#fff')}
    <path d="M40 150h120l10 30H30z" fill="#3a3f4a"/>${spikes([[40, 180, 100, 14, 5], [70, 182, 90, 14, 5], [100, 182, 90, 14, 5], [130, 182, 90, 14, 5], [160, 180, 80, 14, 5]], '#c3ccd8')}
    <circle cx="52" cy="166" r="10" fill="#c3ccd8"/><circle cx="100" cy="166" r="10" fill="#c3ccd8"/><circle cx="148" cy="166" r="10" fill="#c3ccd8"/>`);

  // 세탁기 소용돌이 거신: 문짝이 회오리 눈 아가리, 호스 촉수, 거품
  GMAX_ART.setakbot = W(`${ground('#2F7DE1')}
    <path d="M30 120Q4 120 8 160Q14 186 30 190M170 120Q196 120 192 160Q186 186 170 190" fill="none" stroke="#9aa7b8" stroke-width="12"/><path d="M30 120Q4 120 8 160Q14 186 30 190M170 120Q196 120 192 160Q186 186 170 190" fill="none" stroke="#1a1433" stroke-width="2" stroke-dasharray="3 6"/>
    ${claw(30, 194, 1, 180, '#dfe6f0')}${claw(170, 194, 1, 180, '#dfe6f0')}
    <rect x="30" y="20" width="140" height="160" rx="14" fill="#e8eef6"/><rect x="30" y="20" width="140" height="34" rx="10" fill="#c3ccd8"/>
    ${spikes([[42, 20, -120, 20, 6], [158, 20, -60, 20, 6]], '#7f8aa0')}
    ${eye(70, 36, 9, '#2EF2FF', 1)}${eye(130, 36, 9, '#2EF2FF', -1)}
    <circle cx="100" cy="116" r="56" fill="#7f8aa0"/><circle cx="100" cy="116" r="44" fill="#0b2a5a"/>
    <path d="M100 116m-36 0a36 36 0 1 0 36 -36M100 116m-22 0a22 22 0 1 1 22 22M100 116m-10 0a10 10 0 1 0 10 -10" fill="none" stroke="#6fd7ff" stroke-width="4"/>
    <g fill="#f4f8ff" stroke-width="1.8">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${(100 + Math.cos(a - 0.2) * 44).toFixed(1)} ${(116 + Math.sin(a - 0.2) * 44).toFixed(1)}L${(100 + Math.cos(a) * 30).toFixed(1)} ${(116 + Math.sin(a) * 30).toFixed(1)}L${(100 + Math.cos(a + 0.2) * 44).toFixed(1)} ${(116 + Math.sin(a + 0.2) * 44).toFixed(1)}Z"/>`; }).join('')}</g>
    <g fill="#f4f8ff" opacity=".95"><circle cx="40" cy="70" r="10"/><circle cx="160" cy="74" r="8"/><circle cx="150" cy="170" r="9"/><circle cx="20" cy="40" r="7"/><circle cx="182" cy="40" r="9"/></g>`);

  // 빙하 원령: 거대한 고드름 몸, 해골 같은 얼굴, 얼음 왕관, 서리 꼬리
  GMAX_ART.godeuri = W(`${ground('#7fe7ff')}
    <path d="M60 150Q20 170 10 196Q40 180 70 186M140 150Q180 170 190 196Q160 180 130 186" fill="#c8f2ff" opacity=".8"/>
    ${spikes([[40, 40, -130, 30, 8], [64, 24, -105, 38, 8], [100, 18, -90, 44, 9], [136, 24, -75, 38, 8], [160, 40, -50, 30, 8]], '#eafaff')}
    <path d="M24 40Q100 20 176 40L150 60 100 200 50 60Z" fill="#a8e8ff"/><path d="M24 40Q100 20 176 40L170 50Q100 34 30 50Z" fill="#14102a"/>
    <path d="M60 60L100 190M140 60L100 190M80 60L100 150M120 60L100 150" fill="none" stroke="#6fc8f0" stroke-width="2.4"/>
    <path d="M62 66Q100 52 138 66Q136 108 100 116Q64 108 62 66Z" fill="#eafaff"/>
    ${eye(84, 80, 12, '#2EF2FF', 1, '#0b2a5a')}${eye(116, 80, 12, '#2EF2FF', -1, '#0b2a5a')}
    <path d="M66 66L94 74M134 66L106 74" stroke-width="5"/>
    <path d="M84 100h32" stroke-width="3"/><path d="M86 100v8M94 100v10M102 100v10M110 100v8" stroke-width="2"/>
    ${crack('M70 130L80 146M130 130L120 148', '#2EF2FF', 2.2)}
    <g fill="#eafaff" opacity=".9"><circle cx="20" cy="100" r="4"/><circle cx="180" cy="110" r="5"/><circle cx="30" cy="140" r="3"/></g>`);

  // 찜질방 화염빙결 숫양: 수건 머리가 거대한 숫양 뿔, 반은 불 반은 얼음
  GMAX_ART.yangmeori = W(`${ground('#ff7a2a')}
    <path d="M58 60Q10 40 14 90Q18 130 56 122Q30 110 34 88Q40 66 64 80Z" fill="#f4ecdc"/><path d="M142 60Q190 40 186 90Q182 130 144 122Q170 110 166 88Q160 66 136 80Z" fill="#f4ecdc"/>
    <path d="M30 70Q20 90 30 106M170 70Q180 90 170 106" fill="none" stroke="#c8b898" stroke-width="3"/>
    <path d="M36 196Q36 120 100 116Q164 120 164 196Z" fill="#ff7a2a"/><path d="M100 116V196" stroke-width="3"/><path d="M100 116Q164 120 164 196H100Z" fill="#7fc8ff"/>
    <path d="M100 30Q146 30 150 80Q146 126 100 130Q54 126 50 80Q54 30 100 30Z" fill="#f4c8a8"/>
    <path d="M56 56Q60 20 100 18Q140 20 144 56Q130 40 100 40Q70 40 56 56Z" fill="#f4ecdc"/>
    ${eye(80, 78, 13, '#ff3a1c', 1)}${eye(120, 78, 13, '#2EF2FF', -1)}
    <path d="M60 62L94 72M140 62L106 72" stroke-width="5"/>
    ${maw(100, 110, 50, 20, 6, '#5a1a08', '#fff')}
    <path d="M30 150Q20 130 34 116M170 150Q182 132 168 116" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/>
    ${spikes([[60, 160, 200, 16, 5], [140, 160, -20, 16, 5]], '#eafaff')}
    <path d="M22 176Q14 160 26 150Q24 166 34 168ZM178 176Q186 160 174 150Q176 166 166 168Z" fill="#ffb347"/>`);

  // 덩굴 변압기 거수: 담쟁이 덩굴 채찍, 고압 경고, 스파크
  GMAX_ART.damjaengjeon = W(`${ground('#9AE05A')}
    ${[[40, 60, 8, 20], [30, 120, 0, 150], [160, 60, 192, 20], [170, 120, 200, 150]].map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 30} ${x2} ${y2}" fill="none" stroke="#3FA34D" stroke-width="8"/><path d="M${x1} ${y1}Q${(x1 + x2) / 2} ${(y1 + y2) / 2 - 30} ${x2} ${y2}" fill="none" stroke="#1a1433" stroke-width="1.6"/>`).join('')}
    <g fill="#5ac85a" stroke-width="2">${[[14, 30], [24, 140], [186, 30], [190, 140], [30, 84], [172, 84]].map(([x, y]) => `<path d="M${x} ${y}q10-12 18 0q-8 12-18 0z"/>`).join('')}</g>
    <rect x="40" y="30" width="120" height="156" rx="8" fill="#7f8aa0"/><path d="M40 30h120v18H40z" fill="#5a6478"/>
    ${spikes([[50, 30, -110, 22, 6], [100, 30, -90, 26, 6], [150, 30, -70, 22, 6]], '#5a6478')}
    <path d="M48 40Q70 80 52 120Q70 150 56 182M152 40Q130 90 148 130Q132 160 146 182" fill="none" stroke="#3FA34D" stroke-width="6"/>
    ${eye(78, 78, 14, '#FFE45C', 1)}${eye(122, 78, 14, '#FFE45C', -1)}
    <path d="M58 62L92 70M142 62L108 70" stroke-width="5"/>
    ${maw(100, 124, 70, 30, 7, '#0b1a08', '#f4f8ff')}
    <path d="M86 150L100 140 114 150 100 176Z" fill="#FFD23F"/><path d="M100 146l-5 12h8l-6 12" fill="none" stroke-width="2.4"/>
    ${crack('M160 100L178 92 172 110 190 104M40 100L22 92 28 110 10 104', '#FFE45C', 2.6)}`);

  // 거품 히드라: 커다란 비누방울 몸, 거품 눈 여럿, 리본 날개, 거품 이빨
  GMAX_ART.ppogeuri = W(`${ground('#ff8ac0')}
    <path d="M100 40Q40 0 20 40Q40 50 30 74Q60 60 88 70ZM100 40Q160 0 180 40Q160 50 170 74Q140 60 112 70Z" fill="#7dff9a"/><circle cx="100" cy="46" r="10" fill="#5ac87a"/>
    <circle cx="100" cy="118" r="76" fill="#f4e8ff" fill-opacity=".85"/><path d="M48 80Q60 60 84 56" fill="none" stroke="#fff" stroke-width="6" opacity=".9"/>
    ${[[40, 150, 14], [164, 140, 16], [30, 100, 10], [176, 92, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#c8f0ff" fill-opacity=".9"/>${eye(x, y - 1, r * 0.7, '#ff3e9a', x < 100 ? 1 : -1)}`).join('')}
    ${eye(78, 104, 16, '#ff3e9a', 1)}${eye(122, 104, 16, '#ff3e9a', -1)}
    <path d="M54 86L94 98M146 86L106 98" stroke-width="5"/>
    ${maw(100, 146, 76, 34, 8, '#3a0a3a', '#fff')}
    <g fill="#c8f0ff" fill-opacity=".9" stroke-width="2"><circle cx="20" cy="190" r="6"/><circle cx="180" cy="186" r="8"/><circle cx="60" cy="196" r="4"/></g>`);

  // 황사 폭풍거인: 소용돌이 먼지 몸, 방진 마스크 얼굴, 모래 회오리 팔
  GMAX_ART.hwangsari = W(`${ground('#d8b25a')}
    <path d="M30 40Q4 80 30 120Q10 150 30 186M170 40Q196 80 170 120Q190 150 170 186" fill="none" stroke="#e8c27a" stroke-width="12" opacity=".8"/>
    <path d="M30 40Q4 80 30 120Q10 150 30 186M170 40Q196 80 170 120Q190 150 170 186" fill="none" stroke="#a8843a" stroke-width="2.4" stroke-dasharray="8 6"/>
    <path d="M100 10Q160 10 170 60Q186 100 160 140Q150 186 100 190Q50 186 40 140Q14 100 30 60Q40 10 100 10Z" fill="#c8963a"/>
    <path d="M50 50Q100 30 150 50M40 90Q100 70 160 90M44 130Q100 110 156 130M60 166Q100 150 140 166" fill="none" stroke="#a8742a" stroke-width="4"/>
    <g fill="#e8c27a" stroke="none">${[[40, 70], [160, 76], [50, 160], [150, 160], [100, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"/>`).join('')}</g>
    ${eye(76, 76, 14, '#ffb347', 1)}${eye(124, 76, 14, '#ffb347', -1)}
    <path d="M54 60L90 70M146 60L110 70" stroke-width="5"/>
    <path d="M60 96Q100 86 140 96L134 136Q100 150 66 136Z" fill="#f4f0e0"/><path d="M60 100L36 92M140 100L164 92" stroke-width="3"/>
    <path d="M74 110h52M74 122h52" stroke="#c8c0a8" stroke-width="3"/>
    <path d="M70 136L76 150 82 138 88 152 94 138 100 152 106 138 112 152 118 138 124 150 130 136" fill="#f4f0e0" stroke-width="2"/>`);
})();

/* ---------- 6차: 하르모니움 · 환생트럭 · 말랑왕 · 성검바위 · 마도서 · 미믹 · 맴맴이 · 왱왱이 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;
  const spk = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2a33"/><circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="#4a4a5a"/><circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="#b46aff"/>`;

  // 하르모니움 공연장 거신: 스피커 벽 몸, 음파 고리, 서브우퍼 아가리
  GMAX_ART.harmonium = W(`${ground('#B44BFF')}
    <path d="M10 60Q0 100 10 140M190 60Q200 100 190 140M24 70Q16 100 24 130M176 70Q184 100 176 130" fill="none" stroke="#c46aff" stroke-width="4"/>
    <rect x="30" y="20" width="140" height="170" rx="8" fill="#3a3a48"/>
    <rect x="6" y="80" width="40" height="110" rx="6" fill="#2a2a33"/><rect x="154" y="80" width="40" height="110" rx="6" fill="#2a2a33"/>
    ${spk(26, 106, 14)}${spk(26, 156, 14)}${spk(174, 106, 14)}${spk(174, 156, 14)}
    ${spikes([[44, 20, -120, 22, 6], [100, 20, -90, 28, 6], [156, 20, -60, 22, 6]], '#2a2a33')}
    <path d="M40 30h120v50H40z" fill="#14102a"/>
    ${eye(74, 54, 14, '#c46aff', 1)}${eye(126, 54, 14, '#c46aff', -1)}
    <path d="M52 38L90 48M148 38L110 48" stroke-width="5"/>
    <circle cx="100" cy="132" r="44" fill="#2a2a33"/><circle cx="100" cy="132" r="34" fill="#14102a"/>
    <g fill="#e8e2f4" stroke-width="1.6">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${(100 + Math.cos(a - 0.22) * 34).toFixed(1)} ${(132 + Math.sin(a - 0.22) * 34).toFixed(1)}L${(100 + Math.cos(a) * 20).toFixed(1)} ${(132 + Math.sin(a) * 20).toFixed(1)}L${(100 + Math.cos(a + 0.22) * 34).toFixed(1)} ${(132 + Math.sin(a + 0.22) * 34).toFixed(1)}Z"/>`; }).join('')}</g>
    <circle cx="100" cy="132" r="9" fill="#b46aff"/>
    <path d="M100 20V-2" stroke-width="4"/><circle cx="100" cy="-4" r="7" fill="#c3ccd8"/>`);

  // 환생트럭 천벌거신: 전조등 눈, 그릴 송곳니, 가시 후광, 강철 날개, 뒤로 열린 차원문
  GMAX_ART.hwansaeng = W(`${ground('#ff8ac0')}
    <ellipse cx="100" cy="90" rx="96" ry="86" fill="#2a1a4a" opacity=".8"/><ellipse cx="100" cy="90" rx="80" ry="70" fill="none" stroke="#ff8ac0" stroke-width="4" stroke-dasharray="10 6"/>
    <path d="M40 80L4 40 10 70 0 90 14 100 4 120 30 110ZM160 80L196 40 190 70 200 90 186 100 196 120 170 110Z" fill="#dfe6f0"/>
    <ellipse cx="100" cy="12" rx="40" ry="9" fill="none" stroke="#FFD23F" stroke-width="5"/>${spikes([[68, 12, -110, 12, 3], [84, 6, -100, 12, 3], [100, 4, -90, 14, 3], [116, 6, -80, 12, 3], [132, 12, -70, 12, 3]], '#FFD23F')}
    <path d="M40 40h120l14 140H26z" fill="#f4f8ff"/><path d="M40 40h120v16H40z" fill="#2340A8"/><path d="M30 120h140" stroke="#2340A8" stroke-width="8"/>
    <rect x="52" y="60" width="96" height="40" rx="6" fill="#14102a"/>
    ${eye(76, 78, 14, '#FFE45C', 1)}${eye(124, 78, 14, '#FFE45C', -1)}
    <path d="M54 64L92 72M146 64L108 72" stroke-width="5"/>
    ${maw(100, 152, 92, 34, 8, '#14102a', '#e8eef6')}
    <circle cx="44" cy="186" r="12" fill="#2a2a33"/><circle cx="156" cy="186" r="12" fill="#2a2a33"/>
    <path d="M30 112l-16 6M170 112l16 6" stroke="#FFE45C" stroke-width="4"/>`);

  // 말랑 대제왕: 산만한 젤리 몸, 기울어진 왕관, 삼킨 것들이 비침, 흘러내리는 아가리
  GMAX_ART.malrang = W(`${ground('#3FA34D')}
    <path d="M10 194Q0 120 40 70Q70 30 100 30Q130 30 160 70Q200 120 190 194Q170 180 160 196Q146 178 130 196Q116 180 100 196Q84 180 70 196Q54 178 40 196Q30 180 10 194Z" fill="#5ac87a" fill-opacity=".92"/>
    <path d="M40 80Q60 50 90 46" fill="none" stroke="#c8ffd8" stroke-width="7"/>
    <g opacity=".75" stroke-width="2"><path d="M140 150l14 8-6 12-14-8z" fill="#c3ccd8"/><circle cx="54" cy="160" r="8" fill="#FFD23F"/><path d="M150 100l10-4 2 10z" fill="#E8402C"/></g>
    <path d="M60 32L66 8 82 22 100 0 118 22 134 8 140 32Z" fill="#FFD23F" transform="rotate(-8 100 20)"/><g fill="#E8402C" stroke-width="1.6" transform="rotate(-8 100 20)"><circle cx="100" cy="20" r="5"/><circle cx="76" cy="24" r="3.5"/><circle cx="124" cy="24" r="3.5"/></g>
    ${eye(72, 84, 16, '#FFE45C', 1)}${eye(128, 84, 16, '#FFE45C', -1)}
    <path d="M48 66L92 78M152 66L108 78" stroke-width="5"/>
    ${maw(100, 132, 96, 40, 9, '#1a4a2a', '#f4fff4')}
    <path d="M70 150q-2 16 4 28M130 150q2 16-4 28" fill="none" stroke="#5ac87a" stroke-width="7"/>`);

  // 성검산 골렘: 산만한 바위 몸, 정수리에 꽂힌 성검이 뿔처럼, 빛나는 룬
  GMAX_ART.seonggeom = W(`${ground('#C9A06A')}
    <path d="M94 -4h12v40H94z" fill="#e8eef6"/><path d="M80 34h40v8H80z" fill="#FFD23F"/><path d="M96 42h8v12h-8z" fill="#8a5a2a"/>
    <path d="M100 -4l6 10H94z" fill="#fff"/>
    <path d="M20 190L30 100 56 50 100 40 144 50 170 100 180 190Z" fill="#8a8072"/>
    <path d="M56 50L70 100 40 140M144 50L130 100 160 140M100 40V70" fill="none" stroke="#6a6052" stroke-width="3"/>
    ${spikes([[30, 100, 200, 24, 9], [26, 140, 180, 22, 9], [170, 100, -20, 24, 9], [174, 140, 0, 22, 9], [56, 50, -140, 22, 8], [144, 50, -40, 22, 8]], '#6a6052')}
    ${eye(74, 86, 15, '#ff8ac0', 1)}${eye(126, 86, 15, '#ff8ac0', -1)}
    <path d="M52 68L92 80M148 68L108 80" stroke-width="6"/>
    ${maw(100, 132, 70, 30, 7, '#2a1a12', '#f4ecdc')}
    ${crack('M44 160L52 176M156 160L148 176M60 116l-8 10M140 116l8 10', '#ff8ac0', 2.4)}
    <circle cx="14" cy="176" r="16" fill="#7a7062"/><circle cx="186" cy="176" r="16" fill="#7a7062"/>
    <g fill="#ffe0f0" opacity=".9"><circle cx="40" cy="30" r="4"/><circle cx="164" cy="24" r="5"/></g>`);

  // 금서 마도서: 펼친 책이 종이 이빨 아가리, 표지의 불타는 외눈, 끊어진 쇠사슬, 뒤에 마법진
  GMAX_ART.madoseo = W(`${ground('#ff7a2a')}
    <circle cx="100" cy="92" r="88" fill="none" stroke="#ff7a2a" stroke-width="3" opacity=".8"/><circle cx="100" cy="92" r="74" fill="none" stroke="#ffb347" stroke-width="2" stroke-dasharray="4 6"/>
    <path d="M100 4L176 136H24Z" fill="none" stroke="#ffb347" stroke-width="2" opacity=".8"/><path d="M100 180L24 48H176Z" fill="none" stroke="#ffb347" stroke-width="2" opacity=".8"/>
    <path d="M100 60L16 30 10 150 100 170Z" fill="#8a1a2a"/><path d="M100 60L184 30 190 150 100 170Z" fill="#8a1a2a"/>
    <path d="M100 70L24 46 22 140 100 156Z" fill="#f4e8d0"/><path d="M100 70L176 46 178 140 100 156Z" fill="#f4e8d0"/>
    <path d="M100 66V168" stroke-width="5"/>
    <g fill="#f4e8d0" stroke-width="1.8">${[40, 58, 76].map((x) => `<path d="M${x} ${118 + (x - 40) * 0.35}L${x + 9} ${96 + (x - 40) * 0.35}L${x + 18} ${118 + (x - 40) * 0.35}Z"/>`).join('')}${[106, 124, 142].map((x) => `<path d="M${x} ${131 - (x - 106) * 0.35}L${x + 9} ${109 - (x - 106) * 0.35}L${x + 18} ${131 - (x - 106) * 0.35}Z"/>`).join('')}</g>
    <path d="M30 120Q100 150 170 120L170 140Q100 160 30 140Z" fill="#3a0a0a" stroke-width="2"/>
    <path d="M40 60h40M40 70h30M120 60h40M130 70h30" stroke="#a8946a" stroke-width="2"/>
    <circle cx="100" cy="36" r="20" fill="#E8402C"/>${eye(100, 34, 15, '#FFD23F', 1)}
    <path d="M100 16Q90 0 98 -8Q100 4 108 2Q106 -10 114 -12Q112 6 104 16" fill="#ff7a2a"/>
    <path d="M10 150l-8 10M190 150l8 10M2 160l-4 8M198 160l4 8" stroke="#c3ccd8" stroke-width="5" stroke-dasharray="5 3"/>
    ${claw(20, 186, 1, 170, '#f4e8d0')}${claw(180, 186, 1, 190, '#f4e8d0')}`);

  // 미믹 보물상자 괴수: 뚜껑이 턱, 긴 혀, 덩굴, 쏟아지는 동전, 어둠 속 여러 눈
  GMAX_ART.mimik = W(`${ground('#3FA34D')}
    <path d="M30 80Q10 60 4 30Q20 50 36 52M170 80Q190 60 196 30Q180 50 164 52" fill="none" stroke="#3FA34D" stroke-width="7"/>
    <path d="M24 34Q100 -6 176 34L172 86H28Z" fill="#8a4a1a"/><path d="M24 34Q100 -6 176 34" fill="none" stroke="#FFD23F" stroke-width="7"/><path d="M60 16V86M140 16V86" stroke="#FFD23F" stroke-width="6"/>
    ${spikes([[40, 24, -130, 20, 6], [100, 8, -90, 22, 6], [160, 24, -50, 20, 6]], '#FFD23F')}
    ${eye(84, 46, 11, '#c8ff3a', 1)}${eye(116, 46, 11, '#c8ff3a', -1)}
    <path d="M28 86h144l-6 100H34z" fill="#8a4a1a"/><path d="M28 86h144" stroke="#FFD23F" stroke-width="7"/><path d="M60 92V186M140 92V186" stroke="#FFD23F" stroke-width="6"/>
    <path d="M30 86Q100 70 170 86L168 120Q100 136 32 120Z" fill="#14081a"/>
    <g fill="#f4ecd8" stroke-width="1.8">${[34, 52, 70, 88, 106, 124, 142, 154].map((x) => `<path d="M${x} 86L${x + 7} 104L${x + 14} 86Z"/>`).join('')}${[40, 58, 76, 94, 112, 130, 148].map((x) => `<path d="M${x} 122L${x + 7} 106L${x + 14} 122Z"/>`).join('')}</g>
    ${eye(60, 104, 4, '#c8ff3a', 1)}${eye(140, 104, 4, '#c8ff3a', -1)}
    <path d="M100 116Q110 150 86 170Q70 180 76 194Q92 182 104 170Q124 146 108 116Z" fill="#c84a6a"/>
    <path d="M90 140h20v18H90z" fill="#c3ccd8"/><circle cx="100" cy="146" r="4" fill="#1a1433"/>
    <g fill="#FFD23F" stroke-width="1.6"><ellipse cx="30" cy="192" rx="7" ry="3"/><ellipse cx="170" cy="190" rx="7" ry="3"/><ellipse cx="150" cy="196" rx="6" ry="2.6"/></g>`);

  // 강철 매미 거신: 장갑 껍질, 투명한 칼날 날개, 음파 포
  GMAX_ART.maemmaem = W(`${ground('#3FA34D')}
    <path d="M86 70Q20 30 6 70Q4 110 80 110ZM114 70Q180 30 194 70Q196 110 120 110Z" fill="#d8f2ff" fill-opacity=".75"/>
    <path d="M86 74Q40 50 20 70M86 86Q30 80 12 92M114 74Q160 50 180 70M114 86Q170 80 188 92" fill="none" stroke="#7f8aa0" stroke-width="2.4"/>
    <path d="M80 110Q40 130 20 170Q60 150 84 140ZM120 110Q160 130 180 170Q140 150 116 140Z" fill="#d8f2ff" fill-opacity=".7"/>
    <path d="M100 30Q140 34 142 80Q146 150 100 196Q54 150 58 80Q60 34 100 30Z" fill="#5a6a3a"/>
    ${[100, 120, 140, 160].map((y) => `<path d="M${66 + (y - 100) * 0.2} ${y}Q100 ${y + 10} ${134 - (y - 100) * 0.2} ${y}" fill="none" stroke="#c3ccd8" stroke-width="5"/>`).join('')}
    <path d="M62 50Q100 20 138 50L136 86Q100 96 64 86Z" fill="#7f8aa0"/>
    ${eye(76, 62, 13, '#c8ff3a', 1)}${eye(124, 62, 13, '#c8ff3a', -1)}
    <circle cx="56" cy="56" r="12" fill="#3a4a2a"/><circle cx="144" cy="56" r="12" fill="#3a4a2a"/>
    ${maw(100, 86, 40, 14, 5, '#1a2a08', '#fff')}
    <path d="M100 6Q80 6 70 20M100 6Q120 6 130 20" fill="none" stroke="#c8ff3a" stroke-width="3"/>
    <path d="M30 20q10 10 0 20M170 20q-10 10 0 20M16 14q16 16 0 32M184 14q-16 16 0 32" fill="none" stroke="#c8ff3a" stroke-width="3"/>
    <path d="M70 150L50 186M130 150L150 186M80 170L66 196M120 170L134 196" stroke="#3a4a2a" stroke-width="5"/>`);

  // 모기 여왕: 창 같은 주둥이, 번개 날개, 부푼 독 배
  GMAX_ART.wengweng = W(`${ground('#9A4FB8')}
    <path d="M90 70Q30 10 4 30Q10 70 80 90ZM110 70Q170 10 196 30Q190 70 120 90Z" fill="#e8f2ff" fill-opacity=".7"/>
    <path d="M86 72L40 32M86 80L20 40M114 72L160 32M114 80L180 40" fill="none" stroke="#FFE45C" stroke-width="2.4"/>
    <path d="M100 100Q150 110 152 150Q150 196 100 196Q50 196 48 150Q50 110 100 100Z" fill="#6a2a8a"/>
    ${[124, 144, 164, 182].map((y) => `<path d="M${52 + Math.abs(y - 150) * 0.2} ${y}Q100 ${y + 8} ${148 - Math.abs(y - 150) * 0.2} ${y}" fill="none" stroke="#b46aff" stroke-width="3"/>`).join('')}
    <ellipse cx="100" cy="150" rx="26" ry="20" fill="#9AE05A" opacity=".7"/>
    <ellipse cx="100" cy="80" rx="30" ry="24" fill="#3a2a4a"/>
    <circle cx="100" cy="44" r="26" fill="#3a2a4a"/>
    <circle cx="84" cy="40" r="13" fill="#ff3a4a"/><circle cx="116" cy="40" r="13" fill="#ff3a4a"/>
    <g fill="#5a0a1e" stroke="none">${[[80, 36], [86, 42], [80, 44], [88, 34], [112, 36], [118, 42], [120, 34], [114, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g>
    <path d="M70 26L92 34M130 26L108 34" stroke-width="4"/>
    <path d="M96 62L100 130 104 62Z" fill="#2a1a33" transform="rotate(180 100 62) translate(0 -66)"/>
    <path d="M98 66L60 4M102 66L140 4" stroke-width="3"/>
    <path d="M70 92L30 120 20 160M130 92L170 120 180 160M76 100L50 150 44 190M124 100L150 150 156 190" fill="none" stroke="#3a2a4a" stroke-width="4"/>
    ${crack('M20 50L30 60 24 70M180 50L170 60 176 70', '#FFE45C', 2.2)}`);
})();

/* ---------- 7차: 땡초 · 닭둘기 · 치즈냥 · 바선생 · 등신 · 루미나 · 실비아 · 단조 · 투혼 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 땡초 지옥고추: 불타는 꼭지 뿔, 빛나는 씨앗, 덩굴 팔
  GMAX_ART.ttaengcho = W(`${ground('#E8402C')}
    <path d="M40 90Q10 80 6 110Q20 100 30 112M160 90Q190 80 194 110Q180 100 170 112" fill="none" stroke="#3FA34D" stroke-width="8"/>
    ${claw(14, 120, 1, 150, '#5ac85a')}${claw(186, 120, 1, 210, '#5ac85a')}
    <path d="M70 36Q60 10 80 2Q82 20 94 22M130 36Q140 10 120 2Q118 20 106 22" fill="#3FA34D"/><path d="M76 40Q100 20 124 40L120 52H80Z" fill="#2a7a2a"/>
    <path d="M100 8Q86 -10 96 -20Q100 -6 110 -10Q108 4 100 8Z" fill="#ff7a2a"/>
    <path d="M60 50Q100 36 140 50Q170 100 140 160Q120 196 100 198Q80 196 60 160Q30 100 60 50Z" fill="#d8202a"/>
    <path d="M70 60Q60 110 76 160" fill="none" stroke="#ff6a6a" stroke-width="6" opacity=".8"/>
    ${spikes([[46, 90, 200, 22, 6], [44, 124, 180, 22, 6], [154, 90, -20, 22, 6], [156, 124, 0, 22, 6]], '#8a1018')}
    ${eye(80, 88, 13, '#FFD23F', 1)}${eye(120, 88, 13, '#FFD23F', -1)}
    <path d="M60 72L92 82M140 72L108 82" stroke-width="5"/>
    ${maw(100, 130, 60, 28, 7, '#3a0a0a', '#fff6d6')}
    ${crack('M84 156L92 170 86 184M116 156L108 172 114 186', '#ffb347', 2.4)}
    <g fill="#FFD23F" stroke-width="1.4"><ellipse cx="92" cy="128" rx="3" ry="2"/><ellipse cx="108" cy="132" rx="3" ry="2"/></g>`);

  // 닭둘기 도시 괴조: 무지갯빛 목털, 핏발 선 눈, 톱니 부리, 거대한 날개, 발톱
  GMAX_ART.dakdulgi = W(`${ground('#9fd8ff')}
    <path d="M70 100Q10 60 0 120Q20 110 22 130Q36 116 40 138Q54 120 64 140ZM130 100Q190 60 200 120Q180 110 178 130Q164 116 160 138Q146 120 136 140Z" fill="#8a8f9a"/>
    <path d="M60 104Q30 96 14 116M140 104Q170 96 186 116" fill="none" stroke="#5a5f6a" stroke-width="3"/>
    <path d="M60 110Q60 60 100 56Q140 60 140 110Q146 170 100 176Q54 170 60 110Z" fill="#9aa0ac"/>
    <path d="M66 84Q100 70 134 84Q140 110 100 116Q60 110 66 84Z" fill="#6a3a8a"/><path d="M70 92Q100 82 130 92Q126 108 100 110Q74 108 70 92Z" fill="#3aa87a" opacity=".85"/>
    <path d="M70 20Q100 0 130 20Q140 50 100 60Q60 50 70 20Z" fill="#9aa0ac"/>
    ${spikes([[80, 10, -120, 16, 5], [100, 4, -90, 18, 5], [120, 10, -60, 16, 5]], '#5a5f6a')}
    <circle cx="82" cy="30" r="11" fill="#ff8a1c"/><circle cx="118" cy="30" r="11" fill="#ff8a1c"/>${eye(82, 30, 8, '#ff3a1c', 1)}${eye(118, 30, 8, '#ff3a1c', -1)}
    <path d="M74 18L92 24M126 18L108 24" stroke-width="4"/>
    <path d="M90 40L100 64 110 40Z" fill="#3a3a42"/><path d="M92 46l3 4 3-4 3 4 3-4 3 4" fill="none" stroke="#fff" stroke-width="1.6"/>
    <path d="M80 176L70 196M120 176L130 196" stroke="#E8402C" stroke-width="5"/>${claw(70, 196, 0.9, 180, '#E8402C')}${claw(130, 196, 0.9, 180, '#E8402C')}`);

  // 치즈냥 화염사자: 녹은 치즈 갈기가 불꽃처럼, 송곳니, 발톱
  GMAX_ART.chijeu = W(`${ground('#ffb347')}
    <path d="M100 6Q140 2 160 30Q196 40 186 80Q200 110 176 130Q180 166 140 168Q120 196 100 186Q80 196 60 168Q20 166 24 130Q0 110 14 80Q4 40 40 30Q60 2 100 6Z" fill="#FFD23F"/>
    <path d="M40 30Q30 60 50 70M160 30Q170 60 150 70M14 80Q30 100 24 130M186 80Q170 100 176 130" fill="none" stroke="#ff8a1c" stroke-width="4"/>
    <g fill="#ffe680" stroke-width="2">${[[30, 150], [170, 150], [60, 176], [140, 176]].map(([x, y]) => `<path d="M${x - 6} ${y}q6 16 12 0z"/>`).join('')}</g>
    <path d="M54 50L46 14 76 40ZM146 50L154 14 124 40Z" fill="#ff9a2a"/>
    <path d="M100 40Q150 40 152 96Q150 150 100 154Q50 150 48 96Q50 40 100 40Z" fill="#ff9a2a"/>
    <path d="M70 52l8 14M100 46v14M130 52l-8 14" stroke="#c8641e" stroke-width="5"/>
    ${eye(78, 90, 14, '#7dff6a', 1)}${eye(122, 90, 14, '#7dff6a', -1)}
    <path d="M58 74L92 84M142 74L108 84" stroke-width="5"/>
    <path d="M94 104L100 112 106 104Z" fill="#ff6a9a"/>
    ${maw(100, 132, 62, 28, 6, '#5a0a1e', '#fff')}
    <path d="M78 124L72 150 86 130M122 124L128 150 114 130" fill="#fff" stroke-width="2.4"/>
    ${claw(40, 196, 1, 180, '#fff6e0')}${claw(160, 196, 1, 180, '#fff6e0')}`);

  // 바선생 갑각 거수: 번들거리는 등껍질, 긴 더듬이, 가시 다리, 큰 턱
  GMAX_ART.basaeng = W(`${ground('#9A4FB8')}
    <path d="M86 40Q40 0 10 4M114 40Q160 0 190 4" fill="none" stroke="#3a1a08" stroke-width="4"/>
    ${[[60, 90, 10, 70, 2, 110], [60, 120, 4, 140, 10, 170], [66, 150, 20, 186, 30, 198], [140, 90, 190, 70, 198, 110], [140, 120, 196, 140, 190, 170], [134, 150, 180, 186, 170, 198]].map(([a, b, c, d, e, f]) => `<path d="M${a} ${b}L${c} ${d}L${e} ${f}" fill="none" stroke="#5a2a10" stroke-width="7"/><path d="M${(a + c) / 2} ${(b + d) / 2 - 4}l4 -10M${(c + e) / 2} ${(d + f) / 2}l6 -6" stroke="#5a2a10" stroke-width="3"/>`).join('')}
    <path d="M100 50Q150 54 156 110Q160 180 100 196Q40 180 44 110Q50 54 100 50Z" fill="#7a3a12"/>
    <path d="M100 60V192" stroke="#3a1a08" stroke-width="3"/><path d="M60 80Q80 70 94 74M140 80Q120 70 106 74" fill="none" stroke="#c8743a" stroke-width="5" opacity=".9"/>
    <path d="M64 120Q72 150 92 170M136 120Q128 150 108 170" fill="none" stroke="#c8743a" stroke-width="4" opacity=".7"/>
    <path d="M70 28Q100 14 130 28Q138 52 100 58Q62 52 70 28Z" fill="#4a2208"/>
    ${eye(84, 36, 9, '#c8ff3a', 1)}${eye(116, 36, 9, '#c8ff3a', -1)}
    <path d="M86 54Q72 66 82 76L94 60ZM114 54Q128 66 118 76L106 60Z" fill="#2a1004"/>
    ${spikes([[100, 196, 90, 6, 4]], '#3a1a08')}`);

  // 등신 심해 리바이어던: 상처투성이 거대한 원반 몸, 작고 성난 눈, 이빨 부리, 칼날 지느러미
  GMAX_ART.deungsin = W(`${ground('#2F7DE1')}
    <path d="M100 30L120 -4 132 34ZM100 170L120 200 132 166Z" fill="#7f8aa0"/>
    <path d="M100 30L120 -4 132 34M100 170L120 200 132 166" fill="none" stroke="#c3ccd8" stroke-width="2"/>
    <path d="M160 40Q196 70 196 100Q196 130 160 160Q176 100 160 40Z" fill="#9aa7b8"/><path d="M168 60Q186 100 168 140" fill="none" stroke="#c3ccd8" stroke-width="3"/>
    <ellipse cx="96" cy="100" rx="78" ry="72" fill="#9aa7b8"/>
    <path d="M30 60Q90 80 160 54M24 110Q90 120 170 100M40 150Q100 150 156 140" fill="none" stroke="#7f8aa0" stroke-width="3"/>
    <path d="M60 50l20 20M70 46l20 22M120 140l18 14M130 136l16 16" stroke="#c84a5a" stroke-width="3"/>
    <circle cx="44" cy="88" r="16" fill="#e8eef6"/>${eye(44, 88, 11, '#ff3a4a', 1)}
    <path d="M26 74L60 84" stroke-width="5"/>
    <path d="M14 112Q20 98 34 104Q30 124 16 124Z" fill="#c3ccd8"/>
    ${maw(26, 116, 26, 20, 3, '#1a0a14', '#fff')}
    ${crack('M70 110L86 120 80 136M120 70L110 86 124 96', '#6fd7ff', 2.4)}
    <g fill="#e8f2ff" opacity=".9"><circle cx="10" cy="60" r="5"/><circle cx="16" cy="44" r="3"/><circle cx="6" cy="150" r="4"/></g>`);

  // 루미나 뇌운 대마도사: 두건 쓴 거대한 마도사 실루엣, 번개 구슬 지팡이, 번개 날개
  GMAX_ART.lumina = W(`${ground('#FFE45C')}
    <path d="M70 70L14 20 30 70 4 90 36 100 10 130 60 110ZM130 70L186 20 170 70 196 90 164 100 190 130 140 110Z" fill="#ffe680" fill-opacity=".8"/>
    <path d="M60 80L24 40M60 90L14 96M140 80L176 40M140 90L186 96" fill="none" stroke="#fff" stroke-width="2.4"/>
    <path d="M100 18Q140 22 146 70L160 196H40L54 70Q60 22 100 18Z" fill="#8a2a3a"/>
    <path d="M56 120Q100 140 144 120M50 160Q100 180 150 160" fill="none" stroke="#FFD23F" stroke-width="4"/>
    <path d="M100 18Q132 22 134 64Q100 84 66 64Q68 22 100 18Z" fill="#14081a"/>
    ${eye(86, 52, 10, '#FFE45C', 1)}${eye(114, 52, 10, '#FFE45C', -1)}
    <path d="M100 6L106 18H94Z" fill="#FFD23F"/>
    <path d="M176 196L184 30" stroke="#8a5a2a" stroke-width="7"/><circle cx="184" cy="26" r="16" fill="#FFE45C"/><circle cx="184" cy="26" r="9" fill="#fff"/>
    ${crack('M184 10L176 -4 188 -10M198 26L210 18', '#FFE45C', 2.6)}
    ${claw(46, 120, 1, 140, '#f4e6ec')}
    <path d="M70 80Q100 96 130 80L128 96Q100 108 72 96Z" fill="#FFD23F"/>`);

  // 실비아 폭풍 사냥꾼 정령: 두건 쓴 거대한 궁수 실루엣, 바람 활, 망토 날개
  GMAX_ART.silvia = W(`${ground('#3FA34D')}
    <path d="M60 60Q10 80 4 150Q30 130 40 160Q50 130 64 150ZM140 60Q190 80 196 150Q170 130 160 160Q150 130 136 150Z" fill="#2a6a3a"/>
    <path d="M100 18Q138 22 144 70L156 196H44L56 70Q62 22 100 18Z" fill="#3a7a4a"/><path d="M60 110h80M56 150h88" stroke="#2a5a32" stroke-width="4"/>
    <path d="M100 18Q132 22 134 64Q100 84 66 64Q68 22 100 18Z" fill="#0b1a10"/>
    ${eye(86, 52, 10, '#7dff9a', 1)}${eye(114, 52, 10, '#7dff9a', -1)}
    ${spikes([[70, 30, -130, 18, 5], [130, 30, -50, 18, 5]], '#2a5a32')}
    <path d="M20 20Q-10 100 20 180" fill="none" stroke="#c8f0d0" stroke-width="7"/><path d="M20 20Q-10 100 20 180" fill="none" stroke="#1a1433" stroke-width="2"/>
    <path d="M20 20L20 180" stroke="#fff" stroke-width="2" opacity=".9"/>
    <path d="M20 100H96" stroke="#c3ccd8" stroke-width="4"/><path d="M96 100l-12 -8v16z" fill="#c3ccd8"/>
    <path d="M30 90Q60 70 90 96M30 110Q60 130 90 104" fill="none" stroke="#c8f0d0" stroke-width="3" opacity=".9"/>
    <path d="M150 40Q180 20 196 40M156 60Q186 50 198 70" fill="none" stroke="#c8f0d0" stroke-width="4" opacity=".8"/>`);

  // 단조 청동거신: 살아 움직이는 청동 거상, 방패와 대검, 빛나는 금
  GMAX_ART.danjo = W(`${ground('#c8873a')}
    <path d="M176 196L188 20" stroke="#a87a3a" stroke-width="10"/><path d="M180 30L190 -4 198 30Z" fill="#e8c27a"/><path d="M168 40h36v8h-36z" fill="#8a5a2a"/>
    <path d="M64 50Q100 34 136 50L150 120 140 196H60L50 120Z" fill="#a8743a"/>
    <path d="M70 60l-4 60M130 60l4 60M60 120h80" stroke="#7a4a1a" stroke-width="3"/>
    <path d="M70 20Q100 0 130 20L134 56Q100 70 66 56Z" fill="#a8743a"/><path d="M70 20Q100 0 130 20" fill="none" stroke="#7a4a1a" stroke-width="3"/>
    ${spikes([[100, 4, -90, 22, 6], [76, 14, -120, 16, 5], [124, 14, -60, 16, 5]], '#7a4a1a')}
    <path d="M74 30h52v10H74z" fill="#3a1a08"/>${eye(88, 35, 7, '#ffb347', 1)}${eye(112, 35, 7, '#ffb347', -1)}
    <path d="M12 70Q40 60 56 80L54 160Q30 176 10 160Z" fill="#8a5a2a"/><circle cx="33" cy="115" r="14" fill="#c8873a"/><circle cx="33" cy="115" r="6" fill="#ffb347"/>
    ${crack('M84 70L92 90 86 110M120 80L112 100 118 120M90 150L100 166 94 186', '#ffb347', 2.6)}
    ${maw(100, 54, 26, 8, 4, '#3a1a08', '#f4e8d0')}`);

  // 투혼 지옥불 광전사: 뿔 투구, 거대한 도끼, 갑옷 틈 사이 불길
  GMAX_ART.tuhon = W(`${ground('#E8402C')}
    <path d="M10 40Q4 10 30 0Q30 20 46 20M190 40Q196 10 170 0Q170 20 154 20" fill="#ff7a2a"/>
    <path d="M30 196L52 40" stroke="#5a3a1a" stroke-width="8"/><path d="M50 30Q10 30 4 70Q30 60 54 76ZM56 30Q96 20 100 64Q76 56 54 76Z" fill="#c3ccd8"/><path d="M4 70Q30 60 54 76Q76 56 100 64" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M70 60Q100 44 130 60L150 130 136 196H64L50 130Z" fill="#3a3f4a"/>
    <path d="M60 100h80M56 140h88" stroke="#1a1433" stroke-width="3"/>
    ${crack('M70 110L80 124 74 136M128 108L120 124 128 138M100 146V176', '#ff7a2a', 3)}
    <path d="M70 34Q100 14 130 34L132 66Q100 80 68 66Z" fill="#2a2e38"/>
    <path d="M70 34Q50 20 40 -4Q62 10 76 24ZM130 34Q150 20 160 -4Q138 10 124 24Z" fill="#e8e2d0"/>
    <path d="M76 44h48v10H76z" fill="#0b0a1a"/>${eye(90, 49, 7, '#ff3a1c', 1)}${eye(110, 49, 7, '#ff3a1c', -1)}
    ${maw(100, 66, 30, 10, 5, '#3a0a0a', '#fff')}
    ${spikes([[140, 70, -30, 18, 5], [150, 96, -10, 16, 5], [60, 70, -150, 18, 5]], '#5a5f6a')}
    ${claw(160, 150, 1, 200, '#c3ccd8')}`);
})();

// 게임에서 쓰는 그림 함수 (아직 안 그린 골목몬은 메가 그림으로)
function gmaxSVG(id, cls = '') {
  if (!GMAX_ART[id]) return typeof monsterSVG === 'function' ? monsterSVG(id, cls, true) : '';
  return `<svg class="gmax ${cls}" viewBox="-6 -10 212 212" aria-hidden="true">${GMAX_ART[id]}</svg>`;
}

/* ---------- 신캐 공모전 출시작: 까모 · 선생님 ---------- */
(() => {
  const { eye, maw, claw, spikes, crack, ground, W } = GMX;

  // 칠흑 폭풍까마귀: 하늘을 덮는 톱날 날개, 보랏빛 번개 금, 눈 넷, 갈라진 노란 부리 속 송곳니
  const feather = (x, y, a, L, w) => { const r = (a * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
    return `<path d="M${x} ${y}Q${(x + c * L * .5 - s * w).toFixed(1)} ${(y + s * L * .5 + c * w).toFixed(1)} ${(x + c * L).toFixed(1)} ${(y + s * L).toFixed(1)}Q${(x + c * L * .5 + s * w * .4).toFixed(1)} ${(y + s * L * .5 - c * w * .4).toFixed(1)} ${x} ${y}Z" fill="#2c2836"/>`; };
  GMAX_ART.kkamo = W(`${ground('#8b3dff')}
    <path d="M100 30L20 4 34 22 6 30 30 42 2 58 32 64 8 84 40 84 22 106 56 96 70 70Z" fill="#2c2836"/>
    <path d="M100 30L180 4 166 22 194 30 170 42 198 58 168 64 192 84 160 84 178 106 144 96 130 70Z" fill="#2c2836"/>
    ${[[38, 40, 200, 30, 5], [30, 62, 190, 28, 5], [44, 82, 175, 24, 5]].map((f) => feather(...f)).join('')}
    ${[[162, 40, -20, 30, 5], [170, 62, -10, 28, 5], [156, 82, 5, 24, 5]].map((f) => feather(...f)).join('')}
    ${crack('M30 30L52 46 44 60 66 70M170 30L148 46 156 60 134 70', '#b86bff', 2.4)}
    ${spikes([[78, 46, -120, 26, 6], [92, 40, -100, 30, 6], [108, 40, -80, 30, 6], [122, 46, -60, 26, 6]], '#3d3846')}
    <path d="M100 42Q146 46 150 104Q154 150 128 178L72 178Q46 150 50 104Q54 46 100 42Z" fill="#3d3846"/>
    <path d="M70 120Q100 136 130 120M66 146Q100 162 134 146" fill="none" stroke="#2c2836" stroke-width="3"/>
    ${crack('M62 132L72 142 64 158M138 132L128 142 136 158', '#b86bff', 2.2)}
    ${eye(80, 74, 11, '#c86bff', 1)}${eye(120, 74, 11, '#c86bff', -1)}${eye(88, 58, 6, '#e3b8ff', 1)}${eye(112, 58, 6, '#e3b8ff', -1)}
    <path d="M66 66L92 76M134 66L108 76" stroke-width="4.5"/>
    <path d="M78 90L100 82 122 90 112 120 100 132 88 120Z" fill="#FFD23F"/>
    ${maw(100, 104, 34, 22, 5, '#4a0f3a', '#fff6e0')}
    <path d="M100 82V96" stroke-width="2.4"/>
    ${claw(76, 186, 1.1, 180, '#FFD23F')}${claw(124, 186, 1.1, 180, '#FFD23F')}
    <g fill="#2c2836" stroke-width="2">${[[18, 128, 30], [184, 120, -30], [30, 160, 60], [172, 156, -60], [150, 18, 20]].map(([x, y, a]) => `<path transform="translate(${x} ${y}) rotate(${a})" d="M0 -9Q5 0 0 9Q-5 0 0 -9Z"/>`).join('')}</g>`);

  // 전과목 특강 거신: 등에 거대한 칠판, 한 손엔 칼처럼 든 대형 자, 한 손엔 분필, 분노한 얼굴, 날아다니는 교과서
  GMAX_ART.seonsaeng = W(`${ground('#F2C230')}
    <path d="M14 30H186V120H14Z" fill="#2e6b4f"/><path d="M14 30H186V120H14Z" fill="none" stroke="#8a5a2b" stroke-width="7"/>
    <g fill="none" stroke="#f4f1e6" stroke-width="2" opacity=".85"><path d="M26 50q8-10 16 0t16 0M26 70h30M30 92l14-12M30 80l14 12M140 48h30M150 40v16M136 80q12-16 24 0q12 16 24 0M140 104h34"/></g>
    <text x="22" y="113" font-size="12" font-weight="900" fill="#f4f1e6" stroke="none" font-family="sans-serif">E=mc²</text>
    <path d="M176 26L196 6 200 12 182 32Z" fill="#f4f1e6"/>
    <path d="M150 128L196 66 186 60 140 122Z" fill="#e8c35a"/><path d="M160 112l6 4M168 102l6 4M176 92l6 4M184 82l6 4" stroke-width="2"/>
    <path d="M60 116Q100 104 140 116L150 168H50Z" fill="#fbfaf4"/>
    <path d="M60 116L40 150 30 160M140 116L156 132" fill="none" stroke-width="10"/><path d="M60 116L40 150 30 160M140 116L156 132" fill="none" stroke="#fbfaf4" stroke-width="5"/>
    <ellipse cx="26" cy="162" rx="10" ry="8" fill="#F2C230"/><path d="M18 156l-10-10 6-4 10 10z" fill="#fff"/>
    <ellipse cx="156" cy="132" rx="10" ry="9" fill="#F2C230"/>
    <path d="M62 168L58 196H86L90 170M110 170L114 196H142L138 168Z" fill="#2F7DE1"/>
    <path d="M58 46Q60 20 100 18Q142 20 142 50Q144 96 100 102Q56 98 58 46Z" fill="#F2C230"/>
    <path d="M56 46Q52 14 80 16Q90 4 106 14Q124 6 132 22Q150 26 144 50Q134 32 116 34Q100 22 86 32Q66 28 56 46Z" fill="#1a1433"/>
    ${eye(82, 58, 12, '#fff', 1, '#c81e3a')}${eye(118, 58, 12, '#fff', -1, '#c81e3a')}
    <path d="M66 46L94 54M134 46L106 54" stroke-width="6"/>
    ${maw(100, 82, 40, 20, 6, '#7a1a0a', '#fffaf0')}
    <g stroke-width="2.4">${[[30, 140, -20, '#c81e3a'], [176, 148, 15, '#2F7DE1'], [176, 18, -10, '#39a96b']].map(([x, y, a, c]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M-12 -8H12V8H-12Z" fill="${c}"/><path d="M0 -8V8" /><path d="M-9 -4H-3M3 -4H9" stroke="#fff" stroke-width="1.6"/></g>`).join('')}</g>`);
})();
