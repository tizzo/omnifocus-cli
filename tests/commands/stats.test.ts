import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStatsCommand } from "../../src/commands/stats.js";

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

describe("stats command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("stats calls executeAndParse with stats script", async () => {
    const mockStats = {
      tasks: {
        total: 10,
        available: 5,
        completed: 3,
        remaining: 7,
        overdue: 1,
        dueSoon: 2,
        flagged: 1,
        inbox: 3,
      },
      projects: { total: 4, active: 2, onHold: 1, completed: 1, dropped: 0 },
      tags: { total: 5 },
      folders: { total: 2 },
    };
    mockExecuteAndParse.mockResolvedValue(mockStats);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createStatsCommand());
    await program.parseAsync(["node", "test", "stats"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedTasks");
    expect(script).toContain("flattenedProjects");
    expect(script).toContain("Task.Status.Available");
    expect(script).toContain("Project.Status.Active");
  });

  it("result is passed to writeOutput", async () => {
    const mockStats = {
      tasks: {
        total: 10,
        available: 5,
        completed: 3,
        remaining: 7,
        overdue: 1,
        dueSoon: 2,
        flagged: 1,
        inbox: 3,
      },
      projects: { total: 4, active: 2, onHold: 1, completed: 1, dropped: 0 },
      tags: { total: 5 },
      folders: { total: 2 },
    };
    mockExecuteAndParse.mockResolvedValue(mockStats);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createStatsCommand());
    await program.parseAsync(["node", "test", "stats"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockStats, "json");
  });
});
