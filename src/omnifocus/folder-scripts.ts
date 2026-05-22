import { FOLDER_SERIALIZER, PROJECT_SERIALIZER } from "./serializers.js";
import { escapeOmniString } from "./scripts.js";
import type {
  CreateFolderInput,
  UpdateFolderInput,
} from "../types/omnifocus.js";

export function buildListFoldersScript(): string {
  return `${FOLDER_SERIALIZER}
JSON.stringify(flattenedFolders.map(function(f) { return serializeFolder(f); }));`;
}

export function buildViewFolderScript(folderName: string): string {
  const escaped = escapeOmniString(folderName);
  return `${FOLDER_SERIALIZER}
${PROJECT_SERIALIZER}
var folder = Folder.byIdentifier('${escaped}') || flattenedFolders.byName('${escaped}');
if (!folder) { throw new Error('Folder not found: ${escaped}'); }
var result = serializeFolder(folder);
result.projects = folder.projects.map(function(p) { return serializeProject(p); });
result.subfolders = folder.folders.map(function(f) { return serializeFolder(f); });
JSON.stringify(result);`;
}

export function buildCreateFolderScript(input: CreateFolderInput): string {
  const escaped = escapeOmniString(input.name);
  const lines: string[] = [
    FOLDER_SERIALIZER,
    `var newFolder = new Folder('${escaped}');`,
  ];

  if (input.parent !== undefined) {
    const ep = escapeOmniString(input.parent);
    lines.push(
      `var parentFolder = Folder.byIdentifier('${ep}') || flattenedFolders.byName('${ep}');`,
      `if (!parentFolder) { throw new Error('Parent folder not found: ${ep}'); }`,
      "moveSections([newFolder], parentFolder);",
    );
  }

  lines.push("JSON.stringify(serializeFolder(newFolder));");
  return lines.join("\n");
}

export function buildDeleteFolderScript(folderNameOrId: string): string {
  const escaped = escapeOmniString(folderNameOrId);
  return `var folder = Folder.byIdentifier('${escaped}') || flattenedFolders.byName('${escaped}');
if (!folder) { throw new Error('Folder not found: ${escaped}'); }
var folderName = folder.name;
deleteObject(folder);
JSON.stringify({ deleted: true, id: '${escaped}', name: folderName });`;
}

export function buildUpdateFolderScript(
  folderNameOrId: string,
  input: UpdateFolderInput,
): string {
  const escaped = escapeOmniString(folderNameOrId);
  const lines: string[] = [
    FOLDER_SERIALIZER,
    `var folder = Folder.byIdentifier('${escaped}') || flattenedFolders.byName('${escaped}');`,
    `if (!folder) { throw new Error('Folder not found: ${escaped}'); }`,
  ];

  if (input.name !== undefined) {
    lines.push(`folder.name = '${escapeOmniString(input.name)}';`);
  }
  if (input.status === "active") {
    lines.push("folder.status = Folder.Status.Active;");
  } else if (input.status === "dropped") {
    lines.push("folder.status = Folder.Status.Dropped;");
  }
  if (input.parent === null) {
    lines.push("moveSections([folder], library);");
  } else if (input.parent !== undefined) {
    const ep = escapeOmniString(input.parent);
    lines.push(
      `var newParent = Folder.byIdentifier('${ep}') || flattenedFolders.byName('${ep}');`,
      `if (!newParent) { throw new Error('Parent folder not found: ${ep}'); }`,
      "moveSections([folder], newParent);",
    );
  }

  lines.push("JSON.stringify(serializeFolder(folder));");
  return lines.join("\n");
}
