// 3D 아바타. three.js로 툰 셰이딩 캐릭터를 만들고, WebGL 하나로 정지 이미지와 실시간 화면을 모두 그립니다.
// WebGL이 없으면 null이 되고, avatar.js의 2D 그림을 씁니다.
const Avatar3D = (() => {
  const T = window.THREE;
  if (!T) return null;
  let renderer;
  const RW = 512, RH = 640;
  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(RW, RH, false);
    renderer.outputColorSpace = T.SRGBColorSpace;
  } catch { return null; }
  if (!renderer.getContext()) return null;

  /* ---------- 재료 ---------- */
  const grad = new T.DataTexture(new Uint8Array([110, 110, 110, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1);
  grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
  const mats = new Map();
  const toon = (c, emissive) => {
    const k = `t${c}${emissive || ''}`;
    if (!mats.has(k)) mats.set(k, new T.MeshToonMaterial({ color: c, gradientMap: grad, emissive: emissive || '#000' }));
    return mats.get(k);
  };
  const flat = (c, side = T.FrontSide, opacity = 1) => {
    const k = `b${c}${side}${opacity}`;
    if (!mats.has(k)) mats.set(k, new T.MeshBasicMaterial({ color: c, side, transparent: opacity < 1, opacity }));
    return mats.get(k);
  };
  const INK = '#1a1433';
  const OUT = new T.MeshBasicMaterial({ color: INK, side: T.BackSide });
  const geos = new Map();
  const G = (key, make) => { if (!geos.has(key)) geos.set(key, make()); return geos.get(key); };
  const sph = (r, w = 20, h = 14) => G(`s${r}${w}`, () => new T.SphereGeometry(r, w, h));
  const box = (x, y, z) => G(`b${x},${y},${z}`, () => new T.BoxGeometry(x, y, z));
  const cyl = (a, b, h, n = 18, open = false) => G(`c${a},${b},${h},${n},${open}`, () => new T.CylinderGeometry(a, b, h, n, 1, open));
  const cap = (r, l) => G(`p${r},${l}`, () => new T.CapsuleGeometry(r, l, 6, 14));
  const cone = (r, h, n = 14) => G(`k${r},${h},${n}`, () => new T.ConeGeometry(r, h, n));
  const tor = (r, t, arc = Math.PI * 2, rs = 8, ts = 24) => G(`o${r},${t},${arc},${rs},${ts}`, () => new T.TorusGeometry(r, t, rs, ts, arc));
  const disc = (r, start = 0, len = Math.PI * 2) => G(`d${r},${start},${len}`, () => new T.CircleGeometry(r, 24, start, len));
  const shapeGeo = (key, pts, extrude = 0) => G(`sh${key}${extrude}`, () => {
    const s = new T.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    if (!extrude) return new T.ShapeGeometry(s);
    const g = new T.ExtrudeGeometry(s, { depth: extrude, bevelEnabled: false });
    g.center();
    return g;
  });
  const starPts = (r, n = 5) => Array.from({ length: n * 2 }, (_, i) => { const a = Math.PI / 2 + (i * Math.PI) / n, q = i % 2 ? r * .45 : r; return [Math.cos(a) * q, Math.sin(a) * q]; });
  const heartPts = (r) => Array.from({ length: 32 }, (_, i) => { const t = (i / 32) * Math.PI * 2; return [r * .06 * 16 * Math.sin(t) ** 3, r * .06 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });

  // 외곽선이 있는 부품. 툰 만화 느낌을 냅니다.
  function part(geo, color, { line = .035, mat } = {}) {
    const g = new T.Group();
    g.add(new T.Mesh(geo, mat || toon(color)));
    if (line) {
      geo.computeBoundingSphere();
      const o = new T.Mesh(geo, OUT);
      o.scale.setScalar(1 + line / Math.max(.05, geo.boundingSphere.radius));
      g.add(o);
    }
    return g;
  }
  const addR = (p, o) => { p.add(o); return o; };
  const at = (obj, x, y, z, rx = 0, ry = 0, rz = 0) => { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; };

  /* ---------- 캐릭터 만들기 ---------- */
  /* ---------- 새 캐릭터 (애니풍 6등신) ---------- */
  // 외곽선: 법선 방향으로 부풀린 뒷면
  const inflate = (key, geo, t) => G(`inf${key}${t}`, () => {
    const g = geo.clone(); g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + n.getX(i) * t, p.getY(i) + n.getY(i) * t, p.getZ(i) + n.getZ(i) * t);
    return g;
  });
  function P2(key, geo, color, { t = .009, mat, line = true } = {}) {
    const g = new T.Group();
    g.add(new T.Mesh(geo, mat || toon(color)));
    if (line) g.add(new T.Mesh(inflate(key, geo, t), OUT));
    return g;
  }
  const v2 = (x, y) => new T.Vector2(Math.max(.0005, x), y);
  // 팔다리: 위 반지름 r1, 아래 반지름 r2, 길이 len (원점에서 아래로)
  const limbGeo = (r1, r2, len) => G(`lb${r1.toFixed(3)},${r2.toFixed(3)},${len}`, () => {
    const pts = [];
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i / 5) * Math.PI / 2; pts.push(v2(r2 * Math.cos(a), -len + r2 * Math.sin(a))); }
    for (let i = 1; i <= 5; i++) { const a = (i / 5) * Math.PI / 2; pts.push(v2(r1 * Math.cos(a), r1 * Math.sin(a))); }
    return new T.LatheGeometry(pts, 16);
  });
  const limb = (r1, r2, len, c) => P2(`lb${r1.toFixed(3)},${r2.toFixed(3)},${len}`, limbGeo(r1, r2, len), c, { t: .007 });
  const shade = (hex, k) => { const c = new T.Color(hex); if (k < 0) c.multiplyScalar(1 + k); else c.lerp(new T.Color('#fff'), k); return `#${c.getHexString()}`; };

  // 체형: f 여자, sh 어깨, ch 가슴, wa 허리, hip 골반, arm 팔 굵기, leg 다리 굵기, neck 목
  const BODY = [
    { f: 0, sh: .26, ch: .24, wa: .19, hip: .19, arm: .056, leg: .085, neck: .055 },
    { f: 0, sh: .23, ch: .21, wa: .165, hip: .175, arm: .048, leg: .075, neck: .05 },
    { f: 0, sh: .31, ch: .29, wa: .22, hip: .21, arm: .07, leg: .1, neck: .066 },
    { f: 1, sh: .21, ch: .205, wa: .15, hip: .215, arm: .044, leg: .08, neck: .044 },
    { f: 1, sh: .195, ch: .19, wa: .135, hip: .195, arm: .04, leg: .072, neck: .042 },
    { f: 1, sh: .225, ch: .22, wa: .16, hip: .225, arm: .05, leg: .088, neck: .047 },
  ];
  // 상의: in 안쪽 옷 색, sl 소매(long/short/none/puff/rolled), sc 소매 색, shell 겉옷 {c, gap, low(아래 끝), puffy}, crop
  const TOPS = (cc) => [
    { in: cc, sl: 'short' },
    { in: cc, sl: 'long', hood: true, pocket: true },
    { in: cc, sl: 'rolled', collar: cc },
    { in: '#2B2B38', sl: 'long', sc: '#F4F2E6', shell: { c: cc, gap: .5 }, rib: '#2B2B38' },
    { in: cc, sl: 'long', sc: '#2a2a33', shell: { c: '#2a2a33', gap: .55 }, collar: '#2a2a33' },
    { in: cc, sl: 'long', zip: true, stripe: '#fff', collar: cc },
    { in: cc, sl: 'long', rib: shade(cc, -.25) },
    { in: '#F4F2E6', sl: 'long', sc: '#2B2B38', shell: { c: '#2B2B38', gap: .42 }, tie: cc },
    { in: cc, sl: 'short', crop: true },
    { in: cc, sl: 'puff', ribbon: '#E8402C' },
    { in: '#2a2a33', sl: 'long', sc: cc, shell: { c: cc, gap: .5, low: -.95, flare: 1.5 }, collar: cc, high: true },
    { in: '#F4F2E6', sl: 'long', sc: '#1F2A6C', shell: { c: '#1F2A6C', gap: .45 }, tie: cc, emblem: true },
    { in: cc, sl: 'none' },
    { in: cc, sl: 'long', puffSl: true, shell: { c: cc, gap: 0, low: -1.25, flare: 1.35, puffy: true } },
  ];
  // 하의: k 바지 통, kind full/shorts/skirt/long
  const BOTTOMS = [
    { k: 1.08, kind: 'full' }, { k: 1.25, kind: 'full', cargo: true }, { k: 1.04, kind: 'full', crease: true }, { k: 1.12, kind: 'full', stripe: true },
    { k: 1.18, kind: 'shorts' }, { kind: 'skirt', len: .5, pleat: true }, { kind: 'skirt', len: 1.15 }, { k: 1.0, kind: 'full' },
    { k: 1.08, kind: 'full', ripped: true }, { k: 1.5, kind: 'full' },
  ];
  const EYE_C = ['#3a2a1a', '#6b3f1f', '#2F7DE1', '#3FA34D', '#9A4FB8', '#E8402C', '#F2B705', '#18b5b0', '#F27FA5', '#7C8798', '#C21F4A', '#1a1433'];

  /* 얼굴 그림 (캔버스 → 머리 앞쪽 곡면에 붙임) */
  const FW = 512, PH = 1.05, TH0 = .95, TH1 = 2.55;
  const faceCache = new Map();
  function faceTex(a, skin, hc, fem) {
    const v = (k) => a[k] || 0;
    const key = ['eyes', 'eyeColor', 'eyeSize', 'lashes', 'brow', 'mouth', 'face', 'glasses'].map(v).join(',') + skin + hc + fem;
    if (faceCache.has(key)) return faceCache.get(key);
    const cv = document.createElement('canvas'); cv.width = cv.height = FW;
    const x = cv.getContext('2d');
    x.lineCap = 'round'; x.lineJoin = 'round';
    const ink = '#1a1433', ec = EYE_C[v('eyeColor')] || EYE_C[0];
    const k = [.9, 1, 1.12, 1.25, 1.38][v('eyeSize')] * (fem ? 1.06 : 1);
    const EYY = 262, EYX = 104;
    const shapes = [
      { h: 1, top: 1, bot: .9, tilt: 0 }, { h: .74, top: .85, bot: .8, tilt: -.38 }, { h: 1.2, w: .93, top: 1.12, bot: 1.1, tilt: 0 }, { h: .95, top: 1, bot: .9, tilt: .32 },
      { h: .88, top: .95, bot: .8, tilt: -.5, wing: true }, { h: 1, top: 1, bot: .9, tilt: 0, lid: .5 }, { h: 1.08, top: 1.05, bot: 1, tilt: 0, sparkle: true }, { h: .55, top: .6, bot: .7, tilt: -.05, lid: .2 },
    ];
    const sp = shapes[v('eyes')] || shapes[0];
    const lash = v('lashes');
    for (const o of [-1, 1]) {
      const cx = FW / 2 + o * EYX, cy = EYY, w = 74 * k * (sp.w || 1), h = 62 * k * sp.h;
      const outer = [cx + o * w, cy + sp.tilt * h * .8], inner = [cx - o * w * .82, cy + h * .12];
      const topC = [cx + o * w * .1, cy - h * 1.3 * sp.top], botC = [cx, cy + h * 1.05 * sp.bot];
      const eyePath = () => { x.beginPath(); x.moveTo(...inner); x.quadraticCurveTo(...topC, ...outer); x.quadraticCurveTo(...botC, ...inner); x.closePath(); };
      x.save(); eyePath(); x.fillStyle = '#fff'; x.fill(); x.clip();
      const ix = cx + o * w * .05, iy = cy + h * .02, rx = w * .56, ry = h * .9;
      const gr = x.createLinearGradient(0, iy - ry, 0, iy + ry);
      gr.addColorStop(0, shade(ec, -.55)); gr.addColorStop(.55, ec); gr.addColorStop(1, shade(ec, .45));
      x.fillStyle = gr; x.beginPath(); x.ellipse(ix, iy, rx, ry, 0, 0, 7); x.fill();
      x.lineWidth = 3; x.strokeStyle = shade(ec, -.6); x.stroke();
      x.fillStyle = shade(ec, -.75); x.beginPath(); x.ellipse(ix, iy + ry * .05, rx * .42, ry * .5, 0, 0, 7); x.fill();
      x.fillStyle = '#fff';
      x.beginPath(); x.ellipse(ix - o * rx * .35, iy - ry * .42, rx * .3, ry * .24, 0, 0, 7); x.fill();
      x.beginPath(); x.arc(ix + o * rx * .35, iy + ry * .4, rx * .13, 0, 7); x.fill();
      if (sp.sparkle) { x.fillStyle = '#fff'; for (const [dx, dy, s] of [[-.1, .1, .3], [.45, -.2, .18]]) { const sx = ix + o * rx * dx, sy = iy + ry * dy, r = rx * s; x.beginPath(); x.moveTo(sx, sy - r); x.quadraticCurveTo(sx, sy, sx + r, sy); x.quadraticCurveTo(sx, sy, sx, sy + r); x.quadraticCurveTo(sx, sy, sx - r, sy); x.quadraticCurveTo(sx, sy, sx, sy - r); x.fill(); } }
      x.fillStyle = 'rgba(26,20,51,.18)'; x.beginPath(); x.ellipse(cx, cy - h * 1.1, w * 1.3, h * .55, 0, 0, 7); x.fill();
      if (sp.lid) { x.fillStyle = skin; x.beginPath(); x.rect(cx - w * 1.2, cy - h * 1.6, w * 2.4, h * (.55 + sp.lid * 1.6)); x.fill(); }
      x.restore();
      // 윗눈꺼풀 선
      const lidY = sp.lid ? cy - h * 1.05 + h * (.55 + sp.lid * 1.6) : null;
      x.strokeStyle = ink;
      if (lidY) { x.lineWidth = 6 * k; x.beginPath(); x.moveTo(inner[0], lidY + 2); x.lineTo(outer[0] + o * 4, lidY - 2); x.stroke(); }
      else { x.lineWidth = (6 + lash * 1.6) * k; x.beginPath(); x.moveTo(inner[0], inner[1]); x.quadraticCurveTo(...topC, outer[0] + o * 6 * k, outer[1] - 3); x.stroke(); }
      if (sp.wing) { x.lineWidth = 6 * k; x.beginPath(); x.moveTo(outer[0], outer[1]); x.lineTo(outer[0] + o * 18 * k, outer[1] - 12 * k); x.stroke(); }
      // 속눈썹
      const ly = lidY ?? outer[1];
      const flick = (dx, dy, len, ang) => { x.lineWidth = 4.5 * k; x.beginPath(); x.moveTo(outer[0] + o * dx, ly + dy); x.quadraticCurveTo(outer[0] + o * (dx + len * .6), ly + dy - len * .2, outer[0] + o * (dx + len * Math.cos(ang)), ly + dy - len * Math.sin(ang)); x.stroke(); };
      if (lash >= 2) { flick(0, 0, 24 * k, .5); flick(-12 * k, -h * .35, 20 * k, .9); }
      if (lash >= 3) { flick(4, 6, 14 * k, .1); flick(-22 * k, -h * .6, 13 * k, 1.2); x.lineWidth = 3; for (let i = 0; i < 5; i++) { const t = .35 + i * .13, px = inner[0] + (outer[0] - inner[0]) * t, py = (lidY ?? (cy - h * .95 * sp.top)) + (lidY ? 0 : Math.abs(t - .55) * h * .9); x.beginPath(); x.moveTo(px, py); x.lineTo(px + o * 4, py - 9 * k); x.stroke(); } }
      // 아랫눈꺼풀
      x.lineWidth = 2.6; x.strokeStyle = shade(ink, .25);
      x.beginPath(); const bs = .45; x.moveTo(inner[0] + (outer[0] - inner[0]) * bs, cy + h * .62 * sp.bot + 2); x.quadraticCurveTo(cx + o * w * .7, cy + h * .62 * sp.bot, outer[0] - o * 3, outer[1] + 4); x.stroke();
      if (lash >= 4) { x.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const px = cx + o * w * (.25 + i * .25), py = cy + h * .7 * sp.bot - i * 3; x.beginPath(); x.moveTo(px, py); x.lineTo(px + o * 3, py + 8); x.stroke(); } }
      if (lash === 1) { x.lineWidth = 4 * k; x.strokeStyle = ink; x.beginPath(); x.moveTo(outer[0], ly); x.lineTo(outer[0] + o * 9 * k, ly - 5 * k); x.stroke(); }
      // 눈썹
      const bc = shade(hc, -.35), by = cy - h * 1.35 - 26 * k;
      x.strokeStyle = bc; x.fillStyle = bc;
      const bi = [cx - o * w * .85, by], bo = [cx + o * w * 1.12, by];
      const brow = v('brow');
      if (brow === 5) { x.beginPath(); x.ellipse(cx - o * w * .45, by - 4, 13, 8, 0, 0, 7); x.fill(); }
      else {
        const dIn = [0, 0, 12, -12, 0][brow] || 0, dOut = [4, 0, -12, 10, 4][brow] || 0, arc = [12, 0, 4, 6, 12][brow] || 0;
        x.lineWidth = [8, 8, 9, 7, 14][brow] || 8;
        x.beginPath(); x.moveTo(bi[0], bi[1] + dIn); x.quadraticCurveTo(cx + o * w * .2, by - arc, bo[0], bo[1] + dOut); x.stroke();
      }
    }
    // 코
    x.strokeStyle = 'rgba(120,60,50,.45)'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(FW / 2 + 3, EYY + 84); x.lineTo(FW / 2 - 4, EYY + 96); x.stroke();
    // 입
    const MY = EYY + 150, mx = FW / 2;
    x.strokeStyle = ink; x.lineWidth = 5; x.save(); x.translate(mx, MY); x.scale(1.5, 1.5); x.translate(-mx, -MY);
    const mouths = [
      () => { x.beginPath(); x.moveTo(mx - 18, MY); x.quadraticCurveTo(mx, MY + 12, mx + 18, MY); x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 24, MY - 4); x.lineTo(mx + 24, MY - 4); x.quadraticCurveTo(mx, MY + 30, mx - 24, MY - 4); x.fillStyle = '#7a1f2a'; x.fill(); x.stroke(); x.fillStyle = '#fff'; x.fillRect(mx - 20, MY - 3, 40, 7); x.fillStyle = '#F27FA5'; x.beginPath(); x.ellipse(mx, MY + 13, 10, 5, 0, 0, 7); x.fill(); },
      () => { x.beginPath(); x.moveTo(mx - 14, MY + 2); x.lineTo(mx + 14, MY + 2); x.stroke(); },
      () => { x.fillStyle = '#7a1f2a'; x.beginPath(); x.ellipse(mx, MY + 4, 8, 10, 0, 0, 7); x.fill(); x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 16, MY + 8); x.quadraticCurveTo(mx, MY - 4, mx + 16, MY + 8); x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 18, MY); x.quadraticCurveTo(mx, MY + 12, mx + 18, MY); x.stroke(); x.fillStyle = '#F27FA5'; x.beginPath(); x.ellipse(mx + 6, MY + 10, 8, 9, 0, 0, Math.PI); x.fill(); x.lineWidth = 2.5; x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 22, MY - 3); x.lineTo(mx + 22, MY - 3); x.quadraticCurveTo(mx, MY + 24, mx - 22, MY - 3); x.fillStyle = '#7a1f2a'; x.fill(); x.stroke(); x.fillStyle = '#fff'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(mx + s * 16, MY - 2); x.lineTo(mx + s * 8, MY - 2); x.lineTo(mx + s * 12, MY + 8); x.fill(); } },
      () => { x.beginPath(); x.moveTo(mx - 20, MY); x.quadraticCurveTo(mx - 10, MY + 12, mx, MY + 1); x.quadraticCurveTo(mx + 10, MY + 12, mx + 20, MY); x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 16, MY + 4); x.quadraticCurveTo(mx + 4, MY + 8, mx + 18, MY - 6); x.stroke(); },
      () => { x.beginPath(); x.moveTo(mx - 26, MY - 6); x.quadraticCurveTo(mx, MY + 36, mx + 26, MY - 6); x.closePath(); x.fillStyle = '#7a1f2a'; x.fill(); x.stroke(); x.fillStyle = '#F27FA5'; x.beginPath(); x.ellipse(mx, MY + 14, 12, 6, 0, 0, 7); x.fill(); },
    ];
    (mouths[v('mouth')] || mouths[0])();
    x.restore();
    // 얼굴 장식
    const cheek = (o) => [FW / 2 + o * 130, EYY + 92];
    ({
      1: () => { x.fillStyle = '#a0603a'; for (const o of [-1, 1]) for (let i = 0; i < 5; i++) { const [cx, cy] = cheek(o); x.beginPath(); x.arc(cx + (i % 3 - 1) * 12, cy - 10 + (i % 2) * 9, 2.6, 0, 7); x.fill(); } },
      2: () => { for (const o of [-1, 1]) { const [cx, cy] = cheek(o); x.fillStyle = 'rgba(242,127,165,.55)'; x.beginPath(); x.ellipse(cx, cy - 6, 30, 15, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(214,80,120,.7)'; x.lineWidth = 2.5; for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(cx + i * 10 - 4, cy + 1); x.lineTo(cx + i * 10 + 4, cy - 12); x.stroke(); } } },
      3: () => { x.strokeStyle = '#B84A3A'; x.lineWidth = 5; x.beginPath(); x.moveTo(FW / 2 - 120, EYY - 70); x.lineTo(FW / 2 - 70, EYY + 60); x.stroke(); x.lineWidth = 3; for (const t of [.3, .55, .8]) { const px = FW / 2 - 120 + 50 * t, py = EYY - 70 + 130 * t; x.beginPath(); x.moveTo(px - 10, py + 2); x.lineTo(px + 10, py - 2); x.stroke(); } },
      4: () => { const [cx, cy] = cheek(1); x.save(); x.translate(cx, cy); x.rotate(-.4); x.fillStyle = '#F4D8B0'; x.strokeStyle = ink; x.lineWidth = 2.5; x.beginPath(); x.roundRect(-30, -11, 60, 22, 8); x.fill(); x.stroke(); x.fillStyle = '#e6c08e'; x.fillRect(-9, -9, 18, 18); x.restore(); },
      5: () => { const [cx, cy] = cheek(1); x.fillStyle = '#9A4FB8'; x.beginPath(); for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; x.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r - 6); } x.fill(); },
      6: () => { x.strokeStyle = '#E8402C'; x.lineWidth = 7; for (const o of [-1, 1]) { const [cx, cy] = cheek(o); for (const d of [0, 16]) { x.beginPath(); x.moveTo(cx - o * 26, cy - 16 + d); x.lineTo(cx + o * 22, cy - 10 + d); x.stroke(); } } },
    }[v('face')] || (() => {}))();
    // 안경
    const ER = 80 * k;
    x.strokeStyle = ink;
    ({
      1: () => { x.lineWidth = 5; for (const o of [-1, 1]) { x.beginPath(); x.arc(FW / 2 + o * EYX, EYY, ER, 0, 7); x.stroke(); } x.beginPath(); x.moveTo(FW / 2 - EYX + ER, EYY - 6); x.quadraticCurveTo(FW / 2, EYY - 18, FW / 2 + EYX - ER, EYY - 6); x.stroke(); },
      2: () => { x.lineWidth = 6; x.fillStyle = 'rgba(191,228,255,.18)'; for (const o of [-1, 1]) { x.beginPath(); x.roundRect(FW / 2 + o * EYX - ER * 1.1, EYY - ER * .7, ER * 2.2, ER * 1.4, 10); x.fill(); x.stroke(); } x.beginPath(); x.moveTo(FW / 2 - EYX + ER * 1.1, EYY - 10); x.lineTo(FW / 2 + EYX - ER * 1.1, EYY - 10); x.stroke(); },
      3: () => { x.lineWidth = 6; for (const o of [-1, 1]) { const cx = FW / 2 + o * EYX; x.beginPath(); x.moveTo(cx - ER * 1.15, EYY - ER * .6); x.lineTo(cx + ER * 1.15, EYY - ER * .6); x.quadraticCurveTo(cx + ER, EYY + ER * .9, cx, EYY + ER * .8); x.quadraticCurveTo(cx - ER, EYY + ER * .9, cx - ER * 1.15, EYY - ER * .6); x.fillStyle = '#1a1433'; x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - ER * .6, EYY - ER * .3); x.lineTo(cx - ER * .2, EYY + ER * .2); x.stroke(); x.strokeStyle = ink; x.lineWidth = 6; } x.beginPath(); x.moveTo(FW / 2 - EYX + ER, EYY - ER * .55); x.lineTo(FW / 2 + EYX - ER, EYY - ER * .55); x.stroke(); },
      4: () => { x.fillStyle = 'rgba(55,224,255,.75)'; x.strokeStyle = ink; x.lineWidth = 5; x.beginPath(); x.roundRect(FW / 2 - EYX - ER * 1.3, EYY - ER * .55, (EYX + ER * 1.3) * 2, ER * 1.1, 20); x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 4; x.beginPath(); x.moveTo(FW / 2 - EYX - ER, EYY - ER * .2); x.lineTo(FW / 2 + EYX + ER, EYY - ER * .2); x.stroke(); },
      5: () => { x.strokeStyle = '#E7B23A'; x.lineWidth = 6; x.beginPath(); x.arc(FW / 2 + EYX, EYY, ER, 0, 7); x.stroke(); x.lineWidth = 2.5; x.beginPath(); x.moveTo(FW / 2 + EYX + ER * .7, EYY + ER * .7); x.quadraticCurveTo(FW / 2 + EYX + ER * 1.5, EYY + ER * 2.5, FW / 2 + EYX + ER * .6, EYY + ER * 3.6); x.stroke(); },
      6: () => { const cx = FW / 2 - EYX; x.fillStyle = '#1a1433'; x.beginPath(); x.ellipse(cx, EYY + 4, ER * 1.05, ER * .9, 0, 0, 7); x.fill(); x.lineWidth = 6; x.beginPath(); x.moveTo(cx - ER * 3, EYY - ER * 1.6); x.lineTo(cx + ER * 3.5, EYY + ER * .6); x.stroke(); },
      7: () => { x.lineWidth = 6; x.fillStyle = 'rgba(242,127,165,.35)'; for (const o of [-1, 1]) { const cx = FW / 2 + o * EYX; x.beginPath(); for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? ER * .6 : ER * 1.3; x.lineTo(cx + Math.cos(t) * r, EYY + Math.sin(t) * r); } x.closePath(); x.strokeStyle = '#F27FA5'; x.fill(); x.stroke(); } },
    }[v('glasses')] || (() => {}))();
    const tex = new T.CanvasTexture(cv);
    tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new T.MeshBasicMaterial({ map: tex, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
    if (faceCache.size > 120) faceCache.delete(faceCache.keys().next().value);
    faceCache.set(key, mat);
    return mat;
  }
  // 머리 모양: 아래쪽을 좁혀 V라인 턱
  const deform = (geo, r) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let px = p.getX(i), py = p.getY(i), pz = p.getZ(i);
      const ny = py / r;
      if (ny < 0) { const t = -ny; px *= 1 - .28 * t * t * t; pz *= 1 - .12 * t * t; if (pz > 0) pz += r * .05 * t * t; py *= 1 - .08 * t; }
      p.setXYZ(i, px * .92, py * 1.06, pz * .96);
    }
    geo.computeVertexNormals();
    return geo;
  };

  function build(a) {
    const v = (k) => a[k] || 0;
    const skin = SKIN[v('skin')], hc = HAIR_C[v('hairColor')], cc = CLOTH_C[v('outfitColor')];
    const pc = PANTS_C[v('pantsColor')], sc = SHOE_C[v('shoeColor')];
    const B = BODY[v('body')] || BODY[0], fem = !!B.f;
    const top = TOPS(cc)[v('outfit')] || TOPS(cc)[0], bot = BOTTOMS[v('bottom')] || BOTTOMS[0];
    const root = new T.Group(), hips = new T.Group(), torso = new T.Group(), head = new T.Group();
    const J = { root, hips, torso, head };
    root.add(hips);
    const TH = .8, SH = .72;
    hips.position.y = TH + SH + .1;
    hips.add(torso);
    const depth = fem ? .66 : .62;

    // 다리
    const pantsLeg = bot.kind === 'full' || bot.kind === 'shorts';
    const lk = pantsLeg ? bot.k : 1;
    for (const s of [-1, 1]) {
      const leg = at(new T.Group(), s * B.hip * .52, -.02, 0);
      const thighC = pantsLeg ? pc : skin, shinC = bot.kind === 'full' ? pc : skin;
      const r0 = B.leg * lk, r1 = B.leg * .78 * (bot.kind === 'full' ? lk : bot.kind === 'shorts' ? 1 : 1);
      leg.add(limb(r0 * 1.05, bot.kind === 'shorts' ? r0 * .95 : r1, TH, thighC));
      if (bot.kind === 'shorts') leg.add(at(limb(r1 * .95, r1 * .9, TH * .45, skin), 0, -TH * .55, 0));
      const shin = at(new T.Group(), 0, -TH, 0);
      const r2 = bot.kind === 'full' ? Math.max(B.leg * .55 * lk, B.leg * .62 * (lk > 1.2 ? lk * .95 : 1)) : B.leg * .5;
      shin.add(limb(r1 * .97, r2, SH, shinC));
      if (bot.cargo) leg.add(at(part(box(.06, .17, .13), shade(pc, -.12), { line: .006 }), s * r0 * 1.02, -TH * .55, 0));
      if (bot.stripe) { leg.add(at(part(box(.02, TH, .03), '#fff', { line: 0 }), s * r0 * .95, -TH * .5, 0, 0, 0, -s * .05)); shin.add(at(part(box(.02, SH, .03), '#fff', { line: 0 }), s * r1 * .9, -SH * .5, 0)); }
      if (bot.crease) shin.add(at(new T.Mesh(box(.006, SH * .9, .006), flat(shade(pc, -.3))), 0, -SH * .5, r1 * .92));
      if (bot.ripped) for (const [y, w] of [[-.05, .07], [-TH * .45, .05]]) (y < -.1 ? leg : shin).add(at(new T.Mesh(disc(w), flat(skin, T.DoubleSide)), 0, y < -.1 ? y : -.04, (y < -.1 ? r0 * .9 : r1) + .004));
      if (bot.kind === 'full' && lk > 1.15) shin.add(at(limb(r2 * 1.02, r2 * 1.05, .08, pc), 0, -SH + .06, 0));
      // 신발: 예전 신발을 줄여 씁니다
      const shoe = new T.Group();
      shoeParts(shoe, v('shoes'), sc);
      shoe.scale.set(.46, .5, .56);
      at(shoe, 0, -SH - .02, .03);
      shin.add(shoe);
      leg.add(shin);
      hips.add(leg);
      J[s < 0 ? 'legL' : 'legR'] = leg; J[s < 0 ? 'shinL' : 'shinR'] = shin;
    }
    // 치마
    if (bot.kind === 'skirt') {
      const L = bot.len, n = bot.pleat ? 24 : 18;
      const geo = G(`skirt${B.hip}${L}${bot.pleat}`, () => {
        const pts = [v2(B.wa * 1.08, .14), v2(B.hip * 1.08, -.02), v2(B.hip * 1.35 + L * .12, -L)];
        const g = new T.LatheGeometry(pts, n);
        if (bot.pleat) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const j = Math.round(Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2) * n); const f = 1 + (j % 2 ? .05 : 0) * Math.min(1, -p.getY(i) / L + .2); p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); } }
        g.scale(1, 1, depth + .12); g.computeVertexNormals(); return g;
      });
      const m = new T.Mesh(geo, new T.MeshToonMaterial({ color: pc, gradientMap: grad, side: T.DoubleSide }));
      hips.add(m);
    }

    // 몸통 (세로 색 띠)
    const tY = (y) => {
      if (y < .07) return bot.kind === 'skirt' ? pc : pantsLeg ? pc : pc;
      if (top.crop && y < .4) return skin;
      if (y > .9) return skin;
      return top.in;
    };
    const torsoGeo = G(`torso${v('body')}`, () => {
      const prof = [[.001, -.17], [B.hip * .8, -.15], [B.hip, -.06], [B.hip * .97, .07], [B.wa, .3], [B.ch * 1.02, .56], [B.sh * .93, .75], [B.sh * .6, .88], [B.neck * 1.3, .95], [.001, .97]];
      const g = new T.LatheGeometry(new T.SplineCurve(prof.map(([x, y]) => new T.Vector2(x, y))).getPoints(34).map((p) => v2(p.x, p.y)), 22);
      g.scale(1, 1, depth); g.computeVertexNormals(); return g;
    });
    {
      const geo = torsoGeo.clone();
      const p = geo.attributes.position, col = new Float32Array(p.count * 3), tc = new T.Color();
      for (let i = 0; i < p.count; i++) { tc.set(tY(p.getY(i))); tc.convertSRGBToLinear(); col.set([tc.r, tc.g, tc.b], i * 3); }
      geo.setAttribute('color', new T.BufferAttribute(col, 3));
      const g = new T.Group();
      g.add(new T.Mesh(geo, new T.MeshToonMaterial({ color: '#fff', vertexColors: true, gradientMap: grad })));
      g.add(new T.Mesh(inflate(`torso${v('body')}`, torsoGeo, .009), OUT));
      torso.add(g);
    }
    const chestZ = B.ch * depth;
    const front = (o, y, dz = 0) => torso.add(at(o, 0, y, chestZ + dz));
    // 장식
    if (top.zip) front(at(part(box(.012, .78, .01), '#C7CDD6', { line: .003 }), 0, 0, 0), .5, .004);
    if (top.pocket) front(part(box(.24, .12, .02), shade(top.in, -.15), { line: .005 }), .22, -.02);
    if (top.rib) for (const y of [.09]) addR(torso, at(new T.Mesh(tor(B.hip * 1.01, .018, Math.PI * 2, 6, 30), toon(top.rib)), 0, y, 0, Math.PI / 2)).scale.set(1, depth, 1);
    if (top.hood) torso.add(at(part(tor(.13, .055, Math.PI * 2, 8, 20), top.in), 0, .88, -chestZ * .55, Math.PI / 2.4));
    if (top.collar) for (const s of [-1, 1]) addR(torso, at(part(shapeGeo('col', [[0, 0], [.12, .02], [.04, -.1]], .015), top.collar, { line: .005 }), s * .06, top.high ? .95 : .9, chestZ * (top.high ? .5 : .62), top.high ? -.4 : -.2, 0, s < 0 ? Math.PI : 0)).scale.x = s < 0 ? -1 : 1;
    if (top.tie) front(at(part(shapeGeo('tie', [[-.025, 0], [.025, 0], [.035, -.3], [0, -.35], [-.035, -.3]], .015), top.tie, { line: .004 }), 0, 0, 0), .84, -.02);
    if (top.ribbon) for (const s of [-1, 1]) front(at(part(cone(.035, .08, 8), top.ribbon, { line: .004 }), s * .04, 0, 0, 0, 0, s * Math.PI / 2), .84, -.02);
    if (top.emblem) torso.add(at(part(cyl(.035, .035, .01, 12), '#FFD23F', { line: .004 }), -.12, .62, chestZ * 1.12, Math.PI / 2));
    // 겉옷
    if (top.shell) {
      const sh = top.shell, low = sh.low ?? .02, gap = sh.gap;
      const geo = G(`shell${v('body')}${low}${gap}${sh.flare || 1}`, () => {
        const prof = [...(low < 0 ? [[B.hip * (sh.flare || 1.2) * 1.1, low], [B.hip * 1.12, -.1]] : [[B.hip * 1.08, low]]), [B.wa * 1.12, .3], [B.ch * 1.1, .56], [B.sh * 1.03, .75], [B.sh * .72, .88], [B.neck * 1.8, .96]];
        const g = new T.LatheGeometry(new T.SplineCurve(prof.map(([x, y]) => new T.Vector2(x, y))).getPoints(30).map((p) => v2(p.x, p.y)), 26, gap, Math.PI * 2 - gap * 2);
        g.scale(1, 1, depth + .08); g.computeVertexNormals(); return g;
      });
      const m = new T.Mesh(geo, new T.MeshToonMaterial({ color: sh.c, gradientMap: grad, side: T.DoubleSide }));
      torso.add(m);
      if (sh.puffy) for (let y = low + .15; y < .8; y += .22) { const rr = y < -.1 ? B.hip * (sh.flare || 1.2) * 1.1 - (y - low) * .05 : y < .3 ? B.wa * 1.15 : B.ch * 1.12; addR(torso, at(new T.Mesh(tor(1, .012, Math.PI * 2 - gap * 2, 6, 30), toon(shade(sh.c, -.2))), 0, y, 0, Math.PI / 2)).scale.set(rr * 1.02, rr * (depth + .1), 1); }
      if (top.rib && gap) addR(torso, at(new T.Mesh(tor(B.hip * 1.1, .03, Math.PI * 2 - gap * 2, 6, 30), toon(top.rib)), 0, low + .02, 0, Math.PI / 2, 0, -Math.PI / 2 - (Math.PI - gap) + Math.PI)).scale.set(1, depth + .1, 1);
    }
    // 목
    torso.add(at(limb(B.neck, B.neck * 1.1, .14, skin), 0, 1.04, 0));
    // 목 장식
    ({
      1: () => { torso.add(at(part(tor(B.neck * 1.7, .045, Math.PI * 2, 8, 20), '#E8402C', { line: .006 }), 0, .93, 0, Math.PI / 2)); front(part(box(.08, .26, .03), '#E8402C', { line: .005 }), .74, .02); },
      2: () => { torso.add(at(new T.Mesh(tor(B.neck * 2.3, .007, Math.PI * 2, 6, 30), toon('#FFD23F')), 0, .84, .02, 1.25)); front(part(sph(.03, 10, 8), '#FFD23F', { line: .004 }), .7, .015); },
      3: () => { for (const s of [-1, 1]) torso.add(at(part(cone(.035, .07, 4), '#E8402C', { line: .004 }), s * .035, .88, chestZ * .72, 0, 0, s * Math.PI / 2)); },
      4: () => front(part(shapeGeo('ban2', [[-.13, .04], [.13, .04], [0, -.13]], .02), '#2F7DE1', { line: .005 }), .84, -.02),
      5: () => { torso.add(at(new T.Mesh(tor(B.neck * 2.2, .012, Math.PI * 2, 6, 30), toon('#2F7DE1')), 0, .84, .02, 1.2)); front(at(part(cyl(.045, .045, .012, 16), '#FFD23F', { line: .004 }), 0, 0, 0, Math.PI / 2), .64, .02); },
    }[v('neck')] || (() => {}))();

    // 팔
    const sl = top.sl, slC = top.sc || top.in;
    for (const s of [-1, 1]) {
      const sh = at(new T.Group(), s * (B.sh - B.arm * .2), .8, 0);
      const upC = sl === 'none' ? skin : slC;
      const ua = B.arm * (top.puffSl ? 1.5 : top.shell ? 1.12 : 1);
      sh.add(limb(ua * 1.05, ua * .86, .46, upC));
      if (sl === 'puff') sh.add(at(part(sph(B.arm * 1.9, 14, 10), slC, { line: .006 }), 0, -.04, 0));
      if (sl === 'short' || sl === 'puff') sh.add(at(limb(B.arm * .92, B.arm * .82, .26, skin), 0, -.2, 0));
      const fore = at(new T.Group(), 0, -.47, 0);
      const foreC = sl === 'long' ? slC : skin;
      fore.add(limb(ua * .86, ua * .7, .42, foreC));
      if (sl === 'rolled') fore.add(at(new T.Mesh(tor(B.arm * .95, .018, Math.PI * 2, 6, 16), toon(slC)), 0, -.02, 0, Math.PI / 2));
      if (top.stripe) { sh.add(at(part(box(.016, .46, .02), top.stripe, { line: 0 }), s * ua * .95, -.23, 0)); fore.add(at(part(box(.016, .42, .02), top.stripe, { line: 0 }), s * ua * .8, -.21, 0)); }
      if (sl === 'long' && top.rib) fore.add(at(new T.Mesh(tor(ua * .72, .02, Math.PI * 2, 6, 16), toon(top.rib)), 0, -.4, 0, Math.PI / 2));
      const hand = at(new T.Group(), 0, -.47, 0);
      handParts(hand, v('gloves'), skin);
      fore.add(hand);
      sh.add(fore);
      torso.add(sh);
      J[s < 0 ? 'armL' : 'armR'] = sh; J[s < 0 ? 'foreL' : 'foreR'] = fore; J[s < 0 ? 'handL' : 'handR'] = hand;
    }
    // 손하트, 공, 트로피 소품
    { const hp = at(part(shapeGeo('hp', heartPts(.1), .04), '#FF5C8A', { line: .01 }), 0, .72, chestZ + .32); hp.visible = false; torso.add(hp); J.heartProp = hp; }
    { const ball = new T.Group(); ball.add(part(sph(.07, 16, 12), '#fff', { line: .006 })); ball.add(at(new T.Mesh(tor(.071, .006, Math.PI * 2, 6, 24), flat('#E8402C')), 0, 0, 0, 0, .5)); ball.visible = false; J.handL.add(ball); J.ball = ball; }
    { const tr = new T.Group(); tr.add(at(part(cyl(.11, .05, .16, 16), '#FFD23F', { line: .006 }), 0, .19, 0)); tr.add(at(part(cyl(.03, .03, .08), '#E7B23A', { line: .004 }), 0, .07, 0)); tr.add(at(part(box(.12, .04, .08), '#8B5A2B', { line: .004 }), 0, .01, 0)); for (const s of [-1, 1]) tr.add(at(part(tor(.045, .012, Math.PI), '#FFD23F', { line: .003 }), s * .12, .2, 0, 0, 0, s * Math.PI / 2)); tr.visible = false; tr.position.set(0, -.04, .04); tr.rotation.x = Math.PI; J.handR.add(tr); J.trophy = tr; }
    // 손에 든 것 (예전 크기 → 키운 그룹)
    { const g = new T.Group(); g.scale.setScalar(1.65); J.handR.add(g); handItem(g, v('hand')); J.item = g; }

    // 머리
    torso.add(at(head, 0, .98, 0));
    const R = .28, HC = R * .95;
    J.R = R;
    head.add(at(P2(`head${R}`, G(`headg${R}`, () => deform(new T.SphereGeometry(R, 32, 24), R)), skin, { t: .008 }), 0, HC, 0));
    for (const s of [-1, 1]) addR(head, at(part(sph(.045, 10, 8), skin, { line: .004 }), s * R * .93, HC - .02, -.01)).scale.set(.5, 1, .8);
    const patch = G(`face${R}`, () => deform(new T.SphereGeometry(R * 1.008, 40, 32, Math.PI / 2 - PH, PH * 2, TH0, TH1 - TH0), R * 1.008));
    head.add(at(new T.Mesh(patch, faceTex(a, skin, hc, fem)), 0, HC, 0));
    J.HC = HC;
    hairParts(head, v('hair'), hc, R, HC);
    // 모자: 예전 크기로 만들고 줄입니다
    { const oh = new T.Group(), R0 = .68, HC0 = R0 * .75, k = R / R0; oh.scale.set(k * 1.02, k * 1.12, k * 1.02); oh.position.y = HC - HC0 * k * 1.12 + .01; hatParts(oh, v('hat'), R0, HC0, hc, cc); head.add(oh); }
    // 등
    { const back = new T.Group(); back.scale.setScalar(.62); torso.add(at(back, 0, .58, -chestZ - .02)); backParts(back, v('back'), cc); }

    // 오라·이펙트
    const aura = new T.Group();
    root.add(aura);
    auraParts(aura, v('aura'));
    J.aura = aura;
    root.scale.setScalar([1, .95, 1.05][v('height')] * (fem ? .97 : 1));
    return J;
  }

  /* ---------- 부품 (예전 꾸미기 재사용) ---------- */
  function shoeParts(shoe, kind, sc) {
    const shoes = [
      () => { shoe.add(at(part(box(.26, .16, .38), sc), 0, 0, .02)); shoe.add(at(part(box(.27, .05, .4), '#fff', { line: .02 }), 0, -.08, .02)); },
      () => { shoe.add(at(part(cyl(.15, .16, .44), sc), 0, .16, 0)); shoe.add(at(part(box(.26, .12, .36), sc), 0, -.04, .05)); },
      () => { shoe.add(at(part(box(.26, .06, .38), sc), 0, -.06, .03)); shoe.add(at(part(box(.22, .04, .12), '#fff', { line: .015 }), 0, -.01, .08)); },
      () => { shoe.add(at(part(box(.24, .13, .4), '#1a1433', { mat: new T.MeshPhongMaterial({ color: INK, shininess: 90 }) }), 0, 0, .04)); },
      () => { shoe.add(at(part(cyl(.15, .15, .3), sc), 0, .1, 0)); shoe.add(at(part(box(.27, .14, .38), sc), 0, -.02, .04)); shoe.add(at(part(box(.28, .05, .4), '#fff', { line: .015 }), 0, -.08, .04)); },
      () => { shoe.add(at(part(cyl(.16, .17, .6), sc), 0, .22, 0)); shoe.add(at(part(box(.27, .1, .38), sc), 0, -.06, .05)); },
      () => { shoe.add(at(part(box(.25, .16, .38), sc), 0, 0, .02)); for (const z of [-.12, .14]) shoe.add(at(part(cyl(.06, .06, .3, 12), '#E8402C'), 0, -.13, z, 0, 0, Math.PI / 2)); },
      () => { shoe.add(at(part(box(.24, .04, .38), sc), 0, -.07, .03)); shoe.add(at(part(box(.04, .06, .16), '#fff', { line: .01 }), 0, -.03, .08)); },
    ];
    (shoes[kind] || shoes[0])();
  }
  function handParts(hand, gl, skin) {
    const handColor = ['', '#fff', '#E8402C', '#5a3a22', '#E8402C', '#8a8f98'][gl] || skin;
    const g = new T.Group(); g.scale.setScalar(.42); hand.add(g);
    g.add(at(part(gl === 2 ? sph(.19) : gl === 5 ? box(.24, .24, .24) : gl === 4 ? sph(.15) : sph(.13), handColor, { line: .02 }), 0, -.04, 0));
    const hr = gl === 2 ? .19 : gl === 5 ? .13 : gl === 4 ? .15 : .13, fr = hr * .3, fl = hr * 1.05;
    const finger = (x, rz, len = fl, rx = 0) => { const f = at(new T.Group(), x, -hr * .7, 0, rx, 0, rz); f.add(at(part(cap(fr, len), handColor, { line: .02 }), 0, -len / 2 - fr, 0)); return f; };
    const gest = {};
    gest.v = new T.Group(); gest.v.add(finger(-hr * .35, -.28), finger(hr * .35, .28));
    gest.point = new T.Group(); gest.point.add(finger(0, 0, fl * 1.1));
    gest.thumb = new T.Group(); { const f = finger(0, 0, fl * .85, -Math.PI / 2); f.position.set(0, -hr * .15, hr * .55); gest.thumb.add(f); }
    for (const o of Object.values(gest)) { o.visible = false; g.add(o); }
    hand.userData.gest = gest;
  }
  function handItem(g, kind) {
    const H = (o) => g.add(o);
    ({
      1: () => { H(at(part(box(.06, .9, .02), '#D7DDE5'), 0, .5, .06)); H(at(part(box(.26, .05, .06), '#E7B23A'), 0, .06, .06)); },
      2: () => { H(at(part(cyl(.035, .035, 1.1), '#8B5A2B'), 0, .3, .04)); H(at(part(sph(.13), '#6CF2C2', { mat: flat('#6CF2C2') }), 0, .9, .04)); },
      3: () => { H(at(part(cyl(.025, .025, 1.1), '#c7cdd6'), 0, .35, .04)); H(at(part(box(.5, .32, .02), '#E8402C'), .27, .72, .04)); },
      4: () => { H(at(part(cyl(.04, .03, .25), INK), 0, .12, .06)); H(at(part(sph(.08), '#7C8798'), 0, .28, .06)); },
      5: () => { H(at(part(cone(.08, .22), '#E7A84B'), 0, .14, .06, Math.PI)); H(at(part(sph(.1), '#FFB3CC'), 0, .3, .06)); },
      6: () => { H(at(part(cyl(.025, .025, .6), '#AEB7C2'), 0, .25, .05)); H(at(part(sph(.12, 16, 8), '#AEB7C2'), 0, .58, .1)); },
      7: () => { H(at(part(cyl(.03, .03, .7), '#C9924F'), 0, .3, .05)); H(at(part(sph(.17), '#D52C2C'), 0, .7, .05)); },
      8: () => { H(at(part(cyl(.03, .03, 1), '#8B5A2B'), 0, .3, .05)); H(at(part(cone(.18, .4), '#C7A64B'), 0, .9, .05, Math.PI)); },
      9: () => { for (const x of [-.05, .05]) H(at(part(cyl(.02, .02, .8), '#59606c'), x, .3, .05, 0, 0, x * 1.5)); H(at(part(cyl(.12, .12, .14), '#3b3640'), 0, .74, .05)); },
    }[kind] || (() => {}))();
  }
  function backParts(back, kind, cc) {
    const B = (o) => addR(back, o);
    const wing = (c, key, pts) => { for (const s of [-1, 1]) { const w = part(shapeGeo(key, pts, .04), c); w.scale.x = s; B(at(w, s * .3, .15, -.05, 0, s * -.4)); } };
    ({
      1: () => { const c = new T.Mesh(G('cape2', () => { const g = new T.PlaneGeometry(.75, 2.3, 4, 6); g.translate(0, -1, 0); return g; }), new T.MeshToonMaterial({ color: '#B31220', gradientMap: grad, side: T.DoubleSide })); B(at(c, 0, .5, -.04, .1)); },
      2: () => wing('#ffffff', 'aw', [[0, 0], [.2, .35], [.55, .42], [.75, .2], [.6, .05], [.68, -.12], [.45, -.2], [.4, -.35], [.15, -.2]]),
      3: () => wing('#5a1020', 'dw', [[0, 0], [.25, .4], [.75, .45], [.6, .2], [.7, .02], [.48, .05], [.52, -.16], [.3, -.08], [.15, -.25]]),
      4: () => { B(at(part(box(.5, .6, .22), cc), 0, -.2, -.08)); B(at(part(box(.4, .2, .08), '#fff', { line: .01 }), 0, -.3, -.21)); },
      5: () => { for (const s of [-1, 1]) { B(at(part(cyl(.12, .12, .55), '#AEB7C2'), s * .14, -.1, -.1)); B(at(part(cone(.1, .3), '#FF8A1A', { mat: flat('#FF8A1A') }), s * .14, -.53, -.1, Math.PI)); } },
      6: () => { B(at(part(box(.07, 1.3, .03), '#D7DDE5'), .05, 0, -.05, 0, 0, .7)); B(at(part(box(.24, .05, .06), '#E7B23A'), -.25, -.3, -.05, 0, 0, .7)); },
      7: () => wing('#F27FA5', 'bw', [[0, 0], [.3, .5], [.7, .55], [.65, .2], [.4, 0], [.6, -.2], [.45, -.45], [.15, -.3]]),
      8: () => { B(at(part(sph(.3), '#C9924F'), .05, -.35, -.1)).scale.set(1, 1.3, .4); B(at(part(box(.08, 1.1, .06), '#5a3a22'), -.1, .3, -.1, 0, 0, .25)); },
      9: () => { B(at(part(cyl(.02, .02, 1.8), '#8B5A2B'), 0, .3, -.05)); B(at(part(box(.5, .65, .02), '#FFD23F'), .25, .85, -.05)); },
    }[kind] || (() => {}))();
  }
  function hatParts(head, kind, R, HC, hc, cc) {
    const hatY = HC + R * .78;
    const hatAdd = (o) => addR(head, o);
    ({
      1: () => { hatAdd(at(part(G('capdome', () => new T.SphereGeometry(R * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), cc), 0, HC + .05, 0, -.2)); hatAdd(at(part(cyl(.42, .42, .03, 24), INK), 0, HC + .22, R * .65, .3)).scale.set(1, 1, .6); },
      2: () => { hatAdd(at(part(G('beanie', () => new T.SphereGeometry(R * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), cc), 0, HC + .1, 0, -.15)); hatAdd(at(part(cyl(R * 1.1, R * 1.1, .14, 24), '#fff'), 0, HC + .12, 0, -.15)); hatAdd(at(part(sph(.14), '#fff'), 0, hatY + .32, 0)); },
      3: () => { hatAdd(at(part(tor(R * 1.0, .06, Math.PI * 2, 8, 40), '#E8402C'), 0, HC + .3, 0, Math.PI / 2 - .2)); hatAdd(at(part(box(.08, .4, .03), '#E8402C'), -.15, HC + .1, -R - .02, 0, 0, .5)); },
      4: () => { hatAdd(at(part(cyl(R * 1.6, R * 1.6, .04, 30), '#E7C98A'), 0, hatY - .02, 0, -.1)); hatAdd(at(part(cyl(R * .7, R * .85, .35, 24), '#E7C98A'), 0, hatY + .12, -.02, -.1)); hatAdd(at(part(cyl(R * .86, R * .86, .08, 24), '#E8402C', { line: .01 }), 0, hatY + .02, -.02, -.1)); },
      5: () => { hatAdd(at(part(cyl(R * .6, R * .6, .22, 20, true), '#F2B705'), 0, hatY + .08, 0)); for (let i = 0; i < 5; i++) { const t = (i / 5) * Math.PI * 2; hatAdd(at(part(cone(.08, .2, 6), '#F2B705'), Math.cos(t) * R * .58, hatY + .26, Math.sin(t) * R * .58)); } hatAdd(at(part(sph(.06), '#E8402C'), 0, hatY + .1, R * .62)); },
      6: () => { hatAdd(at(part(G('bn2', () => new T.SphereGeometry(R * 1.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 1.9)), cc), 0, HC + .06, 0, -.12)); hatAdd(at(part(sph(.13), '#fff'), 0, hatY + .34, -.05)); },
      7: () => { hatAdd(at(part(tor(R * 1.0, .07, Math.PI * 2, 8, 40), '#E8402C'), 0, HC + .25, 0, Math.PI / 2)); for (const s of [-1, 1]) hatAdd(at(part(box(.07, .45, .02), '#E8402C'), s * .08, HC + .05, -R - .04, 0, 0, s * .5)); },
      8: () => { hatAdd(at(part(cyl(R * 1.7, R * 1.7, .05, 30), '#8B5A2B'), 0, hatY - .02, 0)).scale.set(1, 1, .8); hatAdd(at(part(cyl(R * .55, R * .75, .45, 20), '#8B5A2B'), 0, hatY + .2, 0)); },
      9: () => { hatAdd(at(part(cyl(R * 1.6, R * 1.6, .04, 30), '#3B2F8C'), 0, hatY - .02, 0)); hatAdd(at(part(cone(R * .8, 1.1, 20), '#3B2F8C'), .05, hatY + .55, -.05, -.2, 0, -.15)); },
      10: () => { hatAdd(at(part(G('vik', () => new T.SphereGeometry(R * 1.08, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)), '#8a8f98'), 0, HC + .1, 0)); for (const s of [-1, 1]) hatAdd(at(part(cone(.1, .55, 10), '#F4ECD8'), s * R * .95, hatY + .15, 0, 0, 0, s * -.9)); },
      11: () => hatAdd(at(new T.Mesh(tor(R * .7, .05, Math.PI * 2, 8, 40), flat('#FFE45C')), 0, hatY + .4, 0, Math.PI / 2)),
      12: () => { for (const s of [-1, 1]) { hatAdd(at(part(cone(.2, .4, 4), hc), s * R * .55, hatY + .1, 0, 0, 0, s * -.35)); hatAdd(at(new T.Mesh(cone(.1, .22, 4), flat('#F27FA5')), s * R * .55, hatY + .08, .08, 0, 0, s * -.35)); } },
      13: () => { hatAdd(at(part(tor(R * 1.08, .05, Math.PI, 8, 30), '#1a1433'), 0, HC + .05, 0)); for (const s of [-1, 1]) hatAdd(at(part(cyl(.2, .2, .14, 18), cc), s * R * 1.05, HC, 0, 0, 0, Math.PI / 2)); },
    }[kind] || (() => {}))();
  }

  /* 머리카락 (애니풍 가닥) */
  const lockGeo = (len, r) => G(`lk${len}${r}`, () => { const g = new T.ConeGeometry(r, len, 7, 1); g.rotateX(Math.PI); g.translate(0, -len / 2, 0); return g; });
  function hairParts(head, kind, hc, R, HC) {
    const hm = toon(hc), dark = toon(shade(hc, -.18));
    const D = new T.Vector3(0, -1, 0);
    const surf = (th, ph, rr = 1.03) => { const y = Math.cos(th); const sq = Math.sin(th); return new T.Vector3(R * rr * sq * Math.sin(ph) * .92, HC + R * rr * y * 1.06, R * rr * sq * Math.cos(ph) * .96); };
    const nrm = (th, ph) => new T.Vector3(Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph));
    // 가닥: (th, ph) 자리에서 아래로, out만큼 바깥으로 기울어 늘어짐. dir을 주면 그 방향
    const lock = (th, ph, len, r, out = .35, { dir, rr = 1.02, flatZ = .55, side = 0, m = hm } = {}) => {
      const base = surf(th, ph, rr), n = nrm(th, ph);
      const d = dir ? dir.clone().normalize() : new T.Vector3(side, -1, 0).add(n.multiplyScalar(out)).normalize();
      const g = new T.Group();
      g.add(new T.Mesh(lockGeo(len, r), m));
      g.add(new T.Mesh(inflate(`lk${len}${r}`, lockGeo(len, r), .006), OUT));
      g.position.copy(base);
      g.quaternion.setFromUnitVectors(D, d);
      // 납작하게: 머리 표면 쪽으로
      g.children.forEach((c) => c.scale.set(1, 1, flatZ));
      g.rotateOnAxis(new T.Vector3(0, 1, 0), 0);
      head.add(g);
      return g;
    };
    const capShell = (thetaLen = 1.75, tilt = -.38, rr = 1.06) => {
      const geo = G(`hcap${thetaLen}${rr}`, () => deform(new T.SphereGeometry(R * rr, 32, 18, 0, Math.PI * 2, 0, thetaLen), R * rr));
      const c = P2(`hcap${thetaLen}${rr}`, geo, hc, { t: .007 });
      c.position.y = HC; c.rotation.x = tilt; head.add(c); return c;
    };
    const blob = (r, p, s, m = hm) => { const b = P2(`hb${r}`, sph(r, 14, 10), hc, { t: .006, mat: m }); b.position.copy(p); if (s) b.scale.set(...s); head.add(b); return b; };
    const ring = () => { const r = new T.Mesh(tor(R * 1.0, .012, Math.PI * .8, 6, 24), flat(shade(hc, .45), T.FrontSide, .8)); r.position.set(0, HC + R * .62, .02); r.rotation.set(Math.PI / 2 - .55, 0, Math.PI * .1); head.add(r); };
    const bangs = (n = 7, len = .2, spread = .75, opts = {}) => { for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; lock(.62 + Math.abs(t) * .25, t * spread, len * (1 - Math.abs(t) * .25) * (opts.blunt ? 1 : (i % 2 ? .85 : 1.05)), opts.r || .065, .55, { side: (opts.sweep || 0) + t * .15 }); } };
    const sides = (len = .22, r = .07) => { for (const s of [-1, 1]) { lock(1.1, s * 1.35, len, r, .25); lock(1.25, s * 1.65, len * .9, r, .2); } };
    const back = (len = .25, r = .08, n = 7, th = 1.55, out = .2) => { for (let i = 0; i < n; i++) { const ph = Math.PI + ((i / (n - 1)) * 2 - 1) * 1.5; lock(th, ph, len * (i % 2 ? .9 : 1.05), r, out); } };
    const longCurtain = (len = .85) => { back(len, .11, 9, 1.35, .15); for (const s of [-1, 1]) { lock(1.05, s * 1.3, len * .75, .085, .2); lock(1.2, s * 1.75, len * .9, .1, .18); } };
    ({
      0: () => { capShell(); bangs(); sides(); back(.18, .08); },
      1: () => { capShell(); bangs(6, .22, .7, { sweep: .55 }); sides(.16); back(.14, .08); },
      2: () => { capShell(1.7, -.4, 1.04); for (let i = 0; i < 12; i++) { const th = .15 + (i % 3) * .3, ph = (i / 12) * Math.PI * 2; const n = nrm(th, ph); lock(th, ph, .18 + (i % 2) * .06, .075, 0, { dir: n.add(new T.Vector3(0, .6, -.2)), rr: .95 }); } bangs(5, .18, .6); sides(.15); },
      3: () => { capShell(); bangs(6, .24, .75, { sweep: -.5 }); lock(.65, .55, .2, .07, .6, { side: .5 }); sides(.2); back(.18, .08); },
      4: () => { capShell(); bangs(7, .24, .75); sides(.28, .075); back(.4, .085, 8, 1.6, .45); },
      5: () => { capShell(1.8, -.3, 1.04); bangs(5, .2, .6); sides(.25, .06); blob(.06, surf(1.1, Math.PI, 1.05)); lock(1.05, Math.PI, .75, .12, .7, { dir: new T.Vector3(0, -1, -.35) }); },
      6: () => { capShell(1.8, -.3, 1.04); bangs(7, .22, .75); for (const s of [-1, 1]) { blob(.05, surf(.85, s * 1.9, 1.04)); lock(.85, s * 1.9, .85, .11, .5, { dir: new T.Vector3(s * .4, -1, -.1) }); } },
      7: () => { capShell(); bangs(7, .23, .75); longCurtain(.95); },
      8: () => { capShell(1.85, -.25); bangs(9, .21, .8, { blunt: true, r: .055 }); for (const s of [-1, 1]) { lock(1.05, s * 1.3, .32, .09, .15); lock(1.2, s * 1.75, .3, .1, .15); } back(.28, .1, 7, 1.45, .15); },
      9: () => { capShell(); bangs(7, .23, .75); longCurtain(.8); blob(.09, surf(.7, Math.PI, 1.02)); },
      10: () => { capShell(1.8, -.3, 1.04); bangs(5, .2, .65); sides(.22, .06); blob(.13, surf(.35, Math.PI, 1.1)); blob(.045, surf(.6, Math.PI, 1.04), null, dark); },
      11: () => { capShell(); bangs(7, .23, .75); for (let i = 0; i < 10; i++) { const ph = Math.PI + ((i / 9) * 2 - 1) * 1.6; const g = lock(1.35, ph, .95, .12, .2); g.children.forEach((c) => c.scale.set(1.15, 1, .7)); } for (const s of [-1, 1]) for (let j = 0; j < 3; j++) blob(.09, surf(1.6, s * 1.6, 1.15).add(new T.Vector3(s * .04 * (j % 2), -.2 - j * .22, -.06))); },
      12: () => { const c = capShell(1.7, -.4, 1.015); c.children[0].material = toon(shade(hc, .1)); },
      13: () => { capShell(1.7, -.45, 1.05); for (let i = 0; i < 7; i++) { const ph = ((i / 6) * 2 - 1) * .9; lock(.35, ph, .32, .075, 0, { dir: new T.Vector3(ph * .3, -.15, -1), rr: 1.0 }); } sides(.14); back(.2, .08); },
      14: () => { for (let i = 0; i < 26; i++) { const th = .15 + (i % 5) * .3, ph = i * 2.4; if (th > 1.1 && Math.cos(ph) > .3) continue; blob(.085, surf(th, ph, 1.1)); } },
      15: () => { capShell(); bangs(7, .22, .75); sides(.2); back(.2, .08); for (let j = 0; j < 7; j++) blob(.06 - j * .003, surf(1.4, 1.5, 1.1).add(new T.Vector3(.04, -.07 - j * .085, .08 + j * .012)), [1, 1.15, 1]); },
    }[kind] || (() => { capShell(); bangs(); }))();
  }

  /* 이펙트 */
  const glow = (c, op = 1) => { const k = `g${c}${op}`; if (!mats.has(k)) mats.set(k, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); return mats.get(k); };
  function auraParts(aura, kind) {
    if (!kind) return;
    const add = (m, u) => { m.userData = u; aura.add(m); return m; };
    if (kind < 8) {
      const conf = [null, ['#FF8A1A', 'flame'], ['#FFE45C', 'bolt'], ['#ffffff', 'spark'], ['#7fe0f0', 'ice'], ['#F27FA5', 'heart'], ['#3B1A6E', 'dark'], ['rainbow', 'spark']][kind];
      const cols = conf[0] === 'rainbow' ? ['#E8402C', '#F2B705', '#3FA34D', '#2F7DE1', '#9A4FB8'] : [conf[0]];
      for (let i = 0; i < 18; i++) {
        const c = cols[i % cols.length];
        const geo = conf[1] === 'flame' ? cone(.07, .22, 6) : conf[1] === 'heart' ? shapeGeo('ahrt', heartPts(.08), .02) : conf[1] === 'bolt' ? shapeGeo('abolt', [[-.04, .14], [.06, .02], [0, .02], [.05, -.14], [-.06, -.01], [0, -.01]], .02) : conf[1] === 'ice' ? cone(.05, .2, 4) : sph(.045, 8, 6);
        add(new T.Mesh(geo, flat(c, T.DoubleSide, conf[1] === 'dark' ? .7 : 1)), { m: 'orbit', a: (i / 18) * Math.PI * 2, y: (i % 6) * .5 + .1, r: .75 + (i % 3) * .12 });
      }
      if (conf[1] === 'dark' || conf[1] === 'flame') aura.add(at(new T.Mesh(cyl(.9, .9, .02, 30), flat(conf[1] === 'dark' ? '#3B1A6E' : '#FF8A1A', T.DoubleSide, .35)), 0, .02, 0));
      return;
    }
    const rnd = (i, s = 1) => { const x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); };
    ({
      8: () => { [['#2EF2FF', 0], ['#FF3DCB', 1], ['#FFE45C', 2]].forEach(([c, i]) => add(new T.Mesh(tor(.85 - i * .08, .018, Math.PI * 2, 6, 48), glow(c)), { m: 'ring', i, y: .5 + i * 1 })); add(at(new T.Mesh(cyl(.95, .95, .01, 40), glow('#2EF2FF', .25)), 0, .01, 0), {}); },
      9: () => { for (let i = 0; i < 34; i++) add(new T.Mesh(shapeGeo('petal', [[0, .05], [.03, 0], [0, -.04], [-.03, 0]]), flat(i % 3 ? '#FFB3CC' : '#fff', T.DoubleSide)), { m: 'fall', a: rnd(i) * 6.28, r: .45 + rnd(i, 2) * .7, y: rnd(i, 3) * 3.6, s: .4 + rnd(i, 4) * .5 }); },
      10: () => { for (const s of [-1, 1]) { const w = new T.Group(); for (let j = 0; j < 6; j++) w.add(at(new T.Mesh(shapeGeo(`fw${j}`, [[0, 0], [.18 + j * .05, .5 - j * .07], [.42 + j * .1, .55 - j * .12], [.3 + j * .06, .1 - j * .05]]), glow(j % 2 ? '#FF8A1A' : '#FFD23F', .85)), 0, 0, -j * .002)); w.scale.x = s; add(at(w, s * .1, 2.35, -.25), { m: 'wing', s }); } for (let i = 0; i < 16; i++) add(new T.Mesh(sph(.025, 6, 4), glow('#FFB13B')), { m: 'rise', a: rnd(i) * 6.28, r: .3 + rnd(i, 2) * .5, y: rnd(i, 3) * 3, s: .5 + rnd(i, 4) }); },
      11: () => { for (let i = 0; i < 10; i++) add(new T.Mesh(shapeGeo('bolt2', [[-.06, .25], [.08, .04], [0, .04], [.07, -.25], [-.08, -.02], [0, -.02]]), glow('#FFF27A')), { m: 'orbit', a: (i / 10) * 6.28, y: (i % 5) * .65 + .2, r: .9 + (i % 2) * .15, flash: true }); add(at(new T.Mesh(tor(.95, .03, Math.PI * 2, 6, 48), glow('#9BE7FF')), 0, .03, 0, Math.PI / 2), { m: 'pulse' }); },
      12: () => { const disc2 = add(at(new T.Mesh(disc(1.1), glow('#5a2cff', .35)), 0, .02, 0, -Math.PI / 2), { m: 'spin' }); for (let i = 0; i < 40; i++) { const r = .2 + (i / 40) * 1.0, a = i * .7; disc2.add(at(new T.Mesh(sph(.018 + rnd(i) * .02, 6, 4), glow(i % 3 ? '#fff' : '#B9A6FF')), Math.cos(a) * r, Math.sin(a) * r, .01)); } for (let i = 0; i < 14; i++) add(new T.Mesh(shapeGeo('str8', starPts(.05)), glow('#E6DCFF')), { m: 'orbit', a: (i / 14) * 6.28, y: .3 + (i % 7) * .45, r: .7 + (i % 3) * .15 }); },
      13: () => { add(at(new T.Mesh(cyl(.8, .95, 3.8, 30, true), glow('#FFC93B', .09)), 0, 1.9, 0), { m: 'pulse' }); add(at(new T.Mesh(disc(1), glow('#FFE27A', .35)), 0, .02, 0, -Math.PI / 2), {}); for (let i = 0; i < 24; i++) add(new T.Mesh(shapeGeo('str9', starPts(.035, 4)), glow('#FFF6C8')), { m: 'rise', a: rnd(i) * 6.28, r: .4 + rnd(i, 2) * .5, y: rnd(i, 3) * 3.4, s: .6 + rnd(i, 4) * .6 }); },
      14: () => { for (let i = 0; i < 26; i++) add(new T.Mesh(cone(.07 + rnd(i) * .05, .35, 6), glow(i % 2 ? '#7B2CFF' : '#2a0a4a', i % 2 ? .8 : .9)), { m: 'rise', a: rnd(i) * 6.28, r: .35 + rnd(i, 2) * .5, y: rnd(i, 3) * 2.6, s: .8 + rnd(i, 4) }); add(at(new T.Mesh(disc(1), flat('#1a0630', T.DoubleSide, .6)), 0, .015, 0, -Math.PI / 2), {}); },
      15: () => { for (let i = 0; i < 26; i++) add(new T.Mesh(box(.06 + rnd(i) * .12, .03 + rnd(i, 2) * .06, .01), glow(['#2EF2FF', '#FF3DCB', '#fff'][i % 3], .9)), { m: 'glitch', i, a: rnd(i) * 6.28, r: .5 + rnd(i, 2) * .6, y: rnd(i, 3) * 3.3 }); },
    }[kind] || (() => {}))();
  }
  /* ---------- 포즈와 동작 ---------- */
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => (p < .5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
  const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  // 각 포즈: 관절 이름 → [x, y, z] 회전, 그리고 엉덩이 높이(dy), 몸 숙임(lean), 회전(spin)
  // 서 있는 자세 12가지 (avatar.js의 AVATAR_NAMES.pose와 순서가 같습니다)
  // 팔 값: z가 +면 왼팔, -면 오른팔이 몸 바깥으로 들립니다. x가 -면 앞으로. gL/gR은 손가락 모양.
  const IDLE = [
    // 0 차렷
    (t) => ({ armL: [0, 0, .1], armR: [0, 0, -.1], head: [0, Math.sin(t * .8) * .06, 0] }),
    // 1 허리에 손
    (t) => ({ armL: [0, 0, .75], foreL: [0, 0, -1.7], armR: [0, 0, -.75], foreR: [0, 0, 1.7], legL: [0, 0, -.16], legR: [0, 0, .16], head: [-.08, 0, 0] }),
    // 2 팔짱
    (t) => ({ armL: [-.25, -1.5, .28], foreL: [-1.7, 0, 0], armR: [-.38, 1.5, -.28], foreR: [-1.78, 0, 0], head: [-.14, 0, Math.sin(t) * .03], legL: [0, 0, -.1], legR: [0, 0, .1] }),
    // 3 브이
    (t) => ({ armL: [0, 0, .1], armR: [0, 0, -.7], foreR: [0, 0, -2.3], handR: [0, 0, Math.sin(t * 3) * .12], gR: 'v', head: [0, 0, -.18], torso: [0, 0, -.05] }),
    // 4 손 흔들기
    (t) => ({ armL: [0, 0, .1], armR: [0, 0, -2.5], foreR: [0, 0, Math.sin(t * 8) * .55], head: [0, 0, -.1] }),
    // 5 근육 자랑
    (t) => ({ armL: [0, 0, 1.5], foreL: [0, 0, 1.75 + Math.sin(t * 4) * .12], armR: [0, 0, -1.5], foreR: [0, 0, -1.75 - Math.sin(t * 4) * .12], legL: [0, 0, -.18], legR: [0, 0, .18], dy: -.04 }),
    // 6 엄지척
    (t) => ({ armL: [0, 0, .1], armR: [-1.0, 0, -.2], foreR: [-.5 - Math.sin(t * 3) * .1, 0, 0], gR: 'thumb', head: [0, 0, -.1] }),
    // 7 손가락질
    (t) => ({ armL: [0, 0, .75], foreL: [0, 0, -1.7], armR: [-1.15, 0, -.75], gR: 'point', torso: [.05, -.2, 0], head: [0, -.25, 0], legR: [-.2, 0, 0] }),
    // 8 파이팅 자세
    (t) => ({ armL: [-.6, 0, .15], foreL: [-2.3, 0, 0], armR: [-1.0, 0, -.15], foreR: [-1.8, 0, 0], legL: [-.35, 0, -.1], legR: [.3, 0, .1], torso: [.1, .35, 0], dy: -.05 + Math.abs(Math.sin(t * 5)) * .04 }),
    // 9 손하트
    (t) => ({ armL: [-.55, 0, .2], foreL: [-1.55, 0, -1.75], armR: [-.5, 0, -.2], foreR: [-1.45, 0, 1.75], heart: true, head: [0, 0, .12], dy: Math.sin(t * 3) * .015 }),
    // 10 뒷짐
    (t) => ({ armL: [.45, 0, .15], foreL: [.2, 0, -1.2], armR: [.45, 0, -.15], foreR: [.2, 0, 1.2], head: [-.12, Math.sin(t * .7) * .15, 0], torso: [-.05, 0, 0] }),
    // 11 만세 점프
    (t) => ({ armL: [0, 0, 2.6], foreL: [0, 0, .2], armR: [0, 0, -2.6], foreR: [0, 0, -.2], dy: Math.max(0, Math.sin(t * 5)) * .22, legL: [-.25 * Math.max(0, Math.sin(t * 5)), 0, 0], legR: [.2 * Math.max(0, Math.sin(t * 5)), 0, 0] }),
    // ---- 유료 포즈 ----
    // 12 모자 챙 잡기
    (t) => ({ armR: [-.3, 0, -1.5], foreR: [0, 0, -2.3], armL: [.1, 0, .12], foreL: [-.35, 0, -.2], head: [-.12, .15, -.06], legR: [0, 0, .12], legL: [0, 0, -.04], torso: [0, .08, 0] }),
    // 13 주머니에 손
    (t) => ({ armL: [.2, 0, .16], foreL: [-.55, 0, -.45], armR: [.2, 0, -.16], foreR: [-.55, 0, .45], legL: [0, 0, -.12], legR: [-.06, 0, .05], shinR: [.15, 0, 0], head: [-.05, Math.sin(t * .7) * .12, 0], torso: [-.03, -.1, 0] }),
    // 14 공 던지기
    (t) => ({ armL: [-1.5, 0, .5], foreL: [-1.0, 0, 0], armR: [.05, 0, -.15], foreR: [-.2, 0, 0], ball: Math.abs(Math.sin(t * 2.6)) * .45 + .01, head: [-.32, -.15, 0], legR: [-.08, 0, .1], shinR: [.18, 0, 0] }),
    // 15 하늘 찌르기
    (t) => ({ armR: [0, 0, -2.95], foreR: [0, 0, 0], gR: 'point', armL: [0, 0, .75], foreL: [0, 0, -1.7], head: [-.3, 0, 0], legL: [0, 0, -.14], legR: [0, 0, .14], dy: Math.sin(t * 2) * .01 }),
    // 16 돌아보기
    (t) => ({ turn: Math.PI * .95, head: [0, -1.15, 0], torso: [0, -.5, 0], armL: [.15, 0, .1], armR: [-.1, 0, -.12], foreR: [-.3, 0, 0], legL: [0, 0, -.06], legR: [0, 0, .06] }),
    // 17 영웅 착지
    (t) => ({ dy: -.74, torso: [.2, 0, 0], head: [-.2, 0, 0], legL: [-1.5, 0, -.15], shinL: [1.5, 0, 0], legR: [.25, 0, .1], shinR: [1.45, 0, 0], armR: [-.9, 0, -.3], foreR: [-.3, 0, 0], armL: [.7, 0, .6], foreL: [0, 0, 0], gR: 'point' }),
    // 18 그루브 댄스
    (t) => { const b = Math.sin(t * 6), c = Math.cos(t * 3); return { torso: [0, c * .25, b * .08], head: [0, -c * .2, -b * .12], armL: [-.4 - b * .4, 0, .6 + c * .5], foreL: [-1.2, 0, 0], armR: [-.4 + b * .4, 0, -.6 + c * .5], foreR: [-1.2, 0, 0], legL: [-Math.max(0, b) * .4, 0, -.1], shinL: [Math.max(0, b) * .7, 0, 0], legR: [-Math.max(0, -b) * .4, 0, .1], shinR: [Math.max(0, -b) * .7, 0, 0], dy: -Math.abs(b) * .05 }; },
    // 19 챔피언 (트로피 들기)
    (t) => ({ armR: [-.2, 0, -2.75], foreR: [0, 0, -.1], trophy: true, armL: [0, 0, .75], foreL: [0, 0, -1.7], head: [-.22, 0, .05], legL: [0, 0, -.14], legR: [0, 0, .14], dy: Math.max(0, Math.sin(t * 3)) * .03 }),
  ];
  // 오른손에 물건을 들면 손가락 포즈는 왼손으로 바꿉니다.
  const mirror = (p) => {
    const o = {};
    for (const [k, v] of Object.entries(p)) {
      const m = k.endsWith('L') ? k.slice(0, -1) + 'R' : k.endsWith('R') ? k.slice(0, -1) + 'L' : k;
      o[m] = Array.isArray(v) ? [v[0], -v[1], -v[2]] : v;
    }
    return o;
  };
  const idle = (a, t) => { const p = (IDLE[a.pose || 0] || IDLE[0])(t); return a.hand && p.gR ? mirror(p) : p; };
  const ACTIONS = {
    command: { dur: 1, pose: (p) => ({ armR: [-1.55, 0, -.15], foreR: [0, 0, 0], torso: [.18, -.3, 0], lean: .1 }) },
    cheer: { dur: 1.6, pose: (p) => ({ armL: [0, 0, 2.6], armR: [0, 0, -2.6], dy: Math.abs(Math.sin(p * Math.PI * 3)) * .35 }) },
    flinch: { dur: .6, pose: (p) => ({ torso: [-.35, 0, 0], armL: [-.8, 0, .4], armR: [-.8, 0, -.4], foreL: [0, 0, -1.2], foreR: [0, 0, 1.2], dy: -.05 }) },
    sad: { dur: 2, pose: (p) => ({ head: [.5, 0, 0], torso: [.3, 0, 0], armL: [0, 0, .05], armR: [0, 0, -.05], dy: -.08 }) },
    mega: { dur: 1.4, pose: (p) => ({ armR: [-.5, 0, -2.75], foreR: [0, 0, 0], armL: [-.5, 0, .5], foreL: [0, 0, -1.6], dy: p < .5 ? -.12 : .1 }) },
    thrust: { dur: 1, pose: (p) => ({ armL: [-1.55, 0, .1], armR: [-1.55, 0, -.1], torso: [.25, 0, 0], legL: [-.4, 0, 0], legR: [.3, 0, 0] }) },
  };
  // Z기술 안무: 모든 타입 공통 4단계 중 3단계가 타입마다 다릅니다.
  const Z_POSE = {
    fire: { armR: [-.5, 0, -2.8], foreR: [0, 0, 0], armL: [0, 0, .6], foreL: [0, 0, -1.7] },
    water: (t) => ({ armL: [0, 0, 1.6 + Math.sin(t * 9) * .5], armR: [0, 0, -1.6 - Math.sin(t * 9 + 1) * .5] }),
    grass: { armL: [0, 0, 2.3], armR: [0, 0, -2.3], head: [-.3, 0, 0] },
    elec: { armR: [-.3, 0, -2.8], armL: [0, 0, 1.3], legR: [-.5, 0, 0] },
    ice: { armL: [-1.3, .6, 0], armR: [-1.3, -.6, 0], foreL: [0, 0, -.8], foreR: [0, 0, .8] },
    earth: (t) => ({ armL: [0, 0, .9], armR: [0, 0, -.9], foreL: [0, 0, 1.5], foreR: [0, 0, -1.5], legR: [-1.2 * Math.abs(Math.sin(t * 6)), 0, 0], dy: -.08 }),
    wind: (t) => ({ armL: [t * 20, 0, 1.4], armR: [-t * 20, 0, -1.4] }),
    poison: { armL: [-1.4, 0, .3], armR: [-1.4, 0, -.3], foreL: [-.6, 0, 0], foreR: [-.6, 0, 0], lean: .2 },
    steel: { armL: [0, 0, 1.45], foreL: [0, 0, 1.8], armR: [0, 0, -1.45], foreR: [0, 0, -1.8] },
    spirit: { armL: [-1.2, 0, .1], armR: [-1.2, 0, -.1], foreL: [0, 0, -1.2], foreR: [0, 0, 1.2], head: [.25, 0, 0] },
    fairy: { armR: [-.3, 0, -2.5], foreR: [0, 0, -.6], armL: [0, 0, .8], legL: [-.9, 0, .2], head: [0, 0, .25] },
    none: { armR: [-1.2, 0, -.3], foreR: [0, 0, -1.4] },
  };
  function zPose(type, p, t) {
    if (p < .25) { const k = Math.sin(t * 50) * .03; return { armL: [.3, 0, .3], foreL: [-2, 0, 0], armR: [.3, 0, -.3], foreR: [-2, 0, 0], dy: -.18, torso: [.25 + k, 0, 0] }; }
    if (p < .45) return { armL: [0, 0, 1.2], armR: [0, 0, -1.2], spin: ease(seg(p, .25, .45)) * Math.PI * 2, dy: Math.sin(seg(p, .25, .45) * Math.PI) * .4 };
    if (p < .72) { const z = Z_POSE[type] || Z_POSE.none; return typeof z === 'function' ? z(t) : z; }
    return { armL: [-1.55, 0, .1], armR: [-1.55, 0, -.1], torso: [.3, 0, 0], legL: [-.5, 0, 0], legR: [.3, 0, 0], lean: .15, dz: ease(seg(p, .72, .85)) * .4 };
  }
  ACTIONS.z = { dur: 2.6, pose: null };

  const JOINTS = ['torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'handL', 'handR', 'legL', 'legR', 'shinL', 'shinR'];
  const FLIP = new Set(['armL', 'armR', 'foreL', 'foreR', 'handL', 'handR']);
  function applyPose(J, pose, w = 1) {
    if (w >= .5) for (const [h, k] of [['handL', 'gL'], ['handR', 'gR']]) {
      const g = J[h].userData.gest;
      if (g) for (const [n, o] of Object.entries(g)) o.visible = pose[k] === n;
    }
    if (w >= .5 && J.heartProp) J.heartProp.visible = !!pose.heart;
    if (w >= .5) {
      if (J.ball) { J.ball.visible = !!pose.ball; if (pose.ball) J.ball.position.set(0, -.1 - pose.ball, .02); }
      if (J.trophy) { J.trophy.visible = !!pose.trophy; if (J.item) J.item.visible = !pose.trophy; }
    }
    for (const j of JOINTS) {
      const r = pose[j] || [0, 0, 0];
      if (!J[j]) continue;
      const o = J[j].rotation;
      // 팔은 포즈 값 z가 +면 왼팔이 바깥(몸 옆)으로 들리도록 뒤집어 씁니다.
      const fz = FLIP.has(j) ? -r[2] : r[2], fy = FLIP.has(j) ? -r[1] : r[1];
      o.x = lerp(o.x, r[0], w); o.y = lerp(o.y, fy, w); o.z = lerp(o.z, fz, w);
    }
  }

  /* ---------- 화면에 붙이기 ---------- */
  const views = new Set();
  let raf = 0;
  function makeScene() {
    const scene = new T.Scene();
    scene.add(new T.HemisphereLight('#ffffff', '#6a5a8a', 1.6));
    const d = new T.DirectionalLight('#ffffff', 1.8);
    d.position.set(2, 4, 3);
    scene.add(d);
    return scene;
  }
  const frameCam = (w, h, mode) => {
    const cam = new T.PerspectiveCamera(26, w / h, .1, 50);
    if (mode === 'bust') { cam.position.set(0, 2.85, 4.0); cam.lookAt(0, 2.6, 0); }
    else { cam.position.set(0, 2.0, 7.4); cam.lookAt(0, 1.66, 0); }
    return cam;
  };
  function renderTo(ctx, scene, cam, w, h) {
    renderer.setViewport(0, 0, w, h);
    renderer.setScissor(0, 0, w, h);
    renderer.setScissorTest(true);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, cam);
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(renderer.domElement, 0, RH - h, w, h, 0, 0, w, h);
  }

  // 정지 이미지 (카드, 목록용). 같은 꾸미기는 다시 그리지 않습니다.
  const snaps = new Map();
  const snapScene = makeScene();
  const snapCanvas = document.createElement('canvas');
  function snapshot(a, w = 200, h = 250, mode = 'bust') {
    const key = JSON.stringify(a) + w + mode;
    if (snaps.has(key)) return snaps.get(key);
    const J = build(a);
    J.root.rotation.y = (mode === 'bust' ? .25 : .38) + (idle(a, 0).turn || 0);
    applyPose(J, idle(a, 0));
    J.root.position.y = idle(a, 0).dy || 0;
    animateAura(J, 1.3);
    snapScene.add(J.root);
    snapCanvas.width = w; snapCanvas.height = h;
    renderTo(snapCanvas.getContext('2d'), snapScene, frameCam(w, h, mode), w, h);
    snapScene.remove(J.root);
    const url = snapCanvas.toDataURL('image/png');
    if (snaps.size > 400) snaps.delete(snaps.keys().next().value);
    snaps.set(key, url);
    return url;
  }

  function animateAura(J, t) {
    J.aura.children.forEach((m) => {
      const u = m.userData;
      if (u.m === 'orbit') {
        const a = u.a + t * 1.6;
        m.position.set(Math.cos(a) * u.r, ((u.y + t * .8) % 3.2) + .1, Math.sin(a) * u.r);
        m.rotation.y = -a;
        if (u.flash) m.visible = Math.sin(t * 13 + u.a * 7) > -.3;
      } else if (u.m === 'ring') {
        m.position.y = u.y + Math.sin(t * 1.5 + u.i) * .25;
        m.rotation.set(Math.PI / 2 + Math.sin(t + u.i * 2) * .35, 0, Math.cos(t * .8 + u.i) * .3);
      } else if (u.m === 'fall') {
        const y = 3.6 - ((t * .35 * u.s + 3.6 - u.y) % 3.6);
        const a = u.a + t * .6;
        m.position.set(Math.cos(a) * u.r + Math.sin(t * 2 + u.a) * .1, y, Math.sin(a) * u.r);
        m.rotation.set(t * 2 + u.a, t * 1.3, u.a);
      } else if (u.m === 'rise') {
        const y = (u.y + t * .55 * u.s) % 3.2;
        m.position.set(Math.cos(u.a + t * .3) * u.r, y, Math.sin(u.a + t * .3) * u.r);
        const k = Math.max(.15, 1 - y / 3.2); m.scale.setScalar(k);
      } else if (u.m === 'wing') {
        m.rotation.y = u.s * (-.35 + Math.sin(t * 3.2) * .25);
      } else if (u.m === 'pulse') {
        const k = 1 + Math.sin(t * 4) * .05; m.scale.set(k, 1, k);
      } else if (u.m === 'spin') {
        m.rotation.z = t * .5;
      } else if (u.m === 'glitch') {
        const f = Math.floor(t * 8 + u.i), r = (n) => { const x = Math.sin(n * 91.7 + u.i * 13.1) * 9137.1; return x - Math.floor(x); };
        const a = u.a + r(f) * .8;
        m.position.set(Math.cos(a) * u.r, (u.y + r(f + 3) * .4) % 3.3, Math.sin(a) * u.r);
        m.visible = r(f + 7) > .25;
        m.rotation.y = -a;
      }
    });
  }

  // 실시간 화면. facing: 오른쪽을 보면 양수, 왼쪽을 보면 음수
  function mount(canvas, a, { facing = .38, drag = false, scale = 1 } = {}) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const scene = makeScene();
    const J = build(a);
    scene.add(J.root);
    const v = { canvas, J, scene, a, facing, extraRot: 0, action: null, t0: performance.now(), dead: false, scale };
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const w = Math.min(RW, Math.max(40, Math.round(r.width * dpr))), h = Math.min(RH, Math.max(50, Math.round(r.height * dpr)));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; v.cam = frameCam(w, h); }
      if (!v.cam) v.cam = frameCam(w, h);
    };
    size();
    v.size = size;
    if (drag) {
      let x0 = null;
      canvas.addEventListener('pointerdown', (e) => { x0 = e.clientX; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointermove', (e) => { if (x0 === null) return; v.extraRot += (e.clientX - x0) * .015; x0 = e.clientX; });
      canvas.addEventListener('pointerup', () => { x0 = null; });
      canvas.style.touchAction = 'none';
    }
    views.add(v);
    if (!raf) raf = requestAnimationFrame(loop);
    return {
      play(name, opts = {}) { v.action = { name, t0: performance.now(), type: opts.type, dur: (opts.dur || ACTIONS[name]?.dur || 1) * 1000, hold: opts.hold }; },
      update(next) { scene.remove(v.J.root); v.a = next; v.J = build(next); scene.add(v.J.root); },
      destroy() { v.dead = true; views.delete(v); },
      el: canvas,
    };
  }

  function loop(now) {
    raf = 0;
    for (const v of [...views]) {
      if (v.dead || !document.body.contains(v.canvas)) { views.delete(v); continue; }
      v.size();
      const t = (now - v.t0) / 1000;
      const J = v.J;
      let pose = idle(v.a, t), w = 1;
      // 숨쉬기
      J.hips.position.y = (J.hips.userData.y ??= J.hips.position.y) + Math.sin(t * 2.4) * .015;
      J.root.position.set(0, pose.dy || 0, 0);
      let spin = 0, lean = 0, dz = 0;
      if (v.action) {
        const ac = v.action, p = (now - ac.t0) / ac.dur;
        if (p >= 1 && !ac.hold) v.action = null;
        else {
          const q = Math.min(1, p);
          const target = ac.name === 'z' ? zPose(ac.type, q, t) : ACTIONS[ac.name].pose(q);
          w = ac.name === 'z' ? 1 : Math.min(1, q * 6, (1 - q) * 4 + (ac.hold ? 1 : 0));
          applyPose(J, pose, 1);
          pose = target;
          J.root.position.y = (target.dy || 0) * w;
          spin = target.spin || 0; lean = target.lean || 0; dz = target.dz || 0;
        }
      }
      applyPose(J, pose, w);
      J.root.rotation.y = v.facing + v.extraRot + spin + (v.action ? 0 : (pose.turn || 0));
      J.root.rotation.x = lean * w;
      J.root.position.z = dz;
      animateAura(J, t);
      renderTo(v.canvas.getContext('2d'), v.scene, v.cam, v.canvas.width, v.canvas.height);
    }
    if (views.size) raf = requestAnimationFrame(loop);
  }

  // 개발 확인용: 임의 포즈로 한 장 그리기
  function poseShot(a, pose, rotY = .38, w = 200, h = 250) {
    const J = build(a);
    J.root.rotation.y = rotY;
    applyPose(J, pose);
    J.root.position.y = pose.dy || 0;
    snapScene.add(J.root);
    snapCanvas.width = w; snapCanvas.height = h;
    renderTo(snapCanvas.getContext('2d'), snapScene, frameCam(w, h), w, h);
    snapScene.remove(J.root);
    return snapCanvas.toDataURL('image/png');
  }

  return { snapshot, mount, poseShot, build };
})();
