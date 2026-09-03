import { describe, expect, it } from "vitest";
import {
  buildCompleteProjectScript,
  buildCreateProjectScript,
  buildDeleteProjectScript,
  buildUncompleteProjectScript,
  buildUpdateProjectScript,
  buildViewProjectScript,
} from "../src/omnifocus/project-scripts.js";

describe("buildViewProjectScript", () => {
  it("contains Project.byIdentifier with the given ID", () => {
    const script = buildViewProjectScript("abc123");
    expect(script).toContain("Project.byIdentifier('abc123')");
  });

  it("contains flattenedProjects.byName fallback", () => {
    const script = buildViewProjectScript("My Project");
    expect(script).toContain("flattenedProjects.byName('My Project')");
  });

  it("throws error when project not found", () => {
    const script = buildViewProjectScript("abc123");
    expect(script).toContain("throw new Error('Project not found: abc123')");
  });

  it("escapes special characters", () => {
    const script = buildViewProjectScript("it's a project");
    expect(script).toContain("it\\'s a project");
  });
});

describe("buildCreateProjectScript", () => {
  it("creates simple project with name", () => {
    const script = buildCreateProjectScript({ name: "Test" });
    expect(script).toContain("new Project('Test')");
  });

  it("includes note assignment", () => {
    const script = buildCreateProjectScript({ name: "P", note: "A note" });
    expect(script).toContain("proj.note = 'A note'");
  });

  it("includes dueDate with Date constructor", () => {
    const script = buildCreateProjectScript({
      name: "P",
      dueDate: "2026-04-01",
    });
    expect(script).toContain("proj.dueDate = new Date('2026-04-01')");
  });

  it("includes deferDate with Date constructor", () => {
    const script = buildCreateProjectScript({
      name: "P",
      deferDate: "2026-03-20",
    });
    expect(script).toContain("proj.deferDate = new Date('2026-03-20')");
  });

  it("sets sequential to true", () => {
    const script = buildCreateProjectScript({
      name: "P",
      sequential: true,
    });
    expect(script).toContain("proj.sequential = true");
  });

  it("does not set sequential when false or undefined", () => {
    const script = buildCreateProjectScript({ name: "P" });
    expect(script).not.toContain("proj.sequential = true");
  });

  it("sets status to OnHold", () => {
    const script = buildCreateProjectScript({
      name: "P",
      status: "onhold",
    });
    expect(script).toContain("Project.Status.OnHold");
  });

  it("includes folder lookup and moveSections", () => {
    const script = buildCreateProjectScript({
      name: "P",
      folder: "Work",
    });
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("moveSections([proj], targetFolder)");
  });

  it("escapes special characters in name", () => {
    const script = buildCreateProjectScript({ name: "it's a project" });
    expect(script).toContain("new Project('it\\'s a project')");
  });

  it("escapes special characters in note", () => {
    const script = buildCreateProjectScript({
      name: "P",
      note: "line1\nline2",
    });
    expect(script).toContain("proj.note = 'line1\\nline2'");
  });

  it("handles all options combined", () => {
    const script = buildCreateProjectScript({
      name: "Full Project",
      note: "Details",
      dueDate: "2026-04-01",
      deferDate: "2026-03-25",
      sequential: true,
      status: "onhold",
      folder: "Work",
    });
    expect(script).toContain("new Project('Full Project')");
    expect(script).toContain("proj.note = 'Details'");
    expect(script).toContain("new Date('2026-04-01')");
    expect(script).toContain("new Date('2026-03-25')");
    expect(script).toContain("proj.sequential = true");
    expect(script).toContain("Project.Status.OnHold");
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("JSON.stringify(serializeProject(proj))");
  });
});

describe("buildDeleteProjectScript", () => {
  it("contains Project.byIdentifier with the given ID", () => {
    const script = buildDeleteProjectScript("abc123");
    expect(script).toContain("Project.byIdentifier('abc123')");
  });

  it("contains flattenedProjects.byName fallback", () => {
    const script = buildDeleteProjectScript("My Project");
    expect(script).toContain("flattenedProjects.byName('My Project')");
  });

  it("contains deleteObject call", () => {
    const script = buildDeleteProjectScript("abc123");
    expect(script).toContain("deleteObject(project)");
  });

  it("throws error when project not found", () => {
    const script = buildDeleteProjectScript("abc123");
    expect(script).toContain("throw new Error('Project not found: abc123')");
  });
});

describe("buildUpdateProjectScript", () => {
  it("sets name when provided", () => {
    const script = buildUpdateProjectScript("abc", { name: "Renamed" });
    expect(script).toContain("project.name = 'Renamed'");
  });

  it("sets note when provided", () => {
    const script = buildUpdateProjectScript("abc", { note: "New note" });
    expect(script).toContain("project.note = 'New note'");
  });

  it("sets dueDate when provided", () => {
    const script = buildUpdateProjectScript("abc", {
      dueDate: "2026-04-01",
    });
    expect(script).toContain("project.dueDate = new Date('2026-04-01')");
  });

  it("clears dueDate when null", () => {
    const script = buildUpdateProjectScript("abc", { dueDate: null });
    expect(script).toContain("project.dueDate = null");
  });

  it("sets deferDate when provided", () => {
    const script = buildUpdateProjectScript("abc", {
      deferDate: "2026-03-20",
    });
    expect(script).toContain("project.deferDate = new Date('2026-03-20')");
  });

  it("clears deferDate when null", () => {
    const script = buildUpdateProjectScript("abc", { deferDate: null });
    expect(script).toContain("project.deferDate = null");
  });

  it("sets status to Active", () => {
    const script = buildUpdateProjectScript("abc", { status: "active" });
    expect(script).toContain("project.status = Project.Status.Active");
  });

  it("sets status to OnHold", () => {
    const script = buildUpdateProjectScript("abc", { status: "onhold" });
    expect(script).toContain("project.status = Project.Status.OnHold");
  });

  it("sets status to Done", () => {
    const script = buildUpdateProjectScript("abc", { status: "done" });
    expect(script).toContain("project.status = Project.Status.Done");
  });

  it("sets status to Dropped", () => {
    const script = buildUpdateProjectScript("abc", { status: "dropped" });
    expect(script).toContain("project.status = Project.Status.Dropped");
  });

  it("does not modify fields not provided", () => {
    const script = buildUpdateProjectScript("abc", {});
    expect(script).not.toContain("project.name =");
    expect(script).not.toContain("project.note =");
    expect(script).not.toContain("project.dueDate =");
    expect(script).not.toContain("project.deferDate =");
    expect(script).not.toContain("project.status =");
  });
});

describe("buildCompleteProjectScript", () => {
  it("contains Project.byIdentifier with the given ID", () => {
    const script = buildCompleteProjectScript("abc123");
    expect(script).toContain("Project.byIdentifier('abc123')");
  });

  it("contains markComplete call", () => {
    const script = buildCompleteProjectScript("abc123");
    expect(script).toContain("project.markComplete()");
  });

  it("throws error when project not found", () => {
    const script = buildCompleteProjectScript("abc123");
    expect(script).toContain("throw new Error('Project not found: abc123')");
  });
});

describe("buildUncompleteProjectScript", () => {
  it("contains Project.byIdentifier with the given ID", () => {
    const script = buildUncompleteProjectScript("abc123");
    expect(script).toContain("Project.byIdentifier('abc123')");
  });

  it("contains markIncomplete call", () => {
    const script = buildUncompleteProjectScript("abc123");
    expect(script).toContain("project.markIncomplete()");
  });

  it("throws error when project not found", () => {
    const script = buildUncompleteProjectScript("abc123");
    expect(script).toContain("throw new Error('Project not found: abc123')");
  });
});
