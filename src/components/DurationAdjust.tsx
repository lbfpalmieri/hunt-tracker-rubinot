import { useState } from "react";
import { RotateCcw, Timer } from "lucide-react";
import { fmtDuration } from "@/lib/format";

const MAX_SEC = 24 * 3600;

/**
 * "Corrigir tempo" do analyser colado: quando a pessoa esquece de colar e o analyser fica rodando
 * parado (marcou 1h, a hunt foi 50min). Controlado: `value` = duração corrigida em segundos (null = a
 * do analyser). Quem usa aplica com withDuration (parser.ts) — totais iguais, todo "/h" recalculado.
 */
export function DurationAdjust({
  originalSec,
  value,
  onChange,
  label = "Tempo da hunt",
}: {
  originalSec: number;
  value: number | null;
  onChange: (sec: number | null) => void;
  label?: string;
}) {
  const fixed = value != null && value !== originalSec;
  const [open, setOpen] = useState(fixed);
  const current = value ?? originalSec;
  const h = Math.floor(current / 3600);
  const m = Math.floor((current % 3600) / 60);

  const set = (sec: number) => {
    const v = Math.max(60, Math.min(MAX_SEC, Math.round(sec / 60) * 60));
    // Voltou pro mesmo minuto do analyser = sem correção (mantém os segundos originais).
    onChange(Math.round(v / 60) === Math.round(originalSec / 60) ? null : v);
  };
  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;
  const sliderMax = Math.max(originalSec, current);

  return (
    <div
      className={
        "rounded-lg border p-3 " +
        (fixed ? "border-rubi-gold/50 bg-rubi-gold/[0.06]" : "border-border/70 bg-background/40")
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{label}</span>
          <b className="font-display text-base">{fmtDuration(current)}</b>
          {fixed && (
            <span className="text-xs text-muted-foreground line-through">
              {fmtDuration(originalSec)}
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:border-rubi-gold/60 hover:text-rubi-gold"
        >
          {open ? "Fechar" : "Corrigir tempo"}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs leading-snug text-muted-foreground">
            Esqueceu de colar na hora e o analyser ficou contando? Coloque o tempo real — XP/h,
            lucro/h e kills/h são recalculados. Loot, XP e kills continuam os do analyser.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                inputMode="numeric"
                value={h}
                onChange={(e) => set(num(e.target.value) * 3600 + m * 60)}
                aria-label="Horas"
                className="w-14 rounded-md border border-border bg-background px-2 py-1.5 text-center text-base font-semibold outline-none focus:border-rubi-gold"
              />
              h
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                inputMode="numeric"
                value={m}
                onChange={(e) => set(h * 3600 + Math.min(59, num(e.target.value)) * 60)}
                aria-label="Minutos"
                className="w-14 rounded-md border border-border bg-background px-2 py-1.5 text-center text-base font-semibold outline-none focus:border-rubi-gold"
              />
              min
            </label>
            {[5, 10, 15, 30].map((d) =>
              originalSec - d * 60 >= 60 ? (
                <button
                  key={d}
                  type="button"
                  onClick={() => set(originalSec - d * 60)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:border-rubi-gold/60"
                >
                  −{d} min
                </button>
              ) : null,
            )}
          </div>
          <input
            type="range"
            min={60}
            max={sliderMax}
            step={60}
            value={current}
            onChange={(e) => set(Number(e.target.value))}
            className="w-full accent-[var(--rubi-gold)]"
            aria-label="Duração da hunt"
          />
          {fixed && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Usar o tempo do analyser (
              {fmtDuration(originalSec)})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
