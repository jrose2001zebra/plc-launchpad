# Handoff: where the PLC Launchpad work stands (2026-11-18)

Read this first in a new session, then `CLAUDE.md`.

## Repository layout
- `PLC-Launchpad-R04.html`: **the current app**, one self-contained file (6 MB with Zava's voice). The revision shows in
  the sidebar footer.
- `narration/zava/`: Zava's 49 clips (`manifest.json` has each line); `tools/make_zava_clips.py` records them with
  John's Zava recipe, `tools/embed_zava_clips.py` builds them into the app.
- `r03/`: how R03 was made from v0.509 (`make_r03.py`, `r03.js`, `r03.css`) and what changed (`r03/README.md`).
  From R04 on, edit the R-file directly and rename it to the new revision.
- `legacy/v0.509.html`: John's last ChatGPT-built version, unchanged (source of every feature).
- `checks/`: the test route, `walk.cjs` and `import.cjs` (see `CLAUDE.md`). Screenshots go to `checks/out/` (not committed).
- `apps-script/`: Google Apps Script hosting. `Code.gs` server, `Bridge.html`, `build.py`, `SETUP.md`; `dist/` holds the
  ready-to-paste files, built from the current R-file. Not yet deployed by John.
- `research/`: PLC research report and notes (how teams build plans, ~40 templates, practice, tools, privacy).
- `app/`, `design/`, `prototype/`: earlier experiments (Launchpad 1.0/2.0, design language, homepage sketches). John
  preferred restructuring his own v0.509 instead; kept for reference only.

## Branches
- `main`: the current version (created from R04 on John's answer, 2026-11-18).
- `claude/loving-goldberg-mm0mxu`: the working branch; pushed to `main` when John approves a delivery.

## History
- Early sessions: orbit prototype, research, Apps Script server, Launchpad 1.0 and 2.0 rebuilds. John found the rebuilds
  overwhelming ("too many words and things going on") and asked for the basics first.
- R03 (2026-11-14, John's handoff brief and R02 mockup): v0.509 restructured into five steps per cycle, Plan, Build
  check, Teach (new), Respond, Close (new); Our Home per the R02 mockup; "Our ___" sidebar; "cycle" replaces "PLC plan"
  and "learning cycle"; Plan no longer asks for the assessment name, proficiency rule or baseline (they fill in from
  Build check and the first results); meetings get an agenda from the cycle's current step; Google Forms behind
  "Advanced: connect Google Forms"; schemaVersion 6 (`activities`, `close` per cycle, v1–v5 migrate on load). All six
  acceptance checks pass (`checks/`). Apps Script `dist/` rebuilt from R03.
- John's answers (2026-11-18, questions 1–6): relabel Zava's bar to the cycle steps; regenerate Zava's voice with his
  recipe; Plan opens Zava's guided questions; create `main`; keep the 1.0/2.0 experiments; hadn't reviewed R03 yet.
- R04 (2026-11-18): Zava's bars read "Plan · Standard / Learning / SMART goal, Build check · Assessment / Review" and,
  in the assessment builder, "Build check · Approach / Questions / Scoring / Ready"; the Plan step opens Zava's guided
  questions (where the team left off, or Review once Plan is complete); Zava's 49 clips regenerated with John's
  recipe and built in (3.5 MB), so Listen to Zava works offline. All checks pass. `main` created from R04.

## Known gaps
- With Zava's voice built in, the Apps Script version is 24 pieces to paste. John's answer (question 7, 2026-11-23):
  decide later, when he is ready to set up the school site. Options then: voice off at first (5 pieces), clasp, or paste all 24.
- The Worked/Tweak control on activity cards is taller than the mockup's pill (v0.509's global select styles).
- Creating a Google Forms quiz was not tested (needs a real Google account); its controls are present and wired.

## Ways of working that John likes
- Plain English, progress as percentages; John is a school administrator, not a programmer.
- Restructure, don't rewrite: keep every feature and the existing look (navy sidebar, rocket logo, Inter, existing icons,
  card styles, color families).
- Simple and welcoming over complete; one clear next step; plain words with the PLC term taught alongside.
- Questions go on the questions page, like the Onshape project: https://claude.ai/artifact/9ZHeYuKNNLY4myM1n7hzgV
  (`questions/questions.html`, db collection `questions`, docs `q1`, `q2`… with `n`, `topic`, `text`, lettered `options`,
  `answer`, `note`). John taps an answer and replies "Answered"; read the answers with ArtifactData, act on them, record
  them in History. Report as: 🔴 N questions waiting (#a–b): link.
- When new questions are added, also send John a push notification (he said yes, 2026-11-18): one line with the
  count and numbers.

## Open questions for John (also on the questions page)
6. After looking at R04: anything to change on Our Home or the Teach step? (John hasn't looked yet, 2026-11-18)
