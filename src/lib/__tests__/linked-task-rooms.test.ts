import { describe, expect, it } from "vitest";
import { currentLinkedTaskRoom, linkedTaskKey } from "../linked-task-rooms";

const room = (id: number, tasks = 3) => ({ id, tasks: Array.from({ length: tasks }, (_, i) => ({ id: i + 1 })) });
const ROOMS = [room(1), room(2), room(3)];
const done = (...keys: [number, number][]) => new Set(keys.map(([r, t]) => linkedTaskKey(r, t)));
const full = (r: number, n = 3): [number, number][] => Array.from({ length: n }, (_, i) => [r, i + 1]);

describe("currentLinkedTaskRoom — sala padrão das Linked Tasks", () => {
  it("sem progresso nenhum: todas as salas", () => {
    expect(currentLinkedTaskRoom(ROOMS, new Set())).toBeNull();
  });

  it("sala pela metade: abre nela", () => {
    expect(currentLinkedTaskRoom(ROOMS, done(...full(1), [2, 1]))).toBe(2);
  });

  it("sala completa: abre a próxima", () => {
    expect(currentLinkedTaskRoom(ROOMS, done(...full(1)))).toBe(2);
    expect(currentLinkedTaskRoom(ROOMS, done(...full(1), ...full(2)))).toBe(3);
  });

  it("sala pela metade vence a primeira vazia que ficou pra trás", () => {
    expect(currentLinkedTaskRoom(ROOMS, done([3, 2]))).toBe(3);
  });

  it("pulou uma sala: a próxima é a primeira não concluída", () => {
    expect(currentLinkedTaskRoom(ROOMS, done(...full(1), ...full(3)))).toBe(2);
  });

  it("tudo concluído: todas as salas", () => {
    expect(currentLinkedTaskRoom(ROOMS, done(...full(1), ...full(2), ...full(3)))).toBeNull();
  });

  it("ignora sala sem tasks", () => {
    expect(currentLinkedTaskRoom([room(1), room(9, 0), room(2)], done(...full(1)))).toBe(2);
  });
});
