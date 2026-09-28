import { useMemo, useState } from "react";
import { Check, Copy, FileOutput } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  exportHuntAverageAnalyser,
  exportSessionAnalyser,
  type ExportableSession,
} from "@/lib/analyser-export";
import { fmtDuration } from "@/lib/format";

/**
 * Exporta no formato do Hunting Analyser do jogo — a sessão e/ou a média da hunt (1h no ritmo
 * médio) — pra colar em outras ferramentas (ex.: Guia de Build do Miguelnut → "Hunt personalizada").
 * Usado na sessão própria, na sessão pública e no card de hunt da Comunidade (só média).
 */
export function ExportAnalyserDialog({
  session,
  hunt,
  open,
  onOpenChange,
}: {
  /** Sessão específica (ausente = só a média da hunt). */
  session?: ExportableSession | null;
  /** Base da média: as sessões e de onde vêm (ex.: "de todos os jogadores"). */
  hunt: { name: string; sessions: ExportableSession[]; source: string; loading?: boolean } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [picked, setPicked] = useState<"session" | "hunt">(session ? "session" : "hunt");
  const kind = session ? picked : "hunt";
  const [copied, setCopied] = useState(false);
  const huntSessions = useMemo(() => hunt?.sessions ?? [], [hunt?.sessions]);
  const text = useMemo(() => {
    if (kind === "session" && session) return exportSessionAnalyser(session);
    return huntSessions.length ? exportHuntAverageAnalyser(huntSessions) : "";
  }, [kind, session, huntSessions]);
  const huntSec = huntSessions.reduce((a, s) => a + s.hunting.durationSec, 0);
  const noKills =
    kind === "session"
      ? !!session && session.hunting.kills.length === 0
      : huntSessions.length > 0 && huntSessions.every((s) => s.hunting.kills.length === 0);

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Analyser copiado", {
        description: "Cole no site (ex.: Guia de Build do Miguelnut → Hunt personalizada).",
      });
    } catch {
      toast.error("Não consegui copiar — selecione o texto e copie na mão.");
    }
  };

  const options = [
    ...(session
      ? [["session", "Esta sessão", fmtDuration(session.hunting.durationSec)] as const]
      : []),
    [
      "hunt",
      "Média da hunt",
      hunt?.loading
        ? "carregando..."
        : `${huntSessions.length} ${huntSessions.length === 1 ? "sessão" : "sessões"} · ${fmtDuration(huntSec)} → 1h`,
    ] as const,
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <FileOutput className="h-5 w-5 text-rubi-blue" /> Exportar Hunting Analyser
          </DialogTitle>
          <DialogDescription>
            No mesmo formato do "Copy to Clipboard" do jogo — dá pra colar em sites que leem o
            analyser, como o Guia de Build do Miguelnut (Hunt personalizada).
          </DialogDescription>
        </DialogHeader>

        <div className={"grid gap-2 " + (options.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
          {options.map(([k, label, hint]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPicked(k)}
              className={
                "rounded-lg border px-3 py-2 text-left transition-colors " +
                (kind === k
                  ? "border-rubi-blue bg-rubi-blue-soft"
                  : "border-border hover:border-rubi-blue/50")
              }
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{hint}</span>
            </button>
          ))}
        </div>
        {kind === "hunt" && hunt && (
          <p className="text-[11px] text-muted-foreground">
            Média de "{hunt.name}" {hunt.source}: tudo dividido pelas horas somadas e mostrado como
            1 hora no ritmo médio — inclusive monstros por hora (densidade média).
          </p>
        )}
        {noKills && (
          <p className="rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 p-2 text-[11px] text-rubi-gold">
            Sem os monstros mortos (sessão registrada só com o Party Hunt Analyser) — sites que
            montam build pela composição de monstros não vão ter o que ler.
          </p>
        )}

        {kind === "hunt" && hunt?.loading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted/30" />
        ) : (
          <textarea
            readOnly
            value={text}
            rows={12}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed outline-none"
          />
        )}

        <button
          type="button"
          onClick={copy}
          disabled={!text}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-blue px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar analyser"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
