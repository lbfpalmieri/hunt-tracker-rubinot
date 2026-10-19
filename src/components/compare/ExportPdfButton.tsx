import { useState, type RefObject } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { fetchImagesAsDataUrls } from "@/lib/export-images.functions";

interface Props {
  /** Bloco que vira o PDF — título, tabela e tudo que estiver dentro dele. */
  targetRef: RefObject<HTMLElement | null>;
  /** Nome do arquivo, sem extensão. */
  filename: string;
  className?: string;
  /** Avisa a tela pra abrir tudo (setup, roda, charms, Misc Data) enquanto o PDF é gerado. */
  onExportingChange?: (exporting: boolean) => void;
}

/** Nome seguro pra arquivo: sem acento, espaço nem barra. */
function slug(text: string) {
  return (
    text
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "comparativo"
  );
}

/**
 * Exporta o comparativo como um PDF de página única, igual a um print da área
 * inteira (sem cortar a tabela nem repartir em folhas A4). Coisas marcadas com
 * `data-export-hide` (botões, dicas de rolagem) somem do PDF e as marcadas com
 * `data-export-only` (cabeçalho com a data) só aparecem nele.
 */
const BLANK_PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export function ExportPdfButton({ targetRef, filename, className, onExportingChange }: Props) {
  const [busy, setBusy] = useState(false);
  const fetchImages = useServerFn(fetchImagesAsDataUrls);

  const run = async () => {
    const node = targetRef.current;
    if (!node || busy) return;
    setBusy(true);
    onExportingChange?.(true);
    const restore: Array<() => void> = [];
    try {
      // Carrega só quando clica: são bibliotecas pesadas que ninguém precisa pra abrir a página.
      const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
      // Espera a tela re-renderizar com tudo aberto antes de mexer no DOM.
      await new Promise((r) => setTimeout(r, 600));

      node.querySelectorAll<HTMLElement>("[data-export-hide]").forEach((el) => {
        const prev = el.style.display;
        el.style.display = "none";
        restore.push(() => (el.style.display = prev));
      });
      node.querySelectorAll<HTMLElement>("[data-export-only]").forEach((el) => {
        const prev = el.style.display;
        el.style.display = "block";
        restore.push(() => (el.style.display = prev));
      });
      // A tabela rola na horizontal na tela; no PDF ela precisa aparecer inteira.
      node.querySelectorAll<HTMLElement>(".overflow-x-auto").forEach((el) => {
        const prev = el.style.overflow;
        el.style.overflow = "visible";
        restore.push(() => (el.style.overflow = prev));
      });

      // Sprites de outro site (TibiaWiki) não podem ser "fotografados" pelo navegador:
      // o servidor baixa e devolve embutidos. O que não vier vira transparente, pra um
      // ícone faltando não derrubar o PDF inteiro. Vale pra <img> e pra <image> de SVG
      // (a roda e os gráficos usam esse segundo).
      const isRemote = (src: string | null) =>
        !!src && !src.startsWith("data:") && new URL(src, location.href).origin !== location.origin;
      const targets: Array<{ key: string; apply: (url: string) => void }> = [];
      node.querySelectorAll("img").forEach((img) => {
        const key = img.currentSrc || img.src;
        if (!isRemote(key)) return;
        const prevSrc = img.getAttribute("src");
        const prevSrcset = img.getAttribute("srcset");
        targets.push({
          key,
          apply: (url) => {
            img.removeAttribute("srcset");
            img.src = url;
            restore.push(() => {
              if (prevSrc == null) img.removeAttribute("src");
              else img.setAttribute("src", prevSrc);
              if (prevSrcset != null) img.setAttribute("srcset", prevSrcset);
            });
          },
        });
      });
      node.querySelectorAll("image").forEach((im) => {
        const attr = im.hasAttribute("href") ? "href" : "xlink:href";
        const key = im.getAttribute(attr);
        if (!key || !isRemote(key)) return;
        targets.push({
          key: new URL(key, location.href).toString(),
          apply: (url) => {
            im.setAttribute(attr, url);
            restore.push(() => im.setAttribute(attr, key));
          },
        });
      });
      if (targets.length > 0) {
        const urls = Array.from(new Set(targets.map((t) => t.key)));
        const found: Record<string, string> = {};
        for (let i = 0; i < urls.length; i += 60) {
          try {
            Object.assign(
              found,
              (await fetchImages({ data: { urls: urls.slice(i, i + 60) } })).images,
            );
          } catch (err) {
            console.warn("Imagens do PDF: falha no servidor", err);
          }
        }
        for (const t of targets) t.apply(found[t.key] ?? BLANK_PIXEL);
      }
      // Dá um respiro pro navegador aplicar os estilos temporários antes de fotografar.
      await new Promise((r) => setTimeout(r, 150));

      const width = Math.ceil(Math.max(node.scrollWidth, node.getBoundingClientRect().width));
      const height = Math.ceil(node.scrollHeight);
      // O navegador limita o tamanho da imagem (~16 mil px de lado).
      const pixelRatio = Math.min(2, 15000 / Math.max(width, height));
      const bg = getComputedStyle(document.body).backgroundColor;

      const base = {
        pixelRatio,
        width,
        height,
        backgroundColor: bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#0b1020",
      };
      let dataUrl: string;
      try {
        dataUrl = await toPng(node, { ...base, cacheBust: true });
      } catch (first) {
        // Segunda tentativa, mais simples: sem fontes embutidas e sem nenhuma imagem de fora
        // (uma fonte ou ícone que não carrega não pode impedir o PDF de sair).
        console.warn("PDF: 1ª tentativa falhou, tentando sem fontes/imagens externas", first);
        dataUrl = await toPng(node, {
          ...base,
          skipFonts: true,
          filter: (n) => {
            if (n instanceof HTMLImageElement) return !isRemote(n.currentSrc || n.src);
            if (n instanceof SVGImageElement) return !isRemote(n.getAttribute("href"));
            return true;
          },
        });
      }

      // Página única do tamanho exato do print; px do PDF = px da tela.
      const pdf = new jsPDF({
        orientation: width > height ? "landscape" : "portrait",
        unit: "px",
        format: [width, height],
        hotfixes: ["px_scaling"],
        compress: true,
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "FAST");
      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`${slug(filename)}-${stamp}.pdf`);
      toast.success("PDF do comparativo baixado");
    } catch (e) {
      console.error(e);
      toast.error("Não consegui gerar o PDF. Tente de novo.");
    } finally {
      restore.forEach((fn) => fn());
      onExportingChange?.(false);
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      data-export-hide
      className={
        "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-rubi-gold/60 bg-rubi-gold/10 px-3 py-1.5 text-sm font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/20 disabled:opacity-60 " +
        (className ?? "")
      }
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      {busy ? "Gerando PDF..." : "Exportar PDF"}
    </button>
  );
}

/** Cabeçalho que só aparece no PDF, pra o print dizer o que é e de quando. */
export function ExportPdfHeader({ title }: { title: string }) {
  return (
    <div data-export-only style={{ display: "none" }} className="mb-3">
      <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
        RubinOT Hunt Tracker · {new Date().toLocaleDateString("pt-BR")}
      </div>
      <div className="mt-1 font-display text-xl font-bold">{title}</div>
    </div>
  );
}
