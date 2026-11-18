// 브롤러 정의 — 새 브롤러는 여기에 데이터 추가 + server.js의 SKILLS에 스킬 함수 추가
// 등급: rare(희귀) · super(초희귀) · epic(영웅) · mythic(신화) · legendary(전설)

const BRAWLERS = {
  jungbo: {
    id: 'jungbo',
    name: '정보쌤',
    rarity: 'legendary',
    title: '아~ 이놈의 아이들',
    desc: '컴퓨터실의 지배자. 뚱뚱한 몸으로 내려찍어 주변 아이들을 한꺼번에 혼낸다.',
    radius: 28, speed: 250, maxHp: 4200,
    attack: {
      name: '아~ 이놈의 아이들', aim: 'self',
      desc: '점프해서 내려찍어 주변 적 모두에게 피해를 준다. (범위 고정)',
      range: 150, dmg: 1000, ammo: 3, reload: 1.5, cd: 0.45,
    },
    gadgets: [
      { name: 'AI야? 시키지도 않은 걸 하네', icon: '⚡', desc: '주변 적을 1.6초 동안 기절시키고 피해를 준다.', range: 260, stun: 1.6, dmg: 300 },
      { name: '마우스 소환', icon: '🖱️', desc: '마우스 2마리를 소환해 8초 동안 적을 쫓아가 딸깍 공격한다.', count: 2, hp: 1200, speed: 320, dmg: 260, biteCd: 0.6, life: 8, radius: 16 },
    ],
    gadgetCd: 6,
    super: {
      name: '이놈의 아이들', aim: 'dir',
      desc: '부채꼴로 고함을 질러 큰 피해를 주고 적을 밀쳐낸다.',
      need: 3500, range: 340, half: 0.66, dmg: 2200, knock: 150,
    },
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
    rarity: null,          // 등급 미정
    wip: true,             // 스킬 준비 중 → 아직 선택 불가
    title: '수학쌤',
    desc: '핑크색 옷에 털가죽 잠바를 걸친 수학 선생님. 스킬은 준비 중.',
    radius: 28, speed: 250, maxHp: 3800,
  },
};

// 클라이언트에 보낼 공개 정보 (대사 제외)
function publicBrawlers() {
  const out = {};
  for (const [id, b] of Object.entries(BRAWLERS)) { const { lines, ...rest } = b; out[id] = rest; }
  return out;
}

module.exports = { BRAWLERS, publicBrawlers };
