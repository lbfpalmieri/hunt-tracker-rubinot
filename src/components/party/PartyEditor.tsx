import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardPaste,
  Copy,
  Crown,
  Minus,
  Plus,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { fmtDuration, fmtGold } from "@/lib/format";
import { parseGoldInput } from "@/lib/rc-calc";
import {
  PARTY_MAX,
  PARTY_MIN,
  computeSplit,
  partyFromText,
  partyTransfers,
  selfShare,
  transferCommand,
  type PartyInfo,
  type PartyMember,
  type PartyTransfer,
} from "@/lib/party";

interface Props {
  value: PartyInfo | null;
  onChange: (p: PartyInfo | null) => void;
  /** Nome do personagem — acha "você" entre os membros sozinho. */
  charName: string | null;
  /** Balance do Hunting Analyser PESSOAL, pra mostrar o antes/depois da divisão. */
  personalBalance: number;
  /** Duração do Hunting Analyser pessoal — avisa se o da party for de outra sessão. */
  personalDurationSec?: number;
  /** Modo Grupo (Nova sessão): a party é obrigatória — sem "Foi solo" nem "Trocar". */
  fixed?: boolean;
}

/** Como copiar no jogo — o "Copy to LootSplitter" não copia nada (só abre a janela do cliente). */
export const PARTY_COPY_HELP =
  'No jogo: janela Party Hunt → botão direito → "Copy to Clipboard". Também aceita o resultado copiado da janela LootSplitter.';

/**
 * Hunt em grupo: Party Hunt Analyser (ou o resultado do LootSplitter) e a divisão igual à do
 * LootSplitter do cliente — ver party.ts. Controlado; quem salva aplica com applyPartySplit.
 */
export function PartyEditor({
  value,
  onChange,
  charName,
  personalBalance,
  personalDurationSec,
  fixed = false,
}: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const paste = (t: string) => {
    setText(t);
    if (!t.trim()) return setError(null);
    const p = partyFromText(t, charName);
    if (!p) {
      setError(
        'Não reconheci. Use "Copy to Clipboard" na janela Party Hunt (o "Copy to LootSplitter" não copia, só abre a janela do cliente).',
      );
      return;
    }
    setError(null);
    onChange(p);
    setText("");
  };

  if (!value) {
    return (
      <button
        type="button"
        onClick={() => onChange({ size: 2, members: null, self: null, personal: null })}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-rubi-blue/50 px-3 py-2 text-sm font-medium text-rubi-blue hover:bg-rubi-blue-soft"
      >
        <Users className="h-4 w-4" /> Foi em party
      </button>
    );
  }

  const hasData = !!value.members?.length || value.splitterShare != null;
  const durationMismatch =
    value.sessionSec && personalDurationSec
      ? Math.abs(value.sessionSec - personalDurationSec) > 15 * 60
      : false;

  return (
    <div className="space-y-3 rounded-xl border border-rubi-blue/40 bg-rubi-blue-soft/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-rubi-blue">
          <Users className="h-4 w-4" /> Hunt em grupo
          {value.lootType && (
            <span
              title={
                value.lootType === "Leader"
                  ? "O analyser da party usou os preços configurados pelo líder"
                  : "O analyser da party usou os preços do market"
              }
              className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              Preços: {value.lootType === "Leader" ? "do líder" : "market"}
            </span>
          )}
        </span>
        {!fixed && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" /> Foi solo
          </button>
        )}
      </div>

      {durationMismatch && (
        <p className="flex items-start gap-1.5 rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 p-2 text-[11px] text-rubi-gold">
          <AlertTriangle className="mt-px h-3.5 w-3.5 flex-none" />O Party Hunt Analyser é de{" "}
          {fmtDuration(value.sessionSec!)} e o seu Hunting Analyser de{" "}
          {fmtDuration(personalDurationSec!)} — confira se são da mesma hunt (resete os dois juntos
          no começo).
        </p>
      )}

      {value.members?.length ? (
        <MembersView party={value} personalBalance={personalBalance} onChange={onChange} />
      ) : value.splitterShare != null ? (
        <SplitterView party={value} personalBalance={personalBalance} charName={charName} />
      ) : (
        <SizeStepper value={value} onChange={onChange} />
      )}

      {!hasData ? (
        <>
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ClipboardPaste className="h-3.5 w-3.5" /> Party Hunt Analyser (divide o loot)
            </span>
            <textarea
              value={text}
              onChange={(e) => paste(e.target.value)}
              rows={3}
              placeholder={
                "Session data: From ...\nSession: 01:08h\nLoot Type: Leader\nLoot: ...\nFulano (Leader)\n\tLoot: ..."
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-rubi-blue"
            />
          </label>
          {error && <p className="text-xs text-rubi-danger">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            {PARTY_COPY_HELP} Sem ele a sessão só fica marcada como em grupo, sem divisão — e o
            lucro salvo fica o do seu analyser (quem não é líder normalmente fica sem loot).
          </p>
        </>
      ) : fixed ? null : (
        <button
          type="button"
          onClick={() =>
            onChange({
              ...value,
              members: null,
              self: null,
              splitterShare: null,
              splitterTransfers: null,
              lootType: null,
              sessionSec: null,
            })
          }
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Trocar o Party Hunt Analyser
        </button>
      )}
    </div>
  );
}

function SizeStepper({ value, onChange }: { value: PartyInfo; onChange: (p: PartyInfo) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Jogadores na party</span>
      <div className="inline-flex items-center gap-1">
        <StepBtn
          label="Menos"
          disabled={value.size <= PARTY_MIN}
          onClick={() => onChange({ ...value, size: value.size - 1 })}
        >
          <Minus className="h-3.5 w-3.5" />
        </StepBtn>
        <span className="w-8 text-center font-display text-lg font-bold">{value.size}</span>
        <StepBtn
          label="Mais"
          disabled={value.size >= PARTY_MAX}
          onClick={() => onChange({ ...value, size: value.size + 1 })}
        >
          <Plus className="h-3.5 w-3.5" />
        </StepBtn>
      </div>
    </div>
  );
}

function MembersView({
  party,
  personalBalance,
  onChange,
}: {
  party: PartyInfo;
  personalBalance: number;
  onChange: (p: PartyInfo) => void;
}) {
  const members = party.members!;
  const [adjusting, setAdjusting] = useState(
    members.some((m) => m.removed || (m.extraCost ?? 0) !== 0),
  );
  const split = computeSplit(members);
  const share = selfShare(party);
  const self = members.find((m) => m.name === party.self);
  const setMember = (name: string, patch: Partial<PartyMember>) =>
    onChange({
      ...party,
      members: members.map((m) => (m.name === name ? { ...m, ...patch } : m)),
    });

  return (
    <>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Qual desses é você?{" "}
            {!party.self && <span className="text-rubi-gold">— toque no seu personagem</span>}
          </span>
          <button
            type="button"
            onClick={() => setAdjusting((v) => !v)}
            className={
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] " +
              (adjusting
                ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            <SlidersHorizontal className="h-3 w-3" /> Ajustes
          </button>
        </div>
        <ul className="space-y-1">
          {members.map((m) => {
            const on = m.name === party.self;
            return (
              <li key={m.name}>
                <div
                  className={
                    "rounded-lg border transition-colors " +
                    (m.removed
                      ? "border-border/50 bg-background/30 opacity-60"
                      : on
                        ? "border-rubi-blue bg-rubi-blue-soft"
                        : "border-border bg-background/60 hover:border-rubi-blue/50")
                  }
                >
                  <button
                    type="button"
                    onClick={() => onChange({ ...party, self: m.name })}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-sm"
                  >
                    {m.leader ? (
                      <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" aria-label="Líder" />
                    ) : (
                      <span className="w-3.5 flex-none" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {m.name}
                      {on && <span className="ml-1.5 text-[10px] text-rubi-blue">(você)</span>}
                      {m.removed && (
                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                          fora da divisão
                        </span>
                      )}
                    </span>
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      loot {fmtGold(m.loot)} · supplies {fmtGold(m.supplies)}
                    </span>
                    <span
                      className={
                        "w-16 text-right text-xs font-semibold " +
                        (m.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                      }
                    >
                      {fmtGold(m.balance)}
                    </span>
                  </button>
                  {adjusting && (
                    <div className="flex flex-wrap items-center gap-2 border-t border-border/50 px-2.5 py-1.5 text-[11px]">
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        Gasto extra
                        <input
                          inputMode="decimal"
                          defaultValue={m.extraCost ? String(m.extraCost) : ""}
                          onBlur={(e) =>
                            setMember(m.name, {
                              extraCost: e.target.value.trim()
                                ? (parseGoldInput(e.target.value) ?? 0)
                                : 0,
                            })
                          }
                          placeholder="0"
                          className="w-20 rounded border border-border bg-background px-1.5 py-0.5 text-right outline-none focus:border-rubi-blue"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={!!m.removed}
                          onChange={(e) => setMember(m.name, { removed: e.target.checked })}
                          className="h-3.5 w-3.5 accent-[var(--rubi-blue)]"
                        />
                        Fora da divisão
                      </label>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {adjusting && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Igual ao "Advanced" do LootSplitter do jogo: gasto extra (ex. quem pagou imbuement,
            bless ou boost da pt) entra na divisão; "fora da divisão" tira o membro da conta.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <MiniBox label="Balance da party" value={split.total} />
        <MiniBox label="Seu analyser" value={self ? self.balance : personalBalance} />
        <MiniBox label="Sua parte" value={share} highlight />
      </div>

      <Transfers transfers={split.transfers} self={party.self} />
    </>
  );
}

function SplitterView({
  party,
  personalBalance,
  charName,
}: {
  party: PartyInfo;
  personalBalance: number;
  charName: string | null;
}) {
  return (
    <>
      <p className="text-[11px] text-muted-foreground">
        Resultado do LootSplitter do jogo · party de {party.size}. Pra ver cada membro e ajustar,
        cole o Party Hunt Analyser ("Copy to Clipboard").
      </p>
      <div className="grid grid-cols-2 gap-2 text-center">
        <MiniBox label="Seu analyser" value={personalBalance} />
        <MiniBox label="Sua parte" value={party.splitterShare ?? null} highlight />
      </div>
      <Transfers transfers={partyTransfers(party)} self={charName} />
    </>
  );
}

function MiniBox({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-lg border p-2 " +
        (highlight ? "border-rubi-blue/50 bg-rubi-blue-soft" : "border-border bg-background/60")
      }
    >
      <div
        className={
          "text-[10px] uppercase tracking-wider " +
          (highlight ? "text-rubi-blue" : "text-muted-foreground")
        }
      >
        {label}
      </div>
      <div
        className={
          "font-bold " +
          (value == null
            ? "text-muted-foreground"
            : value >= 0
              ? highlight
                ? "text-rubi-success"
                : "text-foreground"
              : "text-rubi-danger")
        }
      >
        {value == null ? "—" : fmtGold(value)}
      </div>
    </div>
  );
}

function Transfers({ transfers, self }: { transfers: PartyTransfer[]; self: string | null }) {
  if (!transfers.length) {
    return (
      <p className="text-[11px] text-muted-foreground">Sem transferências — já está dividido.</p>
    );
  }
  const me = (n: string) => !!self && n.toLowerCase() === self.toLowerCase();
  const copy = async (t: PartyTransfer) => {
    try {
      await navigator.clipboard.writeText(transferCommand(t));
      toast.success("Comando copiado", {
        description: `Fale no NPC do banco: ${transferCommand(t)}`,
      });
    } catch {
      toast.error("Não consegui copiar");
    }
  };
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        Transferências no banco (como o LootSplitter do jogo)
      </div>
      <ul className="space-y-1 text-xs">
        {transfers.map((t) => {
          const mine = me(t.from) || me(t.to);
          return (
            <li
              key={t.from + t.to}
              className={
                "flex items-center gap-1.5 rounded-md px-1.5 py-1 " +
                (mine ? "bg-rubi-blue-soft" : "")
              }
            >
              <span className={"truncate " + (me(t.from) ? "font-semibold text-rubi-blue" : "")}>
                {me(t.from) ? "Você" : t.from}
              </span>
              <ArrowRight className="h-3 w-3 flex-none text-muted-foreground" />
              <span className={"truncate " + (me(t.to) ? "font-semibold text-rubi-blue" : "")}>
                {me(t.to) ? "você" : t.to}
              </span>
              <span className="ml-auto font-semibold text-rubi-gold">{fmtGold(t.amount)}</span>
              <button
                type="button"
                onClick={() => copy(t)}
                title={transferCommand(t)}
                aria-label={`Copiar "${transferCommand(t)}"`}
                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Copy className="h-3 w-3" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepBtn({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background hover:bg-accent disabled:opacity-40"
    >
      {children}
    </button>
  );
}
