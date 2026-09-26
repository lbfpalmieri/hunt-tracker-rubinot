import { useMemo, useState } from "react";
import { Check, ClipboardPaste, Skull } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GameIcon } from "@/components/GameIcon";
import { bossLinkedLoot, normName, type Boss, type BossCatalog } from "@/lib/boss-catalog";
import { addRun, lastPrices, type BossRotationRun } from "@/lib/boss-rotations";
import { fmtDuration, fmtGold } from "@/lib/format";
import { parseHunting, parseSessionStamp } from "@/lib/parser";
import { parseGoldInput } from "@/lib/rc-calc";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationId: string;
  bosses: Boss[];
  catalog: BossCatalog;
  characterId: string | null;
  /** Execuções anteriores — de onde vem o último preço usado pra cada item. */
  previousRuns: BossRotationRun[];
  onSaved: () => void;
}

/**
 * Registrar uma execução da rotação: cola o Hunting Analyser (o mesmo export da Nova sessão).
 * O app acha quais bosses da rotação morreram (Killed Monsters) e separa do "Looted Items" só o
 * que é loot de boss — item que a wiki diz que só cai de boss. Loot dos monstros do caminho fica
 * de fora. O analyser não diz o preço de cada item, então o usuário informa (preço do RubinOT);
 * a gente lembra o último preço usado.
 */
export function RegisterRunDialog({
  open,
  onOpenChange,
  rotationId,
  bosses,
  catalog,
  characterId,
  previousRuns,
  onSaved,
}: Props) {
  const [text, setText] = useState("");
  const [party, setParty] = useState("1");
  const [killedOverride, setKilledOverride] = useState<Set<string> | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => (text.trim() ? parseHunting(text) : null), [text]);
  const valid = !!parsed && (parsed.durationSec > 0 || parsed.loot > 0 || parsed.kills.length > 0);

  const detected = useMemo(() => {
    if (!parsed) return new Set<string>();
    const killed = new Set(parsed.kills.map((k) => normName(k.name)));
    return new Set(bosses.filter((b) => killed.has(normName(b.name))).map((b) => b.name));
  }, [parsed, bosses]);
  const killed = killedOverride ?? detected;

  const remembered = useMemo(() => lastPrices(previousRuns), [previousRuns]);
  const lines = useMemo(
    () => (parsed ? bossLinkedLoot(parsed.lootedItems, bosses, catalog) : []),
    [parsed, bosses, catalog],
  );
  const ignored = useMemo(() => {
    if (!parsed) return [];
    const linked = new Set(lines.map((l) => normName(l.name)));
    return parsed.lootedItems.filter((l) => {
      const n = normName(l.name);
      return !linked.has(n) && !linked.has(n.replace(/s$/, ""));
    });
  }, [parsed, lines]);

  /** Preço unitário: o que o usuário digitou > último usado > NPC. */
  const unitOf = (name: string, npc: number): number => {
    const typed = prices[name];
    if (typed != null) return parseGoldInput(typed) ?? 0;
    return remembered.get(name) ?? npc;
  };
  const bossLoot = lines.reduce((a, l) => a + l.count * unitOf(l.name, l.item?.npc ?? 0), 0);
  const supplies = parsed?.supplies ?? 0;
  const profit = bossLoot - supplies;

  const reset = () => {
    setText("");
    setParty("1");
    setKilledOverride(null);
    setPrices({});
  };

  const toggleKilled = (name: string) => {
    const next = new Set(killed);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setKilledOverride(next);
  };

  const save = async () => {
    if (!parsed || !valid) return;
    setSaving(true);
    try {
      const end = parseSessionStamp(parsed.endedAt);
      await addRun({
        rotationId,
        characterId,
        ranAt: new Date(end ?? Date.now()).toISOString(),
        durationSec: parsed.durationSec,
        loot: bossLoot,
        supplies,
        balance: profit,
        xp: parsed.xpGain || parsed.rawXp,
        partySize: Math.max(1, Math.min(10, Number(party) || 1)),
        bossesKilled: [...killed],
        drops: lines.map((l) => ({
          name: l.name,
          count: l.count,
          unitValue: unitOf(l.name, l.item?.npc ?? 0),
        })),
        notes: null,
      });
      toast.success("Rotação registrada");
      reset();
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-rubi-danger/40 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar rotação</DialogTitle>
          <DialogDescription>
            Abra o Hunting Analyser antes do primeiro boss e, no fim, copie o export (botão de
            copiar do analyser) e cole aqui.
          </DialogDescription>
        </DialogHeader>

        <label className="block">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ClipboardPaste className="h-3.5 w-3.5" /> Hunting Analyser
          </span>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setKilledOverride(null);
            }}
            rows={5}
            placeholder={
              "Session data: From 2026-09-26, 14:00:00 to 2026-09-26, 15:10:00\nSession: 01:10h\n..."
            }
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-rubi-danger"
          />
        </label>

        {text.trim() && !valid && (
          <p className="text-sm text-rubi-danger">
            Não reconheci esse texto como export do Hunting Analyser.
          </p>
        )}

        {parsed && valid && (
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Bosses feitos ({killed.size}/{bosses.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bosses.map((b) => {
                  const on = killed.has(b.name);
                  return (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => toggleKilled(b.name)}
                      className={
                        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors " +
                        (on
                          ? "border-rubi-danger/60 bg-rubi-danger/15 text-foreground"
                          : "border-border text-muted-foreground line-through opacity-70")
                      }
                    >
                      {on ? <Check className="h-3 w-3" /> : <Skull className="h-3 w-3" />}
                      {b.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Marcados pelo "Killed Monsters" — toque pra corrigir.
              </p>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rubi-gold">
                Loot dos bosses
              </div>
              {lines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum item que só cai de boss nesse analyser.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {lines.map((l) => {
                    const unit = unitOf(l.name, l.item?.npc ?? 0);
                    return (
                      <li key={l.name} className="flex items-center gap-2">
                        <GameIcon name={l.name} size={24} />
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {l.count}x {l.name}
                        </span>
                        <input
                          inputMode="decimal"
                          aria-label={`Preço de ${l.name}`}
                          value={prices[l.name] ?? (unit ? String(unit) : "")}
                          onChange={(e) => setPrices((p) => ({ ...p, [l.name]: e.target.value }))}
                          placeholder="preço"
                          className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-xs outline-none focus:border-rubi-gold"
                        />
                        <span className="w-16 flex-none text-right text-xs font-semibold text-rubi-gold">
                          {fmtGold(unit * l.count)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Só itens que a TibiaWiki diz que caem apenas de boss. Preço por unidade no RubinOT
                (aceita 150k, 1,5kk) — lembramos o último que você usou.
                {ignored.length > 0 &&
                  ` Ficaram de fora ${ignored.length} itens que também caem de monstro comum (${ignored
                    .slice(0, 4)
                    .map((i) => i.name)
                    .join(", ")}${ignored.length > 4 ? "…" : ""}).`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Mini label="Loot dos bosses" value={fmtGold(bossLoot)} />
              <Mini label="Supplies" value={fmtGold(supplies)} />
              <Mini
                label="Lucro"
                value={fmtGold(profit)}
                className={profit >= 0 ? "text-rubi-success" : "text-rubi-danger"}
              />
            </div>
            <p className="-mt-2 text-[10px] text-muted-foreground">
              Tempo da rotação: {fmtDuration(parsed.durationSec)}. Supplies são os da rotação
              inteira (caminho incluído).
            </p>

            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">Jogadores na rotação</span>
              <input
                inputMode="numeric"
                value={party}
                onChange={(e) => setParty(e.target.value.replace(/\D/g, ""))}
                className="w-16 rounded-lg border border-border bg-background px-2 py-1.5 text-center outline-none focus:border-rubi-danger"
              />
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!valid || saving}
            onClick={save}
            className="rounded-lg bg-rubi-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar rotação"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Mini({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-2">
      <div className={"font-bold " + className}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
