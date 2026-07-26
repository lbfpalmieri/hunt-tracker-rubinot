## Objetivo

Criar uma aba **Comunidade** no menu principal (no lugar de "Personagens", que já existe no menu do usuário) onde todas as sessões de hunt salvas pelos usuários aparecem automaticamente, com filtro por vocação, hunt e monstro — e a possibilidade de anexar um print do equipamento usado.

## 1. Menu

- Remover "Personagens" da barra superior (continua acessível em "Gerenciar personagens" no menu do avatar).
- Adicionar **Comunidade** no lugar, com ícone de globo/usuários.
- No mobile, mesma troca na barra inferior.

## 2. O que é compartilhado (e o que não é)

Compartilhamento é **automático** ao salvar uma sessão. Público:

- Nome da hunt, duração, XP ganha e Raw XP, loot, supplies, balance
- Lista de monstros mortos (kills)
- Charms / Imbuements / Item Upgrade da sessão (o bloco Misc)
- Nome e vocação do personagem + outfit
- Print do equipamento (quando existir)

Nunca público: e-mail, imbuements cadastrados (custos/Gold Token), lucro líquido pessoal, lista de personagens.

Cada sessão terá um botão **"Não compartilhar"** (privacidade opt-out), caso o usuário queira esconder uma sessão específica.

## 3. Print do equipamento

- Mesmo fluxo que já existe para outfit: **Ctrl+V** cola a imagem, o app comprime para WebP.
- Ponto de entrada 1: na tela **Nova sessão**, um campo opcional "Equipamento" antes de salvar.
- Ponto de entrada 2: na tela de **detalhe da sessão**, botão "Adicionar/trocar equipamento" — assim as sessões antigas também recebem a feature sem precisar refazer nada.
- Como as imagens agora serão lidas por outros usuários, os prints de equipamento vão para um bucket de arquivos público (não em base64 dentro da tabela), o que mantém o carregamento da lista da comunidade rápido.

## 4. Tela Comunidade

**Topo — filtros:**
- Vocação (Elite Knight, Royal Paladin, Master Sorcerer, Elder Druid, Monk…) — pré-selecionada com a vocação do personagem ativo
- Busca por nome da hunt
- Busca por monstro (com o mesmo autocomplete da calculadora de bounty)
- Ordenação: mais recentes, maior XP/h, maior lucro/h, mais kills/h

**Corpo — duas visões:**

1. **Por hunt (agrupado)** — visão padrão: cada card mostra a hunt, quantas sessões da comunidade existem, médias de XP/h, lucro/h e kills/h por vocação. Serve para "nunca fui nesse lugar, vale a pena?".
2. **Sessões** — lista individual: personagem (nome + outfit + vocação), hunt, duração, XP ganha, balance, kills. Clicar abre um detalhe público somente-leitura com o print do equipamento, charms/imbuements e a lista completa de monstros.

Estados vazios explícitos ("Nenhuma sessão compartilhada para Elite Knight ainda").

## 5. Detalhes técnicos

**Banco (migração):**
- `hunt_sessions`: novas colunas `is_public boolean default true`, `gear_url text`, e snapshots `char_name text` / `char_vocation text` (preenchidos ao salvar, evitam expor a tabela `characters` publicamente).
- Backfill dos snapshots para as sessões já existentes.
- Nova policy de leitura pública restrita: `SELECT` para `anon`/`authenticated` apenas onde `is_public = true`. As policies de escrita continuam presas a `auth.uid()`, e a policy atual de dono é mantida para o usuário ver as próprias sessões privadas.
- Bucket público `gear` para os prints, com escrita apenas pelo dono (caminho `{user_id}/{session_id}`).

**Leitura:**
- Rota pública de servidor (`createServerFn` com cliente publicável) para o feed da comunidade, com projeção explícita de colunas seguras, filtros por vocação/hunt e paginação — nunca `select *`.
- Agregações por hunt/vocação (médias ponderadas: total de kills ÷ total de horas, igual à calculadora) calculadas no servidor.
- A rota `/comunidade` fica dentro da área autenticada nesta primeira versão (mesma navegação do resto do app).

**Arquivos previstos:**
- `src/routes/_authenticated/community.tsx` (feed + filtros) e `src/routes/_authenticated/community.$id.tsx` (detalhe público)
- `src/lib/community.functions.ts` (server functions de leitura)
- `src/components/PasteImage.tsx` — extrai o Ctrl+V/compressão hoje duplicado em `characters.tsx` para reuso no equipamento
- Ajustes em `AppShell.tsx`, `import.tsx`, `sessions.$id.tsx` e `store.ts`

## Fora do escopo desta etapa

Comentários, curtidas, seguir usuários, ranking global e moderação de conteúdo — dá para adicionar depois sobre a mesma base.
