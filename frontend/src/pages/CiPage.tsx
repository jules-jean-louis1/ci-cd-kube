import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  PackageCheck,
  PlayCircle,
  TestTube2,
} from "lucide-react";

const ciSteps = [
  {
    icon: GitBranch,
    title: "Déclencheurs GitHub Actions",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Le workflow démarre à chaque push sur main et lors de la création d’un tag Git.",
  },
  {
    icon: PackageCheck,
    title: "Installation des dépendances",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Les dépendances sont installées de manière reproductible avant les contrôles.",
  },
  {
    icon: CheckCircle2,
    title: "Lint et qualité",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cette étape vérifie la cohérence du code et bloque les changements qui ne respectent pas les règles du projet.",
  },
  {
    icon: TestTube2,
    title: "Tests",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Les tests unitaires, fonctionnels et end-to-end permettent de valider le comportement avant la suite du pipeline.",
  },
];

export const CiPage = () => {
  return (
    <article className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Le pipeline</span>
        <ArrowRight className="size-3" />
        <span className="text-foreground">CI</span>
      </div>

      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          Intégration continue
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          CI : valider chaque changement
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          La phase d’intégration continue automatise les vérifications qui doivent être réalisées
          avant de construire et de publier une nouvelle version de l’application.
        </p>
      </header>

      <section className="mt-16 rounded-xl border bg-muted/40 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
            <PlayCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Une pipeline déclenchée par le code</h2>
            <p className="mt-2 leading-7 text-muted-foreground">
              À chaque modification, GitHub Actions récupère le projet et exécute les mêmes
              contrôles. L’objectif est de donner un feedback rapide à l’équipe et d’empêcher un
              changement invalide de continuer vers le build ou le déploiement.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16" aria-labelledby="ci-etapes-title">
        <p className="text-sm font-medium text-primary">Les étapes</p>
        <h2 id="ci-etapes-title" className="mt-2 text-2xl font-semibold tracking-tight">
          Du commit au feedback
        </h2>
        <div className="mt-7 space-y-3">
          {ciSteps.map(({ icon: Icon, title, text }, index) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                <Icon className="size-4" />
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

      <section className="mt-16 border-t pt-10">
        <h2 className="text-2xl font-semibold tracking-tight">À retenir</h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Une CI utile ne consiste pas seulement à lancer des commandes. Elle formalise le niveau de
          qualité attendu par l’équipe et rend visible immédiatement la cause d’un échec.
        </p>
      </section>
    </article>
  );
};
