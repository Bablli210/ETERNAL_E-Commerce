"""
Objective checks on a mix, since it has to be judged without listening:
- tonal balance per section in octave bands, against a reference slope typical
  of modern electronic masters (roughly -4.5 dB/octave above 125 Hz);
- short-term loudness (3 s windows) every half second, to see the arc;
- peak and clipping counts.

    python3 reel/showcase/music/analyze.py reel/showcase/out/score.wav [--bpm 112]
"""
import json
import subprocess
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

path = sys.argv[1]
bpm = float(sys.argv[sys.argv.index("--bpm") + 1]) if "--bpm" in sys.argv else 112.5
sr, x = wavfile.read(path)
kind = x.dtype.kind  # float WAVs are already in [-1, 1]; only integer PCM is scaled
x = x.astype(np.float64)
if kind != "f":
    x /= 2 ** 31 if np.abs(x).max() > 2 ** 16 else 2 ** 15
mono = x.mean(axis=1) if x.ndim == 2 else x
bar = 4 * 60 / bpm

bands = [(31, 63), (63, 125), (125, 250), (250, 500), (500, 1000), (1000, 2000), (2000, 4000), (4000, 8000), (8000, 16000)]


def balance(seg):
    f, p = signal.welch(seg, sr, nperseg=8192)
    out = []
    for lo, hi in bands:
        m = (f >= lo) & (f < hi)
        out.append(10 * np.log10(p[m].sum() + 1e-20))
    out = np.array(out)
    return out - out[2]  # relative to 125-250 Hz


ref = np.array([+3.0, +2.0, 0.0, -3.5, -7.5, -11.5, -15.5, -20.0, -25.0])  # rough modern electronic slope
names = ["31", "63", "125", "250", "500", "1k", "2k", "4k", "8k"]
secs = [("intro bars 1-2", 0, 2 * bar), ("groove bars 3-10", 2 * bar, 10 * bar), ("lift bars 11-12", 10 * bar, 12 * bar), ("end bars 13-14", 12 * bar, 14 * bar)]
print("octave balance relative to 125 Hz (dB), and deviation from the reference slope:")
print("            " + " ".join(f"{n:>6}" for n in names))
print("reference   " + " ".join(f"{v:6.1f}" for v in ref))
for name, a, b in secs:
    seg = mono[int(a * sr):int(b * sr)]
    if len(seg) < sr:
        continue
    bl = balance(seg)
    print(f"{name:<12}" + " ".join(f"{v:6.1f}" for v in bl))
    dev = bl - ref
    dev = dev - dev[2:].mean()  # shape only (31/63 excluded from the mean: sections without bass)
    print(f"{'  shape dev':<12}" + " ".join(f"{v:+6.1f}" for v in dev))

# Short-term loudness every 0.5 s via ffmpeg ebur128.
r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-v", "verbose", "-i", path, "-af", "ebur128=framelog=verbose", "-f", "null", "-"], capture_output=True, text=True)
pts = []
for line in r.stderr.splitlines():
    if "t:" in line and " S:" in line:
        try:
            t = float(line.split("t:")[1].split()[0])
            s = float(line.split(" S:")[1].split()[0])
            pts.append((t, s))
        except Exception:
            pass
print("\nshort-term loudness (LUFS) by bar:")
for k in range(14):
    vals = [s for t, s in pts if k * bar <= t < (k + 1) * bar and s > -70]
    if vals:
        print(f"  bar {k + 1:>2} ({k * bar:5.1f}s): {np.mean(vals):6.1f}  " + "#" * int(max(0, np.mean(vals) + 40)))
peak = np.abs(x).max()
clips = int((np.abs(x) > 0.999).sum())
print(f"\npeak {20 * np.log10(peak + 1e-12):.2f} dBFS, samples at full scale: {clips}")
