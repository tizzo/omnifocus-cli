import { FOLDER_SERIALIZER } from "./serializers.js";
import { escapeOmniString } from "./scripts.js";
import { PROJECT_SERIALIZER } from "./serializers.js";

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
