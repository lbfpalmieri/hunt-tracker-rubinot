<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# RubinOT Hunt Tracker — contexto

App pt-BR (tema dark) para jogadores do RubinOT (Tibia alternativo) acompanharem
hunts: lucro, XP, monstros/h, sessões, comparativos, comunidade.

Stack: TanStack Start v1 + React 19 + Tailwind v4 + shadcn; backend Lovable Cloud
(Supabase: Google OAuth, Postgres RLS, Storage); server logic em createServerFn
(*.functions.ts em src/lib); rotas autenticadas em src/routes/_authenticated/.

Regras permanentes:
- Toda feature/fix/QoL ganha entrada no topo de WHATS_NEW em src/lib/whats-new.ts (pt-BR).
- Nunca exibir e-mail de usuários; identificar pelo nome do personagem ativo.
- Não alterar estrutura de banco sem pedido explícito; tabela public nova exige GRANT+RLS.
- Queries filtradas por user_id; community.functions.ts usa allowlist de colunas.
- Testar tudo no navegador (Playwright logado) antes de reportar; typecheck `bunx tsgo --noEmit`.
- Admin: lucasbuzioli@gmail.com, role em public.user_roles via has_role (schema private).
  Roles NUNCA em profile/users.

Cálculos: todo "/h" de sessão = total ÷ duração da própria sessão; nunca copiar o
"/h" do Hunting Analyser do jogo (janela maior). Média da hunt = média das sessões
(aggregateByHunt em compare.ts). Imbuements: keyOf = `${gearSlot}::${label}` — tipos
diferentes coexistem no item; mesmo tipo = renovação. Prey (prey.ts): 3 slots (2 liberados +
1 "Permanent Prey Slot" da Store), 1 criatura por slot, 1 bônus por criatura, 10 estrelas:
Dano 7–25% (+2), Redução 12–30% (+2), XP/Loot 13–40% (+3). Seletor = PreyPicker (layout da janela do jogo).

Telas: sessions.tsx (20/pág) e sessions.$id.tsx; import.tsx (colar export do Hunting
Analyser, parser.ts, sem OCR; salvar = assistente em Dialog: Hunt → Bounty (BountyTaskPanel,
estilo Task Board, coluna bounty_creature) → Prey (PreyPicker inline) → Setup → Finalizar).
Setup da sessão: hunt_sessions.setup jsonb (src/lib/session-setup.ts) — SÓ campos estruturados de listas
da TibiaWiki (charms, posturas, perks de Convicção/Revelação da Wheel por vocação; ícones via GameIcon) + nome da arma sanitizado; é público com a sessão.
Presets do setup ("sets", sem charms; o print do set foi REMOVIDO — o boneco de equipamentos substitui, gear_url não é lido) por personagem em public.setup_presets
(setup-presets.ts); tela dedicada /equipamentos (Meus sets).
Armas: src/data/weapons-data.ts (530 armas extraídas da TibiaWiki BR — categorias Espadas/Machados/Clavas,
Bows/Crossbows/Armas de Arremesso, Wands, Rods, Punhos (monk), Aljavas; sem obsoletas), lidas por
src/lib/weapons.ts e filtradas por vocação. Equipamentos: src/data/equipment-data.ts (825 itens da TibiaWiki BR —
Capacetes, Armaduras, Calças, Botas, Escudos, Spellbooks, Amuletos e Colares, Anéis, Munição, Extra Slot; sem
"Removido na versão ..."), lidos por src/lib/equipment.ts; setup.gear {head,neck,armor,legs,feet,ring,shield,ammo}
(normalizeGear só aceita nome da lista no slot certo). UI = EquipmentDoll (layout do inventário do jogo, cada
slot filtra tipo + vocação; arma → setup.weapon, aljava → setup.quiver). Item novo do jogo = refazer a extração. Escolher set no assistente preenche o setup e o
print da sessão (se ela ainda não tiver). Dashboard: RendimentoNudge + SetsNudge com horários defasados.
Observações (notes) continuam privadas — não exibir texto livre na Comunidade.; imbuements.tsx (20h, horas+minutos); tools.linked-tasks.tsx
(linked_task_progress, barras geral/por sala, marcar tudo); tools.compare.tsx (até 4
hunts) e tools.comparisons.tsx (salvos privados); community.index.tsx (feed público,
vocações em grade); feedback.tsx (tickets com imagem no bucket feedback-attachments,
Inbox admin, export Markdown sem e-mails, histórico de resolvidos); rendimento.tsx
(level_snapshots + goals).

Mobile/perf: listas paginadas; imagens lazy.
Rotação de Bosses (/bosses, /bosses/$id): catálogo da TibiaWiki em public.boss_catalog_cache (linha única,
jsonb compacto — ver src/lib/boss-catalog.ts). A api.php da wiki bloqueia servidor (Cloudflare), então o
sync roda NO NAVEGADOR do admin (fetch com origin=*) e grava no banco; usuários só leem. Rotações/execuções
em boss_rotations / boss_rotation_runs; ajuste solo/time em user_boss_prefs. Tema visual próprio
(carmesim + dourado, components/bosses/). Lucro de execução = só itens que caem APENAS de boss
("droppedby" da wiki, flag bossOnly no catálogo) × preço informado pelo usuário − supplies; loot dos
monstros do caminho não conta (a menos que a pessoa escolha "Loot total do analyser" no registro — lembrado em localStorage). NÃO usar lucro/h nessa área (boss tem cooldown).
Preço dos itens no registro: "Meus preços" (public.user_item_prices por user+world, item-prices.ts; aba
"Meus preços" do Covil) ou "Preço NPC" da wiki; digitado no registro é salvo na tabela.
Modo Solo/Grupo (play-mode.ts): hunt_sessions.party jsonb (party.ts: size, members do Party Hunt Analyser,
self, personal, extraCost/removed por membro, lootType, splitterShare). Formatos e divisão tirados do cliente
(OTClient: game_analyser/PartyHuntAnalyser.lua "Copy to Clipboard" e game_lootsplitter/lootsplitter.lua) —
"Copy to LootSplitter" NÃO copia, só abre a janela do cliente; a divisão (computeSplit) replica o LootSplitter
(líder primeiro, média, maior→menor com floor), exceto que membro removido sai do total. Com o analyser da party, hunting é salvo JÁ DIVIDIDO (balance = total ÷ membros, loot =
parte + supplies próprios; números pessoais em party.personal — resplit/unsplitHunting pra editar). Modo
fica em user_nav_prefs.play_mode (nav-prefs.ts) e muda o visual via html[data-play-mode="party"] (styles.css).
Telas de hunt (Dashboard, Sessões, Comparar, Ranking, Calculadora, Comunidade) usam useModeSessions() /
mode no getCommunitySessions; telas do personagem (Meu rendimento, Imbuements, Todos os personagens, saldo
de gold) usam todas as sessões. Nomes dos membros NUNCA vão pra Comunidade (publicParty em
community.functions.ts expõe só size/split).
Navegação: src/lib/nav-items.ts é a FONTE ÚNICA dos itens de menu (NAV_ITEMS/NAV_GROUPS) — página nova
entra só lá (id, rota, label, short, ícone lucide, grupo). Desktop (≥1024px): menu lateral
(components/nav/SidebarNav.tsx; recolhido/hover/fixado). <1024px: barra de baixo com os 4 primeiros
"fixados" + folha "Menu" em grade (MobileNav.tsx). O usuário personaliza fixados/ordem em
NavCustomizeDialog; salvo em public.user_nav_prefs (1 linha/usuário, localStorage só como cache —
nav-prefs.ts). Não recrie arrays de nav no AppShell.

Banco (IAs externas): mudanças de estrutura são feitas via SQL, entregue pronto ao
usuário. Toda tabela nova em public precisa GRANT + RLS + policies no mesmo script;
queries sempre filtradas por user_id; roles NUNCA em profile/users.
