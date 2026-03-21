import { TASK_SERIALIZER } from "./serializers.js";

export function buildForecastScript(): string {
  return `${TASK_SERIALIZER}
var now = new Date();
var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
var todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
var soonEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);

var allTasks = flattenedTasks.filter(function(t) { return !t.completed && t.taskStatus !== Task.Status.Dropped; });

var overdue = allTasks.filter(function(t) { return t.taskStatus === Task.Status.Overdue; });
var dueToday = allTasks.filter(function(t) { return t.dueDate && t.dueDate >= todayStart && t.dueDate < todayEnd && t.taskStatus !== Task.Status.Overdue; });
var dueSoon = allTasks.filter(function(t) { return t.dueDate && t.dueDate >= todayEnd && t.dueDate < soonEnd; });
var flaggedTasks = allTasks.filter(function(t) { return t.flagged && !t.dueDate; });
var deferred = allTasks.filter(function(t) { return t.effectiveDeferDate && t.effectiveDeferDate <= todayEnd && t.effectiveDeferDate >= todayStart; });

JSON.stringify({
  overdue: overdue.map(function(t) { return serializeTask(t); }),
  dueToday: dueToday.map(function(t) { return serializeTask(t); }),
  dueSoon: dueSoon.map(function(t) { return serializeTask(t); }),
  flagged: flaggedTasks.map(function(t) { return serializeTask(t); }),
  deferredToToday: deferred.map(function(t) { return serializeTask(t); })
});`;
}
