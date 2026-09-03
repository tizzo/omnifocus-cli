import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTasksCommand } from "../../src/commands/tasks.js";

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
  program.addCommand(createTasksCommand());
  return program;
}

describe("tasks command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("tasks list calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue([]);
    await createProgram().parseAsync(["node", "test", "tasks", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedTasks");
    expect(script).toContain("!t.completed");
  });

  it("tasks list --flagged --limit 5 passes filters", async () => {
    mockExecuteAndParse.mockResolvedValue([]);
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "list",
      "--flagged",
      "--limit",
      "5",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("t.flagged");
    expect(script).toContain(".slice(0, 5)");
  });

  it("tasks view abc123 calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "abc123", name: "Test" });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "view",
      "abc123",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Task.byIdentifier('abc123')");
  });

  it("tasks create 'Test task' calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "t1", name: "Test task" });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "create",
      "Test task",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Test task");
  });

  it("tasks create with --project --tag --flagged includes all options", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "t2", name: "Test" });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "create",
      "Test",
      "--project",
      "Work",
      "--tag",
      "urgent",
      "--flagged",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Task('Test', null)");
    expect(script).toContain("flattenedProjects.byName('Work')");
    expect(script).toContain("flattenedTags.byName('urgent')");
    expect(script).toContain("task.flagged = true");
  });

  it("tasks update abc --name 'New name' --flag calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "abc", name: "New name" });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "update",
      "abc",
      "--name",
      "New name",
      "--flag",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("task.name = 'New name'");
    expect(script).toContain("task.flagged = true");
  });

  it("tasks complete abc calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({
      id: "abc",
      name: "Done",
      completed: true,
    });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "complete",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("abc");
    expect(script).toContain("markComplete");
  });

  it("tasks delete abc calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({
      deleted: true,
      id: "abc",
      name: "Deleted",
    });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "delete",
      "abc",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Task.byIdentifier('abc')");
    expect(script).toContain("deleteObject");
  });

  it("tasks move abc --project Work calls executeAndParse", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "abc", name: "Moved" });
    await createProgram().parseAsync([
      "node",
      "test",
      "tasks",
      "move",
      "abc",
      "--project",
      "Work",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("Task.byIdentifier('abc')");
    expect(script).toContain("flattenedProjects.byName('Work')");
    expect(script).toContain("moveTasks");
  });

  it("result is passed to writeOutput", async () => {
    const mockTasks = [{ id: "1", name: "Test" }];
    mockExecuteAndParse.mockResolvedValue(mockTasks);
    await createProgram().parseAsync(["node", "test", "tasks", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockTasks, "json");
  });
});
