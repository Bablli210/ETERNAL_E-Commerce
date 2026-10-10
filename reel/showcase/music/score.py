"""
The showcase's score: warm minimal electronic, 112.5 BPM (a beat is exactly 16 frames
at 30 fps, a bar 64), 14 bars and a tail = 30.0 s.

Arrangement as data (music/cue.json, written by tools/cue.mjs from the recorded takes):
which parts play in which bar, and the one-off hits: swells into the cuts, a soft tick
for every click and tap on screen (panned to that device), air under the bag sheet and
the drawer, bells for the finder, the drop under the end card. The film's cuts sit on
bar lines, so the score and the picture share one grid.

    python3 reel/showcase/music/score.py [--cue reel/showcase/music/cue.json] [--out reel/showcase/out/score.wav]

Writes the master (48 kHz, 24-bit WAV), the stems, and a spectrogram for review.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from scipy.io import wavfile

sys.path.insert(0, os.path.dirname(__file__))
from synth import (SR, n_of, note_hz, epiano, tremolo, stereo, pad, sub_bass, kick, clap, hat, shaker, rim, bell,
                   swell, sub_drop, ui_click, whoosh, make_ir, wet_only, pingpong, duck, compress, soft_clip, place,
                   highpass, lowpass, shelf_high, peak_eq)

BPM = 112.5
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 14
LENGTH = 30.0

# The progression: F major, rootless voicings for the keys (voice-led), roots for the sub.
# Imaj9 – iii7 – vi9 – IVmaj9, and a ii9 – V11 turn into the final Imaj9.
CHORDS = {
    "Fmaj9": (["A3", "C4", "E4", "G4"], "F1"),
    "Am7": (["G3", "C4", "E4", "A4"], "A1"),
    "Dm9": (["F3", "A3", "C4", "E4"], "D2"),
    "Bbmaj9": (["A3", "C4", "D4", "F4"], "Bb1"),
    "Gm9": (["F3", "A3", "Bb3", "D4"], "G1"),
    "C11": (["Bb3", "D4", "F4", "G4"], "C2"),
    "Fmaj9top": (["A3", "C4", "E4", "G4", "C5"], "F1"),
}

# One chord per bar; bar 13 splits ii9 | V11 to turn home.
CHANGES = ["Fmaj9", "Am7", "Dm9", "Bbmaj9"] * 3 + [("Gm9", "C11"), "Fmaj9top"]

# Default arrangement; the film's plan can override it with --cue.
DEFAULT_CUE = {
    "sections": {
        # bar ranges are 1-based, inclusive
        "keys_pads": [1, 2],          # intro: whole-note chords, pad swelling
        "groove_a": [3, 6],           # kick, clap, hats, shaker, sub, comping keys
        "groove_b": [7, 10],          # + open hats, rim, bell arpeggio
        "lift": [11, 12],             # kick out, pad opens, swell into 13
        "full": [13, 13],             # everything, the turn home
        "end": [14, 14],              # final chord, sub drop, tails
    },
    "swells": [3, 7, 11, 13, 14],     # a soft swell lands on the downbeat of these bars
    "pickups": [],                    # bars the keys lead into with two eighths
    "rims": [],                       # seconds: a rim accent
    "clicks": [],                     # [seconds, pan, gain]: clicks and taps on screen
    "brushes": [],                    # [seconds, pan, gain]: air under a panel sliding in
    "bells": [],                      # [seconds, note, velocity, pan]
    "air": [],                        # [from, to]: a low breath rising
    "felt": [],                       # [seconds, note, velocity]: a single e-piano note
}


def bar_t(bar, beat=0.0):
    """Start time (s) of 1-based bar, plus beats."""
    return (bar - 1) * BAR + beat * BEAT


def in_section(cue, name, bar):
    a, b = cue["sections"][name]
    return a <= bar <= b


def render(cue):
    n = n_of(LENGTH + 0.0)
    keys = np.zeros((2, n))
    pads_ = np.zeros((2, n))
    bass = np.zeros((2, n))
    drums = np.zeros((2, n))
    tops = np.zeros((2, n))
    fx = np.zeros((2, n))
    kicks = []
    seed = 100

    def sd():
        nonlocal seed
        seed += 1
        return seed

    for bar in range(1, BARS + 1):
        ch = CHANGES[bar - 1]
        halves = ch if isinstance(ch, tuple) else (ch,)
        groove = any(in_section(cue, s, bar) for s in ("groove_a", "groove_b", "full"))
        lift = in_section(cue, "lift", bar)
        intro = in_section(cue, "keys_pads", bar)
        end = in_section(cue, "end", bar)

        # ── keys ──
        for hi, name in enumerate(halves):
            voicing, root = CHORDS[name]
            span = 4 / len(halves)
            b0 = hi * span
            if intro or end or lift:
                # Sustained chords, gently rolled bottom to top.
                dur = span * BEAT + (2.2 if end else 0.05)
                vel = 0.5 if intro else 0.62 if lift else 0.72
                for k, nt in enumerate(voicing):
                    clip = tremolo(stereo(epiano(note_hz(nt), dur, vel, seed=sd()), (k - 1.5) * 0.25), 4.0, 0.18)
                    place(keys, clip, bar_t(bar, b0) + k * 0.018)
            else:
                # House comping: a push on the and-of-four of the previous bar, a stab on the and-of-two.
                pattern = [(b0 + 0.0, 1.25, 0.66), (b0 + 1.5, 0.45, 0.52), (b0 + 2.5, 0.9, 0.6)] if len(halves) == 1 else [(b0, 0.9, 0.66), (b0 + 1.5, 0.4, 0.55)]
                lead = bar + 1 in cue.get("pickups", []) and len(halves) == 1
                if lead:
                    pattern = pattern[:2] + [(b0 + 2.5, 0.4, 0.56)]
                for (bt, length, vel) in pattern:
                    for k, nt in enumerate(voicing):
                        clip = tremolo(stereo(epiano(note_hz(nt), length * BEAT, vel, seed=sd()), (k - 1.5) * 0.25), 4.0, 0.18)
                        place(keys, clip, bar_t(bar, bt) + k * 0.006)
                if lead:
                    # Two eighths that lean into the next bar's chord.
                    nxt = CHANGES[bar]
                    nv = CHORDS[nxt[0] if isinstance(nxt, tuple) else nxt][0]
                    for bt, vel in ((3.0, 0.5), (3.5, 0.6)):
                        for k, nt in enumerate(nv):
                            clip = tremolo(stereo(epiano(note_hz(nt), 0.45 * BEAT, vel, seed=sd()), (k - 1.5) * 0.25), 4.0, 0.18)
                            place(keys, clip, bar_t(bar, bt) + k * 0.006)
            # ── pad ──
            if not end or hi == 0:
                cutoff = 900 if intro else 2400 if lift else 1500
                dur = span * BEAT + (2.6 if end else 0.0)
                p = pad([note_hz(x) for x in voicing], dur, attack=0.9 if intro or lift else 0.35, release=1.2, cutoff=cutoff, seed=sd())
                place(pads_, p, bar_t(bar, b0), 0.55 if not lift else 0.75)
            # ── sub ──
            if groove or end:
                rhz = note_hz(root)
                if end:
                    place(bass, stereo(sub_bass(rhz, 2.2, 0.9)), bar_t(bar, b0))
                else:
                    # Root on the one, a pickup on the and-of-two, the fifth's octave sometimes.
                    hits = [(0.0, 1.35), (1.5, 0.4), (2.5, 1.3)] if len(halves) == 1 else [(0.0, 0.9), (1.5, 0.45)]
                    for (bt, length) in hits:
                        place(bass, stereo(sub_bass(rhz, length * BEAT, 0.85)), bar_t(bar, b0 + bt))

        # ── drums ──
        if groove:
            for b in range(4):
                t0 = bar_t(bar, b)
                place(drums, stereo(kick(0.95, sd())), t0, 0.95)
                kicks.append(t0)
                if b in (1, 3):
                    place(drums, clap(0.75, sd()), t0, 0.5)
                # Offbeat closed hat, swung 16th shaker.
                place(drums, stereo(hat(0.5, False, sd()), 0.25), t0 + BEAT / 2, 0.7)
                for s in range(4):
                    swing = 0.035 * BEAT if s % 2 else 0.0
                    v = 0.55 if s % 2 else 0.35
                    place(drums, stereo(shaker(v, sd()), -0.3), t0 + s * BEAT / 4 + swing, 0.6)
            if in_section(cue, "groove_b", bar) or in_section(cue, "full", bar):
                for b in range(4):
                    place(drums, stereo(hat(0.42, True, sd()), 0.3), bar_t(bar, b + 0.5), 0.45)
                for bt in (1.75, 3.25):
                    place(drums, stereo(rim(0.55, sd()), -0.2), bar_t(bar, bt), 0.6)
                # A bell arpeggio on the chord tones, sixteenths with space.
                voicing = CHORDS[halves[0]][0]
                arp = [voicing[i % len(voicing)] for i in (0, 2, 1, 3, 2, 1)]
                for k, nt in enumerate(arp):
                    hz = note_hz(nt) * 2
                    place(tops, stereo(bell(hz, 0.25, 0.45), 0.35 if k % 2 else -0.35), bar_t(bar, 0.5 + k * 0.5), 0.55)
        elif lift:
            # Kick out; the shaker keeps time and builds.
            for s in range(16):
                v = 0.25 + 0.35 * (s / 16) * (bar - cue["sections"]["lift"][0] + 1) / 2
                place(drums, stereo(shaker(v, sd()), -0.3), bar_t(bar, s / 4), 0.6)
        elif intro and bar == cue["sections"]["keys_pads"][1]:
            for s in range(8, 16):
                place(drums, stereo(shaker(0.18 + 0.02 * s, sd()), -0.3), bar_t(bar, s / 4), 0.5)

    # ── one-off hits ──
    for b in cue["swells"]:
        dur = BAR if b != 14 else BAR * 0.75
        sw = swell(dur, seed=sd())
        place(fx, sw, bar_t(b) - dur, 0.55)
    end_bar = cue["sections"]["end"][0]
    place(fx, stereo(sub_drop(2.4, 0.8)), bar_t(end_bar), 0.9)
    for t in cue.get("rims", []):
        place(drums, stereo(rim(0.5, sd()), -0.1), t, 0.55)
    # Interface sounds stay dry and quiet: they mark real events, they are not percussion.
    ui = np.zeros((2, n))
    for (t, p, g, *_) in cue.get("clicks", []):
        place(ui, stereo(ui_click(0.8, sd()), p), t, 0.17 * g)
    for (t, p, g, *_) in cue.get("brushes", []):
        # 300 ms of air, low-passed, centred on the panel's arrival.
        place(ui, stereo(lowpass(whoosh(0.3, sd(), 0.8), 2600), p), t - 0.12, 0.17 * g)
    for (t, note, vel, p) in cue.get("bells", []):
        place(tops, stereo(bell(note_hz(note), 0.5, vel), p), t, 0.7)
    for (a, b) in cue.get("air", []):
        # A low breath that rises with the curtain and eases out over 0.3 s instead of stopping.
        sw = swell(b - a, seed=sd(), lo=200, hi=2400)
        tail = sw[:, -1:] * np.exp(-np.arange(n_of(0.3)) / (0.08 * SR))
        place(fx, np.hstack([sw, tail]), a, 0.25)
    for (t, note, vel) in cue.get("felt", []):
        place(keys, tremolo(stereo(epiano(note_hz(note), 1.6, vel, seed=sd()), 0.0), 4.0, 0.12), t)

    # ── mix ──
    total = n
    g = duck(total, kicks, depth=0.5, release=0.17)
    gb = duck(total, kicks, depth=0.75, release=0.12)
    pads_ *= g
    bass *= gb
    keys *= duck(total, kicks, depth=0.18, release=0.15)

    ir_big = make_ir(2.6, seed=11, predelay=0.025, damp=5200)
    ir_room = make_ir(0.9, seed=12, predelay=0.008, damp=7000, width=0.8)
    # Section dynamics: the intro and the lift sit lower, so the groove arrives.
    t_all = np.arange(total) / SR
    arc = np.ones(total)
    for name, level in (("keys_pads", 0.55), ("lift", 0.8)):
        a, b = cue["sections"][name]
        t0, t1 = bar_t(a), bar_t(b + 1)
        inside = (t_all >= t0) & (t_all < t1)
        arc[inside] = level
    arc = lowpass(arc, 3.0, 1)  # glide between levels instead of stepping
    keys_bus = highpass(keys, 170) * 0.4 * arc
    keys_bus = peak_eq(keys_bus, 330, -4.5, 0.8)
    keys_bus = peak_eq(keys_bus, 520, -4.5, 0.8)
    keys_bus = peak_eq(keys_bus, 1200, 3.5, 0.7)
    keys_bus = peak_eq(keys_bus, 2600, 1.0, 0.8)
    keys_bus = shelf_high(keys_bus, 6000, -2.0)
    keys_send = wet_only(keys_bus, ir_big) * 0.32 + pingpong(keys_bus, 0.75 * BEAT, 0.33, 5, 3600) * 0.22
    pad_bus = peak_eq(peak_eq(highpass(pads_, 280, 4), 380, -5.0, 0.8), 560, -5.0, 0.8) * 0.13 * arc
    pad_send = wet_only(pad_bus, ir_big) * 0.35
    bass_bus = peak_eq(highpass(bass, 38, 4), 140, 3.0, 0.8) * 0.68
    drum_bus = highpass(drums, 40, 4) * 0.72
    drum_bus = shelf_high(drum_bus, 3500, -7.5)
    drum_send = wet_only(highpass(drums, 400), ir_room) * 0.12
    tops_bus = shelf_high(highpass(tops, 500), 5000, -4.0) * 0.3
    tops_send = pingpong(tops_bus, 0.75 * BEAT, 0.4, 6, 5000) * 0.35 + wet_only(tops_bus, ir_big) * 0.3
    fx_bus = fx * 0.5 + wet_only(highpass(fx, 200), ir_big) * 0.2
    ui_bus = highpass(ui, 300) * 0.5 + wet_only(highpass(ui, 600), ir_room) * 0.06

    mix = keys_bus + keys_send + pad_bus + pad_send + bass_bus + drum_bus + drum_send + tops_bus + tops_send + fx_bus + ui_bus
    mix = highpass(mix, 24, 4)
    mix = compress(mix, threshold_db=-13, ratio=1.8, attack=0.015, release=0.2, makeup_db=1.0)
    # The last bar rings out; fade only the final 0.9 s so the film ends on silence.
    t = np.arange(total) / SR
    fade = np.clip((LENGTH - t) / 0.9, 0, 1) ** 1.5
    mix *= fade
    mix = soft_clip(mix * 0.8, 0.98)
    stems = {"keys": keys_bus + keys_send, "pad": pad_bus + pad_send, "bass": bass_bus, "drums": drum_bus + drum_send, "tops": tops_bus + tops_send, "fx": fx_bus, "ui": ui_bus * fade * 0.8}
    return mix, stems


def mix_cue_clicks(a):
    return json.load(open(a.cue)).get("clicks", []) if a.cue and os.path.exists(a.cue) else []


def write_wav(path, st):
    x = np.clip(st.T, -1, 1)
    wavfile.write(path, SR, (x * (2 ** 31 - 1)).astype(np.int32))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cue", default=os.path.join(os.path.dirname(__file__), "cue.json"))
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "out", "score.wav"))
    a = ap.parse_args()
    cue = {**DEFAULT_CUE, **json.load(open(a.cue))} if a.cue and os.path.exists(a.cue) else DEFAULT_CUE
    mix, stems = render(cue)
    out = os.path.abspath(a.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    raw = out.replace(".wav", ".premaster.wav")
    write_wav(raw, mix)
    stem_dir = os.path.join(os.path.dirname(out), "stems")
    os.makedirs(stem_dir, exist_ok=True)
    for k, v in stems.items():
        write_wav(os.path.join(stem_dir, f"{k}.wav"), v / max(1e-9, np.abs(v).max()) * 0.9)
    raw_mix = mix
    # Master: EBU R128 to -14 LUFS (streaming), true peak -1 dBTP, two passes so it is linear.
    m = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", raw, "-af", "loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = m.stderr[m.stderr.rfind("{"):m.stderr.rfind("}") + 1]
    st = json.loads(js)
    af = (f"loudnorm=I=-14:TP=-1.0:LRA=9:measured_I={st['input_i']}:measured_TP={st['input_tp']}:"
          f"measured_LRA={st['input_lra']}:measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true,aresample=48000")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", af, "-c:a", "pcm_s24le", out], check=True)
    print(f"premaster: I={st['input_i']} LUFS, TP={st['input_tp']} dBTP, LRA={st['input_lra']}")
    chk = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", out, "-af", "loudnorm=print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    js = chk.stderr[chk.stderr.rfind("{"):chk.stderr.rfind("}") + 1]
    st2 = json.loads(js)
    print(f"master: I={st2['input_i']} LUFS, TP={st2['input_tp']} dBTP → {out}")
    # The interface sounds' level in the master: each click's peak, after the master's gain.
    sr, mastered = wavfile.read(out)
    gain = np.sqrt(np.mean((mastered.astype(np.float64) / 2 ** 31) ** 2)) / max(1e-12, np.sqrt(np.mean(raw_mix ** 2)))
    ui_master = stems["ui"] / 0.8 * gain
    for (t, p, g, *label) in mix_cue_clicks(a):
        i0, i1 = int(t * SR), int((t + 0.08) * SR)
        print(f"  tick {t:6.3f}s {20 * np.log10(np.abs(ui_master[:, i0:i1]).max() + 1e-12):6.1f} dBFS  {label[0] if label else ''}")
    for (t, p, g, *label) in json.load(open(a.cue)).get("brushes", []) if os.path.exists(a.cue) else []:
        i0, i1 = int((t - 0.15) * SR), int((t + 0.25) * SR)
        print(f"  air  {t:6.3f}s {20 * np.log10(np.abs(ui_master[:, i0:i1]).max() + 1e-12):6.1f} dBFS  {label[0] if label else ''}")
    spec = out.replace(".wav", "-spectrogram.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-lavfi", "showspectrumpic=s=1600x600:legend=1:scale=log:fscale=log:color=intensity", spec], check=True)
    wave = out.replace(".wav", "-waveform.png")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-filter_complex", "showwavespic=s=1600x300:split_channels=1:colors=0xd9a865|0x8fa6b8", "-frames:v", "1", wave], check=True)


if __name__ == "__main__":
    main()
