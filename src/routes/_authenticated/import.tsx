import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { parseHunting, parseDamage, parseMiscellaneous, withDuration } from "@/lib/parser";
import { DurationAdjust } from "@/components/DurationAdjust";
import { detectDeathLoss } from "@/lib/deaths";
import { fmtGold, fmtNum, fmtDuration } from "@/lib/format";
import { getCommunitySessions } from "@/lib/community.functions";
import { Crown } from "lucide-react";
import { detectBlockKind, BLOCK_LABEL, type BlockKind } from "@/lib/block-detect";
import {
  groupMonstersByHunt,
  matchHuntsByMonsters,
  looksGenericHuntName,
  canonicalizeHuntRows,
} from "@/lib/hunt-suggest";
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
  Swords,
  Skull,
  Plus,
  Crosshair,
  ChevronRight,
  Wrench,
  Users,
  StickyNote,
} from "lucide-react";
import { BountyTaskPanel } from "@/components/BountyTaskPanel";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EMPTY_BOUNTY, bountyDraftValid, bountyFromDraft, type BountyDraft } from "@/lib/bounty-draft";
import { PreyPicker } from "@/components/PreyPicker";
import { SessionSetupPanel } from "@/components/setup/SessionSetupPanel";
import {
  EMPTY_SETUP,
  charmsFromMisc,
  normalizeSetup,
  setupVocation,
  type SessionSetup,
} from "@/lib/session-setup";
import type { PreySlot } from "@/lib/prey";
import { LevelQuickAdd } from "@/components/LevelQuickAdd";
import { NotesEditor } from "@/components/notes/NotesEditor";
import { errorMessage } from "@/lib/errors";
import { currentLevel } from "@/lib/level";
import {
  applyPartySplit,
  findSelfByHunting,
  looksLikePartyText,
  looksLikeRubinotPartyHunt,
  mergePartyHunting,
  partyFromText,
  selfShare,
  type PartyInfo,
} from "@/lib/party";
import { PARTY_COPY_HELP, PartyEditor } from "@/components/party/PartyEditor";
import { PartyBadge } from "@/components/party/PartyBadge";
import { setPlayMode, useNavPrefs } from "@/lib/nav-prefs";



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
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const addSession = useAppStore((s) => s.addSession);
  const addHunt = useAppStore((s) => s.addHunt);
  const addDeath = useAppStore((s) => s.addDeath);

  const [huntingText, setHuntingText] = useState("");
  const [damageText, setDamageText] = useState("");
  const [miscText, setMiscText] = useState("");
  const [huntQuery, setHuntQuery] = useState("");
  const [huntPickerOpen, setHuntPickerOpen] = useState(false);
  const huntPickerRef = useRef<HTMLDivElement>(null);
  const [isPublic, setIsPublic] = useState(true);
  // Assistente "Adicionar sessão": Hunt → Grupo → Bounty → Prey → Setup → Finalizar. Grupo, Bounty e
  // Prey são perguntas Sim/Não (null = ainda não respondida).
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [bountyAnswer, setBountyAnswer] = useState<"yes" | "no" | null>(null);
  const [bountyDraft, setBountyDraft] = useState<BountyDraft>(EMPTY_BOUNTY);
  const [preyAnswer, setPreyAnswer] = useState<"yes" | "no" | null>(null);
  // Hunt em party (party.ts). No MODO GRUPO a sessão vem do Party Hunt Analyser (ou do resultado do
  // LootSplitter) + opcionalmente o SEU Hunting/Input/Misc (mergePartyHunting: XP e criaturas do seu
  // analyser, duração e lucro da party). Sem o Hunting Analyser pessoal o assistente pula Bounty e
  // Prey (dependem de XP e criaturas). No Modo Solo não tem party.
  const playMode = useNavPrefs((s) => s.mode);
  const groupMode = playMode === "party";
  const [party, setParty] = useState<PartyInfo | null>(null);
  // Texto colado no bloco "Party Hunt Analyser" da página (a party em si fica em `party`).
  const [partyText, setPartyText] = useState("");
  const hasParty = groupMode && !!party;
  // Precisa saber quem é você entre os membros (é a sua linha que vira a sessão).
  // Party Hunt Analyser do RubinOT (`own`) já é a sua linha — não tem membros pra escolher.
  const partyReady = !groupMode || !!party?.own || (!!party?.members?.length && !!party.self);
  const [setup, setSetup] = useState<SessionSetup>(EMPTY_SETUP);
  const hasBounty = bountyAnswer === "yes";
  const hasPrey = preyAnswer === "yes";
  const [prey, setPrey] = useState<PreySlot[] | null>(null);
  const [preyValid, setPreyValid] = useState(true);
  const [notes, setNotes] = useState("");
  const bountyReady = !hasBounty || bountyDraftValid(bountyDraft);
  const preyReady = !hasPrey || (preyValid && Boolean(prey?.length));

  // O Hunting Analyser mistura a XP perdida na morte com a XP ganha caçando —
  // se o jogador morreu durante a sessão, a Raw XP do bloco fica negativa. Em
  // vez de pedir level/bênçãos pra recalcular, usamos direto o valor negativo
  // observado (é o dado mais confiável que existe: veio do próprio jogo) —
  // ver `detectedDeathLoss` mais abaixo, perto de onde `parsed` já existe.
  const [deathOptOut, setDeathOptOut] = useState(false);
  // Nova colagem — não deixa uma escolha de "não foi morte" de uma sessão
  // anterior grudar sem querer numa sessão diferente.
  useEffect(() => setDeathOptOut(false), [huntingText]);


  const effectiveCharId = activeId || characters[0]?.id || "";
  const activeChar = characters.find((c) => c.id === effectiveCharId);
  const activeCharLevel = currentLevel(levelSnapshots, effectiveCharId);
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

  const applyPartyText = (text: string) => {
    setPartyText(text);
    if (!text.trim()) {
      setParty(null);
      return;
    }
    const p = partyFromText(text, activeChar?.name, { rubinotAnalyser: true });
    if (p) {
      setParty(p);
    }
  };

  const setters: Record<Exclude<BlockKind, "unknown">, (v: string) => void> = {
    hunting: setHuntingText,
    damage: setDamageText,
    misc: setMiscText,
    party: applyPartyText,
  };

  const routePaste = (text: string, from?: Exclude<BlockKind, "unknown">) => {
    if (!text.trim()) {
      setNotice({ tone: "error", title: "Nada para colar", detail: "Sua área de transferência está vazia." });
      return;
    }
    const kind = detectBlockKind(text, { groupMode });
    if (kind === "unknown") {
      setNotice({
        tone: "error",
        title: "Não reconheci esse texto",
        detail:
          "Copie o bloco completo direto do jogo (Hunting Analyser, Input Analyser, Miscellaneous ou Party Hunt).",
      });
      return;
    }
    if (kind === "party" && !groupMode) {
      setPlayMode("party");
      applyPartyText(text);
      setNotice({
        tone: "ok",
        title: "Party Hunt Analyser — mudamos pro Modo Grupo",
        detail:
          "Hunt em grupo é registrada no Modo Grupo — se quiser XP e monstros/h, cole também o seu Hunting Analyser.",
      });
      return;
    }
    setters[kind](text);
    setNotice({
      tone: "ok",
      title: `${BLOCK_LABEL[kind]} reconhecido`,
      detail:
        kind === "party"
          ? "Hunt em grupo: o lucro da sessão vai ser a sua parte da divisão (confira no passo Grupo)."
          : from && from !== kind
            ? `O texto era do ${BLOCK_LABEL[kind]} — coloquei no bloco certo automaticamente.`
            : undefined,
    });
  };

  // Cola via evento (Ctrl+V no card ou global): o texto é roteado pro bloco certo.
  const handlePasteEvent = (e: ClipboardEvent, from?: Exclude<BlockKind, "unknown">) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest?.("input, textarea, [contenteditable='true']")) return;
    const text = e.clipboardData?.getData("text") ?? "";
    if (!text.trim()) return;
    e.preventDefault();
    routePaste(text, from);
  };

  // Botão "Colar": lê o texto da área de transferência.
  const handleClipboardButton = async (from: Exclude<BlockKind, "unknown">) => {
    try {
      const text = await navigator.clipboard.readText();
      routePaste(text, from);
    } catch {
      toast.error("Não deu pra acessar a área de transferência — use Ctrl+V na tela.");
    }
  };

  // Ctrl+V em qualquer lugar da tela (fora de campos de texto) já vai pro bloco correto.
  useEffect(() => {
    // Com o assistente aberto, o Ctrl+V é dos campos dele — não reencaminha blocos.
    const onPaste = (e: ClipboardEvent) => {
      if (!wizardOpen) handlePasteEvent(e);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  // Modo Grupo: `personal` = o Hunting Analyser pessoal colado (opcional; só entra com
  // XP/criaturas/itens — ver mergePartyHunting). Modo Solo: exatamente como sempre foi.
  const parsedRaw = useMemo(() => {
    if (groupMode) {
      const safe = <T,>(text: string, fn: (t: string) => T): T | null => {
        if (!text.trim()) return null;
        try {
          return fn(text);
        } catch {
          return null;
        }
      };
      const personalRaw = safe(huntingText, parseHunting);
      const personal =
        personalRaw &&
        personalRaw.durationSec > 0 &&
        !looksLikePartyText(huntingText) &&
        !looksLikeRubinotPartyHunt(huntingText)
          ? personalRaw
          : null;
      const hunting = party?.members?.length || party?.own ? mergePartyHunting(party, personal) : null;
      return {
        hunting,
        personal,
        damage: safe(damageText, parseDamage),
        misc: safe(miscText, parseMiscellaneous),
      };
    }
    try {
      const hunting = huntingText.trim() ? parseHunting(huntingText) : null;
      const damage = damageText.trim() ? parseDamage(damageText) : null;
      const misc = miscText.trim() ? parseMiscellaneous(miscText) : null;
      return { hunting, personal: null, damage, misc };
    } catch {
      return { hunting: null, personal: null, damage: null, misc: null };
    }
  }, [huntingText, damageText, miscText, groupMode, party]);

  // "Corrigir tempo": duração real da hunt quando o analyser ficou contando a mais (esqueceu de colar).
  // Zera quando chega outro analyser.
  const [durationFix, setDurationFix] = useState<number | null>(null);
  useEffect(() => {
    setDurationFix(null);
  }, [huntingText, groupMode, party?.sessionSec, party?.startedAt]);
  const parsed = useMemo(
    () =>
      durationFix && parsedRaw.hunting
        ? { ...parsedRaw, hunting: withDuration(parsedRaw.hunting, durationFix) }
        : parsedRaw,
    [parsedRaw, durationFix],
  );

  // Modo Grupo: o nome do char não bateu com ninguém da party → tenta achar você pelos números do
  // seu Hunting Analyser (dá pra trocar no passo Grupo).
  useEffect(() => {
    if (!groupMode || !party?.members?.length || party.self || !parsed.personal) return;
    const self = findSelfByHunting(party.members, parsed.personal);
    if (self) setParty({ ...party, self });
  }, [groupMode, party, parsed.personal]);

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
  // A comunidade digita o nome à mão: unificamos grafias parecidas sob a mais
  // usada e marcamos andares improváveis para não sugerir nomes errados.
  const community = useMemo(() => {
    const own = (sessions ?? []).map((s) => ({ huntName: s.huntName, kills: s.hunting.kills }));
    const all = [...own, ...(communityData?.sessions ?? []).map((s) => ({ huntName: s.huntName, kills: s.kills }))];
    const { rows, suspicious } = canonicalizeHuntRows(all);
    return { groups: groupMonstersByHunt(rows.slice(own.length)), suspicious };
  }, [communityData, sessions]);
  const communityGroups = community.groups;

  const ownMatches = useMemo(() => sortByFullMatch(matchHuntsByMonsters(newMonsters, ownGroups)), [newMonsters, ownGroups]);
  const communityMatches = useMemo(() => {
    const ownNames = new Set(ownMatches.map((m) => m.huntName.toLowerCase()));
    const list = sortByFullMatch(
      matchHuntsByMonsters(newMonsters, communityGroups).filter(
        (m) => !ownNames.has(m.huntName.toLowerCase()),
      ),
    ).map((m) => ({ ...m, suspicious: community.suspicious.has(m.huntName.toLowerCase()) }));
    // Nomes suspeitos vão para o fim da lista.
    return [...list].sort((a, b) => Number(a.suspicious) - Number(b.suspicious));
  }, [newMonsters, communityGroups, ownMatches, community.suspicious]);

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
  const killCount = (h: { kills: { count: number }[] }) => h.kills.reduce((a, k) => a + k.count, 0);
  // Modo Solo: bloco Hunting Analyser exatamente como sempre foi. Modo Grupo: o bloco é o SEU
  // analyser (opcional) e o texto da party colado nele é recusado.
  const huntingIsParty = groupMode
    ? !!huntingText && (looksLikePartyText(huntingText) || looksLikeRubinotPartyHunt(huntingText))
    : !!huntingText && looksLikePartyText(huntingText);
  const huntingStatus: SlotStatus = !huntingText
    ? "empty"
    : groupMode
      ? parsed.personal
        ? "ok"
        : "error"
      : parsed.hunting && durationOk && !huntingIsParty
        ? "ok"
        : "error";
  // Modo Grupo: resumo do bloco do seu Hunting Analyser (a sessão em si vem da party).
  const personalSummary = parsed.personal
    ? `${fmtDuration(parsed.personal.durationSec)} · ${fmtNum(killCount(parsed.personal))} kills · ${fmtGold(parsed.personal.balance)}`
    : undefined;
  const huntingSummary =
    parsed.hunting && durationOk
      ? groupMode
        ? `${fmtDuration(parsed.hunting.durationSec)} · party de ${party?.size ?? "?"}` +
          (parsed.personal ? ` · ${fmtNum(killCount(parsed.hunting))} kills` : "")
        : `${fmtDuration(parsed.hunting.durationSec)} · ${fmtNum(parsed.hunting.kills.reduce((a, k) => a + k.count, 0))} kills · ${fmtGold(parsed.hunting.balance)}`
      : undefined;
  const huntingMessage = groupMode
    ? huntingIsParty
      ? "Esse é o Party Hunt Analyser — cole ele no bloco Party Hunt Analyser."
      : "Não reconheci esse bloco ou a duração. Copie o Hunt Analyser completo, com \"Session data: From ... to ...\" e \"Session length\"."
    : huntingIsParty
    ? "Esse é o Party Hunt Analyser — hunt em grupo é registrada no Modo Grupo (alternador no topo)."
    : !parsed.hunting
    ? "Não reconheci esse bloco. Copie o Hunt Analyser completo do jogo."
    : "Duração não identificada. O texto precisa incluir \"Session data: From ... to ...\" e \"Session length\".";
  // Modo Grupo: Hunting Analyser pessoal é opcional, mas colado quebrado não salva (perderia a XP sem aviso).
  const personalBroken = groupMode && !!huntingText.trim() && !parsed.personal;
  // Duração da sessão = a da party; avisa se o seu analyser for de outra janela de tempo.
  const partyDurationMismatch =
    groupMode && parsed.personal && parsed.hunting
      ? Math.abs(parsed.hunting.durationSec - parsed.personal.durationSec) > 15 * 60
      : false;

  // Raw XP ou XP com bônus negativa normalmente só acontece por um motivo: uma
  // morte durante a sessão. O valor observado já É a perda líquida — não
  // precisa pedir level, bênçãos ou promoted pra recalcular nada.
  const detectedDeathLoss = parsed.hunting ? detectDeathLoss(parsed.hunting) : null;
  const willRegisterDeath = detectedDeathLoss != null && !deathOptOut;

  const bountyPreyOn = !groupMode || !!parsed.personal;
  const canSave = Boolean(
    parsed.hunting &&
      durationOk &&
      !huntingIsParty &&
      !personalBroken &&
      effectiveCharId &&
      selectedHuntName &&
      partyReady &&
      (!bountyPreyOn || (bountyReady && preyReady)),
  );

  // Modo Grupo sem o seu Hunting Analyser: sem Bounty e Prey (sem XP/criaturas no analyser da
  // party). Modo Solo: sem Grupo.
  const skipSteps = groupMode ? (bountyPreyOn ? [] : [2, 3]) : [1];
  const stepNext = (s: number) => {
    let n = s + 1;
    while (skipSteps.includes(n)) n++;
    return n;
  };
  const stepBack = (s: number) => {
    let n = s - 1;
    while (n > 0 && skipSteps.includes(n)) n--;
    return n;
  };

  const stepOk = [
    Boolean(selectedHuntName),
    partyReady,
    bountyAnswer !== null && bountyReady,
    preyAnswer !== null && preyReady,
    true,
    true,
  ];

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!canSave || !parsed.hunting) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Idempotent by name — reuses the existing hunt row if one already matches.
      await addHunt(effectiveCharId, selectedHuntName);
      // Não dá pra separar quanto foi caça e quanto foi a morte no campo que
      // fechou negativo — zeramos só esse(s) campo(s) pros fins de Raw XP/h
      // (nem soma nem subtrai a média do spot; o outro campo, se já positivo,
      // fica intacto) e a perda em si vira um registro à parte.
      const correctedHunting = willRegisterDeath
        ? {
            ...parsed.hunting,
            rawXp: Math.max(0, parsed.hunting.rawXp),
            xpGain: Math.max(0, parsed.hunting.xpGain),
            rawXpPerHour: Math.max(0, parsed.hunting.rawXpPerHour),
            xpPerHour: Math.max(0, parsed.hunting.xpPerHour),
          }
        : parsed.hunting;
      // Em party com o Party Hunt Analyser: o lucro salvo é a parte do usuário na divisão.
      const split = applyPartySplit(
        correctedHunting,
        hasParty && party
          ? {
              ...party,
              ...(parsed.personal ? {} : { noHuntingAnalyser: true }),
              ...(durationFix ? { sessionSec: durationFix } : {}),
            }
          : null,
      );
      const created = await addSession({
        characterId: effectiveCharId,
        huntName: selectedHuntName,
        hunting: split.hunting,
        party: split.party,
        damage: parsed.damage,
        misc: parsed.misc,
        gearUrl: null,
        isPublic,
        bounty: bountyPreyOn && hasBounty ? bountyFromDraft(bountyDraft) : null,
        prey: bountyPreyOn && hasPrey ? prey : null,
        setup: normalizeSetup(setup),
        notes: notes.trim() || null,
      });

      if (willRegisterDeath && detectedDeathLoss != null) {
        try {
          await addDeath({
            characterId: effectiveCharId,
            sessionId: created.id,
            level: currentLevel(levelSnapshots, effectiveCharId),
            blessings: 0,
            promoted: false,
            xpLost: Math.round(detectedDeathLoss),
            note: `Detectada automaticamente na hunt "${selectedHuntName}" (XP negativa no Hunting Analyser)`,
          });
        } catch (e) {
          // A sessão já foi salva — a morte é só um complemento, não bloqueia o fluxo.
          toast.error("Sessão salva, mas falhou ao registrar a morte", { description: errorMessage(e) });
        }
      }

      navigate({ to: "/sessions/$id", params: { id: created.id } });
    } catch (e) {
      setSaveError(errorMessage(e));
      setSaving(false);
    }
  };


  // Bloco do Party Hunt Analyser: 2º no Modo Grupo (recomendado), último no Solo.
  const partyParsed =
    !!party && (!!party.members?.length || !!party.own || party.splitterShare != null);
  const partyShareNow = partyParsed ? selfShare(party) : null;
  const partySlot = (
    <PasteSlot
      label="Party Hunt Analyser"
      help={PARTY_COPY_HELP}
      value={partyText}
      onChange={applyPartyText}
      status={partyText ? (partyParsed ? "ok" : "error") : "empty"}
      expect="party"
      onPasteEvent={handlePasteEvent}
      onPasteBtn={handleClipboardButton}
      summary={
        partyParsed && party
          ? party.own
            ? `${fmtDuration(party.sessionSec ?? 0)} · balance ${fmtGold(party.own.balance)} · informe o tamanho da party no passo Grupo`
            : `Party de ${party.size}` +
            (partyShareNow != null
              ? ` · sua parte ${fmtGold(partyShareNow)}`
              : " · escolha quem é você no passo Grupo")
          : undefined
      }
      message='Não reconheci. Use "Copy to Clipboard" na janela Party Hunt.'
    />
  );

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
        <h1 className="mt-1 font-brand text-3xl font-bold">Nova sessão de hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dê <kbd className="rounded border border-border/70 bg-background/60 px-1 text-[11px]">Ctrl</kbd>
          <span className="mx-px">+</span>
          <kbd className="rounded border border-border/70 bg-background/60 px-1 text-[11px]">V</kbd> em
          qualquer lugar da tela — o sistema identifica o bloco e encaixa no lugar certo.
        </p>
        {groupMode ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Users className="mt-0.5 h-3.5 w-3.5 flex-none text-rubi-blue" />
            Modo Grupo: o lucro salvo é a sua parte da divisão do Party Hunt Analyser (ou do resultado
            do LootSplitter), igual ao LootSplitter do jogo. Cole também o seu Hunting Analyser
            (opcional) pra guardar XP/h e monstros/h — a duração da sessão é a da party.
          </p>
        ) : (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Skull className="mt-0.5 h-3.5 w-3.5 flex-none text-rubi-danger/70" />
            Se você morreu durante a hunt, cole o Hunting Analyser logo em seguida — antes de caçar mais, senão a
            Raw XP pode voltar a ficar positiva e o sistema não consegue detectar a morte.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {groupMode && partySlot}
          <PasteSlot
            label="Hunting Analyser"
            help={
              groupMode
                ? "O SEU Hunt Analyser: XP, monstros e itens da sessão (o lucro continua vindo da party)."
                : "Cole aqui o bloco do Hunt Analyser (obrigatório)."
            }
            value={huntingText}
            onChange={setHuntingText}
            status={huntingStatus}
            expect="hunting"
            onPasteEvent={handlePasteEvent}
            onPasteBtn={handleClipboardButton}
            summary={groupMode ? personalSummary : huntingSummary}
            message={huntingMessage}
            optional={groupMode}
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
          {parsed.hunting && (!groupMode || parsed.personal) && (
            <div className="card-surface p-5">
              <h3 className="mb-3 text-sm font-semibold">Preview</h3>
              {groupMode && (
                <p className="-mt-1.5 mb-3 text-xs text-muted-foreground">
                  Duração e lucro da party (sua linha, antes da divisão); XP e kills do seu Hunting
                  Analyser, por hora na duração da party.
                </p>
              )}
              {partyDurationMismatch && parsed.personal && (
                <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 p-2 text-[11px] text-rubi-gold">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 flex-none" />
                  A party durou {fmtDuration(parsed.hunting.durationSec)} e o seu Hunting Analyser{" "}
                  {fmtDuration(parsed.personal.durationSec)} — confira se são da mesma hunt (resete os
                  dois juntos no começo).
                </p>
              )}
              <div className="mb-3">
                <DurationAdjust
                  originalSec={parsedRaw.hunting?.durationSec ?? parsed.hunting.durationSec}
                  value={durationFix}
                  onChange={setDurationFix}
                />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <PreviewRow
                  label="Raw XP"
                  value={fmtNum(parsed.hunting.rawXp)}
                  positive={parsed.hunting.rawXp >= 0}
                />
                <PreviewRow label="Raw XP/h" value={fmtNum(parsed.hunting.rawXpPerHour || parsed.hunting.rawXp / (parsed.hunting.durationSec / 3600 || 1))} />
                {groupMode && (
                  <PreviewRow
                    label="Kills/h"
                    value={fmtNum(killCount(parsed.hunting) / (parsed.hunting.durationSec / 3600 || 1))}
                  />
                )}

                <PreviewRow label="Loot" value={fmtGold(parsed.hunting.loot)} />
                <PreviewRow label="Supplies" value={fmtGold(parsed.hunting.supplies)} />
                <PreviewRow
                  label="Balance"
                  value={fmtGold(parsed.hunting.balance)}
                  positive={parsed.hunting.balance >= 0}
                />
                <PreviewRow label="Kills" value={fmtNum(parsed.hunting.kills.reduce((a, k) => a + k.count, 0))} />
              </dl>

              {detectedDeathLoss != null && (
                <div
                  className={
                    "mt-3 rounded-lg border p-2.5 text-xs " +
                    (willRegisterDeath
                      ? "border-rubi-danger/40 bg-rubi-danger/5 text-rubi-danger"
                      : "border-border/60 bg-background/40 text-muted-foreground")
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <Skull className="h-3.5 w-3.5 flex-none" />
                      {willRegisterDeath ? (
                        <>
                          Detectamos uma morte nesta sessão: <strong>{fmtNum(detectedDeathLoss)} XP</strong> perdida,
                          registrada automaticamente.
                        </>
                      ) : (
                        "Essa morte não vai ser registrada nesta sessão."
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeathOptOut((v) => !v)}
                      className="flex-none rounded-md border px-2 py-1 font-semibold opacity-80 hover:opacity-100"
                    >
                      {willRegisterDeath ? "Não foi uma morte" : "Foi uma morte, registrar"}
                    </button>
                  </div>
                  {willRegisterDeath && (
                    <p className="mt-1.5 opacity-80">
                      O valor que ficou negativo é zerado nessa sessão (não dá pra saber quanto foi caça e quanto
                      foi a morte) — a perda em si fica registrada em{" "}
                      <strong className="text-foreground">Meu rendimento → Mortes</strong>.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


        <div className="space-y-4">
          <div className="card-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-rubi-gold" />
                Nova sessão
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

            {!parsed.hunting ? (
              groupMode ? (
                <p className="text-sm text-muted-foreground">
                  Cole o <b className="text-foreground">Party Hunt Analyser</b> — no jogo, janela
                  Party Hunt → botão direito → "Copy to Clipboard". Hunting, Input e Miscellaneous
                  são opcionais.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cole o <b className="text-foreground">Hunting Analyser</b> (obrigatório). Input e
                  Miscellaneous são opcionais.
                </p>
              )
            ) : !durationOk ? (
              <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                Não foi possível identificar a duração da sessão. Cole o Hunting Analyser completo,
                incluindo as linhas "Session data: From ... to ..." e "Session length: HH:MMh".
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {groupMode
                    ? parsed.personal
                      ? "Party Hunt e Hunting Analyser prontos. Agora é só configurar: nome da hunt, quem é você na party, Bounty Task, Prey e, se quiser, setup, level e equipamento."
                      : "Party Hunt Analyser pronto. Agora é só configurar: nome da hunt, quem é você na party e, se quiser, setup, level e equipamento. Sem o seu Hunting Analyser a sessão fica sem XP e monstros."
                    : "Hunting Analyser pronto. Agora é só configurar: nome da hunt, Bounty Task, Prey e, se quiser, level e equipamento."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setWizardOpen(true);
                  }}
                  className="group/save relative mt-4 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-rubi-gold via-rubi-gold to-rubi-blue px-4 py-3 font-display text-sm font-bold uppercase tracking-wider text-background shadow-glow-gold transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" /> Adicionar sessão
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog open={wizardOpen} onOpenChange={(o) => !saving && setWizardOpen(o)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto overflow-x-hidden sm:max-w-4xl [&>*]:min-w-0">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar sessão</DialogTitle>
            <DialogDescription>
              {activeChar?.name}
              {huntingSummary ? ` · ${huntingSummary}` : ""}
            </DialogDescription>
          </DialogHeader>

          <WizardSteps step={step} skip={skipSteps} onJump={(i) => i < step && setStep(i)} />

          {step === 0 && (
            <div>
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
                          const full = m.total > 0 && m.shared >= m.total && !m.suspicious;
                          return (
                            <button
                              key={m.huntName}
                              type="button"
                              onClick={() => pickHunt(m.huntName)}
                              title={
                                m.suspicious
                                  ? "Esse nome apareceu só uma vez e o andar difere dos mais usados — pode ser erro de digitação."
                                  : undefined
                              }
                              className={
                                "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left transition-all active:scale-95 " +
                                (m.suspicious
                                  ? "border-dashed border-amber-500/50 bg-amber-500/[0.06] opacity-70 hover:opacity-100"
                                  : full
                                    ? "border-rubi-gold/70 bg-rubi-gold/10 hover:border-rubi-gold hover:bg-rubi-gold/20"
                                    : "border-border/60 bg-background/40 hover:border-rubi-blue/60 hover:bg-rubi-blue/10")
                              }
                            >
                              {full && <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />}
                              {m.suspicious && (
                                <AlertTriangle className="h-3.5 w-3.5 flex-none text-amber-400" />
                              )}
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
                              {m.suspicious && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                                  nome suspeito
                                </span>
                              )}
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
            </div>
          )}

          {step === 1 && groupMode && (
            <PartyEditor
              fixed
              value={party}
              onChange={(p) => p && setParty(p)}
              charName={activeChar?.name ?? null}
              personalBalance={parsed.personal?.balance ?? parsed.hunting?.balance ?? 0}
              personalDurationSec={parsed.personal?.durationSec}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <YesNo
                icon={Trophy}
                question="Essa sessão teve Bounty Task?"
                hint="A XP da recompensa da task entra no Hunting Analyser — separamos ela da Raw XP da hunt."
                value={bountyAnswer}
                onChange={(v) => {
                  setBountyAnswer(v);
                  if (v === "no") setStep(3);
                }}
              />
              {hasBounty && (
                <BountyTaskPanel
                  creatures={(parsed.hunting?.kills ?? []).slice().sort((a, b) => b.count - a.count)}
                  value={bountyDraft}
                  onChange={setBountyDraft}
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <YesNo
                icon={Crosshair}
                question="Usou Prey nessa sessão?"
                hint="Prey aumenta XP, loot, dano ou defesa — marcar ajuda a comparar sessões com e sem bônus."
                value={preyAnswer}
                onChange={(v) => {
                  setPreyAnswer(v);
                  if (v === "no") setStep(4);
                }}
              />
              {hasPrey && (
                <PreyPicker
                  inline
                  creatures={(parsed.hunting?.kills ?? [])
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((k) => k.name)}
                  value={prey}
                  onChange={(next, valid) => {
                    setPrey(next);
                    setPreyValid(valid);
                  }}
                />
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">
                <b className="text-foreground">Opcional.</b> Arma, skills, Wheel, postura e Runas de
                Charm que você usou — aparece na comparação de sessões e, se a sessão for pública, na
                Comunidade. Pode pular.
              </p>
              <SessionSetupPanel
                value={setup}
                onChange={setSetup}
                vocation={setupVocation(activeChar?.vocation)}
                characterId={effectiveCharId || null}
                creatures={(parsed.hunting?.kills ?? [])
                  .slice()
                  .sort((a, b) => b.count - a.count)
                  .map((k) => k.name)}
                activatedCharms={charmsFromMisc(parsed.misc)}
              />
            </div>
          )}

          {step === 5 && (
            <div>
              <div className="mb-4 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5 text-rubi-gold" /> {selectedHuntName}
                </span>
                {hasParty && party && (
                  <PartyBadge size={party.size} split={!!party.members && !!party.self} />
                )}
                {hasBounty && bountyFromDraft(bountyDraft) && (
                  <BountyBadge bounty={bountyFromDraft(bountyDraft)!} />
                )}
                {hasPrey && prey && <PreyBadge prey={prey} detailed />}
                {normalizeSetup(setup) && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rubi-blue/40 bg-rubi-blue/10 px-2.5 py-1 font-semibold text-rubi-blue">
                    <Wrench className="h-3.5 w-3.5" /> Setup registrado
                  </span>
                )}
              </div>
            {activeChar && (
              <div className="relative mb-4 overflow-hidden rounded-xl border border-rubi-gold/45 bg-gradient-to-br from-rubi-gold/[0.12] via-rubi-gold/[0.04] to-transparent p-4 shadow-glow-gold">
                <Swords className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 rotate-12 text-rubi-gold/[0.07]" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-xl border border-rubi-gold/50 bg-background/70">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Lvl
                      </span>
                      <span className="font-display text-lg font-bold leading-none tabular-nums text-rubi-gold">
                        {activeCharLevel ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-display text-sm font-bold uppercase tracking-wider text-rubi-gold">
                        Level de {activeChar.name}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activeCharLevel == null
                          ? "Ainda não registramos o level — preencha aqui, sem ir em Meu rendimento."
                          : "Subiu de level na hunt? Atualize aqui — alimenta o Meu rendimento."}
                      </p>
                    </div>
                  </div>
                  {/* key força remontar ao trocar de personagem — sem isso o input ficava com o
                      valor (e o level) do personagem anterior mesmo depois da troca. */}
                  <LevelQuickAdd
                    key={effectiveCharId}
                    size="lg"
                    characterId={effectiveCharId}
                    currentLevel={activeCharLevel}
                  />
                </div>
              </div>
            )}
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <StickyNote className="h-3.5 w-3.5 text-rubi-gold" /> Observação
                  <span className="font-normal normal-case tracking-normal">(opcional)</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Só você vê — nunca vai pra Comunidade.</span>
              </div>
              <NotesEditor value={notes} onChange={setNotes} />
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
                vocação, hunt e equipamento ficam visíveis pra qualquer pessoa, mesmo sem conta).
              </span>
            </label>
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
                  ? groupMode
                    ? "Cole o Party Hunt Analyser para continuar."
                    : "Cole o Hunting Analyser para continuar."
                  : !partyReady
                    ? "Escolha quem é você na party (passo Grupo)."
                  : personalBroken
                    ? "Não reconheci o seu Hunting Analyser — cole o bloco completo ou apague ele."
                  : !durationOk
                    ? "Não foi possível identificar a duração da sessão. Cole o Hunting Analyser completo, incluindo as linhas \"Session data: From ... to ...\" e \"Session length: HH:MMh\"."
                    : !selectedHuntName
                      ? "Dê um nome à hunt."
                      : !preyReady
                        ? "Escolha o bônus de cada prey marcada."
                        : "Selecione a dificuldade e o tipo da Bounty Task."}
              </p>
            )}
              <button
                type="button"
                onClick={() => setStep(4)}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                ← Voltar
              </button>
            </div>
          )}

          {step < 5 && (
            <DialogFooter className="gap-2 sm:justify-between">
              <button
                type="button"
                onClick={() => (step === 0 ? setWizardOpen(false) : setStep(stepBack(step)))}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {step === 0 ? "Cancelar" : "Voltar"}
              </button>
              <button
                type="button"
                disabled={!stepOk[step]}
                onClick={() => setStep(stepNext(step))}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rubi-blue px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                {step === 4 && !normalizeSetup(setup) ? "Pular" : "Próximo"}{" "}
                <ChevronRight className="h-4 w-4" />
              </button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

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
  recommended = false,
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
  /** Opcional, mas destacado (ex.: Party Hunt Analyser no Modo Grupo). */
  recommended?: boolean;
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
            {recommended ? (
              <span className="flex-none rounded-full border border-rubi-blue/50 bg-rubi-blue-soft px-2 py-px text-[10px] font-semibold uppercase tracking-wider text-rubi-blue">
                recomendado
              </span>
            ) : optional ? (
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

const WIZARD_STEPS = ["Hunt", "Grupo", "Bounty Task", "Prey", "Setup", "Finalizar"];

function WizardSteps({
  step,
  skip,
  onJump,
}: {
  step: number;
  skip: number[];
  onJump: (i: number) => void;
}) {
  const shown = WIZARD_STEPS.map((label, i) => ({ label, i })).filter(({ i }) => !skip.includes(i));
  return (
    <ol
      className="mb-2 grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${shown.length}, minmax(0, 1fr))` }}
    >
      {shown.map(({ label, i }, n) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onJump(i)}
            disabled={i >= step}
            className="w-full text-left disabled:cursor-default"
          >
            <span
              className={
                "block h-1 rounded-full " +
                (i < step ? "bg-rubi-gold" : i === step ? "bg-rubi-blue" : "bg-muted")
              }
            />
            <span
              className={
                "mt-1 block truncate text-[11px] font-semibold " +
                (i === step ? "text-foreground" : "text-muted-foreground")
              }
            >
              {n + 1}. {label}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function YesNo({
  icon: Icon,
  question,
  hint,
  value,
  onChange,
}: {
  icon: typeof Trophy;
  question: string;
  hint: string;
  value: "yes" | "no" | null;
  onChange: (v: "yes" | "no") => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-none text-rubi-gold" />
        <div className="min-w-0">
          <div className="font-display text-base font-bold">{question}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(["yes", "no"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={
              "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors " +
              (value === v
                ? v === "yes"
                  ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                  : "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                : "border-border text-muted-foreground hover:border-rubi-blue/50 hover:text-foreground")
            }
          >
            {v === "yes" ? "Sim" : "Não"}
          </button>
        ))}
      </div>
    </div>
  );
}
