import { describe, expect, it } from "vitest";
import {
  buildCompleteTaskScript,
  buildCreateTaskScript,
  buildListInboxScript,
  buildListProjectsScript,
  buildListProjectTasksScript,
  buildListTagsScript,
  escapeOmniString,
} from "../src/omnifocus/scripts.js";
import {
  FOLDER_SERIALIZER,
  PROJECT_SERIALIZER,
  TAG_SERIALIZER,
  TASK_SERIALIZER,
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

  it("maps over the inbox", () => {
    expect(buildListInboxScript()).toContain(
      ".map(function(t) { return serializeTask(t); })",
    );
  });

  it("contains JSON.stringify", () => {
    expect(buildListInboxScript()).toContain("JSON.stringify");
  });

  it("defaults to remaining: excludes completed and dropped", () => {
    const script = buildListInboxScript();
    expect(script).toContain(
      "!t.completed && t.taskStatus !== Task.Status.Dropped",
    );
  });

  it("explicit remaining matches the default", () => {
    expect(buildListInboxScript("remaining")).toBe(buildListInboxScript());
  });

  it("available filters on Task.Status.Available", () => {
    expect(buildListInboxScript("available")).toContain(
      "t.taskStatus === Task.Status.Available",
    );
  });

  it("completed filters on t.completed", () => {
    const script = buildListInboxScript("completed");
    expect(script).toContain("return t.completed;");
    expect(script).not.toContain("!t.completed");
  });

  it("blocked filters on Task.Status.Blocked", () => {
    expect(buildListInboxScript("blocked")).toContain(
      "t.taskStatus === Task.Status.Blocked",
    );
  });

  it("dropped filters on Task.Status.Dropped", () => {
    expect(buildListInboxScript("dropped")).toContain(
      "return t.taskStatus === Task.Status.Dropped;",
    );
  });

  it("all applies no filter at all", () => {
    const script = buildListInboxScript("all");
    expect(script).not.toContain(".filter(");
    expect(script).toContain(
      "inbox.map(function(t) { return serializeTask(t); })",
    );
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

  it("TASK_SERIALIZER emits added/modified/dropDate as ISO strings", () => {
    expect(TASK_SERIALIZER).toContain(
      "added: t.added ? t.added.toISOString() : null",
    );
    expect(TASK_SERIALIZER).toContain(
      "modified: t.modified ? t.modified.toISOString() : null",
    );
    expect(TASK_SERIALIZER).toContain(
      "dropDate: t.dropDate ? t.dropDate.toISOString() : null",
    );
  });

  it("PROJECT_SERIALIZER reads added/modified from the project's root task", () => {
    // Project itself exposes no added/modified; p.task carries them.
    expect(PROJECT_SERIALIZER).toContain("var _root = p.task;");
    expect(PROJECT_SERIALIZER).toContain(
      "added: _root && _root.added ? _root.added.toISOString() : null",
    );
    expect(PROJECT_SERIALIZER).toContain(
      "modified: _root && _root.modified ? _root.modified.toISOString() : null",
    );
  });

  it("PROJECT_SERIALIZER emits review dates", () => {
    expect(PROJECT_SERIALIZER).toContain("lastReviewDate:");
    expect(PROJECT_SERIALIZER).toContain("nextReviewDate:");
  });

  it("TAG_SERIALIZER emits added/modified", () => {
    expect(TAG_SERIALIZER).toContain(
      "added: tag.added ? tag.added.toISOString() : null",
    );
    expect(TAG_SERIALIZER).toContain(
      "modified: tag.modified ? tag.modified.toISOString() : null",
    );
  });

  it("FOLDER_SERIALIZER emits added/modified", () => {
    expect(FOLDER_SERIALIZER).toContain(
      "added: f.added ? f.added.toISOString() : null",
    );
    expect(FOLDER_SERIALIZER).toContain(
      "modified: f.modified ? f.modified.toISOString() : null",
    );
  });

  it("TASK_SERIALIZER derives url from the id rather than the URL object", () => {
    // Instantiating a URL per task is ~6x slower; the derived string is identical.
    expect(TASK_SERIALIZER).toContain(
      'return "omnifocus:///" + kind + "/" + obj.id.primaryKey;',
    );
    expect(TASK_SERIALIZER).toContain('url: objectURL("task", t)');
    expect(TASK_SERIALIZER).not.toContain("url: t.url");
  });

  it("TASK_SERIALIZER emits parent and immediate children as refs", () => {
    expect(TASK_SERIALIZER).toContain(
      "parent: t.parent ? { id: t.parent.id.primaryKey, name: t.parent.name } : null",
    );
    expect(TASK_SERIALIZER).toContain(
      "children: t.children.map(function(c) { return { id: c.id.primaryKey, name: c.name }; })",
    );
  });

  it("TASK_SERIALIZER maps every repetition enum to a string name", () => {
    expect(TASK_SERIALIZER).toContain("function serializeRepetitionRule");
    expect(TASK_SERIALIZER).toContain("if (!r) return null;");
    for (const member of ["None", "Fixed", "DeferUntilDate", "DueDate"]) {
      expect(TASK_SERIALIZER).toContain(`Task.RepetitionMethod.${member}`);
    }
    for (const member of ["None", "Regularly", "FromCompletion"]) {
      expect(TASK_SERIALIZER).toContain(
        `Task.RepetitionScheduleType.${member}`,
      );
    }
    for (const member of ["DeferDate", "PlannedDate", "DueDate"]) {
      expect(TASK_SERIALIZER).toContain(`Task.AnchorDateKey.${member}`);
    }
    expect(TASK_SERIALIZER).toContain(
      "catchUpAutomatically: r.catchUpAutomatically",
    );
  });

  it("TASK_SERIALIZER emits attachment metadata but never the bytes", () => {
    expect(TASK_SERIALIZER).toContain("function serializeAttachment");
    expect(TASK_SERIALIZER).toContain(
      "byteLength: a.contents ? a.contents.length : null",
    );
    // The Data blob itself must never be serialized into the JSON payload.
    expect(TASK_SERIALIZER).not.toContain("toBase64");
    expect(TASK_SERIALIZER).not.toContain("contents: a.contents");
    for (const member of ["File", "Directory", "Link"]) {
      expect(TASK_SERIALIZER).toContain(`FileWrapper.Type.${member}`);
    }
  });

  it("TASK_SERIALIZER emits linkedFileURLs as plain strings", () => {
    expect(TASK_SERIALIZER).toContain(
      "linkedFileURLs: t.linkedFileURLs.map(function(u) { return u.string; })",
    );
  });

  it("FOLDER_SERIALIZER emits url, active flags and direct + flattened counts", () => {
    expect(FOLDER_SERIALIZER).toContain(
      'url: "omnifocus:///folder/" + f.id.primaryKey',
    );
    expect(FOLDER_SERIALIZER).toContain("active: f.active");
    expect(FOLDER_SERIALIZER).toContain("effectiveActive: f.effectiveActive");
    expect(FOLDER_SERIALIZER).toContain("projectCount: f.projects.length");
    expect(FOLDER_SERIALIZER).toContain("folderCount: f.folders.length");
    expect(FOLDER_SERIALIZER).toContain("sectionCount: f.sections.length");
    expect(FOLDER_SERIALIZER).toContain(
      "flattenedProjectCount: f.flattenedProjects.length",
    );
    expect(FOLDER_SERIALIZER).toContain(
      "flattenedFolderCount: f.flattenedFolders.length",
    );
    expect(FOLDER_SERIALIZER).toContain(
      "flattenedSectionCount: f.flattenedSections.length",
    );
  });

  it("FOLDER_SERIALIZER derives status from the Folder.Status enum", () => {
    expect(FOLDER_SERIALIZER).toContain("Folder.Status.Active");
    expect(FOLDER_SERIALIZER).toContain("Folder.Status.Dropped");
    expect(FOLDER_SERIALIZER).toContain("status: folderStatusName(f.status)");
  });
});
