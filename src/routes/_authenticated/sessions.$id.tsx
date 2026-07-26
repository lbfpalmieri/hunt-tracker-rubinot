import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { useAppStore, useHydrated } from "@/lib/store";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import { huntRawXp, bountyLabel } from "@/lib/bounty";
import { BountyBadge } from "@/components/BountyBadge";
import { BountyEditor } from "@/components/BountyEditor";
import {
  ArrowLeft, Coins, Heart, Skull, Swords, Timer, Trash2, Zap, Package, Shield, Globe2, Trophy,
} from "lucide-react";
import { PasteImageBox } from "@/components/PasteImage";


import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/sessions/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Sessão ${params.id.slice(0, 6)} — RubinOT Hunt Tracker` },
      { name: "description", content: "Detalhes da sessão de hunt no RubinOT." },
      { property: "og:title", content: "Detalhe da sessão" },
      { property: "og:description", content: "Dano, loot, kills e evolução desta hunt." },
      { property: "og:type", content: "article" },
    ],
  }),
  component: SessionDetail,
});

const TYPE_COLORS = ["var(--rubi-blue)", "var(--rubi-gold)", "var(--rubi-success)", "var(--rubi-danger)", "oklch(0.7 0.18 300)", "oklch(0.75 0.15 190)"];

function SessionDetail() {
  const hydrated = useHydrated();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const sessions = useAppStore((s) => s.sessions);
  const characters = useAppStore((s) => s.characters);
  const removeSession = useAppStore((s) => s.removeSession);
  const updateSession = useAppStore((s) => s.updateSession);


  const session = sessions.find((s) => s.id === id);
  const char = session ? characters.find((c) => c.id === session.characterId) : null;

  if (!hydrated) {
    return (
      <AppShell>
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell>
        <EmptyState
          icon={Swords}
          title="Sessão não encontrada"
          description="Ela pode ter sido removida."
          ctaLabel="Voltar ao histórico"
          ctaTo="/sessions"
        />
      </AppShell>
    );
  }

  const h = session.hunting;
  const gph = h.balance / (h.durationSec / 3600 || 1);
  const netRawXp = huntRawXp(session);
  const totalKills = h.kills.reduce((a, k) => a + k.count, 0);
  const killsData = h.kills.slice().sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <AppShell>
      <Link
        to="/sessions"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Sessão</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold">{session.huntName}</h1>
            {session.bounty && <BountyBadge bounty={session.bounty} showXp />}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {char?.name ?? "—"} · {fmtDate(session.createdAt)} ·{" "}
            {h.startedAt && h.endedAt ? `${h.startedAt} → ${h.endedAt}` : fmtDuration(h.durationSec)}
          </p>
        </div>
        <button
          onClick={async () => {
            if (confirm("Excluir esta sessão?")) {
              await removeSession(session.id);
              navigate({ to: "/sessions" });
            }
          }}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-rubi-danger/40 px-3 py-2 text-sm text-rubi-danger hover:bg-rubi-danger/10 sm:self-auto"
        >
          <Trash2 className="h-4 w-4" /> Excluir
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Duração" value={fmtDuration(h.durationSec)} icon={Timer} accent="muted" />
        <StatCard
          label={session.bounty ? "Raw XP ganha (com bounty)" : "Raw XP ganha"}
          value={fmtNum(h.rawXp || h.xpGain)}
          hint={
            session.bounty
              ? session.bounty.xp != null
                ? `Raw XP de hunt: ${fmtNum(netRawXp ?? 0)} · Bônus Bounty (${bountyLabel(session.bounty)}): ${fmtNum(session.bounty.xp)}`
                : `Inclui bônus de Bounty Task (${bountyLabel(session.bounty)}) — valor não informado`
              : `XP com bônus: ${fmtNum(h.xpGain)}`
          }
          icon={session.bounty ? Trophy : Zap}
          accent={session.bounty ? "gold" : "blue"}
        />


        <StatCard
          label="Lucro/h"
          value={fmtGold(gph)}
          hint={`Balance: ${fmtGold(h.balance)}`}
          icon={Coins}
          accent={gph >= 0 ? "success" : "danger"}
        />
        <StatCard label="Kills" value={fmtNum(totalKills)} hint={`${h.kills.length} espécies`} icon={Skull} accent="gold" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Loot" value={fmtGold(h.loot)} accent="gold" />
        <StatCard label="Supplies" value={fmtGold(h.supplies)} accent="danger" />
        <StatCard label="Dano/h" value={fmtNum(h.damagePerHour)} icon={Swords} accent="blue" />
        <StatCard label="Healing/h" value={fmtNum(h.healingPerHour)} icon={Heart} accent="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kills chart */}
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold">Monstros mortos</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={killsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--rubi-blue-soft)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--rubi-blue)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Damage types pie */}
        <div className="card-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4 text-rubi-danger" /> Dano recebido
          </h2>
          {session.damage && session.damage.damageTypes.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                Total: <b className="text-foreground">{fmtNum(session.damage.totalReceived)}</b> · Max DPS:{" "}
                <b className="text-foreground">{fmtNum(session.damage.maxDps)}</b>
              </p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={session.damage.damageTypes}
                      dataKey="value"
                      nameKey="type"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                    >
                      {session.damage.damageTypes.map((_, i) => (
                        <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v) => fmtNum(Number(v))}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1 text-xs">
                {session.damage.damageTypes.map((t, i) => (
                  <li key={t.type} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                      {t.type}
                    </span>
                    <span className="text-muted-foreground">{t.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de dano recebido nesta sessão.</p>
          )}
        </div>
      </div>

      {/* Loot table */}
      <div className="card-surface mt-6 p-5">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Package className="h-4 w-4 text-rubi-gold" /> Itens lootados ({h.lootedItems.length})
        </h2>
        {h.lootedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem loot registrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {h.lootedItems
              .slice()
              .sort((a, b) => b.count - a.count)
              .map((it) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                >
                  <span className="truncate">{it.name}</span>
                  <span className="ml-2 font-mono font-semibold text-rubi-gold">×{fmtNum(it.count)}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Bounty Task bonus */}
      <div className="card-surface mt-6 border-rubi-gold/25 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold">
          <Trophy className="h-4 w-4 text-rubi-gold" /> Bônus de Bounty Task
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          A XP de conclusão de uma Bounty Task entra junto na Raw XP do log. Marque aqui para que ela seja
          descontada das médias de Raw XP/h.
        </p>
        <BountyEditor
          value={session.bounty}
          onSave={(next) => updateSession(session.id, { bounty: next })}
        />
      </div>

      {/* Gear + community sharing */}

      <div className="card-surface mt-6 p-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4 text-rubi-blue" /> Equipamento usado
          </h2>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={session.isPublic}
              onChange={(e) => updateSession(session.id, { isPublic: e.target.checked })}
              className="h-4 w-4 accent-[var(--rubi-blue)]"
            />
            <Globe2 className="h-3.5 w-3.5" />
            {session.isPublic ? "Compartilhada na Comunidade" : "Sessão privada"}
          </label>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Tire um print do seu equipamento no jogo e cole aqui com Ctrl+V. Ele aparece junto desta hunt
          na Comunidade.
        </p>
        <PasteImageBox
          value={session.gearUrl}
          onChange={(v) => updateSession(session.id, { gearUrl: v })}
          label="Cole o print do equipamento (Ctrl+V)"
          className="mt-3 max-w-md"
        />
      </div>

      {/* Misc */}
      {session.misc && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <MiscBlock
            title="Charm Data"
            data={session.misc.charm}
            emptyLabel="Nenhum charm utilizado nesta hunt."
          />
          <MiscBlock
            title="Imbuement Data"
            data={session.misc.imbuement}
            emptyLabel="Nenhum imbuement contribuiu nesta hunt."
          />
          <MiscBlock
            title="Item Upgrade"
            data={session.misc.itemUpgrade}
            emptyLabel="Nenhum item upgrade ativo nesta hunt."
          />
        </div>
      )}

    </AppShell>
  );
}

function MiscBlock({
  title,
  data,
  emptyLabel,
}: {
  title: string;
  data: Record<string, number>;
  emptyLabel: string;
}) {
  const entries = Object.entries(data);
  return (
    <div className="card-surface p-5">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <dl className="space-y-2 text-sm">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono font-semibold">{fmtNum(v)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
