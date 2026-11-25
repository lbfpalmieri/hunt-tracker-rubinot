import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, Lock, Search, ShieldAlert, Sparkles, UserCircle2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Segmented } from "@/components/advisor/advisor-ui";
import { CreatureIcon } from "@/components/calculator/LinkedTaskPicker";
import { CharacterSheetDialog } from "@/components/character/CharacterSheetDialog";
import { EMPTY_SHEET, useCharacterSheets } from "@/lib/character-sheet";
import {
  adviseCreature,
  charmCostToLevel,
  charmCurrency,
  charmRule,
  huntKills,
  planHuntCharms,
  type CharmContext,
  type CharmOption,
  type CreatureCharmAdvice,
} from "@/lib/charm-optimizer";
import { fmtNum } from "@/lib/format";
import { listHunts } from "@/lib/hunt-speed";
import { currentLevel } from "@/lib/level";
import { allMonsters, displayName, type MonsterInfo } from "@/lib/monsters";
import { charmIcon, setupVocation } from "@/lib/session-setup";
import { useAppStore, useHydrated } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/tools/charms")({
  head: () => ({
    meta: [
      { title: "Otimizador de charms — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Escolha uma criatura ou uma hunt e veja quais charms do seu personagem rendem mais, com o porquê de cada um.",
      },
      { property: "og:title", content: "Otimizador de charms" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CharmsPage,
});

type Mode = "creature" | "hunt";

/** Criaturas que aceitam charm: com Bestiário (charm points na wiki), sem boss. Uma por nome. */
function charmableMonsters(): MonsterInfo[] {
  const seen = new Set<string>();
  return allMonsters().filter((m) => {
    if (m.boss || m.charmPoints == null || m.hp <= 0) return false;
    const k = displayName(m.name).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Dano médio: com 1 casa quando é pequeno ("6,5"), inteiro quando é grande. */
const fmtAvg = (n: number) => (n < 10 ? n.toFixed(1).replace(".", ",") : fmtNum(n));

function CharmsPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const sheets = useCharacterSheets();

  const [pickedCharId, setPickedCharId] = useState<string | null>(null);
  const character =
    characters.find((c) => c.id === (pickedCharId ?? activeId)) ?? characters[0] ?? null;
  const [mode, setMode] = useState<Mode>("creature");
  const [query, setQuery] = useState("");
  const [creature, setCreature] = useState<MonsterInfo | null>(null);
  const [huntName, setHuntName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const monsters = useMemo(() => charmableMonsters(), []);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const starts: MonsterInfo[] = [];
    const contains: MonsterInfo[] = [];
    for (const m of monsters) {
      const n = displayName(m.name).toLowerCase();
      if (n.startsWith(q)) starts.push(m);
      else if (n.includes(q)) contains.push(m);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [monsters, query]);

  const charSessions = useMemo(
    () => (character ? sessions.filter((s) => s.characterId === character.id) : []),
    [sessions, character],
  );
  const hunts = useMemo(() => listHunts(charSessions), [charSessions]);

  const sheet = (character && sheets.data?.[character.id]) || EMPTY_SHEET;
  const ctx: CharmContext | null = character
    ? {
        vocation: setupVocation(character.vocation),
        level: currentLevel(levelSnapshots, character.id),
        owned: sheet.charms,
        talismanLoot: sheet.talisman.loot,
      }
    : null;
  const ownedMajor = Object.keys(sheet.charms).filter((n) => charmRule(n)?.kind === "major").length;
  const ownedMinor = Object.keys(sheet.charms).filter((n) => charmRule(n)?.kind === "minor").length;

  if (!hydrated) {
    return (
      <AppShell>
        <PageSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          Ferramentas
        </div>
        <h1 className="mt-1 flex items-center gap-2 font-brand text-3xl font-bold">
          <Sparkles className="h-7 w-7 text-rubi-gold" /> Otimizador de charms
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Escolha uma criatura ou uma hunt sua e veja quais charms do personagem rendem mais, com o
          porquê de cada um. Regras e números da TibiaWiki BR.
        </p>
      </div>

      {!character || !ctx ? (
        <EmptyState
          icon={UserCircle2}
          title="Cadastre um personagem"
          description="O otimizador usa a vocação, o level e os charms do personagem."
          ctaLabel="Ir para Personagens"
          ctaTo="/characters"
        />
      ) : (
        <div className="space-y-4">
          <div className="card-surface space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:items-end">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Personagem</span>
                <select
                  value={character.id}
                  onChange={(e) => setPickedCharId(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs text-muted-foreground">
                  {character.vocation}
                  {ctx.level ? ` · level ${fmtNum(ctx.level)}` : " · sem level registrado"} ·{" "}
                  <span className="font-semibold text-foreground">
                    {ownedMajor} charm{ownedMajor === 1 ? "" : "s"} e {ownedMinor} minor
                  </span>{" "}
                  na ficha
                </p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="min-h-11 rounded-lg border border-rubi-gold/50 px-3 text-xs font-semibold text-rubi-gold transition-transform hover:bg-rubi-gold/10 active:scale-[0.98]"
                >
                  Editar charms do personagem
                </button>
              </div>
            </div>

            {ownedMajor + ownedMinor === 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 p-2.5 text-xs text-foreground">
                <AlertTriangle className="h-4 w-4 flex-none text-rubi-gold" />
                Marque na ficha os charms que você tem. Enquanto isso, mostramos todos no nível 1.
              </p>
            )}

            <Segmented<Mode>
              value={mode}
              onChange={setMode}
              options={[
                { value: "creature", label: "Uma criatura" },
                { value: "hunt", label: "Uma hunt minha" },
              ]}
            />

            {mode === "creature" ? (
              <CreaturePicker
                query={query}
                setQuery={setQuery}
                suggestions={suggestions}
                selected={creature}
                onPick={(m) => {
                  setCreature(m);
                  setQuery("");
                }}
                onClear={() => setCreature(null)}
              />
            ) : hunts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {character.name} ainda não tem sessão salva. Salve uma hunt pra escolher por ela.
              </p>
            ) : (
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Hunt</span>
                <select
                  value={huntName}
                  onChange={(e) => setHuntName(e.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Escolha uma hunt</option>
                  {hunts.map((h) => (
                    <option key={h.huntName} value={h.huntName}>
                      {h.huntName} ({h.sessionCount} sessão{h.sessionCount === 1 ? "" : "ões"})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {mode === "creature" && creature && (
            <CreatureResult advice={adviseCreature(creature, ctx)} />
          )}
          {mode === "hunt" && huntName && (
            <HuntResult kills={huntKills(charSessions, huntName)} ctx={ctx} />
          )}
        </div>
      )}

      {character && sheetOpen && (
        <CharacterSheetDialog
          characterId={character.id}
          characterName={character.name}
          open
          onOpenChange={(o) => !o && setSheetOpen(false)}
        />
      )}
    </AppShell>
  );
}

function CreaturePicker({
  query,
  setQuery,
  suggestions,
  selected,
  onPick,
  onClear,
}: {
  query: string;
  setQuery: (q: string) => void;
  suggestions: MonsterInfo[];
  selected: MonsterInfo | null;
  onPick: (m: MonsterInfo) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">Criatura</span>
        <span className="relative mt-1 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selected ? `Trocar ${displayName(selected.name)}...` : "Digite o nome (ex.: Hydra)"
            }
            className="min-h-11 w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </span>
      </label>
      {suggestions.length > 0 && (
        <ul className="grid gap-1.5 sm:grid-cols-2" aria-label="Criaturas encontradas">
          {suggestions.map((m) => (
            <li key={m.name}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-border/60 bg-background/30 px-2.5 py-1.5 text-left text-sm transition-colors hover:border-rubi-blue/50"
              >
                <CreatureIcon name={displayName(m.name)} size={24} />
                <span className="min-w-0 flex-1 truncate">{displayName(m.name)}</span>
                <span className="font-display text-xs tabular-nums text-muted-foreground">
                  {fmtNum(m.hp)} HP
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhuma criatura com Bestiário tem esse nome (boss não aceita charm).
        </p>
      )}
      {selected && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Mostrando:{" "}
          <span className="font-semibold text-foreground">{displayName(selected.name)}</span>
          <button
            type="button"
            onClick={onClear}
            aria-label="Limpar criatura"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function LevelTag({ o }: { o: CharmOption }) {
  return o.owned ? (
    <span className="rounded bg-rubi-gold/15 px-1.5 py-0.5 text-2xs font-semibold text-rubi-gold">
      Nv{o.owned}
    </span>
  ) : (
    <span className="rounded bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">
      Nv{o.level} · não tem
    </span>
  );
}

function OptionRow({ o, cost }: { o: CharmOption; cost?: boolean }) {
  const rule = charmRule(o.charm);
  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background/30 p-2.5">
      <img src={charmIcon(o.charm)} alt="" className="h-7 w-7 flex-none" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold">{o.charm}</span>
          <LevelTag o={o} />
          {o.avgDamage != null && o.avgDamage > 0 && (
            <span className="ml-auto font-display text-sm tabular-nums text-rubi-gold">
              ~{fmtAvg(o.avgDamage)}{" "}
              <span className="text-2xs text-muted-foreground">de dano por ataque</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{o.why}</p>
        {cost && rule && (
          <p className="mt-0.5 text-2xs text-muted-foreground">
            Custa {fmtNum(charmCostToLevel(rule, o.level))} {charmCurrency(rule.kind)} até o Nv
            {o.level}.
          </p>
        )}
      </div>
    </li>
  );
}

function Group({ title, hint, items }: { title: string; hint?: string; items: CharmOption[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-rubi-gold">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <ul className="mt-2 space-y-1.5">
        {items.map((o) => (
          <OptionRow key={o.charm} o={o} />
        ))}
      </ul>
    </section>
  );
}

function CreatureResult({ advice }: { advice: CreatureCharmAdvice }) {
  const m = advice.monster;
  return (
    <div className="card-surface space-y-5 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <CreatureIcon name={displayName(m.name)} size={40} />
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold">{displayName(m.name)}</h2>
          <p className="text-xs text-muted-foreground">
            <span className="font-display tabular-nums">{fmtNum(m.hp)}</span> de vida
            {advice.maxHit != null && (
              <>
                {" "}
                · bate até{" "}
                <span className="font-display tabular-nums">{fmtNum(advice.maxHit)}</span>
              </>
            )}
            {m.charmPoints != null && ` · ${m.charmPoints} charm points no Bestiário`}
          </p>
        </div>
        {advice.dangerous && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rubi-danger/15 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-rubi-danger">
            <ShieldAlert className="h-3 w-3" /> bate forte
          </span>
        )}
      </div>

      {(advice.bestMajor || advice.bestMinor) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {advice.bestMajor && <Best label="Melhor charm" o={advice.bestMajor} />}
          {advice.bestMinor && <Best label="Melhor minor" o={advice.bestMinor} />}
        </div>
      )}

      <Group
        title="Dano"
        hint="Dano extra médio por ataque, já com a chance do nível e a resistência dela."
        items={advice.damage}
      />
      <Group title="Defesa" items={advice.defense} />
      <Group title="Depende do seu set" items={advice.build} />
      <Group title="Minor charms" items={advice.minor} />

      {advice.unlock.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rubi-gold">
            <Lock className="h-3.5 w-3.5" /> Vale desbloquear
          </h3>
          <p className="text-xs text-muted-foreground">
            Você não tem, e renderia mais que o seu melhor aqui.
          </p>
          <ul className="mt-2 space-y-1.5">
            {advice.unlock.map((o) => (
              <OptionRow key={o.charm} o={o} cost />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Best({ label, o }: { label: string; o: CharmOption }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-rubi-gold/50 bg-rubi-gold/10 p-3">
      <img src={charmIcon(o.charm)} alt="" className="h-9 w-9 flex-none" />
      <div className="min-w-0">
        <div className="text-2xs font-semibold uppercase tracking-wider text-rubi-gold">
          {label}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-semibold">{o.charm}</span>
          <LevelTag o={o} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{o.why}</p>
      </div>
    </div>
  );
}

function HuntResult({
  kills,
  ctx,
}: {
  kills: { name: string; count: number }[];
  ctx: CharmContext;
}) {
  const plan = planHuntCharms(kills, ctx);
  const majors = plan.rows.filter((r) => r.major).length;
  return (
    <div className="card-surface space-y-3 p-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Charms pra essa hunt</h2>
        <p className="text-xs text-muted-foreground">
          Cada charm vai em uma criatura só (1 charm e 1 minor por criatura). A que mais aparece nas
          suas kills fica com o que mais rende.
        </p>
      </div>
      {plan.rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma criatura dessa hunt aceita charm.</p>
      ) : (
        <ul className="space-y-2">
          {plan.rows.map((r) => (
            <li
              key={r.monster.name}
              className="rounded-lg border border-border/60 bg-background/30 p-3"
            >
              <div className="flex items-center gap-2">
                <CreatureIcon name={displayName(r.monster.name)} size={28} />
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {displayName(r.monster.name)}
                </span>
                <span className="font-display text-xs tabular-nums text-muted-foreground">
                  {Math.round(r.share)}% das kills
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Slot label="Charm" o={r.major} />
                <Slot label="Minor" o={r.minor} />
              </div>
            </li>
          ))}
        </ul>
      )}
      {majors > 6 && (
        <p className="text-xs text-muted-foreground">
          Premium usa até 6 charms ao mesmo tempo (Free, 2): fique com os das criaturas que mais
          aparecem.
        </p>
      )}
      {plan.skipped.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Fora do plano (boss ou sem Bestiário na wiki): {plan.skipped.map(displayName).join(", ")}.
        </p>
      )}
    </div>
  );
}

function Slot({ label, o }: { label: string; o: CharmOption | null }) {
  if (!o)
    return (
      <div className="rounded-md border border-dashed border-border/60 p-2 text-xs text-muted-foreground">
        {label}: nenhum dos seus rende aqui.
      </div>
    );
  return (
    <div className="flex items-start gap-2 rounded-md bg-surface/60 p-2">
      <img src={charmIcon(o.charm)} alt="" className="h-6 w-6 flex-none" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-2xs uppercase tracking-wider text-muted-foreground">{label}</span>
          <span className="font-semibold">{o.charm}</span>
          <LevelTag o={o} />
        </div>
        <p className="text-xs text-muted-foreground">{o.why}</p>
      </div>
    </div>
  );
}
