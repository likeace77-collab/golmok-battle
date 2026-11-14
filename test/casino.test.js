const test = require('node:test');
const assert = require('node:assert');
const C = require('../server/casino');

const mk = () => { const db = {}; C.init(db, {}); return { db, u: { name: 't', gp: 1e9, rerolls: 1000, skips: 1000, tickets: 1000 } }; };

test('casino: house always wins in the long run (RTP < 1)', () => {
  let ev = 0; for (const [s, w] of C.SYM) { const p = w / 100; ev += p ** 3 * C.TRIPLE[s] + 3 * p * p * (1 - p) * C.PAIR[s]; }
  assert.ok(ev < 0.95, `slot RTP ${ev}`);
  const sc = C.PRIZES.reduce((a, [p, w]) => a + p * w / 1e6, 0) / C.SCRATCH_PRICE;
  assert.ok(sc < 0.7, `scratch RTP ${sc}`);
});

test('casino: bets are validated and taken', () => {
  const { u } = mk();
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'stones', bet: 1 }).error);
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'gp', bet: 99 }).error);
  assert.ok(C.api('POST /api/casino/slot', { gp: 50 }, 'k', { cur: 'gp', bet: 100 }).error);
  const before = u.gp, r = C.api('POST /api/casino/slot', u, 'k', { cur: 'gp', bet: 1000 });
  assert.strictEqual(u.gp, before - 1000 + r.win);
  assert.ok(C.api('POST /api/casino/roulette', u, 'k', { cur: 'gp', bet: 1000, kind: 'num', pick: 37 }).error);
});

test('casino: double-up and scratch tickets are consistent', () => {
  const { u } = mk();
  C.api('POST /api/casino/double', u, 'k', { cur: 'gp', bet: 1000 });
  assert.ok(C.api('POST /api/casino/cash', u, 'k', {}).error, 'must flip once first');
  const f = C.api('POST /api/casino/flip', u, 'k', { pick: 'head' });
  if (f.win) assert.strictEqual(u.dbl.pot, 2000); else assert.strictEqual(u.dbl, undefined);
  for (let i = 0; i < 200; i++) {
    const r = C.api('POST /api/casino/scratch', u, 'k', {});
    const counts = {}; r.cells.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    const triples = Object.entries(counts).filter(([, n]) => n >= 3);
    if (r.prize) assert.deepStrictEqual(triples, [[String(r.prize), 3]]); else assert.strictEqual(triples.length, 0);
  }
});

test('casino: daily play cap', () => {
  const { u } = mk();
  for (let i = 0; i < 300; i++) assert.ok(!C.api('POST /api/casino/slot', u, 'k', { cur: 'gp', bet: 100 }).error);
  assert.ok(C.api('POST /api/casino/slot', u, 'k', { cur: 'gp', bet: 100 }).error);
});
