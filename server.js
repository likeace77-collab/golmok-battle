// 정보쌤 브롤 - 실시간 온라인 대전 서버 (Node + socket.io, 서버 권한 방식)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', 'three', 'build')));
const PORT = process.env.PORT || 3000;

const TICK = 30;
const DT = 1 / TICK;

// ── 맵 ─────────────────────────────────────────────
const MAP = {
  w: 1600, h: 1200,
  walls: [
    { x: 300, y: 250, w: 220, h: 60 },
    { x: 1080, y: 250, w: 220, h: 60 },
    { x: 300, y: 890, w: 220, h: 60 },
    { x: 1080, y: 890, w: 220, h: 60 },
    { x: 740, y: 520, w: 120, h: 160 },
    { x: 140, y: 560, w: 60, h: 80 },
    { x: 1400, y: 560, w: 60, h: 80 },
    { x: 700, y: 120, w: 200, h: 50 },
    { x: 700, y: 1030, w: 200, h: 50 },
  ],
};

// ── 정보쌤 스탯 ────────────────────────────────────
const C = {
  radius: 28, speed: 250, maxHp: 4200,
  // 기본공격: 아~ 이놈의 아이들 (재키처럼 주변 광역)
  atkRange: 150, atkDmg: 1000, maxAmmo: 3, reload: 1.5, atkCd: 0.45,
  // 가젯1: AI야? 시키지도 않은걸 하네 (주변 스턴)
  g1Range: 260, g1Stun: 1.6, g1Dmg: 300,
  // 가젯2: 마우스 소환
  mouseHp: 1200, mouseSpeed: 320, mouseDmg: 260, mouseBiteCd: 0.6, mouseLife: 8, mouseRadius: 16, mouseCount: 2,
  gadgetCd: 6, gadgetUses: 3,
  respawn: 3, regenDelay: 3, regenRate: 0.13,
};

const LINES = {
  atk: ['아~ 이놈의 아이들!', '아~ 이놈의 아이들', '조용히 해라~', '자리에 앉아!'],
  g1: ['AI야? 시키지도 않은 걸 하네', 'AI야?? 시키지도 않은 걸 하네!'],
  g2: ['마우스 소환!', '가라, 무선마우스!'],
  kill: ['수행평가 0점', '교무실로 와', '벌점!'],
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const COLORS = ['#4f8cff', '#ff5d5d', '#3ccf7a', '#ffb02e', '#b56cff', '#22c3c3', '#ff7ac6', '#a0a0a0'];

const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, { id, players: new Map(), mice: [], fx: [], mouseSeq: 0, botSeq: 0, colorIdx: 0 });
  return rooms.get(id);
}

function hitsWall(x, y, r) {
  if (x < r || y < r || x > MAP.w - r || y > MAP.h - r) return true;
  return MAP.walls.some((w) => {
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  });
}

function resolveWalls(o, r) {
  o.x = Math.max(r, Math.min(MAP.w - r, o.x));
  o.y = Math.max(r, Math.min(MAP.h - r, o.y));
  for (const w of MAP.walls) {
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

function randomSpawn() {
  for (let i = 0; i < 200; i++) {
    const x = 60 + Math.random() * (MAP.w - 120);
    const y = 60 + Math.random() * (MAP.h - 120);
    if (!hitsWall(x, y, C.radius + 10)) return { x, y };
  }
  return { x: 80, y: 80 };
}

function newPlayer(room, id, name, isBot) {
  const s = randomSpawn();
  return {
    id, name: (name || '정보쌤').slice(0, 10), isBot,
    color: COLORS[room.colorIdx++ % COLORS.length],
    x: s.x, y: s.y, hp: C.maxHp,
    ammo: C.maxAmmo, reloadT: 0, atkCd: 0,
    stunT: 0, g1Uses: C.gadgetUses, g2Uses: C.gadgetUses, gCd: 0,
    lastHit: 0, dead: false, respawnT: 0,
    kills: 0, deaths: 0,
    input: { mx: 0, my: 0 }, speech: null,
    bot: isBot ? { wanderX: 0, wanderY: 0, wanderT: 0, think: 0 } : null,
  };
}

function say(p, text, t = 1.6) { p.speech = { text, t }; }

function damage(room, attacker, target, dmg, now) {
  if (target.dead) return;
  target.hp -= dmg;
  target.lastHit = now;
  room.fx.push({ type: 'dmg', x: target.x, y: target.y - 40, v: dmg });
  if (target.hp <= 0) {
    target.hp = 0; target.dead = true; target.respawnT = C.respawn; target.deaths++;
    target.speech = null;
    if (attacker && attacker.id !== target.id) { attacker.kills++; if (Math.random() < 0.5) say(attacker, pick(LINES.kill)); }
    room.fx.push({ type: 'kill', a: attacker ? attacker.name : '?', b: target.name });
    room.mice = room.mice.filter((m) => m.owner !== target.id);
  }
}

function canAct(p) { return !p.dead && p.stunT <= 0; }

function doAttack(room, p, now) {
  if (!canAct(p) || p.ammo < 1 || p.atkCd > 0) return;
  p.ammo -= 1; p.atkCd = C.atkCd; p.lastHit = Math.max(p.lastHit, now - C.regenDelay + 1);
  room.fx.push({ type: 'pulse', id: p.id, x: p.x, y: p.y, r: C.atkRange, c: p.color });
  if (Math.random() < 0.45) say(p, pick(LINES.atk), 1.2);
  for (const q of room.players.values()) {
    if (q.id === p.id || q.dead) continue;
    if (Math.hypot(q.x - p.x, q.y - p.y) <= C.atkRange + C.radius) damage(room, p, q, C.atkDmg, now);
  }
  for (const m of room.mice) {
    if (m.owner === p.id) continue;
    if (Math.hypot(m.x - p.x, m.y - p.y) <= C.atkRange + C.mouseRadius) m.hp -= C.atkDmg;
  }
}

function doGadget(room, p, n, now) {
  if (!canAct(p) || p.gCd > 0) return;
  if (n === 1) {
    if (p.g1Uses <= 0) return;
    p.g1Uses--; p.gCd = C.gadgetCd;
    say(p, pick(LINES.g1), 2);
    const hits = [];
    room.fx.push({ type: 'stun', id: p.id, x: p.x, y: p.y, r: C.g1Range, hits });
    for (const q of room.players.values()) {
      if (q.id === p.id || q.dead) continue;
      if (Math.hypot(q.x - p.x, q.y - p.y) <= C.g1Range + C.radius) {
        hits.push(q.id);
        q.stunT = Math.max(q.stunT, C.g1Stun);
        damage(room, p, q, C.g1Dmg, now);
      }
    }
  } else if (n === 2) {
    if (p.g2Uses <= 0) return;
    p.g2Uses--; p.gCd = C.gadgetCd;
    say(p, pick(LINES.g2), 1.6);
    for (let i = 0; i < C.mouseCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const m = {
        id: ++room.mouseSeq, owner: p.id, color: p.color,
        x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40,
        hp: C.mouseHp, life: C.mouseLife, biteCd: 0, ang: a,
      };
      resolveWalls(m, C.mouseRadius);
      room.mice.push(m);
    }
    room.fx.push({ type: 'summon', id: p.id, x: p.x, y: p.y });
  }
}

function botThink(room, p, now) {
  const b = p.bot;
  let target = null, best = Infinity;
  for (const q of room.players.values()) {
    if (q.id === p.id || q.dead) continue;
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < best) { best = d; target = q; }
  }
  b.wanderT -= DT;
  if (target && best < 650) {
    const dx = target.x - p.x, dy = target.y - p.y, d = best || 1;
    const jitter = Math.sin(now * 3 + p.x) * 0.4;
    p.input.mx = dx / d - (dy / d) * jitter;
    p.input.my = dy / d + (dx / d) * jitter;
    if (best < C.atkRange + 10 && Math.random() < 0.18) doAttack(room, p, now);
    if (best < C.g1Range - 40 && Math.random() < 0.01) doGadget(room, p, 1, now);
    if (best < 500 && Math.random() < 0.006) doGadget(room, p, 2, now);
    if (p.hp < C.maxHp * 0.3 && Math.random() < 0.5) { p.input.mx *= -1; p.input.my *= -1; }
  } else {
    if (b.wanderT <= 0) {
      const a = Math.random() * Math.PI * 2;
      b.wanderX = Math.cos(a); b.wanderY = Math.sin(a); b.wanderT = 1 + Math.random() * 2;
    }
    p.input.mx = b.wanderX * 0.6; p.input.my = b.wanderY * 0.6;
  }
}

function step(room) {
  const now = Date.now() / 1000;
  for (const p of room.players.values()) {
    if (p.speech) { p.speech.t -= DT; if (p.speech.t <= 0) p.speech = null; }
    if (p.dead) {
      p.respawnT -= DT;
      if (p.respawnT <= 0) {
        const s = randomSpawn();
        Object.assign(p, { x: s.x, y: s.y, hp: C.maxHp, dead: false, ammo: C.maxAmmo, stunT: 0 });
      }
      continue;
    }
    if (p.isBot) botThink(room, p, now);
    p.atkCd = Math.max(0, p.atkCd - DT);
    p.gCd = Math.max(0, p.gCd - DT);
    p.stunT = Math.max(0, p.stunT - DT);
    if (p.ammo < C.maxAmmo) {
      p.reloadT += DT;
      if (p.reloadT >= C.reload) { p.ammo++; p.reloadT = 0; }
    } else p.reloadT = 0;
    if (now - p.lastHit > C.regenDelay && p.hp < C.maxHp) p.hp = Math.min(C.maxHp, p.hp + C.maxHp * C.regenRate * DT);

    if (p.stunT <= 0) {
      let { mx, my } = p.input;
      const len = Math.hypot(mx, my);
      if (len > 1) { mx /= len; my /= len; }
      p.x += mx * C.speed * DT;
      p.y += my * C.speed * DT;
      resolveWalls(p, C.radius);
    }
  }

  // 마우스(소환수)
  for (const m of room.mice) {
    m.life -= DT; m.biteCd = Math.max(0, m.biteCd - DT);
    let target = null, best = 700;
    for (const q of room.players.values()) {
      if (q.id === m.owner || q.dead) continue;
      const d = Math.hypot(q.x - m.x, q.y - m.y);
      if (d < best) { best = d; target = q; }
    }
    if (target) {
      const dx = target.x - m.x, dy = target.y - m.y, d = best || 1;
      m.ang = Math.atan2(dy, dx);
      if (d > C.radius + C.mouseRadius) {
        m.x += (dx / d) * C.mouseSpeed * DT;
        m.y += (dy / d) * C.mouseSpeed * DT;
        resolveWalls(m, C.mouseRadius);
      } else if (m.biteCd <= 0) {
        m.biteCd = C.mouseBiteCd;
        damage(room, room.players.get(m.owner), target, C.mouseDmg, now);
        room.fx.push({ type: 'click', x: target.x, y: target.y });
      }
    } else {
      const owner = room.players.get(m.owner);
      if (owner && Math.hypot(owner.x - m.x, owner.y - m.y) > 70) {
        const dx = owner.x - m.x, dy = owner.y - m.y, d = Math.hypot(dx, dy);
        m.ang = Math.atan2(dy, dx);
        m.x += (dx / d) * C.mouseSpeed * 0.7 * DT;
        m.y += (dy / d) * C.mouseSpeed * 0.7 * DT;
        resolveWalls(m, C.mouseRadius);
      }
    }
  }
  room.mice = room.mice.filter((m) => m.life > 0 && m.hp > 0 && room.players.has(m.owner));

  const r1 = (v) => Math.round(v);
  io.to(room.id).emit('state', {
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, color: p.color, bot: p.isBot,
      x: r1(p.x), y: r1(p.y), hp: r1(p.hp), dead: p.dead, respawn: Math.ceil(p.respawnT),
      ammo: p.ammo + p.reloadT / C.reload, stun: p.stunT > 0,
      g1: p.g1Uses, g2: p.g2Uses, gCd: +p.gCd.toFixed(2),
      k: p.kills, d: p.deaths, say: p.speech ? p.speech.text : null,
    })),
    mice: room.mice.map((m) => ({ id: m.id, x: r1(m.x), y: r1(m.y), a: +m.ang.toFixed(2), c: m.color, hp: m.hp / C.mouseHp })),
    fx: room.fx,
  });
  room.fx = [];
}

setInterval(() => { for (const room of rooms.values()) step(room); }, 1000 / TICK);

io.on('connection', (socket) => {
  let room = null;
  socket.on('join', ({ name, room: roomId }) => {
    if (room) return;
    roomId = String(roomId || 'lobby').trim().slice(0, 16) || 'lobby';
    room = getRoom(roomId);
    room.players.set(socket.id, newPlayer(room, socket.id, String(name || '정보쌤').trim() || '정보쌤', false));
    socket.join(roomId);
    socket.emit('joined', { id: socket.id, map: MAP, stats: C, room: roomId });
  });
  socket.on('input', (inp) => {
    const p = room && room.players.get(socket.id);
    if (!p || !inp) return;
    p.input.mx = Math.max(-1, Math.min(1, +inp.mx || 0));
    p.input.my = Math.max(-1, Math.min(1, +inp.my || 0));
  });
  socket.on('attack', () => { const p = room && room.players.get(socket.id); if (p) doAttack(room, p, Date.now() / 1000); });
  socket.on('gadget', (n) => { const p = room && room.players.get(socket.id); if (p) doGadget(room, p, n === 2 ? 2 : 1, Date.now() / 1000); });
  socket.on('addBot', () => {
    if (!room) return;
    const bots = [...room.players.values()].filter((p) => p.isBot).length;
    if (room.players.size >= 10 || bots >= 6) return;
    const id = 'bot' + ++room.botSeq;
    room.players.set(id, newPlayer(room, id, '봇쌤' + room.botSeq, true));
  });
  socket.on('clearBots', () => {
    if (!room) return;
    for (const [id, p] of room.players) if (p.isBot) room.players.delete(id);
  });
  socket.on('disconnect', () => {
    if (!room) return;
    room.players.delete(socket.id);
    if (![...room.players.values()].some((p) => !p.isBot)) rooms.delete(room.id);
  });
});

server.listen(PORT, () => console.log(`정보쌤 브롤 서버 실행: http://localhost:${PORT}`));
