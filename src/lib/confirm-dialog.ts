import { create } from "zustand";

export interface ConfirmOptions {
  title?: string;
  /** Supports \n for line breaks. */
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" = red confirm button, for destructive actions. */
  tone?: "default" | "danger";
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
}

const useConfirmStore = create<ConfirmState>(() => ({
  open: false,
  options: null,
  resolve: null,
}));

export const useConfirmDialogState = useConfirmStore;

/**
 * App-styled replacement for window.confirm(). Resolves true/false depending
 * on which button the user clicked. Render <ConfirmDialogHost /> once (it
 * already lives in the root route) for this to have somewhere to show up.
 */
export function confirmDialog(options: ConfirmOptions | string): Promise<boolean> {
  const opts = typeof options === "string" ? { description: options } : options;
  return new Promise((resolve) => {
    useConfirmStore.setState({ open: true, options: opts, resolve });
  });
}

export function resolveConfirmDialog(value: boolean) {
  useConfirmStore.getState().resolve?.(value);
  useConfirmStore.setState({ open: false, options: null, resolve: null });
}
