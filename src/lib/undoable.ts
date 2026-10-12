/**
 * Ação com "Desfazer": roda `run` só depois de `delayMs`, e dá pra cancelar antes disso.
 * Usada ao excluir sessão: some da tela na hora, mas só é apagada de verdade quando o tempo acaba.
 */
export interface UndoableTask {
  /** Cancela se ainda não rodou. Devolve true quando cancelou (nada foi apagado). */
  cancel: () => boolean;
  /** Roda agora (ex.: o jogador não quer mais esperar). Devolve a promessa do `run`. */
  flush: () => Promise<void>;
  /** Já rodou ou foi cancelada. */
  readonly settled: boolean;
}

export function scheduleUndoable(run: () => Promise<void> | void, delayMs: number): UndoableTask {
  let settled = false;
  let started: Promise<void> | null = null;
  let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => void start(), delayMs);

  const start = () => {
    if (settled) return started ?? Promise.resolve();
    settled = true;
    if (timer) clearTimeout(timer);
    timer = null;
    started = Promise.resolve(run());
    return started;
  };

  return {
    cancel() {
      if (settled) return false;
      settled = true;
      if (timer) clearTimeout(timer);
      timer = null;
      return true;
    },
    flush: () => start(),
    get settled() {
      return settled;
    },
  };
}
