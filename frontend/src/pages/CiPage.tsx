import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  LockKeyhole,
  PackageCheck,
  PlayCircle,
  Rocket,
  ShieldCheck,
  TestTube2,
} from "lucide-react";

const ciSteps = [
  {
    icon: GitBranch,
    title: "Déclencheurs GitHub Actions",
    text: "Le workflow GitHub Actions se lance sur une pull request vers main, sur un push vers main ou lors de la création d’un tag v*. Les pull requests obtiennent donc un feedback avant le merge, tandis que main peut aller jusqu’au déploiement.",
  },
  {
    icon: PackageCheck,
    title: "Installation des dépendances",
    text: "Chaque job utilise Node.js 22 et npm ci pour installer exactement les versions du package-lock.json. Le cache npm d’actions/setup-node évite de retélécharger inutilement les paquets.",
  },
  {
    icon: CheckCircle2,
    title: "Lint et qualité",
    text: "deps_leak lance npm audit et Gitleaks pour chercher des dépendances vulnérables ou des secrets exposés. En parallèle, format_lint vérifie le formatage, ESLint et le typage TypeScript. Ces deux jobs indépendants appliquent le principe fail fast.",
  },
  {
    icon: TestTube2,
    title: "Tests",
    text: "Après les contrôles rapides, les tests unitaires s’exécutent avec Vitest. Les tests end-to-end Playwright sont lancés en parallèle sur Chromium, Firefox et WebKit grâce à une matrix, pour vérifier le parcours utilisateur dans plusieurs navigateurs.",
  },
  {
    icon: ShieldCheck,
    title: "Build et scan de l’image",
    text: "Quand les tests passent, l’image de production est construite puis analysée par Trivy. Le job bloque si des vulnérabilités HIGH ou CRITICAL corrigibles sont détectées. L’image validée est ensuite poussée sur Docker Hub avec ses tags de production et une attestation de provenance.",
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
              Ce fichier de workflow décrit la chaîne complète et ses dépendances entre jobs. Les
              contrôles rapides partent en parallèle, puis les tests et le build ne démarrent que si
              la première ligne de défense est verte. Cela donne un retour lisible tout en évitant
              de construire ou publier un code qui n’est pas validé.
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
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
            <Rocket className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">CD : livrer ce qui est validé</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">De l’image à Kubernetes</h2>
          </div>
        </div>
        <p className="mt-3 leading-7 text-muted-foreground">
          Le déploiement ne s’exécute que sur un push vers main ou sur un tag, après la publication
          de l’image. Le job deploy configure kubectl avec les secrets du cluster, applique les
          manifests du dossier k8s/frontend, met à jour l’image du Deployment puis attend la fin du
          rollout. Il vérifie enfin que le Service frontend existe. Kubernetes peut ainsi remplacer
          progressivement les pods plutôt que couper l’application pendant la mise à jour.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Delivery title="Publier" text="Docker Hub reçoit l’image qui a passé le scan Trivy." />
          <Delivery title="Déployer" text="kubectl applique les manifests et la nouvelle image." />
          <Delivery
            title="Vérifier"
            text="Le rollout et le Service sont contrôlés avant de conclure."
          />
        </div>
      </section>
    </article>
  );
};

function Delivery({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2">
        <LockKeyhole className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
