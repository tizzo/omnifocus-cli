export function buildStatsScript(): string {
  return `var allTasks = flattenedTasks;
var allProjects = flattenedProjects;

JSON.stringify({
  tasks: {
    total: allTasks.length,
    available: allTasks.filter(function(t) { return t.taskStatus === Task.Status.Available; }).length,
    completed: allTasks.filter(function(t) { return t.completed; }).length,
    remaining: allTasks.filter(function(t) { return !t.completed && t.taskStatus !== Task.Status.Dropped; }).length,
    overdue: allTasks.filter(function(t) { return t.taskStatus === Task.Status.Overdue; }).length,
    dueSoon: allTasks.filter(function(t) { return t.taskStatus === Task.Status.DueSoon; }).length,
    flagged: allTasks.filter(function(t) { return t.flagged && !t.completed; }).length,
    inbox: inbox.length
  },
  projects: {
    total: allProjects.length,
    active: allProjects.filter(function(p) { return p.status === Project.Status.Active; }).length,
    onHold: allProjects.filter(function(p) { return p.status === Project.Status.OnHold; }).length,
    completed: allProjects.filter(function(p) { return p.status === Project.Status.Done; }).length,
    dropped: allProjects.filter(function(p) { return p.status === Project.Status.Dropped; }).length
  },
  tags: {
    total: flattenedTags.length
  },
  folders: {
    total: flattenedFolders.length
  }
});`;
}
