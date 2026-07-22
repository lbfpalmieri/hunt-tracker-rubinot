import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/rubinot-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Entre com sua conta Google para salvar suas hunts na nuvem.",
      },
      { property: "og:title", content: "Entrar no RubinOT Hunt Tracker" },
      { property: "og:description", content: "Login com Google para acompanhar suas hunts." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already signed in (session was set by the OAuth callback or a previous visit),
  // bounce straight to the dashboard.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) navigate({ to: "/", replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setError(
        result.error instanceof Error ? result.error.message : String(result.error),
      );
      setLoading(false);
      return;
    }
    if (result.redirected) return; // full-page redirect in progress
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo.url} alt="RubinOT" className="h-9 w-auto" />
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Hunt Tracker
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12 sm:px-6">
        <div className="card-surface w-full p-8 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            Bem-vindo
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold">Entrar na sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Suas hunts ficam salvas na nuvem e disponíveis em qualquer dispositivo.
          </p>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-rubi-blue px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow-blue transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <GoogleGlyph />
            {loading ? "Conectando..." : "Continuar com Google"}
          </button>

          {error && (
            <p className="mt-4 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-3 text-xs text-rubi-danger">
              {error}
            </p>
          )}

          <p className="mt-6 text-[11px] text-muted-foreground">
            Ao continuar você concorda em compartilhar seu e-mail para identificação. Sem spam,
            sem venda de dados.
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#fff"
        d="M21.35 11.1H12v2.9h5.35c-.23 1.4-1.7 4.1-5.35 4.1-3.22 0-5.85-2.66-5.85-5.95S8.78 6.2 12 6.2c1.83 0 3.06.78 3.76 1.45l2.57-2.48C16.75 3.72 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12s4.1 9.2 9.2 9.2c5.31 0 8.83-3.73 8.83-8.98 0-.6-.06-1.06-.13-1.52z"
      />
    </svg>
  );
}
