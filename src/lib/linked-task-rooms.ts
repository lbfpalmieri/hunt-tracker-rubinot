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
