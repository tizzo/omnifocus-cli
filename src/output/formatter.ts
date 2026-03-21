import type { OutputFormat } from "../types/cli.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatItem(item: unknown): string {
  if (!isRecord(item)) {
    return JSON.stringify(item);
  }

  const parts: string[] = [];

  if (typeof item["completed"] === "boolean") {
    parts.push(item["completed"] ? "[x]" : "[ ]");
  }

  if (typeof item["id"] === "string" && typeof item["name"] === "string") {
    parts.push(`[${item["id"]}]`);
    parts.push(item["name"]);
  } else if (typeof item["name"] === "string") {
    parts.push(item["name"]);
  } else {
    return JSON.stringify(item);
  }

  if (typeof item["dueDate"] === "string") {
    parts.push(`(due: ${item["dueDate"]})`);
  }

  return parts.join(" ");
}

export function formatOutput(data: unknown, format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify(data, null, 2);
  }

  if (Array.isArray(data)) {
    return data.map(formatItem).join("\n");
  }

  if (isRecord(data) && typeof data["name"] === "string") {
    return formatItem(data);
  }

  return JSON.stringify(data, null, 2);
}

export function writeOutput(data: unknown, format: OutputFormat): void {
  process.stdout.write(formatOutput(data, format) + "\n");
}
