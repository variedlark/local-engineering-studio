import { fireEvent, render, screen } from "@testing-library/react";
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

  it("loads the demo board into the modular PCB canvas", () => {
    render(<AppShell />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /load example/i })[0],
    );

    expect(
      screen.getAllByText(/Precision Motor Controller/i)[0],
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /select u1/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Viewport controls")).toHaveTextContent(
      "100%",
    );
  });

  it("surfaces selected DRC findings on the canvas", () => {
    render(<AppShell />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /load example/i })[0],
    );
    fireEvent.click(screen.getAllByText(/Clearance below rule/i)[0]);

    expect(
      screen.getAllByText("Min copper clearance 0.15 mm")[0],
    ).toBeInTheDocument();
  });
});
