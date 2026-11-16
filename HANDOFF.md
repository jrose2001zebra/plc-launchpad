# Handoff: where the PLC Launchpad work stands (2026-11-16)

Read this first in a new session, then `CLAUDE.md`.

## Repository layout
- `PLC-Launchpad-R03.html`: **the current app**, one self-contained file. The revision (R03) shows in the sidebar footer.
- `r03/`: how R03 was made from v0.509 (`make_r03.py`, `r03.js`, `r03.css`) and what changed (`r03/README.md`).
  From R04 on, edit the R-file directly and rename it to the new revision.
- `legacy/v0.509.html`: John's last ChatGPT-built version, unchanged (source of every feature).
- `checks/`: the test route (see `CLAUDE.md`). Screenshots go to `checks/out/` (not committed).
- `apps-script/`: Google Apps Script hosting. `Code.gs` server, `Bridge.html`, `build.py`, `SETUP.md`; `dist/` holds the
  ready-to-paste files, built from the current R-file. Not yet deployed by John.
- `research/`: PLC research report and notes (how teams build plans, ~40 templates, practice, tools, privacy).
- `app/`, `design/`, `prototype/`: earlier experiments (Launchpad 1.0/2.0, design language, homepage sketches). John
  preferred restructuring his own v0.509 instead; kept for reference only.

## Branches
- `claude/loving-goldberg-mm0mxu`: all work so far, including R03. No `main` branch yet (open question below).

## History
- Early sessions: orbit prototype, research, Apps Script server, Launchpad 1.0 and 2.0 rebuilds. John found the rebuilds
  overwhelming ("too many words and things going on") and asked for the basics first.
- R03 (2026-11-14, John's handoff brief and R02 mockup): v0.509 restructured into five steps per cycle, Plan, Build
  check, Teach (new), Respond, Close (new); Our Home per the R02 mockup; "Our ___" sidebar; "cycle" replaces "PLC plan"
  and "learning cycle"; Plan no longer asks for the assessment name, proficiency rule or baseline (they fill in from
  Build check and the first results); meetings get an agenda from the cycle's current step; Google Forms behind
  "Advanced: connect Google Forms"; schemaVersion 6 (`activities`, `close` per cycle, v1–v5 migrate on load). All six
  acceptance checks pass (`checks/`). Apps Script `dist/` rebuilt from R03.

## Known gaps
- Zava's narration clips (`/audio/zava-*.mp3`) lived on the old ChatGPT host and are not in the file, so Listen to Zava
  is silent offline. The Onshape project has John's Zava voice recipe (`docs/narration/ZAVA.md`,
  `tools/make_narration.py` in onshape-source) that could regenerate them.
- The Worked/Tweak control on activity cards is taller than the mockup's pill (v0.509's global select styles).
- Creating a Google Forms quiz was not tested (needs a real Google account); its controls are present and wired.

## Ways of working that John likes
- Plain English, progress as percentages; John is a school administrator, not a programmer.
- Restructure, don't rewrite: keep every feature and the existing look (navy sidebar, rocket logo, Inter, existing icons,
  card styles, color families).
- Simple and welcoming over complete; one clear next step; plain words with the PLC term taught alongside.
- Questions go in the list below, not only in chat. John answers them here or in chat; move answered ones into History.

## Open questions for John
1. Zava's guided flow keeps its own five-part bar (Choose Standard · Define Learning · SMART Goal · Prepare Assessment ·
   Review) inside the cycle's Plan and Build check steps, under the new five-step bar. Hide it, relabel it to match the
   cycle steps, or keep it?
2. Zava's voice: can you upload the `zava-*.mp3` clips from the old site, or should we regenerate them with your Zava
   recipe from the Onshape project?
3. The Plan step opens the SMART goal builder for an existing cycle. Should it open Zava's guided questions instead?
4. Should we create a `main` branch from R03 so the repository has a clear "current" line?
5. The Launchpad 1.0/2.0 experiments (`app/`, `design/`, `prototype/`): keep for reference or delete?
6. Once you have looked at R03: anything to change on Our Home or the Teach step before R04?
