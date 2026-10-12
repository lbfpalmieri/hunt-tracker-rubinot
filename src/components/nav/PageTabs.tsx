import { useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { findNavItem, isNavActive, navTabs, rememberTab } from "@/lib/nav-items";

/**
 * Abas no topo das páginas que dividem um item do menu (Rendimento: Meu rendimento / Todos os
 * personagens; Calculadoras: Monstros/h / Rubini Coins). Mesmo visual do alternador Solo / Grupo.
 * Cada aba é uma rota de verdade, então os links antigos continuam funcionando; a última aba
 * aberta é lembrada (o menu abre nela da próxima vez).
 */
export function PageTabs({ itemId }: { itemId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = findNavItem(itemId);
  const tabs = item ? navTabs(item) : [];
  const current = tabs.find((t) => isNavActive(pathname, t.to));

  useEffect(() => {
    if (current) rememberTab(itemId, current.to);
  }, [itemId, current]);

  if (!tabs.length) return null;
  return (
    <nav
      aria-label={item?.label}
      className="mb-5 inline-flex max-w-full overflow-x-auto rounded-lg border border-border bg-surface p-0.5"
    >
      {tabs.map((t) => {
        const on = t.to === current?.to;
        return (
          <Link
            key={t.to}
            to={t.to as never}
            aria-current={on ? "page" : undefined}
            className={
              "inline-flex min-h-11 flex-none items-center rounded-md px-3 text-sm font-semibold transition-colors active:scale-[0.98] " +
              (on
                ? "bg-rubi-blue text-primary-foreground shadow-glow-blue"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
