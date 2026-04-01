import { describe, expect, it } from "vitest";
import { runCliCommand } from "./headless-cli";

describe("headless-cli", () => {
  it("runs create demo board command", () => {
    const result = runCliCommand({ type: "create_demo_board", projectName: "Demo" });
    expect(result.ok).toBe(true);
    expect(result.output.join(" ")).toMatch(/Created demo board/);
  });

  it("runs analyze and export commands", () => {
    const analysis = runCliCommand({ type: "analyze_board" });
    expect(analysis.ok).toBe(true);

    const exportResult = runCliCommand({
      type: "export_package",
      projectName: "Demo",
      revision: 3,
    });
    expect(exportResult.ok).toBe(true);
    expect(exportResult.output[0]).toMatch(/Export Demo/);
  });
});
