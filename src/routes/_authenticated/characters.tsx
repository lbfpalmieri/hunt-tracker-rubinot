import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import { Plus, Trash2, UserCircle2, Star } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/characters")({
  head: () => ({
    meta: [
      { title: "Personagens — RubinOT Hunt Tracker" },
      { name: "description", content: "Gerencie seus personagens do RubinOT no tracker." },
      { property: "og:title", content: "Personagens" },
      { property: "og:description", content: "Cadastre e vincule seus chars do RubinOT." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: CharactersPage,
});

const VOCATIONS = ["Knight", "Elite Knight", "Paladin", "Royal Paladin", "Sorcerer", "Master Sorcerer", "Druid", "Elder Druid", "Monk", "Exalted Monk"];

function CharactersPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const addCharacter = useAppStore((s) => s.addCharacter);
  const removeCharacter = useAppStore((s) => s.removeCharacter);
  const setActive = useAppStore((s) => s.setActive);

  const [name, setName] = useState("");
  const [vocation, setVocation] = useState(VOCATIONS[0]);
  const [world, setWorld] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !world.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addCharacter({ name: name.trim(), vocation, world: world.trim() });
      setName("");
      setWorld("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Personagens</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Seus chars</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada sessão de hunt é vinculada a um personagem. Selecione o ativo para ver seu dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleAdd} className="card-surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-rubi-gold" /> Novo personagem
          </h2>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Ésobrerubinot"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Vocação</span>
            <select
              value={vocation}
              onChange={(e) => setVocation(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
            >
              {VOCATIONS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Mundo</span>
            <input
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              placeholder="Ex: Rubinera"
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              required
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-rubi-blue px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-blue hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Adicionar"}
          </button>
          {error && (
            <p className="rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
              {error}
            </p>
          )}
        </form>

        <div className="lg:col-span-2">
          {characters.length === 0 ? (
            <div className="card-surface flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
              Nenhum personagem cadastrado ainda.
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((c) => {
                const count = sessions.filter((s) => s.characterId === c.id).length;
                const isActive = c.id === activeId;
                return (
                  <li key={c.id} className="card-surface flex items-center justify-between gap-3 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-rubi-blue-soft text-rubi-blue">
                        <UserCircle2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-display font-semibold">{c.name}</span>
                          {isActive && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rubi-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rubi-gold">
                              <Star className="h-3 w-3" /> ativo
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.vocation} · {c.world} · {count} sessão(ões) · desde {fmtDate(c.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => setActive(c.id)}
                          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                        >
                          Ativar
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir ${c.name} e todas as suas sessões?`)) await removeCharacter(c.id);
                        }}
                        className="rounded-lg border border-rubi-danger/40 p-1.5 text-rubi-danger hover:bg-rubi-danger/10"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
