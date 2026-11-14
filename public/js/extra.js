// 추가 시스템 화면: 소식(공지·패치노트), 관리자, 전적 통계, 도감 보상, 친구 선물, 코스튬, 토너먼트, 밴픽, 리플레이, 이벤트, 푸시 알림

/* ---------- 코스튬 그림 (골목몬 그림과 같은 200×200 좌표에 덧그림) ---------- */
const COSTUME_ART = {
  wakppu: '', // 왁뿌볼 껍질은 waxShell()로 그림 (부서진 단계가 있어서)
  santa: `<path d="M60 48 Q72 6 112 10 Q146 14 150 48 Z" fill="#E8402C" stroke="#1a1433" stroke-width="4"/><path d="M112 10 Q150 -2 160 30" fill="none" stroke="#E8402C" stroke-width="14" stroke-linecap="round"/><circle cx="160" cy="32" r="11" fill="#fff" stroke="#1a1433" stroke-width="3"/><rect x="54" y="42" width="102" height="16" rx="8" fill="#fff" stroke="#1a1433" stroke-width="4"/>`,
  crown: `<path d="M62 50 L58 12 L80 30 L100 4 L120 30 L142 12 L138 50 Z" fill="#FFD23F" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><rect x="60" y="44" width="80" height="10" fill="#E7B23A" stroke="#1a1433" stroke-width="3"/><circle cx="100" cy="34" r="6" fill="#E8402C" stroke="#1a1433" stroke-width="2"/><circle cx="76" cy="38" r="4" fill="#2F7DE1"/><circle cx="124" cy="38" r="4" fill="#3FA34D"/>`,
  wizard: `<path d="M56 54 Q100 40 144 54 L128 58 Q100 50 72 58 Z" fill="#3B2F8C" stroke="#1a1433" stroke-width="4"/><path d="M72 52 L112 -6 Q118 22 128 52 Z" fill="#3B2F8C" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M78 44 Q100 38 124 44" stroke="#F2B705" stroke-width="6" fill="none"/><path d="M104 20l3 5 5 1-4 4 1 5-5-2-5 2 1-5-4-4 5-1z" fill="#FFE45C"/>`,
  catears: `<path d="M50 54 L58 10 L88 38 Z" fill="#2B2B38" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M150 54 L142 10 L112 38 Z" fill="#2B2B38" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M60 42 L63 22 L78 37 Z" fill="#F27FA5"/><path d="M140 42 L137 22 L122 37 Z" fill="#F27FA5"/>`,
  halo: `<ellipse cx="100" cy="16" rx="40" ry="10" fill="none" stroke="#FFE45C" stroke-width="9" class="cos-glow"/><ellipse cx="100" cy="16" rx="40" ry="10" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>`,
  pirate: `<path d="M44 44 Q100 0 156 44 Q130 56 100 50 Q70 56 44 44 Z" fill="#1a1433" stroke="#000" stroke-width="3"/><path d="M48 44 Q100 30 152 44" fill="none" stroke="#F2B705" stroke-width="4"/><circle cx="100" cy="28" r="8" fill="#fff"/><path d="M92 40l16-8M92 32l16 8" stroke="#fff" stroke-width="3"/>`,
  party: `<path d="M74 54 L104 -4 L130 54 Z" fill="#2EA8E0" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M82 38 L118 38 M90 22 L112 22" stroke="#FFE45C" stroke-width="6"/><circle cx="104" cy="-2" r="8" fill="#F27FA5" stroke="#1a1433" stroke-width="3"/>`,
  flower: `${[60, 80, 100, 120, 140].map((x, i) => `<circle cx="${x}" cy="${36 - Math.abs(x - 100) * .2}" r="11" fill="${['#F27FA5', '#FFE45C', '#fff', '#FFE45C', '#F27FA5'][i]}" stroke="#1a1433" stroke-width="3"/><circle cx="${x}" cy="${36 - Math.abs(x - 100) * .2}" r="4" fill="#F28A1E"/>`).join('')}<path d="M52 40 Q100 52 148 40" fill="none" stroke="#3FA34D" stroke-width="5"/>`,
  horns: `<path d="M64 52 Q46 30 56 6 Q64 26 82 40 Z" fill="#B31220" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><path d="M136 52 Q154 30 144 6 Q136 26 118 40 Z" fill="#B31220" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/>`,
  grad: `<path d="M40 30 L100 8 L160 30 L100 52 Z" fill="#1a1433" stroke="#000" stroke-width="3"/><path d="M70 40 L70 58 Q100 70 130 58 L130 40" fill="#2B2B38" stroke="#000" stroke-width="3"/><path d="M100 30 L150 40 L150 66" stroke="#F2B705" stroke-width="4" fill="none"/><circle cx="150" cy="68" r="5" fill="#F2B705"/>`,
  headset: `<path d="M40 96 Q40 18 100 18 Q160 18 160 96" fill="none" stroke="#1a1433" stroke-width="10"/><path d="M40 96 Q40 18 100 18 Q160 18 160 96" fill="none" stroke="#3CC9A7" stroke-width="5"/><rect x="26" y="80" width="24" height="40" rx="10" fill="#E8402C" stroke="#1a1433" stroke-width="4"/><rect x="150" y="80" width="24" height="40" rx="10" fill="#E8402C" stroke="#1a1433" stroke-width="4"/><path d="M38 118 Q50 146 80 146" fill="none" stroke="#1a1433" stroke-width="4"/><circle cx="82" cy="146" r="6" fill="#1a1433"/>`,
  ribbon: `<path d="M126 26 L98 8 Q90 20 98 40 Z M134 26 L162 8 Q170 20 162 40 Z" fill="#FF5C8A" stroke="#1a1433" stroke-width="4" stroke-linejoin="round"/><circle cx="130" cy="26" r="9" fill="#FF8FB4" stroke="#1a1433" stroke-width="4"/>`,
};
// 골목몬 그림(svg 문자열)에 코스튬을 덧그림
/* 왁뿌말랑왕: 말랑왕을 감싼 왁뿌볼(왁스 껍질). crack = 맞은 횟수 → 조각이 하나씩 떨어져 나감 (6번이면 다 깨짐) */
const WAX_CHUNKS = [
  'M100 52L196 52L196 120L150 118L128 96L112 100Z', 'M4 100L70 92L84 118L62 140L4 150Z', 'M84 108L118 104L136 128L120 160L86 162L66 136Z',
  'M150 118L196 120L196 210L120 210L120 160L136 128Z', 'M4 150L62 140L86 162L80 210L4 210Z', 'M4 52L100 52L112 100L84 108L70 92L4 100Z',
];
let WAX_UID = 0;
function waxShell(crack = 0, big = false) {
  const n = Math.max(0, Math.min(6, crack | 0)), id = `wx${++WAX_UID}`;
  const cx = 100, cy = big ? 132 : 132, rx = big ? 86 : 80, ry = big ? 68 : 64;
  const crumbs = n >= 6 ? [[52, 150, '#FFB3D9'], [138, 168, '#B9F3E4'], [96, 182, '#D9C6FF'], [70, 110, '#FFF1A8'], [150, 132, '#FFB3D9']].map(([x, y, c], k) => `<path d="M${x} ${y}l${6 + k} -4 4 ${7 - k} -9 3z" fill="${c}" stroke="#1a1433" stroke-width="2"/>`).join('') : '';
  if (n >= 6) return `<g class="wax-done">${crumbs}</g>`;
  const holes = WAX_CHUNKS.slice(0, n).map((d) => `<path d="${d}" fill="#000"/>`).join('');
  const next = WAX_CHUNKS.slice(n, n + 2).map((d, k) => `<path d="${d}" fill="none" stroke="#1a1433" stroke-width="${k ? 1.6 : 2.6}" stroke-linejoin="miter" opacity="${k ? .45 : .85}"/>`).join('');
  return `<g class="wax-ball"><defs>
      <radialGradient id="${id}g" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".18" stop-color="#FFE3F1"/><stop offset=".55" stop-color="#FFB3D9"/><stop offset="1" stop-color="#E88BC0"/></radialGradient>
      <mask id="${id}m"><rect x="0" y="0" width="200" height="210" fill="#fff"/>${holes}</mask>
      <clipPath id="${id}c"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath></defs>
    <g mask="url(#${id}m)">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}g)" stroke="#1a1433" stroke-width="4.5"/>
      <g clip-path="url(#${id}c)" opacity=".85">
        <path d="M20 120Q60 92 96 118T180 110" fill="none" stroke="#B9F3E4" stroke-width="16" stroke-linecap="round"/>
        <path d="M24 158Q70 134 104 160T184 150" fill="none" stroke="#D9C6FF" stroke-width="14" stroke-linecap="round"/>
        <path d="M40 186Q90 170 160 188" fill="none" stroke="#FFF1A8" stroke-width="12" stroke-linecap="round"/>
        <g clip-path="url(#${id}c)">${next}</g>
      </g>
      <ellipse cx="${cx - 34}" cy="${cy - 36}" rx="22" ry="10" fill="#fff" opacity=".8" transform="rotate(-24 ${cx - 34} ${cy - 36})"/>
      <circle cx="${cx + 44}" cy="${cy - 30}" r="5" fill="#fff" opacity=".85"/>
    </g>
    </g>`;
}
// 골목몬 그림(svg 문자열)에 코스튬을 덧그림. opts.crack: 왁뿌볼이 맞은 횟수
function cosArt(svg, costume, opts = {}) {
  if (!costume || typeof svg !== 'string') return svg;
  if (costume === 'wakppu') return svg.replace(/<svg\b/, '<svg data-cos="wakppu"').replace(/<\/svg>\s*$/, `<g class="cos cos-wakppu">${waxShell(opts.crack || 0, opts.big)}</g></svg>`);
  if (!COSTUME_ART[costume]) return svg;
  return svg.replace(/<svg\b/, `<svg data-cos="${costume}"`).replace(/<\/svg>\s*$/, `<g class="cos cos-${costume}">${COSTUME_ART[costume]}</g></svg>`);
}
/* 바삭바삭 왁스 부서지는 소리 (WebAudio로 직접 만듦) + 진동 */
let WAX_AC = null;
document.addEventListener('pointerdown', () => { try { WAX_AC ||= new (window.AudioContext || window.webkitAudioContext)(); if (WAX_AC.state === 'suspended') WAX_AC.resume(); } catch { /* 소리 없이 */ } }, { capture: true });
function waxCrunch(power = 1) {
  try {
    WAX_AC ||= new (window.AudioContext || window.webkitAudioContext)();
    const ac = WAX_AC; if (ac.state === 'suspended') ac.resume();
    const now = ac.currentTime + .01;
    if (!WAX_AC.noise) { const b = ac.createBuffer(1, ac.sampleRate * .5, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; WAX_AC.noise = b; }
    const out = ac.createGain(); out.gain.value = .9; out.connect(ac.destination);
    const crack = (t, len, freq, q, vol) => {
      const src = ac.createBufferSource(); src.buffer = WAX_AC.noise; src.playbackRate.value = .8 + Math.random() * .6;
      const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
      const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .0015); g.gain.exponentialRampToValueAtTime(.0008, t + len);
      src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(out); src.start(t, Math.random() * .4, len + .02);
    };
    // 첫 '빠각': 크고 날카로운 금
    crack(now, .05, 2600, 1.2, .9 * power);
    // 오도독 갈라지는 잔금들
    const n = 9 + Math.floor(power * 8);
    for (let i = 0; i < n; i++) { const t = now + .012 + Math.pow(Math.random(), 1.6) * .19; crack(t, .006 + Math.random() * .018, 1800 + Math.random() * 5200, 1 + Math.random() * 4, (.18 + Math.random() * .45) * power); }
    // 부스러기 떨어지는 사각사각 꼬리
    for (let i = 0; i < 7; i++) crack(now + .2 + Math.random() * .28, .004 + Math.random() * .01, 5000 + Math.random() * 4000, 2, .05 + Math.random() * .09);
    // 묵직한 톡 (말랑 속살)
    const o = ac.createOscillator(), og = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(180, now); o.frequency.exponentialRampToValueAtTime(55, now + .09);
    og.gain.setValueAtTime(.35 * power, now); og.gain.exponentialRampToValueAtTime(.001, now + .12); o.connect(og); og.connect(out); o.start(now); o.stop(now + .14);
  } catch { /* 소리를 못 내도 게임은 계속 */ }
  try { navigator.vibrate?.([14, 18, 8, 12, 6]); } catch { /* 진동 없음 */ }
}
// 껍질 조각이 튀어 나가는 연출 (el: 골목몬 그림 상자)
function waxShards(el, n = 9) {
  if (!el) return;
  const r = el.getBoundingClientRect(); const cols = ['#FFB3D9', '#B9F3E4', '#D9C6FF', '#FFF1A8', '#FFE3F1'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i'); s.className = 'wax-shard';
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 80;
    s.style.cssText = `left:${r.left + r.width * (.3 + Math.random() * .4)}px;top:${r.top + r.height * (.35 + Math.random() * .4)}px;background:${cols[i % cols.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d * .6 - 30}px;--rot:${(Math.random() - .5) * 720}deg;width:${6 + Math.random() * 10}px;height:${5 + Math.random() * 8}px`;
    document.body.appendChild(s); setTimeout(() => s.remove(), 950);
  }
}
const costumeSVG = (id, size = 64) => (id === 'wakppu' ? `<svg viewBox="14 60 172 140" width="${size}" height="${size * .8}" aria-hidden="true">${waxShell(0)}</svg>` : `<svg viewBox="20 -10 160 90" width="${size}" height="${size * .56}" aria-hidden="true">${COSTUME_ART[id] || ''}</svg>`);
(function patchArt() {
  // 기존 그림 함수들에 코스튬을 끼워 넣기: monArt(id, shiny, cls, mega, ..., {costume})는 그대로 두고, 객체를 받는 곳만 감쌈
  if (typeof gotItem === 'function') {
    const orig = gotItem;
    window.gotItem = gotItem = (x) => {
      if (x.k === 'costume') return `<div class="got-i got-cos">${costumeSVG(x.id, 90)}<b>코스튬: ${esc(x.n || x.id)}</b><small>내 골목몬에서 입힐 수 있어요</small></div>`;
      if (x.k === 'jelly') return `<div class="got-i"><span class="got-dice">🍮</span><b>말랑 젤리 ×${x.n}</b></div>`;
      if (x.k === 'fp') return `<div class="got-i"><span class="got-dice">💝</span><b>우정 포인트 +${x.n}</b></div>`;
      return orig(x);
    };
  }
})();

const timeAgo = (t) => { const s = Math.round((Date.now() - t) / 1000); if (s < 60) return '방금'; if (s < 3600) return `${Math.floor(s / 60)}분 전`; if (s < 86400) return `${Math.floor(s / 3600)}시간 전`; return `${Math.floor(s / 86400)}일 전`; };
const dateStr = (t) => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const KIND_N = { pvp: '친구 대전', rank: '랭크전', practice: '연습전', tag: '태그전', raid: '레이드', dungeon: '던전', tourney: '토너먼트' };

/* ---------- 소식: 공지·패치노트 ---------- */
async function showNews(back = showLobby) {
  G.screen = 'news'; app.className = '';
  app.innerHTML = `${topbar('📢 소식')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = await api('GET', '/api/news'); } catch (e) { return toast(e.message); }
  api('POST', '/api/news/seen').then(() => { if (G.user.badges) G.user.badges.news = 0; }).catch(() => {});
  let tab = 'all';
  const draw = () => {
    const list = v.list.filter((n) => tab === 'all' || n.kind === tab);
    app.innerHTML = `${topbar('📢 소식')}
      <div class="tabs styletabs">${[['all', '전체'], ['notice', '📌 공지'], ['patch', '🛠 패치노트']].map(([k, n]) => `<button data-tab="${k}" aria-selected="${tab === k}">${n}</button>`).join('')}</div>
      ${G.user.dev ? `<section class="panel"><h2>✍️ 글쓰기 (개발자)</h2><form id="nw" class="gd-form"><select name="kind"><option value="notice">공지</option><option value="patch">패치노트</option></select>
        <input name="title" maxlength="60" placeholder="제목" required><textarea name="body" rows="5" placeholder="내용 (줄바꿈 그대로 보여요)"></textarea><label class="rd-bots"><input type="checkbox" name="pin"> 맨 위에 고정 + 로비 띠 공지</label><button class="btn">올리기</button></form></section>` : ''}
      ${list.map((n) => `<article class="news ${n.kind} ${n.pin ? 'pin' : ''} ${n.at > v.seen ? 'new' : ''}"><header><em>${n.pin ? '📌 ' : ''}${n.kind === 'patch' ? '패치노트' : '공지'}</em>${n.at > v.seen ? '<b class="nw-new">NEW</b>' : ''}<small>${dateStr(n.at)}</small></header>
        <h3>${esc(n.title)}</h3><p>${esc(n.body).replace(/\n/g, '<br>')}</p>${G.user.dev && n.id.startsWith('n') ? `<button class="btn small paper" data-del="${n.id}">지우기</button>` : ''}</article>`).join('') || '<section class="panel"><p class="muted">아직 소식이 없어요.</p></section>'}`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-tab]').forEach((b) => { b.onclick = () => { tab = b.dataset.tab; draw(); }; });
    app.querySelector('#nw')?.addEventListener('submit', async (e) => { e.preventDefault(); const f = e.target; try { v.list = (await api('POST', '/api/dev/news', { kind: f.kind.value, title: f.title.value, body: f.body.value, pin: f.pin.checked })).list; NEWS_PIN = v.list.find((n) => n.pin) || null; toast('올렸어요!'); draw(); } catch (err) { toast(err.message); } });
    app.querySelectorAll('[data-del]').forEach((b) => { b.onclick = async () => { if (!confirm('지울까요?')) return; try { v.list = (await api('POST', '/api/dev/news/delete', { id: b.dataset.del })).list; NEWS_PIN = v.list.find((n) => n.pin) || null; draw(); } catch (err) { toast(err.message); } }; });
  };
  draw();
}
// 로비 위쪽 고정 공지 띠
let NEWS_PIN = null;
function newsBanner() { return NEWS_PIN ? `<button class="news-band" id="news-band">📌 <b>${esc(NEWS_PIN.title)}</b><span>자세히 ›</span></button>` : ''; }
function loadNewsPin() { G.newsAt = Date.now(); api('GET', '/api/news').then((v) => { const p = v.list.find((n) => n.pin); const changed = (p?.id || null) !== (NEWS_PIN?.id || null); NEWS_PIN = p || null; if (changed && G.screen === 'lobby') renderLobby(); }).catch(() => {}); }

/* ---------- 관리자 대시보드 ---------- */
async function showAdmin(back = showLobby) {
  G.screen = 'admin'; app.className = '';
  app.innerHTML = `${topbar('🛠 관리자')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let d; try { d = (await api('GET', '/api/dev/dash')).dash; } catch (e) { return toast(e.message); }
  const g = d.gist, ok = !g.on || (g.lastOkAgoSec !== null && g.lastOkAgoSec < 180 && !g.lastErr);
  app.innerHTML = `${topbar('🛠 관리자')}
    <section class="adm-grid">${[['접속 중', d.online], ['대전 중', d.battles], ['전체 계정', d.users], ['오늘 접속', d.today], ['이번 주 접속', d.week], ['길드', d.guilds], ['메모리', `${d.mem}MB`], ['켜진 지', `${Math.floor(d.uptime / 3600)}시간 ${Math.floor(d.uptime / 60) % 60}분`]].map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</section>
    <section class="panel adm-gist ${ok ? 'ok' : 'bad'}"><h2>${ok ? '✅' : '⚠️'} 데이터 백업 (Gist)</h2>
      <p>${!g.on ? 'Gist 백업이 꺼져 있어요 (로컬 저장만).' : `마지막 백업: ${g.lastOkAgoSec === null ? '아직 없음' : `${g.lastOkAgoSec}초 전`}${g.dirty ? ' · 올릴 변경 있음' : ''}${g.fails ? ` · 연속 실패 ${g.fails}번` : ''}`}</p>${g.lastErr ? `<p class="muted">최근 오류: ${esc(g.lastErr)}</p>` : ''}</section>
    <section class="panel"><h2>🔎 유저 찾기 · 지급</h2><form id="adm-find" class="row"><input name="name" placeholder="닉네임" required style="flex:1"><button class="btn small">찾기</button></form><div id="adm-user"></div></section>
    <section class="panel"><h2>🏆 토너먼트</h2><p class="muted">토요일 21시에 자동으로 열려요. 지금 바로 이번 회차를 진행할 수도 있어요.</p><button class="btn small" id="adm-tour">지금 토너먼트 진행하기</button></section>
    <section class="panel"><h2>👥 최근 접속</h2>${d.recent.map((r) => `<div class="adm-row"><b>${r.online ? '🟢' : '⚪'} ${esc(r.name)}</b><small>${timeAgo(r.at)}</small></div>`).join('')}</section>
    <section class="panel"><h2>📜 지급 기록</h2>${d.log.length ? d.log.map((l) => `<div class="adm-row"><b>${esc(l.to)}</b><small>${dateStr(l.at)} · ${esc(Object.entries(l.r).map(([k, v]) => `${k} ${v}`).join(', '))}${l.note ? ` · ${esc(l.note)}` : ''}</small></div>`).join('') : '<p class="muted">아직 없어요.</p>'}</section>`;
  app.querySelector('#back').onclick = back;
  app.querySelector('#adm-tour').onclick = async () => { if (!confirm('이번 회차 토너먼트를 지금 진행할까요? 신청한 사람들의 경기가 바로 치러져요.')) return; try { await api('POST', '/api/dev/tourney/run', {}); toast('토너먼트를 진행했어요!'); showTourney(() => showAdmin(back)); } catch (e) { toast(e.message); } };
  const box = app.querySelector('#adm-user');
  const drawUser = (u) => {
    box.innerHTML = `<div class="adm-card"><h3>${u.online ? '🟢' : '⚪'} ${esc(u.name)} <small>${u.guild ? `· ${esc(u.guild)}` : ''}</small></h3>
      <p>GP ${fmt(u.gp)} · 입수권 ${u.tickets} · 스킵권 ${u.skips} · 리롤권 ${u.rerolls} · 메가스톤 ${u.stones} · 길P ${u.gpt} · 우정 ${u.fp} · 젤리 ${u.jelly}</p>
      <p>골목몬 ${u.mons}마리 (${u.species}종) · 이로치: ${u.shinies.length ? esc(u.shinies.join(', ')) : '없음'}</p>
      <p>${u.wins}승 ${u.losses}패 · 랭크 ${u.rank}점 · 가입 ${u.createdAt ? dateStr(u.createdAt) : '-'} · 마지막 접속 ${u.lastSeen ? timeAgo(u.lastSeen) : '-'}</p>
      <form id="adm-give" class="adm-give"><h4>지급 (빼려면 음수)</h4>
        ${[['gp', 'GP'], ['tickets', '입수권'], ['skips', '스킵권'], ['rerolls', '리롤권'], ['stones', '메가스톤(랜덤)'], ['gpt', '길P']].map(([k, n]) => `<label>${n}<input type="number" name="${k}" value="0"></label>`).join('')}
        <label>골목몬<select name="mon"><option value="">없음</option><option value="random">랜덤</option>${Object.entries(G.data.MONSTERS).map(([id, m]) => `<option value="${id}">${esc(m.n)}</option>`).join('')}</select></label>
        <label class="ck"><input type="checkbox" name="shiny"> 이로치로</label>
        <label>코스튬<select name="costume"><option value="">없음</option>${Object.keys(COSTUME_ART).map((id) => `<option value="${id}">${id}</option>`).join('')}</select></label>
        <label class="wide">편지 내용 (비우면 기본 문구)<input name="note" maxlength="200" placeholder="예: 데이터 복구 보상이에요"></label>
        <button class="btn wide">🎁 지급하기</button></form></div>`;
    box.querySelector('#adm-give').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target;
      const r = {}; for (const k of ['gp', 'tickets', 'skips', 'rerolls', 'stones', 'gpt']) if (+f[k].value) r[k] = +f[k].value;
      if (f.mon.value) { r.mon = f.mon.value; if (f.shiny.checked) r.shiny = true; }
      if (f.costume.value) r.costume = f.costume.value;
      if (!Object.keys(r).length) return toast('지급할 것을 하나 이상 넣어 주세요.');
      if (!confirm(`${u.name}님에게 지급할까요?`)) return;
      try { drawUser((await api('POST', '/api/dev/give', { name: u.name, r, note: f.note.value })).info); toast('지급했어요!'); } catch (err) { toast(err.message); }
    };
  };
  app.querySelector('#adm-find').onsubmit = async (e) => { e.preventDefault(); try { drawUser((await api('POST', '/api/dev/user', { name: e.target.name.value.trim() })).info); } catch (err) { box.innerHTML = `<p class="muted">${esc(err.message)}</p>`; } };
}

/* ---------- 전적 통계 ---------- */
async function showStats(back = showLobby) {
  G.screen = 'stats'; app.className = '';
  app.innerHTML = `${topbar('📊 전적')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let s; try { s = (await api('GET', '/api/stats')).stats; } catch (e) { return toast(e.message); }
  const t = s.total, games = t.wins + t.losses + t.draws, rate = games ? Math.round((t.wins / games) * 100) : 0;
  const maxG = Math.max(1, ...s.daily.map((d) => d.g));
  app.innerHTML = `${topbar('📊 전적')}
    <section class="st-hero"><div class="st-ring" style="--p:${rate}"><b>${rate}%</b><small>승률</small></div>
      <div><b class="st-big">${t.wins}승 ${t.losses}패${t.draws ? ` ${t.draws}무` : ''}</b><p>최고 ${t.streakBest}연승 · 무피해 승 ${t.flawless} · 메가 ${t.megas} · Z기술 ${t.zmoves}</p><p>레이드 승 ${t.raidWins} · 태그 승 ${t.tagWins} · 연습 승 ${t.botWins} · 훈련장 최고 ${fmt(t.dummyBest)}</p></div></section>
    ${s.daily.length ? `<section class="panel"><h2>최근 2주 대전 수</h2><div class="st-bars">${s.daily.map((d) => `<div title="${d.d}: ${d.g}판 ${d.w}승"><i style="height:${(d.g / maxG) * 100}%"><u style="height:${d.g ? (d.w / d.g) * 100 : 0}%"></u></i><small>${d.d.slice(8)}</small></div>`).join('')}</div><p class="muted" style="font-size:12px">진한 부분이 이긴 판</p></section>` : ''}
    <section class="panel"><h2>골목몬별 기록</h2>${s.mons.length ? `<div class="st-mons">${s.mons.map((m) => `<div class="st-mon"><div class="st-art">${monArt(m.sp)}</div><div><b>${esc(m.n)}</b><small>${m.g}판 · 승률 ${Math.round((m.w / m.g) * 100)}% · 평균 딜 ${fmt(Math.round(m.dmg / m.g))} · ${m.kills}킬 · 최고 ${fmt(m.best)}</small><div class="qbar"><i style="width:${(m.w / m.g) * 100}%"></i></div></div></div>`).join('')}</div>` : '<p class="muted">대전을 하면 여기에 쌓여요. (이번 업데이트부터 기록돼요)</p>'}</section>
    ${s.h2h.length ? `<section class="panel"><h2>상대 전적</h2>${s.h2h.map((h) => `<div class="adm-row"><b>vs ${esc(h.n)}</b><small>${h.w}승 ${h.l}패${h.d ? ` ${h.d}무` : ''}</small></div>`).join('')}</section>` : ''}
    <section class="panel"><h2>최근 대전 · 리플레이</h2>${s.matches.length ? s.matches.map((m) => `<div class="st-match ${m.draw ? 'draw' : m.won ? 'win' : 'lose'}"><em>${m.draw ? '무' : m.won ? '승' : '패'}</em><div><b>${KIND_N[m.kind] || m.kind} · vs ${esc(m.opp || '?')}</b><small>${timeAgo(m.at)} · ${m.turns}턴 · ${m.mons.map((x) => esc(G.data.MONSTERS[x.s]?.n || x.s)).join(', ')}</small></div>${m.rep ? `<button class="btn small" data-rep="${m.rep}">▶ 다시 보기</button>` : ''}</div>`).join('') : '<p class="muted">아직 기록이 없어요.</p>'}</section>`;
  app.querySelector('#back').onclick = back;
  app.querySelectorAll('[data-rep]').forEach((b) => { b.onclick = () => playReplay(b.dataset.rep, () => showStats(back)); });
}

/* ---------- 리플레이 ---------- */
let REPLAY_BACK = null;
async function playReplay(id, back = showLobby) {
  let r; try { r = (await api('GET', `/api/replay?id=${encodeURIComponent(id)}`)).replay; } catch (e) { return toast(e.message); }
  REPLAY_BACK = back;
  G.replaying = true;
  Battle.enter({ t: 'battle', view: { ...r.start, spectator: true, mustAct: false }, spectator: true, practice: true, replay: true });
  toast(`▶ 리플레이: ${r.names.join(' vs ')}`);
  for (const t of r.turns) Battle.onTurn({ t: 'turn', events: t.events, view: { ...t.view, spectator: true, mustAct: false } });
  document.querySelector('.rp-exit')?.remove();
  const x = document.createElement('button');
  x.className = 'btn small paper rp-exit'; x.textContent = '✕ 리플레이 나가기';
  x.onclick = () => endReplay();
  document.body.appendChild(x);
}
function endReplay() { G.replaying = false; document.querySelector('.rp-exit')?.remove(); (REPLAY_BACK || showLobby)(); }
// 관전 나가기 버튼을 누르면 리플레이에서는 서버에 알리지 않고 돌아감
document.addEventListener('click', (e) => {
  if (!G.replaying) return;
  const b = e.target.closest('#leave-spec, .result-card .btn');
  if (!b) return;
  e.stopImmediatePropagation(); e.preventDefault();
  endReplay();
}, true);

/* ---------- 도감 수집 보상 ---------- */
async function showDexRewards(back) {
  let v; try { v = (await api('GET', '/api/dex/rewards')).dex; } catch (e) { return toast(e.message); }
  const draw = () => {
    const can = v.filter((g) => g.can).length;
    const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>📚 도감 수집 보상</h2><button class="btn small paper" data-x>닫기</button></div>
      ${can ? `<button class="btn wide" id="dx-all" style="margin-bottom:10px">받을 수 있는 보상 ${can}개 모두 받기</button>` : ''}
      <div class="dx-list">${v.map((g) => `<div class="dx-row ${g.got ? 'got' : g.can ? 'can' : ''}"><div><b>${esc(g.n)}</b><div class="qbar"><i style="width:${(g.val / g.goal) * 100}%"></i><span>${g.val} / ${g.goal}</span></div><div class="rws">${rewardChips(g.r)}${g.r.costume ? `<span class="rw">👑 코스튬</span>` : ''}</div></div>${g.got ? '<em>✓ 받음</em>' : g.can ? `<button class="btn small" data-dx="${g.id}">받기</button>` : ''}</div>`).join('')}</div>`);
    bg.querySelector('[data-x]').onclick = closeSheet;
    const claim = async (id) => { try { const r = await api('POST', '/api/dex/claim', { id }); setUser(r); v = r.dex; closeSheet(); showGot(r.got, '도감 보상!', () => { draw(); }); } catch (e) { toast(e.message); } };
    bg.querySelector('#dx-all')?.addEventListener('click', () => claim('all'));
    bg.querySelectorAll('[data-dx]').forEach((b) => { b.onclick = () => claim(b.dataset.dx); });
  };
  draw();
}

/* ---------- 친구 선물 (우정 포인트) ---------- */
async function friendGiftPanel(el, friends) {
  let v; try { v = (await api('GET', '/api/fgift')).fgift; } catch { return; }
  const draw = () => {
    el.innerHTML = `<section class="panel fg"><h2>💝 우정 선물 <small class="muted">오늘 ${v.left}/${v.max}번 남음 · 우정 포인트 ${fmt(v.fp)}</small></h2>
      <p class="muted" style="font-size:13px">하루에 친구마다 한 번 선물을 보낼 수 있어요. 받은 친구는 우정 포인트 ${v.each}점을 얻어요.</p>
      <div class="row" style="flex-wrap:wrap;gap:6px">${v.inbox ? `<button class="btn small" id="fg-claim">🎁 받은 선물 ${v.inbox}개 받기</button>` : ''}${friends.length ? `<button class="btn small paper" id="fg-all" ${v.left ? '' : 'disabled'}>모든 친구에게 보내기</button>` : ''}<button class="btn small paper" id="fg-shop">우정 상점</button></div>
      <div class="fg-list">${friends.map((f) => `<div class="adm-row"><b>${esc(f.name)}</b>${v.sent.includes(f.key) ? '<small>✓ 보냄</small>' : `<button class="btn small" data-fg="${esc(f.key)}" ${v.left ? '' : 'disabled'}>💝 보내기</button>`}</div>`).join('')}</div></section>`;
    el.querySelector('#fg-claim')?.addEventListener('click', async () => { try { const r = await api('POST', '/api/fgift/claim'); setUser(r); v = r.fgift; showGot(r.got, `${r.from.slice(0, 3).join(', ')}${r.from.length > 3 ? ' 외' : ''}님의 우정 선물`, draw); } catch (e) { toast(e.message); } });
    el.querySelector('#fg-all')?.addEventListener('click', async () => { try { const r = await api('POST', '/api/fgift/sendall'); v = r.fgift; toast(`${r.n}명에게 보냈어요!`); draw(); } catch (e) { toast(e.message); } });
    el.querySelectorAll('[data-fg]').forEach((b) => { b.onclick = async () => { try { v = (await api('POST', '/api/fgift/send', { key: b.dataset.fg })).fgift; toast('보냈어요!'); draw(); } catch (e) { toast(e.message); } }; });
    el.querySelector('#fg-shop').onclick = () => {
      const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>💝 우정 상점</h2><button class="btn small paper" data-x>닫기</button></div><p class="muted">우정 포인트 ${fmt(v.fp)}점</p>
        ${v.shop.map((it) => `<div class="adm-row"><b>${it.costume ? costumeSVG(it.costume, 40) : ''}${esc(it.n)}</b><button class="btn small" data-fs="${it.id}" ${v.fp >= it.fp ? '' : 'disabled'}>💝 ${it.fp}</button></div>`).join('')}`);
      bg.querySelector('[data-x]').onclick = closeSheet;
      bg.querySelectorAll('[data-fs]').forEach((b) => { b.onclick = async () => { try { const r = await api('POST', '/api/fgift/shop', { id: b.dataset.fs }); setUser(r); v = r.fgift; closeSheet(); showGot(r.got, '교환 완료!', draw); } catch (e) { toast(e.message); } }; });
    };
  };
  draw();
}

/* ---------- 코스튬 ---------- */
async function costumeSheet(mon, after) {
  let list; try { list = (await api('GET', '/api/costumes')).list; } catch (e) { return toast(e.message); }
  const sp = G.data.MONSTERS[mon.species];
  const draw = (preview = mon.costume || '') => {
    const bg = openSheet(`<div class="row" style="margin-bottom:8px"><h2>👑 코스튬</h2><button class="btn small paper" data-x>닫기</button></div>
      <div class="cos-prev${mon.shiny ? ' is-shiny' : ''}" id="cos-prev" style="--tc:${G.data.TYPES[sp.types[0]].c}">${cosArt(monArt(mon.species, mon.shiny), preview, { crack: 0 })}</div>
      ${preview === 'wakppu' ? '<p class="muted" style="text-align:center;margin:-4px 0 8px">👆 그림을 톡톡 눌러 왁뿌볼을 부숴 보세요 (소리 켜기!)</p>' : ''}
      <div class="cos-grid"><button class="cos-it ${!preview ? 'on' : ''}" data-cos=""><span class="cos-none">✕</span><b>벗기</b></button>
        ${list.map((c) => `<button class="cos-it ${preview === c.id ? 'on' : ''} ${c.own ? 'own' : ''}" data-cos="${c.id}">${costumeSVG(c.id, 64)}<b>${esc(c.n)}</b><small>${c.only ? `${esc(G.data.MONSTERS[c.only].n)} 전용 · ` : ''}${c.own ? '보유' : c.price ? `${fmt(c.price)}GP` : esc(c.d || '보상')}</small></button>`).join('')}</div>
      ${(() => { const c = list.find((x) => x.id === preview); if (!c) return ''; if (c.d) return `<p class="muted" style="margin:8px 0">${esc(c.d)}</p>`; return ''; })()}
      <div class="sc-pay">${(() => { const c = list.find((x) => x.id === preview);
        if (!preview) return '<button class="btn wide" id="cos-wear">코스튬 벗기</button>';
        if (c?.only && c.only !== mon.species) return `<p class="muted">${esc(G.data.MONSTERS[c.only].n)} 전용 코스튬이라 이 골목몬은 입을 수 없어요.${c.own ? '' : ' (상점에서 미리 사 둘 수는 있어요)'}</p>${c.own ? '' : `${c.price ? `<button class="btn" id="cos-buy">${ICON.gp(18)} ${fmt(c.price)}GP에 사기</button>` : ''}${c.jelly ? `<button class="btn mint" id="cos-jelly">🍮 젤리 ${c.jelly}개로 사기</button>` : ''}`}`;
        if (c?.own) return `<button class="btn wide" id="cos-wear">${esc(c.n)} 입히기</button>`;
        return `${c?.price ? `<button class="btn" id="cos-buy">${ICON.gp(18)} ${fmt(c.price)}GP에 사기</button>` : ''}${c?.jelly ? `<button class="btn mint" id="cos-jelly">🍮 젤리 ${c.jelly}개로 사기</button>` : ''}${!c?.price && !c?.jelly ? '<p class="muted">보상으로만 얻을 수 있어요.</p>' : ''}`; })()}</div>`);
    bg.querySelector('[data-x]').onclick = closeSheet;
    bg.querySelectorAll('[data-cos]').forEach((b) => { b.onclick = () => { closeSheet(); draw(b.dataset.cos); }; });
    bg.querySelector('#cos-wear')?.addEventListener('click', async () => { try { setUser(await api('POST', '/api/costume/wear', { uid: mon.uid, id: preview })); mon.costume = preview || undefined; closeSheet(); toast(preview ? '입혔어요!' : '벗겼어요.'); after?.(); } catch (e) { toast(e.message); } });
    const buy = async (pay) => { try { const r = await api('POST', '/api/costume/buy', { id: preview, pay }); setUser(r); list = (await api('GET', '/api/costumes')).list; closeSheet(); showGot(r.got, '코스튬을 샀어요!', () => draw(preview)); } catch (e) { toast(e.message); } };
    if (preview === 'wakppu') { let hits = 0; const box = bg.querySelector('#cos-prev'); box.style.cursor = 'pointer'; box.onclick = () => { hits = hits >= 6 ? 0 : hits + 1; box.innerHTML = cosArt(monArt(mon.species, mon.shiny), 'wakppu', { crack: hits }); box.classList.remove('wax-hit'); void box.offsetWidth; box.classList.add('wax-hit'); if (hits) { waxCrunch(hits >= 6 ? 1.3 : 1); waxShards(box, hits >= 6 ? 18 : 9); } }; }
    bg.querySelector('#cos-buy')?.addEventListener('click', () => buy('gp'));
    bg.querySelector('#cos-jelly')?.addEventListener('click', () => buy('jelly'));
  };
  draw();
}

/* ---------- 주간 토너먼트 ---------- */
async function showTourney(back = showLobby) {
  G.screen = 'tourney'; app.className = '';
  app.innerHTML = `${topbar('🏆 토너먼트')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/tourney')).tourney; } catch (e) { return toast(e.message); }
  const draw = () => {
    const c = v.cur, left = Math.max(0, c.run - Date.now()), d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60;
    const bracket = (x) => x.rounds.map((games, ri) => `<div class="tb-round"><h4>${games.length === 1 ? '결승' : games.length === 2 ? '4강' : `${games.length * 2}강`}</h4>${games.map((g) => `<div class="tb-game"><span class="${g.w === 0 ? 'w' : ''}">${esc(g.an)}</span><span class="${g.w === 1 ? 'w' : ''}">${esc(g.bn)}</span>${g.rep ? `<button class="btn small paper" data-rep="${g.rep}">▶</button>` : ''}</div>`).join('')}</div>`).join('');
    app.innerHTML = `${topbar('🏆 토너먼트')}
      <section class="tb-hero"><s aria-hidden="true"></s><small>골목 주간 토너먼트</small><h2>${c.done ? '이번 회차 끝!' : `${d ? `${d}일 ` : ''}${h}시간 ${m}분 뒤 시작`}</h2>
        <p>매주 <b>토요일 밤 9시</b>, 신청한 사람들의 덱 앞 ${c.size}마리로 AI가 대신 싸워요. 경기는 리플레이로 볼 수 있어요. 인원이 모자라면 골목대장이 채워요.</p>
        <div class="tb-rw"><b>🥇 우승</b><div class="rws">${rewardChips(v.reward[1])}<span class="rw">👑 칭호</span></div></div>
        <div class="tb-rw"><b>🥈 준우승</b><div class="rws">${rewardChips(v.reward[2])}<span class="rw">칭호</span></div></div>
        <div class="tb-rw"><b>🥉 4강</b><div class="rws">${rewardChips(v.reward[4])}</div></div>
        <div class="tb-rw"><b>참가</b><div class="rws">${rewardChips(v.reward.all)}</div></div>
        ${c.done ? '' : `<div class="tb-team">${c.team.map((t) => `<span class="${t.shiny ? 'is-shiny' : ''}">${monArt(t.species, t.shiny)}</span>`).join('')}<small>지금 덱 앞 ${c.size}마리로 나가요</small></div>
        <button class="btn wide ${c.joined ? 'paper' : ''}" id="tb-join">${c.joined ? '✓ 신청함 (누르면 취소)' : '🏆 참가 신청'}</button>`}
        <p class="muted" style="margin-top:6px">신청 ${c.count}명${c.entrants.length ? `: ${c.entrants.map(esc).join(', ')}` : ''}</p></section>
      ${c.done && c.rounds.length ? `<section class="panel"><h2>🏆 우승: ${esc(c.champion)}</h2><div class="tb-bracket">${bracket(c)}</div></section>` : ''}
      ${v.last ? `<section class="panel"><h2>지난 회차 (${v.last.week}) · 🏆 ${esc(v.last.champion || '-')}</h2><div class="tb-bracket">${bracket(v.last)}</div></section>` : ''}`;
    app.querySelector('#back').onclick = back;
    app.querySelector('#tb-join')?.addEventListener('click', async () => { try { v = (await api('POST', '/api/tourney/join', { on: !v.cur.joined })).tourney; toast(v.cur.joined ? '신청했어요! 토요일 밤 9시에 만나요.' : '신청을 취소했어요.'); draw(); } catch (e) { toast(e.message); } });
    app.querySelectorAll('[data-rep]').forEach((b) => { b.onclick = () => playReplay(b.dataset.rep, () => showTourney(back)); });
  };
  draw();
}

/* ---------- 밴픽 대전 ---------- */
let DRAFT_TIMER = null;
function onDraftMsg(m) {
  G.screen = 'draft'; app.className = '';
  clearInterval(DRAFT_TIMER);
  const card = (x, i, ban) => `<button class="df-mon${x.shiny ? ' is-shiny' : ''}${ban ? ' ban' : ''}" ${ban !== undefined ? `data-ban="${i}"` : ''} style="--tc:${G.data.TYPES[G.data.MONSTERS[x.species].types[0]].c}">${cosArt(monArt(x.species, x.shiny), x.costume)}<b>${esc(G.data.MONSTERS[x.species].n)}</b>${ban ? '<em>🚫 금지</em>' : ''}</button>`;
  app.innerHTML = `<div class="topbar"><h1>🚫 밴픽</h1><b class="df-clock" id="df-clock"></b></div>
    <section class="panel"><h2>${esc(m.oppName)}님의 덱 · 1마리를 금지하세요</h2><p class="muted">금지한 골목몬은 이번 대전에 못 나와요. 남은 ${m.size}마리로 싸워요.</p>
      <div class="df-grid">${m.opp.map((x, i) => card(x, i, m.myBan === null ? false : i === m.myBan)).join('')}</div>
      <p class="wait">${m.myBan === null ? '눌러서 금지할 골목몬을 고르세요' : m.oppDone ? '곧 시작해요!' : '상대가 고르는 중…'}</p></section>
    <section class="panel"><h2>내 덱</h2><div class="df-grid mine">${m.mine.map((x) => card(x, 0)).join('')}</div><p class="muted">${m.oppDone ? '상대가 금지를 골랐어요. (시작할 때 공개)' : '상대도 내 덱에서 1마리를 금지해요.'}</p></section>`;
  if (m.myBan === null) app.querySelectorAll('[data-ban]').forEach((b) => { b.onclick = () => { if (confirm(`${G.data.MONSTERS[m.opp[+b.dataset.ban].species].n}을(를) 금지할까요?`)) wsSend({ t: 'draft_ban', id: m.id, index: +b.dataset.ban }); }; });
  const tick = () => { const el = document.getElementById('df-clock'); if (!el) return clearInterval(DRAFT_TIMER); el.textContent = `${Math.max(0, Math.ceil((m.end - Date.now()) / 1000))}초`; };
  tick(); DRAFT_TIMER = setInterval(tick, 500);
}

/* ---------- 기간 한정 이벤트: 말랑말랑 축제 ---------- */
async function showMallang(back = showEvents) {
  G.screen = 'mallang'; app.className = '';
  app.innerHTML = `${topbar('🍮 말랑말랑 축제')}<p class="wait">불러오는 중…</p>`; app.querySelector('#back').onclick = back;
  let v; try { v = (await api('GET', '/api/event')).event; } catch (e) { return toast(e.message); }
  const draw = () => {
    app.innerHTML = `${topbar('🍮 말랑말랑 축제')}
      <section class="ml-hero"><s aria-hidden="true"></s><div class="ml-crown">${costumeSVG('wakppu', 150)}</div><small>기간 한정 이벤트 · ${dateStr(v.start)} ~ ${dateStr(v.end - 1)}</small><h2>말랑말랑 축제</h2><p>${esc(v.d)}</p>
        <div class="ml-jelly"><b>🍮 ${fmt(v.jelly)}</b><small>오늘 대전으로 ${v.today}/${v.dailyCap}개 · 매일 첫 접속 +${v.login}</small></div>
        <p class="muted" style="color:#fff9">친구 대전 승 4·패 2 · 태그·레이드 3·1 · 연습 2·1</p></section>
      <section class="panel"><h2>🛍️ 이벤트 상점</h2>${v.shop.map((it) => `<div class="ml-item">${it.costume ? costumeSVG(it.costume, 54) : '<span class="ml-ic">🎁</span>'}<div><b>${esc(it.n)}</b><small>${it.left !== null ? `남은 교환 ${it.left}번` : ''}</small></div>${it.own ? '<em>✓ 보유</em>' : `<button class="btn small" data-eb="${it.id}" ${v.live && v.jelly >= it.jelly && (it.left === null || it.left > 0) ? '' : 'disabled'}>🍮 ${it.jelly}</button>`}</div>`).join('')}</section>`;
    app.querySelector('#back').onclick = back;
    app.querySelectorAll('[data-eb]').forEach((b) => { b.onclick = async () => { try { const r = await api('POST', '/api/event/buy', { id: b.dataset.eb }); setUser(r); v = r.event; showGot(r.got, '교환 완료!', draw); } catch (e) { toast(e.message); } }; });
  };
  draw();
}
if (typeof EVENTS !== 'undefined') EVENTS.unshift({ id: 'mallang', title: '🍮 말랑말랑 축제', period: '11월 15일 ~ 11월 30일', desc: '대전하고 말랑 젤리를 모아 한정 코스튬 「왁뿌말랑왕」으로 바꿔요!', ends: Date.parse('2026-12-01T00:00:00+09:00') - 1, open: () => showMallang() });

/* ---------- 푸시 알림 ---------- */
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
let SW_REG = null;
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then((r) => { SW_REG = r; }).catch(() => {});
const b64uToBytes = (s) => { const b = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
async function pushEnable() {
  if (!pushSupported()) return toast('이 브라우저는 푸시 알림을 못 써요. 홈 화면에 추가한 앱이나 크롬에서 해 보세요.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return toast('알림 권한을 허용해야 받을 수 있어요.');
  const reg = SW_REG || await navigator.serviceWorker.ready;
  const { key } = await api('GET', '/api/push/key');
  if (!key) return toast('서버 알림 키가 아직 없어요. 잠시 뒤 다시 해 주세요.');
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64uToBytes(key) });
  await api('POST', '/api/push/sub', { sub: sub.toJSON() });
  await api('POST', '/api/push/test');
  toast('🔔 푸시 알림을 켰어요! 시험 알림이 곧 와요.');
}
async function pushDisable() {
  try { const reg = SW_REG || await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription(); await api('POST', '/api/push/unsub', { endpoint: sub?.endpoint || '' }); await sub?.unsubscribe(); } catch { /* 이미 꺼져 있음 */ }
  toast('푸시 알림을 껐어요.');
}
function pushSettingsHTML() {
  return `<section class="panel"><h2>🔔 푸시 알림</h2><p class="muted" style="font-size:13px">스카우트 준비, 원정 귀환, 대전 신청, 레이드 초대, 우정 선물, 토너먼트 결과를 휴대폰 알림으로 받아요. 게임을 보고 있을 때는 알림이 뜨지 않아요.</p>
    <div class="row"><button class="btn small" id="push-on">알림 켜기</button><button class="btn small paper" id="push-off">끄기</button><button class="btn small paper" id="push-test">시험 알림</button></div></section>`;
}
function bindPushSettings(root = app) {
  root.querySelector('#push-on')?.addEventListener('click', () => pushEnable().catch((e) => toast(e.message)));
  root.querySelector('#push-off')?.addEventListener('click', () => pushDisable());
  root.querySelector('#push-test')?.addEventListener('click', () => api('POST', '/api/push/test').then(() => toast('시험 알림을 보냈어요.')).catch((e) => toast(e.message)));
}
