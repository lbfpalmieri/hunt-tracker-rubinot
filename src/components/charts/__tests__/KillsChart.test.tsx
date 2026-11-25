// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { gameIconUrls, loadSpriteIds } from "@/lib/game-icon";
import { TickIcon } from "../KillsChart";

// Avisa o React que o teste controla as atualizações com act() (sem aviso no console).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

// Com os ids de item e os outfits já carregados, o ícone sai na primeira renderização.
beforeAll(() => loadSpriteIds());

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(name: string) {
  act(() =>
    root.render(
      <svg>
        <TickIcon name={name} />
      </svg>,
    ),
  );
}

const icon = () => container.querySelector("image");
const href = () => icon()?.getAttribute("href");

/** Simula o sprite atual não carregar (404). */
function failLoad() {
  act(() => {
    icon()!.dispatchEvent(new Event("error"));
  });
}

describe("ícone do monstro no gráfico de Monstros mortos", () => {
  it("passa pra próxima URL quando o sprite não carrega (outfit → biblioteca → wiki)", () => {
    const urls = gameIconUrls("Cloak of Terror");
    render("Cloak of Terror");
    expect(href()).toBe(urls[0]);
    expect(urls[0]).toContain("outfit-images.ots.me");
    failLoad();
    expect(href()).toBe(urls[1]);
    failLoad();
    expect(href()).toBe(urls[2]);
  });

  it("nome que já vem certo usa a primeira URL, sem tentar as outras", () => {
    render("Courage Leech");
    expect(icon()?.getAttribute("href")).toBe(gameIconUrls("Courage Leech")[0]);
  });

  it("some (nem ícone quebrado) quando nenhuma grafia existe", () => {
    const total = gameIconUrls("Monstro Inventado").length;
    render("Monstro Inventado");
    for (let i = 0; i < total; i++) failLoad();
    expect(icon()).toBeNull();
  });

  it("recomeça da primeira grafia quando o nome muda", () => {
    render("Cloak of Terror");
    failLoad();
    failLoad();
    render("Vibrant Phantom");
    expect(href()).toBe(gameIconUrls("Vibrant Phantom")[0]);
  });

  it("nome vazio não desenha imagem", () => {
    render("");
    expect(icon()).toBeNull();
  });
});
