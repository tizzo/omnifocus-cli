import { describe, it, expect } from "vitest";
import { buildForecastScript } from "../src/omnifocus/forecast-scripts.js";

describe("buildForecastScript", () => {
  it("contains serializeTask (TASK_SERIALIZER)", () => {
    const script = buildForecastScript();
    expect(script).toContain("function serializeTask");
  });

  it("contains overdue section", () => {
    const script = buildForecastScript();
    expect(script).toContain("Task.Status.Overdue");
    expect(script).toContain("overdue:");
  });

  it("contains dueToday section", () => {
    const script = buildForecastScript();
    expect(script).toContain("dueToday:");
    expect(script).toContain("todayStart");
    expect(script).toContain("todayEnd");
  });

  it("contains dueSoon section", () => {
    const script = buildForecastScript();
    expect(script).toContain("dueSoon:");
    expect(script).toContain("soonEnd");
  });

  it("contains flagged section", () => {
    const script = buildForecastScript();
    expect(script).toContain("flagged:");
    expect(script).toContain("t.flagged");
  });

  it("contains deferredToToday section", () => {
    const script = buildForecastScript();
    expect(script).toContain("deferredToToday:");
    expect(script).toContain("effectiveDeferDate");
  });

  it("contains date filtering logic", () => {
    const script = buildForecastScript();
    expect(script).toContain("var todayStart = new Date(");
    expect(script).toContain("var todayEnd = new Date(");
    expect(script).toContain("var soonEnd = new Date(");
  });

  it("filters out completed and dropped tasks", () => {
    const script = buildForecastScript();
    expect(script).toContain("t.completed");
    expect(script).toContain("Task.Status.Dropped");
    expect(script).toContain("continue");
  });
});
