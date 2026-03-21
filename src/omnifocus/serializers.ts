/**
 * OmniJS serializer preambles — JavaScript code strings that execute
 * inside the OmniFocus Omni Automation context, NOT in Node.js.
 *
 * Uses function(){} syntax (no arrow functions) for broadest OmniFocus compatibility.
 */

export const TASK_SERIALIZER: string = `
function taskStatusName(s) {
  var map = [[Task.Status.Available,"Available"],[Task.Status.Blocked,"Blocked"],[Task.Status.Completed,"Completed"],[Task.Status.Dropped,"Dropped"],[Task.Status.DueSoon,"DueSoon"],[Task.Status.Next,"Next"],[Task.Status.Overdue,"Overdue"]];
  for (var i = 0; i < map.length; i++) { if (s === map[i][0]) return map[i][1]; }
  return "Unknown";
}
function serializeTask(t) {
  return {
    id: t.id.primaryKey,
    name: t.name,
    note: t.note,
    flagged: t.flagged,
    completed: t.completed,
    completionDate: t.completionDate ? t.completionDate.toISOString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    deferDate: t.deferDate ? t.deferDate.toISOString() : null,
    effectiveDueDate: t.effectiveDueDate ? t.effectiveDueDate.toISOString() : null,
    effectiveDeferDate: t.effectiveDeferDate ? t.effectiveDeferDate.toISOString() : null,
    taskStatus: taskStatusName(t.taskStatus),
    project: t.containingProject ? { id: t.containingProject.id.primaryKey, name: t.containingProject.name } : null,
    tags: t.tags.map(function(tag) { return { id: tag.id.primaryKey, name: tag.name }; }),
    hasChildren: t.hasChildren,
    estimatedMinutes: t.estimatedMinutes,
    inInbox: t.inInbox
  };
}
`;

export const PROJECT_SERIALIZER: string = `
function projectStatusName(s) {
  var map = [[Project.Status.Active,"Active"],[Project.Status.Done,"Done"],[Project.Status.Dropped,"Dropped"],[Project.Status.OnHold,"OnHold"]];
  for (var i = 0; i < map.length; i++) { if (s === map[i][0]) return map[i][1]; }
  return "Unknown";
}
function serializeProject(p) {
  return {
    id: p.id.primaryKey,
    name: p.name,
    status: projectStatusName(p.status),
    taskCount: p.flattenedTasks.length,
    remainingTaskCount: p.flattenedTasks.filter(function(t) { return !t.completed; }).length,
    dueDate: p.dueDate ? p.dueDate.toISOString() : null,
    deferDate: p.deferDate ? p.deferDate.toISOString() : null,
    completed: p.completed,
    flagged: p.flagged,
    sequential: p.sequential,
    folder: p.parentFolder ? { id: p.parentFolder.id.primaryKey, name: p.parentFolder.name } : null,
    note: p.note
  };
}
`;

export const TAG_SERIALIZER: string = `
function tagStatusName(s) {
  var map = [[Tag.Status.Active,"Active"],[Tag.Status.Dropped,"Dropped"],[Tag.Status.OnHold,"OnHold"]];
  for (var i = 0; i < map.length; i++) { if (s === map[i][0]) return map[i][1]; }
  return "Unknown";
}
function serializeTag(tag, includeChildren) {
  var result = {
    id: tag.id.primaryKey,
    name: tag.name,
    status: tagStatusName(tag.status),
    taskCount: tag.tasks.length,
    availableTaskCount: tag.availableTasks.length
  };
  if (includeChildren && tag.children.length > 0) {
    result.children = tag.children.map(function(child) { return serializeTag(child, true); });
  }
  return result;
}
`;

export const FOLDER_SERIALIZER: string = `
function serializeFolder(f) {
  return {
    id: f.id.primaryKey,
    name: f.name,
    status: f.active ? "Active" : "Dropped",
    projectCount: f.projects.length,
    folderCount: f.folders.length,
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
