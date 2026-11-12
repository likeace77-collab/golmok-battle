'use strict';
// 친구 · 길드 · 채팅 · 협업 퀘스트
// index.js가 init()으로 db와 도우미 함수를 넘겨 줍니다.

const KST = 9 * 3600e3, DAY = 86400e3;
const weekKey = (t = Date.now()) => { const d = new Date(t + KST); const wd = (d.getUTCDay() + 6) % 7; return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd)).toISOString().slice(0, 10); };

const FRIEND_MAX = 50, GUILD_MAX = 20, GUILD_GP = 3000, CHAT_KEEP = 100, CHAT_LEN = 200;
const EMBLEMS = ['🏰', '🐉', '🔥', '⚡', '🌊', '🌙', '⭐', '👑', '🗡️', '🛡️', '🍀', '🐾', '💀', '🎸', '🍜', '🚀'];
const COLORS = ['#E8402C', '#ff8a00', '#FFD23F', '#3FA34D', '#2EA8E0', '#2340A8', '#7a2cff', '#ff3e9a', '#222033'];

// 길드 협업 퀘스트 (매주 월요일 초기화). 이번 주에 한 판이라도 기여한 길드원이 각자 받아요.
const GUILD_QUESTS = [
  { id: 'g-games', n: '길드원 모두 합쳐 대전 40판', k: 'games', goal: 40, r: { gp: 8000, pass: 120, gpt: 200 } },
  { id: 'g-wins', n: '길드원 모두 합쳐 20번 이기기', k: 'wins', goal: 20, r: { tickets: 1, pass: 150, gpt: 200 } },
  { id: 'g-mega', n: '길드원 모두 합쳐 메가진화 25번', k: 'megas', goal: 25, r: { skips: 40, stones: 'random', gpt: 200 } },
  { id: 'g-friend', n: '길드원끼리 같은 팀으로 태그전 5번 이기기', k: 'mateWins', goal: 5, r: { tickets: 2, gp: 5000, pass: 200, gpt: 300 } },
];

// 길드 패스: 시즌(2주)마다. 길드원 모두의 대전으로 길드 패스 포인트가 쌓이고, 레벨마다 각자 보상(길P 등)을 받아요.
const GPASS_LV = 30, GPASS_PER = 300, VICE_MAX = 2;
const GPASS_PTS = { pvp: [20, 10], tag: [16, 8], practice: [6, 3] }; // [이김, 짐]
const gpassReward = (lv) => (lv % 10 === 0 ? { gpt: 600, tickets: 1, stones: 'random' } : lv % 5 === 0 ? { gpt: 300, tickets: 1 } : lv % 2 ? { gpt: 100, gp: 1500 } : { gpt: 150, skips: 10 });
const RANK = { master: 3, vice: 2, member: 1 };

let db, H; // H: { keyOf, online, send, toast, publicUser, save, grant, bump, isDev, inBattle, sendMail }
function init(_db, helpers) { db = _db; H = helpers; fix(); }
function setDb(_db) { db = _db; fix(); }
function fix() {
  db.guilds ||= {}; db.chat ||= {};
  for (const u of Object.values(db.users)) { u.friends ||= []; u.freq ||= { in: [], out: [] }; }
  // 지워진 길드를 가리키는 유저 정리
  for (const u of Object.values(db.users)) if (u.guild && !db.guilds[u.guild]) delete u.guild;
  for (const g of Object.values(db.guilds)) g.vices ||= [];
}
// 길드 직책: 'master' 길드장, 'vice' 부길드장, 'member' 길드원
function roleOf(u) {
  const g = u?.guild && db?.guilds?.[u.guild]; if (!g) return null;
  const k = H.keyOf(u.name);
  return g.leader === k ? 'master' : (g.vices || []).includes(k) ? 'vice' : 'member';
}
// 직책 칭호: 길드원은 모두, 부마는 부길드장만, 마스터는 길드장만
const roleOk = (u, need) => { const r = roleOf(u); return !!r && (need === 'member' || r === need); };
const restyle = (k) => { const u = userOf(k); if (u) H.fixStyle(u); };

const ensure = (u) => { if (u) { u.friends ||= []; u.freq ||= { in: [], out: [] }; } return u; };
const userOf = (k) => ensure(db.users[k]);
const nameOf = (k) => db.users[k]?.name || '(탈퇴)';
const card = (k) => { const u = userOf(k); return u && { key: k, name: u.name, avatar: u.avatar, style: u.style, online: H.online.has(k), busy: H.inBattle.has(k), guild: u.guild ? db.guilds[u.guild]?.name : null }; };
const push = (k, msg) => H.send(H.online.get(k), msg);
const ping = (k) => { const u = userOf(k); if (u) push(k, { t: 'me', user: H.publicUser(u) }); };
const err = (e) => ({ error: e });

/* ---------- 친구 ---------- */
function friendRequest(u, key, name) {
  const tk = H.keyOf(String(name || '').trim()), t = userOf(tk);
  if (!t) return err('그런 이름의 골목몬꾼이 없어요.');
  if (tk === key) return err('나 자신과는 이미 친구예요. 😉');
  if (u.friends.includes(tk)) return err('이미 친구예요.');
  if (u.friends.length >= FRIEND_MAX) return err(`친구는 ${FRIEND_MAX}명까지예요.`);
  if (u.freq.in.includes(tk)) return friendAccept(u, key, tk); // 서로 신청했으면 바로 친구
  if (u.freq.out.includes(tk)) return err('이미 신청했어요. 상대가 받아 주길 기다려요.');
  u.freq.out.push(tk); t.freq.in.push(key);
  H.toast(tk, `👥 ${u.name}님이 친구 신청을 보냈어요!`); ping(tk);
  return { ok: true, msg: `${t.name}님에게 친구 신청을 보냈어요.` };
}
function friendAccept(u, key, tk) {
  const t = userOf(tk);
  if (!t || !u.freq.in.includes(tk)) return err('받은 신청이 없어요.');
  if (u.friends.length >= FRIEND_MAX || t.friends.length >= FRIEND_MAX) return err(`친구는 ${FRIEND_MAX}명까지예요.`);
  u.freq.in = u.freq.in.filter((x) => x !== tk); u.freq.out = u.freq.out.filter((x) => x !== tk);
  t.freq.out = t.freq.out.filter((x) => x !== key); t.freq.in = t.freq.in.filter((x) => x !== key);
  if (!u.friends.includes(tk)) u.friends.push(tk);
  if (!t.friends.includes(key)) t.friends.push(key);
  H.toast(tk, `🎉 ${u.name}님과 친구가 되었어요!`); ping(tk);
  return { ok: true, msg: `${t.name}님과 친구가 되었어요!` };
}
function friendDrop(u, key, tk, what) {
  const t = userOf(tk);
  if (what === 'decline') { u.freq.in = u.freq.in.filter((x) => x !== tk); if (t) t.freq.out = t.freq.out.filter((x) => x !== key); }
  else if (what === 'cancel') { u.freq.out = u.freq.out.filter((x) => x !== tk); if (t) t.freq.in = t.freq.in.filter((x) => x !== key); }
  else { u.friends = u.friends.filter((x) => x !== tk); if (t) t.friends = t.friends.filter((x) => x !== key); }
  if (t) ping(tk);
  return { ok: true };
}
const isFriend = (a, b) => !!userOf(a)?.friends?.includes(b);

/* ---------- 길드 ---------- */
function guildBook(g) {
  if (g.week?.id !== weekKey()) g.week = { id: weekKey(), prog: {}, contrib: {}, claimed: {} };
  return g.week;
}
function guildView(g, key) {
  const w = guildBook(g);
  const mine = w.contrib[key] || 0;
  return {
    id: g.id, name: g.name, emblem: g.emblem, color: g.color, intro: g.intro, leader: g.leader, vices: g.vices || [], viceMax: VICE_MAX, createdAt: g.createdAt, max: GUILD_MAX, gpt: userOf(key)?.gpt || 0, pass: gpassState(g, userOf(key)),
    members: g.members.map((k) => ({ ...card(k), contrib: w.contrib[k] || 0 })).filter((x) => x.name).sort((a, b) => (b.key === g.leader) - (a.key === g.leader) || b.online - a.online || b.contrib - a.contrib),
    quests: GUILD_QUESTS.map((q) => { const v = Math.min(q.goal, w.prog[q.k] || 0); const got = (w.claimed[key] || []).includes(q.id); return { ...q, v, done: v >= q.goal, got, can: v >= q.goal && !got && mine > 0 }; }),
    myContrib: mine, weekEnds: Date.parse(`${weekKey()}T00:00:00+09:00`) + 7 * DAY,
  };
}
const guildList = () => Object.values(db.guilds).map((g) => ({ id: g.id, name: g.name, emblem: g.emblem, color: g.color, intro: g.intro, count: g.members.length, max: GUILD_MAX, leader: nameOf(g.leader), online: g.members.filter((k) => H.online.has(k)).length }))
  .sort((a, b) => b.online - a.online || b.count - a.count);
const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim();
function guildCreate(u, key, b) {
  if (u.guild) return err('이미 길드에 들어가 있어요.');
  const name = cleanName(b.name);
  if (name.length < 2 || name.length > 12) return err('길드 이름은 2~12자로 지어 주세요.');
  if (Object.values(db.guilds).some((g) => g.name.toLowerCase() === name.toLowerCase())) return err('같은 이름의 길드가 이미 있어요.');
  if (!H.isDev(u) && u.gp < GUILD_GP) return err(`길드를 만들려면 ${GUILD_GP.toLocaleString('ko-KR')}GP가 필요해요.`);
  if (!H.isDev(u)) u.gp -= GUILD_GP;
  const id = `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  db.guilds[id] = { id, name, emblem: EMBLEMS.includes(b.emblem) ? b.emblem : EMBLEMS[0], color: COLORS.includes(b.color) ? b.color : COLORS[6], intro: cleanName(b.intro).slice(0, 60), leader: key, members: [key], createdAt: Date.now() };
  db.guilds[id].vices = [];
  u.guild = id;
  return { ok: true, msg: `길드 「${name}」을(를) 만들었어요! 전설 칭호 「길드 마스터」가 열렸어요.` };
}
function guildJoin(u, key, id) {
  const g = db.guilds[id];
  if (u.guild) return err('이미 길드에 들어가 있어요. 먼저 나와 주세요.');
  if (!g) return err('없는 길드예요.');
  if (g.members.length >= GUILD_MAX) return err('길드 인원이 꽉 찼어요.');
  g.members.push(key); u.guild = id;
  sysChat(`g:${id}`, `👋 ${u.name}님이 길드에 들어왔어요!`);
  g.members.forEach((k) => k !== key && ping(k));
  return { ok: true, msg: `「${g.name}」 길드에 들어왔어요! 칭호 「길드원」이 열렸어요.` };
}
function guildLeave(u, key) {
  const g = db.guilds[u.guild];
  delete u.guild;
  if (!g) return { ok: true };
  g.members = g.members.filter((k) => k !== key); g.vices = (g.vices || []).filter((k) => k !== key);
  H.fixStyle(u);
  if (!g.members.length) { delete db.guilds[g.id]; delete db.chat[`g:${g.id}`]; return { ok: true, msg: '마지막 길드원이 나가서 길드가 사라졌어요.' }; }
  if (g.leader === key) { g.leader = g.vices[0] || g.members[0]; g.vices = g.vices.filter((k) => k !== g.leader); restyle(g.leader); sysChat(`g:${g.id}`, `👑 ${nameOf(g.leader)}님이 새 길드장이 되었어요.`); }
  sysChat(`g:${g.id}`, `${u.name}님이 길드를 떠났어요.`);
  g.members.forEach(ping);
  return { ok: true, msg: '길드에서 나왔어요.' };
}
function guildKick(u, key, tk) {
  const g = db.guilds[u.guild];
  const me = roleOf(u);
  if (!g || !['master', 'vice'].includes(me)) return err('길드장·부길드장만 할 수 있어요.');
  if (tk === key || !g.members.includes(tk) || tk === g.leader || (me === 'vice' && g.vices.includes(tk))) return err('내보낼 수 없어요.');
  g.members = g.members.filter((k) => k !== tk); g.vices = g.vices.filter((k) => k !== tk); delete userOf(tk).guild; restyle(tk);
  sysChat(`g:${g.id}`, `${nameOf(tk)}님이 길드에서 나가게 되었어요.`);
  H.toast(tk, `「${g.name}」 길드에서 내보내졌어요.`); ping(tk);
  return { ok: true };
}
function guildEdit(u, key, b) {
  const g = db.guilds[u.guild];
  if (!g || g.leader !== key) return err('길드장만 할 수 있어요.');
  if (b.intro != null) g.intro = cleanName(b.intro).slice(0, 60);
  if (EMBLEMS.includes(b.emblem)) g.emblem = b.emblem;
  if (COLORS.includes(b.color)) g.color = b.color;
  if (b.leader && g.members.includes(b.leader) && b.leader !== key) {
    g.leader = b.leader; g.vices = g.vices.filter((k) => k !== b.leader); restyle(key); restyle(b.leader);
    sysChat(`g:${g.id}`, `👑 ${nameOf(b.leader)}님이 새 길드장이 되었어요.`);
  }
  if (b.vice && g.members.includes(b.vice) && b.vice !== g.leader) {
    if (b.on) {
      if (!g.vices.includes(b.vice)) { if (g.vices.length >= VICE_MAX) return err(`부길드장은 ${VICE_MAX}명까지예요.`); g.vices.push(b.vice); sysChat(`g:${g.id}`, `🥈 ${nameOf(b.vice)}님이 부길드장이 되었어요! 네온 칭호 「길드 부마」가 열렸어요.`); }
    } else { g.vices = g.vices.filter((k) => k !== b.vice); sysChat(`g:${g.id}`, `${nameOf(b.vice)}님이 부길드장에서 내려왔어요.`); }
    restyle(b.vice); ping(b.vice);
  }
  g.members.forEach((k) => k !== key && ping(k));
  return { ok: true };
}
function guildClaim(u, key, qid) {
  const g = db.guilds[u.guild];
  if (!g) return err('길드가 없어요.');
  const v = guildView(g, key).quests.find((q) => q.id === qid);
  if (!v) return err('없는 퀘스트예요.');
  if (v.got) return err('이미 받았어요.');
  if (!v.done) return err('아직 길드 목표를 못 채웠어요.');
  if (!v.can) return err('이번 주에 길드원으로 한 판 이상 해야 받을 수 있어요.');
  const w = guildBook(g); (w.claimed[key] ||= []).push(qid);
  return { ok: true, got: H.grant(u, v.r) };
}
const guildClaimable = (u, key) => { if (!db) return 0; const g = u.guild && db.guilds?.[u.guild]; return g ? guildView(g, key).quests.filter((q) => q.can).length + gpassState(g, u).levels.filter((l) => l.can).length : 0; };

// 대전이 끝날 때 index.js가 불러요: 길드 진행도와 친구 협업 퀘스트
function afterBattle(key, { won, mega, mates = [], foes = [], kind }) {
  const u = userOf(key);
  const mateFriends = mates.filter((m) => isFriend(key, m));
  if (kind === 'tag' && won && mateFriends.length) H.bump(u, 'friendtag');
  if (kind === 'pvp' && foes.some((f) => isFriend(key, f))) H.bump(u, 'friendpvp');
  const g = u.guild && db.guilds[u.guild];
  if (!g) return;
  const w = guildBook(g);
  const before = GUILD_QUESTS.filter((q) => (w.prog[q.k] || 0) >= q.goal).length;
  addGpass(g, (GPASS_PTS[kind] || GPASS_PTS.practice)[won ? 0 : 1]);
  setTimeout(() => { const after = GUILD_QUESTS.filter((q) => (w.prog[q.k] || 0) >= q.goal).length; if (after > before) { addGpass(g, 150 * (after - before)); sysChat(`g:${g.id}`, `🎉 협업 퀘스트 달성! 길드 패스 +${150 * (after - before)}`); H.save(); } }, 0);
  w.contrib[key] = (w.contrib[key] || 0) + 1;
  w.prog.games = (w.prog.games || 0) + 1;
  if (won) w.prog.wins = (w.prog.wins || 0) + 1;
  if (mega) w.prog.megas = (w.prog.megas || 0) + 1;
  if (kind === 'tag' && won && mates.some((m) => userOf(m)?.guild === g.id)) w.prog.mateWins = (w.prog.mateWins || 0) + 0.5; // 같은 팀 두 사람 모두 불리므로 반씩
}

/* ---------- 길드 패스 · 길드 상점 ---------- */
function gpassBook(g) { const s = H.seasonOf(); if (g.gpass?.season !== s) g.gpass = { season: s, pts: 0 }; return g.gpass; }
function addGpass(g, n) { const p = gpassBook(g); p.pts = Math.min(GPASS_LV * GPASS_PER, p.pts + n); }
function myGpass(u) { const s = H.seasonOf(); if (u.gpassClaim?.season !== s) u.gpassClaim = { season: s, got: [] }; return u.gpassClaim; }
function gpassState(g, u) {
  const p = gpassBook(g), mine = myGpass(u), lv = Math.floor(p.pts / GPASS_PER);
  return { season: p.season, pts: p.pts, per: GPASS_PER, max: GPASS_LV, lv,
    levels: Array.from({ length: GPASS_LV }, (_, i) => { const L = i + 1, got = mine.got.includes(L); return { lv: L, r: gpassReward(L), got, can: L <= lv && !got }; }) };
}
function gpassClaim(u, lv) {
  const g = u.guild && db.guilds[u.guild]; if (!g) return err('길드에 들어가야 받을 수 있어요.');
  const st = gpassState(g, u), all = lv === 'all' ? st.levels.filter((l) => l.can) : st.levels.filter((l) => l.lv === Number(lv) && l.can);
  if (!all.length) return err(lv === 'all' ? '받을 보상이 없어요.' : '아직 받을 수 없는 단계예요.');
  const got = [];
  for (const l of all) { myGpass(u).got.push(l.lv); got.push(...H.grant(u, l.r)); }
  // 같은 종류는 합쳐서 보여 줌
  const sum = []; for (const x of got) { const same = sum.find((y) => y.k === x.k && !x.id && !y.id); if (same) same.n += x.n; else sum.push({ ...x }); }
  return { ok: true, got: sum };
}
function gshopBuy(u, ref) {
  if (!u.guild || !db.guilds[u.guild]) return err('길드에 들어가야 길드 상점을 쓸 수 있어요.');
  const [kind, id] = String(ref || '').split(':'), item = H.cosmetic(kind, id);
  if (!item || item.cond?.[0] !== 'gshop') return err('길드 상점에 없는 물건이에요.');
  if (H.owns(u, ref)) return err('이미 가지고 있어요.');
  const price = item.cond[1];
  if ((u.gpt || 0) < price) return err(`길P가 ${(price - (u.gpt || 0)).toLocaleString('ko-KR')} 모자라요.`);
  u.gpt -= price; (u.owned ||= []).push(ref);
  return { ok: true };
}

/* ---------- 채팅 ---------- */
// 채널: 'world' 전체, 'g:<길드id>', 'dm:<키>|<키>' (키는 정렬)
const dmCh = (a, b) => `dm:${[a, b].sort().join('|')}`;
function canRead(key, ch) {
  if (ch === 'world') return true;
  if (ch.startsWith('g:')) return userOf(key)?.guild === ch.slice(2);
  if (ch.startsWith('dm:')) return ch.slice(3).split('|').includes(key);
  return false;
}
function listeners(ch) {
  if (ch === 'world') return [...H.online.keys()];
  if (ch.startsWith('g:')) return db.guilds[ch.slice(2)]?.members || [];
  if (ch.startsWith('dm:')) return ch.slice(3).split('|');
  return [];
}
function store(ch, m) { const list = (db.chat[ch] ||= []); list.push(m); if (list.length > CHAT_KEEP) list.splice(0, list.length - CHAT_KEEP); }
function sysChat(ch, text) { const m = { sys: true, text, at: Date.now() }; store(ch, m); listeners(ch).forEach((k) => push(k, { t: 'chat', ch, m })); }
const lastSent = new Map();
// 클라이언트 채널 이름: 'world' | 'guild' | 'dm:<상대키>' → 서버 채널
function resolve(key, c) {
  c = String(c || '');
  if (c === 'world') return 'world';
  if (c === 'guild') { const g = userOf(key)?.guild; return g ? `g:${g}` : null; }
  if (c.startsWith('dm:')) { const o = c.slice(3); return userOf(o) && o !== key ? dmCh(key, o) : null; }
  return null;
}
function chatSend(key, c, text) {
  const u = userOf(key), ch = resolve(key, c);
  if (!ch) return H.toast(key, c === 'guild' ? '길드에 들어가야 길드 채팅을 할 수 있어요.' : '보낼 수 없는 채팅방이에요.');
  if (ch.startsWith('dm:') && !isFriend(key, ch.slice(3).split('|').find((x) => x !== key))) return H.toast(key, '친구에게만 1:1 메시지를 보낼 수 있어요.');
  text = String(text || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, CHAT_LEN);
  if (!text) return;
  const now = Date.now();
  if (now - (lastSent.get(key) || 0) < 800) return H.toast(key, '너무 빨라요! 잠깐만요.');
  lastSent.set(key, now);
  const g = u.guild && db.guilds[u.guild];
  const m = { from: key, name: u.name, avatar: u.avatar, title: u.style?.title, guild: g ? g.emblem : '', text, at: now };
  store(ch, m);
  listeners(ch).forEach((k) => push(k, { t: 'chat', ch: clientCh(k, ch), m }));
  H.save();
}
const clientCh = (k, ch) => (ch.startsWith('g:') ? 'guild' : ch.startsWith('dm:') ? `dm:${ch.slice(3).split('|').find((x) => x !== k)}` : ch);
function chatHistory(key, c) {
  const ch = resolve(key, c);
  return ch && canRead(key, ch) ? (db.chat[ch] || []).slice(-60) : [];
}
// 개발자: 메시지 지우기
function chatDelete(u, key, c, at) {
  if (!H.isDev(u)) return err('개발자만 할 수 있어요.');
  const ch = c === 'world' ? 'world' : String(c || '');
  const list = db.chat[ch]; if (!list) return err('없는 채팅방이에요.');
  const i = list.findIndex((m) => m.at === Number(at)); if (i < 0) return err('없는 메시지예요.');
  list.splice(i, 1);
  listeners(ch).forEach((k) => push(k, { t: 'chat_del', ch: clientCh(k, ch), at: Number(at) }));
  return { ok: true };
}

function socialView(u, key) {
  const g = u.guild && db.guilds[u.guild];
  return {
    friends: u.friends.map(card).filter(Boolean).sort((a, b) => b.online - a.online || a.name.localeCompare(b.name)),
    reqIn: u.freq.in.map(card).filter(Boolean), reqOut: u.freq.out.map(card).filter(Boolean),
    guild: g ? guildView(g, key) : null, guilds: g ? [] : guildList(), emblems: EMBLEMS, colors: COLORS, guildGp: GUILD_GP,
  };
}

// REST 라우트. 처리했으면 결과 객체, 아니면 undefined
function api(route, u, key, b) {
  ensure(u);
  switch (route) {
    case 'GET /api/social': return { view: socialView(u, key) };
    case 'POST /api/friend/request': return friendRequest(u, key, b.name);
    case 'POST /api/friend/accept': return friendAccept(u, key, String(b.key || ''));
    case 'POST /api/friend/decline': return friendDrop(u, key, String(b.key || ''), 'decline');
    case 'POST /api/friend/cancel': return friendDrop(u, key, String(b.key || ''), 'cancel');
    case 'POST /api/friend/remove': return friendDrop(u, key, String(b.key || ''), 'remove');
    case 'POST /api/guild/create': return guildCreate(u, key, b);
    case 'POST /api/guild/join': return guildJoin(u, key, String(b.id || ''));
    case 'POST /api/guild/leave': return guildLeave(u, key);
    case 'POST /api/guild/kick': return guildKick(u, key, String(b.key || ''));
    case 'POST /api/guild/edit': return guildEdit(u, key, b);
    case 'POST /api/guild/claim': return guildClaim(u, key, String(b.id || ''));
    case 'POST /api/guild/pass': return gpassClaim(u, b.lv === 'all' ? 'all' : Number(b.lv));
    case 'POST /api/guild/shop': return gshopBuy(u, b.ref);
    case 'POST /api/chat/delete': return chatDelete(u, key, b.ch, b.at);
    default: return undefined;
  }
}

module.exports = { roleOf, roleOk, init, setDb, api, socialView, chatSend, chatHistory, afterBattle, guildClaimable, isFriend, GUILD_QUESTS };
