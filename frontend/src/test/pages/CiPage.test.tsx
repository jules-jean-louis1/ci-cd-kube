import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { CiPage } from "../../pages/CiPage"

describe("CiPage", () => {
    it("présente les étapes essentielles de l’intégration continue", () => {
        render(<CiPage />)

        expect(screen.getByRole("heading", { name: "CI : valider chaque changement" })).toBeInTheDocument()
        expect(screen.getByRole("heading", { name: "Du commit au feedback" })).toBeInTheDocument()
        expect(screen.getByText("Déclencheurs GitHub Actions")).toBeInTheDocument()
        expect(screen.getByText("Installation des dépendances")).toBeInTheDocument()
        expect(screen.getByText("Lint et qualité")).toBeInTheDocument()
        expect(screen.getByText("Tests")).toBeInTheDocument()
    })
})