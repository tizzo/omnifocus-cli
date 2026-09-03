import { describe, expect, it } from "vitest";
import {
  buildCreateFolderScript,
  buildDeleteFolderScript,
  buildListFoldersScript,
  buildUpdateFolderScript,
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

describe("buildCreateFolderScript", () => {
  it("contains new Folder with the given name", () => {
    const script = buildCreateFolderScript({ name: "Work" });
    expect(script).toContain("new Folder('Work')");
  });

  it("contains serializeFolder", () => {
    const script = buildCreateFolderScript({ name: "Work" });
    expect(script).toContain("serializeFolder(newFolder)");
  });

  it("does not call moveSections when no parent is provided", () => {
    const script = buildCreateFolderScript({ name: "Work" });
    expect(script).not.toContain("moveSections");
  });

  it("calls moveSections when parent is provided", () => {
    const script = buildCreateFolderScript({ name: "Sub", parent: "Work" });
    expect(script).toContain("Folder.byIdentifier('Work')");
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("moveSections([newFolder], parentFolder)");
  });

  it("throws when parent is not found", () => {
    const script = buildCreateFolderScript({ name: "Sub", parent: "Missing" });
    expect(script).toContain(
      "throw new Error('Parent folder not found: Missing')",
    );
  });

  it("escapes special characters in name", () => {
    const script = buildCreateFolderScript({ name: "it's" });
    expect(script).toContain("new Folder('it\\'s')");
  });

  it("escapes special characters in parent", () => {
    const script = buildCreateFolderScript({ name: "Sub", parent: "it's" });
    expect(script).toContain("Folder.byIdentifier('it\\'s')");
  });
});

describe("buildDeleteFolderScript", () => {
  it("contains Folder.byIdentifier lookup", () => {
    const script = buildDeleteFolderScript("abc123");
    expect(script).toContain("Folder.byIdentifier('abc123')");
  });

  it("contains flattenedFolders.byName fallback", () => {
    const script = buildDeleteFolderScript("Work");
    expect(script).toContain("flattenedFolders.byName('Work')");
  });

  it("contains deleteObject call", () => {
    const script = buildDeleteFolderScript("Work");
    expect(script).toContain("deleteObject(folder)");
  });

  it("throws when folder not found", () => {
    const script = buildDeleteFolderScript("Work");
    expect(script).toContain("throw new Error");
    expect(script).toContain("Folder not found");
  });

  it("escapes special characters", () => {
    const script = buildDeleteFolderScript("it's");
    expect(script).toContain("Folder.byIdentifier('it\\'s')");
    expect(script).toContain("flattenedFolders.byName('it\\'s')");
  });
});

describe("buildUpdateFolderScript", () => {
  it("looks up folder by identifier and name", () => {
    const script = buildUpdateFolderScript("Work", {});
    expect(script).toContain("Folder.byIdentifier('Work')");
    expect(script).toContain("flattenedFolders.byName('Work')");
  });

  it("throws when folder not found", () => {
    const script = buildUpdateFolderScript("Work", {});
    expect(script).toContain("throw new Error('Folder not found: Work')");
  });

  it("sets folder.name when name is provided", () => {
    const script = buildUpdateFolderScript("Work", { name: "Personal" });
    expect(script).toContain("folder.name = 'Personal'");
  });

  it("sets Folder.Status.Active when status is active", () => {
    const script = buildUpdateFolderScript("Work", { status: "active" });
    expect(script).toContain("folder.status = Folder.Status.Active;");
  });

  it("sets Folder.Status.Dropped when status is dropped", () => {
    const script = buildUpdateFolderScript("Work", { status: "dropped" });
    expect(script).toContain("folder.status = Folder.Status.Dropped;");
  });

  it("moves to library when parent is null", () => {
    const script = buildUpdateFolderScript("Work", { parent: null });
    expect(script).toContain("moveSections([folder], library);");
  });

  it("moves under a new parent when parent is a string", () => {
    const script = buildUpdateFolderScript("Sub", { parent: "Work" });
    expect(script).toContain("Folder.byIdentifier('Work')");
    expect(script).toContain("flattenedFolders.byName('Work')");
    expect(script).toContain("moveSections([folder], newParent);");
  });

  it("throws when new parent is not found", () => {
    const script = buildUpdateFolderScript("Sub", { parent: "Missing" });
    expect(script).toContain(
      "throw new Error('Parent folder not found: Missing')",
    );
  });

  it("does not include status assignments when status is not provided", () => {
    const script = buildUpdateFolderScript("Work", { name: "Renamed" });
    // Match the assignment specifically — the serializer preamble names the
    // enum members in its status lookup table.
    expect(script).not.toContain("folder.status = Folder.Status.Active;");
    expect(script).not.toContain("folder.status = Folder.Status.Dropped;");
  });

  it("escapes special characters in nameOrId and newName", () => {
    const script = buildUpdateFolderScript("it's", { name: "new's" });
    expect(script).toContain("Folder.byIdentifier('it\\'s')");
    expect(script).toContain("folder.name = 'new\\'s'");
  });

  it("contains serializeFolder", () => {
    const script = buildUpdateFolderScript("Work", {});
    expect(script).toContain("serializeFolder(folder)");
  });
});
