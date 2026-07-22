import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { useAppStore, useHydrated } from "@/lib/store";
import { parseHunting, parseDamage, parseMiscellaneous, splitCombinedInput } from "@/lib/parser";
import { fmtGold, fmtNum, fmtDuration } from "@/lib/format";
import { useMemo, useState } from "react";
import { Upload, Wand2, Save, UserCircle2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({
    meta: [
      { title: "Importar sessão — RubinOT Hunt Tracker" },
      { name: "description", content: "Cole os dados do RubinOT (Hunting/Damage/Miscellaneous) e salve sua sessão." },
      { property: "og:title", content: "Importar sessão" },
      { property: "og:description", content: "Registre uma nova hunt no RubinOT Hunt Tracker." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const characters = useAppStore((s) => s.characters);
  const activeId = useAppStore((s) => s.activeCharacterId);
  const hunts = useAppStore((s) => s.hunts);
  const addSession = useAppStore((s) => s.addSession);
  const addHunt = useAppStore((s) => s.addHunt);

  const [huntingText, setHuntingText] = useState("");
  const [damageText, setDamageText] = useState("");
  const [miscText, setMiscText] = useState("");
  const [huntId, setHuntId] = useState<string>("");
  const [newHuntName, setNewHuntName] = useState("");
  const [charId, setCharId] = useState<string>("");

  const effectiveCharId = charId || activeId || characters[0]?.id || "";
  const charHunts = useMemo(
    () => hunts.filter((h) => h.characterId === effectiveCharId),
    [hunts, effectiveCharId],
  );
  const isNewHunt = huntId === "__new__" || (!huntId && charHunts.length === 0);
  const selectedHuntName = isNewHunt
    ? newHuntName.trim()
    : charHunts.find((h) => h.id === huntId)?.name ?? "";

  const parsed = useMemo(() => {
    try {
      const hunting = huntingText.trim() ? parseHunting(huntingText) : null;
      const damage = damageText.trim() ? parseDamage(damageText) : null;
      const misc = miscText.trim() ? parseMiscellaneous(miscText) : null;
      return { hunting, damage, misc };
    } catch {
      return { hunting: null, damage: null, misc: null };
    }
  }, [huntingText, damageText, miscText]);

  const canSave = Boolean(parsed.hunting && effectiveCharId && selectedHuntName);

  const handleAutoSplit = () => {
    const combined = [huntingText, damageText, miscText].filter(Boolean).join("\n\n");
    const parts = splitCombinedInput(combined);
    if (parts.hunting) setHuntingText(parts.hunting);
    if (parts.damage) setDamageText(parts.damage);
    if (parts.misc) setMiscText(parts.misc);
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const handleSave = async () => {
    if (!canSave || !parsed.hunting) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (isNewHunt) {
        await addHunt(effectiveCharId, selectedHuntName);
      }
      const created = await addSession({
        characterId: effectiveCharId,
        huntName: selectedHuntName,
        hunting: parsed.hunting,
        damage: parsed.damage,
        misc: parsed.misc,
      });
      navigate({ to: "/sessions/$id", params: { id: created.id } });
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };


  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  if (characters.length === 0) {
    return (
      <AppShell>
        <EmptyState
          icon={UserCircle2}
          title="Crie um personagem primeiro"
          description="As sessões precisam estar vinculadas a um personagem."
          ctaLabel="Criar personagem"
          ctaTo="/characters"
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Importar</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Nova sessão de hunt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole os blocos exportados pelo RubinOT. O sistema faz o parse automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <TextBlock
            label="Hunting Analyser"
            help="Bloco com XP Gain, Loot, Supplies, Balance, Killed Monsters e Looted Items."
            value={huntingText}
            onChange={setHuntingText}
          />
          <TextBlock
            label="Damage Analyser (Received Damage)"
            help="Opcional. Total, Max-DPS, Damage Types e Damage Sources."
            value={damageText}
            onChange={setDamageText}
          />
          <TextBlock
            label="Miscellaneous"
            help="Opcional. Charm Data, Imbuement Data e Item Upgrade."
            value={miscText}
            onChange={setMiscText}
          />
          <button
            onClick={handleAutoSplit}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Wand2 className="h-3.5 w-3.5" /> Auto-separar blocos misturados
          </button>
        </div>

        <div className="space-y-4">
          <div className="card-surface p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-rubi-gold" />
              Detalhes da sessão
            </h2>
            <label className="mb-3 block">
              <span className="text-xs font-medium text-muted-foreground">Personagem</span>
              <select
                value={effectiveCharId}
                onChange={(e) => setCharId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.vocation}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Hunt / spot</span>
              {charHunts.length > 0 && (
                <select
                  value={isNewHunt ? "__new__" : huntId}
                  onChange={(e) => setHuntId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm"
                >
                  <option value="">Selecione uma hunt salva…</option>
                  {charHunts.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                  <option value="__new__">+ Nova hunt…</option>
                </select>
              )}
              {isNewHunt && (
                <input
                  value={newHuntName}
                  onChange={(e) => setNewHuntName(e.target.value)}
                  placeholder="Ex: Rhindeers Norte"
                  className="mt-2 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm placeholder:text-muted-foreground/60"
                  autoFocus={charHunts.length > 0}
                />
              )}
            </label>


            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rubi-gold px-4 py-2.5 text-sm font-semibold text-background shadow-glow-gold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            >
              <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar sessão"}
            </button>
            {saveError && (
              <p className="mt-2 rounded-lg border border-rubi-danger/40 bg-rubi-danger/10 p-2 text-xs text-rubi-danger">
                {saveError}
              </p>
            )}
            {!canSave && (
              <p className="mt-2 text-xs text-muted-foreground">
                {!parsed.hunting
                  ? "Cole o Hunting Analyser para continuar."
                  : "Dê um nome à hunt."}
              </p>
            )}
          </div>

          {parsed.hunting && (
            <div className="card-surface p-5">
              <h3 className="mb-3 text-sm font-semibold">Preview</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <PreviewRow label="Duração" value={fmtDuration(parsed.hunting.durationSec)} />
                <PreviewRow label="XP/h" value={fmtNum(parsed.hunting.xpPerHour)} />
                <PreviewRow label="Loot" value={fmtGold(parsed.hunting.loot)} />
                <PreviewRow label="Supplies" value={fmtGold(parsed.hunting.supplies)} />
                <PreviewRow
                  label="Balance"
                  value={fmtGold(parsed.hunting.balance)}
                  positive={parsed.hunting.balance >= 0}
                />
                <PreviewRow label="Kills" value={fmtNum(parsed.hunting.kills.reduce((a, k) => a + k.count, 0))} />
              </dl>
            </div>
          )}
        </div>
      </div>

      {!huntingText && (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-border/60 bg-surface/40 p-4 text-sm text-muted-foreground">
          <Upload className="mt-0.5 h-4 w-4 flex-none text-rubi-blue" />
          <div>
            No cliente do RubinOT abra <b>Analytics Selector → Hunt Analyser</b> e copie o texto.
            Faça o mesmo para Damage Analyser e Miscellaneous.
          </div>
        </div>
      )}
    </AppShell>
  );
}

function TextBlock({
  label, help, value, onChange,
}: { label: string; help: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="card-surface p-4">
      <label className="block">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-muted-foreground">{value.length} chars</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{help}</p>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={7}
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed placeholder:text-muted-foreground/50"
          placeholder="Cole o texto aqui..."
          spellCheck={false}
        />
      </label>
    </div>
  );
}

function PreviewRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd
        className={
          "font-display text-lg font-semibold " +
          (positive === true ? "text-rubi-success" : positive === false ? "text-rubi-danger" : "")
        }
      >
        {value}
      </dd>
    </div>
  );
}
