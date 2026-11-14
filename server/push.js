'use strict';
// 웹 푸시 (RFC 8291 aes128gcm 암호화 + VAPID). 외부 라이브러리 없이 node crypto로 만듭니다.
const crypto = require('crypto');

const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64u = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();

// VAPID 키: { jwk: { kty, crv, x, y, d } } 를 db에 보관
function makeKeys() {
  const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  return { jwk: privateKey.export({ format: 'jwk' }) };
}
const pubRaw = (jwk) => Buffer.concat([Buffer.from([4]), fromB64u(jwk.x), fromB64u(jwk.y)]);
const publicKey = (keys) => b64u(pubRaw(keys.jwk));

function vapidHeader(keys, endpoint, subject) {
  const aud = new URL(endpoint).origin;
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const key = crypto.createPrivateKey({ key: keys.jwk, format: 'jwk' });
  const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${publicKey(keys)}`;
}

// 내용 암호화 (aes128gcm 한 덩어리)
function encrypt(sub, payload) {
  const uaPublic = fromB64u(sub.keys.p256dh), authSecret = fromB64u(sub.keys.auth);
  const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
  const asPublic = ecdh.getPublicKey();
  const secret = ecdh.computeSecret(uaPublic);
  const prkKey = hmac(authSecret, secret);
  const ikm = hmac(prkKey, Buffer.concat([Buffer.from('WebPush: info\0'), uaPublic, asPublic, Buffer.from([1])]));
  const salt = crypto.randomBytes(16);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPublic.length]), asPublic, ct]);
}

// 보내기. 410/404면 구독이 사라진 것이라 'gone'
async function send(keys, sub, data, subject = 'mailto:admin@golmok.game') {
  const body = encrypt(sub, JSON.stringify(data));
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { TTL: '86400', Urgency: 'normal', 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', Authorization: vapidHeader(keys, sub.endpoint, subject) }, body });
  if (r.status === 404 || r.status === 410) return 'gone';
  return r.ok ? 'ok' : `err ${r.status}`;
}

module.exports = { makeKeys, publicKey, send, encrypt, vapidHeader, b64u, fromB64u };
