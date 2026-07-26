## Objetivo

Eliminar a divergência de busca na Comunidade deixando apenas as vocações promovidas no cadastro, e converter no banco todos os registros já criados com a vocação base.

## Estado atual no banco

- `characters`: 1 Knight, 1 Paladin, 1 Elite Knight, 1 Royal Paladin
- `hunt_sessions` (snapshot `char_vocation`): 1 Knight, 6 Elite Knight

## O que muda

**1. Lista de vocações (só promovidas)**

Nas telas de cadastro/edição de personagem e no filtro da Comunidade, a lista passa a ser:

```text
Elite Knight
Royal Paladin
Master Sorcerer
Elder Druid
Exalted Monk
```

Observação: você citou "Monk", mas a promoção do Monk é **Exalted Monk**. Para manter o padrão "só promovida" mantenho `Exalted Monk`. Se preferir `Monk`, é só falar e eu troco.

**2. Migração dos dados existentes**

Conversão bruta em `characters.vocation` e em `hunt_sessions.char_vocation`:

```text
Knight    -> Elite Knight
Paladin   -> Royal Paladin
Sorcerer  -> Master Sorcerer
Druid     -> Elder Druid
Monk      -> Exalted Monk
```

Isso é retroativo, então as sessões antigas dos seus amigos passam a aparecer nos filtros de Elite Knight / Royal Paladin normalmente.

**3. Trava para o futuro**

Restrição no banco (check constraint) nas duas colunas aceitando apenas as 5 vocações promovidas, para nunca voltar a entrar uma vocação base — nem por cadastro novo nem por snapshot de sessão.

## Detalhes técnicos

- Migração SQL: `UPDATE` de mapeamento nas duas tabelas, seguido de `ALTER TABLE ... ADD CONSTRAINT ... CHECK (vocation IN (...))` em `public.characters` e `public.hunt_sessions.char_vocation` (permitindo `NULL` no snapshot da sessão).
- Frontend: constante `VOCATIONS` reduzida em `src/routes/_authenticated/characters.tsx` e a lista de filtro em `src/routes/_authenticated/community.index.tsx`.
- Nenhuma mudança em lógica de cálculo, parser ou dashboard.
