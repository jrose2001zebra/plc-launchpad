#!/usr/bin/env python3
"""Build the Apps Script project from the app (app/src, built by app/build.py).

    python3 apps-script/build.py

Writes apps-script/dist/: the files to put in the Apps Script project (by hand or with clasp).
The app is built first, then split into Head.html (styles and markup) and Page files (scripts),
with Bridge.html placed between them so it runs before the app.
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
DIST = HERE / 'dist'
CHUNK = 240_000  # characters per Page file

def adapt(html: str) -> str:
    if '<?' in html:
        sys.exit('build stopped: the app contains "<?", which Apps Script templates would misread')
    return html


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / 'app' / 'build.py')], check=True)
    html = adapt((ROOT / 'app' / 'dist' / 'index.html').read_text(encoding='utf-8'))
    head_end = html.index('<script')  # everything before the first script: styles and markup
    head, rest = html[:head_end], html[head_end:]
    chunks = [rest[i:i + CHUNK] for i in range(0, len(rest), CHUNK)]

    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()
    (DIST / 'Head.html').write_text(head, encoding='utf-8')
    for n, chunk in enumerate(chunks, 1):
        (DIST / f'Page{n}.html').write_text(chunk, encoding='utf-8')
    index = ("<?!= include('Head') ?>"
             "<script>window.__PLC=<?!= boot ?>;</script>"
             "<?!= include('Bridge') ?>"
             + ''.join(f"<?!= include('Page{n}') ?>" for n in range(1, len(chunks) + 1)))
    (DIST / 'Index.html').write_text(index, encoding='utf-8')
    shutil.copy(HERE / 'Code.gs', DIST / 'Code.gs')
    shutil.copy(HERE / 'Bridge.html', DIST / 'Bridge.html')
    shutil.copy(HERE / 'appsscript.json', DIST / 'appsscript.json')

    files = sorted(p.name for p in DIST.iterdir())
    (DIST / 'FILES.txt').write_text(
        'Files for the Apps Script project, built from index.html by apps-script/build.py.\n'
        'In the Apps Script editor, create each one with the same name (without .html/.gs) and paste its contents.\n\n'
        + '\n'.join(f'{name}  ({(DIST / name).stat().st_size:,} bytes)' for name in files) + '\n', encoding='utf-8')
    print(json.dumps({'files': files, 'pages': len(chunks)}, indent=1))


if __name__ == '__main__':
    main()
