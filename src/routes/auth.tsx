import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/errors";
import logo from "@/assets/dragon-logo.png.asset.json";

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

// Login de teste do banco LOCAL (`npm run dev:local` — scripts/dev-local.mjs). Só existe rodando o
// servidor de desenvolvimento contra um Supabase em localhost; no site publicado isto é sempre null.
const DEV_LOGIN = (() => {
  if (!import.meta.env.DEV) return null;
  const email = import.meta.env.VITE_DEV_LOGIN_EMAIL as string | undefined;
  const password = import.meta.env.VITE_DEV_LOGIN_PASSWORD as string | undefined;
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
  return email && password && local ? { email, password } : null;
})();

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
    // Login Google direto no Supabase (sem o broker do Lovable). O Supabase
    // redireciona de volta para /auth com a sessão na URL; o useEffect acima
    // detecta a sessão e manda para a página inicial.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) {
      setError(errorMessage(error));
      setLoading(false);
    }
    // Sem erro: redirecionamento para o Google em andamento.
  };

  const handleDevLogin = async () => {
    if (!DEV_LOGIN) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword(DEV_LOGIN);
    if (error) {
      setError(errorMessage(error));
      setLoading(false);
      return;
    }
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center">
            <img src={logo.url} alt="RubinOT Hunt Tracker" className="h-14 w-auto object-contain sm:h-16" />
          </Link>

        </div>
      </header>

      <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12 sm:px-6">
        <div className="card-surface w-full p-8 text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">
            Bem-vindo
          </div>
          <h1 className="mt-2 font-brand text-3xl font-bold">Entrar na sua conta</h1>
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

          {DEV_LOGIN && (
            <div className="mt-4 rounded-lg border border-dashed border-rubi-gold/50 bg-rubi-gold/5 p-3">
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-lg border border-rubi-gold/60 px-4 py-2.5 text-sm font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/10 disabled:opacity-50"
              >
                Entrar como usuário de teste
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Banco local de desenvolvimento — nada aqui vai pra produção. O Google não funciona
                neste banco.
              </p>
            </div>
          )}

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
