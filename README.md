# PLC Launchpad

A planning tool for collaborative teacher teams, built on Richard DuFour's PLC at Work model.
Created by John Rose.

## What's in this repository

| Path | What it is |
|---|---|
| `PLC-Launchpad-R03.html` | **The current app (R03).** One self-contained file: open it in a browser. See [r03/README.md](r03/README.md) for what changed from v0.509. |
| `apps-script/` | Runs the app on Google Apps Script for your school: server (`Code.gs`), bridge, build script and [setup guide](apps-script/SETUP.md). `apps-script/dist/` holds the ready-to-paste files, built from R03. |
| `r03/` | How R03 was made from v0.509, and the R03 code and styles. |
| `legacy/v0.509.html` | The previous app (v0.509), kept unchanged. |
| `research/` | Research on how PLC teams build plans, templates, practice, tools and privacy. |
| `app/`, `design/`, `prototype/` | Earlier design experiments (Launchpad 1.0 and 2.0, design language, homepage sketches). Not the current app. |

## How the app is organized (R03)

Teams work unit by unit in **cycles**. Each cycle takes one essential standard through five steps:

1. **Plan**: standard, learning targets, student group, SMART goal wording.
2. **Build check**: the common assessment, scoring and proficiency rule (Google Forms under Advanced).
3. **Teach**: the team's shared activities for each target.
4. **Respond**: scorebook, team and teacher views, support, follow-ups and extension.
5. **Close**: keep, refine, or replace, then start the next cycle.

**Our Home** shows where the team is, the next meeting (its agenda is built from the current step),
activities, results and follow-ups. Year setup (team, norms, standards, sharing, backups) lives under
**Our Team** and **Our Standards**.

## Hosting

The app saves in the browser on its own, or online for the whole team when deployed on Google Apps
Script, limited to your school's Google domain. See [apps-script/SETUP.md](apps-script/SETUP.md).
