import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, StickyNote } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listAllSessionNotes } from "@/lib/admin-notes.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/notes")({
  head: () => ({
    meta: [
      { title: "Admin · Observações — RubinOT Hunt Tracker" },
      { name: "description", content: "Leia as observações que os jogadores escrevem nas sessões." },
      { property: "og:title", content: "Admin · Observações" },
      { property: "og:description", content: "Ferramenta do administrador para ler observações das sessões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNotesPage,
});

function AdminNotesPage() {
  const list = useServerFn(listAllSessionNotes);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-session-notes"], queryFn: () => list(), retry: false });
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        !n ||
        r.huntName.toLowerCase().includes(n) ||
        (r.charName ?? "").toLowerCase().includes(n) ||
        r.notes.toLowerCase().includes(n),
    );
  }, [data, q]);

  return (
    <AppShell>
      <Link to="/feedback" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mb-4">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Admin</div>
        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">Observações dos jogadores</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          As observações continuam privadas para os jogadores — só você vê esta lista. Use-a para captar
          informações de hunt que valem virar dado do app.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por hunt, personagem ou texto..."
          className="w-full rounded-lg border border-border bg-background/60 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-rubi-blue"
        />
      </div>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
      ) : error ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Não foi possível carregar."}
        </div>
      ) : rows.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          Nenhuma observação encontrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.sessionId} className="card-surface p-4">
              <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5 text-rubi-gold" />
                <span className="font-semibold text-foreground">{r.charName ?? "—"}</span>
                <span>·</span>
                <span>{r.huntName}</span>
                <span>·</span>
                <span>{fmtDate(r.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.notes}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
