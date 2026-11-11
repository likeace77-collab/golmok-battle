// 아바타(세로 100x125), 핀 그림, 전투카드
const rng = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

const SKIN = ['#FFE0BD', '#F7CFA6', '#E8B98A', '#C98F5E', '#8D5A3B', '#5E3A26', '#BFE4FF', '#A8E0A0', '#D9C6F2', '#B8BCC6'];
const HAIR_C = ['#1a1433', '#4A2C1A', '#8B5A2B', '#D9A441', '#E8402C', '#2F7DE1', '#3FA34D', '#E6E0D5',
  '#F27FA5', '#9A4FB8', '#B8C2CC', '#F28A1E', '#6CE0C0', '#2a3a8a', '#7a1f2a', '#FFE45C'];
const CLOTH_C = ['#E8402C', '#2F7DE1', '#3FA34D', '#F2B705', '#9A4FB8', '#FFFFFF', '#2B2B38', '#F27FA5',
  '#3CC9A7', '#F28A1E', '#7C8798', '#8B5A2B', '#1F2A6C', '#C21F4A', '#BFE4FF', '#D7F2B4'];
// 3D 아바타 바지와 신발 색
const PANTS_C = ['#2a3a6a', '#1a1433', '#4a4a55', '#8B5A2B', '#E8402C', '#2F7DE1', '#3FA34D', '#F4ECD8', '#9A4FB8', '#F2B705', '#7C8798', '#F27FA5'];
const SHOE_C = ['#F4F2E6', '#1a1433', '#E8402C', '#2F7DE1', '#F2B705', '#3FA34D', '#8B5A2B', '#9A4FB8', '#F27FA5', '#7C8798', '#3CC9A7', '#E7B23A'];

const BG_C = ['#2340A8', '#E8402C', '#F2B705', '#3CC9A7', '#9A4FB8', '#F27FA5'];
const BG_SWATCH = [...BG_C, '#5B9BF0', '#F27FA5', '#FFD23F', '#E8402C', '#14102b', '#F7A24B', '#2a1450', '#FFB3CC'];

const AVATAR_LABELS = {
  body: '체형', pose: '자세', aura: '오라', back: '등', hand: '손에 든 것', gloves: '장갑', neck: '목', pantsColor: '바지 색', shoes: '신발', shoeColor: '신발 색',
  skin: '피부', hair: '머리 모양', hairColor: '머리 색', brow: '눈썹', eyes: '눈', mouth: '입', face: '얼굴 장식',
  glasses: '안경', hat: '모자', outfit: '옷', outfitColor: '옷 색', bg: '배경',
};
const AVATAR_SWATCH = { skin: SKIN, hairColor: HAIR_C, outfitColor: CLOTH_C, bg: BG_SWATCH, pantsColor: PANTS_C, shoeColor: SHOE_C };
const AVATAR_ORDER = ['body', 'pose', 'skin', 'hair', 'hairColor', 'brow', 'eyes', 'mouth', 'face', 'glasses', 'hat', 'outfit', 'outfitColor', 'pantsColor', 'shoes', 'shoeColor', 'gloves', 'neck', 'back', 'hand', 'aura', 'bg'];
const AVATAR_NAMES = {
  body: ['보통', '날씬', '듬직', '꼬마'], pose: ['차렷', '허리에 손', '팔짱', '브이', '손 흔들기', '근육 자랑', '엄지척', '손가락질', '파이팅', '손하트', '뒷짐', '만세 점프'],
  shoes: ['운동화', '부츠', '슬리퍼', '구두', '하이탑', '장화', '롤러', '쪼리'], gloves: ['없음', '흰 장갑', '권투', '가죽', '고무장갑', '메카'],
  neck: ['없음', '목도리', '금목걸이', '나비넥타이', '두건', '메달'], back: ['없음', '망토', '천사 날개', '악마 날개', '책가방', '제트팩', '등검', '나비 날개', '기타', '깃발'],
  hand: ['없음', '검', '지팡이', '깃발', '마이크', '아이스크림', '국자', '뚫어뻥', '빗자루', '연탄집게'], aura: ['없음', '불꽃', '번개', '반짝', '얼음', '하트', '어둠', '무지개'],
};

// 3D가 되면 3D로, 안 되면 2D로 그립니다. 배경은 2D 그림을 깝니다.
function avatarSVG(a, cls = '') {
  if (typeof Avatar3D === 'undefined' || !Avatar3D) return avatarSVG2D(a, cls);
  return `<svg class="${cls}" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${avatarBg(a.bg || 0)}<image href="${Avatar3D.snapshot(a)}" width="100" height="125"/></svg>`;
}

function avatarBg(i) {
  const base = (c) => `<rect width="100" height="125" fill="${c}"/>`;
  if (i < 6) return base(BG_C[i]);
  return [
    base('#2F7DE1') + rng(9, (j) => `<path d="M${j * 26 - 70} 125L${j * 26} 0h12L${j * 26 - 58} 125z" fill="#5B9BF0"/>`),
    base('#F27FA5') + rng(30, (j) => `<circle cx="${(j % 5) * 22 + ((Math.floor(j / 5) % 2) * 11) + 4}" cy="${Math.floor(j / 5) * 22 + 6}" r="4" fill="#fff" opacity=".7"/>`),
    base('#FFD23F') + rng(12, (j) => { const a = (j / 12) * 6.283, b = a + .26; return `<path d="M50 52L${50 + Math.cos(a) * 140} ${52 + Math.sin(a) * 140}L${50 + Math.cos(b) * 140} ${52 + Math.sin(b) * 140}z" fill="#F2B705"/>`; }),
    base('#fff') + rng(40, (j) => (((j % 8) + Math.floor(j / 8)) % 2 ? '' : `<rect x="${(j % 8) * 12.5}" y="${Math.floor(j / 8) * 25}" width="12.5" height="25" fill="#E8402C"/>`)),
    base('#14102b') + rng(16, (j) => `<circle cx="${(j * 37) % 100}" cy="${(j * 53) % 120}" r="${j % 3 ? .9 : 1.6}" fill="#fff"/>`) + '<circle cx="80" cy="18" r="10" fill="#FFE45C"/><circle cx="85" cy="15" r="9" fill="#14102b"/>',
    base('#F27A4B') + '<rect y="30" width="100" height="40" fill="#F7A24B"/><circle cx="70" cy="40" r="14" fill="#FFD23F"/><path d="M0 125V70l12-6 12 6V56h20v10l14-8 14 8V60h28v65z" fill="#3B2A78"/>' + rng(6, (j) => `<rect x="${6 + j * 16}" y="${80 + (j % 3) * 10}" width="5" height="5" fill="#FFD23F"/>`),
    base('#2a1450') + '<circle cx="50" cy="66" r="28" fill="#FF6FB5"/><circle cx="50" cy="66" r="28" fill="#FFD23F" opacity=".55"/>' + rng(4, (j) => `<rect x="20" y="${70 + j * 6}" width="60" height="2.5" fill="#2a1450"/>`) + '<rect y="86" width="100" height="39" fill="#1a0a3a"/>' + rng(7, (j) => `<path d="M50 86L${j * 25 - 25} 125" stroke="#ff4fc0" stroke-width="1"/>`) + rng(4, (j) => `<path d="M0 ${90 + j * 9}h100" stroke="#ff4fc0" stroke-width="1"/>`),
    base('#FFB3CC') + rng(12, (j) => { const x = (j % 4) * 28 + ((Math.floor(j / 4) % 2) * 14) + 6, y = Math.floor(j / 4) * 42 + 14; return `<path d="M${x} ${y + 5}c-7-5-4-11 0-7 4-4 7 2 0 7z" fill="#F27FA5"/>`; }),
  ][i - 6] || base(BG_C[0]);
}

function avatarSVG2D(a, cls = '') {
  const v = (k) => a[k] || 0;
  const skin = SKIN[v('skin')], hc = HAIR_C[v('hairColor')], cc = CLOTH_C[v('outfitColor')];
  const hair = v('hair');
  const back = {
    2: `<path d="M25 46q-4 52 8 58h34q12-6 8-58z" fill="${hc}"/>`,
    3: `<path d="M26 48q-2 22 6 28h36q8-6 6-28z" fill="${hc}"/>`,
    4: `<path d="M72 40q18 6 12 34-8-8-12-10z" fill="${hc}"/>`,
    6: `<circle cx="50" cy="16" r="10" fill="${hc}"/>`,
    10: `<circle cx="29" cy="22" r="9" fill="${hc}"/><circle cx="71" cy="22" r="9" fill="${hc}"/>`,
    11: `<path d="M26 42q-16 10-14 44 10-2 15-14 4-14 4-26zM74 42q16 10 14 44-10-2-15-14-4-14-4-26z" fill="${hc}"/>`,
    12: `<circle cx="50" cy="38" r="33" fill="${hc}"/>`,
    13: `<path d="M25 46q-6 52 6 62h20q-6-30-4-62z" fill="${hc}"/>`,
    15: `<path d="M66 26q26 8 20 50-8-4-12-16-4-12-12-30z" fill="${hc}"/>`,
    16: `<path d="M23 44q-4 28 4 36h46q8-8 4-36z" fill="${hc}"/>`,
    17: rng(10, (j) => { const t = (j / 9) * 3.14; return `<circle cx="${50 - Math.cos(t) * 27}" cy="${48 + Math.sin(t) * 8 - Math.sin(t / 2) * 26}" r="9" fill="${hc}"/>`; }),
  }[hair] || '';
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
    `<path d="M44 24L47 2l3 10 3-10 3 22q-6 4-12 0z" fill="${hc}"/><path d="M30 38q2-12 14-14M70 38q-2-12-14-14" fill="none" stroke="${hc}" stroke-width="3" opacity=".6"/>`,
    `<path d="M28 44q-2-26 22-26t22 26q-8-10-22-10T28 44z" fill="${hc}"/>`,
    `<path d="M27 46q-3-30 23-30t23 30l-4-10-6 6-4-10-5 8-4-9-4 9-5-8-4 10-6-6z" fill="${hc}"/>`,
    `<path d="M27 40q0-26 23-26t23 26q-10-8-23-8t-23 8z" fill="${hc}"/>` + rng(7, (j) => `<circle cx="${32 + j * 6}" cy="${22 - Math.sin((j / 6) * 3.14) * 6}" r="5" fill="${hc}"/>`),
    `<path d="M27 46q-2-30 25-30 22 0 22 28-10-14-20-16-14 4-27 18z" fill="${hc}"/>`,
    `<path d="M30 34q2-16 22-16 18 0 20 14-4-2-42 2z" fill="${hc}"/><path d="M27 42v-6M73 42v-6" stroke="${hc}" stroke-width="4" opacity=".45"/>`,
    `<path d="M28 42q0-26 22-26t22 26q-8-12-22-12t-22 12z" fill="${hc}"/><path d="M68 26l6 2" stroke="${K}" stroke-width="3"/>`,
    `<path d="M27 46q-3-30 23-30t23 30q-2-6-6-10H33q-4 4-6 10z" fill="${hc}"/>`,
    rng(8, (j) => `<circle cx="${29 + j * 6}" cy="${30 - Math.sin((j / 7) * 3.14) * 12}" r="7" fill="${hc}"/>`),
    `<path d="M28 40q2-22 24-22 20 0 20 20-6-10-22-10-14 2-22 12z" fill="${hc}"/><path d="M40 24q10-4 20 0" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>`,
    `<path d="M26 44l2-14-8-4 10-4-2-10 10 4 4-10 6 8 6-10 4 10 8-6-2 10 10 0-6 8 6 8-8 0q-2-8-22-8t-20 14z" fill="${hc}"/>`,
  ][hair] || '';
  const brow = ['',
    `<path d="M36 42q5-3 10 0M54 42q5-3 10 0" fill="none" stroke="${K}" stroke-width="2"/>`,
    `<path d="M35 42h11M54 42h11" stroke="${hc}" stroke-width="4.5" stroke-linecap="round"/><path d="M35 42h11M54 42h11" stroke="${K}" stroke-width="1" opacity=".5"/>`,
    `<path d="M35 40l11 4M65 40l-11 4" stroke="${K}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M36 43l10-3M64 43l-10-3" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M35 42q15-6 30 0" fill="none" stroke="${K}" stroke-width="4" stroke-linecap="round"/>`,
  ][v('brow')] || '';
  const star = (x, y, r, c) => `<path d="M${Array.from({ length: 10 }, (_, i) => { const t = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * .45 : r; return `${(x + Math.cos(t) * q).toFixed(1)} ${(y + Math.sin(t) * q).toFixed(1)}`; }).join('L')}z" fill="${c}" stroke="${K}" stroke-width="1"/>`;
  const heart = (x, y, c) => `<path d="M${x} ${y + 4}c-8-5-5-11 0-7 5-4 8 2 0 7z" fill="${c}" stroke="${K}" stroke-width="1"/>`;
  const ey = [
    `<circle cx="41" cy="49" r="3.5" fill="${K}"/><circle cx="59" cy="49" r="3.5" fill="${K}"/>`,
    `<path d="M36 49q5-5 10 0M54 49q5-5 10 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
    `<circle cx="41" cy="49" r="5.5" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="59" cy="49" r="5.5" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="42" cy="50" r="2.5" fill="${K}"/><circle cx="60" cy="50" r="2.5" fill="${K}"/>`,
    `<path d="M35 45l11 3M65 45l-11 3" stroke="${K}" stroke-width="2.5"/><circle cx="41" cy="51" r="3" fill="${K}"/><circle cx="59" cy="51" r="3" fill="${K}"/>`,
    `<path d="M36 49h10M54 49h10" stroke="${K}" stroke-width="3"/>`,
    [41, 59].map((x) => `<ellipse cx="${x}" cy="49" rx="4.5" ry="6" fill="${K}"/><circle cx="${x - 1.5}" cy="47" r="1.8" fill="#fff"/><circle cx="${x + 1.5}" cy="51.5" r=".9" fill="#fff"/>`).join(''),
    heart(41, 46, '#E8402C') + heart(59, 46, '#E8402C'),
    `<path d="M36 49q5 3 10 0M54 49q5 3 10 0" fill="none" stroke="${K}" stroke-width="2.5"/><path d="M36 48h10M54 48h10" stroke="${K}" stroke-width="1.5" opacity=".6"/>`,
    `<path d="M36 50l5-4 5 4" fill="none" stroke="${K}" stroke-width="2.5"/><circle cx="59" cy="49" r="3.5" fill="${K}"/>`,
    star(41, 49, 6, '#FFE45C') + star(59, 49, 6, '#FFE45C'),
    `<path d="M37 45l8 8M45 45l-8 8M55 45l8 8M63 45l-8 8" stroke="${K}" stroke-width="2.5"/>`,
    `<circle cx="41" cy="49" r="5" fill="#6CF2C2" stroke="${K}" stroke-width="1.5"/><circle cx="59" cy="49" r="5" fill="#6CF2C2" stroke="${K}" stroke-width="1.5"/><circle cx="40" cy="47.5" r="1.5" fill="#fff"/><circle cx="58" cy="47.5" r="1.5" fill="#fff"/>`,
  ][v('eyes')] || '';
  const mo = [
    `<path d="M44 60q6 5 12 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
    `<path d="M43 59h14q-1 8-7 8t-7-8z" fill="#fff" stroke="${K}" stroke-width="2"/>`,
    `<path d="M45 61h10" stroke="${K}" stroke-width="2.5"/>`,
    `<circle cx="50" cy="62" r="3.5" fill="${K}"/>`,
    `<path d="M44 62q6-5 12 0" fill="none" stroke="${K}" stroke-width="2.5"/>`,
    `<path d="M44 59q6 5 12 0" fill="none" stroke="${K}" stroke-width="2.5"/><path d="M48 61q2 6 5 0" fill="#F27FA5" stroke="${K}" stroke-width="1.5"/>`,
    `<path d="M42 58h16q-2 8-8 8t-8-8z" fill="#fff" stroke="${K}" stroke-width="2"/><path d="M44 58l2 4 2-4M52 58l2 4 2-4" fill="#fff" stroke="${K}" stroke-width="1"/>`,
    `<path d="M44 60q3 3 6 0 3 3 6 0" fill="none" stroke="${K}" stroke-width="2.2"/>`,
    `<path d="M45 61q8 1 11-4" fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M40 58q5-5 10-1 5-4 10 1-5 4-10 0-5 4-10 0z" fill="${hc}" stroke="${K}" stroke-width="1.5"/><path d="M47 63h6" stroke="${K}" stroke-width="2"/>`,
  ][v('mouth')] || '';
  const face = ['',
    rng(6, (j) => `<circle cx="${j < 3 ? 33 + j * 3 : 61 + (j - 3) * 3}" cy="${56 + (j % 2) * 2}" r="1" fill="#8B5A2B"/>`),
    `<ellipse cx="35" cy="57" rx="5" ry="3" fill="#F27FA5" opacity=".6"/><ellipse cx="65" cy="57" rx="5" ry="3" fill="#F27FA5" opacity=".6"/>`,
    `<path d="M36 40l10 18" stroke="#B84A3A" stroke-width="2"/><path d="M38 47l4-2M41 52l4-2" stroke="#B84A3A" stroke-width="1.5"/>`,
    `<g transform="rotate(-20 65 57)"><rect x="59" y="54" width="12" height="6" rx="2" fill="#F4ECD8" stroke="${K}" stroke-width="1.2"/><path d="M63 57h4M65 55v4" stroke="#E8402C" stroke-width="1"/></g>`,
    star(64, 57, 3.5, '#9A4FB8'),
    `<path d="M33 54l8 3M33 58l8 3M67 54l-8 3M67 58l-8 3" stroke="#E8402C" stroke-width="2"/>`,
  ][v('face')] || '';
  const glasses = ['',
    `<g fill="none" stroke="${K}" stroke-width="2"><circle cx="41" cy="49" r="7"/><circle cx="59" cy="49" r="7"/><path d="M48 49h4M34 48l-7-2M66 48l7-2"/></g>`,
    `<g fill="#BFE4FF55" stroke="${K}" stroke-width="2"><rect x="33" y="43" width="15" height="11" rx="2"/><rect x="52" y="43" width="15" height="11" rx="2"/><path d="M48 48h4M33 47l-6-1M67 47l6-1" fill="none"/></g>`,
    `<g stroke="${K}" stroke-width="2"><path d="M32 44h15q0 11-8 11t-7-11zM53 44h15q1 11-7 11t-8-11z" fill="${K}"/><path d="M47 46h6M32 45l-5-1M68 45l5-1" fill="none"/></g><path d="M35 46l4 4M56 46l4 4" stroke="#fff" stroke-width="1.5" opacity=".7"/>`,
    `<path d="M28 44h44l-3 10H31z" fill="#37e0ff" stroke="${K}" stroke-width="2" opacity=".9"/><path d="M32 47h36" stroke="#fff" stroke-width="1.5" opacity=".8"/>`,
    `<circle cx="59" cy="49" r="7" fill="#BFE4FF44" stroke="#E7B23A" stroke-width="2"/><path d="M65 53q6 14 2 26" fill="none" stroke="#E7B23A" stroke-width="1.2"/>`,
    `<path d="M27 40l46 8" stroke="${K}" stroke-width="1.5"/><ellipse cx="41" cy="49" rx="7" ry="6" fill="${K}"/>`,
    star(41, 49, 9, '#F27FA5') + star(59, 49, 9, '#F27FA5') + `<path d="M48 49h4" stroke="${K}" stroke-width="2"/>`,
  ][v('glasses')] || '';
  const hat = [
    '',
    `<path d="M27 34q2-20 23-20t23 20z" fill="${cc}"/><path d="M27 34h46l14 5H27z" fill="${K}"/>`,
    `<path d="M27 36q0-24 23-24t23 24z" fill="${cc}"/><path d="M25 32h50v8H25z" fill="#fff"/><circle cx="50" cy="11" r="5" fill="#fff"/>`,
    `<path d="M28 34q22-8 44 0v6q-22-8-44 0z" fill="#E8402C"/><path d="M72 36l12-4-3 8 3 7-12-6z" fill="#E8402C"/>`,
    `<path d="M22 36q8-22 28-22t28 22q-28-8-56 0z" fill="#E7C98A"/><path d="M12 38q38-12 76 0-38-6-76 0z" fill="#E7C98A"/>`,
    `<path d="M34 40l-4-14 12 8 8-16 8 16 12-8-4 14z" fill="#F2B705"/>`,
    `<path d="M26 36q0-26 24-26t24 26z" fill="${cc}"/><path d="M25 32h50v7H25z" fill="${cc}" stroke-width="2"/><path d="M30 32v7M36 32v7M42 32v7M48 32v7M54 32v7M60 32v7M66 32v7" stroke-width="1"/><circle cx="50" cy="9" r="5" fill="#fff"/>`,
    `<path d="M27 32q23-6 46 0v6q-23-6-46 0z" fill="#E8402C"/><path d="M73 34l14 6-12 2 10 8-14-6z" fill="#E8402C"/><circle cx="50" cy="32" r="3" fill="#fff"/>`,
    `<ellipse cx="50" cy="32" rx="38" ry="6" fill="#8B5A2B"/><path d="M34 32q0-20 16-20t16 20q-16 4-32 0z" fill="#8B5A2B"/><path d="M34 26q16 4 32 0" fill="none" stroke="#E8402C" stroke-width="3"/>`,
    `<ellipse cx="50" cy="32" rx="32" ry="6" fill="#3B2F8C"/><path d="M34 32L58 2l8 30z" fill="#3B2F8C"/><path d="M38 28q14 4 26 0" fill="none" stroke="#F2B705" stroke-width="3"/>`,
    `<path d="M27 34q0-22 23-22t23 22z" fill="#8a8f98"/><path d="M27 34h46" stroke-width="3"/><path d="M28 26q-12-6-12-20 8 6 16 12zM72 26q12-6 12-20-8 6-16 12z" fill="#F4ECD8"/>`,
    `<ellipse cx="50" cy="10" rx="17" ry="4.5" fill="none" stroke="#FFE45C" stroke-width="3.5"/><ellipse cx="50" cy="10" rx="17" ry="4.5" fill="none" stroke="${K}" stroke-width="1" opacity=".5"/>`,
    `<path d="M29 30l3-20 13 12zM71 30l-3-20-13 12z" fill="${hc}"/><path d="M32 24l1-9 6 6zM68 24l-1-9-6 6z" fill="#F27FA5" stroke-width="1"/>`,
    `<path d="M24 46q0-34 26-34t26 34" fill="none" stroke-width="5"/><path d="M24 46q0-34 26-34t26 34" fill="none" stroke="${cc}" stroke-width="2.5"/><rect x="18" y="42" width="10" height="16" rx="4" fill="${cc}"/><rect x="72" y="42" width="10" height="16" rx="4" fill="${cc}"/>`,
  ][v('hat')] || '';
  const T = (fill) => `<path d="M6 125Q8 86 34 79h32q26 7 28 46z" fill="${fill}"/>`;
  const clothes = [
    T(cc) + `<path d="M40 79q10 8 20 0" fill="none"/>`,
    T(cc) + `<path d="M34 79q16 16 32 0v6q-16 14-32 0z" fill="#00000030"/><path d="M46 88v10M54 88v10" stroke-width="1.5"/><path d="M36 106h28v12H36z" fill="#00000022"/>`,
    T('#2B2B38') + `<path d="M40 79l10 14 10-14 4 2-14 24-14-24z" fill="#fff"/><path d="M48 90h4l2 16-4 4-4-4z" fill="${cc}"/>`,
    T(cc) + `<path d="M18 92l-6 33M82 92l6 33" stroke="#fff" stroke-width="4"/><path d="M50 82v43" stroke-width="2"/><path d="M42 79l8 6 8-6" fill="#fff"/>`,
    T('#fff') + `<path d="M30 125V96h8v8h24v-8h8v29z" fill="${cc}"/><path d="M34 96l2-16M66 96l-2-16" stroke="${cc}" stroke-width="4"/>`,
    T('#2a2a33') + `<path d="M40 79h20l-4 46h-12z" fill="${cc}"/><path d="M40 79l-6 22 6 2-4 22M60 79l6 22-6 2 4 22" fill="#2a2a33" stroke-width="2"/><circle cx="72" cy="100" r="2" fill="#c7cdd6"/>`,
    T(cc) + `<path d="M36 79l18 22-4 4-18-22z" fill="#fff"/><path d="M50 100q-10 4-12 18M50 100q8 6 6 20" fill="none" stroke="#E8402C" stroke-width="3"/>`,
    T('#8a8f98') + `<path d="M6 104q16-26 30-25l-2 16q-18 2-28 9zM94 104q-16-26-30-25l2 16q18 2 28 9z" fill="${cc}"/><path d="M36 96h28M36 108h28M50 84v41" stroke-width="2"/><circle cx="50" cy="96" r="4" fill="#FFD23F"/>`,
    T('#fff') + `<path d="M40 79q10 12 20 0l2 6q-12 12-24 0z" fill="${cc}"/>` + rng(6, (j) => `<circle cx="${44 + (j % 2) * 12}" cy="${96 + Math.floor(j / 2) * 9}" r="1.8" fill="${K}"/>`),
    T(cc) + rng(10, (j) => `<circle cx="${14 + (j * 23) % 74}" cy="${92 + (j * 13) % 30}" r="3.5" fill="${j % 2 ? '#fff' : '#FFD23F'}" stroke-width="1"/>`) + `<path d="M40 79l10 10 10-10" fill="#fff"/>`,
    T(skin) + `<path d="M30 125q-2-30 6-44h4q10 10 20 0h4q8 14 6 44z" fill="${cc}"/>`,
    T('#3B2F8C') + `<path d="M34 79q16 12 32 0l4 6q-20 16-40 0z" fill="${cc}"/>` + rng(5, (j) => `<path d="M${20 + j * 14} ${100 + (j % 2) * 12}l1.5 3 3 .5-2.2 2 .6 3-2.9-1.5-2.9 1.5.6-3-2.2-2 3-.5z" fill="#FFE45C" stroke="none"/>`),
    T(cc) + rng(4, (j) => `<path d="M${8 + j * 1.5} ${92 + j * 9}h${84 - j * 3}" stroke="#fff" stroke-width="3.5"/>`) + `<path d="M40 79q10 8 20 0" fill="none"/>`,
    T(cc) + `<path d="M40 79l10 10 10-10" fill="#fff"/><text x="50" y="117" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" stroke="${K}" stroke-width="1">7</text>`,
  ][v('outfit')] || T(cc);
  return `<svg class="${cls}" viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    ${avatarBg(v('bg'))}
    <g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">
      ${back}${clothes}
      <path d="M42 64h16v14q-8 6-16 0z" fill="${skin}"/>
      <ellipse cx="50" cy="46" rx="23" ry="26" fill="${skin}"/>
      <ellipse cx="26" cy="50" rx="3.5" ry="5" fill="${skin}"/><ellipse cx="74" cy="50" rx="3.5" ry="5" fill="${skin}"/>
      ${top}
    </g>
    ${face}${brow}${ey}${mo}${glasses}
    <g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">${hat}</g>
  </svg>`;
}

/* ---------- 핀 (24x24) ---------- */
const PIN_ART = {
  star: '<path d="M12 2l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17l-5.9 3 1.2-6.5L2.5 8.9 9.1 8z" fill="#FFD23F"/>',
  heart: '<path d="M12 21C3 15 2 9 6 6c3-2 5 0 6 2 1-2 3-4 6-2 4 3 3 9-6 15z" fill="#F27FA5"/>',
  sprout: '<path d="M12 22V12" stroke-width="2.5"/><path d="M12 13C6 13 4 9 4 5c5 0 8 3 8 8zM12 11c0-5 3-8 8-8 0 5-3 8-8 8z" fill="#3FA34D"/>',
  bolt: '<path d="M14 2L5 13h6l-2 9 10-12h-6z" fill="#FFE45C"/>',
  fire: '<path d="M12 2c5 6 7 9 5 14-1 4-9 5-11 1-2-4 1-6 2-9 1 3 2 4 3 4-1-4 0-7 1-10z" fill="#F2622E"/><path d="M12 12c2 2 3 4 2 6-1 1-3 1-4 0-1-2 1-4 2-6z" fill="#FFD23F" stroke-width="1"/>',
  coal: '<rect x="4" y="6" width="16" height="14" rx="2" fill="#3b3640"/><ellipse cx="12" cy="6" rx="8" ry="2.5" fill="#57505c"/><circle cx="9" cy="6" r="1.2" fill="#F28A1E" stroke="none"/><circle cx="15" cy="6" r="1.2" fill="#F28A1E" stroke="none"/><circle cx="12" cy="5.5" r="1.2" fill="#F28A1E" stroke="none"/>',
  tack: '<path d="M11 13l1 9 1-9z" fill="#C7CDD6"/><ellipse cx="12" cy="10" rx="8" ry="4" fill="#F2B705"/><ellipse cx="12" cy="8" rx="4" ry="2" fill="#FFE45C" stroke-width="1"/>',
  coin: '<circle cx="12" cy="12" r="9" fill="#FFD23F"/><circle cx="12" cy="12" r="6" fill="none" stroke-width="1.2"/><text x="12" y="15.5" font-size="8" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">100</text>',
  trophy: '<path d="M7 3h10v6a5 5 0 0 1-10 0z" fill="#FFD23F"/><path d="M7 5H3q0 5 4 5M17 5h4q0 5-4 5" fill="none"/><path d="M10 14h4v4h3v3H7v-3h3z" fill="#E7B23A"/>',
  crown: '<path d="M3 19l-1-12 6 5 4-8 4 8 6-5-1 12z" fill="#FFD23F"/><circle cx="12" cy="15" r="1.8" fill="#E8402C" stroke-width="1"/>',
  skull: '<path d="M12 3c-5 0-8 3-8 8 0 3 2 4 3 5v4h10v-4c1-1 3-2 3-5 0-5-3-8-8-8z" fill="#F4ECD8"/><circle cx="9" cy="11" r="2.2" fill="#1a1433"/><circle cx="15" cy="11" r="2.2" fill="#1a1433"/><path d="M10 17v3M14 17v3" stroke-width="1.2"/>',
  horn: '<path d="M4 20C2 12 4 6 8 3c0 6 1 10 4 13zM20 20c2-8 0-14-4-17 0 6-1 10-4 13z" fill="#E8402C"/>',
  gem: '<path d="M6 4h12l4 6-10 12L2 10z" fill="#6CF2C2"/><path d="M2 10h20M8 4l4 18 4-18" fill="none" stroke-width="1"/>',
  rainbow: '<path d="M6 4h12l4 6-10 12L2 10z" fill="#F27FA5"/><path d="M6 4l6 6 6-6" fill="#FFD23F" stroke-width="1"/><path d="M2 10h20l-10 12z" fill="#9A4FB8" stroke-width="1"/>',
  hands: '<path d="M2 12l5-5 5 3 5-3 5 5-8 8z" fill="#FFE0BD"/><path d="M7 7l5 5M12 10l5 5M9 15l3 3" fill="none" stroke-width="1.2"/>',
  duo: '<path d="M8 3l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#FFD23F"/><path d="M16 9l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" fill="#37e0ff"/>',
  shield: '<path d="M12 2l9 3v6c0 6-4 9-9 11-5-2-9-5-9-11V5z" fill="#2F7DE1"/><path d="M12 6v12M7 10h10" stroke="#fff" stroke-width="2"/>',
  leek: '<path d="M10 22V10h4v12z" fill="#F4F2E6"/><path d="M10 10L6 2l4 3 2-4 2 4 4-3-4 8z" fill="#3FA34D"/>',
  plunger: '<path d="M11 2h2v12h-2z" fill="#C9924F"/><path d="M4 20q0-7 8-7t8 7z" fill="#D52C2C"/>',
  thumbsup: '<path d="M3 11h4v10H3z" fill="#2F7DE1"/><path d="M7 11l4-7c2 0 3 1.500 2.500 3.500L13 10h6c1.500 0 2.500 1.500 2 3l-2 6.500c-.300 1-1.300 1.500-2.300 1.500H7z" fill="#FFE0BD"/><path d="M14 14h4M14 17h3.500" stroke-width="1.100"/>',
  thumbsdown: '<g transform="rotate(180 12 12)"><path d="M3 11h4v10H3z" fill="#E8402C"/><path d="M7 11l4-7c2 0 3 1.500 2.500 3.500L13 10h6c1.500 0 2.500 1.500 2 3l-2 6.500c-.300 1-1.300 1.500-2.300 1.500H7z" fill="#FFE0BD"/><path d="M14 14h4M14 17h3.500" stroke-width="1.100"/></g>',
  golddown: '<circle cx="12" cy="12" r="11" fill="#1a1433"/><g transform="rotate(180 12 12) translate(2.500 2.500) scale(.8)"><path d="M3 11h4v10H3z" fill="#E8402C"/><path d="M7 11l4-7c2 0 3 1.500 2.500 3.500L13 10h6c1.500 0 2.500 1.500 2 3l-2 6.500c-.300 1-1.300 1.500-2.300 1.500H7z" fill="#FFD23F"/></g><path d="M4 5l1 2M20 5l-1 2M3 13h2M19 13h2" stroke="#FFD23F" stroke-width="1.400"/>',
  shades: '<path d="M2 9h20" stroke-width="2"/><path d="M3 9h8q0 7-4.500 7T3 9zM13 9h8q0 7-4.500 7T13 9z" fill="#1a1433"/><path d="M5 11l2 2M15 11l2 2" stroke="#fff" stroke-width="1.200"/>',
  swords: '<path d="M4 3l12 12M20 3L8 15" stroke="#C7CDD6" stroke-width="3"/><path d="M4 3l12 12M20 3L8 15" stroke-width=".8"/><path d="M14 17l3-3M10 17l-3-3" stroke="#E7B23A" stroke-width="2.500"/><path d="M17 17l3 3M7 17l-3 3" stroke="#8B5A2B" stroke-width="2.500"/>',
  wings: '<path d="M12 12C9 6 4 4 1 5c1 4 3 6 5 7-2 0-3 1-4 2 3 2 7 2 10-2zM12 12c3-6 8-8 11-7-1 4-3 6-5 7 2 0 3 1 4 2-3 2-7 2-10-2z" fill="#fff"/><circle cx="12" cy="13" r="2.200" fill="#FFD23F"/>',
  diamond: '<path d="M7 3h10l5 6-10 13L2 9z" fill="#BFE4FF"/><path d="M2 9h20M7 3l5 6 5-6M8 9l4 13 4-13" fill="none" stroke-width="1"/><path d="M9 5l2 2" stroke="#fff" stroke-width="1.500"/>',
  boltcrown: '<path d="M3 20l-1-13 6 5 4-9 4 9 6-5-1 13z" fill="#9A4FB8"/><path d="M13 9l-3 5h3l-2 5 5-6h-3l2-4z" fill="#FFE45C" stroke-width="1"/>',
  flameskull: '<path d="M6 10C5 6 7 2 9 1c0 3 1 4 3 5 0-3 2-5 4-5 1 3 3 6 2 9z" fill="#F2622E"/><path d="M12 7c-4.500 0-7 2.500-7 6.500 0 2.500 1.500 3.500 2.500 4.500v3h9v-3c1-1 2.500-2 2.500-4.500C19 9.500 16.500 7 12 7z" fill="#F4ECD8"/><circle cx="9.300" cy="13.500" r="2" fill="#F2622E"/><circle cx="14.700" cy="13.500" r="2" fill="#F2622E"/><path d="M10.500 18.500v2M13.500 18.500v2" stroke-width="1.100"/>',
  target: '<circle cx="11" cy="13" r="9" fill="#fff"/><circle cx="11" cy="13" r="6" fill="#E8402C"/><circle cx="11" cy="13" r="2.500" fill="#fff"/><path d="M11 13L22 2" stroke-width="2"/><path d="M19 2h3v3" fill="none" stroke="#E8402C" stroke-width="2"/>',
  meteor: '<path d="M2 22l9-9M5 22l7-7M2 19l7-7" stroke="#F28A1E" stroke-width="2"/><path d="M16 2l1.800 3.800 4.200.6-3 2.900.7 4.100-3.700-2-3.700 2 .7-4.100-3-2.900 4.200-.6z" fill="#FFD23F"/>',
  eye: '<path d="M1 12q11-11 22 0-11 11-22 0z" fill="#fff"/><circle cx="12" cy="12" r="5" fill="#9A4FB8"/><circle cx="12" cy="12" r="2" fill="#1a1433"/><circle cx="10.500" cy="10.500" r="1" fill="#fff" stroke="none"/><path d="M12 1v3M12 20v3M3 4l2 2M21 4l-2 2" stroke="#FFD23F" stroke-width="1.500"/>',
  lol: '<path d="M3 4h18v12h-9l-5 5v-5H3z" fill="#fff"/><text x="12" y="13.500" font-size="8.500" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">ㅋㅋ</text>',
  zzz: '<text x="3" y="20" font-size="12" font-weight="900" fill="#BFE4FF" stroke="#1a1433" stroke-width="1">Z</text><text x="11" y="13" font-size="9" font-weight="900" fill="#BFE4FF" stroke="#1a1433" stroke-width="1">Z</text><text x="17" y="7" font-size="7" font-weight="900" fill="#BFE4FF" stroke="#1a1433" stroke-width=".8">z</text>',
  sweat: '<path d="M12 2c5 7 7 10 7 13a7 7 0 0 1-14 0c0-3 2-6 7-13z" fill="#7fc8e8"/><path d="M9 14q0 3 3 4" fill="none" stroke="#fff" stroke-width="1.500"/>',
  poop: '<path d="M4 20q-3-4 2-6-2-4 3-5 0-5 4-6-1 3 2 5 4 1 3 5 5 2 2 7z" fill="#8B5A2B"/><circle cx="10" cy="15" r="1.600" fill="#fff"/><circle cx="15" cy="15" r="1.600" fill="#fff"/><circle cx="10" cy="15.300" r=".7" fill="#1a1433" stroke="none"/><circle cx="15" cy="15.300" r=".7" fill="#1a1433" stroke="none"/><path d="M10 18q2.500 1.500 5 0" fill="none" stroke-width="1"/>',
  kingbad: '<path d="M2 3h20v13h-8l-4 5v-5H2z" fill="#E8402C"/><text x="12" y="12.800" font-size="6.300" text-anchor="middle" font-weight="900" fill="#fff" stroke="none">킹받네</text>',
  medal: '<path d="M7 2h4l2 7H9zM13 2h4l-2 7h-4z" fill="#2F7DE1"/><circle cx="12" cy="15" r="6" fill="#C7CDD6"/><text x="12" y="18" font-size="7" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">2</text>',
  cat: '<path d="M4 9L5 2l5 4h4l5-4 1 7c1 2 1 5 0 7-2 4-6 5-8 5s-6-1-8-5c-1-2-1-5 0-7z" fill="#F2A541"/><circle cx="9" cy="12" r="1.400" fill="#1a1433" stroke="none"/><circle cx="15" cy="12" r="1.400" fill="#1a1433" stroke="none"/><path d="M11 15h2l-1 1zM12 16q-1 2-3 1M12 16q1 2 3 1M2 14h4M18 14h4" fill="none" stroke-width="1"/>',
  onigiri: '<path d="M12 2c3 0 10 13 10 16 0 2-2 3-4 3H6c-2 0-4-1-4-3C2 15 9 2 12 2z" fill="#fff"/><path d="M7 14h10v7H7z" fill="#1a1433"/><circle cx="10" cy="10" r=".8" fill="#1a1433" stroke="none"/><circle cx="14" cy="10" r=".8" fill="#1a1433" stroke="none"/>',
  skewer: '<path d="M12 23V1" stroke="#C9924F" stroke-width="2"/><rect x="7" y="3" width="10" height="5" rx="2.500" fill="#E8402C"/><rect x="7" y="9" width="10" height="5" rx="2.500" fill="#E8402C"/><rect x="7" y="15" width="10" height="5" rx="2.500" fill="#E8402C"/><path d="M9 5h2M13 11h2M9 17h2" stroke="#fff" stroke-width="1"/>',
  fishcake: '<path d="M12 23V1" stroke="#C9924F" stroke-width="2"/><path d="M7 3q5 2 10 0v4q-5 2-10 0zM7 8q5 2 10 0v4q-5 2-10 0zM7 13q5 2 10 0v4q-5 2-10 0z" fill="#F2D49B"/>',
  ramen: '<path d="M2 11h20q0 9-10 10Q2 20 2 11z" fill="#E8402C"/><path d="M5 11q2-4 4 0t4 0 4 0" fill="none" stroke="#FFE27A" stroke-width="1.600"/><circle cx="16" cy="9" r="2.500" fill="#fff"/><circle cx="16" cy="9" r="1.100" fill="#FFD23F" stroke="none"/><path d="M14 2l-3 9M18 2l-4 9" stroke-width="1.300"/><path d="M8 15h8" stroke="#fff" stroke-width="1.200"/>',
  banana: '<path d="M7 7h10l1 4v10q0 1-1 1H7q-1 0-1-1V11z" fill="#FFE27A"/><path d="M9 2h6v5H9z" fill="#3FA34D"/><path d="M8 14q4 3 8 0" fill="none" stroke-width="1.300"/><text x="12" y="20" font-size="4" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">바나나</text>',
  fist: '<path d="M5 9q0-3 3-3h9q3 0 3 3v6q0 6-7 7-8 0-8-7z" fill="#FFE0BD"/><path d="M9 6v5M13 6v5M17 6v5M5 12q3-1 6 1" fill="none" stroke-width="1.300"/>',
  music: '<path d="M8 18V5l12-3v13" fill="none" stroke-width="2"/><ellipse cx="6" cy="18" rx="3" ry="2.400" fill="#9A4FB8"/><ellipse cx="18" cy="15" rx="3" ry="2.400" fill="#9A4FB8"/><path d="M8 8l12-3" stroke-width="2"/>',
  rat: '<path d="M3 15q0-7 8-7 6 0 8 4l3 1-3 2q-2 4-8 4-8 0-8-4z" fill="#8a8f98"/><circle cx="11" cy="8" r="3" fill="#c7cdd6"/><circle cx="17" cy="12" r=".9" fill="#1a1433" stroke="none"/><path d="M3 15Q0 20 4 22" fill="none" stroke="#F27FA5" stroke-width="1.500"/><circle cx="22" cy="13" r="1" fill="#F27FA5"/>',
  manhole: '<circle cx="12" cy="12" r="10" fill="#57505c"/><circle cx="12" cy="12" r="7" fill="none" stroke-width="1"/><path d="M5 12h14M12 5v14M7 7l10 10M17 7L7 17" stroke="#3b3640" stroke-width="1.200"/><circle cx="12" cy="12" r="2.500" fill="#8a8f98"/>',
  ghost: '<path d="M4 22V11a8 8 0 0 1 16 0v11l-3-2-2 2-3-2-3 2-2-2z" fill="#fff"/><ellipse cx="9" cy="11" rx="1.500" ry="2.200" fill="#1a1433"/><ellipse cx="15" cy="11" rx="1.500" ry="2.200" fill="#1a1433"/><ellipse cx="12" cy="16" rx="1.500" ry="1" fill="#F27FA5" stroke="none"/>',
  bomb: '<circle cx="11" cy="14" r="8" fill="#1a1433"/><path d="M15 6l2-2 2 2-2 2z" fill="#57505c"/><path d="M18 4q2-3 4-1" fill="none" stroke="#C9924F" stroke-width="1.500"/><path d="M22 1l1 2M20 1l.5 1.500" stroke="#FFD23F" stroke-width="1.400"/><circle cx="8" cy="11" r="2" fill="#fff" stroke="none" opacity=".6"/>',
  rocket: '<path d="M12 1q6 5 5 14H7Q6 6 12 1z" fill="#fff"/><circle cx="12" cy="8" r="2.200" fill="#37e0ff"/><path d="M7 11l-4 5 4 1zM17 11l4 5-4 1z" fill="#E8402C"/><path d="M9 17q3 7 3 7t3-7z" fill="#F28A1E"/>',
  moon: '<path d="M15 2a10 10 0 1 0 7 15A8 8 0 0 1 15 2z" fill="#FFE27A"/><circle cx="9" cy="10" r="1.300" fill="#E7B23A" stroke="none"/><circle cx="11" cy="16" r="1" fill="#E7B23A" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="6" fill="#FFD23F"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" stroke="#F28A1E" stroke-width="2"/><circle cx="10" cy="11" r=".8" fill="#1a1433" stroke="none"/><circle cx="14" cy="11" r=".8" fill="#1a1433" stroke="none"/><path d="M10 14q2 1.500 4 0" fill="none" stroke-width="1"/>',
  snow: '<path d="M12 1v22M2.500 6.500l19 11M2.500 17.500l19-11" stroke="#BFE4FF" stroke-width="3"/><path d="M12 1v22M2.500 6.500l19 11M2.500 17.500l19-11M9 3l3 2 3-2M9 21l3-2 3 2" stroke-width="1" fill="none"/>',
  mic: '<rect x="8" y="2" width="8" height="12" rx="4" fill="#C7CDD6"/><path d="M8 7h8M8 10h8" stroke-width="1"/><path d="M5 11q0 7 7 7t7-7M12 18v4M8 22h8" fill="none" stroke-width="1.800"/>',
  dice: '<rect x="3" y="3" width="18" height="18" rx="4" fill="#fff"/><circle cx="8" cy="8" r="1.600" fill="#E8402C" stroke="none"/><circle cx="12" cy="12" r="1.600" fill="#1a1433" stroke="none"/><circle cx="16" cy="16" r="1.600" fill="#1a1433" stroke="none"/><circle cx="16" cy="8" r="1.600" fill="#1a1433" stroke="none"/><circle cx="8" cy="16" r="1.600" fill="#1a1433" stroke="none"/>',
  clover: '<path d="M12 12C7 12 4 9 6 6s6 0 6 6zM12 12c0-5 3-8 6-6s0 6-6 6zM12 12c5 0 8 3 6 6s-6 0-6-6zM12 12c0 5-3 8-6 6s0-6 6-6z" fill="#3FA34D"/><path d="M12 12q3 6 2 11" fill="none" stroke-width="1.500"/>',
  headphone: '<path d="M3 15v-3a9 9 0 0 1 18 0v3" fill="none" stroke-width="2.400"/><rect x="2" y="13" width="5" height="8" rx="2" fill="#E8402C"/><rect x="17" y="13" width="5" height="8" rx="2" fill="#E8402C"/>',
  gamepad: '<path d="M6 7h12q5 0 5 7 0 6-4 6-2 0-4-3H9q-2 3-4 3-4 0-4-6 0-7 5-7z" fill="#9A4FB8"/><path d="M7 10v5M4.500 12.500h5" stroke="#fff" stroke-width="1.600"/><circle cx="16" cy="11" r="1.300" fill="#FFD23F"/><circle cx="18.500" cy="13.500" r="1.300" fill="#37e0ff"/>',
  ufo: '<ellipse cx="12" cy="14" rx="11" ry="4" fill="#C7CDD6"/><path d="M6 12a6 6 0 0 1 12 0z" fill="#6CF2C2"/><circle cx="6" cy="15" r="1" fill="#FFD23F" stroke="none"/><circle cx="12" cy="16" r="1" fill="#FFD23F" stroke="none"/><circle cx="18" cy="15" r="1" fill="#FFD23F" stroke="none"/><path d="M8 18l-2 5M16 18l2 5" stroke="#FFE45C" stroke-width="1.200"/>',
  alien: '<path d="M12 2c6 0 9 4 9 8 0 6-5 12-9 12S3 16 3 10c0-4 3-8 9-8z" fill="#6CF2C2"/><path d="M5 10q4-1 5 4-4 0-5-4zM19 10q-4-1-5 4 4 0 5-4z" fill="#1a1433"/><path d="M10 18h4" stroke-width="1.200"/>',
  zbolt: '<circle cx="12" cy="12" r="11" fill="#FFD23F"/><path d="M6 6h12v3l-7 6h7v3H6v-3l7-6H6z" fill="#1a1433" stroke="none"/>',
  zgold: '<path d="M12 1l3 4 5-1-1 5 4 3-4 3 1 5-5-1-3 4-3-4-5 1 1-5-4-3 4-3-1-5 5 1z" fill="#FFD23F"/><path d="M7.500 7.500h9V10l-5.500 4h5.500v2.500h-9V14l5.500-4H7.500z" fill="#E8402C" stroke-width="1"/>',
  robot: '<rect x="4" y="6" width="16" height="13" rx="3" fill="#8a8f98"/><path d="M12 6V2" stroke-width="1.600"/><circle cx="12" cy="2" r="1.400" fill="#E8402C"/><rect x="7" y="9" width="10" height="5" rx="2" fill="#1a1433"/><circle cx="9.500" cy="11.500" r="1.200" fill="#37e0ff" stroke="none"/><circle cx="14.500" cy="11.500" r="1.200" fill="#37e0ff" stroke="none"/><path d="M8 16.500h8" stroke-width="1.200"/><path d="M2 11h2M20 11h2" stroke-width="2"/>',
  devil: '<path d="M4 3l3 5M20 3l-3 5" stroke="#E8402C" stroke-width="2.500"/><circle cx="12" cy="13" r="9" fill="#9A4FB8"/><path d="M7 11l3 1.500M17 11l-3 1.500" stroke-width="1.500"/><path d="M8 16q4 3 8 0" fill="#fff" stroke-width="1.200"/><path d="M10 16.500v1M14 16.500v1" stroke-width=".8"/>',
  halo: '<ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke="#FFD23F" stroke-width="3"/><ellipse cx="12" cy="6" rx="8" ry="3" fill="none" stroke-width=".8"/><circle cx="12" cy="16" r="6" fill="#FFE0BD"/><path d="M9.500 16q1-1 2 0M12.500 16q1-1 2 0" fill="none" stroke-width="1"/>',
  cry: '<circle cx="12" cy="12" r="10" fill="#FFD23F"/><path d="M7 9q2-2 4 0M13 9q2-2 4 0" fill="none" stroke-width="1.400"/><path d="M8 10v9M16 10v9" stroke="#37a5ff" stroke-width="2.500"/><path d="M9 17q3-3 6 0" fill="#1a1433" stroke-width="1.200"/>',
  angry: '<circle cx="12" cy="12" r="10" fill="#E8402C"/><path d="M6 8l5 2M18 8l-5 2" stroke-width="1.800"/><circle cx="9" cy="12" r="1.200" fill="#1a1433" stroke="none"/><circle cx="15" cy="12" r="1.200" fill="#1a1433" stroke="none"/><path d="M8 17q4-3 8 0" fill="none" stroke-width="1.500"/><path d="M18 2l1 2 2-1-1 2 2 1" fill="none" stroke="#FFD23F" stroke-width="1.300"/>',
  cool: '<circle cx="12" cy="12" r="10" fill="#FFD23F"/><path d="M3 9h18" stroke-width="1.800"/><path d="M4 9h7q0 4-3.500 4T4 9zM13 9h7q0 4-3.500 4T13 9z" fill="#1a1433"/><path d="M9 16q4 2 7-1" fill="none" stroke-width="1.400"/>',
  lovey: '<circle cx="12" cy="12" r="10" fill="#FFD23F"/><path d="M8.500 12C5 10 5.500 7 7 7c1 0 1.500 1 1.500 1S9 7 10 7c1.500 0 2 3-1.500 5zM15.500 12C12 10 12.500 7 14 7c1 0 1.500 1 1.500 1S16 7 17 7c1.500 0 2 3-1.500 5z" fill="#E8402C" stroke-width="1"/><path d="M8 15q4 4 8 0" fill="#fff" stroke-width="1.200"/>',
  error: '<rect x="1.500" y="3" width="21" height="18" rx="2" fill="#fff"/><path d="M1.500 5a2 2 0 0 1 2-2h17a2 2 0 0 1 2 2v3h-21z" fill="#E8402C"/><circle cx="19.300" cy="5.500" r="1" fill="#fff" stroke="none"/><circle cx="16.300" cy="5.500" r="1" fill="#fff" stroke="none"/><circle cx="7.500" cy="14.500" r="4" fill="#E8402C"/><path d="M6 13l3 3M9 13l-3 3" stroke="#fff" stroke-width="1.500"/><text x="16.500" y="16.200" font-size="5.200" text-anchor="middle" font-weight="900" fill="#1a1433" stroke="none">ERR</text><path d="M12.500 18.500h8" stroke="#E8402C" stroke-width="1.200" stroke-dasharray="1.500 1"/>',
  king: '<path d="M11 1h2v3h2v2h-2v2h-2V6H9V4h2z" fill="#FFD23F" stroke-width="1"/><path d="M8 9h8l-1 8H9z" fill="#1a1433"/><path d="M5 20h14v3H5zM7 17h10v3H7z" fill="#1a1433"/><path d="M8 9h8" stroke="#FFD23F" stroke-width="1.200"/>',
  dummy: '<path d="M11 14h2v9h-2z" fill="#8B5A2B"/><path d="M5 11h14" stroke="#8B5A2B" stroke-width="2.500"/><path d="M8 9q-1 8 2 10h4q3-2 2-10-4-2-8 0z" fill="#D9B66A"/><circle cx="12" cy="5.500" r="4" fill="#D9B66A"/><circle cx="12" cy="13" r="2.200" fill="#E8402C" stroke-width="1"/><path d="M10 4.500l1.200 1.200M11.200 4.500L10 5.700M12.800 4.500L14 5.700M14 4.500l-1.200 1.200" stroke-width="1"/>',
  glove: '<path d="M6 10q0-7 7-7 7 0 7 7v5q0 4-4 4H9q-3 0-3-4z" fill="#E8402C"/><path d="M6 13q-3 0-3-3t3-2" fill="#E8402C"/><path d="M8 19h10v3H8z" fill="#fff"/><path d="M10 7q3-2 6 0" fill="none" stroke="#fff" stroke-width="1.300"/>',
  dumbbell: '<path d="M7 12h10" stroke-width="3"/><rect x="2" y="7" width="3" height="10" rx="1" fill="#57505c"/><rect x="5" y="5" width="3" height="14" rx="1" fill="#3b3640"/><rect x="19" y="7" width="3" height="10" rx="1" fill="#57505c"/><rect x="16" y="5" width="3" height="14" rx="1" fill="#3b3640"/>',
  crack: '<circle cx="12" cy="12" r="10" fill="#D9B66A"/><path d="M12 2l-2 6 4 3-3 4 3 3-2 4" fill="none" stroke-width="1.800"/><path d="M14 11l5-2M11 15l-6 1" fill="none" stroke-width="1.200"/><path d="M3 4l2 2M21 4l-2 2M3 20l2-2" stroke="#FFD23F" stroke-width="1.500"/>',
  dmg999: '<path d="M1 5h22v14H1z" fill="#1a1433"/><text x="12" y="16" font-size="9" text-anchor="middle" font-weight="900" fill="#FFD23F" stroke="#E8402C" stroke-width=".6">9999</text>',
  goldglove: '<path d="M6 10q0-7 7-7 7 0 7 7v5q0 4-4 4H9q-3 0-3-4z" fill="#FFD23F"/><path d="M6 13q-3 0-3-3t3-2" fill="#FFD23F"/><path d="M8 19h10v3H8z" fill="#E8402C"/><path d="M10 7q3-2 6 0" fill="none" stroke="#fff" stroke-width="1.300"/><path d="M21 2l1 2M1 3l2 1M22 9h1" stroke="#FFD23F" stroke-width="1.500"/>',
  // 상점 핀
  receipt: '<path d="M5 2h14v20l-2-1.500-2 1.500-2-1.500-2 1.500-2-1.500-2 1.500-2-1.500z" fill="#fff"/><path d="M8 6h8M8 9h8M8 12h5" stroke-width="1.200"/><path d="M8 16h8" stroke="#E8402C" stroke-width="1.600"/>',
  gpcoin: '<circle cx="12" cy="12" r="10" fill="#FFD23F"/><circle cx="12" cy="12" r="7.500" fill="#F2B21E" stroke-width="1"/><text x="12" y="15.200" text-anchor="middle" font-size="8.500" font-weight="900" font-family="sans-serif" fill="#7a4a00" stroke="none">GP</text><path d="M6.500 7.500q2-2.500 5-3" fill="none" stroke="#fff" stroke-width="1.300"/>',
  cupteok: '<path d="M4 9h16l-2 13H6z" fill="#fff"/><path d="M4.600 13h14.800" stroke="#E8402C" stroke-width="2.500"/><path d="M7 9q1-5 4-3M11 9q2-6 5-2M15 9q1-3 3-2" fill="#E8402C"/><path d="M9 4.500l2-3M14 5l1.500-3.500" stroke-width="1.400"/>',
  cart: '<path d="M1 3h3l3 12h12l3-9H6" fill="none" stroke-width="2"/><path d="M6.200 6H22l-3 9H8z" fill="#37e0ff"/><circle cx="9" cy="19.500" r="2" fill="#fff"/><circle cx="17" cy="19.500" r="2" fill="#fff"/><path d="M11 9v3M14.500 9v3" stroke-width="1"/>',
  moneybag: '<path d="M9 2h6l-2 4h-2z" fill="#C9A06A"/><path d="M11 6h2q9 4 8 11-1 5-9 5t-9-5q-1-7 8-11z" fill="#E7C27A"/><path d="M8 6.500h8" stroke-width="1.800"/><text x="12" y="18" text-anchor="middle" font-size="9" font-weight="900" font-family="sans-serif" fill="#3FA34D" stroke="none">₩</text>',
  gemcrown: '<path d="M2 8l5 4 5-8 5 8 5-4-2 12H4z" fill="#FFD23F"/><path d="M4 20h16" stroke-width="2"/><path d="M12 10l2.500 3-2.500 3-2.500-3z" fill="#E8402C" stroke-width="1"/><circle cx="6.500" cy="15" r="1.400" fill="#37e0ff" stroke-width=".8"/><circle cx="17.500" cy="15" r="1.400" fill="#3FA34D" stroke-width=".8"/>',
};
const pinSVG = (id) => `<svg viewBox="0 0 24 24" aria-hidden="true"><g stroke="#1a1433" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">${PIN_ART[id] || ''}</g></svg>`;

/* ---------- 전투카드 ---------- */
function cosmetic(kind, id) {
  const list = G.data.COSMETICS[kind];
  return list.find((x) => x.id === id) || list[0];
}

// 칭호 등급별 효과: 0 일반, 1 반짝, 2 별가루, 3 황금, 4 네온, 5 전설
const TITLE_TIERS = ['일반', '반짝', '별가루', '황금', '네온', '전설', '개발자', 'Day 1', '신', '신화'];
function titleTag(id, cls = '') {
  const t = cosmetic('titles', id), tier = t.tier || 0;
  if (tier === 9) return `<span class="tt tt-9 ${cls}"><s aria-hidden="true"></s><em aria-hidden="true"></em><b class="tt-myth" aria-hidden="true">${esc(t.icon || '♛')}</b><i data-t="${esc(t.n)}">${esc(t.n)}</i><u aria-hidden="true">MYTHIC</u></span>`;
  if (tier === 8) return `<span class="tt tt-8 ${cls}"><s aria-hidden="true"></s><b class="tt-god" aria-hidden="true">⚒</b><i data-t="${esc(t.n)}">${esc(t.n)}</i><u aria-hidden="true">GOD</u></span>`;
  if (tier === 7) return `<span class="tt tt-7 ${cls}"><s aria-hidden="true"></s><b class="tt-crown" aria-hidden="true">♛</b><i data-t="${esc(t.n)}">${esc(t.n)}</i><u aria-hidden="true">FOUNDER</u></span>`;
  if (tier === 6) return `<span class="tt tt-6 ${cls}"><s aria-hidden="true"></s><b class="tt-code" aria-hidden="true">&lt;/&gt;</b><i data-t="${esc(t.n)}">${esc(t.n)}</i></span>`;
  return `<span class="tt tt-${tier} ${cls}"${t.glow ? ` style="--g:${t.glow}"` : ''}>${tier >= 2 ? '<s aria-hidden="true"></s>' : ''}<i>${esc(t.n)}</i></span>`;
}

function battleCard(p, size = '') {
  const st = p.style || {};
  const card = cosmetic('cards', st.card), title = cosmetic('titles', st.title);
  const pins = (st.pins || []).filter((id) => PIN_ART[id]);
  return `<div class="bcard bc-${card.id} ${card.dark ? 'dark' : ''} ${size}">
    <div class="bc-ava">${avatarSVG(p.avatar)}</div>
    <div class="bc-body">
      ${titleTag(title.id, 'bc-title')}
      <div class="bc-name ${[...p.name].length > 6 ? 'long' : ''}">${esc(p.name)}</div>
      ${pins.length ? `<div class="bc-pins">${pins.map(pinSVG).join('')}</div>` : ''}
      ${p.record ? `<div class="bc-rec">${p.record}</div>` : ''}
    </div>
  </div>`;
}

const recordText = (u) => `${u.wins ?? 0}승 ${u.losses ?? 0}패${u.draws ? ` ${u.draws}무` : ''}`;

// 해금 확인: 서버와 같은 규칙
function statOf(u, k) {
  if (k === 'wins' || k === 'losses' || k === 'draws') return u[k] || 0;
  return (u.stats || {})[k] || 0;
}
const cosRef = (item) => { for (const [k, list] of Object.entries(G.data.COSMETICS)) if (list.includes(item)) return `${k}:${item.id}`; return ''; };
const unlocked = (u, item) => !item.cond || !!u.dev || (u.owned || []).includes(cosRef(item)) || (item.cond[0] === 'gift' ? (u.owned || []).includes(item.cond[1]) : !['dev', 'shop'].includes(item.cond[0]) && statOf(u, item.cond[0]) >= item.cond[1]);
