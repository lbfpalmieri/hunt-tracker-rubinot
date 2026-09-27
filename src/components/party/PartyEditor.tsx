import { useState } from "react";
import { ArrowRight, ClipboardPaste, Crown, Minus, Plus, Users, X } from "lucide-react";
import { fmtGold } from "@/lib/format";
import {
  PARTY_MAX,
  PARTY_MIN,
  findSelf,
  parsePartyHunt,
  partyShare,
  partyTransfers,
  type PartyInfo,
  type PartyMember,
} from "@/lib/party";

interface Props {
  value: PartyInfo | null;
  onChange: (p: PartyInfo | null) => void;
  /** Nome do personagem — acha "você" entre os membros sozinho. */
  charName: string | null;
  /** Balance/supplies do Hunting Analyser PESSOAL, pra mostrar o antes/depois da divisão. */
  personalBalance: number;
}

/**
 * Hunt em grupo: tamanho da party e, opcional, o Party Hunt Analyser (divide o loot como o jogo).
 * Controlado — quem salva aplica a divisão com applyPartySplit (party.ts).
 */
export function PartyEditor({ value, onChange, charName, personalBalance }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const members = value?.members ?? null;

  const paste = (t: string) => {
    setText(t);
    if (!t.trim()) return setError(null);
    const parsed = parsePartyHunt(t);
    if (!parsed || parsed.members.length < PARTY_MIN) {
      setError("Não reconheci o Party Hunt Analyser — copie pelo botão de copiar da janela da party.");
      return;
    }
    setError(null);
    const ms = parsed.members.slice(0, PARTY_MAX);
    onChange({ size: ms.length, members: ms, self: findSelf(ms, charName), personal: null });
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

  return (
    <div className="space-y-3 rounded-xl border border-rubi-blue/40 bg-rubi-blue-soft/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-rubi-blue">
          <Users className="h-4 w-4" /> Hunt em grupo
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> Foi solo
        </button>
      </div>

      {members ? (
        <MembersView
          members={members}
          self={value.self}
          personalBalance={personalBalance}
          onSelf={(self) => onChange({ ...value, self })}
          onClear={() => onChange({ ...value, members: null, self: null })}
        />
      ) : (
        <>
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
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <ClipboardPaste className="h-3.5 w-3.5" /> Party Hunt Analyser (opcional — divide o
              loot)
            </span>
            <textarea
              value={text}
              onChange={(e) => paste(e.target.value)}
              rows={3}
              placeholder={"Session data: From ...\nLoot Type: Market\nLoot: ...\nFulano (Leader)\n\tLoot: ..."}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-rubi-blue"
            />
          </label>
          {error && <p className="text-xs text-rubi-danger">{error}</p>}
          <p className="text-[11px] text-muted-foreground">
            Sem o Party Hunt Analyser a sessão só fica marcada como em grupo. Com ele, o lucro vira a
            sua parte da divisão — mesmo que você não seja o líder e não tenha pego loot.
          </p>
        </>
      )}
    </div>
  );
}

function MembersView({
  members,
  self,
  personalBalance,
  onSelf,
  onClear,
}: {
  members: PartyMember[];
  self: string | null;
  personalBalance: number;
  onSelf: (name: string) => void;
  onClear: () => void;
}) {
  const share = partyShare(members);
  const transfers = partyTransfers(members);
  return (
    <>
      <div>
        <div className="mb-1.5 text-xs font-medium text-muted-foreground">
          Qual desses é você? {!self && <span className="text-rubi-gold">— escolha pra dividir</span>}
        </div>
        <ul className="space-y-1">
          {members.map((m) => {
            const on = m.name === self;
            return (
              <li key={m.name}>
                <button
                  type="button"
                  onClick={() => onSelf(m.name)}
                  className={
                    "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors " +
                    (on
                      ? "border-rubi-blue bg-rubi-blue-soft"
                      : "border-border bg-background/60 hover:border-rubi-blue/50")
                  }
                >
                  {m.leader ? (
                    <Crown className="h-3.5 w-3.5 flex-none text-rubi-gold" />
                  ) : (
                    <span className="w-3.5 flex-none" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {m.name}
                    {on && <span className="ml-1.5 text-[10px] text-rubi-blue">(você)</span>}
                  </span>
                  <span
                    className={
                      "text-xs font-semibold " +
                      (m.balance >= 0 ? "text-rubi-success" : "text-rubi-danger")
                    }
                  >
                    {fmtGold(m.balance)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-lg border border-border bg-background/60 p-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Seu analyser
          </div>
          <div
            className={
              "font-semibold " + (personalBalance >= 0 ? "text-foreground" : "text-rubi-danger")
            }
          >
            {fmtGold(personalBalance)}
          </div>
        </div>
        <div className="rounded-lg border border-rubi-blue/50 bg-rubi-blue-soft p-2">
          <div className="text-[10px] uppercase tracking-wider text-rubi-blue">Sua parte</div>
          <div className={"font-bold " + (share >= 0 ? "text-rubi-success" : "text-rubi-danger")}>
            {fmtGold(share)}
          </div>
        </div>
      </div>

      {transfers.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Transferências</div>
          <ul className="space-y-0.5 text-xs">
            {transfers.map((t) => (
              <li key={t.from + t.to} className="flex items-center gap-1.5">
                <span className="truncate">{t.from}</span>
                <ArrowRight className="h-3 w-3 flex-none text-muted-foreground" />
                <span className="truncate">{t.to}</span>
                <span className="ml-auto font-semibold text-rubi-gold">{fmtGold(t.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onClear}
        className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        Trocar o Party Hunt Analyser
      </button>
    </>
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
