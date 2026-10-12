import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  hideTutorial,
  resetTutorials,
  shouldAutoOpen,
  skipTutorial,
  tutorialFor,
  useTutorialUi,
  type Tutorial,
} from "@/lib/page-tutorials";

/**
 * Tutorial da página: abre sozinho na primeira visita (a menos que o jogador tenha marcado "Não
 * mostrar de novo"), e o botão de ajuda do cabeçalho abre de novo quando quiser. Fica no AppShell.
 */
export function PageTutorial() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const manualKey = useTutorialUi((s) => s.manualKey);
  const openManual = useTutorialUi((s) => s.openManual);
  const hiddenVersion = useTutorialUi((s) => s.hiddenVersion);
  const tutorial = tutorialFor(pathname);
  const [autoKey, setAutoKey] = useState<string | null>(null);

  // Só decide abrir no navegador (localStorage), depois da página montar — não bloqueia o carregamento.
  useEffect(() => {
    setAutoKey(tutorial && shouldAutoOpen(tutorial.key) ? tutorial.key : null);
  }, [tutorial?.key, hiddenVersion]);

  const openKey = manualKey ?? autoKey;
  if (!tutorial || openKey !== tutorial.key) return null;
  return (
    <TutorialDialog
      key={tutorial.key + (manualKey ? ":m" : ":a")}
      tutorial={tutorial}
      onClose={() => {
        setAutoKey(null);
        openManual(null);
      }}
    />
  );
}

function TutorialDialog({ tutorial, onClose }: { tutorial: Tutorial; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [never, setNever] = useState(false);
  const last = i === tutorial.steps.length - 1;
  const step = tutorial.steps[i];

  const close = () => {
    if (never) hideTutorial(tutorial.key);
    else skipTutorial(tutorial.key);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brand">{tutorial.title}</DialogTitle>
          <DialogDescription>
            Passo {i + 1} de {tutorial.steps.length}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-24" aria-live="polite">
          <h3 className="font-display text-base font-semibold text-rubi-gold">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{step.text}</p>
        </div>

        <div className="flex justify-center gap-1.5" aria-hidden>
          {tutorial.steps.map((_, n) => (
            <span
              key={n}
              className={"h-1.5 rounded-full transition-all " + (n === i ? "w-5 bg-rubi-blue" : "w-1.5 bg-muted-foreground/40")}
            />
          ))}
        </div>

        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={never}
            onChange={(e) => setNever(e.target.checked)}
            className="h-4 w-4 accent-[var(--rubi-blue)]"
          />
          Não mostrar de novo nesta página
        </label>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Pular tutorial
          </button>
          <div className="flex gap-2">
            {i > 0 && (
              <button
                type="button"
                onClick={() => setI(i - 1)}
                className="min-h-11 rounded-lg border border-border px-4 text-sm font-medium transition-transform hover:bg-accent active:scale-[0.98]"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? close() : setI(i + 1))}
              className="min-h-11 rounded-lg bg-rubi-blue px-4 text-sm font-semibold text-primary-foreground shadow-glow-blue transition-transform hover:opacity-90 active:scale-[0.98]"
            >
              {last ? "Entendi" : "Próximo"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetTutorials();
            toast.success("Tutoriais reativados", { description: "Eles voltam a abrir na primeira visita de cada página." });
          }}
          className="justify-self-start text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Reativar os tutoriais de todas as páginas
        </button>
      </DialogContent>
    </Dialog>
  );
}

/** Botão "?" do cabeçalho: abre o tutorial da página atual (some nas páginas sem tutorial). */
export function TutorialHelpButton() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openManual = useTutorialUi((s) => s.openManual);
  const tutorial = tutorialFor(pathname);
  if (!tutorial) return null;
  return (
    <button
      type="button"
      onClick={() => openManual(tutorial.key)}
      aria-label="Abrir o tutorial desta página"
      title="Tutorial desta página"
      className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.98] sm:h-10 sm:w-10"
    >
      <CircleHelp className="h-4 w-4 text-rubi-blue" />
    </button>
  );
}
