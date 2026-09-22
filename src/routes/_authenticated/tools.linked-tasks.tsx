import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Link2, Search, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LinkedTaskDialog } from "@/components/LinkedTaskDialog";
import { fmtNum } from "@/lib/format";
import {
  getLinkedTasks,
  type LinkedTaskEntry,
  type LinkedTaskRoom,
} from "@/lib/linked-tasks.functions";

export const Route = createFileRoute("/_authenticated/tools/linked-tasks")({
  head: () => ({
    meta: [
      { title: "Linked Tasks — RubinOT Hunt Tracker" },
      {
        name: "description",
        content:
          "Todas as salas e linked tasks do RubinOT, com sugestão de elemento mais eficaz contra as criaturas de cada uma.",
      },
      { property: "og:title", content: "Linked Tasks do RubinOT" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: LinkedTasksPage,
});

function LinkedTasksPage() {
  const fetchLinkedTasks = useServerFn(getLinkedTasks);
  const { data, isLoading } = useQuery({
    queryKey: ["linked-tasks"],
    queryFn: () => fetchLinkedTasks(),
  });

  const [roomId, setRoomId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<{ room: LinkedTaskRoom; task: LinkedTaskEntry } | null>(
    null,
  );

  const rooms = useMemo(() => data?.rooms ?? [], [data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: { room: LinkedTaskRoom; task: LinkedTaskEntry }[] = [];
    for (const room of rooms) {
      if (roomId !== "" && room.id !== roomId) continue;
      for (const task of room.tasks) {
        const matches =
          !q ||
          task.name.toLowerCase().includes(q) ||
          task.creatures.some((c) => c.name.toLowerCase().includes(q));
        if (matches) out.push({ room, task });
      }
    }
    return out;
  }, [rooms, roomId, search]);

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
          Ferramentas
        </div>
        <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold">
          <Link2 className="h-7 w-7 text-rubi-gold" /> Linked Tasks
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas as salas e tasks do RubinOT. Ache a sua e veja qual elemento é mais eficaz contra as
          criaturas dela, baseado na TibiaWiki.
        </p>
      </div>

      {data?.error && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-3 text-sm text-rubi-danger">
          <AlertTriangle className="h-4 w-4 flex-none translate-y-0.5" />
          <span>
            {rooms.length > 0
              ? `Não consegui atualizar da wiki agora, mostrando o último dado salvo. (${data.error})`
              : `Não consegui buscar as linked tasks agora. (${data.error})`}
          </span>
        </div>
      )}

      <div className="card-surface mb-6 space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRoomId("")}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
              (roomId === ""
                ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                : "border-border/60 text-muted-foreground hover:border-rubi-blue/40")
            }
          >
            Todas as salas
          </button>
          {rooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => setRoomId(roomId === room.id ? "" : room.id)}
              className={
                "inline-flex items-center gap-2 rounded-lg border py-1 pl-1 pr-3 text-sm font-medium transition-colors " +
                (roomId === room.id
                  ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                  : "border-border/60 text-muted-foreground hover:border-rubi-blue/40")
              }
            >
              <img
                src={room.image}
                alt=""
                className="h-8 w-8 flex-none"
                style={{ objectFit: "contain", imageRendering: "pixelated" }}
              />
              {room.name}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por task ou criatura"
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Link2}
          title="Nenhuma task encontrada"
          description="Tente outro nome de task ou criatura."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ room, task }) => (
            <button
              key={`${room.id}-${task.id}`}
              type="button"
              onClick={() => setActive({ room, task })}
              className="card-surface flex items-start gap-3 p-4 text-left transition-colors hover:border-rubi-blue/50"
            >
              <img
                src={task.image}
                alt=""
                className="h-12 w-12 flex-none"
                style={{ objectFit: "contain", imageRendering: "pixelated" }}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {room.name}
                </div>
                <div className="font-display text-base font-semibold leading-tight">
                  {task.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {fmtNum(task.quantity)}× · {task.creatures.length} criatura(s)
                </div>
                {task.rewards[0] && (
                  <div className="mt-1 text-xs text-rubi-gold">{task.rewards[0]}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <LinkedTaskDialog
        room={active?.room ?? null}
        task={active?.task ?? null}
        open={!!active}
        onOpenChange={(o) => !o && setActive(null)}
      />
    </AppShell>
  );
}
