# PLC Launchpad

A planning tool for collaborative teacher teams, built on Richard DuFour's PLC at Work model.
Created by John Rose.

## What's in this repository

| Path | What it is |
|---|---|
| `app/` | **PLC Launchpad 1.0**, the rebuilt app. Source in `app/src`; `python3 app/build.py` makes one self-contained page in `app/dist`. |
| `apps-script/` | Runs the app on Google Apps Script for your school: server (`Code.gs`), bridge, build script and [setup guide](apps-script/SETUP.md). `apps-script/dist/` holds the ready-to-paste files. |
| `design/design-system.html` | The design language: color families, icons, plain-language word list. Every screen follows it. |
| `legacy/v0.509.html` | The previous app, kept for reference. |
| `prototype/concept-orbit.html` | The first design concept. |

## How the app is organized

- **Home** is the orbit: this plan's four questions around the team, with where you stopped last week,
  open to-dos, invitations to share and your plans.
- **Plans** take one must-learn skill through 11 steps across the four questions (Learn, Check, Reteach, Stretch).
- **Team time** runs your weekly meeting: timer, attendance, an agenda built from where you stopped,
  notes, decisions, to-dos, and "where did we stop / next time we'll…" at the end.
- **Results** show team totals only. Each teacher sees their own classes; team results stay hidden
  until at least 5 students from 3 teachers are scored.
- **What worked for us** collects teaching strategies. A teacher whose students beat the team on a skill
  is invited to share; sharing, and showing their name, is always their choice.
- **Team** holds members, team agreements and standards. **PLC words** is the glossary.

Color always means a family: blue Learn, orange Check, green Reteach, gold Stretch, purple Team.
