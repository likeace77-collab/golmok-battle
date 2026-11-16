'use strict';
// 🎉 친구 초대(추천인) + 🌱 뉴비 7일 연속 출석
// - 가입할 때 추천인 아이디를 넣으면: 뉴비는 바로 환영 선물, 추천한 친구는 뉴비가 대전 1판을 하면 선물 (빈 계정 만들기로 보상만 받는 걸 막으려고)
// - 가입 3일 안이면 나중에라도 추천인을 한 번 넣을 수 있어요.
// - 뉴비(가입 30일 안): 7일 연속 접속하면 날마다 선물, 7일째 막대한 선물
const KST = 9 * 3600e3, DAY = 86400e3;
const dayKey = (t = Date.now()) => new Date(t + KST).toISOString().slice(0, 10);

const REF_NEWBIE = { gp: 10000, tickets: 3, rerolls: 5 }; // + 일반 상자 2
const REF_FRIEND = { gp: 15000, tickets: 2 }; // + 희귀 상자 1
const REF_GAMES = 1, REF_MAX = 20, REF_TITLE_AT = 3, REF_LATE_DAYS = 3;
const ROOKIE_DAYS = 30;
const ROOKIE = [
  { gp: 3000 },
  { rerolls: 5, skips: 20 },
  { gp: 5000, box: 'c' },
  { tickets: 2 },
  { gp: 8000, box: 'r' },
  { tickets: 3, rerolls: 10 },
  { gp: 100000, tickets: 10, rerolls: 20, box: 'l', boxN: 2, mon: 'random', shiny: true, title: 'sprout' }, // 7일째: 막대한 선물
];

let db = null, H = {};
function init(_db, hooks) { db = _db; H = hooks; }
const keyOf = (n) => H.keyOf(n);

/* ---------- 친구 초대 ---------- */
// 가입할 때 (index의 signup에서 부름). 성공하면 뉴비 선물 목록, 아니면 null
function onSignup(u, key, refName) {
  refName = String(refName || '').trim();
  if (!refName) return null;
  return link(u, key, refName, true);
}
function link(u, key, refName, atSignup) {
  const rk = keyOf(refName), ref = db.users[rk];
  if (!ref) return { error: '그런 아이디가 없어요.' };
  if (rk === key) return { error: '나 자신을 추천인으로 넣을 수 없어요.' };
  if (u.refBy) return { error: '추천인은 이미 넣었어요.' };
  if (ref.refBy === key) return { error: '나를 추천한 친구를 다시 추천인으로 넣을 수 없어요.' };
  if (!atSignup && Date.now() - (u.createdAt || 0) > REF_LATE_DAYS * DAY) return { error: `추천인은 가입하고 ${REF_LATE_DAYS}일 안에만 넣을 수 있어요.` };
  u.refBy = rk; u.refAt = Date.now();
  (ref.invited ||= []).push({ key, name: u.name, at: Date.now(), done: false });
  const got = H.grant(u, REF_NEWBIE); H.giveBox?.(u, 'c', 2); got.push({ k: 'box', n: '일반 상자', count: 2 });
  H.sendMail?.(ref, { from: '골목대전', title: `🎉 ${u.name}님이 나를 추천인으로 골랐어요!`, body: `${u.name}님이 대전을 ${REF_GAMES}판 하면 추천 선물(${REF_FRIEND.gp.toLocaleString('ko-KR')}GP + 입수권 ${REF_FRIEND.tickets}장 + 희귀 상자)이 와요.`, reward: [] });
  H.notify?.(rk, `🎉 ${u.name}님이 나를 추천했어요!`);
  return { ok: true, got, ref: ref.name };
}
// 대전이 끝날 때마다: 뉴비가 대전 1판을 하면 추천한 친구에게 선물
function onBattle(u, key) {
  if (!u.refBy || u.refPaid) return;
  if ((u.counts?.games || 0) < REF_GAMES) return;
  const ref = db.users[u.refBy]; u.refPaid = true;
  if (!ref) return;
  const ent = (ref.invited || []).find((x) => x.key === key); if (ent) ent.done = true;
  ref.refRewarded = (ref.refRewarded || 0) + 1;
  if (ref.refRewarded > REF_MAX) { H.sendMail?.(ref, { from: '골목대전', title: `🎉 ${u.name}님이 골목에 자리 잡았어요!`, body: `초대 선물은 ${REF_MAX}명까지라 이번엔 마음만 전해요. 고마워요!`, reward: [] }); return; }
  H.grant(ref, REF_FRIEND); H.giveBox?.(ref, 'r', 1);
  const title = ref.refRewarded >= REF_TITLE_AT && !(ref.owned || []).includes('titles:recruiter');
  H.sendMail?.(ref, { from: '골목대전', title: `🎁 초대 선물 도착! (${u.name}님 대전 ${REF_GAMES}판 완료)`, body: `${REF_FRIEND.gp.toLocaleString('ko-KR')}GP와 입수권 ${REF_FRIEND.tickets}장, 🎁 희귀 상자 1개는 바로 넣어 뒀어요.${title ? ` 친구 ${REF_TITLE_AT}명을 데려온 기념 칭호 「골목 마당발」도 받아 가세요!` : ''}`, reward: title ? ['titles:recruiter'] : [] });
  H.notify?.(u.refBy, `🎁 ${u.name}님 덕분에 초대 선물이 왔어요!`);
}
// 조건(대전 판 수)이 바뀌거나 대전 끝 처리 전에 이미 채운 친구도 챙겨요: 이미 조건을 채운 초대 친구에게 선물을 줌
function settlePending(u) {
  for (const x of u.invited || []) { const nu = db.users[x.key]; if (nu && !nu.refPaid) onBattle(nu, x.key); }
}
function inviteView(u, key) {
  settlePending(u);
  return {
    code: u.name, refBy: u.refBy ? db.users[u.refBy]?.name || null : null,
    canSet: !u.refBy && Date.now() - (u.createdAt || 0) <= REF_LATE_DAYS * DAY,
    invited: (u.invited || []).map((x) => ({ name: x.name, at: x.at, done: x.done, games: Math.min(REF_GAMES, db.users[x.key]?.counts?.games || 0) })),
    rewarded: u.refRewarded || 0, newbie: REF_NEWBIE, friend: REF_FRIEND, games: REF_GAMES, max: REF_MAX, titleAt: REF_TITLE_AT,
  };
}

/* ---------- 🌱 뉴비 7일 연속 출석 ---------- */
function rookieState(u) {
  const r = u.rookie || { streak: 0, last: '', got: [], done: false };
  const active = !r.done && Date.now() - (u.createdAt || 0) <= ROOKIE_DAYS * DAY;
  const today = dayKey(), yest = dayKey(Date.now() - DAY);
  const streakNow = r.last === today || r.last === yest ? r.streak : 0; // 하루라도 빠지면 처음부터
  const can = active && r.last !== today;
  const next = can ? streakNow + 1 : streakNow; // 오늘 받으면 몇 일째
  return { active, done: !!r.done, streak: streakNow, can, next, got: r.got || [], list: ROOKIE, left: Math.max(0, Math.ceil(((u.createdAt || 0) + ROOKIE_DAYS * DAY - Date.now()) / DAY)) };
}
function rookieClaim(u) {
  const st = rookieState(u);
  if (!st.active) return { error: st.done ? '이미 7일을 모두 채웠어요!' : '뉴비 출석은 가입하고 30일까지만 할 수 있어요.' };
  if (!st.can) return { error: '오늘은 이미 받았어요. 내일 또 와요!' };
  const day = st.next; // 1~7
  const r = u.rookie || { streak: 0, last: '', got: [] };
  r.streak = day; r.last = dayKey();
  const R = ROOKIE[day - 1], first = !r.got.includes(day); // 연속이 끊겨 다시 하면 이미 받은 날 선물은 또 안 줘요 (7일째는 처음이니 꼭 받음)
  let got = [];
  if (first) {
    const { box, boxN, title, ...rest } = R;
    got = H.grant(u, rest);
    if (box) { H.giveBox?.(u, box, boxN || 1); got.push({ k: 'box', n: { c: '일반 상자', r: '희귀 상자', l: '전설 상자' }[box], count: boxN || 1 }); }
    if (title && !(u.owned || []).includes(`titles:${title}`)) { (u.owned ||= []).push(`titles:${title}`); got.push({ k: 'title', n: '골목 새싹 졸업' }); }
    r.got.push(day);
  }
  if (day >= 7) { r.done = true; H.sysChat?.(`🌱 ${u.name}님이 뉴비 7일 연속 출석을 완주했어요! 축하해 주세요!`); }
  u.rookie = r;
  return { ok: true, day, got, again: !first, rookie: rookieState(u) };
}

function api(route, u, key, b) {
  switch (route) {
    case 'GET /api/invite': return { invite: inviteView(u, key) };
    case 'POST /api/invite/set': { const r = link(u, key, b.name, false); return r.error ? r : { ...r, invite: inviteView(u, key) }; }
    case 'GET /api/rookie': return { rookie: rookieState(u) };
    case 'POST /api/rookie/claim': return rookieClaim(u);
    default: return null;
  }
}
module.exports = { settlePending, init, api, onSignup, onBattle, rookieState, rookieClaim, inviteView, ROOKIE, REF_NEWBIE, REF_FRIEND, REF_GAMES, dayKey };
