import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { createInboxCommand } from "../../src/commands/inbox.js";

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

describe("inbox command", () => {
  it("inbox list calls executeAndParse with a script containing inbox", async () => {
    const mockTasks = [{ id: "1", name: "Test task" }];
    mockExecuteAndParse.mockResolvedValue(mockTasks);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createInboxCommand());
    await program.parseAsync(["node", "test", "inbox", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("inbox");
  });

  it("result is passed to writeOutput", async () => {
    const mockTasks = [{ id: "1", name: "Test task" }];
    mockExecuteAndParse.mockResolvedValue(mockTasks);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createInboxCommand());
    await program.parseAsync(["node", "test", "inbox", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockTasks, "json");
  });
});
