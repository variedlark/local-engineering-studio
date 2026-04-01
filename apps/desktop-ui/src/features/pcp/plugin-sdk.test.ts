import { describe, expect, it } from "vitest";
import {
  createPluginRegistry,
  pluginManifestSummary,
  pluginsByCapability,
  registerPlugin,
  runPlugin,
  validatePluginManifest,
} from "./plugin-sdk";

describe("plugin-sdk", () => {
  it("registers and runs plugin", async () => {
    const registry = registerPlugin(createPluginRegistry(), {
      manifest: {
        id: "demo.plugin",
        name: "Demo",
        version: "1.0.0",
        author: "team",
        capabilities: ["analyze"],
        entry: "index.ts",
      },
      run: () => ({ ok: true, message: "done" }),
    });

    const result = await runPlugin(registry, "demo.plugin", {
      projectName: "P",
      revision: 1,
      now: Date.now(),
    });
    expect(result.ok).toBe(true);
    expect(pluginsByCapability(registry, "analyze")).toHaveLength(1);
  });

  it("validates manifest and summaries", () => {
    const manifest = {
      id: "x",
      name: "X",
      version: "0.1.0",
      author: "a",
      capabilities: ["export"] as const,
      entry: "main.ts",
    };
    const validation = validatePluginManifest(manifest);
    expect(validation.valid).toBe(true);
    expect(pluginManifestSummary(manifest)).toMatch(/X@0.1.0/);
  });
});
