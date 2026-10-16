import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ClipboardCopy,
  ClipboardPaste,
  Clock,
  Globe2,
  Layers,
  Lock,
  Skull,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCommunitySessions, getCommunityStats } from "@/lib/community.functions";
import { safeRedirectPath } from "@/lib/auth-redirect";
import { fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import { navItemForPath } from "@/lib/nav-items";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import logo from "@/assets/dragon-logo.png.asset.json";
import { GameIcon } from "@/components/GameIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp, useInViewOnce } from "@/components/landing/CountUp";
import { HeroPreview } from "@/components/landing/HeroPreview";
import {
  DiamondDivider,
  GoogleButton,
  LandingBackdrop,
  LandingFooter,
  LandingHeader,
  SecondaryLink,
} from "@/components/landing/LandingParts";

const DESCRIPTION =
  "Cole o Hunting Analyser do RubinOT e veja Raw XP/h, lucro/h e monstros/h de cada hunt, a média de cada spot e a evolução dos seus personagens. Grátis, com login do Google.";

export const Route = createFileRoute("/")({
  // ?redirect=/pagina: quem abriu uma página do app sem conta cai aqui e volta pra ela depois do login.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = safeRedirectPath(search.redirect);
    return redirect ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "RubinOT Hunt Tracker — quanto sua hunt rende de verdade" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "RubinOT Hunt Tracker — quanto sua hunt rende de verdade" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [checking, setChecking] = useState(true);
  const google = useGoogleSignIn();
  const signIn = () => void google.signIn(redirect ?? null);

  // Quem já tem sessão vai direto pro app (pra página pedida, se veio de uma).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) navigate({ href: redirect ?? "/dashboard", replace: true });
      else setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [navigate, redirect]);

  if (checking) return <div className="min-h-screen bg-background" />;

  const wanted = redirect ? navItemForPath(redirect.split(/[?#]/)[0]) : undefined;

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <LandingBackdrop />
      <LandingHeader
        action={
          <GoogleButton onClick={signIn} loading={google.loading} size="sm">
            <span className="hidden sm:inline">Entrar com Google</span>
            <span className="sm:hidden">Entrar</span>
          </GoogleButton>
        }
      />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-12 lg:pb-24 lg:pt-20">
          <div className="text-center lg:text-left">
            {redirect && (
              <div
                role="status"
                className="mx-auto mb-5 flex max-w-md items-center gap-2.5 rounded-xl border border-rubi-blue/40 bg-rubi-blue-soft px-3.5 py-2.5 text-left text-sm lg:mx-0"
              >
                <Lock className="h-4 w-4 flex-none text-rubi-blue" />
                <span>
                  Entre com o Google para abrir{" "}
                  <b className="text-foreground">{wanted?.label ?? "essa página"}</b>. Depois do
                  login você volta direto pra ela.
                </span>
              </div>
            )}

            <span className="inline-flex items-center gap-2 rounded-full border border-rubi-gold/40 bg-rubi-gold-soft py-1 pl-1.5 pr-3 text-xs font-semibold text-rubi-gold">
              <GameIcon name="Crystal Ball" size={22} />
              Para quem caça no RubinOT
            </span>

            <h1 className="mt-5 bg-gradient-to-br from-foreground via-foreground to-rubi-gold bg-clip-text font-brand text-4xl font-bold leading-[1.1] text-transparent sm:text-5xl xl:text-[3.5rem]">
              Cole o analyser. Veja quanto sua hunt rende de verdade.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              Raw XP/h, lucro/h e monstros/h de cada sessão, a média de cada hunt e a evolução dos
              seus personagens. Tudo salvo na nuvem, no PC e no celular.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <GoogleButton onClick={signIn} loading={google.loading} size="lg" className="w-full sm:w-auto">
                Entrar com Google
              </GoogleButton>
              <SecondaryLink to="/community" size="lg" className="w-full sm:w-auto">
                <Globe2 className="h-5 w-5" /> Ver hunts da comunidade
              </SecondaryLink>
            </div>
            {google.error && (
              <p role="alert" className="mt-3 text-sm text-rubi-danger">
                Não deu pra abrir o login do Google: {google.error}
              </p>
            )}
            <p className="mt-4 text-sm text-muted-foreground">
              É grátis. Sem conta você já pesquisa a Comunidade e compara hunts.
            </p>
          </div>

          <HeroPreview />
        </section>

        <CommunityNumbers />

        <HowItWorks />

        <Features />

        <RecentHunts />

        <FinalCall onSignIn={signIn} loading={google.loading} />
      </main>

      <LandingFooter />
    </div>
  );
}

/* ---------- A comunidade em números (dados reais, contam ao aparecer) ---------- */

function CommunityNumbers() {
  const fetchStats = useServerFn(getCommunityStats);
  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: () => fetchStats(),
    staleTime: 30 * 60 * 1000,
  });
  const [ref, seen] = useInViewOnce<HTMLElement>();
  const run = seen && !!stats;

  const items: { icon: LucideIcon; label: string; value: number; tone: string }[] = [
    { icon: Layers, label: "sessões públicas", value: stats?.sessions ?? 0, tone: "var(--rubi-blue)" },
    { icon: Users, label: "personagens", value: stats?.players ?? 0, tone: "var(--rubi-gold)" },
    { icon: Skull, label: "monstros mortos", value: stats?.kills ?? 0, tone: "var(--rubi-danger)" },
    { icon: Clock, label: "horas de hunt", value: stats?.hours ?? 0, tone: "var(--rubi-success)" },
  ];

  return (
    <section ref={ref} aria-labelledby="numeros" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="panel-gilded relative overflow-hidden p-6 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_0%_0%,var(--rubi-blue-soft),transparent),radial-gradient(ellipse_50%_100%_at_100%_100%,var(--rubi-gold-soft),transparent)]"
        />
        <div className="relative">
          <h2 id="numeros" className="text-center font-brand text-2xl font-bold sm:text-3xl">
            Hunts reais, de jogadores do RubinOT
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            Contando só as sessões públicas salvas no app até agora.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map(({ icon: Icon, label, value, tone }) => (
              <div
                key={label}
                className="rounded-2xl border border-border/70 bg-background/55 px-3 py-5 text-center"
                style={{ "--tone": tone } as CSSProperties}
              >
                <dd className="font-display text-3xl font-bold tabular-nums text-[color:var(--tone)] sm:text-4xl">
                  {stats ? <CountUp value={value} run={run} format={fmtNum} /> : <Skeleton className="mx-auto h-9 w-24" />}
                </dd>
                <dt className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:text-sm">
                  <Icon className="h-4 w-4 text-[color:var(--tone)]" /> {label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/* ---------- Como funciona (sequência real: jogar → copiar → colar) ---------- */

function HowItWorks() {
  const steps: { icon: LucideIcon; title: string; text: ReactNode }[] = [
    {
      icon: Swords,
      title: "Cace normalmente",
      text: "O Hunting Analyser do cliente do RubinOT vai somando XP, loot e criaturas enquanto você joga.",
    },
    {
      icon: ClipboardCopy,
      title: "Copie o relatório",
      text: (
        <>
          No fim, clique em <b className="text-foreground">Copy to Clipboard</b> no Hunting Analyser
          (e, se quiser, no Input e no Miscellaneous).
        </>
      ),
    },
    {
      icon: ClipboardPaste,
      title: "Cole no app",
      text: (
        <>
          Em <b className="text-foreground">Nova sessão</b>, cole, dê nome à hunt e salve. Os
          números por hora aparecem na hora.
        </>
      ),
    },
  ];
  return (
    <section aria-labelledby="como" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28">
      <h2 id="como" className="text-center font-brand text-2xl font-bold sm:text-3xl">
        Três passos depois da hunt
      </h2>
      <DiamondDivider className="mx-auto mt-4 max-w-xs" />
      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className="card-surface relative p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-rubi-gold/50 bg-rubi-gold-soft font-display text-lg font-bold text-rubi-gold">
                {i + 1}
              </span>
              <Icon className="h-5 w-5 text-rubi-blue" aria-hidden />
            </div>
            <h3 className="mt-4 text-lg font-bold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ---------- Recursos (só o que o app faz hoje) ---------- */

interface Feature {
  sprite: string;
  title: string;
  text: string;
  tone: string;
  wide?: boolean;
}

const FEATURES: Feature[] = [
  {
    sprite: "Red Tome",
    title: "Cada hunt vira uma sessão",
    text: "Raw XP/h, lucro/h, monstros/h, dano e cura, com Prey, Bounty Task e o setup que você usou. Errou o tempo? Corrija e o app refaz as contas.",
    tone: "var(--rubi-blue)",
    wide: true,
  },
  {
    sprite: "Treasure Map",
    title: "Comparar hunts",
    text: "Até 4 hunts lado a lado, pela média das sessões ou sessão por sessão. Funciona sem conta.",
    tone: "var(--cat-yellow)",
  },
  {
    sprite: "Scroll of Heroic Deeds",
    title: "Linked Tasks",
    text: "Progresso por sala e um conselho para cada task: elemento mais eficaz, set sugerido e o que levar na BP.",
    tone: "var(--cat-orange)",
  },
  {
    sprite: "Dragon Figurine",
    title: "Rotação de Bosses",
    text: "Monte rotações, registre cada execução e veja o lucro só dos itens que caem do boss.",
    tone: "var(--rubi-danger)",
  },
  {
    sprite: "Platinum Coin",
    title: "Modo Grupo",
    text: "Cole o Party Hunt Analyser e veja a divisão do loot do mesmo jeito do LootSplitter do cliente.",
    tone: "var(--cat-violet)",
  },
  {
    sprite: "Blank Imbuement Scroll",
    title: "Imbuements",
    text: "Contador das 20 horas de cada imbuement, com aviso quando estiver acabando.",
    tone: "var(--cat-cyan)",
  },
  {
    sprite: "Wheel of Destiny Icon",
    title: "Sets e Wheel of Destiny",
    text: "Monte o set no boneco do inventário, com tier da Exaltation Forge, e planeje a sua roda.",
    tone: "var(--cat-fuchsia)",
  },
  {
    sprite: "Golden Goblet",
    title: "Rendimento",
    text: "Level, metas e a evolução de cada personagem ao longo do tempo, todos os chars num lugar só.",
    tone: "var(--rubi-gold)",
  },
];

function Features() {
  return (
    <section aria-labelledby="recursos" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28">
      <h2 id="recursos" className="text-center font-brand text-2xl font-bold sm:text-3xl">
        Tudo que você anotava no papel, num lugar só
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
        Feito em cima das janelas do próprio jogo: Hunting Analyser, Party Hunt, Task Board e Wheel
        of Destiny.
      </p>
      <DiamondDivider className="mx-auto mt-4 max-w-xs" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {FEATURES.map((f) => (
          <li
            key={f.title}
            style={{ "--tone": f.tone } as CSSProperties}
            className={
              "group relative overflow-hidden rounded-2xl border border-border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--tone)_14%,var(--surface-elevated)),var(--surface)_60%)] p-5 shadow-card transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-[color:color-mix(in_oklab,var(--tone)_55%,transparent)] hover:shadow-[0_18px_50px_-20px_color-mix(in_oklab,var(--tone)_60%,transparent)] " +
              (f.wide ? "sm:col-span-2 lg:col-span-4" : "lg:col-span-2")
            }
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--tone)] to-transparent opacity-70"
            />
            <div className={f.wide ? "flex flex-col gap-5 md:flex-row md:items-center" : ""}>
              <div className="flex-1">
                <div className="grid h-14 w-14 place-items-center rounded-xl border border-[color:color-mix(in_oklab,var(--tone)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--tone)_14%,transparent)] transition-transform duration-300 ease-out group-hover:scale-110">
                  <GameIcon name={f.sprite} size={40} fallback={<Swords className="h-6 w-6 text-[color:var(--tone)]" />} />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
              {f.wide && <SessionMini />}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Miniatura do que aparece na lista de sessões (os campos reais de uma sessão). */
function SessionMini() {
  const rows = [
    { label: "Raw XP/h", tone: "text-rubi-blue", bar: "from-rubi-blue to-cat-cyan", w: 0.92 },
    { label: "Lucro/h", tone: "text-rubi-gold", bar: "from-rubi-gold to-cat-orange", w: 0.7 },
    { label: "Monstros/h", tone: "text-rubi-success", bar: "from-rubi-success to-cat-cyan", w: 0.58 },
  ];
  return (
    <div aria-hidden className="w-full rounded-xl border border-border/70 bg-background/60 p-4 md:max-w-xs">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Prey, Bounty e setup junto da sessão
      </div>
      <div className="mt-3 space-y-2.5">
        {rows.map((r) => (
          <div key={r.label}>
            <div className={"text-2xs font-semibold " + r.tone}>{r.label}</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={"h-full origin-left rounded-full bg-gradient-to-r " + r.bar}
                style={{ transform: `scaleX(${r.w})` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Hunts recentes da Comunidade (dados reais, sem nome de jogador) ---------- */

function RecentHunts() {
  const fetchSessions = useServerFn(getCommunitySessions);
  const { data, isLoading } = useQuery({
    queryKey: ["landing-recent-hunts"],
    queryFn: () => fetchSessions({ data: { limit: 6 } }),
    staleTime: 5 * 60 * 1000,
  });
  const sessions = data?.sessions ?? [];
  if (!isLoading && sessions.length === 0) return null;

  return (
    <section aria-labelledby="recentes" className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:pt-28">
      <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <h2 id="recentes" className="font-brand text-2xl font-bold sm:text-3xl">
            Acabaram de caçar
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sessões públicas mais recentes da Comunidade. Toque pra ver os detalhes.
          </p>
        </div>
        <SecondaryLink to="/community" size="md">
          Ver todas <ArrowRight className="h-4 w-4" />
        </SecondaryLink>
      </div>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => (
              <li key={i}>
                <Skeleton role="status" aria-label="Carregando hunts" className="h-[132px] rounded-2xl" />
              </li>
            ))
          : sessions.map((s) => {
              const hours = s.durationSec > 0 ? s.durationSec / 3600 : 0;
              const xpH = hours > 0 && s.rawXp > 0 ? s.rawXp / hours : null;
              const goldH = hours > 0 ? s.balance / hours : null;
              const top = [...s.kills].sort((a, b) => b.count - a.count)[0];
              return (
                <li key={s.id}>
                  <Link
                    to="/community/$id"
                    params={{ id: s.id }}
                    className="card-surface group flex h-[132px] flex-col justify-between p-4 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-rubi-blue/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 flex-none place-items-center rounded-lg border border-border bg-background/60">
                        {top ? (
                          <GameIcon name={top.name} size={40} fallback={<Skull className="h-5 w-5 text-muted-foreground" />} />
                        ) : (
                          <Skull className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-display font-bold group-hover:text-rubi-blue">
                          {s.huntName || "Hunt sem nome"}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {s.vocation}
                          {s.level ? ` · level ${s.level}` : ""}
                          {s.party ? ` · grupo de ${s.party.size}` : ""} · {fmtDuration(s.durationSec)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-rubi-blue-soft px-2.5 py-1.5">
                        <div className="text-2xs text-rubi-blue">Raw XP/h</div>
                        <div className="font-display font-bold tabular-nums">{xpH == null ? "—" : fmtNum(xpH)}</div>
                      </div>
                      <div className="rounded-lg bg-rubi-gold-soft px-2.5 py-1.5">
                        <div className="text-2xs text-rubi-gold">Lucro/h</div>
                        <div
                          className={
                            "font-display font-bold tabular-nums " +
                            (goldH != null && goldH < 0 ? "text-rubi-danger" : "")
                          }
                        >
                          {goldH == null ? "—" : fmtGold(goldH)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
      </ul>
    </section>
  );
}

/* ---------- Chamada final ---------- */

function FinalCall({ onSignIn, loading }: { onSignIn: () => void; loading: boolean }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="game-window relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_80%_at_50%_0%,color-mix(in_oklab,var(--rubi-blue)_28%,transparent),transparent),radial-gradient(ellipse_40%_60%_at_50%_110%,color-mix(in_oklab,var(--rubi-gold)_22%,transparent),transparent)]"
        />
        <div className="relative">
          <img
            src={logo.url}
            alt=""
            width={128}
            height={128}
            loading="lazy"
            decoding="async"
            className="mx-auto h-24 w-24 animate-float-pop object-contain drop-shadow-[0_0_30px_var(--rubi-blue-soft)] sm:h-32 sm:w-32"
          />
          <h2 className="mx-auto mt-6 max-w-2xl font-brand text-3xl font-bold leading-tight sm:text-4xl">
            Sua próxima hunt já pode virar número
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Entre com o Google em um clique. É grátis, e suas sessões ficam salvas pra você ver no
            PC ou no celular.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <GoogleButton onClick={onSignIn} loading={loading} size="lg" className="w-full sm:w-auto">
              Entrar com Google
            </GoogleButton>
            <SecondaryLink to="/tools/compare" size="lg" className="w-full sm:w-auto">
              Comparar hunts sem conta
            </SecondaryLink>
          </div>
        </div>
      </div>
    </section>
  );
}
