// Testes da lógica pura (src/lib): parser dos analysers, party, cálculos "/h", médias.
// Config separada do vite.config.ts de propósito — os testes não precisam dos plugins do app
// (TanStack Start, Tailwind, nitro), só do alias "@".
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Datas dos analysers são lidas em hora local: fuso fixo = mesmo resultado na sua máquina e no CI.
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
