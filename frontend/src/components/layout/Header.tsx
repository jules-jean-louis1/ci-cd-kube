import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { SearchBar } from "../search/SearchBar";
import { ModeToggle } from "../ui/toggle-mode";

export const Header = () => {
  return (
    <header className="app-header sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="announcement-bar" aria-label="Information projet">
        <span>PIPELINE DOCS</span>
        <span aria-hidden="true">✦</span>
        <span>BUILD · TEST · SHIP</span>
        <span aria-hidden="true">✦</span>
        <span>DOCUMENTATION VIVANTE</span>
      </div>
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="brand-lockup flex items-center gap-3 text-foreground">
          <span className="brand-mark flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" />
          </span>
          <span className="brand-name">ci-cd-kube</span>
        </Link>
        <nav className="header-nav hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          <a className="rounded-full px-4 py-2 text-foreground" href="#accueil">Accueil</a>
          <a className="rounded-full px-4 py-2" href="#parcours">Parcours</a>
          <a className="rounded-full px-4 py-2" href="#enjeux">Enjeux</a>
        </nav>
        <div className="flex items-center gap-2">
          <SearchBar />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
