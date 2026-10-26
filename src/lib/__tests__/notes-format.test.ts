import { describe, expect, it } from "vitest";
import { NOTES_MAX, notesPlainText, parseInline, parseNotes, toggleCheckLine } from "../notes-format";

// Observação da sessão: markdown pequeno salvo como texto puro e montado em elementos React
// (NotesView) — nunca innerHTML.
describe("parseInline", () => {
  it("texto sem marcação vira um pedaço só", () => {
    expect(parseInline("só texto")).toEqual([{ t: "text", v: "só texto" }]);
  });

  it("negrito, itálico, riscado e destaque", () => {
    expect(parseInline("a **b** *c* ~~d~~ ==e==")).toEqual([
      { t: "text", v: "a " },
      { t: "b", c: [{ t: "text", v: "b" }] },
      { t: "text", v: " " },
      { t: "i", c: [{ t: "text", v: "c" }] },
      { t: "text", v: " " },
      { t: "s", c: [{ t: "text", v: "d" }] },
      { t: "text", v: " " },
      { t: "mark", c: [{ t: "text", v: "e" }] },
    ]);
  });

  it("marcação dentro de marcação", () => {
    expect(parseInline("==**x**==")).toEqual([{ t: "mark", c: [{ t: "b", c: [{ t: "text", v: "x" }] }] }]);
  });

  it("conta com asterisco e espaço não vira itálico", () => {
    expect(parseInline("2 * 3 * 4")).toEqual([{ t: "text", v: "2 * 3 * 4" }]);
  });

  it("HTML fica como texto (nada é interpretado)", () => {
    expect(parseInline("<b>oi</b>")).toEqual([{ t: "text", v: "<b>oi</b>" }]);
  });
});

describe("parseNotes", () => {
  const src = [
    "# Título", // 0
    "texto", // 1
    "mais", // 2
    "", // 3
    "- a", // 4
    "- b", // 5
    "1. x", // 6
    "2) y", // 7
    "- [ ] t1", // 8
    "- [x] t2", // 9
    "> q1", // 10
    "> q2", // 11
    "---", // 12
  ].join("\n");
  const blocks = parseNotes(src);

  it("monta os blocos na ordem", () => {
    expect(blocks.map((b) => b.t)).toEqual(["h", "p", "ul", "ol", "check", "quote", "hr"]);
  });

  it("linhas seguidas viram o mesmo parágrafo / lista", () => {
    expect(blocks[1]).toMatchObject({ t: "p", lines: [[{ v: "texto" }], [{ v: "mais" }]] });
    expect(blocks[2]).toMatchObject({ t: "ul", items: [[{ v: "a" }], [{ v: "b" }]] });
    expect(blocks[3]).toMatchObject({ t: "ol", items: [[{ v: "x" }], [{ v: "y" }]] });
    expect(blocks[5]).toMatchObject({ t: "quote", lines: [[{ v: "q1" }], [{ v: "q2" }]] });
  });

  it("checklist guarda marcado e o número da linha (pra marcar/desmarcar)", () => {
    expect(blocks[4]).toMatchObject({
      t: "check",
      items: [
        { checked: false, line: 8, c: [{ v: "t1" }] },
        { checked: true, line: 9, c: [{ v: "t2" }] },
      ],
    });
  });

  it("linha em branco separa listas", () => {
    expect(parseNotes("- a\n\n- b").map((b) => b.t)).toEqual(["ul", "ul"]);
  });

  it("aceita quebra de linha do Windows", () => {
    expect(parseNotes("a\r\nb")).toEqual([{ t: "p", lines: [[{ t: "text", v: "a" }], [{ t: "text", v: "b" }]] }]);
  });

  it("vazio = nenhum bloco", () => {
    expect(parseNotes("")).toEqual([]);
    expect(parseNotes("\n  \n")).toEqual([]);
  });
});

describe("toggleCheckLine", () => {
  const src = "- [ ] levar pot\n- [x] imbuir\ntexto";

  it("marca e desmarca o item da linha", () => {
    expect(toggleCheckLine(src, 0)).toBe("- [x] levar pot\n- [x] imbuir\ntexto");
    expect(toggleCheckLine(src, 1)).toBe("- [ ] levar pot\n- [ ] imbuir\ntexto");
  });

  it("linha que não é checklist ou fora do texto não muda nada", () => {
    expect(toggleCheckLine(src, 2)).toBe(src);
    expect(toggleCheckLine(src, 9)).toBe(src);
  });
});

describe("notesPlainText", () => {
  it("tira as marcações e mantém o conteúdo", () => {
    const src = "**b** e *i*\n- [ ] t\n- [x] u\n# H\n> q\n- l\n---";
    expect(notesPlainText(src)).toBe("b e i\n☐ t\n☑ u\nH\nq\n• l\n—");
  });

  it("limite de tamanho da observação", () => {
    expect(NOTES_MAX).toBe(2000);
  });
});
