import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { createForecastCommand } from "../../src/commands/forecast.js";

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

describe("forecast command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("forecast calls executeAndParse with forecast script", async () => {
    const mockForecast = {
      overdue: [],
      dueToday: [],
      dueSoon: [],
      flagged: [],
      deferredToToday: [],
    };
    mockExecuteAndParse.mockResolvedValue(mockForecast);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createForecastCommand());
    await program.parseAsync(["node", "test", "forecast"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("serializeTask");
    expect(script).toContain("overdue");
    expect(script).toContain("dueToday");
    expect(script).toContain("dueSoon");
  });

  it("result is passed to writeOutput", async () => {
    const mockForecast = {
      overdue: [],
      dueToday: [],
      dueSoon: [],
      flagged: [],
      deferredToToday: [],
    };
    mockExecuteAndParse.mockResolvedValue(mockForecast);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createForecastCommand());
    await program.parseAsync(["node", "test", "forecast"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockForecast, "json");
  });
});
