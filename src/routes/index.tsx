import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/rubinot-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { Zap, Coins, ScrollText, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RubinOT Hunt Tracker — Monitore suas hunts" },
      {
        name: "description",
        content:
          "Ferramenta para acompanhar XP/h, lucro/h, monstros e evolução dos seus personagens no RubinOT. Login com Google, dados salvos na nuvem.",
      },
      { property: "og:title", content: "RubinOT Hunt Tracker — Monitore suas hunts" },
      {
        property: "og:description",
        content: "Ferramenta para acompanhar XP/h, lucro/h, monstros e evolução dos seus personagens no RubinOT. Login com Google, dados salvos na nuvem.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Signed-in visitors go straight to their dashboard.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        navigate({ to: "/dashboard", replace: true });
      } else {
        setChecking(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (checking) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="RubinOT" className="h-9 w-auto" />
            <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
              Hunt Tracker
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/about"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Sobre
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            É sobre RubinOT
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Suas hunts, <span className="text-gradient-brand">acompanhadas</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cole os relatórios do RubinOT (Hunting Analyser, Damage e Miscellaneous) e veja
            XP/h, lucro/h e a evolução dos seus chars ao longo do tempo. Salvo na nuvem —
            acesse de qualquer lugar.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-rubi-gold px-5 py-3 text-sm font-semibold text-background shadow-glow-gold hover:opacity-90"
            >
              Entrar com Google <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature icon={Zap} title="XP/h por sessão" text="Acompanhe o rendimento em cada spot." tone="blue" />
          <Feature icon={Coins} title="Lucro/h real" text="Balance direto do relatório, sem cálculo manual." tone="gold" />
          <Feature icon={ScrollText} title="Histórico completo" text="Todas as hunts organizadas por personagem." tone="muted" />
        </div>

        <div className="mt-16 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          <img src={avatar.url} alt="Canal" className="h-8 w-8 rounded-full ring-2 ring-rubi-gold/40" />
          Feito pelo canal <b className="text-foreground">@Ésobrerubinot</b>
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  tone,
}: {
  icon: typeof Zap;
  title: string;
  text: string;
  tone: "blue" | "gold" | "muted";
}) {
  const c =
    tone === "blue"
      ? "text-rubi-blue"
      : tone === "gold"
        ? "text-rubi-gold"
        : "text-muted-foreground";
  return (
    <div className="card-surface p-5">
      <Icon className={"h-5 w-5 " + c} />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
