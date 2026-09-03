/**
 * OmniJS serializer preambles — JavaScript code strings that execute
 * inside the OmniFocus Omni Automation context, NOT in Node.js.
 *
 * Uses function(){} syntax (no arrow functions) for broadest OmniFocus compatibility.
 */

export const TASK_SERIALIZER: string = `
var _tsMap = [[Task.Status.Available,"Available"],[Task.Status.Blocked,"Blocked"],[Task.Status.Completed,"Completed"],[Task.Status.Dropped,"Dropped"],[Task.Status.DueSoon,"DueSoon"],[Task.Status.Next,"Next"],[Task.Status.Overdue,"Overdue"]];
function taskStatusName(s) {
  for (var i = 0; i < _tsMap.length; i++) { if (s === _tsMap[i][0]) return _tsMap[i][1]; }
  return "Unknown";
}
var _rmMap = [[Task.RepetitionMethod.None,"None"],[Task.RepetitionMethod.Fixed,"Fixed"],[Task.RepetitionMethod.DeferUntilDate,"DeferUntilDate"],[Task.RepetitionMethod.DueDate,"DueDate"]];
var _rstMap = [[Task.RepetitionScheduleType.None,"None"],[Task.RepetitionScheduleType.Regularly,"Regularly"],[Task.RepetitionScheduleType.FromCompletion,"FromCompletion"]];
var _adkMap = [[Task.AnchorDateKey.DeferDate,"DeferDate"],[Task.AnchorDateKey.PlannedDate,"PlannedDate"],[Task.AnchorDateKey.DueDate,"DueDate"]];
function _enumName(map, v) {
  for (var i = 0; i < map.length; i++) { if (v === map[i][0]) return map[i][1]; }
  return "Unknown";
}
var _fwtMap = [[FileWrapper.Type.File,"File"],[FileWrapper.Type.Directory,"Directory"],[FileWrapper.Type.Link,"Link"]];
// Equivalent to t.url.string, but built from the id instead: instantiating a URL
// object per task costs ~1ms, which dominates a full-database listing. Verified
// identical to t.url.string across every task, project and folder.
function objectURL(kind, obj) { return "omnifocus:///" + kind + "/" + obj.id.primaryKey; }
function serializeRepetitionRule(r) {
  if (!r) return null;
  return {
    ruleString: r.ruleString,
    method: _enumName(_rmMap, r.method),
    scheduleType: _enumName(_rstMap, r.scheduleType),
    anchorDateKey: _enumName(_adkMap, r.anchorDateKey),
    catchUpAutomatically: r.catchUpAutomatically
  };
}
// Metadata only — attachment bytes are deliberately excluded so listings stay small.
function serializeAttachment(a) {
  return {
    filename: a.filename === undefined ? null : a.filename,
    preferredFilename: a.preferredFilename === undefined ? null : a.preferredFilename,
    type: _enumName(_fwtMap, a.type),
    byteLength: a.contents ? a.contents.length : null
  };
}
function serializeTask(t) {
  return {
    id: t.id.primaryKey,
    name: t.name,
    note: t.note,
    url: objectURL("task", t),
    flagged: t.flagged,
    completed: t.completed,
    completionDate: t.completionDate ? t.completionDate.toISOString() : null,
    dropDate: t.dropDate ? t.dropDate.toISOString() : null,
    added: t.added ? t.added.toISOString() : null,
    modified: t.modified ? t.modified.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    deferDate: t.deferDate ? t.deferDate.toISOString() : null,
    effectiveDueDate: t.effectiveDueDate ? t.effectiveDueDate.toISOString() : null,
    effectiveDeferDate: t.effectiveDeferDate ? t.effectiveDeferDate.toISOString() : null,
    taskStatus: taskStatusName(t.taskStatus),
    project: t.containingProject ? { id: t.containingProject.id.primaryKey, name: t.containingProject.name } : null,
    tags: t.tags.map(function(tag) { return { id: tag.id.primaryKey, name: tag.name }; }),
    hasChildren: t.hasChildren,
    parent: t.parent ? { id: t.parent.id.primaryKey, name: t.parent.name } : null,
    children: t.children.map(function(c) { return { id: c.id.primaryKey, name: c.name }; }),
    repetitionRule: serializeRepetitionRule(t.repetitionRule),
    attachments: t.attachments.map(function(a) { return serializeAttachment(a); }),
    linkedFileURLs: t.linkedFileURLs.map(function(u) { return u.string; }),
    estimatedMinutes: t.estimatedMinutes,
    inInbox: t.inInbox
  };
}
`;

export const PROJECT_SERIALIZER: string = `
var _psMap = [[Project.Status.Active,"Active"],[Project.Status.Done,"Done"],[Project.Status.Dropped,"Dropped"],[Project.Status.OnHold,"OnHold"]];
function projectStatusName(s) {
  for (var i = 0; i < _psMap.length; i++) { if (s === _psMap[i][0]) return _psMap[i][1]; }
  return "Unknown";
}
function serializeProject(p) {
  var _tasks = p.flattenedTasks; var _remaining = 0;
  for (var _i = 0; _i < _tasks.length; _i++) { if (!_tasks[_i].completed) _remaining++; }
  // Project has no added/modified of its own; its root task carries them (same identifier).
  var _root = p.task;
  return {
    id: p.id.primaryKey,
    name: p.name,
    status: projectStatusName(p.status),
    taskCount: _tasks.length,
    remainingTaskCount: _remaining,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    deferDate: p.deferDate ? p.deferDate.toISOString() : null,
    completed: p.completed,
    completionDate: p.completionDate ? p.completionDate.toISOString() : null,
    dropDate: p.dropDate ? p.dropDate.toISOString() : null,
    added: _root && _root.added ? _root.added.toISOString() : null,
    modified: _root && _root.modified ? _root.modified.toISOString() : null,
    lastReviewDate: p.lastReviewDate ? p.lastReviewDate.toISOString() : null,
    nextReviewDate: p.nextReviewDate ? p.nextReviewDate.toISOString() : null,
    flagged: p.flagged,
    sequential: p.sequential,
    folder: p.parentFolder ? { id: p.parentFolder.id.primaryKey, name: p.parentFolder.name } : null,
    note: p.note
  };
}
`;

export const TAG_SERIALIZER: string = `
var _tgMap = [[Tag.Status.Active,"Active"],[Tag.Status.Dropped,"Dropped"],[Tag.Status.OnHold,"OnHold"]];
function tagStatusName(s) {
  for (var i = 0; i < _tgMap.length; i++) { if (s === _tgMap[i][0]) return _tgMap[i][1]; }
  return "Unknown";
}
function serializeTag(tag, includeChildren) {
  var result = {
    id: tag.id.primaryKey,
    name: tag.name,
    status: tagStatusName(tag.status),
    taskCount: tag.tasks.length,
    availableTaskCount: tag.availableTasks.length,
    added: tag.added ? tag.added.toISOString() : null,
    modified: tag.modified ? tag.modified.toISOString() : null
  };
  if (includeChildren && tag.children.length > 0) {
    result.children = tag.children.map(function(child) { return serializeTag(child, true); });
  }
  return result;
}
`;

export const FOLDER_SERIALIZER: string = `
var _fsMap = [[Folder.Status.Active,"Active"],[Folder.Status.Dropped,"Dropped"]];
function folderStatusName(s) {
  for (var i = 0; i < _fsMap.length; i++) { if (s === _fsMap[i][0]) return _fsMap[i][1]; }
  return "Unknown";
}
function serializeFolder(f) {
  return {
    id: f.id.primaryKey,
    name: f.name,
    url: "omnifocus:///folder/" + f.id.primaryKey,
    status: folderStatusName(f.status),
    active: f.active,
    effectiveActive: f.effectiveActive,
    added: f.added ? f.added.toISOString() : null,
    modified: f.modified ? f.modified.toISOString() : null,
    projectCount: f.projects.length,
    folderCount: f.folders.length,
    sectionCount: f.sections.length,
    flattenedProjectCount: f.flattenedProjects.length,
    flattenedFolderCount: f.flattenedFolders.length,
    flattenedSectionCount: f.flattenedSections.length,
    parent: f.parent && f.parent.constructor === Folder ? { id: f.parent.id.primaryKey, name: f.parent.name } : null
  };
}
`;

export const PERSPECTIVE_SERIALIZER: string = `
function serializePerspective(p) {
  return {
    id: p.id.primaryKey,
    name: p.name,
    isBuiltIn: false
  };
}
`;
