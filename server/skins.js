'use strict';
// 🎨 등급별 스킨 대량: 테마 × 골목몬. 등급은 희귀 → 초희귀 → 영웅 → 신화 → 전설
// 그림은 클라이언트(public/js/skins.js)가 이 데이터(filter·over·fx)로 만들어요.
const Data = require('./data');

const GRADES = {
  rare: { n: '희귀', c: '#4FA3FF', price: 3000, rank: 1 },
  srare: { n: '초희귀', c: '#A05BFF', price: 7000, rank: 2 },
  hero: { n: '영웅', c: '#FF8A1F', price: 15000, rank: 3 },
  myth: { n: '신화', c: '#FF3B6B', price: 30000, rank: 4 },
  legend: { n: '전설', c: '#FFD23F', price: 60000, rank: 5 },
};
// 색 바꾸기 행렬(feColorMatrix) 모음
const MX = {
  mono: '0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0',
  sepia: '0.39 0.77 0.19 0 0  0.35 0.69 0.17 0 0  0.27 0.53 0.13 0 0  0 0 0 1 0',
  mint: '0.5 0.2 0.1 0 0.05  0.2 0.7 0.2 0 0.18  0.2 0.3 0.6 0 0.16  0 0 0 1 0',
  sakura: '0.8 0.2 0.1 0 0.2  0.2 0.6 0.1 0 0.08  0.2 0.2 0.6 0 0.16  0 0 0 1 0',
  candy: '0.6 0.2 0.2 0 0.25  0.2 0.6 0.2 0 0.18  0.2 0.2 0.6 0 0.28  0 0 0 1 0',
  night: '0.3 0.1 0.1 0 0  0.1 0.35 0.15 0 0.02  0.25 0.3 0.6 0 0.12  0 0 0 1 0',
  ocean: '0.2 0.1 0.1 0 0  0.2 0.6 0.2 0 0.05  0.2 0.4 0.7 0 0.2  0 0 0 1 0',
  neon: '0.2 0.1 0.3 0 0.05  0.1 0.2 0.3 0 0.02  0.4 0.2 0.6 0 0.1  0 0 0 1 0',
  lava: '0.7 0.5 0.2 0 0.15  0.25 0.3 0.1 0 0.02  0.05 0.05 0.05 0 0  0 0 0 1 0',
  frost: '0.4 0.4 0.3 0 0.15  0.4 0.5 0.3 0 0.22  0.4 0.5 0.5 0 0.35  0 0 0 1 0',
  galaxy: '0.35 0.2 0.3 0 0.05  0.1 0.15 0.25 0 0  0.45 0.3 0.6 0 0.15  0 0 0 1 0',
  crystal: '0.3 0.3 0.3 0 0.2  0.3 0.5 0.3 0 0.3  0.3 0.4 0.5 0 0.45  0 0 0 1 0',
  shadow: '0.18 0.12 0.1 0 0  0.12 0.12 0.12 0 0  0.15 0.12 0.2 0 0.04  0 0 0 1 0',
  gold: '0.45 0.6 0.15 0 0.18  0.35 0.5 0.1 0 0.08  0.1 0.15 0.05 0 0  0 0 0 1 0',
  ruby: '0.7 0.3 0.2 0 0.2  0.1 0.2 0.1 0 0  0.2 0.15 0.3 0 0.08  0 0 0 1 0',
  jade: '0.2 0.3 0.1 0 0.02  0.3 0.7 0.3 0 0.12  0.15 0.4 0.3 0 0.08  0 0 0 1 0',
};
// 테마: id, 이름 짓기, 등급, 색, 덧그림(over), 이펙트 글자/색, 소리, 설명
const THEMES = [
  { id: 'mono', grade: 'rare', name: (n) => `흑백 사진 ${n}`, mx: 'mono', over: 'grain', fx: { chars: ['▪', '▫'], colors: ['#222', '#ddd'] }, snd: 'scratch', d: '옛날 흑백 사진 속에서 튀어나온 모습. 지지직 필름 잡음이 섞여요.', look: '흑백 + 필름 잡음' },
  { id: 'sepia', grade: 'rare', name: (n) => `추억의 ${n}`, mx: 'sepia', over: 'frame', fx: { chars: ['✦', '·'], colors: ['#8a5a2b'] }, snd: 'scratch', d: '할머니 앨범에 꽂혀 있던 누렇게 바랜 사진 속 모습.', look: '세피아 + 사진 모서리' },
  { id: 'mint', grade: 'rare', name: (n) => `민트초코 ${n}`, mx: 'mint', over: 'chips', fx: { chars: ['●', '◆'], colors: ['#5b3a1e', '#7fe0c4'] }, snd: 'bleep', d: '호불호가 갈리는 민트초코 맛. 초코칩이 콕콕 박혀 있어요.', look: '민트빛 + 초코칩' },
  { id: 'sakura', grade: 'rare', name: (n) => `벚꽃 ${n}`, mx: 'sakura', over: 'petals', fx: { chars: ['🌸', '✿'], colors: ['#ffb7d5'] }, snd: 'bell', d: '봄바람에 꽃잎이 흩날려요. 움직일 때마다 벚꽃잎이 팔랑.', look: '분홍빛 + 흩날리는 꽃잎' },
  { id: 'candy', grade: 'srare', name: (n) => `솜사탕 ${n}`, mx: 'candy', over: 'sparkle', fx: { chars: ['🍬', '✦', '♥'], colors: ['#ff9ed8'] }, snd: 'bell', d: '달콤한 파스텔 솜사탕 색. 공격하면 사탕이 톡톡 튀어요.', look: '파스텔 + 반짝이' },
  { id: 'night', grade: 'srare', name: (n) => `한밤의 ${n}`, mx: 'night', over: 'moon', fx: { chars: ['☾', '✦', '⋆'], colors: ['#ffe9a8'] }, snd: 'whistle', d: '달빛 아래에서만 보이는 푸르스름한 모습. 별이 반짝여요.', look: '밤빛 + 초승달 · 별' },
  { id: 'ocean', grade: 'srare', name: (n) => `심해 ${n}`, mx: 'ocean', over: 'bubbles', fx: { chars: ['○', '◌', '°'], colors: ['#7fd7ff'] }, snd: 'whistle', d: '깊은 바다에서 올라왔어요. 보글보글 거품이 피어올라요.', look: '바닷빛 + 거품' },
  { id: 'neon', grade: 'hero', name: (n) => `네온 ${n}`, mx: 'neon', cls: 'sk-neon', over: 'scan', fx: { chars: ['▮', '▯', '◢'], colors: ['#ff3df2', '#2ef2ff'] }, snd: 'glitch', d: '밤거리 간판처럼 번쩍이는 네온 윤곽. 가끔 화면이 지직 튀어요.', look: '네온 윤곽 + 스캔라인' },
  { id: 'lava', grade: 'hero', name: (n) => `용암 ${n}`, mx: 'lava', over: 'embers', fx: { chars: ['🔥', '✹'], colors: ['#ff6a00'] }, snd: 'zap', d: '몸속에 용암이 끓어요. 불씨가 쉬지 않고 피어올라요.', look: '용암빛 + 날리는 불씨' },
  { id: 'frost', grade: 'hero', name: (n) => `서리 ${n}`, mx: 'frost', over: 'snow', fx: { chars: ['❄', '❅', '✧'], colors: ['#bff3ff'] }, snd: 'frost', d: '숨결마다 서리가 내려앉아요. 공격하면 눈꽃이 터져요.', look: '얼음빛 + 눈송이' },
  { id: 'jade', grade: 'hero', name: (n) => `비취 ${n}`, mx: 'jade', over: 'sparkle', fx: { chars: ['◆', '✧'], colors: ['#3fd18f'] }, snd: 'bell', d: '옥으로 깎아 만든 듯 은은하게 빛나는 몸.', look: '비취빛 + 광택' },
  { id: 'galaxy', grade: 'myth', name: (n) => `은하 ${n}`, mx: 'galaxy', cls: 'sk-galaxy', over: 'stars', fx: { chars: ['✦', '★', '✧', '•'], colors: ['#fff', '#c9a8ff'] }, snd: 'whistle', d: '몸 안에 은하수가 흘러요. 별이 끝없이 반짝이고 성운이 일렁여요.', look: '우주빛 + 반짝이는 별 + 성운' },
  { id: 'crystal', grade: 'myth', name: (n) => `크리스탈 ${n}`, mx: 'crystal', cls: 'sk-crystal', over: 'shards', fx: { chars: ['◆', '◇', '✦'], colors: ['#a8f4ff', '#fff'] }, snd: 'ice', d: '빛을 받으면 무지갯빛으로 갈라지는 수정 몸. 맞으면 조각이 튀어요.', look: '수정빛 + 떠다니는 결정' },
  { id: 'shadow', grade: 'myth', name: (n) => `그림자 ${n}`, mx: 'shadow', cls: 'sk-shadow', over: 'eyes', fx: { chars: ['◉', '▼', '✖'], colors: ['#ff2a4a'] }, snd: 'glitch', d: '골목 끝 어둠에서 기어 나온 그림자. 붉은 눈만 번뜩여요.', look: '검은 몸 + 붉은 눈 + 어둠 오라' },
  { id: 'ruby', grade: 'myth', name: (n) => `루비 ${n}`, mx: 'ruby', cls: 'sk-crystal', over: 'shards', fx: { chars: ['◆', '♦'], colors: ['#ff3b6b'] }, snd: 'coins', d: '핏빛 루비로 깎은 보석 몸. 빛이 닿으면 붉게 타올라요.', look: '루비빛 + 보석 조각' },
  { id: 'gold', grade: 'legend', name: (n) => `황금왕 ${n}`, mx: 'gold', cls: 'sk-gold', over: 'crown', fx: { chars: ['🪙', '✦', '👑'], colors: ['#FFD23F'] }, snd: 'coins', d: '온몸이 황금으로 빛나는 골목의 왕. 왕관을 쓰고, 공격하면 금화가 쏟아져요.', look: '황금 몸 + 왕관 + 회전하는 빛살' },
  { id: 'rainbow', grade: 'legend', name: (n) => `무지개신 ${n}`, cls: 'sk-rainbow', over: 'halo', fx: { chars: ['✦', '★', '♥', '◆'], colors: ['#ff5fa2', '#ffd23f', '#2ef2ff', '#7b4bff'] }, snd: 'bell', d: '색이 쉬지 않고 무지개로 바뀌는 전설의 모습. 머리 위에 빛의 고리가 떠 있어요.', look: '무지개로 바뀌는 몸 + 빛의 고리' },
];
// 테마마다 어떤 골목몬에게 줄지: 골목몬 목록을 테마 수 간격으로 나눠요 (테마마다 3~4마리, 같은 골목몬에 여러 테마)
function genSkins() {
  const mons = Object.keys(Data.MONSTERS).filter((id) => !Data.BANNED.includes(id) && id !== 'dummy');
  const out = {};
  THEMES.forEach((t, ti) => {
    for (let k = ti; k < mons.length; k += THEMES.length) {
      const sp = mons[k], g = GRADES[t.grade];
      out[`${t.id}_${sp}`] = { n: t.name(Data.MONSTERS[sp].n), only: sp, price: g.price, grade: t.grade, d: t.d,
        fx: [`외형: ${t.look}`, `이펙트: ${t.fx.chars.join(' ')} 파티클`, `등급: ${g.n}`], gen: { theme: t.id, mx: t.mx ? MX[t.mx] : '', cls: t.cls || '', over: t.over, chars: t.fx.chars, colors: t.fx.colors, snd: t.snd } };
    }
  });
  return out;
}
module.exports = { GRADES, THEMES, MX, genSkins };
