import { useEffect, useRef, useState, type RefObject } from "react";
import { useCountUp } from "@/lib/use-count-up";

/** Quem pediu menos movimento no sistema vê o número final direto. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Vira true (uma vez) quando o elemento entra na tela. */
export function useInViewOnce<T extends Element>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen];
}

/** Número que sobe do zero até `value` quando `run` liga. */
export function CountUp({
  value,
  run,
  format,
  duration = 1400,
}: {
  value: number;
  run: boolean;
  format: (n: number) => string;
  duration?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const shown = useCountUp(run ? value : 0, reduced ? 1 : duration);
  // Leitor de tela ouve só o valor final, não a contagem.
  return (
    <>
      <span aria-hidden>{format(reduced && run ? value : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
