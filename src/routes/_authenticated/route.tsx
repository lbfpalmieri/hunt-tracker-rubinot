import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppStore } from "@/lib/store";
import { safeRedirectPath } from "@/lib/auth-redirect";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // getSession lê o token já em cache local — evita um round-trip de rede
    // em toda navegação (getUser bate na API a cada clique).
    const { data } = await supabase.auth.getSession();
    // Sem conta: vai pra landing (a vitrine do app), que lembra a página pedida e volta pra ela
    // depois do login (o destino é validado em auth-redirect.ts).
    if (!data.session?.user) {
      throw redirect({ to: "/", search: { redirect: safeRedirectPath(location.href) } });
    }
    return { user: data.session.user };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const loaded = useAppStore((s) => s.loaded);
  const loading = useAppStore((s) => s.loading);
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    if (!loaded && !loading) void loadAll();
  }, [loaded, loading, loadAll]);

  return <Outlet />;
}
