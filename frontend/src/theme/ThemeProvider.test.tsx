import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider.js";

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider>
        <div>child content</div>
      </ThemeProvider>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("sets data-theme on the document element", () => {
    render(
      <ThemeProvider>
        <div>x</div>
      </ThemeProvider>,
    );
    const theme = document.documentElement.getAttribute("data-theme");
    expect(theme === "light" || theme === "dark").toBe(true);
  });
});
