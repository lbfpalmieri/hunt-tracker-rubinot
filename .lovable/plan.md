# Ajuste: título completo nos cards de comparação

## Problema
No seletor de hunts da ferramenta "Comparar hunts", os nomes das hunts estão truncados com `truncate`. Isso dificulta a escolha, já que o usuário identifica a sessão pelo nome completo da hunt.

## O que será alterado
1. **`src/components/compare/HuntPickerCard.tsx`**
   - Remover a classe `truncate` do título (`hunt.huntName`) para permitir quebra de linha.
   - Ajustar o container do título/badges para aceitar múltiplas linhas (`flex-wrap`, alinhamento `items-start`).
   - Manter os badges de Bounty e Prey ao lado do título, permitindo que desçam de linha quando necessário.

## Resultado esperado
- Todo nome de hunt aparecerá completo no card, mesmo que ocupe duas ou mais linhas.
- O card cresce verticalmente conforme o tamanho do título.
- A identificação visual da sessão será feita pelo nome completo, sem cortes.

## Escopo
- Apenas o componente de card de seleção (`HuntPickerCard`).
- Não altera a tabela comparativa, já que ela já exibe o link do nome completo sem truncamento.
- Não altera regras de negócio, dados ou backend.