# Putting PLC Launchpad on Google Apps Script

When you're done, Launchpad runs at one web address that only signed-in staff in your school's
Google domain can open. Every team's plans, assessments and results are saved in one Drive folder
owned by the account that sets it up.

Plan on about 30 minutes the first time.

## Before you start

- **Use your school Google account**, not a personal Gmail.
- **Check with your district's Google admin** that staff can deploy Apps Script web apps.
  If AI suggestions will be on, also check that Apps Script may contact `api.anthropic.com`.
- **Decide who owns the data.** If the owner's account is ever deleted, the data goes with it.
  A shared department account is safer than one teacher's account. If the owner leaves,
  transfer ownership of the Drive folder and the script first.

## 1. Create the project

1. Go to <https://script.google.com>, signed in with the school account, and choose **New project**.
2. Rename it from "Untitled project" to **PLC Launchpad**.
3. Open **Project Settings** (gear icon) and tick **Show "appsscript.json" manifest file in editor**.

## 2. Add the files

All the files are in the [`apps-script/dist`](dist) folder of this repository.
Create each one in the editor with exactly the same name.

| File in `dist` | In the Apps Script editor |
|---|---|
| `Code.gs` | Replace everything in the existing `Code.gs` |
| `appsscript.json` | Replace everything in the existing `appsscript.json` |
| `Index.html`, `Head.html`, `Bridge.html`, `Page1.html` … `Page5.html`, `QuizConnector.html` | **+** next to Files → **HTML** → type the name without `.html` (for example `Page1`) → paste |

To copy a file from GitHub, open it, choose **Raw**, then select all and copy.
`Head.html` and the `Page` files are large, so give the paste a few seconds. Save with Ctrl+S (Cmd+S on a Mac).

**Faster, if you're comfortable with a terminal:** install [clasp](https://github.com/google/clasp), then from this repository run

```
clasp login
clasp create --type webapp --title "PLC Launchpad" --rootDir apps-script/dist
clasp push
```

## 3. Run setup once

1. In the editor's toolbar, choose **setup** from the function list, then **Run**.
2. Google asks for permission. Approve it. Launchpad needs to:
   - see your email address (to know who is signed in),
   - create and edit its own Drive files,
   - contact an outside service (only for AI suggestions).
3. The execution log shows a link to the new Drive folder, **PLC Launchpad Data (do not share)**.
   Don't share, move or rename anything in it.

## 4. Choose the admins

Setup makes the account that ran it the only admin.
Admins can add subjects, assign subject coordinators and permanently remove teams.

To add more, open **Project Settings → Script properties**, edit **ADMINS**, and list the school emails
separated by commas.

Subject coordinators and PLC team leads are set inside Launchpad
(**Settings → Subjects & PLC Teams Setup**), not here.

## 5. Turn on AI suggestions (optional)

"Help us write our answer" drafts two learning targets with Claude.

1. Create an API key at <https://console.anthropic.com> (**API keys → Create key**).
2. While you're in the Console, set a monthly spending limit under **Billing**.
   Each suggestion costs about a cent. Each person is limited to 30 suggestions an hour.
3. In Apps Script, open **Project Settings → Script properties → Add script property**.
   Name: `ANTHROPIC_API_KEY`. Value: the key.

Treat the key like a password. Only people who can edit the script can see it.

## 6. Deploy

1. Choose **Deploy → New deployment**, click the gear, and choose **Web app**.
2. **Execute as:** Me. **Who has access:** Anyone within *your school's domain*.
3. Choose **Deploy** and copy the **Web app URL**. That's your Launchpad link. Share it with your teams.

## Updating later

After changing any file, choose **Deploy → Manage deployments**, click the pencil,
set **Version** to **New version**, and click **Deploy**. The link stays the same.

## How the data is kept

- One file per team in `workspaces`, saved a moment after each change.
  If two people save at the same moment, Launchpad shows both versions and asks which to keep.
- A history copy at most every 10 minutes while a team is working, in `history`.
  The last 200 per team are kept, and **Settings → Version History** in Launchpad restores them.
- Uploaded resources in `uploads`, viewable by anyone in your domain who has the link.
- The subjects and teams list in `directory.json`.

Student IDs and scores stay inside your school's Google Drive.

## For developers

`PLC-Launchpad-R03.html` at the repository root is the app. `apps-script/build.py` builds `dist/`
from it and from the files in `apps-script/`:

```
python3 apps-script/build.py
```

The build adapts a copy of the page for Apps Script: it reads the address from the server, routes
`/api/...` requests through `google.script.run`, and opens links at the top level. Each edit must
match a set number of times, so if an app change moves one of those lines, the build stops and says
which one.
