'use strict';
const test = require('node:test');
const assert = require('node:assert');
const C = require('../server/casino');
const L = require('../server/luck');
const P = require('../server/progress');
const X = require('../server/extra');

const db = { users: {} }; const mails = [];
C.init(db, {}); L.init(db, { grant: P.grant, sendMail: (u, m) => mails.push(m), save: () => {}, sysChat: () => {}, notify: () => {} });
const mk = (name) => ({ name, gp: 1e6, tickets: 0, skips: 0, rerolls: 0, mons: [], stones: [], costumes: [], counts: {} });

test('하이로우: 맞히면 판돈이 불어나고, 받고 그만하기', () => {
  const u = mk('h');
  assert.ok(!C.api('POST /api/casino/hilo', u, 'h', { cur: 'gp', bet: 1000 }).error);
  assert.equal(u.gp, 1e6 - 1000);
  let r; for (let i = 0; i < 30 && u.hilo; i++) { const v = u.hilo.card.v; r = C.api('POST /api/casino/hilo/guess', u, 'h', { pick: v <= 7 ? 'hi' : 'lo' }); if (r.win && u.hilo && u.hilo.step >= 2) break; }
  if (u.hilo?.step) { const pot = u.hilo.pot, gp = u.gp; const c = C.api('POST /api/casino/hilo/cash', u, 'h', {}); assert.equal(c.cashed, pot); assert.equal(u.gp, gp + pot); }
  const o = C.hiloOdds(7); assert.ok(o.hi > 1.5 && o.lo > 1.5); assert.equal(C.hiloOdds(13).hi, 0);
});

test('경마: 출발 전 베팅, 1등이면 배당만큼', () => {
  const u = mk('rc'); db.users.rc = u;
  const r = L.raceBook(); r.at = Date.now() + 60e3;
  assert.ok(L.api('POST /api/race/bet', u, 'rc', { horse: 0, bet: 50 }).error, '최소 금액');
  for (let i = 0; i < 5; i++) assert.ok(!L.api('POST /api/race/bet', u, 'rc', { horse: i, bet: 1000 }).error);
  assert.ok(L.api('POST /api/race/bet', u, 'rc', { horse: 0, bet: 1000 }).error, '한 판에 5번까지');
  const before = u.gp; r.at = Date.now() - 1; L.raceBook();
  const last = L.api('GET /api/race', u, 'rc', {}).race.last[0];
  assert.equal(last.id, r.id); assert.equal(last.frames.length, 12);
  assert.equal(u.gp, before + Math.floor(1000 * r.horses[last.win].odds), '5마리 다 걸었으니 1등 몫을 받음');
  assert.ok(r.horses.every((h) => h.odds >= 1.2));
});

test('로또: 5개 고르기, 추첨, 1등 없으면 이월', () => {
  const u = mk('lt'); db.users.lt = u;
  const t = L.lottoBook(); t.at = Date.now() + 3600e3;
  assert.ok(L.api('POST /api/lotto/buy', u, 'lt', { nums: [1, 2, 3] }).error);
  assert.ok(L.api('POST /api/lotto/buy', u, 'lt', { nums: [1, 2, 3, 4, 5] }).ok);
  assert.ok(L.api('POST /api/lotto/buy', u, 'lt', { auto: true }).ok);
  const pot = t.pot, round = t.round; t.at = Date.now() - 1; L.lottoBook();
  const nt = L.api('GET /api/lotto', u, 'lt', {}).lotto;
  assert.equal(nt.round, round + 1); assert.equal(nt.hist[0].nums.length, 5);
  if (!nt.hist[0].firsts) assert.equal(nt.pot, pot, '1등이 없으면 상금 이월');
});

test('미스터리 상자: 사고 열기, 등급 스킨, 이로치 천장', () => {
  const u = mk('bx');
  assert.ok(L.api('POST /api/boxes/open', u, 'bx', { tier: 'c' }).error, '상자 없음');
  assert.ok(L.api('POST /api/boxes/buy', u, 'bx', { tier: 'l' }).error, '전설 상자는 못 삼');
  assert.ok(L.api('POST /api/boxes/buy', u, 'bx', { tier: 'c' }).ok); assert.equal(u.gp, 1e6 - 2000);
  L.giveBox(u, 'l', 200);
  let skins = 0, mons = 0; for (let i = 0; i < 200; i++) { const r = L.boxOpen(u, 'l'); assert.ok(r.ok); if (r.got.some((g) => g.k === 'costume')) skins++; if (r.got.some((g) => g.k === 'mon')) mons++; }
  assert.ok(skins > 0 && mons > 0);
  assert.ok(u.costumes.every((id) => X.COSTUMES[id] && !X.COSTUMES[id].limited), '한정판(왁뿌말랑왕)은 상자에서 안 나옴');
  u.boxPity = L.BOX_PITY - 1; L.giveBox(u, 'c'); const r = L.boxOpen(u, 'c'); assert.ok(r.got.some((g) => g.k === 'mon' && g.shiny), '천장');
});

test('스킨: 수십 개, 5등급, 왁뿌말랑왕은 전설 한정판', () => {
  const all = Object.values(X.COSTUMES);
  assert.ok(all.length >= 50);
  for (const g of ['rare', 'srare', 'hero', 'myth', 'legend']) assert.ok(all.some((c) => c.grade === g), g);
  assert.ok(all.every((c) => c.grade));
  assert.equal(X.COSTUMES.wakppu.grade, 'legend'); assert.ok(X.COSTUMES.wakppu.limited); assert.equal(X.COSTUMES.wakppu.price, 0);
});
