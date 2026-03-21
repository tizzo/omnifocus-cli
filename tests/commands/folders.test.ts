import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { createFoldersCommand } from "../../src/commands/folders.js";

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

function buildProgram(): Command {
  const program = new Command();
  program.option("--format <format>", "Output format", "json");
  program.addCommand(createFoldersCommand());
  return program;
}

describe("folders command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
    mockExecuteAndParse.mockResolvedValue([]);
  });

  it("folders list calls executeAndParse", async () => {
    await buildProgram().parseAsync(["node", "test", "folders", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedFolders");
    expect(script).toContain("serializeFolder");
  });

  it("folders view calls executeAndParse with folder name", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "view",
      "Work",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Work");
    expect(script).toContain("Folder.byIdentifier");
  });

  it("result is passed to writeOutput", async () => {
    const mockData = [{ id: "f1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockData);

    await buildProgram().parseAsync(["node", "test", "folders", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockData, "json");
  });
});
