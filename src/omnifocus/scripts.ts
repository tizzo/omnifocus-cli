import type {
  CreateTaskInput,
  ProjectFilters,
  ProjectTaskOptions,
  TagListOptions,
} from "../types/omnifocus.js";
import {
  PROJECT_SERIALIZER,
  TAG_SERIALIZER,
  TASK_SERIALIZER,
} from "./serializers.js";

export function escapeOmniString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

export function buildListInboxScript(
  status?:
    | "available"
    | "completed"
    | "blocked"
    | "dropped"
    | "remaining"
    | "all",
): string {
  const effective = status ?? "remaining";
  let conditions = "";
  if (effective === "available") {
    conditions = `.filter(function(t) { return t.taskStatus === Task.Status.Available; })`;
  } else if (effective === "completed") {
    conditions = `.filter(function(t) { return t.completed; })`;
  } else if (effective === "blocked") {
    conditions = `.filter(function(t) { return t.taskStatus === Task.Status.Blocked; })`;
  } else if (effective === "dropped") {
    conditions = `.filter(function(t) { return t.taskStatus === Task.Status.Dropped; })`;
  } else if (effective === "remaining") {
    conditions = `.filter(function(t) { return !t.completed && t.taskStatus !== Task.Status.Dropped; })`;
  }
  // "all" → no filter
  return `${TASK_SERIALIZER}
JSON.stringify(inbox${conditions}.map(function(t) { return serializeTask(t); }));`;
}

export function buildListProjectsScript(filters: ProjectFilters): string {
  let filterChain = "";

  if (filters.status === "all") {
    // no status filter
  } else if (filters.status === "onhold") {
    filterChain += `.filter(function(p) { return p.status === Project.Status.OnHold; })`;
  } else {
    filterChain += `.filter(function(p) { return p.status === Project.Status.Active; })`;
  }

  if (filters.folder) {
    const escaped = escapeOmniString(filters.folder);
    filterChain += `.filter(function(p) { return p.parentFolder && p.parentFolder.name === '${escaped}'; })`;
  }

  return `${PROJECT_SERIALIZER}
var resultProjects = flattenedProjects${filterChain};
JSON.stringify(resultProjects.map(function(p) { return serializeProject(p); }));`;
}

export function buildListProjectTasksScript(
  projectNameOrId: string,
  options: ProjectTaskOptions,
): string {
  const escaped = escapeOmniString(projectNameOrId);
  const taskFilter = options.completed
    ? ""
    : `.filter(function(t) { return !t.completed; })`;

  return `${TASK_SERIALIZER}
var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');
if (!project) { throw new Error('Project not found: ${escaped}'); }
var tasks = project.flattenedTasks${taskFilter};
JSON.stringify(tasks.map(function(t) { return serializeTask(t); }));`;
}

export function buildCreateTaskScript(input: CreateTaskInput): string {
  const escaped = escapeOmniString(input.name);
  const lines: string[] = [
    TASK_SERIALIZER,
    `var task = new Task('${escaped}', null);`,
  ];

  if (input.note !== undefined) {
    lines.push(`task.note = '${escapeOmniString(input.note)}';`);
  }

  if (input.dueDate !== undefined) {
    lines.push(
      `task.dueDate = new Date('${escapeOmniString(input.dueDate)}');`,
    );
  }

  if (input.deferDate !== undefined) {
    lines.push(
      `task.deferDate = new Date('${escapeOmniString(input.deferDate)}');`,
    );
  }

  if (input.flagged !== undefined) {
    lines.push(`task.flagged = ${input.flagged ? "true" : "false"};`);
  }

  if (input.tags) {
    for (const tag of input.tags) {
      const escapedTag = escapeOmniString(tag);
      lines.push(
        `var foundTag = flattenedTags.byName('${escapedTag}'); if (!foundTag) { throw new Error('Tag not found: ${escapedTag}'); } task.addTag(foundTag);`,
      );
    }
  }

  if (input.project) {
    const escapedProject = escapeOmniString(input.project);
    lines.push(
      `var targetProject = flattenedProjects.byName('${escapedProject}'); if (!targetProject) { throw new Error('Project not found: ${escapedProject}'); } moveTasks([task], targetProject);`,
    );
  }

  lines.push(`JSON.stringify(serializeTask(task));`);

  return lines.join("\n");
}

export function buildCompleteTaskScript(taskId: string): string {
  const escaped = escapeOmniString(taskId);

  return `${TASK_SERIALIZER}
var task = Task.byIdentifier('${escaped}');
if (!task) { throw new Error('Task not found: ${escaped}'); }
task.markComplete();
JSON.stringify(serializeTask(task));`;
}

export function buildListTagsScript(options: TagListOptions): string {
  if (options.flat) {
    return `${TAG_SERIALIZER}
JSON.stringify(flattenedTags.map(function(t) { return serializeTag(t, false); }));`;
  }

  return `${TAG_SERIALIZER}
JSON.stringify(tags.map(function(t) { return serializeTag(t, true); }));`;
}
