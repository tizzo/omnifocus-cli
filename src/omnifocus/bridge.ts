import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { type ErrorCode, OmniFocusCliError } from "../errors.js";

const execFileAsync = promisify(execFile);

/** Cap on how much underlying error detail is surfaced in a message. */
const MAX_DETAIL_LENGTH = 500;

/**
 * osascript reports the real failure on stderr. The rejection's `message` also
 * embeds the entire generated script — often several thousand characters — so
 * stderr is strongly preferred, with the message used only as a fallback.
 */
function readStderr(error: unknown): string {
  if (typeof error === "object" && error !== null && "stderr" in error) {
    const { stderr } = error as { readonly stderr?: unknown };
    if (typeof stderr === "string") {
      return stderr;
    }
  }
  return "";
}

/**
 * Strip osascript's wrapping from raw error output, so
 * `execution error: Error: Error: Task not found: abc undefined:69:29 (3)`
 * reads as `Task not found: abc`.
 */
function cleanOmniJSError(raw: string): string {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) =>
      line
        .replace(/^execution error:\s*/i, "")
        .replace(/^(?:Error:\s*)+/, "")
        // Trailing script position, e.g. "undefined:69:29 (3)"
        .replace(/\s+\S*:\d+:\d+(?:\s+\(-?\d+\))?$/, ""),
    )
    .join("; ")
    .slice(0, MAX_DETAIL_LENGTH);
}

/**
 * OmniJS has no typed errors — the script builders throw plain Errors for
 * missing entities. Map those back onto our error codes so callers can branch
 * on `code` instead of pattern-matching a message.
 */
const NOT_FOUND_CODES: readonly (readonly [RegExp, ErrorCode])[] = [
  [/\btask not found\b/i, "TASK_NOT_FOUND"],
  [/\bproject not found\b/i, "PROJECT_NOT_FOUND"],
  [/\btag not found\b/i, "TAG_NOT_FOUND"],
  // Also covers "Parent folder not found".
  [/\bfolder not found\b/i, "FOLDER_NOT_FOUND"],
];

export class OmniFocusBridge {
  async executeOmniJS(omniJSCode: string): Promise<string> {
    const jxaScript = `
      var app = Application("OmniFocus");
      app.evaluateJavascript(${JSON.stringify(omniJSCode)});
    `;

    try {
      const { stdout } = await execFileAsync(
        "/usr/bin/osascript",
        ["-l", "JavaScript", "-e", jxaScript],
        { maxBuffer: 10 * 1024 * 1024, timeout: 30_000 },
      );
      return stdout.trim();
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const stderr = readStderr(error);

      // Classify against stderr where possible: the fallback message embeds the
      // script, whose contents (task names, notes) could otherwise false-match.
      const haystack = stderr.trim().length > 0 ? stderr : rawMessage;

      if (haystack.includes("not running")) {
        throw new OmniFocusCliError(
          "OMNIFOCUS_NOT_RUNNING",
          "OmniFocus is not running. Please launch OmniFocus and try again.",
        );
      }

      if (haystack.includes("-1743")) {
        throw new OmniFocusCliError(
          "OMNIFOCUS_NOT_PRO",
          "OmniFocus Pro is required for Omni Automation support.",
        );
      }

      const detail =
        cleanOmniJSError(stderr) || cleanOmniJSError(rawMessage) || rawMessage;

      for (const [pattern, code] of NOT_FOUND_CODES) {
        if (pattern.test(detail)) {
          throw new OmniFocusCliError(code, detail);
        }
      }

      throw new OmniFocusCliError(
        "SCRIPT_EXECUTION_FAILED",
        `OmniJS script execution failed: ${detail}`,
      );
    }
  }

  async executeAndParse<T>(omniJSCode: string): Promise<T> {
    const raw = await this.executeOmniJS(omniJSCode);

    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed as T;
    } catch {
      throw new OmniFocusCliError(
        "PARSE_FAILED",
        `Failed to parse OmniJS response: ${raw.slice(0, 200)}`,
      );
    }
  }
}
