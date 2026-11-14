# R03: five-step cycle restructure

R03 is v0.509 restructured, not rewritten. Every v0.509 feature is still there, moved into one
five-step cycle: **Plan → Build check → Teach → Respond → Close**.

The app is the single file `PLC-Launchpad-R03.html` at the repository root. From R03 on, edit that
file directly. This folder records how it was made from `legacy/v0.509.html`:

- `make_r03.py`: the checked edits to v0.509 (each must match a set number of times), the R03 code
  inserted just before the app draws its first page, and the "cycle" wording.
- `r03.js`, `r03.css`: the R03 code and styles that were inserted.

## What changed

| Area | R03 |
|---|---|
| Sidebar | Our Home · Our Cycles · Our Activities (new) · Our Standards · Our Meetings · Our Team, plus PLC Glossary. Footer shows the revision (R03). |
| Our Home | R02 layout: "Where we are" card with the current step's button and the five-step stepper; Our Next Meeting, Our Activities, Our Results and Our Follow-ups cards; cycle switcher when there are several. The Plan Folders card moved to Our Cycles. |
| Cycle pages | Every cycle page (Zava's guided plan, SMART goal builder, assessment builder, scorebook, results) shows the five-step bar on top. Plan opens the goal builder, Build check the common assessment, Respond the results (or the scorebook before results). |
| Teach (new) | Shared activity library per cycle: target, link or notes (files and photos in an online workspace), what to look for, who used it, and Worked / Tweak / Dropped. After Respond each activity shows how students did on its target (hidden until 5 students from 3 teachers). |
| Close (new) | How we did against the goal, keep / refine / replace for each activity and each shared strategy, what we learned, close the cycle, and start the next cycle carrying over the standard, targets and kept activities. |
| Order fix | Plan no longer asks for the assessment name, proficiency rule or baseline. They fill in from the common check and the first results. The "Use this assessment for the SMART goal" button is gone. |
| Meetings | A new meeting's title and agenda come from the active cycle's current step, plus follow-ups due. Items link to the cycle. |
| Google Forms | Behind "Advanced: connect Google Forms" in the assessment builder (opens automatically in Zava's Google Forms step). |
| Wording | "PLC plan" and "learning cycle" are now "cycle" everywhere. |
| Data | schemaVersion 6 adds `activities` and `close` to each cycle. v1–v5 workspaces and backups load and are migrated on load. |

## Known gaps

- Zava's narration clips (`/audio/zava-*.mp3`) were served by the old ChatGPT host and are not in
  the file, so "Listen to Zava" is silent when the file is opened on its own.
- Zava's guided flow keeps its own step bar (Choose Standard · Define Learning · SMART Goal ·
  Prepare Assessment · Review) inside the cycle's Plan and Build check steps.
