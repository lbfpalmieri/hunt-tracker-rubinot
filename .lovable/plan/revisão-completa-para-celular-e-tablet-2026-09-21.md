# Revisão completa para celular e tablet

## Objetivo
Deixar todas as páginas confortáveis e funcionais em iPhone, smartphones Android e tablets, preservando exatamente os dados, cálculos, autenticação Google, privacidade e integrações atuais.

## Diagnóstico confirmado
- O menu móvel **Mais** compartilha o mesmo estado e o mesmo detector de clique externo do menu desktop. Como a referência existe apenas no menu desktop, um toque dentro da janela móvel pode fechá-la antes da navegação — isso explica as ferramentas que não abrem no iPhone.
- A janela móvel não possui limite de altura nem rolagem própria; em aparelhos baixos, os últimos itens podem ficar inacessíveis.
- Algumas barras de filtros e abas têm muitos controles na mesma linha e ficam apertadas em telas pequenas.
- Algumas janelas suspensas não têm margem lateral, limite de altura ou rolagem como proteção global.
- Tabelas largas possuem rolagem horizontal, mas os comparativos principais ainda exigem esforço excessivo para relacionar métricas e hunts no celular.
- Há botões secundários com área de toque menor que o ideal para smartphones.

## Implementação

### 1. Navegação e estrutura compartilhada
- Separar corretamente o comportamento do menu **Mais** no desktop e no celular, removendo a disputa entre os eventos de toque.
- Transformar o **Mais** móvel em uma janela inferior confiável, com fundo bloqueado, fechamento por toque externo/Escape, foco acessível, rolagem interna e respeito à área segura do iPhone.
- Garantir que todas as ferramentas, personagens, “Sobre” e “Sair” fiquem alcançáveis em qualquer altura de tela.
- Ajustar cabeçalho, seletor de personagem, sino e barra inferior para não comprimir, cortar ou sobrepor conteúdo.
- Aumentar áreas de toque dos controles principais e manter o espaço inferior correto acima da barra fixa.

### 2. Proteções responsivas globais
- Tornar todas as janelas suspensas seguras em telas pequenas: margem lateral, altura máxima, conteúdo rolável e botões finais sempre alcançáveis com o teclado aberto.
- Padronizar títulos longos, números grandes, listas e grupos de ações para quebra de linha sem sobreposição.
- Melhorar campos, seletores, filtros e abas para ocuparem a largura disponível no celular e se reorganizarem no tablet.
- Preservar as cores, identidade RubinOT e hierarquia visual atuais.

### 3. Revisão página por página
- **Início, login e Sobre:** cabeçalho, chamadas, estatísticas e textos sem cortes.
- **Dashboard:** saudação, lembrete de rendimento, ações, cards, gráficos e últimas sessões.
- **Nova sessão:** cards de colagem, alertas, preview, sugestões de hunt, equipamento, Bounty/Prey e ação de salvar.
- **Sessões e detalhes:** filtros, ordenação, cards, ações, gráficos, equipamento e blocos de dados.
- **Comparar sessões / Comparar hunts:** seleção, filtros, ações flutuantes, placar, diferenças e leitura dos resultados em formato mais apropriado no celular; tabela completa permanece disponível em telas maiores.
- **Comunidade e detalhe público:** filtros, vocações, abas, calculadora, cards, listas, janelas e tabelas.
- **Meu rendimento:** cinco abas, períodos, formulários de nível/objetivo/gasto/morte, gráficos e históricos.
- **Todos os personagens:** resumo, comparação e seleção de métricas; leitura móvel sem depender apenas de uma tabela larga.
- **Imbuements:** slots, renovação, seleção, formulários e ações de cada item.
- **Personagens:** cadastro, outfit, lista e ações sem botões espremidos.
- **Calculadora de monstros, ranking, comparações salvas e Rubini Coins:** filtros, abas, resultados, tabelas, gráficos e ações.

### 4. Validação
- Testar visualmente e por interação em pelo menos: iPhone pequeno (375×667), iPhone atual (393×852), tablet vertical (768×1024) e desktop (1280×1800).
- Verificar em cada tamanho: ausência de rolagem horizontal involuntária, textos sem sobreposição, botões alcançáveis, janelas roláveis, teclado/formulários e barra inferior sem cobrir conteúdo.
- Percorrer os caminhos principais: abrir **Mais**, entrar em cada ferramenta, trocar personagem, filtrar listas, abrir/fechar janelas, selecionar comparações e acessar detalhes.
- Rodar a verificação automática do projeto ao final.

## Limites de segurança
- Nenhuma migration, tabela, política, permissão, função do banco ou estrutura de dados será alterada.
- Login Google, armazenamento na nuvem, sessões privadas/públicas, imagens, comparações salvas e Rubini Coins continuarão usando os mesmos fluxos atuais.
- Nenhuma fórmula de XP, lucro, imbuement, Bounty, Prey, ranking ou comparação será modificada.
- A consulta comunitária continuará sem expor identificadores privados.

## Dependência para o teste final
O preview está sem uma sessão autenticada disponível para os testes automatizados. Depois das correções, será necessário entrar com Google no preview para eu validar visualmente todas as páginas internas e os toques reais; as páginas públicas podem ser verificadas sem isso.
