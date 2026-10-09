"""
Instruments and effects for the showcase's original score, synthesised from
scratch (numpy/scipy), so the track is Orbit's own and needs no licence.

Everything is deterministic: noise comes from seeded generators, so the same
score renders the same audio, sample for sample.
"""
import numpy as np
from scipy import signal

SR = 48000


def secs(n):
    return np.arange(n) / SR


def n_of(dur):
    return int(round(dur * SR))


def note_hz(name):
    """'A4' -> 440.0; sharps '#', flats 'b'."""
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    i = 1
    semi = names[name[0]]
    while i < len(name) and name[i] in "#b":
        semi += 1 if name[i] == "#" else -1
        i += 1
    octave = int(name[i:])
    midi = 12 * (octave + 1) + semi
    return 440.0 * 2 ** ((midi - 69) / 12)


def rng(seed):
    return np.random.default_rng(seed)


# ── filters ────────────────────────────────────────────────────────────────

def lowpass(x, hz, order=2):
    sos = signal.butter(order, min(hz, SR * 0.45), "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def highpass(x, hz, order=2):
    sos = signal.butter(order, hz, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def bandpass(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR * 0.45)], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def peak_eq(x, hz, gain_db, q=0.9):
    """RBJ peaking EQ."""
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * hz / SR
    alpha = np.sin(w) / (2 * q)
    b = [1 + alpha * a, -2 * np.cos(w), 1 - alpha * a]
    den = [1 + alpha / a, -2 * np.cos(w), 1 - alpha / a]
    return signal.lfilter(np.array(b) / den[0], np.array(den) / den[0], x, axis=-1)


def shelf_high(x, hz, gain_db):
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * hz / SR
    alpha = np.sin(w) / 2 * np.sqrt(2)
    cw = np.cos(w)
    b0 = a * ((a + 1) + (a - 1) * cw + 2 * np.sqrt(a) * alpha)
    b1 = -2 * a * ((a - 1) + (a + 1) * cw)
    b2 = a * ((a + 1) + (a - 1) * cw - 2 * np.sqrt(a) * alpha)
    a0 = (a + 1) - (a - 1) * cw + 2 * np.sqrt(a) * alpha
    a1 = 2 * ((a - 1) - (a + 1) * cw)
    a2 = (a + 1) - (a - 1) * cw - 2 * np.sqrt(a) * alpha
    return signal.lfilter([b0 / a0, b1 / a0, b2 / a0], [1, a1 / a0, a2 / a0], x, axis=-1)


# ── instruments (each returns a stereo array, shape (2, n)) ───────────────

def stereo(x, pan=0.0):
    """Constant-power pan, -1 left … 1 right."""
    th = (pan + 1) * np.pi / 4
    return np.vstack([x * np.cos(th), x * np.sin(th)])


def epiano(hz, dur, vel=0.8, seed=0):
    """
    A tine electric piano by FM, the way the classic digital EP is built: a body
    carrier (ratio 1) with a slowly decaying modulator for warmth, and a ratio-14
    modulator with a very fast decay for the bell of the tine. Velocity brightens it.
    """
    tail = 1.4
    n = n_of(dur + tail)
    t = secs(n)
    r = rng(seed)
    det = 1 + r.uniform(-0.0008, 0.0008)
    f = hz * det
    i_body = (0.9 + 1.6 * vel) * np.exp(-t / 0.55)
    i_tine = (0.5 + 1.4 * vel) * np.exp(-t / 0.018)
    m_body = i_body * np.sin(2 * np.pi * f * t)
    m_tine = i_tine * np.sin(2 * np.pi * f * 14 * t)
    car = np.sin(2 * np.pi * f * t + m_body + m_tine)
    car2 = np.sin(2 * np.pi * f * 1.0015 * t + 0.6 * m_body)
    x = 0.65 * car + 0.35 * car2
    # Higher notes ring shorter, as on the instrument.
    tau = 2.2 * (220 / max(hz, 110)) ** 0.35
    env = np.minimum(t / 0.003, 1) * np.exp(-t / tau)
    gate = n_of(dur)
    rel = np.ones(n)
    rel[gate:] = np.exp(-(t[gate:] - t[gate]) / 0.18)
    x = x * env * rel * (0.35 + 0.65 * vel)
    x = np.tanh(1.6 * x) / np.tanh(1.6)
    return x


def tremolo(st, rate=4.2, depth=0.22, phase=0.0):
    n = st.shape[1]
    t = secs(n)
    l = 1 + depth * np.sin(2 * np.pi * rate * t + phase)
    r = 1 - depth * np.sin(2 * np.pi * rate * t + phase)
    return np.vstack([st[0] * l, st[1] * r])


def polyblep_saw(f, n, phase0=0.0):
    t = secs(n)
    ph = (phase0 + f * t) % 1.0
    dt = f / SR
    y = 2 * ph - 1
    # PolyBLEP: smooth the discontinuity so the saw is band-limited enough for a pad.
    m1 = ph < dt
    x1 = ph[m1] / dt
    y[m1] -= x1 + x1 - x1 * x1 - 1
    m2 = ph > 1 - dt
    x2 = (ph[m2] - 1) / dt
    y[m2] -= x2 * x2 + x2 + x2 + 1
    return y


def pad(hzs, dur, attack=1.2, release=1.6, cutoff=1400, seed=0, voices=5, spread=0.11):
    """A warm unison-saw pad: five detuned saws per note, low-passed, slow in and out, wide."""
    n = n_of(dur + release)
    t = secs(n)
    r = rng(seed)
    out = np.zeros((2, n))
    for hz in hzs:
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * 9 + r.uniform(-1.5, 1.5)
            f = hz * 2 ** (cents / 1200)
            s = polyblep_saw(f, n, r.uniform(0, 1))
            pan = (v - (voices - 1) / 2) / ((voices - 1) / 2) * 0.8
            out += stereo(s, pan) * spread
    out = lowpass(out, cutoff, 2)
    env = np.minimum(t / attack, 1) ** 2
    gate = n_of(dur)
    env[gate:] *= np.exp(-(t[gate:] - t[gate]) / (release / 3))
    return out * env


def sub_bass(hz, dur, vel=0.9):
    """A round sub: sine plus a little second harmonic, softly saturated, short release."""
    rel = 0.08
    n = n_of(dur + rel)
    t = secs(n)
    x = np.sin(2 * np.pi * hz * t) + 0.18 * np.sin(2 * np.pi * 2 * hz * t + 0.4)
    env = np.minimum(t / 0.006, 1)
    gate = n_of(dur)
    env[gate:] *= np.exp(-(t[gate:] - t[gate]) / (rel / 3))
    x = np.tanh(1.3 * x * env) * vel
    return lowpass(x, 420, 2)


def kick(vel=1.0, seed=0):
    n = n_of(0.55)
    t = secs(n)
    f = 46 + (152 - 46) * np.exp(-t / 0.028)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.26) * np.minimum(t / 0.0015, 1)
    click = highpass(rng(seed).standard_normal(n), 2500) * np.exp(-t / 0.0018) * 0.12
    x = np.tanh(1.8 * (body + click)) * vel
    return x


def clap(vel=0.8, seed=0):
    n = n_of(0.45)
    t = secs(n)
    r = rng(seed)
    out = []
    for ch in range(2):
        noise = r.standard_normal(n)
        env = np.zeros(n)
        for k, off in enumerate((0.0, 0.009, 0.018, 0.026)):
            tt = np.clip(t - off, 0, None)
            env += (t >= off) * np.exp(-tt / (0.006 if k < 3 else 0.11)) * (0.9 if k < 3 else 0.7)
        out.append(bandpass(noise * env, 850, 3200) * vel * 0.6)
    return np.vstack(out)


def hat(vel=0.5, open_=False, seed=0):
    n = n_of(0.5 if open_ else 0.12)
    t = secs(n)
    x = highpass(rng(seed).standard_normal(n), 7200, 2)
    x = peak_eq(x, 10500, 4, 1.2)
    x *= np.exp(-t / (0.16 if open_ else 0.018)) * np.minimum(t / 0.0008, 1) * vel
    return x * 0.5


def shaker(vel=0.4, seed=0):
    n = n_of(0.12)
    t = secs(n)
    x = bandpass(rng(seed).standard_normal(n), 4800, 11000)
    env = np.minimum(t / 0.008, 1) * np.exp(-t / 0.035)
    return x * env * vel * 0.45


def rim(vel=0.6, seed=0):
    n = n_of(0.12)
    t = secs(n)
    x = 0.7 * np.sin(2 * np.pi * 1750 * t) + 0.5 * np.sin(2 * np.pi * 820 * t)
    x *= np.exp(-t / 0.014)
    x += highpass(rng(seed).standard_normal(n), 3000) * np.exp(-t / 0.003) * 0.4
    return x * vel * 0.5


def bell(hz, dur=0.6, vel=0.5):
    """A soft FM bell for the arpeggio: ratio 3.5, quick index fall."""
    n = n_of(dur + 0.8)
    t = secs(n)
    mod = (1.2 * vel + 0.3) * np.exp(-t / 0.12) * np.sin(2 * np.pi * hz * 3.5 * t)
    x = np.sin(2 * np.pi * hz * t + mod) * np.exp(-t / 0.42) * np.minimum(t / 0.002, 1)
    return x * vel * 0.5


def swell(dur, seed=0, lo=300, hi=6000):
    """A breath of filtered noise that rises into a downbeat (a reversed-cymbal feel, but soft)."""
    n = n_of(dur)
    t = secs(n)
    r = rng(seed)
    out = []
    for ch in range(2):
        x = r.standard_normal(n)
        # Brighten over time by crossfading a low and a high band.
        a = bandpass(x, lo, lo * 3)
        b = bandpass(x, hi / 3, hi)
        p = (t / t[-1]) ** 1.5
        y = a * (1 - p) + b * p
        out.append(y * p ** 2.2)
    return np.vstack(out) * 0.35


def sub_drop(dur=1.6, vel=0.8):
    """A low sine that settles from 70 to 38 Hz: weight under the end card."""
    n = n_of(dur)
    t = secs(n)
    f = 38 + 32 * np.exp(-t / 0.18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.7) * np.minimum(t / 0.004, 1)
    return np.tanh(1.4 * x) * vel


def ui_click(vel=0.35, seed=0):
    """A small, soft interface click (for a tap or a button on screen)."""
    n = n_of(0.06)
    t = secs(n)
    x = np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.006) + highpass(rng(seed).standard_normal(n), 4000) * np.exp(-t / 0.0015) * 0.5
    return x * vel * 0.4


def whoosh(dur=0.35, seed=0, vel=0.35):
    """A short airy movement for a panel sliding in."""
    n = n_of(dur)
    t = secs(n)
    x = bandpass(rng(seed).standard_normal(n), 900, 5200)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return x * env * vel * 0.3


# ── effects ────────────────────────────────────────────────────────────────

def make_ir(rt60=2.2, seed=7, predelay=0.018, damp=5500, width=1.0):
    """A stereo room/plate impulse: decaying noise, darker as it decays, with a pre-delay."""
    n = n_of(rt60 * 1.3)
    t = secs(n)
    r = rng(seed)
    decay = np.exp(-6.91 * t / rt60)
    ir = []
    for ch in range(2):
        x = r.standard_normal(n) * decay
        bright = highpass(x, 2000) * np.exp(-t / (rt60 * 0.18))
        dark = lowpass(x, damp)
        ir.append(dark + 0.25 * bright)
    ir = np.vstack(ir)
    mid = (ir[0] + ir[1]) / 2
    side = (ir[0] - ir[1]) / 2 * width
    ir = np.vstack([mid + side, mid - side])
    pad_ = np.zeros((2, n_of(predelay)))
    ir = np.hstack([pad_, ir])
    return ir / np.sqrt((ir ** 2).sum() / 2)


def reverb(st, ir, mix=0.25):
    wet = np.vstack([signal.fftconvolve(st[0], ir[0])[: st.shape[1]], signal.fftconvolve(st[1], ir[1])[: st.shape[1]]])
    return st * (1 - mix) + wet * mix


def wet_only(st, ir):
    return np.vstack([signal.fftconvolve(st[0], ir[0])[: st.shape[1]], signal.fftconvolve(st[1], ir[1])[: st.shape[1]]])


def pingpong(st, delay_s, feedback=0.38, taps=6, tone=4200):
    """Ping-pong delay: each repeat alternates sides and gets darker."""
    n = st.shape[1]
    out = np.zeros_like(st)
    d = n_of(delay_s)
    src = lowpass((st[0] + st[1]) / 2, tone)
    g = 1.0
    for k in range(1, taps + 1):
        g *= feedback
        if k * d >= n:
            break
        ch = k % 2
        out[ch, k * d:] += src[: n - k * d] * g
        src = lowpass(src, tone * 0.9)
    return out


def duck(n, kick_times, depth=0.55, release=0.16, attack=0.004):
    """Sidechain gain: dips on every kick and breathes back, the pump of a house groove."""
    g = np.ones(n)
    t = secs(n)
    for k in kick_times:
        i0 = n_of(k)
        if i0 >= n:
            continue
        tt = t[i0:] - k
        shape = 1 - depth * np.minimum(tt / attack, 1) * np.exp(-tt / release)
        g[i0:] = np.minimum(g[i0:], shape)
    return g


def compress(st, threshold_db=-18, ratio=2.0, attack=0.01, release=0.15, makeup_db=2.0):
    """A gentle RMS bus compressor (stereo-linked)."""
    x = np.maximum(np.abs(st[0]), np.abs(st[1]))
    # RMS-ish detector with attack/release smoothing.
    a_a = np.exp(-1 / (attack * SR))
    a_r = np.exp(-1 / (release * SR))
    env = signal.lfilter([1 - a_r], [1, -a_r], x ** 2)
    env = np.sqrt(np.maximum(env, 1e-12))
    db = 20 * np.log10(env + 1e-12)
    over = np.maximum(db - threshold_db, 0)
    gain_db = -over * (1 - 1 / ratio) + makeup_db
    gain = 10 ** (gain_db / 20)
    # Smooth the gain so it does not crackle.
    gain = signal.lfilter([1 - a_a], [1, -a_a], gain)
    return st * gain


def soft_clip(st, ceiling=0.98):
    return np.tanh(st / ceiling) * ceiling


def place(buf, clip, at, gain=1.0):
    """Add a mono or stereo clip into a stereo buffer at time `at` (s)."""
    i0 = n_of(at)
    if clip.ndim == 1:
        clip = np.vstack([clip, clip])
    n = min(clip.shape[1], buf.shape[1] - i0)
    if n > 0 and i0 >= 0:
        buf[:, i0:i0 + n] += clip[:, :n] * gain
