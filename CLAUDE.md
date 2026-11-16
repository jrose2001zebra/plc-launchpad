# For Claude Code

Read `HANDOFF.md` first (where the work stands and open questions for John), then `r03/README.md` (what R03 changed).
John is not a programmer: report progress as percentages and results in plain English.

## Every delivery
1. Raise the revision by 1 (R03 → R04 …): rename the file `PLC-Launchpad-Rxx.html` and update the sidebar footer
   (`<span class="version">Rxx</span>`) and the `<title>`.
2. Keep it one self-contained HTML file, no build step. Keep every existing feature and the existing look.
3. Never lose data: bump `schemaVersion` only with a migration in `normalize()`, and keep old backups importable.
4. Run the route from the repository root and report the results:
   - `node checks/r03walk.cjs`: fresh start through Plan → Build check → Teach → Respond → Close → next cycle.
   - `node checks/r03import.cjs`: a v0.509 workspace opens and imports with nothing lost; old terms absent.
   Update the file name inside the checks when the revision changes.
5. Rebuild Apps Script: `python3 apps-script/build.py` (edit the source file name in it when the revision changes).
6. Update `HANDOFF.md`: History, Known gaps, and **Open questions for John**. Put questions there, not only in chat.
7. Commit and push to the working branch.
