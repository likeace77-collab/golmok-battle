# 음악쌤 1176 노래: 할머니가 고음으로 "랄라라" 부르는 목소리 (포먼트 합성)
import numpy as np, sys, json
from scipy.signal import lfilter
SR = 44100
rng = np.random.default_rng(7)
song = ['1176', '655', '555', '716', '666', "3'2'1'", "3'1'1'", '56', '6712']
# 박자: brawlers.js 음악쌤 가젯2의 times / end 그대로 (사용자가 흥얼거린 녹음에서 뽑음)
TIMES = [0, 0.76, 1.1, 1.43, 2.09, 2.59, 3.11, 3.96, 4.14, 4.63, 5.21, 5.72, 6.21, 7.65, 8.12, 8.64, 8.96, 9.4, 9.83, 10.17, 10.45, 10.6, 11.7, 12.17, 12.88, 13.08, 13.67, 14.19]
END = 14.99
HUM_END = [0.32, 1.1, 1.43, 1.87, 2.37, 2.87, 3.49, 4.14, 4.41, 4.99, 5.72, 6.21, 6.83, 7.99, 8.47, 8.89, 9.04, 9.78, 10.17, 10.45, 10.6, 11.29, 12.17, 12.46, 13.04, 13.67, 14.19, END]   # 녹음에서 소리가 끊긴 곳 (쉼 살리기)
BASE = 1046.5                      # 1 = 도 (C6) — 음 확 높게
SEMI = [0, 2, 4, 5, 7, 9, 11]
pitches = [SEMI[int(m[0]) - 1] - (12 if int(m[0]) >= 5 else 0) for m in __import__('re').findall(r"\d'?", ''.join(song))]   # 5·6·7은 도 아래 (솔라시), '는 '앞 음보다 위'라는 뜻
assert len(pitches) == len(TIMES)
nxt = TIMES[1:] + [END]
ends = [max(h, t0 + 0.18) if (n - h) > 0.12 else n for h, n, t0 in zip(HUM_END, nxt, TIMES)]   # 녹음에서 끊어 부른 곳은 똑같이 끊음
N = int((END + 0.3) * SR)
t = np.arange(N) / SR
semi = np.full(N, float(pitches[0])); starts = []; voiced = np.zeros(N)
for k, s0 in enumerate(pitches):
    a, b = int(TIMES[k] * SR), int(nxt[k] * SR); starts.append(a)
    seg = np.full(b - a, float(s0))
    sc = min(b - a, int(0.07 * SR)); seg[:sc] = s0 - 1.8 * (1 - np.linspace(0, 1, sc)) ** 2      # 스쿱 (밑에서 끌어올림)
    semi[a:b] = seg; voiced[a:int(ends[k] * SR)] = 1
semi[int(END * SR):] = pitches[-1]
pos = END
# 할머니 비브라토: 느리고 크게 떨림 (음 시작 뒤 천천히 커짐) + 떨림 속도도 살짝 흔들림
vib_rate = 5.6 + 0.6 * np.sin(2 * np.pi * 0.7 * t)
vib_phase = 2 * np.pi * np.cumsum(vib_rate) / SR
depth = np.zeros(N)
for k, a in enumerate(starts):
    b = starts[k + 1] if k + 1 < len(starts) else N
    ramp = np.clip((np.arange(b - a) / SR - 0.06) / 0.12, 0, 1)
    depth[a:b] = 0.75 * ramp
jitter = np.convolve(rng.normal(0, 1, N), np.ones(400) / 400, 'same') * 0.6
f0 = BASE * 2 ** ((semi + depth * np.sin(vib_phase) + jitter * 0.08) / 12)
# 성대 소리 (Rosenberg 펄스) + 숨소리
ph = np.cumsum(f0) / SR; frac = ph % 1.0
OQ = 0.62
src = np.where(frac < OQ, 0.5 * (1 - np.cos(np.pi * frac / OQ)), np.cos(np.pi / 2 * (frac - OQ) / (1 - OQ)) ** 2 * (frac < 1))
src = np.diff(src, prepend=0) * SR / 2000
shimmer = 1 + 0.06 * np.convolve(rng.normal(0, 1, N), np.ones(300) / 300, 'same') * 8
src *= shimmer
breath = rng.normal(0, 1, N) * 0.035 * (0.6 + 0.4 * (frac < OQ))
x = src + breath
# 포먼트 (모음 '아', 고음이면 F1을 음 높이에 맞춰 올림) + '라'의 ㄹ 소리: 음 시작 45ms 동안 F1·F2 낮았다가 열림
def reson(sig, F, BW):
    out = np.zeros_like(sig); y1 = y2 = 0.0
    # 시간에 따라 바뀌는 공명 필터 (블록 단위)
    blk = 256
    for i in range(0, len(sig), blk):
        f = F[i]; bw = BW
        r = np.exp(-np.pi * bw / SR); c = -r * r; b = 2 * r * np.cos(2 * np.pi * f / SR); a = 1 - b - c
        seg = sig[i:i + blk]
        y, zi = lfilter([a], [1, -b, -c], seg, zi=np.array([b * y1 + c * y2, c * y1]))
        out[i:i + blk] = y
        if len(y) >= 2: y1, y2 = y[-1], y[-2]
    return out
lmix = np.zeros(N)                   # 'ㄹ' 정도: 음 시작 15ms 전부터 부드럽게 올라갔다가 45ms 동안 열림 (딸깍 소리 없게)
for a in starts:
    pre, post = int(0.015 * SR), int(0.045 * SR)
    i0 = max(0, a - pre); up = 0.5 - 0.5 * np.cos(np.pi * np.arange(a - i0) / max(1, pre))
    dn = 0.5 + 0.5 * np.cos(np.pi * np.arange(min(post, N - a)) / post)
    lmix[i0:a] = np.maximum(lmix[i0:a], up); lmix[a:a + len(dn)] = np.maximum(lmix[a:a + len(dn)], dn)
F1 = np.maximum(900, f0 * 1.08) * (1 - 0.45 * lmix)
F2 = 1350 * (1 - 0.15 * lmix) + 0 * t
F3 = np.full(N, 2850.0); F4 = np.full(N, 3900.0)
y = reson(x, F1, 130) * 1.0 + reson(x, F2, 160) * 0.55 + reson(x, F3, 220) * 0.35 + reson(x, F4, 300) * 0.15
y += reson(x, np.full(N, 2500.0), 120) * 0.25          # 콧소리 살짝
# 크기: 음마다 살짝 숨 쉬듯 + ㄹ에서 살짝 줄었다가 + 떨림
env = np.convolve(voiced, np.ones(int(0.03 * SR)) / int(0.03 * SR), 'same')   # 쉬는 곳은 부드럽게 끊김
env *= 1 - 0.45 * lmix
env *= 1 + 0.12 * np.sin(vib_phase + 0.5)
end = int(pos * SR); fade = int(0.12 * SR); env[end - fade:end] *= np.linspace(1, 0, fade); env[end:] = 0
y *= env
y = np.tanh(y / np.max(np.abs(y)) * 1.6)            # 살짝 거칠게
y = y / np.max(np.abs(y)) * 0.9
open(sys.argv[1] if len(sys.argv) > 1 else '/tmp/sing/out.raw', 'wb').write((y * 32767).astype('<i2').tobytes())
print(json.dumps({'dur': round(pos, 3), 'notes': len(pitches)}))
