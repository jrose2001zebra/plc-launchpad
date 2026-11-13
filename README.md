# PLC Launchpad

A planning tool for collaborative teacher teams, built on Richard DuFour's PLC at Work model.
Created by John Rose.

## What's in this repository

| Path | What it is |
|---|---|
| `index.html` | The live app (v0.509), copied unchanged from the current site. The whole front end is in this one file. |
| `quiz-connector.txt` | Google Apps Script the app hands to a PLC coordinator to connect Google Forms quizzes to results. |
| `apps-script/` | The Google Apps Script version: server (`Code.gs`), bridge, build script and [setup guide](apps-script/SETUP.md). `apps-script/dist/` holds the ready-to-paste files. |
| `design/design-system.html` | The design language: color families, icons, plain-language word list and the home screen layout. Every redesigned screen follows it. |
| `prototype/concept-orbit.html` | Design concept for the redesign: the four questions as an orbit, a narrated animated tour, plan-once linked fields, and a ready board. |

## Hosting

The current site saves through server routes on its ChatGPT host, and that server code is not
available. `apps-script/` replaces it: Launchpad runs from Google Apps Script, limited to your
school's Google domain, with all data in the deploying account's Drive.
See [apps-script/SETUP.md](apps-script/SETUP.md).

## Redesign plan

1. Keep this baseline untouched so nothing is lost.
2. Make DuFour's four questions the backbone of every plan and of the home screen.
3. Merge the two standard pickers ("Choose Essential Standards" and "Build Plan") into one.
4. Replace the standard dashboard look with the custom orbit and circle visual system.
5. Rewrite labels in plain language, with the official term one tap away.
6. Turn Zava, the plan guide, into short animated videos with narration.
