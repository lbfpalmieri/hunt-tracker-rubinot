# Como contribuir

Valeu por ajudar no RubinOT Hunt Tracker! A regra é simples: **ninguém mexe direto na `main`**.
Todo trabalho vai numa branch e entra por Pull Request (PR), que o Lucas revisa e aprova.

## Por que

A `main` está ligada à Lovable: tudo que entra nela vai pro editor da Lovable e pro site. Por isso ela
é protegida no GitHub — push direto e force push são bloqueados; só entra por PR aprovado.

## Rodando local

```bash
git clone https://github.com/lbfpalmieri/hunt-tracker-rubinot.git
cd hunt-tracker-rubinot
bun install        # ou: npm install
bun run dev        # abre em http://localhost:8080
```

O `.env` do repositório já aponta pro banco (só chaves públicas; o acesso é protegido por RLS).
Você entra com a sua própria conta Google e vê só os seus dados.

## Fluxo de trabalho

1. Atualize a main: `git checkout main && git pull`
2. Crie uma branch: `git checkout -b feat/nome-curto` (ou `fix/...`)
3. Faça commits pequenos e com mensagem clara, em português.
4. Antes de subir, rode: `bunx tsc --noEmit` e `bun run build` (os dois têm que passar).
5. `git push -u origin feat/nome-curto` e abra o PR no GitHub apontando pra `main`.
6. Se a `main` andou enquanto você trabalhava: `git pull origin main` na sua branch (merge, não rebase
   de coisa já enviada) e resolva conflitos.

## Regras do projeto

Leia o [AGENTS.md](AGENTS.md) antes — tem o contexto e as regras permanentes. As principais:

- **Nunca** force push nem reescrever histórico já publicado.
- **Banco de dados:** não mude estrutura de tabela direto. Se precisar, escreva o SQL no PR
  (tabela nova em `public` exige GRANT + RLS + policies) — o Lucas aplica.
- Toda feature/correção visível ganha uma entrada no topo de `WHATS_NEW` em `src/lib/whats-new.ts`.
- Nunca exibir e-mail de usuário; identificar pelo nome do personagem.
- Textos da interface em português do Brasil.
- Menu: página nova entra só em `src/lib/nav-items.ts`.
