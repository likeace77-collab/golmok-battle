// 실제 서버와 브라우저 두 개로 온라인 대전을 끝까지 플레이합니다.
const { chromium, devices } = require(process.env.PW || 'playwright');
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');

const OUT = process.env.OUT || '.'; const PORT = 3000 + Math.floor(Math.random() * 5000); const URL = `http://localhost:${PORT}`;
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gm-'));
const startServer = () => new Promise((res) => {
  const p = spawn('node', ['server/index.js'], { env: { ...process.env, PORT, DATA_DIR: dataDir, TURN_SECONDS: 20, LEAVE_GRACE_SECONDS: 4 }, stdio: ['ignore', 'pipe', 'inherit'] });
  process.once('exit', () => p.kill());
  p.stdout.once('data', () => res(p));
});
const shot = (page, n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });

async function signup(ctx, name) {
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load/.test(m.text())) errors.push(m.text()); });
  await page.goto(`${URL}/?speed=0.02`);
  await page.click('[data-m=signup]');
  await page.click('[name=name]'); // 실제로 눌러서 입력되는지 확인
  await page.keyboard.type(name);
  await page.click('[name=password]');
  await page.keyboard.type('secret123');
  await page.click('form .btn');
  await page.waitForSelector('#go-team');
  return { page, errors };
}

// 지금 할 수 있는 행동을 하나 합니다. 끝나면 true.
async function playStep(page) {
  return page.evaluate(() => {
    if (document.querySelector('.result')) return true;
    (document.querySelector('.pv-lead:not([disabled])') || document.querySelector('.mb:not([disabled])') || document.querySelector('.sw:not([disabled])'))?.click();
    return false;
  });
}

(async () => {
  let server = await startServer();
  const browser = await chromium.launch();
  const phone = devices['iPhone 13'];
  const c1 = await browser.newContext({ ...phone }), c2 = await browser.newContext({ ...phone });
  const a = await signup(c1, '철수'), b = await signup(c2, '영희');

  // 아바타, 팀 저장
  await a.page.click('#go-ava');
  await a.page.click('[data-k=hair][data-v="5"]');
  await a.page.click('[data-k=hat][data-v="2"]');
  await shot(a.page, 'avatar');
  await a.page.click('#save');
  await a.page.waitForSelector('#go-team');
  await a.page.click('#go-team');
  await a.page.waitForSelector('#new-deck');
  // 덱 5개까지 만들고 이름 붙이기
  for (let i = 0; i < 4; i++) {
    await a.page.click('#new-deck');
    await a.page.fill('#deck-name', `<b>덱${i + 2}`);
    await a.page.click('#save');
    await a.page.waitForSelector('.deck:nth-of-type(' + (i + 2) + ')');
    await a.page.waitForFunction((n) => document.querySelectorAll('.deck').length === n, i + 2);
  }
  if (await a.page.$('#new-deck')) throw new Error('덱이 5개를 넘을 수 있음');
  // 두 번째 덱만 구성을 다르게
  await a.page.click('[data-open="1"]');
  await a.page.waitForSelector('[data-rm="5"]');
  await a.page.click('#deck-name');
  await a.page.keyboard.press('Control+A');
  await a.page.keyboard.type('이름바꿈');
  await a.page.click('[data-rm="5"]');
  await a.page.click('[data-edit="0"]');
  await a.page.waitForSelector('.sheet');
  await shot(a.page, 'team-sheet');
  await a.page.click('[data-x]');
  await a.page.click('#save');
  await a.page.waitForSelector('[data-use="1"]');
  await a.page.click('[data-use="1"]');
  await a.page.waitForSelector('.deck.on [data-use="1"][disabled]');
  await shot(a.page, 'decks');
  if (!/이름바꿈/.test(await a.page.textContent('.deck.on'))) throw new Error('덱 이름이 안 바뀜');
  const sizes = await a.page.$$eval('.deck .mini', (l) => l.map((x) => x.children.length));
  if (sizes[0] !== 6 || sizes[1] !== 5) throw new Error(`덱 구성이 섞임: ${sizes}`);
  await a.page.click('[data-del="4"]'); await a.page.click('[data-del="4"]');
  await a.page.waitForFunction(() => document.querySelectorAll('.deck').length === 4);
  await a.page.click('#back');
  await a.page.waitForSelector('#go-team');

  // 대전 신청과 수락
  await a.page.waitForSelector('[data-ch]');
  await shot(a.page, 'lobby');
  await a.page.click('[data-ch]');
  await b.page.waitForSelector('[data-acc]');
  await b.page.click('[data-acc]');
  await a.page.waitForSelector('.pv-lead'); await b.page.waitForSelector('.pv-lead');
  if (await a.page.locator('.pv-lead').count() !== 3) throw new Error('3대3인데 내 덱 수가 다름');
  await shot(a.page, 'preview');
  await a.page.click('[data-lead="2"]');
  await a.page.waitForSelector('.sw.picked');
  await shot(a.page, 'preview-wait');
  await b.page.click('[data-lead="1"]');
  await a.page.waitForSelector('.mb'); await b.page.waitForSelector('.mb');
  const leads = await a.page.$$eval('.plate .nm', (l) => l.map((x) => x.textContent.trim()));
  console.log('선봉:', leads);
  if (!/맷돌이/.test(leads[0]) && !/주전이/.test(leads[0])) throw new Error(`상대 선봉이 다름: ${leads}`);
  await shot(a.page, 'battle-start');
  // 메가진화: 버튼 누르고 기술 고르면 같은 턴에 공격까지
  await a.page.click('#to-mega');
  await shot(a.page, 'mega-armed');
  await a.page.evaluate(() => document.querySelector('.mb:not([disabled])').click());
  await b.page.evaluate(() => document.querySelector('.mb:not([disabled])').click());
  await a.page.waitForSelector('#m-me.mega', { timeout: 8000 });
  await a.page.waitForSelector('#to-mega[disabled], .sw:not([disabled])', { timeout: 8000 });
  await shot(a.page, 'mega-after');
  console.log('메가 후:', await a.page.textContent('#p-me .nm'));

  // 몇 턴 진행 후 재접속 확인
  let midShot = false, reconnected = false, turns = 0;
  for (let i = 0; i < 1500; i++) {
    const [d1, d2] = await Promise.all([playStep(a.page), playStep(b.page)]);
    if (d1 && d2) break;
    await a.page.waitForTimeout(60);
    turns++;
    if (i % 200 === 0) console.log('진행', i, await a.page.textContent('#say'), '/', await b.page.textContent('#say'));
    if (!midShot && i > 8 && await a.page.$('.mb')) { midShot = true; await shot(a.page, 'battle-mid'); }
    if (!reconnected && turns > 30) {
      reconnected = true;
      await b.page.reload();
      await b.page.waitForSelector('.scene');
      console.log('재접속 복귀 OK');
    }
  }
  if (!await a.page.$('.result')) { await shot(a.page, 'stuck-a'); await shot(b.page, 'stuck-b'); throw new Error('온라인 대전이 끝나지 않음'); }
  await shot(a.page, 'result');
  await a.page.click('#to-lobby');
  await a.page.waitForSelector('#go-team');
  const rec = await a.page.textContent('.profile .muted');
  console.log('전적 표시:', rec);
  if (!/1승|1패|1무/.test(rec)) throw new Error('전적이 반영되지 않음');

  // 도감: 31마리, 상세에 소개, 스탯, 상성, 전체 스킬
  await b.page.click('#to-lobby');
  await b.page.waitForSelector('#go-team');
  await a.page.click('#go-dex');
  await a.page.waitForSelector('[data-dex]');
  const cnt = await a.page.locator('[data-dex]').count();
  if (cnt !== 31) throw new Error(`도감 수 ${cnt}`);
  await shot(a.page, 'dex');
  await a.page.click('[data-dex=meokarak]');
  await a.page.waitForSelector('.sheet .mv');
  await a.page.waitForTimeout(100);
  await a.page.screenshot({ path: path.join(OUT, 'dex-entry.png') });
  const skills = await a.page.locator('.sheet .mv').count();
  if (skills !== 8) throw new Error(`도감 스킬 수 ${skills}`);
  await a.page.click('.sheet [data-x]');
  await a.page.click('[data-t=water]');
  if (await a.page.locator('[data-dex]').count() >= 31) throw new Error('타입 필터 안 됨');
  await a.page.click('#back');
  await a.page.waitForSelector('#go-team');

  // 대전 중 나가면 패배: 잠깐의 새로고침은 이어지고, 안 돌아오면 상대 승리
  await a.page.waitForSelector('[data-ch]');
  await a.page.click('[data-ch]');
  await b.page.waitForSelector('[data-acc]');
  await b.page.click('[data-acc]');
  await a.page.click('[data-lead="0"]'); await b.page.click('[data-lead="0"]');
  await a.page.waitForSelector('.mb'); await b.page.waitForSelector('.mb');
  await b.page.reload();
  await b.page.waitForSelector('.mb');
  await a.page.waitForTimeout(5000);
  if (await a.page.$('.result')) throw new Error('새로고침했는데 패배 처리됨');
  console.log('유예 안 재접속 OK');
  await b.page.close();
  await a.page.waitForSelector('#say');
  await a.page.waitForFunction(() => /상대가 나갔습니다/.test(document.body.textContent), null, { timeout: 3000 });
  await shot(a.page, 'leave-note');
  await a.page.waitForSelector('.result', { timeout: 9000 });
  const verdict = await a.page.textContent('.result .title');
  if (verdict !== '승리') throw new Error(`탈주 결과: ${verdict}`);
  await a.page.click('#to-lobby');
  await a.page.waitForSelector('#go-team');
  const b2 = await c2.newPage();
  await b2.goto(`${URL}/?speed=0.02`);
  await b2.waitForSelector('#go-team');
  await b2.waitForFunction(() => /패배 처리/.test(document.getElementById('toast').textContent), null, { timeout: 3000 });
  console.log('탈주 패배 OK:', await a.page.textContent('.profile .muted'), '/', await b2.textContent('.profile .muted'));
  await a.page.waitForTimeout(300);

  // 서버 재시작 후 로그인 유지, 연습전 한 판
  await a.page.waitForTimeout(400);
  server.kill(); await new Promise((r) => server.once('exit', r));
  server = await startServer();
  await a.page.reload();
  await a.page.waitForSelector('#go-bot');
  await a.page.waitForTimeout(800);
  await a.page.click('#go-bot');
  await a.page.waitForSelector('.pv-lead');
  for (let i = 0; i < 3000 && !(await playStep(a.page)); i++) await a.page.waitForTimeout(120);
  if (!await a.page.$('.result')) throw new Error('연습전이 끝나지 않음');
  console.log('연습전 완주 OK');

  // 데스크톱 폭과 시작 화면
  const c3 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p3 = await c3.newPage();
  await p3.goto(URL); await p3.waitForSelector('.title');
  await shot(p3, 'auth-desktop');

  const errs = [...a.errors, ...b.errors];
  console.log('브라우저 오류:', errs.length ? errs : '없음');
  await browser.close(); server.kill();
  if (errs.length) process.exit(1);
})().catch((e) => { console.error(e); process.exit(1); });
