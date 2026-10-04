"""
Cuts the exploded view's parts out of the campaign still.

    pip install "rembg[cpu]" opencv-python-headless pillow numpy
    python3 parts.py            # every part, into parts/
    python3 parts.py mango      # one crop (a key of CROPS)

Masks come from BiRefNet (rembg's "birefnet-general", about 1 GB, downloaded on
first run). Each crop runs in its own process: BiRefNet holds on to its memory,
and a second crop in the same process can be killed for running out of it.
"""

import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "../../../public/images/hero-mango-eclipse.jpg"  # 2400 × 1357
OUT = HERE / "parts"

# Crops of the still, (left, top, right, bottom) in source px.
CROPS = {
    "bottle": (1050, 200, 1800, 1150),
    "jasmineA": (1420, 130, 1780, 430),
    "jasmineB": (2060, 600, 2400, 1010),
    "jasmineC": (1420, 1080, 1700, 1340),
    "petal1": (1630, 0, 1970, 280),
    "petal2": (1590, 400, 1990, 880),
    "petal3": (1970, 585, 2290, 865),
    "petal4": (945, 1100, 1240, 1357),
    "honeycomb": (1660, 830, 2190, 1290),
    "mango": (1700, 0, 2400, 760),
}
_session = None


def mask(name):
    """The crop as RGB and BiRefNet's alpha for it (0–1)."""
    global _session
    from rembg import new_session, remove

    if _session is None:
        _session = new_session("birefnet-general")
    crop = Image.open(SOURCE).convert("RGB").crop(CROPS[name])
    alpha = np.asarray(remove(crop, session=_session, only_mask=True), dtype=np.float32) / 255
    return np.asarray(crop), alpha


def largest(binary):
    n, lab, stats, _ = cv2.connectedComponentsWithStats(binary.astype(np.uint8))
    return lab == 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]) if n > 1 else binary.astype(bool)


def save(rgb, alpha, name):
    a = np.clip(alpha * 255, 0, 255).astype(np.uint8)
    a[a < 8] = 0
    img = Image.fromarray(np.dstack([rgb, a]))
    img.crop(img.getbbox()).save(OUT / f"{name}.png")
    print(name, img.getbbox())


def bottle():
    rgb, alpha = mask("bottle")
    alpha[:112] = 0  # the honey stream falling onto the cap; the drip on the cap stays
    upright = Image.fromarray(np.dstack([rgb, (alpha * 255).astype(np.uint8)]))
    upright = upright.rotate(-8.5, resample=Image.BICUBIC, expand=True)  # the still lies the bottle at 8.5°
    upright = upright.crop(upright.getbbox())
    a = np.asarray(upright).copy()
    solid = a[..., 3] > 128
    widths = solid.sum(1)
    shoulder = int(np.argmax(widths > 338))  # the cap is ~328 px wide, the glass ~495
    cols = np.where(solid[shoulder - 20])[0]
    cap, glass = a.copy(), a.copy()
    cap[shoulder + 4 :, :, 3] = 0
    cap[:, : cols[0] - 3, 3] = 0  # keep only the cap's own columns: no sliver of glass rim
    cap[:, cols[-1] + 4 :, 3] = 0
    glass[: shoulder + 4, :, 3] = 0
    for part, arr in (("cap", cap), ("glass", glass)):
        save(arr[..., :3], arr[..., 3] / 255, part)


def jasmineB():
    """Two flowers in one crop; the second runs off the still's edge, so only the first is used."""
    rgb, alpha = mask("jasmineB")
    n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 40 / 255).astype(np.uint8))
    first = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
    keep = cv2.dilate((lab == first).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    save(rgb, np.where(keep, alpha, 0), "jasmineB1")


def petal1():
    """A sliver of mango shares this crop: keep the red only."""
    rgb, alpha = mask("petal1")
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    red = (((hsv[..., 0] < 10) | (hsv[..., 0] > 160)) & (hsv[..., 1] > 60)).astype(np.uint8)
    red = largest(cv2.morphologyEx(red, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))).astype(np.uint8)
    red = cv2.morphologyEx(red, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
    fill = red.copy()
    cv2.floodFill(fill, np.zeros((red.shape[0] + 2, red.shape[1] + 2), np.uint8), (0, 0), 1)
    red = cv2.GaussianBlur((red | (1 - fill)).astype(np.float32), (5, 5), 0)
    save(rgb, np.minimum(alpha, red), "petal1")


def mango():
    """The mango half runs off the still's top and right edges, so it is cut along its own grooves."""
    rgb, alpha = mask("mango")
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]

    # The wedge: everything left of one cross-groove, so every edge is skin or a clean cut.
    (x0, y0), (x1, y1) = (380, 30), (660, 480)
    left_of_groove = ((x1 - x0) * (yy - y0) - (y1 - y0) * (xx - x0)) > 0
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    flesh = (hsv[..., 0] >= 8) & (hsv[..., 0] <= 32) & (hsv[..., 1] > 120)
    k = cv2.morphologyEx(((alpha > 0.5) & left_of_groove & flesh).astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    k = cv2.morphologyEx(largest(k).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    k = alpha * k
    k = cv2.GaussianBlur(k.astype(np.float32), (3, 3), 0)
    solid = (k > 0.5).astype(np.uint8)
    opened = cv2.morphologyEx(solid, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71)))
    solid = np.where(yy > 560, opened, solid)  # purée drips under the skin
    solid[:28] = 0  # where it met the still's top edge
    edge = cv2.GaussianBlur(largest(solid).astype(np.float32), (5, 5), 0)
    save(rgb, np.minimum(k, edge), "mango")

    # Loose cubes: cells of the groove grid (Hough-fitted lines, as (angle°, rho) in crop px).
    def line(deg, rho):
        t = np.radians(deg)
        return np.array([np.cos(t), np.sin(t), -rho])

    def meet(a, b):
        p = np.cross(a, b)
        return p[:2] / p[2]

    along = [line(54, 300), line(52, 465), line(50, 632)]
    across = [line(145, -5), line(145, -150), line(145, -290), line(145, -430)]
    cell = 0
    for i in range(len(along) - 1):
        for j in range(len(across) - 1):
            pts = np.array([meet(along[i], across[j]), meet(along[i], across[j + 1]), meet(along[i + 1], across[j + 1]), meet(along[i + 1], across[j])])
            c = pts.mean(0)
            if not (0 < c[0] < w and 0 < c[1] < h):
                continue
            cell += 1
            if cell not in (2, 4, 5, 6):  # the cells that are whole cubes
                continue
            inset = c + (pts - c) * 0.94  # stay inside the groove
            m = np.zeros((h, w), np.uint8)
            cv2.fillPoly(m, [np.round(inset * 4).astype(np.int32)], 255, lineType=cv2.LINE_AA, shift=2)
            m = cv2.GaussianBlur(m, (5, 5), 0).astype(np.float32) / 255 * alpha
            save(rgb, m, f"cube{cell}")


def main():
    OUT.mkdir(exist_ok=True)
    wanted = sys.argv[1:]
    if not wanted:
        for name in CROPS:
            subprocess.run([sys.executable, __file__, name], check=True)
        return
    for name in wanted:
        cut = globals().get(name)
        if cut:
            cut()
        else:  # a crop that needs nothing beyond its mask
            save(*mask(name), name)


if __name__ == "__main__":
    main()
