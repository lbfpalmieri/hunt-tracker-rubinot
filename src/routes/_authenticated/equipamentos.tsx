import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, CopyPlus, Pencil, Plus, Shirt, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { SessionSetupPanel } from "@/components/setup/SessionSetupPanel";
import { SetupCard } from "@/components/setup/SetupCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  EMPTY_SETUP,
  SETUP_PART_LABEL,
  copySetupParts,
  setupVocation,
  type SessionSetup,
  type SetupPart,
} from "@/lib/session-setup";
import {
  suggestedPresetName,
  useDeleteSetupPreset,
  useSaveSetupPreset,
  useSetupPresets,
  type SetupPreset,
} from "@/lib/setup-presets";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/equipamentos")({
  head: () => ({
    meta: [
      { title: "Meus sets — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Monte seus sets de equipamento (boneco do inventário, skills, Wheel e postura) e escolha na hora de adicionar a sessão.",
      },
    ],
  }),
  component: EquipamentosPage,
});

/**
 * Tela dedicada aos sets (presets de setup) do personagem ativo: monta com calma antes de caçar,
 * no boneco de equipamentos. No assistente de Nova sessão o set escolhido preenche o setup.
 * Dados em setup_presets (ver src/lib/setup-presets.ts).
 */
function EquipamentosPage() {
  const active = useAppStore((s) => s.characters.find((c) => c.id === s.activeCharacterId) ?? null);
  const { data: presets = [], isLoading } = useSetupPresets(active?.id ?? null);
  const deletePreset = useDeleteSetupPreset(active?.id ?? null);
  // "new" = set vazio; { copyOf } = set novo já preenchido com outro (Duplicar).
  const [editing, setEditing] = useState<SetupPreset | "new" | { copyOf: SetupPreset } | null>(
    null,
  );

  if (!active) {
    return (
      <AppShell>
        <EmptyState
          icon={Shirt}
          title="Selecione um personagem"
          description="Os sets ficam salvos por personagem."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  const remove = (p: SetupPreset) => {
    if (!window.confirm(`Excluir o set "${p.name}"?`)) return;
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
          <Shirt className="h-7 w-7 text-rubi-blue" /> Meus{" "}
          <span className="text-gradient-brand">sets</span>
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Monte cada set uma vez — equipamentos no boneco (com tier), postura e Wheel. Na hora de
          adicionar a sessão é só escolher o set. Tem mais de uma arma elemental? Duplique o set e
          troque só a arma.
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
            <div key={p.id} className="card-surface flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-lg font-bold leading-tight">{p.name}</h2>
                  <div className="flex flex-none gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing({ copyOf: p })}
                      aria-label={`Duplicar ${p.name}`}
                      title="Duplicar (novo set já preenchido com este)"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-rubi-blue"
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
                <SetupCard setup={p.setup} vocation={active.vocation} compact />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-rubi-blue hover:text-rubi-blue"
          >
            <Plus className="h-8 w-8" />
            <span className="font-semibold">Novo set</span>
          </button>
        </div>
      )}

      {editing && (
        <PresetDialog
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

function PresetDialog({
  preset,
  copyOf,
  presets,
  characterId,
  vocation,
  onClose,
}: {
  preset: SetupPreset | null;
  /** Set novo que já começa igual a esse (Duplicar). */
  copyOf: SetupPreset | null;
  presets: SetupPreset[];
  characterId: string;
  vocation: string;
  onClose: () => void;
}) {
  const save = useSaveSetupPreset(characterId);
  const [setup, setSetup] = useState<SessionSetup>(preset?.setup ?? copyOf?.setup ?? EMPTY_SETUP);
  const [name, setName] = useState(preset?.name ?? (copyOf ? `${copyOf.name} (cópia)` : ""));
  const others = presets.filter((p) => p.id !== preset?.id);

  const submit = async () => {
    const finalName = name.trim() || suggestedPresetName(setup);
    try {
      await save.mutateAsync({ id: preset?.id, name: finalName, setup });
      toast.success(`Set "${finalName}" salvo`);
      onClose();
    } catch (e) {
      toast.error("Não consegui salvar o set", { description: (e as Error).message });
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !save.isPending && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto overflow-x-hidden sm:max-w-4xl [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="font-display">{preset ? "Editar set" : "Novo set"}</DialogTitle>
          <DialogDescription>
            Charms não entram no set — eles dependem das criaturas de cada hunt e são marcados na
            sessão.
          </DialogDescription>
        </DialogHeader>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nome do set
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={suggestedPresetName(setup)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue sm:max-w-sm"
          />
        </label>

        {others.length > 0 && (
          <CopyFromSet
            presets={others}
            onApply={(from, parts) => setSetup((s) => copySetupParts(s, from.setup, parts))}
          />
        )}

        <SessionSetupPanel
          mode="preset"
          value={setup}
          onChange={setSetup}
          vocation={setupVocation(vocation)}
          characterId={characterId}
          creatures={[]}
        />

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
            disabled={save.isPending}
            className="rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {save.isPending ? "Salvando..." : "Salvar set"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PARTS: SetupPart[] = ["equipment", "stance", "wheel"];

/**
 * "Copiar de outro set": escolhe o set e o que trazer (equipamento, postura, Wheel) — dá pra montar
 * juntando a Wheel de um set com o equipamento de outro e só ajustar o resto.
 */
function CopyFromSet({
  presets,
  onApply,
}: {
  presets: SetupPreset[];
  onApply: (from: SetupPreset, parts: SetupPart[]) => void;
}) {
  const [fromId, setFromId] = useState<string | null>(null);
  const [parts, setParts] = useState<SetupPart[]>(["equipment"]);
  const from = presets.find((p) => p.id === fromId) ?? null;
  const toggle = (p: SetupPart) =>
    setParts((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const apply = () => {
    if (!from || parts.length === 0) return;
    onApply(from, parts);
    toast.success(
      `Copiado de "${from.name}": ${parts.map((p) => SETUP_PART_LABEL[p].toLowerCase()).join(", ")}`,
    );
  };

  return (
    <section className="rounded-xl border border-rubi-blue/30 bg-rubi-blue/[0.05] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rubi-blue">
        <Copy className="h-3.5 w-3.5" /> Copiar de outro set
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setFromId(p.id === fromId ? null : p.id)}
            className={
              "rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors " +
              (p.id === fromId
                ? "border-rubi-blue bg-rubi-blue text-primary-foreground"
                : "border-border bg-background/60 text-muted-foreground hover:border-rubi-blue/60 hover:text-foreground")
            }
          >
            {p.name}
          </button>
        ))}
      </div>
      {from && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2.5">
          <span className="mr-1 text-xs text-muted-foreground">Trazer:</span>
          {PARTS.map((p) => {
            const on = parts.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => toggle(p)}
                aria-pressed={on}
                className={
                  "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors " +
                  (on
                    ? "border-rubi-gold/60 bg-rubi-gold/15 text-rubi-gold"
                    : "border-border text-muted-foreground hover:text-foreground")
                }
              >
                {on && <Check className="h-3 w-3" />}
                {SETUP_PART_LABEL[p]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={apply}
            disabled={parts.length === 0}
            className="ml-auto rounded-lg bg-rubi-blue px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Copiar pra este set
          </button>
        </div>
      )}
    </section>
  );
}
