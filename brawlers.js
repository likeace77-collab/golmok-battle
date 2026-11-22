// 브롤러 정의 — 새 브롤러는 여기에 데이터 추가 + server.js의 SKILLS에 스킬 함수 추가
// 등급: rare(희귀) · super(초희귀) · epic(영웅) · mythic(신화) · legendary(전설)

const BRAWLERS = {
  jungbo: {
    id: 'jungbo',
    name: '정보쌤',
    rarity: 'legendary',
    role: '탱커',
    title: '아~ 이놈의 아이들',
    desc: '컴퓨터실의 지배자. 뚱뚱한 몸으로 내려찍어 주변 아이들을 한꺼번에 혼낸다.',
    radius: 28, speed: 250, maxHp: 6000,
    attack: {
      name: '아~ 이놈의 아이들', aim: 'self',
      desc: '점프해서 내려찍어 주변 적 모두에게 피해를 준다. (범위 고정)',
      range: 150, dmg: 1000, ammo: 3, reload: 1.5, cd: 0.45,
    },
    gadgets: [
      { name: 'AI야? 시키지도 않은 걸 하네', icon: '⚡', desc: '주변 적을 1초 동안 기절시키고 피해를 준다.', range: 260, stun: 1, dmg: 300 },
      { name: '마우스 소환', icon: '🖱️', desc: '마우스 2마리를 소환해 8초 동안 적을 쫓아가 딸깍 공격한다.', count: 2, hp: 1200, speed: 320, dmg: 260, biteCd: 0.6, life: 8, radius: 16 },
    ],
    gadgetCd: 9,
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
    role: '데미지딜러',
    title: '펜 내려놓고 여기 보자',
    desc: '핑크색 옷에 털가죽 잠바, 큰 나무주걱을 든 수학 선생님. 교실 전체를 얼려버리고 학생을 마음대로 조종한다.',
    radius: 28, speed: 240, maxHp: 5400,
    attack: {
      name: '너 등신이냐?', aim: 'dir',
      desc: '"너 등신이냐?" 큰 나무주걱을 조금 느리게 휘둘러 앞쪽 부채꼴 범위에 강한 피해를 준다.',
      range: 190, half: 1.0, dmg: 1700, ammo: 3, reload: 1.8, cd: 0.6, windup: 0.18, knock: 40,
    },
    gadgets: [
      { name: '얘들아 덥지 않니?', icon: '❄️', desc: '에어컨을 18도로 틀어 7초 동안 모든 적 브롤러에게 계속 피해를 준다.', dur: 7, tick: 0.5, dmg: 100 },
      { name: '펜 내려놓고 여기 보자', icon: '✋', desc: '모든 적 브롤러를 1초 동안 기절시킨다.', stun: 1 },
    ],
    gadgetCd: 9,
    super: {
      name: '난 너네 생각을 다 읽을 수 있어', aim: 'line',
      desc: '조준한 방향의 첫 번째 상대를 5초 동안 조종한다. 조종하는 동안 그 상대의 공격·가젯·궁극기를 대신 쓸 수 있다.',
      need: 4800, range: 460, width: 45, dur: 5,
    },
    starPowers: [
      { id: 'sasinga', name: '너 사회성 머리는 하나도 없지? 너 진짜 싸가지 없다.', icon: '😤',
        desc: '궁극기 조종이 끝나면 그 상대가 1초 동안 기절한다.', stun: 1 },
      { id: 'board', name: '칠판 부수기', icon: '🧱',
        desc: '공격 시 25% 확률로 칠판이 부서지며 맞은 상대에게 800 추가 피해. 바닥에 파편이 흩뿌려져 계속 남고, 밟고 있는 동안 1초에 300 피해.',
        chance: 0.25, dmg: 800, radius: 95, dps: 300, max: 12 },
    ],
    lines: {
      atk: ['너 등신이냐?', '너 등신이냐??', '너… 등신이냐?'],
      g1: ['얘들아 덥지 않니?', '에어컨 18도~'],
      g2: ['펜 내려놓고 여기 보자!'],
      sup: ['난 너네 생각을 다 읽을 수 있어', '다 보여~ 너네 생각'],
      kill: ['숙제 두 배!', '나가서 손 들고 있어', '이것도 못 풀어?'],
    },
  },
  junhoo: {
    id: 'junhoo',
    name: '김준후',
    rarity: 'epic',        // 영웅
    role: '어쌔신',
    title: '나 김준후야!!!',
    desc: '안경 쓴 작은 학생. 몸은 작은데 엄청 나댄다. 상대를 끌어와 백초크를 걸고 태클로 날려버린다. 근데 많이 맞으면 쫄아버림.',
    radius: 24, speed: 265, maxHp: 4800,
    attack: {
      name: '백초크', aim: 'dir',
      desc: '앞쪽 범위의 상대를 끌어와서 0.25초 동안 기절시키고 피해를 준다.',
      range: 210, half: 0.55, dmg: 1300, stun: 0.25, ammo: 3, reload: 1.6, cd: 0.6,
    },
    gadgets: [
      { name: '간식 털어먹기', icon: '🍪', desc: '친구의 가방을 털어 얻은 간식을 먹고 체력을 2000 회복한다.', heal: 2000 },
      { name: '나 김준후야!!!', icon: '😤', desc: '각성해서 다음 일반공격의 범위가 두 배로 넓어지고 피해가 2000으로 늘어난다.', rangeMul: 2, dmg: 2000 },
    ],
    gadgetCd: 9,
    super: {
      name: '태클', aim: 'line',
      desc: '상대에게 돌진해서 부딪힌 상대에게 피해를 주고 1.25초 동안 기절시킨다.',
      need: 4700, range: 470, width: 40, dmg: 1000, stun: 1.25, dashTime: 0.32,
    },
    starPowers: [
      { id: 'sibi', name: '시비걸기준비과정', icon: '😏',
        desc: '큰 범위 안에 상대가 있으면 궁극기가 저절로 엄청 빠르게 충전된다.', range: 420, fullIn: 9 },
      { id: 'jjang', name: '우리학교 1짱 김준후', icon: '👑',
        desc: '체력이 가득 차 있으면 공격력 20%·재장전 속도 30%·이동 속도 15% 증가. 대신 공격 범위가 15% 줄어든다.', dmgMul: 1.2, reloadMul: 1.3, speedMul: 1.15, rangeMul: 0.85 },
    ],
    trait: { name: '쫄', icon: '😰', desc: '쫄 게이지가 따로 있어서 맞을 때마다 아주 조금씩 오른다. 다 차면 4초 동안 공격 불능 상태가 된다.', perHit: 0.04, dur: 4 },
    lines: {
      atk: ['이리 와 봐!', '잡았다~', '도망가지 마!'],
      g1: ['냠냠 이거 내 거~', '간식 압수!'],
      g2: ['나 김준후야!!!'],
      sup: ['태클!!!', '비켜!!!'],
      kill: ['ㅋㅋㅋ 개약해', '나한테 덤비지 마라', '우리학교 1짱 누구?'],
      scared: ['ㅈ, 잠깐만...', '엄마...', '아 쫄았다...'],
    },
  },
  jaeyeol: {
    id: 'jaeyeol',
    name: '김재열',
    rarity: 'epic',
    role: '컨트롤러',
    title: '후… 왔냐.',
    desc: '큰 대가리에 두꺼운 뿔테안경. 반창고는 패션이고, 멍은 이긴 거다. 세모를 던지고, 대가리로 박고, "나랑 사귈..레?"로 상대를 굳혀버리는 컨트롤러.',
    radius: 28, speed: 250, maxHp: 4800,
    attack: {
      name: '세모 던지기 빔', aim: 'tri',
      desc: '세모 빔(직선)과 던진 세모(사거리 끝에 착지)가 같이 나간다. 각각 700, 한 명에게 둘 다 맞히면 보너스 100으로 총 1500.',
      range: 500, width: 30, dmg: 700, lobDmg: 700, bothBonus: 100, lobR: 100, lobTime: 0.55, ammo: 3, reload: 1.35, cd: 0.45,
    },
    gadgets: [
      { name: '어깨빵', icon: '💥', desc: '주위의 적에게 700 피해를 주고 날려버린다.', range: 170, dmg: 700, knock: 190 },
      { name: '나랑 사귈..레?', icon: '💔', desc: '가장 가까운 상대를 충격에 빠트려 2초 동안 공격 불능으로 만든다.', range: 420, dur: 2 },
    ],
    gadgetCd: 14,
    super: {
      name: '대가리 박치기', aim: 'line',
      desc: '로켓처럼 대가리로 돌진해서 부딪힌 상대에게 1700 피해. 벽은 넘지 못한다.',
      need: 4200, range: 520, width: 40, dmg: 1700, stun: 0.3, dashTime: 0.38,
    },
    starPowers: [
      { id: 'daedu', name: '대두', icon: '🗿', desc: '대가리 박치기 피해가 2200으로 늘어나고, 벽을 부수면서 돌진한다.', dmg: 2200 },
      { id: 'gao', name: '가오업', icon: '😎', desc: '일반공격 범위·피해가 조금 늘어나고, 어깨빵 피해가 900이 되며 날리는 범위가 늘어난다.', atkMul: 1.15, g1Dmg: 900, g1Range: 210, g1Knock: 250 },
    ],
    lines: {
      atk: ['후…', '세모나 받아라', '피하지 마'],
      g1: ['어깨 치고 가냐?', '비켜'],
      g2: ['나랑 사귈..레?', '나..나랑 사귈레?'],
      sup: ['대가리 박치기!!!', '이게 대두의 힘이다'],
      kill: ['…이긴 거야.', '후… 가오 살았다', '반창고는 패션이야'],
    },
  },
  jinho: {
    id: 'jinho',
    name: '이진호',
    rarity: 'mythic',
    role: '어쌔신',
    title: '키 173',
    desc: '키가 무려 173인 남자애. 기린을 닮았고 목이 엄청 길다. 긴 목을 쭉 뻗어 멀리 있는 상대를 들이받는다.',
    radius: 26, speed: 260, maxHp: 4600,
    attack: {
      name: '목 길게 뻗기', aim: 'line',
      desc: '목을 길게 쭉 뻗었다가 다시 끌고 온다. 목에 맞은 상대는 모두 1250 피해. 사정거리가 엄청 길다. (벽에 막힘)',
      range: 560, width: 34, dmg: 1250, ammo: 3, reload: 1.6, cd: 0.6, delay: 0.18,
    },
    gadgets: [
      { name: '훠이훠이', icon: '🙌', desc: '4초 동안 긴 팔을 신명나게 휘저어 주위의 적을 모두 밀쳐내며 600 피해를 주고, 이동 속도가 150%가 된다.', dur: 4, range: 170, dmg: 600, push: 26 },
      { name: '나도 이제 내가 뭔짓을 할지 몰라', icon: '🌀', desc: '목을 엄청나게 뻗고 휘어서 빙글 한 바퀴 휘두른다. 벽 너머까지 닿아 주위 650 안의 상대 모두에게 1500 피해.', range: 650, dmg: 1500, dur: 0.9 },
    ],
    gadgetCd: 11,
    super: {
      name: '기린 뒷발차기', aim: 'line',
      desc: '뒤돌아서 조금 돌진하며 뒷발로 걷어찬다. 앞을 막는 벽을 부수고, 걷어찬 상대에게 2000 피해.',
      need: 4400, range: 200, width: 60, dash: 150, dmg: 2000, kickR: 150, kickHalf: 0.75, knock: 160, dashTime: 0.22,
    },
    starPowers: [
      { id: 'tall', name: '큰 키', icon: '🦒', desc: '모든 공격의 사정거리가 25% 늘어난다.', mul: 1.25 },
      { id: 'disc', name: '목디스크', icon: '🦴', desc: '목 길게 뻗기가 휘어진다. 조준한 쪽 좁은 부채꼴 안의 상대를 모두 맞추고, 벽에 막히지 않고 휘어서 피해 간다.', half: 0.38 },
    ],
    lines: {
      atk: ['목 들어간다~', '닿았다!', '173의 위엄'],
      g1: ['훠이훠이~!!', '저리 가 저리 가!'],
      g2: ['나도 이제 내가 뭔짓을 할지 몰라', '목 간다아아~'],
      sup: ['기린 뒷발차기!!!', '뒤 조심해라~'],
      kill: ['키 차이 봐라', '173은 다르다', '목 길이 승'],
    },
  },
  hyeonwoo: {
    id: 'hyeonwoo',
    name: '서현우',
    rarity: 'super',       // 초희귀
    role: '데미지딜러',
    title: '아재개그 장인',
    desc: '키는 작지만 턱선이 날렵하고 눈이 큰 잘생긴 학생. 입에서 스테이플러 심을 뿜고, 아재개그 한 마디로 상대를 박살낸다.',
    radius: 24, speed: 262, maxHp: 4400,
    attack: {
      name: '스테이플러 심 발사', aim: 'dir',
      desc: '입에서 스테이플러 심 5개를 부채꼴로 발사한다. 한 개당 400 피해.',
      range: 520, half: 0.4, count: 5, dmg: 400, bulletSpeed: 1150, ammo: 3, reload: 1.5, cd: 0.4,
    },
    gadgets: [
      { name: '스테이플러 심 먹기', icon: '📎', desc: '심을 와그작 씹어먹고 궁극기를 가득 충전한다. 다음 일반공격은 심 9개 발사.', count: 9 },
      { name: '종이 먹기', icon: '📄', desc: '종이를 냠냠 먹고 체력 1500 회복.', heal: 1500 },
    ],
    gadgetCd: 10,
    super: {
      name: '아재개그', aim: 'line',
      desc: '조준한 쪽의 상대에게 랜덤한 아재개그 하나: ① 피아노를 던지면? 어떻게 피아노 — 절대 못 피하는 피아노 1800 ② 민수 당긴수 — 밀었다가 끌어옴 (700 + 800) ③ 참기름이 고소해서 — 1.5초 감옥에 가둠 (가둔 동안 때릴 수 있음)',
      need: 4000, range: 560, width: 70,
      piano: { dmg: 1800, fall: 0.7 }, pushpull: { push: 220, pushDmg: 700, pullDmg: 800, wait: 0.55 }, jail: { dur: 1.5 },
    },
    starPowers: [
      { id: 'preview', name: '아재개그 미리보기', icon: '🔮', desc: '다음 궁극기에 어떤 아재개그가 나올지 미리 볼 수 있다.' },
      { id: 'fullsix', name: '에모가 다 차있을 때', icon: '⚡', desc: '일반공격 탄창 3칸이 다 차 있을 때 쏘면 스테이플러 심을 6개 발사한다.', count: 6 },
    ],
    jokes: [
      { id: 'piano', q: '피아노를 던지면?', a: '어떻게 피아노~', icon: '🎹' },
      { id: 'pushpull', q: '민수 당긴수!', a: '밀었다 당겼다~', icon: '↔️' },
      { id: 'jail', q: '참기름과 김밥이 싸웠는데 김밥이 감옥에 간 이유는?', a: '참기름이 고소해서!', icon: '⛓️' },
    ],
    lines: {
      atk: ['퉤퉤퉤!', '심 받아라~', '찰칵찰칵'],
      g1: ['와그작와그작', '심 맛있다'],
      g2: ['종이 냠냠', 'A4는 진리'],
      kill: ['ㅋㅋㅋ 썰렁했지?', '아재개그 맛 어때', '웃기지?'],
    },
  },
  yedam: {
    id: 'yedam',
    name: '방예담',
    rarity: 'mythic',
    role: '힐러',
    title: '사랑을 했다~',
    desc: '키 작고 비쩍 마른 학생. 팔을 쭉 늘려 상대 머리채를 잡고 안 놔준다. 노래 한 곡이면 우리 팀은 살아나고 상대는 귀가 아프다.',
    radius: 22, speed: 268, maxHp: 5200,
    attack: {
      name: '머리뜯기', aim: 'line',
      desc: '팔을 쭉 늘려 손을 날린다. 손이 상대 머리를 잡으면 연결되어 0.15초마다 120 피해, 준 피해의 40%만큼 회복. 한 번에 2명까지 잡을 수 있다. 너무 멀어지거나 사이에 벽이 생기면 끊긴다.',
      range: 440, width: 24, handSpeed: 1500, breakRange: 600, tick: 0.15, dmg: 120, heal: 75, maxT: 5, lifesteal: 0.4, maxGrab: 2, ammo: 3, reload: 1.5, cd: 0.45,
    },
    gadgets: [
      { name: '전력질주', icon: '🏃', desc: '앞으로 쭉 달려 나간 뒤 4초 동안 이동 속도 300%.', dash: 280, dur: 4, mul: 3 },
      { name: '연필 던지기', icon: '✏️', desc: '가까운 상대에게 연필을 던져 500 피해.', dmg: 500, speed: 1100, range: 560 },
    ],
    gadgetCd: 11,
    super: {
      name: '사랑을 했다', aim: 'self',
      desc: '3초 동안 노래를 불러 주위 팀원은 0.75초마다 700 회복, 상대는 500 피해.',
      need: 2600, range: 340, dur: 3, every: 0.75, heal: 700, dmg: 500,
    },
    starPowers: [
      { id: 'geoji', name: '거지들', icon: '🪙', desc: '머리뜯기로 우리 팀을 잡을 수 있다. 잡고 있는 팀원은 0.15초마다 75 회복.' },
      { id: 'economy', name: '경제야 살아라', icon: '📈', desc: '사랑을 했다에 맞은 상대는 1초 동안 기절한다.', stun: 1 },
    ],
    lines: {
      atk: ['머리 내놔!', '잡았다~', '안 놔줘'],
      g1: ['튀어!!!', '전력질주~'],
      g2: ['연필 받아라', '샤프 아니고 연필'],
      sup: ['🎵 사랑을 했다~', '🎵 노래 한 곡 갑니다'],
      kill: ['머리숱 정리 완료', '한 곡 더?', 'ㅋㅋ 탈모 조심'],
    },
  },
  dojun: {
    id: 'dojun',
    name: '편도준',
    rarity: 'mythic',
    role: '데미지딜러',
    title: '운동도 그림도 만렙',
    desc: '운동이면 운동, 그림이면 그림. 카제처럼 폼이 두 개! 🏀 운동폼은 튼튼한 근접 레슬러, 🎨 미술폼은 약하지만 아픈 원거리 화가. 가젯으로 폼을 바꾼다.',
    radius: 24, speed: 270,
    // 기본값 = 운동폼. forms[폼]이 덮어씀 (서버·클라 모두 같은 규칙)
    maxHp: 5800,
    attack: {
      name: '수플렉스', aim: 'dir',
      desc: '앞의 상대를 업어 쳐서 뒤로 넘기며 1200 피해.',
      range: 150, half: 0.7, dmg: 1200, ammo: 3, reload: 1.4, cd: 0.55,
    },
    super: {
      name: '동기부여', aim: 'self',
      desc: '10초 동안 주변 팀원과 나의 이동 속도 50% 증가, 주변 상대는 25% 감소.',
      need: 3800, range: 560, dur: 10, up: 1.5, down: 0.75,
    },
    forms: {
      sport: {
        form: 'sport', formName: '🏀 운동폼', maxHp: 5800,
        attack: { name: '수플렉스', aim: 'dir', desc: '앞의 상대를 업어 쳐서 뒤로 넘기며 1200 피해.', range: 150, half: 0.7, dmg: 1200, ammo: 3, reload: 1.4, cd: 0.55 },
        super: { name: '동기부여', aim: 'self', desc: '10초 동안 주변 팀원과 나의 이동 속도 50% 증가, 주변 상대는 25% 감소.', need: 3800, range: 560, dur: 10, up: 1.5, down: 0.75 },
      },
      art: {
        form: 'art', formName: '🎨 미술폼', maxHp: 3400,
        attack: { name: '물감 발사', aim: 'lob', desc: '물감을 멀리 던져 넓은 범위에 1300 피해, 맞은 상대는 화면 일부가 물감으로 가려진다.', range: 620, lobR: 120, dmg: 1300, blind: 2.5, ammo: 3, reload: 1.9, cd: 0.6 },
        super: { name: '종이 감옥', aim: 'line', desc: '조준한 쪽 첫 상대를 종이로 3초 동안 틀어막는다. 종이가 점점 조여 오며 누르고 찔러 총 1100 피해.', need: 3800, range: 600, width: 45, dur: 3, dmg: 1100, ticks: 4 },
      },
    },
    gadgets: [
      { name: '은밀하게', icon: '🥷', desc: '폼을 바꾼다. 미술폼이 되면 5초 동안 은신, 운동폼이 되면 4초 동안 이동 속도 50% 증가.', invis: 5, fast: 4, mul: 1.5 },
      { name: '모아이🗿🗿', icon: '🗿', desc: '폼을 바꾸면서 3초 동안 모아이 상태: 주는 피해 1.4배, 받는 피해 35% 감소.', dur: 3 },
    ],
    gadgetCd: 13,
    starPowers: [
      { id: 'aura', name: '아우라 파밍', icon: '🔮', desc: '시간이 지날수록, 그리고 상대를 처치할 때마다 아우라 게이지가 차오른다. 가득 차면 아우라가 폭발해 주변 적에게 1972 피해를 주고 6초 동안 모아이 상태가 된다.', fill: 50, perKill: 0.25, range: 320, dmg: 1972, moai: 6 },
      { id: 'slowhit', name: '슬로우', icon: '🐌', desc: '수플렉스와 물감 발사에 맞은 상대는 1초 동안 느려진다.', dur: 1, mul: 0.6 },
    ],
    moai: { dmgMul: 1.4, takeMul: 0.65 },
    lines: {
      atk: ['넘어간다!', '수플렉스~', '한 판 붙자'],
      atkArt: ['물감 받아라', '작품 완성~', '색칠 공부 시간'],
      g1: ['쉿…', '폼 체인지!'],
      g2: ['🗿🗿🗿', '모아이 모드'],
      sup: ['가자!!! 할 수 있어!', '달려!! 동기부여!'],
      supArt: ['종이 감옥!', '갇혀라~'],
      kill: ['그림 같은 승리', 'GG', '🗿'],
    },
  },
  suho: {
    id: 'suho',
    name: '정수호',
    rarity: 'epic',
    role: '탱커',
    title: '데굴데굴 굴러간다~',
    desc: '키가 작고 동글동글한 학생. 몸을 공처럼 말고 데굴데굴 굴러다니며 앞을 막는 상대를 깔아뭉갠다. 오래 구를수록 빨라지고 더 아프다. 살살 꺾으면 속도가 유지되지만 확 꺾으면 느려진다. 목에 늘 빅맥을 끼고 다닌다.',
    radius: 25, speed: 255, maxHp: 5800,
    // 구르기: 움직이는 동안 속도 게이지(0~1)가 차오름 → 이동 속도·깔아뭉개기 피해 ↑. 벽에 부딪히거나 급하게 꺾거나 멈추면 줄어듦
    roll: { fill: 1.6, minMul: 0.9, maxMul: 1.55, turnFast: 10, turnSlow: 4.2, turnLose: 0.35, sharp: 0.7, sharpLose: 2.5, wallKeep: 0.3, hitKeep: 0.55, stopLose: 2.2, supFull: 40, spTurn: 1.5, spLoseMul: 0.35, spWallKeep: 0.6 },
    attack: {
      name: '깔아뭉개기', aim: 'self',
      desc: '굴러다니며 부딪힌 상대를 깔아뭉갠다 (빠를수록 450~1000 피해). 버튼을 누르면 탄 1개로 순간 가속 — 1초 동안 최고 속도 + 피해 2배 (최대 2000).',
      range: 80, minDmg: 450, maxDmg: 1000, hitCd: 0.55, push: 40, boost: 1, boostMul: 1.2, ammo: 2, reload: 3.2, cd: 0.3,
    },
    super: {
      name: '수학 블래스터', aim: 'dir',
      desc: '수학 공식 6개를 부채꼴로 발사. 하나당 1600 피해, 맞추면 준 피해의 50%만큼 체력 회복.',
      need: 5200, range: 620, half: 0.6, count: 6, dmg: 1600, speed: 1050, lifesteal: 0.5,
    },
    gadgets: [
      { name: '빅@맥 발사!', icon: '🍔', desc: '목에 낀 빅맥을 발사한다. 가장 가까운 상대를 따라가는 유도탄으로 1600 피해.', dmg: 1600, speed: 720, range: 1100, turn: 4.5 },
      { name: '빅맥먹방', icon: '😋', desc: '빅맥을 먹고 3000 보호막을 얻는다. 보호막은 6초에 걸쳐 점점 닳는다.', shield: 3000, dur: 6 },
    ],
    gadgetCd: 16,
    starPowers: [
      { id: 'bigmacroad', name: '빅맥로드', icon: '🛣️', desc: '맵에 아주 가끔 빅맥이 떨어진다 (최대 2개). 밟고 지나가면 먹고 1000 회복.', every: 15, max: 2, heal: 1000 },
      { id: 'rollroll', name: '구르고 구르고', icon: '🌀', desc: '방향을 1.5배 더 잘 꺾고, 꺾을 때 속도가 훨씬 덜 줄어든다. 벽에 부딪혀도 속도 60% 유지. 최고 속도로 구르는 동안 기절·얼음에 걸리지 않는다.' },
    ],
    lines: {
      atk: ['비켜비켜~', '부릉부릉!', '굴러간다~'],
      g1: ['빅맥 받아라!', '발사!'],
      g2: ['냠냠', '먹방 시작~'],
      sup: ['수학 시간이다!', '공식 받아라!'],
      kill: ['납작~', 'ㅎㅎ 미안', '데굴데굴 승리'],
    },
  },
  suhun: {
    id: 'suhun',
    name: '이수훈',
    rarity: 'mythic',
    role: '데미지딜러',
    title: '지메 하실?',
    desc: '숱 많은 곱슬 바가지 머리에 늘 무표정한 학생. 지오메트리 대쉬(지메)를 엄청 좋아해서, 궁극기로 상대를 지메 세계로 끌고 가 한 판 붙는다.',
    radius: 24, speed: 262, maxHp: 4600,
    attack: {
      name: '67!!', aim: 'zig',
      desc: '숫자 6과 7 탄환 두 개가 지그재그로 서로 엇갈리며(마름모 3개 모양) 날아가 조준한 지점에서 만난다 (나니처럼 거리 조절). 하나 맞추면 600, 둘 다 맞추면 1400 피해.',
      range: 640, dmg: 600, bothDmg: 1400, amp: 42, lobes: 3, bulletSpeed: 820, ammo: 3, reload: 1.5, cd: 0.4,
    },
    super: {
      name: '지메하세요', aim: 'line',
      desc: '조준한 방향의 첫 번째 상대를 지메 세계로 끌고 간다. 현실에선 둘 다 잠시 사라지고, 지오메트리 대쉬를 하다가 먼저 탈락하는 쪽이 쓰러진다. (점프: 화면 터치 · 스페이스)',
      need: 5200, range: 520, width: 45, dur: 20,
    },
    gadgets: [
      { name: '지메 비행기', icon: '✈️', desc: '4초 동안 지메 비행기를 타고 날아다닌다. 공격을 안 받고 벽 위로 날 수 있으며 이동속도 130% (나는 동안 공격 불가).', dur: 4, mul: 1.3 },
      { name: '블록 4칸 설치', icon: '🧱', desc: '바라보는 쪽 앞에 블록 4칸짜리 벽을 세운다. 10초 뒤 사라진다.', n: 4, size: 50, dist: 140, life: 10 },
    ],
    gadgetCd: 20,
    starPowers: [
      { id: 'traitor', name: '난 친구를 믿지 않아!', icon: '🔪', desc: '팀원도 공격할 수 있다. 팀원을 처치하면 2000 회복 + 1000 보호막 + 공격력 15% 상승 (최대 3번).', heal: 2000, shield: 1000, up: 0.15, max: 3 },
      { id: 'takel', name: 'L을 가져가', icon: '🕺', desc: '상대를 처치하면 「L을 가져가」 춤을 추며 티배깅하고 공격력이 10% 상승 (최대 30%). 춤추는 1.2초 동안은 못 움직인다.', up: 0.1, max: 0.3, dance: 1.2 },
    ],
    lines: {
      atk: ['67!!', '육칠!', '6 7'],
      g1: ['비행 모드 ON', '슝~'],
      g2: ['블록 설치', '지메 블록이다'],
      sup: ['지메하세요', '지메 한 판 해'],
      kill: ['GG', 'ㅋ', 'L을 가져가'],
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

// 훈련장 로봇 (선택 목록엔 안 나옴): 움직이지도 공격하지도 않음
const ROBOTS = {
  robot: { id:'robot', name:'훈련 로봇', radius:28, speed:0, maxHp:5000, attack:{ ammo:0, range:0 }, gadgets:[], starPowers:[], super:null },
  bigrobot: { id:'bigrobot', name:'튼튼 로봇', radius:40, speed:0, maxHp:20000, attack:{ ammo:0, range:0 }, gadgets:[], starPowers:[], super:null },
  safe: { id:'safe', name:'금고', radius:52, speed:0, maxHp:60000, attack:{ ammo:0, range:0 }, gadgets:[], starPowers:[], super:null },    // 하이스트
};

module.exports = { BRAWLERS, GEARS, AJAE, ROBOTS, publicBrawlers };
