import { describe, expect, it } from "vitest";
import { gameIconUrls } from "../game-icon";

/** Só o nome do arquivo de cada URL, na ordem em que o GameIcon tenta. */
const files = (name: string) => gameIconUrls(name).map((u) => decodeURIComponent(u.split("/").pop()!));

describe("sprite da TibiaWiki: nomes de arquivo a tentar", () => {
  it("nome simples: .gif e depois .png", () => {
    expect(files("Courage Leech")).toEqual(["Courage_Leech.gif", "Courage_Leech.png"]);
  });

  it("'of/the/a' como o jogo escreve também tenta tudo maiúsculo (Cloak_Of_Terror.gif)", () => {
    expect(files("Cloak of Terror")).toEqual([
      "Cloak_of_Terror.gif",
      "Cloak_of_Terror.png",
      "Cloak_Of_Terror.gif",
      "Cloak_Of_Terror.png",
    ]);
    expect(files("Memory of a Banshee")).toContain("Memory_Of_A_Banshee.gif");
  });

  it("hífen: maiúscula depois do hífen (Two-Headed_Turtle.gif)", () => {
    expect(files("Two-headed Turtle")).toContain("Two-Headed_Turtle.gif");
    expect(files("Rotten Man-maggot")).toContain("Rotten_Man-Maggot.gif");
  });

  it("criatura com página '(Criatura)' tenta essa primeiro", () => {
    expect(files("Sabretooth")[0]).toBe("Sabretooth_(Criatura).gif");
    expect(files("The First Dragon")[0]).toBe("The_First_Dragon_(Criatura).gif");
    expect(files("Dragon")[0]).toBe("Dragon.gif");
  });

  it("item em minúsculo vira Title Case e nome vazio não tem URL", () => {
    expect(files("platinum coin")[0]).toBe("Platinum_Coin.gif");
    expect(files("wand of starstorm")[0]).toBe("Wand_of_Starstorm.gif");
    expect(gameIconUrls("   ")).toEqual([]);
  });

  it("nunca repete a mesma URL", () => {
    const urls = gameIconUrls("Dragon Lord");
    expect(new Set(urls).size).toBe(urls.length);
  });
});
