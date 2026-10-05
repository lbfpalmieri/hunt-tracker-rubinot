#!/usr/bin/env bash
# Restaura o backup do Lovable Cloud (backup.dump) no Supabase novo.
# Uso: restaurar.sh "<connection string>"
# Requer as listas geradas por migrar_banco.py no diretório atual.
set -uo pipefail
DB="$1"
PSQL=(psql "$DB" -X -q -v ON_ERROR_STOP=0)

resumo_erros() {
  # Mostra só as linhas ERROR (sem DETAIL, que pode conter valores dos dados)
  grep -E "ERROR" "$1" | sed 's/^psql:[^:]*:[0-9]*: //' | sort | uniq -c | sort -rn | head -40 || true
}

echo "== 1/4 Usuários (auth.users, auth.identities) e buckets do storage =="
pg_restore --no-owner --no-privileges -L lista_auth_tabelas.txt -f auth_tab.sql backup.dump
pg_restore --no-owner --no-privileges --data-only -L lista_auth_dados.txt -f auth_dados.sql backup.dump
sed -i -E 's/^CREATE TABLE (auth|storage)\./CREATE TABLE mig./; s/^ALTER TABLE ONLY (auth|storage)\./ALTER TABLE ONLY mig./' auth_tab.sql
sed -i -E 's/^COPY (auth|storage)\./COPY mig./' auth_dados.sql
{
  echo "DROP SCHEMA IF EXISTS mig CASCADE; CREATE SCHEMA mig;"
  cat auth_tab.sql
  cat auth_dados.sql
} > auth_carga.sql
"${PSQL[@]}" -f auth_carga.sql > auth_carga.log 2>&1
resumo_erros auth_carga.log

"${PSQL[@]}" > auth_copia.log 2>&1 <<'SQL'
DO $$
DECLARE
  par text[];
  pares text[][] := ARRAY[
    ARRAY['users', 'auth', 'users'],
    ARRAY['identities', 'auth', 'identities'],
    ARRAY['buckets', 'storage', 'buckets']
  ];
  cols text;
  n bigint;
BEGIN
  FOREACH par SLICE 1 IN ARRAY pares LOOP
    IF to_regclass('mig.' || par[1]) IS NULL THEN
      RAISE NOTICE 'mig.% não existe, pulando', par[1];
      CONTINUE;
    END IF;
    SELECT string_agg(quote_ident(d.column_name), ', ' ORDER BY d.ordinal_position)
      INTO cols
      FROM information_schema.columns d
      JOIN information_schema.columns s
        ON s.table_schema = 'mig' AND s.table_name = par[1] AND s.column_name = d.column_name
     WHERE d.table_schema = par[2] AND d.table_name = par[3]
       AND d.is_generated = 'NEVER';
    EXECUTE format('INSERT INTO %I.%I (%s) SELECT %s FROM mig.%I ON CONFLICT DO NOTHING',
                   par[2], par[3], cols, cols, par[1]);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE NOTICE '%.%: % linhas copiadas', par[2], par[3], n;
  END LOOP;
END $$;
DROP SCHEMA mig CASCADE;
SQL
grep -E "NOTICE|ERROR" auth_copia.log | grep -v "drop cascades" || true

echo "== 2/4 Estrutura e dados do app (public, private, RLS, grants) =="
pg_restore --no-owner -L lista_principal.txt -f principal.sql backup.dump
{
  echo "SET session_replication_role = replica;"
  cat principal.sql
  echo "SET session_replication_role = DEFAULT;"
} > principal_carga.sql
"${PSQL[@]}" -f principal_carga.sql > principal.log 2>&1
resumo_erros principal.log

echo "== 3/4 Ajustes finais =="
"${PSQL[@]}" <<'SQL'
-- garante que as funções do esquema private continuem acessíveis como antes
GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;
NOTIFY pgrst, 'reload schema';
SQL

echo "== 4/4 Conferência (linhas por tabela) =="
"${PSQL[@]}" -A -F ' | ' <<'SQL'
SELECT 'auth.users' AS tabela, count(*) FROM auth.users
UNION ALL SELECT 'auth.identities', count(*) FROM auth.identities
UNION ALL SELECT 'storage.buckets', count(*) FROM storage.buckets;
SQL
"${PSQL[@]}" -A -t <<'SQL' > contagem.sql
SELECT format('SELECT %L AS tabela, count(*) FROM %I.%I;', schemaname || '.' || tablename, schemaname, tablename)
  FROM pg_tables WHERE schemaname IN ('public', 'private') ORDER BY 1;
SQL
"${PSQL[@]}" -A -t -F ' | ' -f contagem.sql
