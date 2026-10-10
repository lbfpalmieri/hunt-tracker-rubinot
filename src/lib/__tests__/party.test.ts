import { describe, expect, it } from "vitest";
import { detectBlockKind } from "../block-detect";
import { parseHunting } from "../parser";
import {
  applyPartySplit,
  computeSplit,
  findSelfByHunting,
  huntingFromParty,
  isSplit,
  looksLikePartyText,
  looksLikeRubinotPartyHunt,
  mergePartyHunting,
  normalizeParty,
  parsePartyHunt,
  parseSplitterResult,
  partyFromText,
  partyTransfers,
  resplit,
  selfShare,
  transferCommand,
  unsplitHunting,
  type PartyMember,
} from "../party";
import {
  HUNT_TEXT,
  INPUT_TEXT,
  MISC_TEXT,
  OTCLIENT_PARTY_TEXT,
  RUBINOT_PARTY_TEXT,
  SPLITTER_TEXT,
} from "./fixtures";

const member = (name: string, balance: number, over: Partial<PartyMember> = {}): PartyMember => ({
  name,
  leader: false,
  loot: Math.max(0, balance),
  supplies: Math.max(0, -balance),
  balance,
  damage: 0,
  healing: 0,
  ...over,
});

describe("detectBlockKind — qual analyser foi colado", () => {
  it("reconhece cada bloco", () => {
    expect(detectBlockKind(HUNT_TEXT)).toBe("hunting");
    expect(detectBlockKind(INPUT_TEXT)).toBe("damage");
    expect(detectBlockKind(MISC_TEXT)).toBe("misc");
    expect(detectBlockKind(OTCLIENT_PARTY_TEXT)).toBe("party");
    expect(detectBlockKind(SPLITTER_TEXT)).toBe("party");
  });

  it("texto vazio ou desconhecido", () => {
    expect(detectBlockKind("")).toBe("unknown");
    expect(detectBlockKind("   \n ")).toBe("unknown");
    expect(detectBlockKind("oi, tudo bem?")).toBe("unknown");
  });

  it("Party Hunt do RubinOT só é party no Modo Grupo; no Solo continua Hunting Analyser", () => {
    expect(detectBlockKind(RUBINOT_PARTY_TEXT)).toBe("hunting");
    expect(detectBlockKind(RUBINOT_PARTY_TEXT, { groupMode: true })).toBe("party");
    expect(detectBlockKind(RUBINOT_PARTY_TEXT.replace(/\n/g, "\r\n"), { groupMode: true })).toBe(
      "party",
    );
  });

  it("Hunting Analyser de verdade nunca vira party, nem no Modo Grupo", () => {
    expect(detectBlockKind(HUNT_TEXT, { groupMode: true })).toBe("hunting");
    expect(looksLikePartyText(HUNT_TEXT)).toBe(false);
  });
});

describe("looksLikeRubinotPartyHunt", () => {
  it("XP toda 0 + None em criaturas e itens + loot/dano", () => {
    expect(looksLikeRubinotPartyHunt(RUBINOT_PARTY_TEXT)).toBe(true);
    expect(looksLikeRubinotPartyHunt(HUNT_TEXT)).toBe(false);
  });

  it("analyser recém-resetado (tudo 0) não é party", () => {
    const empty = RUBINOT_PARTY_TEXT.replace(/: [\d,]+$/gm, ": 0");
    expect(looksLikeRubinotPartyHunt(empty)).toBe(false);
  });

  it("com XP ou com criaturas não é party", () => {
    expect(looksLikeRubinotPartyHunt(RUBINOT_PARTY_TEXT.replace("XP Gain: 0", "XP Gain: 10"))).toBe(
      false,
    );
    expect(
      looksLikeRubinotPartyHunt(
        RUBINOT_PARTY_TEXT.replace("Killed Monsters:\n\tNone", "Killed Monsters:\n\t3x Rat"),
      ),
    ).toBe(false);
  });
});

describe("parsePartyHunt (formato com membros)", () => {
  const p = parsePartyHunt(OTCLIENT_PARTY_TEXT)!;

  it("lê cabeçalho e membros", () => {
    expect(p.lootType).toBe("Leader");
    expect(p.sessionSec).toBe(68 * 60);
    expect(p.startedAt).toBe("2026-09-26, 19:44:24");
    expect(p.endedAt).toBe("2026-09-26, 20:52:59");
    expect(p.loot).toBe(3_287_370);
    expect(p.supplies).toBe(1_212_946);
    expect(p.balance).toBe(2_074_424);
    expect(p.members.map((m) => m.name)).toEqual(["Lodrak", "Meu Char"]);
  });

  it("marca o líder e mantém balance negativo", () => {
    expect(p.members[0]).toMatchObject({ leader: true, balance: 2_949_850, damage: 5_020_221 });
    expect(p.members[1]).toMatchObject({ leader: false, supplies: 875_426, balance: -875_426 });
  });
});

describe("parseSplitterResult (export real do RubinOT)", () => {
  const r = parseSplitterResult(SPLITTER_TEXT)!;

  it("lê total, parte de cada um, membros e transferências", () => {
    expect(r.total).toBe(9_168_308);
    expect(r.each).toBe(4_584_154);
    expect(r.members).toEqual([
      { name: "Zork Ligth", balance: 8_495_121 },
      { name: "Emplacado", balance: 673_187 },
    ]);
    expect(r.transfers).toEqual([{ from: "Zork Ligth", to: "Emplacado", amount: 3_910_967 }]);
    expect(r.startedAt).toBe("2026-09-27, 06:21:19");
  });

  it("texto sem 'Profit: X (Y each)' não é resultado do LootSplitter", () => {
    expect(parseSplitterResult(HUNT_TEXT)).toBeNull();
  });
});

describe("computeSplit — divisão igual ao LootSplitter do jogo", () => {
  it("bate com as transferências do export real", () => {
    const party = partyFromText(SPLITTER_TEXT, "Emplacado")!;
    const split = computeSplit(party.members!);
    expect(split.total).toBe(9_168_308);
    expect(split.share).toBe(4_584_154);
    expect(split.transfers).toEqual([{ from: "Zork Ligth", to: "Emplacado", amount: 3_910_967 }]);
  });

  it("3 membros: quem está acima da média paga quem está abaixo", () => {
    const split = computeSplit([member("A", 900), member("B", 300), member("C", 0)]);
    expect(split.share).toBe(400);
    expect(split.transfers).toEqual([
      { from: "A", to: "B", amount: 100 },
      { from: "A", to: "C", amount: 400 },
    ]);
  });

  it("membro removido sai do total e da divisão", () => {
    const split = computeSplit([member("A", 300), member("B", 100), member("C", 50, { removed: true })]);
    expect(split.active.map((m) => m.name)).toEqual(["A", "B"]);
    expect(split.total).toBe(400);
    expect(split.share).toBe(200);
    expect(split.transfers).toEqual([{ from: "A", to: "B", amount: 100 }]);
  });

  it("gasto extra é descontado do balance do membro", () => {
    const split = computeSplit([member("A", 300, { extraCost: 100 }), member("B", 100)]);
    expect(split.share).toBe(150);
    expect(split.transfers).toEqual([{ from: "A", to: "B", amount: 50 }]);
  });

  it("líder vem primeiro na ordem", () => {
    const split = computeSplit([member("B", 100), member("A", 300, { leader: true })]);
    expect(split.active.map((m) => m.name)).toEqual(["A", "B"]);
  });

  it("comando do banco", () => {
    expect(transferCommand({ from: "A", to: "B", amount: 50 })).toBe("transfer 50 to B");
  });
});

describe("partyFromText", () => {
  it("formato com membros: acha você pelo nome do personagem (sem diferenciar maiúscula)", () => {
    const p = partyFromText(OTCLIENT_PARTY_TEXT, "meu char")!;
    expect(p.size).toBe(2);
    expect(p.self).toBe("Meu Char");
    expect(p.source).toBe("analyser");
    expect(p.sessionSec).toBe(68 * 60);
    expect(partyFromText(OTCLIENT_PARTY_TEXT, "Outro")!.self).toBeNull();
  });

  it("resultado do LootSplitter vira membros de verdade", () => {
    const p = partyFromText(SPLITTER_TEXT, "Emplacado")!;
    expect(p.source).toBe("splitter");
    expect(p.members).toHaveLength(2);
    expect(selfShare(p)).toBe(4_584_154);
    expect(partyTransfers(p)).toHaveLength(1);
  });

  it("Party Hunt do RubinOT: só com a opção do Modo Grupo, e vira a sua linha (own)", () => {
    expect(partyFromText(RUBINOT_PARTY_TEXT, "Leo")).toBeNull();
    const p = partyFromText(RUBINOT_PARTY_TEXT, "Leo", { rubinotAnalyser: true })!;
    expect(p.members).toBeNull();
    expect(p.own).toEqual({
      loot: 1_942_481,
      supplies: 152_970,
      balance: 1_789_511,
      damage: 5_021_554,
      healing: 981_433,
    });
    expect(p.sessionSec).toBe(72 * 60);
    expect(selfShare(p)).toBeNull();
  });

  it("Hunting Analyser e texto qualquer não viram party", () => {
    expect(partyFromText(HUNT_TEXT, "Leo", { rubinotAnalyser: true })).toBeNull();
    expect(partyFromText("nada", "Leo")).toBeNull();
  });
});

describe("sessão do Modo Grupo", () => {
  const personal = parseHunting(HUNT_TEXT);

  it("só com a party: números da sua linha, sem XP nem criaturas", () => {
    const party = partyFromText(OTCLIENT_PARTY_TEXT, "Meu Char")!;
    const h = huntingFromParty(party);
    // 19:44:24 → 20:52:59
    expect(h.durationSec).toBe(68 * 60 + 35);
    expect(h.rawXp).toBe(0);
    expect(h.kills).toEqual([]);
    expect(h.supplies).toBe(875_426);
    expect(h.balance).toBe(-875_426);
    expect(h.damage).toBe(3_000_000);
    expect(h.damagePerHour).toBe(Math.round(3_000_000 / (h.durationSec / 3600)));
  });

  it("party + Hunting Analyser pessoal: XP/criaturas/itens do seu analyser, duração e lucro da party", () => {
    const party = partyFromText(RUBINOT_PARTY_TEXT, "Leo", { rubinotAnalyser: true })!;
    const h = mergePartyHunting(party, personal);
    const partySec = 72 * 60 + 10; // 10:27:27 → 11:39:37
    expect(h.durationSec).toBe(partySec);
    expect(h.startedAt).toBe("2026-09-29, 10:27:27");
    expect(h.rawXp).toBe(personal.rawXp);
    expect(h.xpGain).toBe(personal.xpGain);
    expect(h.kills).toEqual(personal.kills);
    expect(h.lootedItems).toEqual(personal.lootedItems);
    expect(h.loot).toBe(1_942_481);
    expect(h.supplies).toBe(152_970);
    expect(h.balance).toBe(1_789_511);
    expect(h.damage).toBe(5_021_554);
  });

  it("todo /h usa a duração da PARTY, não a do analyser pessoal nem o /h colado", () => {
    const party = partyFromText(RUBINOT_PARTY_TEXT, "Leo", { rubinotAnalyser: true })!;
    const h = mergePartyHunting(party, personal);
    const hours = h.durationSec / 3600;
    expect(h.rawXpPerHour).toBe(Math.round(personal.rawXp / hours));
    expect(h.xpPerHour).toBe(Math.round(personal.xpGain / hours));
    expect(h.rawXpPerHour).not.toBe(personal.rawXpPerHour);
  });

  it("sem o analyser pessoal é igual a huntingFromParty", () => {
    const party = partyFromText(OTCLIENT_PARTY_TEXT, "Meu Char")!;
    expect(mergePartyHunting(party, null)).toEqual(huntingFromParty(party));
  });

  it("resultado do LootSplitter: loot/supplies/dano vêm do analyser pessoal", () => {
    const party = partyFromText(SPLITTER_TEXT, "Emplacado")!;
    const h = mergePartyHunting(party, personal);
    expect(h.loot).toBe(personal.loot);
    expect(h.supplies).toBe(personal.supplies);
    expect(h.balance).toBe(personal.balance);
    expect(h.damage).toBe(personal.damage);
    // 06:21:19 → 07:10:20
    expect(h.durationSec).toBe(49 * 60 + 1);
  });
});

describe("findSelfByHunting — acha você pelos números", () => {
  const members = [member("A", 2_949_850, { loot: 3_287_370, supplies: 337_520 }), member("B", 124_574, { loot: 1_000_000, supplies: 875_426 })];

  it("balance igual", () => {
    expect(findSelfByHunting(members, { loot: 1, supplies: 1, balance: 124_574 })).toBe("B");
  });

  it("loot e supplies a até 3%", () => {
    expect(findSelfByHunting(members, { loot: 1_000_100, supplies: 875_400, balance: 124_700 })).toBe("B");
  });

  it("sem candidato único devolve null", () => {
    expect(findSelfByHunting(members, { loot: 5, supplies: 5, balance: 0 })).toBeNull();
    const twins = [member("A", 100), member("B", 100)];
    expect(findSelfByHunting(twins, { loot: 100, supplies: 0, balance: 100 })).toBeNull();
  });
});

describe("applyPartySplit — o que é salvo na sessão", () => {
  const party = partyFromText(OTCLIENT_PARTY_TEXT, "Meu Char")!;
  const base = huntingFromParty(party);
  const share = (2_949_850 - 875_426) / 2;

  it("balance vira a parte da divisão e loot = parte + supplies próprios", () => {
    const out = applyPartySplit(base, party);
    expect(out.hunting.balance).toBe(share);
    expect(out.hunting.loot).toBe(share + 875_426);
    expect(out.hunting.supplies).toBe(875_426);
    expect(out.party?.size).toBe(2);
    expect(out.party?.personal).toEqual({ loot: 0, balance: -875_426 });
    expect(isSplit(out.party)).toBe(true);
  });

  it("aplicar duas vezes não acumula", () => {
    const once = applyPartySplit(base, party);
    const twice = applyPartySplit(once.hunting, once.party);
    expect(twice.hunting.balance).toBe(once.hunting.balance);
    expect(twice.hunting.loot).toBe(once.hunting.loot);
  });

  it("unsplitHunting devolve os números pessoais", () => {
    const out = applyPartySplit(base, party);
    const back = unsplitHunting(out.hunting, out.party);
    expect(back.balance).toBe(-875_426);
    expect(back.loot).toBe(0);
  });

  it("resplit: tirar a party volta pro pessoal; trocar refaz a divisão", () => {
    const out = applyPartySplit(base, party);
    const solo = resplit(out.hunting, out.party, null);
    expect(solo.party).toBeNull();
    expect(solo.hunting.balance).toBe(-875_426);

    const removedLeader = {
      ...party,
      members: party.members!.map((m) => (m.leader ? { ...m, extraCost: 1_000_000 } : m)),
    };
    const again = resplit(out.hunting, out.party, removedLeader);
    expect(again.hunting.balance).toBe(share - 500_000);
  });

  it("sem saber quem é você (ou sem membros) não divide", () => {
    const unknown = applyPartySplit(base, { ...party, self: null });
    expect(unknown.hunting.balance).toBe(base.balance);
    expect(isSplit(unknown.party)).toBe(false);

    const own = partyFromText(RUBINOT_PARTY_TEXT, "Leo", { rubinotAnalyser: true })!;
    const h = huntingFromParty(own);
    const out = applyPartySplit(h, { ...own, size: 4 });
    expect(out.hunting.balance).toBe(1_789_511);
    expect(out.party?.size).toBe(4);
  });

  it("sem party devolve a sessão como está", () => {
    expect(applyPartySplit(base, null)).toEqual({ hunting: base, party: null });
  });
});

describe("normalizeParty — leitura do jsonb salvo", () => {
  it("valor inválido vira null", () => {
    expect(normalizeParty(null)).toBeNull();
    expect(normalizeParty("x")).toBeNull();
    expect(normalizeParty({ size: 1 })).toBeNull();
  });

  it("mantém o que foi salvo e descarta campos desconhecidos", () => {
    const saved = applyPartySplit(
      huntingFromParty(partyFromText(OTCLIENT_PARTY_TEXT, "Meu Char")!),
      { ...partyFromText(OTCLIENT_PARTY_TEXT, "Meu Char")!, noHuntingAnalyser: true },
    ).party;
    const back = normalizeParty({ ...JSON.parse(JSON.stringify(saved)), lixo: 1 })!;
    expect(back.size).toBe(2);
    expect(back.self).toBe("Meu Char");
    expect(back.members).toHaveLength(2);
    expect(back.personal).toEqual({ loot: 0, balance: -875_426 });
    expect(back.noHuntingAnalyser).toBe(true);
    expect(back).not.toHaveProperty("lixo");
  });

  it("guarda a linha do Party Hunt do RubinOT (own)", () => {
    const own = partyFromText(RUBINOT_PARTY_TEXT, "Leo", { rubinotAnalyser: true })!;
    expect(normalizeParty(JSON.parse(JSON.stringify(own)))!.own).toEqual(own.own);
  });
});
