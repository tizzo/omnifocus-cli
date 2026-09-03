import { describe, expect, it } from "vitest";
import { formatErrorOutput, OmniFocusCliError } from "../src/errors.js";

describe("OmniFocusCliError", () => {
  it("sets code, message, and name", () => {
    const error = new OmniFocusCliError("TASK_NOT_FOUND", "Task missing");
    expect(error.code).toBe("TASK_NOT_FOUND");
    expect(error.message).toBe("Task missing");
    expect(error.name).toBe("OmniFocusCliError");
  });

  it("is an instance of Error", () => {
    const error = new OmniFocusCliError("INVALID_INPUT", "bad input");
    expect(error).toBeInstanceOf(Error);
  });

  it("code is readonly and matches input", () => {
    const error = new OmniFocusCliError("PARSE_FAILED", "parse error");
    expect(error.code).toBe("PARSE_FAILED");
  });
});

describe("formatErrorOutput", () => {
  it("formats OmniFocusCliError with code and message", () => {
    const error = new OmniFocusCliError("TASK_NOT_FOUND", "No such task");
    const output = formatErrorOutput(error);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toEqual({
      error: true,
      code: "TASK_NOT_FOUND",
      message: "No such task",
    });
  });

  it("formats regular Error with UNKNOWN code", () => {
    const error = new Error("something broke");
    const output = formatErrorOutput(error);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toEqual({
      error: true,
      code: "UNKNOWN",
      message: "something broke",
    });
  });

  it("formats string errors with UNKNOWN code", () => {
    const output = formatErrorOutput("string error");
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toEqual({
      error: true,
      code: "UNKNOWN",
      message: "string error",
    });
  });

  it("formats non-error values with UNKNOWN code", () => {
    const output = formatErrorOutput(42);
    const parsed = JSON.parse(output) as Record<string, unknown>;
    expect(parsed).toEqual({
      error: true,
      code: "UNKNOWN",
      message: "42",
    });
  });

  it("returns valid JSON", () => {
    const output = formatErrorOutput(new Error("test"));
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("returns pretty-printed output", () => {
    const output = formatErrorOutput(new Error("test"));
    expect(output).toContain("\n");
  });
});
