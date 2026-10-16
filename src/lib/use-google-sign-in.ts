import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { rememberLoginRedirect } from "./auth-redirect";
import { errorMessage } from "./errors";

/**
 * Botão "Entrar com Google" (landing e /auth). Guarda pra onde voltar e vai direto pro Google,
 * sem passar por uma tela intermediária. A URL de retorno continua sendo origin + "/auth" — é a
 * cadastrada no Supabase; o /auth lê a sessão e leva a pessoa ao destino guardado.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * `redirect`: página pra voltar depois do login (null = Dashboard). Sem argumento, mantém o
   * destino já guardado (ex.: veio da landing com ?redirect e clicou no /auth).
   */
  const signIn = async (redirect?: string | null) => {
    setLoading(true);
    setError(null);
    if (redirect !== undefined) rememberLoginRedirect(redirect);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth" },
    });
    if (error) {
      setError(errorMessage(error));
      setLoading(false);
    }
    // Sem erro: o navegador já está indo pro Google.
  };

  return { signIn, loading, error, setError, setLoading };
}
