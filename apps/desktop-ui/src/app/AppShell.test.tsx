import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders the main title", () => {
    render(<AppShell />);
    expect(screen.getByText("Local Engineering Studio")).toBeInTheDocument();
  });

  it("renders command palette button", () => {
    render(<AppShell />);
    expect(screen.getByRole("button", { name: /Command Palette.*searchable command list/i })).toBeInTheDocument();
  });

  it("renders analysis and log sections", () => {
    render(<AppShell />);
    expect(screen.getByText("Analysis")).toBeInTheDocument();
    expect(screen.getByText("Activity Log")).toBeInTheDocument();
  });

  it("renders rule controls and route controls", () => {
    render(<AppShell />);
    expect(screen.getByText("Apply Rules")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Route$/ })).toBeInTheDocument();
  });

  it("renders quality and workspace controls", () => {
    render(<AppShell />);
    expect(screen.getByRole("button", { name: /^Run Quality Suite$/ })).toBeInTheDocument();
    expect(screen.getByText("Autosave interval (sec)")).toBeInTheDocument();
    expect(screen.getByText("Place Grid 3x3")).toBeInTheDocument();
  });

  it("renders history panel", () => {
    render(<AppShell />);
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("No history yet")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search history...")).toBeInTheDocument();
  });

  it("renders pcp lifecycle panel", () => {
    render(<AppShell />);
    expect(screen.getByText("PCP Lifecycle")).toBeInTheDocument();
    expect(screen.getByText(/Schematic to manufacturing readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/Place components to enable lifecycle analysis/i)).toBeInTheDocument();
  });

  it("renders duplicate workflows", () => {
    render(<AppShell />);
    expect(screen.getAllByRole("button", { name: /^Duplicate/i }).length).toBeGreaterThan(1);
  });
});
