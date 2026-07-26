import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getCommunityStats } from "@/lib/community.functions";
import { fmtNum } from "@/lib/format";
import logo from "@/assets/dragon-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import {
  Zap,
  Coins,
  ScrollText,
  ArrowRight,
  Users,
  Skull,
  Layers,
  Clock,
  Globe2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RubinOT Hunt Tracker — Monitore suas hunts" },
      {
        name: "description",
        content:
          "Ferramenta para acompanhar Raw XP/h, lucro/h, monstros e evolução dos seus personagens no RubinOT. Login com Google, dados salvos na nuvem.",
      },
      { property: "og:title", content: "RubinOT Hunt Tracker — Monitore suas hunts" },
      {
        property: "og:description",
        content: "Ferramenta para acompanhar Raw XP/h, lucro/h, monstros e evolução dos seus personagens no RubinOT. Login com Google, dados salvos na nuvem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  const fetchStats = useServerFn(getCommunityStats);
  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: () => fetchStats(),
    staleTime: 5 * 60 * 1000,
  });

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
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center">
            <img src={logo.url} alt="RubinOT Hunt Tracker" className="h-11 w-auto object-contain sm:h-12" />
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

      <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col items-center text-center">
          <img
            src={logo.url}
            alt="RubinOT Hunt Tracker"
            className="h-40 w-auto object-contain drop-shadow-[0_0_45px_var(--rubi-blue-soft)] sm:h-56"
          />
          <div className="mt-6 text-xs font-medium uppercase tracking-widest text-rubi-gold">
            É sobre RubinOT
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Suas hunts, <span className="text-gradient-brand">acompanhadas</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Cole os relatórios do RubinOT (Hunting Analyser, Input e Miscellaneous) e veja
            Raw XP/h, lucro/h e a evolução dos seus chars ao longo do tempo. Salvo na nuvem —
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

        {/* Community numbers */}
        <section className="relative mt-16 overflow-hidden rounded-2xl border border-rubi-blue/30 p-6 sm:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_120%_at_0%_0%,var(--rubi-blue-soft),transparent),radial-gradient(ellipse_60%_120%_at_100%_100%,var(--rubi-gold-soft),transparent)]"
          />
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/40 bg-rubi-gold-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-rubi-gold">
              <Globe2 className="h-3 w-3" /> A comunidade em números
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Hunts reais, compartilhadas por jogadores do RubinOT
            </h2>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Layers} label="Sessões salvas" value={fmtNum(stats?.sessions ?? 0)} tone="blue" />
            <Stat icon={Users} label="Personagens" value={fmtNum(stats?.players ?? 0)} tone="gold" />
            <Stat icon={Skull} label="Monstros mortos" value={fmtNum(stats?.kills ?? 0)} tone="danger" />
            <Stat icon={Clock} label="Horas de hunt" value={fmtNum(stats?.hours ?? 0)} tone="success" />
          </dl>

          <div className="mt-6 flex justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 bg-rubi-blue-soft px-4 py-2.5 text-sm font-semibold text-rubi-blue hover:opacity-90"
            >
              Ver hunts da comunidade <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature icon={Zap} title="Raw XP/h por sessão" text="Acompanhe o rendimento em cada spot." tone="blue" />
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

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  tone: "blue" | "gold" | "success" | "danger";
}) {
  const c =
    tone === "blue"
      ? "text-rubi-blue"
      : tone === "gold"
        ? "text-rubi-gold"
        : tone === "success"
          ? "text-rubi-success"
          : "text-rubi-danger";
  return (
    <div className="rounded-xl border border-border/70 bg-background/50 px-4 py-4 text-center backdrop-blur-sm">
      <dt className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className={"h-3.5 w-3.5 " + c} /> {label}
      </dt>
      <dd className={"mt-1 font-display text-2xl font-bold tabular-nums sm:text-3xl " + c}>{value}</dd>
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
