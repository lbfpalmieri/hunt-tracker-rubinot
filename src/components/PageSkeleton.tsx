import { Skeleton } from "@/components/ui/skeleton";

/**
 * Carregando de página inteira: o mesmo formato de toda tela (título, linha de apoio e cards), pra
 * a página não "pular" quando os dados chegam. Padrão do app: nada de bloco cinza liso nem spinner.
 * Quem pede animação reduzida não vê o pulso (styles.css).
 */
export function PageSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Carregando" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 bg-muted/30" />
        <Skeleton className="h-9 w-64 max-w-full bg-muted/30" />
        <Skeleton className="h-4 w-80 max-w-full bg-muted/20" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: cards }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl bg-muted/30" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
