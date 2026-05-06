import { render, screen } from "@testing-library/react";
import { usePcbStudioStore } from "../store/pcb-studio-store";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  beforeEach(() => {
    usePcbStudioStore.setState({
      project: null,
      selectedComponentId: null,
      activeTool: "select",
      activeMode: "pcb",
    });
  });

  it("renders the professional project empty state", () => {
    render(<AppShell />);
    expect(
      screen.getByText("Professional PCB studio workspace"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("New project")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Load example")[0]).toBeInTheDocument();
  });

  it("renders global engineering actions", () => {
    render(<AppShell />);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /run drc/i })[0],
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /simulate/i }),
    ).toBeInTheDocument();
  });

  it("renders the status bar", () => {
    render(<AppShell />);
    expect(screen.getByText("Snap On")).toBeInTheDocument();
    expect(screen.getByText("No workspace")).toBeInTheDocument();
  });
});
