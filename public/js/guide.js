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

const GUIDE = [
  { id: 'start', icon: '🏁', t: '시작하기', cards: [
    { h: '골목대전에 온 걸 환영해요!', art: () => gdMon('yeontan', 'malrang', 'yeoubi'), p: '골목 곳곳에 사는 <b>골목몬</b>을 모아 <b>덱</b>을 짜고, 친구나 골목대장과 <b>턴제 대전</b>을 하는 게임이에요. 이 가이드는 게임에 있는 거의 모든 시스템을 하나씩 알려 줘요. 끝까지 보면 <b>선물</b>도 있어요!' },
    { h: '지갑 읽는 법', art: () => `<div class="gd-wallet">${walletHTML()}</div>`, p: '화면 위 지갑에 재화가 보여요.<br>• <b>GP</b>: 기본 돈. 스카우트, 기술 바꾸기, 상점 등 거의 모든 곳에 써요.<br>• <b>골목몬 입수권</b>: 스카우트를 GP 대신 공짜로.<br>• <b>1시간 스킵권</b>: 기다리는 시간을 줄여요.<br>• <b>리롤권 🎲</b>: 스카우트 후보를 다시 뽑아요.' },
    { h: '덱 관리', art: () => '<span class="gd-big">🗂️</span>', go: 'go-team', p: '덱은 여러 개 만들 수 있고, 덱마다 골목몬을 최대 <b>6마리</b>까지 넣어요. 대전에는 <b>덱 앞에서부터</b> 인원수만큼 나가요. 순서를 바꾸고, 기술과 도구도 덱에서 정해요.' },
    { h: '대전 인원과 밴픽', art: () => '<span class="gd-big">1️⃣ 3️⃣ 6️⃣ 🚫</span>', p: '로비에서 <b>1대1 · 3대3 · 6대6</b>을 골라요. <b>🚫 밴픽</b>을 켜면 서로 상대 덱에서 1마리씩 금지하고 시작해요. (6대6 밴픽은 6마리 중 1마리 금지 → 5대5) 친구 대전에도, 골목대장 대전에도 쓸 수 있어요.' },
  ] },
  { id: 'battle', icon: '⚔️', t: '대전 기초', cards: [
    { h: '첫 대전: 골목대장', art: () => '<span class="gd-big">🤖</span>', go: 'go-bot', p: '<b>골목대장</b>은 컴퓨터 상대예요. 난이도는 <b>쉬움 · 보통 · 어려움 · 지옥</b>. 친구가 없을 때도 언제든 연습할 수 있어요. 로비의 「골목대장과 대전」을 눌러요.' },
    { h: '선봉 고르기', art: () => '<span class="gd-big">👀</span>', p: '대전이 시작되면 먼저 <b>상대 덱을 미리 보고</b>, 내 덱에서 <b>먼저 내보낼 골목몬</b>을 골라요. 상대 타입을 보고 유리한 골목몬을 내보내는 게 첫 번째 수싸움!' },
    { h: '기술 고르기', art: () => '<div class="gd-moves"><b>💥 물리</b><b>✨ 특수</b><b>🌀 변화</b></div>', p: '매 턴 기술을 하나 골라요. <b>물리</b>는 공격·방어, <b>특수</b>는 특공·특방으로 계산하고, <b>변화</b> 기술은 능력치를 올리거나 상태이상을 걸어요. 기술마다 <b>위력 · 명중 · 사용 횟수(PP)</b>가 있고, <b>스피드</b>가 빠른 쪽이 먼저 움직여요.' },
    { h: '타입 상성', go: 'go-types', art: () => `<div class="gd-eff">${[['fire', 'grass'], ['water', 'fire'], ['grass', 'water']].map(([a, d]) => `${gdChip(a)}<i>→</i>${gdChip(d)}<em>×${gdEff(a, d)}</em>`).join('<br>')}</div>`, p: () => `타입은 <b>${Object.keys(G.data.TYPES).filter((t) => t !== 'none').length}가지</b>예요. 상성이 좋으면 <b>2배</b>, 나쁘면 <b>절반</b>, 아예 안 통하기도 해요. 골목몬과 같은 타입의 기술을 쓰면 <b>1.5배</b>! 「타입 상성표」에서 전부 볼 수 있어요.` },
    { h: '교체', art: () => '<span class="gd-big">🔄</span>', p: '기술 대신 <b>다른 골목몬으로 교체</b>할 수 있어요. 교체는 기술보다 먼저 일어나요. 불리한 상대를 만나면 바꿔서 공격을 대신 맞게 하는 것도 전략이에요. 쓰러지면 다음 골목몬을 골라 내보내요.' },
    { h: '상태이상과 능력치', art: () => '<div class="gd-moves"><b>🔥 화상</b><b>☠️ 독</b><b>⚡ 마비</b><b>💤 수면</b><b>🧊 얼음</b></div>', p: '상태이상은 5가지예요. 화상은 공격이 약해지고, 독은 매 턴 피해, 마비는 느려지고 가끔 못 움직여요. 수면·얼음은 한동안 행동을 못 해요. 기술로 <b>능력치를 단계별로</b> 올리고 내릴 수도 있어요 (공격·방어·특공·특방·스피드·명중률).' },
    { h: '날씨와 필드 효과', go: 'go-fields', art: () => '<span class="gd-big">☀️🌧️🌪️❄️</span>', p: '<b>땡볕 · 소나기 · 황사 · 눈</b> 4가지 날씨가 있어요. 땡볕은 불 기술이, 소나기는 물 기술이 세져요. 대전마다 <b>필드 효과</b>가 붙기도 해요. 「필드 효과」 화면에서 확인해요.' },
    { h: '특성', art: () => gdMon('usan', 'kkamo'), p: '골목몬마다 <b>특성</b>이 하나씩 있어요. 우산령은 나오면 비를 내리고, 까모는 나오면 상대 명중률을 떨어뜨려요. 도감에서 골목몬을 누르면 특성을 볼 수 있어요.' },
    { h: '도구', art: () => '<span class="gd-big">🧪🎒🧤</span>', p: () => `도구는 <b>${Object.keys(G.data.ITEMS || {}).length || 20}가지</b>가 있고 <b>전부 무료</b>예요. 골목몬 한 마리에 하나씩 들려요. 체력 회복, 공격 강화, 한 번 버티기 등. 덱 관리에서 골목몬을 눌러 정해요.` },
  ] },
  { id: 'power', icon: '💥', t: '필살기', cards: [
    { h: '메가진화', go: 'go-stones', art: () => ['yeontan', 'kettle', 'tuhon'].map((id) => stoneSVG(id, 56)).join(''), p: '그 골목몬의 <b>메가스톤</b>이 있으면 대전 중에 <b>메가진화</b>할 수 있어요. 모습이 바뀌고 능력치가 크게 올라요. <b>한 판에 한 번</b>, 기술 고르기 화면의 메가 버튼으로! 메가스톤은 상점·업적·패스에서 얻어요.' },
    { h: 'Z기술', art: () => '<span class="gd-big">⚡Z⚡</span>', p: '골목몬마다 고유한 <b>Z기술</b>이 있어요. 엄청난 위력에 특별한 효과까지! 역시 <b>한 판에 한 번</b>만 써요. 기술 고르기 화면에서 Z 버튼을 켜고 기술을 누르면 돼요.' },
    { h: '거다이맥스', art: () => `<span class="gd-mon">${typeof gmaxSVG === 'function' ? gmaxSVG('malrang') : ''}</span>`, p: '<b>한 판에 한 번</b>, 골목몬을 <b>거대하게</b> 만들어요. <b>5턴</b> 동안 체력이 <b>1.5배</b>가 되고, 기술이 강력한 <b>다이기술</b>로 바뀌어요. 골목몬마다 전용 <b>거다이기술</b>도 있어요. 여우비처럼 거다이맥스하면 <b>타입까지 바뀌는</b> 골목몬도 있어요…!' },
    { h: '이로치', art: () => `<span class="gd-mon is-shiny">${monArt('yeoubi', true)}</span>`, p: '가끔 색이 다른 <b>이로치</b> 골목몬이 나와요. 스카우트에서 <b>40마리 중 1마리</b> 꼴. 능력은 같지만 귀하고 멋져요! 친구와 교환하면 10% 확률로 이로치가 되기도 해요.' },
  ] },
  { id: 'collect', icon: '📦', t: '모으고 키우기', cards: [
    { h: '스카우트', go: 'go-scout', art: () => `${ICON.ticket(54)}${ICON.gp(58)}`, p: '<b>20시간마다</b> 후보 <b>8마리</b> 중 1마리를 <b>2,500GP</b>나 <b>입수권</b>으로 데려와요. 기다리기 싫으면 <b>스킵권</b>을, 후보가 마음에 안 들면 <b>리롤권</b>(또는 500GP)으로 다시 뽑아요. 원하는 골목몬이나 이로치가 나올 때까지 <b>자동 리롤</b>도 돼요.' },
    { h: '내 골목몬', go: 'go-box', art: () => '<span class="gd-big">📦</span>', p: '모은 골목몬을 모두 보는 곳이에요. 골목몬을 눌러 <b>기술 바꾸기(500GP)</b>, <b>강화</b>, <b>스킨</b>을 할 수 있어요.' },
    { h: '강화', art: () => '<span class="gd-big">⬆️ +5</span>', p: '같은 골목몬을 <b>먹이면</b> +1씩 강화돼요 (최대 <b>+5</b>). +1마다 능력치가 <b>4%</b> 올라요. 겹친 골목몬을 버리지 말고 강화에 써요!' },
    { h: '스킨', art: () => '<span class="gd-big">🎨</span>', p: '골목몬 전용 <b>스킨</b>은 모습, 이펙트, 소리까지 바꿔요. 말랑왕의 「왁뿌말랑왕」은 맞을 때마다 왁스 껍질이 바삭바삭 깨져요! 내 골목몬 화면의 「🎨 스킨 둘러보기」에서 봐요.' },
    { h: '원정', go: 'go-expe', art: () => '<span class="gd-big">🏪⛰️🏮🌊</span>', p: '골목몬을 <b>원정</b>에 보내면 시간이 지난 뒤 GP와 아이템을 가져와요. 자리는 <b>3개</b>, 장소는 <b>편의점 골목(1시간)</b>부터 <b>바닷가 방파제(12시간)</b>까지. 장소가 <b>좋아하는 타입</b>을 보내면 더 좋아요.' },
    { h: '도감', go: 'go-dex', art: () => '<span class="gd-big">📖</span>', p: '모든 골목몬의 능력치, 기술, 특성, 메가진화, 거다이맥스를 볼 수 있어요. <b>도감 보상</b>: 모은 종류와 이로치 수에 따라 선물을 받아요.' },
  ] },
  { id: 'reward', icon: '🎁', t: '보상 받기', cards: [
    { h: '출석 · 퀘스트 · 업적', go: 'go-rew', art: () => '<span class="gd-big">📅✅🏅</span>', p: '매일 접속하면 <b>출석 보상</b>, 하루·한 주 <b>퀘스트</b>를 깨면 보상, 큰 목표를 이루면 <b>업적</b> 보상! 「보상」 화면에서 한 번에 받아요.' },
    { h: '시즌 패스', go: 'go-pass', art: () => ICON.pass(60), p: '대전하면 <b>패스 포인트</b>가 쌓여요. 시즌은 <b>2주</b>, <b>30레벨</b>까지 레벨마다 보상! 만렙 뒤에도 포인트가 쌓일 때마다 GP를 조금씩 줘요.' },
    { h: '상점', go: 'go-shop', art: () => '<span class="gd-big">🛒</span>', p: '입수권, 스킵권, 리롤권, 메가스톤을 GP로 사요. 매일 바뀌는 <b>특가 묶음</b>과 <b>공짜 선물</b>도 있어요.' },
    { h: '우편함', go: 'go-mail', art: () => '<span class="gd-big">✉️</span>', p: '운영팀 선물, 토너먼트 결과, 공모전 상품, 칭호 보상이 <b>우편</b>으로 와요. 로비의 우편함에 숫자가 뜨면 꼭 열어 봐요.' },
  ] },
  { id: 'together', icon: '👥', t: '함께 하기', cards: [
    { h: '친구와 대전', art: () => '<span class="gd-big">🤝</span>', p: '로비 「접속 중인 플레이어」에서 <b>대전 신청</b>을 누르면 돼요. 받은 사람은 수락이나 거절. 인원(1·3·6)과 밴픽 여부는 신청하는 사람이 정해요.' },
    { h: '친구 · 우정 선물 · 교환', go: 'go-friends', art: () => '<span class="gd-big">💝🔄</span>', p: '친구는 <b>50명</b>까지. 매일 친구에게 <b>우정 선물</b>을 보내고 받아 <b>우정 포인트</b>를 모아 우정 상점에서 써요. 친구와 골목몬을 <b>교환</b>할 수도 있어요 (교환하면 10% 확률로 이로치!).' },
    { h: '채팅', go: 'go-chat', art: () => '<span class="gd-big">💬</span>', p: '모두와 이야기하는 <b>월드 채팅</b>, 길드원끼리 <b>길드 채팅</b>이 있어요. 큰 대박이나 대회 결과도 채팅에 떠요.' },
    { h: '길드', go: 'go-guild', art: () => '<span class="gd-big">🏰</span>', p: '<b>3,000GP</b>로 길드를 만들거나 들어가요 (최대 <b>20명</b>). 길드원이 함께 깨는 <b>길드 퀘스트</b>, 같이 올리는 <b>길드 패스</b>, 다른 길드와 겨루는 <b>길드전</b>, 그리고 엠블럼·모양·무늬로 <b>길드 꾸미기</b>까지!' },
    { h: '태그 2대2', art: () => '<span class="gd-big">👫⚔️👫</span>', p: '두 명씩 팀을 짜서 <b>2대2</b>로 싸워요. 빈자리는 골목대장이 채워 줘요. 로비의 태그전 방에서 자리를 골라 앉아요.' },
    { h: '레이드', go: 'go-raid', art: () => '<span class="gd-big">🐲</span>', p: '최대 <b>4명</b>이 힘을 합쳐 <b>거대한 보스</b>와 싸워요. 하루 <b>3번</b>. 친구가 흑화한 모습과 싸우는 <b>흑화 레이드</b>도 있어요. 이기면 좋은 보상!' },
    { h: '관전', art: () => '<span class="gd-big">👁️</span>', p: '다른 사람들의 대전을 <b>실시간으로 구경</b>할 수 있어요. 로비의 「진행 중인 대전」에서 관전을 눌러요. 응원 이모티콘도 보낼 수 있어요.' },
  ] },
  { id: 'compete', icon: '🏆', t: '경쟁과 이벤트', cards: [
    { h: '랭크전', go: 'go-rank', art: () => '<span class="gd-big">🥉🥈🥇💠💎👑🔥</span>', p: '<b>3대3</b> 랭크 대전이에요. <b>1,000점</b>에서 시작해 이기면 오르고 지면 내려가요. <b>브론즈 → 실버 → 골드 → 플래티넘 → 다이아 → 마스터 → 골목대장</b>. 높이 올라갈수록 시즌 보상이 커요!' },
    { h: '토너먼트', go: 'go-tourney', art: () => '<span class="gd-big">🏆</span>', p: '매주 <b>토요일 밤 9시</b>에 열려요. 미리 신청만 해 두면 <b>AI가 내 덱으로 대신</b> 싸워요. 결과와 <b>리플레이</b>는 나중에 볼 수 있고, 우승하면 특별 칭호!' },
    { h: '이벤트 던전', go: 'go-dungeon', art: () => '<span class="gd-big">🗼</span>', p: '특별한 규칙이 붙은 <b>5층</b> 던전이에요. 층마다 보상, 끝까지 깨면 큰 보상! 규칙은 기간마다 바뀌어요.' },
    { h: '훈련장', go: 'go-train', art: () => '<span class="gd-big">🎯</span>', p: '<b>모든 골목몬</b>을 마음대로 골라 허수아비에게 기술을 시험해요. 데미지 기록 업적도 있어요.' },
    { h: '전적과 리플레이', go: 'go-stats', art: () => '<span class="gd-big">📊▶️</span>', p: '내 승률, 골목몬별 기록, 최근 경기를 보고 <b>리플레이</b>로 다시 볼 수 있어요.' },
    { h: '이벤트 탭', go: 'go-event', art: () => '<span class="gd-big">🎉</span>', p: '기간 한정 <b>축제</b>, <b>그림 공모전</b>(스킨·아이콘·신캐), 미니게임, 설문조사가 여기 모여 있어요. 우승하면 GP와 <b>신화 칭호</b>까지!' },
    { h: '도박장', go: 'go-casino', art: () => '<span class="gd-big">🎰🎡🪙🎫</span>', p: '슬롯머신, 룰렛, 더블업, 즉석복권. <b>게임 재화만</b> 걸 수 있고 하루 <b>300판</b>까지예요. 대박은 극악의 확률이고, 길게 하면 대부분 잃어요. 적당히!' },
    { h: '소식', go: 'go-news', art: () => '<span class="gd-big">📢</span>', p: '업데이트 내용과 공지가 올라와요. 새 골목몬, 밸런스 조정, 이벤트 소식을 놓치지 마세요.' },
  ] },
  { id: 'style', icon: '🎨', t: '꾸미기와 설정', cards: [
    { h: '꾸미기', go: 'go-ava', art: () => '<span class="gd-big">🧑‍🎤</span>', p: '내 캐릭터의 피부, 머리, 눈, 옷, 신발, 배경, <b>포즈</b>, <b>이펙트</b>를 꾸며요. 일부 포즈와 이펙트는 GP로 사요. 대전 화면에 내 캐릭터가 나와요!' },
    { h: '칭호와 프로필 카드', art: () => '<span class="gd-big">🏷️</span>', p: '업적, 랭크, 대회, 공모전으로 <b>칭호</b>를 얻어요. 일반부터 전설, <b>신화</b>까지 등급이 있어요. 대전 상대에게 내 칭호와 카드가 보여요.' },
    { h: '설정', go: 'go-settings', art: () => '<span class="gd-big">⚙️</span>', p: '<b>대전 효과음</b> 켜고 끄기, <b>푸시 알림</b>(스카우트 준비·대전 신청 등), 비밀번호 바꾸기를 할 수 있어요.' },
    { h: '이제 준비 끝!', art: () => gdMon('yeoubi', 'kkamo', 'malrang'), p: '이게 골목대전의 전부예요! 모르는 게 생기면 로비의 <b>「📖 가이드」</b>에서 언제든 다시 볼 수 있어요. 이제 골목으로 나가 볼까요?' },
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
