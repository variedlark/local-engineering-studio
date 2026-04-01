import { describe, expect, it } from "vitest";
import { groupRankedCommands, rankCommands, type CommandSearchItem } from "./command-search";

const commands: CommandSearchItem[] = [
  {
    id: "save",
    label: "Save Project",
    group: "Project",
    hotkey: "Cmd/Ctrl+S",
    keywords: ["save", "project", "bundle"],
    action: () => undefined,
  },
  {
    id: "route",
    label: "Run Route",
    group: "Analysis",
    hotkey: "F6",
    keywords: ["route", "path"],
    action: () => undefined,
  },
  {
    id: "quality",
    label: "Run Quality Suite",
    group: "Analysis",
    hotkey: "F8",
    keywords: ["quality", "score"],
    action: () => undefined,
  },
];

describe("rankCommands", () => {
  it("returns all commands for empty query", () => {
    const ranked = rankCommands("", commands);
    expect(ranked).toHaveLength(3);
  });

  it("prioritizes label matches", () => {
    const ranked = rankCommands("route", commands);
    expect(ranked[0]?.id).toBe("route");
  });

  it("matches by hotkey and keywords", () => {
    const hotkey = rankCommands("f8", commands);
    expect(hotkey[0]?.id).toBe("quality");

    const keyword = rankCommands("bundle", commands);
    expect(keyword[0]?.id).toBe("save");
  });
});

describe("groupRankedCommands", () => {
  it("groups ranked items by group", () => {
    const ranked = rankCommands("run", commands);
    const grouped = groupRankedCommands(ranked);
    expect(grouped.length).toBeGreaterThan(0);
    expect(grouped.some((entry) => entry.group === "Analysis")).toBe(true);
  });
});
