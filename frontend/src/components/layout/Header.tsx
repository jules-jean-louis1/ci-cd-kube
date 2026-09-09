import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { SearchBar } from "../search/SearchBar";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-4" />
          </span>
          ci-cd-kube
        </Link>
        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
          <a className="rounded-md px-3 py-2 text-foreground" href="#accueil">
            Accueil
          </a>
          <a className="rounded-md px-3 py-2 hover:bg-muted hover:text-foreground" href="#parcours">
            Parcours
          </a>
          <a className="rounded-md px-3 py-2 hover:bg-muted hover:text-foreground" href="#enjeux">
            Enjeux
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <SearchBar />
        </div>
      </div>
    </header>
  );
};
