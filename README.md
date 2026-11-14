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

The homepage is a launchpad with four doors:

- **Plans:** continue the current plan, build a new one, or see all plans. A plan opens as a checklist of
  DuFour's four questions; each item opens one question on its own screen with **Save and continue**.
- **Meetings:** start this week's 45-minute meeting (agenda, notes, decisions, to-dos, where you stopped),
  past meetings and to-dos.
- **Assessments & Results:** enter scores, build or edit each plan's common assessment, team results,
  and **What worked for us**. Team totals stay hidden until 5 students from 3 teachers are scored; a teacher
  whose students beat the team on a skill is invited to share what they did, and chooses whether to.
- **Team settings:** members, norms and standards.

Help and PLC words are one link below the doors.
