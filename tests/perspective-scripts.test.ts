import { describe, expect, it } from "vitest";
import { buildListPerspectivesScript } from "../src/omnifocus/perspective-scripts.js";

describe("buildListPerspectivesScript", () => {
  it("contains Perspective.BuiltIn.all", () => {
    const script = buildListPerspectivesScript();
    expect(script).toContain("Perspective.BuiltIn.all");
  });

  it("contains Perspective.Custom.all", () => {
    const script = buildListPerspectivesScript();
    expect(script).toContain("Perspective.Custom.all");
  });

  it("contains serializePerspective", () => {
    const script = buildListPerspectivesScript();
    expect(script).toContain("serializePerspective");
  });

  it("concatenates built-in and custom perspectives", () => {
    const script = buildListPerspectivesScript();
    expect(script).toContain("builtIn.concat(custom)");
  });

  it("marks built-in perspectives as isBuiltIn: true", () => {
    const script = buildListPerspectivesScript();
    expect(script).toContain("isBuiltIn: true");
  });
});
