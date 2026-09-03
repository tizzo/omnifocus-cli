import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("folders create calls executeAndParse with create script", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "f2", name: "New Folder" });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "create",
      "New Folder",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Folder('New Folder')");
    expect(script).not.toContain("moveSections");
  });

  it("folders create with --parent includes moveSections", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "f3", name: "Sub" });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "create",
      "Sub",
      "--parent",
      "Work",
    ]);

    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Folder('Sub')");
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("moveSections([newFolder], parentFolder)");
  });

  it("folders delete calls executeAndParse with delete script", async () => {
    mockExecuteAndParse.mockResolvedValue({
      deleted: true,
      id: "Old Folder",
      name: "Old Folder",
    });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "delete",
      "Old Folder",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("deleteObject(folder)");
    expect(script).toContain("Old Folder");
  });

  it("folders update calls executeAndParse with update script", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "f1", name: "Renamed" });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "update",
      "My Folder",
      "--name",
      "Renamed",
      "--status",
      "dropped",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("folder.name = 'Renamed'");
    expect(script).toContain("Folder.Status.Dropped");
  });

  it("folders update --parent moves folder under new parent", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "f1", name: "Sub" });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "update",
      "Sub",
      "--parent",
      "Work",
    ]);

    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("moveSections([folder], newParent)");
  });

  it("folders update --clear-parent moves folder to library", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "f1", name: "Sub" });

    await buildProgram().parseAsync([
      "node",
      "test",
      "folders",
      "update",
      "Sub",
      "--clear-parent",
    ]);

    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("moveSections([folder], library)");
  });

  it("result is passed to writeOutput", async () => {
    const mockData = [{ id: "f1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockData);

    await buildProgram().parseAsync(["node", "test", "folders", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockData, "json");
  });
});
