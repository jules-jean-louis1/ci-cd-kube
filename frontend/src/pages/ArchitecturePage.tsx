import {
  ArrowDown,
  ArrowRight,
  Box,
  Code2,
  Globe2,
  GitBranch,
  GitPullRequest,
  ServerCog,
  ShieldCheck,
} from "lucide-react";

const architectureSteps = [
  {
    icon: GitBranch,
    title: "Le dépôt Git",
    text: "Les changements sont versionnés dans Git. Un push sur main ou un tag de version déclenche le workflow GitHub Actions.",
  },
  {
    icon: ShieldCheck,
    title: "GitHub Actions",
    text: "La pipeline installe les dépendances, lance les tests, vérifie le formatage et analyse les risques avant toute publication.",
  },
  {
    icon: Box,
    title: "L’image Docker",
    text: "Vite compile le frontend dans une étape de build. L’image finale ne contient que les fichiers statiques servis par Nginx.",
  },
  {
    icon: ServerCog,
    title: "Kubernetes",
    text: "Le Deployment lance l’image, le Service la rend accessible dans le cluster et l’Ingress expose le site en HTTPS.",
  },
];

export const ArchitecturePage = () => {
  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Comprendre</span>
        <ArrowRight className="size-3" />
        <span className="text-foreground">Architecture</span>
      </div>

      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          Architecture du projet
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Du commit à l’application en ligne
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Chaque composant a une responsabilité précise : valider le code, construire une image
          reproductible, puis servir le frontend React depuis Kubernetes.
        </p>
      </header>

      <section className="mt-16" aria-labelledby="architecture-flow-title">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">Le parcours</p>
          <h2 id="architecture-flow-title" className="mt-2 text-2xl font-semibold tracking-tight">
            Les composants qui collaborent
          </h2>
        </div>
        <div className="space-y-3">
          {architectureSteps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">0{index + 1}</span>
                  <h3 className="font-semibold">{title}</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className="mt-16 rounded-xl border bg-muted/40 p-6 sm:p-8"
        aria-labelledby="request-flow-title"
      >
        <div className="mb-6 flex items-center gap-3">
          <GitPullRequest className="size-5 text-primary" />
          <h2 id="request-flow-title" className="text-lg font-semibold">
            Le chemin d’une requête
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-5 sm:items-center">
          <FlowItem icon={Globe2} label="Navigateur" />
          <ArrowDown className="mx-auto size-4 rotate-[-90deg] text-muted-foreground sm:rotate-[-90deg]" />
          <FlowItem icon={Globe2} label="Ingress HTTPS" />
          <ArrowDown className="mx-auto size-4 rotate-[-90deg] text-muted-foreground sm:rotate-[-90deg]" />
          <FlowItem icon={ServerCog} label="Service → Nginx" />
        </div>
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          Nginx sert les fichiers compilés de React. La route <code>/health</code> répond
          directement depuis Nginx pour le smoke test, sans dépendre du JavaScript de React.
        </p>
      </section>

      <section className="mt-16 border-t pt-10">
        <div className="flex items-start gap-3">
          <Code2 className="mt-1 size-5 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">À retenir</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              La CI contrôle et fabrique l’application. Le CD publie cette version dans Kubernetes.
              Le navigateur ne communique jamais directement avec GitHub Actions ou Docker Hub.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
};

function FlowItem({ icon: Icon, label }: { icon: typeof Globe2; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lg border bg-background px-3 py-3 text-sm font-medium">
      <Icon className="size-4 text-primary" />
      {label}
    </div>
  );
}
