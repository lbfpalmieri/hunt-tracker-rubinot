import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { lazy, Suspense, useMemo, useState } from "react";
import { Coins, Save, Trash2, TrendingDown, TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { useAppStore } from "@/lib/store";
import { confirmDialog } from "@/lib/confirm-dialog";
import { fmtNum } from "@/lib/format";
import { fmtIsoDate, parseGoldInput, rcNeeded, todayIso } from "@/lib/rc-calc";
import {
  deleteRcPrice,
  listRcPrices,
  saveRcPrice,
  type RcPriceEntry,
} from "@/lib/rc-prices.functions";

const RcPriceChart = lazy(() => import("@/components/charts/RcPriceChart"));

export const Route = createFileRoute("/_authenticated/tools/rubini-coins")({
  head: () => ({
    meta: [
      { title: "Calculadora de Rubini Coins — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Descubra quantos Rubini Coins você precisa vender pra juntar o gold que quer, e acompanhe a variação do preço do RC ao longo do tempo.",
      },
      { property: "og:title", content: "Calculadora de Rubini Coins" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: RubiniCoinsPage,
});

function RubiniCoinsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listRcPrices);
  const doSave = useServerFn(saveRcPrice);
  const doDelete = useServerFn(deleteRcPrice);
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const defaultWorld = (characters.find((c) => c.id === activeId) ?? characters[0])?.world ?? "";

  const { data, isLoading } = useQuery({ queryKey: ["rc-prices"], queryFn: () => fetchList() });

  const save = useMutation({
    mutationFn: (v: Parameters<typeof doSave>[0]["data"]) => doSave({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-prices"] });
      toast.success("Preço salvo no histórico");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rc-prices"] });
      toast.success("Registro removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <RcCalculator
        defaultWorld={defaultWorld}
        entries={data?.entries ?? []}
        loading={isLoading}
        loadError={data?.error}
        saving={save.isPending}
        onSave={(v) => save.mutate(v)}
        onDelete={(id) => remove.mutate(id)}
      />
    </AppShell>
  );
}

interface CalcProps {
  defaultWorld: string;
  entries: RcPriceEntry[];
  loading: boolean;
  loadError?: string;
  saving: boolean;
  onSave: (v: { world: string; price: number; targetGold: number | null; recordedOn: string }) => void;
  onDelete: (id: string) => void;
}

export function RcCalculator({ defaultWorld, entries, loading, loadError, saving, onSave, onDelete }: CalcProps) {
  const [worldInput, setWorldInput] = useState<string | null>(null);
  const [priceText, setPriceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [date, setDate] = useState(todayIso());

  const world = (worldInput ?? defaultWorld).trim();
  const price = parseGoldInput(priceText);
  const target = parseGoldInput(targetText);
  const needed = price && target ? rcNeeded(target, price) : null;

  const knownWorlds = useMemo(() => Array.from(new Set(entries.map((e) => e.world))).sort(), [entries]);
  const worldEntries = useMemo(
    () => entries.filter((e) => e.world.toLowerCase() === world.toLowerCase()),
    [entries, world],
  );

  const stats = useMemo(() => {
    if (worldEntries.length === 0) return null;
    const avg = worldEntries.reduce((a, e) => a + e.price, 0) / worldEntries.length;
    const best = worldEntries.reduce((a, e) => (e.price > a.price ? e : a));
    return { avg, best };
  }, [worldEntries]);

  const chartData = useMemo(
    () => worldEntries.map((e) => ({ t: new Date(`${e.recordedOn}T00:00:00`).getTime(), price: e.price })),
    [worldEntries],
  );

  const canSave = !!world && !!price && !saving;

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Coins className="h-7 w-7 text-rubi-gold" /> Calculadora de Rubini Coins
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quer comprar algo no jogo? Compre RC com dinheiro, venda por gold e veja quantos você precisa. O preço do RC
          muda de servidor pra servidor e de dia pra dia — preencha sempre o valor atual e salve pra acompanhar a variação.
        </p>
      </div>

      <div className="card-surface mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Servidor">
          <input
            list="rc-worlds"
            value={worldInput ?? defaultWorld}
            onChange={(e) => setWorldInput(e.target.value)}
            placeholder="Ex: Rubinot"
            maxLength={40}
            className={inputCls}
          />
          <datalist id="rc-worlds">
            {knownWorlds.map((w) => (
              <option key={w} value={w} />
            ))}
          </datalist>
        </Field>
        <Field label="Preço de 1 RC (em gold)">
          <input
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            inputMode="decimal"
            placeholder="Ex: 38k ou 38.000"
            className={inputCls}
          />
        </Field>
        <Field label="Gold que você quer juntar">
          <input
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            inputMode="decimal"
            placeholder="Ex: 100kk ou 100.000.000"
            className={inputCls}
          />
        </Field>
        <Field label="Data do preço">
          <input type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value || todayIso())} className={inputCls} />
        </Field>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-5">
        <div className="card-surface p-5 lg:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Você precisa de</div>
          {needed != null && price && target ? (
            <>
              <div className="mt-2 font-display text-4xl font-bold text-rubi-gold">
                {fmtNum(needed)} <span className="text-2xl">RC</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                pra juntar {fmtNum(target)} gold vendendo cada RC a {fmtNum(price)} gold.
                {needed * price > target && <> Sobram {fmtNum(needed * price - target)} gold.</>}
              </p>
              {stats && <Comparison price={price} target={target} avg={stats.avg} best={stats.best} />}
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Preencha o preço do RC e o gold que você quer juntar. Aceita <b>100kk</b>, <b>38k</b> ou <b>100.000.000</b>.
            </p>
          )}
          <button
            type="button"
            disabled={!canSave}
            onClick={() => price && onSave({ world, price, targetGold: target, recordedOn: date })}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rubi-gold/50 bg-rubi-gold/10 px-4 py-2 text-sm font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Salvar preço de {fmtIsoDate(date)}
          </button>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Salvar de novo no mesmo dia e servidor atualiza o valor daquele dia.
          </p>
        </div>

        <div className="card-surface p-5 lg:col-span-3">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <LineChartIcon className="h-4 w-4 text-rubi-gold" /> Preço do RC{world ? ` — ${world}` : ""}
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Gold por 1 RC ao longo do tempo. A linha azul tracejada é o preço que você digitou agora.
          </p>
          {loadError ? (
            <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-3 text-sm text-rubi-danger">
              Não consegui carregar o histórico ({loadError}). A migration da tabela <code>rc_price_entries</code> já foi aplicada?
            </p>
          ) : loading ? (
            <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border/60 px-6 text-center text-sm text-muted-foreground">
              Nenhum preço salvo para {world || "este servidor"} ainda. Preencha o preço de hoje e clique em salvar.
            </div>
          ) : (
            <div className="h-64 w-full">
              <Suspense fallback={<div className="h-full w-full animate-pulse rounded-lg bg-muted/30" />}>
                <RcPriceChart data={chartData} currentPrice={price} />
              </Suspense>
            </div>
          )}
        </div>
      </div>

      {worldEntries.length > 0 && (
        <div className="card-surface overflow-hidden">
          <div className="border-b border-border/60 px-5 py-3 text-sm font-semibold">Histórico — {world}</div>
          <ul className="divide-y divide-border/50">
            {[...worldEntries].reverse().map((e, i, arr) => {
              const prev = arr[i + 1];
              const delta = prev ? ((e.price - prev.price) / prev.price) * 100 : null;
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-3 text-sm">
                  <span className="w-24 font-medium">{fmtIsoDate(e.recordedOn)}</span>
                  <span className="font-mono font-semibold text-rubi-gold">{fmtNum(e.price)} gold / RC</span>
                  {delta != null && delta !== 0 && (
                    <span className={"inline-flex items-center gap-1 text-xs " + (delta > 0 ? "text-rubi-success" : "text-rubi-danger")}>
                      {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {delta > 0 ? "+" : ""}
                      {delta.toFixed(1).replace(".", ",")}% vs. registro anterior
                    </span>
                  )}
                  {e.targetGold != null && (
                    <span className="text-xs text-muted-foreground">
                      {fmtNum(e.targetGold)} gold = {fmtNum(rcNeeded(e.targetGold, e.price))} RC
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label="Remover registro"
                    onClick={async () => {
                      const ok = await confirmDialog({
                        title: "Remover registro?",
                        description: `O preço de ${fmtIsoDate(e.recordedOn)} será apagado do histórico.`,
                        confirmLabel: "Remover",
                        cancelLabel: "Cancelar",
                      });
                      if (ok) onDelete(e.id);
                    }}
                    className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-rubi-danger/10 hover:text-rubi-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

const inputCls =
  "mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground/60";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/** Compara o preço digitado agora com o histórico do servidor — preço MAIOR = precisa de menos RC. */
function Comparison({ price, target, avg, best }: { price: number; target: number; avg: number; best: RcPriceEntry }) {
  const vsAvg = ((price - avg) / avg) * 100;
  const rcAtAvg = rcNeeded(target, avg);
  const rcNow = rcNeeded(target, price);
  const rcAtBest = rcNeeded(target, best.price);
  const up = vsAvg >= 0;
  return (
    <div className="mt-4 space-y-2 border-t border-border/60 pt-4 text-sm">
      <div className={"flex items-center gap-1.5 font-medium " + (up ? "text-rubi-success" : "text-rubi-danger")}>
        {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        {Math.abs(vsAvg).toFixed(1).replace(".", ",")}% {up ? "acima" : "abaixo"} da sua média
      </div>
      <p className="text-xs text-muted-foreground">
        Na média dos seus registros ({fmtNum(avg)} gold/RC) seriam {fmtNum(rcAtAvg)} RC —{" "}
        {rcNow === rcAtAvg ? "igual a agora" : `${fmtNum(Math.abs(rcNow - rcAtAvg))} RC a ${rcNow < rcAtAvg ? "menos" : "mais"} agora`}.
      </p>
      <p className="text-xs text-muted-foreground">
        Melhor preço já salvo: {fmtNum(best.price)} gold/RC em {fmtIsoDate(best.recordedOn)} ({fmtNum(rcAtBest)} RC).
      </p>
    </div>
  );
}
