## Problema

A sessão de Ingol -1 mostra ~13M de Raw XP, mas ~8M vieram do bônus de conclusão de uma Bounty Task. O log do Hunting Analyser não separa isso: a XP do bounty entra no mesmo total. Resultado: essa sessão distorce a comparação com hunts normais e as médias do Dashboard/Comunidade.

## Ideia

Na hora de salvar a sessão, perguntar se ela teve bônus de Bounty Task. Se sim, o usuário informa a dificuldade e o tipo da task, e (opcional) o valor de XP do bônus. A sessão passa a guardar essas duas leituras:

- **Raw XP total** — o que veio do log (inclui bounty)
- **Raw XP de hunt** — total menos o bônus informado (é essa que entra em médias e rankings)

E a sessão ganha um selo dourado "Bounty" para quem olhar saber que aquele número não é comparável direto.

## Fluxo em "Nova sessão"

Abaixo do preview do import, antes do botão Salvar:

```text
[ ] Esta sessão incluiu bônus de Bounty Task

  (marcado, abre:)
  Dificuldade:  Beginner | Adept | Expert | Master
  Tipo:         Normal (sem escudo) | Silver (1 estrela) | Gold (2 estrelas)
  XP de bônus:  [ 8.000.000 ]  (opcional — aceita 8kk / 8m / 8000000)
```

Regras:
- Nada marcado = comportamento atual, sem mudanças.
- Dificuldade e tipo são obrigatórios quando marcado (são o que muda o tamanho da recompensa).
- Se o usuário não souber o valor exato do bônus, deixa vazio: a sessão fica marcada como "Bounty" mas mantém a Raw XP cheia e é **excluída das médias de Raw XP/h**, em vez de contaminar o cálculo.

## Onde aparece

**Detalhe da sessão**
- Card de Raw XP passa a ter borda/valor em dourado quando houver bounty, com o selo "Bônus de Bounty".
- Hint: `Raw XP de hunt: 5.0M · Bônus Bounty (Master · Gold): 8.0M · XP com bônus: X`.
- Bloco pequeno com dificuldade e tipo da task.

**Lista de sessões**
- Selo dourado "Bounty" na linha; a mini-stat de Raw XP/h usa a Raw XP de hunt.

**Dashboard**
- Total de Raw XP e gráfico de evolução usam a Raw XP de hunt (sem bounty), então a linha para de dar picos falsos.
- Info hint explica que bônus de Bounty Task são descontados quando informados.

**Comunidade**
- Média ponderada de Raw XP/h usa Raw XP de hunt, e sessões com bounty sem valor informado não entram na média.
- Card/detalhe mostram o selo dourado com dificuldade e tipo.

## Detalhes técnicos

- Migração em `hunt_sessions`: colunas `bounty_difficulty` (text, null), `bounty_tier` (text, null) e `bounty_xp` (bigint, null). Sem backfill — sessões antigas ficam nulas (sem bounty).
- Enums validados no app (`beginner|adept|expert|master`, `normal|silver|gold`) via Zod, sem tipo Postgres novo, para facilitar ajustes futuros.
- `src/lib/store.ts`: `HuntSession` ganha o objeto `bounty?: { difficulty, tier, xp } | null`; `addSession` e `updateSession` passam a persistir. Helper `huntRawXp(session)` = `rawXp - (bounty?.xp ?? 0)` usado por todas as telas.
- `src/lib/community.functions.ts`: incluir as três colunas em `LIST_COLUMNS`/`DETAIL_COLUMNS` e devolver `bounty` no payload público (não é dado sensível).
- Nenhuma mudança no parser: o valor de bônus é entrada manual, já que o log não expõe a origem da XP.
- A migração de banco entra primeiro (precisa da sua aprovação); o código vem depois dela.

## Fora de escopo por enquanto

Tabela de referência de XP por dificuldade/tipo para autopreencher o bônus. Os valores variam por criatura e servidor no RubinOT, então dá para adicionar depois — quando houver várias sessões marcadas, o próprio app pode sugerir uma média por dificuldade/tipo.
