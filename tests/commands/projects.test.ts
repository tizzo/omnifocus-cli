import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { createProjectsCommand } from "../../src/commands/projects.js";

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
  program.addCommand(createProjectsCommand());
  return program;
}

describe("projects command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
    mockExecuteAndParse.mockResolvedValue([]);
  });

  it("projects list calls executeAndParse", async () => {
    await buildProgram().parseAsync(["node", "test", "projects", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedProjects");
    expect(script).toContain("serializeProject");
  });

  it("projects list --status onhold passes correct filter", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "list",
      "--status",
      "onhold",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Project.Status.OnHold");
  });

  it("projects tasks calls executeAndParse with the project name", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "tasks",
      "MyProject",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("MyProject");
  });

  it("projects create calls executeAndParse with project name", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "create",
      "New Project",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Project('New Project')");
  });

  it("projects create with all options includes them in script", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "create",
      "Test",
      "--folder",
      "Work",
      "--sequential",
      "--note",
      "desc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Project('Test')");
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("sequential = true");
    expect(script).toContain("proj.note = 'desc'");
  });

  it("projects view calls executeAndParse with identifier", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "view",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Project.byIdentifier('abc')");
  });

  it("projects delete calls executeAndParse with identifier", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "delete",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Project.byIdentifier('abc')");
    expect(script).toContain("deleteObject");
  });

  it("projects update calls executeAndParse with name and status", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "update",
      "abc",
      "--name",
      "Renamed",
      "--status",
      "onhold",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("project.name = 'Renamed'");
    expect(script).toContain("Project.Status.OnHold");
  });

  it("projects complete calls executeAndParse with markComplete", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "complete",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("markComplete()");
  });

  it("projects uncomplete calls executeAndParse with markIncomplete", async () => {
    await buildProgram().parseAsync([
      "node",
      "test",
      "projects",
      "uncomplete",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("markIncomplete()");
  });

  it("result is passed to writeOutput", async () => {
    const mockData = [{ id: "p1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockData);

    await buildProgram().parseAsync(["node", "test", "projects", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockData, "json");
  });
});
