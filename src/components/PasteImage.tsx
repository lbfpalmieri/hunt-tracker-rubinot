import { useEffect, useState } from "react";
import { ClipboardPaste, ImageIcon, X } from "lucide-react";

export async function compressImage(dataUrl: string, maxDim = 640, quality = 0.8): Promise<string> {
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

export async function blobToCompressedImage(blob: Blob, maxDim = 640, quality = 0.8): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(blob);
  });
  return compressImage(dataUrl, maxDim, quality);
}

/**
 * Ctrl+V image box. While `active` is true it listens to window paste events
 * (ignoring pastes inside inputs/textareas) and reports a compressed WebP data URL.
 */
export function PasteImageBox({
  value,
  onChange,
  label = "Cole uma imagem (Ctrl+V)",
  active = true,
  maxDim = 640,
  quality = 0.8,
  className = "",
}: {
  value: string | null;
  onChange: (dataUrl: string | null) => void | Promise<void>;
  label?: string;
  active?: boolean;
  maxDim?: number;
  quality?: number;
  className?: string;
}) {
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const onPaste = async (e: ClipboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (!item.type.startsWith("image/")) continue;
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        setError(null);
        try {
          const compressed = await blobToCompressedImage(file, maxDim, quality);
          await onChange(compressed);
          setFlash(true);
          setTimeout(() => setFlash(false), 1200);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao colar imagem");
        }
        return;
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [active, maxDim, quality, onChange]);

  return (
    <div className={className}>
      <div
        className={
          "relative flex min-h-28 items-center justify-center overflow-hidden rounded-xl border border-dashed p-3 text-center transition-colors " +
          (flash
            ? "border-rubi-success bg-rubi-success/10"
            : active
              ? "border-rubi-blue/60 bg-rubi-blue-soft/30"
              : "border-border bg-background/40")
        }
      >
        {value ? (
          <>
            <img src={value} alt="Equipamento" className="max-h-56 w-full object-contain" />
            <button
              type="button"
              onClick={() => onChange(null)}
              title="Remover imagem"
              className="absolute right-2 top-2 rounded-md border border-border bg-background/80 p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
            {active ? (
              <ClipboardPaste className="h-5 w-5 text-rubi-blue" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            <span>{label}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rubi-danger">{error}</p>}
    </div>
  );
}
