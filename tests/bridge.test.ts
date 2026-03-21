import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { OmniFocusBridge } from "../src/omnifocus/bridge.js";
import { OmniFocusCliError } from "../src/errors.js";

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
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(null, { stdout: "result\n", stderr: "" });
          return undefined as never;
        },
      );

      const result = await bridge.executeOmniJS("test script");
      expect(result).toBe("result");
    });

    it("calls osascript with correct arguments", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(null, { stdout: "", stderr: "" });
          return undefined as never;
        },
      );

      await bridge.executeOmniJS("test script");

      expect(mockExecFile).toHaveBeenCalledWith(
        "/usr/bin/osascript",
        ["-l", "JavaScript", "-e", expect.stringContaining("evaluateJavascript")],
        expect.objectContaining({ maxBuffer: 10 * 1024 * 1024, timeout: 30_000 }),
        expect.any(Function),
      );
    });

    it("throws OMNIFOCUS_NOT_RUNNING when app is not running", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(new Error("Application not running"));
          return undefined as never;
        },
      );

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(OmniFocusCliError);
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "OMNIFOCUS_NOT_RUNNING",
      });
    });

    it("throws OMNIFOCUS_NOT_PRO for error code -1743", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(new Error("Error: -1743"));
          return undefined as never;
        },
      );

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(OmniFocusCliError);
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "OMNIFOCUS_NOT_PRO",
      });
    });

    it("throws SCRIPT_EXECUTION_FAILED for other errors", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(new Error("something went wrong"));
          return undefined as never;
        },
      );

      await expect(bridge.executeOmniJS("test")).rejects.toThrow(OmniFocusCliError);
      await expect(bridge.executeOmniJS("test")).rejects.toMatchObject({
        code: "SCRIPT_EXECUTION_FAILED",
      });
    });
  });

  describe("executeAndParse", () => {
    it("parses valid JSON from stdout", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(null, {
            stdout: '[{"id":"abc","name":"Test"}]',
            stderr: "",
          });
          return undefined as never;
        },
      );

      const result = await bridge.executeAndParse<{ id: string; name: string }[]>("test");
      expect(result).toEqual([{ id: "abc", name: "Test" }]);
    });

    it("throws PARSE_FAILED for invalid JSON", async () => {
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(null, { stdout: "not json", stderr: "" });
          return undefined as never;
        },
      );

      await expect(bridge.executeAndParse("test")).rejects.toThrow(OmniFocusCliError);
      await expect(bridge.executeAndParse("test")).rejects.toMatchObject({
        code: "PARSE_FAILED",
      });
    });

    it("includes truncated output in PARSE_FAILED message", async () => {
      const longOutput = "x".repeat(300);
      mockExecFile.mockImplementation(
        (_cmd, _args, _opts, callback) => {
          (callback as Function)(null, { stdout: longOutput, stderr: "" });
          return undefined as never;
        },
      );

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
