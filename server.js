// 정보쌤 브롤 - 실시간 온라인 대전 서버 (Node + socket.io, 서버 권한 방식)
// 모드: 난투 · 쇼다운 · 젬 그랩 · 더블 가젯  (modes.js)
// 브롤러: 정보쌤 · 현실쌤  (brawlers.js)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { BRAWLERS, GEARS, AJAE, publicBrawlers } = require('./brawlers');
const { MAPS, MODES } = require('./modes');
const auth = require('./auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json({ limit: '10kb' }));
app.set('trust proxy', 1);
auth.routes(app);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', 'three', 'build')));
app.get('/api/brawlers', (req, res) => res.json(publicBrawlers()));
app.get('/api/meta', (req, res) => res.json({ modes: MODES, maps: MAPS, gears: GEARS }));
const PORT = process.env.PORT || 3000;

const TICK = 30;
const DT = 1 / TICK;
const G = { respawn: 3, regenDelay: 3, regenRate: 0.13, maxPlayers: 10, maxBots: 6 };
const TEAM_COLORS = ['#4f8cff', '#ff4d4d'];
const COLORS = ['#4f8cff', '#ff5d5d', '#3ccf7a', '#ffb02e', '#b56cff', '#22c3c3', '#ff7ac6', '#a0a0a0', '#ffe14a', '#8a5cff'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const cloneMap = (id) => ({ ...MAPS[id], walls: MAPS[id].walls.map((w) => ({ ...w })) });   // 방마다 벽 따로 (대두가 부숨)
const rooms = new Map();

// ── 방 / 라운드 ────────────────────────────────────
function getRoom(modeId) {
  if (!rooms.has(modeId)) {
    const mode = MODES[modeId];
    const room = {
      id: modeId, mode, map: cloneMap(pick(mode.maps)),
      players: new Map(), mice: [], shards: [], gems: [], fx: [], pending: [],
      mouseSeq: 0, botSeq: 0, colorIdx: 0, shardSeq: 0, gemSeq: 0,
      phase: mode.rounds ? 'wait' : 'play', phaseT: mode.rounds ? 4 : 0,
      mapT: mode.rotate || 0, gemT: 0, holdT: 0, holdTeam: -1, safe: null, playT: 0, result: null,
    };
    rooms.set(modeId, room);
  }
  return rooms.get(modeId);
}
const humans = (room) => [...room.players.values()].filter((p) => !p.isBot);
const teamCount = (room, t) => [...room.players.values()].filter((p) => p.team === t).length;

// ── 맵 충돌 ────────────────────────────────────────
function hitsWall(map, x, y, r) {
  if (x < r || y < r || x > map.w - r || y > map.h - r) return true;
  return map.walls.some((w) => {
    if (w.broken) return false;
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  });
}
function resolveWalls(map, o, r) {
  o.x = Math.max(r, Math.min(map.w - r, o.x));
  o.y = Math.max(r, Math.min(map.h - r, o.y));
  for (const w of map.walls) {
    if (w.broken) continue;
    const cx = Math.max(w.x, Math.min(o.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(o.y, w.y + w.h));
    const dx = o.x - cx, dy = o.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 === 0) { o.y = w.y - r; continue; }
      const d = Math.sqrt(d2);
      o.x = cx + (dx / d) * r;
      o.y = cy + (dy / d) * r;
    }
  }
}
function freeSpot(map, x, y, r, spread) {
  for (let i = 0; i < 80; i++) {
    const nx = x + (Math.random() - 0.5) * spread * (1 + i / 20), ny = y + (Math.random() - 0.5) * spread * (1 + i / 20);
    if (!hitsWall(map, nx, ny, r + 6)) return { x: nx, y: ny };
  }
  return { x, y };
}
function spawnPoint(room, p, slot) {
  const map = room.map, r = p.B.radius;
  if (room.mode.team && map.spawns) { const s = map.spawns[p.team]; return freeSpot(map, s.x, s.y, r, 160); }
  if (room.mode.id === 'showdown' && slot != null) {   // 맵 가장자리를 따라 고르게
    const a = (slot / 8) * Math.PI * 2;
    return freeSpot(map, map.w / 2 + Math.cos(a) * map.w * 0.4, map.h / 2 + Math.sin(a) * map.h * 0.4, r, 120);
  }
  return freeSpot(map, map.w / 2, map.h / 2, r, Math.min(map.w, map.h) * 0.9);
}

// ── 플레이어 ───────────────────────────────────────
function cleanLoadout(B, lo = {}, mode) {
  const g = [0, 1].includes(lo.g) ? lo.g : 0;
  const sp = B.starPowers.some((s) => s.id === lo.sp) ? lo.sp : B.starPowers[0].id;
  const gears = [...new Set((Array.isArray(lo.gears) ? lo.gears : []).filter((id) => GEARS.some((x) => x.id === id)))].slice(0, 2);
  return { g: mode.doubleGadget ? [0, 1] : [g], sp, gears };
}
function randomLoadout(B) {
  const gs = GEARS.map((x) => x.id).sort(() => Math.random() - 0.5);
  return { g: Math.random() < 0.5 ? 0 : 1, sp: pick(B.starPowers).id, gears: gs.slice(0, 2) };
}
function newPlayer(room, id, name, isBot, brawlerId, loadout) {
  const B = BRAWLERS[brawlerId] || BRAWLERS.jungbo;
  const p = {
    id, name: (name || B.name).slice(0, 10), isBot, B, team: null,
    color: COLORS[room.colorIdx++ % COLORS.length],
    lo: cleanLoadout(B, loadout || randomLoadout(B), room.mode),
    x: 0, y: 0, hp: B.maxHp, ammo: B.attack.ammo, reloadT: 0, atkCd: 0,
    stunT: 0, frozenT: 0, gCd: 0, facing: Math.PI / 2, sup: 0,
    acT: 0, acTick: 0, ctrlId: null, ctrlT: 0, ctrlBy: null,
    aw: false, fear: 0, scaredT: 0, dash: null, noAtkT: 0,
    shield: 0, fullT: 0, rf: 0, ajT: 30, gems: 0,
    lastHit: 0, dead: false, respawnT: 0, out: false, rank: 0,
    kills: 0, deaths: 0, input: { mx: 0, my: 0 }, speech: null,
    bot: isBot ? { wanderX: 0, wanderY: 0, wanderT: 0 } : null,
  };
  return p;
}
const has = (p, gear) => p.lo.gears.includes(gear);
const hasSP = (p, sp) => p.lo.sp === sp;
const SP = (p, id) => p.B.starPowers.find((s) => s.id === id);
const jjang = (p) => hasSP(p, 'jjang') && p.hp >= p.B.maxHp;     // 김준후 스파2: 풀피 버프
const speedOf = (p) => p.B.speed * (has(p, 'speed') ? 1.1 : 1) * (jjang(p) ? SP(p, 'jjang').speedMul : 1);
function resetBody(room, p, slot) {
  const s = spawnPoint(room, p, slot);
  Object.assign(p, {
    x: s.x, y: s.y, hp: p.B.maxHp, dead: false, ammo: p.B.attack.ammo, stunT: 0, frozenT: 0, acT: 0,
    rf: 0, gems: 0, shield: 0, fullT: 0, respawnT: 0, input: { mx: 0, my: 0 }, aw: false, dash: null, noAtkT: 0,   // 쫄 게이지는 부활해도 유지
  });
  releaseCtrl(room, p, false);
}
function say(p, key, t = 1.6) { const l = p.B.lines && p.B.lines[key]; if (l) p.speech = { text: pick(l), t }; }

// ── 적/아군 판정 ───────────────────────────────────
// 조종당하는 중엔 조종하는 사람 편으로 취급
const teamOf = (room, p) => (p.ctrlBy && room.players.get(p.ctrlBy) ? room.players.get(p.ctrlBy).team : p.team);
function isEnemy(room, p, q) {
  if (!q || q.id === p.id || q.dead || q.out || q.id === p.ctrlBy) return false;
  if (room.mode.team && teamOf(room, p) === teamOf(room, q)) return false;
  return true;
}
const enemies = (room, p) => [...room.players.values()].filter((q) => isEnemy(room, p, q));
const canAct = (p) => !p.dead && !p.out && p.stunT <= 0 && p.frozenT <= 0;
const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
function inCone(p, a, range, half, x, y, rad) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
  if (d > range + rad) return false;
  if (d < rad + p.B.radius) return true;
  return Math.abs(angDiff(Math.atan2(dy, dx), a)) <= half;
}
const chargeSuper = (p, dmg) => { if (p.B.super) p.sup = Math.min(1, p.sup + dmg / p.B.super.need); };

// ── 피해 / 사망 ────────────────────────────────────
function damage(room, attacker, target, dmg, now, kind) {
  if (!target || target.dead || target.out) return;
  if (attacker && attacker !== target && !isEnemy(room, attacker, target)) return;
  if (attacker && has(attacker, 'dmg') && attacker.hp <= attacker.B.maxHp * 0.5) dmg = Math.round(dmg * 1.15);
  if (attacker && attacker !== target && jjang(attacker)) dmg = Math.round(dmg * SP(attacker, 'jjang').dmgMul);
  // 김준후 특성 '쫄': 맞을 때마다 쫄 게이지 ↑ → 다 차면 10초 공격 불능
  if (target.B.trait && target.scaredT <= 0 && kind !== 'gas') {
    target.fear = Math.min(1, target.fear + target.B.trait.perHit);
    if (target.fear >= 1) {
      target.scaredT = target.B.trait.dur;
      say(target, 'scared', 2.5);
      room.fx.push({ type: 'scared', id: target.id, x: target.x, y: target.y });
    }
  }
  let left = dmg;
  if (target.shield > 0) { const s = Math.min(target.shield, left); target.shield -= s; left -= s; }
  target.hp -= left;
  target.lastHit = now; target.fullT = 0;
  room.fx.push({ type: 'dmg', x: target.x, y: target.y - 40, v: dmg, k: kind });
  if (target.hp <= 0) kill(room, attacker, target, kind);
}
function kill(room, attacker, target, kind) {
  target.hp = 0; target.dead = true; target.deaths++; target.speech = null;
  target.respawnT = G.respawn;
  if (attacker && attacker.id !== target.id) {
    attacker.kills++; if (Math.random() < 0.5) say(attacker, 'kill');
    giveTrophies(attacker, 1, 'kills');      // 처치 +1 트로피
  }
  room.fx.push({ type: 'kill', a: attacker ? attacker.name : '독가스', b: target.name, aid: attacker ? attacker.id : null, bid: target.id, k: kind });
  room.mice = room.mice.filter((m) => m.owner !== target.id);
  releaseCtrl(room, target, false);
  target.acT = 0; target.rf = 0;
  if (room.mode.id === 'gem' && target.gems > 0) dropGems(room, target);
  if (room.mode.id === 'showdown') {
    target.out = true;
    target.rank = [...room.players.values()].filter((q) => !q.out).length + 1;
  }
}

// 정보쌤 스타파워1: 성찰 게이지 → 다 차면 불찰(즉사)
function reflectHit(room, p, q, now) {
  if (!hasSP(p, 'reflect') || q.dead || q.out) return;
  q.rf = Math.min(1, q.rf + 1 / SP(p, 'reflect').hits);
  if (q.rf >= 1) {
    room.fx.push({ type: 'bulchal', id: q.id, by: p.id, x: q.x, y: q.y });
    q.shield = 0; q.hp = 1;
    damage(room, p, q, 99999, now, 'bulchal');
  }
}

// 조종 해제 (조종하는 쪽이든 당하는 쪽이든)
function releaseCtrl(room, p, sasinga = true) {
  if (p.ctrlId) {
    const t = room.players.get(p.ctrlId);
    if (t) {
      t.ctrlBy = null; t.input = { mx: 0, my: 0 };
      // 현실쌤 스타파워1: 조종이 끝나면 2초 기절
      if (sasinga && hasSP(p, 'sasinga') && !t.dead && !t.out) {
        t.stunT = Math.max(t.stunT, SP(p, 'sasinga').stun);
        p.speech = { text: '너 사회성 머리는 하나도 없지? 너 진짜 싸가지 없다.', t: 2.6 };
        room.fx.push({ type: 'sasinga', id: p.id, tid: t.id, x: t.x, y: t.y });
      }
    }
    p.ctrlId = null; p.ctrlT = 0;
  }
  if (p.ctrlBy) {
    const c = room.players.get(p.ctrlBy);
    if (c) { c.ctrlId = null; c.ctrlT = 0; }
    p.ctrlBy = null; p.input = { mx: 0, my: 0 };
  }
}

// ── 젬 그랩 ────────────────────────────────────────
function dropGems(room, p) {
  for (let i = 0; i < p.gems; i++) {
    const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 60;
    const s = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    resolveWalls(room.map, s, 12);
    room.gems.push({ id: ++room.gemSeq, x: s.x, y: s.y });
  }
  p.gems = 0;
}
const teamGems = (room, t) => [...room.players.values()].filter((p) => p.team === t).reduce((a, p) => a + p.gems, 0);

// ── 브롤러별 스킬 ──────────────────────────────────
const SKILLS = {
  jungbo: {
    attack(room, p, a, now) {          // 아~ 이놈의 아이들: 주변 원형
      const A = p.B.attack;
      p.ammo -= 1; p.atkCd = A.cd;
      room.fx.push({ type: 'pulse', id: p.id, x: p.x, y: p.y, r: A.range, c: p.color });
      if (Math.random() < 0.45) say(p, 'atk', 1.2);
      for (const q of enemies(room, p)) {
        if (Math.hypot(q.x - p.x, q.y - p.y) > A.range + q.B.radius) continue;
        damage(room, p, q, A.dmg, now); chargeSuper(p, A.dmg); reflectHit(room, p, q, now);
      }
      for (const m of room.mice) if (m.owner !== p.id && Math.hypot(m.x - p.x, m.y - p.y) <= A.range + m.radius) m.hp -= A.dmg;
    },
    gadget(room, p, idx, now) {
      if (idx === 0) {                 // AI야? 시키지도 않은 걸 하네
        const g = p.B.gadgets[0];
        say(p, 'g1', 2);
        const hits = [];
        for (const q of enemies(room, p)) {
          if (Math.hypot(q.x - p.x, q.y - p.y) > g.range + q.B.radius) continue;
          hits.push(q.id); q.stunT = Math.max(q.stunT, g.stun); damage(room, p, q, g.dmg, now);
        }
        room.fx.push({ type: 'stun', id: p.id, x: p.x, y: p.y, r: g.range, hits });
      } else {                         // 마우스 소환
        const g = p.B.gadgets[1];
        say(p, 'g2', 1.6);
        for (let i = 0; i < g.count; i++) {
          const a = Math.random() * Math.PI * 2;
          const m = { id: ++room.mouseSeq, owner: p.id, color: p.color, x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40,
            hp: g.hp, maxHp: g.hp, life: g.life, biteCd: 0, ang: a, speed: g.speed, dmg: g.dmg, biteRate: g.biteCd, radius: g.radius };
          resolveWalls(room.map, m, m.radius);
          room.mice.push(m);
        }
        room.fx.push({ type: 'summon', id: p.id, x: p.x, y: p.y });
      }
    },
    super(room, p, a, now) {           // 이놈의 아이들: 부채꼴 + 넉백
      const S = p.B.super;
      say(p, 'sup', 1.8);
      room.fx.push({ type: 'super', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: S.range, h: S.half });
      for (const q of enemies(room, p)) {
        if (!inCone(p, a, S.range, S.half, q.x, q.y, q.B.radius)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        q.x += ((q.x - p.x) / d) * S.knock; q.y += ((q.y - p.y) / d) * S.knock;
        resolveWalls(room.map, q, q.B.radius);
        q.stunT = Math.max(q.stunT, 0.4);
        damage(room, p, q, S.dmg, now); reflectHit(room, p, q, now);
      }
      for (const m of room.mice) if (m.owner !== p.id && inCone(p, a, S.range, S.half, m.x, m.y, m.radius)) m.hp = 0;
    },
  },
  hyeonsil: {
    attack(room, p, a, now) {          // 주걱 스매쉬: 살짝 늦게 들어가는 부채꼴 강타
      const A = p.B.attack;
      p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
      const board = hasSP(p, 'board') && Math.random() < SP(p, 'board').chance;   // 스타파워2: 칠판 부수기
      room.fx.push({ type: 'swing', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: A.range, h: A.half, d: A.windup, board });
      if (Math.random() < 0.4) say(p, 'atk', 1.2);
      room.pending.push({ t: A.windup, fn: () => {
        if (p.dead || p.out || !room.players.has(p.id)) return;
        const t = Date.now() / 1000;
        for (const q of enemies(room, p)) {
          if (!inCone(p, a, A.range, A.half, q.x, q.y, q.B.radius)) continue;
          const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
          q.x += ((q.x - p.x) / d) * A.knock; q.y += ((q.y - p.y) / d) * A.knock; resolveWalls(room.map, q, q.B.radius);
          damage(room, p, q, A.dmg, t); chargeSuper(p, A.dmg);
          if (board) damage(room, p, q, SP(p, 'board').dmg, t, 'board');
          room.fx.push({ type: 'smack', x: q.x, y: q.y });
        }
        for (const m of room.mice) if (m.owner !== p.id && inCone(p, a, A.range, A.half, m.x, m.y, m.radius)) m.hp -= A.dmg;
        if (board) {
          const b = SP(p, 'board');
          const sx = p.x + Math.cos(a) * A.range * 0.6, sy = p.y + Math.sin(a) * A.range * 0.6;
          room.shards.push({ id: ++room.shardSeq, owner: p.id, x: sx, y: sy, r: b.radius, t: 1e9, tick: 0, dps: b.dps });   // 판 끝날 때까지 계속 남음
          if (room.shards.length > b.max) room.shards.shift();                                                            // 너무 많으면 가장 오래된 것부터
          room.fx.push({ type: 'board', id: p.id, x: sx, y: sy, a: +a.toFixed(3) });
        }
      } });
    },
    gadget(room, p, idx, now) {
      if (idx === 0) {                 // 얘들아 덥지 않니? — 에어컨 18도
        const g = p.B.gadgets[0];
        say(p, 'g1', 2);
        p.acT = g.dur; p.acTick = 0;
        room.fx.push({ type: 'ac', id: p.id, x: p.x, y: p.y });
      } else {                         // 펜 내려놓고 여기 보자 — 전체 기절
        const g = p.B.gadgets[1];
        say(p, 'g2', 2);
        const hits = [];
        for (const q of enemies(room, p)) { q.stunT = Math.max(q.stunT, g.stun); hits.push(q.id); }
        room.fx.push({ type: 'look', id: p.id, x: p.x, y: p.y, hits });
      }
    },
    super(room, p, a, now) {           // 너 등신이냐? — 직선 첫 번째 상대 5초 조종
      const S = p.B.super;
      say(p, 'sup', 2);
      const ca = Math.cos(a), sa = Math.sin(a);
      let target = null, best = Infinity;
      for (const q of enemies(room, p)) {
        if (q.ctrlBy || q.ctrlId) continue;
        const dx = q.x - p.x, dy = q.y - p.y;
        const along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
        if (along < -q.B.radius || along > S.range + q.B.radius || perp > S.width + q.B.radius) continue;
        if (along < best) { best = along; target = q; }
      }
      room.fx.push({ type: 'ctrl', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: S.range, hit: target ? target.id : null });
      if (target) {
        p.ctrlId = target.id; p.ctrlT = S.dur; target.ctrlBy = p.id;
        target.input = { mx: 0, my: 0 }; p.input = { mx: 0, my: 0 };
        target.speech = { text: '...네?', t: 1.5 };
      }
    },
  },
};

SKILLS.junhoo = {
  // 백초크: 앞쪽 범위에서 가장 가까운 상대를 끌어와 1초 기절 + 1300 (각성하면 범위 2배·2000)
  attack(room, p, a, now) {
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    let range = A.range * (jjang(p) ? SP(p, 'jjang').rangeMul : 1), dmg = A.dmg;
    const aw = p.aw;
    if (aw) { const g = p.B.gadgets[1]; range *= g.rangeMul; dmg = g.dmg; p.aw = false; }
    let target = null, best = Infinity;
    for (const q of enemies(room, p)) {
      if (!inCone(p, a, range, A.half, q.x, q.y, q.B.radius)) continue;
      const d = Math.hypot(q.x - p.x, q.y - p.y);
      if (d < best) { best = d; target = q; }
    }
    room.fx.push({ type: 'choke', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: range, h: A.half, aw, tid: target ? target.id : null, tx: target ? target.x : null, ty: target ? target.y : null });
    if (!target) return;
    if (Math.random() < 0.5) say(p, 'atk', 1.2);
    const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;   // 내 앞으로 끌어오기
    const keep = p.B.radius + target.B.radius + 6;
    target.x = p.x + (dx / d) * keep; target.y = p.y + (dy / d) * keep;
    resolveWalls(room.map, target, target.B.radius);
    target.stunT = Math.max(target.stunT, A.stun);
    damage(room, p, target, dmg, now, aw ? 'awaken' : 'choke');
    chargeSuper(p, dmg);
  },
  gadget(room, p, idx, now) {
    if (idx === 0) {                 // 간식 털어먹기
      const g = p.B.gadgets[0];
      say(p, 'g1', 1.8);
      const heal = Math.min(g.heal, p.B.maxHp - p.hp);
      p.hp += heal;
      room.fx.push({ type: 'snack', id: p.id, x: p.x, y: p.y, v: Math.round(heal) });
    } else {                         // 나 김준후야!!! — 다음 공격 강화
      say(p, 'g2', 2);
      p.aw = true;
      room.fx.push({ type: 'awaken', id: p.id, x: p.x, y: p.y });
    }
  },
  // 태클: 조준 방향으로 돌진, 처음 부딪힌 상대 1000 + 4초 기절
  super(room, p, a, now) {
    const S = p.B.super;
    say(p, 'sup', 1.6);
    p.dash = { a, left: S.range, speed: S.range / S.dashTime, dmg: S.dmg, stun: S.stun, hitFx: 'tackleHit', kind: 'tackle' };
    room.fx.push({ type: 'tackle', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: S.range });
  },
};
// 돌진 (김준후 태클 · 김재열 박치기): 잘게 나눠 움직이며 벽에 닿으면 멈춤. 대두는 벽을 부숨
function dashStep(room, p, now) {
  const D = p.dash;
  if (p.stunT > 0 || p.frozenT > 0) { p.dash = null; return; }   // 돌진 중 기절하면 멈춤
  let move = Math.min(D.left, D.speed * DT);
  const r = p.B.radius, ca = Math.cos(D.a), sa = Math.sin(D.a);
  while (move > 0) {
    const st = Math.min(8, move); move -= st; D.left -= st;
    const nx = p.x + ca * st, ny = p.y + sa * st;
    if (hitsWall(room.map, nx, ny, r)) {
      const touch = (w) => (nx - Math.max(w.x, Math.min(nx, w.x + w.w))) ** 2 + (ny - Math.max(w.y, Math.min(ny, w.y + w.h))) ** 2 < r * r;
      const w = D.breakWalls && room.map.walls.find((w) => !w.broken && touch(w));
      if (w) { w.broken = true; room.fx.push({ type: 'wallBreak', i: room.map.walls.indexOf(w), x: w.x + w.w / 2, y: w.y + w.h / 2 }); }
      else { p.dash = null; room.fx.push({ type: 'dashWall', id: p.id, x: p.x, y: p.y, a: +D.a.toFixed(3), kind: D.kind }); return; }   // 벽 못 넘음
    }
    p.x = nx; p.y = ny;
    for (const q of enemies(room, p)) {
      if (Math.hypot(q.x - p.x, q.y - p.y) > r + q.B.radius + 8) continue;
      q.x += ca * 60; q.y += sa * 60; resolveWalls(room.map, q, q.B.radius);   // 부딪혀서 밀려남
      q.stunT = Math.max(q.stunT, D.stun);
      damage(room, p, q, D.dmg, now, D.kind);
      room.fx.push({ type: D.hitFx, id: p.id, tid: q.id, x: q.x, y: q.y, a: +D.a.toFixed(3) });
      p.dash = null; return;
    }
  }
  if (D.left <= 0) { p.dash = null; room.fx.push({ type: 'tackleEnd', id: p.id, x: p.x, y: p.y }); }
}

// 직선 위 첫 번째 적 + 벽에서 끊기는 지점
function lineHit(room, p, a, range, width) {
  const ca = Math.cos(a), sa = Math.sin(a);
  let end = range;
  for (let d = 10; d <= range; d += 10) if (hitsWall(room.map, p.x + ca * d, p.y + sa * d, 4)) { end = d; break; }
  let target = null, best = end;
  for (const q of enemies(room, p)) {
    const dx = q.x - p.x, dy = q.y - p.y, along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
    if (along < 0 || along > best + q.B.radius || perp > width + q.B.radius) continue;
    best = along; target = q;
  }
  return { target, end: target ? best : end };
}

SKILLS.jaeyeol = {
  // 세모 던지기 빔: 직선 빔 + 포물선 세모가 동시에
  attack(room, p, a, now) {
    const A = p.B.attack, gao = hasSP(p, 'gao') ? SP(p, 'gao').atkMul : 1;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    const range = A.range * gao, ca = Math.cos(a), sa = Math.sin(a);
    const { target, end } = lineHit(room, p, a, range, A.width);
    const lx = Math.max(20, Math.min(room.map.w - 20, p.x + ca * range)), ly = Math.max(20, Math.min(room.map.h - 20, p.y + sa * range));
    room.fx.push({ type: 'tri', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), ex: p.x + ca * end, ey: p.y + sa * end, hit: target ? target.id : null, lx, ly, t: A.lobTime, r: A.lobR * gao });
    if (Math.random() < 0.35) say(p, 'atk', 1.1);
    if (target) { damage(room, p, target, Math.round(A.dmg * gao), now, 'tri'); chargeSuper(p, A.dmg); }
    room.pending.push({ t: A.lobTime, fn: () => {   // 던진 세모 착지 (벽 넘어감)
      if (!room.players.has(p.id)) return;
      const t = Date.now() / 1000;
      for (const q of enemies(room, p)) {
        if (Math.hypot(q.x - lx, q.y - ly) > A.lobR * gao + q.B.radius) continue;
        const both = target && q.id === target.id;          // 빔 + 세모 둘 다 맞으면 보너스 → 800+800+200 = 1800
        damage(room, p, q, Math.round((A.lobDmg + (both ? A.bothBonus : 0)) * gao), t, both ? 'triBoth' : 'lob'); chargeSuper(p, A.lobDmg);
        if (both) room.fx.push({ type: 'triBoth', x: q.x, y: q.y });
      }
    } });
  },
  gadget(room, p, idx, now) {
    if (idx === 0) {                 // 어깨빵
      const g = p.B.gadgets[0], gao = hasSP(p, 'gao') ? SP(p, 'gao') : null;
      const range = gao ? gao.g1Range : g.range, dmg = gao ? gao.g1Dmg : g.dmg, knock = gao ? gao.g1Knock : g.knock;
      say(p, 'g1', 1.5);
      const hits = [];
      for (const q of enemies(room, p)) {
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d > range + q.B.radius) continue;
        for (let k = 0; k < knock; k += 8) { const nx = q.x + dx / d * 8, ny = q.y + dy / d * 8; if (hitsWall(room.map, nx, ny, q.B.radius)) break; q.x = nx; q.y = ny; }
        q.stunT = Math.max(q.stunT, 0.3);
        damage(room, p, q, dmg, now, 'shoulder'); hits.push(q.id);
      }
      room.fx.push({ type: 'shoulder', id: p.id, x: p.x, y: p.y, r: range, hits });
    } else {                         // 나랑 사귈..레?
      const g = p.B.gadgets[1];
      say(p, 'g2', 2);
      let target = null, best = g.range;
      for (const q of enemies(room, p)) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < best) { best = d; target = q; } }
      room.fx.push({ type: 'confess', id: p.id, x: p.x, y: p.y, tid: target ? target.id : null });
      if (target) { target.noAtkT = Math.max(target.noAtkT, g.dur); target.speech = { text: '…??? (충격)', t: 2 }; }
    }
  },
  // 대가리 박치기: 로켓 돌진 (벽 못 넘음, 대두면 벽 부숨)
  super(room, p, a, now) {
    const S = p.B.super, big = hasSP(p, 'daedu');
    say(p, 'sup', 1.6);
    p.dash = { a, left: S.range, speed: S.range / S.dashTime, dmg: big ? SP(p, 'daedu').dmg : S.dmg, stun: S.stun, hitFx: 'headbutt', kind: 'headbutt', breakWalls: big };
    room.fx.push({ type: 'rocket', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), big });
  },
};

function doAttack(room, p, ang, now) {
  if (room.phase !== 'play' || !canAct(p) || p.ammo < 1 || p.atkCd > 0 || p.scaredT > 0 || p.noAtkT > 0 || p.dash) return;
  p.lastHit = Math.max(p.lastHit, now - G.regenDelay + 1);
  SKILLS[p.B.id].attack(room, p, Number.isFinite(ang) ? ang : p.facing, now);
}
function doGadget(room, p, slot, now) {           // slot: 1 또는 2 (더블 가젯 모드에서만 2)
  if (room.phase !== 'play' || !canAct(p) || p.gCd > 0) return;
  const idx = p.lo.g[slot - 1]; if (idx == null) return;
  p.gCd = p.B.gadgetCd * (has(p, 'gadget') ? 0.8 : 1);
  SKILLS[p.B.id].gadget(room, p, idx, now);
}
function doSuper(room, p, ang, now) {
  if (room.phase !== 'play' || !p.B.super || !canAct(p) || p.sup < 1 || p.scaredT > 0 || p.noAtkT > 0 || p.dash) return;
  if (p.ctrlBy && p.B.id === 'hyeonsil') return;   // 꼭두각시 현실쌤은 조종 궁극기 못 씀
  p.sup = 0;
  const a = Number.isFinite(ang) ? ang : p.facing;
  p.facing = a;
  SKILLS[p.B.id].super(room, p, a, now);
}

// ── 봇 AI ──────────────────────────────────────────
function moveToward(p, x, y, jitter = 0.3, now = 0) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) || 1;
  const j = Math.sin(now * 3 + p.x * 0.01) * jitter;
  p.input = { mx: dx / d - (dy / d) * j, my: dy / d + (dx / d) * j };
  return d;
}
function botThink(room, p, now) {
  const b = p.bot, B = p.B, mode = room.mode;
  if (p.ctrlBy) return;
  if (p.ctrlId) {                               // 조종 중: 꼭두각시를 적에게 보내서 공격
    const t = room.players.get(p.ctrlId); if (!t) return;
    let tg = null, bd = Infinity;
    for (const q of enemies(room, t)) { if (q.id === p.id) continue; const d = Math.hypot(q.x - t.x, q.y - t.y); if (d < bd) { bd = d; tg = q; } }
    if (!tg) { p.input = { mx: 0, my: 0 }; return; }
    const dx = tg.x - t.x, dy = tg.y - t.y;
    p.input = { mx: dx / (bd || 1), my: dy / (bd || 1) };
    if (bd < t.B.attack.range + 10 && Math.random() < 0.2) doAttack(room, t, Math.atan2(dy, dx), now);
    if (bd < 260 && Math.random() < 0.03) doGadget(room, t, 1, now);
    if (t.sup >= 1 && bd < 300 && Math.random() < 0.1) doSuper(room, t, Math.atan2(dy, dx), now);
    return;
  }
  let target = null, best = Infinity;
  for (const q of enemies(room, p)) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < best) { best = d; target = q; } }
  b.wanderT -= DT;
  const fight = () => {
    const dx = target.x - p.x, dy = target.y - p.y;
    moveToward(p, target.x, target.y, 0.4, now);
    if (best < B.attack.range + 10 && Math.random() < (B.attack.aim === 'dir' ? 0.1 : 0.18)) doAttack(room, p, Math.atan2(dy, dx), now);
    if (best < 220 && Math.random() < 0.006) doGadget(room, p, 1, now);
    if (mode.doubleGadget && best < 400 && Math.random() < 0.005) doGadget(room, p, 2, now);
    if (B.super && best < B.super.range - 30 && p.sup >= 1 && Math.random() < 0.05) doSuper(room, p, Math.atan2(dy, dx), now);
    if (p.hp < B.maxHp * 0.3 && Math.random() < 0.5) { p.input.mx *= -1; p.input.my *= -1; }
  };
  // 쇼다운: 독가스 밖이면 안으로
  if (room.safe) {
    const s = room.safe;
    if (p.x < s.x1 + 40 || p.x > s.x2 - 40 || p.y < s.y1 + 40 || p.y > s.y2 - 40) { moveToward(p, room.map.w / 2, room.map.h / 2, 0, now); return; }
  }
  // 젬 그랩: 보석 줍기 / 이기고 있으면 진지로 후퇴
  if (mode.id === 'gem') {
    const my = teamGems(room, p.team), their = teamGems(room, 1 - p.team);
    if (p.gems > 0 && my >= mode.gemWin && my > their) {
      if (target && best < 220) return fight();
      const s = room.map.spawns[p.team]; moveToward(p, s.x, s.y, 0.2, now); return;
    }
    if (target && best < 260) return fight();
    let gem = null, gd = Infinity;
    for (const g of room.gems) { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < gd) { gd = d; gem = g; } }
    if (gem) { moveToward(p, gem.x, gem.y, 0.1, now); return; }
    if (target && best < 650) return fight();
    moveToward(p, room.map.mine.x, room.map.mine.y, 0.3, now); return;
  }
  if (target && best < 650) return fight();
  if (b.wanderT <= 0) {
    const a = Math.random() * Math.PI * 2;
    b.wanderX = Math.cos(a); b.wanderY = Math.sin(a); b.wanderT = 1 + Math.random() * 2;
  }
  if (mode.id === 'showdown') { moveToward(p, room.map.w / 2 + b.wanderX * 200, room.map.h / 2 + b.wanderY * 200, 0.3, now); return; }
  p.input = { mx: b.wanderX, my: b.wanderY };
}

// ── 봇 채우기 ──────────────────────────────────────
function addBot(room, team) {
  const id = 'bot' + ++room.botSeq;
  const bid = pick(Object.keys(BRAWLERS));
  const p = newPlayer(room, id, '봇' + room.botSeq, true, bid, null);
  if (team != null) { p.team = team; p.color = TEAM_COLORS[team]; }
  room.players.set(id, p);
  return p;
}
function removeBot(room, p) { releaseCtrl(room, p, false); if (p.gems) dropGems(room, p); room.players.delete(p.id); }
function fillBots(room) {
  const mode = room.mode;
  if (mode.id === 'showdown') {
    for (const p of [...room.players.values()]) if (p.isBot) removeBot(room, p);
    while (room.players.size < mode.size) addBot(room);
  } else if (mode.id === 'gem') {
    for (const t of [0, 1]) {
      while (teamCount(room, t) > mode.teamSize) { const bot = [...room.players.values()].find((p) => p.isBot && p.team === t); if (!bot) break; removeBot(room, bot); }
      while (teamCount(room, t) < mode.teamSize) addBot(room, t);
    }
  }
}

// ── 라운드 진행 ────────────────────────────────────
function startRound(room) {
  const mode = room.mode;
  room.map = cloneMap(pick(mode.maps));
  room.mice = []; room.shards = []; room.gems = []; room.pending = [];
  room.gemT = 0; room.holdT = 0; room.holdTeam = -1; room.result = null; room.playT = 0;
  room.safe = mode.gas ? { x1: 0, y1: 0, x2: room.map.w, y2: room.map.h } : null;
  if (mode.team) {   // 사람은 팀 균형 맞춰 재배치
    let i = 0;
    for (const p of humans(room)) { p.team = i++ % 2; p.color = TEAM_COLORS[p.team]; }
  }
  fillBots(room);
  let slot = Math.floor(Math.random() * 8);
  for (const p of room.players.values()) {
    p.out = false; p.rank = 0; p.sup = 0; p.gCd = 0; p.kills = 0; p.deaths = 0; p.ajT = 30; p.fear = 0; p.scaredT = 0;
    resetBody(room, p, slot++);
  }
  room.phase = 'wait'; room.phaseT = 4;
  room.fx.push({ type: 'round', map: room.map.id });
}
// 트로피: 로그인한 사람만 계정에 저장
function giveTrophies(p, n, field) {
  if (!p || p.isBot || !p.userKey) return;
  const t = auth.addTrophies(p.userKey, n, field);
  if (t != null) io.to(p.id).emit('trophy', { total: t, add: n });
}
function endRound(room, result) {
  room.phase = 'end'; room.phaseT = 6; room.result = result;
  for (const p of humans(room)) {
    if (p.userKey) auth.addStat(p.userKey, 'games');
    const win = result.type === 'gem' ? result.winTeam === p.team : result.winner === p.id;
    if (win) giveTrophies(p, 8, 'wins');     // 승리 +8 트로피
  }
  room.fx.push({ type: 'end', result });
}
function changeMap(room) {   // 난투/더블가젯: 맵 로테이션
  const others = room.mode.maps.filter((m) => m !== room.map.id);
  room.map = cloneMap(pick(others.length ? others : room.mode.maps));
  room.mice = []; room.shards = []; room.pending = [];
  for (const p of room.players.values()) resetBody(room, p);
  room.mapT = room.mode.rotate;
  room.fx.push({ type: 'round', map: room.map.id });
}

function roundLogic(room, now) {
  const mode = room.mode;
  if (!mode.rounds) {
    room.mapT -= DT;
    if (room.mapT <= 0) changeMap(room);
    return;
  }
  if (room.phase === 'wait') { room.phaseT -= DT; if (room.phaseT <= 0) room.phase = 'play'; return; }
  if (room.phase === 'end') { room.phaseT -= DT; if (room.phaseT <= 0) startRound(room); return; }
  room.playT += DT;
  if (mode.id === 'showdown') {
    // 독가스: 시작 후 일정 시간 뒤부터 가운데로 좁혀옴
    const g = mode.gas, m = room.map;
    const k = Math.max(0, Math.min(1, (room.playT - g.start) / g.dur));
    const half = (Math.max(m.w, m.h) / 2) * (1 - k) + (g.final / 2) * k;
    room.safe = { x1: m.w / 2 - half, y1: m.h / 2 - half, x2: m.w / 2 + half, y2: m.h / 2 + half };
    const alive = [...room.players.values()].filter((p) => !p.out);
    if (alive.length <= 1) {
      const w = alive[0];
      if (w) w.rank = 1;
      endRound(room, { type: 'showdown', winner: w ? w.id : null, winnerName: w ? w.name : null, ranks: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, rank: p.rank })) });
    }
  } else if (mode.id === 'gem') {
    room.gemT -= DT;
    if (room.gemT <= 0 && room.gems.length < 30) {
      room.gemT = mode.gemEvery;
      const s = freeSpot(room.map, room.map.mine.x, room.map.mine.y, 12, 120);
      room.gems.push({ id: ++room.gemSeq, x: s.x, y: s.y });
      room.fx.push({ type: 'gemspawn', x: room.map.mine.x, y: room.map.mine.y });
    }
    const a = teamGems(room, 0), b = teamGems(room, 1);
    const lead = a >= mode.gemWin && a > b ? 0 : b >= mode.gemWin && b > a ? 1 : -1;
    if (lead !== room.holdTeam) { room.holdTeam = lead; room.holdT = mode.holdTime; }
    if (lead >= 0) { room.holdT -= DT; if (room.holdT <= 0) return endRound(room, { type: 'gem', winTeam: lead, score: [a, b] }); }
    if (room.playT >= mode.timeLimit) endRound(room, { type: 'gem', winTeam: a > b ? 0 : b > a ? 1 : -1, score: [a, b] });
  }
}

// ── 한 틱 ──────────────────────────────────────────
function step(room) {
  const now = Date.now() / 1000;
  roundLogic(room, now);
  const playing = room.phase === 'play';

  for (const a of room.pending) a.t -= DT;
  const due = room.pending.filter((a) => a.t <= 0);
  room.pending = room.pending.filter((a) => a.t > 0);
  for (const a of due) a.fn();

  // 조종: 조종하는 사람의 이동 입력 → 꼭두각시에게
  for (const p of room.players.values()) {
    if (!p.ctrlId) continue;
    const t = room.players.get(p.ctrlId);
    p.ctrlT -= DT;
    if (!t || t.dead || t.out) { releaseCtrl(room, p, false); continue; }
    if (p.dead || p.out || p.stunT > 0 || p.frozenT > 0 || p.ctrlT <= 0) { releaseCtrl(room, p, true); continue; }
    t.input = { ...p.input };
  }
  // 에어컨: 켠 사람 말고 모든 적에게 지속 피해
  for (const p of room.players.values()) {
    if (p.acT <= 0) continue;
    p.acT = Math.max(0, p.acT - DT); p.acTick -= DT;
    if (p.acTick <= 0) {
      const g = p.B.gadgets[0]; p.acTick = g.tick;
      for (const q of enemies(room, p)) damage(room, p, q, g.dmg, now, 'cold');
    }
    if (p.dead) p.acT = 0;
  }
  // 칠판 파편: 밟고 있으면 지속 피해
  for (const s of room.shards) {
    s.t -= DT; s.tick -= DT;
    if (s.tick > 0) continue;
    s.tick = 0.25;
    const owner = room.players.get(s.owner);
    for (const q of room.players.values()) {
      if (q.dead || q.out || Math.hypot(q.x - s.x, q.y - s.y) > s.r + q.B.radius * 0.5) continue;
      if (owner ? !isEnemy(room, owner, q) : q.id === s.owner) continue;
      damage(room, owner, q, Math.round(s.dps / 4), now, 'shard');
    }
  }
  room.shards = room.shards.filter((s) => s.t > 0);

  for (const p of room.players.values()) {
    const B = p.B;
    if (p.speech) { p.speech.t -= DT; if (p.speech.t <= 0) p.speech = null; }
    if (p.out) continue;
    if (p.dead) {
      if (!room.mode.respawn) continue;
      p.respawnT -= DT;
      if (p.respawnT <= 0) resetBody(room, p);
      continue;
    }
    if (!playing) { p.input = p.isBot ? { mx: 0, my: 0 } : p.input; continue; }   // 대기/결과 중엔 정지
    if (p.isBot) botThink(room, p, now);
    p.atkCd = Math.max(0, p.atkCd - DT);
    p.gCd = Math.max(0, p.gCd - DT);
    p.stunT = Math.max(0, p.stunT - DT);
    p.frozenT = Math.max(0, p.frozenT - DT);
    if (p.dash) { dashStep(room, p, now); if (p.dead) continue; }
    if (p.noAtkT > 0) p.noAtkT = Math.max(0, p.noAtkT - DT);
    if (p.scaredT > 0) { p.scaredT -= DT; if (p.scaredT <= 0) { p.scaredT = 0; p.fear = 0; } }
    // 김준후 스파1: 근처에 상대가 있으면 궁 자동 충전
    if (hasSP(p, 'sibi') && B.super && p.sup < 1) {
      const sp = SP(p, 'sibi');
      if (enemies(room, p).some((q) => Math.hypot(q.x - p.x, q.y - p.y) < sp.range)) p.sup = Math.min(1, p.sup + DT / sp.fullIn);
    }
    if (p.ammo < B.attack.ammo) {
      p.reloadT += DT * (jjang(p) ? SP(p, 'jjang').reloadMul : 1);
      if (p.reloadT >= B.attack.reload) { p.ammo++; p.reloadT = 0; }
    } else p.reloadT = 0;
    const regen = G.regenRate * (has(p, 'heal') ? 1.5 : 1);
    if (now - p.lastHit > G.regenDelay && p.hp < B.maxHp) p.hp = Math.min(B.maxHp, p.hp + B.maxHp * regen * DT);
    // 기어: 보호막 / 궁극기 자동 충전
    if (has(p, 'shield')) { if (p.hp >= B.maxHp) { p.fullT += DT; if (p.fullT >= 3) p.shield = 900; } else p.fullT = 0; }
    if (has(p, 'super') && B.super) p.sup = Math.min(1, p.sup + DT / 60);
    // 정보쌤 스타파워2: 아재개그 (30초마다 주변 적 얼림)
    if (hasSP(p, 'ajae')) {
      p.ajT -= DT;
      if (p.ajT <= 0) {
        const sp = SP(p, 'ajae'); p.ajT = sp.every;
        const joke = pick(AJAE);
        p.speech = { text: joke, t: 3 };
        const hits = [];
        for (const q of enemies(room, p)) {
          if (Math.hypot(q.x - p.x, q.y - p.y) > sp.range + q.B.radius) continue;
          q.frozenT = Math.max(q.frozenT, sp.freeze); hits.push(q.id);
        }
        room.fx.push({ type: 'ajae', id: p.id, x: p.x, y: p.y, r: sp.range, joke, hits });
      }
    }
    // 쇼다운 독가스
    if (room.safe) {
      const s = room.safe;
      if (p.x < s.x1 || p.x > s.x2 || p.y < s.y1 || p.y > s.y2) {
        p.gasT = (p.gasT || 0) - DT;
        if (p.gasT <= 0) { p.gasT = 0.5; damage(room, null, p, room.mode.gas.dps / 2, now, 'gas'); }
        if (p.dead) continue;
      }
    }
    // 이동 (조종하는 동안 본인은 제자리)
    if (p.stunT <= 0 && p.frozenT <= 0 && !p.ctrlId && !p.dash) {
      let { mx, my } = p.input;
      const len = Math.hypot(mx, my);
      if (len > 0.1) { mx /= len; my /= len; p.facing = Math.atan2(my, mx); } else { mx = 0; my = 0; }
      p.x += mx * speedOf(p) * DT;
      p.y += my * speedOf(p) * DT;
      resolveWalls(room.map, p, B.radius);
    }
    // 젬 줍기
    if (room.mode.id === 'gem') {
      room.gems = room.gems.filter((g) => {
        if (Math.hypot(g.x - p.x, g.y - p.y) > B.radius + 18) return true;
        p.gems++; room.fx.push({ type: 'gem', id: p.id, x: g.x, y: g.y }); return false;
      });
    }
  }

  // 소환수 (마우스)
  for (const m of room.mice) {
    m.life -= DT; m.biteCd = Math.max(0, m.biteCd - DT);
    const owner = room.players.get(m.owner);
    let target = null, best = 700;
    if (owner) for (const q of enemies(room, owner)) { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < best) { best = d; target = q; } }
    if (target) {
      const dx = target.x - m.x, dy = target.y - m.y, d = best || 1;
      m.ang = Math.atan2(dy, dx);
      if (d > target.B.radius + m.radius) {
        m.x += (dx / d) * m.speed * DT; m.y += (dy / d) * m.speed * DT;
        resolveWalls(room.map, m, m.radius);
      } else if (m.biteCd <= 0) {
        m.biteCd = m.biteRate;
        damage(room, owner, target, m.dmg, now);
        room.fx.push({ type: 'click', x: target.x, y: target.y });
      }
    } else if (owner && Math.hypot(owner.x - m.x, owner.y - m.y) > 70) {
      const dx = owner.x - m.x, dy = owner.y - m.y, d = Math.hypot(dx, dy);
      m.ang = Math.atan2(dy, dx);
      m.x += (dx / d) * m.speed * 0.7 * DT; m.y += (dy / d) * m.speed * 0.7 * DT;
      resolveWalls(room.map, m, m.radius);
    }
  }
  room.mice = room.mice.filter((m) => m.life > 0 && m.hp > 0 && room.players.has(m.owner));

  const r1 = (v) => Math.round(v);
  io.to(room.id).emit('state', {
    mode: room.mode.id, map: room.map.id, phase: room.phase, phaseT: +room.phaseT.toFixed(1),
    mapT: Math.ceil(room.mapT), playT: Math.floor(room.playT), result: room.result,
    safe: room.safe ? { x1: r1(room.safe.x1), y1: r1(room.safe.y1), x2: r1(room.safe.x2), y2: r1(room.safe.y2) } : null,
    gems: room.gems.map((g) => [g.id, r1(g.x), r1(g.y)]),
    score: room.mode.id === 'gem' ? [teamGems(room, 0), teamGems(room, 1)] : null,
    hold: room.holdTeam >= 0 ? { team: room.holdTeam, t: +room.holdT.toFixed(1) } : null,
    shards: room.shards.map((s) => [s.id, r1(s.x), r1(s.y), s.r, 99]),
    broken: room.map.walls.reduce((a, w, i) => (w.broken && a.push(i), a), []),
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, b: p.B.id, color: p.color, bot: p.isBot, team: p.team,
      x: r1(p.x), y: r1(p.y), hp: r1(p.hp), dead: p.dead, out: p.out, rank: p.rank, respawn: Math.ceil(p.respawnT),
      ammo: p.ammo + p.reloadT / p.B.attack.reload, stun: p.stunT > 0, fz: p.frozenT > 0,
      gCd: +p.gCd.toFixed(2), sup: +p.sup.toFixed(3), f: +p.facing.toFixed(2),
      k: p.kills, d: p.deaths, say: p.speech ? p.speech.text : null,
      ctl: p.ctrlBy, ctrl: p.ctrlId, ctrlT: +(p.ctrlT || 0).toFixed(1), ac: +p.acT.toFixed(1),
      g: p.lo.g, sp: p.lo.sp, gear: p.lo.gears, sh: r1(p.shield), rf: +p.rf.toFixed(3), aj: Math.ceil(p.ajT), gems: p.gems,
      aw: p.aw, fear: +p.fear.toFixed(2), scared: +p.scaredT.toFixed(1), dash: !!p.dash, jj: jjang(p), na: +p.noAtkT.toFixed(1),
    })),
    mice: room.mice.map((m) => ({ id: m.id, x: r1(m.x), y: r1(m.y), a: +m.ang.toFixed(2), c: m.color, hp: m.hp / m.maxHp })),
    fx: room.fx,
  });
  room.fx = [];
}

setInterval(() => { for (const room of rooms.values()) step(room); }, 1000 / TICK);

// ── 접속자 목록 (로비에 있는 사람 + 플레이 중인 사람) ──
const online = new Map();   // socket.id → { name, key, status, mode, brawler }
let onlineDirty = false;
function onlineList() {
  return [...online.values()].map((o) => ({
    name: o.name, guest: !o.key, trophies: o.key ? auth.trophiesOf(o.key) : null,
    status: o.status, mode: o.mode, modeName: o.mode && MODES[o.mode] ? MODES[o.mode].icon + ' ' + MODES[o.mode].name : null,
    brawler: o.brawler && BRAWLERS[o.brawler] ? BRAWLERS[o.brawler].name : null,
  })).sort((a, b) => (a.status === b.status ? 0 : a.status === 'game' ? -1 : 1) || (b.trophies || 0) - (a.trophies || 0));
}
setInterval(() => { if (onlineDirty) { onlineDirty = false; io.emit('onlineCount', online.size); } }, 1000);

// ── 소켓 ───────────────────────────────────────────
io.on('connection', (socket) => {
  let room = null;
  // 로비에 들어오면 바로 접속자로 등록
  socket.on('hello', ({ token } = {}) => {
    const acc = auth.userFromToken(token);
    const o = online.get(socket.id) || { status: 'lobby' };
    Object.assign(o, { name: acc ? acc.u.name : '게스트', key: acc ? acc.key : null });
    online.set(socket.id, o); onlineDirty = true;
    socket.emit('onlineCount', online.size);
  });
  socket.on('online', (cb) => { if (typeof cb === 'function') cb(onlineList()); });
  const me = () => room && room.players.get(socket.id);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  const puppetOr = (p) => (p.ctrlId && room.players.get(p.ctrlId)) || p;   // 조종 중이면 꼭두각시가 행동
  socket.on('join', ({ token, brawler, mode, loadout } = {}) => {
    if (room) return;
    const modeId = MODES[mode] ? mode : 'ffa';
    const fresh = !rooms.has(modeId);
    room = getRoom(modeId);
    const bid = BRAWLERS[brawler] ? brawler : 'jungbo';
    const acc = auth.userFromToken(token);                     // 로그인 안 했으면 게스트
    const p = newPlayer(room, socket.id, acc ? acc.u.name : '게스트' + Math.floor(1000 + Math.random() * 9000), false, bid, loadout);
    if (acc) p.userKey = acc.key;
    if (room.mode.team) {
      p.team = teamCount(room, 0) <= teamCount(room, 1) ? 0 : 1;
      p.color = TEAM_COLORS[p.team];
      const bot = [...room.players.values()].find((q) => q.isBot && q.team === p.team);   // 봇 자리를 대신 차지
      if (bot) removeBot(room, bot);
    }
    room.players.set(socket.id, p);
    if (fresh && room.mode.rounds) startRound(room);
    else if (room.mode.id === 'showdown' && room.phase !== 'wait') { p.out = true; p.dead = true; p.rank = 0; }   // 진행 중이면 관전
    else resetBody(room, p, Math.floor(Math.random() * 8));
    socket.join(room.id);
    socket.emit('joined', { id: socket.id, mode: room.mode.id });
    online.set(socket.id, { name: p.name, key: p.userKey || null, status: 'game', mode: room.mode.id, brawler: bid }); onlineDirty = true;
  });
  socket.on('input', (inp) => {
    const p = me();
    if (!p || !inp || p.ctrlBy) return;
    p.input.mx = Math.max(-1, Math.min(1, +inp.mx || 0));
    p.input.my = Math.max(-1, Math.min(1, +inp.my || 0));
  });
  // 조종 중이면 공격·가젯·궁극기 모두 꼭두각시의 스킬로
  socket.on('attack', (ang) => { const p = me(); if (p && !p.ctrlBy) doAttack(room, puppetOr(p), num(ang), Date.now() / 1000); });
  socket.on('gadget', (n) => { const p = me(); if (p && !p.ctrlBy) doGadget(room, puppetOr(p), n === 2 ? 2 : 1, Date.now() / 1000); });
  socket.on('super', (ang) => { const p = me(); if (p && !p.ctrlBy) doSuper(room, puppetOr(p), num(ang), Date.now() / 1000); });
  socket.on('addBot', () => {
    if (!room || room.mode.rounds) return;         // 라운드 모드는 자동으로 채움
    const bots = [...room.players.values()].filter((p) => p.isBot).length;
    if (room.players.size >= G.maxPlayers || bots >= G.maxBots) return;
    resetBody(room, addBot(room));
  });
  socket.on('clearBots', () => {
    if (!room || room.mode.rounds) return;
    for (const p of [...room.players.values()]) if (p.isBot) removeBot(room, p);
  });
  socket.on('disconnect', () => {
    if (online.delete(socket.id)) onlineDirty = true;
    if (!room) return;
    const p = me(); if (p) { releaseCtrl(room, p, false); if (p.gems) dropGems(room, p); }
    room.players.delete(socket.id);
    if (!humans(room).length) rooms.delete(room.id);
    else if (room.mode.id === 'gem' && room.phase === 'play' && p) addBot(room, p.team) && resetBody(room, [...room.players.values()].pop());
  });
});

auth.load().then(() => server.listen(PORT, () => console.log(`정보쌤 브롤 서버 실행: http://localhost:${PORT}`)));
