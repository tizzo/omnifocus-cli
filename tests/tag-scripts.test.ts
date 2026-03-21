import { describe, it, expect } from "vitest";
import {
  buildCreateTagScript,
  buildDeleteTagScript,
  buildUpdateTagScript,
} from "../src/omnifocus/tag-scripts.js";

describe("buildCreateTagScript", () => {
  it("contains new Tag with the given name", () => {
    const script = buildCreateTagScript("Work");
    expect(script).toContain("new Tag('Work')");
  });

  it("contains serializeTag", () => {
    const script = buildCreateTagScript("Work");
    expect(script).toContain("serializeTag");
  });

  it("escapes single quotes in name", () => {
    const script = buildCreateTagScript("it's");
    expect(script).toContain("new Tag('it\\'s')");
  });

  it("escapes backslashes in name", () => {
    const script = buildCreateTagScript("a\\b");
    expect(script).toContain("new Tag('a\\\\b')");
  });

  it("escapes newlines in name", () => {
    const script = buildCreateTagScript("line1\nline2");
    expect(script).toContain("new Tag('line1\\nline2')");
  });
});

describe("buildDeleteTagScript", () => {
  it("contains Tag.byIdentifier lookup", () => {
    const script = buildDeleteTagScript("abc123");
    expect(script).toContain("Tag.byIdentifier('abc123')");
  });

  it("contains flattenedTags.byName fallback", () => {
    const script = buildDeleteTagScript("Work");
    expect(script).toContain("flattenedTags.byName('Work')");
  });

  it("contains deleteObject call", () => {
    const script = buildDeleteTagScript("Work");
    expect(script).toContain("deleteObject(tag)");
  });

  it("contains error throw for not found", () => {
    const script = buildDeleteTagScript("Work");
    expect(script).toContain("throw new Error");
    expect(script).toContain("Tag not found");
  });

  it("escapes special characters in name/ID", () => {
    const script = buildDeleteTagScript("it's");
    expect(script).toContain("Tag.byIdentifier('it\\'s')");
    expect(script).toContain("flattenedTags.byName('it\\'s')");
  });
});

describe("buildUpdateTagScript", () => {
  it("sets tag.name when newName is provided", () => {
    const script = buildUpdateTagScript("Work", "Personal", undefined);
    expect(script).toContain("tag.name = 'Personal'");
  });

  it("sets Tag.Status.Active when status is active", () => {
    const script = buildUpdateTagScript("Work", undefined, "active");
    expect(script).toContain("tag.status = Tag.Status.Active;");
  });

  it("sets Tag.Status.OnHold when status is onhold", () => {
    const script = buildUpdateTagScript("Work", undefined, "onhold");
    expect(script).toContain("tag.status = Tag.Status.OnHold;");
  });

  it("sets Tag.Status.Dropped when status is dropped", () => {
    const script = buildUpdateTagScript("Work", undefined, "dropped");
    expect(script).toContain("tag.status = Tag.Status.Dropped;");
  });

  it("sets both name and status", () => {
    const script = buildUpdateTagScript("Work", "Renamed", "onhold");
    expect(script).toContain("tag.name = 'Renamed'");
    expect(script).toContain("tag.status = Tag.Status.OnHold;");
  });

  it("escapes special characters in nameOrId", () => {
    const script = buildUpdateTagScript("it's", undefined, undefined);
    expect(script).toContain("Tag.byIdentifier('it\\'s')");
    expect(script).toContain("flattenedTags.byName('it\\'s')");
  });

  it("escapes special characters in newName", () => {
    const script = buildUpdateTagScript("Work", "it's new", undefined);
    expect(script).toContain("tag.name = 'it\\'s new'");
  });

  it("contains serializeTag", () => {
    const script = buildUpdateTagScript("Work", undefined, undefined);
    expect(script).toContain("serializeTag(tag, false)");
  });
});
