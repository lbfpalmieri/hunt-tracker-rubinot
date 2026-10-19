import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Baixa pelo servidor as imagens (sprites de monstro/item) que o comparativo
 * mostra e devolve como data URL, pra exportação em PDF.
 *
 * Por que existe: o navegador só deixa "fotografar" a tela (html-to-image)
 * com imagens do mesmo domínio ou com CORS liberado — a TibiaWiki não libera,
 * então sem isso o PDF quebra inteiro por causa de um ícone. O servidor não
 * tem essa trava.
 *
 * Segurança: só aceita hosts da lista abaixo (os mesmos que o app já usa pra
 * sprites) e só devolve o que for imagem pequena — não é um proxy aberto.
 */

const ALLOWED_HOSTS = new Set([
  "www.tibiawiki.com.br",
  "wiki.rubinot.com",
  "pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev",
]);
const MAX_URLS = 80;
const MAX_BYTES = 400_000;
const CONCURRENCY = 6;

function toDataUrl(buf: ArrayBuffer, type: string) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${type};base64,${btoa(bin)}`;
}

async function fetchOne(url: string): Promise<string | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) return null;
    const res = await fetch(u.toString(), { redirect: "error" });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/") || type.includes("svg")) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) return null;
    return toDataUrl(buf, type);
  } catch {
    return null;
  }
}

export const fetchImagesAsDataUrls = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ urls: z.array(z.string().max(500)).max(MAX_URLS) }).parse(input),
  )
  .handler(async ({ data }) => {
    const urls = Array.from(new Set(data.urls));
    const out: Record<string, string> = {};
    let next = 0;
    async function worker() {
      while (next < urls.length) {
        const url = urls[next++];
        const dataUrl = await fetchOne(url);
        if (dataUrl) out[url] = dataUrl;
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, worker));
    return { images: out };
  });
