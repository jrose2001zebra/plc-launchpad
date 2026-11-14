#!/usr/bin/env python3
"""One-time restructure of PLC-Launchpad-v0.509.html into R03.

    python3 r03/make_r03.py

Reads legacy/v0.509.html, applies checked edits, inserts r03/r03.css and r03/r03.js,
and writes PLC-Launchpad-R03.html: a single self-contained file. From R03 on, the
R03 file is the source; this script records exactly how it was made from v0.509.
Every edit must match the expected number of times or the script stops.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SRC = ROOT / 'legacy' / 'v0.509.html'
OUT = ROOT / 'PLC-Launchpad-R03.html'
REVISION = 'R03'

EDITS = [
    # Revision number replaces "Foundations · v0.509" (shown in the sidebar footer).
    ('<span class="version">Foundations · v0.509</span>', f'<span class="version">{REVISION}</span>', 1),
    ('<title>PLC Launchpad | Essential standards</title>', f'<title>PLC Launchpad {REVISION}</title>', 1),
    # schemaVersion 6: accept it, write it, and migrate older workspaces on load.
    ('[1,2,3,4,5].includes(s.schemaVersion)', '[1,2,3,4,5,6].includes(s.schemaVersion)', 1),
    ('let state={schemaVersion:5,', 'let state={schemaVersion:6,', 1),
    ('const workspace=cleanWorkingCopy({schemaVersion:5,', 'const workspace=cleanWorkingCopy({schemaVersion:6,', 1),
    ("workspace.defaultPlanView=s.defaultPlanView||'folder';", "workspace.defaultPlanView=s.defaultPlanView||'folder';\n r03Migrate(workspace);", 1),
    ('c.standardIds.every(id=>byId.has(id))&&(c.assessments===undefined||validAssessments(c.assessments))}',
     'c.standardIds.every(id=>byId.has(id))&&(c.assessments===undefined||validAssessments(c.assessments))&&(c.activities===undefined||r03ValidActivities(c.activities))}', 1),
    # Order fix: Plan no longer asks for the assessment name or proficiency rule (they come from Build check).
    ("if(!c.assessment.trim())a.push('Name the common assessment.');if(!c.proficiency.trim())a.push('Define individual proficiency.');", '', 1),
    # R03 routing and navigation wrap the originals.
    ('function renderRoute(){\n stopZavaCoach();', 'function renderRouteV0509(){\n stopZavaCoach();', 1),
    ('function updateProductNavigation(page){', 'function updateProductNavigationV0509(page){', 1),
    ('+(paths[name]||paths.target)+', '+(paths[name]||r03IconPaths()[name]||paths.target)+', 1),
    # A new meeting gets an agenda generated from the active cycle's current step.
    ("const m={id:crypto.randomUUID(),title:'',date:'',time:previous?.time||'',location:previous?.location||'',notes:'',attendance:state.members.map(x=>({id:x.id,name:x.name,email:x.email})),agenda:[]};",
     "const m={id:crypto.randomUUID(),title:r03MeetingTitle(),date:'',time:previous?.time||'',location:previous?.location||'',notes:'',attendance:state.members.map(x=>({id:x.id,name:x.name,email:x.email})),agenda:r03GeneratedAgenda()};", 1),
    # Order fix in Zava's guided Plan: the baseline fills in from the first results, so the guide skips it
    # (unless a team's saved progress is already on a baseline question).
    ("'scope','baselineStatus',...(c.baselineStatus==='known'?['baseline','baselineDate','baselineEvidence']:[]),'assessment'",
     "'scope',...(/^baseline/.test(step)?['baselineStatus',...(c.baselineStatus==='known'?['baseline','baselineDate','baselineEvidence']:[])]:[]),'assessment'", 1),
    # R03 screens opt out of the automatic help icons and title-casing (class r03-quiet).
    ("if(field.closest('.essential-experience,.zava-coach'))continue;", "if(field.closest('.essential-experience,.zava-coach,.r03-quiet'))continue;", 1),
    ("if(heading.closest('[data-studio-choice],.studio-preview,.essential-experience,.zava-coach'))continue;", "if(heading.closest('[data-studio-choice],.studio-preview,.essential-experience,.zava-coach,.r03-quiet'))continue;", 1),
    # "Our ___" page names.
    ("pageHeading('calendar','Team Meetings'", "pageHeading('calendar','Our Meetings'", 1),
    ("breadcrumb([...trail,['Team Meetings']])", "breadcrumb([...trail,['Our Meetings']])", 1),
    ("pageHeading('settings','Settings'", "pageHeading('team','Our Team'", 1),
    ("breadcrumb([...trail,['Settings']])", "breadcrumb([...trail,['Our Team']])", 1),
    ("pageHeading('book','Choose Essential Standards'", "pageHeading('book','Our Standards'", 1),
    ("breadcrumb([...trail,['State standards']])", "breadcrumb([...trail,['Our Standards']])", 1),
    ("const trail=[['Workspace',[]]];", "const trail=[['Our Home',[]]];", 1),
    ("'Back to Workspace'", "'Back to Our Home'", 4),
    ("Done · Workspace", "Done · Our Home", 1),
]

# One word: "cycle". Longest phrases first so plurals are handled before singulars.
TERMS = [
    ('Untitled PLC plan', 'Untitled cycle'),
    ('PLC plans', 'cycles'), ('PLC Plans', 'Cycles'), ('PLC PLAN', 'CYCLE'),
    ('PLC plan', 'cycle'), ('PLC Plan', 'Cycle'),
    ('learning cycles', 'cycles'), ('Learning cycles', 'Cycles'),
    ('learning cycle', 'cycle'), ('Learning cycle', 'Cycle'),
]


def main() -> None:
    html = SRC.read_text(encoding='utf-8')
    for find, replace, expected in EDITS:
        found = html.count(find)
        if found != expected:
            sys.exit(f'stopped: expected {expected} of {find[:80]!r}, found {found}')
        html = html.replace(find, replace)
    # Insert R03 code just before the app wires up routing and draws its first page.
    anchor = "window.addEventListener('hashchange',draw);"
    if html.count(anchor) != 1:
        sys.exit('stopped: routing anchor not found exactly once')
    js = (HERE / 'r03.js').read_text(encoding='utf-8')
    if '</script' in js.lower():
        sys.exit('stopped: r03.js contains "</script"')
    html = html.replace(anchor, js + '\n' + anchor)
    css = (HERE / 'r03.css').read_text(encoding='utf-8')
    html = html.replace('</head>', '<style id="r03-styles">\n' + css + '\n</style>\n</head>', 1)
    # Terms, everywhere except the standards catalog data.
    for find, replace in TERMS:
        html = html.replace(find, replace)
    left = re.findall(r'PLC plans?|learning cycles?', html, re.I)
    if left:
        sys.exit(f'stopped: old terms remain: {sorted(set(left))}')
    OUT.write_text(html, encoding='utf-8')
    print(f'wrote {OUT.name} ({len(html):,} bytes)')


if __name__ == '__main__':
    main()
