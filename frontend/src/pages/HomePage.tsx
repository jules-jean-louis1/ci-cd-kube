import { ArrowRight, CheckCircle2, GitBranch, LockKeyhole, Rocket, ServerCog } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const HomePage = () => {
  return (
    <article id="accueil" className="home-page mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-14">
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <span>Accueil</span><ArrowRight className="size-3" /><span className="text-foreground">Vue d’ensemble</span>
      </div>

      <header className="home-hero">
        <div className="hero-copy">
          <p className="section-kicker mb-5">Documentation du projet · 2026</p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Du commit<br /><em>à la prod.</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            Le guide visuel de ci-cd-kube pour comprendre comment un changement devient une application fiable sur Kubernetes.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a className={buttonVariants()} href="#parcours">Découvrir le parcours <ArrowRight /></a>
            <a className={buttonVariants({ variant: "outline" })} href="#architecture">Voir l’architecture</a>
          </div>
        </div>
        <div className="hero-stamp" aria-label="Résumé du pipeline">
          <div className="stamp-ring"><Rocket className="size-9" /></div>
          <span className="stamp-label">CI / CD</span>
          <strong>READY<br />TO SHIP</strong>
          <span className="stamp-line">TEST · SECURE · DEPLOY</span>
        </div>
      </header>

      <div className="stat-ribbon" aria-label="Résumé du projet">
        <span><strong>04</strong> étapes clés</span><span><strong>01</strong> workflow principal</span><span><strong>∞</strong> feedback rapide</span>
      </div>

      <section id="parcours" className="mt-20 scroll-mt-24">
        <div className="mb-7">
          <p className="text-sm font-medium text-primary">Le parcours</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Du code à la production</h2>
          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">
            Une vue simple des étapes automatisées par GitHub Actions et de leur rôle dans la
            livraison.
          </p>
        </div>
        <div className="step-grid grid gap-4 sm:grid-cols-2">
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
    <div className="step-card rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between text-primary">
        <span className="step-icon"><Icon className="size-5" /></span>
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
