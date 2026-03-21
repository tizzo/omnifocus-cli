import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { OmniFocusCliError } from "../errors.js";

const execFileAsync = promisify(execFile);

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
      const message =
        error instanceof Error ? error.message : String(error);

      if (message.includes("not running")) {
        throw new OmniFocusCliError(
          "OMNIFOCUS_NOT_RUNNING",
          "OmniFocus is not running. Please launch OmniFocus and try again.",
        );
      }

      if (message.includes("-1743")) {
        throw new OmniFocusCliError(
          "OMNIFOCUS_NOT_PRO",
          "OmniFocus Pro is required for Omni Automation support.",
        );
      }

      throw new OmniFocusCliError(
        "SCRIPT_EXECUTION_FAILED",
        `OmniJS script execution failed: ${message}`,
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
