import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Pencil, Plus, Save, Shirt, X } from "lucide-react";
import { toast } from "sonner";
import { GameIcon } from "@/components/GameIcon";
import {
  CHARMS,
  STANCES,
  WHEEL_ICON,
  applySet,
  applyWheel,
  charmIcon,
  convictionMaxLevel,
  type SessionSetup,
  type SetupCharm,
  type SetupVocation,
} from "@/lib/session-setup";
import { EquipmentDoll } from "@/components/setup/EquipmentDoll";
import { WheelDialog } from "@/components/wheel/WheelDialog";
import { WheelOfDestiny } from "@/components/wheel/WheelOfDestiny";
import { useAppStore } from "@/lib/store";
import { currentLevel } from "@/lib/level";
import { WheelPresetPicker } from "@/components/wheel/WheelPresetPicker";
import { findWeapon } from "@/lib/weapons";
import {
  suggestedPresetName,
  useSaveSetupPreset,
  useSetupPresets,
  type SetupPreset,
} from "@/lib/setup-presets";

const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-rubi-blue";
const LABEL = "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const ROMAN = ["", "I", "II", "III"];

const uniq = <T,>(a: T[]) => [...new Set(a)];

/**
 * Editor do setup da sessão (controlado). Set do personagem no topo (equipamento + postura de uma
 * vez); Wheel escolhida à parte entre as rodas salvas (Minhas rodas) ou montada na hora — set e
 * roda são independentes; charms: só os que ativaram no Miscellaneous, e a pessoa só liga cada um
 * às criaturas mortas.
 */
export function SessionSetupPanel({
  value,
  onChange,
  vocation,
  characterId,
  creatures,
  activatedCharms = [],
  mode = "session",
}: {
  value: SessionSetup;
  onChange: (next: SessionSetup) => void;
  /** Vocação do personagem — filtra postura/Wheel e o nome da skill. Null = mostra todas. */
  vocation: SetupVocation | null;
  /** Personagem dono dos presets. */
  characterId: string | null;
  /** Criaturas mortas na sessão (mais mortas primeiro). */
  creatures: string[];
  /** Charms que ativaram na sessão (bloco "Charm" do Miscellaneous). */
  activatedCharms?: string[];
  /** "preset" = editando um set na tela Meus sets: sem escolha de set, sem Wheel e sem charms. */
  mode?: "session" | "preset";
}) {
  const set = (patch: Partial<SessionSetup>) => onChange({ ...value, ...patch });

  const stances = vocation ? STANCES[vocation] : uniq(Object.values(STANCES).flat());

  // ---------- presets ----------
  const { data: presets = [] } = useSetupPresets(characterId);
  const savePreset = useSaveSetupPreset(characterId);
  const [presetId, setPresetId] = useState("");
  const [naming, setNaming] = useState<string | null>(null);

  const applyPreset = (preset: SetupPreset) => {
    setPresetId(preset.id);
    // Set = equipamento + postura. A roda (e os charms) do setup atual ficam como estão.
    onChange(applySet(value, preset.setup));
  };

  const confirmSave = async () => {
    if (!naming?.trim()) return;
    try {
      await savePreset.mutateAsync({ name: naming, setup: value });
      toast.success(`Preset "${naming.trim()}" salvo`);
      setNaming(null);
    } catch (e) {
      toast.error("Não consegui salvar o preset", { description: (e as Error).message });
    }
  };

  // ---------- Wheel ----------
  const [wheelOpen, setWheelOpen] = useState(false);
  const levelSnapshots = useAppStore((st) => st.levelSnapshots);
  const charLevel = characterId ? currentLevel(levelSnapshots, characterId) : null;

  // ---------- charms ----------
  const [extraCharms, setExtraCharms] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [levelOf, setLevelOf] = useState<Record<string, 1 | 2 | 3>>({});
  const rows = uniq([...activatedCharms, ...value.charms.map((c) => c.charm), ...extraCharms]);
  const entries = (charm: string) => value.charms.filter((c) => c.charm === charm);
  const rowLevel = (charm: string): 1 | 2 | 3 => entries(charm)[0]?.level ?? levelOf[charm] ?? 2;
  const others = (charm: string) => value.charms.filter((c) => c.charm !== charm);

  const setCharmLevel = (charm: string, level: 1 | 2 | 3) => {
    setLevelOf((m) => ({ ...m, [charm]: level }));
    const e = entries(charm);
    set({
      charms: [
        ...others(charm),
        ...(e.length ? e.map((x) => ({ ...x, level })) : [{ charm, level, creature: null }]),
      ],
    });
  };
  const toggleCreature = (charm: string, creature: string) => {
    const e = entries(charm).filter((x) => x.creature);
    const level = rowLevel(charm);
    const next: SetupCharm[] = e.some((x) => x.creature === creature)
      ? e.filter((x) => x.creature !== creature)
      : [...e, { charm, level, creature }];
    set({
      charms: [...others(charm), ...(next.length ? next : [{ charm, level, creature: null }])],
    });
  };
  const removeRow = (charm: string) => {
    set({ charms: others(charm) });
    setExtraCharms((x) => x.filter((c) => c !== charm));
  };

  return (
    <div className="space-y-5">
      {/* Sets salvos do personagem */}
      {mode === "session" && (
        <section className="rounded-xl border border-rubi-blue/30 bg-rubi-blue/[0.05] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={LABEL + " mb-0"}>Meus sets</span>
            <Link
              to="/equipamentos"
              className="text-[11px] font-medium text-rubi-blue hover:underline"
            >
              Gerenciar sets
            </Link>
          </div>
          {presets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {presets.map((pr) => {
                const on = presetId === pr.id;
                return (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => applyPreset(pr)}
                    className={
                      "overflow-hidden rounded-lg border text-left transition-colors " +
                      (on
                        ? "border-rubi-blue ring-1 ring-rubi-blue"
                        : "border-border hover:border-rubi-blue/60")
                    }
                  >
                    <div className="flex h-20 items-center justify-center bg-background/70">
                      {pr.setup.weapon ? (
                        <GameIcon
                          name={findWeapon(pr.setup.weapon)?.icon ?? pr.setup.weapon}
                          size={40}
                        />
                      ) : (
                        <Shirt className="h-7 w-7 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold">
                      {on && <Check className="h-3.5 w-3.5 flex-none text-rubi-blue" />}
                      <span className="truncate">{pr.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum set salvo. Preencha abaixo e salve — ou monte seus sets com calma em{" "}
              <Link to="/equipamentos" className="text-rubi-blue hover:underline">
                Meus sets
              </Link>
              .
            </p>
          )}
          {naming == null ? (
            <button
              type="button"
              onClick={() => setNaming(suggestedPresetName(value))}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rubi-blue hover:underline"
            >
              <Save className="h-3.5 w-3.5" /> Salvar o equipamento abaixo como set
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={naming}
                onChange={(e) => setNaming(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmSave()}
                maxLength={40}
                placeholder="Nome do set (ex: Soulbleeder T0)"
                className={FIELD}
              />
              <button
                type="button"
                onClick={confirmSave}
                disabled={savePreset.isPending}
                aria-label="Confirmar"
                className="rounded-lg bg-rubi-blue px-3 text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setNaming(null)}
                aria-label="Cancelar"
                className="rounded-lg border border-border px-3 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Equipamento (boneco do inventário) com a postura na coluna do lado */}
      <section>
        <span className={LABEL}>Equipamento</span>
        <EquipmentDoll
          value={value}
          onChange={set}
          vocation={vocation}
          aside={
            stances.length > 0 && (
              <div className="space-y-3 border-t border-border/60 pt-3">
                {stances.length > 0 && (
                  <section>
                    <span className={LABEL}>Postura</span>
                    <div className="flex flex-wrap gap-2">
                      {stances.map((st) => {
                        const on = value.stance === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => set({ stance: on ? null : st })}
                            className={
                              "inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors " +
                              (on
                                ? "border-rubi-blue bg-rubi-blue-soft text-rubi-blue"
                                : "border-border text-muted-foreground hover:text-foreground")
                            }
                          >
                            <GameIcon name={st} size={24} />
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>
            )
          }
        />
      </section>

      {/* Wheel of Destiny — fora do set: escolhe entre as rodas salvas ou monta na hora */}
      {mode === "session" && (
      <section className="rounded-xl border border-rubi-gold/25 bg-rubi-gold/[0.04] p-3">
        <div className="mb-3 border-b border-rubi-gold/15 pb-3">
          <WheelPresetPicker
            characterId={characterId}
            value={value.wheel}
            onPick={(wheel) => onChange(applyWheel(value, wheel))}
            allowSave
          />
        </div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <img src={WHEEL_ICON} alt="" className="h-6 w-6 [image-rendering:pixelated]" />
            Wheel of Destiny
            {value.wheelDmgHeal != null && (
              <span className="rounded bg-rubi-gold/15 px-1.5 py-0.5 text-xs text-rubi-gold">
                +{value.wheelDmgHeal} dano e cura
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setWheelOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rubi-gold px-3 py-1.5 text-sm font-bold text-background"
          >
            <Pencil className="h-4 w-4" /> {value.wheel ? "Editar a roda" : "Montar a roda"}
          </button>
        </div>
        {value.wheel ? (
          <button
            type="button"
            onClick={() => setWheelOpen(true)}
            className="mx-auto block w-full max-w-[300px]"
            aria-label="Editar a roda"
          >
            <WheelOfDestiny build={value.wheel} className="h-auto w-full" />
          </button>
        ) : value.conviction.length > 0 || value.revelation.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {value.revelation.map((r) => (
                <span
                  key={r.perk}
                  className="inline-flex items-center gap-1 rounded-full border border-rubi-gold/50 bg-rubi-gold/10 py-0.5 pl-0.5 pr-2 text-xs"
                >
                  <GameIcon name={r.perk} size={18} /> {r.perk} {ROMAN[r.stage]}
                </span>
              ))}
              {value.conviction.map((c) => (
                <span
                  key={c.perk}
                  className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-0.5 pr-2 text-xs"
                >
                  <GameIcon name={c.perk} size={18} /> {c.perk.replace(/^Augmented /, "")}
                  {convictionMaxLevel(c.perk) === 2 && ` ${ROMAN[c.level]}`}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Lista do jeito antigo. Monte na roda pra ficar igual ao jogo (pontos, gemas e
              Vessels).
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Escolha uma das suas rodas salvas acima ou monte uma na hora, igual ao planejador do
            tibia.com. A roda fica guardada na sessão e aparece nas comparações.
          </p>
        )}
        <WheelDialog
          open={wheelOpen}
          onOpenChange={setWheelOpen}
          value={value.wheel}
          vocation={vocation}
          defaultLevel={charLevel}
          onApply={(wheel) => onChange(applyWheel(value, wheel))}
        />
      </section>
      )}

      {mode === "session" && (
        <>
          {/* Runas de Charm */}
          <section>
            <span className={LABEL}>Runas de Charm</span>
            {rows.length === 0 ? (
              <p className="mb-2 text-xs text-muted-foreground">
                {activatedCharms.length === 0
                  ? "Cole o Miscellaneous da sessão pra ver quais charms ativaram — aí é só ligar cada um às criaturas."
                  : ""}
              </p>
            ) : (
              <div className="mb-2 space-y-2">
                {rows.map((charm) => {
                  const linked = new Set(
                    entries(charm)
                      .map((e) => e.creature)
                      .filter(Boolean),
                  );
                  const lvl = rowLevel(charm);
                  return (
                    <div
                      key={charm}
                      className="rounded-lg border border-border bg-surface/60 p-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <img src={charmIcon(charm)} alt="" className="h-8 w-8" />
                        <span className="font-semibold text-rubi-gold">{charm}</span>
                        {activatedCharms.includes(charm) && (
                          <span className="rounded bg-rubi-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-rubi-success">
                            ativou nesta sessão
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          {([1, 2, 3] as const).map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCharmLevel(charm, n)}
                              title={n === 1 ? "Bronze" : n === 2 ? "Prata" : "Ouro"}
                              className={
                                "rounded-md border px-2 py-0.5 text-[11px] font-semibold " +
                                (lvl === n && entries(charm).length
                                  ? "border-rubi-gold bg-rubi-gold/15 text-rubi-gold"
                                  : "border-border text-muted-foreground hover:text-foreground")
                              }
                            >
                              Nv{n}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => removeRow(charm)}
                            aria-label={`Tirar ${charm}`}
                            className="ml-1 rounded p-1 text-muted-foreground hover:text-rubi-danger"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {creatures.map((cr) => {
                          const on = linked.has(cr);
                          return (
                            <button
                              key={cr}
                              type="button"
                              onClick={() => toggleCreature(charm, cr)}
                              className={
                                "inline-flex items-center gap-1 rounded-md border py-0.5 pl-0.5 pr-2 text-[11px] transition-colors " +
                                (on
                                  ? "border-rubi-gold bg-rubi-gold/15 text-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground")
                              }
                            >
                              <GameIcon name={cr} size={20} /> {cr}
                            </button>
                          );
                        })}
                      </div>
                      {linked.size === 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Toque nas criaturas em que esse charm estava.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {pickerOpen ? (
              <div className="rounded-lg border border-border p-2">
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-9">
                  {CHARMS.filter((c) => !rows.includes(c.name)).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      title={c.name}
                      onClick={() => {
                        setExtraCharms((x) => [...x, c.name]);
                        setPickerOpen(false);
                      }}
                      className="flex flex-col items-center gap-0.5 rounded-md p-1 hover:bg-accent"
                    >
                      <img src={c.icon} alt="" className="h-8 w-8" />
                      <span className="line-clamp-1 text-[9px] text-muted-foreground">
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Outro charm que não apareceu
              </button>
            )}
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Nv1 = Bronze, Nv2 = Prata, Nv3 = Ouro (TibiaWiki).
            </p>
          </section>
        </>
      )}
    </div>
  );
}
