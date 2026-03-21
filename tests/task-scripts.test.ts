import { describe, it, expect } from "vitest";
import {
  buildListTasksScript,
  buildViewTaskScript,
  buildUpdateTaskScript,
  buildDeleteTaskScript,
  buildMoveTaskScript,
  buildSearchScript,
} from "../src/omnifocus/task-scripts.js";

describe("buildListTasksScript", () => {
  it("default filters produce script with !t.completed filter", () => {
    const script = buildListTasksScript({});
    expect(script).toContain("!t.completed");
    expect(script).toContain("t.taskStatus !== Task.Status.Dropped");
  });

  it("--flagged adds t.flagged condition", () => {
    const script = buildListTasksScript({ flagged: true });
    expect(script).toContain("t.flagged");
  });

  it("--project adds containingProject.name check", () => {
    const script = buildListTasksScript({ project: "Work" });
    expect(script).toContain("t.containingProject.name === 'Work'");
  });

  it("--tag adds tags.some check", () => {
    const script = buildListTasksScript({ tag: "urgent" });
    expect(script).toContain(
      "t.tags.some(function(tag) { return tag.name === 'urgent'; })",
    );
  });

  it("--status available produces Task.Status.Available filter", () => {
    const script = buildListTasksScript({ status: "available" });
    expect(script).toContain("t.taskStatus === Task.Status.Available");
  });

  it("--status completed produces t.completed filter", () => {
    const script = buildListTasksScript({ status: "completed" });
    expect(script).toContain("t.completed");
    expect(script).not.toContain("!t.completed");
  });

  it("--status blocked produces Task.Status.Blocked filter", () => {
    const script = buildListTasksScript({ status: "blocked" });
    expect(script).toContain("t.taskStatus === Task.Status.Blocked");
  });

  it("--status dropped produces Task.Status.Dropped filter", () => {
    const script = buildListTasksScript({ status: "dropped" });
    expect(script).toContain("t.taskStatus === Task.Status.Dropped");
  });

  it("--status remaining produces !t.completed and not dropped filter", () => {
    const script = buildListTasksScript({ status: "remaining" });
    expect(script).toContain("!t.completed");
    expect(script).toContain("t.taskStatus !== Task.Status.Dropped");
  });

  it("--due-before adds date comparison with <=", () => {
    const script = buildListTasksScript({ dueBefore: "2026-04-01" });
    expect(script).toContain("t.dueDate <= new Date('2026-04-01')");
  });

  it("--due-after adds date comparison with >=", () => {
    const script = buildListTasksScript({ dueAfter: "2026-03-01" });
    expect(script).toContain("t.dueDate >= new Date('2026-03-01')");
  });

  it("--sort name produces localeCompare sort", () => {
    const script = buildListTasksScript({ sort: "name" });
    expect(script).toContain("a.name.localeCompare(b.name)");
  });

  it("--sort due produces dueDate sort", () => {
    const script = buildListTasksScript({ sort: "due" });
    expect(script).toContain("a.dueDate");
    expect(script).toContain("b.dueDate");
  });

  it("--sort defer produces deferDate sort", () => {
    const script = buildListTasksScript({ sort: "defer" });
    expect(script).toContain("a.deferDate");
    expect(script).toContain("b.deferDate");
  });

  it("--sort flagged produces flagged sort", () => {
    const script = buildListTasksScript({ sort: "flagged" });
    expect(script).toContain("b.flagged");
    expect(script).toContain("a.flagged");
  });

  it("--limit adds .slice", () => {
    const script = buildListTasksScript({ limit: 10 });
    expect(script).toContain(".slice(0, 10)");
  });

  it("--count returns script with count instead of serializeTask", () => {
    const script = buildListTasksScript({ countOnly: true });
    expect(script).toContain("{ count: resultTasks.length }");
    expect(script).not.toContain("serializeTask");
  });

  it("combined filters all appear in output", () => {
    const script = buildListTasksScript({
      flagged: true,
      project: "Work",
      tag: "urgent",
      status: "available",
      dueBefore: "2026-04-01",
      dueAfter: "2026-03-01",
      sort: "due",
      limit: 5,
    });
    expect(script).toContain("t.taskStatus === Task.Status.Available");
    expect(script).toContain("t.flagged");
    expect(script).toContain("t.containingProject.name === 'Work'");
    expect(script).toContain("tag.name === 'urgent'");
    expect(script).toContain("t.dueDate <= new Date('2026-04-01')");
    expect(script).toContain("t.dueDate >= new Date('2026-03-01')");
    expect(script).toContain("a.dueDate");
    expect(script).toContain(".slice(0, 5)");
  });

  it("escapes special characters in project name", () => {
    const script = buildListTasksScript({ project: "it's a project" });
    expect(script).toContain("it\\'s a project");
  });
});

describe("buildViewTaskScript", () => {
  it("contains Task.byIdentifier with the task ID", () => {
    const script = buildViewTaskScript("abc123");
    expect(script).toContain("Task.byIdentifier('abc123')");
  });

  it("throws on not found", () => {
    const script = buildViewTaskScript("abc123");
    expect(script).toContain("throw new Error");
    expect(script).toContain("Task not found");
  });

  it("contains serializeTask", () => {
    const script = buildViewTaskScript("abc123");
    expect(script).toContain("serializeTask(task)");
  });

  it("escapes special characters in task ID", () => {
    const script = buildViewTaskScript("it's-an-id");
    expect(script).toContain("it\\'s-an-id");
  });
});

describe("buildUpdateTaskScript", () => {
  it("sets name when provided", () => {
    const script = buildUpdateTaskScript("abc", { name: "New name" });
    expect(script).toContain("task.name = 'New name'");
  });

  it("sets note when provided", () => {
    const script = buildUpdateTaskScript("abc", { note: "A note" });
    expect(script).toContain("task.note = 'A note'");
  });

  it("sets dueDate with new Date when provided", () => {
    const script = buildUpdateTaskScript("abc", { dueDate: "2026-04-01" });
    expect(script).toContain("task.dueDate = new Date('2026-04-01')");
  });

  it("clears dueDate when null", () => {
    const script = buildUpdateTaskScript("abc", { dueDate: null });
    expect(script).toContain("task.dueDate = null");
  });

  it("sets deferDate with new Date when provided", () => {
    const script = buildUpdateTaskScript("abc", { deferDate: "2026-03-20" });
    expect(script).toContain("task.deferDate = new Date('2026-03-20')");
  });

  it("clears deferDate when null", () => {
    const script = buildUpdateTaskScript("abc", { deferDate: null });
    expect(script).toContain("task.deferDate = null");
  });

  it("sets flagged true", () => {
    const script = buildUpdateTaskScript("abc", { flagged: true });
    expect(script).toContain("task.flagged = true");
  });

  it("sets flagged false", () => {
    const script = buildUpdateTaskScript("abc", { flagged: false });
    expect(script).toContain("task.flagged = false");
  });

  it("moves to project when project provided", () => {
    const script = buildUpdateTaskScript("abc", { project: "Work" });
    expect(script).toContain("flattenedProjects.byName('Work')");
    expect(script).toContain("moveTasks([task], targetProject)");
  });

  it("moves to inbox when project is null", () => {
    const script = buildUpdateTaskScript("abc", { project: null });
    expect(script).toContain("moveTasks([task], inbox)");
  });

  it("adds tags via addTag", () => {
    const script = buildUpdateTaskScript("abc", {
      addTags: ["urgent", "home"],
    });
    expect(script).toContain("flattenedTags.byName('urgent')");
    expect(script).toContain("flattenedTags.byName('home')");
    expect(script).toContain("task.addTag(addTag)");
  });

  it("removes tags via removeTag", () => {
    const script = buildUpdateTaskScript("abc", {
      removeTags: ["old-tag"],
    });
    expect(script).toContain("flattenedTags.byName('old-tag')");
    expect(script).toContain("task.removeTag(rmTag)");
  });

  it("contains Task.byIdentifier with the task ID", () => {
    const script = buildUpdateTaskScript("abc123", {});
    expect(script).toContain("Task.byIdentifier('abc123')");
  });

  it("contains serializeTask at the end", () => {
    const script = buildUpdateTaskScript("abc", { name: "Test" });
    expect(script).toContain("JSON.stringify(serializeTask(task))");
  });

  it("escapes special characters in values", () => {
    const script = buildUpdateTaskScript("abc", { name: "it's a task" });
    expect(script).toContain("it\\'s a task");
  });
});

describe("buildDeleteTaskScript", () => {
  it("contains Task.byIdentifier with the task ID", () => {
    const script = buildDeleteTaskScript("abc123");
    expect(script).toContain("Task.byIdentifier('abc123')");
  });

  it("contains deleteObject", () => {
    const script = buildDeleteTaskScript("abc123");
    expect(script).toContain("deleteObject(task)");
  });

  it("throws on not found", () => {
    const script = buildDeleteTaskScript("abc123");
    expect(script).toContain("throw new Error");
    expect(script).toContain("Task not found");
  });

  it("returns JSON with deleted status", () => {
    const script = buildDeleteTaskScript("abc123");
    expect(script).toContain("deleted: true");
  });
});

describe("buildMoveTaskScript", () => {
  it("contains Task.byIdentifier with the task ID", () => {
    const script = buildMoveTaskScript("abc123", "Work");
    expect(script).toContain("Task.byIdentifier('abc123')");
  });

  it("contains flattenedProjects.byName with the project name", () => {
    const script = buildMoveTaskScript("abc123", "Work");
    expect(script).toContain("flattenedProjects.byName('Work')");
  });

  it("contains moveTasks", () => {
    const script = buildMoveTaskScript("abc123", "Work");
    expect(script).toContain("moveTasks([task], targetProject)");
  });

  it("throws on task not found", () => {
    const script = buildMoveTaskScript("abc123", "Work");
    expect(script).toContain("Task not found");
  });

  it("throws on project not found", () => {
    const script = buildMoveTaskScript("abc123", "Work");
    expect(script).toContain("Project not found");
  });

  it("escapes special characters in both ID and project name", () => {
    const script = buildMoveTaskScript("it's-id", "it's a project");
    expect(script).toContain("it\\'s-id");
    expect(script).toContain("it\\'s a project");
  });
});

describe("buildSearchScript", () => {
  it("contains name and note search with indexOf", () => {
    const script = buildSearchScript("test query", {});
    expect(script).toContain("t.name.toLowerCase().indexOf(");
    expect(script).toContain("t.note.toLowerCase().indexOf(");
  });

  it("excludes completed by default", () => {
    const script = buildSearchScript("test", {});
    expect(script).toContain("!t.completed");
  });

  it("includes completed when includeCompleted is true", () => {
    const script = buildSearchScript("test", { includeCompleted: true });
    expect(script).not.toContain("!t.completed");
  });

  it("filters by project when provided", () => {
    const script = buildSearchScript("test", { project: "Work" });
    expect(script).toContain("t.containingProject.name === 'Work'");
  });

  it("filters by tag when provided", () => {
    const script = buildSearchScript("test", { tag: "urgent" });
    expect(script).toContain(
      "t.tags.some(function(tag) { return tag.name === 'urgent'; })",
    );
  });

  it("applies limit when provided", () => {
    const script = buildSearchScript("test", { limit: 10 });
    expect(script).toContain(".slice(0, 10)");
  });

  it("does not apply slice when no limit", () => {
    const script = buildSearchScript("test", {});
    expect(script).not.toContain(".slice");
  });

  it("escapes special characters in query", () => {
    const script = buildSearchScript("it's a test", {});
    expect(script).toContain("it\\'s a test");
  });

  it("contains the search query in the script", () => {
    const script = buildSearchScript("find me", {});
    expect(script).toContain("find me");
  });

  it("contains serializeTask", () => {
    const script = buildSearchScript("test", {});
    expect(script).toContain("serializeTask");
  });
});
