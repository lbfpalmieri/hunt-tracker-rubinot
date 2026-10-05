#!/usr/bin/env python3
"""Separa o índice (TOC) de um pg_dump do Lovable Cloud em listas para o pg_restore.

Uso: migrar_banco.py lista.txt
Gera:
  lista_principal.txt  -> esquemas public e private completos (estrutura, dados, RLS,
                          grants), políticas do storage e gatilhos em auth.users
  lista_auth_tabelas.txt -> definição das tabelas auth.users, auth.identities e
                          storage.buckets (restauradas num esquema temporário)
  lista_auth_dados.txt -> dados dessas mesmas tabelas
"""
import re
import sys

TIPOS = sorted(
    [
        "TABLE DATA", "SEQUENCE SET", "SEQUENCE OWNED BY", "FK CONSTRAINT", "DEFAULT ACL",
        "ROW SECURITY", "MATERIALIZED VIEW DATA", "MATERIALIZED VIEW", "PUBLICATION TABLE",
        "EVENT TRIGGER", "TABLE ATTACH", "INDEX ATTACH", "SHELL TYPE", "LARGE OBJECT",
        "TABLE", "SEQUENCE", "VIEW", "INDEX", "CONSTRAINT", "TRIGGER", "FUNCTION",
        "PROCEDURE", "AGGREGATE", "TYPE", "DOMAIN", "SCHEMA", "EXTENSION", "COMMENT",
        "ACL", "POLICY", "DEFAULT", "RULE", "PUBLICATION", "COLLATION", "CAST",
        "OPERATOR", "SERVER", "FOREIGN TABLE", "TEXT SEARCH CONFIGURATION",
        "TEXT SEARCH DICTIONARY", "STATISTICS",
    ],
    key=len,
    reverse=True,
)

ESQUEMAS_APP = {"public", "private"}
TABELAS_AUTH = {("auth", "users"), ("auth", "identities"), ("storage", "buckets")}


def analisar(linha):
    m = re.match(r"^\s*\d+;\s*\d+\s+\d+\s+(.*)$", linha)
    if not m:
        return None
    resto = m.group(1)
    for tipo in TIPOS:
        if resto.startswith(tipo + " "):
            partes = resto[len(tipo) + 1 :].split(" ")
            return tipo, partes[0], " ".join(partes[1:-1])
    return None


def main():
    linhas = open(sys.argv[1], encoding="utf-8").read().splitlines()
    principal, auth_tab, auth_dados = [], [], []
    for linha in linhas:
        if linha.startswith(";") or not linha.strip():
            continue
        info = analisar(linha)
        if not info:
            continue
        tipo, esquema, nome = info

        if tipo in ("EXTENSION", "DEFAULT ACL"):
            continue
        if tipo == "COMMENT" and nome.startswith("EXTENSION"):
            continue

        if esquema == "-":
            # objetos sem esquema: só criar o esquema private e seus grants
            if (tipo == "SCHEMA" and nome.startswith("private")) or (
                tipo in ("ACL", "COMMENT") and nome == "SCHEMA private"
            ):
                principal.append(linha)
            continue

        if esquema in ESQUEMAS_APP:
            principal.append(linha)
        elif esquema == "storage" and tipo == "POLICY":
            principal.append(linha)
        elif esquema == "auth" and tipo == "TRIGGER":
            principal.append(linha)

        tabela = nome.split(" ")[0]
        if (esquema, tabela) in TABELAS_AUTH:
            if tipo == "TABLE":
                auth_tab.append(linha)
            elif tipo == "TABLE DATA":
                auth_dados.append(linha)

    for arquivo, itens in (
        ("lista_principal.txt", principal),
        ("lista_auth_tabelas.txt", auth_tab),
        ("lista_auth_dados.txt", auth_dados),
    ):
        open(arquivo, "w", encoding="utf-8").write("\n".join(itens) + "\n")
        print(f"{arquivo}: {len(itens)} itens")


if __name__ == "__main__":
    main()
