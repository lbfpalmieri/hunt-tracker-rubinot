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
import { normName, type Boss, type BossCatalog, itemValue } from "@/lib/boss-catalog";
import { addRun, type BossDrop } from "@/lib/boss-rotations";
import { fmtDuration, fmtGold } from "@/lib/format";
import { parseHunting, parseSessionStamp } from "@/lib/parser";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationId: string;
  bosses: Boss[];
  catalog: BossCatalog;
  characterId: string | null;
  onSaved: () => void;
}

/** Drop que vale destacar: raro/muito raro de algum boss da rotação, ou que vale ≥ 100k. */
const NOTABLE_VALUE = 100_000;

/**
 * Registrar uma execução da rotação: cola o Hunting Analyser (o mesmo export da Nova sessão),
 * o app acha quais bosses da rotação morreram (Killed Monsters) e os drops que importam.
 */
export function RegisterRunDialog({
  open,
  onOpenChange,
  rotationId,
  bosses,
  catalog,
  characterId,
  onSaved,
}: Props) {
  const [text, setText] = useState("");
  const [party, setParty] = useState("1");
  const [killedOverride, setKilledOverride] = useState<Set<string> | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => (text.trim() ? parseHunting(text) : null), [text]);
  const valid = !!parsed && (parsed.durationSec > 0 || parsed.loot > 0 || parsed.kills.length > 0);

  const detected = useMemo(() => {
    if (!parsed) return new Set<string>();
    const killed = new Set(parsed.kills.map((k) => normName(k.name)));
    return new Set(bosses.filter((b) => killed.has(normName(b.name))).map((b) => b.name));
  }, [parsed, bosses]);
  const killed = killedOverride ?? detected;

  const drops = useMemo<BossDrop[]>(() => {
    if (!parsed) return [];
    const rare = new Set(bosses.flatMap((b) => [...b.loot.v, ...b.loot.r]).map(normName));
    const byNorm = new Map([...catalog.items.values()].map((it) => [normName(it.name), it]));
    return parsed.lootedItems
      .filter((i) => {
        const n = normName(i.name);
        return rare.has(n) || itemValue(byNorm.get(n)) >= NOTABLE_VALUE;
      })
      .map((i) => ({ name: byNorm.get(normName(i.name))?.name ?? i.name, count: i.count }));
  }, [parsed, bosses, catalog]);

  const reset = () => {
    setText("");
    setParty("1");
    setKilledOverride(null);
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
        loot: parsed.loot,
        supplies: parsed.supplies,
        balance: parsed.balance,
        xp: parsed.xpGain || parsed.rawXp,
        partySize: Math.max(1, Math.min(10, Number(party) || 1)),
        bossesKilled: [...killed],
        drops,
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
            rows={6}
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
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <Mini label="Tempo" value={fmtDuration(parsed.durationSec)} />
              <Mini
                label="Lucro"
                value={fmtGold(parsed.balance)}
                className={parsed.balance >= 0 ? "text-rubi-success" : "text-rubi-danger"}
              />
              <Mini label="Loot" value={fmtGold(parsed.loot)} />
            </div>

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
                Marcados automaticamente pelo "Killed Monsters" — toque pra corrigir.
              </p>
            </div>

            {drops.length > 0 && (
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-rubi-gold">
                  Drops de destaque
                </div>
                <div className="flex flex-wrap gap-2">
                  {drops.map((d) => (
                    <span
                      key={d.name}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 px-2 py-1 text-xs"
                    >
                      <GameIcon name={d.name} size={20} /> {d.count}x {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

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
