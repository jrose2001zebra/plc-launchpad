#!/usr/bin/env python3
"""Build Zava's clips (narration/zava/*.mp3) into the app file.

    python3 tools/embed_zava_clips.py PLC-Launchpad-R04.html

Writes them as one <script type="application/json" id="zavaClips"> block (step -> base64 MP3), replacing
the block if it is already there. The app's zavaClip(step) reads it when Zava is played.
"""
import base64, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ROOT / 'narration' / 'zava'


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    app = Path(sys.argv[1])
    html = app.read_text(encoding='utf-8')
    manifest = json.loads((CLIPS / 'manifest.json').read_text())
    data = {key: base64.b64encode((CLIPS / f'{key}.mp3').read_bytes()).decode() for key in manifest}
    block = '<script type="application/json" id="zavaClips">' + json.dumps(data, separators=(',', ':')) + '</script>'
    if 'id="zavaClips"' in html:
        html = re.sub(r'<script type="application/json" id="zavaClips">.*?</script>', lambda m: block, html, count=1, flags=re.S)
    else:
        anchor = '<script id="catalog" type="application/json">'
        if html.count(anchor) != 1:
            raise SystemExit('catalog script not found')
        html = html.replace(anchor, block + anchor, 1)
    app.write_text(html, encoding='utf-8')
    print(f'embedded {len(data)} clips ({sum(map(len, data.values())) / 1e6:.1f} MB as text) in {app.name}')


if __name__ == '__main__':
    main()
