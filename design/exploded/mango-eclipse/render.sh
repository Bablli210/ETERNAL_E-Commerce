#!/usr/bin/env bash
# Renders index.html with headless Chromium (no Node dependencies).
#   ./render.sh                                   the four finals in out/ (JPEG, needs python3 + Pillow)
#   ./render.sh <portrait|wide> [scale] [out.png] ["&clean"]   one PNG
set -euo pipefail
cd "$(dirname "$0")"

shell="${CHROMIUM_HEADLESS_SHELL:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)}"

shot() { # format scale out.png [extra query]
  local size
  case "$1" in
    portrait) size="1088,1360" ;;
    wide)     size="1920,1080" ;;
    *) echo "unknown format: $1" >&2; exit 1 ;;
  esac
  "$shell" --no-sandbox --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --force-device-scale-factor="$2" --window-size="$size" --virtual-time-budget=8000 \
    --screenshot="$3" "file://$PWD/index.html?format=$1${4:-}" 2>/dev/null
}

if [ $# -gt 0 ]; then
  out="${3:-out/$1.png}"
  shot "$1" "${2:-1}" "$out" "${4:-}"
  echo "$out"
  exit 0
fi

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
mkdir -p out
# 4:5 at 1.5× (1632 × 2040) keeps the glass at its cut-out's own resolution; 16:9 at 1.25× is 2400 × 1350, the still's width.
shot portrait 1.5  "$tmp/mango-eclipse-exploded-4x5.png"
shot portrait 1.5  "$tmp/mango-eclipse-exploded-4x5-clean.png" "&clean"
shot wide     1.25 "$tmp/mango-eclipse-exploded-16x9.png"
shot wide     1.25 "$tmp/mango-eclipse-exploded-16x9-clean.png" "&clean"
python3 - "$tmp" <<'PY'
import sys
from pathlib import Path
from PIL import Image
for png in sorted(Path(sys.argv[1]).glob("*.png")):
    out = Path("out") / (png.stem + ".jpg")
    Image.open(png).convert("RGB").save(out, quality=90, optimize=True, progressive=True, subsampling=0)
    print(out)
PY
