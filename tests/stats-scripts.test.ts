import { describe, expect, it } from "vitest";
import { buildStatsScript } from "../src/omnifocus/stats-scripts.js";

describe("buildStatsScript", () => {
  it("references flattenedTasks", () => {
    const script = buildStatsScript();
    expect(script).toContain("flattenedTasks");
  });

  it("references flattenedProjects", () => {
    const script = buildStatsScript();
    expect(script).toContain("flattenedProjects");
  });

  it("references flattenedTags", () => {
    const script = buildStatsScript();
    expect(script).toContain("flattenedTags");
  });

  it("references flattenedFolders", () => {
    const script = buildStatsScript();
    expect(script).toContain("flattenedFolders");
  });

  it("contains Task.Status checks", () => {
    const script = buildStatsScript();
    expect(script).toContain("Task.Status.Available");
    expect(script).toContain("Task.Status.Overdue");
    expect(script).toContain("Task.Status.DueSoon");
  });

  it("contains Project.Status checks", () => {
    const script = buildStatsScript();
    expect(script).toContain("Project.Status.Active");
    expect(script).toContain("Project.Status.OnHold");
    expect(script).toContain("Project.Status.Done");
    expect(script).toContain("Project.Status.Dropped");
  });

  it("contains inbox.length", () => {
    const script = buildStatsScript();
    expect(script).toContain("inbox.length");
  });

  it("produces tasks section", () => {
    const script = buildStatsScript();
    expect(script).toContain("tasks:");
    expect(script).toContain("total:");
    expect(script).toContain("available:");
    expect(script).toContain("remaining:");
    expect(script).toContain("overdue:");
    expect(script).toContain("dueSoon:");
    expect(script).toContain("flagged:");
  });

  it("produces projects section", () => {
    const script = buildStatsScript();
    expect(script).toContain("projects:");
    expect(script).toContain("active:");
    expect(script).toContain("onHold:");
    expect(script).toContain("dropped:");
  });

  it("produces tags section", () => {
    const script = buildStatsScript();
    expect(script).toContain("tags:");
  });

  it("produces folders section", () => {
    const script = buildStatsScript();
    expect(script).toContain("folders:");
  });
});
