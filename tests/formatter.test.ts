import { afterEach, describe, expect, it, vi } from "vitest";
import { formatOutput, writeOutput } from "../src/output/formatter.js";

describe("formatOutput", () => {
  describe("json mode", () => {
    it("returns pretty-printed JSON string", () => {
      const result = formatOutput({ name: "Test" }, "json");
      expect(result).toBe(JSON.stringify({ name: "Test" }, null, 2));
    });

    it("output is valid parseable JSON", () => {
      const data = { id: "1", name: "Task", completed: true };
      const result = formatOutput(data, "json");
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it("array data round-trips correctly", () => {
      const data = [
        { id: "1", name: "A" },
        { id: "2", name: "B" },
      ];
      const result = formatOutput(data, "json");
      expect(JSON.parse(result)).toEqual(data);
    });

    it("single object round-trips correctly", () => {
      const data = { id: "abc", name: "My Task", flagged: true };
      const result = formatOutput(data, "json");
      expect(JSON.parse(result)).toEqual(data);
    });
  });

  describe("pretty mode", () => {
    it("array items show name and id", () => {
      const data = [{ id: "abc", name: "Buy milk" }];
      const result = formatOutput(data, "pretty");
      expect(result).toContain("[abc]");
      expect(result).toContain("Buy milk");
    });

    it("shows checkbox for completed items (checked)", () => {
      const data = [{ id: "1", name: "Done task", completed: true }];
      const result = formatOutput(data, "pretty");
      expect(result).toContain("[x]");
    });

    it("shows checkbox for incomplete items (unchecked)", () => {
      const data = [{ id: "1", name: "Open task", completed: false }];
      const result = formatOutput(data, "pretty");
      expect(result).toContain("[ ]");
    });

    it("shows due date when present", () => {
      const data = [{ id: "1", name: "Task", dueDate: "2026-04-01" }];
      const result = formatOutput(data, "pretty");
      expect(result).toContain("(due: 2026-04-01)");
    });

    it("empty array returns empty string", () => {
      const result = formatOutput([], "pretty");
      expect(result).toBe("");
    });

    it("falls back to JSON for non-array/non-object data", () => {
      const result = formatOutput("just a string", "pretty");
      expect(result).toBe(JSON.stringify("just a string", null, 2));
    });
  });
});

describe("writeOutput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("writes formatOutput result plus newline to stdout", () => {
    const spy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const data = [{ id: "1", name: "Test" }];
    writeOutput(data, "json");
    expect(spy).toHaveBeenCalledWith(`${formatOutput(data, "json")}\n`);
  });

  it("writes pretty format to stdout", () => {
    const spy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const data = [{ id: "1", name: "Test", completed: false }];
    writeOutput(data, "pretty");
    expect(spy).toHaveBeenCalledWith(`${formatOutput(data, "pretty")}\n`);
  });
});
