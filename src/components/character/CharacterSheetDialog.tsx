import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BOUNTY_TALISMAN_IMAGE } from "@/lib/bounty";
import {
  EMPTY_SHEET,
  LIMITS,
  SKILLS,
  TALISMAN_BONUSES,
  loyaltyBonusPct,
  loyaltyTitle,
  normalizeSheet,
  talismanPct,
  useCharacterSheets,
  useSaveCharacterSheet,
  type CharacterSheet,
} from "@/lib/character-sheet";
import { CHARM_RULES, type CharmKind, type CharmLevel } from "@/lib/charm-optimizer";
import { errorMessage } from "@/lib/errors";
import { charmIcon } from "@/lib/session-setup";

/**
 * Ficha do personagem: skills base, Loyalty, Bounty Talisman e os charms com o nível de cada um
 * (sugestões de Balosin e Yin Sylvan). O Otimizador de charms lê os charms daqui.
 */
export function CharacterSheetDialog({
  characterId,
  characterName,
  open,
  onOpenChange,
}: {
  characterId: string;
  characterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const sheets = useCharacterSheets();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-brand">Ficha de {characterName}</DialogTitle>
          <DialogDescription>
            Skills base, Loyalty, Bounty Talisman e os charms que você tem. O Otimizador de charms
            usa os charms marcados aqui.
          </DialogDescription>
        </DialogHeader>
        {sheets.isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Carregando a ficha...</p>
        ) : (
          <SheetForm
            key={characterId}
            characterId={characterId}
            initial={sheets.data?.[characterId] ?? EMPTY_SHEET}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const field =
  "mt-1 min-h-11 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm font-display tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const toText = (n: number | null | undefined) => (n == null ? "" : String(n));

function SheetForm({
  characterId,
  initial,
  onDone,
}: {
  characterId: string;
  initial: CharacterSheet;
  onDone: () => void;
}) {
  const save = useSaveCharacterSheet();
  const [skills, setSkills] = useState<Record<string, string>>(() =>
    Object.fromEntries(SKILLS.map((s) => [s.key, toText(initial.skills[s.key])])),
  );
  const [loyalty, setLoyalty] = useState(toText(initial.loyalty));
  const [talisman, setTalisman] = useState<Record<string, string>>(() =>
    Object.fromEntries(TALISMAN_BONUSES.map((b) => [b.key, toText(initial.talisman[b.key])])),
  );
  const [charms, setCharms] = useState<CharacterSheet["charms"]>(initial.charms);
  const [error, setError] = useState<string | null>(null);

  const loyaltyPts = Number(loyalty) || 0;
  const title = loyaltyTitle(loyaltyPts);
  const ownedCount = (kind: CharmKind) =>
    CHARM_RULES.filter((r) => r.kind === kind && charms[r.name]).length;

  const setCharm = (name: string, lvl: CharmLevel | null) =>
    setCharms((cur) => {
      const next = { ...cur };
      if (lvl) next[name] = lvl;
      else delete next[name];
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const sheet = normalizeSheet({ skills, loyalty, talisman, charms });
    try {
      await save.mutateAsync({ characterId, sheet });
      toast.success("Ficha salva", {
        description: "O Otimizador de charms já usa os charms novos.",
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <section>
        <SectionTitle>Skills base</SectionTitle>
        <p className="text-xs text-muted-foreground">
          Sem bônus de equipamento. Deixe em branco o que não usa.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SKILLS.map((s) => (
            <label key={s.key} className="block">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={s.key === "magic" ? LIMITS.magic : LIMITS.skill}
                value={skills[s.key]}
                onChange={(e) => setSkills((cur) => ({ ...cur, [s.key]: e.target.value }))}
                className={field}
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Loyalty</SectionTitle>
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Pontos</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={LIMITS.loyalty}
              value={loyalty}
              onChange={(e) => setLoyalty(e.target.value)}
              className={field}
            />
          </label>
          <p className="pb-2.5 text-xs text-muted-foreground">
            {loyalty === "" ? (
              "1 ponto por dia de premium."
            ) : (
              <>
                <span className="font-semibold text-rubi-gold">
                  +{loyaltyBonusPct(loyaltyPts)}%
                </span>{" "}
                nos pontos de skill{title ? ` · ${title}` : ""}
              </>
            )}
          </p>
        </div>
      </section>

      <section>
        <SectionTitle>
          <img src={BOUNTY_TALISMAN_IMAGE} alt="" className="h-6 w-6" />
          Bounty Talisman
        </SectionTitle>
        <p className="text-xs text-muted-foreground">
          Nível de cada melhoria (0,5% por nível até o 20, depois 0,25%). Só vale com o talismã
          equipado.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TALISMAN_BONUSES.map((b) => {
            const lvl = Number(talisman[b.key]) || 0;
            return (
              <label key={b.key} className="block">
                <span className="text-xs font-medium text-muted-foreground">
                  {b.label}
                  {lvl > 0 && (
                    <span className="ml-1 font-semibold text-rubi-gold">
                      = {String(talismanPct(lvl)).replace(".", ",")}%
                    </span>
                  )}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={LIMITS.talisman}
                  placeholder="Nível"
                  value={talisman[b.key]}
                  onChange={(e) => setTalisman((cur) => ({ ...cur, [b.key]: e.target.value }))}
                  className={field}
                />
              </label>
            );
          })}
        </div>
      </section>

      {(["major", "minor"] as const).map((kind) => (
        <section key={kind}>
          <SectionTitle>
            {kind === "major" ? "Charms" : "Minor charms"}
            <span className="font-display text-xs font-normal normal-case tracking-normal text-muted-foreground">
              {ownedCount(kind)} de {CHARM_RULES.filter((r) => r.kind === kind).length}
            </span>
          </SectionTitle>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {CHARM_RULES.filter((r) => r.kind === kind).map((r) => (
              <CharmRow
                key={r.name}
                name={r.name}
                level={charms[r.name] ?? null}
                onChange={(lvl) => setCharm(r.name, lvl)}
              />
            ))}
          </div>
        </section>
      ))}

      {error && (
        <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium transition-transform hover:bg-accent active:scale-[0.98]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={save.isPending}
          className="min-h-11 rounded-lg bg-rubi-blue px-4 text-sm font-semibold text-primary-foreground shadow-glow-blue transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : "Salvar ficha"}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rubi-gold">
      {children}
    </h3>
  );
}

const LEVEL_TITLE: Record<CharmLevel, string> = {
  1: "Desbloqueado (Bronze)",
  2: "Nível 2 (Prata)",
  3: "Nível 3 (Ouro)",
};

function CharmRow({
  name,
  level,
  onChange,
}: {
  name: string;
  level: CharmLevel | null;
  onChange: (lvl: CharmLevel | null) => void;
}) {
  const opts: (CharmLevel | null)[] = [null, 1, 2, 3];
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border p-1.5 pl-2 transition-colors " +
        (level ? "border-rubi-gold/50 bg-rubi-gold/5" : "border-border bg-surface/60")
      }
    >
      <img
        src={charmIcon(name)}
        alt=""
        className={"h-7 w-7 flex-none " + (level ? "" : "opacity-50 grayscale")}
      />
      <span
        className={
          "min-w-0 flex-1 truncate text-sm " +
          (level ? "font-semibold text-foreground" : "text-muted-foreground")
        }
      >
        {name}
      </span>
      <div role="group" aria-label={`Nível do ${name}`} className="flex flex-none gap-0.5">
        {opts.map((n) => (
          <button
            key={String(n)}
            type="button"
            aria-pressed={level === n}
            title={n ? LEVEL_TITLE[n] : "Não tenho"}
            aria-label={n ? `${name}: ${LEVEL_TITLE[n]}` : `${name}: não tenho`}
            onClick={() => onChange(n)}
            className={
              "min-h-10 min-w-9 rounded-md px-1.5 text-xs font-semibold transition-colors " +
              (level === n
                ? n
                  ? "bg-rubi-gold text-background shadow-glow-gold"
                  : "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground")
            }
          >
            {n ? `Nv${n}` : "—"}
          </button>
        ))}
      </div>
    </div>
  );
}
