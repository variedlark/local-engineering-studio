import { render, screen } from "@testing-library/react";
import { AppShell } from "./AppShell";

describe("AppShell", () => {
  it("renders the welcome empty state", () => {
    render(<AppShell />);
    expect(screen.getByText("Welcome to the immersive workspace")).toBeInTheDocument();
    expect(screen.getByText("Recent Projects")).toBeInTheDocument();
    expect(screen.getByText("Quick Start Templates")).toBeInTheDocument();
  });

  it("renders command bar trigger", () => {
    render(<AppShell />);
    expect(screen.getByRole("button", { name: /open command bar/i })).toBeInTheDocument();
  });

  it("renders the status bar", () => {
    render(<AppShell />);
    expect(screen.getByText("Idle")).toBeInTheDocument();
    expect(screen.getByText("Snap Off")).toBeInTheDocument();
  });
});
