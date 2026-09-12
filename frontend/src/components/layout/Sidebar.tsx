import { NavLink } from "react-router-dom";
import { ChevronRight, CircleDot, GitBranch, ShieldCheck, Workflow } from "lucide-react";

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `mb-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
    isActive
      ? "bg-muted font-medium text-foreground"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

export const Sidebar = () => {
  return (
    <aside className="hidden w-64 shrink-0 border-r lg:block">
      <nav
        className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-5 py-8"
        aria-label="Navigation principale"
      >
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Documentation
        </p>
        <NavLink className={linkClassName} to="/">
          <CircleDot className="size-4 text-primary" /> Vue d’ensemble
        </NavLink>

        <p className="mb-2 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Comprendre
        </p>
        <NavLink className={linkClassName} to="/architecture">
          <Workflow className="size-4" /> Architecture <ChevronRight className="ml-auto size-3" />
        </NavLink>
        <NavLink className={linkClassName} to="/#branches">
          <GitBranch className="size-4" /> Stratégie de branches{" "}
          <ChevronRight className="ml-auto size-3" />
        </NavLink>

        <p className="mb-2 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Le pipeline
        </p>
        <NavLink className={linkClassName} to="/ci">
          CI
        </NavLink>
        <NavLink className={linkClassName} to="/#build-security">
          <ShieldCheck className="size-4" /> Build & Security
        </NavLink>
        <NavLink className={linkClassName} to="/#kubernetes">
          CD & Kubernetes
        </NavLink>

        <p className="mb-2 mt-7 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ressources
        </p>
        <NavLink className={linkClassName} to="/#reference">
          Référence
        </NavLink>
        <NavLink className={linkClassName} to="/#projet">
          Projet
        </NavLink>
      </nav>
    </aside>
  );
};
