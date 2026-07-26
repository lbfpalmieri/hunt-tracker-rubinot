import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import logo from "@/assets/dragon-logo.png.asset.json";
import avatar from "@/assets/channel-avatar.png.asset.json";
import { Youtube, Instagram, Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/about")({
  head: () => ({
    meta: [
      { title: "Sobre — RubinOT Hunt Tracker" },
      { name: "description", content: "RubinOT Hunt Tracker desenvolvido pelo canal É sobre RubinOT (@Ésobrerubinot)." },
      { property: "og:title", content: "Sobre — RubinOT Hunt Tracker" },
      { property: "og:description", content: "Feito pela comunidade, para a comunidade." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl text-center">
        <img src={logo.url} alt="RubinOT Hunt Tracker" className="mx-auto h-40 w-auto object-contain" />
        <h1 className="mt-6 font-display text-4xl font-bold">
          <span className="text-gradient-brand">RubinOT</span> Hunt Tracker
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Uma ferramenta simples e direta para acompanhar suas hunts no RubinOT.
          Cole os dados do jogo, veja sua evolução em XP/h, lucro/h e monstros por hora.
        </p>

        <div className="card-surface mx-auto mt-8 flex flex-col items-center gap-4 p-6">
          <img src={avatar.url} alt="Canal É sobre RubinOT" className="h-20 w-20 rounded-full ring-2 ring-rubi-gold/60" />
          <div>
            <div className="font-display text-xl font-bold">@Ésobrerubinot</div>
            <div className="text-sm text-muted-foreground">É sobre RubinOT — o canal</div>
          </div>
          <p className="text-sm text-muted-foreground">
            Desenvolvido para a comunidade que ama esse servidor.
          </p>
          <div className="flex gap-2">
            <a
              href="https://www.youtube.com/@Ésobrerubinot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-rubi-danger/90 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              <Youtube className="h-3.5 w-3.5" /> YouTube
            </a>
            <a
              href="https://instagram.com/esobrerubinot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-rubi-gold px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
          </div>
        </div>

        <div className="card-surface mt-6 p-6 text-left text-sm">
          <h2 className="mb-3 font-display text-lg font-semibold">Como usar</h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Cadastre seu personagem em <b className="text-foreground">Personagens</b>.</li>
            <li>No cliente do RubinOT, abra o <b className="text-foreground">Hunt Analyser</b> e copie o texto.</li>
            <li>Em <b className="text-foreground">Importar</b>, cole nos campos (Hunting, Damage, Miscellaneous).</li>
            <li>Dê um nome à hunt (ex: "Rhindeers Norte") e salve.</li>
            <li>Acompanhe sua evolução no <b className="text-foreground">Dashboard</b>.</li>
          </ol>
        </div>

        <p className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground">
          Feito com <Heart className="h-3 w-3 text-rubi-danger" /> pela comunidade RubinOT
        </p>
      </div>
    </AppShell>
  );
}
