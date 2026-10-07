import base64, re, sys
import os
root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
here = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
t = open(f"{here}/template.html").read()
b64 = lambda p: base64.b64encode(open(p, "rb").read()).decode()
t = t.replace("{{FONT_GENERAL}}", b64(f"{root}/app/fonts/general-sans/GeneralSans-Regular.woff2"))
t = t.replace("{{FONT_CABINET}}", b64(f"{root}/app/fonts/cabinet-grotesk/CabinetGrotesk-Regular.woff2"))
paths = open(f"{root}/components/ui/brand-paths.ts").read()
m = re.search(r'eternal:\s*"([^"]+)"', paths)
t = t.replace("{{LOGO_PATH}}", m.group(1))
assert "{{" not in t
open(f"{here}/eternal-performance.html", "w").write(t)
print(len(t))
