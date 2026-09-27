import { useMemo, useState } from "react";
import { ChevronDown, Search, Swords, X } from "lucide-react";
import { GameIcon } from "@/components/GameIcon";
import type { SetupVocation } from "@/lib/session-setup";
import {
  VOCATION_WEAPON_KINDS,
  WEAPON_KIND_LABEL,
  findWeapon,
  weaponSummary,
  weaponsForVocation,
  type WeaponInfo,
  type WeaponKind,
} from "@/lib/weapons";

const LIMIT = 60;

/**
 * Escolha da arma a partir da lista da TibiaWiki, filtrada pela vocação (igual à Wheel).
 * Fechado: card da arma com os atributos base. Aberto: busca + filtro por tipo.
 */
export function WeaponPicker({
  value,
  onChange,
  vocation,
}: {
  value: string | null;
  onChange: (name: string | null) => void;
  vocation: SetupVocation | null;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<WeaponKind | "all">("all");

  const pool = useMemo(() => weaponsForVocation(vocation), [vocation]);
  const kinds = vocation ? VOCATION_WEAPON_KINDS[vocation] : [];
  const selected = findWeapon(value);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return pool.filter(
      (w) => (kind === "all" || w.kind === kind) && (!term || w.name.toLowerCase().includes(term)),
    );
  }, [pool, q, kind]);

  const pick = (w: WeaponInfo | null) => {
    onChange(w ? w.name : null);
    setOpen(false);
    setQ("");
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left hover:border-rubi-blue"
      >
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-md border border-border/60 bg-surface">
          {value ? (
            <GameIcon name={selected?.icon ?? value} size={36} />
          ) : (
            <Swords className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          {value ? (
            <>
              <span className="block truncate text-sm font-semibold">
                {value}
                {selected && (
                  <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                    {WEAPON_KIND_LABEL[selected.kind]}
                    {selected.level ? ` · Lv ${selected.level}` : ""}
                    {selected.hands ? ` · ${selected.hands === 2 ? "2 mãos" : "1 mão"}` : ""}
                  </span>
                )}
              </span>
              {selected && (
                <span className="block truncate text-[11px] text-muted-foreground">
                  {weaponSummary(selected)}
                  {selected.imbuements ? ` · ${selected.imbuements} imbuements` : ""}
                  {selected.maxTier != null ? ` · tier máx ${selected.maxTier}` : ""}
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Escolher arma…</span>
          )}
        </span>
        <ChevronDown
          className={
            "h-4 w-4 flex-none text-muted-foreground transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-surface/80 p-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar arma"
                className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-sm outline-none focus:border-rubi-blue"
              />
            </label>
            {kinds.length > 1 && (
              <div className="flex gap-1">
                {(["all", ...kinds] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={
                      "rounded-md border px-2 py-1 text-[11px] font-medium " +
                      (kind === k
                        ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                        : "border-border text-muted-foreground hover:text-foreground")
                    }
                  >
                    {k === "all" ? "Todas" : WEAPON_KIND_LABEL[k]}
                  </button>
                ))}
              </div>
            )}
            {value && (
              <button
                type="button"
                onClick={() => pick(null)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:text-rubi-danger"
              >
                <X className="h-3 w-3" /> Sem arma
              </button>
            )}
          </div>

          <ul className="mt-2 max-h-72 divide-y divide-border/40 overflow-y-auto">
            {list.slice(0, LIMIT).map((w) => (
              <li key={w.icon}>
                <button
                  type="button"
                  onClick={() => pick(w)}
                  className={
                    "flex w-full items-center gap-2.5 px-1.5 py-1.5 text-left hover:bg-accent " +
                    (w.name === value ? "bg-rubi-blue-soft" : "")
                  }
                >
                  <GameIcon name={w.icon} size={28} className="flex-none" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{w.name}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {weaponSummary(w) || WEAPON_KIND_LABEL[w.kind]}
                    </span>
                  </span>
                  <span className="flex-none text-right text-[10px] text-muted-foreground">
                    {w.level ? `Lv ${w.level}` : "—"}
                    {kinds.length > 1 && <span className="block">{WEAPON_KIND_LABEL[w.kind]}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            {list.length > LIMIT
              ? `Mostrando ${LIMIT} de ${list.length} (do maior level pro menor) — busque pelo nome.`
              : `${list.length} armas`}{" "}
            · dados da TibiaWiki
          </p>
        </div>
      )}
    </div>
  );
}
