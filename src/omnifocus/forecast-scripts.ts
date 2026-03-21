import { TASK_SERIALIZER } from "./serializers.js";

export function buildForecastScript(): string {
  return `${TASK_SERIALIZER}
var now = new Date();
var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
var soonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

var overdue = [], dueToday = [], dueSoon = [], flaggedTasks = [], deferred = [];
var allTasks = flattenedTasks;
for (var i = 0; i < allTasks.length; i++) {
  var t = allTasks[i];
  if (t.completed || t.taskStatus === Task.Status.Dropped) continue;
  if (t.taskStatus === Task.Status.Overdue) { overdue.push(t); }
  else if (t.dueDate && t.dueDate >= todayStart && t.dueDate < todayEnd) { dueToday.push(t); }
  else if (t.dueDate && t.dueDate >= todayEnd && t.dueDate < soonEnd) { dueSoon.push(t); }
  if (t.flagged && !t.dueDate) { flaggedTasks.push(t); }
  if (t.effectiveDeferDate && t.effectiveDeferDate >= todayStart && t.effectiveDeferDate < todayEnd) { deferred.push(t); }
}

JSON.stringify({
  overdue: overdue.map(function(t) { return serializeTask(t); }),
  dueToday: dueToday.map(function(t) { return serializeTask(t); }),
  dueSoon: dueSoon.map(function(t) { return serializeTask(t); }),
  flagged: flaggedTasks.map(function(t) { return serializeTask(t); }),
  deferredToToday: deferred.map(function(t) { return serializeTask(t); })
});`;
}
