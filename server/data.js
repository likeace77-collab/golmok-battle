// 골목대전 게임 데이터: 타입, 상성, 스킬, 골목몬, 아바타 옵션
// 밸런스를 바꾸고 싶으면 이 파일만 고치면 됩니다.

const TYPES = {
  fire:   { n: '불',   c: '#E8402C' },
  water:  { n: '물',   c: '#2F7DE1' },
  grass:  { n: '풀',   c: '#3FA34D' },
  elec:   { n: '전기', c: '#F2B705' },
  ice:    { n: '얼음', c: '#4CC3D9' },
  earth:  { n: '땅',   c: '#A9713A' },
  wind:   { n: '바람', c: '#7FB8A4' },
  poison: { n: '독',   c: '#9A4FB8' },
  steel:  { n: '쇠',   c: '#7C8798' },
  spirit: { n: '혼',   c: '#4B3F9E' },
  fairy:  { n: '페어리', c: '#F27FA5' },
  normal: { n: '노말', c: '#A8A77A' },
  none:   { n: '타입 없음', c: '#B9AE9A' },
};

// 공격 타입 → 방어 타입 배율. 적혀 있지 않으면 1배.
const CHART = {
  fire:   { grass: 2, ice: 2, steel: 2, water: .5, earth: .5, fire: .5 },
  water:  { fire: 2, earth: 2, water: .5, grass: .5, ice: .5 },
  grass:  { water: 2, earth: 2, fire: .5, grass: .5, poison: .5, wind: .5, steel: .5 },
  elec:   { water: 2, wind: 2, grass: .5, elec: .5, earth: 0 },
  ice:    { grass: 2, earth: 2, wind: 2, fire: .5, water: .5, ice: .5, steel: .5 },
  earth:  { fire: 2, elec: 2, poison: 2, steel: 2, grass: .5, wind: 0 },
  wind:   { grass: 2, spirit: 2, elec: .5, steel: .5, earth: .5 },
  poison: { grass: 2, water: 2, fairy: 2, poison: .5, earth: .5, spirit: .5, steel: 0 },
  steel:  { ice: 2, spirit: 2, fairy: 2, normal: 2, fire: .5, water: .5, elec: .5, steel: .5 },
  spirit: { spirit: 2, poison: 2, steel: .5, fairy: .5, normal: 0 },
  fairy:  { spirit: 2, earth: 2, fire: .5, poison: .5, steel: .5 },
  normal: { steel: .5, spirit: 0 },
  none:   {},
};

// cat: p 물리 / s 특수 / x 변화
// st: 상태이상 {s, ch} / fl: 풀죽음 확률 / self·foe: 능력치 변화 / sc: foe 능력치 변화 확률
const M = (n, type, cat, pow, acc, pp, extra = {}) => ({ n, type, cat, pow, acc, pp, pri: 0, ...extra });

const MOVES = {
  // 불
  ember:     M('불씨 튕기기', 'fire', 's', 45, 100, 25, { st: { s: 'brn', ch: 10 }, d: '10% 확률로 화상' }),
  flame:     M('화끈한 불쇼', 'fire', 's', 90, 100, 15, { st: { s: 'brn', ch: 10 }, d: '10% 확률로 화상' }),
  blaze:     M('장작 대폭발', 'fire', 's', 120, 80, 5, { st: { s: 'brn', ch: 30 }, d: '30% 확률로 화상' }),
  coalhead:  M('숯불 박치기', 'fire', 'p', 80, 100, 15, { st: { s: 'brn', ch: 10 }, d: '10% 확률로 화상' }),
  firerush:  M('불덩이 돌진', 'fire', 'p', 115, 100, 10, { recoil: .33, d: '준 피해의 1/3을 반동으로 입음' }),
  heatwave:  M('땡볕', 'fire', 'x', 0, null, 5, { weather: 'sun', self_: true, d: '5턴 동안 불 기술 1.5배, 물 기술 절반' }),
  // 물
  squirt:    M('물총 쏘기', 'water', 's', 45, 100, 25, { d: '기본 물 공격' }),
  bucket:    M('양동이 물벼락', 'water', 's', 90, 100, 15, { d: '안정적인 물 공격' }),
  hose:      M('소방호스', 'water', 's', 115, 80, 5, { d: '강하지만 빗나갈 수 있음' }),
  paddle:    M('빨랫방망이', 'water', 'p', 80, 100, 15, { fl: 20, d: '20% 확률로 풀죽음' }),
  rainy:     M('소나기', 'water', 'x', 0, null, 5, { weather: 'rain', self_: true, d: '5턴 동안 물 기술 1.5배, 불 기술 절반' }),
  // 풀
  leafcut:   M('풀잎 베기', 'grass', 'p', 60, 100, 25, { crit: true, d: '급소에 잘 맞음' }),
  vinewhip:  M('덩굴 채찍', 'grass', 'p', 85, 100, 15, { d: '안정적인 풀 공격' }),
  sapdrain:  M('양분 빨기', 'grass', 's', 75, 100, 10, { drain: .5, d: '준 피해의 절반을 회복' }),
  pollen:    M('꽃가루 폭풍', 'grass', 's', 115, 85, 5, { d: '강하지만 빗나갈 수 있음' }),
  seed:      M('씨앗 심기', 'grass', 'x', 0, 90, 10, { seed: true, d: '매 턴 상대 체력을 빼앗음 (풀 타입 면역)' }),
  sunbathe:  M('광합성', 'grass', 'x', 0, null, 5, { heal: .5, self_: true, d: '최대 체력의 절반 회복' }),
  lullaby:   M('자장가 홀씨', 'grass', 'x', 0, 75, 10, { st: { s: 'slp', ch: 100 }, d: '상대를 재움' }),
  // 전기
  static:    M('정전기', 'elec', 's', 45, 100, 25, { st: { s: 'par', ch: 10 }, d: '10% 확률로 마비' }),
  highvolt:  M('고압 전류', 'elec', 's', 90, 100, 15, { st: { s: 'par', ch: 10 }, d: '10% 확률로 마비' }),
  bolt:      M('벼락', 'elec', 's', 115, 70, 5, { st: { s: 'par', ch: 30 }, d: '30% 확률로 마비' }),
  shortfist: M('합선 주먹', 'elec', 'p', 75, 100, 15, { st: { s: 'par', ch: 10 }, d: '10% 확률로 마비' }),
  shock:     M('감전', 'elec', 'x', 0, 90, 15, { st: { s: 'par', ch: 100 }, immune: true, d: '상대를 마비시킴' }),
  charge:    M('급속 충전', 'elec', 'x', 0, null, 15, { self: { spa: 1, spd: 1 }, self_: true, d: '특공과 특방 1단계 상승' }),
  // 얼음
  frost:     M('서리 바람', 'ice', 's', 45, 100, 25, { st: { s: 'frz', ch: 10 }, d: '10% 확률로 얼림' }),
  icestorm:  M('얼음 폭풍', 'ice', 's', 90, 100, 10, { st: { s: 'frz', ch: 10 }, d: '10% 확률로 얼림' }),
  blizzard:  M('눈보라', 'ice', 's', 115, 70, 5, { st: { s: 'frz', ch: 30 }, d: '30% 확률로 얼림' }),
  icicle:    M('고드름 찌르기', 'ice', 'p', 80, 100, 15, { st: { s: 'frz', ch: 10 }, d: '10% 확률로 얼림' }),
  brainfrz:  M('머리 띵', 'ice', 's', 70, 100, 15, { foe: { spa: -1 }, sc: 50, d: '50% 확률로 상대 특공 하락' }),
  // 땅
  dirt:      M('흙 뿌리기', 'earth', 'x', 0, 100, 15, { foe: { acc: -1 }, d: '상대 명중률 1단계 하락' }),
  quake:     M('땅 울리기', 'earth', 'p', 100, 100, 10, { d: '강력한 땅 공격' }),
  rockthrow: M('짱돌 던지기', 'earth', 'p', 75, 90, 15, { fl: 20, d: '20% 확률로 풀죽음' }),
  grind:     M('맷돌 돌리기', 'earth', 'p', 45, 100, 15, { hits: [2, 2], d: '2번 연속 공격' }),
  wall:      M('담벼락 쌓기', 'earth', 'x', 0, null, 10, { self: { def: 2 }, self_: true, d: '방어 2단계 상승' }),
  dust:      M('황사', 'earth', 'x', 0, null, 5, { weather: 'dust', self_: true, d: '5턴 동안 땅·쇠 외 타입에 매 턴 피해' }),
  // 바람
  gust:      M('돌풍', 'wind', 's', 75, 100, 15, { fl: 20, d: '20% 확률로 풀죽음' }),
  twister:   M('회오리', 'wind', 's', 115, 75, 5, { d: '강하지만 빗나갈 수 있음' }),
  razorwind: M('칼바람', 'wind', 'p', 70, 100, 15, { crit: true, d: '급소에 잘 맞음' }),
  windcut:   M('바람 가르기', 'wind', 'p', 40, 100, 25, { pri: 1, d: '선제 공격' }),
  breeze:    M('산들바람', 'wind', 'x', 0, null, 15, { self: { spe: 2 }, self_: true, d: '스피드 2단계 상승' }),
  // 독
  spit:      M('독 뱉기', 'poison', 's', 65, 100, 20, { st: { s: 'psn', ch: 30 }, d: '30% 확률로 독' }),
  sting:     M('독침 찌르기', 'poison', 'p', 80, 100, 15, { st: { s: 'psn', ch: 30 }, d: '30% 확률로 독' }),
  sludge:    M('오물 폭탄', 'poison', 's', 95, 100, 10, { st: { s: 'psn', ch: 30 }, d: '30% 확률로 독' }),
  fog:       M('맹독 안개', 'poison', 'x', 0, 90, 10, { st: { s: 'psn', ch: 100 }, immune: true, d: '상대를 독에 빠뜨림' }),
  stench:    M('묵은 냄새', 'poison', 'x', 0, 100, 15, { foe: { atk: -1, spa: -1 }, d: '상대 공격과 특공 1단계 하락' }),
  // 쇠
  ironhead:  M('쇠 박치기', 'steel', 'p', 85, 100, 15, { fl: 20, d: '20% 확률로 풀죽음' }),
  hammer:    M('해머 내려치기', 'steel', 'p', 115, 90, 5, { self: { spe: -1 }, selfAfter: true, d: '사용 후 자신의 스피드 하락' }),
  scrap:     M('쇳조각 뿌리기', 'steel', 'p', 25, 100, 15, { hits: [2, 5], d: '2~5번 연속 공격' }),
  magnet:    M('자석포', 'steel', 's', 85, 100, 15, { d: '안정적인 쇠 특수 공격' }),
  tacks:     M('압정 뿌리기', 'steel', 'x', 0, null, 10, { hazard: true, self_: true, d: '상대가 교체할 때마다 피해 (바람 타입 면역)' }),
  armor:     M('양철 두르기', 'steel', 'x', 0, null, 10, { self: { def: 1, spd: 1 }, self_: true, d: '방어와 특방 1단계 상승' }),
  // 혼
  wisp:      M('도깨비불', 'spirit', 'x', 0, 85, 15, { st: { s: 'brn', ch: 100 }, d: '상대에게 화상' }),
  scold:     M('혼쭐내기', 'spirit', 's', 80, 100, 15, { foe: { spd: -1 }, sc: 20, d: '20% 확률로 상대 특방 하락' }),
  ambush:    M('그림자 습격', 'spirit', 'p', 40, 100, 25, { pri: 1, d: '선제 공격' }),
  nightmare: M('가위 눌림', 'spirit', 'x', 0, 70, 10, { st: { s: 'slp', ch: 100 }, d: '상대를 재움' }),
  club:      M('도깨비 방망이', 'spirit', 'p', 90, 100, 10, { fl: 10, d: '10% 확률로 풀죽음' }),
  ttukttak:  M('금 나와라 뚝딱', 'spirit', 'x', 0, null, 10, { self: { atk: 2 }, self_: true, d: '공격 2단계 상승' }),
  soulrush:  M('혼 갈아넣기', 'spirit', 'p', 120, 100, 5, { recoil: .33, d: '준 피해의 1/3을 반동으로 입음' }),
  // 신캐 전용 기술
  lid:       M('뚜껑 날리기', 'steel', 'p', 100, 90, 10, { fl: 20, d: '20% 확률로 풀죽음' }),
  gnaw:      M('몰래 갉기', 'poison', 'p', 40, 100, 20, { pri: 1, st: { s: 'psn', ch: 20 }, d: '선제 공격, 20% 확률로 독' }),
  backflow:  M('역류', 'water', 's', 80, 100, 10, { rainBoost: true, d: '소나기 중에는 위력 2배' }),
  tangle:    M('엉겨붙기', 'spirit', 'x', 0, 90, 10, { seed: 'any', d: '매 턴 상대 체력을 빼앗음' }),
  plunge:    M('뻥 뚫기', 'earth', 'p', 85, 100, 10, { breakGuard: true, clearHazard: true, d: '막기를 뚫고 명중, 내 쪽에 깔린 압정 제거' }),
  broth:     M('국물 끼얹기', 'fire', 's', 80, 100, 15, { st: { s: 'brn', ch: 30 }, d: '30% 확률로 화상' }),
  mustard:   M('막장 찍기', 'earth', 'p', 80, 100, 15, { foe: { acc: -1 }, sc: 30, d: '30% 확률로 상대 명중률 하락' }),
  refill:    M('국물 리필', 'water', 'x', 0, null, 5, { heal: .5, cure: true, self_: true, d: '체력 절반 회복, 상태이상 치료' }),
  honeybomb: M('꿀 폭탄', 'fire', 'p', 100, 100, 10, { recoil: .33, st: { s: 'brn', ch: 20 }, d: '반동 1/3, 20% 확률로 화상' }),
  molt:      M('허물 벗기', 'grass', 'x', 0, null, 10, { self: { atk: 1, spa: 1, spe: 1, def: -1, spd: -1 }, self_: true, d: '방어·특방 하락, 공격·특공·스피드 상승' }),
  // 전용기
  gugong: M('구공탄 폭렬', 'fire', 'p', 95, 100, 10, { foe: { def: -1 }, sc: 30, sig: true, d: '30% 확률로 상대 방어 하락' }),
  headfirst: M('머리부터 먹기', 'fire', 'p', 65, 100, 15, { pri: 1, sig: true, d: '선제 공격' }),
  rekindle: M('꺼진 불도 다시', 'spirit', 's', 95, 100, 10, { st: { s: 'brn', ch: 30 }, sig: true, d: '30% 확률로 화상' }),
  boil: M('펄펄 끓는 물', 'water', 's', 85, 100, 15, { st: { s: 'brn', ch: 30 }, sig: true, d: '30% 확률로 화상' }),
  kimjang: M('김장 육탄전', 'water', 'p', 90, 100, 10, { drain: .25, sig: true, d: '준 피해의 1/4을 회복' }),
  umbrellastab: M('우산살 찌르기', 'wind', 's', 80, 100, 10, { rainBoost: true, sig: true, d: '소나기 중에는 위력 2배' }),
  sprout: M('콩나물 쑥쑥', 'grass', 'x', 0, null, 10, { heal: .25, self: { spa: 1, spd: 1 }, self_: true, sig: true, d: '체력 1/4 회복, 특공과 특방 상승' }),
  sweep: M('싹쓸이', 'wind', 'p', 90, 100, 10, { clearHazard: true, sig: true, d: '내 쪽에 깔린 압정 제거' }),
  cheongyang: M('청양 한입', 'fire', 's', 100, 90, 10, { st: { s: 'brn', ch: 30 }, sig: true, d: '30% 확률로 화상' }),
  wirewrap: M('고압선 감기', 'elec', 'p', 85, 100, 10, { st: { s: 'par', ch: 30 }, sig: true, d: '30% 확률로 마비' }),
  mash: M('버튼 연타', 'elec', 's', 25, 100, 15, { hits: [2, 5], sig: true, d: '2~5번 연속 공격' }),
  kitefight: M('연싸움', 'wind', 's', 80, 100, 15, { foe: { spe: -1 }, sig: true, d: '상대 스피드 1단계 하락' }),
  patmix: M('팥 비비기', 'ice', 's', 85, 100, 15, { st: { s: 'frz', ch: 20 }, sig: true, d: '20% 확률로 얼림' }),
  icepack: M('아이스팩 강타', 'ice', 'p', 90, 100, 10, { st: { s: 'frz', ch: 20 }, sig: true, d: '20% 확률로 얼림' }),
  aged: M('삼 년 묵은 장', 'poison', 's', 90, 100, 10, { st: { s: 'psn', ch: 50 }, sig: true, d: '50% 확률로 독' }),
  eoi: M('어이 강타', 'earth', 'p', 115, 90, 5, { self: { spe: -1 }, selfAfter: true, sig: true, d: '사용 후 자신의 스피드 하락' }),
  glare: M('눈 부릅뜨기', 'earth', 'x', 0, 100, 15, { foe: { atk: -1, spe: -1 }, sig: true, d: '상대 공격과 스피드 1단계 하락' }),
  turbo: M('회전 강풍', 'wind', 's', 90, 100, 10, { self: { spe: 1 }, selfAfter: true, sig: true, d: '사용 후 자신의 스피드 상승' }),
  wrestle: M('왼다리 걸기', 'spirit', 'p', 85, 100, 10, { foe: { def: -1 }, sc: 50, sig: true, d: '50% 확률로 상대 방어 하락' }),
  kick: M('깡통 차기', 'steel', 'p', 85, 100, 10, { fl: 30, sig: true, d: '30% 확률로 풀죽음' }),
  bagged: M('봉지 씌우기', 'wind', 'x', 0, 90, 10, { foe: { acc: -2 }, sig: true, d: '상대 명중률 2단계 하락' }),
  // 페어리
  pixiedust: M('반짝 가루', 'fairy', 's', 80, 100, 15, { d: '안정적인 페어리 공격' }),
  charm:     M('매혹의 눈빛', 'fairy', 'x', 0, 100, 15, { foe: { atk: -2 }, d: '상대 공격 2단계 하락' }),
  fairydance:M('요정의 춤', 'fairy', 'x', 0, null, 15, { self: { spa: 1, spe: 1 }, self_: true, d: '특공과 스피드 1단계 상승' }),
  neonwink:  M('네온 윙크', 'fairy', 's', 85, 100, 10, { foe: { atk: -1 }, sc: 50, d: '50% 확률로 상대 공격 하락' }),
  lipmark:   M('입술 도장', 'fairy', 's', 85, 100, 10, { foe: { spa: -1 }, sc: 50, d: '50% 확률로 상대 특공 하락' }),
  // 단조 (강화 용사)
  forge:     M('강화', 'steel', 'x', 0, null, 15, { forge: true, self_: true, d: '100% 확률로 다음 단계로 강화. 체력이 약간, 공격과 방어가 크게 오름 (나무→철→금→다이아몬드→네더라이트→네더라이트+1 … +10)' }),
  tierslash: M('강화 베기', 'steel', 'p', 50, 100, 15, { tierPow: 22, d: '강화 단계마다 위력 22 증가 (네더라이트에서 최대 138)' }),
  elemblade: M('특성검술', 'steel', 'p', 100, 100, 10, { elem: true, d: '무작위 속성을 검에 실어 벤다. 화염: 화상 60% / 파도: 상대 스피드 2단계↓ / 신록: 피해 절반 흡수 / 뇌광: 마비 50% / 빙결: 얼림 35% / 대지: 상대 방어 2단계↓ / 질풍: 반드시 급소 / 맹독: 독 80% / 혼백: 풀죽음 50%·상대 특방↓ / 성광: 상대 공격 2단계↓ / 강철: 위력 130. 상대에게 효과가 없는 속성은 나오지 않는다' }),
  reflector: M('리플렉터', 'steel', 'x', 0, null, 10, { reflect: true, pri: 4, d: '스피드와 상관없이 먼저 방패를 든다. 이번 턴 공격을 받으면 피해를 반씩 나눠, 단조는 50%만 받고 나머지 50%를 검으로 찔러 돌려준다. 상대가 공격하지 않으면 그냥 찌른다. 연속으로 쓰면 실패하기 쉽다' }),
  shieldbash: M('방패 밀치기', 'steel', 'p', 60, 100, 15, { fl: 30, d: '30% 확률로 풀죽음' }),
  lionroar:  M('사자후', 'normal', 'x', 0, 100, 10, { foe: { atk: -1, def: -1 }, d: '방패의 사자가 포효한다. 상대 공격과 방어 하락' }),
  // 루미나 (견습 마법사)
  crystalbolt: M('크리스탈 마탄', 'fairy', 's', 90, 100, 10, { st: { s: 'par', ch: 20 }, d: '지팡이의 수정이 빛을 쏜다. 20% 확률로 마비' }),
  focusmana: M('마력 집중', 'fairy', 'x', 0, null, 10, { self: { spa: 2 }, self_: true, d: '특공 2단계 상승' }),
  potion:    M('물약 한 모금', 'normal', 'x', 0, null, 5, { heal: .5, cure: true, self_: true, d: '허리춤 물약을 마신다. 체력 절반 회복, 상태이상 치료' }),
  sparkcircle: M('번개 마법진', 'elec', 's', 70, 100, 15, { foe: { spd: -1 }, sc: 30, d: '손바닥 마법진에서 전기가 튄다. 30% 확률로 상대 특방 하락' }),
  // 실비아 (궁수)
  winksnipe: M('윙크 저격', 'fairy', 'p', 90, 100, 10, { crit: true, d: '한쪽 눈을 감고 쏜다. 급소에 잘 맞음' }),
  arrowrain: M('화살 연사', 'wind', 'p', 25, 95, 15, { hits: [2, 5], d: '2~5번 연속 공격' }),
  snarearrow: M('올가미 화살', 'wind', 'p', 55, 100, 15, { foe: { spe: -1 }, d: '상대 스피드 1단계 하락' }),
  throwknife: M('단검 투척', 'steel', 'p', 50, 100, 20, { pri: 1, d: '허벅지 단검을 던진다. 선제 공격' }),
  hawkeye:   M('매의 눈', 'normal', 'x', 0, null, 10, { self: { atk: 1, acc: 1 }, self_: true, d: '공격과 명중률 1단계 상승' }),
  canburst:  M('캔 연사', 'steel', 'p', 25, 100, 15, { hits: [2, 5], d: '2~5번 연속 공격' }),
  bulletdash:M('총알 배달', 'wind', 'p', 65, 100, 15, { pri: 1, d: '선제 공격' }),
  spincycle: M('탈수 회전', 'water', 's', 85, 100, 10, { foe: { spe: -1 }, d: '상대 스피드 1단계 하락' }),
  icicledrop:M('처마 낙하', 'ice', 's', 80, 100, 10, { crit: true, st: { s: 'frz', ch: 20 }, d: '처마 끝 고드름이 떨어진다. 급소에 잘 맞고 20% 확률로 얼림' }),
  stoneegg:  M('맥반석 투척', 'fire', 'p', 80, 100, 10, { bath: true, d: '온탕일 땐 불 타입·30% 화상, 냉탕일 땐 얼음 타입·30% 얼림' }),
  vineshock: M('덩굴 감전', 'elec', 's', 75, 100, 15, { st: { s: 'par', ch: 30 }, d: '전기가 흐르는 덩굴로 휘감는다. 30% 확률로 마비' }),
  scrub:     M('때밀이', 'water', 's', 75, 100, 15, { clearFoe: true, d: '이태리타월로 박박. 상대의 능력치 상승을 모두 없앤다' }),
  metalnoise:M('금속음', 'steel', 's', 65, 100, 10, { foe: { spd: -2 }, d: '앰프로 키운 쇳소리. 상대 특방 2단계 하락' }),
  bangalzzuk:M('반갈쭉', 'fire', 'p', 100, 100, 10, { split: true, d: '몸을 세로로 반 갈라 속을 확인한다. 팥붕: 팥을 던져 강하게 공격(혼 타입에게 2배) / 슈붕: 체력 절반 회복 / 피붕: 공격·방어·스피드 1단계 상승' }),
  rageaxe:   M('분노의 도끼', 'fire', 'p', 70, 100, 10, { rage: true, d: '잃은 체력이 많을수록 강해진다. 위력 70~150' }),
  yellowgust:M('황사 경보', 'earth', 'p', 25, 95, 15, { hits: [2, 5], d: '모래 알갱이가 2~5번 연속으로 때린다' }),
  // 신캐 10종
  trucksudden:M('갑툭튀 트럭', 'steel', 'p', 80, 100, 10, { pri: 1, d: '트럭은 언제나 갑자기 나타난다. 우선도 +1' }),
  jellypress:M('말랑 덮치기', 'water', 's', 80, 100, 10, { drain: .5, d: '말랑한 몸으로 덮친다. 준 피해의 절반을 회복' }),
  holysword: M('성검 내려치기', 'fairy', 'p', 90, 100, 10, { crit: true, d: '반쯤 뽑힌 성검으로 내려친다. 급소에 잘 맞음' }),
  forbidpage:M('금지된 페이지', 'fire', 's', 95, 95, 10, { st: { s: 'brn', ch: 20 }, d: '읽으면 안 되는 주문을 읽는다. 20% 확률로 화상' }),
  chomp:     M('덥석', 'spirit', 'p', 85, 100, 10, { fl: 30, d: '보물인 줄 알고 다가온 상대를 문다. 30% 확률로 풀죽음' }),
  cicadacry: M('7년의 울음', 'grass', 's', 85, 100, 10, { sound: true, foe: { spd: -1 }, sc: 30, d: '[소리] 땅속에서 7년을 참은 울음. 30% 확률로 상대 특방 하락' }),
  bloodsuck: M('흡혈 침', 'poison', 's', 75, 100, 10, { drain: .5, d: '피를 쪽쪽 빤다. 준 피해의 절반을 회복' }),
  flutter:   M('푸드덕', 'wind', 'p', 80, 100, 10, { foe: { acc: -1 }, sc: 30, d: '깃털과 빵가루를 날린다. 30% 확률로 상대 명중률 하락' }),
  nyanpunch: M('냥냥펀치', 'fairy', 'p', 22, 100, 15, { hits: [3, 5], d: '앞발로 3~5번 연속 펀치' }),
  roachrush: M('바선생 등장', 'poison', 'p', 85, 100, 10, { fl: 30, d: '갑자기 나타나 모두를 얼어붙게 한다. 30% 확률로 풀죽음' }),
  // 등신 (개복치)
  glasscannon: M('유리대포', 'elec', 's', 200, 100, 5, { glass: true, d: '200 위력의 전기 대포. 2번 연속으로 쓰면 25% 확률로 즉사' }),
  ramdeath:  M('돌연사-들이박기', 'normal', 'p', 0, 100, 5, { kamikaze: true, d: '상대를 들이박아 상대와 함께 사망한다 (막히면 혼자 사망)' }),
  vinyl:     M('돌연사-비닐봉지 섭취', 'normal', 'x', 0, null, 5, { vinyl: true, self_: true, d: '비닐봉지를 먹는다. 35% 확률로 즉사, 65% 확률로 체력이 가득 참' }),
  pufferspike: M('가시복', 'poison', 'x', 0, null, 10, { spiky: true, pri: 3, self_: true, d: '가시를 세운다. 이번 턴 상대의 물리 공격을 막고 가시로 찌른다. 물리 공격을 안 받으면 자기 가시에 찔린다' }),
  hydrate:   M('수분보충', 'water', 'x', 0, null, 5, { hydrate: true, self_: true, d: '물을 마셔 갈증 게이지를 100%로 채운다. 25% 확률로 플라스틱 조각을 삼켜 즉사' }),
  ignite:    M('불타올라라', 'fire', 'x', 0, null, 5, { ignite: true, self_: true, d: '온몸이 불타오른다. 20% 확률로 타 죽음. 상대는 50% 확률로 공포에 질려 다음 공격을 못 하고, 이후 쓰는 기술 4개에 화상(50%)과 피해 1.5배가 붙는다' }),
  overcome:  M('갈증 극복', 'water', 's', 70, null, 5, { overcome: true, d: '슬쩍 물 밖으로 나가 본다. 75% 성공: 갈증 게이지가 사라지고 상대에게 물을 날려 70 피해. 25% 실패: 최대 체력의 절반을 잃고 물속으로 돌아옴' }),
  dice:      M('주사위 굴리기', 'wind', 'x', 0, null, 10, { dice: true, d: '주사위 눈에 따라: 1 즉사 / 2 능력치 2개 상승 / 3 상대에게 1~200 피해 / 4 능력치 4개 상승 / 5 체력 모두 회복 / 6 모든 능력치 상승' }),
  mockspit:  M('침뱉기', 'water', 'x', 0, 100, 15, { foe: { acc: -1, def: -1, spd: -1 }, sc: 70, d: '침을 뱉어 도발한다. 70% 확률로 도발에 걸려 상대의 명중률·방어·특방이 떨어짐' }),
  irontail:  M('아이언테일', 'steel', 'p', 150, 100, 5, { ironTail: true, d: '꼬리를 강철로 바꿔 내려친다. 33% 확률로 꼬리가 무거워 돌연사' }),
  // 보통
  tackle:    M('몸통 박치기', 'normal', 'p', 50, 100, 30, { d: '기본 공격' }),
  guard:     M('막기', 'normal', 'x', 0, null, 10, { protect: true, pri: 3, self_: true, d: '이번 턴 공격을 막음 (연속 사용 시 실패하기 쉬움)' }),
  nap:       M('낮잠', 'normal', 'x', 0, null, 5, { nap: true, self_: true, d: '체력을 모두 회복하고 2턴 잠듦' }),
  spirit_up: M('기합 넣기', 'normal', 'x', 0, null, 15, { self: { atk: 1, spe: 1 }, self_: true, d: '공격과 스피드 1단계 상승' }),
};

// 공격 안 되는 상황 전용 기술. 팀에는 넣을 수 없음.
const STRUGGLE = M('악쓰기', 'none', 'p', 50, null, 1, { recoil: .25, d: '기술을 다 쓰면 나감' });

const X = (n, types, hp, atk, def, spa, spd, spe, moves, flavor) =>
  ({ n, types, base: { hp, atk, def, spa, spd, spe }, moves, flavor });

const MONSTERS = {
  yeontan:  X('연탄이', ['fire', 'earth'], 95, 105, 95, 60, 70, 55,
    ['ember', 'coalhead', 'firerush', 'quake', 'rockthrow', 'wall', 'heatwave', 'tackle', 'guard'],
    '구멍 스물두 개로 숨을 쉰다. 다 타면 하얗게 삐친다.'),
  bungbbang:X('붕빵이', ['fire'], 70, 110, 65, 70, 65, 115,
    ['ember', 'coalhead', 'firerush', 'razorwind', 'spirit_up', 'windcut', 'tackle', 'guard'],
    '머리부터 먹히느냐 꼬리부터 먹히느냐로 평생 고민한다.'),
  horong:   X('호롱이', ['fire', 'spirit'], 65, 50, 70, 120, 95, 90,
    ['ember', 'flame', 'blaze', 'wisp', 'scold', 'nightmare', 'heatwave', 'guard'],
    '꺼진 줄 알고 돌아보면 다시 켜져 있다.'),
  kettle:   X('주전이', ['water', 'steel'], 90, 55, 100, 95, 95, 50,
    ['squirt', 'bucket', 'hose', 'magnet', 'armor', 'tacks', 'rainy', 'flame', 'nap'],
    '끓어오르면 뚜껑이 먼저 화를 낸다.'),
  daeya:    X('대야몽', ['water'], 130, 80, 95, 70, 90, 35,
    ['squirt', 'bucket', 'paddle', 'rainy', 'nap', 'quake', 'tackle', 'guard', 'icicle'],
    '김장철이 오면 몸집이 두 배로 불어난다.'),
  usan:     X('우산령', ['water', 'wind'], 70, 60, 75, 105, 80, 105,
    ['squirt', 'bucket', 'gust', 'twister', 'rainy', 'breeze', 'hose', 'guard'],
    '지하철에 두고 내린 우산들이 모여 하나가 되었다.'),
  kongsiru: X('콩시루', ['grass'], 100, 60, 85, 100, 95, 60,
    ['sapdrain', 'pollen', 'seed', 'sunbathe', 'lullaby', 'leafcut', 'guard', 'stench'],
    '물만 주면 아무 말 없이 자란다. 뚜껑을 열면 비린내로 화낸다.'),
  ssaribi:  X('싸리비', ['grass', 'wind'], 65, 100, 70, 60, 70, 125,
    ['leafcut', 'vinewhip', 'razorwind', 'windcut', 'breeze', 'seed', 'spirit_up', 'guard'],
    '새벽 네 시에 골목을 쓸고 다닌다. 아무도 본 적은 없다.'),
  ttaengcho:X('땡초', ['grass', 'fire'], 60, 115, 60, 115, 60, 110,
    ['leafcut', 'vinewhip', 'coalhead', 'flame', 'pollen', 'firerush', 'spirit_up', 'heatwave'],
    '작다고 얕보고 깨문 사람은 다음 날까지 후회한다.'),
  jeonbot:  X('전봇이', ['elec', 'steel'], 85, 85, 105, 100, 80, 60,
    ['static', 'highvolt', 'bolt', 'shortfist', 'shock', 'ironhead', 'armor', 'tacks'],
    '전단지를 붙이면 간지럽다고 몸을 떤다.'),
  orak:     X('오락이', ['elec', 'spirit'], 70, 60, 70, 120, 75, 105,
    ['static', 'highvolt', 'bolt', 'scold', 'shock', 'charge', 'nightmare', 'guard'],
    '문방구 앞에서 백 원을 먹고 산다. 이어하기는 없다.'),
  bangpae:  X('방패연', ['elec', 'wind'], 65, 55, 65, 110, 75, 130,
    ['static', 'highvolt', 'gust', 'twister', 'breeze', 'shock', 'charge', 'guard'],
    '가운데 구멍으로 바람과 번개를 통과시킨다.'),
  bingsu:   X('빙수리', ['ice'], 85, 60, 75, 110, 100, 70,
    ['frost', 'icestorm', 'blizzard', 'brainfrz', 'sunbathe', 'squirt', 'guard', 'stench'],
    '팥을 먼저 비비느냐 나중에 비비느냐로 친구를 잃었다.'),
  bonaeng:  X('보냉이', ['ice', 'steel'], 95, 100, 105, 60, 85, 50,
    ['frost', 'icicle', 'ironhead', 'hammer', 'armor', 'tacks', 'brainfrz', 'guard'],
    '소풍날 하루만 일하고 일 년을 잔다.'),
  jangdok:  X('장독이', ['poison', 'earth'], 110, 80, 100, 90, 95, 30,
    ['spit', 'sludge', 'fog', 'stench', 'quake', 'wall', 'dust', 'nap'],
    '뚜껑은 절대 열지 말 것. 삼 년 묵었다.'),
  maetdol:  X('맷돌이', ['earth'], 105, 120, 110, 40, 75, 45,
    ['quake', 'rockthrow', 'grind', 'wall', 'dust', 'ironhead', 'spirit_up', 'tackle'],
    '손잡이를 잃어버린 뒤로 어이가 없다.'),
  jangseung:X('장승이', ['earth', 'spirit'], 100, 110, 90, 60, 90, 50,
    ['quake', 'rockthrow', 'club', 'ttukttak', 'nightmare', 'ambush', 'dirt', 'guard'],
    '마을 입구에서 눈만 부릅뜨고 있어도 월급이 나온다.'),
  fan:      X('선풍이', ['wind', 'steel'], 75, 75, 85, 100, 75, 100,
    ['gust', 'twister', 'magnet', 'breeze', 'scrap', 'armor', 'tacks', 'razorwind'],
    '틀어놓고 자면 큰일 난다는 소문의 주인공.'),
  kkaebi:   X('깨비', ['spirit'], 85, 125, 75, 70, 70, 100,
    ['club', 'ambush', 'soulrush', 'ttukttak', 'wisp', 'rockthrow', 'tackle', 'guard'],
    '씨름을 좋아한다. 왼쪽 다리가 약하다는 소문이 있다.'),
  kkangtong:X('깡통이', ['steel', 'poison'], 80, 105, 110, 65, 80, 60,
    ['ironhead', 'hammer', 'scrap', 'sting', 'fog', 'tacks', 'armor', 'guard'],
    '차이는 게 일이다. 소리가 클수록 뿌듯해한다.'),
  bongdari: X('봉다리', ['wind', 'poison'], 80, 55, 70, 105, 90, 100,
    ['gust', 'twister', 'spit', 'sludge', 'fog', 'stench', 'breeze', 'guard'],
    '검은 봉지. 안에 뭐가 들었는지는 봉다리도 모른다.'),
  // 하수구 패거리
  manhol:   X('맨홀이', ['steel', 'earth'], 95, 105, 125, 40, 70, 45,
    ['lid', 'quake', 'wall', 'tacks', 'ironhead', 'rockthrow', 'armor', 'tackle', 'hammer', 'guard'],
    '구멍 뚫린 무늬가 자기 얼굴인 줄 안다. 밟히는 것이 취미다.'),
  sigung:   X('시궁이', ['poison', 'water'], 75, 100, 60, 60, 65, 120,
    ['gnaw', 'sting', 'paddle', 'spirit_up', 'spit', 'squirt', 'ambush', 'breeze', 'fog', 'guard'],
    '시궁창의 터줏대감. 초록 물때를 목도리처럼 두르고 다닌다.'),
  batji:    X('빗물받이', ['water', 'steel'], 90, 60, 95, 100, 90, 45,
    ['backflow', 'rainy', 'magnet', 'tacks', 'bucket', 'hose', 'armor', 'nap', 'squirt', 'guard'],
    '철창 아래에서 두 눈만 빛난다. 담배꽁초를 던지면 기억해 둔다.'),
  meokarak: X('머카락', ['spirit', 'poison'], 85, 55, 85, 105, 95, 70,
    ['tangle', 'sludge', 'scold', 'nightmare', 'fog', 'stench', 'wisp', 'spit', 'guard'],
    '수챗구멍에서 태어났다. 누구 머리카락인지는 아무도 묻지 않는다.'),
  ppeong:   X('뚫어뻥', ['water', 'earth'], 85, 105, 80, 50, 75, 80,
    ['plunge', 'paddle', 'rockthrow', 'spirit_up', 'bucket', 'tackle', 'grind', 'guard'],
    '막힌 것을 보면 참지 못한다. 벽, 바닥, 인간관계까지 뚫으려 든다.'),
  // 시장 먹거리단
  tteokppo: X('떡뽀끼', ['fire', 'poison'], 90, 70, 75, 110, 85, 65,
    ['broth', 'flame', 'spit', 'heatwave', 'blaze', 'sludge', 'fog', 'ember', 'guard'],
    '초록 접시 위에서 끓는다. 어묵은 덤이고 국물이 본체다.'),
  sundae:   X('순대장', ['earth', 'poison'], 110, 95, 90, 55, 85, 50,
    ['mustard', 'grind', 'sting', 'nap', 'quake', 'wall', 'stench', 'tackle', 'rockthrow', 'guard'],
    '소금이냐 막장이냐를 묻는 순간 지역 대전이 시작된다.'),
  eomuk:    X('어묵이', ['water', 'fire'], 95, 85, 70, 95, 80, 70,
    ['refill', 'bucket', 'flame', 'windcut', 'squirt', 'ember', 'rainy', 'heatwave', 'hose', 'guard'],
    '겨울이면 사람들이 줄을 선다. 국물은 셀프다.'),
  hotteok:  X('호떡이', ['fire'], 75, 105, 70, 85, 70, 105,
    ['honeybomb', 'coalhead', 'windcut', 'spirit_up', 'firerush', 'ember', 'razorwind', 'tackle', 'flame', 'guard'],
    '겉보다 속이 뜨겁다. 한입 물면 설탕이 먼저 공격한다.'),
  ppeondegi:X('뻔데기', ['grass', 'poison'], 70, 60, 110, 90, 110, 55,
    ['molt', 'sapdrain', 'sludge', 'seed', 'fog', 'leafcut', 'sunbathe', 'pollen', 'stench', 'guard'],
    '종이컵에 담겨 있어도 호불호는 담기지 않는다.'),
  // 페어리
  neonna:   X('네온나', ['fairy', 'elec'], 75, 55, 75, 115, 90, 100,
    ['neonwink', 'pixiedust', 'charm', 'fairydance', 'static', 'highvolt', 'bolt', 'shock', 'charge', 'guard'],
    '밤 골목 간판의 네온 요정. 성인 캐릭터다. 네온 날개를 펴고 무대에 서면 간판이 모두 켜진다.'),
  yeonji:   X('연지', ['fairy', 'spirit'], 80, 60, 80, 105, 100, 85,
    ['lipmark', 'pixiedust', 'charm', 'fairydance', 'wisp', 'scold', 'nightmare', 'stench', 'sunbathe', 'guard'],
    '붉은 입술의 어른 요정. 오프숄더 한복 드레스 차림이고, 황금 립스틱으로 상대의 혼을 홀린다.'),
  lumina:   X('루미나', ['fairy', 'elec'], 75, 45, 70, 125, 95, 100,
    ['crystalbolt', 'pixiedust', 'sparkcircle', 'highvolt', 'bolt', 'shock', 'focusmana', 'potion', 'charm', 'guard'],
    '수정 지팡이를 든 성인 견습 마법사. 포니테일을 흔들며 웃지만, 지팡이 끝 수정에는 벼락이 잠들어 있다. 허리춤 물약은 맛이 없다.'),
  silvia:   X('실비아', ['fairy', 'wind'], 75, 110, 70, 55, 80, 120,
    ['winksnipe', 'arrowrain', 'razorwind', 'windcut', 'snarearrow', 'throwknife', 'hawkeye', 'pixiedust', 'charm', 'guard'],
    '은발을 땋아 올린 성인 숲의 궁수. 윙크 한 번에 화살이 날아가고, 화살이 떨어지면 허벅지 단검을 뽑는다.'),
  // 강화 용사
  danjo:    X('단조', ['steel'], 85, 80, 85, 40, 70, 60,
    ['forge', 'tierslash', 'elemblade', 'reflector', 'shieldbash', 'lionroar', 'ironhead', 'hammer', 'armor', 'rockthrow'],
    '나무 검 한 자루로 시작한 용사. 대장간 망치 소리가 들리면 갑옷이 한 단계 올라간다. 목표는 풀강.'),
  // 로봇
  jabanbot: X('자판봇', ['steel', 'elec'], 95, 105, 100, 70, 75, 55,
    ['canburst', 'ironhead', 'scrap', 'hammer', 'shortfist', 'highvolt', 'shock', 'armor', 'tacks', 'guard'],
    '골목 자판기가 변신했다. 동전을 넣으면 음료 대신 캔을 발사한다. 거스름돈은 주지 않는다.'),
  baedalbot:X('배달봇', ['steel', 'wind'], 75, 105, 75, 55, 70, 125,
    ['bulletdash', 'ironhead', 'razorwind', 'windcut', 'scrap', 'hammer', 'breeze', 'armor', 'tackle', 'guard'],
    '철가방을 등에 지고 바퀴로 달린다. 비가 와도 30분 안에 도착한다.'),
  setakbot: X('세탁봇', ['steel', 'water'], 100, 65, 105, 100, 90, 45,
    ['spincycle', 'bucket', 'hose', 'magnet', 'squirt', 'paddle', 'rainy', 'armor', 'tacks', 'guard'],
    '가슴의 세탁 통으로 상대를 돌린다. 눈처럼 보이는 것은 세제 투입구다.'),
  // 골목 사계절
  godeuri:  X('고드리', ['ice', 'spirit'], 65, 55, 55, 120, 75, 115,
    ['icicledrop', 'icestorm', 'blizzard', 'brainfrz', 'scold', 'nightmare', 'wisp', 'frost', 'breeze', 'guard'],
    '한겨울 처마 끝에 매달린 고드름 도깨비. 몸속 푸른 도깨비불 덕에 봄이 와도 잘 녹지 않는다.'),
  yangmeori:X('양머리', ['fire', 'ice'], 105, 90, 80, 90, 80, 55,
    ['stoneegg', 'flame', 'coalhead', 'icicle', 'icestorm', 'firerush', 'heatwave', 'spirit_up', 'nap', 'guard'],
    '찜질방 양머리 수건을 쓴 단골. 불가마와 얼음방을 오가며 식혜와 맥반석 계란을 놓지 않는다.'),
  damjaengjeon:X('담쟁전', ['grass', 'elec'], 95, 60, 110, 90, 110, 35,
    ['vineshock', 'highvolt', 'sapdrain', 'pollen', 'bolt', 'seed', 'shock', 'charge', 'sunbathe', 'guard'],
    '담쟁이덩굴에 칭칭 감긴 낡은 변압기. 잎맥으로 전기가 흘러 밤마다 형광색으로 빛난다.'),
  ppogeuri: X('뽀글이', ['fairy', 'water'], 80, 45, 75, 100, 105, 95,
    ['scrub', 'pixiedust', 'bucket', 'hose', 'squirt', 'charm', 'fairydance', 'rainy', 'potion', 'guard'],
    '동네 목욕탕 비눗방울 요정. 이태리타월 리본을 매고 다니며, 때를 보면 참지 못한다.'),
  hwangsari:X('황사리', ['earth', 'wind'], 80, 110, 75, 50, 70, 110,
    ['yellowgust', 'quake', 'rockthrow', 'razorwind', 'windcut', 'wall', 'breeze', 'spirit_up', 'grind', 'guard'],
    'KF94 마스크를 쓴 황사 구름. 본인도 숨이 막혀서 늘 화가 나 있다.'),
  // 광전사
  tuhon:    X('투혼', ['fire', 'steel'], 110, 115, 100, 60, 80, 45,
    ['rageaxe', 'firerush', 'hammer', 'ironhead', 'coalhead', 'quake', 'rockthrow', 'spirit_up', 'armor', 'guard'],
    '붉은 결정이 박힌 갑옷을 입은 광전사. 맞을수록 화가 쌓이고, 화가 쌓일수록 도끼가 불탄다. 겉으로는 탱커지만 속은 버서커다.'),
  // 무대
  harmonium:X('하르모니움', ['steel', 'spirit'], 90, 50, 110, 115, 85, 50,
    ['metalnoise', 'magnet', 'highvolt', 'scold', 'nightmare', 'charge', 'armor', 'shock', 'lionroar', 'guard'],
    '철골 아치 무대가 골목몬이 되었다. 양쪽 스피커는 몸이고, 가운데 매달린 유선 마이크가 뇌다. 선이 뽑히면 아무 말도 못 한다.'),
  // 이세계
  hwansaeng:X('환생트럭', ['steel', 'fairy'], 90, 95, 90, 50, 70, 70,
    ['trucksudden', 'ironhead', 'hammer', 'pixiedust', 'quake', 'rockthrow', 'shieldbash', 'charm', 'armor', 'guard'],
    '치이면 이세계로 보내 준다는 전설의 트럭. 천사 링을 달고 다니며, 바닥에는 늘 전송 마법진이 돈다.'),
  malrang:  X('말랑왕', ['water', 'grass'], 120, 50, 85, 95, 95, 45,
    ['jellypress', 'bucket', 'hose', 'sapdrain', 'pollen', 'squirt', 'seed', 'rainy', 'potion', 'guard'],
    '이세계에서 처음 만나는 몬스터, 슬라임들의 왕. 왕관은 용사가 떨어뜨린 것을 주웠다.'),
  seonggeom:X('성검바위', ['earth', 'fairy'], 95, 105, 130, 40, 85, 35,
    ['holysword', 'quake', 'rockthrow', 'grind', 'pixiedust', 'ironhead', 'wall', 'charm', 'nap', 'guard'],
    '용사만 뽑을 수 있는 성검이 박힌 바위. 천 년째 졸려서 아무도 못 뽑게 버티는 중이다.'),
  madoseo:  X('마도서', ['fire', 'wind'], 70, 40, 65, 125, 85, 105,
    ['forbidpage', 'flame', 'blaze', 'twister', 'gust', 'ember', 'focusmana', 'heatwave', 'breeze', 'guard'],
    '금지된 마법서. 책장을 펄럭이며 날아다니고, 끝까지 읽으려는 독자를 이빨로 문다.'),
  mimik:    X('미믹', ['grass', 'spirit'], 95, 125, 95, 45, 80, 80,
    ['chomp', 'club', 'vinewhip', 'ambush', 'leafcut', 'soulrush', 'rockthrow', 'seed', 'nightmare', 'guard'],
    '이끼 낀 보물상자인 척하는 함정. 뚜껑을 열면 금화보다 혀가 먼저 나온다.'),
  // 벌레·동물
  maemmaem: X('맴맴이', ['grass', 'steel'], 85, 60, 100, 105, 80, 65,
    ['cicadacry', 'pollen', 'sapdrain', 'magnet', 'scold', 'lionroar', 'ironhead', 'armor', 'sunbathe', 'guard'],
    '여름 골목 최강의 소음원. 강철 같은 껍질을 두른 매미로, 땅속에서 7년을 참았다.'),
  wengweng: X('왱왱이', ['elec', 'poison'], 65, 50, 55, 110, 70, 135,
    ['bloodsuck', 'highvolt', 'bolt', 'sludge', 'spit', 'gust', 'shock', 'fog', 'charge', 'guard'],
    '전기 파리채에 맞고도 살아남아 감전 능력을 얻은 모기. 불 끄면 귓가에서 운다.'),
  dakdulgi: X('닭둘기', ['wind'], 115, 95, 80, 45, 70, 85,
    ['flutter', 'razorwind', 'windcut', 'tackle', 'rockthrow', 'grind', 'nap', 'breeze', 'spirit_up', 'guard'],
    '너무 많이 주워 먹어서 잘 날지 못하는 광장 비둘기. 목 깃털만은 무지갯빛으로 빛난다.'),
  chijeu:   X('치즈냥', ['fire', 'fairy'], 80, 110, 70, 80, 75, 110,
    ['nyanpunch', 'coalhead', 'firerush', 'pixiedust', 'flame', 'ambush', 'charm', 'fairydance', 'spirit_up', 'guard'],
    '골목의 치즈 길고양이. 꼬리 끝에 불꽃이 붙어 있고, 츄르를 보면 눈이 반짝인다.'),
  basaeng:  X('바선생', ['poison'], 80, 95, 95, 50, 80, 95,
    ['roachrush', 'sting', 'ambush', 'scrap', 'rockthrow', 'tacks', 'stench', 'fog', 'spirit_up', 'guard'],
    '넥타이를 맨 바퀴벌레 선생님. 절대 죽지 않는다. 오늘도 자습이다.'),
  deungsin: X('등신', ['water', 'normal'], 110, 120, 70, 130, 70, 100,
    ['glasscannon', 'ramdeath', 'vinyl', 'pufferspike', 'hydrate', 'ignite', 'overcome', 'dice', 'mockspit', 'irontail'],
    '바다의 개복치. 햇빛을 봐도, 물살이 세도, 깜짝 놀라도 죽는다. 그래도 능력치만큼은 최강이다.'),
};

// 캐릭터별 전용기와 메가진화: [전용기, 메가 이름, 소개, [체력, 공격, 방어, 특공, 특방, 스피드 상승값]]
const SIGNATURE = {
  yeontan: ['gugong', '불땀 연탄대왕', '구멍 22개가 전부 타오르고 몸 전체가 용암처럼 갈라진다. 양팔은 쌓아 올린 연탄.', [0, 40, 30, 0, 20, 10]],
  bungbbang: ['headfirst', '까맣게 탄 붕빵이', '메가진화의 열을 못 이기고 까맣게 타 버렸다. 탄 붕어빵을 팔 수 없다며 붕어빵 아줌마가 붕어빵 틀을 들고 쫓아온다.', [15, 45, 15, 0, 0, 25]],
  horong: ['rekindle', '청사초롱 귀신', '청색과 홍색 초롱으로 커졌다. 푸른 도깨비불을 거느린다.', [15, 0, 0, 50, 15, 20]],
  kettle: ['boil', '증기 폭군', '주전자를 졸업하고 증기기관이 되었다. 압력계 바늘이 빨간 칸을 넘으면 도망쳐라.', [10, 0, 15, 30, 0, 45]],
  daeya: ['kimjang', '김장 대모', '뽀글 파마에 고무장갑을 끼면 김장 시즌이 시작된다. 눈이 마주치면 배추를 절인다.', [0, 35, 25, 0, 20, 20]],
  usan: ['umbrellastab', '찢긴 우산 망령', '버려진 우산들의 원한이 뭉쳤다. 살 끝이 칼날이 되어 비를 베고 다닌다.', [20, 0, 0, 40, 20, 20]],
  kongsiru: ['sprout', '해장 장인', '콩나물국밥 뚝배기로 진화했다. 눈은 충혈됐고 어제 일은 기억나지 않는다.', [17, 17, 17, 17, 16, 16]],
  ssaribi: ['sweep', '마당쇠 검객', '갓을 눌러쓰고 빗자루를 칼처럼 쥔다. 지나간 자리엔 먼지 한 톨 남지 않는다.', [15, 50, 15, 0, 0, 20]],
  ttaengcho: ['cheongyang', '청양 폭군', '스코빌을 재다 측정기가 녹았다. 초록 꼭지가 왕관이 되어 타오른다.', [40, 0, 30, 0, 30, 0]],
  jeonbot: ['wirewrap', '초고압 철탑', '전봇대를 졸업하고 송전탑이 되었다. 번개가 날개처럼 뻗는다.', [0, 10, 0, 30, 30, 30]],
  orak: ['mash', '최종 보스', '이어하기는 없다. 해골이 뜬 화면을 본 사람은 동전을 전부 잃는다.', [5, 0, 25, 45, 25, 0]],
  bangpae: ['kitefight', '태극 뇌전연', '가운데 구멍이 태극으로 빛나고 번개 날개가 돋았다. 얼레는 이제 필요 없다.', [35, 0, 25, 40, 0, 0]],
  bingsu: ['patmix', '5단 왕빙수', '욕심껏 쌓다 기울어졌다. 쓰러지면 끝이라 평생 숨을 참고 있다.', [20, 0, 25, 25, 0, 30]],
  bonaeng: ['icepack', '남극 요새', '소풍 가방이 얼음 성벽을 두른 요새가 되었다. 안에 든 것은 영원히 신선하다.', [0, 35, 45, 0, 0, 20]],
  jangdok: ['aged', '삼년 묵은 방귀', '뚜껑이 열렸다. 해골 모양 구름은 장독이도 처음 맡아 보고 울고 있다.', [0, 0, 25, 35, 0, 40]],
  maetdol: ['eoi', '지옥 맷돌', '잃어버린 손잡이를 되찾았고 어이도 함께 돌아왔다. 톱니로 뭐든 갈아 버린다.', [0, 40, 20, 0, 20, 20]],
  jangseung: ['glare', '천하대장군', '이제 입구를 지키지 않는다. 양손에 창을 들고 직접 쳐들어간다.', [0, 30, 20, 0, 20, 30]],
  fan: ['turbo', '회전 강풍 4단', '4단 버튼이 생겼다. 자기 바람에 자기 볼살이 날아가는 중이다.', [17, 17, 17, 17, 16, 16]],
  kkaebi: ['wrestle', '도깨비대장', '황금 방망이와 붉은 도포를 두른 골목의 왕. 뿔은 셋으로 늘었다.', [0, 40, 30, 0, 20, 10]],
  kkangtong: ['kick', '분리수거왕', '찌그러진 몸에 페트병 팔을 달았다. 재활용 마크가 코가 되었다.', [17, 17, 17, 17, 16, 16]],
  bongdari: ['bagged', '종량제 100L', '검은 봉지의 꿈은 정식 봉투였다. 대파가 튀어나와 입구가 안 묶인다.', [15, 0, 30, 40, 0, 15]],
  manhol: ['lid', '지하제국의 문', '뚜껑이 열리자 하수도 전체가 눈을 떴다. 금관은 왜 있는지 모른다.', [0, 25, 45, 0, 30, 0]],
  sigung: ['gnaw', '시궁 쥐왕', '하수구 왕국의 임금. 물때 목도리에 망토까지 두르고 칼을 차고 다닌다.', [25, 35, 25, 0, 15, 0]],
  batji: ['backflow', '범람의 감옥', '철창을 움켜쥔 손이 나왔다. 폭우가 오면 이 안의 것이 골목으로 넘친다.', [0, 0, 0, 35, 20, 45]],
  meokarak: ['tangle', '대머리', '메가진화의 힘을 못 이기고 털이 전부 빠졌다. 머리카락 한 올만 남았고, 울고 있다.', [0, 0, 0, 40, 0, 60]],
  ppeong: ['plunge', '변기왕', '뚫다 보니 변기와 하나가 되었다. 왕관을 쓰고 있지만 아무도 앞에 서지 않는다.', [25, 35, 25, 0, 0, 15]],
  tteokppo: ['broth', '떡복근 셰프', '떡 여섯 개가 전부 복근이다. 국물을 얼마나 흘리는지 앞치마가 소용없다.', [0, 0, 35, 40, 0, 25]],
  sundae: ['mustard', '모둠 세트', '간이랑 허파가 부하로 들어왔다. 머리 위 소금은 왕관 대신이다.', [17, 17, 17, 17, 16, 16]],
  eomuk: ['refill', '포장마차 그 자체', '천막까지 합체했다. 이제 어디서 팔리는 게 아니라 어디든 영업 중이다.', [17, 17, 17, 17, 16, 16]],
  hotteok: ['honeybomb', '호떡 UFO', '뒤집개로 하늘을 난다. 꿀 광선을 맞으면 입천장이 벗겨진다.', [0, 35, 20, 25, 20, 0]],
  ppeondegi: ['molt', '직장인 나방', '허물을 벗고 드디어 날개를 얻었다. 그런데 정장을 입고 출근한다.', [10, 0, 0, 45, 0, 45]],
};
Object.assign(SIGNATURE, {
  neonna: ['neonwink', '네온 디바', '날개가 세 겹으로 늘고 조명이 내려왔다. 왕관까지 불이 들어오면 공연이 시작된다.', [15, 0, 10, 40, 10, 25]],
  yeonji: ['lipmark', '홍염 왕비', '금관을 쓰고 붉은 날개를 펼쳤다. 황금 립스틱은 왕의 지팡이가 되었다.', [10, 0, 20, 40, 30, 0]],
  lumina: ['crystalbolt', '대마도사 루미나', '붉은 망토와 불꽃·얼음 날개를 두르고 머리 위에 마법진을 띄웠다. 지팡이 끝 수정은 고리에 감싸여 공중에서 돈다.', [10, 0, 10, 45, 15, 20]],
  silvia: ['winksnipe', '폭풍 사수 실비아', '수정 왕관과 초록 갑옷 차림에 룬이 새겨진 바람 날개를 펼쳤다. 활 두 자루와 수십 발의 바람 화살이 주위를 맴돈다.', [10, 40, 10, 0, 10, 30]],
  danjo: ['forge', '프리즘 용사 단조', '모든 재료를 녹여 하나로 만든 무지개 갑옷. 검은 일곱 빛깔로 빛나고 방패의 사자가 금빛으로 깨어났다.', [15, 40, 30, 0, 15, 0]],
  jabanbot: ['canburst', '초합금 자판왕', '어깨에 캔 발사기를 달고 금장을 둘렀다. 화면에 뜬 MAX는 가격이다.', [0, 40, 30, 0, 10, 20]],
  baedalbot: ['bulletdash', '광속 철가방', '바퀴와 몸이 합체해 오토바이가 되었다. 철가방이 둘로 늘어 이제 한 번에 두 집.', [20, 40, 25, 0, 15, 0]],
  setakbot: ['spincycle', '코인세탁 합체왕', '세탁기 세 대가 합체했다. 가운데 통이 뜨겁게 돌면 빨래방 영업 개시.', [10, 0, 20, 30, 10, 30]],

  godeuri: ['icicledrop', '만년설 고드리', '고드름 왕관을 쓰고 얼음 날개를 폈다. 도깨비불이 보랏빛으로 타오르고 가슴에 결정이 박혔다.', [10, 0, 15, 40, 15, 20]],
  yangmeori: ['stoneegg', '불가마 양머리', '양머리 수건이 황금 테를 두른 숫양 뿔이 되었다. 왼쪽은 불가마, 오른쪽은 얼음방.', [15, 30, 15, 30, 10, 0]],
  damjaengjeon: ['vineshock', '고압 담쟁전', '변압기가 철탑처럼 자랐다. 애자에 형광빛이 돌고 덩굴에 꽃이 피었다.', [10, 0, 25, 40, 25, 0]],
  ppogeuri: ['scrub', '거품여왕 뽀글이', '방울 왕관과 나비 날개, 거품 드레스. 이태리타월 리본이 길게 휘날린다.', [15, 0, 20, 30, 25, 10]],
  tuhon: ['rageaxe', '초(超)극대노 투혼', '분노가 갑옷까지 녹여 온몸이 용암처럼 붉게 달아올랐다. 등 뒤의 룬 방패가 불타고, 도끼에서 쇳물이 흘러내린다.', [0, 30, 25, 15, 20, 10]],
  harmonium: ['metalnoise', '월드투어 하르모니움', '아치가 두 겹으로 늘고 LED 화면과 레이저가 달렸다. 마이크는 황금 무선 마이크로 업그레이드.', [10, 0, 20, 40, 20, 10]],
  hwansaeng: ['trucksudden', '신의 환생트럭', '링이 세 겹, 날개가 여섯 장으로 늘었다. 황금 그릴과 경광등을 달고 하늘에서 전송 광선과 함께 내려온다.', [0, 35, 30, 0, 20, 15]],
  malrang: ['jellypress', '킹 말랑왕', '진짜 왕관과 망토, 보석 홀까지 갖춘 슬라임 대왕. 꼬마 슬라임 신하들을 거느린다.', [20, 0, 25, 30, 25, 0]],
  seonggeom: ['holysword', '각성 성검바위', '천 년 만에 눈을 뜬 바위 골렘. 금 간 틈으로 빛이 새고 수정이 돋았다. 성검이 반쯤 뽑혔다.', [10, 40, 30, 0, 20, 0]],
  madoseo: ['forbidpage', '금단의 대마도서', '봉인 사슬이 끊기고 책장이 박쥐 날개처럼 펼쳐졌다. 제3의 눈이 뜨고 보랏빛 불꽃이 탄다.', [0, 0, 0, 45, 15, 40]],
  mimik: ['chomp', '탐욕왕 미믹', '뿔 달린 황금 왕관 상자. 이빨이 두 줄, 혀가 세 개가 되었고 금화가 쏟아진다.', [10, 40, 25, 0, 15, 10]],
  maemmaem: ['cicadacry', '확성기 맴맴이', '날개에 스피커가 달린 강철 매미. 음파 고리가 사방으로 퍼진다.', [10, 0, 20, 40, 20, 10]],
  wengweng: ['bloodsuck', '고압 왱왱이', '날개가 전기 파리채 그물로 변했다. 침은 번개 창이 되었다.', [10, 0, 15, 40, 15, 20]],
  dakdulgi: ['flutter', '광장왕 닭둘기', '비행 고글과 빨간 스카프를 둘렀다. 날개를 펼치면 거대하고, 부하 비둘기를 거느린다.', [15, 40, 15, 0, 10, 20]],
  chijeu: ['nyanpunch', '사미 치즈냥', '꼬리가 네 갈래 핑크 불꽃이 되고 보석 방울 목걸이를 찼다. 귀 끝에도 불꽃이 핀다.', [0, 40, 10, 10, 10, 30]],
  basaeng: ['roachrush', '교장 바선생', '학사모를 쓰고 날개를 펼쳤다. 날아오르는 순간 모두가 비명을 지른다.', [10, 35, 25, 0, 20, 10]],
  deungsin: ['glasscannon', '바다의 왕', '수많은 죽음을 넘어 바다의 왕이 되었다. 왕관과 삼지창, 망토를 둘렀다. 갈증 게이지가 사라지고, 돌연사와 다른 모든 죽을 확률이 절반이 된다.', [10, 20, 20, 20, 20, 10]],
  hwangsari: ['yellowgust', '대황사 황사리', '방독면과 고글을 쓴 거대 모래폭풍. 아래는 토네이도가 되었고 주변에 돌덩이가 돈다.', [10, 40, 25, 0, 15, 10]],
});

// 모든 골목몬이 기술 10개가 되도록 채우는 추가 기술
const EXTRA_MOVES = {
  bungbbang: ['rockthrow'], horong: ['nap'], usan: ['icestorm'], kongsiru: ['vinewhip'], ssaribi: ['tackle'],
  ttaengcho: ['guard'], jeonbot: ['guard'], orak: ['magnet'], bangpae: ['tackle'], bingsu: ['icicle'],
  bonaeng: ['tackle'], jangdok: ['guard'], maetdol: ['guard'], jangseung: ['tackle'], fan: ['guard'],
  kkaebi: ['dirt'], kkangtong: ['tackle'], bongdari: ['wisp'], meokarak: ['ambush'], ppeong: ['dirt', 'squirt'],
  tteokppo: ['stench'],
};
for (const [id, list] of Object.entries(EXTRA_MOVES)) MONSTERS[id].moves.push(...list);

// Z기술: [이름, 타입, 위력, 설명, 추가 효과]. 물리/특수는 공격과 특공 중 높은 쪽.
const ZMOVES = {
  yeontan: ['구공탄 대폭발', 'fire', 180, '스물두 구멍이 한꺼번에 터진다'],
  bungbbang: ['팥소 대분출', 'fire', 175, '뜨거운 팥이 화산처럼 솟구친다'],
  horong: ['청사초롱 백귀야행', 'spirit', 180, '초롱 백 개가 귀신불을 쏟아낸다'],
  kettle: ['끓는점 돌파', 'water', 180, '50% 확률로 화상', { st: { s: 'brn', ch: 50 } }],
  daeya: ['김장 대홍수', 'water', 175, '김장 물이 골목을 휩쓴다'],
  usan: ['천 개의 우산살', 'wind', 175, '우산살이 비처럼 쏟아진다'],
  kongsiru: ['콩나물 대숲', 'grass', 175, '준 피해의 1/3을 회복', { drain: 1 / 3 }],
  ssaribi: ['새벽 네 시의 싹쓸이', 'wind', 180, '아무도 못 본 일격'],
  ttaengcho: ['청양 핵폭발', 'fire', 185, '스코빌 측정 불가'],
  jeonbot: ['초고압 송전', 'elec', 180, '50% 확률로 마비', { st: { s: 'par', ch: 50 } }],
  orak: ['게임 오버', 'elec', 180, '이어하기는 없다'],
  bangpae: ['태극 뇌전 비행', 'elec', 175, '하늘에서 번개 연이 내리꽂힌다'],
  bingsu: ['절대영도 빙수', 'ice', 180, '30% 확률로 얼림', { st: { s: 'frz', ch: 30 } }],
  bonaeng: ['남극 대빙하', 'ice', 180, '빙하가 통째로 떨어진다'],
  jangdok: ['삼 년 묵은 대방출', 'poison', 180, '반드시 독', { st: { s: 'psn', ch: 100 } }],
  maetdol: ['천년 맷돌 분쇄', 'earth', 185, '어이까지 갈아 넣었다'],
  jangseung: ['천하대장군 강림', 'earth', 180, '상대 공격 하락', { foe: { atk: -1 } }],
  fan: ['태풍 4단', 'wind', 180, '사용 후 자신의 스피드 상승', { self: { spe: 1 }, selfAfter: true }],
  kkaebi: ['금 나와라 은 나와라', 'spirit', 185, '도깨비 방망이 최대 출력'],
  kkangtong: ['분리수거 대폭격', 'steel', 180, '깡통과 병이 비처럼 쏟아진다'],
  bongdari: ['검은 봉지 블랙홀', 'poison', 175, '상대 명중률 하락', { foe: { acc: -1 } }],
  manhol: ['지하제국 개문', 'steel', 180, '하수도 전체가 눈을 뜬다'],
  sigung: ['시궁쥐 대군단', 'poison', 175, '50% 확률로 독', { st: { s: 'psn', ch: 50 } }],
  batji: ['대범람', 'water', 180, '소나기 중에는 위력 1.5배', { rainZ: true }],
  meokarak: ['배수구 대역류', 'spirit', 175, '상대 특방 하락', { foe: { spd: -1 } }],
  ppeong: ['세계 뚫기', 'earth', 175, '막기를 완전히 무시', { breakGuard: true }],
  tteokppo: ['국물 쓰나미', 'fire', 180, '50% 확률로 화상', { st: { s: 'brn', ch: 50 } }],
  sundae: ['모둠 세트 강타', 'earth', 175, '간과 허파가 같이 때린다'],
  eomuk: ['포장마차 무한 리필', 'water', 170, '준 피해의 절반을 회복', { drain: .5 }],
  hotteok: ['꿀 운석 낙하', 'fire', 180, '하늘에서 호떡이 떨어진다'],
  ppeondegi: ['나방 대변신', 'grass', 170, '사용 후 자신의 특공과 스피드 상승', { self: { spa: 1, spe: 1 }, selfAfter: true }],
  neonna: ['네온 피날레', 'fairy', 180, '골목의 모든 간판이 켜진다'],
  yeonji: ['홍염 입맞춤', 'fairy', 175, '상대 특공 하락', { foe: { spa: -1 } }],
  lumina: ['아르카나 썬더', 'elec', 185, '하늘에 거대한 마법진이 열리고 벼락이 쏟아진다. 30% 확률로 마비', { st: { s: 'par', ch: 30 } }],
  silvia: ['템페스트 애로우', 'wind', 180, '폭풍을 두른 화살 한 발이 모든 것을 꿰뚫는다. 급소에 잘 맞음', { crit: true }],
  danjo: ['풀강 일격', 'steel', 172, '강화 단계마다 위력 7 증가. 네더라이트면 위력 200', { tierPow: 7 }],
  jabanbot: ['캔 일제사격', 'steel', 180, '자판기 재고가 바닥날 때까지 쏜다'],
  baedalbot: ['광속 배달 완료', 'wind', 175, '도착 예정 시간 0초'],
  setakbot: ['초강력 탈수', 'water', 180, '상대 스피드 2단계 하락', { foe: { spe: -2 } }],
  godeuri: ['한겨울 백귀야행', 'ice', 180, '고드름 수백 개가 쏟아진다. 30% 확률로 얼림', { st: { s: 'frz', ch: 30 } }],
  yangmeori: ['불가마 대폭발', 'fire', 180, '찜질방 전체가 증기로 뒤덮인다. 50% 확률로 화상', { st: { s: 'brn', ch: 50 } }],
  damjaengjeon: ['골목 대정전', 'elec', 180, '동네 불이 전부 꺼진다. 50% 확률로 마비', { st: { s: 'par', ch: 50 } }],
  ppogeuri: ['목욕탕 대방출', 'water', 175, '거대한 비눗방울에 가둬 터뜨린다. 준 피해의 1/3을 회복', { drain: 1 / 3 }],
  tuhon: ['분노 대폭발', 'fire', 180, '쌓인 분노를 도끼에 실어 땅째로 내리찍는다. 체력이 적을수록 위력 증가 (최대 1.5배)', { rage: true }],
  harmonium: ['오버드라이브', 'steel', 175, '앰프 출력을 한계까지 올린다. 태그 배틀에서는 상대 모두를 공격', { spread: true }],
  hwansaeng: ['이세계 직행', 'steel', 180, '트럭이 차원을 뚫고 돌진한다. 상대는 다음 생을 기약한다'],
  malrang: ['슬라임 대해일', 'water', 175, '슬라임 군단이 덮친다. 준 피해의 1/3을 회복', { drain: 1 / 3 }],
  seonggeom: ['엑스칼리바위', 'fairy', 180, '천 년 만에 성검이 뽑힌다. 급소에 잘 맞음', { crit: true }],
  madoseo: ['금단의 최종장', 'fire', 180, '마지막 장을 펼친다. 50% 확률로 화상', { st: { s: 'brn', ch: 50 } }],
  mimik: ['보물상자 대식사', 'spirit', 180, '상자가 상대를 통째로 삼킨다'],
  maemmaem: ['한여름 대합창', 'grass', 175, '골목 매미가 한꺼번에 운다. 상대 특방 하락', { foe: { spd: -1 }, sound: true }],
  wengweng: ['한밤의 흡혈', 'poison', 175, '귓가의 왱 소리와 함께 찾아온다. 준 피해의 절반을 회복', { drain: .5 }],
  dakdulgi: ['광장 대습격', 'wind', 180, '광장 비둘기가 한꺼번에 날아오른다. 상대 명중률 하락', { foe: { acc: -1 } }],
  chijeu: ['츄르 각성 냥펀치', 'fairy', 180, '츄르를 먹고 각성한 펀치. 사용 후 자신의 스피드 상승', { self: { spe: 1 }, selfAfter: true }],
  basaeng: ['전교생 집합', 'poison', 180, '바퀴벌레 전교생이 몰려온다. 반드시 독', { st: { s: 'psn', ch: 100 } }],
  deungsin: ['3억 개의 알', 'normal', 230, '개복치가 평생 낳는 3억 개의 알이 한꺼번에 부화해 상대를 덮친다. 맞은 상대는 공포에 질려 다음 행동을 못 한다', { fear: true }],
  hwangsari: ['누런 하늘', 'earth', 180, '하늘이 누렇게 덮인다. 상대 명중률 하락', { foe: { acc: -1 } }],
};
for (const [id, [n, type, pow, d, extra = {}]] of Object.entries(ZMOVES)) {
  const sp = MONSTERS[id];
  const cat = sp.base.atk >= sp.base.spa ? 'p' : 's';
  MOVES[`z_${id}`] = { n, type, cat, pow, acc: null, pp: 1, pri: 0, z: true, d, ...extra };
  sp.z = `z_${id}`;
}

const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
for (const [id, [sig, n, d, boost]] of Object.entries(SIGNATURE)) {
  const mon = MONSTERS[id];
  MOVES[sig].sig = true;
  mon.sig = sig;
  mon.moves = [sig, ...mon.moves.filter((m) => m !== sig)];
  mon.mega = { n, d, boost: Object.fromEntries(STAT_KEYS.map((k, i) => [k, boost[i]])) };
}
// 전용기가 여럿인 골목몬: 단조는 강화·강화 베기·특성검술·리플렉터가 모두 전용기
for (const id of ['tierslash', 'elemblade', 'reflector', 'bangalzzuk', 'ramdeath', 'vinyl', 'pufferspike', 'hydrate', 'ignite', 'overcome', 'dice', 'mockspit', 'irontail']) MOVES[id].sig = true;
MONSTERS.bungbbang.moves = MONSTERS.bungbbang.moves.map((m) => (m === 'ember' ? 'bangalzzuk' : m));

const AVATAR_OPTIONS = {
  skin: 10, hair: 20, hairColor: 16, brow: 6, eyes: 12, mouth: 10, face: 7,
  glasses: 8, hat: 14, outfit: 14, outfitColor: 16, bg: 14,
  body: 4, pose: 12, pantsColor: 12, shoes: 8, shoeColor: 12, gloves: 6, neck: 6, back: 10, hand: 10, aura: 8,
};

// 칭호, 전투카드, 핀. cond: [기록 이름, 필요한 수]. 없으면 처음부터 열림.
// 기록: wins, losses, draws, games(1대1 판수), streakBest(최고 연승), p0~p3(연습전 난이도별 승리), botWins, tagGames, tagWins, megas, zmoves
const C = (id, n, cond, extra = {}) => ({ id, n, cond, ...extra });
// 칭호 등급(tier): 0 일반, 1 반짝, 2 별가루, 3 황금, 4 네온, 5 전설. glow는 네온·전설 색
const COSMETICS = {
  titles: [
    C('rookie', '골목 새내기', null, { tier: 0 }), C('kid', '동네 꼬마', null, { tier: 0 }), C('wanderer', '떠돌이 골목몬꾼', null, { tier: 0 }),
    C('first', '첫 승리의 맛', ['wins', 1], { tier: 1 }), C('boss', '골목 짱', ['wins', 10], { tier: 2 }), C('tyrant', '동네 패왕', ['wins', 30], { tier: 3 }),
    C('legend', '전설의 골목대장', ['wins', 100], { tier: 5 }), C('comeback', '칠전팔기', ['losses', 7], { tier: 2 }), C('regular', '골목 단골손님', ['games', 20], { tier: 1 }),
    C('hot', '불붙은 손', ['streakBest', 3], { tier: 2 }), C('unstoppable', '무적 행진', ['streakBest', 7], { tier: 3 }),
    C('easy', '쉬움 정복자', ['p0', 1], { tier: 1 }), C('normal', '보통 사냥꾼', ['p1', 3], { tier: 2 }), C('hard', '어려움 파괴자', ['p2', 5], { tier: 3 }),
    C('hell', '지옥에서 돌아온 자', ['p3', 1], { tier: 4, glow: '#FF3B5C' }), C('hellking', '지옥의 군주', ['p3', 10], { tier: 5, glow: '#FF4A1C' }),
    C('mega1', '메가 입문자', ['megas', 1], { tier: 1 }), C('mega2', '메가진화 장인', ['megas', 25], { tier: 4, glow: '#2EF2FF' }),
    C('partner', '든든한 파트너', ['tagGames', 1], { tier: 1 }), C('combo', '환상의 콤비', ['tagWins', 5], { tier: 3 }),
    // 추가 칭호
    C('hungry', '배고픈 골목몬꾼', null, { tier: 0 }), C('market', '시장 단골', null, { tier: 0 }), C('sewerx', '하수구 탐험가', null, { tier: 0 }),
    C('parttime', '편의점 알바생', null, { tier: 0 }), C('jobless', '동네 백수', null, { tier: 0 }),
    C('zfirst', 'Z 입문자', ['zmoves', 1], { tier: 1 }), C('trainee', '골목 연습생', ['botWins', 3], { tier: 1 }), C('tie', '팽팽한 승부사', ['draws', 1], { tier: 1 }),
    C('walker', '골목 산책러', ['games', 5], { tier: 1 }), C('tagmate', '태그 메이트', ['tagGames', 3], { tier: 1 }), C('crybaby', '울보 골목몬꾼', ['losses', 3], { tier: 1 }),
    C('fixer', '골목 해결사', ['wins', 5], { tier: 2 }), C('rider', '연승 폭주족', ['streakBest', 5], { tier: 2 }), C('zsense', 'Z 감각파', ['zmoves', 10], { tier: 2 }),
    C('grinder', '연습 벌레', ['botWins', 15], { tier: 2 }), C('megafan', '메가 애호가', ['megas', 10], { tier: 2 }), C('local', '골목 터줏대감', ['games', 50], { tier: 2 }),
    C('collector', '패배 수집가', ['losses', 20], { tier: 2 }), C('tagregular', '태그 단골', ['tagGames', 10], { tier: 2 }), C('drawking', '무승부의 달인', ['draws', 5], { tier: 2 }),
    C('ruler', '골목 지배자', ['wins', 50], { tier: 3 }), C('zmaster', 'Z 마스터', ['zmoves', 30], { tier: 3 }), C('slayer', '어려움 학살자', ['p2', 15], { tier: 3 }),
    C('duo', '전설의 듀오', ['tagWins', 15], { tier: 3 }), C('immortal', '불멸의 연승', ['streakBest', 10], { tier: 3 }), C('witness', '골목의 산증인', ['games', 100], { tier: 3 }),
    C('pilgrim', '지옥 순례자', ['p3', 5], { tier: 4, glow: '#B44BFF' }), C('zavatar', 'Z의 화신', ['zmoves', 50], { tier: 4, glow: '#FFE45C' }),
    C('cyber', '골목 사이버펑크', ['wins', 75], { tier: 4, glow: '#37FF8B' }), C('overdrive', '메가 폭주', ['megas', 50], { tier: 4, glow: '#FF8A00' }),
    C('lossicon', '패배의 아이콘', ['losses', 50], { tier: 4, glow: '#7FC8E8' }),
    C('god', '골목대전의 신', ['wins', 200], { tier: 5, glow: '#FFF27A' }), C('demonslayer', '마왕 퇴치자', ['p3', 30], { tier: 5, glow: '#B44BFF' }),
    C('invincible', '천하무적', ['streakBest', 20], { tier: 5, glow: '#37E0FF' }), C('bondmax', '유대의 극치', ['zmoves', 100], { tier: 5, glow: '#FF5CA8' }),
    // 훈련장 (더미 누적 피해, 한 턴 최고 피해)
    C('dummy1', '허수아비 두들기기', ['dummyDmg', 1000], { tier: 0 }), C('dummy2', '샌드백 킬러', ['dummyDmg', 10000], { tier: 1 }),
    C('dummy3', '훈련장 단골', ['dummyDmg', 50000], { tier: 2 }), C('dummy4', '더미 파괴자', ['dummyDmg', 200000], { tier: 3 }),
    C('dummy5', '훈련장의 악몽', ['dummyDmg', 500000], { tier: 4, glow: '#FF8A00' }), C('dummy6', '백만 데미지', ['dummyDmg', 1000000], { tier: 5, glow: '#FF3B5C' }),
    C('onehit1', '한 방 있는 녀석', ['dummyBest', 300], { tier: 2 }), C('onehit2', '원펀맨', ['dummyBest', 600], { tier: 4, glow: '#FFE45C' }),
    C('onehit3', '더미 일격 분쇄', ['dummyBest', 1000], { tier: 5, glow: '#37E0FF' }),
    // 개발자 계정 전용
    C('developer', '개발자', ['dev', 1], { tier: 6 }),
    // 우편 보상 전용
    C('day1', 'Day 1', ['gift', 'titles:day1'], { tier: 7 }),
    C('ez', 'ez', ['flawless', 1], { tier: 4, glow: '#39FF6A' }),
    C('laborer', 'LEGENDARY LABORER', ['gift', 'titles:laborer'], { tier: 8 }),
    C('deungsin', '등신', ['gift', 'titles:deungsin'], { tier: 9 }),
    C('noisecrime', '소음공해죄', ['gift', 'titles:noisecrime'], { tier: 9, icon: '♬' }),
    // 상점 (GP로 구매)
    C('boughttitle', '돈 주고 산 칭호', ['shop', 2000], { tier: 1 }), C('cvsvip', '편의점 VIP', ['shop', 3000], { tier: 1 }),
    C('flexer', '플렉스 장인', ['shop', 6000], { tier: 2 }), C('bigspender', '골목 큰손', ['shop', 10000], { tier: 3 }),
    C('chaebol', '골목 재벌 3세', ['shop', 20000], { tier: 4, glow: '#FFD23F' }),
  ],
  cards: [
    C('basic', '기본 딱지', null), C('blue', '망점 블루', null, { dark: true }), C('red', '집중선 레드', null, { dark: true }),
    C('neon', '네온 골목', ['wins', 5], { dark: true }), C('star', '별밤', ['games', 20], { dark: true }),
    C('sakura', '벚꽃', ['tagWins', 3]), C('sewer', '하수구', ['losses', 10], { dark: true }),
    C('hell', '지옥불', ['p3', 1], { dark: true }), C('aurora', '메가 오로라', ['megas', 10], { dark: true }),
    C('rainbow', '무지개', ['streakBest', 5]), C('gold', '황금', ['wins', 30]), C('diamond', '블랙 다이아', ['wins', 100], { dark: true }),
    // 추가 전투카드
    C('pastel', '파스텔', null), C('mintchoco', '민트 초코', null), C('grid', '모눈종이', null),
    C('candy', '줄무늬 사탕', ['games', 3]), C('awning', '시장 천막', ['wins', 3]), C('tteok', '떡볶이', ['botWins', 5]),
    C('ice', '얼음 결정', ['streakBest', 4]), C('manhole', '맨홀', ['losses', 5], { dark: true }), C('night', '골목 야경', ['games', 10], { dark: true }),
    C('ocean', '파도', ['tagGames', 5]), C('graffiti', '낙서 벽', ['wins', 8], { dark: true }), C('forest', '숲속', ['botWins', 10], { dark: true }),
    C('cotton', '솜사탕', ['tagGames', 15]), C('lava', '용암', ['p3', 3], { dark: true }), C('matrix', '코드 비', ['zmoves', 10], { dark: true }),
    C('thunder', '번개 폭풍', ['streakBest', 7], { dark: true }), C('nightsakura', '밤벚꽃', ['tagWins', 8], { dark: true }), C('circuit', '회로기판', ['megas', 20], { dark: true }),
    C('flame', '불꽃 오라', ['p2', 10], { dark: true }), C('crt', '고장난 TV', ['losses', 25], { dark: true }), C('holo', '홀로그램', ['zmoves', 30]),
    C('retro', '레트로 오락실', ['games', 40], { dark: true }), C('galaxy', '은하수', ['wins', 40], { dark: true }), C('royal', '로열 퍼플', ['wins', 60], { dark: true }),
    C('zpower', 'Z 파워', ['zmoves', 50], { dark: true }), C('cosmic', '우주 왕좌', ['wins', 150], { dark: true }),
    // 훈련장
    C('dojo', '훈련장 다다미', ['dummyDmg', 5000]), C('sandbag', '샌드백', ['dummyDmg', 30000], { dark: true }),
    C('dmgmeter', '데미지 미터', ['dummyDmg', 150000], { dark: true }), C('shatter', '산산조각', ['dummyBest', 500], { dark: true }),
    C('millon', '백만 폭발', ['dummyDmg', 1000000], { dark: true }),
    C('devcore', '개발자 콘솔', ['dev', 1], { dark: true }),
    // 상점 (GP로 구매)
    C('sunset', '옥상 노을', ['shop', 4000]), C('vending', '자판기 불빛', ['shop', 6000], { dark: true }),
    C('money', '돈다발', ['shop', 8000]), C('goldrush', '황금 비', ['shop', 15000], { dark: true }),
  ],
  pins: [
    C('star', '별', null), C('heart', '하트', null), C('sprout', '새싹', null),
    C('coal', '연탄', ['wins', 1]), C('bolt', '번개', ['games', 5]), C('coin', '백 원', ['games', 10]),
    C('tack', '압정', ['losses', 3]), C('plunger', '뚫어뻥', ['losses', 10]), C('fire', '불꽃', ['streakBest', 3]),
    C('trophy', '트로피', ['wins', 10]), C('crown', '왕관', ['wins', 30]), C('leek', '대파', ['p0', 1]),
    C('medal', '은메달', ['p1', 3]), C('shield', '방패', ['p2', 5]), C('skull', '해골', ['p3', 1]), C('horn', '악마 뿔', ['p3', 5]),
    C('gem', '메가 결정', ['megas', 1]), C('rainbow', '무지개 결정', ['megas', 25]), C('hands', '악수', ['tagGames', 1]), C('duo', '콤비 별', ['tagWins', 5]),
    // 간지
    C('thumbsup', '따봉', ['wins', 3]), C('shades', '선글라스', ['games', 15]), C('swords', '쌍검', ['wins', 20]),
    C('wings', '천사 날개', ['wins', 50]), C('diamond', '다이아몬드', ['wins', 75]), C('boltcrown', '번개 왕관', ['streakBest', 10]),
    C('flameskull', '불타는 해골', ['p3', 3]), C('target', '백발백중', ['p2', 10]), C('meteor', '별똥별', ['tagWins', 10]), C('eye', '제3의 눈', ['megas', 50]),
    // 역따봉과 병맛
    C('lol', 'ㅋㅋ', null), C('zzz', '쿨쿨', null), C('sweat', '식은땀', null),
    C('thumbsdown', '역따봉', ['losses', 1]), C('poop', '똥', ['losses', 5]), C('kingbad', '킹받네', ['losses', 15]), C('golddown', '황금 역따봉', ['losses', 30]),
    // 추가 핀
    C('cat', '골목 고양이', null), C('onigiri', '삼각김밥', null), C('skewer', '떡꼬치', null), C('fishcake', '어묵꼬치', null),
    C('ramen', '라면', ['botWins', 3]), C('banana', '바나나 우유', ['games', 8]), C('fist', '주먹', ['games', 12]), C('music', '음표', ['zmoves', 3]),
    C('rat', '하수구 쥐', ['losses', 8]), C('manhole', '맨홀 뚜껑', ['losses', 12]), C('ghost', '유령', ['p1', 5]), C('bomb', '폭탄', ['wins', 15]),
    C('rocket', '로켓', ['streakBest', 4]), C('moon', '초승달', ['games', 25]), C('sun', '태양', ['wins', 25]), C('snow', '눈꽃', ['tagGames', 8]),
    C('mic', '마이크', ['zmoves', 15]), C('dice', '주사위', ['draws', 1]), C('clover', '네잎클로버', ['draws', 3]), C('headphone', '헤드폰', ['games', 30]),
    C('gamepad', '게임패드', ['botWins', 20]), C('ufo', 'UFO', ['megas', 15]), C('alien', '외계인', ['megas', 30]), C('zbolt', 'Z 문양', ['zmoves', 1]),
    C('zgold', '황금 Z', ['zmoves', 40]), C('robot', '로봇', ['botWins', 30]), C('devil', '꼬마 악마', ['p3', 15]), C('halo', '천사 링', ['tagWins', 20]),
    C('cry', '눈물 콧물', ['losses', 20]), C('angry', '빡침', ['losses', 40]), C('cool', '쿨가이', ['wins', 40]), C('lovey', '하트 뿅뿅', ['tagGames', 2]),
    C('king', '체스 킹', ['wins', 90]),
    // 훈련장
    C('dummy', '훈련용 더미', ['dummyDmg', 1000]), C('glove', '권투 글러브', ['dummyDmg', 20000]), C('dumbbell', '아령', ['dummyDmg', 80000]),
    C('crack', '금 간 더미', ['dummyBest', 400]), C('dmg999', '9999', ['dummyDmg', 300000]), C('goldglove', '황금 글러브', ['dummyDmg', 1000000]),
    C('error', '에러', ['dev', 1]),
    // 상점 (GP로 구매)
    C('receipt', '영수증', ['shop', 1000]), C('gpcoin', 'GP 코인', ['shop', 1500]), C('cupteok', '컵떡볶이', ['shop', 1500]),
    C('cart', '장바구니', ['shop', 2000]), C('moneybag', '돈주머니', ['shop', 3000]), C('gemcrown', '보석 왕관', ['shop', 6000]),
  ],
};
const STAT_NAMES = {
  wins: '1대1 승리', losses: '1대1 패배', games: '1대1 대전', streakBest: '최고 연승',
  p0: '골목대장(쉬움) 승리', p1: '골목대장(보통) 승리', p2: '골목대장(어려움) 승리', p3: '골목대장(지옥) 승리',
  tagGames: '태그 대전', tagWins: '태그 승리', megas: '메가진화 사용',
  dev: '개발자 계정', gift: '우편 보상', dummyDmg: '훈련장 누적 피해', dummyBest: '훈련장 한 턴 최고 피해',
  zmoves: 'Z기술 사용', botWins: '골목대장 승리(난이도 무관)', draws: '1대1 무승부', flawless: '한 마리도 안 쓰러지고 승리', shop: '상점',
};

// 루미나와 실비아는 사진 그림(public/img/mon)을 씁니다.
for (const id of ['lumina', 'silvia']) MONSTERS[id].img = true;
// 맞을 때마다 옷이 바뀌는 그림 수 (img/mon/<id>-s1 ~ sN.webp)
for (const id of ['lumina', 'silvia']) MONSTERS[id].censor = true; // 19세 이하 모자이크
// 강화 단계 (단조): 그림 img/mon/danjo-t1~t4 (철·금·다이아몬드·네더라이트), 단계마다 체력 +8%, 공격·방어 배율
// 네더라이트 다음부터는 네더라이트+1 ~ +10 (그림은 네더라이트, 보랏빛이 점점 진해짐)
MONSTERS.danjo.img = true;
const BASE_TIERS = ['나무', '철', '금', '다이아몬드', '네더라이트'], PLUS_MAX = 10;
const TIERS = {
  names: [...BASE_TIERS, ...Array.from({ length: PLUS_MAX }, (_, i) => `네더라이트+${i + 1}`)],
  atk: [.6, 1, 1.25, 1.55, 1.9, ...Array.from({ length: PLUS_MAX }, (_, i) => +(1.9 + (i + 1) * .08).toFixed(2))],
  hp: .08, base: BASE_TIERS.length - 1, // 그림이 있는 마지막 단계 (네더라이트)
};
TIERS.def = TIERS.atk;
MONSTERS.danjo.tiers = TIERS.names.length - 1;
MONSTERS.danjo.tierImgs = TIERS.base;
MONSTERS.danjo.trait = { n: '강화 용사', d: `강화를 쓰면 ${BASE_TIERS.join(' → ')} 순서로 100% 강화되고, 그 뒤로는 네더라이트+1부터 +${PLUS_MAX}까지 계속 강화된다. 나무일 때는 약하지만 단계마다 체력이 ${TIERS.hp * 100}% 늘고 공격·방어가 크게 올라 네더라이트에서 약 ${TIERS.atk[4]}배, +${PLUS_MAX}에서 약 ${TIERS.atk[TIERS.names.length - 1]}배가 된다. 교체해도 단계는 유지된다.` };
const STRIP = { boost: .04, heal: 20 };
MONSTERS.godeuri.trait = { n: '녹아내림', d: '체력이 절반 이하가 되면 스피드가 1.5배가 된다.' };
MONSTERS.yangmeori.trait = { n: '온탕냉탕', d: '홀수 턴은 온탕(불 기술 1.3배), 짝수 턴은 냉탕(얼음 기술 1.3배)이다.' };
MONSTERS.damjaengjeon.trait = { n: '광합성 충전', d: '매 턴이 끝날 때 최대 체력의 1/16을 회복한다.' };
MONSTERS.ppogeuri.trait = { n: '거품막', d: '전투에서 처음 맞는 공격 한 번의 피해를 절반으로 줄인다.' };
// 소리 기술: 하르모니움 특성 펑크록이 영향을 줌
for (const id of ['metalnoise', 'scold', 'lionroar']) { MOVES[id].sound = true; MOVES[id].d = `[소리] ${MOVES[id].d}`; }
MOVES.z_harmonium.sound = true;
MONSTERS.harmonium.trait = { n: '펑크록', d: '소리 기술(금속음, 혼쭐내기, 사자후, 오버드라이브, 7년의 울음, 한여름 대합창)의 위력이 1.3배가 되고, 상대의 소리 기술은 피해를 절반만 받는다.' };
// 신캐 10종 특성
Object.assign(MONSTERS.hwansaeng, { trait: { n: '이세계 환생', d: '공격을 맞고 쓰러질 때 한 번, 이세계에서 환생해 체력 1/4로 돌아온다.' } });
Object.assign(MONSTERS.malrang, { trait: { n: '말랑말랑', d: '물리 공격의 피해를 0.75배로 받는다.' } });
Object.assign(MONSTERS.seonggeom, { trait: { n: '천년의 잠', d: '체력이 꽉 차 있을 때 받는 피해가 절반이 된다.' } });
Object.assign(MONSTERS.madoseo, { trait: { n: '금서', d: '상대가 상태이상(화상·독·마비·얼음·잠)이면 특수 기술의 위력이 1.3배가 된다.' } });
Object.assign(MONSTERS.mimik, { trait: { n: '보물 미끼', d: '싸움에 나오자마자 상대가 보물에 정신이 팔려 스피드가 1단계 떨어진다.' } });
Object.assign(MONSTERS.maemmaem, { trait: { n: '떼창', d: '소리 기술의 위력이 1.3배가 되고, 소리 기술은 상대의 막기를 뚫는다.' } });
Object.assign(MONSTERS.wengweng, { trait: { n: '파리채 내성', d: '전기 기술에 맞으면 피해를 받지 않고 특공이 1단계 올라간다.' } });
Object.assign(MONSTERS.dakdulgi, { trait: { n: '빵 줍기', d: '체력이 절반 이하가 되면(한 번만) 바닥의 빵을 주워 먹고 체력을 1/3 회복한다.' } });
Object.assign(MONSTERS.chijeu, { trait: { n: '그루밍', d: '턴이 끝날 때 상태이상이 있으면 50% 확률로 털을 핥아 낫는다.' } });
Object.assign(MONSTERS.deungsin, { trait: { n: '돌연사 · 갈증', d: '돌연사: 턴이 시작될 때, 턴이 끝날 때, 공격할 때, 공격받을 때마다 10% 확률로 즉사한다. 갈증: 체력바 아래 갈증 게이지(100%에서 시작)가 기술을 쓰면 15%, 턴이 끝나면 5%, 공격받으면 5% 줄고, 0%가 되면 즉사한다. 메가진화(바다의 왕)하면 갈증 게이지가 사라지고 모든 죽을 확률이 절반이 된다.' } });
Object.assign(MONSTERS.basaeng, { trait: { n: '불사신', d: '한 방에 쓰러질 공격을 맞아도 30% 확률로 체력 1을 남기고 버틴다.' } });
// 하위권 상향: 기본 능력치에 더하는 값 [체력, 공격, 방어, 특공, 특방, 스피드]
const BUFFS = {
  danjo: [15, 15, 10, 0, 10, 10], ssaribi: [20, 10, 10, 0, 5, 0], yeonji: [10, 0, 5, 15, 0, 5],
  kkangtong: [15, 10, 0, 0, 10, 5], ppeondegi: [15, 0, 0, 15, 0, 10], kongsiru: [10, 0, 10, 15, 5, 0],
  hotteok: [15, 10, 10, 0, 0, 0], baedalbot: [15, 10, 10, 0, 0, 0], godeuri: [15, 0, 10, 0, 5, 0],
  jangdok: [0, 0, 0, 10, 0, 10], eomuk: [5, 0, 10, 10, 0, 0],
};
// 2차 상향 (승률 45% 아래)
const BUFFS2 = {
  ssaribi: [15, 20, 0, 0, 10, 0], danjo: [10, 10, 10, 0, 10, 0], godeuri: [10, 0, 5, 10, 0, 0], jangdok: [10, 0, 0, 10, 0, 0],
  kongsiru: [10, 0, 0, 10, 5, 0], yeonji: [5, 0, 0, 10, 5, 5], baedalbot: [10, 10, 0, 0, 5, 0], silvia: [10, 10, 5, 0, 5, 0],
  ppeondegi: [5, 0, 0, 10, 0, 5], hotteok: [5, 5, 5, 0, 0, 0], fan: [5, 0, 5, 5, 0, 0], sigung: [5, 5, 5, 0, 0, 0],
  bonaeng: [5, 5, 0, 0, 5, 0], jangseung: [5, 5, 0, 0, 5, 0], kkangtong: [5, 5, 0, 0, 5, 0], yangmeori: [5, 5, 0, 5, 0, 0],
};
for (const [id, add] of Object.entries(BUFFS2)) BUFFS[id] = (BUFFS[id] || [0, 0, 0, 0, 0, 0]).map((v, i) => v + add[i]);
for (const [id, add] of Object.entries(BUFFS)) ['hp', 'atk', 'def', 'spa', 'spd', 'spe'].forEach((k, i) => { MONSTERS[id].base[k] += add[i]; });
// 친구가 정한 특성들
Object.assign(MONSTERS.usan, { trait: { n: '폭우', d: '싸움에 나오면 5턴 동안 비(소나기)가 내린다.' } });
Object.assign(MONSTERS.horong, { trait: { n: '그림자밟기', d: '호롱이가 싸우는 동안 상대는 교체할 수 없다. (쓰러져서 바꾸는 것은 가능)' } });
Object.assign(MONSTERS.daeya, { trait: { n: '김장', d: '얼음 기술에 맞거나 눈이 오는 동안 방어와 특방이 2배가 된다.' } });
Object.assign(MONSTERS.bingsu, { trait: { n: '설경', d: '싸움에 나오면 5턴 동안 눈이 내린다. 눈이 오면 얼음 타입의 방어가 1.5배가 된다.' } });
Object.assign(MONSTERS.bonaeng, { trait: { n: '아이스박스', d: '불 기술을 상성과 상관없이 1배로 받는다.' } });
Object.assign(MONSTERS.jangdok, { trait: { n: '발효', d: '싸움에 나오자마자 상대의 명중률을 1단계 떨어뜨린다.' } });
Object.assign(MONSTERS.jangseung, { trait: { n: '위협', d: '싸움에 나오자마자 상대의 공격을 1단계 떨어뜨린다.' } });
Object.assign(MONSTERS.fan, { trait: { n: '돌풍', d: '공격에 맞으면 공격한 상대를 날려서 다른 골목몬으로 바꿔 버린다.' } });
Object.assign(MONSTERS.ttaengcho, { trait: { n: '하바네로분출', d: '물리 공격(접촉)에 맞으면 공격한 상대가 화상을 입는다.' } });
Object.assign(MONSTERS.bangpae, { trait: { n: '바람타기', d: '체력이 꽉 차 있을 때 바람 타입 기술이 우선도 +1로 먼저 나간다.' } });
Object.assign(MONSTERS.ssaribi, { trait: { n: '정리정돈', d: '싸움에 나오면 날씨와 양쪽 압정을 모두 치워 버린다.' } });
Object.assign(MONSTERS.yeontan, { trait: { n: '불꽃의무장', d: '얼음 상태가 되지 않는다. 물리(접촉) 공격에 맞으면 30% 확률로 공격한 상대가 화상을 입는다.' } });
Object.assign(MONSTERS.bongdari, { trait: { n: '내용물분출', d: '쓰러질 때, 마지막으로 받은 물리 공격의 피해만큼 쓰러뜨린 상대에게 돌려준다.' } });
Object.assign(MONSTERS.orak, { trait: { n: '돈지랄', d: '상태이상, 위협, 압정의 영향을 받지 않는다. 공격에 맞을 때마다 돈이 떨어져 30% 확률로 상대가 다음 턴에 돈을 줍느라 공격하지 못한다.' } });
Object.assign(MONSTERS.maetdol, { trait: { n: '옹골참', d: '체력이 꽉 차 있을 때는 한 방에 쓰러질 공격을 맞아도 체력 1을 남기고 버틴다.' } });
Object.assign(MONSTERS.kettle, { trait: { n: '끓는물', d: '물 기술이 풀 타입에게도 2배로 들어간다.' } });
Object.assign(MONSTERS.kkaebi, { trait: { n: '저주받은바디', d: '공격에 맞으면 30% 확률로 그 기술을 4턴 동안 봉인한다.' } });
Object.assign(MONSTERS.kongsiru, { trait: { n: '넘치는콩', d: '공격에 맞으면 5턴 동안 우리 쪽에만 그래스필드를 펼친다. 우리 편의 풀 기술이 1.3배가 되고, 우리 편 골목몬이 매 턴 체력을 1/16 회복한다.' } });
Object.assign(MONSTERS.bungbbang, { trait: { n: '크리스피', d: '비가 오거나 물 기술에 맞으면 눅눅해져 스피드가 1단계 떨어진다. 땡볕이거나 불 기술에 맞으면 바삭해져, 물리 공격을 한 상대에게 그 피해의 1/4을 돌려준다.' } });
Object.assign(MONSTERS.jeonbot, { trait: { n: '비상전력', d: '체력이 절반 이하가 되면(한 번만) 방어와 특방이 1단계 떨어지는 대신 특공과 스피드가 2단계 올라간다.' } });
MONSTERS.ssaribi.trait.d = '싸움에 나오면 날씨와 그래스필드, 우리 쪽 압정을 치워 버린다. (상대 쪽 압정은 그대로 둔다)';
// 투혼: 남은 체력에 따라 폼이 바뀜 (img/mon/tuhon, tuhon-f1~f4, 메가는 tuhon-mega)
const FORMS = {
  names: ['일반폼', '소노폼', '중노폼', '대노폼', '극대노폼', '초(超)극대노'],
  mul: [1, 1.1, 1.2, 1.35, 1.5, 1.6], // 공격·특공·방어·특방 배율 (마지막은 메가진화)
};
Object.assign(MONSTERS.tuhon, { img: true, forms: 4, trait: { n: '광폭화', d: '남은 체력에 따라 폼이 바뀌고, 폼이 오를수록 공격·특공·방어·특방이 오른다. 일반폼(75% 초과) 1배 → 소노폼(50% 초과) 1.1배 → 중노폼(25% 초과) 1.2배 → 대노폼(5% 초과) 1.35배 → 극대노폼(5% 이하) 1.5배 → 메가진화하면 초(超)극대노 1.6배.' } });
// 특성 3차
Object.assign(MONSTERS.kkangtong, { trait: { n: '리사이클', d: '한 번 쓰고 사라진 도구(기합의띠, 삼각김밥 등)를 턴이 끝날 때 다시 되살린다. (한 판에 한 번)' } });
Object.assign(MONSTERS.manhol, { trait: { n: '악취', d: '싸움에 나오자마자 상대의 명중률을 1단계 떨어뜨린다.' } });
Object.assign(MONSTERS.batji, { trait: { n: '저수', d: '물 기술에 맞으면 피해 대신 체력을 1/4 회복한다.' } });
Object.assign(MONSTERS.meokarak, { trait: { n: '엉킴', d: '머카락이 싸우는 동안 상대는 교체할 수 없다. (쓰러져서 바꾸는 것은 가능)' } });
Object.assign(MONSTERS.ppeong, { trait: { n: '뻥뚫림', d: '싸움에 나오면 모든 골목몬의 상태이상과 날씨, 그래스필드, 양쪽 압정을 전부 없앤다.' } });
Object.assign(MONSTERS.tteokppo, { trait: { n: '라면사리 추가', d: '싸움에 나와 2턴이 지나면 공격과 특공이 1단계씩 오른다.' } });
Object.assign(MONSTERS.sundae, { trait: { n: '창자버스터', d: '체력이 1/4 이하가 되면 몸이 터져 싸우는 모든 골목몬(자신 포함)에게 100 피해를 준다. (한 번만)' } });
Object.assign(MONSTERS.eomuk, { trait: { n: '촉촉바디', d: '비가 오면 매 턴 체력을 1/8 회복하고, 땡볕이면 매 턴 체력을 1/16 잃는다.' } });
Object.assign(MONSTERS.hotteok, { trait: { n: '호떡소', d: '물리(접촉) 공격을 한 상대는 뜨거운 꿀이 붙어 스피드가 1단계 떨어진다.' } });
Object.assign(MONSTERS.ppeondegi, { trait: { n: '단단한 껍질', d: '급소에 맞지 않는다.' } });
Object.assign(MONSTERS.neonna, { trait: { n: '아이찡 댄스', d: '싸움에 나오면 춤을 춰서 날씨와 그래스필드를 없앤다.' } });
Object.assign(MONSTERS.yeonji, { trait: { n: '연지곤지', d: '쓰러지면 쓰러뜨린 상대에게 연지 자국을 남긴다. 자국이 남은 골목몬은 매 턴 최대 체력의 1/4을 잃는다.' } });
Object.assign(MONSTERS.jabanbot, { trait: { n: '과자나 뱉어내 이련아', d: '공격에 맞으면 과자를 뱉어 아군 한 마리의 체력을 절반 회복시킨다. (태그 배틀은 옆 아군, 아니면 대기 중인 가장 다친 아군)' } });
Object.assign(MONSTERS.baedalbot, { trait: { n: '배달의민족', d: '신호등을 건너뛰고 30% 확률로 먼저 공격한다.' } });
Object.assign(MONSTERS.setakbot, { trait: { n: '세제거품', d: '물리(접촉) 공격을 한 상대의 명중률을 1단계 떨어뜨린다.' } });
MONSTERS.hwangsari.trait = { n: '황사 경보', d: '싸움에 나오면 5턴 동안 황사가 분다.' };

// 잠시 밴: 테스트 중인 골목몬은 개발자 계정만 씁니다.
const BANNED = ['lumina', 'silvia'];
const DEV_ACCOUNTS = ['PEGADORA'];

// 도구: 덱을 짤 때 골목몬마다 하나씩 들 수 있음. once: 한 번 쓰면 사라짐 (깡통이 리사이클로 한 번 되살릴 수 있음)
const ITEMS = {
  sash:     { n: '기합의띠', i: '🎗️', once: true, d: '쓰러질 공격을 맞으면 체력 1을 남기고 버틴다. 한 번 쓰면 사라진다.' },
  insure:   { n: '실비보험', i: '🧾', once: true, d: '효과가 굉장한 공격에 맞고 버티면 보험금이 나와 공격과 특공이 2단계씩 오른다. 한 번 쓰면 사라진다.' },
  leftover: { n: '먹다 남은 떡볶이', i: '🍢', d: '매 턴이 끝날 때 최대 체력의 1/16을 회복한다.' },
  onigiri:  { n: '삼각김밥', i: '🍙', once: true, d: '체력이 절반 이하가 되면 바로 먹고 최대 체력의 1/3을 회복한다. 한 번 쓰면 사라진다.' },
  ssanghwa: { n: '쌍화탕', i: '🍵', once: true, d: '상태이상에 걸리면 바로 마시고 낫는다. 한 번 쓰면 사라진다.' },
  straw:    { n: '빨대 컵', i: '🥤', d: '공격으로 준 피해의 1/8만큼 체력을 회복한다.' },
  battery:  { n: '번개 배터리', i: '🔋', d: '공격 기술의 피해가 1.3배가 되는 대신, 공격할 때마다 최대 체력의 1/10을 잃는다.' },
  band:     { n: '응원 머리띠', i: '📣', d: '공격이 1.5배가 되는 대신, 처음 쓴 기술만 계속 쓸 수 있다. (교체하면 풀림)' },
  specs:    { n: '두꺼운 안경', i: '👓', d: '특공이 1.5배가 되는 대신, 처음 쓴 기술만 계속 쓸 수 있다. (교체하면 풀림)' },
  scarf:    { n: '털 목도리', i: '🧣', d: '스피드가 1.5배가 되는 대신, 처음 쓴 기술만 계속 쓸 수 있다. (교체하면 풀림)' },
  gloves:   { n: '목장갑', i: '🧤', d: '물리 기술의 피해가 1.1배가 된다.' },
  book:     { n: '참고서', i: '📘', d: '특수 기술의 피해가 1.1배가 된다.' },
  note:     { n: '족집게 노트', i: '📒', d: '효과가 굉장한(2배 이상) 기술의 피해가 1.25배가 된다.' },
  scope:    { n: '망원경', i: '🔭', d: '급소에 맞힐 확률이 크게 오른다.' },
  shoes:    { n: '운동화', i: '👟', d: '20% 확률로 같은 우선도의 상대보다 먼저 움직인다.' },
  vest:     { n: '방탄 조끼', i: '🦺', d: '특방이 1.5배가 되는 대신, 변화 기술을 쓸 수 없다.' },
  padding:  { n: '두꺼운 패딩', i: '🧥', d: '방어가 1.3배가 된다.' },
  helmet:   { n: '가시 헬멧', i: '⛑️', d: '물리(접촉) 공격을 한 상대에게 그 상대 최대 체력의 1/6 피해를 준다.' },
  smoke:    { n: '연막탄', i: '💨', d: '상대 기술의 명중률이 10% 떨어진다.' },
  bell:     { n: '비상벨', i: '🚨', once: true, d: '공격에 맞으면 벨을 누르고 대기 중인 아군과 바로 교체한다. 한 번 쓰면 사라진다.' },
};
module.exports = { ITEMS, FORMS, TIERS, BANNED, DEV_ACCOUNTS, STRIP, TYPES, CHART, MOVES, STRUGGLE, MONSTERS, AVATAR_OPTIONS, COSMETICS, STAT_NAMES };
