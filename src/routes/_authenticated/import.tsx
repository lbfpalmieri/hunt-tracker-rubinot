import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { parseHunting, parseDamage, parseMiscellaneous, splitCombinedInput } from "@/lib/parser";
import { fmtGold, fmtNum, fmtDuration } from "@/lib/format";
import { getCommunitySessions } from "@/lib/community.functions";
import { groupMonstersByHunt, matchHuntsByMonsters, looksGenericHuntName } from "@/lib/hunt-suggest";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Wand2,
  Save,
  UserCircle2,
  Sparkles,
  Trophy,
  Search,
  Globe2,
  AlertTriangle,
  ClipboardPaste,
} from "lucide-react";
import { PasteImageBox } from "@/components/PasteImage";
import {
  BOUNTY_DIFFICULTIES,
  BOUNTY_TIERS,
  parseXpAmount,
  type BountyDifficulty,
  type BountyTier,
} from "@/lib/bounty";
import { PreyPicker } from "@/components/PreyPicker";
import type { PreySlot } from "@/lib/prey";



export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({
    meta: [
      { title: "Importar sessão — RubinOT Hunt Tracker" },
      { name: "description", content: "Cole os dados do RubinOT (Hunting/Damage/Miscellaneous) e salve sua sessão." },
      { property: "og:title", content: "Importar sessão" },
      { property: "og:description", content: "Registre uma nova hunt no RubinOT Hunt Tracker." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const hunts = useAppStore((s) => s.hunts);
  const sessions = useAppStore((s) => s.sessions);
  const addSession = useAppStore((s) => s.addSession);
  const addHunt = useAppStore((s) => s.addHunt);

  const [huntingText, setHuntingText] = useState("");
  const [damageText, setDamageText] = useState("");
  const [miscText, setMiscText] = useState("");
  const [huntQuery, setHuntQuery] = useState("");
  const [huntPickerOpen, setHuntPickerOpen] = useState(false);
  const huntPickerRef = useRef<HTMLDivElement>(null);
  const [charId, setCharId] = useState<string>("");
  const [gearUrl, setGearUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [hasBounty, setHasBounty] = useState(false);
  const [bountyDifficulty, setBountyDifficulty] = useState<BountyDifficulty | "">("");
  const [bountyTier, setBountyTier] = useState<BountyTier | "">("");
  const [bountyXpText, setBountyXpText] = useState("");
  const bountyXp = parseXpAmount(bountyXpText);
  const bountyXpInvalid = bountyXpText.trim().length > 0 && bountyXp == null;
  const [hasPrey, setHasPrey] = useState(false);
  const [prey, setPrey] = useState<PreySlot[] | null>(null);
  const [preyValid, setPreyValid] = useState(true);
  const bountyReady = !hasBounty || Boolean(bountyDifficulty && bountyTier && !bountyXpInvalid);
  const preyReady = !hasPrey || preyValid;


  const effectiveCharId = charId || activeId || characters[0]?.id || "";
  const charHunts = useMemo(
    () => hunts.filter((h) => h.characterId === effectiveCharId),
    [hunts, effectiveCharId],
  );
  const selectedHuntName = huntQuery.trim();

  const parsed = useMemo(() => {
    try {
      const hunting = huntingText.trim() ? parseHunting(huntingText) : null;
      const damage = damageText.trim() ? parseDamage(damageText) : null;
      const misc = miscText.trim() ? parseMiscellaneous(miscText) : null;
      return { hunting, damage, misc };
    } catch {
      return { hunting: null, damage: null, misc: null };
    }
  }, [huntingText, damageText, miscText]);

  // Suggests which hunt this session belongs to by matching the monsters just
  // killed against monsters seen before under each hunt name.
  const newMonsters = useMemo(() => (parsed.hunting?.kills ?? []).map((k) => k.name), [parsed.hunting]);

  const fetchCommunity = useServerFn(getCommunitySessions);
  const { data: communityData } = useQuery({
    queryKey: ["community-sessions", "hunt-suggest"],
    queryFn: () => fetchCommunity({ data: { limit: 300 } }),
    staleTime: 10 * 60_000,
  });

  const ownGroups = useMemo(
    () => groupMonstersByHunt(sessions.map((s) => ({ huntName: s.huntName, kills: s.hunting.kills }))),
    [sessions],
  );
  const communityGroups = useMemo(
    () => groupMonstersByHunt(communityData?.sessions ?? []),
    [communityData],
  );

  const ownMatches = useMemo(() => matchHuntsByMonsters(newMonsters, ownGroups), [newMonsters, ownGroups]);
  const communityMatches = useMemo(() => {
    const ownNames = new Set(ownMatches.map((m) => m.huntName.toLowerCase()));
    return matchHuntsByMonsters(newMonsters, communityGroups).filter(
      (m) => !ownNames.has(m.huntName.toLowerCase()),
    );
  }, [newMonsters, communityGroups, ownMatches]);

  const huntFiltered = useMemo(() => {
    const q = huntQuery.trim().toLowerCase();
    if (!q) return charHunts;
    return charHunts.filter((h) => h.name.toLowerCase().includes(q));
  }, [charHunts, huntQuery]);

  const knownHuntNames = useMemo(
    () =>
      new Set([
        ...charHunts.map((h) => h.name.toLowerCase()),
        ...ownMatches.map((m) => m.huntName.toLowerCase()),
        ...communityMatches.map((m) => m.huntName.toLowerCase()),
      ]),
    [charHunts, ownMatches, communityMatches],
  );
  const huntNameLooksGeneric =
    Boolean(selectedHuntName) &&
    !knownHuntNames.has(selectedHuntName.toLowerCase()) &&
    looksGenericHuntName(selectedHuntName);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!huntPickerRef.current?.contains(e.target as Node)) setHuntPickerOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pickHunt = (name: string) => {
    setHuntQuery(name);
    setHuntPickerOpen(false);
  };

  const canSave = Boolean(parsed.hunting && effectiveCharId && selectedHuntName && bountyReady && preyReady);

  const handleAutoSplit = () => {
    const combined = [huntingText, damageText, miscText].filter(Boolean).join("\n\n");
    const parts = splitCombinedInput(combined);
    if (parts.hunting) setHuntingText(parts.hunting);
    if (parts.damage) setDamageText(parts.damage);
    if (parts.misc) setMiscText(parts.misc);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!canSave || !parsed.hunting) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Idempotent by name — reuses the existing hunt row if one already matches.
      await addHunt(effectiveCharId, selectedHuntName);
      const created = await addSession({
        characterId: effectiveCharId,
        huntName: selectedHuntName,
        hunting: parsed.hunting,
        damage: parsed.damage,
        misc: parsed.misc,
        gearUrl,
        isPublic,
        bounty:
          hasBounty && bountyDifficulty && bountyTier
            ? { difficulty: bountyDifficulty, tier: bountyTier, xp: bountyXp }
            : null,
        prey: hasPrey ? prey : null,
      });

      navigate({ to: "/sessions/$id", params: { id: created.id } });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };


  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  if (characters.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={UserCircle2}
          title="Crie um personagem primeiro"
          description="As sessões precisam estar vinculadas a um personagem."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Importar</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Nova sessão de hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole os blocos exportados pelo RubinOT. O sistema faz o parse automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TextBlock
            label="Hunting Analyser"
            help="Bloco com XP Gain, Loot, Supplies, Balance, Killed Monsters e Looted Items."
            value={huntingText}
            onChange={setHuntingText}
            variant="hunting"
          />
          <TextBlock
            label="Input Analyser (Received Damage)"
            help="Opcional. Total, Max-DPS, Damage Types e Damage Sources."
            value={damageText}
            onChange={setDamageText}
            variant="damage"
          />
          <TextBlock
            label="Miscellaneous"
            help="Opcional. Charm Data, Imbuement Data e Item Upgrade."
            value={miscText}
            onChange={setMiscText}
            variant="misc"
          />
          <button
            onClick={handleAutoSplit}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Wand2 className="h-3.5 w-3.5" /> Auto-separar blocos misturados
          </button>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-rubi-gold" />
              Detalhes da sessão
            </h2>
            <label className="mb-3 block">
              <span className="text-xs font-medium text-muted-foreground">Personagem</span>
              <select
                value={effectiveCharId}
                onChange={(e) => setCharId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.vocation}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Hunt / spot</span>

              {(ownMatches.length > 0 || communityMatches.length > 0) && !selectedHuntName && (
                <div className="mt-1.5 mb-2 space-y-1.5 rounded-lg border border-rubi-blue/30 bg-rubi-blue/[0.04] p-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Baseado nos monstros dessa sessão, pode ser uma dessas hunts:
                  </p>
                  {ownMatches.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {ownMatches.map((m) => (
                        <button
                          key={m.huntName}
                          type="button"
                          onClick={() => pickHunt(m.huntName)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-rubi-blue/50 bg-rubi-blue/10 px-2.5 py-1 text-xs font-medium text-rubi-blue hover:bg-rubi-blue/20"
                        >
                          {m.huntName}
                          <span className="text-[10px] opacity-70">
                            {m.shared}/{m.total} monstros
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {communityMatches.length > 0 && (
                    <div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Jogadores da comunidade usam esse nome pra hunts com esses monstros:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {communityMatches.map((m) => (
                          <button
                            key={m.huntName}
                            type="button"
                            onClick={() => pickHunt(m.huntName)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-rubi-blue/50 hover:text-foreground"
                          >
                            <Globe2 className="h-3 w-3" />
                            {m.huntName}
                            <span className="text-[10px] opacity-70">
                              {m.shared}/{m.total} monstros
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div ref={huntPickerRef} className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={huntQuery}
                    onChange={(e) => setHuntQuery(e.target.value)}
                    onFocus={() => setHuntPickerOpen(true)}
                    placeholder="Buscar ou digitar o nome da hunt…"
                    className="mt-1 w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60"
                  />
                </div>
                {huntPickerOpen && huntFiltered.length > 0 && (
                  <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-lg border border-border bg-popover py-1 shadow-xl">
                    {huntFiltered.map((h) => (
                      <li key={h.id}>
                        <button
                          type="button"
                          onClick={() => pickHunt(h.name)}
                          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          {h.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {huntNameLooksGeneric && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-rubi-gold">
                  <AlertTriangle className="mt-0.5 h-3 w-3 flex-none" />
                  Esse nome não parece bater com nenhum local conhecido — considere algo descritivo (ex:
                  "Darashia - DT Seal -1") pra ajudar outros jogadores a encontrar essa hunt.
                </p>
              )}
            </div>

            <div className="mt-4">
              <span className="text-xs font-medium text-muted-foreground">
                Equipamento (opcional)
              </span>
              <PasteImageBox
                value={gearUrl}
                onChange={(v) => setGearUrl(v)}
                label="Tire um print do equipamento e cole aqui (Ctrl+V)"
                className="mt-1"
              />
            </div>

            <label className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--rubi-blue)]"
              />
              <span>
                Compartilhar esta sessão na <b className="text-foreground">Comunidade</b> (personagem,
                vocação, hunt e equipamento ficam visíveis para outros jogadores).
              </span>
            </label>

            <div className="mt-4 rounded-xl border border-rubi-gold/30 bg-rubi-gold/[0.04] p-3">
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={hasBounty}
                  onChange={(e) => setHasBounty(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--rubi-gold)]"
                />
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-rubi-gold" />
                  Esta sessão incluiu <b className="text-foreground">bônus de Bounty Task</b>
                </span>
              </label>

              {hasBounty && (
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Dificuldade
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      {BOUNTY_DIFFICULTIES.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          title={d.hint}
                          onClick={() => setBountyDifficulty(d.value)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                            bountyDifficulty === d.value
                              ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                              : "border-border/60 text-muted-foreground hover:border-rubi-gold/50"
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      Tipo da task
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {BOUNTY_TIERS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setBountyTier(t.value)}
                          className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                            bountyTier === t.value
                              ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                              : "border-border/60 text-muted-foreground hover:border-rubi-gold/50"
                          }`}
                        >
                          {t.label}
                          <span className="mt-0.5 block text-[10px] font-normal opacity-70">{t.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      XP de bônus (opcional)
                    </label>
                    <input
                      value={bountyXpText}
                      onChange={(e) => setBountyXpText(e.target.value)}
                      placeholder="ex: 8kk ou 8000000"
                      className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-rubi-gold"
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {bountyXpInvalid
                        ? "Valor inválido — use 8kk, 8m ou 8000000."
                        : bountyXp != null
                          ? `Será descontado da Raw XP: ${fmtNum(bountyXp)}`
                          : "Se você não souber o valor, deixe vazio: a sessão fica marcada como Bounty e não entra nas médias de Raw XP/h."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3 rounded-xl border border-rubi-blue/30 bg-rubi-blue/[0.04] p-3">
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={hasPrey}
                  onChange={(e) => setHasPrey(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--rubi-blue)]"
                />
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-rubi-blue" />
                  Esta sessão teve <b className="text-foreground">Prey</b> ativa
                </span>
              </label>

              {hasPrey && (
                <div className="mt-3">
                  <PreyPicker
                    creatures={(parsed.hunting?.kills ?? []).slice().sort((a, b) => b.count - a.count).map((k) => k.name)}
                    value={null}
                    onChange={(next, valid) => { setPrey(next); setPreyValid(valid); }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2.5 text-sm font-semibold text-background shadow-glow-gold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar sessão"}
            </button>
            {saveError && (
              <p className="mt-2 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                {saveError}
              </p>
            )}
            {!canSave && (
              <p className="mt-2 text-xs text-muted-foreground">
                {!parsed.hunting
                  ? "Cole o Hunting Analyser para continuar."
                  : !selectedHuntName
                    ? "Dê um nome à hunt."
                    : !preyReady
                      ? "Revise os bônus de prey (use um número entre 0 e 100)."
                      : "Selecione a dificuldade e o tipo da Bounty Task."}
              </p>

            )}
          </div>

          {parsed.hunting && (
            <div className="card-surface p-5">
              <h3 className="mb-3 text-sm font-semibold">Preview</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <PreviewRow label="Duração" value={fmtDuration(parsed.hunting.durationSec)} />
                <PreviewRow label="Raw XP" value={fmtNum(parsed.hunting.rawXp)} />
                <PreviewRow label="Raw XP/h" value={fmtNum(parsed.hunting.rawXpPerHour || parsed.hunting.rawXp / (parsed.hunting.durationSec / 3600 || 1))} />

                <PreviewRow label="Loot" value={fmtGold(parsed.hunting.loot)} />
                <PreviewRow label="Supplies" value={fmtGold(parsed.hunting.supplies)} />
                <PreviewRow
                  label="Balance"
                  value={fmtGold(parsed.hunting.balance)}
                  positive={parsed.hunting.balance >= 0}
                />
                <PreviewRow label="Kills" value={fmtNum(parsed.hunting.kills.reduce((a, k) => a + k.count, 0))} />
              </dl>
            </div>
          )}
        </div>
      </div>

      {!huntingText && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 text-sm text-muted-foreground">
          <Upload className="mt-0.5 h-4 w-4 flex-none text-rubi-blue" />
          <div>
            No cliente do RubinOT abra <b>Analytics Selector → Hunt Analyser</b> e copie o texto.
            Faça o mesmo para Input Analyser e Miscellaneous.
          </div>
        </div>
      )}
    </AppShell>
  );
}

const TEXT_BLOCK_VARIANTS = {
  hunting: {
    border: "border-rubi-blue/40",
    bg: "bg-gradient-to-br from-rubi-blue/20 via-surface to-surface",
  },
  damage: {
    border: "border-white/10",
    bg: "bg-gradient-to-br from-rubi-success/15 via-surface to-rubi-danger/15",
  },
  misc: {
    border: "border-rubi-gold/40",
    bg: "bg-gradient-to-br from-rubi-gold/20 via-surface to-surface",
  },
} as const;

function TextBlock({
  label, help, value, onChange, variant,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  variant: keyof typeof TEXT_BLOCK_VARIANTS;
}) {
  const [pasting, setPasting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = TEXT_BLOCK_VARIANTS[variant];

  const handlePaste = async () => {
    setPasting(true);
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("Área de transferência vazia");
        return;
      }
      onChange(text);
      textareaRef.current?.focus();
    } catch {
      toast.error("Não deu pra acessar a área de transferência — cole com Ctrl+V direto no campo.");
    } finally {
      setPasting(false);
    }
  };

  return (
    <div className={"rounded-lg border p-3 " + theme.border + " " + theme.bg} style={{ boxShadow: "var(--shadow-card)" }}>
      <label className="block">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold">{label}</span>
            <button
              type="button"
              onClick={handlePaste}
              disabled={pasting}
              title="Colar da área de transferência"
              className="animate-float-pop inline-flex flex-none items-center gap-1 rounded-full bg-gradient-to-br from-rubi-gold to-rubi-blue px-2 py-0.5 text-[11px] font-bold text-background shadow-glow-gold transition-transform hover:scale-110 hover:shadow-glow-blue hover:[animation-play-state:paused] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              <ClipboardPaste className="h-3 w-3 flex-none" />
              Colar
            </button>
          </div>
          <span className="flex-none text-xs text-muted-foreground">{value.length} chars</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{help}</p>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed placeholder:text-muted-foreground/50"
          placeholder="Cole o texto aqui..."
          spellCheck={false}
        />
      </label>
    </div>
  );
}

function PreviewRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={
          "font-display text-lg font-semibold " +
          (positive === true ? "text-rubi-success" : positive === false ? "text-rubi-danger" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}
