import { ArchitecturePage } from "@/pages/ArchitecturePage";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Architecture page", () => {
  it("Présente l'architerture", () => {
    render(<ArchitecturePage />);

    expect(
      screen.getByRole("heading", { name: "Du commit à l’application en ligne" }),
    ).toBeInTheDocument();
  });
});
