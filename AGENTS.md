> [!IMPORTANT]
> Projeto NÃO usa mais o Lovable (desligado em 2026-10-05). Hospedagem: Cloudflare
> (Worker `lbfpalmieri-hunt-tracker-rubinot` + endereço curto rubinothunt.pages.dev via
> pages-proxy/). Banco/login: Supabase próprio (projeto kapozquqbdfurncgqdnd, São Paulo).
> Todo push no `main` publica o site (GitHub Actions → .github/workflows/deploy-cloudflare.yml),
> então mantenha o `main` funcionando.

# RubinOT Hunt Tracker — contexto

App pt-BR (tema dark) para jogadores do RubinOT (Tibia alternativo) acompanharem
hunts: lucro, XP, monstros/h, sessões, comparativos, comunidade.

Stack: TanStack Start v1 + React 19 + Tailwind v4 + shadcn; backend Supabase próprio
(Google OAuth direto no Supabase, Postgres RLS, Storage); server logic em createServerFn
(*.functions.ts em src/lib); rotas autenticadas em src/routes/_authenticated/.

Regras permanentes:
- Toda feature/fix/QoL ganha entrada no topo de WHATS_NEW em src/lib/whats-new.ts (pt-BR).
- Nunca exibir e-mail de usuários; identificar pelo nome do personagem ativo.
- Não alterar estrutura de banco sem pedido explícito; tabela public nova exige GRANT+RLS.
- Queries filtradas por user_id; community.functions.ts usa allowlist de colunas.
- Testar tudo no navegador (Playwright logado) antes de reportar; typecheck `npm run typecheck` (tsgo).
- Testes automáticos (Vitest) da lógica pura em src/lib/__tests__/*.test.ts (parser, party, cálculos "/h",
  médias, imbuements, export) — `npm test`. Mexeu em cálculo/parser = ajustar ou criar teste junto. Textos de
  exemplo (exports reais do RubinOT) em fixtures.ts. Todo PR roda .github/workflows/ci.yml: typecheck + testes +
  build + `wrangler deploy --dry-run` (sem publicar). Lint (eslint) ainda NÃO entra no CI (milhares de erros de formatação).
- Admin: lucasbuzioli@gmail.com, role em public.user_roles via has_role (schema private).
  Roles NUNCA em profile/users.

Cálculos: todo "/h" de sessão = total ÷ duração da própria sessão; nunca copiar o
"/h" do Hunting Analyser do jogo (janela maior). "Corrigir tempo" (DurationAdjust + withDuration em parser.ts) na
Nova sessão e no registro de bosses troca a duração colada (totais iguais, /h e endedAt recalculados; em grupo
também party.sessionSec). Média da hunt = média das sessões
(aggregateByHunt em compare.ts). Imbuements: keyOf = `${gearSlot}::${label}` — tipos
diferentes coexistem no item; mesmo tipo = renovação. Prey (prey.ts): 3 slots (2 liberados +
1 "Permanent Prey Slot" da Store), 1 criatura por slot, 1 bônus por criatura, 10 estrelas:
Dano 7–25% (+2), Redução 12–30% (+2), XP/Loot 13–40% (+3). Seletor = PreyPicker (layout da janela do jogo).

Telas: sessions.tsx (20/pág) e sessions.$id.tsx; import.tsx (colar export do Hunting
Analyser, parser.ts, sem OCR; salvar = assistente em Dialog: Hunt → Bounty (BountyTaskPanel,
estilo Task Board, coluna bounty_creature) → Prey (PreyPicker inline) → Setup → Finalizar).
Setup da sessão: hunt_sessions.setup jsonb (src/lib/session-setup.ts) — SÓ campos estruturados de listas
da TibiaWiki (charms, posturas, perks de Convicção/Revelação da Wheel por vocação; ícones via GameIcon) + nome da arma sanitizado; é público com a sessão.
WHEEL OF DESTINY = planejador próprio (components/wheel/: WheelOfDestiny SVG, WheelPlanner, WheelDialog, WheelReadout) em
setup.wheel {voc, points[36], gems{TL/TR/BL/BR: [mod1, mod2, supremo]}, level, scrolls, extra}. Dados do jogo em
src/data/wheel-data.ts (fatias, pontos 50/75/100/150/200, perks por vocação, revelação por domínio, mods no Grau IV —
levantados no planejador oficial do tibia.com em 2026-10-07; o código de compartilhamento de lá é binário fechado, NÃO
importamos). Regras em src/lib/wheel.ts (fatia libera com vizinha CHEIA; revelação 250/500/1000 + Revelation Mastery;
mod N liga com N Vessel Resonances; bônus de Vessel só quando bate com o tamanho da gema). Com wheel, normalizeSetup
RECALCULA conviction/revelation/wheelDmgHeal a partir dela (wheelSetupFields).
Presets do setup ("sets", sem charms; o print do set foi REMOVIDO — o boneco de equipamentos substitui, gear_url não é lido) por personagem em public.setup_presets
(setup-presets.ts); tela dedicada /equipamentos (Meus sets). SET = SÓ equipamento + postura (SET_PARTS, presetPart): a Wheel
SAIU do set em 2026-10-11 — set antigo com roda no jsonb é lido sem ela. RODAS SALVAS por personagem em public.wheel_presets
(wheel-presets.ts; tela /rodas "Minhas rodas", menu Herói): escolhidas à parte do set via WheelPresetPicker (SessionSetupPanel
no modo "session" e SetAndWheelPicker no registro de boss). applySet troca equipamento/postura e mantém a roda; applyWheel
troca a roda e mantém o resto. A sessão/execução guarda uma CÓPIA da roda (setup.wheel) — editar/excluir a roda salva não muda
o que já foi registrado. Execução de boss: boss_rotation_runs.setup jsonb (mesmo formato; só é enviado quando há set/roda).
Armas: src/data/weapons-data.ts (530 armas extraídas da TibiaWiki BR — categorias Espadas/Machados/Clavas,
Bows/Crossbows/Armas de Arremesso, Wands, Rods, Punhos (monk), Aljavas; sem obsoletas), lidas por
src/lib/weapons.ts e filtradas por vocação. Equipamentos: src/data/equipment-data.ts (825 itens da TibiaWiki BR —
Capacetes, Armaduras, Calças, Botas, Escudos, Spellbooks, Amuletos e Colares, Anéis, Munição, Extra Slot; sem
"Removido na versão ..."), lidos por src/lib/equipment.ts; setup.gear {head,neck,armor,legs,feet,ring,shield,ammo}
(normalizeGear só aceita nome da lista no slot certo). UI = EquipmentDoll (layout do inventário do jogo, cada
slot filtra tipo + vocação; arma → setup.weapon, aljava → setup.quiver). Item novo do jogo = refazer a extração.
Tier (Exaltation Forge, src/lib/forge.ts, tabela da página "Exaltation Forge" da TibiaWiki BR): só arma/capacete/
armadura/calça/bota; habilidades Onslaught/Momentum/Ruse/Transcendence/Amplification com % por tier; tier máx pela
classe do item (campo "tier máx" dos dados, conferido contra "Forja Classe N"). setup.weaponTier + setup.gearTier. Escolher set no assistente preenche o setup e o
print da sessão (se ela ainda não tiver). Dashboard: RendimentoNudge + SetsNudge com horários defasados.
Observações (notes) continuam privadas — não exibir texto livre na Comunidade. Formatação leve (notes-format.ts:
**negrito**, *itálico*, ~~riscado~~, ==destaque==, # título, listas, - [ ] checklist, > citação, ---) editada em
NotesEditor e mostrada em NotesView (elementos React, nunca innerHTML); limite NOTES_MAX. Nova sessão NÃO tem mais
print do equipamento (gearUrl salvo null); imbuements.tsx (20h, horas+minutos); tools.linked-tasks.tsx
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
(líder primeiro, média, maior→menor com floor), exceto que membro removido sai do total.
MODO GRUPO = sessão do texto da party + OPCIONAL o Hunting/Input/Misc pessoal (import.tsx: parsed.hunting
vem de mergePartyHunting — duração/lucro da party, XP/kills/itens do analyser pessoal, "/h" pela duração da
PARTY; self achado pelo nome ou por findSelfByHunting). O "Copy to Clipboard" da Party Hunt do RubinOT sai NO
FORMATO do Hunting Analyser (XP 0, Killed Monsters/Looted Items "None", sem membros) → looksLikeRubinotPartyHunt,
vira party.own (sua linha, sem divisão; tamanho informado no passo Grupo). Sem o Hunting pessoal o assistente pula Bounty/Prey. Resultado do LootSplitter do RubinOT (formato real:
"Nome: balance", "Profit: X (Y each)", "- A transfers N to B") também vira party. party.noHuntingAnalyser
= sessão de grupo salva sem o Hunting pessoal = sem XP → huntRawXp() null (fora das médias de XP). Modo Solo não cria party (colar o da party troca de modo). Com o analyser da party, hunting é salvo JÁ DIVIDIDO (balance = total ÷ membros, loot =
parte + supplies próprios; números pessoais em party.personal — resplit/unsplitHunting pra editar). Modo
fica em user_nav_prefs.play_mode (nav-prefs.ts) e muda o visual via html[data-play-mode="party"] (styles.css).
Telas de hunt (Dashboard, Sessões, Comparar, Ranking, Calculadora, Comunidade) usam useModeSessions() /
mode no getCommunitySessions; telas do personagem (Meu rendimento, Imbuements, Todos os personagens, saldo
de gold) usam todas as sessões. Nomes dos membros NUNCA vão pra Comunidade (publicParty em
community.functions.ts expõe só size/split).
Páginas PÚBLICAS (modo visitante, sem login): /community, /community/$id, /tools/compare e /about ficam em
src/routes/ (fora de _authenticated) e usam SiteShell (components/SiteShell.tsx): logado = AppShell normal; sem conta
= cabeçalho de visitante + convite "Entrar com Google". Dados da Comunidade vêm de server fns públicas (sem login).
Visitante só pesquisa/vê/compara/exporta analyser; nada pessoal. robots.txt/sitemap.xml em public/ liberam essas páginas
pro Google. Exportar Analyser (analyser-export.ts, formato do Copy to Clipboard do jogo): sessão própria, sessão pública
e média da hunt da Comunidade (hunt + vocação).
CONSELHO DA LINKED TASK (LinkedTaskDialog → components/advisor/LinkedTaskAdvice.tsx): NÃO é página própria (o usuário
rejeitou o "Hunt Advisor" separado). Criaturas da TibiaWiki em src/data/monsters-data.ts (1458, extraídas no navegador: HP,
XP, charm, fraqueza por elemento, maior dano de cada ataque; SEM loot) lidas por src/lib/monsters.ts — o "elemento mais
eficaz" da task também sai daí (huntWeakness), sem consultar a wiki. Motor em src/lib/hunt-advisor.ts: dano recebido
estimado pelos ataques (estimateIncoming); set = melhor item por slot (equipment/weapons, vocação + level do personagem
ativo) com score defesa (resist% × fatia do dano + armor) e ataque (skills) pesados pelo modo Defensivo/Equilibrado/
Ofensivo; itens de carga (Stone Skin, Might Ring, amuletos de 60%...) e de mergulho ficam FORA do set (CHARGED) e viram
"Pra levar na BP" (emergencyItems); melhor elemento só entre os que a vocação usa (VOC_ELEMENTS); imbuements/charms por
regra simples.
Navegação: src/lib/nav-items.ts é a FONTE ÚNICA dos itens de menu (NAV_ITEMS/NAV_GROUPS) — página nova
entra só lá (id, rota, label, short, ícone lucide, SPRITE do jogo, grupo). O menu mostra o sprite (TibiaWiki, via
components/nav/NavIcon.tsx → GameIcon, estilo da wiki/site do RubinOT) e cai no ícone lucide se a imagem falhar.
Visual: títulos de página (h1) e de seção do menu em Cinzel (font-brand, a fonte do site oficial); texto em Inter;
números/títulos de card em Space Grotesk (font-display). color-scheme: dark nos controles nativos. Desktop (≥1024px): menu lateral
(components/nav/SidebarNav.tsx; recolhido/hover/fixado). <1024px: barra de baixo com os 4 primeiros
"fixados" + folha "Menu" em grade (MobileNav.tsx). O usuário personaliza fixados/ordem em
NavCustomizeDialog; salvo em public.user_nav_prefs (1 linha/usuário, localStorage só como cache —
nav-prefs.ts). Não recrie arrays de nav no AppShell.

Banco (IAs externas): mudanças de estrutura são feitas via SQL, entregue pronto ao
usuário. Toda tabela nova em public precisa GRANT + RLS + policies no mesmo script;
queries sempre filtradas por user_id; roles NUNCA em profile/users.
