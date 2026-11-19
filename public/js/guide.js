'use strict';
/* 골목대전 가이드: 게임의 모든 시스템을 장(챕터)별로 알려 주는 튜토리얼.
   카드마다 「직접 가 보기」로 그 화면을 열 수 있고, 떠 있는 「📖 가이드」 버튼으로 돌아와요. 다 보면 보상! */
const GD = { ch: 0, card: 0, back: null };
const gdRead = () => { try { return JSON.parse(localStorage.getItem('guide-read') || '{}'); } catch { return {}; } };
const gdMark = (ci, k) => { try { const r = gdRead(); (r[ci] ||= []); if (!r[ci].includes(k)) r[ci].push(k); localStorage.setItem('guide-read', JSON.stringify(r)); } catch { /* 저장 못 함 */ } };
const gdMon = (...ids) => ids.map((id) => `<span class="gd-mon">${monArt(id)}</span>`).join('');
const gdChip = (t) => `<span class="gd-type" style="--c:${G.data.TYPES[t].c}">${esc(G.data.TYPES[t].n)}</span>`;
const gdEff = (a, d) => { const v = G.data.CHART?.[a]?.[d] ?? 1; return v; };

// 로비 버튼을 눌러 그 화면으로 (튜토리얼을 끝낸 뒤에만)
function gdGo(id, before) {
  if (!G.user.tutorial) return toast('스타터 덱을 고른 뒤에 가 볼 수 있어요!');
  closeSheet(); showLobby(); before?.();
  setTimeout(() => { const b = document.getElementById(id); if (b) b.click(); else toast('로비에서 찾아보세요!'); gdPill(true); }, 60);
}
function gdPill(on) {
  let p = document.getElementById('gd-pill');
  if (!on) { p?.remove(); return; }
  if (!p) { p = document.createElement('button'); p.id = 'gd-pill'; p.className = 'gd-pill'; p.innerHTML = '📖 가이드로'; document.body.appendChild(p); }
  p.onclick = () => showGuide(GD.ch, GD.card);
}

// 가이드용 예시 합체몬 그림 (진짜 합체몬이 아니라 화면에서만 잠깐 쓰는 가짜 종: 목록엔 안 나옴)
function gdFz(key, parents, n, types, look) {
  const id = `__gd_${key}`;
  if (!G.data.MONSTERS[id]) Object.defineProperty(G.data.MONSTERS, id, { value: { n, types, base: { hp: 80, atk: 80, def: 80, spa: 80, spd: 80, spe: 80 }, moves: [], parents, fz: true, look }, enumerable: false, configurable: true });
  return typeof fusionSVG === 'function' ? `<span class="gd-mon gd-fz">${fusionSVG(id)}</span>` : '<span class="gd-big">🧬</span>';
}
const gdFuse = (a, b) => `${gdMon(a)}<b class="tu-x">＋</b>${gdMon(b)}<b class="tu-x">＝</b>${gdFz(`${a}_${b}`, [a, b], '?', [G.data.MONSTERS[a].types[0], G.data.MONSTERS[b].types[0]], { split: 'v', mark: 1, hue: 0 })}`;

const GUIDE = [
  { id: 'start', icon: '🏁', t: '시작하기', cards: [
    { h: '골목대전에 온 걸 환영해요!', art: () => gdMon('yeontan', 'malrang', 'yeoubi'), p: '골목 곳곳에 사는 <b>골목몬</b>을 모아 <b>덱</b>을 짜고, 친구나 골목대장과 <b>턴제 대전</b>을 하는 게임이에요. 모은 골목몬끼리 <b>합체</b>해서 세상에 하나뿐인 골목몬을 만들 수도 있어요! 이 가이드는 게임의 거의 모든 시스템을 알려 줘요. 끝까지 보면 <b>선물</b>도 있어요.' },
    { h: '지갑 읽는 법', art: () => `<div class="gd-wallet">${walletHTML()}</div>`, p: '화면 위 지갑에 재화가 보여요.<br>• <b>GP</b>: 기본 돈. 스카우트, 합체, 강화, 기술 바꾸기, 상점 등 거의 모든 곳에 써요.<br>• <b>골목몬 입수권</b>: 스카우트를 GP 대신 공짜로.<br>• <b>1시간 스킵권</b>: 기다리는 시간을 줄여요.<br>• <b>리롤권 🎲</b>: 스카우트 후보 다시 뽑기, 성격·합체몬 특성 다시 뽑기.<br>• <b>💎 메가스톤</b>: 메가진화에 필요해요.' },
    { h: '덱 관리', art: () => '<span class="gd-big">🗂️</span>', go: 'go-team', p: '덱은 여러 개 만들 수 있고, 덱마다 골목몬을 최대 <b>6마리</b>까지 넣어요. 대전에는 <b>덱 앞에서부터</b> 인원수만큼 나가요. 순서를 바꾸고, 기술과 도구도 덱에서 정해요.' },
    { h: '대전 인원과 밴픽', art: () => '<span class="gd-big">1️⃣ 3️⃣ 6️⃣ 🚫</span>', p: '로비에서 <b>1대1 · 3대3 · 6대6</b>을 골라요. <b>🚫 밴픽</b>을 켜면 서로 상대 덱에서 1마리씩 금지하고 시작해요. 친구 대전에도, 골목대장 대전에도 쓸 수 있어요.' },
    { h: '새내기 혜택', art: () => '<span class="gd-big">🌱🎁</span>', go: 'go-invite', p: '가입하고 30일 안에 <b>7일 연속 접속</b>하면 날마다 선물, 7일째엔 <b>300,000GP · 입수권 25장 · 전설 상자 3개 · 이로치 골목몬</b>! 친구가 초대해 줬다면 가입할 때나 가입 3일 안에 <b>추천인 아이디</b>를 넣으면 선물을 또 받아요. 로비 위 🌱 띠와 「🎉 친구 초대」에서 확인해요.' },
  ] },
  { id: 'battle', icon: '⚔️', t: '대전 기초', cards: [
    { h: '첫 대전: 골목대장', art: () => '<span class="gd-big">🤖</span>', go: 'go-bot', p: '<b>골목대장</b>은 컴퓨터 상대예요. 난이도는 <b>쉬움 · 보통 · 어려움 · 지옥</b>. 친구가 없을 때도 언제든 연습할 수 있어요.' },
    { h: '선봉 고르기', art: () => '<span class="gd-big">👀</span>', p: '대전이 시작되면 먼저 <b>상대 덱을 미리 보고</b>, 내 덱에서 <b>먼저 내보낼 골목몬</b>을 골라요. 상대 타입을 보고 유리한 골목몬을 내보내는 게 첫 번째 수싸움!' },
    { h: '기술 고르기', art: () => '<div class="gd-moves"><b>💥 물리</b><b>✨ 특수</b><b>🌀 변화</b></div>', p: '매 턴 기술을 하나 골라요. <b>물리</b>는 공격·방어, <b>특수</b>는 특공·특방으로 계산하고, <b>변화</b> 기술은 능력치를 올리거나 상태이상을 걸어요. 기술마다 <b>위력 · 명중 · PP</b>가 있고, <b>스피드</b>가 빠른 쪽이 먼저 움직여요. (썬더의 「신속」처럼 항상 먼저 움직이는 특성도 있어요!)' },
    { h: '타입 상성', go: 'go-types', art: () => `<div class="gd-eff">${[['fire', 'grass'], ['water', 'fire'], ['grass', 'water']].map(([a, d]) => `${gdChip(a)}<i>→</i>${gdChip(d)}<em>×${gdEff(a, d)}</em>`).join('<br>')}</div>`, p: () => `타입은 <b>${Object.keys(G.data.TYPES).filter((t) => t !== 'none').length}가지</b>예요. 상성이 좋으면 <b>2배</b>, 나쁘면 <b>절반</b>, 아예 안 통하기도 해요. 골목몬과 같은 타입의 기술을 쓰면 <b>1.5배</b>! 합체몬은 두 부모에게서 타입을 하나씩 받아서 처음 보는 타입 조합이 나오기도 해요.` },
    { h: '교체', art: () => '<span class="gd-big">🔄</span>', p: '기술 대신 <b>다른 골목몬으로 교체</b>할 수 있어요. 교체는 기술보다 먼저 일어나요. 불리한 상대를 만나면 바꿔서 공격을 대신 맞게 하는 것도 전략이에요.' },
    { h: '상태이상과 능력치', art: () => '<div class="gd-moves"><b>🔥 화상</b><b>☠️ 독</b><b>⚡ 마비</b><b>💤 수면</b><b>🧊 얼음</b></div>', p: '화상은 공격이 약해지고, 독은 매 턴 피해, 마비는 느려지고 가끔 못 움직여요. 수면·얼음은 한동안 행동을 못 해요. 기술로 <b>능력치를 단계별로</b> 올리고 내릴 수도 있어요.' },
    { h: '날씨와 필드 효과', go: 'go-fields', art: () => '<span class="gd-big">☀️🌧️🌪️❄️</span>', p: '<b>땡볕 · 소나기 · 황사 · 눈</b> 4가지 날씨가 있어요. 땡볕은 불 기술이, 소나기는 물 기술이 세져요. 대전마다 <b>필드 효과</b>가 붙기도 해요.' },
    { h: '특성', art: () => gdMon('usan', 'kkamo', 'thunder'), p: '골목몬마다 <b>특성</b>이 하나씩 있어요. 우산령은 나오면 비를 내리고, 까모는 상대 명중률을 떨어뜨리고, 썬더는 항상 먼저 움직여요. <b>합체몬</b>은 다른 어떤 합체몬과도 겹치지 않는 자기만의 특성을 받아요!' },
    { h: '도구', art: () => '<span class="gd-big">🧪🎒🧤</span>', p: () => `도구는 <b>${Object.keys(G.data.ITEMS || {}).length || 20}가지</b>가 있고 <b>전부 무료</b>예요. 골목몬 한 마리에 하나씩 들려요. 덱 관리에서 골목몬을 눌러 정해요.` },
    { h: '리플레이', go: 'go-stats', art: () => '<span class="gd-big">▶️⏮⏭</span>', p: '끝난 대전은 <b>리플레이</b>로 다시 볼 수 있어요. ⏮◀⏯▶⏭ 버튼과 막대로 원하는 턴으로 옮기고, 속도를 바꾸고, <b>상대 시점</b>으로도 볼 수 있어요. 채팅에 공유하거나 링크로 보낼 수도 있어요.' },
  ] },
  { id: 'power', icon: '💥', t: '필살기', cards: [
    { h: '메가진화', go: 'go-stones', art: () => ['yeontan', 'kettle', 'tuhon'].map((id) => stoneSVG(id, 56)).join(''), p: '그 골목몬의 <b>메가스톤</b>이 있으면 대전 중에 <b>메가진화</b>할 수 있어요. 모습이 바뀌고 능력치가 크게 올라요. <b>한 판에 한 번</b>! 메가스톤은 상점(5,000GP)·업적·패스에서 얻어요. <b>합체몬은 메가스톤 없이도</b> 메가진화해요.' },
    { h: 'Z기술', art: () => '<span class="gd-big">⚡Z⚡</span>', p: '골목몬마다 고유한 <b>Z기술</b>이 있어요. 엄청난 위력에 특별한 효과까지! <b>한 판에 한 번</b>. 기술 고르기 화면에서 Z 버튼을 켜고 기술을 누르면 돼요. 합체몬은 부모의 Z기술을 물려받아요.' },
    { h: '거다이맥스', art: () => `<span class="gd-mon">${typeof gmaxSVG === 'function' ? gmaxSVG('malrang') : ''}</span>`, p: '<b>한 판에 한 번</b>, 골목몬을 <b>거대하게</b> 만들어요. 몇 턴 동안 체력이 크게 늘고, 기술이 강력한 <b>다이기술</b>과 전용 <b>거다이기술</b>로 바뀌어요. 합체몬은 두 부모의 거다이맥스 모습을 꿰맨 모습에, 두 부모의 거다이기술 이름을 섞은 <b>전용 거다이기술</b>을 써요.' },
    { h: '이로치', art: () => `<span class="gd-mon is-shiny">${monArt('yeoubi', true)}</span>`, p: '가끔 색이 다른 <b>이로치</b> 골목몬이 나와요. 스카우트에서 <b>40마리 중 1마리</b> 꼴. 능력은 같지만 귀해요! 이로치를 강화 먹이로 주면 이로치가 <b>옮겨 붙고</b>, 이로치로 합체하면 합체몬도 <b>이로치</b>로 태어나요.' },
  ] },
  { id: 'fusion', icon: '🧬', t: '합체', cards: [
    { h: '합체란?', go: 'go-fuse', art: () => gdFuse('yeontan', 'yeoubi'), p: '서로 다른 골목몬 <b>두 마리</b>를 합쳐 <b>새 골목몬</b>을 탄생시켜요. 이름, 모습, 타입, 능력치, 기술, 특성이 모두 두 부모에게서 섞여 나와요. 합체할 때마다 <b>세상에 하나뿐인 새 종</b>이 생기고, 합체하기 전엔 무엇이 나올지 아무도 몰라요!' },
    { h: '합체하는 법', go: 'go-fuse', art: () => `${ICON.gp(56)}<b class="tu-x">3,000</b>`, p: '로비의 <b>「🧬 합체」</b>에서 골목몬 두 마리를 고르고 <b>3,000GP</b>를 내요. 두 부모는 <b>사라지고</b> 합체몬 한 마리가 태어나요 (덱에서도 빠져요). <b>되돌릴 수 없으니</b> 신중하게! 원정 중이거나 교환에 걸린 골목몬, 이미 합체몬인 골목몬은 재료로 못 써요.' },
    { h: '무엇이 섞이나', art: () => gdFuse('kkamo', 'malrang'), p: '• <b>이름</b>: 두 이름을 섞어 지어요.<br>• <b>모습</b>: 두 골목몬을 반씩 꿰맨 모습. 꿰맨 자국, 색 바꾸기, 무늬가 무작위로 붙어요.<br>• <b>타입</b>: 부모 한 마리에게서 하나씩 (둘이 같으면 단일 타입).<br>• <b>능력치</b>: 두 부모의 <b>평균</b>에서 조금(-8%~+12%) 흔들려요.' },
    { h: '합체몬의 기술', art: () => '<div class="gd-moves"><b>🧬 합체기 ×2</b><b>📜 물려받기 ×8</b></div>', p: '합체몬은 기술 <b>10개</b>를 배울 수 있어요.<br>• <b>합체기 2개</b>: 한쪽 부모의 공격 기술 몸에 다른 쪽 기술의 효과를 섞은 <b>새 기술</b>. 첫 번째 합체기가 합체몬의 <b>전용기</b>예요.<br>• <b>물려받은 기술 8개</b>: 두 부모의 기술 중에서, <b>부모의 전용기를 먼저</b> 물려받아요.<br>• 단, 그 골목몬 몸에만 있는 장치에 기대는 기술(단조의 단련, 선생님의 수업 기술 등)은 안 물려받아요.' },
    { h: '세상에 하나뿐인 특성', art: () => '<span class="gd-big">✨🔒</span>', p: '합체몬은 <b>다른 어떤 합체몬도 안 가진</b> 특성을 받아요. 「불꽃 심장」(불 기술 1.3배), 「멀티스케일」(체력이 가득할 때 받는 피해 감소), 「비 부르기」, 「재생」처럼 <b>140가지 넘는</b> 특성 중에서 몸에 맞는 걸 더 자주 골라 줘요. 마음에 안 들면 <b>리롤권 3장 또는 1,500GP</b>로 다시 뽑아요.' },
    { h: '✨ 합체 대성공', art: () => '<span class="gd-big">🌈✨</span>', p: '합체할 때 <b>5% 확률</b>로 <b>대성공</b>! 능력치가 두 부모 평균의 <b>1.2배 이상</b>으로 태어나고, 위력이 더 센 <b>대성공 합체기</b>가 하나 더 붙어요. 대성공하면 채팅에 온 골목이 다 알게 돼요.' },
    { h: '🧬🧬 3단 합체', go: 'go-fuse', art: () => gdFz('tri', ['yeontan', 'kkamo', 'yeoubi'], '?', ['fire', 'spirit'], { split: 'y', mark: 2, hue: 0 }), p: '합체 화면의 「3단 합체」 탭에서 서로 다른 골목몬 <b>세 마리</b>를 <b>6,000GP</b>로 합쳐요. 모습은 세 조각, 이름도 세 이름을 한 조각씩. 타입은 셋 중 두 마리에게서, 기술은 세 부모 모두에게서 물려받고, 합체기는 <b>세 기술</b>을 섞어 만들어요.' },
    { h: '물려받는 것과 사라지는 것', art: () => '<span class="gd-big">💗✨ / ⬆️➕</span>', p: '<b>이어받아요</b>: 부모 중 하나라도 <b>이로치</b>면 이로치, <b>친밀도</b>는 부모의 평균.<br><b>사라져요</b>: 부모의 <b>강화(+)</b>, <b>기술 추가 칸</b>, 스킨, 이름. 합체몬은 처음부터 새로 키워요.<br>합체몬은 <b>다시 합체할 수 없어요</b>.' },
    { h: '합체몬 키우기', go: 'go-box', art: () => '<span class="gd-big">⬆️ +5</span>', p: '합체몬은 같은 종이 없으니 <b>합체한 부모 종 중 아무거나</b> 먹여서 강화해요 (최대 +5). 기술 바꾸기, 기술 추가 칸, 성격, 이름 짓기, 친밀도도 다른 골목몬과 똑같이 돼요. 훈련장에서도 내 합체몬을 꺼내 시험해 볼 수 있어요.' },
    { h: '합체 계보와 갤러리', go: 'go-fuse', art: () => '<span class="gd-big">🌳🖼️💗</span>', p: '<b>합체 계보</b>에서 내가 만든 합체몬과 그 부모를 모두 볼 수 있어요. <b>합체몬 갤러리</b>에는 모두의 합체몬이 모여요. 한 주에 <b>하트 5개</b>를 마음에 드는 합체몬에 줄 수 있고, 주가 끝나면 하트 <b>1~3등</b> 주인에게 <b>10,000 · 5,000 · 3,000GP</b>, 1등에겐 칭호 「이 주의 합체몬」!' },
    { h: '합체 꿀팁', art: () => gdMon('tuhon', 'yeoubi', 'kkamo'), p: '• 능력치는 평균이라, <b>둘 다 강한</b> 부모끼리 합치면 강한 합체몬이 나와요.<br>• 원하는 <b>타입 조합</b>을 노려 보세요. 부모의 타입이 하나씩 들어가요.<br>• 겹친 골목몬은 먼저 강화에 쓰고, 남는 걸 합체에!<br>• <b>이로치</b> 한 마리만 있어도 이로치 합체몬이 돼요.' },
  ] },
  { id: 'collect', icon: '📦', t: '모으고 키우기', cards: [
    { h: '스카우트', go: 'go-scout', art: () => `${ICON.ticket(54)}${ICON.gp(58)}`, p: '<b>20시간마다</b> 후보 <b>8마리</b> 중 1마리를 <b>2,500GP</b>나 <b>입수권</b>으로 데려와요. 기다리기 싫으면 <b>스킵권</b>을, 후보가 마음에 안 들면 <b>리롤권</b>으로 다시 뽑아요. 원하는 골목몬이나 이로치가 나올 때까지 <b>자동 리롤</b>도 돼요.' },
    { h: '내 골목몬', go: 'go-box', art: () => '<span class="gd-big">📦</span>', p: '모은 골목몬을 모두 보는 곳이에요. 골목몬을 눌러 <b>기술 바꾸기(500GP)</b>, <b>강화</b>, <b>성격</b>, <b>이름</b>, <b>스킨</b>, <b>친밀도</b>를 관리해요.' },
    { h: '강화', art: () => '<span class="gd-big">⬆️ +5</span>', p: '같은 골목몬을 <b>먹이면</b> +1씩 강화돼요 (최대 <b>+5</b>, GP가 조금 들어요). +1마다 능력치가 <b>4%</b> 올라요. 강화된 골목몬을 먹이면 그만큼 더 올라가요.' },
    { h: '➕ 기술 추가 칸', art: () => '<span class="gd-big">1️⃣2️⃣3️⃣4️⃣➕5️⃣</span>', p: '<b>20,000GP</b>로 골목몬 한 마리의 기술 칸을 <b>5칸</b>으로 늘려요 (한 마리에 한 번). 그 골목몬은 대전에서 기술을 5개 써요. 내 골목몬 → 기술 맨 아래 버튼!' },
    { h: '성격', art: () => '<span class="gd-big">😤😌🤓</span>', p: '골목몬마다 <b>25가지 성격</b> 중 하나가 있어요. 성격에 따라 능력치 하나가 <b>+10%</b>, 다른 하나가 <b>-10%</b>예요 (변화 없는 성격도 있어요). <b>리롤권 1장 또는 1,000GP</b>로 다시 뽑을 수 있어요.' },
    { h: '친밀도', art: () => '<span class="gd-big">💗</span>', p: '하루 한 번 <b>쓰다듬고</b>, <b>간식</b>(300GP)을 주고, 같이 대전에서 이기면 친밀도가 올라요. 친밀도가 높으면 대전에서 <b>쓰러질 공격을 버티거나</b>, 상태이상을 스스로 털어내기도 해요!' },
    { h: '✏️ 이름 짓기', art: () => '<span class="gd-big">✏️🏷️</span>', p: '골목몬 이름 옆 ✏️ 로 <b>20자까지</b> 이름을 지어 줄 수 있어요 (무료). 그 한 마리에게만 붙고, 대전에서도 그 이름으로 나와요.' },
    { h: '스킨', go: 'go-skins', art: () => '<span class="gd-big">🎨</span>', p: '골목몬 전용 <b>스킨</b>은 모습, 이펙트, 소리까지 바꿔요. <b>희귀 · 초희귀 · 영웅 · 신화 · 전설</b> 등급이 있어요. 상자에서 나오기도 하고, 이벤트 한정판도 있어요.' },
    { h: '원정', go: 'go-expe', art: () => '<span class="gd-big">🏪⛰️🏮🌊</span>', p: '골목몬을 <b>원정</b>에 보내면 시간이 지난 뒤 GP와 아이템을 가져와요. 장소가 <b>좋아하는 타입</b>을 보내면 더 좋아요.' },
    { h: '도감', go: 'go-dex', art: () => '<span class="gd-big">📖</span>', p: '모든 골목몬의 능력치, 기술, 특성, 메가진화, 거다이맥스를 볼 수 있어요. 모은 종류와 이로치 수에 따라 <b>도감 보상</b>도 받아요.' },
  ] },
  { id: 'reward', icon: '🎁', t: '보상 받기', cards: [
    { h: '출석 · 퀘스트 · 업적', go: 'go-rew', art: () => '<span class="gd-big">📅✅🏅</span>', p: '매일 <b>출석</b>, 하루·한 주 <b>퀘스트</b>, 큰 목표의 <b>업적</b>! 「보상」 화면에서 한 번에 받아요.' },
    { h: '오늘의 퍼즐과 미션', go: 'go-mis', art: () => '<span class="gd-big">🧩🎯</span>', p: '매일 바뀌는 <b>퍼즐</b>(정해진 골목몬으로 몇 턴 안에 이기기)과 <b>미션</b> 3개가 있어요. 미션마다 GP와 리롤권, 셋 다 깨면 보너스!' },
    { h: '시즌 패스', go: 'go-pass', art: () => ICON.pass(60), p: '대전하면 <b>패스 포인트</b>가 쌓여요. 시즌은 <b>2주</b>, 레벨마다 보상!' },
    { h: '상점', go: 'go-shop', art: () => '<span class="gd-big">🛒</span>', p: '입수권, 스킵권, 리롤권, 메가스톤, 골목몬을 GP로 사요. 매일 바뀌는 <b>특가</b>와 <b>공짜 선물</b>도 있어요.' },
    { h: '우편함', go: 'go-mail', art: () => '<span class="gd-big">✉️</span>', p: '선물, 대회 결과, 공모전 상품, 칭호 보상이 <b>우편</b>으로 와요. 숫자가 뜨면 꼭 열어 봐요.' },
  ] },
  { id: 'together', icon: '👥', t: '함께 하기', cards: [
    { h: '친구와 대전', go: 'go-players', art: () => '<span class="gd-big">🤝</span>', p: '「접속 중인 플레이어」에서 <b>대전 신청</b>을 누르면 돼요. 인원(1·3·6)과 밴픽은 신청하는 사람이 정해요.' },
    { h: '친구 · 우정 선물 · 교환', go: 'go-friends', art: () => '<span class="gd-big">💝🔄</span>', p: '매일 친구에게 <b>우정 선물</b>을 주고받아 우정 포인트를 모아요. 친구와 골목몬을 <b>교환</b>할 수도 있어요 (10% 확률로 이로치!).' },
    { h: '친구 초대', go: 'go-invite', art: () => '<span class="gd-big">🎉📨</span>', p: '내 아이디(초대 링크)로 친구가 가입하면 친구는 바로 선물, 친구가 <b>대전 1판</b>을 하면 나도 <b>15,000GP · 입수권 · 희귀 상자</b>! 3명을 데려오면 칭호 「골목 마당발」.' },
    { h: '채팅', go: 'go-chat', art: () => '<span class="gd-big">💬</span>', p: '<b>월드 채팅</b>과 <b>길드 채팅</b>이 있어요. 대박, 합체 대성공, 대회 결과도 채팅에 떠요. 리플레이도 채팅에 공유할 수 있어요.' },
    { h: '길드', go: 'go-guild', art: () => '<span class="gd-big">🏰</span>', p: '<b>3,000GP</b>로 길드를 만들거나 들어가요. <b>길드 퀘스트</b>, <b>길드 패스</b>, <b>길드전</b>, 길드 꾸미기까지!' },
    { h: '태그 2대2 · 레이드', go: 'go-raid', art: () => '<span class="gd-big">👫⚔️🐲</span>', p: '두 명씩 팀을 짜는 <b>태그 2대2</b>, 최대 4명이 거대한 보스와 싸우는 <b>레이드</b>(하루 3번)가 있어요.' },
    { h: '월드 보스', go: 'go-wb', art: () => '<span class="gd-big">🌍👹</span>', p: '서버의 <b>모두가 한 주 동안</b> 함께 체력을 깎는 거대 보스예요. 하루 3번 도전, 쓰러뜨리면 모두에게 보상, 많이 깎은 순위 보상도 있어요.' },
    { h: '관전', art: () => '<span class="gd-big">👁️</span>', p: '다른 사람의 대전을 <b>실시간으로 구경</b>하고, 응원 이모티콘과 승부 예측도 할 수 있어요.' },
  ] },
  { id: 'compete', icon: '🏆', t: '도전과 경쟁', cards: [
    { h: '체육관', go: 'go-gym', art: () => '<span class="gd-big">🌿💧🔥⚡❄️⛰️👻⚙️</span>', p: '관장 <b>8명</b>이 저마다 특별한 규칙(날씨, 타입 강화 등)으로 기다려요. 이기면 <b>배지</b>! 배지 8개를 다 모으면 <b>골목 챔피언</b>(6대6)에게 도전하고, 이기면 칭호 「골목 챔피언」.' },
    { h: '골목 탈출', go: 'go-rogue', art: () => '<span class="gd-big">🚪🌙</span>', p: '해가 진 골목에서 <b>빌린 골목몬</b>으로 층을 오르며 이야기를 따라가는 기록 도전이에요. 몇 층까지 올라가나 겨뤄요!' },
    { h: '메타배틀', go: 'go-meta', art: () => '<span class="gd-big">🧪🔄🐢🎯</span>', p: '<b>주마다 바뀌는 특별 규칙</b>으로 따로 겨뤄요. 상성이 뒤집히거나, 느린 쪽이 먼저 움직이거나, 모든 기술이 반드시 맞거나!' },
    { h: '랭크전', go: 'go-rank', art: () => '<span class="gd-big">🥉🥈🥇💠💎👑</span>', p: '<b>3대3</b> 랭크 대전이에요. 1,000점에서 시작해 이기면 오르고 지면 내려가요. 높이 올라갈수록 시즌 보상이 커요!' },
    { h: '토너먼트', go: 'go-tourney', art: () => '<span class="gd-big">🏆</span>', p: '매주 <b>토요일 밤 9시</b>. 신청만 해 두면 <b>AI가 내 덱으로</b> 대신 싸워요. 우승하면 특별 칭호!' },
    { h: '이벤트 던전 · 훈련장', go: 'go-train', art: () => '<span class="gd-big">🗼🎯</span>', p: '특별한 규칙의 <b>5층 던전</b>, 그리고 <b>모든 골목몬(내 합체몬 포함)</b>으로 허수아비에게 기술을 시험하는 <b>훈련장</b>이 있어요. 훈련장에서도 내 스킨이 그대로 나와요.' },
  ] },
  { id: 'fun', icon: '🎰', t: '이벤트와 도박장', cards: [
    { h: '이벤트 탭', go: 'go-event', art: () => '<span class="gd-big">🎉</span>', p: '기간 한정 <b>축제</b>, <b>그림 공모전</b>(스킨·아이콘), 미니게임, 설문조사가 모여 있어요.' },
    { h: '신캐 만들기 공모전 (상시)', go: 'go-event', art: () => '<span class="gd-big">🎨🐣</span>', p: '<b>기간 제한 없이</b> 나만의 골목몬을 만들어 내요. 그림, 능력치, 특성, 메가진화, Z기술, <b>거다이맥스</b>, 기술까지 도감처럼! 괜찮은 작품은 개발자가 그때그때 <b>실제 게임에 출시</b>하고, 만든 사람에게 <b>신화 칭호</b>를 줘요.' },
    { h: '💡 요청사항', go: 'go-event', art: () => '<span class="gd-big">💡</span>', p: '이런 시스템이 있으면 좋겠다! 이벤트 탭의 <b>요청사항</b>에 자유롭게 적어요. 다른 사람 요청에 「나도 원해요」를 누를 수 있고, 개발자가 답하면 알림이 와요.' },
    { h: '🪙 도박코인과 환전소', go: 'go-casino', art: () => '<span class="gd-big">🪙💱</span>', p: '도박장에서는 GP 대신 <b>도박코인</b>을 걸어요 (<b>1개 = 100GP</b>). 도박장의 <b>💱 환전소</b>에서 GP와 도박코인을 <b>한도·수수료 없이</b> 바꿔요. 리롤권·스킵권·입수권은 그대로 걸 수 있어요.' },
    { h: '도박장 게임', go: 'go-casino', art: () => '<span class="gd-big">🎰🎡🃏🏇🎱🎁</span>', p: '슬롯, 룰렛, 더블업, 하이로우, 즉석복권, 20분마다 달리는 <b>경마</b>, 매주 추첨하는 <b>로또</b>, 스킨·골목몬이 나오는 <b>상자</b>. 하루 300판까지예요. 오래 하면 대부분 잃으니 적당히!' },
  ] },
  { id: 'style', icon: '🎨', t: '꾸미기와 설정', cards: [
    { h: '꾸미기', go: 'go-ava', art: () => '<span class="gd-big">🧑‍🎤</span>', p: '내 캐릭터의 피부, 머리, 눈, 옷, 신발, 배경, <b>포즈</b>, <b>이펙트</b>를 꾸며요. 대전 화면에 내 캐릭터가 나와요!' },
    { h: '칭호와 프로필 카드', art: () => '<span class="gd-big">🏷️</span>', p: '업적, 랭크, 체육관, 대회, 공모전, 합체몬 갤러리로 <b>칭호</b>를 얻어요. 일반부터 <b>신화</b>까지 등급이 있어요.' },
    { h: '소식 · 설정', go: 'go-settings', art: () => '<span class="gd-big">📢⚙️</span>', p: '「소식」에서 업데이트와 공지를 보고, 「설정」에서 효과음, 푸시 알림, 비밀번호를 바꿔요.' },
    { h: '이제 준비 끝!', art: () => gdMon('yeoubi', 'kkamo', 'thunder'), p: '이게 골목대전의 전부예요! 모르는 게 생기면 로비의 <b>「📖 가이드」</b>에서 언제든 다시 볼 수 있어요. 이제 골목으로 나가서, 첫 합체몬을 만들어 볼까요?' },
  ] },
];

async function showGuide(ci = null, card = 0) {
  gdPill(false); G.screen = 'guide'; app.className = '';
  if (ci === null) return gdIndex();
  GD.ch = ci; GD.card = card;
  const ch = GUIDE[ci], c = ch.cards[card]; gdMark(ci, card);
  const last = card === ch.cards.length - 1;
  app.innerHTML = `<div class="topbar"><button class="btn small paper" id="back">목차</button><h1>${ch.icon} ${esc(ch.t)}</h1></div>
    <section class="tu gd-card"><div class="tu-dots">${ch.cards.map((_, i) => `<i class="${i === card ? 'on' : ''}"></i>`).join('')}</div>
      <small class="gd-step">${ci + 1}장 · ${card + 1}/${ch.cards.length}</small>
      <div class="tu-art">${c.art ? c.art() : ''}</div><h2>${c.h}</h2><p>${typeof c.p === 'function' ? c.p() : c.p}</p>
      ${c.go && G.user.tutorial ? `<button class="btn paper wide gd-go" id="gd-go">👉 직접 가 보기</button>` : ''}
      <div class="row tu-nav">${card ? '<button class="btn paper" id="gd-prev">이전</button>' : ''}<button class="btn" id="gd-next">${last ? (ci < GUIDE.length - 1 ? `다음 장: ${GUIDE[ci + 1].icon} ${esc(GUIDE[ci + 1].t)}` : '목차로') : '다음'}</button></div></section>`;
  app.querySelector('#back').onclick = () => gdIndex();
  app.querySelector('#gd-prev')?.addEventListener('click', () => showGuide(ci, card - 1));
  app.querySelector('#gd-next').onclick = () => (last ? (ci < GUIDE.length - 1 ? showGuide(ci + 1, 0) : gdIndex()) : showGuide(ci, card + 1));
  app.querySelector('#gd-go')?.addEventListener('click', () => gdGo(c.go));
  scrollTo(0, 0);
}
async function gdIndex() {
  G.screen = 'guide'; gdPill(false);
  const read = gdRead(), done = (ci) => (read[ci] || []).length >= GUIDE[ci].cards.length;
  const all = GUIDE.every((_, i) => done(i)), total = GUIDE.reduce((n, c) => n + c.cards.length, 0), seen = GUIDE.reduce((n, _, i) => n + Math.min((read[i] || []).length, GUIDE[i].cards.length), 0);
  let gv = null; try { gv = (await api('GET', '/api/guide')).guide; } catch { /* 보상 정보 없이 */ }
  app.innerHTML = `${topbar('📖 골목대전 가이드')}
    <section class="gd-hero"><b>${seen} / ${total}</b><i style="--p:${Math.round(seen / total * 100)}%"></i><p>게임의 모든 시스템을 ${GUIDE.length}장에 나눠 알려 줘요. 장을 눌러 시작하세요!</p>
      ${gv ? gv.done ? '<span class="gd-rw done">✅ 완주 선물을 받았어요</span>' : `<span class="gd-rw">🎁 끝까지 보면: ${rewardChips(gv.reward)}</span>` : ''}
      ${gv && !gv.done && all ? '<button class="btn wide" id="gd-claim">🎁 완주 선물 받기</button>' : ''}</section>
    <div class="gd-list">${GUIDE.map((c, i) => `<button class="gd-ch ${done(i) ? 'done' : ''}" data-ch="${i}"><span>${c.icon}</span><b>${i + 1}. ${esc(c.t)}</b><small>${Math.min((read[i] || []).length, c.cards.length)}/${c.cards.length}${done(i) ? ' ✅' : ''}</small></button>`).join('')}</div>`;
  app.querySelector('#back').onclick = () => (G.user.tutorial ? showLobby() : showTutorial());
  app.querySelectorAll('[data-ch]').forEach((b) => { b.onclick = () => { const i = +b.dataset.ch, r = read[i] || []; const next = GUIDE[i].cards.findIndex((_, k) => !r.includes(k)); showGuide(i, next < 0 ? 0 : next); }; });
  app.querySelector('#gd-claim')?.addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    try { const r = await api('POST', '/api/guide/claim', {}); setUser(r); showGot(r.got, '가이드 완주 선물!', gdIndex); } catch (err) { toast(err.message); e.currentTarget.disabled = false; }
  });
}
