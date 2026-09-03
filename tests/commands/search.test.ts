import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchCommand } from "../../src/commands/search.js";

const { mockExecuteAndParse, mockWriteOutput } = vi.hoisted(() => ({
  mockExecuteAndParse: vi.fn(),
  mockWriteOutput: vi.fn(),
}));

vi.mock("../../src/omnifocus/bridge.js", () => {
  const Bridge = vi.fn();
  Bridge.prototype.executeAndParse = mockExecuteAndParse;
  return { OmniFocusBridge: Bridge };
});

vi.mock("../../src/output/formatter.js", () => ({
  writeOutput: mockWriteOutput,
}));

function createProgram(): Command {
  const program = new Command();
  program.option("--format <format>", "Output format", "json");
  program.addCommand(createSearchCommand());
  return program;
}

describe("search command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("search 'query' calls executeAndParse with script containing the query", async () => {
    mockExecuteAndParse.mockResolvedValue([]);
    await createProgram().parseAsync(["node", "test", "search", "test query"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("test query");
    expect(script).toContain("indexOf");
  });

  it("search with --include-completed --limit 10 passes options", async () => {
    mockExecuteAndParse.mockResolvedValue([]);
    await createProgram().parseAsync([
      "node",
      "test",
      "search",
      "test",
      "--include-completed",
      "--limit",
      "10",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).not.toContain("!t.completed");
    expect(script).toContain(".slice(0, 10)");
  });

  it("search with --project and --tag filters applied", async () => {
    mockExecuteAndParse.mockResolvedValue([]);
    await createProgram().parseAsync([
      "node",
      "test",
      "search",
      "test",
      "--project",
      "Work",
      "--tag",
      "urgent",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("t.containingProject.name === 'Work'");
    expect(script).toContain("tag.name === 'urgent'");
  });

  it("result is passed to writeOutput", async () => {
    const mockResults = [{ id: "1", name: "Found task" }];
    mockExecuteAndParse.mockResolvedValue(mockResults);
    await createProgram().parseAsync(["node", "test", "search", "found"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockResults, "json");
  });
});
