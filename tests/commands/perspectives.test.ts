import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPerspectivesCommand } from "../../src/commands/perspectives.js";

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

describe("perspectives command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("perspectives list calls executeAndParse with perspectives script", async () => {
    const mockPerspectives = [{ id: "inbox", name: "Inbox", isBuiltIn: true }];
    mockExecuteAndParse.mockResolvedValue(mockPerspectives);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createPerspectivesCommand());
    await program.parseAsync(["node", "test", "perspectives", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Perspective.BuiltIn.all");
    expect(script).toContain("Perspective.Custom.all");
    expect(script).toContain("serializePerspective");
  });

  it("result is passed to writeOutput", async () => {
    const mockPerspectives = [{ id: "inbox", name: "Inbox", isBuiltIn: true }];
    mockExecuteAndParse.mockResolvedValue(mockPerspectives);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createPerspectivesCommand());
    await program.parseAsync(["node", "test", "perspectives", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockPerspectives, "json");
  });
});
