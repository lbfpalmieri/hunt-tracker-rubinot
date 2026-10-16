import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cloud, Globe2, ShieldCheck, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { takeLoginRedirect } from "@/lib/auth-redirect";
import { errorMessage } from "@/lib/errors";
import { useGoogleSignIn } from "@/lib/use-google-sign-in";
import logo from "@/assets/dragon-logo.png.asset.json";
import { HeroPreview } from "@/components/landing/HeroPreview";
import {
  DiamondDivider,
  GoogleButton,
  LandingBackdrop,
  LandingFooter,
  LandingHeader,
  SecondaryLink,
} from "@/components/landing/LandingParts";

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

const PERKS = [
  { icon: Swords, text: "Suas sessões com Raw XP/h, lucro/h e monstros/h" },
  { icon: Cloud, text: "Salvo na nuvem: abre no PC e no celular" },
  { icon: ShieldCheck, text: "Seu e-mail nunca aparece pra outros jogadores" },
] as const;

function AuthPage() {
  const navigate = useNavigate();
  const google = useGoogleSignIn();
  // "checking" enquanto lê a sessão: na volta do Google a tela não pisca o formulário.
  const [checking, setChecking] = useState(true);

  // A URL de retorno do Google (cadastrada no Supabase) é /auth. Com a sessão pronta, leva pra
  // página que a pessoa tentou abrir (guardada antes do login) ou pro Dashboard.
  useEffect(() => {
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      navigate({ href: takeLoginRedirect() ?? "/dashboard", replace: true });
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) go();
      else if (!done) setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) go();
    });
    return () => {
      done = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleDevLogin = async () => {
    if (!DEV_LOGIN) return;
    google.setLoading(true);
    google.setError(null);
    const { error } = await supabase.auth.signInWithPassword(DEV_LOGIN);
    if (error) {
      google.setError(errorMessage(error));
      google.setLoading(false);
    }
    // Com sucesso, o onAuthStateChange acima leva pro destino.
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      <LandingBackdrop />
      <LandingHeader action={<SecondaryLink to="/" size="sm">Conhecer o app</SecondaryLink>} />

      <main className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="panel-gilded relative mx-auto w-full max-w-md overflow-hidden p-7 text-center sm:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_100%_at_50%_0%,color-mix(in_oklab,var(--rubi-blue)_25%,transparent),transparent)]"
          />
          <div className="relative">
            <img
              src={logo.url}
              alt=""
              width={96}
              height={96}
              className="mx-auto h-20 w-20 object-contain drop-shadow-[0_0_28px_var(--rubi-blue-soft)] sm:h-24 sm:w-24"
            />
            <h1 className="mt-4 font-brand text-3xl font-bold">Entrar no Hunt Tracker</h1>

            {checking ? (
              <p role="status" className="mt-6 text-sm text-muted-foreground">
                Conferindo sua conta...
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Um clique com a sua conta Google. Sem senha nova pra lembrar.
                </p>

                <GoogleButton
                  onClick={() => void google.signIn()}
                  loading={google.loading}
                  size="lg"
                  className="mt-7 w-full"
                >
                  Continuar com Google
                </GoogleButton>

                {DEV_LOGIN && (
                  <div className="mt-4 rounded-lg border border-dashed border-rubi-gold/50 bg-rubi-gold/5 p-3">
                    <button
                      type="button"
                      onClick={handleDevLogin}
                      disabled={google.loading}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-rubi-gold/60 px-4 py-2.5 text-sm font-semibold text-rubi-gold transition-colors hover:bg-rubi-gold/10 disabled:opacity-50"
                    >
                      Entrar como usuário de teste
                    </button>
                    <p className="mt-2 text-2xs text-muted-foreground">
                      Banco local de desenvolvimento — nada aqui vai pra produção. O Google não
                      funciona neste banco.
                    </p>
                  </div>
                )}

                {google.error && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-3 text-xs text-rubi-danger"
                  >
                    Não deu pra abrir o login do Google: {google.error}
                  </p>
                )}

                <DiamondDivider className="my-6" />

                <ul className="space-y-2.5 text-left text-sm">
                  {PERKS.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-2.5">
                      <Icon className="mt-0.5 h-4 w-4 flex-none text-rubi-gold" aria-hidden />
                      <span className="text-muted-foreground">{text}</span>
                    </li>
                  ))}
                </ul>

                <SecondaryLink to="/community" size="md" className="mt-6 w-full">
                  <Globe2 className="h-4 w-4" /> Ver a Comunidade sem conta
                </SecondaryLink>

                <p className="mt-5 text-2xs text-muted-foreground">
                  Usamos o e-mail do Google só para identificar a sua conta. Sem spam, sem venda de
                  dados.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <HeroPreview />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
