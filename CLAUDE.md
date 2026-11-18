# For Claude Code

Read `HANDOFF.md` first (where the work stands and open questions for John), then `r03/README.md` (what R03 changed).
The current app is the newest `PLC-Launchpad-Rxx.html` at the repository root; edit it directly.
John is not a programmer: report progress as percentages and results in plain English.

## Every delivery
1. Raise the revision by 1 (R03 → R04 …): rename the file `PLC-Launchpad-Rxx.html` and update the sidebar footer
   (`<span class="version">Rxx</span>`) and the `<title>`.
2. Keep it one self-contained HTML file, no build step. Keep every existing feature and the existing look.
3. Never lose data: bump `schemaVersion` only with a migration in `normalize()`, and keep old backups importable.
4. Run the route from the repository root and report the results:
   - `node checks/walk.cjs`: fresh start through Plan → Build check → Teach → Respond → Close → next cycle, plus
     Zava's bar labels, the Plan step and Zava's voice.
   - `node checks/import.cjs`: a v0.509 workspace opens and imports with nothing lost; old terms absent.
   Update the file name inside the checks when the revision changes.
5. If Zava's text changed: `python3 tools/make_zava_clips.py <app>` then `python3 tools/embed_zava_clips.py <app>`.
6. Rebuild Apps Script: `python3 apps-script/build.py` (edit the source file name in it when the revision changes).
7. Update `HANDOFF.md`: History and Known gaps. New questions for John go on the questions page
   (https://claude.ai/artifact/9ZHeYuKNNLY4myM1n7hzgV, next number after the last) and in HANDOFF's list; end the
   report with: 🔴 N questions waiting (#a–b): link. When John says "Answered", read them with ArtifactData.
   When new questions are added, also send a push notification (John asked for it).
8. Commit and push to the working branch.
