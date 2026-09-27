import { useState } from "react";
import { toast } from "sonner";
import { PartyEditor } from "@/components/party/PartyEditor";
import { resplit, unsplitHunting, type PartyInfo } from "@/lib/party";
import type { HuntSession } from "@/lib/store";

/**
 * Party de uma sessão já salva — serve pra marcar sessões antigas feitas em pt (e colar o Party
 * Hunt Analyser depois). Salvar refaz a divisão a partir dos números pessoais originais.
 */
export function SessionPartyEditor({
  session,
  charName,
  onSave,
}: {
  session: HuntSession;
  charName: string | null;
  onSave: (patch: { party: PartyInfo | null; hunting: HuntSession["hunting"] }) => Promise<void>;
}) {
  const [draft, setDraft] = useState<PartyInfo | null>(session.party);
  const [saving, setSaving] = useState(false);
  const strip = (p: PartyInfo | null) => (p ? { ...p, personal: null } : null);
  const dirty = JSON.stringify(strip(draft)) !== JSON.stringify(strip(session.party));
  const ready = !draft || !draft.members || !!draft.self;
  const personal = unsplitHunting(session.hunting, session.party);

  const save = async () => {
    setSaving(true);
    try {
      const wasParty = !!session.party;
      const next = resplit(session.hunting, session.party, draft);
      await onSave({ party: next.party, hunting: next.hunting });
      if (wasParty !== !!next.party) {
        toast.success(next.party ? "Sessão movida pro Modo Grupo" : "Sessão movida pro Modo Solo");
      } else toast.success("Party atualizada");
    } catch (e) {
      toast.error("Não consegui salvar", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PartyEditor
        value={draft}
        onChange={setDraft}
        charName={charName}
        personalBalance={personal.balance}
        personalDurationSec={
          session.party?.noHuntingAnalyser ? undefined : session.hunting.durationSec
        }
        fixed={!!session.party?.noHuntingAnalyser}
      />
      {(dirty || saving) && (
        <button
          type="button"
          onClick={save}
          disabled={!ready || saving}
          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rubi-blue/50 px-3 py-1.5 text-xs font-semibold text-rubi-blue transition-opacity hover:bg-rubi-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Salvando..." : "Salvar party"}
        </button>
      )}
    </div>
  );
}
