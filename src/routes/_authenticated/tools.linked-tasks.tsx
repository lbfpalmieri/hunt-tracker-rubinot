import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Link2, Search, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
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
    // Os dados vêm de um cache de 12h no servidor; não faz sentido refazer a
    // chamada (lenta, vai na wiki do RubinOT) a cada visita na página.
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  const [roomId, setRoomId] = useState<number | "">("");
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<{ room: LinkedTaskRoom; task: LinkedTaskEntry } | null>(
    null,
  );

  const rooms = useMemo(() => data?.rooms ?? [], [data]);

  const charId = useAppStore((s) => s.activeCharacterId);
  const charName = useAppStore((s) => s.characters.find((c) => c.id === s.activeCharacterId)?.name ?? "");
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    setDone(new Set());
    if (!charId) return;
    let alive = true;
    db.from("linked_task_progress")
      .select("task_key")
      .eq("character_id", charId)
      .then(({ data: rows }: { data: { task_key: string }[] | null }) => {
        if (alive) setDone(new Set((rows ?? []).map((r) => r.task_key)));
      });
    return () => { alive = false; };
  }, [charId]);
  const toggle = async (key: string) => {
    if (!charId) return;
    const was = done.has(key);
    setDone((prev) => {
      const n = new Set(prev);
      if (was) n.delete(key); else n.add(key);
      return n;
    });
    const { error } = was
      ? await db.from("linked_task_progress").delete().eq("character_id", charId).eq("task_key", key)
      : await db.from("linked_task_progress").insert({ character_id: charId, task_key: key });
    if (error) {
      toast.error("Não consegui salvar", { description: error.message });
      setDone((prev) => {
        const n = new Set(prev);
        if (was) n.add(key); else n.delete(key);
        return n;
      });
    }
  };
  const allKeys = useMemo(() => rooms.flatMap((r) => r.tasks.map((t) => `${r.id}-${t.id}`)), [rooms]);
  const totalTasks = allKeys.length;
  const doneCount = allKeys.filter((k) => done.has(k)).length;

  const roomKeys = (room: LinkedTaskRoom) => room.tasks.map((t) => `${room.id}-${t.id}`);
  const roomDone = (room: LinkedTaskRoom) => roomKeys(room).filter((k) => done.has(k)).length;
  const selectedRoom = roomId === "" ? null : rooms.find((r) => r.id === roomId) ?? null;

  const toggleMany = async (keys: string[], label: string) => {
    if (!charId || bulkBusy || keys.length === 0) return;
    const allDone = keys.every((k) => done.has(k));
    const toAdd = keys.filter((k) => !done.has(k));
    setBulkBusy(true);
    setDone((prev) => {
      const n = new Set(prev);
      if (allDone) keys.forEach((k) => n.delete(k));
      else toAdd.forEach((k) => n.add(k));
      return n;
    });
    const { error } = allDone
      ? await db.from("linked_task_progress").delete().eq("character_id", charId).in("task_key", keys)
      : await db
          .from("linked_task_progress")
          .insert(toAdd.map((task_key) => ({ character_id: charId, task_key })));
    setBulkBusy(false);
    if (error) {
      toast.error("Não consegui salvar", { description: error.message });
      setDone((prev) => {
        const n = new Set(prev);
        if (allDone) keys.forEach((k) => n.add(k));
        else toAdd.forEach((k) => n.delete(k));
        return n;
      });
    } else {
      toast.success(allDone ? `${label} desmarcada` : `${label} concluída`);
    }
  };

  const toggleRoom = (room: LinkedTaskRoom) => toggleMany(roomKeys(room), `Sala "${room.name}"`);
  const toggleAll = () => toggleMany(allKeys, "Todas as tasks");

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

      {charId && totalTasks > 0 && (
        <div className="card-surface mb-4 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">
              Progresso de <span className="text-rubi-gold">{charName}</span>
            </span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">{doneCount}</strong> / {totalTasks} ·{" "}
              {Math.round((doneCount / totalTasks) * 100)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / totalTasks) * 100}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={bulkBusy}
              onClick={toggleAll}
              className={
                "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 " +
                (doneCount === totalTasks
                  ? "border-border/60 text-muted-foreground hover:border-rubi-danger/50 hover:text-rubi-danger"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")
              }
            >
              <Check className="h-4 w-4" />
              {bulkBusy
                ? "Salvando…"
                : doneCount === totalTasks
                  ? "Desmarcar todas as tasks"
                  : "Marcar todas as tasks como concluídas"}
            </button>
            <p className="text-[11px] text-muted-foreground">
              Ou toque no ✓ de cada task para marcar uma por uma.
            </p>
          </div>
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
          {rooms.map((room) => {
            const total = room.tasks.length;
            const doneN = charId ? roomDone(room) : 0;
            const full = charId && doneN === total && total > 0;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomId(roomId === room.id ? "" : room.id)}
                className={
                  "inline-flex items-center gap-2 rounded-lg border py-1 pl-1 pr-3 text-sm font-medium transition-colors " +
                  (roomId === room.id
                    ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                    : full
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                      : "border-border/60 text-muted-foreground hover:border-rubi-blue/40")
                }
              >
                <img
                  src={room.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-8 flex-none"
                  style={{ objectFit: "contain", imageRendering: "pixelated" }}
                />
                {room.name}
                {charId && (
                  <span
                    className={
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold " +
                      (full ? "bg-emerald-500/20 text-emerald-400" : "bg-accent text-muted-foreground")
                    }
                  >
                    {doneN}/{total}
                  </span>
                )}
              </button>
            );
          })}
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

      {selectedRoom && charId && (() => {
        const keys = roomKeys(selectedRoom);
        const doneN = keys.filter((k) => done.has(k)).length;
        const total = keys.length;
        const pct = total ? Math.round((doneN / total) * 100) : 0;
        const full = doneN === total && total > 0;
        return (
          <div className="card-surface mb-6 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                Sala <span className="text-rubi-gold">{selectedRoom.name}</span>
              </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{doneN}</strong> / {total} · {pct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-accent">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={() => toggleRoom(selectedRoom)}
              className={
                "mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 " +
                (full
                  ? "border-border/60 text-muted-foreground hover:border-rubi-danger/50 hover:text-rubi-danger"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20")
              }
            >
              <Check className="h-4 w-4" />
              {bulkBusy
                ? "Salvando…"
                : full
                  ? "Desmarcar sala toda"
                  : "Marcar sala toda como concluída"}
            </button>
          </div>
        );
      })()}

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
          {visible.map(({ room, task }) => {
            const key = `${room.id}-${task.id}`;
            const isDone = done.has(key);
            return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => setActive({ room, task })}
              onKeyDown={(e) => { if (e.key === "Enter") setActive({ room, task }); }}
              className={
                "card-surface relative flex cursor-pointer items-start gap-3 p-4 pr-12 text-left transition-colors hover:border-rubi-blue/50 " +
                (isDone ? "border-emerald-500/50 bg-emerald-500/5" : "")
              }
            >
              {charId && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggle(key); }}
                  title={isDone ? "Desmarcar conclusão" : "Marcar como concluída"}
                  aria-label={isDone ? "Desmarcar conclusão" : "Marcar como concluída"}
                  className={
                    "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-colors " +
                    (isDone
                      ? "border-emerald-500 bg-emerald-500 text-background"
                      : "border-border text-muted-foreground hover:border-emerald-500 hover:text-emerald-400")
                  }
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
              <img
                src={task.image}
                alt=""
                loading="lazy"
                decoding="async"
                className={"h-12 w-12 flex-none " + (isDone ? "opacity-60" : "")}
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
            </div>
            );
          })}
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
