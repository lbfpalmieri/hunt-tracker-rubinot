import { Info } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
  label?: string;
}

/**
 * Subtle "how is this calculated?" button.
 * Renders a small info icon; on click opens a dialog with the explanation.
 */
export function InfoHint({ title, description, children, label }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={label ?? "Como é calculado?"}
          title={label ?? "Como é calculado?"}
          className="inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-accent hover:text-rubi-blue"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-accent/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px] [&_code]:text-foreground [&_strong]:text-foreground">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
