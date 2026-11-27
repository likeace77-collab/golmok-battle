// 호수중 브롤 - 실시간 온라인 대전 서버 (Node + socket.io, 서버 권한 방식)
// 모드: 난투 · 쇼다운 · 젬 그랩 · 더블 가젯  (modes.js)
// 브롤러: 정보쌤 · 현실쌤  (brawlers.js)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { BRAWLERS, GEARS, AJAE, ROBOTS, publicBrawlers } = require('./brawlers');
const { MAPS, MODES, todayMap } = require('./modes');
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
const PATCH = require('./patchnotes');
app.get('/api/meta', (req, res) => res.json({ modes: MODES, maps: MAPS, gears: GEARS, patch: PATCH }));
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
// 방 이름: 'ffa' (랜덤 맵, 공용) / 'ffa@library' (맵 고정) / 'training:소켓' (혼자)
function ridFor(modeId, mapId) { return MODES[modeId].maps.includes(mapId) ? modeId + '@' + mapId : modeId; }
function parseRid(rid) {
  const [m, mp] = String(rid || '').split('#')[0].split('@');
  if (!MODES[m] || MODES[m].training) return null;
  return { modeId: m, mapId: mp && MODES[m].maps.includes(mp) ? mp : null };
}
function getRoom(modeId, rid = modeId, fixedMap = null) {
  if (!rooms.has(rid)) {
    const mode = MODES[modeId];
    const room = {
      id: rid, mode, fixedMap, map: cloneMap(fixedMap || todayMap(mode.id)),
      players: new Map(), mice: [], shards: [], gems: [], fx: [], pending: [], bullets: [], bulletSeq: 0, bigmacs: [], bmSeq: 0,
      mouseSeq: 0, botSeq: 0, colorIdx: 0, shardSeq: 0, gemSeq: 0, cubes: [], cubeSeq: 0,
      phase: mode.rounds ? 'wait' : 'play', phaseT: mode.rounds ? 4 : 0,
      mapT: mode.rotate ? 5 : 0, gemT: 0, holdT: 0, holdTeam: -1, safe: null, playT: 0, result: null,
    };
    rooms.set(rid, room);
    if (mode.training) for (const r of room.map.robots || []) addRobot(room, r);
  }
  return rooms.get(rid);
}
const humans = (room) => [...room.players.values()].filter((p) => !p.isBot);
const teamCount = (room, t) => [...room.players.values()].filter((p) => p.team === t && !p.struct).length;

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
// 두 점 사이에 벽이 있는지 (공격은 벽을 못 넘음)
function clearPath(map, x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 10);
  for (let i = 1; i < n; i++) {
    const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    if (map.walls.some((w) => !w.broken && x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h)) return false;
  }
  return true;
}
const sees = (room, p, q) => clearPath(room.map, p.x, p.y, q.x, q.y);

function freeSpot(map, x, y, r, spread) {
  for (let i = 0; i < 80; i++) {
    const nx = x + (Math.random() - 0.5) * spread * (1 + i / 20), ny = y + (Math.random() - 0.5) * spread * (1 + i / 20);
    if (!hitsWall(map, nx, ny, r + 6)) return { x: nx, y: ny };
  }
  return { x, y };
}
function spawnPoint(room, p, slot) {
  const map = room.map, r = p.B.radius;
  if (p.home) return { x: p.home.x, y: p.home.y };
  if (room.mode.training && map.spawns) return freeSpot(map, map.spawns[0].x, map.spawns[0].y, r, 160);
  if (room.mode.team && map.spawns) { const s = map.spawns[p.team]; return freeSpot(map, s.x, s.y, r, 160); }
  if (room.mode.sd && room.mode.squad && p.team != null && room.phase === 'play') {     // 듀오·트리오 부활: 살아 있는 팀원 옆
    const mate = [...room.players.values()].find((q) => q !== p && !q.struct && q.team === p.team && !q.dead && !q.out);
    if (mate) return freeSpot(map, mate.x, mate.y, r, 140);
  }
  if (room.mode.sd && slot != null) {   // 맵 가장자리를 따라 고르게 (듀오·트리오는 팀끼리 붙어서)
    const sq = room.mode.squad, n = sq ? Math.ceil(room.mode.size / sq) : room.mode.size;
    const k = sq && p.team != null ? p.team + (room.sdRot || 0) : slot;
    const a = (k / n) * Math.PI * 2;
    let x = map.w / 2 + Math.cos(a) * map.w * 0.4, y = map.h / 2 + Math.sin(a) * map.h * 0.4;
    if (sq && p.team != null) {         // 듀오·트리오: 팀원끼리 한 곳에 나란히 (옆으로 90px 간격)
      const mates = [...room.players.values()].filter((q) => !q.struct && q.team === p.team), i = Math.max(0, mates.indexOf(p));
      const off = (i - (mates.length - 1) / 2) * 90;
      x += -Math.sin(a) * off; y += Math.cos(a) * off;
      return freeSpot(map, x, y, r, 60);
    }
    return freeSpot(map, x, y, r, 120);
  }
  return freeSpot(map, map.w / 2, map.h / 2, r, Math.min(map.w, map.h) * 0.9);
}

// ── 플레이어 ───────────────────────────────────────
function cleanLoadout(B, lo = {}, mode) {
  const okG = [0, 1].filter((i) => B.gadgets[i] && !B.gadgets[i].wip);
  const g = okG.includes(lo.g) ? lo.g : okG[0];
  const sp = B.starPowers.some((s) => s.id === lo.sp && !s.wip) ? lo.sp : B.starPowers.find((s) => !s.wip).id;
  const gears = [...new Set((Array.isArray(lo.gears) ? lo.gears : []).filter((id) => GEARS.some((x) => x.id === id)))].slice(0, 2);
  return { g: mode.doubleGadget ? okG : [g], sp, gears };
}
function randomLoadout(B) {
  const gs = GEARS.map((x) => x.id).sort(() => Math.random() - 0.5);
  return { g: Math.random() < 0.5 ? 0 : 1, sp: pick(B.starPowers.filter((s) => !s.wip)).id, gears: gs.slice(0, 2) };
}
function newPlayer(room, id, name, isBot, brawlerId, loadout) {
  const B = BRAWLERS[brawlerId] || ROBOTS[brawlerId] || BRAWLERS.jungbo;
  const p = {
    id, name: (name || B.name).slice(0, 10), isBot, B, team: null, _room: room,
    color: COLORS[room.colorIdx++ % COLORS.length],
    lo: ROBOTS[B.id] ? { g: [], sp: null, gears: [] } : cleanLoadout(B, loadout || randomLoadout(B), room.mode),
    x: 0, y: 0, hp: B.maxHp, ammo: B.attack.ammo, reloadT: 0, atkCd: 0,
    stunT: 0, frozenT: 0, gCd: 0, facing: Math.PI / 2, sup: 0,
    acT: 0, acTick: 0, ctrlId: null, ctrlT: 0, ctrlBy: null,
    aw: false, fear: 0, scaredT: 0, dash: null, noAtkT: 0, flailT: 0, flailHit: null, st9: false, jailT: 0,
    nextJoke: B.jokes ? pick(B.jokes).id : null,
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
const jjang = (p) => hasSP(p, 'jjang') && p.hp >= mhp(p);     // 김준후 스파2: 풀피 버프
const SPEED_MUL = 0.85;   // 전체 이동속도 (느리게)
// 편도준처럼 폼이 있는 브롤러: p.B = 기본 + 폼 덮어쓰기
const FORM_CACHE = {};
function formB(id, f) { const k = id + ':' + f; return FORM_CACHE[k] || (FORM_CACHE[k] = { ...BRAWLERS[id], ...BRAWLERS[id].forms[f] }); }
function setForm(p, f) {
  const ratio = p.hp / mhp(p);
  p.form = f; p.B = formB(p.B.id, f);
  p.hp = Math.max(1, Math.round(ratio * mhp(p))); p.ammo = Math.min(p.ammo, p.B.attack.ammo);
}
// 정수호 구르기: 속도 게이지에 따라 이동 속도 배율 (가속 중엔 최고 속도 × boostMul)
const rollMul = (p) => { const R = p.B.roll; return p.boostT > 0 ? R.maxMul * p.B.attack.boostMul : R.minMul + (R.maxMul - R.minMul) * (p.roll || 0); };
const speedOf = (p) => (p.spinT > 0 ? p.B.super.songs[2].mul : 1) * (hasSP(p, 'notime') ? SP(p, 'notime').speedMul : 1) * (p.B.roll ? rollMul(p) : 1) * (p.spdUpT > 0 ? p.spdUpMul || 1.5 : 1) * (p.slowT > 0 ? p.slowMul || 0.6 : 1) * p.B.speed * SPEED_MUL * (has(p, 'speed') ? 1.1 : 1) * (jjang(p) ? SP(p, 'jjang').speedMul : 1) * (p.flailT > 0 ? 1.5 : 1) * (p.sprintT > 0 ? p.B.gadgets[0].mul : 1) * (p.flyT > 0 ? p.B.gadgets[0].mul : 1) * (p.isBot && !p.home && p._room ? botLv(p._room).speed : 1);
function resetBody(room, p, slot) {
  if (BRAWLERS[p.B.id] && BRAWLERS[p.B.id].forms) { p.form = 'sport'; p.B = formB(p.B.id, 'sport'); }   // 부활하면 운동폼
  const s = spawnPoint(room, p, slot);
  Object.assign(p, {
    x: s.x, y: s.y, hp: mhp(p), dead: false, ammo: p.B.attack.ammo, stunT: 0, frozenT: 0, acT: 0,
    rf: 0, gems: 0, shield: 0, fullT: 0, respawnT: 0, input: { mx: 0, my: 0 }, aw: false, dash: null, noAtkT: 0, flailT: 0, jailT: 0, teths: [], sprintT: 0, spdUpT: 0, slowT: 0, confT: 0, frictT: 0, burnT: 0, flameT: 0, spinT: 0, invT: 0, moaiT: 0, roll: 0, rollA: null, boostT: 0, mukT: 0, rhit: {}, flyT: 0, danceT: 0, gd: null, dmgUp: 0, tk: 0, lUp: 0, eyeT: 0, visT: 0, singT: 0, dPrev: null, mcombo: {},   // 쫄 게이지는 부활해도 유지
  });
  releaseCtrl(room, p, false);
}
function say(p, key, t = 1.6) { const l = p.B.lines && p.B.lines[key]; if (l) p.speech = { text: pick(l), t }; }

// ── 적/아군 판정 ───────────────────────────────────
// 조종당하는 중엔 조종하는 사람 편으로 취급
const teamOf = (room, p) => (p.ctrlBy && room.players.get(p.ctrlBy) ? room.players.get(p.ctrlBy).team : p.team);
function isEnemy(room, p, q) {
  if (!q || q.id === p.id || q.dead || q.out || q.id === p.ctrlBy) return false;
  if (q.flyT > 0 || q.gd) return false;
  if ((q.owner && (q.owner === p.id || q.owner === p.owner)) || (p.owner && p.owner === q.id)) return false;   // 내 인형                       // 지메 비행기 · 지메 세계에 간 사람은 안 맞음
  if ((room.mode.team || room.mode.squad) && q.team != null && teamOf(room, p) === teamOf(room, q) && !(hasSP(p, 'traitor') && !q.struct)) return false;   // 이수훈 스파1: 팀킬 가능
  return true;
}
const enemies = (room, p) => [...room.players.values()].filter((q) => isEnemy(room, p, q));
const canAct = (p) => !p.dead && !p.out && !p.gd && p.stunT <= 0 && p.frozenT <= 0;
const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };
function inCone(p, a, range, half, x, y, rad) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
  if (d > range + rad) return false;
  if (d < rad + p.B.radius) return true;
  return Math.abs(angDiff(Math.atan2(dy, dx), a)) <= half;
}
const SUPER_CHARGE = 0.5;     // 궁극기 충전 속도 전체 (패치: 엄청 감소)
const chargeSuper = (p, dmg) => { if (p.B.super) p.sup = Math.min(1, p.sup + dmg * SUPER_CHARGE / p.B.super.need); };

// ── 피해 / 사망 ────────────────────────────────────
function damage(room, attacker, target, dmg, now, kind) {
  if (!target || target.dead || target.out) return;
  if (attacker && attacker !== target && !isEnemy(room, attacker, target)) return;
  if (attacker && attacker !== target && domeBlocks(room, attacker, target)) { room.fx.push({ type: 'domeBlock', x: target.x, y: target.y }); return; }   // 음악쌤 결계: 상대 팀 공격 막힘
  if (attacker && attacker !== target && !target.struct && hasSP(target, 'catch')) {        // 음악쌤 스파1: 나를 때린 상대 표시
    const src = attacker.struct && attacker.owner ? room.players.get(attacker.owner) : attacker;
    if (src && !src.struct && src.id !== target.id) { target.marks = target.marks || []; if (!target.marks.includes(src.id)) target.marks.push(src.id); }
  }
  if (attacker && has(attacker, 'dmg') && attacker.hp <= mhp(attacker) * 0.5) dmg = Math.round(dmg * 1.15);
  if (attacker && attacker.cubes) dmg = Math.round(dmg * (1 + CUBE.dmg * attacker.cubes));      // 파워 큐브
  if (attacker && attacker !== target && jjang(attacker)) dmg = Math.round(dmg * SP(attacker, 'jjang').dmgMul);
  if (attacker && attacker !== target && attacker.moaiT > 0) dmg = Math.round(dmg * attacker.B.moai.dmgMul);      // 🗿 모아이: 피해 ↑
  if (attacker && attacker !== target && attacker.dmgUp > 0) dmg = Math.round(dmg * (1 + attacker.dmgUp));       // 이수훈 스파: 공격력 ↑
  if (target.moaiT > 0 && kind !== 'gas') dmg = Math.round(dmg * target.B.moai.takeMul);                         // 🗿 모아이: 받는 피해 ↓
  if (target.invT > 0) { target.invT = 0; room.fx.push({ type: 'reveal', id: target.id, x: target.x, y: target.y }); }   // 맞으면 은신 풀림
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
  if (attacker && attacker !== target && !target.struct) attacker.dealt = (attacker.dealt || 0) + dmg;   // 결과 화면용 준 피해
  target.lastHit = now; target.fullT = 0;
  room.fx.push({ type: 'dmg', x: target.x, y: target.y - 40, v: dmg, k: kind });
  if (target.hp <= 0) kill(room, attacker, target, kind);
}
function kill(room, attacker, target, kind) {
  if (target.doll) {                       // 오줌싸개 인형 부서짐
    target.hp = 0; target.dead = true; target.out = true;
    room.fx.push({ type: 'dollBreak', x: target.x, y: target.y });
    room.players.delete(target.id);
    return;
  }
  if (target.box) {                        // 쇼다운: 큐브 상자 → 파워 큐브 1개
    target.hp = 0; target.dead = true; target.out = true;
    room.fx.push({ type: 'boxBoom', x: target.x, y: target.y });
    dropCubes(room, target, 1);
    return;
  }
  if (target.struct) {                     // 하이스트: 금고가 부서짐 → 상대 팀 승리
    target.hp = 0; target.dead = true;
    room.fx.push({ type: 'safeBoom', x: target.x, y: target.y, team: target.team });
    if (room.phase === 'play') endRound(room, { type: 'team', mode: 'heist', winTeam: 1 - target.team, score: safeScore(room) });
    return;
  }
  target.hp = 0; target.dead = true; target.deaths++; target.speech = null;
  for (const o of room.players.values()) if (o.marks && o.marks.length) o.marks = o.marks.filter((id) => id !== target.id);   // 음악쌤 스파1: 죽으면 표시 끝
  target.respawnT = target.home ? 1.5 : G.respawn;
  if (attacker && attacker.id !== target.id) {
    attacker.kills++; if (Math.random() < 0.5) say(attacker, 'kill');
    if (hasSP(attacker, 'traitor') && (room.mode.team || room.mode.squad) && target.team != null && teamOf(room, attacker) === teamOf(room, target)) {   // 난 친구를 믿지 않아!
      const sp = SP(attacker, 'traitor');
      if ((attacker.tk || 0) < sp.max) { attacker.tk = (attacker.tk || 0) + 1; attacker.dmgUp = (attacker.dmgUp || 0) + sp.up; }
      heal(room, attacker, attacker, sp.heal); attacker.shield = Math.max(attacker.shield, sp.shield);
      room.fx.push({ type: 'traitor', id: attacker.id, x: attacker.x, y: attacker.y });
    } else if (hasSP(attacker, 'takel')) {                                                                    // L을 가져가: 춤 + 티배깅
      const sp = SP(attacker, 'takel');
      attacker.lUp = Math.min(sp.max, (attacker.lUp || 0) + sp.up); attacker.dmgUp = (attacker.tk || 0) * (attacker.B.starPowers[0].up || 0) + attacker.lUp;
      attacker.danceT = sp.dance;
      room.fx.push({ type: 'takeL', id: attacker.id, x: target.x, y: target.y, dur: sp.dance });
    }
    if (hasSP(attacker, 'aura')) attacker.aura = Math.min(1, (attacker.aura || 0) + SP(attacker, 'aura').perKill);   // 아우라 파밍
    if (attacker.userKey) auth.addStat(attacker.userKey, 'kills');
    // 난투·더블가젯(끝없는 방)만 처치로 트로피
    if (room.mode.rotate && trophyRoom(room) && !attacker.isBot && !target.isBot) {      // 봇(AI)을 잡거나 봇한테 죽은 건 트로피 변화 없음
      giveTrophies(attacker, 1);                                  // 처치할 때마다 +1
      const tb = btOf(target); if (room.mode.id !== 'ffa' && tb >= 100) giveTrophies(target, tb >= 500 ? -2 : -1);   // 죽으면 100 이상부터 -1, 500 이상 -2 (난투는 안 깎임)
    }
  }
  room.fx.push({ type: 'kill', a: attacker ? attacker.name : '독가스', b: target.name, aid: attacker ? attacker.id : null, bid: target.id, k: kind });
  room.mice = room.mice.filter((m) => m.owner !== target.id);
  releaseCtrl(room, target, false);
  target.acT = 0; target.rf = 0;
  if (room.mode.id === 'gem' && target.gems > 0) dropGems(room, target);
  if (room.mode.id === 'bounty' && attacker && attacker !== target && attacker.team != null) {   // 현상금: 별 가져가기
    room.stars[attacker.team] += target.bounty || 2;
    room.fx.push({ type: 'bounty', x: target.x, y: target.y, v: target.bounty || 2, team: attacker.team });
    target.bounty = room.mode.bountyStart;
    attacker.bounty = Math.min(room.mode.bountyMax, (attacker.bounty || 2) + 1);
  }
  if (room.mode.id === 'knockout') target.out = true;
  if (room.ball && room.ball.holder === target.id) dropBall(room);
  if (room.mode.sd) {
    const mateAlive = room.mode.squad && target.team != null && [...room.players.values()].some((q) => q !== target && !q.struct && q.team === target.team && !q.dead && !q.out);
    if (!mateAlive) { if (target.cubes) dropCubes(room, target, target.cubes); resetCubes(target); }   // 팀 큐브는 공유 → 팀이 전멸할 때만 떨어뜨림
    if (room.mode.squad) target.respawnT = room.mode.squadRespawn || 15;   // 듀오·트리오: 팀원이 살아 있으면 15초 뒤 부활
    sdEliminate(room);                                             // 팀(솔로는 혼자) 전멸 → 탈락 + 등수대로 트로피
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
// ── 쇼다운: 파워 큐브 · 큐브 상자 · 팀(듀오/트리오) 탈락 ──
const CUBE = { hp: 0.1, dmg: 0.1 };             // 큐브 1개당 최대 체력 +10%, 피해 +10%
const mhp = (p) => p.B.maxHp + (p.cubeHp || 0);
function resetCubes(p) { p.cubes = 0; p.cubeHp = 0; }
function addCube(p) { p.cubes = (p.cubes || 0) + 1; const add = Math.round((BRAWLERS[p.B.id] || p.B).maxHp * CUBE.hp); p.cubeHp = (p.cubeHp || 0) + add; p.hp += add; }
function dropCubes(room, p, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = n > 1 ? 20 + Math.random() * 70 : 0;
    const s = { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d };
    resolveWalls(room.map, s, 14);
    room.cubes.push({ id: ++room.cubeSeq, x: s.x, y: s.y });
  }
}
function addBoxes(room) {
  const m = room.map, n = room.mode.size + 2;
  for (let i = 0; i < n; i++) {
    const ring = i % 2 ? 0.17 : 0.31, a = (i / n) * Math.PI * 2 + (room.sdRot || 0) * 0.3;
    const s = freeSpot(m, m.w / 2 + Math.cos(a) * m.w * ring, m.h / 2 + Math.sin(a) * m.h * ring, 46, 160);
    const id = 'box' + ++room.botSeq;
    const p = newPlayer(room, id, '큐브 상자', true, 'pbox', null);
    p.struct = true; p.box = true; p.home = { x: s.x, y: s.y }; p.team = null; p.color = '#8a5a2c';
    room.players.set(id, p); resetBody(room, p);
  }
}
const sdKey = (room, p) => (room.mode.squad && p.team != null ? 't' + p.team : p.id);
function sdGroups(room) {           // 쇼다운 팀(솔로는 한 명씩) → [{ ms, alive }]
  const g = new Map();
  for (const p of room.players.values()) {
    if (p.struct) continue;
    const k = sdKey(room, p); if (!g.has(k)) g.set(k, { ms: [], alive: false, out: true });
    const G2 = g.get(k); G2.ms.push(p); if (!p.dead && !p.out) G2.alive = true; if (!p.out) G2.out = false;
  }
  return [...g.values()];
}
function sdEliminate(room) {        // 살아 있는 사람이 없는 팀 → 모두 탈락, 등수 = 남은 팀 수 + 1
  const gs = sdGroups(room), aliveN = gs.filter((x) => x.alive).length;
  for (const x of gs) {
    if (x.alive || x.out) continue;
    for (const q of x.ms) { q.out = true; q.dead = true; q.respawnT = 0; q.rank = aliveN + 1; matchTrophies(room, q, null, q.rank); }
  }
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
        if (Math.hypot(q.x - p.x, q.y - p.y) > A.range + q.B.radius || !sees(room, p, q)) continue;
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
        if (!inCone(p, a, S.range, S.half, q.x, q.y, q.B.radius) || !sees(room, p, q)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        q.x += ((q.x - p.x) / d) * S.knock; q.y += ((q.y - p.y) / d) * S.knock;
        resolveWalls(room.map, q, q.B.radius);
        q.stunT = Math.max(q.stunT, 0.2);
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
          if (!inCone(p, a, A.range, A.half, q.x, q.y, q.B.radius) || !sees(room, p, q)) continue;
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
        if (q.ctrlBy || q.ctrlId || q.struct) continue;
        const dx = q.x - p.x, dy = q.y - p.y;
        const along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
        if (along < -q.B.radius || along > S.range + q.B.radius || perp > S.width + q.B.radius || !sees(room, p, q)) continue;
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
      if (!inCone(p, a, range, A.half, q.x, q.y, q.B.radius) || !sees(room, p, q)) continue;
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
      const heal = Math.min(g.heal, mhp(p) - p.hp);
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
      else { p.dash = null; if (D.onEnd) { D.onEnd(now); return; } room.fx.push({ type: 'dashWall', id: p.id, x: p.x, y: p.y, a: +D.a.toFixed(3), kind: D.kind }); return; }   // 벽 못 넘음
    }
    p.x = nx; p.y = ny;
    if (D.pass) continue;                 // 뒷발차기: 돌진 중엔 안 부딪힘
    for (const q of enemies(room, p)) {
      if (Math.hypot(q.x - p.x, q.y - p.y) > r + q.B.radius + 8) continue;
      q.x += ca * 60; q.y += sa * 60; resolveWalls(room.map, q, q.B.radius);   // 부딪혀서 밀려남
      q.stunT = Math.max(q.stunT, D.stun);
      damage(room, p, q, D.dmg, now, D.kind);
      room.fx.push({ type: D.hitFx, id: p.id, tid: q.id, x: q.x, y: q.y, a: +D.a.toFixed(3) });
      p.dash = null; return;
    }
  }
  if (D.left <= 0) { p.dash = null; if (D.onEnd) D.onEnd(now); else room.fx.push({ type: 'tackleEnd', id: p.id, x: p.x, y: p.y }); }
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
  attack(room, p, a, now, dist = 1) {        // dist: 던진 세모가 떨어질 거리 비율 (시리우스처럼 조절)
    const A = p.B.attack, gao = hasSP(p, 'gao') ? SP(p, 'gao').atkMul : 1;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    const range = A.range * gao, ca = Math.cos(a), sa = Math.sin(a);
    const { target, end } = lineHit(room, p, a, range, A.width);
    const lr = range * dist;
    const lx = Math.max(20, Math.min(room.map.w - 20, p.x + ca * lr)), ly = Math.max(20, Math.min(room.map.h - 20, p.y + sa * lr));
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
        q.stunT = Math.max(q.stunT, 0.15);
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

SKILLS.jinho = {
  // 목 길게 뻗기: 직선 위 모든 적 1100 (벽에서 끊김)
  attack(room, p, a, now) {
    const A = p.B.attack, mul = hasSP(p, 'tall') ? SP(p, 'tall').mul : 1;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    const range = A.range * mul, ca = Math.cos(a), sa = Math.sin(a);
    if (hasSP(p, 'disc')) {               // 스파2 목디스크: 목이 휘어서 좁은 부채꼴 전체 + 벽 무시
      const half = SP(p, 'disc').half;
      p.rootT = A.delay + 0.3;
      room.fx.push({ type: 'neckBend', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), len: Math.round(range), half, d: A.delay });
      if (Math.random() < 0.35) say(p, 'atk', 1.1);
      room.pending.push({ t: A.delay, fn: () => {
        if (p.dead || !room.players.has(p.id)) return;
        const t = Date.now() / 1000;
        for (const q of enemies(room, p)) {
          if (!inCone(p, a, range, half, q.x, q.y, q.B.radius)) continue;
          damage(room, p, q, A.dmg, t, 'neck'); chargeSuper(p, A.dmg);
          room.fx.push({ type: 'neckHit', x: q.x, y: q.y });
        }
      } });
      return;
    }
    let end = range;
    for (let d = 10; d <= range; d += 10) if (!clearPath(room.map, p.x, p.y, p.x + ca * d, p.y + sa * d)) { end = d - 10; break; }
    p.rootT = A.delay + 0.18;              // 목 뻗는 동안 제자리 (목과 판정 위치가 어긋나지 않게)
    const ox = p.x, oy = p.y;
    room.fx.push({ type: 'neck', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), len: Math.round(end), d: A.delay });
    if (Math.random() < 0.35) say(p, 'atk', 1.1);
    room.pending.push({ t: A.delay, fn: () => {
      if (p.dead || !room.players.has(p.id)) return;
      const t = Date.now() / 1000;
      for (const q of enemies(room, p)) {
        const dx = q.x - ox, dy = q.y - oy, along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
        if (along < 0 || along > end + q.B.radius || perp > A.width + q.B.radius) continue;
        damage(room, p, q, A.dmg, t, 'neck'); chargeSuper(p, A.dmg);
        room.fx.push({ type: 'neckHit', x: q.x, y: q.y });
      }
    } });
  },
  gadget(room, p, idx, now) {
    if (idx === 1) {                              // 나도 이제 내가 뭔짓을 할지 몰라: 목 휘둘러 한 바퀴 (벽 무시)
      const g = p.B.gadgets[1], mul = hasSP(p, 'tall') ? SP(p, 'tall').mul : 1, r = g.range * mul, a0 = p.facing;
      say(p, 'g2', 2); p.rootT = g.dur + 0.1;
      room.fx.push({ type: 'whip', id: p.id, x: p.x, y: p.y, a: +a0.toFixed(3), r: Math.round(r), dur: g.dur });
      const ox = p.x, oy = p.y;
      for (const q of enemies(room, p)) {
        if (Math.hypot(q.x - ox, q.y - oy) > r + q.B.radius) continue;
        const da = ((Math.atan2(q.y - oy, q.x - ox) - a0) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const qid = q.id;
        later(room, g.dur * da / (Math.PI * 2), () => {
          const tq = room.players.get(qid); if (!tq || p.dead) return;
          damage(room, p, tq, g.dmg, Date.now() / 1000, 'neck'); room.fx.push({ type: 'neckHit', x: tq.x, y: tq.y });
        });
      }
      return;
    }
    const g = p.B.gadgets[0];
    say(p, 'g1', 2);
    p.flailT = g.dur; p.flailHit = new Set();
    room.fx.push({ type: 'flail', id: p.id, x: p.x, y: p.y, dur: g.dur });
  },
  // 기린 뒷발차기: 뒤돌아 조금 돌진(벽 부숨) → 뒷발로 부채꼴 2000
  super(room, p, a, now) {
    const S = p.B.super, mul = hasSP(p, 'tall') ? SP(p, 'tall').mul : 1;
    say(p, 'sup', 1.6);
    room.fx.push({ type: 'kickStart', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
    const sx = p.x, sy = p.y;              // 돌진 시작점 — 돌진하며 지나친 상대도 맞게
    p.dash = { a, left: S.dash, speed: S.dash / S.dashTime, kind: 'kick', breakWalls: true, pass: true, onEnd: (t) => {
      const kr = S.kickR * mul, ca = Math.cos(a), sa = Math.sin(a);
      for (let d = 10; d <= kr; d += 10) {           // 뒷발 닿는 곳의 벽도 부숨
        const x = p.x + ca * d, y = p.y + sa * d;
        const w = room.map.walls.find((w) => !w.broken && x > w.x - 6 && x < w.x + w.w + 6 && y > w.y - 6 && y < w.y + w.h + 6);
        if (w) { w.broken = true; room.fx.push({ type: 'wallBreak', i: room.map.walls.indexOf(w), x: w.x + w.w / 2, y: w.y + w.h / 2 }); }
      }
      const hits = [];
      const segD = (q) => {                 // 돌진 경로(시작점→끝점)와 상대 사이 거리
        const ex = p.x - sx, ey = p.y - sy, L2 = ex * ex + ey * ey || 1;
        const k = Math.max(0, Math.min(1, ((q.x - sx) * ex + (q.y - sy) * ey) / L2));
        return Math.hypot(q.x - (sx + ex * k), q.y - (sy + ey * k));
      };
      for (const q of enemies(room, p)) {
        if (!inCone(p, a, kr, S.kickHalf, q.x, q.y, q.B.radius) && segD(q) > q.B.radius + S.width) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        for (let k = 0; k < S.knock; k += 8) { const nx = q.x + dx / d * 8, ny = q.y + dy / d * 8; if (hitsWall(room.map, nx, ny, q.B.radius)) break; q.x = nx; q.y = ny; }
        q.stunT = Math.max(q.stunT, 0.25);
        damage(room, p, q, S.dmg, t, 'kick'); hits.push(q.id);
      }
      room.fx.push({ type: 'kick', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: kr, hits });
    } };
  },
};

// ── 투사체 (서현우 스테이플러 심) ──
function shoot(room, p, a, o) {
  room.bullets.push({ id: ++room.bulletSeq, owner: p.id, x: p.x + Math.cos(a) * 20, y: p.y + Math.sin(a) * 20, a, v: o.speed, left: o.range, dmg: o.dmg, kind: o.kind, onHit: o.onHit, ally: o.ally, home: o.home, turn: o.turn, wave: o.wave, amp: o.amp, lobes: o.lobes || 1, range: o.range, hitR: o.hitR, ox: p.x, oy: p.y, t: 0, lock: o.lock, tgt: o.tgt, life: o.life, pierce: o.pierce, onPierce: o.onPierce });
}
const allies = (room, p) => [...room.players.values()].filter((q) => q.id !== p.id && !q.dead && !q.out && !q.struct && (room.mode.team || room.mode.squad) && q.team != null && teamOf(room, q) === teamOf(room, p));
function heal(room, p, q, v) {
  if (!q || q.dead || q.out) return 0;
  const h = Math.min(v, mhp(q) - q.hp); if (h <= 0) return 0;
  q.hp += h; room.fx.push({ type: 'heal', x: q.x, y: q.y - 40, v: Math.round(h) });
  return h;
}
// 끝까지 쫓아갈 상대: 가장 가까운 사람 (없으면 가장 가까운 상자 등)
function lockTarget(room, owner, x, y) {
  let tg = null, bd = Infinity;
  for (const q of enemies(room, owner)) { const d = Math.hypot(q.x - x, q.y - y) + (q.struct ? 1e6 : 0); if (d < bd) { bd = d; tg = q; } }
  return tg;
}
function stepBullets(room, now) {
  for (const b of room.bullets) {
    const owner = room.players.get(b.owner);
    if (b.lock && owner) {        // 정수호 빅맥: 고른 상대를 맞을 때까지 끝까지 쫓아감 (벽도 넘고, 사거리 없음)
      let tg = b.tgt && room.players.get(b.tgt);
      if (!tg || !isEnemy(room, owner, tg)) { tg = lockTarget(room, owner, b.x, b.y); b.tgt = tg ? tg.id : null; }
      b.life -= DT;
      if (!tg || b.life <= 0) { b.left = 0; continue; }
      b.a = Math.atan2(tg.y - b.y, tg.x - b.x); b.left = 1e9;
    } else if (b.home && owner) {        // 유도탄: 가장 가까운 (보이는) 상대 쪽으로 조금씩 꺾임
      let tg = null, bd = 900;
      for (const q of enemies(room, owner)) { if (q.invT > 0) continue; const d = Math.hypot(q.x - b.x, q.y - b.y); if (d < bd) { bd = d; tg = q; } }
      if (tg) { const d = angDiff(Math.atan2(tg.y - b.y, tg.x - b.x), b.a); b.a += Math.max(-b.turn * DT, Math.min(b.turn * DT, d)); }
    }
    let move = b.v * DT;
    while (move > 0 && b.left > 0) {
      const st = Math.min(10, move); move -= st; b.left -= st;
      if (b.wave) {                // 이수훈 67!!: 지그재그로 서로 엇갈리며 (마름모 3개) 날아가다 끝에서 모임
        b.t += st; const u = Math.min(1, b.t / b.range) * b.lobes, w = b.wave * b.amp * (1 - Math.abs(2 * (u - Math.floor(u)) - 1));
        b.x = b.ox + Math.cos(b.a) * b.t - Math.sin(b.a) * w; b.y = b.oy + Math.sin(b.a) * b.t + Math.cos(b.a) * w;
      } else { b.x += Math.cos(b.a) * st; b.y += Math.sin(b.a) * st; }
      if (!b.lock && hitsWall(room.map, b.x, b.y, 3)) { b.left = 0; room.fx.push({ type: 'bulletWall', x: b.x, y: b.y }); break; }   // 벽에 막힘
      if (room.domes && room.domes.length && owner && domeCross(room, owner, b.x - Math.cos(b.a) * st, b.y - Math.sin(b.a) * st, b.x, b.y)) { b.left = 0; room.fx.push({ type: 'domeBlock', x: b.x, y: b.y }); break; }   // 음악쌤 결계에 막힘
      const q = owner && (b.lock ? [room.players.get(b.tgt)].filter((q) => q && Math.hypot(q.x - b.x, q.y - b.y) < q.B.radius + 14)[0]
        : [...enemies(room, owner), ...(b.ally ? allies(room, owner) : [])].find((q) => Math.hypot(q.x - b.x, q.y - b.y) < q.B.radius + (b.hitR || 8)));
      if (b.pierce && owner) {           // 과학쌤 숨결: 뚫고 지나가며 상대마다 1번
        for (const e of enemies(room, owner)) {
          if (b.hitSet && b.hitSet.has(e.id)) continue;
          if (Math.hypot(e.x - b.x, e.y - b.y) > e.B.radius + (b.hitR || 8)) continue;
          (b.hitSet = b.hitSet || new Set()).add(e.id);
          damage(room, owner, e, b.dmg, now, b.kind); chargeSuper(owner, b.dmg);
          room.fx.push({ type: 'bulletHit', x: e.x, y: e.y, k: b.kind });
          if (b.onPierce && !e.dead) b.onPierce(e);
        }
        continue;
      }
      if (q && b.onHit) { b.onHit(q, now); b.left = 0; break; }
      if (q) { damage(room, owner, q, b.dmg, now, b.kind); chargeSuper(owner, b.dmg); room.fx.push({ type: 'bulletHit', x: q.x, y: q.y, k: b.kind }); b.left = 0; break; }
    }
  }
  room.bullets = room.bullets.filter((b) => b.left > 0);
}

// ── 과학쌤 ──
// 가장 가까운 (보이는 건 상관없이) 상대 사람 (상자·인형 제외)
function nearestFoe(room, p, range) {
  let t = null, bd = range;
  for (const q of enemies(room, p)) { if (q.struct || q.invT > 0) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; t = q; } }
  return t;
}
// 가장 가까운 벽(맵 끝 포함) 쪽 방향과 거리
function nearestWall(room, q) {
  const m = room.map, r = q.B.radius;
  let best = { d: q.x - r, a: Math.PI }, c;
  if ((c = m.w - q.x - r) < best.d) best = { d: c, a: 0 };
  if ((c = q.y - r) < best.d) best = { d: c, a: -Math.PI / 2 };
  if ((c = m.h - q.y - r) < best.d) best = { d: c, a: Math.PI / 2 };
  for (const w of m.walls) {
    if (w.broken) continue;
    const px = Math.max(w.x, Math.min(q.x, w.x + w.w)), py = Math.max(w.y, Math.min(q.y, w.y + w.h)), d = Math.hypot(px - q.x, py - q.y) - r;
    if (d < best.d && d > -r) best = { d: Math.max(0, d), a: Math.atan2(py - q.y, px - q.x) };
  }
  return best;
}
SKILLS.science = {
  // 용가리 숨결: 엠즈처럼 천천히 퍼져 나가는 큰 숨결 — 지나가는 상대마다 1번씩 1300
  attack(room, p, a, now) {
    const A = p.B.attack, fast = hasSP(p, 'notime') ? SP(p, 'notime').breathMul : 1;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    // 엠즈처럼: 부채꼴 연기 구름이 앞으로 퍼져 나가며 닿는 상대마다 1번 (벽 뒤는 안 맞음)
    const ox = p.x, oy = p.y, dur = A.range / (A.speed * fast), hit = new Set(), N = 8;
    for (let i = 1; i <= N; i++) later(room, dur * i / N, () => {
      if (!room.players.has(p.id) || p.dead) return;
      const r = A.range * i / N;
      for (const q of enemies(room, p)) {
        if (hit.has(q.id)) continue;
        const d = Math.hypot(q.x - ox, q.y - oy);
        if (d > r + q.B.radius) continue;
        if (d > q.B.radius && Math.abs(angDiff(Math.atan2(q.y - oy, q.x - ox), a)) > A.half + Math.atan2(q.B.radius, d)) continue;
        if (!clearPath(room.map, ox, oy, q.x, q.y)) continue;
        hit.add(q.id);
        damage(room, p, q, A.dmg, now, 'breath'); chargeSuper(p, A.dmg);
        room.fx.push({ type: 'bulletHit', x: q.x, y: q.y, k: 'breath' });
        if (!q.dead && hasSP(p, 'sleep') && !q.struct && Math.random() < SP(p, 'sleep').chance) { q.confT = SP(p, 'sleep').dur; room.fx.push({ type: 'sleepy', id: q.id, x: q.x, y: q.y }); }
      }
    });
    room.fx.push({ type: 'breath', id: p.id, x: ox, y: oy, a: +a.toFixed(3), r: A.range, h: A.half, d: +dur.toFixed(2) });
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now) {
    const g = p.B.gadgets[idx];
    if (idx === 0) {                       // 오줌싸개 인형 (한 번에 1개)
      for (const q of [...room.players.values()]) if (q.doll && q.owner === p.id) room.players.delete(q.id);
      const s0 = { x: p.x + Math.cos(p.facing) * 60, y: p.y + Math.sin(p.facing) * 60 }; resolveWalls(room.map, s0, 30);
      const id = 'doll' + ++room.botSeq, d = newPlayer(room, id, '오줌싸개 인형', true, 'doll', p.team);
      Object.assign(d, { struct: true, doll: true, owner: p.id, home: { x: s0.x, y: s0.y }, color: p.color, team: p.team, peeT: 0 });
      room.players.set(id, d); resetBody(room, d); d.hp = g.hp;
      room.fx.push({ type: 'dollDrop', id, x: s0.x, y: s0.y });
      say(p, 'g1', 1.6);
    } else {                               // 마찰력 체험: 가까운 상대를 벽으로 밀고 4초 동안 벽 쪽으로만 걷게
      const q = nearestFoe(room, p, g.range);
      if (!q) { p.gCd = 0.5; return; }
      const W = nearestWall(room, q);
      say(p, 'g2', 1.6);
      room.fx.push({ type: 'friction', id: p.id, tid: q.id, x: q.x, y: q.y, a: +W.a.toFixed(3) });
      const start = () => { q.frictT = g.dur; q.frictA = W.a; };
      if (W.d > 4) { q.dash = { a: W.a, left: W.d + 10, speed: 1600, kind: 'push', pass: true, onEnd: start }; } else start();
    }
  },
  // 보아노래방: 고른 노래 (c = 0 중력 / 1 불타오르네 / 2 자전)
  super(room, p, a, now, c) {
    const S = p.B.super, k = [0, 1, 2].includes(c) ? c : 0, song = S.songs[k];
    room.fx.push({ type: 'boa', id: p.id, x: p.x, y: p.y, k });
    say(p, 'sup', 2);
    if (k === 0) {
      const q = nearestFoe(room, p, song.range);
      if (!q) { p.sup = 1; room.fx.push({ type: 'boaMiss', id: p.id, x: p.x, y: p.y }); return; }    // 맞힐 상대 없으면 궁 안 씀
      damage(room, p, q, song.dmg, now, 'gravity');
      if (!q.dead) { q.stunT = Math.max(q.stunT, song.stun); q.slowT = Math.max(q.slowT || 0, song.stun + song.slowDur); q.slowMul = song.slowMul; q.dash = null; }
      room.fx.push({ type: 'gravity', id: p.id, tid: q.id, x: q.x, y: q.y });
    } else if (k === 1) {
      p.flameT = song.dur; p.flameAcc = song.every;          // 첫 불길은 바로
    } else {
      p.spinT = song.dur; p.spinHit = {};
    }
  },
};
SKILLS.hyeonwoo = {
  // 스테이플러 심: 부채꼴로 5발 (가젯1 뒤엔 9발, 스파2 탄창 꽉 찼을 땐 6발)
  attack(room, p, a, now) {
    const A = p.B.attack;
    const full = p.ammo >= A.ammo - 0.01;        // 쏘기 전 탄창 3칸이 다 차 있었나
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    let n = A.count;
    if (hasSP(p, 'fullsix') && full) n = SP(p, 'fullsix').count;
    if (p.st9) { n = p.B.gadgets[0].count; p.st9 = false; }
    const spread = A.half * 2 * (n > 5 ? 1.25 : 1);
    for (let i = 0; i < n; i++) shoot(room, p, a - spread / 2 + spread * (n === 1 ? 0.5 : i / (n - 1)), { speed: A.bulletSpeed, range: A.range, dmg: A.dmg, kind: 'staple' });
    room.fx.push({ type: 'spit', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), n });
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now) {
    if (idx === 0) {                 // 스테이플러 심 먹기: 궁 가득 + 다음 공격 9발
      say(p, 'g1', 1.6); p.sup = 1; p.st9 = true;
      room.fx.push({ type: 'eatStaple', id: p.id, x: p.x, y: p.y });
    } else {                         // 종이 먹기: 1500 회복
      say(p, 'g2', 1.6);
      const heal = Math.min(p.B.gadgets[1].heal, mhp(p) - p.hp); p.hp += heal;
      room.fx.push({ type: 'eatPaper', id: p.id, x: p.x, y: p.y, v: Math.round(heal) });
    }
  },
  // 아재개그: 조준한 쪽 상대에게 랜덤 개그 (미리 정해둔 nextJoke 사용 → 스파1이면 미리 보임)
  super(room, p, a, now) {
    const S = p.B.super, joke = p.B.jokes.find((j) => j.id === p.nextJoke) || p.B.jokes[0];
    p.nextJoke = pick(p.B.jokes).id;
    const ca = Math.cos(a), sa = Math.sin(a);
    let target = null, best = Infinity;
    for (const q of enemies(room, p)) {
      const dx = q.x - p.x, dy = q.y - p.y, along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
      if (along < -q.B.radius || along > S.range + q.B.radius || perp > S.width + q.B.radius) continue;
      if (along + perp < best) { best = along + perp; target = q; }
    }
    p.speech = { text: joke.q, t: 2.2 };
    room.fx.push({ type: 'joke', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), joke: joke.id, q: joke.q, ans: joke.a, tid: target ? target.id : null });
    if (!target) { later(room, 1.2, () => { p.speech = { text: '…썰렁하네', t: 1.5 }; }); return; }
    const tid = target.id;
    const T = () => { const q = room.players.get(tid); return q && !q.dead && !q.out ? q : null; };
    if (joke.id === 'piano') {        // 무조건 맞는 피아노 (따라감)
      later(room, S.piano.fall, () => { const q = T(); if (!q) return; damage(room, p, q, S.piano.dmg, Date.now() / 1000, 'piano'); q.stunT = Math.max(q.stunT, 0.2); room.fx.push({ type: 'pianoHit', tid, x: q.x, y: q.y }); });
    } else if (joke.id === 'pushpull') {   // 밀었다가 → 끌어오기
      const q = target, dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
      for (let k = 0; k < S.pushpull.push; k += 8) { const nx = q.x + dx / d * 8, ny = q.y + dy / d * 8; if (hitsWall(room.map, nx, ny, q.B.radius)) break; q.x = nx; q.y = ny; }
      q.stunT = Math.max(q.stunT, S.pushpull.wait + 0.3);
      damage(room, p, q, S.pushpull.pushDmg, now, 'push');
      room.fx.push({ type: 'push', id: p.id, tid, x: q.x, y: q.y });
      later(room, S.pushpull.wait, () => {
        const q = T(); if (!q || p.dead) return;
        const ddx = q.x - p.x, ddy = q.y - p.y, dd = Math.hypot(ddx, ddy) || 1, keep = p.B.radius + q.B.radius + 10;
        const steps = Math.max(0, (dd - keep) / 8);
        for (let k = 0; k < steps; k++) { const nx = q.x - ddx / dd * 8, ny = q.y - ddy / dd * 8; if (hitsWall(room.map, nx, ny, q.B.radius)) break; q.x = nx; q.y = ny; }
        damage(room, p, q, S.pushpull.pullDmg, Date.now() / 1000, 'pull');
        room.fx.push({ type: 'pull', id: p.id, tid, x: q.x, y: q.y });
      });
    } else {                          // 참기름 감옥: 3초 갇힘 (맞을 수는 있음)
      target.jailT = S.jail.dur; target.stunT = Math.max(target.stunT, S.jail.dur);
      room.fx.push({ type: 'jail', id: p.id, tid, x: target.x, y: target.y });
    }
  },
};
const later = (room, t, fn) => room.pending.push({ t, fn });

// ── 음악쌤: 무에타이 성악 / 눈 뜬거야 안 뜬거야 / 1176 / 쉿 결계 ──
// 결계 안팎: 상대 팀(결계 주인 팀이 아닌 사람)만 막힘
const domeFoe = (room, d, q) => q.id !== d.owner && q.owner !== d.owner && !((room.mode.team || room.mode.squad) && q.team != null && d.team != null && teamOf(room, q) === d.team);
const inDome = (d, x, y) => Math.hypot(x - d.x, y - d.y) < d.r;
function domeBlocks(room, a, t) {        // a의 공격이 t에게 가는 길이 결계 벽을 넘나?
  if (!room.domes || !room.domes.length) return false;
  const src = a.struct && a.owner ? room.players.get(a.owner) || a : a;
  for (const d of room.domes) if (domeFoe(room, d, src) && inDome(d, a.x, a.y) !== inDome(d, t.x, t.y)) return true;
  return false;
}
function domeCross(room, owner, x0, y0, x1, y1) {
  for (const d of room.domes) if (domeFoe(room, d, owner) && inDome(d, x0, y0) !== inDome(d, x1, y1)) return true;
  return false;
}
function domeStep(room) {
  if (!room.domes || !room.domes.length) { for (const q of room.players.values()) q.dPrev = null; return; }
  for (const d of room.domes) d.t -= DT;
  room.domes = room.domes.filter((d) => d.t > 0);
  for (const q of room.players.values()) {
    if (q.dead || q.out || q.struct) { q.dPrev = null; continue; }
    const pv = q.dPrev || { x: q.x, y: q.y }, rad = q.B.radius;
    for (const d of room.domes) {
      if (!domeFoe(room, d, q)) continue;
      const was = inDome(d, pv.x, pv.y), dx = q.x - d.x, dy = q.y - d.y, dd = Math.hypot(dx, dy) || 1;
      if (!was && dd < d.r + rad) { q.x = d.x + dx / dd * (d.r + rad); q.y = d.y + dy / dd * (d.r + rad); q.dash = q.dash && q.dash.kind === 'push' ? q.dash : null; }   // 못 들어옴
      else if (was && dd > d.r - rad) { q.x = d.x + dx / dd * (d.r - rad); q.y = d.y + dy / dd * (d.r - rad); q.dash = null; }                                         // 못 나감
    }
    q.dPrev = { x: q.x, y: q.y };
  }
}
SKILLS.music = {
  attack(room, p, a, now) {
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    room.fx.push({ type: 'muayGo', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
    const hit = () => {
      if (p.dead || !room.players.has(p.id)) return;
      const t = Date.now() / 1000, ca = Math.cos(a), sa = Math.sin(a);
      for (const q of enemies(room, p)) {
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy), along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca), r = q.B.radius;
        const kick = along > A.kickFrom - r && along < A.kickTo + r && perp < A.kickW + r;      // 부채꼴 가운데 네모: 발차기 + 성악
        const voice = kick || (d < A.range + r && (d < r || Math.abs(angDiff(Math.atan2(dy, dx), a)) < A.half + Math.atan2(r, d)));   // 부채꼴: 성악
        if (!voice || !sees(room, p, q)) continue;
        let dmg = A.dmg + (kick ? A.kickDmg : 0);
        if (hasSP(p, 'combo')) { const S = SP(p, 'combo'); if (t - (p.mcombo[q.id] || -99) <= S.win) dmg = Math.round(dmg * S.mul); p.mcombo[q.id] = t; }
        damage(room, p, q, dmg, t, kick ? 'muay' : 'voice'); chargeSuper(p, dmg);
        room.fx.push({ type: 'bulletHit', x: q.x, y: q.y, k: kick ? 'muay' : 'voice' });
      }
      room.fx.push({ type: 'muay', id: p.id, x: Math.round(p.x), y: Math.round(p.y), a: +a.toFixed(3), r: A.range, h: A.half, kf: A.kickFrom, kt: A.kickTo, kw: A.kickW });
    };
    p.dash = { a, left: A.lunge, speed: A.lunge / 0.13, kind: 'lunge', pass: true, onEnd: hit };   // 앞으로 돌진한 뒤
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now) {
    const g = p.B.gadgets[idx];
    if (idx === 0) {                       // 눈 뜬거야 안 뜬거야
      const blind = [], buff = [p.id];
      p.visT = g.visDur;
      for (const q of allies(room, p)) if (Math.hypot(q.x - p.x, q.y - p.y) < g.range) { q.visT = g.visDur; buff.push(q.id); }
      for (const q of enemies(room, p)) if (!q.struct && Math.hypot(q.x - p.x, q.y - p.y) < g.range) { q.eyeT = g.blind; blind.push(q.id); }
      room.fx.push({ type: 'eyes', id: p.id, x: p.x, y: p.y, r: g.range, hits: blind, buff });
      say(p, 'g1', 1.6);
    } else {                               // 1176 노래: 주변에 상대가 있어야 씀
      const near = () => { let t = null, bd = g.range; for (const q of enemies(room, p)) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd + q.B.radius && sees(room, p, q)) { bd = d; t = q; } } return t; };
      if (!near()) { p.gCd = 0.5; room.fx.push({ type: 'noFoe', id: p.id, x: p.x, y: p.y }); return; }
      say(p, 'g2', 1.6);
      let t = 0, i = 0;
      room.fx.push({ type: 'singStart', id: p.id, x: p.x, y: p.y });     // 노래 소리 파일은 클라가 이때 틂 (박자 똑같음)
      g.song.forEach((grp, gi) => {
        const notes = grp.match(/\d'?/g), durs = { 4: [0.5, 0.5, 0.5, 0.5], 3: [0.5, 0.5, 1], 2: [1, 1] }[notes.length] || notes.map(() => 0.5);
        notes.forEach((n, ni) => {
          const v = +n[0], hi = n.length > 1, k = i++, len = durs[ni] * g.beat;
          later(room, t, () => {
            if (p.dead || !room.players.has(p.id)) return;
            const q = near();
            room.fx.push({ type: 'note', id: p.id, x: p.x, y: p.y, n: v, hi: hi ? 1 : 0, k, d: +len.toFixed(2), tid: q ? q.id : null, tx: q ? Math.round(q.x) : 0, ty: q ? Math.round(q.y) : 0 });
            if (q) damage(room, p, q, v * g.per, Date.now() / 1000, 'note');
          });
          t += len;
        });
      });
      p.singT = t + g.beat;                            // 마지막 음 한 박 더 끌기
    }
  },
  super(room, p, a, now) {               // 쉿: 주변 상대 밀쳐내고 5초 결계
    const S = p.B.super, d = { id: ++room.botSeq, x: p.x, y: p.y, r: S.range, t: S.dur, owner: p.id, team: (room.mode.team || room.mode.squad) && p.team != null ? teamOf(room, p) : null };
    room.domes = room.domes || [];
    room.domes.push(d);
    for (const q of room.players.values()) {
      if (q.dead || q.out || q.struct || !domeFoe(room, d, q) || q.flyT > 0 || q.gd) continue;
      const dx = q.x - d.x, dy = q.y - d.y, dd = Math.hypot(dx, dy);
      if (dd >= d.r + q.B.radius) { q.dPrev = { x: q.x, y: q.y }; continue; }
      const ang = dd > 1 ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
      q.x = d.x + Math.cos(ang) * (d.r + q.B.radius + 6); q.y = d.y + Math.sin(ang) * (d.r + q.B.radius + 6);   // 결계 밖으로 휙
      resolveWalls(room.map, q, q.B.radius);
      if (Math.hypot(q.x - d.x, q.y - d.y) < d.r + q.B.radius) {           // 벽에 걸려 다시 안쪽이면 다른 방향으로
        for (let k = 1; k < 16; k++) { const b = ang + k * Math.PI / 8; const o = { x: d.x + Math.cos(b) * (d.r + q.B.radius + 6), y: d.y + Math.sin(b) * (d.r + q.B.radius + 6) }; if (!hitsWall(room.map, o.x, o.y, q.B.radius)) { q.x = o.x; q.y = o.y; break; } }
      }
      q.dash = null; q.stunT = Math.max(q.stunT, 0.2); q.dPrev = { x: q.x, y: q.y };
      room.fx.push({ type: 'shush', id: p.id, tid: q.id, x: q.x, y: q.y });
    }
    room.fx.push({ type: 'dome', id: p.id, x: d.x, y: d.y, r: d.r });
    say(p, 'sup', 2);
  },
};

// ── 이수훈: 67!! / 지메하세요 / 지메 비행기 / 블록 ──
SKILLS.suhun = {
  attack(room, p, a, now, dist = 1) {   // 6과 7 두 발: 지그재그로 엇갈리다 조준한 거리에서 만남 (나니처럼 거리 조절)
    const A = p.B.attack, range = Math.max(120, A.range * dist);
    if (p.flyT > 0) return;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    const hitBy = new Set();         // 한 번 쏜 6·7 둘 다 같은 상대에 맞으면 합계 1400
    [1, -1].forEach((w, i) => shoot(room, p, a, { speed: A.bulletSpeed, range, dmg: A.dmg, hitR: 16, kind: i ? 'n7' : 'n6', wave: w, amp: A.amp, lobes: A.lobes, onHit: (q, t) => {
      const v = hitBy.has(q.id) ? A.bothDmg - A.dmg : A.dmg; hitBy.add(q.id);
      damage(room, p, q, v, t, 'n67'); chargeSuper(p, v);
      room.fx.push({ type: 'bulletHit', x: q.x, y: q.y, k: 'n67' });
      if (v !== A.dmg) room.fx.push({ type: 'both67', x: q.x, y: q.y });
    } }));
    room.fx.push({ type: 'throw67', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now, aim = {}) {
    const g = p.B.gadgets[idx];
    if (idx === 0) {                 // 지메 비행기: 최대 4초 무적 비행 (블록 2칸 높이까지 넘음) → 내리면 추락
      say(p, 'g1', 1.4); p.flyT = g.dur;
      room.fx.push({ type: 'gdShip', id: p.id, x: p.x, y: p.y, dur: g.dur });
    } else placeBlocks(room, p, g, aim);
  },
  super(room, p, a, now) {           // 지메하세요: 첫 번째 상대와 지메 1:1 — 먼저 탈락하면 쓰러짐
    const S = p.B.super;
    const { target, end } = lineHit(room, p, a, S.range, S.width);
    room.fx.push({ type: 'gdCall', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), len: Math.round(target ? Math.hypot(target.x - p.x, target.y - p.y) : end), hit: !!target });
    say(p, 'sup', 1.6);
    if (!target || target.struct) return;
    startGD(room, p, target, now);
  },
};
// 지메 비행기 추락: 뛰어내린 자리 근처 상대에게 피해 + 밀치기
function planeCrash(room, p) {
  const g = p.B.gadgets[0], cx = p.x + Math.cos(p.facing) * 50, cy = p.y + Math.sin(p.facing) * 50, now = Date.now() / 1000;
  p.flyT = 0;
  if (hitsWall(room.map, p.x, p.y, p.B.radius)) { const f = freeSpot(room.map, p.x, p.y, p.B.radius, 80); p.x = f.x; p.y = f.y; }
  for (const q of enemies(room, p)) {
    const dx = q.x - cx, dy = q.y - cy, d = Math.hypot(dx, dy);
    if (d > g.crashR + q.B.radius) continue;
    damage(room, p, q, g.crashDmg, now, 'crash');
    if (!q.struct && !q.dead) { const ux = dx / (d || 1), uy = dy / (d || 1); for (let k = 0; k < g.knock; k += 10) { const nx = q.x + ux * 10, ny = q.y + uy * 10; if (hitsWall(room.map, nx, ny, q.B.radius)) break; q.x = nx; q.y = ny; } }
  }
  room.fx.push({ type: 'planeCrash', id: p.id, x: cx, y: cy, r: g.crashR });
}
// 블록 2칸: 고른 위치에 (격자에 맞춰) 세움. 같은 칸에 또 놓으면 위로 쌓임, 맵 벽 위에 놓으면 3칸 높이. 판 끝날 때까지 유지
function placeBlocks(room, p, g, aim) {
  say(p, 'g2', 1.4);
  const a = Number.isFinite(aim.a) ? aim.a : p.facing, dd = Number.isFinite(aim.d) ? Math.max(0.15, Math.min(1, aim.d)) : 0.35;
  const tx = p.x + Math.cos(a) * g.range * dd, ty = p.y + Math.sin(a) * g.range * dd, S2 = g.size;
  const horiz = Math.abs(Math.cos(a)) < Math.abs(Math.sin(a));        // 조준 방향에 가로로 (격자라 가로/세로 중 하나)
  // 맵 끝 외벽은 무시: 외벽에 겹쳐서도 깔 수 있음 (맵 밖으로 완전히 나가는 칸만 빼고)
  const maxGX = Math.ceil(room.map.w / S2) - (horiz ? g.n - 1 : 0), maxGY = Math.ceil(room.map.h / S2) - (horiz ? 0 : g.n - 1);
  const gx0 = Math.max(0, Math.min(maxGX, Math.round(tx / S2 - (horiz ? 0.5 : 0)))), gy0 = Math.max(0, Math.min(maxGY, Math.round(ty / S2 - (horiz ? 0 : 0.5))));
  const outer = (w) => w.x <= 1 || w.y <= 1 || w.x + w.w >= room.map.w - 1 || w.y + w.h >= room.map.h - 1;   // 맵 가장자리 외벽
  for (let i = 0; i < g.n; i++) {
    const gx = gx0 + (horiz ? i : 0), gy = gy0 + (horiz ? 0 : i), x = gx * S2 - S2 / 2, y = gy * S2 - S2 / 2;
    if (x + S2 <= 0 || y + S2 <= 0 || x >= room.map.w || y >= room.map.h) continue;
    const ex = room.map.walls.find((w) => w.temp && !w.broken && w.gx === gx && w.gy === gy);
    if (ex) { ex.stack = Math.min(g.max, ex.stack + 1); continue; }
    const onWall = room.map.walls.some((w) => !w.temp && !w.broken && !outer(w) && x + S2 / 2 > w.x && x + S2 / 2 < w.x + w.w && y + S2 / 2 > w.y && y + S2 / 2 < w.y + w.h);
    room.map.walls.push({ x, y, w: S2, h: S2, temp: true, gx, gy, stack: onWall ? 3 : 1, owner: p.id, base: onWall ? 1 : 0 });
  }
  const mine = room.map.walls.filter((w) => w.temp && !w.broken && w.owner === p.id);      // 너무 많으면 오래된 것부터 사라짐
  for (let i = 0; i < mine.length - g.cap; i++) { mine[i].broken = true; room.fx.push({ type: 'wallBreak', i: room.map.walls.indexOf(mine[i]), x: mine[i].x + S2 / 2, y: mine[i].y + S2 / 2, temp: true }); }
  for (const q of room.players.values()) if (!(q.flyT > 0)) resolveWalls(room.map, q, q.B.radius);   // 블록에 끼인 사람은 밀어냄
  room.fx.push({ type: 'blocks', id: p.id, x: tx, y: ty });
}
// 지메 비행기가 못 넘는 벽 = 블록이 3칸 이상 쌓인 곳
const flyMap = (map) => ({ w: map.w, h: map.h, walls: map.walls.filter((w) => w.temp && !w.broken && w.stack >= 3) });
// 지메 세계: 둘 다 현실에서 사라짐(안 맞음·못 움직임) → 각자 화면에서 지오메트리 대쉬 → 먼저 탈락한 쪽이 쓰러짐
function startGD(room, a, b, now) {
  const S = a.B.super, id = (room.gdSeq = (room.gdSeq || 0) + 1), seed = Math.floor(Math.random() * 1e9);
  room.gds = room.gds || {};
  const g = room.gds[id] = { id, a: a.id, b: b.id, seed, t0: now, crash: {}, botT: {} };
  for (const q of [a, b]) {
    q.gd = id; q.input = { mx: 0, my: 0 }; q.dash = null; releaseCtrl(room, q, false);
    if (q.isBot) {                   // 봇: 트로피 따라 잘하는 정도가 다름 (쉬운 봇은 금방 탈락)
      const d = q.home ? 0.3 : botLv(room).d;
      g.botT[q.id] = 2 + Math.random() * (4 + 26 * d);     // 무승부 없음: 봇도 결국 탈락
    } else io.to(q.id).emit('gdStart', { id, seed, opp: (q === a ? b : a).name, caller: a.name, me: q === a ? 'a' : 'b' });
  }
  room.fx.push({ type: 'gdIn', ids: [a.id, b.id], x: a.x, y: a.y, x2: b.x, y2: b.y });
}
function stepGD(room, now) {
  if (!room.gds) return;
  for (const g of Object.values(room.gds)) {
    const el = now - g.t0, A = room.players.get(g.a), B = room.players.get(g.b);
    const cOf = (id, q) => {                                     // 탈락한 시각 (아직이면 null)
      if (!q) return 0;                                          // 나가 버림 = 탈락
      if (g.botT[id] != null) return el >= g.botT[id] ? g.botT[id] : null;
      return g.crash[id] != null ? g.crash[id] : null;
    };
    const ca = cOf(g.a, A), cb = cOf(g.b, B);
    let loser = null, done = false;
    if (ca != null && cb != null) { loser = ca <= cb ? A : B; done = true; }
    else if (ca != null && el > ca + 1.5) { loser = A; done = true; }      // 상대는 아직 살아 있음
    else if (cb != null && el > cb + 1.5) { loser = B; done = true; }
    else if (el > 150) { loser = Math.random() < 0.5 ? A : B; done = true; }   // (안전장치) 2분 반 넘게 아무도 안 죽으면 랜덤 — 코스가 점점 빨라져서 사실상 안 옴
    if (!done) continue;
    delete room.gds[g.id];
    const winner = loser === A ? B : loser === B ? A : null;
    for (const q of [A, B]) if (q) { q.gd = null; if (!q.isBot) io.to(q.id).emit('gdEnd', { win: q === winner, draw: !loser }); }
    room.fx.push({ type: 'gdOut', ids: [g.a, g.b], loser: loser ? loser.id : null, winName: winner ? winner.name : null, loseName: loser ? loser.name : null, x: (loser || A || B || { x: 0 }).x, y: (loser || A || B || { y: 0 }).y });
    if (loser && !loser.dead && room.players.has(loser.id)) { loser.hp = 0; kill(room, winner || null, loser, 'gd'); }
  }
}
// ── 정수호: 굴러다니며 깔아뭉개기 (볼트 컨셉) ──
SKILLS.suho = {
  attack(room, p, a, now) {          // 순간 가속: 탄 1개 → 1초 동안 최고 속도 + 깔아뭉개기 2배
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd;
    p.boostT = A.boost; p.roll = 1;
    if (p.rollA == null) p.rollA = p.facing;
    room.fx.push({ type: 'boost', id: p.id, x: p.x, y: p.y, a: +p.rollA.toFixed(3) });
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now) {
    const g = p.B.gadgets[idx];
    if (idx === 0) {                 // 빅@맥 발사!: 유도탄
      say(p, 'g1', 1.4);
      const tg = lockTarget(room, p, p.x, p.y);
      shoot(room, p, tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : p.facing, { speed: g.speed, range: g.range, dmg: g.dmg, kind: 'bigmac', lock: true, tgt: tg ? tg.id : null, life: 15 });
      room.fx.push({ type: 'bigmacShot', id: p.id, x: p.x, y: p.y });
    } else {                         // 빅맥먹방: 점점 닳는 보호막
      say(p, 'g2', 1.4);
      p.shield = Math.max(p.shield, g.shield); p.mukT = g.dur;
      room.fx.push({ type: 'mukbang', id: p.id, x: p.x, y: p.y });
    }
  },
  super(room, p, a, now) {           // 수학 블래스터: 공식 6개 부채꼴, 맞추면 준 피해의 50% 회복
    const S = p.B.super;
    say(p, 'sup', 1.6);
    for (let i = 0; i < S.count; i++) {
      const ang = a - S.half + 2 * S.half * (i / (S.count - 1));
      shoot(room, p, ang, { speed: S.speed, range: S.range, dmg: S.dmg, kind: 'math', onHit: (q, t) => {
        const before = q.hp + (q.shield || 0);
        damage(room, p, q, S.dmg, t, 'math');
        const dealt = Math.max(0, before - Math.max(0, q.hp) - (q.shield || 0));
        if (dealt > 0 && !p.dead) heal(room, p, p, dealt * S.lifesteal);
        room.fx.push({ type: 'bulletHit', x: q.x, y: q.y, k: 'math' });
      } });
    }
    room.fx.push({ type: 'mathBlast', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
  },
};
// 구르기 이동 (step에서 호출): 방향은 천천히 꺾이고(빠를수록 더 둔함), 오래 구를수록 빨라짐
function rollMove(room, p, mx, my, len, now) {
  const R = p.B.roll;
  let want = len > 0.1;
  let ta = want ? Math.atan2(my, mx) : p.rollA;
  if (!want && p.boostT > 0 && p.rollA != null) want = true;          // 가속 중엔 손 떼도 계속 굴러감
  if (!want) { p.roll = Math.max(0, p.roll - DT * R.stopLose); return; }
  if (p.rollA == null) p.rollA = ta;
  const d = angDiff(ta, p.rollA);
  const rr = hasSP(p, 'rollroll');
  const turn = (R.turnFast + (R.turnSlow - R.turnFast) * p.roll) * (rr ? R.spTurn : 1) * DT;   // 빠를수록 방향 전환 둔함 (스파2는 더 잘 꺾임)
  const tw = Math.max(-turn, Math.min(turn, d));
  p.rollA = angDiff(p.rollA + tw, 0);
  p.facing = p.rollA;
  if (p.boostT <= 0) {               // 꺾는 만큼 조금 감속, 확 꺾으면(급커브·유턴) 많이 감속. 스파2는 감속이 훨씬 적음
    let lose = Math.abs(tw) * R.turnLose * p.roll;
    if (Math.abs(d) > R.sharp) lose += DT * R.sharpLose * (Math.abs(d) - R.sharp) * p.roll;
    if (rr) lose *= R.spLoseMul;
    p.roll = Math.max(0, p.roll - lose);
  }
  if (Math.abs(d) <= R.sharp || p.boostT > 0) p.roll = Math.min(1, p.roll + DT / R.fill);   // 급커브 중엔 가속 안 됨
  const v = speedOf(p) * DT, vx = Math.cos(p.rollA) * v, vy = Math.sin(p.rollA) * v;
  const x0 = p.x, y0 = p.y;
  p.x += vx; p.y += vy;
  resolveWalls(room.map, p, p.B.radius);
  const moved = ((p.x - x0) * vx + (p.y - y0) * vy) / (v * v || 1);
  if (moved < 0.5) {                  // 벽에 쿵 → 속도 확 줄어듦
    if (p.roll > 0.4) room.fx.push({ type: 'rollBump', x: p.x, y: p.y });
    p.roll *= rr ? R.spWallKeep : R.wallKeep; p.boostT = 0;
  }
  if (p.B.super && p.sup < 1) p.sup = Math.min(1, p.sup + DT * p.roll / R.supFull);   // 구르는 동안 궁 충전
}
// 부딪힌 상대 깔아뭉개기
function rollHits(room, p, now) {
  const A = p.B.attack; p.rhit ||= {};
  if ((p.roll < 0.08 && p.boostT <= 0) || p.scaredT > 0 || p.noAtkT > 0 || (room.ball && room.ball.holder === p.id)) return;
  for (const q of enemies(room, p)) {
    if (Math.hypot(q.x - p.x, q.y - p.y) > p.B.radius + q.B.radius + 8 || (p.rhit[q.id] || 0) > now) continue;
    const boost = p.boostT > 0;
    const dmg = Math.round((A.minDmg + (A.maxDmg - A.minDmg) * p.roll) * (boost ? 2 : 1));
    p.rhit[q.id] = now + A.hitCd;
    damage(room, p, q, dmg, now, 'crush'); chargeSuper(p, dmg);
    if (!q.struct && !q.dead) {        // 살짝 튕겨냄
      const nx = q.x + Math.cos(p.rollA) * A.push, ny = q.y + Math.sin(p.rollA) * A.push;
      if (!hitsWall(room.map, nx, ny, q.B.radius)) { q.x = nx; q.y = ny; }
    }
    room.fx.push({ type: 'crush', id: p.id, tid: q.id, x: q.x, y: q.y, big: boost || p.roll > 0.9 });
    if (!boost) p.roll *= p.B.roll.hitKeep;
  }
}

// ── 편도준: 운동폼 / 미술폼 ──
const moaiOn = (room, p, dur) => { p.moaiT = Math.max(p.moaiT || 0, dur); room.fx.push({ type: 'moai', id: p.id, x: p.x, y: p.y, dur }); };
function slowHit(p, q) { if (hasSP(p, 'slowhit')) { const sp = SP(p, 'slowhit'); q.slowT = Math.max(q.slowT || 0, sp.dur); q.slowMul = sp.mul; } }
SKILLS.dojun = {
  attack(room, p, a, now, dist = 1) {
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    if (p.invT > 0) { p.invT = 0; room.fx.push({ type: 'reveal', id: p.id, x: p.x, y: p.y }); }    // 공격하면 은신 풀림
    if (Math.random() < 0.3) say(p, p.form === 'art' ? 'atkArt' : 'atk', 1);
    if (p.form !== 'art') {                // 🏀 수플렉스: 앞의 상대를 업어서 뒤로 넘김
      let tg = null, bd = Infinity;
      for (const q of enemies(room, p)) {
        if (q.struct) { if (inCone(p, a, A.range, A.half, q.x, q.y, q.B.radius)) { damage(room, p, q, A.dmg, now, 'suplex'); chargeSuper(p, A.dmg); } continue; }
        if (!inCone(p, a, A.range, A.half, q.x, q.y, q.B.radius) || !sees(room, p, q)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; tg = q; }
      }
      let fx = { type: 'suplex', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), tid: tg ? tg.id : null };
      if (tg) {
        const bx = p.x - Math.cos(a) * (p.B.radius + tg.B.radius + 18), by = p.y - Math.sin(a) * (p.B.radius + tg.B.radius + 18);
        fx.fx0 = tg.x; fx.fy0 = tg.y;
        if (!hitsWall(room.map, bx, by, tg.B.radius) && !tg.struct) { tg.x = bx; tg.y = by; }     // 뒤로 넘김
        fx.tx = tg.x; fx.ty = tg.y;
        tg.stunT = Math.max(tg.stunT, 0.2);
        damage(room, p, tg, A.dmg, now, 'suplex'); chargeSuper(p, A.dmg); slowHit(p, tg);
      }
      room.fx.push(fx);
    } else {                               // 🎨 물감 발사: 멀리 던져 넓은 범위 + 시야 가림
      const r = A.range * Math.max(0.2, Math.min(1, dist));
      const lx = Math.max(20, Math.min(room.map.w - 20, p.x + Math.cos(a) * r)), ly = Math.max(20, Math.min(room.map.h - 20, p.y + Math.sin(a) * r));
      const t = 0.25 + r / 1400, col = pick(['#ff4ab0', '#3ad1ff', '#ffd23a', '#7dff6a', '#b06aff']);
      room.fx.push({ type: 'paintShot', id: p.id, x: p.x, y: p.y, lx, ly, t: +t.toFixed(2), r: A.lobR, c: col });
      later(room, t, () => {
        if (!room.players.has(p.id)) return;
        const tt = Date.now() / 1000, hits = [];
        for (const q of enemies(room, p)) {
          if (Math.hypot(q.x - lx, q.y - ly) > A.lobR + q.B.radius) continue;
          damage(room, p, q, A.dmg, tt, 'paint'); chargeSuper(p, A.dmg); slowHit(p, q); hits.push(q.id);
          if (!q.isBot) q.blindT = A.blind;
        }
        room.fx.push({ type: 'paintHit', id: p.id, x: lx, y: ly, r: A.lobR, c: col, hits, blind: A.blind });
      });
    }
  },
  gadget(room, p, idx, now) {             // 두 가젯 모두 폼을 바꿈
    const g = p.B.gadgets[idx], to = p.form === 'art' ? 'sport' : 'art';
    setForm(p, to);
    room.fx.push({ type: 'form', id: p.id, x: p.x, y: p.y, to });
    if (idx === 0) {                       // 은밀하게
      say(p, 'g1', 1.2);
      if (to === 'art') { p.invT = g.invis; room.fx.push({ type: 'invis', id: p.id, x: p.x, y: p.y, dur: g.invis }); }
      else { p.spdUpT = Math.max(p.spdUpT || 0, g.fast); p.spdUpMul = g.mul; }
    } else { say(p, 'g2', 1.2); moaiOn(room, p, g.dur); }   // 모아이🗿🗿
  },
  super(room, p, a, now) {
    const S = p.B.super;
    if (p.invT > 0) { p.invT = 0; room.fx.push({ type: 'reveal', id: p.id, x: p.x, y: p.y }); }
    say(p, p.form === 'art' ? 'supArt' : 'sup', 1.6);
    if (p.form !== 'art') {                // 📣 동기부여
      const ups = [p.id], downs = [];
      p.spdUpT = Math.max(p.spdUpT || 0, S.dur); p.spdUpMul = S.up;
      for (const q of allies(room, p)) if (Math.hypot(q.x - p.x, q.y - p.y) <= S.range) { q.spdUpT = Math.max(q.spdUpT || 0, S.dur); q.spdUpMul = S.up; ups.push(q.id); }
      for (const q of enemies(room, p)) if (!q.struct && Math.hypot(q.x - p.x, q.y - p.y) <= S.range) { q.slowT = Math.max(q.slowT || 0, S.dur); q.slowMul = S.down; downs.push(q.id); }
      room.fx.push({ type: 'motivate', id: p.id, x: p.x, y: p.y, r: S.range, ups, downs });
    } else {                               // 📄 종이 감옥
      let target = null, best = Infinity;
      const ca = Math.cos(a), sa = Math.sin(a);
      for (const q of enemies(room, p)) {
        if (q.struct) continue;
        const dx = q.x - p.x, dy = q.y - p.y, along = dx * ca + dy * sa, perp = Math.abs(-dx * sa + dy * ca);
        if (along < -q.B.radius || along > S.range + q.B.radius || perp > S.width + q.B.radius || !sees(room, p, q)) continue;
        if (along < best) { best = along; target = q; }
      }
      room.fx.push({ type: 'paperJail', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: S.range, tid: target ? target.id : null, dur: S.dur });
      if (target) {
        const tid = target.id;
        target.rootT = Math.max(target.rootT || 0, S.dur); target.dash = null;
        for (let i = 1; i <= S.ticks; i++) later(room, S.dur * i / S.ticks, () => {
          const q = room.players.get(tid); if (!q || q.dead || !room.players.has(p.id)) return;
          damage(room, p, q, Math.round(S.dmg / S.ticks), Date.now() / 1000, 'paper');
          room.fx.push({ type: 'paperStab', x: q.x, y: q.y, i });
        });
      }
    }
  },
};

SKILLS.yedam = {
  // 머리뜯기: 손을 날려 맞은 상대 / 팀원(특성)과 연결 → 0.15초마다 피해 / 회복
  attack(room, p, a, now) {
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    shoot(room, p, a, { speed: A.handSpeed, range: A.range, dmg: 0, kind: 'hand', ally: true, onHit: (q, t) => {
      if (p.dead || !room.players.has(p.id)) return;
      const ally = !isEnemy(room, p, q);
      // 최대 2명까지 동시에 잡음 (같은 사람이면 다시 잡기, 3번째면 제일 오래된 손 놓기)
      p.teths = p.teths.filter((T) => T.tid !== q.id);
      if (p.teths.length >= A.maxGrab) p.teths.shift();
      p.teths.push({ tid: q.id, ally, acc: A.tick, t: 0 });       // 잡자마자 첫 틱
      room.fx.push({ type: 'grab', id: p.id, tid: q.id, x: q.x, y: q.y, ally });
    } });
    if (Math.random() < 0.3) say(p, 'atk', 1);
  },
  gadget(room, p, idx, now) {
    if (idx === 0) {                // 전력질주: 앞으로 쭉 → 4초 동안 이속 300%
      const g = p.B.gadgets[0], mv = Math.hypot(p.input.mx, p.input.my);
      const a = mv > 0.1 ? Math.atan2(p.input.my, p.input.mx) : p.facing;
      say(p, 'g1', 1.4); p.facing = a;
      p.dash = { a, left: g.dash, speed: g.dash / 0.22, kind: 'sprint', pass: true, onEnd: () => { p.sprintT = g.dur; } };
      room.fx.push({ type: 'sprint', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), dur: g.dur });
    } else {                        // 연필 던지기: 가까운 상대 쪽으로
      const g = p.B.gadgets[1];
      let tg = null, bd = g.range + 40;
      for (const q of enemies(room, p)) { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd && sees(room, p, q)) { bd = d; tg = q; } }
      const a = tg ? Math.atan2(tg.y - p.y, tg.x - p.x) : p.facing;
      p.facing = a; say(p, 'g2', 1.2);
      shoot(room, p, a, { speed: g.speed, range: g.range, dmg: g.dmg, kind: 'pencil' });
      room.fx.push({ type: 'pencilThrow', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
    }
  },
  // 사랑을 했다: 3초 노래. 0.75초마다 주위 팀원 회복 / 상대 피해 (스파2: 처음 맞으면 2초 기절)
  super(room, p, a, now) {
    const S = p.B.super, n = Math.round(S.dur / S.every), stunned = new Set();
    say(p, 'sup', S.dur);
    room.fx.push({ type: 'song', id: p.id, x: p.x, y: p.y, r: S.range, dur: S.dur });
    for (let i = 0; i < n; i++) later(room, S.every * (i + 0.5), () => {
      if (p.dead || !room.players.has(p.id)) return;
      const t = Date.now() / 1000, hits = [];
      for (const q of allies(room, p)) if (Math.hypot(q.x - p.x, q.y - p.y) <= S.range + q.B.radius) chargeSuper(p, heal(room, p, q, S.heal) * 0.3);
      for (const q of enemies(room, p)) {
        if (Math.hypot(q.x - p.x, q.y - p.y) > S.range + q.B.radius) continue;
        damage(room, p, q, S.dmg, t, 'song'); hits.push(q.id);
        if (hasSP(p, 'economy') && !stunned.has(q.id)) {
          stunned.add(q.id); q.stunT = Math.max(q.stunT, SP(p, 'economy').stun);
          room.fx.push({ type: 'economy', id: p.id, tid: q.id, x: q.x, y: q.y });
        }
      }
      room.fx.push({ type: 'songPulse', id: p.id, x: p.x, y: p.y, r: S.range, hits });
    });
  },
};

function doAttack(room, p, ang, now, dist) {
  if (room.ball && room.ball.holder === p.id) {      // 브롤볼: 공 들고 있으면 공격 = 슛
    if (room.phase === 'play' && canAct(p) && p.atkCd <= 0) kickBall(room, p, Number.isFinite(ang) ? ang : p.facing, 1150);
    return;
  }
  if (room.phase !== 'play' || !canAct(p) || p.ammo < 1 || p.atkCd > 0 || p.scaredT > 0 || p.noAtkT > 0 || p.dash || p.spinT > 0) return;
  p.lastHit = Math.max(p.lastHit, now - G.regenDelay + 1);
  if (p.confT > 0) ang = Math.random() * Math.PI * 2;        // 수면가루: 무의식 → 아무 데로나
  SKILLS[p.B.id].attack(room, p, Number.isFinite(ang) ? ang : p.facing, now, Number.isFinite(dist) ? Math.max(0.15, Math.min(1, dist)) : 1);
}
function doGadget(room, p, slot, now, aim) {     // slot: 1 또는 2 (더블 가젯 모드에서만 2) · aim: { a: 각도, d: 거리 0~1 } (위치 고르는 가젯)
  if (p.flyT > 0 && p.B.id === 'suhun' && room.phase === 'play') { planeCrash(room, p); return; }   // 지메 비행기에서 뛰어내림
  if (room.phase !== 'play' || !canAct(p) || p.gCd > 0) return;
  const idx = p.lo.g[slot - 1]; if (idx == null) return;
  p.gCd = ((p.B.gadgets[idx] || {}).cd || p.B.gadgetCd) * (has(p, 'gadget') ? 0.8 : 1);   // 가젯마다 cd가 따로 있으면 그걸로
  if (p.confT > 0) { p.facing = Math.random() * Math.PI * 2; aim = { a: p.facing, d: Math.random() }; }   // 수면가루
  SKILLS[p.B.id].gadget(room, p, idx, now, aim || {});
}
function doSuper(room, p, ang, now, choice) {
  if (room.ball && room.ball.holder === p.id) return;    // 공 들고는 궁 못 씀
  if (room.phase !== 'play' || !p.B.super || !canAct(p) || p.sup < 1 || p.scaredT > 0 || p.noAtkT > 0 || p.dash || p.flyT > 0) return;
  if (p.ctrlBy && p.B.id === 'hyeonsil') return;   // 꼭두각시 현실쌤은 조종 궁극기 못 씀
  p.sup = 0;
  let a = Number.isFinite(ang) ? ang : p.facing;
  if (p.confT > 0) a = Math.random() * Math.PI * 2;          // 수면가루: 무의식 → 아무 데로나
  p.facing = a;
  if (choice == null && p.B.super.pick) choice = p.isBot ? Math.floor(Math.random() * 3) : 0;   // 봇은 노래 랜덤
  SKILLS[p.B.id].super(room, p, a, now, choice);
}

// ── 봇 AI ──────────────────────────────────────────
function moveToward(p, x, y, jitter = 0.3, now = 0) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy) || 1;
  let a = Math.atan2(dy, dx);
  // 앞이 벽이면 옆으로 돌아가기 (한쪽 방향을 정하면 길이 뚫릴 때까지 유지)
  const map = p._room && p._room.map;
  if (map && d > 30) {
    const r = p.B.radius + 4;
    const free = (ang) => { for (const k of [36, 80, 130]) { if (k > d + 20) break; if (hitsWall(map, p.x + Math.cos(ang) * k, p.y + Math.sin(ang) * k, r)) return false; } return true; };
    if (!free(a)) {
      const side = p.avoidSide || (p.avoidSide = Math.random() < 0.5 ? 1 : -1);
      let found = false;
      for (const o of [0.5, 0.95, 1.4, 1.85, 2.4]) {
        for (const sg of [side, -side]) if (free(a + sg * o)) { a += sg * o; p.avoidSide = sg; found = true; break; }
        if (found) break;
      }
      if (found) jitter = 0;
    } else p.avoidSide = 0;
  }
  const j = Math.sin(now * 3 + p.x * 0.01) * jitter;
  const c = Math.cos(a), s = Math.sin(a);
  p.input = { mx: c - s * j, my: s + c * j };
  return d;
}
// 봇 난이도: 방에 있는 사람들의 (지금 쓰는 브롤러) 트로피 평균에 따라 — 트로피 적으면 거의 안 싸우는 봇, 1500 이상이면 최강
const BOT_EASY = { aimErr: 0.8, react: 1.2, atkRate: 0.2, skillRate: 0.1, speed: 0.78, chase: 0.45 };
const BOT_HARD = { aimErr: 0.08, react: 0.18, atkRate: 1.0, skillRate: 1.0, speed: 1.0, chase: 1 };
function botLv(room) {
  if (room.botLv && room.botLvT > Date.now()) return room.botLv;
  const hs = humans(room); const avg = hs.length ? hs.reduce((a, p) => a + btOf(p), 0) / hs.length : 0;
  const d = Math.max(0, Math.min(1, avg / 1500)), L = {};
  for (const k in BOT_EASY) L[k] = BOT_EASY[k] + (BOT_HARD[k] - BOT_EASY[k]) * d;
  L.d = d; room.botLv = L; room.botLvT = Date.now() + 3000;
  return L;
}
function botThink(room, p, now) {
  const b = p.bot, B = p.B, mode = room.mode, BOT = botLv(room);
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
  if (p.eyeT > 0) { p.input = { mx: 0, my: 0 }; return; }   // 음악쌤 가젯1: 눈 감아서 아무것도 못 봄
  let target = null, best = Infinity;
  for (const q of enemies(room, p)) { if (q.invT > 0 || (mode.team && q.team === p.team)) continue; const d = Math.hypot(q.x - p.x, q.y - p.y) * (q.box ? 1.6 : 1) + (q.box ? 120 : 0); if (d < best) { best = d; target = q; } }   // 은신한 적은 못 봄 · 봇은 팀킬 안 함
  // 지금 노리는 상대가 아직 가까이 있으면 계속 노림 (여럿이 엉켜 있을 때 목표가 계속 바뀌어서 공격을 못 하던 버그)
  const cur = b.tgtId && room.players.get(b.tgtId);
  if (cur && cur !== target && !cur.dead && !cur.out && !(cur.invT > 0) && enemies(room, p).includes(cur)) {
    const cd = Math.hypot(cur.x - p.x, cur.y - p.y);
    if (cd < best * 1.4 + 40) { target = cur; best = cd; }
  }
  b.wanderT -= DT;
  // 봇 난이도 — 조준이 살짝 빗나가고, 처음 보는 상대에겐 반응이 조금 늦음
  const aimErr = () => (Math.random() + Math.random() - 1) * BOT.aimErr;
  b.seen = b.seen || {};
  if (target && b.tgtId !== target.id) {
    b.tgtId = target.id;
    b.seeT = now - (b.seen[target.id] || -99) < 3 ? 0 : BOT.react;     // 방금까지 보던 상대면 반응 지연 없음
  }
  if (target) b.seen[target.id] = now;
  if (b.seeT > 0) b.seeT -= DT;
  const fight = () => {
    const dx = target.x - p.x, dy = target.y - p.y;
    if (b.lazyT == null || b.lazyT < now) { b.lazyT = now + 2 + Math.random() * 2; b.lazy = Math.random() > BOT.chase; }   // 쉬운 봇: 가끔 싸움을 포기하고 딴짓
    if (b.lazy && !(mode.id === 'heist' && target.struct)) { if (b.wanderT <= 0) { const a = Math.random() * Math.PI * 2; b.wanderX = Math.cos(a); b.wanderY = Math.sin(a); b.wanderT = 1.5; } p.input = { mx: b.wanderX || 0, my: b.wanderY || 0 }; return; }
    moveToward(p, target.x, target.y, 0.4, now);
    if (b.seeT > 0) return;                       // 아직 반응 전
    if (best < B.attack.range + 10 && Math.random() < (B.attack.aim === 'dir' ? 0.1 : 0.18) * BOT.atkRate) doAttack(room, p, Math.atan2(dy, dx) + aimErr(), now, best / B.attack.range);
    if (B.roll && best < 320 && p.boostT <= 0 && Math.random() < 0.05 * BOT.atkRate) doAttack(room, p, Math.atan2(dy, dx), now);   // 정수호: 가까우면 가속해서 들이받기
    if (best < 220 && Math.random() < 0.006 * BOT.skillRate) doGadget(room, p, 1, now);
    if (mode.doubleGadget && best < 400 && Math.random() < 0.005 * BOT.skillRate) doGadget(room, p, 2, now);
    if (B.super && best < B.super.range - 30 && p.sup >= 1 && Math.random() < 0.05 * BOT.skillRate) doSuper(room, p, Math.atan2(dy, dx) + aimErr() * 0.6, now);
    if (p.hp < mhp(p) * 0.3 && Math.random() < 0.5) { p.input.mx *= -1; p.input.my *= -1; }
  };
  // 쇼다운: 독가스 밖이면 안으로
  if (room.safe) {
    const s = room.safe;
    if (p.x < s.x1 + 40 || p.x > s.x2 - 40 || p.y < s.y1 + 40 || p.y > s.y2 - 40) { moveToward(p, room.map.w / 2, room.map.h / 2, 0, now); return; }
  }
  // 쇼다운: 가까운 파워 큐브 줍기 (싸우는 중이 아니면)
  if (mode.sd && room.cubes.length && !(target && !target.box && best < 300)) {
    let cube = null, cd = 600;
    for (const c of room.cubes) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < cd) { cd = d; cube = c; } }
    if (cube) { moveToward(p, cube.x, cube.y, 0.05, now); return; }
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
  // 하이스트: 가까운 적 아니면 상대 금고로
  if (mode.id === 'heist') {
    const es = [...room.players.values()].find((q) => q.struct && q.team !== p.team && !q.dead);
    const ed = es ? Math.hypot(es.x - p.x, es.y - p.y) : Infinity;
    if (target && !target.struct && best < (ed < 700 ? 140 : 220)) return fight();     // 금고 가까우면 금고 우선
    if (es) { target = es; best = ed; return fight(); }
  }
  // 브롤볼: 공 쫓기 → 들면 상대 골대로 → 가까우면 슛
  if (mode.id === 'brawlball' && room.ball) {
    const bl = room.ball, eg = room.map.goals[1 - p.team], gx = eg.x + eg.w / 2, gy = eg.y + eg.h / 2;
    if (bl.holder === p.id) {
      const d = Math.hypot(gx - p.x, gy - p.y);
      if (d < 560 && clearPath(room.map, p.x, p.y, gx, gy)) { p.input = { mx: 0, my: 0 }; doAttack(room, p, Math.atan2(gy - p.y, gx - p.x), now); return; }
      moveToward(p, gx, gy, 0.15, now); return;
    }
    const h = bl.holder && room.players.get(bl.holder);
    if (!h) { if (target && best < 170) return fight(); moveToward(p, bl.x, bl.y, 0.05, now); return; }
    if (h.team !== p.team) { target = h; best = Math.hypot(h.x - p.x, h.y - p.y); return fight(); }
    if (target && best < 450) return fight();
    moveToward(p, gx, gy, 0.3, now); return;
  }
  if (mode.team && target) return fight();       // 현상금·녹아웃: 적극적으로
  if (target && best < 650) return fight();
  if (b.wanderT <= 0) {
    const a = Math.random() * Math.PI * 2;
    b.wanderX = Math.cos(a); b.wanderY = Math.sin(a); b.wanderT = 1 + Math.random() * 2;
  }
  if (mode.sd) { moveToward(p, room.map.w / 2 + b.wanderX * 200, room.map.h / 2 + b.wanderY * 200, 0.3, now); return; }
  p.input = { mx: b.wanderX, my: b.wanderY };
}

// ── 훈련장 로봇 ────────────────────────────────────
function addRobot(room, r) {
  const id = 'rb' + ++room.botSeq;
  const p = newPlayer(room, id, ROBOTS[r.id].name, true, r.id, null);
  p.home = { x: r.x, y: r.y }; p.color = '#8a96a8';
  room.players.set(id, p); resetBody(room, p);
  return p;
}

// ── 봇 채우기 ──────────────────────────────────────
function addBot(room, team) {
  const id = 'bot' + ++room.botSeq;
  const bid = pick(Object.keys(BRAWLERS).filter((k) => !BRAWLERS[k].wip));
  const p = newPlayer(room, id, '봇' + room.botSeq, true, bid, null);
  if (team != null) { p.team = team; p.color = TEAM_COLORS[team]; }
  room.players.set(id, p);
  return p;
}
function removeBot(room, p) { releaseCtrl(room, p, false); if (p.gems) dropGems(room, p); room.players.delete(p.id); }
function fillBots(room) {
  const mode = room.mode;
  if (room.partyCfg) {             // 친선 전투: 로비에서 켜 둔 AI 자리만큼만 봇
    const bots = (t) => [...room.players.values()].filter((p) => p.isBot && !p.struct && (mode.team ? p.team === t : true));
    for (const t of mode.team ? [0, 1] : [0]) {
      while (bots(t).length > room.partyCfg.ai[t]) removeBot(room, bots(t)[0]);
      while (bots(t).length < room.partyCfg.ai[t]) addBot(room, mode.team ? t : null);
    }
    return;
  }
  if (mode.sd) {
    for (const p of [...room.players.values()]) if (p.isBot) removeBot(room, p);
    while (room.players.size < mode.size) addBot(room);
  } else if (mode.team) {
    for (const t of [0, 1]) {
      while (teamCount(room, t) > mode.teamSize) { const bot = [...room.players.values()].find((p) => p.isBot && !p.struct && p.team === t); if (!bot) break; removeBot(room, bot); }
      while (teamCount(room, t) < mode.teamSize) addBot(room, t);
    }
  }
}

// ── 매칭 대기 (브롤스타즈처럼: 사람 모이길 기다리거나 「바로 시작」 → 빈자리는 봇) ──
const QUEUE_T = 60;                                  // 이 시간 지나면 자동 시작
const roomCap = (room) => (room.mode.team ? room.mode.teamSize * 2 : room.mode.size || 6);
function toQueue(room) {
  for (const p of [...room.players.values()]) if (p.isBot || p.struct) room.players.delete(p.id);
  room.mice = []; room.shards = []; room.gems = []; room.cubes = []; room.pending = []; room.bullets = []; room.bigmacs = []; room.ball = null; room.safe = null;
  room.gds = {};
  room.phase = 'queue'; room.queueT = QUEUE_T; room.startReq = false; room.result = null; room.playT = 0;
  let slot = 0;
  if (room.mode.team) balanceTeams(room);
  for (const p of humans(room)) {
    p.out = false; p.rank = 0; p.kills = 0; p.deaths = 0; p.dealt = 0; resetCubes(p); resetBody(room, p, slot++);
  }
}

// 3대3: 사람 팀 나누기 — 같이 초대해서 온 친구(p.grp)는 같은 팀, 친선 전투는 로비에서 고른 자리 그대로
function partyGroups(hs) {
  const g = new Map(); for (const p of hs) { const k = p.grp || p.id; if (!g.has(k)) g.set(k, []); g.get(k).push(p); }
  return [...g.values()].sort((a, b) => b.length - a.length);
}
function balanceTeams(room) {
  const hs = humans(room);
  if (room.partyCfg) { for (const p of hs) { const t = room.partyCfg.teamOf[p.cid]; p.team = t != null ? t : p.team || 0; p.color = TEAM_COLORS[p.team]; } return; }
  const cnt = [0, 0], size = room.mode.teamSize;
  for (const g of partyGroups(hs)) for (const p of g) {
    let t = cnt[0] <= cnt[1] ? 0 : 1;
    if (p !== g[0] && cnt[g[0].team] < size) t = g[0].team;
    p.team = t; cnt[t]++; p.color = TEAM_COLORS[t];
  }
}
// 듀오·트리오: 팀 짜기 (친선전은 로비에서 고른 자리, 매칭은 먼저 온 사람끼리 → 남는 자리는 봇)
const SQUAD_COLORS = ['#3a8cff', '#ff4a4a', '#3ad16a', '#ffb02e', '#c070ff', '#3ad9d9'];
function assignSquads(room) {
  const sq = room.mode.squad, nT = Math.ceil(room.mode.size / sq), cnt = new Array(nT).fill(0);
  const ps = [...room.players.values()].filter((p) => !p.struct);
  for (const p of ps) p.team = null;
  const put = (p, t) => { p.team = t; p.color = SQUAD_COLORS[t % SQUAD_COLORS.length]; cnt[t]++; };
  const hs = partyGroups(ps.filter((p) => !p.isBot)).flat();      // 같이 온 친구끼리 붙어서 → 같은 팀
  if (room.partyCfg && room.partyCfg.slotOf) for (const p of hs) { const i = room.partyCfg.slotOf[p.cid]; if (i != null && cnt[Math.floor(i / sq)] < sq) put(p, Math.floor(i / sq)); }
  for (const p of [...hs, ...ps.filter((p) => p.isBot)]) if (p.team == null) { let t = cnt.findIndex((c) => c < sq); if (t < 0) t = cnt.indexOf(Math.min(...cnt)); put(p, t); }
}
// ── 라운드 진행 ────────────────────────────────────
function startRound(room) {
  const mode = room.mode;
  room.map = cloneMap(room.fixedMap || todayMap(mode.id));
  room.domes = [];   // 오늘의 맵 (0시 넘으면 다음 판부터 바뀜)
  room.mice = []; room.shards = []; room.gems = []; room.cubes = []; room.pending = []; room.bullets = []; room.bigmacs = []; room.gds = {};
  room.gemT = 0; room.holdT = 0; room.holdTeam = -1; room.result = null; room.playT = 0; room.roundT = 0;
  room.score = [0, 0]; room.stars = [0, 0]; room.ko = [0, 0];
  for (const p of [...room.players.values()]) if (p.struct) room.players.delete(p.id);
  room.ball = room.map.ball ? { x: room.map.ball.x, y: room.map.ball.y, vx: 0, vy: 0, holder: null, cd: 0, noPick: {} } : null;
  room.safe = mode.gas ? { x1: 0, y1: 0, x2: room.map.w, y2: room.map.h } : null;
  if (mode.team) balanceTeams(room);   // 사람은 팀 균형 맞춰 재배치 (같이 온 친구는 같은 팀)
  fillBots(room);
  if (room.map.safes) room.map.safes.forEach((s, t) => addSafe(room, t, s));
  room.sdRot = Math.floor(Math.random() * 8);
  if (mode.squad) assignSquads(room);
  if (mode.sd) addBoxes(room);
  let slot = Math.floor(Math.random() * 8);
  for (const p of room.players.values()) {
    if (p.struct) continue;
    resetCubes(p);
    p.out = false; p.rank = 0; p.sup = 0; p.gCd = 0; p.kills = 0; p.deaths = 0; p.dealt = 0; p.ajT = 30; p.fear = 0; p.scaredT = 0; p.bounty = mode.bountyStart || 0; p.trophied = false;
    resetBody(room, p, slot++);
  }
  room.sdN = [...room.players.values()].filter((q) => !q.struct).length;   // 쇼다운 인원 (등수 → 트로피)
  room.sdFinal = false;
  room.phase = 'wait'; room.phaseT = 4;
  room.fx.push({ type: 'round', map: room.map.id });
}
// 트로피: 로그인한 사람만 계정에 저장
// ── 트로피 (브롤스타즈처럼 브롤러별) ──
// 그 브롤러 트로피가 높을수록 이기면 덜 오르고, 지면 더 많이 깎임. 친선전·훈련장은 트로피 없음. 무승부 ±0
const trophyRoom = (room) => !room.mode.training && !room.partyCfg;
const btOf = (p) => (p && p.userKey && p.B ? auth.brawlerTrophies(p.userKey)[p.B.id] || 0 : 0);
// 실제 브롤스타즈 트로피 표 — 2026년 2월 「트로피 3.0」(프레스티지) 기준
const TRO_3V3 = [   // [이 트로피 이상, 승리, 패배]
  [0, 10, 0], [50, 10, -1], [300, 10, -2], [600, 10, -3], [800, 10, -4], [1000, 10, -5], [1100, 10, -6], [1200, 10, -7], [1300, 10, -8], [1500, 10, -9], [1800, 10, -10],
  [2000, 8, -10], [2500, 6, -10], [2800, 4, -10], [3000, 2, -10], [3100, 1, -10], [4000, 1, -15],
];
// 프레스티지(1000 / 2000 / 3000 … 한 번 넘으면 그 아래로 안 떨어짐)는 auth.addTrophies에서 처리
const TRO_SD = [    // [이 트로피 이상, 1등 … 10등] (솔로 쇼다운)
  [0, 10, 8, 7, 6, 4, 2, 2, 1, 0, 0], [300, 10, 8, 7, 6, 3, 2, 2, 0, -1, -2], [400, 10, 8, 7, 6, 3, 1, 0, -1, -2, -2], [500, 10, 8, 6, 5, 3, 1, 0, -2, -3, -3],
  [600, 10, 8, 6, 5, 2, 0, 0, -3, -4, -4], [700, 10, 8, 6, 5, 2, -1, -2, -3, -5, -5], [800, 10, 8, 6, 4, 2, -1, -2, -5, -6, -6], [900, 10, 8, 6, 4, 1, -2, -2, -5, -7, -8],
  [1100, 9, 7, 5, 3, 0, -4, -5, -8, -10, -12], [1200, 8, 6, 4, 2, -1, -6, -8, -11, -13, -16], [1300, 7, 5, 3, 1, -2, -8, -11, -14, -16, -20], [1400, 6, 4, 2, 0, -3, -10, -14, -17, -19, -24],
  [1500, 5, 3, 1, -1, -4, -12, -17, -20, -22, -28], [1600, 4, 2, 0, -2, -5, -14, -20, -23, -25, -32], [1700, 3, 0, -1, -3, -6, -16, -23, -26, -28, -36], [1800, 3, 0, -2, -4, -7, -18, -26, -29, -31, -40],
  [1900, 3, 0, -3, -5, -8, -20, -29, -32, -34, -44], [2000, 3, 0, -10, -20, -30, -40, -50, -60, -70, -80],
];
const rowOf = (T, bt) => { let r = T[0]; for (const x of T) if (bt >= x[0]) r = x; return r; };
const winTro = (bt) => rowOf(TRO_3V3, bt)[1];
const lossTro = (bt) => -rowOf(TRO_3V3, bt)[2];
function showdownTro(bt, rank, n) {                                   // 우리 쇼다운 인원(보통 6명)을 10명 등수에 맞춰 환산
  const i = Math.max(0, Math.min(9, Math.round((Math.max(1, rank) - 1) * 9 / Math.max(1, n - 1))));
  return rowOf(TRO_SD, bt)[1 + i];
}
function matchTrophies(room, p, outcome, rank) {                      // 한 판 결과 → 트로피 (한 판에 한 번만)
  if (!trophyRoom(room) || !p || p.isBot || !p.userKey || p.trophied) return;
  p.trophied = true;
  const bt = btOf(p), rk = room.mode.sd || room.mode.id === 'ffa';
  if (room.mode.id === 'ffa' && (room.sdN || 0) < 2) { p.trophied = false; return; }        // 혼자면 트로피 없음
  let n = room.mode.sd ? sdTro(room.mode, rank) : rk ? showdownTro(bt, rank, room.sdN || 6) : outcome === 'win' ? winTro(bt) : outcome === 'loss' ? -lossTro(bt) : 0;
  // 연승: n연승이면 n-1개(최대 10) 추가. 난투·더블가젯은 해당 없음(여기 안 옴), 무승부·쇼다운 중간 순위는 연승 유지
  const sn = room.mode.sd ? sdTro(room.mode, rank) : 0;
  const won = room.mode.sd ? sn > 0 : rk ? rank === 1 : outcome === 'win', lost = room.mode.sd ? sn < 0 : rk ? n < 0 : outcome === 'loss';   // 쇼다운: 트로피 + 등수 = 승리(연승), 0 = 유지, - = 패배
  let streak = auth.streakOf(p.userKey), bonus = 0;
  if (room.mode.id !== 'ffa' && room.mode.id !== 'double' && (won || lost)) {
    streak = auth.setStreak(p.userKey, won);
    if (won) { bonus = Math.min(10, streak - 1); n += bonus; }
  }
  p.streakInfo = { streak, bonus };
  giveTrophies(p, n, outcome === 'win' || rank === 1 ? 'wins' : null, true);
}
// 쇼다운(솔로·듀오·트리오) 등수 → 트로피 (모드별 고정 표)
const SD_TRO = {
  showdown: [10, 7, 5, 2, 0, -1, -2, -3, -5, -7],   // 솔로 1~10등
  duo: [8, 5, 0, -3, -5],                            // 듀오 1~5등 (팀 등수)
  trio: [6, 3, -2, -4],                              // 트리오 1~4등 (팀 등수)
};
const sdTro = (mode, rank) => { const T = SD_TRO[mode.id] || SD_TRO.showdown; return T[Math.max(1, Math.min(T.length, rank || T.length)) - 1]; };
function giveTrophies(p, n, field, show) {
  if (!p || p.isBot || !p.userKey) return;
  if (!n && !show) { if (field) auth.addStat(p.userKey, field); return; }
  const bid = p.B && p.B.id, before = bid ? auth.brawlerTrophies(p.userKey)[bid] || 0 : 0;
  const t = auth.addTrophies(p.userKey, n, field, bid);
  const bt = auth.brawlerTrophies(p.userKey), add = bid ? (bt[bid] || 0) - before : n;   // 프레스티지 바닥에 막히면 실제로 바뀐 만큼만
  const si = p.streakInfo || {}; p.streakInfo = null;
  if (t != null) io.to(p.id).emit('trophy', { total: t, add, bid, bt, streak: si.streak || 0, bonus: si.bonus || 0 });
}
function endRound(room, result) {
  room.phase = 'end'; room.phaseT = 8; room.result = result;
  // 결과 화면 (브롤스타즈처럼): 모두의 처치·데스·준 피해 + 스타플레이어
  const ps = [...room.players.values()].filter((q) => !q.struct);
  result.stats = ps.map((q) => ({ id: q.id, name: q.name, b: q.B.id, team: q.team, k: q.kills || 0, d: q.deaths || 0, dmg: Math.round(q.dealt || 0), bot: !!q.isBot, rank: q.rank || 0 }));
  const winners = result.type === 'showdown' || result.type === 'ffa' ? ps.filter((q) => q.rank === 1) : result.winTeam >= 0 ? ps.filter((q) => q.team === result.winTeam) : ps;
  const score = (q) => (q.kills || 0) * 3 + (q.dealt || 0) / 1500 - (q.deaths || 0) * 1.5;
  const star = winners.sort((a, b) => score(b) - score(a))[0];
  result.star = star ? star.id : null;
  for (const p of humans(room)) {
    if (p.userKey) auth.addStat(p.userKey, 'games');
    if (result.type === 'showdown' || result.type === 'ffa') matchTrophies(room, p, null, p.rank || 1);   // (쇼다운은 보통 탈락할 때 이미 받음)
    else matchTrophies(room, p, result.winTeam === -1 ? 'draw' : result.winTeam === p.team ? 'win' : 'loss');
  }
  room.fx.push({ type: 'end', result });
}
function changeMap(room) {   // 난투/더블가젯: 0시 넘으면 오늘의 맵으로 바꿈
  room.map = cloneMap(todayMap(room.mode.id));
  room.domes = [];
  room.mice = []; room.shards = []; room.pending = []; room.bullets = []; room.bigmacs = [];
  for (const p of room.players.values()) resetBody(room, p);
  room.mapT = room.mode.rotate;
  room.fx.push({ type: 'round', map: room.map.id });
}

function roundLogic(room, now) {
  const mode = room.mode;
  if (!mode.rounds) {
    if (!mode.rotate || room.fixedMap) return;     // 훈련장: 맵 고정
    room.mapT -= DT;
    if (room.mapT <= 0) { room.mapT = 5; if (room.map.id !== todayMap(mode.id)) changeMap(room); }   // 5초마다 날짜 확인
    return;
  }
  if (room.phase === 'queue') {                       // 매칭 대기: 다 차거나, 누가 「바로 시작」 누르거나, 시간 다 되면 시작
    room.queueT -= DT;
    if (humans(room).length >= roomCap(room) || room.startReq || room.queueT <= 0) startRound(room);
    return;
  }
  if (room.phase === 'wait') { room.phaseT -= DT; if (room.phaseT <= 0) room.phase = 'play'; return; }
  if (room.phase === 'end') { room.phaseT -= DT; if (room.phaseT <= 0) { if (room.qBase) toQueue(room); else startRound(room); } return; }
  room.playT += DT;
  if (mode.id === 'ffa') {         // 난투: 1분 30초 → 킬 많은 순, 같으면 데스 적은 순으로 등수
    if (room.playT >= mode.timeLimit) {
      const ps = [...room.players.values()].filter((q) => !q.struct).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
      ps.forEach((q, i) => { q.rank = i + 1; });
      room.sdN = ps.length;
      const w = ps[0];
      endRound(room, { type: 'ffa', winner: w ? w.id : null, winnerName: w ? w.name : null, ranks: ps.map((q) => ({ id: q.id, name: q.name, rank: q.rank, k: q.kills, d: q.deaths })) });
    }
    return;
  }
  if (mode.sd) {
    // 독가스: 시작 후 일정 시간 뒤부터 가운데로 좁혀옴
    const g = mode.gas, m = room.map;
    const k = Math.max(0, Math.min(1, (room.playT - g.start) / g.dur));
    const half = (Math.max(m.w, m.h) / 2) * (1 - k) + (g.final / 2) * k;
    room.safe = { x1: m.w / 2 - half, y1: m.h / 2 - half, x2: m.w / 2 + half, y2: m.h / 2 + half };
    sdEliminate(room);                     // 나가서 팀이 전멸한 경우 등
    const gs = sdGroups(room), live = gs.filter((x) => x.alive || !x.out);
    if (live.length === 2 && !room.sdFinal && gs.length > 2) {   // 마지막 2명(2팀) → 쇼다운!
      room.sdFinal = true; const ps = live.flatMap((x) => x.ms.filter((q) => !q.out));
      room.fx.push({ type: 'showdownFinal', ids: ps.map((p) => p.id), names: mode.squad ? live.map((x) => x.ms.map((q) => q.name).join(' · ')) : ps.map((p) => p.name) });
    }
    if (live.length <= 1) {
      const wg = live[0], w = wg ? wg.ms[0] : null;
      if (wg) for (const q of wg.ms) q.rank = 1;
      endRound(room, { type: 'showdown', squad: mode.squad || 0, winner: w ? w.id : null, winnerName: wg ? wg.ms.map((q) => q.name).join(' · ') : null, ranks: [...room.players.values()].filter((p) => !p.struct).map((p) => ({ id: p.id, name: p.name, rank: p.rank })) });
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
  } else if (mode.id === 'heist') {
    if (room.playT >= mode.timeLimit) { const [a, b] = safeScore(room); endRound(room, { type: 'team', mode: 'heist', winTeam: a > b ? 0 : b > a ? 1 : -1, score: [a, b] }); }
  } else if (mode.id === 'brawlball') {
    if (room.playT >= mode.timeLimit) { const [a, b] = room.score; endRound(room, { type: 'team', mode: 'brawlball', winTeam: a > b ? 0 : b > a ? 1 : -1, score: [a, b] }); }
  } else if (mode.id === 'bounty') {
    if (room.playT >= mode.timeLimit) { const [a, b] = room.stars; endRound(room, { type: 'team', mode: 'bounty', winTeam: a > b ? 0 : b > a ? 1 : -1, score: [a, b] }); }
  } else if (mode.id === 'knockout') {
    room.roundT += DT;
    const alive = [0, 1].map((t) => [...room.players.values()].filter((p) => !p.struct && p.team === t && !p.out && !p.dead));
    let rw = null;
    if (!alive[0].length || !alive[1].length) rw = alive[0].length ? 0 : alive[1].length ? 1 : -1;
    else if (room.roundT >= mode.roundTime) {      // 시간 끝: 남은 체력 비율이 높은 팀
      const hp = alive.map((ps) => ps.reduce((s, p) => s + p.hp / p.B.maxHp, 0));
      rw = hp[0] > hp[1] ? 0 : hp[1] > hp[0] ? 1 : -1;
    }
    if (rw != null) {
      if (rw >= 0) room.ko[rw]++;
      room.fx.push({ type: 'koRound', team: rw, ko: room.ko.slice() });
      if (rw >= 0 && room.ko[rw] >= mode.roundsToWin) endRound(room, { type: 'team', mode: 'knockout', winTeam: rw, score: room.ko.slice() });
      else softReset(room, 3);
    }
  }
}
// 금고 남은 체력 % (하이스트)
function safeScore(room) {
  const out = [100, 100];
  for (const p of room.players.values()) if (p.struct) out[p.team] = Math.max(0, Math.round(100 * p.hp / p.B.maxHp));
  return out;
}
function addSafe(room, team, pos) {
  const id = 'safe' + team + '_' + ++room.botSeq;
  const p = newPlayer(room, id, (team === 0 ? '파랑' : '빨강') + ' 금고', true, 'safe', null);
  p.struct = true; p.home = { x: pos.x, y: pos.y }; p.team = team; p.color = TEAM_COLORS[team];
  room.players.set(id, p); resetBody(room, p);
  p.hp = room.mode.safeHp || p.B.maxHp;
  return p;
}
// 라운드 안에서 다시 시작 (브롤볼 골 / 녹아웃 라운드)
function softReset(room, waitT) {
  room.mice = []; room.shards = []; room.pending = []; room.bullets = []; room.bigmacs = []; room.roundT = 0;
  let slot = 0;
  for (const p of room.players.values()) { if (p.struct) continue; p.out = false; p.rank = 0; resetBody(room, p, slot++); }
  if (room.ball) resetBall(room);
  room.phase = 'wait'; room.phaseT = waitT;
}
// ── 브롤볼 ──
const BALL_R = 22;
function resetBall(room) { Object.assign(room.ball, { x: room.map.ball.x, y: room.map.ball.y, vx: 0, vy: 0, holder: null, cd: 0, noPick: {} }); }
function dropBall(room) {
  const b = room.ball; if (!b || !b.holder) return;
  b.holder = null; b.vx = 0; b.vy = 0; b.cd = 0.3;
}
function kickBall(room, p, a, speed) {
  const b = room.ball;
  b.holder = null; b.x = p.x + Math.cos(a) * (p.B.radius + 10); b.y = p.y + Math.sin(a) * (p.B.radius + 10);
  b.vx = Math.cos(a) * speed; b.vy = Math.sin(a) * speed; b.noPick = { [p.id]: 0.45 }; b.cd = 0.05;
  p.atkCd = 0.35; p.facing = a;
  room.fx.push({ type: 'kick', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3) });
}
function stepBall(room) {
  const b = room.ball, m = room.map;
  for (const k in b.noPick) { b.noPick[k] -= DT; if (b.noPick[k] <= 0) delete b.noPick[k]; }
  if (b.cd > 0) b.cd -= DT;
  if (b.holder) {
    const h = room.players.get(b.holder);
    if (!h || h.dead || h.out || h.stunT > 0 || h.frozenT > 0 || h.ctrlBy || h.jailT > 0 || h.flyT > 0 || h.gd) { dropBall(room); }   // 지메 비행기 타면 공 떨어뜨림
    else { b.x = h.x + Math.cos(h.facing) * (h.B.radius + 14); b.y = h.y + Math.sin(h.facing) * (h.B.radius + 14); }
  } else {
    const sp = Math.hypot(b.vx, b.vy), steps = Math.max(1, Math.ceil(sp * DT / 10));
    for (let i = 0; i < steps; i++) {
      const nx = b.x + b.vx * DT / steps, ny = b.y + b.vy * DT / steps;
      if (hitsWall(m, nx, b.y, BALL_R) || nx < BALL_R || nx > m.w - BALL_R) b.vx *= -0.7; else b.x = nx;
      const inGoalX = m.goals.some((g) => b.x > g.x && b.x < g.x + g.w);
      if (hitsWall(m, b.x, ny, BALL_R) || ((ny < BALL_R || ny > m.h - BALL_R) && !inGoalX)) b.vy *= -0.7; else b.y = Math.max(0, Math.min(m.h, ny));
    }
    const f = Math.pow(0.4, DT); b.vx *= f; b.vy *= f;
    if (Math.hypot(b.vx, b.vy) < 15) { b.vx = 0; b.vy = 0; }
    if (b.cd <= 0) {             // 공 줍기
      let best = null, bd = Infinity;
      for (const p of room.players.values()) {
        if (p.dead || p.out || p.struct || b.noPick[p.id] || p.stunT > 0 || p.flyT > 0 || p.gd) continue;   // 지메 비행기 타는 중엔 못 주움
        const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < p.B.radius + BALL_R + 6 && d < bd) { bd = d; best = p; }
      }
      if (best) { b.holder = best.id; b.vx = 0; b.vy = 0; room.fx.push({ type: 'grabBall', id: best.id, x: b.x, y: b.y }); }
    }
  }
  // 골 판정: goals[0]은 0팀(아래) 골대 → 들어가면 1팀 득점
  for (let i = 0; i < m.goals.length; i++) {
    const g = m.goals[i];
    if (b.x > g.x && b.x < g.x + g.w && b.y > g.y && b.y < g.y + g.h) {
      const t = 1 - i; room.score[t]++;
      const sc = room.players.get(b.holder) || null;
      room.fx.push({ type: 'goal', team: t, x: b.x, y: b.y, score: room.score.slice(), by: sc ? sc.name : null });
      if (room.score[t] >= room.mode.goalsToWin) endRound(room, { type: 'team', mode: 'brawlball', winTeam: t, score: room.score.slice() });
      else softReset(room, 3);
      return;
    }
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
    if (p.doll) {                                      // 오줌싸개 인형: 주위 상대에게 물 (초당 150)
      const own = room.players.get(p.owner);
      if (!own) { room.players.delete(p.id); continue; }
      const g = own.B.gadgets[0]; p.peeT += DT;
      if (p.peeT >= 0.2) {
        p.peeT = 0;
        let t = null, bd = g.range;
        for (const q of enemies(room, own)) { if (q.struct) continue; const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd && sees(room, p, q)) { bd = d; t = q; } }
        p.peeTo = t ? t.id : null;
        if (t) damage(room, own, t, Math.round(g.dps / 5), now, 'pee');
      }
    }
    if (p.struct) { p.x = p.home.x; p.y = p.home.y; p.stunT = 0; p.dash = null; continue; }   // 금고: 꿈쩍도 안 함
    if (p.dead) {
      if (!room.mode.respawn && !room.mode.squad) continue;          // 듀오·트리오는 팀원 살아 있으면 부활
      p.respawnT -= DT;
      if (p.respawnT <= 0) resetBody(room, p);
      continue;
    }
    if (!playing && room.phase !== 'queue') { p.input = p.isBot ? { mx: 0, my: 0 } : p.input; continue; }   // 대기/결과 중엔 정지 (매칭 대기 중엔 돌아다닐 수 있음)
    if (p.home) {      // 훈련 로봇: 가만히. 3초 안 맞으면 제자리 + 풀피
      p.input = { mx: 0, my: 0 };
      if (now - p.lastHit > 3 && !p.dash) { p.hp = p.B.maxHp; p.x = p.home.x; p.y = p.home.y; }
    } else if (p.isBot) botThink(room, p, now);
    p.atkCd = Math.max(0, p.atkCd - DT);
    p.gCd = Math.max(0, p.gCd - DT);
    p.stunT = Math.max(0, p.stunT - DT);
    p.frozenT = Math.max(0, p.frozenT - DT);
    if (p.dash) { dashStep(room, p, now); if (p.dead) continue; }
    if (p.noAtkT > 0) p.noAtkT = Math.max(0, p.noAtkT - DT);
    if (p.jailT > 0) p.jailT = Math.max(0, p.jailT - DT);
    if (p.sprintT > 0) p.sprintT = Math.max(0, p.sprintT - DT);
    if (p.spdUpT > 0) p.spdUpT = Math.max(0, p.spdUpT - DT);
    if (p.slowT > 0) p.slowT = Math.max(0, p.slowT - DT);
    if (p.confT > 0) p.confT = Math.max(0, p.confT - DT);
    if (p.frictT > 0) p.frictT = Math.max(0, p.frictT - DT);
    if (p.burnT > 0) {                                 // 화상: 초당 피해
      p.burnT -= DT; p.burnAcc = (p.burnAcc || 0) + DT;
      if (p.burnAcc >= 1) { p.burnAcc -= 1; const src = room.players.get(p.burnBy); damage(room, src || null, p, p.burnDps || 100, now, 'burn'); if (p.dead) continue; }
    }
    if (p.flameT > 0) {                                // 과학쌤 불타오르네: 앞쪽 부채꼴로 0.5초마다
      const F = p.B.super.songs[1];
      p.flameT -= DT; p.flameAcc += DT;
      if (p.flameAcc >= F.every && canAct(p)) {
        p.flameAcc -= F.every;
        for (const q of enemies(room, p)) {
          const d = Math.hypot(q.x - p.x, q.y - p.y);
          if (d > F.range + q.B.radius || Math.abs(angDiff(Math.atan2(q.y - p.y, q.x - p.x), p.facing)) > F.half || !sees(room, p, q)) continue;
          damage(room, p, q, F.dmg, now, 'fire');
          if (!q.struct && !q.dead) { q.burnT = F.burn; q.burnBy = p.id; q.burnDps = F.burnDps; q.burnAcc = 0; }
        }
      }
    }
    if (p.spinT > 0) {                                 // 과학쌤 자전은 찐이야: 닿는 상대 계속 600
      const Sp = p.B.super.songs[2];
      p.spinT -= DT;
      for (const q of enemies(room, p)) {
        if (Math.hypot(q.x - p.x, q.y - p.y) > Sp.hitR + q.B.radius) continue;
        if ((p.spinHit[q.id] || 0) > now) continue;
        p.spinHit[q.id] = now + Sp.every;
        damage(room, p, q, Sp.dmg, now, 'spin'); room.fx.push({ type: 'spinHit', x: q.x, y: q.y });
      }
    }
    if (p.invT > 0) p.invT = Math.max(0, p.invT - DT);
    if (p.moaiT > 0) p.moaiT = Math.max(0, p.moaiT - DT);
    if (p.blindT > 0) p.blindT = Math.max(0, p.blindT - DT);
    if (p.eyeT > 0) p.eyeT = Math.max(0, p.eyeT - DT);        // 음악쌤 가젯1: 눈 감음
    if (p.visT > 0) p.visT = Math.max(0, p.visT - DT);        //              시야 넓어짐
    if (p.singT > 0) p.singT = Math.max(0, p.singT - DT);     // 음악쌤 가젯2: 노래 중
    if (p.danceT > 0) p.danceT = Math.max(0, p.danceT - DT);         // L을 가져가 춤 (춤추면서도 움직이고 공격 가능)
    if (p.flyT > 0) {                                  // 지메 비행기 끝 → 벽 안이면 빈 곳으로 착지
      p.flyT = Math.max(0, p.flyT - DT);
      if (p.flyT <= 0) { p.flyT = 0.001; planeCrash(room, p); }      // 시간 끝 → 뛰어내리고 비행기 추락
    }
    if (p.gd) { p.input = { mx: 0, my: 0 }; continue; }   // 지메 세계에 가 있는 동안 현실에선 정지
    if (B.roll) {
      if (p.boostT > 0) p.boostT = Math.max(0, p.boostT - DT);
      if (p.stunT > 0 || p.frozenT > 0) { p.roll = 0; p.boostT = 0; }
    }
    if (p.mukT > 0) {                              // 빅맥먹방 보호막: 점점 닳음
      const g = B.gadgets[1]; p.mukT = Math.max(0, p.mukT - DT);
      p.shield = Math.max(0, p.shield - g.shield / g.dur * DT); if (p.mukT <= 0) p.shield = 0;
    }
    if (hasSP(p, 'bigmacroad')) {                  // 빅맥로드: 가끔 맵에 빅맥이 떨어짐
      const sp = SP(p, 'bigmacroad');
      p.bmT = (p.bmT == null ? sp.every : p.bmT) - DT;
      if (p.bmT <= 0) {
        p.bmT = sp.every;
        if (room.bigmacs.filter((m) => m.owner === p.id).length < sp.max) {
          const ang = Math.random() * Math.PI * 2, d = 250 + Math.random() * 350;
          const tx = Math.max(60, Math.min(room.map.w - 60, p.x + Math.cos(ang) * d)), ty = Math.max(60, Math.min(room.map.h - 60, p.y + Math.sin(ang) * d));
          const s = freeSpot(room.map, tx, ty, 22, 80);
          if (!hitsWall(room.map, s.x, s.y, 22)) { room.bigmacs.push({ id: ++room.bmSeq, owner: p.id, x: s.x, y: s.y }); room.fx.push({ type: 'bigmacDrop', x: s.x, y: s.y }); }
        }
      }
      room.bigmacs = room.bigmacs.filter((m) => {
        if (m.owner !== p.id || Math.hypot(m.x - p.x, m.y - p.y) > B.radius + 22) return true;
        const h = heal(room, p, p, sp.heal); room.fx.push({ type: 'bigmacEat', id: p.id, x: m.x, y: m.y, v: Math.round(h) }); return false;
      });
    }
    if (hasSP(p, 'aura')) {                       // 아우라 파밍: 시간이 지나면 조금씩 → 가득 차면 폭발 + 모아이
      const sp = SP(p, 'aura');
      p.aura = Math.min(1, (p.aura || 0) + DT / sp.fill);
      if (p.aura >= 1) {
        p.aura = 0; const hits = [];
        for (const q of enemies(room, p)) if (Math.hypot(q.x - p.x, q.y - p.y) <= sp.range + q.B.radius) { damage(room, p, q, sp.dmg, now, 'aura'); hits.push(q.id); }
        room.fx.push({ type: 'aura', id: p.id, x: p.x, y: p.y, r: sp.range, hits });
        moaiOn(room, p, sp.moai);
      }
    }
    if (p.teths && p.teths.length) {              // 머리뜯기 연결 유지 (최대 2명)
      const A = B.attack;
      // 스파1 거지들: 적과 팀원을 동시에 잡고 있으면 피해·회복 2배
      const both = hasSP(p, 'geoji') && p.teths.some((T) => T.ally) && p.teths.some((T) => !T.ally);
      const mul = both ? 2 : 1;
      if (both && (!p.geojiT || now - p.geojiT > 6)) { p.geojiT = now; room.fx.push({ type: 'geoji', id: p.id, x: p.x, y: p.y }); }
      p.teths = p.teths.filter((T) => {
        const q = room.players.get(T.tid);
        T.t += DT; T.acc += DT;
        const ok = q && !q.dead && !q.out && p.stunT <= 0 && p.frozenT <= 0 && T.t < A.maxT
          && Math.hypot(q.x - p.x, q.y - p.y) <= A.breakRange && clearPath(room.map, p.x, p.y, q.x, q.y)
          && (T.ally ? !isEnemy(room, p, q) : isEnemy(room, p, q));
        if (!ok) { room.fx.push({ type: 'tethBreak', id: p.id, x: q ? q.x : p.x, y: q ? q.y : p.y }); return false; }
        while (T.acc >= A.tick) {
          T.acc -= A.tick;
          if (T.ally) chargeSuper(p, heal(room, p, q, A.heal * mul) * 0.5);
          else {
            const before = q.hp + (q.shield || 0);
            damage(room, p, q, A.dmg * mul, now, 'hair'); chargeSuper(p, A.dmg * mul);
            const dealt = Math.max(0, before - Math.max(0, q.hp) - (q.shield || 0));
            if (dealt > 0) { const h = Math.min(dealt * A.lifesteal, mhp(p) - p.hp); if (h > 0) p.hp += h; }   // 준 피해의 30% 회복
            if (q.dead) return false;
          }
        }
        return true;
      });
    }
    if (p.flailT > 0) {                          // 훠이훠이: 주위 적 계속 밀어냄, 처음 닿을 때 600
      p.flailT = Math.max(0, p.flailT - DT);
      const g = p.B.gadgets[0], rr = g.range * (hasSP(p, 'tall') ? SP(p, 'tall').mul : 1);
      for (const q of enemies(room, p)) {
        const dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1;
        if (d > rr + q.B.radius) continue;
        const nx = q.x + dx / d * g.push, ny = q.y + dy / d * g.push;
        if (!hitsWall(room.map, nx, ny, q.B.radius)) { q.x = nx; q.y = ny; }
        if (!p.flailHit.has(q.id)) { p.flailHit.add(q.id); damage(room, p, q, g.dmg, now, 'flail'); room.fx.push({ type: 'flailHit', x: q.x, y: q.y }); }
      }
    }
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
    if (now - p.lastHit > G.regenDelay && p.hp < mhp(p)) p.hp = Math.min(mhp(p), p.hp + mhp(p) * regen * DT);
    // 기어: 보호막 / 궁극기 자동 충전
    if (has(p, 'shield')) { if (p.hp >= mhp(p)) { p.fullT += DT; if (p.fullT >= 3) p.shield = 900; } else p.fullT = 0; }
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
    if (p.rootT > 0) p.rootT -= DT;
    if (p.stunT <= 0 && p.frozenT <= 0 && !p.ctrlId && !p.dash && !(p.rootT > 0)) {
      let { mx, my } = p.input;
      if (p.frictT > 0) { mx = Math.cos(p.frictA); my = Math.sin(p.frictA); }     // 마찰력 체험: 벽 쪽으로만 계속 걸어감
      else if (p.confT > 0 && Math.hypot(mx, my) > 0.1) {                        // 수면가루: 움직이면 아무 데로나
        if (!(p.confAT > now)) { p.confA = Math.random() * Math.PI * 2; p.confAT = now + 0.6; }
        mx = Math.cos(p.confA); my = Math.sin(p.confA);
      }
      const len = Math.hypot(mx, my);
      if (B.roll) rollMove(room, p, mx, my, len, now);
      else {
        if (len > 0.1) { mx /= len; my /= len; p.facing = Math.atan2(my, mx); } else { mx = 0; my = 0; }
        p.x += mx * speedOf(p) * DT;
        p.y += my * speedOf(p) * DT;
        if (p.flyT > 0) resolveWalls(flyMap(room.map), p, B.radius);     // 날 때는 블록 3칸 이상 쌓인 곳만 막힘
        else resolveWalls(room.map, p, B.radius);
      }
    }
    if (B.roll) { if (p.dead) continue; rollHits(room, p, now); }
    // 파워 큐브 줍기 (쇼다운)
    if (room.mode.sd && room.cubes.length) {
      room.cubes = room.cubes.filter((c) => {
        if (Math.hypot(c.x - p.x, c.y - p.y) > B.radius + 22) return true;
        // 듀오·트리오: 팀 전원이 같이 +1 (팀 공유)
        const team = room.mode.squad && p.team != null ? [...room.players.values()].filter((q) => !q.struct && !q.out && q.team === p.team) : [p];
        for (const q of team) addCube(q);
        room.fx.push({ type: 'cube', id: p.id, x: c.x, y: c.y, n: p.cubes }); return false;
      });
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
  if (room.bigmacs.length) room.bigmacs = room.bigmacs.filter((m) => { const o = room.players.get(m.owner); return o && hasSP(o, 'bigmacroad'); });
  domeStep(room);
  stepBullets(room, now);
  stepGD(room, now);
  if (room.ball && room.phase === 'play') stepBall(room);

  // 렉 줄이기: 시뮬레이션은 30Hz 그대로, 화면 상태는 20Hz로만 보냄 (fx는 쌓였다가 같이 감)
  room.sendN = (room.sendN || 0) + 1;
  if (room.sendN % 3 === 1 && room.phase !== 'queue') return;
  const r1 = (v) => Math.round(v);
  io.to(room.id).emit('state', {
    ts: Date.now(),          // 클라이언트 보간용 서버 시각
    mode: room.mode.id, map: room.map.id, phase: room.phase, phaseT: +room.phaseT.toFixed(1), queueT: room.phase === 'queue' ? Math.ceil(room.queueT) : undefined, cap: room.qBase ? roomCap(room) : undefined, nHum: room.phase === 'queue' ? humans(room).length : undefined, botD: room.phase === 'queue' || room.botLv ? +botLv(room).d.toFixed(2) : undefined,
    mapT: Math.ceil(room.mapT), playT: Math.floor(room.playT), result: room.result, fixed: true,
    safe: room.safe ? { x1: r1(room.safe.x1), y1: r1(room.safe.y1), x2: r1(room.safe.x2), y2: r1(room.safe.y2) } : null,
    gems: room.gems.map((g) => [g.id, r1(g.x), r1(g.y)]),
    cubes: room.cubes.length ? room.cubes.map((c) => [c.id, r1(c.x), r1(c.y)]) : undefined, sq: room.mode.squad || undefined,
    score: room.mode.id === 'gem' ? [teamGems(room, 0), teamGems(room, 1)] : room.mode.id === 'heist' ? safeScore(room) : room.mode.id === 'brawlball' ? room.score : room.mode.id === 'bounty' ? room.stars : room.mode.id === 'knockout' ? room.ko : null,
    roundT: room.mode.id === 'knockout' ? Math.floor(room.roundT || 0) : undefined,
    ball: room.ball ? [r1(room.ball.x), r1(room.ball.y), room.ball.holder] : null,
    hold: room.holdTeam >= 0 ? { team: room.holdTeam, t: +room.holdT.toFixed(1) } : null,
    shards: room.shards.map((s) => [s.id, r1(s.x), r1(s.y), s.r, 99]),
    bullets: room.bullets.map((b) => [b.id, r1(b.x), r1(b.y), +b.a.toFixed(2), b.kind, b.owner]),
    broken: room.map.walls.reduce((a, w, i) => (w.broken && a.push(i), a), []),
    blocks: room.map.walls.reduce((a, w, i) => (w.temp && !w.broken && a.push([i, r1(w.x), r1(w.y), w.w, w.h, w.stack, w.base]), a), []),
    players: [...room.players.values()].map((p) => slimP({
      id: p.id, name: p.name, b: p.B.id, color: p.color, bot: p.isBot, team: p.team,
      x: r1(p.x), y: r1(p.y), hp: r1(p.hp), mhp: p.home || p.form || p.cubeHp ? mhp(p) : undefined, cb: p.cubes || undefined, dead: p.dead, out: p.out, rank: p.rank, respawn: Math.ceil(p.respawnT),
      ammo: +(p.ammo + p.reloadT / p.B.attack.reload).toFixed(2), stun: p.stunT > 0, fz: p.frozenT > 0,
      gCd: +p.gCd.toFixed(2), sup: +p.sup.toFixed(3), f: +p.facing.toFixed(2),
      k: p.kills, d: p.deaths, say: p.speech ? p.speech.text : null,
      ctl: p.ctrlBy, ctrl: p.ctrlId, ctrlT: +(p.ctrlT || 0).toFixed(1), ac: +p.acT.toFixed(1),
      g: p.lo.g, sp: p.lo.sp, gear: p.lo.gears, sh: r1(p.shield), rf: +p.rf.toFixed(3), aj: Math.ceil(p.ajT), gems: p.gems,
      aw: p.aw, fear: +p.fear.toFixed(2), scared: +p.scaredT.toFixed(1), dash: !!p.dash, jj: jjang(p), na: +p.noAtkT.toFixed(1), fl: +p.flailT.toFixed(1), jail: +p.jailT.toFixed(1), s9: p.st9, nj: p.nextJoke, th: p.teths && p.teths.length ? p.teths.map((T) => T.tid) : undefined, spr: p.sprintT > 0 ? +p.sprintT.toFixed(1) : undefined, bty: room.mode.id === 'bounty' ? p.bounty : undefined, st: p.struct || undefined,
      cf: p.confT > 0 || undefined, bn: p.burnT > 0 || undefined, fr: p.frictT > 0 || undefined, flm: p.flameT > 0 ? 1 : undefined, spn: p.spinT > 0 ? 1 : undefined, pee: p.peeTo || undefined,
      fm: p.form, mo: p.moaiT > 0 ? +p.moaiT.toFixed(1) : undefined, inv: p.invT > 0 || undefined, up: p.spdUpT > 0 || undefined, sl: p.slowT > 0 || undefined,
      bl: p.blindT > 0 ? +p.blindT.toFixed(1) : undefined, ro: p.B.roll ? +(p.roll || 0).toFixed(2) : undefined, fly: p.flyT > 0 || undefined, gd: p.gd ? 1 : undefined, dance: p.danceT > 0 || undefined, dup: p.dmgUp > 0 ? +p.dmgUp.toFixed(2) : undefined, bst: p.boostT > 0 || undefined, muk: p.mukT > 0 || undefined, au: p.aura != null && hasSP(p, 'aura') ? +p.aura.toFixed(2) : undefined,
      ec: p.eyeT > 0 ? +p.eyeT.toFixed(1) : undefined, vu: p.visT > 0 ? +p.visT.toFixed(1) : undefined, sng: p.singT > 0 ? 1 : undefined, mk: p.marks && p.marks.length ? p.marks : undefined,
    })),
    dm: room.domes && room.domes.length ? room.domes.map((d) => [d.id, r1(d.x), r1(d.y), d.r, +d.t.toFixed(1), d.owner, d.team]) : undefined,
    bm: room.bigmacs.length ? room.bigmacs.map((m) => [m.id, r1(m.x), r1(m.y)]) : undefined,
    mice: room.mice.map((m) => ({ id: m.id, x: r1(m.x), y: r1(m.y), a: +m.ang.toFixed(2), c: m.color, hp: +(m.hp / m.maxHp).toFixed(2) })),
    fx: room.fx,
  });
  room.fx = [];
}

setInterval(() => { for (const room of rooms.values()) step(room); }, 1000 / TICK);
// 보낼 때 0·null·빈 배열은 빼서 (false는 남김: three.js visible에 undefined가 들어가면 보여버림) 크기 줄임 (클라가 숫자 필드는 0으로 다시 채움)
const P_KEEP = new Set(['id', 'name', 'b', 'team', 'x', 'y', 'hp', 'dead', 'out', 'color']);
function slimP(o) {
  for (const k in o) { const v = o[k]; if (P_KEEP.has(k)) continue; if (v === undefined || v === null || v === 0 || (Array.isArray(v) && !v.length)) delete o[k]; }
  return o;
}

// ── 접속자 목록 (로비에 있는 사람 + 플레이 중인 사람) ──
const online = new Map();   // socket.id → { name, key, status, mode, brawler }
let onlineDirty = false;
// ── 친선 전투 (파티): 게임 시작 전에 로비에서 팀을 짜서 같이 입장 ──
// 브라우저 탭마다 cid로 구분 → 새로고침해도 파티 유지 (60초 안에 다시 오면)
// 자리(slots): 팀 모드는 [블루 ×팀인원, 레드 ×팀인원], 쇼다운은 6자리. 각 자리 = 사람(cid) / 'ai' / 'off'(비활성)
const parties = new Map();        // pid → { id, code, leader, members, mode, map, slots }
const cidParty = new Map();       // cid → pid
let partySeq = 0;
let qSeq = 0;
const SHARED = (m) => m === 'ffa' || m === 'double';      // 난투·더블 가젯은 모두 같은 방 (초대 없이도)
const slotCount = (m) => { const M = MODES[m]; return M.team ? M.teamSize * 2 : M.size || 0; };
const partyMax = (pt) => Math.max(6, slotCount(pt.mode));
const sidOfCid = (cid) => { for (const [sid, o] of online) if (o.cid === cid) return sid; return null; };
const nameOfCid = (cid) => { const sid = sidOfCid(cid); return sid ? online.get(sid).name : null; };
function newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c; do { c = ''; for (let i = 0; i < 6; i++) c += A[Math.floor(Math.random() * A.length)]; } while ([...parties.values()].some((p) => p.code === c)); return c; }
function makeParty(leaderCid, mode, map, kind = 'team') {
  const pt = { kind, id: 'pt' + ++partySeq, code: newCode(), leader: leaderCid, members: [leaderCid], mode: MODES[mode] && !MODES[mode].training ? mode : 'gem', map: map || 'random', slots: [] };
  parties.set(pt.id, pt); cidParty.set(leaderCid, pt.id); layoutSlots(pt);
  return pt;
}
// 모드가 바뀌면 자리 다시 짜기 (사람들은 원래 팀 최대한 유지)
function layoutSlots(pt) {
  const n = slotCount(pt.mode), M = MODES[pt.mode], old = pt.slots || [];
  const half = M.team ? M.teamSize : n;
  const prevTeam = (c) => { const i = old.indexOf(c); return i < 0 ? 0 : M.team && old.length && i >= old.length / 2 ? 1 : 0; };
  const slots = new Array(n).fill('ai');
  for (const c of pt.members) {
    const want = prevTeam(c), order = M.team ? [want, 1 - want] : [0];
    let put = false;
    for (const t of order) { const st = M.team ? t * half : 0, en = M.team ? st + half : n; for (let i = st; i < en; i++) if (slots[i] === 'ai') { slots[i] = c; put = true; break; } if (put) break; }
  }
  pt.slots = slots;
}
function putInSlot(pt, cid) {
  if (!slotCount(pt.mode)) return true;
  let i = pt.slots.indexOf('ai'); if (i < 0) i = pt.slots.indexOf('off');
  if (i < 0) return false;
  pt.slots[i] = cid; return true;
}
function partyInfo(pt) {
  const M = MODES[pt.mode];
  return {
    id: pt.id, code: pt.code, mode: pt.mode, map: pt.map, kind: pt.kind, shared: SHARED(pt.mode), team: !!M.team, half: M.team ? M.teamSize : 0, sq: M.squad || 0,
    members: pt.members.map((c) => ({ cid: c, name: nameOfCid(c) || '(접속 끊김)', leader: c === pt.leader, on: !!sidOfCid(c) })),
    slots: pt.slots.map((v) => v === 'ai' || v === 'off' ? { k: v } : { k: 'p', cid: v, name: nameOfCid(v) || '(접속 끊김)', leader: v === pt.leader, on: !!sidOfCid(v) }),
  };
}
function partySync(pt) {
  for (const c of pt.members) { const sid = sidOfCid(c); if (sid) io.to(sid).emit('party', partyInfo(pt)); }
}
function partyJoin(pt, cid) {
  if (cidParty.get(cid) === pt.id) return 'ok';
  if (pt.members.length >= partyMax(pt)) return '팀이 꽉 찼어요';
  if (slotCount(pt.mode) && !pt.slots.some((v) => v === 'ai' || v === 'off')) return '빈자리가 없어요';
  partyLeave(cid);
  pt.members.push(cid); cidParty.set(cid, pt.id); putInSlot(pt, cid);
  partySync(pt); return 'ok';
}
function partyLeave(cid) {
  const pid = cidParty.get(cid); if (!pid) return;
  cidParty.delete(cid);
  const pt = parties.get(pid); if (!pt) return;
  pt.members = pt.members.filter((c) => c !== cid);
  pt.slots = pt.slots.map((v) => (v === cid ? 'ai' : v));
  const sid = sidOfCid(cid); if (sid) io.to(sid).emit('party', null);
  if (!pt.members.length) { parties.delete(pid); return; }
  if (pt.leader === cid) pt.leader = pt.members[0];
  partySync(pt);
}
const leaveTimers = new Map();

function onlineList(selfId) {
  return [...online.entries()].map(([sid, o]) => ({
    sid, me: sid === selfId, name: o.name, guest: !o.key, trophies: o.key ? auth.trophiesOf(o.key) : null,
    status: o.status, mode: o.mode, modeName: o.mode && MODES[o.mode] ? MODES[o.mode].icon + ' ' + MODES[o.mode].name : null,
    mapName: o.map && MAPS[o.map] ? MAPS[o.map].name : null, rid: o.rid && parseRid(o.rid) ? o.rid : null,
    brawler: o.brawler && BRAWLERS[o.brawler] ? BRAWLERS[o.brawler].name : null,
  })).sort((a, b) => (a.status === b.status ? 0 : a.status === 'game' ? -1 : 1) || (b.trophies || 0) - (a.trophies || 0));
}
setInterval(() => { if (onlineDirty) { onlineDirty = false; io.emit('onlineCount', online.size); } }, 1000);

// ── 소켓 ───────────────────────────────────────────
io.on('connection', (socket) => {
  let room = null;
  // 로비에 들어오면 바로 접속자로 등록
  socket.on('hello', ({ token, cid, gname } = {}) => {
    const acc = auth.userFromToken(token);
    const o = online.get(socket.id) || { status: 'lobby' };
    Object.assign(o, { name: acc ? acc.u.name : (typeof gname === 'string' && gname ? gname.slice(0, 10) : '게스트'), key: acc ? acc.key : null });
    if (typeof cid === 'string' && cid.length >= 8) {
      o.cid = cid.slice(0, 40);
      clearTimeout(leaveTimers.get(o.cid)); leaveTimers.delete(o.cid);
      const pt = parties.get(cidParty.get(o.cid));
      setTimeout(() => { if (pt && parties.has(pt.id)) partySync(pt); }, 50);
    }
    online.set(socket.id, o); onlineDirty = true;
    socket.emit('onlineCount', online.size);
  });
  // 관전: 로비에서 게임 중인 사람 방을 구경 (플레이어로는 안 들어감)
  let specRid = null;
  socket.on('spectate', ({ sid } = {}, cb) => {
    const done = typeof cb === 'function' ? cb : () => {};
    if (room) return done({ ok: false, msg: '게임 중엔 관전할 수 없어요' });
    const t = online.get(sid), r = t && t.rid && rooms.get(t.rid);
    if (!r || !r.players.has(sid)) return done({ ok: false, msg: '그 사람은 지금 게임 중이 아니에요' });
    if (specRid) socket.leave(specRid);
    specRid = r.id; socket.join(r.id);
    const oe = online.get(socket.id); if (oe) { oe.status = 'spec'; onlineDirty = true; }
    done({ ok: true });
    socket.emit('joined', { id: null, mode: r.mode.id, spec: true, follow: sid });
  });
  socket.on('online', (cb) => { if (typeof cb === 'function') cb(onlineList(socket.id)); });
  socket.on('profile', (name, cb) => {      // 플레이어 프로필 보기
    if (typeof cb !== 'function') return;
    const pr = auth.profileOf(name); if (!pr) return cb(null);
    const { key, ...rest } = pr; let on = null;
    for (const o of online.values()) if (o.key === key) on = o;
    cb({ ...rest, online: !!on, status: on ? on.status : null });
  });
  socket.on('players', (cb) => {      // 가입한 전체 플레이어 (트로피 순) + 지금 접속 중인지 → 로비 순위표·플레이어 목록
    if (typeof cb !== 'function') return;
    const on = new Map(); for (const o of online.values()) if (o.key) on.set(o.key, o);
    cb(auth.allUsers().map(({ key, ...u }) => {
      const o = on.get(key);
      return { ...u, online: !!o, status: o ? o.status : null, modeName: o && o.mode && MODES[o.mode] ? MODES[o.mode].icon + ' ' + MODES[o.mode].name : null };
    }).sort((a, b) => b.trophies - a.trophies || b.lastSeen - a.lastSeen));
  });
  // 초대: 내가 게임 중이면 지금 방으로, 로비면 내가 고른 모드·맵으로
  const meO = () => online.get(socket.id) || {};
  const myParty = () => { const o = meO(); return o.cid ? parties.get(cidParty.get(o.cid)) : null; };
  const inLobby = () => !room && meO().status === 'lobby';
  socket.on('partyCreate', ({ mode, map } = {}) => {      // 친선 전투 팀 만들기
    const o = meO(); if (!o.cid || !inLobby()) return;
    if (myParty()) { const pt = myParty(); if (pt.leader === o.cid) pt.kind = 'friendly'; return partySync(pt); }
    partySync(makeParty(o.cid, mode, map, 'friendly'));
  });
  socket.on('partyCode', ({ code } = {}, cb) => {         // 팀 코드로 참가
    const o = meO(), done = (r) => typeof cb === 'function' && cb(r);
    if (!o.cid || !inLobby()) return done({ ok: false, msg: '로비에서만 참가할 수 있어요' });
    const pt = [...parties.values()].find((p) => p.code === String(code || '').trim().toUpperCase());
    if (!pt) return done({ ok: false, msg: '그런 팀 코드는 없어요' });
    const r = partyJoin(pt, o.cid); done(r === 'ok' ? { ok: true } : { ok: false, msg: r });
  });
  socket.on('invite', ({ to, mode, map } = {}, cb) => {
    const o = meO(), tgt = online.get(to);
    const done = (r) => typeof cb === 'function' && cb(r);
    if (!o.cid || !tgt || to === socket.id || !tgt.cid) return done({ ok: false, msg: '그 사람은 지금 접속해 있지 않아요' });
    if (!inLobby()) return done({ ok: false, msg: '로비에서만 초대할 수 있어요' });
    if (tgt.status !== 'lobby') return done({ ok: false, msg: '그 사람은 지금 게임 중이에요' });
    let pt = myParty();
    if (!pt) { pt = makeParty(o.cid, mode, map); partySync(pt); }     // 팀이 없으면 바로 만들어서 초대
    if (pt.members.includes(tgt.cid)) return done({ ok: false, msg: '이미 같은 팀이에요' });
    const M = MODES[pt.mode];
    io.to(to).emit('invited', { from: o.name, pid: pt.id, kind: pt.kind, modeName: M.icon + ' ' + M.name, mapName: '오늘의 맵 ' + MAPS[todayMap(pt.mode)].name });
    done({ ok: true });
  });
  socket.on('inviteAccept', ({ pid } = {}) => {
    const o = meO(); if (!o.cid || !inLobby()) return;
    const pt = parties.get(pid);
    if (!pt) return socket.emit('partyMsg', '그 팀은 이미 없어졌어요');
    if (pt.room) { const lo = online.get(sidOfCid(pt.leader)); if (lo && lo.status === 'game') return socket.emit('partyMsg', '이미 게임을 시작했어요. 끝나면 다시 초대받아 주세요'); }
    const r = partyJoin(pt, o.cid); if (r !== 'ok') socket.emit('partyMsg', r);
  });
  socket.on('partySlot', ({ idx, act } = {}) => {        // 자리: move(내가 이 자리로) / off(비활성화) / ai(AI 켜기)
    const o = meO(), pt = myParty(); if (!pt || !inLobby()) return;
    const v = pt.slots[idx]; if (v == null) return;
    if (act === 'move' && (v === 'ai' || v === 'off')) { pt.slots = pt.slots.map((x) => (x === o.cid ? 'ai' : x)); pt.slots[idx] = o.cid; }
    else if ((act === 'off' || act === 'ai') && pt.leader === o.cid && (v === 'ai' || v === 'off')) pt.slots[idx] = act;
    else return;
    partySync(pt);
  });
  socket.on('partyLeave', () => { const o = meO(); if (o.cid) partyLeave(o.cid); });
  socket.on('partyKind', ({ kind } = {}) => {          // 방장: 일반 전투 팀 ↔ 친선 전투
    const o = meO(), pt = myParty();
    if (!pt || pt.leader !== o.cid || !inLobby() || !['team', 'friendly'].includes(kind)) return;
    pt.kind = kind; partySync(pt);
  });
  socket.on('partySel', ({ mode, map } = {}) => {      // 방장이 모드·맵 바꾸면 모두에게
    const o = meO(), pt = myParty();
    if (!pt || pt.leader !== o.cid || !MODES[mode] || MODES[mode].training) return;
    const changed = pt.mode !== mode;
    pt.mode = mode; pt.map = MODES[mode].maps.includes(map) ? map : 'random';
    if (changed) layoutSlots(pt);
    partySync(pt);
  });
  const me = () => room && room.players.get(socket.id);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  const puppetOr = (p) => (p.ctrlId && room.players.get(p.ctrlId)) || p;   // 조종 중이면 꼭두각시가 행동
  socket.on('join', ({ token, brawler, mode, map, rid: wantRid, loadout } = {}) => {
    if (room) return;
    if (specRid) { socket.leave(specRid); specRid = null; }
    const oe = online.get(socket.id) || {};
    const pt = oe.cid && parties.get(cidParty.get(oe.cid));
    if (pt && pt.leader !== oe.cid && !(wantRid && wantRid === pt.room)) return socket.emit('partyMsg', '방장이 시작하면 같이 들어가요');
    let modeId = MODES[mode] ? mode : 'ffa', rid, fixed = null;
    if (pt && pt.leader === oe.cid && SHARED(pt.mode)) {        // 방장 + 난투/더블 가젯: 모두 쓰는 공용 방으로 같이
      modeId = pt.mode; rid = modeId; pt.room = rid;
    } else if (pt && pt.leader === oe.cid && pt.kind !== 'friendly' && !MODES[pt.mode].training) {   // 방장 + 일반 전투 팀: 친구들이랑 같이 매칭 (트로피 있음)
      modeId = pt.mode; fixed = null;   // 맵은 오늘의 맵 (매일 0시에 바뀜)
      const base = ridFor(modeId, fixed), n = pt.members.filter((c) => sidOfCid(c)).length;
      const qr = [...rooms.values()].find((r) => r.qBase === base && r.phase === 'queue' && roomCap(r) - humans(r).length >= n);
      rid = qr ? qr.id : base + '#q' + (++qSeq).toString(36);
      pt.room = rid;
    } else if (pt && pt.leader === oe.cid) {                    // 방장: 친선 전투 전용 새 방 (처음부터 같이 시작)
      modeId = pt.mode; fixed = null;   // 맵은 오늘의 맵 (매일 0시에 바뀜)
      rid = ridFor(modeId, fixed) + '#' + pt.id + '_' + Date.now().toString(36);
      pt.room = rid;
    } else if (pt && wantRid === pt.room && rooms.has(wantRid)) {   // 파티원: 방장이 만든 방으로
      rid = wantRid; modeId = rooms.get(rid).mode.id; fixed = rooms.get(rid).fixedMap;
    } else if (MODES[modeId].training) rid = 'training:' + socket.id;                          // 훈련장은 혼자만
    else if (SHARED(modeId)) rid = modeId;                                                     // 난투·더블 가젯: 맵 상관없이 다 같은 방
    else {                                                                                     // 매칭: 같은 모드(·맵)에서 사람 기다리는 방이 있으면 거기로, 없으면 새 대기방
      fixed = null;   // 맵은 고를 수 없음: 오늘의 맵
      const base = ridFor(modeId, fixed);
      const qr = [...rooms.values()].find((r) => r.qBase === base && r.phase === 'queue' && humans(r).length < roomCap(r));
      rid = qr ? qr.id : base + '#q' + (++qSeq).toString(36);
    }
    const fresh = !rooms.has(rid);
    room = getRoom(modeId, rid, fixed);
    if (fresh && rid.includes('#q')) { room.qBase = ridFor(modeId, fixed); room.phase = 'queue'; room.queueT = QUEUE_T; }
    if (pt && pt.kind === 'friendly' && rid.includes('#' + pt.id) && fresh) {            // 친선 전투 설정: 자리별 팀 / AI 수
      const M = room.mode, half = M.team ? M.teamSize : 0, teamOf = {}, ai = [0, 0], slotOf = {};
      pt.slots.forEach((v, i) => { const t = M.team ? (i < half ? 0 : 1) : 0; if (v === 'ai') ai[t]++; else if (v !== 'off') { teamOf[v] = t; slotOf[v] = i; } });
      room.partyCfg = { teamOf, ai, slotOf };        // 듀오·트리오: 자리 번호 / 팀 인원 = 같은 팀
    }
    const bid = BRAWLERS[brawler] && !BRAWLERS[brawler].wip ? brawler : 'jungbo';
    const acc = auth.userFromToken(token);                     // 로그인 안 했으면 게스트
    const p = newPlayer(room, socket.id, acc ? acc.u.name : '게스트' + Math.floor(1000 + Math.random() * 9000), false, bid, loadout);
    if (acc) p.userKey = acc.key;
    p.cid = oe.cid; p.grp = pt ? pt.id : null;          // 같이 온 친구 묶음 (같은 팀으로)
    if (room.mode.team) {
      if (room.partyCfg) p.team = room.partyCfg.teamOf[oe.cid] || 0;        // 친선 전투: 로비에서 고른 자리의 팀
      else {
        const mate = pt && humans(room).find((q) => q.grp === pt.id);
        p.team = mate && humans(room).filter((q) => q.team === mate.team).length < room.mode.teamSize ? mate.team : teamCount(room, 0) <= teamCount(room, 1) ? 0 : 1;
      }
      p.color = TEAM_COLORS[p.team];
      const bot = !room.partyCfg && [...room.players.values()].find((q) => q.isBot && !q.struct && q.team === p.team);   // 봇 자리를 대신 차지
      if (bot) removeBot(room, bot);
    }
    room.players.set(socket.id, p);
    if (room.phase === 'queue') resetBody(room, p, humans(room).length - 1);
    else if (fresh && room.mode.rounds) startRound(room);
    else if (!room.mode.respawn && room.phase !== 'wait') { p.out = true; p.dead = true; p.rank = 0; }   // 쇼다운·녹아웃 진행 중이면 관전
    else resetBody(room, p, Math.floor(Math.random() * 8));
    socket.join(room.id);
    socket.emit('joined', { id: socket.id, mode: room.mode.id });
    online.set(socket.id, Object.assign(oe, { name: p.name, key: p.userKey || null, status: 'game', mode: room.mode.id, brawler: bid, rid: room.id, map: room.map.id })); onlineDirty = true;
    if (pt && pt.leader === oe.cid) for (const c of pt.members) {     // 파티원들 같이 입장
      if (c === oe.cid) continue; const sid = sidOfCid(c); if (sid) io.to(sid).emit('partyGo', { rid });
    }
  });
  socket.on('gdCrash', (d) => {          // 지메 세계에서 탈락 (클라가 몇 초에 탈락했는지 알려 줌)
    const p = me(); if (!p || !p.gd || !room.gds || !room.gds[p.gd]) return;
    const g = room.gds[p.gd], el = Date.now() / 1000 - g.t0;
    if (g.crash[p.id] == null) g.crash[p.id] = Math.max(0, Math.min(+(d && d.t) || el, el + 0.5));
  });
  // 핀(머리 위 말풍선)·스프레이(바닥 낙서). 종류는 클라가 정함(번호만 받음). 도배 막는 쿨타임: 핀 2.5초, 스프레이 6초
  const emoCd = { pin: 0, spray: 0 };
  socket.on('emote', (x) => {
    const p = me(); if (!p || p.dead || p.out || p.gd || !x || typeof x !== 'object') return;
    const k = x.k === 'spray' ? 'spray' : 'pin', i = x.i | 0, now = Date.now();
    if (i < 0 || i > 40 || now < emoCd[k]) return;
    emoCd[k] = now + (k === 'pin' ? 2500 : 6000);
    if (k === 'pin') room.fx.push({ type: 'pin', id: p.id, x: p.x, y: p.y, i });
    else { const s0 = { x: p.x + Math.cos(p.facing || 0) * 70, y: p.y + Math.sin(p.facing || 0) * 70 }; resolveWalls(room.map, s0, 20); room.fx.push({ type: 'spray', id: p.id, x: s0.x, y: s0.y, i }); }
  });
  socket.on('startNow', () => { if (room && room.phase === 'queue') room.startReq = true; });   // 매칭 대기 → 바로 시작 (빈자리는 봇)
  socket.on('input', (inp) => {
    const p = me();
    if (!p || !inp || p.ctrlBy) return;
    p.input.mx = Math.max(-1, Math.min(1, +inp.mx || 0));
    p.input.my = Math.max(-1, Math.min(1, +inp.my || 0));
  });
  // 조종 중이면 공격·가젯·궁극기 모두 꼭두각시의 스킬로
  socket.on('attack', (x) => {   // 숫자(각도) 또는 { a: 각도, d: 거리 비율 0~1 }
    const p = me(); if (!p || p.ctrlBy) return;
    const o = x && typeof x === 'object' ? x : { a: x };
    doAttack(room, puppetOr(p), num(o.a), Date.now() / 1000, num(o.d));
  });
  socket.on('gadget', (x) => { const p = me(); if (!p || p.ctrlBy) return; const o = x && typeof x === 'object' ? x : { n: x }; doGadget(room, puppetOr(p), o.n === 2 ? 2 : 1, Date.now() / 1000, { a: num(o.a), d: num(o.d) }); });
  socket.on('super', (x) => { const p = me(); if (!p || p.ctrlBy) return; const o = x && typeof x === 'object' ? x : { a: x }; doSuper(room, puppetOr(p), num(o.a), Date.now() / 1000, Number.isInteger(o.c) ? o.c : undefined); });
  socket.on('addBot', () => {
    if (!room || (room.mode.rounds && room.mode.id !== 'ffa') || room.mode.training) return;         // 라운드 모드는 자동으로 채움 (난투는 직접 추가)
    const bots = [...room.players.values()].filter((p) => p.isBot).length;
    if (room.players.size >= G.maxPlayers || bots >= G.maxBots) return;
    resetBody(room, addBot(room));
  });
  socket.on('clearBots', () => {
    if (!room || (room.mode.rounds && room.mode.id !== 'ffa') || room.mode.training) return;
    for (const p of [...room.players.values()]) if (p.isBot) removeBot(room, p);
  });
  socket.on('disconnect', () => {
    const oe = online.get(socket.id);
    if (oe && oe.cid && cidParty.has(oe.cid)) {      // 60초 안에 안 돌아오면 파티에서 빠짐
      const c = oe.cid; clearTimeout(leaveTimers.get(c));
      leaveTimers.set(c, setTimeout(() => { leaveTimers.delete(c); if (!sidOfCid(c)) partyLeave(c); }, 60000));
    }
    if (online.delete(socket.id)) onlineDirty = true;
    if (!room) return;
    const p = me(); if (p) { releaseCtrl(room, p, false); if (p.gems) dropGems(room, p); }
    if (p && room.phase === 'play' && !room.mode.rotate && room.mode.id !== 'ffa' && !p.out) {    // 게임 도중 나가면 패배 처리 (쇼다운은 지금 등수)
      if (room.mode.sd) matchTrophies(room, p, null, Math.max(1, sdGroups(room).filter((x) => x.alive).length));
      else matchTrophies(room, p, 'loss');
    }
    room.players.delete(socket.id);
    if (!humans(room).length) { io.to(room.id).emit('specEnd'); rooms.delete(room.id); }
    else if (room.mode.id === 'gem' && room.phase === 'play' && p) addBot(room, p.team) && resetBody(room, [...room.players.values()].pop());
  });
});

auth.load().then(() => server.listen(PORT, () => console.log(`호수중 브롤 서버 실행: http://localhost:${PORT}`)));
