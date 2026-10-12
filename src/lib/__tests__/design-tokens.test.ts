// Guarda do design system: telas e componentes só usam os tokens do tema (src/styles.css).
// Cor solta (bg-zinc-800, text-emerald-400...) faz a tela destoar das outras e quebra o Modo Grupo,
// que troca o azul por violeta mudando só as variáveis. Se este teste falhar: use um token
// (bg-surface, text-muted-foreground, text-rubi-success, text-cat-sky...) ou crie um novo em styles.css.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..", "..");
const RAW_PALETTE =
  /\b(?:bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration)-(?:red|blue|green|yellow|amber|orange|purple|violet|emerald|sky|slate|gray|zinc|neutral|stone|rose|pink|indigo|teal|cyan|lime|fuchsia)-\d{2,3}\b/g;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : tsxFiles(full);
    return name.endsWith(".tsx") ? [full] : [];
  });
}

describe("design system: só tokens do tema", () => {
  it("nenhuma tela ou componente usa cor solta da paleta do Tailwind", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(ROOT)) {
      // ui/ são os componentes base do shadcn (variações próprias deles).
      if (file.includes(join("components", "ui"))) continue;
      const hits = readFileSync(file, "utf-8").match(RAW_PALETTE);
      if (hits) offenders.push(`${file.slice(ROOT.length + 1)}: ${[...new Set(hits)].join(", ")}`);
    }
    expect(offenders).toEqual([]);
  });

  it("os tokens de categoria e de elemento usados existem em styles.css", () => {
    const css = readFileSync(join(ROOT, "styles.css"), "utf-8");
    for (const t of ["--cat-sky", "--cat-violet", "--el-fire", "--el-drown", "--frame-edge"]) {
      expect(css).toContain(t + ":");
    }
  });
});
