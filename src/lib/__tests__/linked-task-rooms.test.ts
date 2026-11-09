import { describe, expect, it } from "vitest";
import {
  currentLinkedTaskRoom,
  findLinkedTask,
  findLinkedTaskByCreatures,
  linkedTaskKey,
  linkedTasksWithMonsters,
} from "../linked-task-rooms";

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

describe("calculadora: achar a linked task", () => {
  const task = (id: number, ...names: string[]) => ({ id, creatures: names.map((name) => ({ name })) });
  const SALAS = [
    { id: 1, tasks: [task(1, "Dragon", "Dragon Lord"), task(2, "Hydra")] },
    { id: 4, tasks: [task(1, "Vibrant Phantom", "Courage Leech", "Cloak of Terror"), task(2, "Courage Leech", "Bony Sea Devil", "Turbulent Elemental", "Brachiodemon", "Infernal Demon")] },
  ];

  it("pela chave sala-task", () => {
    expect(findLinkedTask(SALAS, "4-1")?.task.id).toBe(1);
    expect(findLinkedTask(SALAS, "4-1")?.room.id).toBe(4);
    expect(findLinkedTask(SALAS, "9-9")).toBeNull();
    expect(findLinkedTask(SALAS, null)).toBeNull();
  });

  it("pelos monstros da hunt: mais criaturas em comum primeiro, depois a mais completa", () => {
    const r = linkedTasksWithMonsters(SALAS, ["vibrant phantom", "Courage Leech", "Cloak of Terror", "Bonebeast"]);
    expect(r.map((x) => `${x.room.id}-${x.task.id}`)).toEqual(["4-1", "4-2"]);
    expect(r[0].matched).toEqual(["Vibrant Phantom", "Courage Leech", "Cloak of Terror"]);
    expect(r[1].matched).toEqual(["Courage Leech"]);
    expect(linkedTasksWithMonsters(SALAS, ["Rat"])).toEqual([]);
  });

  it("empate em criaturas em comum: a task menor (mais completa) vem antes", () => {
    const r = linkedTasksWithMonsters(SALAS, ["Courage Leech"]);
    expect(r.map((x) => `${x.room.id}-${x.task.id}`)).toEqual(["4-1", "4-2"]);
    const s = linkedTasksWithMonsters(
      [{ id: 1, tasks: [task(1, "A", "B", "C"), task(2, "A")] }],
      ["A"],
    );
    expect(s.map((x) => x.task.id)).toEqual([2, 1]);
  });

  it("link ?linked= acha a task com exatamente as mesmas criaturas", () => {
    expect(findLinkedTaskByCreatures(SALAS, ["Dragon Lord", "dragon"])?.task.id).toBe(1);
    expect(findLinkedTaskByCreatures(SALAS, ["Dragon"])).toBeNull();
    expect(findLinkedTaskByCreatures(SALAS, [])).toBeNull();
  });
});
