import { describe, it, expect, vi, beforeEach } from "vitest";
import { Command } from "commander";
import { createTagsCommand } from "../../src/commands/tags.js";

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

describe("tags command", () => {
  beforeEach(() => {
    mockExecuteAndParse.mockReset();
    mockWriteOutput.mockReset();
  });

  it("tags list calls executeAndParse with hierarchical tag script", async () => {
    const mockTags = [{ id: "t1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockTags);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync(["node", "test", "tags", "list"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("tags.map");
    expect(script).toContain("serializeTag(t, true)");
  });

  it("tags list --flat calls executeAndParse with flat tag script", async () => {
    const mockTags = [{ id: "t1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockTags);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync(["node", "test", "tags", "list", "--flat"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("flattenedTags.map");
    expect(script).toContain("serializeTag(t, false)");
  });

  it("tags create calls executeAndParse with create script", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "t2", name: "New Tag" });

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync(["node", "test", "tags", "create", "New Tag"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("new Tag('New Tag')");
  });

  it("tags delete calls executeAndParse with delete script", async () => {
    mockExecuteAndParse.mockResolvedValue({
      deleted: true,
      id: "Old Tag",
      name: "Old Tag",
    });

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync(["node", "test", "tags", "delete", "Old Tag"]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("deleteObject(tag)");
    expect(script).toContain("Old Tag");
  });

  it("tags update calls executeAndParse with update script", async () => {
    mockExecuteAndParse.mockResolvedValue({ id: "t1", name: "Renamed" });

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync([
      "node",
      "test",
      "tags",
      "update",
      "My Tag",
      "--name",
      "Renamed",
      "--status",
      "onhold",
    ]);

    expect(mockExecuteAndParse).toHaveBeenCalledOnce();
    const script = mockExecuteAndParse.mock.calls[0]![0] as string;
    expect(script).toContain("tag.name = 'Renamed'");
    expect(script).toContain("Tag.Status.OnHold");
  });

  it("result is passed to writeOutput", async () => {
    const mockTags = [{ id: "t1", name: "Work" }];
    mockExecuteAndParse.mockResolvedValue(mockTags);

    const program = new Command();
    program.option("--format <format>", "Output format", "json");
    program.addCommand(createTagsCommand());
    await program.parseAsync(["node", "test", "tags", "list"]);

    expect(mockWriteOutput).toHaveBeenCalledWith(mockTags, "json");
  });
});
