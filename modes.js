// 모드 & 맵 정의
// 맵 좌표 단위: px (서버 기준). theme은 클라이언트에서 바닥/장애물 모양을 정함.

const MAPS = {
  computer: {
    id: 'computer', name: '컴퓨터실', theme: 'computer', w: 1600, h: 1200,
    walls: [
      { x: 300, y: 250, w: 220, h: 60 }, { x: 1080, y: 250, w: 220, h: 60 },
      { x: 300, y: 890, w: 220, h: 60 }, { x: 1080, y: 890, w: 220, h: 60 },
      { x: 740, y: 520, w: 120, h: 160 }, { x: 140, y: 560, w: 60, h: 80 },
      { x: 1400, y: 560, w: 60, h: 80 }, { x: 700, y: 120, w: 200, h: 50 }, { x: 700, y: 1030, w: 200, h: 50 },
    ],
  },
  math: {
    id: 'math', name: '수학실', theme: 'math', w: 1600, h: 1200,
    walls: [
      { x: 200, y: 200, w: 60, h: 300 }, { x: 1340, y: 700, w: 60, h: 300 },
      { x: 600, y: 150, w: 400, h: 50 }, { x: 600, y: 1000, w: 400, h: 50 },
      { x: 760, y: 520, w: 80, h: 160 }, { x: 380, y: 720, w: 220, h: 50 }, { x: 1000, y: 430, w: 220, h: 50 },
    ],
  },
  cafeteria: {
    id: 'cafeteria', name: '급식실', theme: 'cafeteria', w: 1600, h: 1200,
    walls: [
      { x: 250, y: 250, w: 350, h: 70 }, { x: 1000, y: 250, w: 350, h: 70 },
      { x: 250, y: 880, w: 350, h: 70 }, { x: 1000, y: 880, w: 350, h: 70 },
      { x: 650, y: 560, w: 300, h: 80 }, { x: 120, y: 560, w: 80, h: 80 }, { x: 1400, y: 560, w: 80, h: 80 },
    ],
  },
  playground: {
    id: 'playground', name: '운동장', theme: 'playground', w: 2000, h: 2000,
    walls: [
      { x: 300, y: 300, w: 200, h: 60 }, { x: 1500, y: 300, w: 200, h: 60 },
      { x: 300, y: 1640, w: 200, h: 60 }, { x: 1500, y: 1640, w: 200, h: 60 },
      { x: 900, y: 900, w: 200, h: 200 }, { x: 600, y: 700, w: 60, h: 250 }, { x: 1340, y: 1050, w: 60, h: 250 },
      { x: 700, y: 1400, w: 250, h: 60 }, { x: 1050, y: 540, w: 250, h: 60 },
      { x: 150, y: 1000, w: 150, h: 60 }, { x: 1700, y: 940, w: 150, h: 60 },
      { x: 950, y: 150, w: 100, h: 150 }, { x: 950, y: 1700, w: 100, h: 150 },
    ],
  },
  gym: {
    id: 'gym', name: '체육관', theme: 'gym', w: 1800, h: 1800,
    walls: [
      { x: 400, y: 400, w: 120, h: 120 }, { x: 1280, y: 400, w: 120, h: 120 },
      { x: 400, y: 1280, w: 120, h: 120 }, { x: 1280, y: 1280, w: 120, h: 120 },
      { x: 840, y: 480, w: 120, h: 300 }, { x: 840, y: 1020, w: 120, h: 300 },
      { x: 480, y: 840, w: 300, h: 120 }, { x: 1020, y: 840, w: 300, h: 120 },
    ],
  },
  'gem-math': {
    id: 'gem-math', name: '수학실 (젬)', theme: 'math', w: 1200, h: 1800, mine: { x: 600, y: 900 },
    spawns: [{ x: 600, y: 1680 }, { x: 600, y: 120 }],
    walls: [
      { x: 200, y: 500, w: 250, h: 60 }, { x: 750, y: 500, w: 250, h: 60 },
      { x: 200, y: 1240, w: 250, h: 60 }, { x: 750, y: 1240, w: 250, h: 60 },
      { x: 100, y: 860, w: 150, h: 80 }, { x: 950, y: 860, w: 150, h: 80 },
      { x: 520, y: 680, w: 160, h: 50 }, { x: 520, y: 1070, w: 160, h: 50 },
      { x: 350, y: 250, w: 60, h: 150 }, { x: 790, y: 1400, w: 60, h: 150 },
      { x: 790, y: 250, w: 60, h: 150 }, { x: 350, y: 1400, w: 60, h: 150 },
    ],
  },
  'gem-cafe': {
    id: 'gem-cafe', name: '급식실 (젬)', theme: 'cafeteria', w: 1200, h: 1800, mine: { x: 600, y: 900 },
    spawns: [{ x: 600, y: 1680 }, { x: 600, y: 120 }],
    walls: [
      { x: 150, y: 600, w: 300, h: 70 }, { x: 750, y: 600, w: 300, h: 70 },
      { x: 150, y: 1130, w: 300, h: 70 }, { x: 750, y: 1130, w: 300, h: 70 },
      { x: 560, y: 380, w: 80, h: 200 }, { x: 560, y: 1220, w: 80, h: 200 },
      { x: 280, y: 880, w: 120, h: 40 }, { x: 800, y: 880, w: 120, h: 40 },
    ],
  },
  training: {
    id: 'training', name: '훈련장', theme: 'training', w: 1600, h: 1200,
    spawns: [{ x: 250, y: 600 }],
    walls: [
      { x: 840, y: 340, w: 30, h: 150 },       // 벽 뒤 로봇 테스트용
      { x: 380, y: 260, w: 120, h: 60 }, { x: 380, y: 880, w: 120, h: 60 },
      { x: 1250, y: 300, w: 80, h: 600 },
    ],
    robots: [
      { id: 'robot', x: 470, y: 470 }, { id: 'robot', x: 470, y: 600 }, { id: 'robot', x: 470, y: 730 },
      { id: 'robot', x: 640, y: 600 }, { id: 'bigrobot', x: 760, y: 760 }, { id: 'robot', x: 930, y: 420 },
    ],
  },
};

const MODES = {
  ffa: {
    id: 'ffa', name: '난투', icon: '⚔️', color: '#ff7a3a',
    desc: '모두가 적! 쓰러져도 3초 뒤 부활. 4분마다 맵이 바뀐다.',
    team: false, respawn: true, rounds: false, rotate: 240, maps: ['computer', 'math', 'cafeteria'],
  },
  showdown: {
    id: 'showdown', name: '쇼다운', icon: '💀', color: '#7ad94a',
    desc: '최후의 1인이 승리! 부활 없음. 독가스가 점점 좁혀온다.',
    team: false, respawn: false, rounds: true, size: 6, maps: ['playground', 'gym'],
    gas: { start: 12, dur: 75, dps: 600, final: 320 },
  },
  gem: {
    id: 'gem', name: '젬 그랩', icon: '💎', color: '#c070ff',
    desc: '3대3 팀전! 보석 10개를 모아 15초 버티면 승리. 죽으면 보석을 떨어뜨린다.',
    team: true, respawn: true, rounds: true, teamSize: 3, maps: ['gem-math', 'gem-cafe'],
    gemEvery: 6, gemWin: 10, holdTime: 15, timeLimit: 180,
  },
  double: {
    id: 'double', name: '더블 가젯', icon: '🎒', color: '#3ab8ff',
    desc: '가젯 2개를 모두 들고 싸우는 난투!',
    team: false, respawn: true, rounds: false, rotate: 240, doubleGadget: true, maps: ['computer', 'math', 'cafeteria'],
  },
  training: {
    id: 'training', name: '훈련장', icon: '🎯', color: '#8a96a8',
    desc: '가만히 서 있는 로봇으로 스킬 연습! 혼자만 들어가는 방. 트로피는 안 올라요.',
    team: false, respawn: true, rounds: false, training: true, maps: ['training'],
  },
};

// 맵 전체 크기 배율 (벽·스폰·광산 위치까지 같이 커짐)
const MAP_SCALE = 1.6;
for (const m of Object.values(MAPS)) {
  const k = MAP_SCALE, R = (v) => Math.round(v * k);
  m.w = R(m.w); m.h = R(m.h);
  m.walls = m.walls.map((w) => ({ x: R(w.x), y: R(w.y), w: R(w.w), h: R(w.h) }));
  if (m.spawns) m.spawns = m.spawns.map((s) => ({ x: R(s.x), y: R(s.y) }));
  if (m.robots) m.robots = m.robots.map((r) => ({ ...r, x: R(r.x), y: R(r.y) }));
  if (m.mine) m.mine = { x: R(m.mine.x), y: R(m.mine.y) };
}

module.exports = { MAPS, MODES };
