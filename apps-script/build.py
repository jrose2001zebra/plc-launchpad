#!/usr/bin/env python3
"""Build the Apps Script project from PLC-Launchpad-R03.html (the current app).

    python3 apps-script/build.py

Writes apps-script/dist/: the files to put in the Apps Script project (by hand or with clasp).
PLC-Launchpad-R03.html stays the single source of the app; this script only adapts a copy of it:
  * each edit below must match the expected number of times, or the build stops, so an app
    change that moves one of these lines is caught instead of silently breaking the page;
  * the page is split into Page1.html, Page2.html, ... so no single Apps Script file is huge.
"""
import json
import pathlib
import re
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
DIST = HERE / 'dist'
CHUNK = 240_000  # characters per Page file

# (find, replace, expected count). Order matters: specific edits before general ones.
EDITS = [
    # Read ?shared / ?course / ?manage from the address the server saw, not the frame's own address.
    ("const query=new URLSearchParams(location.search);",
     "const query=new URLSearchParams(window.__PLC.search);", 1),
    # Wait for the bridge to copy in the #/route before the app reads it.
    ("(async function launch(){\n'use strict';\n",
     "(async function launch(){\n'use strict';\nawait window.__PLC.ready;\n", 1),
    # Links the app builds point at the deployed web app.
    ("new URL(location.pathname,location.origin)", "new URL(window.__PLC.execUrl)", 4),
    ("link.href=location.pathname+'?manage='+teamWorkspaceId",
     "link.href=window.__PLC.execUrl+'?manage='+teamWorkspaceId", 1),
    ("location.assign(location.pathname+'?manage='", "plcNavigate('?manage='", 1),
    # Page changes reload at the top level, not inside the Apps Script frame.
    ("location.assign(", "plcNavigate(", 6),
    ("location.reload()", "plcReload()", 7),
    # A team that has never saved gets a blank workspace built by the page.
    ("if(cloudPayload.catalogId!==catalogId||!validate(cloudPayload.state)){throw Error('Invalid workspace')}",
     "if(cloudPayload.fresh){cloudPayload={subject:cloudPayload.subject,catalogId,state:JSON.parse(JSON.stringify(state))}}"
     "else if(cloudPayload.catalogId!==catalogId||!validate(cloudPayload.state)){throw Error('Invalid workspace')}", 1),
    # Uploaded files live in Drive.
    ("return /^[a-f0-9-]{36}$/.test(r.workspaceId||'')&&/^[a-f0-9-]{36}$/.test(r.fileId||'')?'/api/resources/'+r.workspaceId+'/'+r.fileId:'';",
     "return r.driveId&&/^[\\w-]{10,}$/.test(r.driveId)?'https://drive.google.com/file/d/'+encodeURIComponent(r.driveId)+'/view':'';", 1),
    ("esc(resourceURL({...i.graphic,kind:'file'})+'?preview=1')", "esc(plcPreview(i.graphic))", 1),
    ("fetch(resourceURL({...item.graphic,kind:'file'})+'?preview=1')",
     "fetch('/api/file/'+encodeURIComponent(item.graphic.driveId||''))", 1),
]


def adapt(html: str) -> str:
    for find, replace, expected in EDITS:
        found = html.count(find)
        if found != expected:
            sys.exit(f'build stopped: expected {expected} of {find[:70]!r} in PLC-Launchpad-R03.html, found {found}')
        html = html.replace(find, replace)
    # Drop the hosting provider's injected script at the end of the page (not part of the app).
    html, dropped = re.subn(r'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?</script>', '', html, flags=re.S)
    if dropped > 1:
        sys.exit('build stopped: more than one injected script matched')
    if '<?' in html:
        sys.exit('build stopped: index.html contains "<?", which Apps Script templates would misread')
    return html


def main() -> None:
    html = adapt((ROOT / 'PLC-Launchpad-R03.html').read_text(encoding='utf-8'))
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
    shutil.copy(ROOT / 'quiz-connector.txt', DIST / 'QuizConnector.html')

    files = sorted(p.name for p in DIST.iterdir())
    (DIST / 'FILES.txt').write_text(
        'Files for the Apps Script project, built from index.html by apps-script/build.py.\n'
        'In the Apps Script editor, create each one with the same name (without .html/.gs) and paste its contents.\n\n'
        + '\n'.join(f'{name}  ({(DIST / name).stat().st_size:,} bytes)' for name in files) + '\n', encoding='utf-8')
    print(json.dumps({'files': files, 'pages': len(chunks)}, indent=1))


if __name__ == '__main__':
    main()
