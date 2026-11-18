// 정보쌤 브롤 - 실시간 온라인 대전 서버 (Node + socket.io, 서버 권한 방식)
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { BRAWLERS, publicBrawlers } = require('./brawlers');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', 'three', 'build')));
app.get('/api/brawlers', (req, res) => res.json(publicBrawlers()));
const PORT = process.env.PORT || 3000;

const TICK = 30;
const DT = 1 / TICK;
const G = { respawn: 3, regenDelay: 3, regenRate: 0.13, maxPlayers: 10, maxBots: 6 };

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

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const COLORS = ['#4f8cff', '#ff5d5d', '#3ccf7a', '#ffb02e', '#b56cff', '#22c3c3', '#ff7ac6', '#a0a0a0'];
const rooms = new Map();

function getRoom(id) {
  if (!rooms.has(id)) rooms.set(id, { id, players: new Map(), mice: [], fx: [], pending: [], mouseSeq: 0, botSeq: 0, colorIdx: 0 });
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

function randomSpawn(r) {
  for (let i = 0; i < 200; i++) {
    const x = 60 + Math.random() * (MAP.w - 120);
    const y = 60 + Math.random() * (MAP.h - 120);
    if (!hitsWall(x, y, r + 10)) return { x, y };
  }
  return { x: 80, y: 80 };
}

function newPlayer(room, id, name, isBot, brawlerId) {
  const B = BRAWLERS[brawlerId] || BRAWLERS.jungbo;
  const s = randomSpawn(B.radius);
  return {
    id, name: (name || B.name).slice(0, 10), isBot, B,
    color: COLORS[room.colorIdx++ % COLORS.length],
    x: s.x, y: s.y, hp: B.maxHp,
    ammo: B.attack.ammo, reloadT: 0, atkCd: 0,
    stunT: 0, gCd: 0, facing: Math.PI / 2, sup: 0, acT: 0, acTick: 0,
    lastHit: 0, dead: false, respawnT: 0,
    kills: 0, deaths: 0,
    input: { mx: 0, my: 0 }, speech: null,
    bot: isBot ? { wanderX: 0, wanderY: 0, wanderT: 0 } : null,
  };
}

function say(p, key, t = 1.6) { const l = p.B.lines && p.B.lines[key]; if (l) p.speech = { text: pick(l), t }; }

function damage(room, attacker, target, dmg, now, kind) {
  if (target.dead) return;
  if (attacker && attacker.ctrlBy === target.id) return;   // 꼭두각시는 조종하는 사람을 못 때림
  target.hp -= dmg;
  target.lastHit = now;
  room.fx.push({ type: 'dmg', x: target.x, y: target.y - 40, v: dmg, k: kind });
  if (target.hp <= 0) {
    target.hp = 0; target.dead = true; target.respawnT = G.respawn; target.deaths++;
    target.speech = null;
    if (attacker && attacker.id !== target.id) { attacker.kills++; if (Math.random() < 0.5) say(attacker, 'kill'); }
    room.fx.push({ type: 'kill', a: attacker ? attacker.name : '?', b: target.name, aid: attacker ? attacker.id : null });
    room.mice = room.mice.filter((m) => m.owner !== target.id);
    releaseCtrl(room, target);
  }
}

// 조종 해제 (조종하는 쪽이든 당하는 쪽이든)
function releaseCtrl(room, p) {
  if (p.ctrlId) { const t = room.players.get(p.ctrlId); if (t) { t.ctrlBy = null; t.input = { mx: 0, my: 0 }; } p.ctrlId = null; p.ctrlT = 0; }
  if (p.ctrlBy) { const c = room.players.get(p.ctrlBy); if (c) { c.ctrlId = null; c.ctrlT = 0; } p.ctrlBy = null; p.input = { mx: 0, my: 0 }; }
}

const canAct = (p) => !p.dead && p.stunT <= 0;
const angDiff = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };

// ── 브롤러별 스킬 ──────────────────────────────────
const SKILLS = {
  jungbo: {
    // 기본공격: 주변 원형 범위 (조준 없음)
    attack(room, p, ang, now) {
      const A = p.B.attack;
      p.ammo -= 1; p.atkCd = A.cd;
      room.fx.push({ type: 'pulse', id: p.id, x: p.x, y: p.y, r: A.range, c: p.color });
      if (Math.random() < 0.45) say(p, 'atk', 1.2);
      for (const q of room.players.values()) {
        if (q.id === p.id || q.id === p.ctrlBy || q.dead) continue;
        if (Math.hypot(q.x - p.x, q.y - p.y) <= A.range + q.B.radius) {
          damage(room, p, q, A.dmg, now);
          chargeSuper(p, A.dmg);
        }
      }
      for (const m of room.mice) if (m.owner !== p.id && Math.hypot(m.x - p.x, m.y - p.y) <= A.range + m.radius) m.hp -= A.dmg;
    },
    gadget(room, p, n, now) {
      if (n === 1) {
        const g = p.B.gadgets[0];
        say(p, 'g1', 2);
        const hits = [];
        room.fx.push({ type: 'stun', id: p.id, x: p.x, y: p.y, r: g.range, hits });
        for (const q of room.players.values()) {
          if (q.id === p.id || q.id === p.ctrlBy || q.dead) continue;
          if (Math.hypot(q.x - p.x, q.y - p.y) <= g.range + q.B.radius) {
            hits.push(q.id);
            q.stunT = Math.max(q.stunT, g.stun);
            damage(room, p, q, g.dmg, now);
          }
        }
      } else {
        const g = p.B.gadgets[1];
        say(p, 'g2', 1.6);
        for (let i = 0; i < g.count; i++) {
          const a = Math.random() * Math.PI * 2;
          const m = {
            id: ++room.mouseSeq, owner: p.id, color: p.color,
            x: p.x + Math.cos(a) * 40, y: p.y + Math.sin(a) * 40,
            hp: g.hp, maxHp: g.hp, life: g.life, biteCd: 0, ang: a,
            speed: g.speed, dmg: g.dmg, biteRate: g.biteCd, radius: g.radius,
          };
          resolveWalls(m, m.radius);
          room.mice.push(m);
        }
        room.fx.push({ type: 'summon', id: p.id, x: p.x, y: p.y });
      }
    },
    super(room, p, a, now) {
      const S = p.B.super;
      say(p, 'sup', 1.8);
      room.fx.push({ type: 'super', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: S.range, h: S.half });
      const inCone = (x, y, rad) => {
        const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
        if (d > S.range + rad) return false;
        if (d < rad + p.B.radius) return true;
        return Math.abs(angDiff(Math.atan2(dy, dx), a)) <= S.half;
      };
      for (const q of room.players.values()) {
        if (q.id === p.id || q.id === p.ctrlBy || q.dead || !inCone(q.x, q.y, q.B.radius)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        q.x += ((q.x - p.x) / d) * S.knock; q.y += ((q.y - p.y) / d) * S.knock;
        resolveWalls(q, q.B.radius);
        q.stunT = Math.max(q.stunT, 0.4);
        damage(room, p, q, S.dmg, now);
      }
      for (const m of room.mice) if (m.owner !== p.id && inCone(m.x, m.y, m.radius)) m.hp = 0;
    },
  },
};

// 공통: 부채꼴 판정
function inCone(p, a, range, half, x, y, rad) {
  const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
  if (d > range + rad) return false;
  if (d < rad + p.B.radius) return true;
  return Math.abs(angDiff(Math.atan2(dy, dx), a)) <= half;
}
const chargeSuper = (p, dmg) => { if (p.B.super) p.sup = Math.min(1, p.sup + dmg / p.B.super.need); };

SKILLS.hyeonsil = {
  // 주걱 스매쉬: 살짝 뒤로 젖혔다가(windup) 앞쪽 부채꼴로 강하게 휘두름
  attack(room, p, a, now) {
    const A = p.B.attack;
    p.ammo -= 1; p.atkCd = A.cd; p.facing = a;
    room.fx.push({ type: 'swing', id: p.id, x: p.x, y: p.y, a: +a.toFixed(3), r: A.range, h: A.half, d: A.windup });
    if (Math.random() < 0.4) say(p, 'atk', 1.2);
    room.pending.push({ t: A.windup, fn: () => {
      if (p.dead || !room.players.has(p.id)) return;
      for (const q of room.players.values()) {
        if (q.id === p.id || q.id === p.ctrlBy || q.dead || !inCone(p, a, A.range, A.half, q.x, q.y, q.B.radius)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y) || 1;
        q.x += ((q.x - p.x) / d) * A.knock; q.y += ((q.y - p.y) / d) * A.knock; resolveWalls(q, q.B.radius);
        damage(room, p, q, A.dmg, Date.now() / 1000);
        chargeSuper(p, A.dmg);
        room.fx.push({ type: 'smack', x: q.x, y: q.y });
      }
      for (const m of room.mice) if (m.owner !== p.id && inCone(p, a, A.range, A.half, m.x, m.y, m.radius)) m.hp -= A.dmg;
    } });
  },
  gadget(room, p, n, now) {
    if (n === 1) {   // 에어컨 18도: 7초 동안 모든 적에게 지속 피해
      const g = p.B.gadgets[0];
      say(p, 'g1', 2);
      p.acT = g.dur; p.acTick = 0;
      room.fx.push({ type: 'ac', id: p.id, x: p.x, y: p.y });
    } else {         // 펜 내려놓고 여기 보자: 모든 적 기절
      const g = p.B.gadgets[1];
      say(p, 'g2', 2);
      const hits = [];
      for (const q of room.players.values()) {
        if (q.id === p.id || q.id === p.ctrlBy || q.dead) continue;
        q.stunT = Math.max(q.stunT, g.stun); hits.push(q.id);
      }
      room.fx.push({ type: 'look', id: p.id, x: p.x, y: p.y, hits });
    }
  },
  // 너 등신이냐? — 조준한 직선의 첫 번째 상대를 5초 동안 조종
  super(room, p, a, now) {
    const S = p.B.super;
    say(p, 'sup', 2);
    const ca = Math.cos(a), sa = Math.sin(a);
    let target = null, best = Infinity;
    for (const q of room.players.values()) {
      if (q.id === p.id || q.id === p.ctrlBy || q.dead || q.ctrlBy || q.ctrlId) continue;
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
};

function doAttack(room, p, ang, now) {
  if (!canAct(p) || p.ammo < 1 || p.atkCd > 0) return;
  p.lastHit = Math.max(p.lastHit, now - G.regenDelay + 1);
  SKILLS[p.B.id].attack(room, p, Number.isFinite(ang) ? ang : p.facing, now);
}
function doGadget(room, p, n, now) {
  if (!canAct(p) || p.gCd > 0) return;
  p.gCd = p.B.gadgetCd;
  SKILLS[p.B.id].gadget(room, p, n === 2 ? 2 : 1, now);
}
function doSuper(room, p, ang, now) {
  if (!p.B.super || !canAct(p) || p.sup < 1) return;
  if (p.ctrlBy && p.B.id === 'hyeonsil') return;   // 꼭두각시 현실쌤은 조종 궁극기 못 씀 (조종 연쇄 방지)
  p.sup = 0;
  const a = Number.isFinite(ang) ? ang : p.facing;
  p.facing = a;
  SKILLS[p.B.id].super(room, p, a, now);
}

function botThink(room, p, now) {
  const b = p.bot, B = p.B;
  if (p.ctrlBy) return;                       // 조종당하는 중
  if (p.ctrlId) {                             // 조종하는 중: 꼭두각시를 가까운 적에게 보내서 공격
    const t = room.players.get(p.ctrlId); if (!t) return;
    let tg = null, bd = Infinity;
    for (const q of room.players.values()) { if (q.id === p.id || q.id === t.id || q.dead) continue; const d = Math.hypot(q.x - t.x, q.y - t.y); if (d < bd) { bd = d; tg = q; } }
    if (!tg) { p.input = { mx: 0, my: 0 }; return; }
    const dx = tg.x - t.x, dy = tg.y - t.y;
    p.input = { mx: dx / (bd || 1), my: dy / (bd || 1) };
    if (bd < t.B.attack.range + 10 && Math.random() < 0.2) doAttack(room, t, Math.atan2(dy, dx), now);
    if (bd < 260 && Math.random() < 0.03) doGadget(room, t, Math.random() < 0.5 ? 1 : 2, now);
    if (t.sup >= 1 && bd < 300 && Math.random() < 0.1) doSuper(room, t, Math.atan2(dy, dx), now);
    return;
  }
  let target = null, best = Infinity;
  for (const q of room.players.values()) {
    if (q.id === p.id || q.id === p.ctrlBy || q.dead) continue;
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < best) { best = d; target = q; }
  }
  b.wanderT -= DT;
  if (target && best < 650) {
    const dx = target.x - p.x, dy = target.y - p.y, d = best || 1;
    const jitter = Math.sin(now * 3 + p.x) * 0.4;
    p.input.mx = dx / d - (dy / d) * jitter;
    p.input.my = dy / d + (dx / d) * jitter;
    if (best < B.attack.range + 10 && Math.random() < (B.attack.aim === 'dir' ? 0.1 : 0.18)) doAttack(room, p, Math.atan2(dy, dx), now);
    if (best < 220 && Math.random() < (B.id === 'hyeonsil' ? 0.004 : 0.01)) doGadget(room, p, 1, now);
    if (best < 500 && Math.random() < 0.006) doGadget(room, p, 2, now);
    if (B.super && best < B.super.range - 30 && p.sup >= 1 && Math.random() < 0.05) doSuper(room, p, Math.atan2(dy, dx), now);
    if (p.hp < B.maxHp * 0.3 && Math.random() < 0.5) { p.input.mx *= -1; p.input.my *= -1; }
  } else {
    if (b.wanderT <= 0) {
      const a = Math.random() * Math.PI * 2;
      b.wanderX = Math.cos(a); b.wanderY = Math.sin(a); b.wanderT = 1 + Math.random() * 2;
    }
    p.input.mx = b.wanderX; p.input.my = b.wanderY;
  }
}

function step(room) {
  const now = Date.now() / 1000;
  // 지연 실행 (휘두르기 판정 등)
  for (const a of room.pending) a.t -= DT;
  const due = room.pending.filter((a) => a.t <= 0);
  room.pending = room.pending.filter((a) => a.t > 0);
  for (const a of due) a.fn();
  // 조종: 조종하는 사람의 이동 입력 → 꼭두각시에게
  for (const p of room.players.values()) {
    if (!p.ctrlId) continue;
    const t = room.players.get(p.ctrlId);
    p.ctrlT -= DT;
    if (!t || t.dead || p.dead || p.stunT > 0 || p.ctrlT <= 0) { releaseCtrl(room, p); continue; }
    t.input = { ...p.input };
  }
  // 에어컨: 켜놓은 사람 말고 모두에게 지속 피해
  for (const p of room.players.values()) {
    if (p.acT <= 0) continue;
    p.acT = Math.max(0, p.acT - DT); p.acTick -= DT;
    if (p.acTick <= 0) {
      const g = p.B.gadgets[0]; p.acTick = g.tick;
      for (const q of room.players.values()) if (q.id !== p.id && q.id !== p.ctrlBy && !q.dead) damage(room, p, q, g.dmg, now, 'cold');
    }
    if (p.dead) p.acT = 0;
  }
  for (const p of room.players.values()) {
    const B = p.B;
    if (p.speech) { p.speech.t -= DT; if (p.speech.t <= 0) p.speech = null; }
    if (p.dead) {
      p.respawnT -= DT;
      if (p.respawnT <= 0) {
        const s = randomSpawn(B.radius);
        Object.assign(p, { x: s.x, y: s.y, hp: B.maxHp, dead: false, ammo: B.attack.ammo, stunT: 0 });
      }
      continue;
    }
    if (p.isBot) botThink(room, p, now);
    p.atkCd = Math.max(0, p.atkCd - DT);
    p.gCd = Math.max(0, p.gCd - DT);
    p.stunT = Math.max(0, p.stunT - DT);
    if (p.ammo < B.attack.ammo) {
      p.reloadT += DT;
      if (p.reloadT >= B.attack.reload) { p.ammo++; p.reloadT = 0; }
    } else p.reloadT = 0;
    if (now - p.lastHit > G.regenDelay && p.hp < B.maxHp) p.hp = Math.min(B.maxHp, p.hp + B.maxHp * G.regenRate * DT);

    if (p.stunT <= 0 && !p.ctrlId) {          // 조종하는 동안 본인은 제자리
      let { mx, my } = p.input;
      const len = Math.hypot(mx, my);
      if (len > 0.1) { mx /= len; my /= len; p.facing = Math.atan2(my, mx); } else { mx = 0; my = 0; }
      p.x += mx * B.speed * DT;
      p.y += my * B.speed * DT;
      resolveWalls(p, B.radius);
    }
  }

  // 소환수 (마우스)
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
      if (d > target.B.radius + m.radius) {
        m.x += (dx / d) * m.speed * DT;
        m.y += (dy / d) * m.speed * DT;
        resolveWalls(m, m.radius);
      } else if (m.biteCd <= 0) {
        m.biteCd = m.biteRate;
        damage(room, room.players.get(m.owner), target, m.dmg, now);
        room.fx.push({ type: 'click', x: target.x, y: target.y });
      }
    } else {
      const owner = room.players.get(m.owner);
      if (owner && Math.hypot(owner.x - m.x, owner.y - m.y) > 70) {
        const dx = owner.x - m.x, dy = owner.y - m.y, d = Math.hypot(dx, dy);
        m.ang = Math.atan2(dy, dx);
        m.x += (dx / d) * m.speed * 0.7 * DT;
        m.y += (dy / d) * m.speed * 0.7 * DT;
        resolveWalls(m, m.radius);
      }
    }
  }
  room.mice = room.mice.filter((m) => m.life > 0 && m.hp > 0 && room.players.has(m.owner));

  const r1 = (v) => Math.round(v);
  io.to(room.id).emit('state', {
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, b: p.B.id, color: p.color, bot: p.isBot,
      x: r1(p.x), y: r1(p.y), hp: r1(p.hp), dead: p.dead, respawn: Math.ceil(p.respawnT),
      ammo: p.ammo + p.reloadT / p.B.attack.reload, stun: p.stunT > 0,
      gCd: +p.gCd.toFixed(2), sup: +p.sup.toFixed(3), f: +p.facing.toFixed(2),
      k: p.kills, d: p.deaths, say: p.speech ? p.speech.text : null,
      ctl: p.ctrlBy, ctrl: p.ctrlId, ctrlT: +(p.ctrlT || 0).toFixed(1), ac: +p.acT.toFixed(1),
    })),
    mice: room.mice.map((m) => ({ id: m.id, x: r1(m.x), y: r1(m.y), a: +m.ang.toFixed(2), c: m.color, hp: m.hp / m.maxHp })),
    fx: room.fx,
  });
  room.fx = [];
}

setInterval(() => { for (const room of rooms.values()) step(room); }, 1000 / TICK);

io.on('connection', (socket) => {
  let room = null;
  const me = () => room && room.players.get(socket.id);
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : NaN);
  socket.on('join', ({ name, brawler } = {}) => {
    if (room) return;
    room = getRoom('lobby');   // 모두 공통 로비
    const bid = BRAWLERS[brawler] && !BRAWLERS[brawler].wip ? brawler : 'jungbo';
    room.players.set(socket.id, newPlayer(room, socket.id, String(name || '').trim() || BRAWLERS[bid].name, false, bid));
    socket.join(room.id);
    socket.emit('joined', { id: socket.id, map: MAP });
  });
  socket.on('input', (inp) => {
    const p = me();
    if (!p || !inp || p.ctrlBy) return;      // 조종당하는 중엔 입력 무시
    p.input.mx = Math.max(-1, Math.min(1, +inp.mx || 0));
    p.input.my = Math.max(-1, Math.min(1, +inp.my || 0));
  });
  // 조종 중이면 공격 버튼 → 꼭두각시가 공격
  socket.on('attack', (ang) => {
    const p = me(); if (!p || p.ctrlBy) return;
    const t = p.ctrlId && room.players.get(p.ctrlId);
    doAttack(room, t || p, num(ang), Date.now() / 1000);
  });
  // 조종 중이면 가젯·궁극기도 꼭두각시의 스킬로 나감
  socket.on('gadget', (n) => {
    const p = me(); if (!p || p.ctrlBy) return;
    const t = p.ctrlId && room.players.get(p.ctrlId);
    doGadget(room, t || p, n === 2 ? 2 : 1, Date.now() / 1000);
  });
  socket.on('super', (ang) => {
    const p = me(); if (!p || p.ctrlBy) return;
    const t = p.ctrlId && room.players.get(p.ctrlId);
    doSuper(room, t || p, num(ang), Date.now() / 1000);
  });
  socket.on('addBot', () => {
    if (!room) return;
    const bots = [...room.players.values()].filter((p) => p.isBot).length;
    if (room.players.size >= G.maxPlayers || bots >= G.maxBots) return;
    const id = 'bot' + ++room.botSeq;
    const bid = pick(Object.keys(BRAWLERS).filter((k) => !BRAWLERS[k].wip));
    room.players.set(id, newPlayer(room, id, '봇' + room.botSeq, true, bid));
  });
  socket.on('clearBots', () => {
    if (!room) return;
    for (const [id, p] of room.players) if (p.isBot) { releaseCtrl(room, p); room.players.delete(id); }
  });
  socket.on('disconnect', () => {
    if (!room) return;
    const p = me(); if (p) releaseCtrl(room, p);
    room.players.delete(socket.id);
    if (![...room.players.values()].some((p) => !p.isBot)) rooms.delete(room.id);
  });
});

server.listen(PORT, () => console.log(`정보쌤 브롤 서버 실행: http://localhost:${PORT}`));
