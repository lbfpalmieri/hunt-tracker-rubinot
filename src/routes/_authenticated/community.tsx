import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getCommunitySessions, getCommunityMonsters } from "@/lib/community.functions";
import { useAppStore } from "@/lib/store";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import { Globe2, Search, Skull, Users, Zap, Coins, LayoutList, Layers } from "lucide-react";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Comunidade — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Veja hunts compartilhadas por outros jogadores do RubinOT: XP/h, lucro/h, monstros e equipamentos por vocação.",
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
  "Knight",
  "Elite Knight",
  "Paladin",
  "Royal Paladin",
  "Sorcerer",
  "Master Sorcerer",
  "Druid",
  "Elder Druid",
  "Monk",
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
  const [view, setView] = useState<"hunts" | "sessions">("hunts");
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

  const { data, isLoading } = useQuery({
    queryKey: ["community", vocation, huntQuery, monster],
    queryFn: () =>
      fetchSessions({
        data: {
          vocation: vocation || undefined,
          hunt: huntQuery.trim() || undefined,
          monster: monster.trim() || undefined,
        },
      }),
  });

  const { data: catalog } = useQuery({
    queryKey: ["community-monsters"],
    queryFn: () => fetchMonsters(),
    staleTime: 5 * 60 * 1000,
  });

  const sessions = data?.sessions ?? [];

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
          balance: 0,
          kills: 0,
        };
      cur.count += 1;
      cur.hours += s.durationSec / 3600;
      cur.xp += s.xpGain;
      cur.balance += s.balance;
      cur.kills += s.kills.reduce((a, k) => a + k.count, 0);
      map.set(key, cur);
    }
    const list = [...map.values()].map((h) => ({
      ...h,
      xpPerHour: h.hours > 0 ? h.xp / h.hours : 0,
      goldPerHour: h.hours > 0 ? h.balance / h.hours : 0,
      killsPerHour: h.hours > 0 ? h.kills / h.hours : 0,
    }));
    list.sort((a, b) => {
      if (sort === "xph") return b.xpPerHour - a.xpPerHour;
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
      if (sort === "xph") return perHour(b.xpGain, b.durationSec) - perHour(a.xpGain, a.durationSec);
      if (sort === "gph") return perHour(b.balance, b.durationSec) - perHour(a.balance, a.durationSec);
      if (sort === "killsh") {
        const k = (s: typeof a) => perHour(s.kills.reduce((x, y) => x + y.count, 0), s.durationSec);
        return k(b) - k(a);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  }, [sessions, sort]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Comunidade</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Globe2 className="h-7 w-7 text-rubi-blue" /> Hunts da comunidade
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as sessões compartilhadas pelos jogadores. Filtre por vocação, hunt ou monstro para
          descobrir novos spots.
        </p>
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
            <option value="xph">Maior XP/h</option>
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
      </div>

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
      ) : view === "hunts" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {hunts.map((h) => (
            <div key={h.key} className="card-surface p-5">
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
                <Metric label="XP/h" value={fmtNum(Math.round(h.xpPerHour))} tone="blue" />
                <Metric label="Lucro/h" value={fmtGold(h.goldPerHour)} tone={h.goldPerHour >= 0 ? "success" : "danger"} />
                <Metric label="Kills/h" value={fmtNum(Math.round(h.killsPerHour))} tone="gold" />
              </dl>
            </div>
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
                    <div className="truncate font-semibold">{s.huntName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.charName} · {s.vocation} · {fmtDate(s.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center text-xs sm:w-[420px]">
                  <Metric label="Duração" value={fmtDuration(s.durationSec)} tone="muted" />
                  <Metric label="XP ganha" value={fmtNum(s.xpGain)} tone="blue" />
                  <Metric label="Balance" value={fmtGold(s.balance)} tone={s.balance >= 0 ? "success" : "danger"} />
                  <Metric label="Kills" value={fmtNum(kills)} tone="gold" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
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
