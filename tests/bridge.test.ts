import { execFile } from "node:child_process";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OmniFocusCliError } from "../src/errors.js";
import { OmniFocusBridge } from "../src/omnifocus/bridge.js";

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

const mockExecFile = vi.mocked(execFile);

describe("OmniFocusBridge", () => {
  let bridge: OmniFocusBridge;

  beforeEach(() => {
    bridge = new OmniFocusBridge();
  });

  describe("executeOmniJS", () => {
    it("returns trimmed stdout on success", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(null, { stdout: "result\n", stderr: "" });
        return undefined as never;
      });

      const result = await bridge.executeOmniJS("test script");
      expect(result).toBe("result");
    });

    it("calls osascript with correct arguments", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(null, { stdout: "", stderr: "" });
        return undefined as never;
      });

      await bridge.executeOmniJS("test script");

      expect(mockExecFile).toHaveBeenCalledWith(
        "/usr/bin/osascript",
        [
          "-l",
          "JavaScript",
          "-e",
          expect.stringContaining("evaluateJavascript"),
        ],
        expect.objectContaining({
          maxBuffer: 10 * 1024 * 1024,
          timeout: 30_000,
        }),
        expect.any(Function),
      );
    });

    it("throws OMNIFOCUS_NOT_RUNNING when app is not running", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(new Error("Application not running"));
        return undefined as never;
      });

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(
        OmniFocusCliError,
      );
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "OMNIFOCUS_NOT_RUNNING",
      });
    });

    it("throws OMNIFOCUS_NOT_PRO for error code -1743", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(new Error("Error: -1743"));
        return undefined as never;
      });

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(
        OmniFocusCliError,
      );
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "OMNIFOCUS_NOT_PRO",
      });
    });

    it("throws SCRIPT_EXECUTION_FAILED for other errors", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(new Error("something went wrong"));
        return undefined as never;
      });

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(
        OmniFocusCliError,
      );
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "SCRIPT_EXECUTION_FAILED",
      });
    });

    /**
     * A real osascript rejection carries the whole generated script in
     * `message` and the actual failure in `stderr`.
     */
    function rejectWith(message: string, stderr: string): void {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const error = new Error(message) as Error & { stderr: string };
        error.stderr = stderr;
        (callback as Function)(error);
        return undefined as never;
      });
    }

    it("reports stderr and omits the script embedded in message", async () => {
      const script = `var x = ${"y".repeat(3000)};`;
      rejectWith(
        `Command failed: /usr/bin/osascript -l JavaScript -e ${script}`,
        "execution error: Error: Error: Something broke undefined:69:29 (3)\n",
      );

      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "SCRIPT_EXECUTION_FAILED",
        message: "OmniJS script execution failed: Something broke",
      });
    });

    it("strips osascript wrapping and the trailing script position", async () => {
      rejectWith(
        "Command failed",
        "execution error: Error: Error: Error: Boom undefined:12:7 (3)\n",
      );

      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        message: "OmniJS script execution failed: Boom",
      });
    });

    it("caps how much error detail is surfaced", async () => {
      rejectWith(
        "Command failed",
        `execution error: Error: ${"z".repeat(2000)}`,
      );

      try {
        await bridge.executeOmniJS("test");
        expect.fail("should have thrown");
      } catch (error: unknown) {
        const cliError = error as OmniFocusCliError;
        expect(cliError.message.length).toBeLessThan(600);
      }
    });

    it.each([
      ["Task not found: abc", "TASK_NOT_FOUND"],
      ["Project not found: Work", "PROJECT_NOT_FOUND"],
      ["Tag not found: urgent", "TAG_NOT_FOUND"],
      ["Folder not found: Home", "FOLDER_NOT_FOUND"],
      ["Parent folder not found: Home", "FOLDER_NOT_FOUND"],
    ])("maps %j to %s", async (omniJSError, expectedCode) => {
      rejectWith("Command failed", `execution error: Error: ${omniJSError}`);

      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: expectedCode,
        // Typed not-found errors carry the bare message, unprefixed.
        message: omniJSError,
      });
    });

    it("classifies on stderr rather than the script in message", async () => {
      // A task note containing "not running" must not be mistaken for a
      // stopped-app error now that the script is embedded in `message`.
      rejectWith(
        "Command failed: osascript -e \"var note = 'not running';\"",
        "execution error: Error: Task not found: abc",
      );

      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "TASK_NOT_FOUND",
      });
    });

    it("still detects a stopped app when stderr is empty", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(new Error("Application not running"));
        return undefined as never;
      });

      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "OMNIFOCUS_NOT_RUNNING",
      });
    });
  });

  describe("executeAndParse", () => {
    it("parses valid JSON from stdout", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(null, {
          stdout: '[{"id":"abc","name":"Test"}]',
          stderr: "",
        });
        return undefined as never;
      });

      const result =
        await bridge.executeAndParse<{ id: string; name: string }[]>("test");
      expect(result).toEqual([{ id: "abc", name: "Test" }]);
    });

    it("throws PARSE_FAILED for invalid JSON", async () => {
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(null, { stdout: "not json", stderr: "" });
        return undefined as never;
      });

      await expect(bridge.executeAndParse("test")).rejects.toThrow(
        OmniFocusCliError,
      );
      await expect(bridge.executeAndParse("test")).rejects.toMatchObject({
        code: "PARSE_FAILED",
      });
    });

    it("includes truncated output in PARSE_FAILED message", async () => {
      const longOutput = "x".repeat(300);
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        (callback as Function)(null, { stdout: longOutput, stderr: "" });
        return undefined as never;
      });

      try {
        await bridge.executeAndParse("test");
        expect.fail("should have thrown");
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(OmniFocusCliError);
        const cliError = error as OmniFocusCliError;
        expect(cliError.message).toContain("x".repeat(200));
        expect(cliError.message.length).toBeLessThan(longOutput.length + 100);
      }
    });
  });
});
