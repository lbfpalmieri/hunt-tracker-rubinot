import { beforeAll, describe, expect, it } from "vitest";
import { gameIconUrls, loadSpriteIds, wikiIconUrls } from "../game-icon";

/** Só o nome do arquivo de cada URL, na ordem em que o GameIcon tenta. */
const files = (name: string) => wikiIconUrls(name).map((u) => decodeURIComponent(u.split("/").pop()!));

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
    expect(wikiIconUrls("   ")).toEqual([]);
  });

  it("nunca repete a mesma URL", () => {
    const urls = gameIconUrls("Dragon Lord");
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("sprite sem a wiki: item pelo id, monstro pelo outfit do Canary", () => {
  beforeAll(() => loadSpriteIds());
  const OBJ = "https://static.tibia.com/images/charactertrade/objects/";

  it("item do loot (minúsculo) usa o sprite oficial pelo id", () => {
    expect(gameIconUrls("platinum coin")[0]).toBe(`${OBJ}3035.gif`);
    expect(gameIconUrls("Platinum Coin")[0]).toBe(`${OBJ}3035.gif`);
  });

  it("plural do catálogo de bosses e '(Item)' dos dados do app acham o mesmo item", () => {
    expect(gameIconUrls("gold tokens")[0]).toBe(gameIconUrls("gold token")[0]);
    expect(gameIconUrls("Amber (Item)")[0]).toBe(gameIconUrls("amber")[0]);
    expect(gameIconUrls("amber")[0]).toMatch(/^https:\/\/static\.tibia\.com\/.+\/objects\/\d+\.gif$/);
  });

  it("monstro usa o outfit do Canary e depois a biblioteca do tibia.com", () => {
    const urls = gameIconUrls("Dragon Lord");
    expect(urls[0]).toContain("outfit-images.ots.me");
    expect(urls[0]).toContain("id=39&");
    expect(urls[1]).toBe("https://static.tibia.com/images/library/dragonlord.gif");
  });

  it("nome de item e de monstro: minúsculo é item, com maiúscula é monstro", () => {
    expect(gameIconUrls("scorpion")[0]).toContain("/objects/");
    expect(gameIconUrls("Scorpion")[0]).toContain("outfit-images.ots.me");
  });

  it("ícone guardado no site vem antes de tudo", () => {
    expect(gameIconUrls("Carnage Icon")[0]).toBe("/img/wiki/Carnage_Icon.gif");
    expect(gameIconUrls("Wheel of Destiny Icon")[0]).toBe("/img/wiki/Wheel_of_Destiny_Icon.gif");
  });

  it("nome desconhecido ainda tenta a biblioteca (.gif de criatura, .png de magia) e a wiki, sem repetir URL", () => {
    const urls = gameIconUrls("Monstro Exclusivo do RubinOT");
    expect(urls[0]).toBe("https://static.tibia.com/images/library/monstroexclusivodorubinot.gif");
    expect(gameIconUrls("Divine Grenade")).toContain("https://static.tibia.com/images/library/divinegrenade.png");
    expect(urls.some((u) => u.includes("tibiawiki.com.br"))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
