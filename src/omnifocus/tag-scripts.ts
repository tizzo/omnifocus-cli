import type { UpdateTagInput } from "../types/omnifocus.js";
import { escapeOmniString } from "./scripts.js";
import { TAG_SERIALIZER } from "./serializers.js";

export function buildCreateTagScript(name: string): string {
  const escaped = escapeOmniString(name);
  return `${TAG_SERIALIZER}
var newTag = new Tag('${escaped}');
JSON.stringify(serializeTag(newTag, false));`;
}

export function buildDeleteTagScript(nameOrId: string): string {
  const escaped = escapeOmniString(nameOrId);
  return `var tag = Tag.byIdentifier('${escaped}') || flattenedTags.byName('${escaped}');
if (!tag) { throw new Error('Tag not found: ${escaped}'); }
var tagName = tag.name;
deleteObject(tag);
JSON.stringify({ deleted: true, id: '${escaped}', name: tagName });`;
}

export function buildUpdateTagScript(
  nameOrId: string,
  input: UpdateTagInput,
): string {
  const escaped = escapeOmniString(nameOrId);
  const lines: string[] = [
    TAG_SERIALIZER,
    `var tag = Tag.byIdentifier('${escaped}') || flattenedTags.byName('${escaped}');`,
    `if (!tag) { throw new Error('Tag not found: ${escaped}'); }`,
  ];

  if (input.name !== undefined) {
    lines.push(`tag.name = '${escapeOmniString(input.name)}';`);
  }
  if (input.status === "active") {
    lines.push("tag.status = Tag.Status.Active;");
  } else if (input.status === "onhold") {
    lines.push("tag.status = Tag.Status.OnHold;");
  } else if (input.status === "dropped") {
    lines.push("tag.status = Tag.Status.Dropped;");
  }

  lines.push("JSON.stringify(serializeTag(tag, false));");
  return lines.join("\n");
}
