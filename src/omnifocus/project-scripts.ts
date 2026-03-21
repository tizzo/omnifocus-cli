import { PROJECT_SERIALIZER } from "./serializers.js";
import { escapeOmniString } from "./scripts.js";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../types/omnifocus.js";

export function buildViewProjectScript(projectNameOrId: string): string {
  const escaped = escapeOmniString(projectNameOrId);
  return `${PROJECT_SERIALIZER}
var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');
if (!project) { throw new Error('Project not found: ${escaped}'); }
JSON.stringify(serializeProject(project));`;
}

export function buildCreateProjectScript(input: CreateProjectInput): string {
  const escaped = escapeOmniString(input.name);
  const lines: string[] = [
    PROJECT_SERIALIZER,
    `var proj = new Project('${escaped}');`,
  ];

  if (input.note !== undefined) {
    lines.push(`proj.note = '${escapeOmniString(input.note)}';`);
  }
  if (input.dueDate !== undefined) {
    lines.push(
      `proj.dueDate = new Date('${escapeOmniString(input.dueDate)}');`,
    );
  }
  if (input.deferDate !== undefined) {
    lines.push(
      `proj.deferDate = new Date('${escapeOmniString(input.deferDate)}');`,
    );
  }
  if (input.sequential === true) {
    lines.push("proj.sequential = true;");
  }
  if (input.status === "onhold") {
    lines.push("proj.status = Project.Status.OnHold;");
  }
  if (input.folder !== undefined) {
    const ef = escapeOmniString(input.folder);
    lines.push(
      `var targetFolder = flattenedFolders.byName('${ef}'); if (targetFolder) { moveSections([proj], targetFolder); }`,
    );
  }

  lines.push("JSON.stringify(serializeProject(proj));");
  return lines.join("\n");
}

export function buildDeleteProjectScript(projectNameOrId: string): string {
  const escaped = escapeOmniString(projectNameOrId);
  return `var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');
if (!project) { throw new Error('Project not found: ${escaped}'); }
var projectName = project.name;
deleteObject(project);
JSON.stringify({ deleted: true, id: '${escaped}', name: projectName });`;
}

export function buildUpdateProjectScript(
  projectNameOrId: string,
  input: UpdateProjectInput,
): string {
  const escaped = escapeOmniString(projectNameOrId);
  const lines: string[] = [
    PROJECT_SERIALIZER,
    `var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');`,
    `if (!project) { throw new Error('Project not found: ${escaped}'); }`,
  ];

  if (input.name !== undefined) {
    lines.push(`project.name = '${escapeOmniString(input.name)}';`);
  }
  if (input.note !== undefined) {
    lines.push(`project.note = '${escapeOmniString(input.note)}';`);
  }
  if (input.dueDate === null) {
    lines.push("project.dueDate = null;");
  } else if (input.dueDate !== undefined) {
    lines.push(
      `project.dueDate = new Date('${escapeOmniString(input.dueDate)}');`,
    );
  }
  if (input.deferDate === null) {
    lines.push("project.deferDate = null;");
  } else if (input.deferDate !== undefined) {
    lines.push(
      `project.deferDate = new Date('${escapeOmniString(input.deferDate)}');`,
    );
  }
  if (input.status !== undefined) {
    const statusMap: Record<string, string> = {
      active: "Project.Status.Active",
      onhold: "Project.Status.OnHold",
      done: "Project.Status.Done",
      dropped: "Project.Status.Dropped",
    };
    const mapped = statusMap[input.status];
    if (mapped !== undefined) {
      lines.push(`project.status = ${mapped};`);
    }
  }

  lines.push("JSON.stringify(serializeProject(project));");
  return lines.join("\n");
}

export function buildCompleteProjectScript(projectNameOrId: string): string {
  const escaped = escapeOmniString(projectNameOrId);
  return `${PROJECT_SERIALIZER}
var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');
if (!project) { throw new Error('Project not found: ${escaped}'); }
project.markComplete();
JSON.stringify(serializeProject(project));`;
}

export function buildUncompleteProjectScript(projectNameOrId: string): string {
  const escaped = escapeOmniString(projectNameOrId);
  return `${PROJECT_SERIALIZER}
var project = Project.byIdentifier('${escaped}') || flattenedProjects.byName('${escaped}');
if (!project) { throw new Error('Project not found: ${escaped}'); }
project.markIncomplete();
JSON.stringify(serializeProject(project));`;
}
