/**
 * Progresso das Linked Tasks por sala. A chave salva em linked_task_progress.task_key é
 * "<id da sala>-<id da task>" e as salas vêm na ordem do jogo (página de linked tasks da wiki).
 */
interface RoomLike {
  id: number;
  tasks: { id: number }[];
}

export const linkedTaskKey = (roomId: number, taskId: number) => `${roomId}-${taskId}`;

/**
 * Sala que a página abre por padrão: a que o jogador está fazendo (a primeira com parte das tasks
 * concluídas) ou, sem nenhuma pela metade, a próxima depois das completas (a primeira não
 * concluída). Sem progresso nenhum ou com tudo concluído → null ("Todas as salas").
 */
export function currentLinkedTaskRoom(rooms: RoomLike[], done: ReadonlySet<string>): number | null {
  const counts = rooms
    .filter((r) => r.tasks.length > 0)
    .map((r) => ({
      id: r.id,
      total: r.tasks.length,
      done: r.tasks.filter((t) => done.has(linkedTaskKey(r.id, t.id))).length,
    }));
  if (!counts.some((c) => c.done > 0)) return null;
  const partial = counts.find((c) => c.done > 0 && c.done < c.total);
  if (partial) return partial.id;
  return counts.find((c) => c.done < c.total)?.id ?? null;
}

interface TaskWithCreatures {
  id: number;
  creatures: { name: string }[];
}
interface RoomWithCreatures {
  id: number;
  tasks: TaskWithCreatures[];
}

/** Acha a task pela chave "<sala>-<task>" (a mesma de linked_task_progress). */
export function findLinkedTask<R extends RoomWithCreatures>(
  rooms: R[],
  key: string | null | undefined,
): { room: R; task: R["tasks"][number] } | null {
  if (!key) return null;
  for (const room of rooms) {
    for (const task of room.tasks) if (linkedTaskKey(room.id, task.id) === key) return { room, task };
  }
  return null;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Linked tasks que têm pelo menos uma das criaturas (ex.: as que você matou numa hunt): as com mais
 * criaturas em comum primeiro e, no empate, a que fica mais "completa" (3 de 3 antes de 3 de 5).
 * `matched` sai com o nome escrito como na task.
 */
export function linkedTasksWithMonsters<R extends RoomWithCreatures>(
  rooms: R[],
  monsters: string[],
): { room: R; task: R["tasks"][number]; matched: string[] }[] {
  const have = new Set(monsters.map(norm));
  const out: { room: R; task: R["tasks"][number]; matched: string[]; order: number }[] = [];
  let order = 0;
  for (const room of rooms) {
    for (const task of room.tasks) {
      const matched = task.creatures.map((c) => c.name).filter((n) => have.has(norm(n)));
      if (matched.length > 0) out.push({ room, task, matched, order: order++ });
    }
  }
  return out
    .sort(
      (a, b) =>
        b.matched.length - a.matched.length ||
        b.matched.length / b.task.creatures.length - a.matched.length / a.task.creatures.length ||
        a.order - b.order,
    )
    .map(({ room, task, matched }) => ({ room, task, matched }));
}

/** A task com exatamente essas criaturas (vindo de um link ?linked=A|B), ou null. */
export function findLinkedTaskByCreatures<R extends RoomWithCreatures>(
  rooms: R[],
  names: string[],
): { room: R; task: R["tasks"][number] } | null {
  const want = new Set(names.map(norm));
  if (want.size === 0) return null;
  for (const room of rooms) {
    for (const task of room.tasks) {
      const got = new Set(task.creatures.map((c) => norm(c.name)));
      if (got.size === want.size && [...want].every((n) => got.has(n))) return { room, task };
    }
  }
  return null;
}
