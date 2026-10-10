import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CopyPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WheelDialog } from "@/components/wheel/WheelDialog";
import { WheelOfDestiny } from "@/components/wheel/WheelOfDestiny";
import { WheelReadout } from "@/components/wheel/WheelReadout";
import { confirmDialog } from "@/lib/confirm-dialog";
import { currentLevel } from "@/lib/level";
import { WHEEL_ICON, setupVocation } from "@/lib/session-setup";
import { useAppStore } from "@/lib/store";
import { isEmptyWheel, type WheelBuild } from "@/lib/wheel";
import {
  WHEEL_PRESET_NAME_MAX,
  suggestedWheelName,
  useDeleteWheelPreset,
  useSaveWheelPreset,
  useWheelPresets,
  type WheelPreset,
} from "@/lib/wheel-presets";

export const Route = createFileRoute("/_authenticated/rodas")({
  head: () => ({
    meta: [
      { title: "Minhas rodas — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Cadastre suas rodas da Wheel of Destiny e escolha qual usou em cada sessão ou boss, sem depender do set de equipamento.",
      },
    ],
  }),
  component: RodasPage,
});

/**
 * Rodas salvas (Wheel of Destiny) do personagem ativo — separadas dos sets (/equipamentos). Cada
 * roda tem um nome e é escolhida na Nova sessão (Solo/Grupo), na página da sessão e no registro de
 * boss. Dados em wheel_presets (ver src/lib/wheel-presets.ts).
 */
function RodasPage() {
  const active = useAppStore((s) => s.characters.find((c) => c.id === s.activeCharacterId) ?? null);
  const { data: presets = [], isLoading } = useWheelPresets(active?.id ?? null);
  const deletePreset = useDeleteWheelPreset(active?.id ?? null);
  // "new" = roda vazia; { copyOf } = roda nova já igual a outra (Duplicar).
  const [editing, setEditing] = useState<WheelPreset | "new" | { copyOf: WheelPreset } | null>(
    null,
  );

  if (!active) {
    return (
      <AppShell>
        <EmptyState
          icon={Plus}
          title="Selecione um personagem"
          description="As rodas ficam salvas por personagem."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  const remove = async (p: WheelPreset) => {
    const ok = await confirmDialog({
      title: "Excluir roda",
      description: `Excluir a roda "${p.name}"? As sessões que já usaram essa roda continuam com ela. Essa ação não pode ser desfeita.`,
      tone: "danger",
    });
    if (!ok) return;
    deletePreset.mutate(p.id, {
      onError: (e) => toast.error("Não consegui excluir", { description: (e as Error).message }),
    });
  };

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          {active.name} · {active.vocation}
        </div>
        <h1 className="mt-1 flex items-center gap-2 font-brand text-3xl font-bold tracking-tight sm:text-4xl">
          <img src={WHEEL_ICON} alt="" className="h-8 w-8 [image-rendering:pixelated]" /> Minhas{" "}
          <span className="text-gradient-brand">rodas</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Monte cada roda da Wheel of Destiny uma vez e dê um nome. Na hora de adicionar a sessão (ou
          registrar um boss) você escolhe o set de equipamento e a roda separadamente — dá pra testar
          rodas diferentes com o mesmo equipamento sem duplicar set.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {presets.map((p) => (
            <div key={p.id} className="card-surface flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="min-w-0 break-words font-display text-lg font-bold leading-tight">
                  {p.name}
                </h2>
                <div className="flex flex-none gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing({ copyOf: p })}
                    aria-label={`Duplicar ${p.name}`}
                    title="Duplicar (roda nova já igual a esta)"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-gold"
                  >
                    <CopyPlus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    aria-label={`Editar ${p.name}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    aria-label={`Excluir ${p.name}`}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <WheelReadout build={p.wheel} compact />
            </div>
          ))}

          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-rubi-gold hover:text-rubi-gold"
          >
            <Plus className="h-8 w-8" />
            <span className="font-semibold">Nova roda</span>
          </button>
        </div>
      )}

      {editing && (
        <WheelPresetDialog
          key={
            editing === "new"
              ? "new"
              : "copyOf" in editing
                ? `copy-${editing.copyOf.id}`
                : editing.id
          }
          preset={editing === "new" || "copyOf" in editing ? null : editing}
          copyOf={editing !== "new" && "copyOf" in editing ? editing.copyOf : null}
          presets={presets}
          characterId={active.id}
          vocation={active.vocation}
          onClose={() => setEditing(null)}
        />
      )}
    </AppShell>
  );
}

function WheelPresetDialog({
  preset,
  copyOf,
  presets,
  characterId,
  vocation,
  onClose,
}: {
  preset: WheelPreset | null;
  /** Roda nova que já começa igual a essa (Duplicar). */
  copyOf: WheelPreset | null;
  presets: WheelPreset[];
  characterId: string;
  vocation: string;
  onClose: () => void;
}) {
  const save = useSaveWheelPreset(characterId);
  const levelSnapshots = useAppStore((s) => s.levelSnapshots);
  const [wheel, setWheel] = useState<WheelBuild | null>(
    preset?.wheel ?? (copyOf ? structuredClone(copyOf.wheel) : null),
  );
  const [name, setName] = useState(preset?.name ?? (copyOf ? `${copyOf.name} (cópia)` : ""));
  // Roda nova: já abre o planejador — é o que a pessoa veio fazer.
  const [plannerOpen, setPlannerOpen] = useState(!preset && !copyOf);
  const suggestion = suggestedWheelName(presets.filter((p) => p.id !== preset?.id));
  const empty = isEmptyWheel(wheel);

  const submit = async () => {
    if (!wheel || empty) return;
    const finalName = name.trim() || suggestion;
    try {
      await save.mutateAsync({ id: preset?.id, name: finalName, wheel });
      toast.success(`Roda "${finalName}" salva`);
      onClose();
    } catch (e) {
      toast.error("Não consegui salvar a roda", { description: (e as Error).message });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !save.isPending && !plannerOpen && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto overflow-x-hidden sm:max-w-lg [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="font-display">{preset ? "Editar roda" : "Nova roda"}</DialogTitle>
          <DialogDescription>
            A roda fica salva neste personagem. Sessões que já usaram esta roda guardam uma cópia —
            editar aqui não muda o que já foi registrado.
          </DialogDescription>
        </DialogHeader>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nome da roda
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={WHEEL_PRESET_NAME_MAX}
            placeholder={suggestion}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-gold"
          />
        </label>

        <section className="rounded-xl border border-rubi-gold/25 bg-rubi-gold/[0.04] p-3">
          {wheel && !empty ? (
            <button
              type="button"
              onClick={() => setPlannerOpen(true)}
              className="mx-auto block w-full max-w-[260px]"
              aria-label="Editar a roda"
            >
              <WheelOfDestiny build={wheel} className="h-auto w-full" />
            </button>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhum ponto distribuído ainda.
            </p>
          )}
          <button
            type="button"
            onClick={() => setPlannerOpen(true)}
            className="mx-auto mt-2 flex items-center gap-1.5 rounded-lg bg-rubi-gold px-3 py-1.5 text-sm font-bold text-background"
          >
            <Pencil className="h-4 w-4" /> {empty ? "Montar a roda" : "Editar a roda"}
          </button>
        </section>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={save.isPending || empty}
            className="rounded-lg bg-rubi-gold px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? "Salvando..." : "Salvar roda"}
          </button>
        </DialogFooter>

        <WheelDialog
          open={plannerOpen}
          onOpenChange={setPlannerOpen}
          value={wheel}
          vocation={setupVocation(vocation)}
          defaultLevel={currentLevel(levelSnapshots, characterId)}
          onApply={setWheel}
        />
      </DialogContent>
    </Dialog>
  );
}
