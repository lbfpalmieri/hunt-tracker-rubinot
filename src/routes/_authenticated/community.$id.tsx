import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { getCommunitySession } from "@/lib/community.functions";
import { fmtDate, fmtDuration, fmtGold, fmtNum } from "@/lib/format";
import { ArrowLeft, Coins, Globe2, Shield, Skull, Timer, Zap, Trophy } from "lucide-react";
import { BountyBadge } from "@/components/BountyBadge";
import { PreyBadge } from "@/components/PreyBadge";
import { bountyLabel } from "@/lib/bounty";

export const Route = createFileRoute("/_authenticated/community/$id")({
  head: () => ({
    meta: [
      { title: "Sessão da comunidade — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Detalhes públicos de uma hunt compartilhada: kills, loot, imbuements e equipamento.",
      },
      { property: "og:title", content: "Sessão compartilhada da comunidade" },
      { property: "og:description", content: "Veja kills, lucro e equipamento usados nesta hunt." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CommunitySessionPage,
});

function CommunitySessionPage() {
  const { id } = Route.useParams();
  const fetchSession = useServerFn(getCommunitySession);
  const { data, isLoading } = useQuery({
    queryKey: ["community-session", id],
    queryFn: () => fetchSession({ data: { id } }),
  });

  const session = data?.session ?? null;

  return (
    <AppShell>
      <Link
        to="/community"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a comunidade
      </Link>

      {isLoading ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted/30" />
      ) : !session ? (
        <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
          <Globe2 className="h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">Sessão indisponível</p>
          <p className="text-sm text-muted-foreground">
            Ela pode ter sido removida ou deixou de ser compartilhada.
          </p>
        </div>
      ) : (
        <SessionView session={session} />
      )}
    </AppShell>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SessionView({ session }: { session: any }) {
  const h = session.hunting ?? {};
  const durationSec = Number(h.durationSec ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kills: { name: string; count: number }[] = (h.kills ?? []) as any[];
  const totalKills = kills.reduce((a, k) => a + Number(k.count || 0), 0);
  const hours = durationSec / 3600 || 1;
  const rawXp = Number(h.rawXp ?? 0) || Number(h.xpGain ?? 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lootedItems: { name: string; count: number }[] = (h.lootedItems ?? []) as any[];

  return (
    <>
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-widest text-rubi-gold">Comunidade</div>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{session.huntName}</h1>
          {session.bounty && <BountyBadge bounty={session.bounty} showXp />}
          {session.prey && <PreyBadge prey={session.prey} detailed />}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {session.charName} · {session.vocation} · {fmtDate(session.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Duração" value={fmtDuration(durationSec)} icon={Timer} />
        <Stat
          label={session.bounty ? "Raw XP ganha (com bounty)" : "Raw XP ganha"}
          value={fmtNum(rawXp)}
          hint={
            session.bounty
              ? session.bounty.xp != null
                ? `Raw XP de hunt: ${fmtNum(Math.max(0, rawXp - Number(session.bounty.xp)))} · Bônus Bounty (${bountyLabel(session.bounty)})`
                : `Inclui bônus de Bounty Task (${bountyLabel(session.bounty)})`
              : `XP com bônus: ${fmtNum(Number(h.xpGain ?? 0))}`
          }
          icon={session.bounty ? Trophy : Zap}
          tone={session.bounty ? "gold" : "blue"}
        />

        <Stat
          label="Balance"
          value={fmtGold(Number(h.balance ?? 0))}
          hint={`Loot ${fmtGold(Number(h.loot ?? 0))} · Supplies ${fmtGold(Number(h.supplies ?? 0))}`}
          icon={Coins}
          tone={Number(h.balance ?? 0) >= 0 ? "success" : "danger"}
        />
        <Stat
          label="Kills"
          value={fmtNum(totalKills)}
          hint={`${Math.round(totalKills / hours)} kills/h`}
          icon={Skull}
          tone="gold"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Skull className="h-4 w-4 text-rubi-gold" /> Monstros mortos ({kills.length})
          </h2>
          {kills.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem kills registradas.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kills
                .slice()
                .sort((a, b) => Number(b.count) - Number(a.count))
                .map((k) => (
                  <div
                    key={k.name}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                  >
                    <span className="truncate">{k.name}</span>
                    <span className="ml-2 font-mono font-semibold text-rubi-blue">×{fmtNum(Number(k.count))}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
            <Shield className="h-4 w-4 text-rubi-blue" /> Equipamento
          </h2>
          {session.gearUrl ? (
            <img
              src={session.gearUrl}
              alt={`Equipamento usado por ${session.charName}`}
              className="w-full rounded-lg border border-border/60 object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Este jogador não compartilhou o print do equipamento nesta sessão.
            </p>
          )}
        </div>
      </div>

      {session.misc && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <MiscBlock title="Charm Data" data={session.misc.charm ?? {}} emptyLabel="Nenhum charm utilizado nesta hunt." />
          <MiscBlock
            title="Imbuement Data"
            data={session.misc.imbuement ?? {}}
            emptyLabel="Nenhum imbuement contribuiu nesta hunt."
          />
          <MiscBlock
            title="Item Upgrade"
            data={session.misc.itemUpgrade ?? {}}
            emptyLabel="Nenhum item upgrade ativo nesta hunt."
          />
        </div>
      )}

      {lootedItems.length > 0 && (
        <div className="card-surface mt-6 p-5">
          <h2 className="mb-3 text-base font-semibold">Itens lootados ({lootedItems.length})</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {lootedItems
              .slice()
              .sort((a, b) => Number(b.count) - Number(a.count))
              .map((it) => (
                <div
                  key={it.name}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                >
                  <span className="truncate">{it.name}</span>
                  <span className="ml-2 font-mono font-semibold text-rubi-gold">×{fmtNum(Number(it.count))}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone = "muted",
}: {
  label: string;
  value: string;
  hint?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  tone?: "blue" | "gold" | "success" | "danger" | "muted";
}) {
  const color =
    tone === "blue"
      ? "text-rubi-blue"
      : tone === "gold"
        ? "text-rubi-gold"
        : tone === "success"
          ? "text-rubi-success"
          : tone === "danger"
            ? "text-rubi-danger"
            : "text-foreground";
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={"h-4 w-4 " + color} />
      </div>
      <div className={"mt-1 font-display text-xl font-bold " + color}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
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
  const entries = Object.entries(data ?? {});
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
              <dd className="font-mono font-semibold">{fmtNum(Number(v))}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
