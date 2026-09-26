import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Merge, Pencil, Search, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { listAllHuntNames, renameHuntGlobal } from "@/lib/admin-hunts.functions";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/admin/hunts")({
  head: () => ({
    meta: [
      { title: "Admin · Nomes de hunt — RubinOT Hunt Tracker" },
      { name: "description", content: "Corrija e junte nomes de hunt de todos os jogadores." },
      { property: "og:title", content: "Admin · Nomes de hunt" },
      { property: "og:description", content: "Ferramenta do administrador para organizar nomes de hunt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHuntsPage,
});

function AdminHuntsPage() {
  const list = useServerFn(listAllHuntNames);
  const rename = useServerFn(renameHuntGlobal);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["admin-hunt-names"], queryFn: () => list(), retry: false });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (data ?? []).filter((r) => !n || r.name.toLowerCase().includes(n));
  }, [data, q]);

  const target = value.trim().replace(/\s+/g, " ").toLowerCase();
  const collision = editing ? (data ?? []).find((r) => r.key === target && r.key !== editing) : undefined;

  const save = async (fromName: string) => {
    if (value.trim().length < 2) return toast.error("Nome muito curto.");
    setBusy(true);
    try {
      const r = await rename({ data: { from: fromName, to: value } });
      toast.success(
        r.merged
          ? `${r.updated} sessão(ões) juntadas em "${r.finalName}".`
          : `${r.updated} sessão(ões) renomeadas para "${r.finalName}".`,
      );
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["admin-hunt-names"] });
      void useAppStore.getState().loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível renomear.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <Link to="/feedback" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="mb-5">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Administrador</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Nomes de hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Renomeie hunts de todos os jogadores. Se o novo nome já existir, as sessões são juntadas na hunt existente.
        </p>
      </div>

      {error ? (
        <p className="card-surface p-6 text-center text-sm text-rubi-danger">
          {error instanceof Error ? error.message : "Acesso negado."}
        </p>
      ) : (
        <>
          <div className="card-surface relative mb-3 p-3">
            <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar hunt..."
              className="w-full rounded-lg border border-border bg-background/60 py-2 pl-9 pr-3 text-sm"
            />
          </div>
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
          ) : (
            <ul className="space-y-2">
              {rows.map((r) => (
                <li key={r.key} className="card-surface px-4 py-3">
                  {editing === r.key ? (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          autoFocus
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !busy && save(r.name)}
                          aria-label="Novo nome da hunt"
                          className="min-h-11 flex-1 rounded-lg border border-border bg-input px-3 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() => save(r.name)}
                            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-lg bg-rubi-gold px-4 text-sm font-semibold text-background disabled:opacity-50"
                          >
                            {collision ? <Merge className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                            {collision ? "Juntar" : "Salvar"}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            aria-label="Cancelar"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {collision && (
                        <p className="text-xs text-rubi-gold">
                          "{collision.name}" já existe ({collision.sessions} sessões). As {r.sessions} sessões de "{r.name}" serão juntadas nela.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.sessions} sessão(ões) · {r.players} jogador(es)
                          {r.variants > 1 && ` · ${r.variants} grafias diferentes`}
                        </div>
                      </div>
                      <button
                        onClick={() => { setEditing(r.key); setValue(r.name); }}
                        className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:border-rubi-gold/60 hover:text-rubi-gold"
                      >
                        <Pencil className="h-4 w-4" /> Editar
                      </button>
                    </div>
                  )}
                </li>
              ))}
              {rows.length === 0 && (
                <li className="card-surface p-6 text-center text-sm text-muted-foreground">Nenhuma hunt encontrada.</li>
              )}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
