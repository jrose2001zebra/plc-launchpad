#!/usr/bin/env python3
"""Make Zava's narration clips for the guided plan, in John's voice recipe.

    python3 tools/make_zava_clips.py PLC-Launchpad-R04.html

Reads Zava's step text (`zavaCoachContent` in the app) and records each step's `explain` line with
the recipe from the Onshape project (onshape-source docs/narration/ZAVA.md):
  edge-tts en-US-AvaNeural, rate -5%, pitch -6Hz, then ffmpeg cleanup, mono 24 kHz 48 kbps MP3.
Clips go to narration/zava/<step>.mp3 with manifest.json (step -> line, hash, seconds). Running it again
only records lines that are new or changed. In the cloud workspace edge-tts goes through $HTTPS_PROXY.
Then `python3 tools/embed_zava_clips.py <app>` builds the clips into the app file.
"""
import hashlib, json, os, re, subprocess, sys, tempfile
from pathlib import Path

VOICE = ['--voice', 'en-US-AvaNeural', '--rate=-5%', '--pitch=-6Hz']
FILTER = ('silenceremove=start_periods=1:start_threshold=-50dB,equalizer=f=220:t=q:w=1:g=2.5,'
          'equalizer=f=7000:t=q:w=1:g=-2.5,loudnorm=I=-16:TP=-1.5')
OUTPUT = ['-ac', '1', '-ar', '24000', '-b:a', '48k']
RECIPE = json.dumps({'voice': VOICE, 'filter': FILTER, 'output': OUTPUT})
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'narration' / 'zava'


def coach_content(html: str) -> dict:
    start = html.index('const zavaCoachContent=')
    i = html.index('{', start)
    depth = 0
    for k in range(i, len(html)):
        depth += {'{': 1, '}': -1}.get(html[k], 0)
        if depth == 0:
            return json.loads(html[i:k + 1])
    raise SystemExit('zavaCoachContent not found')


def spoken(text: str) -> str:
    t = re.sub(r'[“”"«»]', '', text).replace('’', "'").replace('‘', "'")
    t = re.sub(r'\s*[—–]\s*', ', ', t).replace('·', ',').replace('%', ' percent').replace('&', ' and ')
    return re.sub(r'\s+', ' ', t).strip()


def record(line: str, dest: Path) -> None:
    env = dict(os.environ)
    proxy = ['--proxy', env['HTTPS_PROXY']] if env.get('HTTPS_PROXY') else []
    if Path('/root/.ccr/ca-bundle.crt').exists():
        env.setdefault('SSL_CERT_FILE', '/root/.ccr/ca-bundle.crt')
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / 'raw.mp3'
        subprocess.run(['edge-tts', *proxy, *VOICE, '--text', line, '--write-media', str(raw)], check=True, env=env,
                       capture_output=True)
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(raw), '-af', FILTER, *OUTPUT, str(dest)], check=True)


def seconds(path: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 2)


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    content = coach_content(Path(sys.argv[1]).read_text(encoding='utf-8'))
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    made = 0
    for key, value in content.items():
        line = spoken(value.get('explain', ''))
        if not line:
            continue
        digest = hashlib.sha1((RECIPE + line).encode()).hexdigest()[:12]
        dest = OUT / f'{key}.mp3'
        if manifest.get(key, {}).get('hash') == digest and dest.exists():
            continue
        record(line, dest)
        manifest[key] = {'line': line, 'hash': digest, 'seconds': seconds(dest)}
        made += 1
        print(f'recorded {key} ({manifest[key]["seconds"]} s)')
    for key in list(manifest):
        if key not in content:
            (OUT / f'{key}.mp3').unlink(missing_ok=True)
            del manifest[key]
    manifest_path.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    total = sum(p.stat().st_size for p in OUT.glob('*.mp3'))
    print(f'{made} recorded, {len(manifest)} clips, {total / 1e6:.1f} MB')


if __name__ == '__main__':
    main()
