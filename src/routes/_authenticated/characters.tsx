import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDate } from "@/lib/format";
import {
  Plus,
  Trash2,
  UserCircle2,
  Star,
  Upload,
  ClipboardPaste,
  Sparkles,
  X,
  ImageIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { extractCharacterFromImage } from "@/lib/character-ocr.functions";

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
  "Knight",
  "Elite Knight",
  "Paladin",
  "Royal Paladin",
  "Sorcerer",
  "Master Sorcerer",
  "Druid",
  "Elder Druid",
  "Monk",
  "Exalted Monk",
];

const MAX_IMAGE_BYTES = 1_500_000; // ~1.5MB pré-compressão

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

async function compressImage(dataUrl: string, maxDim = 512, quality = 0.85): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = rej;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/webp", quality);
}

function CharactersPage() {
  const hydrated = useHydrated();
  const characters = useAppStore((s) => s.characters);
  const sessions = useAppStore((s) => s.sessions);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const addCharacter = useAppStore((s) => s.addCharacter);
  const updateCharacter = useAppStore((s) => s.updateCharacter);
  const removeCharacter = useAppStore((s) => s.removeCharacter);
  const setActive = useAppStore((s) => s.setActive);

  const runOcr = useServerFn(extractCharacterFromImage);

  const [name, setName] = useState("");
  const [vocation, setVocation] = useState(VOCATIONS[0]);
  const [world, setWorld] = useState("");
  const [outfitUrl, setOutfitUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const pasteRef = useRef<HTMLDivElement | null>(null);

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

  const handleOutfitFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const raw = await fileToDataUrl(file);
      const compressed = await compressImage(raw, 512, 0.9);
      setOutfitUrl(compressed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar imagem");
    }
  };

  const runStatusOcr = async (dataUrl: string) => {
    setOcrLoading(true);
    setError(null);
    try {
      const compressed = await compressImage(dataUrl, 1024, 0.85);
      if (compressed.length > MAX_IMAGE_BYTES * 1.4) {
        throw new Error("Imagem muito grande, tente uma menor.");
      }
      const result = await runOcr({ data: { imageDataUrl: compressed } });
      const filled: string[] = [];
      if (result.name) {
        setName(result.name);
        filled.push("nome");
      }
      if (result.vocation && VOCATIONS.includes(result.vocation)) {
        setVocation(result.vocation);
        filled.push("vocação");
      }
      if (result.world) {
        setWorld(result.world);
        filled.push("mundo");
      }
      setFlash(
        filled.length
          ? `IA preencheu: ${filled.join(", ")}${result.level ? ` (level ${result.level})` : ""}`
          : "IA não conseguiu identificar dados — preencha manualmente.",
      );
      setTimeout(() => setFlash(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na leitura da imagem");
    } finally {
      setOcrLoading(false);
    }
  };

  // Global paste listener: pasting image anywhere on the page triggers OCR.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            const dataUrl = await fileToDataUrl(file);
            await runStatusOcr(dataUrl);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          Cadastre manualmente, adicione um print do outfit, ou cole (Ctrl+V) uma screenshot da
          janela de status que a IA preenche pra você.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={handleAdd} className="card-surface space-y-3 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="h-4 w-4 text-rubi-gold" /> Novo personagem
          </h2>

          {/* Paste-status area */}
          <div
            ref={pasteRef}
            className="rounded-lg border border-dashed border-rubi-blue/40 bg-rubi-blue-soft/30 p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rubi-blue">
              <Sparkles className="h-3.5 w-3.5" />
              Ctrl+V para colar print dos status
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              A IA lê nome, vocação, mundo e level da screenshot.
            </p>
            {ocrLoading && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-rubi-gold">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-rubi-gold border-t-transparent" />
                Lendo imagem...
              </div>
            )}
            {flash && (
              <p className="mt-2 rounded bg-rubi-blue/10 px-2 py-1 text-[11px] text-rubi-blue">
                {flash}
              </p>
            )}
          </div>

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

          {/* Outfit upload */}
          <div>
            <span className="text-xs font-medium text-muted-foreground">Outfit (opcional)</span>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-lg border border-border bg-input">
                {outfitUrl ? (
                  <img src={outfitUrl} alt="Outfit" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                  <Upload className="h-3.5 w-3.5" />
                  {outfitUrl ? "Trocar imagem" : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleOutfitFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {outfitUrl && (
                  <button
                    type="button"
                    onClick={() => setOutfitUrl(null)}
                    className="inline-flex items-center justify-center gap-1 rounded-lg border border-rubi-danger/40 px-3 py-1.5 text-xs text-rubi-danger hover:bg-rubi-danger/10"
                  >
                    <X className="h-3.5 w-3.5" /> Remover
                  </button>
                )}
              </div>
            </div>
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
                <ClipboardPaste className="mx-auto mb-3 h-8 w-8 text-rubi-blue" />
                Nenhum personagem cadastrado ainda.
                <br />
                Preencha o formulário ou cole um print dos status.
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
                      <label className="cursor-pointer rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const raw = await fileToDataUrl(file);
                            const compressed = await compressImage(raw, 512, 0.9);
                            await updateCharacter(c.id, { outfitUrl: compressed });
                          }}
                          aria-label="Trocar outfit"
                        />
                      </label>
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
