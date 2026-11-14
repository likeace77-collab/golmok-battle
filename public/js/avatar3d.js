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
  const at = (obj, x, y, z, rx = 0, ry = 0, rz = 0) => { obj.position.set(x, y, z); obj.rotation.set(rx, ry, rz); return obj; };

  /* ---------- 캐릭터 만들기 ---------- */
  function build(a) {
    const v = (k) => a[k] || 0;
    const skin = SKIN[v('skin')], hc = HAIR_C[v('hairColor')], cc = CLOTH_C[v('outfitColor')];
    const pc = PANTS_C[v('pantsColor')], sc = SHOE_C[v('shoeColor')];
    const body = v('body'), outfit = v('outfit');
    const kid = body === 3;
    const W = [1, .86, 1.22, .92][body];
    const root = new T.Group(), hips = new T.Group(), torso = new T.Group(), head = new T.Group();
    const J = { root, hips, torso, head };
    root.add(hips);
    const legLen = kid ? .32 : .48;
    hips.position.y = legLen + .42;
    hips.add(torso);

    // 다리와 신발
    for (const s of [-1, 1]) {
      const leg = new T.Group();
      at(leg, s * .19 * W, 0, 0);
      leg.add(at(part(cap(.14 * W, legLen), pc), 0, -legLen / 2 - .14, 0));
      const shoe = new T.Group();
      at(shoe, 0, -legLen - .3, .05);
      const shoes = [
        () => { shoe.add(at(part(box(.26, .16, .38), sc), 0, 0, .02)); shoe.add(at(part(box(.27, .05, .4), '#fff', { line: .02 }), 0, -.08, .02)); },
        () => { shoe.add(at(part(cyl(.15, .16, .34), sc), 0, .1, 0)); shoe.add(at(part(box(.26, .12, .36), sc), 0, -.04, .05)); },
        () => { shoe.add(at(part(box(.26, .06, .38), sc), 0, -.06, .03)); shoe.add(at(part(box(.22, .04, .12), '#fff', { line: .015 }), 0, -.01, .08)); },
        () => { shoe.add(at(part(box(.24, .13, .4), '#1a1433', { mat: new T.MeshPhongMaterial({ color: INK, shininess: 90 }) }), 0, 0, .04)); },
        () => { shoe.add(at(part(cyl(.15, .15, .24), sc), 0, .06, 0)); shoe.add(at(part(box(.27, .14, .38), sc), 0, -.02, .04)); shoe.add(at(part(box(.28, .05, .4), '#fff', { line: .015 }), 0, -.08, .04)); },
        () => { shoe.add(at(part(cyl(.16, .17, .44), sc), 0, .14, 0)); shoe.add(at(part(box(.27, .1, .38), sc), 0, -.06, .05)); },
        () => { shoe.add(at(part(box(.25, .16, .38), sc), 0, 0, .02)); for (const z of [-.12, .14]) shoe.add(at(part(cyl(.06, .06, .3, 12), '#E8402C'), 0, -.13, z, 0, 0, Math.PI / 2)); },
        () => { shoe.add(at(part(box(.24, .04, .38), sc), 0, -.07, .03)); shoe.add(at(part(box(.04, .06, .16), '#fff', { line: .01 }), 0, -.03, .08)); },
      ];
      (shoes[v('shoes')] || shoes[0])();
      leg.add(shoe);
      hips.add(leg);
      J[s < 0 ? 'legL' : 'legR'] = leg;
    }

    // 몸통
    const armColor = outfit === 10 ? skin : cc;
    const torsoColor = { 2: '#2B2B38', 4: '#fff', 5: '#2a2a33', 7: '#8a8f98', 8: '#fff', 11: '#3B2F8C' }[outfit] || cc;
    const chest = part(cap(.34, .38), torsoColor);
    chest.scale.set(W, 1, .82);
    torso.add(at(chest, 0, .42, 0));
    const tAdd = (o) => torso.add(o);
    const front = (geo, color, y, z = .3, opts) => tAdd(at(part(geo, color, opts), 0, y, z));
    ({
      0: () => front(tor(.12, .025, Math.PI), cc, .76, .2),
      1: () => { tAdd(at(part(tor(.24, .09), cc), 0, .82, -.12, Math.PI / 2.6)); front(box(.36, .16, .04), '#2a2440', .3, .3, { line: .01 }); },
      2: () => { front(shapeGeo('v', [[-.14, .2], [.14, .2], [0, -.12]], .02), '#fff', .66, .3, { line: .01 }); front(box(.07, .3, .03), cc, .55, .31, { line: .012 }); },
      3: () => { front(box(.03, .6, .03), '#1a1433', .42, .3, { line: 0 }); },
      4: () => { front(box(.42 * W, .36, .06), cc, .3, .27); },
      5: () => { front(box(.2, .5, .03), cc, .45, .29, { line: .01 }); },
      6: () => { tAdd(at(part(box(.1, .55, .04), '#fff'), .06, .5, .28, 0, 0, .6)); front(box(.06, .3, .03), '#E8402C', .4, .32, { line: .01 }); },
      7: () => { for (const s of [-1, 1]) tAdd(at(part(sph(.2), cc), s * .42 * W, .72, 0)); front(sph(.1), '#FFD23F', .5, .27); },
      8: () => { for (let i = 0; i < 6; i++) tAdd(at(part(sph(.03), INK, { line: 0 }), (i % 2 ? .08 : -.08), .65 - Math.floor(i / 2) * .14, .3)); front(tor(.13, .05), cc, .78, .14); },
      9: () => { for (let i = 0; i < 9; i++) tAdd(at(part(sph(.05), i % 2 ? '#fff' : '#FFD23F', { line: .01 }), Math.cos(i * 2.3) * .26 * W, .2 + (i % 5) * .13, .27)); },
      10: () => {},
      11: () => { tAdd(at(part(cyl(.3 * W, .55 * W, .7, 20), '#3B2F8C'), 0, -.05, 0)); front(tor(.16, .05), cc, .8, .12); },
      12: () => { for (let i = 0; i < 4; i++) { const r = tor(.35, .025, Math.PI * 2, 6, 30); tAdd(at(part(r, '#fff', { line: 0 }), 0, .2 + i * .16, 0, Math.PI / 2)).scale.set(W, .82, 1); } },
      13: () => { for (const s of [-1, 1]) tAdd(at(part(box(.05, .6, .04), '#fff', { line: 0 }), s * .25 * W, .42, .25)); front(shapeGeo('n7', [[-.08, .1], [.1, .1], [.02, -.12], [-.03, -.12], [.03, .05], [-.08, .05]], .02), '#fff', .45, .3, { line: .01 }); },
    }[outfit] || (() => {}))();
    // 목 장식
    ({
      1: () => tAdd(at(part(tor(.2, .07), '#E8402C'), 0, .86, .02, Math.PI / 2)),
      2: () => { tAdd(at(part(tor(.21, .02, Math.PI * 2, 6, 30), '#FFD23F', { line: .01 }), 0, .74, .08, 1.2)); front(sph(.06), '#FFD23F', .55, .3); },
      3: () => { for (const s of [-1, 1]) front(cone(.07, .14, 4), '#E8402C', .82, .3).rotation.set(0, 0, s * Math.PI / 2); },
      4: () => { front(shapeGeo('ban', [[-.2, .06], [.2, .06], [0, -.2]], .03), '#2F7DE1', .78, .26); },
      5: () => { tAdd(at(part(tor(.2, .03), '#2F7DE1', { line: .01 }), 0, .74, .1, 1.1)); front(cyl(.08, .08, .02), '#FFD23F', .52, .31).rotation.x = Math.PI / 2; },
    }[v('neck')] || (() => {}))();

    // 팔
    for (const s of [-1, 1]) {
      const sh = new T.Group();
      at(sh, s * .43 * W, .74, 0);
      sh.add(at(part(cap(.11 * W, .26), armColor), 0, -.2, 0));
      const fore = new T.Group();
      at(fore, 0, -.42, 0);
      fore.add(at(part(cap(.1 * W, .2), outfit === 10 || outfit === 2 ? (outfit === 2 ? '#2B2B38' : skin) : armColor), 0, -.14, 0));
      const hand = new T.Group();
      at(hand, 0, -.34, 0);
      const gl = v('gloves');
      const handColor = ['', '#fff', '#E8402C', '#5a3a22', '#E8402C', '#8a8f98'][gl] || skin;
      hand.add(part(gl === 2 ? sph(.19) : gl === 5 ? box(.24, .24, .24) : gl === 4 ? sph(.15) : sph(.13), handColor));
      // 손가락 제스처: 브이, 검지, 엄지. 포즈의 gL/gR 값으로 하나만 보입니다.
      const hr = gl === 2 ? .19 : gl === 5 ? .13 : gl === 4 ? .15 : .13, fr = hr * .3, fl = hr * 1.05;
      const finger = (x, rz, len = fl, rx = 0) => { const f = at(new T.Group(), x, -hr * .7, 0, rx, 0, rz); f.add(at(part(cap(fr, len), handColor, { line: .02 }), 0, -len / 2 - fr, 0)); return f; };
      const gest = {};
      gest.v = new T.Group(); gest.v.add(finger(-hr * .35, -.28), finger(hr * .35, .28));
      gest.point = new T.Group(); gest.point.add(finger(0, 0, fl * 1.1));
      gest.thumb = new T.Group(); { const f = finger(0, 0, fl * .85, -Math.PI / 2); f.position.set(0, -hr * .15, hr * .55); gest.thumb.add(f); }
      for (const g of Object.values(gest)) { g.visible = false; hand.add(g); }
      hand.userData.gest = gest;
      fore.add(hand);
      sh.add(fore);
      torso.add(sh);
      J[s < 0 ? 'armL' : 'armR'] = sh; J[s < 0 ? 'foreL' : 'foreR'] = fore; J[s < 0 ? 'handL' : 'handR'] = hand;
    }
    // 손하트 포즈용 하트
    { const hp = at(part(shapeGeo('hp', heartPts(.2), .08), '#FF5C8A', { line: .02 }), 0, .62, .62);
      hp.visible = false; torso.add(hp); J.heartProp = hp; }
    // 손에 든 것 (오른손)
    const hand = J.handR, H = (o) => hand.add(o);
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
    }[v('hand')] || (() => {}))();

    // 등
    const back = new T.Group();
    torso.add(at(back, 0, .5, -.32));
    const B = (o) => back.add(o);
    const wing = (c, key, pts) => { for (const s of [-1, 1]) { const w = part(shapeGeo(key, pts, .04), c); w.scale.x = s; B(at(w, s * .42, .15, -.05, 0, s * -.4)); } };
    ({
      1: () => { const c = part(G('cape', () => { const g = new T.PlaneGeometry(.95 * W, 1.25, 4, 4); g.translate(0, -.5, 0); return g; }), '#B31220', { mat: toon('#B31220') }); c.children[0].material = new T.MeshToonMaterial({ color: '#B31220', gradientMap: grad, side: T.DoubleSide }); c.children.pop(); B(at(c, 0, .35, -.04, .12)); },
      2: () => wing('#ffffff', 'aw', [[0, 0], [.2, .35], [.55, .42], [.75, .2], [.6, .05], [.68, -.12], [.45, -.2], [.4, -.35], [.15, -.2]]),
      3: () => wing('#5a1020', 'dw', [[0, 0], [.25, .4], [.75, .45], [.6, .2], [.7, .02], [.48, .05], [.52, -.16], [.3, -.08], [.15, -.25]]),
      4: () => { B(at(part(box(.5 * W, .55, .22), cc), 0, -.05, -.06)); B(at(part(box(.4 * W, .2, .08), '#fff', { line: .01 }), 0, -.14, -.19)); },
      5: () => { for (const s of [-1, 1]) { B(at(part(cyl(.12, .12, .55), '#AEB7C2'), s * .14, -.02, -.1)); B(at(part(cone(.1, .3), '#FF8A1A', { mat: flat('#FF8A1A') }), s * .14, -.45, -.1, Math.PI)); } },
      6: () => { B(at(part(box(.07, 1.1, .03), '#D7DDE5'), .05, .2, -.05, 0, 0, .7)); B(at(part(box(.24, .05, .06), '#E7B23A'), -.22, -.12, -.05, 0, 0, .7)); },
      7: () => wing('#F27FA5', 'bw', [[0, 0], [.3, .5], [.7, .55], [.65, .2], [.4, 0], [.6, -.2], [.45, -.45], [.15, -.3]]),
      8: () => { B(at(part(sph(.3), '#C9924F'), .05, -.2, -.1)).scale.set(1, 1.2, .4); B(at(part(box(.08, .9, .06), '#5a3a22'), -.1, .35, -.1, 0, 0, .25)); },
      9: () => { B(at(part(cyl(.02, .02, 1.3), '#8B5A2B'), 0, .3, -.05)); B(at(part(box(.4, .55, .02), '#FFD23F'), .2, .7, -.05)); },
    }[v('back')] || (() => {}))();

    // 머리
    torso.add(at(head, 0, 1.1, 0));
    const R = kid ? .76 : .68;
    head.add(at(part(sph(R, 28, 20), skin), 0, R * .75, 0));
    const HC = R * .75;
    for (const s of [-1, 1]) head.add(at(part(sph(.1), skin), s * R * .98, HC - .02, 0)).scale.set(.6, 1, .8);
    const onFace = (obj, x, y) => {
      const z = Math.sqrt(Math.max(0, R * R - x * x - y * y)) + .006;
      obj.position.set(x, HC + y, z);
      obj.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(x, y, z).normalize());
      head.add(obj);
      return obj;
    };
    const M = (geo, c, o = {}) => { const m = new T.Mesh(geo, flat(c, T.DoubleSide, o.op || 1)); if (o.s) m.scale.set(...o.s); if (o.r) m.rotation.z = o.r; const g = new T.Group(); g.add(m); return g; };
    const ex = .22 * R / .62, ey = -.02;
    const eyeKinds = [
      (x) => onFace(M(disc(.07), INK), x, ey),
      (x) => onFace(M(tor(.07, .02, Math.PI), INK), x, ey - .03),
      (x) => { onFace(M(disc(.12), '#fff'), x, ey); onFace(M(disc(.065), INK), x, ey - .01); onFace(M(disc(.025), '#fff'), x - .03, ey + .03); },
      (x) => { onFace(M(disc(.06), INK), x, ey - .02); onFace(M(box(.16, .03, .001), INK, { r: x < 0 ? -.4 : .4 }), x, ey + .1); },
      (x) => onFace(M(box(.15, .03, .001), INK), x, ey),
      (x) => { onFace(M(disc(.08), INK, { s: [.85, 1.25, 1] }), x, ey); onFace(M(disc(.03), '#fff'), x - .025, ey + .04); onFace(M(disc(.015), '#fff'), x + .025, ey - .04); },
      (x) => onFace(M(shapeGeo('hrt', heartPts(.11)), '#E8402C'), x, ey),
      (x) => { onFace(M(disc(.075, Math.PI, Math.PI), INK), x, ey + .01); },
      (x) => (x < 0 ? onFace(M(tor(.07, .02, Math.PI), INK, { r: Math.PI }), x, ey + .03) : onFace(M(disc(.07), INK), x, ey)),
      (x) => onFace(M(shapeGeo('str', starPts(.1)), '#FFE45C'), x, ey),
      (x) => { onFace(M(box(.15, .03, .001), INK, { r: .78 }), x, ey); onFace(M(box(.15, .03, .001), INK, { r: -.78 }), x, ey); },
      (x) => { onFace(M(disc(.09), '#6CF2C2'), x, ey); onFace(M(disc(.03), '#fff'), x - .02, ey + .03); },
    ];
    for (const x of [-ex, ex]) (eyeKinds[v('eyes')] || eyeKinds[0])(x);
    const browY = .15;
    ({
      1: () => [-ex, ex].forEach((x) => onFace(M(tor(.07, .012, Math.PI), INK), x, browY)),
      2: () => [-ex, ex].forEach((x) => onFace(M(box(.15, .045, .001), hc), x, browY)),
      3: () => [-ex, ex].forEach((x) => onFace(M(box(.16, .035, .001), INK, { r: x < 0 ? -.35 : .35 }), x, browY - .01)),
      4: () => [-ex, ex].forEach((x) => onFace(M(box(.15, .03, .001), INK, { r: x < 0 ? .3 : -.3 }), x, browY)),
      5: () => onFace(M(box(.42, .05, .001), INK), 0, browY),
    }[v('brow')] || (() => {}))();
    const my = -.25;
    const mouthKinds = [
      () => onFace(M(tor(.08, .016, Math.PI), INK, { r: Math.PI }), 0, my + .04),
      () => onFace(M(disc(.09, Math.PI, Math.PI), '#fff'), 0, my + .02),
      () => onFace(M(box(.12, .025, .001), INK), 0, my),
      () => onFace(M(disc(.045), INK), 0, my),
      () => onFace(M(tor(.07, .016, Math.PI), INK), 0, my - .03),
      () => { onFace(M(tor(.08, .016, Math.PI), INK, { r: Math.PI }), 0, my + .04); onFace(M(disc(.035), '#F27FA5'), .02, my - .03); },
      () => { onFace(M(disc(.1, Math.PI, Math.PI), '#fff'), 0, my + .02); onFace(M(disc(.06, Math.PI, Math.PI), INK, { op: .4 }), 0, my + .02); },
      () => [-.04, .04].forEach((x) => onFace(M(tor(.04, .012, Math.PI), INK, { r: Math.PI }), x, my + .02)),
      () => onFace(M(tor(.07, .016, Math.PI * .7), INK, { r: Math.PI * 1.1 }), .04, my + .03),
      () => { onFace(M(shapeGeo('mus', [[-.16, 0], [-.06, .05], [0, .02], [.06, .05], [.16, 0], [.06, -.03], [0, 0], [-.06, -.03]]), hc), 0, my + .07); onFace(M(box(.07, .02, .001), INK), 0, my - .03); },
    ];
    (mouthKinds[v('mouth')] || mouthKinds[0])();
    ({
      1: () => [-.3, -.26, -.34, .3, .26, .34].forEach((x, i) => onFace(M(disc(.014), '#8B5A2B'), x, -.13 - (i % 3) * .03)),
      2: () => [-.32, .32].forEach((x) => onFace(M(disc(.07), '#F27FA5', { op: .55, s: [1.3, .7, 1] }), x, -.13)),
      3: () => onFace(M(box(.025, .3, .001), '#B84A3A', { r: .5 }), -ex, ey + .02),
      4: () => onFace(M(box(.18, .07, .001), '#F4ECD8', { r: -.3 }), .3, -.14),
      5: () => onFace(M(shapeGeo('str5', starPts(.05)), '#9A4FB8'), ex + .04, -.13),
      6: () => [-.3, .3].forEach((x) => [0, .05].forEach((d) => onFace(M(box(.12, .02, .001), '#E8402C', { r: x < 0 ? -.2 : .2 }), x, -.1 - d))),
    }[v('face')] || (() => {}))();
    // 안경
    ({
      1: () => { [-ex, ex].forEach((x) => onFace(M(tor(.11, .015), INK), x, ey)); onFace(M(box(.1, .015, .001), INK), 0, ey + .02); },
      2: () => { [-ex, ex].forEach((x) => onFace(M(tor(.13, .015, Math.PI * 2, 4, 4), INK, { r: Math.PI / 4, s: [1.15, .8, 1] }), x, ey)); },
      3: () => { [-ex, ex].forEach((x) => onFace(M(disc(.12, 0, Math.PI * 2), INK, { s: [1.15, .85, 1] }), x, ey)); onFace(M(box(.12, .02, .001), INK), 0, ey + .02); },
      4: () => onFace(M(box(.62, .12, .001), '#37e0ff', { op: .85 }), 0, ey),
      5: () => onFace(M(tor(.11, .015), '#E7B23A'), ex, ey),
      6: () => { onFace(M(disc(.11), INK), -ex, ey); head.add(at(new T.Mesh(tor(R * 1.01, .012, Math.PI * 2, 6, 40), flat(INK)), 0, HC + .1, 0, Math.PI / 2 - .35, 0, 0)); },
      7: () => [-ex, ex].forEach((x) => onFace(M(shapeGeo('str7', starPts(.14)), '#F27FA5'), x, ey)),
    }[v('glasses')] || (() => {}))();

    // 머리카락
    const hairStyle = v('hair');
    const capMesh = (tilt = -.32, r = R * 1.07, cut = .5) => { const c = part(G(`hc${r}${cut}`, () => new T.SphereGeometry(r, 28, 16, 0, Math.PI * 2, 0, Math.PI * cut)), hc); c.rotation.x = tilt; c.position.y = HC; head.add(c); return c; };
    const blob = (r, x, y, z, s) => { const b = part(sph(r), hc); at(b, x, HC + y, z); if (s) b.scale.set(...s); head.add(b); return b; };
    const spike = (r, h, x, y, z, rx, rz) => head.add(at(part(cone(r, h, 8), hc), x, HC + y, z, rx, 0, rz));
    const bangs = () => [-.28, -.1, .1, .28].forEach((x, i) => blob(.14, x, .4 - Math.abs(x) * .3, R * .62, [1, .8 + (i % 2) * .2, .6]));
    ({
      1: () => { capMesh(); bangs(); },
      2: () => { capMesh(); bangs(); head.add(at(part(cap(R * .9, .9), hc), 0, HC - .45, -.3)).scale.set(1.05, 1, .5); },
      3: () => { capMesh(); bangs(); head.add(at(part(sph(R * 1.02), hc), 0, HC - .12, -.12)).scale.set(1.02, .9, .9); },
      4: () => { capMesh(); bangs(); blob(.24, R * .85, -.1, -.2); },
      5: () => { capMesh(); for (let i = 0; i < 9; i++) blob(.15, Math.cos(i * 2.4) * .4, .45 + (i % 3) * .08, Math.sin(i * 2.4) * .35); },
      6: () => { capMesh(); bangs(); blob(.24, 0, R + .1, -.15); },
      7: () => { capMesh(); for (let i = 0; i < 5; i++) spike(.11, .35, (i - 2) * .2, R * .95, 0, 0, (i - 2) * -.3); },
      8: () => { const c = capMesh(-.2, R * 1.02, .52); c.children[0].material = toon(hc); c.scale.setScalar(1); },
      9: () => { for (let i = 0; i < 6; i++) spike(.09, .5, 0, R * .9 + Math.sin(i) * .02, .45 - i * .17, -.6 + i * .25, 0); },
      10: () => { capMesh(); bangs(); [-1, 1].forEach((s) => blob(.22, s * .45, R * .8, -.05)); },
      11: () => { capMesh(); bangs(); [-1, 1].forEach((s) => head.add(at(part(cap(.13, .6), hc), s * (R + .1), HC - .35, -.05, 0, 0, s * .25))); },
      12: () => { const a = part(sph(R * 1.3), hc); at(a, 0, HC + .32, -.38); head.add(a); [-.3, -.1, .1, .3].forEach((x) => blob(.16, x, .52, R * .5)); },
      13: () => { capMesh(-.4); [-.3, -.12, .06].forEach((x) => blob(.15, x, .38, R * .62, [1, 1, .6])); head.add(at(part(cap(.2, .7), hc), -R * .8, HC - .35, .05)); },
      14: () => { head.add(at(part(cyl(R * .82, R * .85, .25, 24), hc), 0, HC + R * .78, -.05, -.15)); },
      15: () => { capMesh(-.35); bangs(); head.add(at(part(cap(.16, .7), hc), 0, HC - .1, -R - .15, .5)); },
      16: () => { capMesh(-.15, R * 1.09, .62); [-.3, -.15, 0, .15, .3].forEach((x) => blob(.12, x, .35, R * .7, [1, 1.2, .5])); },
      17: () => { for (let i = 0; i < 14; i++) { const t = (i / 14) * Math.PI * 2; blob(.2, Math.cos(t) * R * .75, .35 + Math.abs(Math.sin(t)) * .15, Math.sin(t) * R * .7 - .05); } },
      18: () => { capMesh(-.7); blob(.18, 0, R * .9, .1, [2.4, .6, 1.2]); },
      19: () => { capMesh(-.4); for (let i = 0; i < 9; i++) spike(.12, .55, Math.cos(i * .8) * .4, .5 + (i % 3) * .1, -.1 - (i % 2) * .15, -1 + (i % 3) * .3, Math.cos(i * .8) * -.9); bangs(); },
    }[hairStyle] || (() => {}))();
    // 모자
    const hatY = HC + R * .78;
    const hatAdd = (o) => head.add(o);
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
    }[v('hat')] || (() => {}))();

    // 오라
    const aura = new T.Group();
    root.add(aura);
    const auraKind = v('aura');
    if (auraKind) {
      const conf = [null, ['#FF8A1A', 'flame'], ['#FFE45C', 'bolt'], ['#ffffff', 'spark'], ['#7fe0f0', 'ice'], ['#F27FA5', 'heart'], ['#3B1A6E', 'dark'], ['rainbow', 'spark']][auraKind];
      const cols = conf[0] === 'rainbow' ? ['#E8402C', '#F2B705', '#3FA34D', '#2F7DE1', '#9A4FB8'] : [conf[0]];
      for (let i = 0; i < 18; i++) {
        const c = cols[i % cols.length];
        const geo = conf[1] === 'flame' ? cone(.07, .22, 6) : conf[1] === 'heart' ? shapeGeo('ahrt', heartPts(.08), .02) : conf[1] === 'bolt' ? shapeGeo('abolt', [[-.04, .14], [.06, .02], [0, .02], [.05, -.14], [-.06, -.01], [0, -.01]], .02) : conf[1] === 'ice' ? cone(.05, .2, 4) : sph(.045, 8, 6);
        const m = new T.Mesh(geo, flat(c, T.DoubleSide, conf[1] === 'dark' ? .7 : 1));
        m.userData = { a: (i / 18) * Math.PI * 2, y: (i % 6) * .45 + .1, r: .75 + (i % 3) * .12 };
        aura.add(m);
      }
      if (conf[1] === 'dark' || conf[1] === 'flame') aura.add(at(new T.Mesh(cyl(.9, .9, .02, 30), flat(conf[1] === 'dark' ? '#3B1A6E' : '#FF8A1A', T.DoubleSide, .35)), 0, .02, 0));
    }
    J.aura = aura;
    root.scale.setScalar(kid ? .95 : 1);
    return J;
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

  const JOINTS = ['torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'handL', 'handR', 'legL', 'legR'];
  const FLIP = new Set(['armL', 'armR', 'foreL', 'foreR', 'handL', 'handR']);
  function applyPose(J, pose, w = 1) {
    if (w >= .5) for (const [h, k] of [['handL', 'gL'], ['handR', 'gR']]) {
      const g = J[h].userData.gest;
      if (g) for (const [n, o] of Object.entries(g)) o.visible = pose[k] === n;
    }
    if (w >= .5 && J.heartProp) J.heartProp.visible = !!pose.heart;
    for (const j of JOINTS) {
      const r = pose[j] || [0, 0, 0];
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
  const frameCam = (w, h, face = .35) => {
    const cam = new T.PerspectiveCamera(26, w / h, .1, 50);
    cam.position.set(0, 2.3, 8.1);
    cam.lookAt(0, 1.72, 0);
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
  function snapshot(a, w = 200, h = 250) {
    const key = JSON.stringify(a) + w;
    if (snaps.has(key)) return snaps.get(key);
    const J = build(a);
    J.root.rotation.y = .38;
    applyPose(J, idle(a, 0));
    J.root.position.y = idle(a, 0).dy || 0;
    animateAura(J, 0);
    snapScene.add(J.root);
    snapCanvas.width = w; snapCanvas.height = h;
    renderTo(snapCanvas.getContext('2d'), snapScene, frameCam(w, h), w, h);
    snapScene.remove(J.root);
    const url = snapCanvas.toDataURL('image/png');
    if (snaps.size > 400) snaps.delete(snaps.keys().next().value);
    snaps.set(key, url);
    return url;
  }

  function animateAura(J, t) {
    J.aura.children.forEach((m) => {
      const u = m.userData;
      if (!u.r) return;
      const a = u.a + t * 1.6;
      m.position.set(Math.cos(a) * u.r, ((u.y + t * .8) % 2.8) + .1, Math.sin(a) * u.r);
      m.rotation.y = -a;
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
      J.root.rotation.y = v.facing + v.extraRot + spin;
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

  return { snapshot, mount, poseShot };
})();
