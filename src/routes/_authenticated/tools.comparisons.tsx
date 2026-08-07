import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { BookmarkCheck, ChevronDown, GitCompareArrows, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { CompareTable } from "@/components/compare/CompareTable";
import { confirmDialog } from "@/lib/confirm-dialog";
import {
  deleteComparison,
  listSavedComparisons,
  updateComparison,
  type SavedComparison,
} from "@/lib/saved-comparisons.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/tools/comparisons")({
  head: () => ({
    meta: [
      { title: "Comparações salvas — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Sua área privada de comparações salvas: revise as hunts que você comparou, com observações do setup usado em cada uma.",
      },
      { property: "og:title", content: "Comparações salvas de hunts" },
      {
        property: "og:description",
        content: "Guarde comparativos com anotações do seu setup e revise quando quiser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SavedComparisonsPage,
});

function SavedComparisonsPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listSavedComparisons);
  const doUpdate = useServerFn(updateComparison);
  const doDelete = useServerFn(deleteComparison);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["saved-comparisons"],
    queryFn: () => fetchList({ data: {} }),
  });

  const update = useMutation({
    mutationFn: (v: { id: string; title?: string; notes?: string; huntNotes?: Record<string, string> }) =>
      doUpdate({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-comparisons"] });
      toast.success("Comparação atualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => doDelete({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-comparisons"] });
      toast.success("Comparação removida");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const list = data?.comparisons ?? [];

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Ferramentas</div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <BookmarkCheck className="h-7 w-7 text-rubi-gold" /> Comparações salvas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Área privada: cada comparação guarda os números do momento em que você salvou, junto das suas
          observações de setup, equipamento e status.
        </p>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted/30" />
      ) : list.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title="Nenhuma comparação salva"
          description="Monte um comparativo em 'Comparar hunts' e clique em 'Salvar comparação' para guardá-la aqui."
          ctaLabel="Comparar hunts"
          ctaTo="/tools/compare"
        />
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <SavedCard
              key={c.id}
              comparison={c}
              open={openId === c.id}
              onToggle={() => setOpenId((prev) => (prev === c.id ? null : c.id))}
              onSave={(v) => update.mutate({ id: c.id, ...v })}
              onDelete={async () => {
                const ok = await confirmDialog({
                  title: "Remover comparação salva?",
                  description: `"${c.title}" será apagada permanentemente.`,
                  confirmLabel: "Remover",
                  cancelLabel: "Cancelar",
                });
                if (ok) remove.mutate(c.id);
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Link
          to="/tools/compare"
          className="inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 bg-rubi-blue/10 px-4 py-2 text-sm font-semibold text-rubi-blue"
        >
          <GitCompareArrows className="h-4 w-4" /> Nova comparação
        </Link>
      </div>
    </AppShell>
  );
}

function SavedCard({
  comparison,
  open,
  onToggle,
  onSave,
  onDelete,
}: {
  comparison: SavedComparison;
  open: boolean;
  onToggle: () => void;
  onSave: (v: { title?: string; notes?: string; huntNotes?: Record<string, string> }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(comparison.title);
  const [notes, setNotes] = useState(comparison.notes);
  const [huntNotes, setHuntNotes] = useState<Record<string, string>>(comparison.huntNotes);

  const cancel = () => {
    setTitle(comparison.title);
    setNotes(comparison.notes);
    setHuntNotes(comparison.huntNotes);
    setEditing(false);
  };

  return (
    <div className="card-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button type="button" onClick={onToggle} className="flex flex-1 items-start gap-2 text-left">
          <ChevronDown
            className={"mt-1 h-4 w-4 flex-none text-muted-foreground transition-transform " + (open ? "rotate-180" : "")}
          />
          <div>
            <div className="font-display text-base font-bold">{comparison.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {comparison.hunts.length} hunts · salva em {fmtDate(comparison.createdAt)}
              {!comparison.includeBounty && " · sem Bounty"}
              {!comparison.includePrey && " · sem Prey"}
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {comparison.hunts.map((h) => (
                <span
                  key={h.key}
                  className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {h.huntName}
                </span>
              ))}
            </div>
          </div>
        </button>
        <div className="flex flex-none items-center gap-1.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onSave({ title: title.trim() || comparison.title, notes, huntNotes });
                  setEditing(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rubi-success/50 bg-rubi-success/10 px-3 py-1.5 text-xs font-semibold text-rubi-success"
              >
                <Check className="h-3.5 w-3.5" /> Salvar
              </button>
              <button
                type="button"
                onClick={cancel}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Cancelar edição"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(true);
                  if (!open) onToggle();
                }}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-rubi-blue"
                aria-label="Editar observações"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-rubi-danger"
                aria-label="Remover comparação"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-4">
          {editing && (
            <label className="block text-xs font-medium text-muted-foreground">
              Título
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm text-foreground"
              />
            </label>
          )}

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-rubi-gold">Observações</div>
            {editing ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Como você caçou, status, equipamento, estratégia..."
                className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {comparison.notes || "Sem observações."}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {comparison.hunts.map((h) => (
              <div key={h.key} className="rounded-lg border border-border p-3">
                <div className="font-display text-sm font-semibold">{h.huntName}</div>
                <div className="text-xs text-muted-foreground">
                  {h.charName} · {h.vocation}
                </div>
                {editing ? (
                  <textarea
                    value={huntNotes[h.key] ?? ""}
                    onChange={(e) => setHuntNotes((prev) => ({ ...prev, [h.key]: e.target.value }))}
                    rows={3}
                    placeholder="Setup dessa hunt..."
                    className="mt-2 w-full rounded-lg border border-border bg-background/60 px-2 py-1.5 text-xs"
                  />
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                    {comparison.huntNotes[h.key] || "Sem observações desta hunt."}
                  </p>
                )}
              </div>
            ))}
          </div>

          <CompareTable hunts={comparison.hunts} />
        </div>
      )}
    </div>
  );
}
