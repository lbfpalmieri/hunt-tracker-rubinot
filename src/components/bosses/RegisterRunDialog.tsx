import { useMemo, useState } from "react";
import { Check, ClipboardPaste, Plus, Skull } from "lucide-react";
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
import { priceMap, useItemPrices, useSaveItemPrices } from "@/lib/item-prices";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rotationId: string;
  bosses: Boss[];
  catalog: BossCatalog;
  characterId: string | null;
  /** Execuções anteriores — de onde vem o último preço usado pra cada item. */
  previousRuns: BossRotationRun[];
  /** Servidor do personagem — "Meus preços" são por servidor. */
  world: string | null;
  onSaved: () => void;
}

/**
 * Registrar uma execução da rotação: cola o Hunting Analyser (o mesmo export da Nova sessão).
 * O app acha quais bosses da rotação morreram (Killed Monsters) e separa do "Looted Items" só o
 * que é loot de boss — item que a wiki diz que só cai de boss. Loot dos monstros do caminho fica
 * de fora (mas dá pra incluir na mão: token, item de delivery...). O analyser não diz o preço de
 * cada item: a pessoa escolhe calcular com "Meus preços" (tabela user_item_prices do servidor dela,
 * ver item-prices.ts) ou com o preço de NPC da TibiaWiki, e pode corrigir item a item — o que ela
 * digita vira "meu preço" pras próximas.
 */
export function RegisterRunDialog({
  open,
  onOpenChange,
  rotationId,
  bosses,
  catalog,
  characterId,
  previousRuns,
  world,
  onSaved,
}: Props) {
  const [text, setText] = useState("");
  const [party, setParty] = useState("1");
  const [killedOverride, setKilledOverride] = useState<Set<string> | null>(null);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"mine" | "npc">("mine");
  const [included, setIncluded] = useState<Set<string>>(new Set());
  const [rememberPrices, setRememberPrices] = useState(true);
  const { data: myPriceList } = useItemPrices(world);
  const myPrices = useMemo(() => priceMap(myPriceList), [myPriceList]);
  const savePrices = useSaveItemPrices(world);

  const parsed = useMemo(() => (text.trim() ? parseHunting(text) : null), [text]);
  const valid = !!parsed && (parsed.durationSec > 0 || parsed.loot > 0 || parsed.kills.length > 0);

  const detected = useMemo(() => {
    if (!parsed) return new Set<string>();
    const killed = new Set(parsed.kills.map((k) => normName(k.name)));
    return new Set(bosses.filter((b) => killed.has(normName(b.name))).map((b) => b.name));
  }, [parsed, bosses]);
  const killed = killedOverride ?? detected;

  const remembered = useMemo(() => lastPrices(previousRuns), [previousRuns]);
  const autoLines = useMemo(
    () => (parsed ? bossLinkedLoot(parsed.lootedItems, bosses, catalog) : []),
    [parsed, bosses, catalog],
  );
  const ignoredAll = useMemo(() => {
    if (!parsed) return [];
    const linked = new Set(autoLines.map((l) => normName(l.name)));
    return parsed.lootedItems.filter((l) => {
      const n = normName(l.name);
      return (
        !linked.has(n) &&
        !linked.has(n.replace(/s$/, "")) &&
        !/^(gold|platinum|crystal) coins?$/.test(n)
      );
    });
  }, [parsed, autoLines]);
  // Itens de fora que a pessoa escolheu contar (token, delivery task...). Nome em Title Case.
  // Nome como a gente conhece (preço salvo ou catálogo), inclusive do plural do analyser
  // ("3x gold tokens" → "Gold Token"); senão, o nome do analyser em Title Case.
  const known = useMemo(
    () => new Map([...myPrices.keys(), ...catalog.items.keys()].map((k) => [normName(k), k])),
    [myPrices, catalog],
  );
  const titled = (n: string) => {
    const key = normName(n);
    const hit = known.get(key) ?? (key.endsWith("s") ? known.get(key.slice(0, -1)) : undefined);
    return hit ?? n.replace(/^(a|an) /i, "").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const lines = [
    ...autoLines,
    ...ignoredAll
      .filter((i) => included.has(i.name))
      .map((i) => ({ name: titled(i.name), count: i.count, item: undefined })),
  ];
  const ignored = ignoredAll.filter((i) => !included.has(i.name));

  const npcOf = (name: string) => catalog.items.get(name)?.npc ?? 0;
  /** Preço unitário: digitado > (Meus preços: meu preço > último usado > NPC) | (NPC). */
  const unitOf = (name: string): number => {
    const typed = prices[name];
    if (typed != null) return parseGoldInput(typed) ?? 0;
    if (mode === "npc") return npcOf(name);
    return myPrices.get(name) ?? remembered.get(name) ?? npcOf(name);
  };
  const sourceOf = (name: string): string => {
    if (prices[name] != null) return "digitado";
    if (mode === "npc") return "NPC";
    if (myPrices.has(name)) return "seu preço";
    if (remembered.has(name)) return "último usado";
    return npcOf(name) ? "NPC" : "sem preço";
  };
  const bossLoot = lines.reduce((a, l) => a + l.count * unitOf(l.name), 0);
  const supplies = parsed?.supplies ?? 0;
  const profit = bossLoot - supplies;

  const reset = () => {
    setText("");
    setParty("1");
    setKilledOverride(null);
    setPrices({});
    setIncluded(new Set());
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
          unitValue: unitOf(l.name),
        })),
        notes: null,
      });
      // O que foi digitado vira "meu preço" nesse servidor (falha aqui não desfaz a rotação).
      const typed = Object.entries(prices)
        .map(([item, raw]) => ({ item, price: parseGoldInput(raw) ?? 0 }))
        .filter((e) => e.price > 0);
      if (rememberPrices && typed.length) {
        savePrices.mutate(typed, {
          onError: (e) =>
            toast.error("Rotação salva, mas os preços não", { description: e.message }),
        });
      }
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
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-rubi-gold">
                  Loot dos bosses
                </span>
                <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-[11px] font-medium">
                  {(
                    [
                      ["mine", "Meus preços"],
                      ["npc", "Preço NPC"],
                    ] as const
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setPrices({});
                      }}
                      className={
                        "rounded-md px-2 py-1 " +
                        (mode === m ? "bg-rubi-gold/20 text-rubi-gold" : "text-muted-foreground")
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {lines.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum item que só cai de boss nesse analyser.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {lines.map((l) => {
                    const unit = unitOf(l.name);
                    return (
                      <li key={l.name} className="flex items-center gap-2">
                        <GameIcon name={l.name} size={24} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm">
                            {l.count}x {l.name}
                          </span>
                          <span className="block text-[10px] text-muted-foreground">
                            {sourceOf(l.name)}
                            {npcOf(l.name) > 0 && sourceOf(l.name) !== "NPC"
                              ? ` · NPC ${fmtGold(npcOf(l.name))}`
                              : ""}
                          </span>
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
              {ignored.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  Ficaram de fora (também caem de monstro comum) — toque pra contar:
                  {ignored.map((i) => (
                    <button
                      key={i.name}
                      type="button"
                      onClick={() => setIncluded((s) => new Set(s).add(i.name))}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 hover:border-rubi-gold/60 hover:text-foreground"
                    >
                      <Plus className="h-3 w-3" /> {i.count}x {i.name}
                    </button>
                  ))}
                </div>
              )}
              <label className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberPrices}
                  onChange={(e) => setRememberPrices(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--rubi-gold)]"
                />
                Salvar os preços que eu digitar como "Meus preços"{world ? ` em ${world}` : ""}
              </label>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Preço por unidade (aceita 150k, 1,5kk). "Meus preços" usa a sua tabela do servidor;
                sem preço lá, o último que você usou; senão, o NPC da TibiaWiki.
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
