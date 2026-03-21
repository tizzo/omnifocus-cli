import { describe, it, expect } from "vitest";
import {
  buildListFoldersScript,
  buildViewFolderScript,
} from "../src/omnifocus/folder-scripts.js";

describe("buildListFoldersScript", () => {
  it("contains flattenedFolders", () => {
    const script = buildListFoldersScript();
    expect(script).toContain("flattenedFolders");
  });

  it("contains serializeFolder", () => {
    const script = buildListFoldersScript();
    expect(script).toContain("serializeFolder");
  });

  it("contains JSON.stringify", () => {
    const script = buildListFoldersScript();
    expect(script).toContain("JSON.stringify");
  });
});

describe("buildViewFolderScript", () => {
  it("contains Folder.byIdentifier with the given ID", () => {
    const script = buildViewFolderScript("folder-id");
    expect(script).toContain("Folder.byIdentifier('folder-id')");
  });

  it("contains flattenedFolders.byName fallback", () => {
    const script = buildViewFolderScript("Work");
    expect(script).toContain("flattenedFolders.byName('Work')");
  });

  it("throws error when folder not found", () => {
    const script = buildViewFolderScript("Work");
    expect(script).toContain("throw new Error('Folder not found: Work')");
  });

  it("includes projects mapping", () => {
    const script = buildViewFolderScript("Work");
    expect(script).toContain("folder.projects.map");
    expect(script).toContain("serializeProject");
  });

  it("includes subfolders mapping", () => {
    const script = buildViewFolderScript("Work");
    expect(script).toContain("folder.folders.map");
    expect(script).toContain("serializeFolder");
  });

  it("escapes special characters", () => {
    const script = buildViewFolderScript("it's a folder");
    expect(script).toContain("it\\'s a folder");
  });
});
