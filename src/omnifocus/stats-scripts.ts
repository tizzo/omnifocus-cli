export function buildStatsScript(): string {
  return `var allTasks = flattenedTasks;
var ts = { total: 0, available: 0, completed: 0, remaining: 0, overdue: 0, dueSoon: 0, flagged: 0 };
for (var i = 0; i < allTasks.length; i++) {
  var t = allTasks[i];
  ts.total++;
  if (t.taskStatus === Task.Status.Available) ts.available++;
  if (t.completed) ts.completed++;
  if (!t.completed && t.taskStatus !== Task.Status.Dropped) ts.remaining++;
  if (t.taskStatus === Task.Status.Overdue) ts.overdue++;
  if (t.taskStatus === Task.Status.DueSoon) ts.dueSoon++;
  if (t.flagged && !t.completed) ts.flagged++;
}
ts.inbox = inbox.length;

var allProjects = flattenedProjects;
var ps = { total: 0, active: 0, onHold: 0, completed: 0, dropped: 0 };
for (var j = 0; j < allProjects.length; j++) {
  var p = allProjects[j];
  ps.total++;
  if (p.status === Project.Status.Active) ps.active++;
  if (p.status === Project.Status.OnHold) ps.onHold++;
  if (p.status === Project.Status.Done) ps.completed++;
  if (p.status === Project.Status.Dropped) ps.dropped++;
}

JSON.stringify({
  tasks: ts,
  projects: ps,
  tags: { total: flattenedTags.length },
  folders: { total: flattenedFolders.length }
});`;
}
