import { TASK_SERIALIZER } from "./serializers.js";
import { escapeOmniString } from "./scripts.js";
import type {
  TaskListFilters,
  UpdateTaskInput,
  SearchOptions,
} from "../types/omnifocus.js";

export function buildListTasksScript(filters: TaskListFilters): string {
  const conditions: string[] = [];

  if (filters.status === "available") {
    conditions.push("t.taskStatus === Task.Status.Available");
  } else if (filters.status === "completed") {
    conditions.push("t.completed");
  } else if (filters.status === "blocked") {
    conditions.push("t.taskStatus === Task.Status.Blocked");
  } else if (filters.status === "dropped") {
    conditions.push("t.taskStatus === Task.Status.Dropped");
  } else {
    // Default and "remaining": active, non-dropped tasks
    conditions.push("!t.completed && t.taskStatus !== Task.Status.Dropped");
  }

  if (filters.flagged === true) {
    conditions.push("t.flagged");
  }

  if (filters.project !== undefined) {
    const escaped = escapeOmniString(filters.project);
    conditions.push(
      `t.containingProject && t.containingProject.name === '${escaped}'`,
    );
  }

  if (filters.tag !== undefined) {
    const escaped = escapeOmniString(filters.tag);
    conditions.push(
      `t.tags.some(function(tag) { return tag.name === '${escaped}'; })`,
    );
  }

  if (filters.dueBefore !== undefined) {
    conditions.push(
      `t.dueDate && t.dueDate <= new Date('${escapeOmniString(filters.dueBefore)}')`,
    );
  }

  if (filters.dueAfter !== undefined) {
    conditions.push(
      `t.dueDate && t.dueDate >= new Date('${escapeOmniString(filters.dueAfter)}')`,
    );
  }

  const filterExpr =
    conditions.length > 0
      ? `.filter(function(t) { return ${conditions.join(" && ")}; })`
      : "";

  let sortExpr = "";
  if (filters.sort === "name") {
    sortExpr = `.sort(function(a, b) { return a.name.localeCompare(b.name); })`;
  } else if (filters.sort === "due") {
    sortExpr = `.sort(function(a, b) { if (!a.dueDate) return 1; if (!b.dueDate) return -1; return new Date(a.dueDate) - new Date(b.dueDate); })`;
  } else if (filters.sort === "defer") {
    sortExpr = `.sort(function(a, b) { if (!a.deferDate) return 1; if (!b.deferDate) return -1; return new Date(a.deferDate) - new Date(b.deferDate); })`;
  } else if (filters.sort === "flagged") {
    sortExpr = `.sort(function(a, b) { return (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0); })`;
  }

  const limitExpr =
    filters.limit !== undefined ? `.slice(0, ${filters.limit})` : "";

  if (filters.countOnly === true) {
    return `var resultTasks = flattenedTasks${filterExpr};
JSON.stringify({ count: resultTasks.length });`;
  }

  return `${TASK_SERIALIZER}
var resultTasks = flattenedTasks${filterExpr}${sortExpr}${limitExpr};
JSON.stringify(resultTasks.map(function(t) { return serializeTask(t); }));`;
}

export function buildViewTaskScript(taskId: string): string {
  const escaped = escapeOmniString(taskId);
  return `${TASK_SERIALIZER}
var task = Task.byIdentifier('${escaped}');
if (!task) { throw new Error('Task not found: ${escaped}'); }
JSON.stringify(serializeTask(task));`;
}

export function buildUpdateTaskScript(
  taskId: string,
  input: UpdateTaskInput,
): string {
  const escaped = escapeOmniString(taskId);
  const lines: string[] = [
    TASK_SERIALIZER,
    `var task = Task.byIdentifier('${escaped}');`,
    `if (!task) { throw new Error('Task not found: ${escaped}'); }`,
  ];

  if (input.name !== undefined) {
    lines.push(`task.name = '${escapeOmniString(input.name)}';`);
  }
  if (input.note !== undefined) {
    lines.push(`task.note = '${escapeOmniString(input.note)}';`);
  }
  if (input.dueDate === null) {
    lines.push("task.dueDate = null;");
  } else if (input.dueDate !== undefined) {
    lines.push(
      `task.dueDate = new Date('${escapeOmniString(input.dueDate)}');`,
    );
  }
  if (input.deferDate === null) {
    lines.push("task.deferDate = null;");
  } else if (input.deferDate !== undefined) {
    lines.push(
      `task.deferDate = new Date('${escapeOmniString(input.deferDate)}');`,
    );
  }
  if (input.flagged !== undefined) {
    lines.push(`task.flagged = ${input.flagged ? "true" : "false"};`);
  }
  if (input.project === null) {
    lines.push("moveTasks([task], inbox);");
  } else if (input.project !== undefined) {
    const ep = escapeOmniString(input.project);
    lines.push(
      `var targetProject = flattenedProjects.byName('${ep}'); if (!targetProject) { throw new Error('Project not found: ${ep}'); } moveTasks([task], targetProject);`,
    );
  }
  if (input.addTags !== undefined) {
    for (const tag of input.addTags) {
      const et = escapeOmniString(tag);
      lines.push(
        `var addTag = flattenedTags.byName('${et}'); if (!addTag) { throw new Error('Tag not found: ${et}'); } task.addTag(addTag);`,
      );
    }
  }
  if (input.removeTags !== undefined) {
    for (const tag of input.removeTags) {
      const et = escapeOmniString(tag);
      lines.push(
        `var rmTag = flattenedTags.byName('${et}'); if (rmTag) { task.removeTag(rmTag); }`,
      );
    }
  }

  lines.push("JSON.stringify(serializeTask(task));");
  return lines.join("\n");
}

export function buildDeleteTaskScript(taskId: string): string {
  const escaped = escapeOmniString(taskId);
  return `var task = Task.byIdentifier('${escaped}');
if (!task) { throw new Error('Task not found: ${escaped}'); }
var taskName = task.name;
deleteObject(task);
JSON.stringify({ deleted: true, id: '${escaped}', name: taskName });`;
}

export function buildMoveTaskScript(
  taskId: string,
  projectName: string,
): string {
  const escapedId = escapeOmniString(taskId);
  const escapedProject = escapeOmniString(projectName);
  return `${TASK_SERIALIZER}
var task = Task.byIdentifier('${escapedId}');
if (!task) { throw new Error('Task not found: ${escapedId}'); }
var targetProject = flattenedProjects.byName('${escapedProject}');
if (!targetProject) { throw new Error('Project not found: ${escapedProject}'); }
moveTasks([task], targetProject);
JSON.stringify(serializeTask(task));`;
}

export function buildSearchScript(
  query: string,
  options: SearchOptions,
): string {
  const escaped = escapeOmniString(query.toLowerCase());
  const conditions: string[] = [
    `(t.name.toLowerCase().indexOf(_q) !== -1 || t.note.toLowerCase().indexOf(_q) !== -1)`,
  ];

  if (options.includeCompleted !== true) {
    conditions.push("!t.completed");
  }
  if (options.project !== undefined) {
    const ep = escapeOmniString(options.project);
    conditions.push(
      `t.containingProject && t.containingProject.name === '${ep}'`,
    );
  }
  if (options.tag !== undefined) {
    const et = escapeOmniString(options.tag);
    conditions.push(
      `t.tags.some(function(tag) { return tag.name === '${et}'; })`,
    );
  }

  const limitExpr =
    options.limit !== undefined ? `.slice(0, ${options.limit})` : "";

  return `${TASK_SERIALIZER}
var _q = '${escaped}';
var resultTasks = flattenedTasks.filter(function(t) { return ${conditions.join(" && ")}; })${limitExpr};
JSON.stringify(resultTasks.map(function(t) { return serializeTask(t); }));`;
}
