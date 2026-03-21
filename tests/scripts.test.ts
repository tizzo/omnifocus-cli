import { describe, it, expect } from "vitest";
import {
  escapeOmniString,
  buildListInboxScript,
  buildListProjectsScript,
  buildListProjectTasksScript,
  buildCreateTaskScript,
  buildCompleteTaskScript,
  buildListTagsScript,
} from "../src/omnifocus/scripts.js";
import {
  TASK_SERIALIZER,
  PROJECT_SERIALIZER,
  TAG_SERIALIZER,
} from "../src/omnifocus/serializers.js";

describe("escapeOmniString", () => {
  it("passes basic string through unchanged", () => {
    expect(escapeOmniString("hello world")).toBe("hello world");
  });

  it("escapes single quotes", () => {
    expect(escapeOmniString("it's")).toBe("it\\'s");
  });

  it("escapes backslashes", () => {
    expect(escapeOmniString("a\\b")).toBe("a\\\\b");
  });

  it("escapes newlines", () => {
    expect(escapeOmniString("line1\nline2")).toBe("line1\\nline2");
  });

  it("escapes carriage returns", () => {
    expect(escapeOmniString("line1\rline2")).toBe("line1\\rline2");
  });

  it("handles combined special characters", () => {
    expect(escapeOmniString("it's a\\path\nwith\rstuff")).toBe(
      "it\\'s a\\\\path\\nwith\\rstuff",
    );
  });

  it("handles empty string", () => {
    expect(escapeOmniString("")).toBe("");
  });

  it("passes unicode characters through unchanged", () => {
    expect(escapeOmniString("日本語 émojis 🎉")).toBe("日本語 émojis 🎉");
  });
});

describe("buildListInboxScript", () => {
  it("contains serializeTask", () => {
    expect(buildListInboxScript()).toContain("serializeTask");
  });

  it("contains inbox.map", () => {
    expect(buildListInboxScript()).toContain("inbox.map");
  });

  it("contains JSON.stringify", () => {
    expect(buildListInboxScript()).toContain("JSON.stringify");
  });
});

describe("buildListProjectsScript", () => {
  it("defaults to active filter", () => {
    const script = buildListProjectsScript({});
    expect(script).toContain("Project.Status.Active");
  });

  it("includes active filter explicitly", () => {
    const script = buildListProjectsScript({ status: "active" });
    expect(script).toContain("Project.Status.Active");
  });

  it("includes onhold filter", () => {
    const script = buildListProjectsScript({ status: "onhold" });
    expect(script).toContain("Project.Status.OnHold");
  });

  it("has no status filter for 'all'", () => {
    const script = buildListProjectsScript({ status: "all" });
    expect(script).not.toContain(".filter(function(p) { return p.status ===");
    expect(script).toContain("var resultProjects = flattenedProjects;");
  });

  it("includes escaped folder name in filter", () => {
    const script = buildListProjectsScript({ folder: "Work" });
    expect(script).toContain("parentFolder.name === 'Work'");
  });

  it("combines status and folder filters", () => {
    const script = buildListProjectsScript({
      status: "onhold",
      folder: "Personal",
    });
    expect(script).toContain("Project.Status.OnHold");
    expect(script).toContain("parentFolder.name === 'Personal'");
  });
});

describe("buildListProjectTasksScript", () => {
  it("contains Project.byIdentifier with escaped value", () => {
    const script = buildListProjectTasksScript("abc123", {});
    expect(script).toContain("Project.byIdentifier('abc123')");
  });

  it("contains flattenedProjects.byName fallback", () => {
    const script = buildListProjectTasksScript("My Project", {});
    expect(script).toContain("flattenedProjects.byName('My Project')");
  });

  it("filters out completed tasks by default", () => {
    const script = buildListProjectTasksScript("abc123", {});
    expect(script).toContain("!t.completed");
  });

  it("does not filter completed when completed: true", () => {
    const script = buildListProjectTasksScript("abc123", { completed: true });
    expect(script).not.toContain("!t.completed");
  });

  it("escapes special characters in project name", () => {
    const script = buildListProjectTasksScript("it's a project", {});
    expect(script).toContain("it\\'s a project");
  });
});

describe("buildCreateTaskScript", () => {
  it("creates simple task with name", () => {
    const script = buildCreateTaskScript({ name: "Buy milk" });
    expect(script).toContain("new Task('Buy milk', null)");
  });

  it("includes note assignment", () => {
    const script = buildCreateTaskScript({ name: "Task", note: "A note" });
    expect(script).toContain("task.note = 'A note'");
  });

  it("includes dueDate with Date constructor", () => {
    const script = buildCreateTaskScript({
      name: "Task",
      dueDate: "2026-03-25",
    });
    expect(script).toContain("new Date('2026-03-25')");
  });

  it("includes deferDate assignment", () => {
    const script = buildCreateTaskScript({
      name: "Task",
      deferDate: "2026-03-20",
    });
    expect(script).toContain("task.deferDate = new Date('2026-03-20')");
  });

  it("includes flagged assignment", () => {
    const script = buildCreateTaskScript({ name: "Task", flagged: true });
    expect(script).toContain("task.flagged = true");
  });

  it("includes tag lookups for each tag", () => {
    const script = buildCreateTaskScript({
      name: "Task",
      tags: ["errands", "home"],
    });
    expect(script).toContain("flattenedTags.byName('errands')");
    expect(script).toContain("flattenedTags.byName('home')");
  });

  it("includes project lookup and moveTasks", () => {
    const script = buildCreateTaskScript({
      name: "Task",
      project: "Work",
    });
    expect(script).toContain("flattenedProjects.byName('Work')");
    expect(script).toContain("moveTasks([task], targetProject)");
  });

  it("escapes special characters in name", () => {
    const script = buildCreateTaskScript({ name: "it's urgent" });
    expect(script).toContain("new Task('it\\'s urgent', null)");
  });

  it("handles all options combined", () => {
    const script = buildCreateTaskScript({
      name: "Full task",
      note: "Details",
      dueDate: "2026-04-01",
      deferDate: "2026-03-25",
      flagged: true,
      tags: ["work"],
      project: "Big Project",
    });
    expect(script).toContain("new Task('Full task', null)");
    expect(script).toContain("task.note = 'Details'");
    expect(script).toContain("new Date('2026-04-01')");
    expect(script).toContain("task.deferDate = new Date('2026-03-25')");
    expect(script).toContain("task.flagged = true");
    expect(script).toContain("flattenedTags.byName('work')");
    expect(script).toContain("flattenedProjects.byName('Big Project')");
    expect(script).toContain("moveTasks([task], targetProject)");
    expect(script).toContain("JSON.stringify(serializeTask(task))");
  });
});

describe("buildCompleteTaskScript", () => {
  it("contains Task.byIdentifier with escaped ID", () => {
    const script = buildCompleteTaskScript("abc-123");
    expect(script).toContain("Task.byIdentifier('abc-123')");
  });

  it("contains task.markComplete", () => {
    const script = buildCompleteTaskScript("abc-123");
    expect(script).toContain("task.markComplete()");
  });

  it("contains error throw for not found", () => {
    const script = buildCompleteTaskScript("abc-123");
    expect(script).toContain("throw new Error");
    expect(script).toContain("Task not found");
  });
});

describe("buildListTagsScript", () => {
  it("uses flattenedTags and serializeTag(t, false) when flat", () => {
    const script = buildListTagsScript({ flat: true });
    expect(script).toContain("flattenedTags.map");
    expect(script).toContain("serializeTag(t, false)");
  });

  it("uses tags and serializeTag(t, true) when not flat", () => {
    const script = buildListTagsScript({});
    expect(script).toContain("tags.map");
    expect(script).toContain("serializeTag(t, true)");
  });

  it("uses tags and serializeTag(t, true) when flat is false", () => {
    const script = buildListTagsScript({ flat: false });
    expect(script).toContain("tags.map");
    expect(script).toContain("serializeTag(t, true)");
  });
});

describe("serializer constants", () => {
  it("TASK_SERIALIZER contains function serializeTask", () => {
    expect(TASK_SERIALIZER).toContain("function serializeTask");
  });

  it("PROJECT_SERIALIZER contains function serializeProject", () => {
    expect(PROJECT_SERIALIZER).toContain("function serializeProject");
  });

  it("TAG_SERIALIZER contains function serializeTag", () => {
    expect(TAG_SERIALIZER).toContain("function serializeTag");
  });
});
