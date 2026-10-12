import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scheduleUndoable } from "../undoable";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("excluir com Desfazer", () => {
  it("só apaga de verdade quando o tempo do Desfazer acaba", () => {
    const run = vi.fn();
    scheduleUndoable(run, 8000);
    vi.advanceTimersByTime(7999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("desfazer a tempo cancela: nada é apagado", () => {
    const run = vi.fn();
    const task = scheduleUndoable(run, 8000);
    vi.advanceTimersByTime(3000);
    expect(task.cancel()).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(run).not.toHaveBeenCalled();
  });

  it("depois que apagou, desfazer não faz mais nada", () => {
    const run = vi.fn();
    const task = scheduleUndoable(run, 1000);
    vi.advanceTimersByTime(1000);
    expect(task.cancel()).toBe(false);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("apagar agora (flush) roda uma vez só, mesmo com o tempo correndo", async () => {
    const run = vi.fn();
    const task = scheduleUndoable(run, 8000);
    await task.flush();
    await task.flush();
    vi.advanceTimersByTime(60_000);
    expect(run).toHaveBeenCalledTimes(1);
    expect(task.settled).toBe(true);
  });
});
