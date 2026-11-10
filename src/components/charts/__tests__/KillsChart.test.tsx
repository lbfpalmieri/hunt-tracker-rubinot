// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { gameIconUrls } from "@/lib/game-icon";
import { TickIcon } from "../KillsChart";

// Avisa o React que o teste controla as atualizações com act() (sem aviso no console).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

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
/** Só o nome do arquivo do sprite (ex.: "Cloak_Of_Terror.gif"). */
const file = (url: string | null | undefined) =>
  decodeURIComponent(String(url).split("/").pop() ?? "");

/** Simula o sprite atual não existir na wiki (404). */
function failLoad() {
  act(() => {
    icon()!.dispatchEvent(new Event("error"));
  });
}

describe("ícone do monstro no gráfico de Monstros mortos", () => {
  it("passa pra próxima grafia quando o sprite não carrega (Cloak_of_Terror → Cloak_Of_Terror)", () => {
    render("Cloak of Terror");
    expect(file(icon()?.getAttribute("href"))).toBe("Cloak_of_Terror.gif");
    failLoad();
    expect(file(icon()?.getAttribute("href"))).toBe("Cloak_of_Terror.png");
    failLoad();
    expect(file(icon()?.getAttribute("href"))).toBe("Cloak_Of_Terror.gif");
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
    expect(file(icon()?.getAttribute("href"))).toBe("Vibrant_Phantom.gif");
  });

  it("nome vazio não desenha imagem", () => {
    render("");
    expect(icon()).toBeNull();
  });
});
