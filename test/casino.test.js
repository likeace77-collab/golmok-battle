const test = require('node:test');
const assert = require('node:assert');
const C = require('../server/casino');

const mk = () => { const db = {}; C.init(db, {}); return { db, u: { name: 't', gp: 1e9, coins: 1e7, rerolls: 1000, skips: 1000, tickets: 1000 } }; };

test('casino: house always wins in the long run (RTP < 1)', () => {
  let ev = 0; for (const [s, w] of C.SYM) { const p = w / 100; ev += p ** 3 * C.TRIPLE[s] + 3 * p * p * (1 - p) * C.PAIR[s]; }
  assert.ok(ev < 0.95, `slot RTP ${ev}`);
  const sc = C.PRIZES.reduce((a, [p, w]) => a + p * w / 1e6, 0) / C.SCRATCH_PRICE;
  assert.ok(sc < 0.7, `scratch RTP ${sc}`);
});

test('casino: bets are validated and taken', () => {
  const { u } = mk();
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'stones', bet: 1 }).error);
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'gp', bet: 1000 }).error, 'GP는 도박장에서 못 씀');
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'coins', bet: 501 }).error);
  assert.ok(C.api('POST /api/casino/slot', { coins: 5 }, 'k', { cur: 'coins', bet: 10 }).error);
  const before = u.coins, r = C.api('POST /api/casino/slot', u, 'k', { cur: 'coins', bet: 10 });
  assert.strictEqual(u.coins, before - 10 + r.win);
  assert.ok(C.api('POST /api/casino/roulette', u, 'k', { cur: 'coins', bet: 10, kind: 'num', pick: 37 }).error);
});

test('casino: 환전소 GP ↔ 도박코인 (1:100, 한도 없음)', () => {
  const u = { name: 'x', gp: 1234567, coins: 0 };
  assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'buy', n: 12346 }).error, 'GP 모자람');
  assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'buy', n: 12345 }).ok);
  assert.strictEqual(u.coins, 12345); assert.strictEqual(u.gp, 67);
  for (let i = 0; i < 50; i++) assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'sell', n: 1 }).ok, '여러 번 해도 한도 없음');
  assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'sell', n: 12295 }).ok);
  assert.strictEqual(u.coins, 0); assert.strictEqual(u.gp, 1234567);
  assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'sell', n: 1 }).error);
  assert.ok(C.api('POST /api/casino/exchange', u, 'k', { dir: 'buy', n: 0 }).error);
});

test('casino: double-up and scratch tickets are consistent', () => {
  const { u } = mk();
  C.api('POST /api/casino/double', u, 'k', { cur: 'coins', bet: 10 });
  assert.ok(C.api('POST /api/casino/cash', u, 'k', {}).error, 'must flip once first');
  const f = C.api('POST /api/casino/flip', u, 'k', { pick: 'head' });
  if (f.win) assert.strictEqual(u.dbl.pot, 20); else assert.strictEqual(u.dbl, undefined);
  for (let i = 0; i < 200; i++) {
    const r = C.api('POST /api/casino/scratch', u, 'k', {});
    const counts = {}; r.cells.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    const triples = Object.entries(counts).filter(([, n]) => n >= 3);
    if (r.prize) assert.deepStrictEqual(triples, [[String(r.prize), 3]]); else assert.strictEqual(triples.length, 0);
  }
});

test('casino: daily play cap', () => {
  const { u } = mk();
  for (let i = 0; i < 300; i++) assert.ok(!C.api('POST /api/casino/slot', u, 'k', { cur: 'coins', bet: 1 }).error);
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'coins', bet: 1 }).error);
});
