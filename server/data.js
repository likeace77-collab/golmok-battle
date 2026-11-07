// 골목대전 게임 데이터: 타입, 상성, 스킬, 요괴, 아바타 옵션
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
  none:   { n: '보통', c: '#B9AE9A' },
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
  steel:  { ice: 2, spirit: 2, fairy: 2, fire: .5, water: .5, elec: .5, steel: .5 },
  spirit: { spirit: 2, poison: 2, steel: .5, fairy: .5 },
  fairy:  { spirit: 2, earth: 2, fire: .5, poison: .5, steel: .5 },
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
  // 루미나 (견습 마법사)
  crystalbolt: M('크리스탈 마탄', 'fairy', 's', 90, 100, 10, { st: { s: 'par', ch: 20 }, d: '지팡이의 수정이 빛을 쏜다. 20% 확률로 마비' }),
  focusmana: M('마력 집중', 'fairy', 'x', 0, null, 10, { self: { spa: 2 }, self_: true, d: '특공 2단계 상승' }),
  potion:    M('물약 한 모금', 'none', 'x', 0, null, 5, { heal: .5, cure: true, self_: true, d: '허리춤 물약을 마신다. 체력 절반 회복, 상태이상 치료' }),
  sparkcircle: M('번개 마법진', 'elec', 's', 70, 100, 15, { foe: { spd: -1 }, sc: 30, d: '손바닥 마법진에서 전기가 튄다. 30% 확률로 상대 특방 하락' }),
  // 실비아 (궁수)
  winksnipe: M('윙크 저격', 'fairy', 'p', 90, 100, 10, { crit: true, d: '한쪽 눈을 감고 쏜다. 급소에 잘 맞음' }),
  arrowrain: M('화살 연사', 'wind', 'p', 25, 95, 15, { hits: [2, 5], d: '2~5번 연속 공격' }),
  snarearrow: M('올가미 화살', 'wind', 'p', 55, 100, 15, { foe: { spe: -1 }, d: '상대 스피드 1단계 하락' }),
  throwknife: M('단검 투척', 'steel', 'p', 50, 100, 20, { pri: 1, d: '허벅지 단검을 던진다. 선제 공격' }),
  hawkeye:   M('매의 눈', 'none', 'x', 0, null, 10, { self: { atk: 1, acc: 1 }, self_: true, d: '공격과 명중률 1단계 상승' }),
  canburst:  M('캔 연사', 'steel', 'p', 25, 100, 15, { hits: [2, 5], d: '2~5번 연속 공격' }),
  bulletdash:M('총알 배달', 'wind', 'p', 65, 100, 15, { pri: 1, d: '선제 공격' }),
  spincycle: M('탈수 회전', 'water', 's', 85, 100, 10, { foe: { spe: -1 }, d: '상대 스피드 1단계 하락' }),
  // 보통
  tackle:    M('몸통 박치기', 'none', 'p', 50, 100, 30, { d: '기본 공격' }),
  guard:     M('막기', 'none', 'x', 0, null, 10, { protect: true, pri: 3, self_: true, d: '이번 턴 공격을 막음 (연속 사용 시 실패하기 쉬움)' }),
  nap:       M('낮잠', 'none', 'x', 0, null, 5, { nap: true, self_: true, d: '체력을 모두 회복하고 2턴 잠듦' }),
  spirit_up: M('기합 넣기', 'none', 'x', 0, null, 15, { self: { atk: 1, spe: 1 }, self_: true, d: '공격과 스피드 1단계 상승' }),
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
};

// 캐릭터별 전용기와 메가진화: [전용기, 메가 이름, 소개, [체력, 공격, 방어, 특공, 특방, 스피드 상승값]]
const SIGNATURE = {
  yeontan: ['gugong', '불땀 연탄대왕', '구멍 22개가 전부 타오르고 몸 전체가 용암처럼 갈라진다. 양팔은 쌓아 올린 연탄.', [0, 40, 30, 0, 20, 10]],
  bungbbang: ['headfirst', '근육 붕어빵', '팥이 입으로 새는 중. 다리는 왜 났는지 본인도 모르고 선글라스는 벗지 않는다.', [15, 45, 15, 0, 0, 25]],
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
  lumina: ['crystalbolt', '대마도사 루미나', '수정이 벼락을 두르고 손끝에 마법진이 떠오른다. 보석 장식이 전부 마력으로 빛난다.', [10, 0, 10, 45, 15, 20]],
  silvia: ['winksnipe', '폭풍 사수 실비아', '활과 화살에 푸른 바람이 감긴다. 룬 문양이 새겨진 경장 갑옷으로 더 가볍고 빨라졌다.', [10, 40, 10, 0, 10, 30]],
  jabanbot: ['canburst', '초합금 자판왕', '어깨에 캔 발사기를 달고 금장을 둘렀다. 화면에 뜬 MAX는 가격이다.', [0, 40, 30, 0, 10, 20]],
  baedalbot: ['bulletdash', '광속 철가방', '바퀴와 몸이 합체해 오토바이가 되었다. 철가방이 둘로 늘어 이제 한 번에 두 집.', [20, 40, 25, 0, 15, 0]],
  setakbot: ['spincycle', '코인세탁 합체왕', '세탁기 세 대가 합체했다. 가운데 통이 뜨겁게 돌면 빨래방 영업 개시.', [10, 0, 20, 30, 10, 30]],
});

// 모든 요괴가 기술 10개가 되도록 채우는 추가 기술
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
  jabanbot: ['캔 일제사격', 'steel', 180, '자판기 재고가 바닥날 때까지 쏜다'],
  baedalbot: ['광속 배달 완료', 'wind', 175, '도착 예정 시간 0초'],
  setakbot: ['초강력 탈수', 'water', 180, '상대 스피드 2단계 하락', { foe: { spe: -2 } }],
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
    C('rookie', '골목 새내기', null, { tier: 0 }), C('kid', '동네 꼬마', null, { tier: 0 }), C('wanderer', '떠돌이 요괴꾼', null, { tier: 0 }),
    C('first', '첫 승리의 맛', ['wins', 1], { tier: 1 }), C('boss', '골목 짱', ['wins', 10], { tier: 2 }), C('tyrant', '동네 패왕', ['wins', 30], { tier: 3 }),
    C('legend', '전설의 골목대장', ['wins', 100], { tier: 5 }), C('comeback', '칠전팔기', ['losses', 7], { tier: 2 }), C('regular', '골목 단골손님', ['games', 20], { tier: 1 }),
    C('hot', '불붙은 손', ['streakBest', 3], { tier: 2 }), C('unstoppable', '무적 행진', ['streakBest', 7], { tier: 3 }),
    C('easy', '쉬움 정복자', ['p0', 1], { tier: 1 }), C('normal', '보통 사냥꾼', ['p1', 3], { tier: 2 }), C('hard', '어려움 파괴자', ['p2', 5], { tier: 3 }),
    C('hell', '지옥에서 돌아온 자', ['p3', 1], { tier: 4, glow: '#FF3B5C' }), C('hellking', '지옥의 군주', ['p3', 10], { tier: 5, glow: '#FF4A1C' }),
    C('mega1', '메가 입문자', ['megas', 1], { tier: 1 }), C('mega2', '메가진화 장인', ['megas', 25], { tier: 4, glow: '#2EF2FF' }),
    C('partner', '든든한 파트너', ['tagGames', 1], { tier: 1 }), C('combo', '환상의 콤비', ['tagWins', 5], { tier: 3 }),
    // 추가 칭호
    C('hungry', '배고픈 요괴꾼', null, { tier: 0 }), C('market', '시장 단골', null, { tier: 0 }), C('sewerx', '하수구 탐험가', null, { tier: 0 }),
    C('parttime', '편의점 알바생', null, { tier: 0 }), C('jobless', '동네 백수', null, { tier: 0 }),
    C('zfirst', 'Z 입문자', ['zmoves', 1], { tier: 1 }), C('trainee', '골목 연습생', ['botWins', 3], { tier: 1 }), C('tie', '팽팽한 승부사', ['draws', 1], { tier: 1 }),
    C('walker', '골목 산책러', ['games', 5], { tier: 1 }), C('tagmate', '태그 메이트', ['tagGames', 3], { tier: 1 }), C('crybaby', '울보 요괴꾼', ['losses', 3], { tier: 1 }),
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
  ],
};
const STAT_NAMES = {
  wins: '1대1 승리', losses: '1대1 패배', games: '1대1 대전', streakBest: '최고 연승',
  p0: '골목대장(쉬움) 승리', p1: '골목대장(보통) 승리', p2: '골목대장(어려움) 승리', p3: '골목대장(지옥) 승리',
  tagGames: '태그 대전', tagWins: '태그 승리', megas: '메가진화 사용',
  dummyDmg: '훈련장 누적 피해', dummyBest: '훈련장 한 턴 최고 피해',
  zmoves: 'Z기술 사용', botWins: '골목대장 승리(난이도 무관)', draws: '1대1 무승부',
};

// 루미나와 실비아는 사진 그림(public/img/mon)을 씁니다.
for (const id of ['lumina', 'silvia']) MONSTERS[id].img = true;
// 맞을 때마다 옷이 바뀌는 그림 수 (img/mon/<id>-s1 ~ sN.webp)
MONSTERS.lumina.stages = 4;
MONSTERS.silvia.stages = 4;

module.exports = { TYPES, CHART, MOVES, STRUGGLE, MONSTERS, AVATAR_OPTIONS, COSMETICS, STAT_NAMES };
