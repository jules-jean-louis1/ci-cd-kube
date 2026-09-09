import { ArrowRight, CheckCircle2, GitBranch, LockKeyhole, Rocket, ServerCog } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const HomePage = () => {
  return (
    <article id="accueil" className="mx-auto max-w-4xl px-6 py-12 sm:px-10 sm:py-16">
      <div className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Accueil</span>
        <ArrowRight className="size-3" />
        <span className="text-foreground">Vue d’ensemble</span>
      </div>

      <header className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          Documentation du projet
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Comprendre et construire un pipeline CI/CD
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          ci-cd-kube présente le chemin complet qui transforme un commit en application déployée sur
          Kubernetes : tester, construire, sécuriser, publier et déployer.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a className={buttonVariants()} href="#parcours">
            Découvrir le parcours <ArrowRight />
          </a>
          <a className={buttonVariants({ variant: "outline" })} href="#architecture">
            Voir l’architecture
          </a>
        </div>
      </header>

      <section id="parcours" className="mt-20 scroll-mt-24">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">Le parcours</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Du code à la production</h2>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            Une vue simple des étapes automatisées par GitHub Actions et de leur rôle dans la
            livraison.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Step
            icon={GitBranch}
            number="01"
            title="Intégrer"
            text="Un push sur main ou un tag Git déclenche la pipeline."
          />
          <Step
            icon={CheckCircle2}
            number="02"
            title="Vérifier"
            text="Les tests, le lint et les contrôles qualité valident le changement."
          />
          <Step
            icon={LockKeyhole}
            number="03"
            title="Sécuriser"
            text="L’image Docker est analysée avec une approche shift left."
          />
          <Step
            icon={Rocket}
            number="04"
            title="Livrer"
            text="L’image est publiée puis déployée sur l’infrastructure Kubernetes."
          />
        </div>
      </section>

      <section id="enjeux" className="mt-20 scroll-mt-24 border-t pt-12">
        <p className="text-sm font-medium text-primary">Pourquoi ce projet ?</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Automatiser avec intention</h2>
        <div className="mt-7 grid gap-8 md:grid-cols-3">
          <Insight
            title="Réduire le risque"
            text="Chaque modification passe par les mêmes contrôles avant d’atteindre un environnement partagé."
          />
          <Insight
            title="Détecter tôt"
            text="Le shift left rapproche les tests et les scans de sécurité du moment où le code est écrit."
          />
          <Insight
            title="Travailler en équipe"
            text="Des règles de branches et des feedbacks rapides rendent la livraison plus prévisible."
          />
        </div>
      </section>

      <section
        id="architecture"
        className="mt-20 scroll-mt-24 rounded-xl border bg-muted/40 p-6 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
            <ServerCog className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Une documentation pour suivre le raisonnement</h2>
            <p className="mt-2 leading-7 text-muted-foreground">
              Les prochaines sections détailleront l’architecture, les workflows GitHub Actions,
              Docker, Trivy et les manifestes Kubernetes avec leurs décisions techniques.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
};

function Step({
  icon: Icon,
  number,
  title,
  text,
}: {
  icon: typeof GitBranch;
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-primary">
        <Icon className="size-5" />
        <span className="text-xs font-semibold tracking-wider text-muted-foreground">{number}</span>
      </div>
      <h3 className="mt-8 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
