import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logo from "@/assets/dragon-logo.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Peças da landing (routes/index.tsx) e do login (routes/auth.tsx), pra as duas telas terem a
 * mesma cara: fundo com brilho, cabeçalho com o Entrar sempre à vista, botões e rodapé.
 */

/** Brilhos azul, dourado e violeta que passeiam devagar atrás da página (só transform). */
export function LandingBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-aurora absolute -left-[20%] -top-[25%] h-[70vh] w-[80vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--rubi-blue)_30%,transparent),transparent)]" />
      <div
        className="animate-aurora absolute -right-[25%] top-[10%] h-[65vh] w-[70vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--rubi-gold)_18%,transparent),transparent)]"
        style={{ animationDelay: "-6s", animationDuration: "22s" }}
      />
      <div
        className="animate-aurora absolute -bottom-[30%] left-[15%] h-[60vh] w-[70vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--cat-violet)_16%,transparent),transparent)]"
        style={{ animationDelay: "-11s", animationDuration: "26s" }}
      />
    </div>
  );
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** "G" do Google em uma cor só (a do texto do botão). */
export function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-4 w-4 flex-none", className)} aria-hidden>
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.7 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.2 12 6.2c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.75 3.72 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.98 0-.6-.06-1.06-.13-1.52z"
      />
    </svg>
  );
}

const SIZES = {
  sm: "min-h-11 px-3.5 text-sm",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-7 text-base",
} as const;

/** Ação principal (dourado = recompensa): entrar com o Google. Uma por bloco. */
export function GoogleButton({
  onClick,
  loading,
  size = "md",
  className,
  children = "Entrar com Google",
}: {
  onClick: () => void;
  loading?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading || undefined}
      className={cn(
        "btn-shine inline-flex whitespace-nowrap items-center justify-center gap-2.5 rounded-xl bg-rubi-gold font-semibold text-primary-foreground shadow-glow-gold ring-1 ring-inset ring-white/30",
        "transition-[transform,box-shadow,filter] duration-150 ease-out hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_0_55px_-6px_color-mix(in_oklab,var(--rubi-gold)_75%,transparent)] active:translate-y-0 active:scale-[0.98] active:brightness-95 disabled:cursor-wait disabled:opacity-70",
        focusRing,
        SIZES[size],
        className,
      )}
    >
      <GoogleGlyph className={size === "lg" ? "h-5 w-5" : undefined} />
      {loading ? "Abrindo o Google..." : children}
    </button>
  );
}

/** Ação secundária (azul): explorar sem conta. */
export function SecondaryLink({
  to,
  children,
  size = "md",
  className,
}: {
  to: "/community" | "/tools/compare" | "/about" | "/";
  children: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-rubi-blue/50 bg-rubi-blue-soft font-semibold text-rubi-blue",
        "transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-0.5 hover:bg-rubi-blue/20 hover:shadow-glow-blue active:translate-y-0 active:scale-[0.98]",
        focusRing,
        SIZES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

const HEADER_LINKS = [
  { to: "/community", label: "Comunidade" },
  { to: "/tools/compare", label: "Comparar hunts" },
  { to: "/about", label: "Sobre" },
] as const;

/** Cabeçalho fixo no topo: logo, páginas públicas e o Entrar (sempre visível, inclusive no celular). */
export function LandingHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:gap-4 sm:px-6">
        <Link to="/" className={cn("flex min-h-11 flex-none items-center rounded-lg", focusRing)}>
          <img
            src={logo.url}
            alt="RubinOT Hunt Tracker, página inicial"
            width={48}
            height={48}
            className="h-10 w-10 object-contain sm:h-12 sm:w-12"
          />
          <span className="ml-2 hidden font-brand text-base font-bold leading-tight tracking-wide sm:block">
            Hunt Tracker
          </span>
        </Link>
        <nav aria-label="Páginas públicas" className="ml-auto hidden items-center gap-1 md:flex">
          {HEADER_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
                focusRing,
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-2">{action}</div>
      </div>
    </header>
  );
}

/** Divisor de seção com losango, como no tibia.com. */
export function DiamondDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-3", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-rubi-gold/40" />
      <span className="h-2.5 w-2.5 rotate-45 border border-rubi-gold bg-rubi-gold-soft shadow-glow-gold" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-rubi-gold/40" />
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/50 bg-background/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:px-6 sm:text-left">
        <div>
          <div className="font-brand font-bold text-foreground">RubinOT Hunt Tracker</div>
          <div className="mt-0.5">
            Feito pelo Buzi, do canal{" "}
            <a
              href="https://www.youtube.com/@Ésobrerubinot"
              target="_blank"
              rel="noreferrer"
              className={cn("font-semibold text-rubi-gold hover:underline", focusRing)}
            >
              @Ésobrerubinot
            </a>
            , para a comunidade do RubinOT.
          </div>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap justify-center gap-x-1">
          {[...HEADER_LINKS, { to: "/privacidade", label: "Privacidade" } as const].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-2.5 hover:text-foreground",
                focusRing,
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
