import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import {
  Plus,
  Trash2,
  UserCircle2,
  Star,
  X,
  ImageIcon,
  Clipboard,
  ClipboardPaste,
} from "lucide-react";
import { useEffect, useState } from "react";
import { blobToCompressedImage } from "@/components/PasteImage";


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

const VOCATIONS = [
  "Elite Knight",
  "Royal Paladin",
  "Master Sorcerer",
  "Elder Druid",
  "Exalted Monk",
];

function CharactersPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const addCharacter = useAppStore((s) => s.addCharacter);
  const updateCharacter = useAppStore((s) => s.updateCharacter);
  const removeCharacter = useAppStore((s) => s.removeCharacter);
  const setActive = useAppStore((s) => s.setActive);

  const [name, setName] = useState("");
  const [vocation, setVocation] = useState(VOCATIONS[0]);
  const [world, setWorld] = useState("");
  const [outfitUrl, setOutfitUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "new" for the form, character id for existing rows, null = no target
  const [pasteTarget, setPasteTarget] = useState<string | null>("new");
  const [pasteFlash, setPasteFlash] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !world.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await addCharacter({
        name: name.trim(),
        vocation,
        world: world.trim(),
        outfitUrl,
      });
      setName("");
      setWorld("");
      setOutfitUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const processImageBlob = (blob: Blob): Promise<string> => blobToCompressedImage(blob, 512, 0.9);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      if (!pasteTarget) return;
      // Ignore paste inside text inputs so you can still paste names
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (!file) continue;
          e.preventDefault();
          setError(null);
          try {
            const compressed = await processImageBlob(file);
            if (pasteTarget === "new") {
              setOutfitUrl(compressed);
            } else {
              await updateCharacter(pasteTarget, { outfitUrl: compressed });
            }
            setPasteFlash(pasteTarget);
            setTimeout(() => setPasteFlash(null), 1200);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao colar imagem");
          }
          return;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [pasteTarget, updateCharacter]);


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
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          Personagens
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold">Seus chars</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cadastre seus personagens e adicione um print do outfit para representá-los.
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

          <div>
            <span className="text-xs font-medium text-muted-foreground">Outfit (opcional)</span>
            <button
              type="button"
              onClick={() => setPasteTarget("new")}
              className={`mt-1 flex w-full items-center gap-3 rounded-lg border-2 border-dashed p-3 text-left transition ${
                pasteTarget === "new"
                  ? "border-rubi-blue bg-rubi-blue/5"
                  : "border-border hover:border-rubi-blue/50"
              } ${pasteFlash === "new" ? "border-rubi-gold bg-rubi-gold/10" : ""}`}
            >
              <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-input">
                {outfitUrl ? (
                  <img src={outfitUrl} alt="Outfit" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <ClipboardPaste className="h-3.5 w-3.5 text-rubi-blue" />
                  {outfitUrl ? "Cole outra imagem para trocar" : "Cole uma imagem (Ctrl+V)"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {pasteTarget === "new"
                    ? "Pronto — copie um print e pressione Ctrl+V."
                    : "Clique para focar aqui e depois cole."}
                </div>
              </div>
              {outfitUrl && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOutfitUrl(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-rubi-danger/40 px-2 py-1 text-[11px] text-rubi-danger hover:bg-rubi-danger/10"
                >
                  <X className="h-3 w-3" /> Remover
                </span>
              )}
            </button>
          </div>


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
              <div>
                <UserCircle2 className="mx-auto mb-3 h-8 w-8 text-rubi-blue" />
                Nenhum personagem cadastrado ainda.
                <br />
                Preencha o formulário ao lado para começar.
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((c) => {
                const count = sessions.filter((s) => s.characterId === c.id).length;
                const isActive = c.id === activeId;
                return (
                  <li
                    key={c.id}
                    className="card-surface flex items-center justify-between gap-3 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-rubi-blue-soft text-rubi-blue">
                        {c.outfitUrl ? (
                          <img
                            src={c.outfitUrl}
                            alt={c.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserCircle2 className="h-7 w-7" />
                        )}
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
                          {c.vocation} · {c.world} · {count} sessão(ões) · desde{" "}
                          {fmtDate(c.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPasteTarget(c.id)}
                        title="Selecionar e colar (Ctrl+V) uma imagem para este personagem"
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                          pasteTarget === c.id
                            ? "border-rubi-blue bg-rubi-blue/10 text-rubi-blue"
                            : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        } ${pasteFlash === c.id ? "border-rubi-gold bg-rubi-gold/10 text-rubi-gold" : ""}`}
                      >
                        <Clipboard className="h-3.5 w-3.5" />
                        {pasteTarget === c.id ? "Cole (Ctrl+V)" : "Colar outfit"}
                      </button>

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
                          if (confirm(`Excluir ${c.name} e todas as suas sessões?`))
                            await removeCharacter(c.id);
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
