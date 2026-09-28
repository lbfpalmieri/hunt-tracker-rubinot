import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = "loading" | "in" | "out";

/**
 * Tem alguém logado? Pras páginas públicas (Comunidade, Comparar hunts, Sobre) que funcionam com e
 * sem conta — ver SiteShell. "loading" até ler a sessão salva no navegador (é local, rápido).
 */
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>("loading");
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setState(session ? "in" : "out");
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return state;
}
