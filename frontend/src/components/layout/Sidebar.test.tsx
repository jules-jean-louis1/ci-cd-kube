import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Sidebar } from "./Sidebar";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

describe("Sidebar", () => {
  it("affiche la navigation principale et marque CI comme page active", () => {
    render(
      <MemoryRouter initialEntries={["/ci"]}>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "Navigation principale" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "CI" })).toHaveAttribute("aria-current", "page");
  });

  it("navigue vers la page CI quand le lien est sélectionné", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("link", { name: "CI" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/ci");
  });
});
