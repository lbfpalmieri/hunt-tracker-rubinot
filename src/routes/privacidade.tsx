import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — RubinOT Hunt Tracker" },
      {
        name: "description",
        content: "Quais dados o RubinOT Hunt Tracker guarda, para quê e como pedir a exclusão.",
      },
      { property: "og:title", content: "Privacidade — RubinOT Hunt Tracker" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-brand text-3xl font-bold">Política de privacidade</h1>
        <p className="mt-2 text-xs text-muted-foreground">Atualizada em 5 de outubro de 2026</p>

        <div className="card-surface mt-6 space-y-5 p-6 text-sm text-muted-foreground">
          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-foreground">O que guardamos</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Do login com Google: seu e-mail e nome da conta, só para identificar você. O e-mail nunca é
                mostrado para outros jogadores.
              </li>
              <li>
                O que você cadastra no site: personagens, sessões de hunt, metas, sets, preços de itens,
                imbuements, tasks e feedbacks.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-foreground">Para que usamos</h2>
            <p>
              Só para o site funcionar: mostrar seu histórico, calcular médias e montar a Comunidade. Na
              Comunidade aparecem apenas dados de hunt e o nome do personagem — nunca e-mail, observações
              pessoais ou nomes de membros de party. Não vendemos nem compartilhamos dados com terceiros e não
              usamos para anúncios.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-foreground">Onde ficam</h2>
            <p>
              Os dados ficam no Supabase (banco de dados) e o site é servido pela Cloudflare, com acesso
              protegido por login.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-display text-base font-semibold text-foreground">Excluir seus dados</h2>
            <p>
              Para apagar sua conta e tudo o que você cadastrou, abra um pedido em{" "}
              <Link to="/feedback" className="text-rubi-gold underline">
                Feedback
              </Link>{" "}
              ou fale com o canal{" "}
              <Link to="/about" className="text-rubi-gold underline">
                É sobre RubinOT
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
