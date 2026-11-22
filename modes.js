// 모드 & 맵 정의
// 맵 좌표 단위: px (서버 기준). theme은 클라이언트에서 바닥/장애물 모양을 정함.

// 대칭 도우미: 공정하게 벽을 복사
// mirror4: 좌우·상하 4방향 복사 (개인전 맵), sym: 가운데 기준 점대칭 (팀전 맵: 아래팀↔위팀)
const uniq = (ws) => ws.filter((w, i) => ws.findIndex((v) => v.x === w.x && v.y === w.y && v.w === w.w && v.h === w.h) === i);
const mirror4 = (W, H, ws) => uniq(ws.flatMap((w) => [w, { ...w, x: W - w.x - w.w }, { ...w, y: H - w.y - w.h }, { ...w, x: W - w.x - w.w, y: H - w.y - w.h }]));
const sym = (W, H, ws) => uniq(ws.flatMap((w) => [w, { ...w, x: W - w.x - w.w, y: H - w.y - w.h }]));
const TEAM_SP = [{ x: 600, y: 1660 }, { x: 600, y: 140 }];

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
  // ── 개인전 새 맵 ──
  library: {
    id: 'library', name: '도서관', theme: 'library', w: 1600, h: 1200,
    walls: mirror4(1600, 1200, [
      { x: 220, y: 180, w: 320, h: 50 }, { x: 220, y: 300, w: 50, h: 160 }, { x: 680, y: 140, w: 60, h: 220 }, { x: 560, y: 520, w: 160, h: 50 },
    ]),
  },
  music: {
    id: 'music', name: '음악실', theme: 'music', w: 1600, h: 1200,
    walls: mirror4(1600, 1200, [
      { x: 260, y: 220, w: 180, h: 110 }, { x: 620, y: 300, w: 120, h: 90 }, { x: 150, y: 520, w: 120, h: 70 }, { x: 760, y: 120, w: 40, h: 160 },
    ]),
  },
  science: {
    id: 'science', name: '과학실', theme: 'science', w: 1600, h: 1200,
    walls: mirror4(1600, 1200, [
      { x: 240, y: 200, w: 260, h: 80 }, { x: 600, y: 420, w: 80, h: 180 }, { x: 240, y: 470, w: 80, h: 80 }, { x: 760, y: 200, w: 40, h: 100 },
    ]),
  },
  // ── 쇼다운 새 맵 ──
  rooftop: {
    id: 'rooftop', name: '옥상', theme: 'rooftop', w: 2000, h: 2000,
    walls: mirror4(2000, 2000, [
      { x: 260, y: 260, w: 180, h: 180 }, { x: 650, y: 200, w: 60, h: 300 }, { x: 200, y: 700, w: 300, h: 60 },
      { x: 600, y: 650, w: 140, h: 140 }, { x: 900, y: 420, w: 200, h: 60 }, { x: 420, y: 920, w: 60, h: 160 },
    ]),
  },
  hall: {
    id: 'hall', name: '본관 복도', theme: 'hall', w: 2000, h: 2000,
    walls: mirror4(2000, 2000, [
      { x: 200, y: 400, w: 560, h: 50 }, { x: 400, y: 150, w: 50, h: 150 }, { x: 850, y: 250, w: 50, h: 400 },
      { x: 200, y: 750, w: 50, h: 300 }, { x: 550, y: 700, w: 200, h: 50 }, { x: 900, y: 900, w: 200, h: 50 },
    ]),
  },
  // ── 젬 그랩 새 맵 ──
  'gem-library': {
    id: 'gem-library', name: '도서관 (젬)', theme: 'library', w: 1200, h: 1800, mine: { x: 600, y: 900 }, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 150, y: 1150, w: 300, h: 50 }, { x: 750, y: 1150, w: 300, h: 50 }, { x: 520, y: 1050, w: 160, h: 50 },
      { x: 300, y: 1400, w: 50, h: 160 }, { x: 850, y: 1400, w: 50, h: 160 }, { x: 80, y: 870, w: 200, h: 60 },
    ]),
  },
  'gem-science': {
    id: 'gem-science', name: '과학실 (젬)', theme: 'science', w: 1200, h: 1800, mine: { x: 600, y: 900 }, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 200, y: 1100, w: 220, h: 80 }, { x: 780, y: 1100, w: 220, h: 80 }, { x: 560, y: 1250, w: 80, h: 160 },
      { x: 100, y: 1450, w: 160, h: 60 }, { x: 940, y: 1450, w: 160, h: 60 }, { x: 330, y: 860, w: 120, h: 80 },
    ]),
  },
  // ── 하이스트 맵 (아래 금고 = 0팀, 위 금고 = 1팀) ──
  'heist-hall': {
    id: 'heist-hall', name: '교무실 금고', theme: 'hall', w: 1200, h: 1800, spawns: [{ x: 600, y: 1480 }, { x: 600, y: 320 }],
    safes: [{ x: 600, y: 1640 }, { x: 600, y: 160 }],
    walls: sym(1200, 1800, [
      { x: 380, y: 1560, w: 60, h: 160 }, { x: 760, y: 1560, w: 60, h: 160 },          // 금고 옆 벽
      { x: 200, y: 1250, w: 260, h: 50 }, { x: 740, y: 1250, w: 260, h: 50 }, { x: 540, y: 1100, w: 120, h: 60 },
      { x: 100, y: 950, w: 200, h: 50 }, { x: 900, y: 950, w: 200, h: 50 },
    ]),
  },
  'heist-music': {
    id: 'heist-music', name: '음악실 금고', theme: 'music', w: 1200, h: 1800, spawns: [{ x: 600, y: 1480 }, { x: 600, y: 320 }],
    safes: [{ x: 600, y: 1640 }, { x: 600, y: 160 }],
    walls: sym(1200, 1800, [
      { x: 300, y: 1450, w: 160, h: 100 }, { x: 740, y: 1450, w: 160, h: 100 },
      { x: 500, y: 1200, w: 200, h: 60 }, { x: 150, y: 1100, w: 120, h: 120 }, { x: 930, y: 1100, w: 120, h: 120 }, { x: 560, y: 930, w: 80, h: 80 },
    ]),
  },
  // ── 브롤볼 맵 (아래 골대 = 0팀이 지킴) ──
  'ball-field': {
    id: 'ball-field', name: '운동장 축구장', theme: 'playground', w: 1200, h: 1800, spawns: [{ x: 600, y: 1500 }, { x: 600, y: 300 }],
    goals: [{ x: 450, y: 1740, w: 300, h: 60 }, { x: 450, y: 0, w: 300, h: 60 }], ball: { x: 600, y: 900 },
    walls: sym(1200, 1800, [
      { x: 250, y: 1600, w: 200, h: 50 }, { x: 750, y: 1600, w: 200, h: 50 },
      { x: 150, y: 1250, w: 160, h: 60 }, { x: 890, y: 1250, w: 160, h: 60 }, { x: 520, y: 1150, w: 160, h: 50 },
    ]),
  },
  'ball-gym': {
    id: 'ball-gym', name: '체육관 풋살장', theme: 'gym', w: 1200, h: 1800, spawns: [{ x: 600, y: 1500 }, { x: 600, y: 300 }],
    goals: [{ x: 450, y: 1740, w: 300, h: 60 }, { x: 450, y: 0, w: 300, h: 60 }], ball: { x: 600, y: 900 },
    walls: sym(1200, 1800, [
      { x: 300, y: 1550, w: 120, h: 120 }, { x: 780, y: 1550, w: 120, h: 120 },
      { x: 200, y: 1150, w: 120, h: 120 }, { x: 880, y: 1150, w: 120, h: 120 }, { x: 560, y: 1250, w: 80, h: 80 },
    ]),
  },
  // ── 현상금 맵 ──
  'bounty-library': {
    id: 'bounty-library', name: '도서관 (현상금)', theme: 'library', w: 1200, h: 1800, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 200, y: 1300, w: 280, h: 50 }, { x: 720, y: 1300, w: 280, h: 50 }, { x: 560, y: 1000, w: 80, h: 200 },
      { x: 100, y: 1000, w: 50, h: 200 }, { x: 1050, y: 1000, w: 50, h: 200 }, { x: 330, y: 1550, w: 50, h: 150 },
    ]),
  },
  'bounty-rooftop': {
    id: 'bounty-rooftop', name: '옥상 (현상금)', theme: 'rooftop', w: 1200, h: 1800, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 250, y: 1250, w: 140, h: 140 }, { x: 810, y: 1250, w: 140, h: 140 }, { x: 500, y: 1050, w: 200, h: 60 },
      { x: 100, y: 1500, w: 200, h: 60 }, { x: 900, y: 1500, w: 200, h: 60 },
    ]),
  },
  // ── 녹아웃 맵 ──
  'ko-science': {
    id: 'ko-science', name: '과학실 (녹아웃)', theme: 'science', w: 1200, h: 1800, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 180, y: 1350, w: 220, h: 80 }, { x: 800, y: 1350, w: 220, h: 80 }, { x: 540, y: 1150, w: 120, h: 80 },
      { x: 250, y: 950, w: 80, h: 160 }, { x: 870, y: 950, w: 80, h: 160 },
    ]),
  },
  'ko-music': {
    id: 'ko-music', name: '음악실 (녹아웃)', theme: 'music', w: 1200, h: 1800, spawns: TEAM_SP,
    walls: sym(1200, 1800, [
      { x: 150, y: 1300, w: 180, h: 110 }, { x: 870, y: 1300, w: 180, h: 110 }, { x: 520, y: 1200, w: 160, h: 60 },
      { x: 400, y: 950, w: 120, h: 90 }, { x: 680, y: 950, w: 120, h: 90 },
    ]),
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

// 쇼다운(솔로·듀오·트리오) 공통: 넓은 맵 + 독가스
const SD_MAPS = ['playground', 'gym', 'rooftop', 'hall'];
const SD_GAS = { start: 15, dur: 110, dps: 600, final: 320 };
const SD_SCALE = 1.45;       // 쇼다운 맵은 위치 1.45배로 더 넓게 (벽 크기는 1.15배) + 엄폐물 추가
const SD_EXTRA = [{ x: 180, y: 1250, w: 90, h: 220 }, { x: 1250, y: 180, w: 220, h: 90 }, { x: 760, y: 1120, w: 130, h: 130 }, { x: 1120, y: 760, w: 130, h: 130 }];
for (const id of SD_MAPS) {
  const m = MAPS[id], W = Math.round(m.w * SD_SCALE), H = Math.round(m.h * SD_SCALE);
  const ws = m.walls.map((w) => { const nw = Math.round(w.w * 1.15), nh = Math.round(w.h * 1.15); return { x: Math.round((w.x + w.w / 2) * SD_SCALE - nw / 2), y: Math.round((w.y + w.h / 2) * SD_SCALE - nh / 2), w: nw, h: nh }; });
  m.w = W; m.h = H; m.walls = uniq([...ws, ...mirror4(W, H, SD_EXTRA)]);
}
const MODES = {
  ffa: {
    id: 'ffa', name: '난투', icon: '⚔️', color: '#ff7a3a',
    desc: '모두가 적! 쓰러져도 3초 뒤 부활. 시간 제한 없이 처치할 때마다 트로피. 4분마다 맵이 바뀐다.',
    team: false, respawn: true, rounds: false, rotate: 240, maps: ['computer', 'math', 'cafeteria', 'library', 'music', 'science'],
  },
  showdown: {
    id: 'showdown', name: '쇼다운', icon: '💀', color: '#7ad94a',
    desc: '10명 개인전! 최후의 1인이 승리. 상자를 부숴 파워 큐브를 모으면 강해진다. 독가스가 점점 좁혀온다.',
    team: false, respawn: false, rounds: true, size: 10, sd: true, maps: SD_MAPS,
    gas: SD_GAS,
  },
  duo: {
    id: 'duo', name: '듀오 쇼다운', icon: '👥', color: '#4ad9b0',
    desc: '2명이 한 팀, 5팀 10명! 팀원이 한 명이라도 살아 있으면 죽어도 15초 뒤 부활. 마지막까지 남은 팀이 승리.',
    team: false, respawn: false, rounds: true, size: 10, sd: true, squad: 2, squadRespawn: 15, maps: SD_MAPS,
    gas: SD_GAS,
  },
  trio: {
    id: 'trio', name: '트리오 쇼다운', icon: '🔺', color: '#d9b84a',
    desc: '3명이 한 팀, 4팀 12명! 팀원이 한 명이라도 살아 있으면 죽어도 15초 뒤 부활. 마지막까지 남은 팀이 승리.',
    team: false, respawn: false, rounds: true, size: 12, sd: true, squad: 3, squadRespawn: 15, maps: SD_MAPS,
    gas: SD_GAS,
  },
  gem: {
    id: 'gem', name: '젬 그랩', icon: '💎', color: '#c070ff',
    desc: '3대3 팀전! 보석 10개를 모아 15초 버티면 승리. 죽으면 보석을 떨어뜨린다.',
    team: true, respawn: true, rounds: true, teamSize: 3, maps: ['gem-math', 'gem-cafe', 'gem-library', 'gem-science'],
    gemEvery: 6, gemWin: 10, holdTime: 15, timeLimit: 180,
  },
  double: {
    id: 'double', name: '더블 가젯', icon: '🎒', color: '#3ab8ff',
    desc: '가젯 2개를 모두 들고 싸우는 난투!',
    team: false, respawn: true, rounds: false, rotate: 240, doubleGadget: true, maps: ['computer', 'math', 'cafeteria', 'library', 'music', 'science'],
  },
  heist: {
    id: 'heist', name: '하이스트', icon: '💰', color: '#ffb02e',
    desc: '3대3 팀전! 상대 금고를 먼저 부수면 승리. 시간이 끝나면 금고 체력이 더 많이 남은 팀이 이긴다.',
    team: true, respawn: true, rounds: true, teamSize: 3, maps: ['heist-hall', 'heist-music'],
    safeHp: 60000, timeLimit: 150,
  },
  brawlball: {
    id: 'brawlball', name: '브롤볼', icon: '⚽', color: '#3ad16a',
    desc: '3대3 축구! 공 위를 지나가면 공을 잡고, 공격 버튼으로 슛. 2골 먼저 넣으면 승리.',
    team: true, respawn: true, rounds: true, teamSize: 3, maps: ['ball-field', 'ball-gym'],
    goalsToWin: 2, timeLimit: 150,
  },
  bounty: {
    id: 'bounty', name: '현상금', icon: '⭐', color: '#ffd23a',
    desc: '3대3 팀전! 상대를 쓰러뜨리면 머리 위 별을 가져온다. 많이 잡을수록 내 현상금도 오른다. 시간 끝에 별이 많은 팀 승리.',
    team: true, respawn: true, rounds: true, teamSize: 3, maps: ['bounty-library', 'bounty-rooftop'],
    timeLimit: 150, bountyStart: 2, bountyMax: 7,
  },
  knockout: {
    id: 'knockout', name: '녹아웃', icon: '🥊', color: '#ff4a6a',
    desc: '3대3 부활 없는 팀전! 상대 팀을 전멸시키면 라운드 승리. 2라운드 먼저 이기면 승리.',
    team: true, respawn: false, rounds: true, teamSize: 3, maps: ['ko-science', 'ko-music'],
    roundsToWin: 2, roundTime: 90,
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
  if (m.safes) m.safes = m.safes.map((s) => ({ x: R(s.x), y: R(s.y) }));
  if (m.ball) m.ball = { x: R(m.ball.x), y: R(m.ball.y) };
  if (m.goals) m.goals = m.goals.map((g) => ({ x: R(g.x), y: R(g.y), w: R(g.w), h: R(g.h) }));
}

module.exports = { MAPS, MODES };
