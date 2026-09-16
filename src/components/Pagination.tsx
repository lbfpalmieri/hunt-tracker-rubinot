import { ChevronLeft, ChevronRight } from "lucide-react";

/** Paginação simples (anterior/próxima + "Página X de Y"). Some sozinha quando cabe tudo numa página só. */
export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-rubi-blue/50 hover:text-rubi-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Anterior
      </button>
      <span className="text-xs text-muted-foreground">
        Página <strong className="text-foreground">{page}</strong> de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-rubi-blue/50 hover:text-rubi-blue disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próxima <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
