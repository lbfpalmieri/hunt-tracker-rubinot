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
import { exportHuntAverageAnalyser, exportSessionAnalyser } from "@/lib/analyser-export";
import { fmtDuration } from "@/lib/format";
import type { HuntSession } from "@/lib/store";

/**
 * Exporta no formato do Hunting Analyser do jogo — a sessão ou a média da hunt (1h no ritmo médio)
 * — pra colar em outras ferramentas (ex.: Guia de Build do Miguelnut → "Hunt personalizada").
 */
export function ExportAnalyserDialog({
  session,
  huntSessions,
  open,
  onOpenChange,
}: {
  session: HuntSession;
  /** Sessões da mesma hunt (mesmo personagem e modo) — base da média. */
  huntSessions: HuntSession[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [kind, setKind] = useState<"session" | "hunt">("session");
  const [copied, setCopied] = useState(false);
  const text = useMemo(
    () =>
      kind === "session" ? exportSessionAnalyser(session) : exportHuntAverageAnalyser(huntSessions),
    [kind, session, huntSessions],
  );
  const huntSec = huntSessions.reduce((a, s) => a + s.hunting.durationSec, 0);
  const noKills = session.hunting.kills.length === 0;

  const copy = async () => {
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

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["session", "Esta sessão", fmtDuration(session.hunting.durationSec)],
              [
                "hunt",
                "Média da hunt",
                `${huntSessions.length} ${huntSessions.length === 1 ? "sessão" : "sessões"} · ${fmtDuration(huntSec)} → 1h`,
              ],
            ] as const
          ).map(([k, label, hint]) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
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
        {kind === "hunt" && (
          <p className="text-[11px] text-muted-foreground">
            Média de "{session.huntName}" nesse personagem: tudo dividido pelas horas somadas e
            mostrado como 1 hora no ritmo médio — inclusive monstros por hora (densidade média).
          </p>
        )}
        {noKills && (
          <p className="rounded-lg border border-rubi-gold/40 bg-rubi-gold/10 p-2 text-[11px] text-rubi-gold">
            Essa sessão não tem os monstros mortos (foi registrada só com o Party Hunt Analyser) —
            sites que montam build pela composição de monstros não vão ter o que ler.
          </p>
        )}

        <textarea
          readOnly
          value={text}
          rows={12}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-[11px] leading-relaxed outline-none"
        />

        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rubi-blue px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado!" : "Copiar analyser"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
