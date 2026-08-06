import { Link } from "@tanstack/react-router";
import { Gauge, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "Não esqueça de inserir seu level de hoje!",
  "Já conferiu seus objetivos? Dá uma olhada aqui.",
  "Registre seu level e veja quanto você evoluiu.",
  "Seu rendimento está esperando: level e objetivos.",
  "Quantos leveis você subiu essa semana? Confira!",
];

const FIRST_DELAY = 6000;
const VISIBLE_MS = 9000;
const INTERVAL_MS = 150000;

export function RendimentoNudge() {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (dismissed) return;
    const show = () => {
      setMsg(Math.floor(Math.random() * MESSAGES.length));
      setVisible(true);
      timers.current.push(setTimeout(() => setVisible(false), VISIBLE_MS));
    };
    const first = setTimeout(show, FIRST_DELAY);
    const loop = setInterval(show, INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(loop);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [dismissed]);

  return (
    <span className="relative inline-flex align-middle">
      <Link
        to="/rendimento"
        title="Ver meu rendimento"
        aria-label="Ver meu rendimento"
        className={
          "relative inline-flex h-8 w-8 items-center justify-center rounded-full transition-all " +
          (visible
            ? "bg-rubi-gold/15 text-rubi-gold shadow-[0_0_0_1px_var(--rubi-gold)] animate-pulse"
            : "text-muted-foreground/60 hover:bg-accent hover:text-rubi-blue")
        }
      >
        <Gauge className="h-5 w-5" />
        {visible && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-rubi-gold shadow-glow-blue" />
        )}
      </Link>

      {visible && !dismissed && (
        <span
          role="status"
          className="animate-fade-in absolute left-1/2 top-full z-30 mt-3 w-60 -translate-x-1/2 rounded-xl border border-rubi-gold/50 bg-popover/95 p-3 text-left shadow-2xl backdrop-blur sm:left-auto sm:right-0 sm:translate-x-0"
        >
          <span
            className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-rubi-gold/50 bg-popover sm:left-auto sm:right-5 sm:translate-x-0"
            aria-hidden
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setDismissed(true);
              setVisible(false);
            }}
            aria-label="Dispensar aviso"
            className="absolute right-1.5 top-1.5 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="block pr-4 text-xs font-semibold uppercase tracking-wider text-rubi-gold">
            Meu rendimento
          </span>
          <span className="mt-1 block text-sm font-medium normal-case leading-snug text-foreground">
            {MESSAGES[msg]}
          </span>
        </span>
      )}
    </span>
  );
}
