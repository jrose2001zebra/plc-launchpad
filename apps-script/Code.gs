/**
 * PLC Launchpad · Google Apps Script server
 *
 * Serves the app to signed-in staff in your school's Google domain and stores every
 * team's work as JSON files in one Drive folder owned by the account that deploys it.
 *
 * First time: run setup() once from the editor, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: anyone in your domain). See SETUP.md.
 */

const PROPS = PropertiesService.getScriptProperties();
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HISTORY_EVERY_MS = 10 * 60 * 1000;   // keep at most one history copy per 10 minutes of saving
const HISTORY_KEEP = 200;                  // history copies kept per workspace
const HISTORY_PAGE = 25;
const MAX_WORKSPACE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const AI_PER_HOUR = 30;                    // learning-target suggestions per person per hour
const CLAUDE_MODEL = 'claude-opus-5-5';

const CATALOG_NAMES = {
  engineering: 'Engineering / CTE', art: 'Visual Arts', history: 'U.S. History · Grade 11',
  algebra: 'Algebra I', integrated: 'Mathematics I', calculus: 'Calculus'
};
const BUILT_IN_SUBJECTS = [
  ['engineering', 'Engineering / CTE', ['engineering']],
  ['history', 'History–Social Science', ['history']],
  ['math', 'Math', ['algebra', 'integrated', 'calculus']],
  ['art', 'Visual Arts', ['art']]
];

/* ------------------------------------------------------------------ setup */

/** Run once from the editor. Safe to run again: it never replaces existing data. */
function setup() {
  const owner = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!PROPS.getProperty('FOLDER_ID')) {
    const folder = DriveApp.createFolder('PLC Launchpad Data (do not share)');
    PROPS.setProperty('FOLDER_ID', folder.getId());
  }
  if (!PROPS.getProperty('ROOT_ID')) PROPS.setProperty('ROOT_ID', Utilities.getUuid());
  if (!PROPS.getProperty('ADMINS')) PROPS.setProperty('ADMINS', owner);
  if (!readDirectory_()) writeDirectory_(seedDirectory_());
  Logger.log('PLC Launchpad is set up.');
  Logger.log('Data folder: https://drive.google.com/drive/folders/' + PROPS.getProperty('FOLDER_ID'));
  Logger.log('Admins: ' + PROPS.getProperty('ADMINS'));
  Logger.log('Next: Deploy > New deployment > Web app. Execute as: Me. Who has access: anyone in your domain.');
  Logger.log(PROPS.getProperty('ANTHROPIC_API_KEY') ? 'AI suggestions: on.' :
    'AI suggestions: off. Add ANTHROPIC_API_KEY under Project Settings > Script properties to turn them on.');
}

function seedDirectory_() {
  const subjects = [], teams = [];
  for (const [id, name, codes] of BUILT_IN_SUBJECTS) {
    subjects.push({ id, name, catalogs: codes, coordinators: [], removed: false });
    for (const code of codes) teams.push({ id: code, subjectId: id, name: CATALOG_NAMES[code], catalogs: [code], coordinators: [], removed: false });
  }
  return { etag: Utilities.getUuid(), subjects, teams };
}

/* ------------------------------------------------------------- web page */

function doGet(e) {
  const rootId = PROPS.getProperty('ROOT_ID');
  if (!rootId) return HtmlService.createHtmlOutput('<h1>PLC Launchpad is not set up yet</h1><p>Open the script editor and run <b>setup</b>.</p>');
  const p = (e && e.parameter) || {};
  const params = {};
  if (UUID.test(p.manage || '')) {
    params.manage = p.manage;
  } else {
    params.shared = UUID.test(p.shared || '') ? p.shared : rootId;
    if (params.shared === rootId) params.course = p.course || defaultCourse_();
    else if (p.course) params.course = p.course;
  }
  const search = '?' + Object.keys(params).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
  const page = HtmlService.createTemplateFromFile('Index');
  page.boot = JSON.stringify({ execUrl: ScriptApp.getService().getUrl(), search, params, email: me_() }).replace(/</g, '\\u003c');
  return page.evaluate()
    .setTitle('PLC Launchpad')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Used by Index.html to paste in the other files exactly as written. */
function include(name) {
  return HtmlService.createTemplateFromFile(name).getRawContent();
}

/* ------------------------------------------------------------ API router */

/**
 * The page calls this through google.script.run for every request the app used to send to /api/…
 * req: {method, path, query, ifMatch?, body?, bodyBase64?, fileName?, mime?}
 * returns: {status, body} or {status, text}
 */
function api(req) {
  try {
    return route_(req || {});
  } catch (err) {
    if (err && err.status) return { status: err.status, body: { error: err.message } };
    console.error(err && err.stack || err);
    return { status: 500, body: { error: 'Something went wrong on the server. Try again in a moment.' } };
  }
}

function route_(req) {
  if (!me_()) fail_(401, 'Sign in with your school Google account to use Launchpad.');
  const method = String(req.method || 'GET').toUpperCase();
  const query = req.query || {};
  const parts = String(req.path || '').replace(/^\/api\//, '').split('/').map(decodeURIComponent);
  switch (parts[0]) {
    case 'demo': return workspace_(method, parts[1], query, req);
    case 'directory': return directory_(method, parts[1], query, req);
    case 'directory-home': return directoryHome_();
    case 'learning-targets': return learningTargets_(parseJson_(req.body));
    case 'resources': return upload_(parts[1], req);
    case 'file': return uploadedFile_(parts[1]);
    case 'asset':
      if (parts[1] === 'quiz-connector') return { status: 200, text: include('QuizConnector') };
  }
  fail_(404, 'That request is not available.');
}

/* ----------------------------------------------------------- workspaces */

function workspace_(method, id, query, req) {
  if (!UUID.test(id || '')) fail_(400, 'That workspace link is not valid.');
  const rootId = PROPS.getProperty('ROOT_ID');

  if (method === 'POST' && query.course) {
    if (id !== rootId) fail_(404, 'That school directory was not found.');
    return { status: 200, body: { id: teamWorkspaceId_(query.course) } };
  }
  if (PROPS.getProperty('gone:' + id)) return { status: 410, body: { error: 'This workspace was permanently removed.' } };

  if (method === 'GET') {
    if (query.history) return history_(id, query.cursor);
    if (query.version) {
      const version = readVersion_(id, query.version);
      if (!version) fail_(404, 'That saved version could not be found.');
      return { status: 200, body: { payload: version.payload } };
    }
    const saved = readWorkspace_(id);
    if (saved) return { status: 200, body: { payload: saved.payload, etag: saved.etag } };
    const subject = subjectForWorkspace_(id);
    if (!subject) fail_(404, 'That workspace was not found.');
    // A team that has never saved: the page builds a blank workspace and saves it on the first change.
    return { status: 200, body: { payload: { subject, fresh: true }, etag: '' } };
  }

  if (method === 'PUT') {
    const payload = parsePayload_(req.body);
    return withLock_(() => {
      if (query.recovery) {
        writeVersion_(id, payload, 'recovery');
        return { status: 200, body: { ok: true } };
      }
      const saved = readWorkspace_(id);
      const ifMatch = req.ifMatch;
      if (saved ? ifMatch !== saved.etag : !!ifMatch) {
        return { status: 409, body: { error: 'Someone else saved this workspace a moment ago.' } };
      }
      const now = new Date().toISOString();
      const etag = Utilities.getUuid();
      writeWorkspace_(id, { payload, etag, savedAt: now, savedBy: me_() });
      maybeKeepHistory_(id, payload, now);
      return { status: 200, body: { etag } };
    });
  }
  fail_(405, 'That request is not supported.');
}

function parsePayload_(body) {
  if (body && body.length > MAX_WORKSPACE_BYTES) fail_(413, 'This workspace is too large to save. Move large files into plan resources.');
  const payload = parseJson_(body);
  if (typeof payload.subject !== 'string' || typeof payload.catalogId !== 'string' || !payload.state || typeof payload.state !== 'object') {
    fail_(400, 'The workspace could not be saved because it is incomplete.');
  }
  return { subject: payload.subject, catalogId: payload.catalogId, state: payload.state };
}

function readWorkspace_(id) {
  const fileId = PROPS.getProperty('ws:' + id);
  if (!fileId) return null;
  try { return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString()); }
  catch (err) { console.error('Could not read workspace ' + id + ': ' + err); fail_(500, 'This workspace could not be read. Try again.'); }
}

function writeWorkspace_(id, record) {
  const text = JSON.stringify(record);
  const fileId = PROPS.getProperty('ws:' + id);
  if (fileId) { DriveApp.getFileById(fileId).setContent(text); return; }
  const file = folder_('workspaces').createFile('ws-' + id + '.json', text, MimeType.PLAIN_TEXT);
  PROPS.setProperty('ws:' + id, file.getId());
}

function subjectForWorkspace_(id) {
  const dir = readDirectory_();
  const team = dir && dir.teams.find(t => t.workspaceId === id);
  return team ? teamCode_(team) : null;
}

function teamWorkspaceId_(code) {
  return withLock_(() => {
    const dir = readDirectory_();
    const team = dir.teams.find(t => teamCode_(t) === code);
    const subject = team && dir.subjects.find(s => s.id === team.subjectId);
    if (!team || team.removed || !subject || subject.removed) fail_(404, 'That PLC team was not found. Choose another team.');
    if (!team.workspaceId) {
      team.workspaceId = Utilities.getUuid();
      writeDirectory_(dir, true);
    }
    return team.workspaceId;
  });
}

function purgeWorkspace_(id) {
  const fileId = PROPS.getProperty('ws:' + id);
  if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (err) {} }
  for (const name of ['history', 'uploads']) {
    const parent = folder_(name), it = parent.getFoldersByName(id);
    while (it.hasNext()) it.next().setTrashed(true);
  }
  PROPS.deleteProperty('ws:' + id);
  PROPS.deleteProperty('hlast:' + id);
  PROPS.setProperty('gone:' + id, new Date().toISOString());
}

/* -------------------------------------------------------------- history */

function maybeKeepHistory_(id, payload, now) {
  const last = Number(PROPS.getProperty('hlast:' + id) || 0);
  if (Date.parse(now) - last < HISTORY_EVERY_MS) return;
  writeVersion_(id, payload, 'save');
  PROPS.setProperty('hlast:' + id, String(Date.parse(now)));
}

function writeVersion_(id, payload, kind) {
  const folder = subfolder_('history', id);
  const savedAt = new Date().toISOString();
  folder.createFile(savedAt.replace(/[:.]/g, '-') + '__' + kind + '.json',
    JSON.stringify({ payload, savedAt, kind, savedBy: me_() }), MimeType.PLAIN_TEXT);
  const files = listVersions_(folder);
  for (const old of files.slice(HISTORY_KEEP)) old.file.setTrashed(true);
}

function listVersions_(folder) {
  const out = [], it = folder.getFiles();
  while (it.hasNext()) { const file = it.next(); out.push({ file, name: file.getName() }); }
  return out.sort((a, b) => (a.name < b.name ? 1 : -1));
}

function history_(id, cursor) {
  const start = Math.max(0, parseInt(cursor, 10) || 0);
  const all = listVersions_(subfolder_('history', id));
  const page = all.slice(start, start + HISTORY_PAGE).map(({ file, name }) => {
    const [stamp, kind] = name.replace(/\.json$/, '').split('__');
    const iso = stamp.replace(/^(\d{4}-\d{2}-\d{2}T\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, '$1:$2:$3.$4Z');
    return { id: file.getId(), savedAt: iso, kind: kind || 'save' };
  });
  const next = start + HISTORY_PAGE < all.length ? String(start + HISTORY_PAGE) : null;
  return { status: 200, body: { versions: page, cursor: next } };
}

function readVersion_(id, versionId) {
  try {
    const file = DriveApp.getFileById(versionId);
    const parents = file.getParents();
    if (!parents.hasNext() || parents.next().getName() !== id) return null;
    return JSON.parse(file.getBlob().getDataAsString());
  } catch (err) { return null; }
}

/* ------------------------------------------------------------ directory */

function directory_(method, id, query, req) {
  if (!UUID.test(id || '')) fail_(400, 'That directory link is not valid.');
  if (method === 'GET') return { status: 200, body: directoryView_(readDirectory_(), !!query.contacts) };
  if (method === 'POST') return directoryChange_(parseJson_(req.body));
  fail_(405, 'That request is not supported.');
}

function directoryHome_() {
  const email = me_(), dir = readDirectory_();
  const leads = dir.subjects.concat(dir.teams).some(entry => (entry.coordinators || []).includes(email));
  if (!isAdmin_(email) && !leads) fail_(403, 'Only Launchpad admins, subject coordinators and PLC team leads can manage the directory. Ask your Launchpad admin to add you.');
  return { status: 200, body: { root: PROPS.getProperty('ROOT_ID') } };
}

function directoryView_(dir, withContacts) {
  const email = me_(), admin = isAdmin_(email);
  const contacts = list => (list || []).map(address => ({ email: address, name: nameFromEmail_(address) }));
  const canManage = {};
  const subjects = dir.subjects.map(s => {
    canManage[s.id] = admin || s.coordinators.includes(email);
    const out = { id: s.id, name: s.name, catalogs: s.catalogs, coordinators: s.coordinators, removed: !!s.removed, canManage: canManage[s.id] };
    if (withContacts) out.contacts = contacts(s.coordinators);
    return out;
  });
  const teams = dir.teams.map(t => {
    const out = { id: t.id, subjectId: t.subjectId, name: t.name, catalogs: t.catalogs, coordinators: t.coordinators, removed: !!t.removed,
      canEdit: !!canManage[t.subjectId] || t.coordinators.includes(email) };
    if (withContacts) out.contacts = contacts(t.coordinators);
    return out;
  });
  return { etag: dir.etag, signed: true, admin, email, hasContacts: withContacts, subjects, teams };
}

function directoryChange_(c) {
  return withLock_(() => {
    const dir = readDirectory_();
    if (c.etag !== dir.etag) {
      return { status: 409, body: { error: 'Someone else just changed the directory. It has been reloaded, so try your change again.' } };
    }
    const email = me_(), admin = isAdmin_(email);
    const name = v => String(v || '').trim().slice(0, 100);
    const emails = list => Array.from(new Set((list || []).map(v => String(v).trim().toLowerCase())
      .filter(v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)))).slice(0, 20);
    const catalogs = list => (list || []).filter(k => Object.prototype.hasOwnProperty.call(CATALOG_NAMES, k));
    const findSubject = id => dir.subjects.find(s => s.id === id) || fail_(404, 'That subject was not found.');
    const manages = s => admin || s.coordinators.includes(email);
    let savedId = c.id;

    if (c.kind === 'subject') {
      if (!admin) fail_(403, 'Only a Launchpad admin can change subjects.');
      if (c.action === 'create') {
        if (!name(c.name)) fail_(400, 'Enter a subject name.');
        savedId = Utilities.getUuid();
        dir.subjects.push({ id: savedId, name: name(c.name), catalogs: catalogs(c.catalogs), coordinators: emails(c.coordinators), removed: false });
      } else {
        const s = findSubject(c.id);
        if (c.action === 'edit') { s.name = name(c.name) || s.name; s.catalogs = catalogs(c.catalogs); s.coordinators = emails(c.coordinators); }
        else if (c.action === 'remove') s.removed = true;
        else if (c.action === 'restore') s.removed = false;
        else if (c.action === 'purge') {
          if (c.confirmName !== s.name) fail_(400, 'The name you typed does not match. Type it exactly to confirm.');
          if (dir.teams.some(t => t.subjectId === s.id)) fail_(400, 'Permanently remove this subject’s PLC teams first.');
          dir.subjects = dir.subjects.filter(x => x !== s);
        } else fail_(400, 'That change is not supported.');
      }
    } else if (c.kind === 'team') {
      const team = c.action === 'create' ? null : (dir.teams.find(t => t.id === c.id) || fail_(404, 'That PLC team was not found.'));
      const s = findSubject(team ? team.subjectId : c.subjectId);
      if (c.action === 'create') {
        if (!manages(s)) fail_(403, 'Only this subject’s coordinator or a Launchpad admin can add PLC teams.');
        if (!name(c.name)) fail_(400, 'Enter a team name.');
        savedId = Utilities.getUuid();
        dir.teams.push({ id: savedId, subjectId: s.id, name: name(c.name), catalogs: catalogs(c.catalogs).filter(k => s.catalogs.includes(k)),
          coordinators: emails(c.coordinators), removed: false });
      } else if (c.action === 'edit') {
        if (!manages(s) && !team.coordinators.includes(email)) fail_(403, 'Only this team’s lead, the subject coordinator or a Launchpad admin can edit it.');
        team.name = name(c.name) || team.name;
        if (!Object.prototype.hasOwnProperty.call(CATALOG_NAMES, team.id)) team.catalogs = catalogs(c.catalogs).filter(k => s.catalogs.includes(k));
        if (manages(s)) team.coordinators = emails(c.coordinators);
      } else if (c.action === 'remove' || c.action === 'restore') {
        if (!manages(s)) fail_(403, 'Only this subject’s coordinator or a Launchpad admin can archive PLC teams.');
        team.removed = c.action === 'remove';
      } else if (c.action === 'purge') {
        if (!admin) fail_(403, 'Only a Launchpad admin can permanently remove a PLC team.');
        if (c.confirmName !== team.name) fail_(400, 'The name you typed does not match. Type it exactly to confirm.');
        if (team.workspaceId) purgeWorkspace_(team.workspaceId);
        dir.teams = dir.teams.filter(t => t !== team);
      } else fail_(400, 'That change is not supported.');
    } else fail_(400, 'That change is not supported.');

    writeDirectory_(dir);
    const view = directoryView_(dir, true);
    view.savedId = savedId;
    return { status: 200, body: view };
  });
}

function readDirectory_() {
  const fileId = PROPS.getProperty('DIRECTORY_FILE_ID');
  if (!fileId) return null;
  return JSON.parse(DriveApp.getFileById(fileId).getBlob().getDataAsString());
}

/** keepEtag: for bookkeeping that changes nothing people see (a team's workspace link), so open editors don't get a false conflict. */
function writeDirectory_(dir, keepEtag) {
  if (!keepEtag || !dir.etag) dir.etag = Utilities.getUuid();
  const text = JSON.stringify(dir);
  const fileId = PROPS.getProperty('DIRECTORY_FILE_ID');
  if (fileId) { DriveApp.getFileById(fileId).setContent(text); return; }
  const file = rootFolder_().createFile('directory.json', text, MimeType.PLAIN_TEXT);
  PROPS.setProperty('DIRECTORY_FILE_ID', file.getId());
}

function teamCode_(team) { return UUID.test(team.id) ? 'team-' + team.id : team.id; }

function defaultCourse_() {
  const dir = readDirectory_();
  if (!dir) return 'engineering';
  const live = dir.teams.filter(t => !t.removed && dir.subjects.some(s => s.id === t.subjectId && !s.removed));
  const pick = live.find(t => t.id === 'engineering') || live[0];
  return pick ? teamCode_(pick) : 'engineering';
}

/* -------------------------------------------------------------- uploads */

function upload_(workspaceId, req) {
  if (!UUID.test(workspaceId || '')) fail_(400, 'Save the workspace before uploading files.');
  if (!req.bodyBase64) fail_(400, 'No file was received. Choose the file again.');
  const bytes = Utilities.base64Decode(req.bodyBase64);
  if (!bytes.length) fail_(400, 'That file is empty. Choose another file.');
  if (bytes.length > MAX_UPLOAD_BYTES) fail_(413, 'That file is larger than 20 MB. Choose a smaller file.');
  const fileName = String(req.fileName || 'file').slice(0, 200);
  const mime = String(req.mime || 'application/octet-stream').slice(0, 120);
  const file = subfolder_('uploads', workspaceId).createFile(Utilities.newBlob(bytes, mime, fileName));
  try { file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (err) { console.warn('Could not share upload with the domain: ' + err); }
  return { status: 200, body: { fileId: Utilities.getUuid(), workspaceId, driveId: file.getId(), name: fileName, size: bytes.length, type: mime } };
}

/** Returns an uploaded image's bytes so the page can draw it (used when printing a question). */
function uploadedFile_(driveId) {
  let file;
  try { file = DriveApp.getFileById(String(driveId || '')); } catch (err) { fail_(404, 'That file could not be found.'); }
  const parent = file.getParents().hasNext() ? file.getParents().next() : null;
  const grand = parent && parent.getParents().hasNext() ? parent.getParents().next() : null;
  if (!grand || grand.getId() !== folder_('uploads').getId()) fail_(404, 'That file could not be found.');
  const blob = file.getBlob();
  if (blob.getBytes().length > MAX_UPLOAD_BYTES) fail_(413, 'That file is too large to show here.');
  return { status: 200, base64: Utilities.base64Encode(blob.getBytes()), mime: blob.getContentType() };
}

/* ------------------------------------------------- AI learning targets */

function learningTargets_(input) {
  const key = PROPS.getProperty('ANTHROPIC_API_KEY');
  if (!key) fail_(503, 'Suggestions are not turned on yet. Ask your Launchpad admin to add the AI key.');
  const email = me_(), cache = CacheService.getScriptCache(), counter = 'ai:' + email;
  const used = Number(cache.get(counter) || 0);
  if (used >= AI_PER_HOUR) fail_(429, 'You have asked for a lot of suggestions this hour. Try again later.');
  cache.put(counter, String(used + 1), 3600);

  const standards = JSON.stringify(input.standards || []).slice(0, 8000);
  const draft = String(input.draft || '').slice(0, 2000);
  const request = {
    model: CLAUDE_MODEL,
    max_tokens: 4000,
    fallbacks: 'default',
    output_config: {
      effort: 'low',
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: { suggestions: { type: 'array', items: { type: 'string' } } },
          required: ['suggestions'],
          additionalProperties: false
        }
      }
    },
    system: 'You help a team of teachers in a Professional Learning Community (PLC at Work) write learning targets. ' +
      'A learning target restates one essential standard as a specific skill students can show, written in plain words a student understands, ' +
      'usually starting with "I can". Each target names one observable skill that a short common assessment could check. ' +
      'Match the standard\'s grade or proficiency level. Do not invent requirements the standard does not contain. ' +
      'Return exactly two different suggestions, each one sentence under 30 words.',
    messages: [{
      role: 'user',
      content: 'Subject or course: ' + String(input.subject || '').slice(0, 100) + '\n\n' +
        'Essential standard(s), official wording:\n' + standards + '\n\n' +
        (draft ? 'The team\'s current draft, to improve on:\n' + draft : 'The team has not written a draft yet.')
    }]
  };
  const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01' },
    payload: JSON.stringify(request),
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code !== 200) {
    console.error('Claude API ' + code + ': ' + response.getContentText().slice(0, 500));
    fail_(code === 429 || code === 529 ? 503 : 502, 'Suggestions are unavailable right now. Try again in a minute.');
  }
  const message = JSON.parse(response.getContentText());
  if (message.stop_reason === 'refusal') fail_(422, 'No suggestions could be written for this standard. Try rewording your draft.');
  const text = (message.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  let suggestions;
  try { suggestions = JSON.parse(text).suggestions; } catch (err) { suggestions = null; }
  if (!Array.isArray(suggestions) || !suggestions.length) fail_(502, 'Suggestions are unavailable right now. Try again in a minute.');
  return { status: 200, body: { suggestions: suggestions.map(s => String(s).trim()).filter(Boolean).slice(0, 2) } };
}

/* -------------------------------------------------------------- helpers */

function me_() {
  try { return String(Session.getActiveUser().getEmail() || '').toLowerCase(); } catch (err) { return ''; }
}

function isAdmin_(email) {
  return String(PROPS.getProperty('ADMINS') || '').toLowerCase().split(/[,\s]+/).filter(Boolean).includes(email);
}

function nameFromEmail_(email) {
  return String(email).split('@')[0].split(/[._-]+/).filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || email;
}

function rootFolder_() {
  const id = PROPS.getProperty('FOLDER_ID');
  if (!id) fail_(503, 'Launchpad is not set up yet. Ask your admin to run setup.');
  return DriveApp.getFolderById(id);
}

function folder_(name) {
  const key = 'folder:' + name, cached = PROPS.getProperty(key);
  if (cached) { try { return DriveApp.getFolderById(cached); } catch (err) {} }
  const root = rootFolder_(), it = root.getFoldersByName(name);
  const folder = it.hasNext() ? it.next() : root.createFolder(name);
  PROPS.setProperty(key, folder.getId());
  return folder;
}

function subfolder_(parentName, name) {
  const parent = folder_(parentName), it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) fail_(503, 'Launchpad is busy saving other work. Try again in a moment.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function parseJson_(text) {
  try { const value = JSON.parse(text || '{}'); if (value && typeof value === 'object') return value; } catch (err) {}
  fail_(400, 'The request could not be read.');
}

function fail_(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}
