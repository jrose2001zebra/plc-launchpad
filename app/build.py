#!/usr/bin/env python3
"""Build PLC Launchpad into single files.

    python3 app/build.py

dist/index.html     full page (used by the Apps Script build)
dist/preview.html   same page without the document wrapper (for an artifact preview)
"""
import json
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
SRC, DIST = HERE / 'src', HERE / 'dist'
SCRIPTS = ['core.js', 'ui.js', 'views-plan.js', 'views-team.js']


def main() -> None:
    js = '(function(){\n' + '\n'.join((SRC / f).read_text(encoding='utf-8') for f in SCRIPTS) + '\n})();'
    js = js.replace("'use strict';", '', 1).replace('(function(){\n', "(function(){\n'use strict';\n", 1)
    if '</script' in js.lower():
        sys.exit('build stopped: a script contains "</script"')
    catalogs = json.dumps(json.loads((SRC / 'catalogs.json').read_text(encoding='utf-8')), separators=(',', ':')).replace('</', '<\\/')
    page = (SRC / 'shell.html').read_text(encoding='utf-8')
    page = page.replace('/*STYLES*/', (SRC / 'styles.css').read_text(encoding='utf-8'))
    page = page.replace('/*CATALOGS*/', catalogs).replace('/*SCRIPT*/', js)
    DIST.mkdir(exist_ok=True)
    (DIST / 'preview.html').write_text(page, encoding='utf-8')
    head, rest = page.split('<div id="app">', 1)
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '')
            + '</head>\n<body>\n<div id="app">' + rest + '\n</body>\n</html>\n')
    (DIST / 'index.html').write_text(full, encoding='utf-8')
    tmp = DIST / '_check.js'
    tmp.write_text(js, encoding='utf-8')
    ok = subprocess.run(['node', '--check', str(tmp)], capture_output=True, text=True)
    tmp.unlink()
    if ok.returncode:
        sys.exit('build stopped: script error\n' + ok.stderr)
    print(f'built dist/index.html ({len(full):,} bytes)')


if __name__ == '__main__':
    main()
