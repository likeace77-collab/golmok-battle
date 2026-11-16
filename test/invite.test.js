'use strict';
const test = require('node:test');
const assert = require('node:assert');
const IV = require('../server/invite');
const P = require('../server/progress');

const db = { users: {} }; const mails = []; const boxes = [];
IV.init(db, { keyOf: (n) => n.toLowerCase(), grant: P.grant, giveBox: (u, t, n) => boxes.push([u.name, t, n || 1]), sendMail: (u, m) => mails.push([u.name, m]), notify: () => {}, sysChat: () => {} });
const mk = (name, ago = 0) => ({ ...P.newProgress(), name, createdAt: Date.now() - ago, owned: [] });

test('추천: 뉴비는 바로, 친구는 뉴비가 1판 하면', () => {
  db.users.friend = mk('Friend'); db.users.newbie = mk('Newbie');
  assert.ok(IV.onSignup(db.users.newbie, 'newbie', 'nobody').error);
  assert.ok(IV.onSignup(db.users.newbie, 'newbie', 'Newbie').error, '자기 자신 X');
  const r = IV.onSignup(db.users.newbie, 'newbie', 'Friend'); assert.ok(r.ok);
  assert.equal(db.users.newbie.gp, 10000); assert.equal(db.users.newbie.tickets, 3);
  assert.deepEqual(boxes.at(-1), ['Newbie', 'c', 2]);
  assert.ok(IV.onSignup(db.users.newbie, 'newbie', 'Friend').error, '두 번 X');
  IV.onBattle(db.users.newbie, 'newbie'); assert.equal(db.users.friend.gp, 0, '아직 대전 전');
  db.users.newbie.counts.games = 1; IV.onBattle(db.users.newbie, 'newbie');
  assert.equal(db.users.friend.gp, 15000); assert.equal(db.users.friend.tickets, 2);
  IV.onBattle(db.users.newbie, 'newbie'); assert.equal(db.users.friend.gp, 15000, '한 번만');
  assert.equal(IV.inviteView(db.users.friend, 'friend').invited[0].done, true);
});
test('추천: 늦게 넣기는 가입 3일 안만, 3명이면 칭호', () => {
  db.users.old = mk('Old', 5 * 86400e3);
  assert.match(IV.api('POST /api/invite/set', db.users.old, 'old', { name: 'Friend' }).error, /3일/);
  for (const n of ['A1', 'A2']) { const u = (db.users[n.toLowerCase()] = mk(n)); assert.ok(IV.api('POST /api/invite/set', u, n.toLowerCase(), { name: 'Friend' }).ok); u.counts.games = 3; IV.onBattle(u, n.toLowerCase()); }
  assert.deepEqual(mails.at(-1)[1].reward, ['titles:recruiter']);
});
test('뉴비 7일 연속 출석: 날마다 선물, 7일째 막대한 선물, 끊기면 처음부터', () => {
  const u = mk('Rookie'); u.mons = [];
  const day = (n) => IV.dayKey(Date.now() - n * 86400e3);
  assert.equal(IV.rookieClaim(u).day, 1); assert.equal(u.gp, 3000);
  assert.ok(IV.rookieClaim(u).error, '하루 한 번');
  for (let d = 2; d <= 6; d++) { u.rookie.last = day(1); const r = IV.rookieClaim(u); assert.equal(r.day, d); }
  u.rookie.last = day(2); // 하루 빠짐 → 1일째부터
  const again = IV.rookieClaim(u); assert.equal(again.day, 1); assert.ok(again.again, '이미 받은 날은 선물 없음');
  for (let d = 2; d <= 6; d++) { u.rookie.last = day(1); IV.rookieClaim(u); }
  u.rookie.last = day(1); const gp = u.gp; const r7 = IV.rookieClaim(u);
  assert.equal(r7.day, 7); assert.equal(u.gp, gp + 100000); assert.ok(u.owned.includes('titles:sprout')); assert.ok(r7.got.some((g) => g.k === 'mon' && g.shiny));
  assert.ok(IV.rookieClaim(u).error, '끝');
  assert.equal(IV.rookieState(mk('Vet', 40 * 86400e3)).active, false, '가입 30일 넘으면 없음');
});

test('이미 대전을 한 친구도 초대 화면을 열면 선물', () => {
  db.users.late = mk('Late'); db.users.nn = mk('Nn');
  IV.onSignup(db.users.nn, 'nn', 'Late'); db.users.nn.counts.games = 1; // 대전은 했는데 선물 처리 전
  assert.equal(db.users.late.gp, 0);
  const v = IV.inviteView(db.users.late, 'late');
  assert.equal(db.users.late.gp, 15000); assert.equal(v.rewarded, 1); assert.ok(v.invited[0].done);
});
