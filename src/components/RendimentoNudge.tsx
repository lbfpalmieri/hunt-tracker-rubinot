import { Link } from "@tanstack/react-router";
import { Gauge, Shirt, X, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const VISIBLE_MS = 9000;
/** Cada aviso reaparece a cada 150s. Os dois do Dashboard começam em momentos diferentes
 * (6s e 25s) e mantêm essa defasagem — nunca aparecem juntos (o balão fica 9s na tela). */
const INTERVAL_MS = 150000;

type Tone = "gold" | "blue";

const TONE: Record<
  Tone,
  { text: string; ring: string; dot: string; border: string; glow: string }
> = {
  gold: {
    text: "text-rubi-gold",
    ring: "border border-rubi-gold/60 bg-rubi-gold/10 shadow-[0_0_14px_-2px_var(--rubi-gold)]",
    dot: "bg-rubi-gold",
    border: "border-rubi-gold/50",
    glow: "drop-shadow-[0_0_4px_var(--rubi-gold)]",
  },
  blue: {
    text: "text-rubi-blue",
    ring: "border border-rubi-blue/60 bg-rubi-blue/10 shadow-[0_0_14px_-2px_var(--rubi-blue)]",
    dot: "bg-rubi-blue",
    border: "border-rubi-blue/50",
    glow: "drop-shadow-[0_0_4px_var(--rubi-blue)]",
  },
};

/** Ícone com balão de dica que aparece de tempos em tempos (Dashboard, ao lado do "Olá, …"). */
function HeroNudge({
  to,
  icon: Icon,
  title,
  messages,
  tone,
  firstDelay,
}: {
  to: "/rendimento" | "/equipamentos";
  icon: LucideIcon;
  title: string;
  messages: string[];
  tone: Tone;
  firstDelay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [msg, setMsg] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const t = TONE[tone];

  useEffect(() => {
    if (dismissed) return;
    const show = () => {
      setMsg(Math.floor(Math.random() * messages.length));
      setVisible(true);
      timers.current.push(setTimeout(() => setVisible(false), VISIBLE_MS));
    };
    let loop: ReturnType<typeof setInterval> | undefined;
    const first = setTimeout(() => {
      show();
      loop = setInterval(show, INTERVAL_MS);
    }, firstDelay);
    return () => {
      clearTimeout(first);
      if (loop) clearInterval(loop);
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [dismissed, firstDelay, messages.length]);

  return (
    <span className="relative inline-flex align-middle">
      <Link
        to={to}
        title={title}
        aria-label={title}
        className={
          "nudge-attention relative inline-flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 " +
          t.ring +
          " " +
          (visible ? t.text : t.text + " opacity-90 hover:opacity-100")
        }
      >
        <Icon className={"h-6 w-6 " + t.glow} />
        <span
          aria-hidden
          className={"absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full " + t.dot}
        />
      </Link>

      {visible && !dismissed && (
        <span
          role="status"
          className={
            "animate-fade-in absolute left-1/2 top-full z-30 mt-3 w-60 -translate-x-1/2 rounded-xl border bg-popover/95 p-3 text-left shadow-2xl backdrop-blur sm:left-auto sm:right-0 sm:translate-x-0 " +
            t.border
          }
        >
          <span
            className={
              "absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t bg-popover sm:left-auto sm:right-5 sm:translate-x-0 " +
              t.border
            }
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
          <span className={"block pr-4 text-xs font-semibold uppercase tracking-wider " + t.text}>
            {title}
          </span>
          <span className="mt-1 block text-sm font-medium normal-case leading-snug text-foreground">
            {messages[msg]}
          </span>
        </span>
      )}
    </span>
  );
}

const RENDIMENTO_MESSAGES = [
  "Não esqueça de inserir seu level de hoje!",
  "Já conferiu seus objetivos? Dá uma olhada aqui.",
  "Registre seu level e veja quanto você evoluiu.",
  "Seu rendimento está esperando: level e objetivos.",
  "Quantos leveis você subiu essa semana? Confira!",
];

const SETS_MESSAGES = [
  "Monte seus sets de equipamento uma vez e escolha na hora de adicionar a sessão.",
  "Tem mais de uma arma elemental? Salve um set pra cada.",
  "Com um set salvo, o print do equipamento vai sozinho pra sessão.",
  "Arma, skills, Wheel e postura num clique: cadastre seus sets.",
];

export function RendimentoNudge() {
  return (
    <HeroNudge
      to="/rendimento"
      icon={Gauge}
      title="Meu rendimento"
      messages={RENDIMENTO_MESSAGES}
      tone="gold"
      firstDelay={6000}
    />
  );
}

export function SetsNudge() {
  return (
    <HeroNudge
      to="/equipamentos"
      icon={Shirt}
      title="Meus sets"
      messages={SETS_MESSAGES}
      tone="blue"
      firstDelay={25000}
    />
  );
}
