// 공모전 출시작 그림 다듬기: 흰 배경을 투명하게, 까모 그림의 스톡 사진 워터마크를 몸 색으로 덮기.
// 원본은 서버의 출품작 그림 그대로라서, 그림을 받을 때마다 브라우저에서 한 번 다듬어 둡니다.
const CLEAN_KEY = {}; // 거꾸로: 주소 → 'kkamo-mega' (이로치 색을 모습별로 고를 때)
const CLEAN_ART = {}; // 'kkamo' / 'kkamo-mega' → 다듬은 그림 주소(blob:)
const ART_CLOSE = { seonsaeng: 0.035, 'seonsaeng-mega': 0.035, 'kkamo-mega': 0.004 }; // 선 사이 틈을 얼마나 메울지 (손그림은 크게)

function cleanPixels(img, { watermark = false, close = 0.008 } = {}) {
  const { data: d, width: W, height: H } = img;
  const N = W * H, lum = (i) => (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000;
  const sat = (i) => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) - Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
  const isBg = new Uint8Array(N);
  for (let i = 0; i < N; i++) isBg[i] = d[i * 4 + 3] < 20 || (lum(i) > 226 && sat(i) < 30) ? 1 : 0;
  // 선이 끊겨 있어도 안쪽(흰 옷 등)이 같이 지워지지 않게: 선을 close만큼 부풀린 벽으로 바깥을 채우고,
  // 그 바깥을 다시 close만큼 넓혀서 그 안의 흰색만 투명하게 (손그림은 크게, 매끈한 그림은 작게)
  const R = Math.max(2, Math.round(Math.min(W, H) * close));
  const dist = (src) => { // 3-4 거리 변환: src(1)까지의 거리 ×3
    const D = new Float32Array(N).fill(1e9);
    for (let i = 0; i < N; i++) if (src[i]) D[i] = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; let v = D[i];
      if (x > 0) v = Math.min(v, D[i - 1] + 3);
      if (y > 0) { v = Math.min(v, D[i - W] + 3); if (x > 0) v = Math.min(v, D[i - W - 1] + 4); if (x < W - 1) v = Math.min(v, D[i - W + 1] + 4); }
      D[i] = v;
    }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
      const i = y * W + x; let v = D[i];
      if (x < W - 1) v = Math.min(v, D[i + 1] + 3);
      if (y < H - 1) { v = Math.min(v, D[i + W] + 3); if (x < W - 1) v = Math.min(v, D[i + W + 1] + 4); if (x > 0) v = Math.min(v, D[i + W - 1] + 4); }
      D[i] = v;
    }
    return D;
  };
  const ink = new Uint8Array(N); for (let i = 0; i < N; i++) ink[i] = isBg[i] ? 0 : 1;
  const dInk = dist(ink);
  const wall = new Uint8Array(N); for (let i = 0; i < N; i++) wall[i] = dInk[i] <= R * 3 ? 1 : 0;
  const far = new Uint8Array(N), q = [];
  const push = (i) => { if (!far[i] && !wall[i]) { far[i] = 1; q.push(i); } };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (q.length) {
    const i = q.pop(), x = i % W;
    if (x > 0) push(i - 1); if (x < W - 1) push(i + 1); if (i >= W) push(i - W); if (i < N - W) push(i + W);
  }
  const dFar = dist(far);
  const out = new Uint8Array(N); for (let i = 0; i < N; i++) out[i] = isBg[i] && dFar[i] <= (R + 2) * 3 ? 1 : 0;
  // 바깥과 맞닿은 밝은 가장자리는 반투명으로 (흰 테두리 줄이기)
  for (let i = 0; i < N; i++) {
    if (out[i]) { d[i * 4 + 3] = 0; continue; }
    const x = i % W;
    const edge = (x > 0 && out[i - 1]) || (x < W - 1 && out[i + 1]) || (i >= W && out[i - W]) || (i < N - W && out[i + W]);
    if (edge && lum(i) > 180 && sat(i) < 40) d[i * 4 + 3] = Math.round(d[i * 4 + 3] * (255 - lum(i)) / 75);
  }

  if (watermark) {
    // 몸 색: 불투명하고 어두운 무채색 픽셀의 평균
    let n = 0, R = 0, Gc = 0, B = 0;
    for (let i = 0; i < N; i++) if (!out[i] && lum(i) < 110 && sat(i) < 30) { n++; R += d[i * 4]; Gc += d[i * 4 + 1]; B += d[i * 4 + 2]; }
    const body = n ? [R / n, Gc / n, B / n] : [70, 70, 70];
    // 워터마크 띠: 몸 안의 밝은 무채색 덩어리 중 큰 것 → 그 네모 영역의 무채색을 몸 색으로
    const seen = new Uint8Array(N);
    const dOut = dist(out); // 가장자리 안티앨리어싱(밝은 회색 테두리)은 빼고 찾기
    const light = (i) => !out[i] && dOut[i] > 9 && sat(i) < 40 && lum(i) > 115;
    for (let s = 0; s < N; s++) {
      if (seen[s] || !light(s)) continue;
      const comp = [s]; seen[s] = 1;
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (let k = 0; k < comp.length; k++) {
        const i = comp[k], x = i % W, y = (i / W) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !seen[j] && light(j)) { seen[j] = 1; comp.push(j); }
      }
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
      if (comp.length < N * 0.004 || bw < bh * 1.8) continue; // 눈처럼 작거나 납작하지 않은 건 그대로
      const pad = Math.max(2, Math.round(bh * .2)), ya = Math.max(0, y0 - pad), yb = Math.min(H - 1, y1 + pad);
      // 띠 위·아래 줄에서 몸의 왼쪽·오른쪽 끝을 재고, 그 사이를 이어 몸 모양을 되살림 (밖으로 삐져나온 띠는 투명하게)
      const solid = (y, x) => y >= 0 && y < H && x >= 0 && x < W && d[(y * W + x) * 4 + 3] > 200 && lum(y * W + x) < 130;
      const span = (y) => { // 띠와 겹치는 몸 구간
        let best = null;
        for (let x = 0; x < W; x++) {
          if (!solid(y, x)) continue;
          let e = x; while (e + 1 < W && solid(y, e + 1)) e++;
          if (e >= x0 && x <= x1 && (!best || e - x > best[1] - best[0])) best = [x, e];
          x = e;
        }
        return best;
      };
      let ra = null, rb = null, yA = ya, yB = yb;
      for (let k = 1; k <= pad * 3 + 3 && !ra; k++) { yA = ya - k; ra = span(yA); }
      for (let k = 1; k <= pad * 3 + 3 && !rb; k++) { yB = yb + k; rb = span(yB); }
      ra ||= rb; rb ||= ra;
      for (let y = ya; y <= yb; y++) {
        const t = ra ? (y - yA) / Math.max(1, yB - yA) : 0;
        const L = ra ? Math.round(ra[0] + (rb[0] - ra[0]) * t) : W, R = ra ? Math.round(ra[1] + (rb[1] - ra[1]) * t) : -1;
        for (let x = Math.max(0, Math.min(x0 - pad, L)); x <= Math.min(W - 1, Math.max(x1 + pad, R)); x++) {
          const i = y * W + x;
          if (x >= L && x <= R) { if (sat(i) > 45) continue; d[i * 4] = body[0]; d[i * 4 + 1] = body[1]; d[i * 4 + 2] = body[2]; d[i * 4 + 3] = 255; }
          else if (x >= x0 - pad && x <= x1 + pad && !out[i]) d[i * 4 + 3] = 0;
        }
      }
    }
    // 배경 위에 떠 있던 작은 글씨(워터마크 로고) 지우기: 아주 작은 불투명 덩어리
    const seen2 = new Uint8Array(N);
    for (let s = 0; s < N; s++) {
      if (seen2[s] || d[s * 4 + 3] === 0) continue;
      const comp = [s]; seen2[s] = 1;
      for (let k = 0; k < comp.length; k++) {
        const i = comp[k], x = i % W;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && !seen2[j] && d[j * 4 + 3] > 0) { seen2[j] = 1; comp.push(j); }
      }
      if (comp.length < N * 0.002) for (const i of comp) d[i * 4 + 3] = 0;
    }
  }
  return img;
}

function cleanArtUrl(src, opts) {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      try {
        const k = Math.min(1, 512 / Math.max(im.naturalWidth, im.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k));
        const x = c.getContext('2d', { willReadFrequently: true });
        x.drawImage(im, 0, 0, c.width, c.height);
        const data = cleanPixels(x.getImageData(0, 0, c.width, c.height), opts);
        x.putImageData(data, 0, 0);
        c.toBlob((b) => res(b ? URL.createObjectURL(b) : null), 'image/png');
      } catch { res(null); }
    };
    im.onerror = () => res(null);
    im.src = src;
  });
}

// 데이터를 받은 뒤 한 번: 공모전 출시작 그림을 다듬어 두고, 다 되면 지금 화면을 다시 그림
async function prepareContestArt(redraw) {
  const list = Object.entries(G.data?.MONSTERS || {}).filter(([, sp]) => sp.contest);
  await Promise.all(list.flatMap(([id]) => ['', '-mega'].map(async (v) => {
    const url = await cleanArtUrl(`img/mon/${id}${v}.webp`, { watermark: !v && id === 'kkamo', close: ART_CLOSE[id + v] ?? 0.008 });
    if (url) { CLEAN_ART[id + v] = url; CLEAN_KEY[url] = id + v; }
  })));
  if (list.length && typeof redraw === 'function') redraw();
}
