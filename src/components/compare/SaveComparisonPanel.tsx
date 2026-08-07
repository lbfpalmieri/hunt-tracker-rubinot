import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import type { CompareHunt } from "@/lib/compare";
import { saveComparison } from "@/lib/saved-comparisons.functions";

interface Props {
  hunts: CompareHunt[];
  includeBounty: boolean;
  includePrey: boolean;
}

export function SaveComparisonPanel({ hunts, includeBounty, includePrey }: Props) {
  const qc = useQueryClient();
  const doSave = useServerFn(saveComparison);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [huntNotes, setHuntNotes] = useState<Record<string, string>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const suggested = hunts.map((h) => h.huntName).join(" vs ");

  const save = useMutation({
    mutationFn: () =>
      doSave({
        data: {
          title: (title.trim() || suggested).slice(0, 120),
          notes,
          huntNotes,
          hunts: hunts as unknown[],
          includeBounty,
          includePrey,
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["saved-comparisons"] });
      setSavedId(res.comparison.id);
      setOpen(false);
      setTitle("");
      setNotes("");
      setHuntNotes({});
      toast.success("Comparação salva na sua área privada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!open) {
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-rubi-gold/60 bg-rubi-gold/10 px-4 py-2 text-sm font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/20"
        >
          <BookmarkPlus className="h-4 w-4" /> Salvar comparação
        </button>
        {savedId ? (
          <Link
            to="/tools/comparisons"
            className="inline-flex items-center gap-1.5 text-sm text-rubi-blue hover:underline"
          >
            <BookmarkCheck className="h-4 w-4" /> Ver comparações salvas
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">
            Guarde esse comparativo com suas observações de setup para revisar depois.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="card-surface mt-4 space-y-4 p-4">
      <div className="flex items-center gap-2">
        <BookmarkPlus className="h-4 w-4 text-rubi-gold" />
        <h3 className="font-display text-base font-bold">Salvar comparação</h3>
      </div>

      <label className="block text-xs font-medium text-muted-foreground">
        Nome da comparação
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={suggested}
          className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
        />
      </label>

      <label className="block text-xs font-medium text-muted-foreground">
        Observações gerais
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Objetivo do teste, status do char, imbuements, estratégia..."
          className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        {hunts.map((h, i) => (
          <label key={h.key} className="block">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs font-semibold text-foreground">
              <span className="rounded bg-rubi-blue/20 px-1.5 py-0.5 font-mono text-[10px] text-rubi-blue">
                #{i + 1}
              </span>
              <span className="text-rubi-blue">{h.huntName}</span>
              <span className="font-normal text-muted-foreground">
                {new Date(h.createdAt).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {fmtDuration(h.durationSec)}
                {h.sessionCount && h.sessionCount > 1 ? ` · ${h.sessionCount} sessões` : ""}
                {" · "}
                {h.charName}
              </span>
            </span>
            <textarea
              value={huntNotes[h.key] ?? ""}
              onChange={(e) => setHuntNotes((prev) => ({ ...prev, [h.key]: e.target.value }))}
              rows={3}
              placeholder="Como você fez essa hunt: equipamento, prey, setup..."
              className="mt-1 w-full rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs text-foreground"
            />
          </label>
        ))}
      </div>


      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={save.isPending}
          onClick={() => save.mutate()}
          className="inline-flex items-center gap-2 rounded-lg border border-rubi-gold/60 bg-rubi-gold/15 px-4 py-2 text-sm font-semibold text-rubi-gold disabled:opacity-50"
        >
          <BookmarkPlus className="h-4 w-4" /> {save.isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
        <span className="text-xs text-muted-foreground">
          Os números são congelados no estado atual — sessões novas não alteram a comparação salva.
        </span>
      </div>
    </div>
  );
}
