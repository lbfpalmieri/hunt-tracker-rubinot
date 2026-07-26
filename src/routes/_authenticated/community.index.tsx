import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BountyBadge } from "@/components/BountyBadge";
import {
  getCommunitySessions,
  getCommunityMonsters,
  getCommunityStats,
} from "@/lib/community.functions";
import { useAppStore } from "@/lib/store";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Globe2,
  Search,
  Skull,
  Users,
  Zap,
  Coins,
  LayoutList,
  Layers,
  Calculator,
  Target,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/community/")({
  head: () => ({
    meta: [
      { title: "Comunidade — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Veja hunts compartilhadas por outros jogadores do RubinOT: Raw XP/h, lucro/h, monstros e equipamentos por vocação.",
      },
      { property: "og:title", content: "Comunidade — hunts compartilhadas" },
      {
        property: "og:description",
        content: "Compare hunts por vocação, monstro e lucro com dados reais da comunidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunityPage,
});

const VOCATIONS = [
  "Elite Knight",
  "Royal Paladin",
  "Master Sorcerer",
  "Elder Druid",
  "Exalted Monk",
];

type Sort = "recent" | "xph" | "gph" | "killsh";

function CommunityPage() {
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const activeChar = characters.find((c) => c.id === activeId) ?? null;

  const [vocation, setVocation] = useState<string>("");
  const [huntQuery, setHuntQuery] = useState("");
  const [monster, setMonster] = useState("");
  const [monsterInput, setMonsterInput] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [view, setView] = useState<"hunts" | "sessions" | "calc">("hunts");
  const [quantity, setQuantity] = useState<number>(400);
  const [openHunt, setOpenHunt] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Pre-select the active character's vocation once.
  useEffect(() => {
    if (initialized) return;
    if (activeChar) {
      setVocation(activeChar.vocation);
      setInitialized(true);
    }
  }, [activeChar, initialized]);

  const fetchSessions = useServerFn(getCommunitySessions);
  const fetchMonsters = useServerFn(getCommunityMonsters);

  // Debounce da busca por hunt: evita uma requisição por tecla digitada.
  const [huntTerm, setHuntTerm] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setHuntTerm(huntQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [huntQuery]);

  const { data, isLoading } = useQuery({
    queryKey: ["community", vocation, huntTerm, monster],
    queryFn: () =>
      fetchSessions({
        data: {
          vocation: vocation || undefined,
          hunt: huntTerm || undefined,
          monster: monster.trim() || undefined,
        },
      }),
    // Mantém a lista anterior visível enquanto o novo filtro carrega.
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const { data: catalog } = useQuery({
    queryKey: ["community-monsters"],
    queryFn: () => fetchMonsters(),
    staleTime: 10 * 60 * 1000,
  });

  const fetchStats = useServerFn(getCommunityStats);
  const { data: stats } = useQuery({
    queryKey: ["community-stats"],
    queryFn: () => fetchStats(),
    staleTime: 5 * 60 * 1000,
  });




  const sessions = data?.sessions ?? [];

  /**
   * Raw XP attributable to the hunt: bounty completion bonus removed.
   * Returns null when the session is flagged as bounty without a known amount,
   * so it can be excluded from averages instead of inflating them.
   */
  type PublicSession = (typeof sessions)[number];
  const netRaw = (s: PublicSession): number | null => {
    const raw = s.rawXp || s.xpGain;
    if (!s.bounty) return raw;
    if (s.bounty.xp == null) return null;
    return Math.max(0, raw - s.bounty.xp);
  };

  const hunts = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        huntName: string;
        vocation: string;
        count: number;
        hours: number;
        xp: number;
        rawXp: number;
        rawHours: number;

        balance: number;
        kills: number;
      }
    >();
    for (const s of sessions) {
      const key = `${s.huntName.toLowerCase()}__${s.vocation}`;
      const cur =
        map.get(key) ??
        {
          key,
          huntName: s.huntName,
          vocation: s.vocation,
          count: 0,
          hours: 0,
          xp: 0,
          rawXp: 0,
          rawHours: 0,
          balance: 0,
          kills: 0,
        };
      cur.count += 1;
      cur.hours += s.durationSec / 3600;
      cur.xp += s.xpGain;
      const net = netRaw(s);
      if (net != null) {
        cur.rawXp += net;
        cur.rawHours += s.durationSec / 3600;
      }
      cur.balance += s.balance;
      cur.kills += s.kills.reduce((a, k) => a + k.count, 0);
      map.set(key, cur);
    }
    const list = [...map.values()].map((h) => ({
      ...h,
      xpPerHour: h.hours > 0 ? h.xp / h.hours : 0,
      rawXpPerHour: h.rawHours > 0 ? h.rawXp / h.rawHours : 0,
      goldPerHour: h.hours > 0 ? h.balance / h.hours : 0,
      killsPerHour: h.hours > 0 ? h.kills / h.hours : 0,
    }));
    list.sort((a, b) => {
      if (sort === "xph") return b.rawXpPerHour - a.rawXpPerHour;
      if (sort === "gph") return b.goldPerHour - a.goldPerHour;
      if (sort === "killsh") return b.killsPerHour - a.killsPerHour;
      return b.count - a.count;
    });
    return list;
  }, [sessions, sort]);


  const sortedSessions = useMemo(() => {
    const list = sessions.slice();
    const perHour = (v: number, sec: number) => (sec > 0 ? v / (sec / 3600) : 0);
    list.sort((a, b) => {
      if (sort === "xph")
        return perHour(netRaw(b) ?? 0, b.durationSec) - perHour(netRaw(a) ?? 0, a.durationSec);
      if (sort === "gph") return perHour(b.balance, b.durationSec) - perHour(a.balance, a.durationSec);
      if (sort === "killsh") {
        const k = (s: typeof a) => perHour(s.kills.reduce((x, y) => x + y.count, 0), s.durationSec);
        return k(b) - k(a);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  }, [sessions, sort]);

  /** Sessions of the hunt opened in the drill-down modal. */
  const openHuntData = useMemo(() => {
    if (!openHunt) return null;
    const meta = hunts.find((h) => h.key === openHunt);
    if (!meta) return null;
    const list = sessions
      .filter((s) => `${s.huntName.toLowerCase()}__${s.vocation}` === openHunt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { meta, list };
  }, [openHunt, hunts, sessions]);

  /** Community benchmark for the selected monster, grouped by hunt. */
  const calcRows = useMemo(() => {
    const needle = monster.trim().toLowerCase();
    if (!needle) return [];
    const map = new Map<
      string,
      {
        huntName: string;
        vocation: string;
        sessionCount: number;
        players: Set<string>;
        totalSec: number;
        totalKills: number;
        bestPerHour: number;
      }
    >();
    for (const s of sessions) {
      const kills = s.kills
        .filter((k) => k.name.toLowerCase() === needle)
        .reduce((a, k) => a + k.count, 0);
      if (kills <= 0 || s.durationSec <= 0) continue;
      const key = `${s.huntName.toLowerCase()}__${s.vocation}`;
      const cur =
        map.get(key) ??
        {
          huntName: s.huntName,
          vocation: s.vocation,
          sessionCount: 0,
          players: new Set<string>(),
          totalSec: 0,
          totalKills: 0,
          bestPerHour: 0,
        };
      cur.sessionCount += 1;
      cur.players.add(s.charName.toLowerCase());
      cur.totalSec += s.durationSec;
      cur.totalKills += kills;
      cur.bestPerHour = Math.max(cur.bestPerHour, kills / (s.durationSec / 3600));
      map.set(key, cur);
    }
    return [...map.values()]
      .map((h) => {
        const perHour = h.totalKills / (h.totalSec / 3600);
        return {
          key: `${h.huntName.toLowerCase()}__${h.vocation}`,
          huntName: h.huntName,
          vocation: h.vocation,
          sessionCount: h.sessionCount,
          playerCount: h.players.size,
          totalKills: h.totalKills,
          perHour,
          bestPerHour: h.bestPerHour,
          estSec: perHour > 0 ? (quantity / perHour) * 3600 : Infinity,
          bestSec: h.bestPerHour > 0 ? (quantity / h.bestPerHour) * 3600 : Infinity,
        };
      })
      .sort((a, b) => a.estSec - b.estSec);
  }, [sessions, monster, quantity]);



  return (
    <AppShell>
      {/* Hero */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-rubi-blue/30 p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_120%_at_10%_0%,var(--rubi-blue-soft),transparent),radial-gradient(ellipse_60%_120%_at_100%_100%,var(--rubi-gold-soft),transparent)]"
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rubi-gold/40 bg-rubi-gold-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-rubi-gold">
              <Globe2 className="h-3 w-3" /> Comunidade RubinOT
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Descubra as <span className="text-gradient-brand">melhores hunts</span> do servidor
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Dados reais compartilhados por jogadores: Raw XP/h, lucro/h e kills/h de cada spot.
              Filtre pela sua vocação e compare antes de escolher onde caçar.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:grid-cols-2">
            <HeroStat icon={Layers} label="Sessões" value={fmtNum(stats?.sessions ?? 0)} tone="blue" />
            <HeroStat icon={Users} label="Jogadores" value={fmtNum(stats?.players ?? 0)} tone="gold" />
            <HeroStat icon={Skull} label="Monstros" value={fmtNum(stats?.kills ?? 0)} tone="danger" />
            <HeroStat icon={Zap} label="Horas de hunt" value={fmtNum(stats?.hours ?? 0)} tone="success" />
          </dl>
        </div>
      </div>


      {/* Filters */}
      <div className="card-surface mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Vocação</span>
          <select
            value={vocation}
            onChange={(e) => setVocation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            <option value="">Todas as vocações</option>
            {VOCATIONS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Hunt / spot</span>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={huntQuery}
              onChange={(e) => setHuntQuery(e.target.value)}
              placeholder="Ex: Ingol"
              className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </label>

        <MonsterFilter
          value={monsterInput}
          onChange={setMonsterInput}
          onCommit={setMonster}
          options={catalog?.monsters ?? []}
        />

        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">Ordenar por</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
          >
            <option value="recent">Mais recentes</option>
            <option value="xph">Maior Raw XP/h</option>
            <option value="gph">Maior lucro/h</option>
            <option value="killsh">Mais kills/h</option>
          </select>
        </label>
      </div>

      {/* View toggle */}
      <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-1 text-sm">
        <button
          onClick={() => setView("hunts")}
          className={
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
            (view === "hunts" ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground")
          }
        >
          <Layers className="h-3.5 w-3.5" /> Por hunt
        </button>
        <button
          onClick={() => setView("sessions")}
          className={
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
            (view === "sessions" ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground")
          }
        >
          <LayoutList className="h-3.5 w-3.5" /> Sessões
        </button>
        <button
          onClick={() => setView("calc")}
          className={
            "inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-colors " +
            (view === "calc" ? "bg-rubi-blue-soft text-rubi-blue" : "text-muted-foreground")
          }
        >
          <Calculator className="h-3.5 w-3.5" /> Calculadora
        </button>
      </div>

      {view === "calc" && (
        <div className="card-surface mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <label className="block sm:w-56">
            <span className="text-xs font-medium text-muted-foreground">Quantidade da task</span>
            <div className="relative mt-1">
              <Target className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2 text-sm font-mono"
              />
            </div>
          </label>
          <p className="text-xs text-muted-foreground">
            Escolha o <strong className="text-foreground">monstro</strong> no filtro acima. A média é
            calculada com as sessões da comunidade (todas as horas somadas por hunt), então serve como
            referência do que dá para alcançar — não como garantia. Use o filtro de vocação para
            comparar só com quem joga igual a você.
          </p>
        </div>
      )}


      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
          <Users className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">Nada por aqui ainda</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {vocation
              ? `Nenhuma sessão compartilhada para ${vocation}${monster ? ` com ${monster}` : ""} ainda.`
              : "Nenhuma sessão compartilhada encontrada com esses filtros."}
          </p>
        </div>
      ) : view === "calc" ? (
        !monster.trim() ? (
          <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
            <Calculator className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Escolha um monstro</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Use o filtro <strong className="text-foreground">Monstro</strong> acima para ver quantos
              a comunidade mata por hora em cada hunt e quanto tempo levaria para fechar a task.
            </p>
          </div>
        ) : calcRows.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
            <Skull className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">Sem dados da comunidade para {monster}</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Ninguém compartilhou sessões com esse monstro{vocation ? ` como ${vocation}` : ""} ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="card-surface p-5">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Melhor hunt da comunidade para {quantity}x {monster}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-2xl font-bold">{calcRows[0].huntName}</span>
                <span className="rounded-full bg-rubi-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-blue">
                  {calcRows[0].vocation}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Média da comunidade:{" "}
                <strong className="font-mono text-rubi-gold">
                  {fmtNum(Math.round(calcRows[0].perHour))}
                </strong>{" "}
                {monster}/h · tempo estimado{" "}
                <strong className="font-mono text-rubi-blue">
                  {fmtDuration(Math.round(calcRows[0].estSec))}
                </strong>{" "}
                · no ritmo do melhor jogador:{" "}
                <strong className="font-mono text-rubi-success">
                  {fmtDuration(Math.round(calcRows[0].bestSec))}
                </strong>
              </p>
            </div>

            <div className="card-surface overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Hunt</th>
                    <th className="px-4 py-3 text-right">Sessões</th>
                    <th className="px-4 py-3 text-right">Jogadores</th>
                    <th className="px-4 py-3 text-right">Média /h</th>
                    <th className="px-4 py-3 text-right">Melhor /h</th>
                    <th className="px-4 py-3 text-right">Tempo p/ {fmtNum(quantity)}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {calcRows.map((r) => (
                    <tr key={r.key} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{r.huntName}</div>
                        <div className="text-xs text-muted-foreground">{r.vocation}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{r.sessionCount}</td>
                      <td className="px-4 py-3 text-right font-mono">{r.playerCount}</td>
                      <td className="px-4 py-3 text-right font-mono text-rubi-gold">
                        {fmtNum(Math.round(r.perHour))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rubi-success">
                        {fmtNum(Math.round(r.bestPerHour))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-rubi-blue">
                        {fmtDuration(Math.round(r.estSec))}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setOpenHunt(r.key)}
                          className="text-xs font-medium text-rubi-blue hover:underline"
                        >
                          Ver sessões
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : view === "hunts" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {hunts.map((h) => (
            <button
              key={h.key}
              type="button"
              onClick={() => setOpenHunt(h.key)}
              className="card-surface p-5 text-left transition-colors hover:border-rubi-blue/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold leading-tight">{h.huntName}</h2>
                <span className="flex-none rounded-full bg-rubi-blue-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rubi-blue">
                  {h.vocation}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {h.count} sessão(ões) · {fmtDuration(Math.round(h.hours * 3600))} registradas
              </p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Raw XP/h" value={fmtNum(Math.round(h.rawXpPerHour))} tone="blue" />
                <Metric label="Lucro/h" value={fmtGold(h.goldPerHour)} tone={h.goldPerHour >= 0 ? "success" : "danger"} />
                <Metric label="Kills/h" value={fmtNum(Math.round(h.killsPerHour))} tone="gold" />
              </dl>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-rubi-blue">
                Ver histórico de sessões <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      ) : (

        <div className="space-y-2">
          {sortedSessions.map((s) => {
            const kills = s.kills.reduce((a, k) => a + k.count, 0);
            return (
              <Link
                key={s.id}
                to="/community/$id"
                params={{ id: s.id }}
                className="card-surface flex flex-col gap-3 p-4 transition-colors hover:border-rubi-blue/50 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rubi-blue-soft font-display text-sm font-bold text-rubi-blue">
                    {s.charName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">{s.huntName}</span>
                      {s.bounty && <BountyBadge bounty={s.bounty} className="flex-none" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.charName} · {s.vocation} · {fmtDate(s.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-xs sm:w-[420px]">
                  <Metric label="Duração" value={fmtDuration(s.durationSec)} tone="muted" />
                  <Metric label="Raw XP" value={netRaw(s) == null ? "—" : fmtNum(netRaw(s) as number)} tone="blue" />
                  <Metric label="Balance" value={fmtGold(s.balance)} tone={s.balance >= 0 ? "success" : "danger"} />
                  <Metric label="Kills" value={fmtNum(kills)} tone="gold" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Dialog open={!!openHunt} onOpenChange={(o) => { if (!o) setOpenHunt(null); }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {openHuntData?.meta.huntName ?? "Hunt"}
            </DialogTitle>
            <DialogDescription>
              {openHuntData
                ? `${openHuntData.meta.vocation} · ${openHuntData.meta.count} sessão(ões) · média ${fmtNum(
                    Math.round(openHuntData.meta.killsPerHour),
                  )} kills/h`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {(openHuntData?.list ?? []).map((s) => {
              const kills = s.kills.reduce((a, k) => a + k.count, 0);
              return (
                <Link
                  key={s.id}
                  to="/community/$id"
                  params={{ id: s.id }}
                  onClick={() => setOpenHunt(null)}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-rubi-blue/50"
                >
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-rubi-blue-soft font-display text-xs font-bold text-rubi-blue">
                    {s.charName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{s.charName}</span>
                      {s.bounty && <BountyBadge bounty={s.bounty} className="flex-none" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {fmtDate(s.createdAt)} · {fmtDuration(s.durationSec)}
                    </div>
                  </div>
                  <div className="grid flex-none grid-cols-3 gap-3 text-center">
                    <Metric label="Raw XP" value={netRaw(s) == null ? "—" : fmtNum(netRaw(s) as number)} tone="blue" />
                    <Metric label="Balance" value={fmtGold(s.balance)} tone={s.balance >= 0 ? "success" : "danger"} />
                    <Metric label="Kills" value={fmtNum(kills)} tone="gold" />
                  </div>
                  <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>

  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "gold" | "success" | "danger" | "muted";
}) {
  const color =
    tone === "blue"
      ? "text-rubi-blue"
      : tone === "gold"
        ? "text-rubi-gold"
        : tone === "success"
          ? "text-rubi-success"
          : tone === "danger"
            ? "text-rubi-danger"
            : "text-foreground";
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={"font-mono text-sm font-semibold " + color}>{value}</dd>
    </div>
  );
}

function MonsterFilter({
  value,
  onChange,
  onCommit,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 8);
  }, [value, options]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (name: string) => {
    onChange(name);
    onCommit(name);
    setOpen(false);
  };

  return (
    <div className="relative block" ref={ref}>
      <span className="text-xs font-medium text-muted-foreground">Monstro</span>
      <div className="relative mt-1">
        <Skull className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setHighlight(0);
            if (!e.target.value.trim()) onCommit("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, matches.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (open && matches[highlight]) pick(matches[highlight]);
              else onCommit(value);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Ex: choking fear"
          className="w-full rounded-lg border border-border bg-input pl-9 pr-3 py-2 text-sm"
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="absolute left-0 top-full z-40 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-xl">
          {matches.map((m, i) => (
            <li key={m}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(m)}
                className={
                  "block w-full px-3 py-1.5 text-left text-sm " +
                  (i === highlight ? "bg-rubi-blue-soft text-rubi-blue" : "text-foreground")
                }
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
