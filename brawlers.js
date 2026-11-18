// 브롤러 정의 — 새 브롤러는 여기에 데이터 추가 + server.js의 SKILLS에 스킬 함수 추가
// 등급: rare(희귀) · super(초희귀) · epic(영웅) · mythic(신화) · legendary(전설)

const BRAWLERS = {
  jungbo: {
    id: 'jungbo',
    name: '정보쌤',
    rarity: 'legendary',
    title: '아~ 이놈의 아이들',
    desc: '컴퓨터실의 지배자. 뚱뚱한 몸으로 내려찍어 주변 아이들을 한꺼번에 혼낸다.',
    radius: 28, speed: 250, maxHp: 6000,
    attack: {
      name: '아~ 이놈의 아이들', aim: 'self',
      desc: '점프해서 내려찍어 주변 적 모두에게 피해를 준다. (범위 고정)',
      range: 150, dmg: 1000, ammo: 3, reload: 1.5, cd: 0.45,
    },
    gadgets: [
      { name: 'AI야? 시키지도 않은 걸 하네', icon: '⚡', desc: '주변 적을 2초 동안 기절시키고 피해를 준다.', range: 260, stun: 2, dmg: 300 },
      { name: '마우스 소환', icon: '🖱️', desc: '마우스 2마리를 소환해 8초 동안 적을 쫓아가 딸깍 공격한다.', count: 2, hp: 1200, speed: 320, dmg: 260, biteCd: 0.6, life: 8, radius: 16 },
    ],
    gadgetCd: 6,
    super: {
      name: '이놈의 아이들', aim: 'dir',
      desc: '부채꼴로 고함을 질러 큰 피해를 주고 적을 밀쳐낸다.',
      need: 3500, range: 340, half: 0.66, dmg: 2200, knock: 150,
    },
    starPowers: [
      { id: 'reflect', name: '너의 성찰을 불찰로 바꿔줄게', icon: '📕',
        desc: '상대를 때릴 때마다 그 상대의 성찰 게이지가 조금씩 오른다(8번). 다 차면 불찰로 바뀌며 상대는 즉사한다.', hits: 8 },
      { id: 'ajae', name: '아재개그', icon: '🥶',
        desc: '30초에 한 번 랜덤한 아재개그를 해서 주위의 적을 1.5초 동안 얼린다.', every: 30, range: 300, freeze: 1.5 },
    ],
    lines: {
      atk: ['아~ 이놈의 아이들!', '아~ 이놈의 아이들', '조용히 해라~', '자리에 앉아!'],
      g1: ['AI야? 시키지도 않은 걸 하네', 'AI야?? 시키지도 않은 걸 하네!'],
      g2: ['마우스 소환!', '가라, 무선마우스!'],
      sup: ['이놈의 아이들!!!', '이노오옴의 아이드을!!'],
      kill: ['수행평가 0점', '교무실로 와', '벌점!'],
    },
  },
  hyeonsil: {
    id: 'hyeonsil',
    name: '현실쌤',
    rarity: 'legendary',
    title: '펜 내려놓고 여기 보자',
    desc: '핑크색 옷에 털가죽 잠바, 큰 나무주걱을 든 수학 선생님. 교실 전체를 얼려버리고 학생을 마음대로 조종한다.',
    radius: 28, speed: 240, maxHp: 5400,
    attack: {
      name: '주걱 스매쉬', aim: 'dir',
      desc: '큰 나무주걱을 조금 느리게 휘둘러 앞쪽 부채꼴 범위에 강한 피해를 준다.',
      range: 190, half: 1.0, dmg: 1700, ammo: 3, reload: 1.8, cd: 0.6, windup: 0.18, knock: 40,
    },
    gadgets: [
      { name: '얘들아 덥지 않니?', icon: '❄️', desc: '에어컨을 18도로 틀어 7초 동안 모든 적 브롤러에게 계속 피해를 준다.', dur: 7, tick: 0.5, dmg: 100 },
      { name: '펜 내려놓고 여기 보자', icon: '✋', desc: '모든 적 브롤러를 1.3초 동안 기절시킨다.', stun: 1.3 },
    ],
    gadgetCd: 6,
    super: {
      name: '너 등신이냐?', aim: 'line',
      desc: '조준한 방향의 첫 번째 상대를 5초 동안 조종한다. 조종하는 동안 그 상대의 공격·가젯·궁극기를 대신 쓸 수 있다.',
      need: 4800, range: 460, width: 45, dur: 5,
    },
    starPowers: [
      { id: 'sasinga', name: '너 사회성 머리는 하나도 없지? 너 진짜 싸가지 없다.', icon: '😤',
        desc: '궁극기 조종이 끝나면 그 상대가 2초 동안 기절한다.', stun: 2 },
      { id: 'board', name: '칠판 부수기', icon: '🧱',
        desc: '공격 시 25% 확률로 칠판이 부서지며 맞은 상대에게 670 추가 피해. 바닥에 파편이 흩뿌려져 밟고 있는 동안 1초에 300 피해.',
        chance: 0.25, dmg: 670, radius: 95, dur: 5, dps: 300 },
    ],
    lines: {
      atk: ['주걱 맛 좀 볼래?', '조용히 해!', '집중 안 하지?'],
      g1: ['얘들아 덥지 않니?', '에어컨 18도~'],
      g2: ['펜 내려놓고 여기 보자!'],
      sup: ['너 등신이냐?', '너 등신이냐??'],
      kill: ['숙제 두 배!', '나가서 손 들고 있어', '이것도 못 풀어?'],
    },
  },
};

// 기어 (6개 중 2개 장착)
const GEARS = [
  { id: 'speed', name: '속도 기어', icon: '👟', desc: '이동 속도 10% 증가' },
  { id: 'heal', name: '회복 기어', icon: '💚', desc: '체력 회복 속도 50% 증가' },
  { id: 'dmg', name: '데미지 기어', icon: '🔥', desc: '체력이 절반 이하일 때 주는 피해 15% 증가' },
  { id: 'shield', name: '보호막 기어', icon: '🛡️', desc: '체력이 가득 찬 상태로 3초가 지나면 900 보호막 생성' },
  { id: 'gadget', name: '가젯 기어', icon: '⏱️', desc: '가젯 쿨타임 20% 감소' },
  { id: 'super', name: '궁극기 기어', icon: '⚡', desc: '궁극기가 시간이 지나면 저절로 충전된다 (60초에 가득)' },
];

// 아재개그 (정보쌤 스타파워)
const AJAE = [
  '왕이 넘어지면? 킹콩!', '소금의 유통기한은? 천일염!', '바나나가 웃으면? 바나나킥!',
  '자동차를 톡 치면? 카톡!', '오리가 얼면? 언덕!', '미소의 반대말은? 당기소!',
  '전화로 세운 건물은? 콜로세움!', '왕이 궁에 들어가기 싫을 때? 궁시렁궁시렁!',
  '세상에서 제일 쉬운 숫자는? 190000 (십구만)!', '고양이가 좋아하는 차는? 냥이차!',
  '물고기 중 가장 학벌 좋은 건? 고등어!', '세상에서 가장 뜨거운 과일은? 천도복숭아!',
];

// 클라이언트에 보낼 공개 정보 (대사 제외)
function publicBrawlers() {
  const out = {};
  for (const [id, b] of Object.entries(BRAWLERS)) { const { lines, ...rest } = b; out[id] = rest; }
  return out;
}

module.exports = { BRAWLERS, GEARS, AJAE, publicBrawlers };
