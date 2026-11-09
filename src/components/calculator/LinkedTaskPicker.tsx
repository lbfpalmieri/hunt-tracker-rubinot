import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Link2, MapPin, Search, Swords } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameIcon } from "@/components/GameIcon";
import { fmtNum } from "@/lib/format";
import { listHunts, rankHuntsByTask, type HuntMonsters, type HuntSpeedSession } from "@/lib/hunt-speed";
import {
  currentLinkedTaskRoom,
  linkedTaskKey,
  linkedTasksWithMonsters,
} from "@/lib/linked-task-rooms";
import type { LinkedTaskEntry, LinkedTaskRoom } from "@/lib/linked-tasks.functions";

export type PickerTab = "task" | "hunt";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: PickerTab;
  onTabChange: (tab: PickerTab) => void;
  rooms: LinkedTaskRoom[];
  loading: boolean;
  error?: string;
  selectedKey: string | null;
  /** Tasks já concluídas pelo personagem (chave "<sala>-<task>"). */
  done: ReadonlySet<string>;
  /** Sessões do personagem escolhido na calculadora. */
  sessions: HuntSpeedSession[];
  onPickTask: (room: LinkedTaskRoom, task: LinkedTaskEntry) => void;
  onUseHuntMonsters: (hunt: HuntMonsters) => void;
}

const TAB_TRIGGER =
  "flex-1 gap-1.5 rounded-md px-2 py-1.5 text-sm data-[state=active]:bg-rubi-gold data-[state=active]:text-background data-[state=active]:shadow-glow-gold";

/** Sprite da criatura pela TibiaWiki; se a wiki não tiver, a imagem da wiki do RubinOT. */
export function CreatureIcon({ name, image, size = 20 }: { name: string; image?: string; size?: number }) {
  return (
    <GameIcon
      name={name}
      size={size}
      className="flex-none"
      fallback={
        image ? (
          <img
            src={image}
            alt=""
            width={size}
            height={size}
            loading="lazy"
            className="flex-none"
            style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated" }}
          />
        ) : null
      }
    />
  );
}

/**
 * Escolher a linked task da calculadora: pela lista de tasks do jogo (mostra se você já tem hunt
 * com aquelas criaturas) ou por uma hunt sua (mostra as tasks que têm criaturas dela).
 */
export function LinkedTaskPicker(props: Props) {
  const { open, onOpenChange, tab, onTabChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Link2 className="h-5 w-5 text-rubi-gold" /> Escolher a linked task
          </DialogTitle>
          <DialogDescription>
            A calculadora pega as criaturas e a quantidade da task. Nas suas hunts, só as criaturas da
            task contam.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => onTabChange(v as PickerTab)}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-background/50 p-1">
            <TabsTrigger value="task" className={TAB_TRIGGER}>
              <Link2 className="h-4 w-4" /> Pela linked task
            </TabsTrigger>
            <TabsTrigger value="hunt" className={TAB_TRIGGER}>
              <MapPin className="h-4 w-4" /> Pela minha hunt
            </TabsTrigger>
          </TabsList>
          <TabsContent value="task" className="mt-4">
            {open && tab === "task" && <ByTask {...props} />}
          </TabsContent>
          <TabsContent value="hunt" className="mt-4">
            {open && tab === "hunt" && <ByHunt {...props} />}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-border/60 bg-background/30 p-4 text-sm text-muted-foreground">{children}</p>;
}

function LoadingOrError({ loading, error, rooms }: Pick<Props, "loading" | "error" | "rooms">) {
  if (loading)
    return (
      <div role="status" aria-label="Carregando as linked tasks" className="grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    );
  if (rooms.length === 0)
    return <Notice>Não consegui buscar as linked tasks agora{error ? ` (${error})` : ""}. Tente de novo em instantes.</Notice>;
  return null;
}

function ByTask({ rooms, loading, error, selectedKey, done, sessions, onPickTask }: Props) {
  const [roomId, setRoomId] = useState<number | "">(() => {
    const sel = rooms.find((r) => r.tasks.some((t) => linkedTaskKey(r.id, t.id) === selectedKey));
    return sel?.id ?? currentLinkedTaskRoom(rooms, done) ?? "";
  });
  const [search, setSearch] = useState("");
  const [onlyHunted, setOnlyHunted] = useState(false);

  // As tasks chegaram depois de abrir: cai na sala atual.
  useEffect(() => {
    if (roomId === "" && rooms.length > 0 && !search) setRoomId(currentLinkedTaskRoom(rooms, done) ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms.length]);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out: { room: LinkedTaskRoom; task: LinkedTaskEntry; best: ReturnType<typeof rankHuntsByTask>[number] | undefined }[] = [];
    for (const room of rooms) {
      // Buscando, procura em todas as salas.
      if (!q && roomId !== "" && room.id !== roomId) continue;
      for (const task of room.tasks) {
        if (
          q &&
          !task.name.toLowerCase().includes(q) &&
          !room.name.toLowerCase().includes(q) &&
          !task.creatures.some((c) => c.name.toLowerCase().includes(q))
        )
          continue;
        const best = rankHuntsByTask(sessions, task.creatures.map((c) => c.name), task.quantity)[0];
        if (onlyHunted && !best) continue;
        out.push({ room, task, best });
      }
    }
    return out;
  }, [rooms, roomId, search, onlyHunted, sessions]);

  const blocked = LoadingOrError({ loading, error, rooms });
  if (blocked) return blocked;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            aria-label="Buscar linked task ou criatura"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar task ou criatura"
            className="w-full rounded-lg border border-border bg-input py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          aria-pressed={onlyHunted}
          onClick={() => setOnlyHunted((v) => !v)}
          className={
            "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors " +
            (onlyHunted
              ? "border-rubi-success/60 bg-rubi-success/10 text-rubi-success"
              : "border-border/60 text-muted-foreground hover:text-foreground")
          }
        >
          <Swords className="h-4 w-4" /> Só com hunt feita
        </button>
      </div>

      {!search.trim() && (
        <div className="flex flex-wrap gap-1.5">
          <RoomChip active={roomId === ""} onClick={() => setRoomId("")}>
            Todas
          </RoomChip>
          {rooms.map((room) => {
            const total = room.tasks.length;
            const doneN = room.tasks.filter((t) => done.has(linkedTaskKey(room.id, t.id))).length;
            return (
              <RoomChip key={room.id} active={roomId === room.id} onClick={() => setRoomId(room.id)}>
                <img
                  src={room.image}
                  alt=""
                  loading="lazy"
                  className="h-6 w-6 flex-none"
                  style={{ objectFit: "contain", imageRendering: "pixelated" }}
                />
                {room.name}
                <span className="text-2xs text-muted-foreground">
                  {doneN}/{total}
                </span>
              </RoomChip>
            );
          })}
        </div>
      )}

      {items.length === 0 ? (
        <Notice>
          {onlyHunted
            ? "Nenhuma task dessa lista tem criatura que você já caçou com esse personagem."
            : "Nenhuma task com esse nome ou criatura."}
        </Notice>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map(({ room, task, best }) => {
            const key = linkedTaskKey(room.id, task.id);
            const isSelected = key === selectedKey;
            const isDone = done.has(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onPickTask(room, task)}
                  aria-pressed={isSelected}
                  className={
                    "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors " +
                    (isSelected
                      ? "border-rubi-gold bg-rubi-gold/10"
                      : "border-border/60 bg-background/30 hover:border-rubi-blue/50")
                  }
                >
                  <img
                    src={task.image}
                    alt=""
                    loading="lazy"
                    className={"h-10 w-10 flex-none " + (isDone ? "opacity-60" : "")}
                    style={{ objectFit: "contain", imageRendering: "pixelated" }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-display text-sm font-semibold leading-tight">{task.name}</span>
                      {isDone && (
                        <span className="inline-flex flex-none items-center gap-0.5 rounded bg-rubi-success/15 px-1.5 py-0.5 text-2xs font-semibold text-rubi-success">
                          <Check className="h-3 w-3" /> Feita
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-2xs text-muted-foreground">
                      {room.name} · {fmtNum(task.quantity)}× · {task.creatures.length} criatura(s)
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {task.creatures.map((c) => (
                        <span key={c.name} title={c.name}>
                          <CreatureIcon name={c.name} image={c.image} size={22} />
                        </span>
                      ))}
                    </span>
                    <span
                      className={
                        "mt-1.5 block text-xs " + (best ? "text-rubi-success" : "text-muted-foreground")
                      }
                    >
                      {best
                        ? `Hunt feita: ${best.huntName} · ${fmtNum(best.perHour)}/h`
                        : "Nenhuma hunt sua com essas criaturas"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RoomChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors " +
        (active
          ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
          : "border-border/60 text-muted-foreground hover:border-rubi-blue/40")
      }
    >
      {children}
    </button>
  );
}

function ByHunt({ rooms, loading, error, sessions, onPickTask, onUseHuntMonsters, selectedKey }: Props) {
  const hunts = useMemo(() => listHunts(sessions), [sessions]);
  const [huntName, setHuntName] = useState<string | null>(null);
  const hunt = hunts.find((h) => h.huntName === huntName) ?? null;
  const matches = useMemo(
    () => (hunt ? linkedTasksWithMonsters(rooms, hunt.monsters.map((m) => m.name)) : []),
    [rooms, hunt],
  );

  if (hunts.length === 0)
    return <Notice>Esse personagem ainda não tem sessão salva. Salve uma hunt pra escolher por ela.</Notice>;

  if (!hunt)
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Toque na hunt: mostramos as linked tasks que têm criaturas dela.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {hunts.map((h) => (
            <li key={h.huntName}>
              <button
                type="button"
                onClick={() => setHuntName(h.huntName)}
                className="flex w-full flex-col gap-1.5 rounded-lg border border-border/60 bg-background/30 p-3 text-left transition-colors hover:border-rubi-blue/50"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-display text-sm font-semibold leading-tight">{h.huntName}</span>
                  <span className="flex-none text-2xs text-muted-foreground">{h.sessionCount} sessão(ões)</span>
                </span>
                <span className="flex flex-wrap gap-1">
                  {h.monsters.slice(0, 8).map((m) => (
                    <span key={m.name} title={`${m.name}: ${fmtNum(m.count)}`}>
                      <GameIcon name={m.name} size={22} className="flex-none" />
                    </span>
                  ))}
                  {h.monsters.length > 8 && (
                    <span className="self-center text-2xs text-muted-foreground">+{h.monsters.length - 8}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  const blocked = LoadingOrError({ loading, error, rooms });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-2xs font-medium uppercase tracking-wider text-muted-foreground">Hunt</div>
          <div className="font-display text-base font-semibold">{hunt.huntName}</div>
        </div>
        <button
          type="button"
          onClick={() => setHuntName(null)}
          className="min-h-11 text-sm font-medium text-rubi-blue hover:underline"
        >
          Trocar hunt
        </button>
      </div>

      {blocked ?? (
        <>
          {matches.length === 0 ? (
            <Notice>Nenhuma linked task tem criaturas dessa hunt.</Notice>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Linked tasks com criaturas dessa hunt. As outras criaturas da hunt não contam pra task.
              </p>
              <ul className="space-y-2">
                {matches.map(({ room, task, matched }) => {
                  const key = linkedTaskKey(room.id, task.id);
                  const has = new Set(matched.map((n) => n.toLowerCase()));
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => onPickTask(room, task)}
                        aria-pressed={key === selectedKey}
                        className={
                          "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors " +
                          (key === selectedKey
                            ? "border-rubi-gold bg-rubi-gold/10"
                            : "border-border/60 bg-background/30 hover:border-rubi-blue/50")
                        }
                      >
                        <img
                          src={task.image}
                          alt=""
                          loading="lazy"
                          className="h-10 w-10 flex-none"
                          style={{ objectFit: "contain", imageRendering: "pixelated" }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-display text-sm font-semibold leading-tight">{task.name}</span>
                          <span className="mt-0.5 block text-2xs text-muted-foreground">
                            {room.name} · {fmtNum(task.quantity)}×
                          </span>
                          <span className="mt-1.5 flex flex-wrap gap-1">
                            {task.creatures.map((c) => (
                              <span
                                key={c.name}
                                title={has.has(c.name.toLowerCase()) ? `${c.name}: tem nessa hunt` : `${c.name}: não tem nessa hunt`}
                                className={has.has(c.name.toLowerCase()) ? "" : "opacity-30"}
                              >
                                <CreatureIcon name={c.name} image={c.image} size={22} />
                              </span>
                            ))}
                          </span>
                        </span>
                        <span className="flex-none rounded bg-rubi-success/15 px-1.5 py-0.5 text-2xs font-semibold text-rubi-success">
                          {matched.length} de {task.creatures.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <button
            type="button"
            onClick={() => onUseHuntMonsters(hunt)}
            className="inline-flex min-h-11 items-center text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            Usar todas as criaturas dessa hunt, sem escolher task
          </button>
        </>
      )}
    </div>
  );
}
