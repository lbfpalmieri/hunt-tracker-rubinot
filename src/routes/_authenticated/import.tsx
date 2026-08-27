import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { parseHunting, parseDamage, parseMiscellaneous } from "@/lib/parser";
import { fmtGold, fmtNum, fmtDuration } from "@/lib/format";
import { getCommunitySessions } from "@/lib/community.functions";
import { Crown } from "lucide-react";
import { detectBlockKind, BLOCK_LABEL, type BlockKind } from "@/lib/block-detect";
import { groupMonstersByHunt, matchHuntsByMonsters, looksGenericHuntName } from "@/lib/hunt-suggest";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Save,
  UserCircle2,
  Sparkles,
  Trophy,
  Search,
  Globe2,
  AlertTriangle,
  Check,
  ClipboardPaste,
  Trash2,
  MapPin,
  X,
} from "lucide-react";
import { PasteImageBox, blobToCompressedImage } from "@/components/PasteImage";
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


  const effectiveCharId = activeId || characters[0]?.id || "";
  const activeChar = characters.find((c) => c.id === effectiveCharId);
  const charHunts = useMemo(
    () => hunts.filter((h) => h.characterId === effectiveCharId),
    [hunts, effectiveCharId],
  );
  const selectedHuntName = huntQuery.trim();

  // Roteamento automático da colagem: o sistema decide em qual bloco o texto entra.
  const [notice, setNotice] = useState<
    { tone: "ok" | "error"; title: string; detail?: string } | null
  >(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.tone === "error" ? 6000 : 2600);
    return () => clearTimeout(t);
  }, [notice]);

  const setters: Record<Exclude<BlockKind, "unknown">, (v: string) => void> = {
    hunting: setHuntingText,
    damage: setDamageText,
    misc: setMiscText,
  };

  const routePaste = (text: string, from?: Exclude<BlockKind, "unknown">) => {
    if (!text.trim()) {
      setNotice({ tone: "error", title: "Nada para colar", detail: "Sua área de transferência está vazia." });
      return;
    }
    const kind = detectBlockKind(text);
    if (kind === "unknown") {
      setNotice({
        tone: "error",
        title: "Não reconheci esse texto",
        detail: "Copie o bloco completo direto do jogo (Hunting Analyser, Input Analyser ou Miscellaneous).",
      });
      return;
    }
    setters[kind](text);
    setNotice({
      tone: "ok",
      title: `${BLOCK_LABEL[kind]} reconhecido`,
      detail:
        from && from !== kind
          ? `O texto era do ${BLOCK_LABEL[kind]} — coloquei no bloco certo automaticamente.`
          : undefined,
    });
  };

  // Detecta imagem na área de transferência → equipamento; senão trata como texto.
  const hasImageItem = (items?: DataTransferItemList | null): boolean => {
    if (!items) return false;
    return Array.from(items).some((it) => it.type.startsWith("image/"));
  };

  const gearNotice = () =>
    setNotice({
      tone: "ok",
      title: "Equipamento detectado",
      detail: "Print do equipamento adicionado à sessão.",
    });

  // Cola via evento (Ctrl+V no card ou global): imagem vai pro equipamento, texto é roteado.
  const handlePasteEvent = (e: ClipboardEvent, from?: Exclude<BlockKind, "unknown">) => {
    const el = e.target as HTMLElement | null;
    if (el && el.closest("input, textarea, [contenteditable='true']")) return;
    if (hasImageItem(e.clipboardData?.items)) {
      e.preventDefault();
      gearNotice();
      return;
    }
    const text = e.clipboardData?.getData("text") ?? "";
    if (!text.trim()) return;
    e.preventDefault();
    routePaste(text, from);
  };

  // Botão "Colar": lê a área de transferência (imagem primeiro, depois texto).
  const handleClipboardButton = async (from: Exclude<BlockKind, "unknown">) => {
    try {
      const clipItems = await navigator.clipboard.read?.();
      if (clipItems) {
        for (const item of clipItems) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const compressed = await blobToCompressedImage(blob);
              setGearUrl(compressed);
              gearNotice();
              return;
            }
          }
        }
      }
    } catch {
      // read() pode ser indisponível/negado — segue para texto.
    }
    try {
      const text = await navigator.clipboard.readText();
      routePaste(text, from);
    } catch {
      toast.error("Não deu pra acessar a área de transferência — use Ctrl+V na tela.");
    }
  };

  // Ctrl+V em qualquer lugar da tela (fora de campos de texto) já vai pro bloco correto.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => handlePasteEvent(e);
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

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

  const ownMatches = useMemo(() => sortByFullMatch(matchHuntsByMonsters(newMonsters, ownGroups)), [newMonsters, ownGroups]);
  const communityMatches = useMemo(() => {
    const ownNames = new Set(ownMatches.map((m) => m.huntName.toLowerCase()));
    return sortByFullMatch(
      matchHuntsByMonsters(newMonsters, communityGroups).filter(
        (m) => !ownNames.has(m.huntName.toLowerCase()),
      ),
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

  const durationOk = (parsed.hunting?.durationSec ?? 0) > 0;
  const huntingStatus: SlotStatus = !huntingText ? "empty" : parsed.hunting && durationOk ? "ok" : "error";
  const huntingSummary =
    parsed.hunting && durationOk
      ? `${fmtDuration(parsed.hunting.durationSec)} · ${fmtNum(parsed.hunting.kills.reduce((a, k) => a + k.count, 0))} kills · ${fmtGold(parsed.hunting.balance)}`
      : undefined;
  const huntingMessage = !parsed.hunting
    ? "Não reconheci esse bloco. Copie o Hunt Analyser completo do jogo."
    : "Duração não identificada. O texto precisa incluir \"Session data: From ... to ...\" e \"Session length\".";
  const canSave = Boolean(
    parsed.hunting && durationOk && effectiveCharId && selectedHuntName && bountyReady && preyReady,
  );

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
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
          <div
            role="status"
            className={
              "animate-notice-in pointer-events-auto flex w-full max-w-lg items-stretch overflow-hidden rounded-2xl border shadow-2xl " +
              (notice.tone === "ok"
                ? "border-rubi-success/40 bg-background"
                : "border-rubi-danger/40 bg-background")
            }
          >
            <span
              className={
                "flex w-1.5 flex-none " +
                (notice.tone === "ok" ? "bg-rubi-success" : "bg-rubi-danger")
              }
            />
            <div className="flex items-center gap-3 p-3 pr-2">
              <span
                className={
                  "flex h-9 w-9 flex-none items-center justify-center rounded-xl " +
                  (notice.tone === "ok"
                    ? "bg-rubi-success/15 text-rubi-success"
                    : "bg-rubi-danger/15 text-rubi-danger")
                }
              >
                {notice.tone === "ok" ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1 py-0.5">
                <p
                  className={
                    "font-display text-sm font-bold leading-tight " +
                    (notice.tone === "ok" ? "text-rubi-success" : "text-rubi-danger")
                  }
                >
                  {notice.title}
                </p>
                {notice.detail && (
                  <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                    {notice.detail}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="ml-1 flex-none self-start rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Importar</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Nova sessão de hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dê <kbd className="rounded border border-border/70 bg-background/60 px-1 text-[11px]">Ctrl</kbd>
          <span className="mx-px">+</span>
          <kbd className="rounded border border-border/70 bg-background/60 px-1 text-[11px]">V</kbd> em
          qualquer lugar da tela — o sistema identifica o bloco e encaixa no lugar certo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <PasteSlot
            label="Hunting Analyser"
            help="Cole aqui o bloco do Hunt Analyser (obrigatório)."
            value={huntingText}
            onChange={setHuntingText}
            status={huntingStatus}
            expect="hunting"
            onPasteEvent={handlePasteEvent}
            onPasteBtn={handleClipboardButton}
            summary={huntingSummary}
            message={huntingMessage}
          />
          <PasteSlot
            label="Input Analyser"
            help="Dano recebido: Total, Max-DPS, Damage Types e Sources."
            value={damageText}
            onChange={setDamageText}
            status={damageText ? (parsed.damage ? "ok" : "error") : "empty"}
            expect="damage"
            onPasteEvent={handlePasteEvent}
            onPasteBtn={handleClipboardButton}
            summary={
              parsed.damage ? `Dano recebido ${fmtNum(parsed.damage.totalReceived ?? 0)}` : undefined
            }
            message="Não reconheci esse bloco. Copie o Input Analyser completo."
            optional
          />
          <PasteSlot
            label="Miscellaneous"
            help="Charm Data, Imbuement Data e Item Upgrade."
            value={miscText}
            onChange={setMiscText}
            status={miscText ? (parsed.misc ? "ok" : "error") : "empty"}
            expect="misc"
            onPasteEvent={handlePasteEvent}
            onPasteBtn={handleClipboardButton}
            summary={parsed.misc ? "Charms, imbuements e upgrades lidos" : undefined}
            message="Não reconheci esse bloco. Copie o Miscellaneous completo."
            optional
          />
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


        <div className="space-y-4">
          <div className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-rubi-gold" />
                Detalhes da sessão
              </h2>
              {activeChar && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-rubi-blue/40 bg-rubi-blue/10 px-2.5 py-1 text-[11px] font-semibold text-rubi-blue"
                  title="Personagem ativo do seu perfil"
                >
                  <UserCircle2 className="h-3.5 w-3.5" />
                  {activeChar.name}
                </span>
              )}
            </div>
            <div>
              <span className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-rubi-gold">
                <MapPin className="h-3.5 w-3.5" />
                Hunt / spot
              </span>


              {(ownMatches.length > 0 || communityMatches.length > 0) && !selectedHuntName && (
                <div className="mt-2 mb-2.5 space-y-2.5 rounded-xl border border-rubi-blue/40 bg-rubi-blue/[0.07] p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rubi-blue">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sugestões pelos monstros
                  </p>
                  {ownMatches.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ownMatches.map((m) => {
                        const full = m.total > 0 && m.shared >= m.total;
                        return (
                          <button
                            key={m.huntName}
                            type="button"
                            onClick={() => pickHunt(m.huntName)}
                            className={
                              "group relative inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all active:scale-95 " +
                              (full
                                ? "border-rubi-gold bg-gradient-to-r from-rubi-gold/25 to-rubi-gold/10 shadow-glow-gold hover:from-rubi-gold/35"
                                : "border-rubi-blue/50 bg-rubi-blue/10 hover:border-rubi-blue hover:bg-rubi-blue/20 hover:shadow-glow-blue")
                            }
                          >
                            {full && <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />}
                            <span
                              className={
                                "font-display text-[13px] font-bold " +
                                (full ? "text-rubi-gold" : "text-foreground")
                              }
                            >
                              {m.huntName}
                            </span>
                            <span
                              className={
                                "rounded-full px-1.5 py-px text-[10px] font-bold " +
                                (full
                                  ? "bg-rubi-gold/25 text-rubi-gold"
                                  : "bg-rubi-blue/20 text-rubi-blue")
                              }
                            >
                              {m.shared}/{m.total}
                            </span>
                            {full && (
                              <span className="rounded-full bg-rubi-gold px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-background">
                                match total
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {communityMatches.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Globe2 className="h-3 w-3" />
                        Usadas pela comunidade
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {communityMatches.map((m) => {
                          const full = m.total > 0 && m.shared >= m.total;
                          return (
                            <button
                              key={m.huntName}
                              type="button"
                              onClick={() => pickHunt(m.huntName)}
                              className={
                                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all active:scale-95 " +
                                (full
                                  ? "border-rubi-gold/70 bg-rubi-gold/10 hover:border-rubi-gold hover:bg-rubi-gold/20"
                                  : "border-border/60 bg-background/40 hover:border-rubi-blue/60 hover:bg-rubi-blue/10")
                              }
                            >
                              {full && <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />}
                              <span
                                className={
                                  "font-display text-[13px] font-semibold " +
                                  (full ? "text-rubi-gold" : "text-foreground/90")
                                }
                              >
                                {m.huntName}
                              </span>
                              <span
                                className={
                                  "rounded-full px-1.5 py-px text-[10px] font-semibold " +
                                  (full
                                    ? "bg-rubi-gold/20 text-rubi-gold"
                                    : "bg-muted/40 text-muted-foreground")
                                }
                              >
                                {m.shared}/{m.total}
                              </span>
                            </button>
                          );
                        })}
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
              className="group/save relative mt-4 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rubi-gold via-rubi-gold to-rubi-blue px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background shadow-glow-gold transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-none disabled:bg-muted/40 disabled:text-muted-foreground disabled:opacity-70 disabled:shadow-none"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 group-hover/save:translate-x-full group-disabled/save:hidden" />
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar sessão"}

            </button>
            {saveError && (
              <p className="mt-2 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                {saveError}
              </p>
            )}
            {!canSave && (
              <p
                className={
                  "mt-2 text-xs " +
                  (parsed.hunting && !durationOk
                    ? "rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-rubi-danger"
                    : "text-muted-foreground")
                }
              >
                {!parsed.hunting
                  ? "Cole o Hunting Analyser para continuar."
                  : !durationOk
                    ? "Não foi possível identificar a duração da sessão. Cole o Hunting Analyser completo, incluindo as linhas \"Session data: From ... to ...\" e \"Session length: HH:MMh\"."
                    : !selectedHuntName
                      ? "Dê um nome à hunt."
                      : !preyReady
                        ? "Revise os bônus de prey (use um número entre 0 e 100)."
                        : "Selecione a dificuldade e o tipo da Bounty Task."}
              </p>
            )}

          </div>

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

/** Sugestões com todos os monstros do spot vêm primeiro. */
function sortByFullMatch<T extends { shared: number; total: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const fa = a.total > 0 && a.shared >= a.total ? 1 : 0;
    const fb = b.total > 0 && b.shared >= b.total ? 1 : 0;
    return fb - fa || b.shared - a.shared;
  });
}

type SlotStatus = "empty" | "ok" | "error";

const SLOT_THEME: Record<SlotStatus, string> = {
  empty: "border-border/60 bg-surface/40 hover:border-rubi-blue/50",
  ok: "border-rubi-success/50 bg-rubi-success/10",
  error: "border-rubi-danger/50 bg-rubi-danger/10",
};

/**
 * Card compacto de colagem: o usuário nunca vê o texto colado, só o status.
 * Aceita Ctrl+V no card (foco) ou o botão de colar da área de transferência.
 */
function PasteSlot({
  label,
  help,
  value,
  onChange,
  status,
  summary,
  message,
  optional,
  expect,
  onPasteEvent,
  onPasteBtn,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
  status: SlotStatus;
  summary?: string;
  message?: string;
  optional?: boolean;
  expect: Exclude<BlockKind, "unknown">;
  onPasteEvent: (e: ClipboardEvent, from: Exclude<BlockKind, "unknown">) => void;
  onPasteBtn: (from: Exclude<BlockKind, "unknown">) => Promise<void>;
}) {
  const [pasting, setPasting] = useState(false);

  const pasteFromClipboard = async () => {
    setPasting(true);
    try {
      await onPasteBtn(expect);
    } finally {
      setPasting(false);
    }
  };

  return (
    <div
      tabIndex={0}
      onPaste={(e) => onPasteEvent(e.nativeEvent, expect)}
      className={
        "group relative overflow-hidden rounded-2xl border p-4 outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-rubi-gold/60 " +
        SLOT_THEME[status]
      }
    >
      {/* faixa de status na borda esquerda */}
      <span
        aria-hidden
        className={
          "absolute inset-y-0 left-0 w-1 transition-colors " +
          (status === "ok"
            ? "bg-rubi-success"
            : status === "error"
              ? "bg-rubi-danger"
              : "bg-border group-hover:bg-rubi-blue/70")
        }
      />

      <div className="flex items-center gap-3.5 pl-1.5">
        <span
          className={
            "flex h-11 w-11 flex-none items-center justify-center rounded-xl border transition-all duration-300 " +
            (status === "ok"
              ? "border-rubi-success/60 bg-rubi-success/15 text-rubi-success"
              : status === "error"
                ? "border-rubi-danger/60 bg-rubi-danger/15 text-rubi-danger"
                : "border-border bg-background/40 text-muted-foreground group-hover:border-rubi-blue/60 group-hover:text-rubi-blue")
          }
        >
          {status === "ok" ? (
            <Check className="h-5 w-5" strokeWidth={2.5} />
          ) : status === "error" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <ClipboardPaste className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-[15px] font-bold tracking-tight">{label}</span>
            {optional ? (
              <span className="flex-none rounded-full border border-border/70 px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                opcional
              </span>
            ) : (
              <span className="flex-none rounded-full border border-rubi-gold/40 bg-rubi-gold/10 px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
                obrigatório
              </span>
            )}
          </div>
          <p
            className={
              "mt-1 truncate text-xs " +
              (status === "ok"
                ? "font-semibold text-rubi-success"
                : status === "error"
                  ? "font-semibold text-rubi-danger"
                  : "text-muted-foreground")
            }
            title={status === "empty" ? help : (message ?? summary ?? "")}
          >
            {status === "ok" ? (summary ?? "Dados lidos com sucesso") : status === "error" ? message : help}
          </p>
        </div>

        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-border/70 bg-background/50 px-3 py-2 text-xs font-semibold text-muted-foreground transition-all hover:border-rubi-danger/60 hover:bg-rubi-danger/10 hover:text-rubi-danger active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpar
          </button>
        ) : (
          <div className="flex flex-none flex-col items-end gap-1">
            <button
              type="button"
              onClick={pasteFromClipboard}
              disabled={pasting}
              className="group/btn relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-rubi-gold via-rubi-gold to-rubi-blue px-4 py-2 text-xs font-bold uppercase tracking-wide text-background shadow-glow-gold transition-all hover:brightness-110 hover:shadow-lg active:scale-95 disabled:pointer-events-none disabled:opacity-60"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              <ClipboardPaste className="h-3.5 w-3.5 flex-none" />
              {pasting ? "Colando…" : "Colar"}
            </button>
            <span className="hidden text-[10px] font-medium text-muted-foreground/70 sm:block">
              ou <kbd className="rounded border border-border/70 bg-background/60 px-1">Ctrl</kbd>
              <span className="mx-px">+</span>
              <kbd className="rounded border border-border/70 bg-background/60 px-1">V</kbd>
            </span>
          </div>
        )}
      </div>
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
