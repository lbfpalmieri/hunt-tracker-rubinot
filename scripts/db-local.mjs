// Banco de desenvolvimento LOCAL (Supabase no Docker) — nunca fala com a produção.
//   npm run db:start   sobe o Supabase local; na primeira vez cria as tabelas pelas migrations
//   npm run db:stop    para (os dados ficam guardados)
//   npm run db:reset   apaga TUDO do banco local e recria as tabelas
//   npm run db:status  mostra endereços (Studio = painel do banco em http://127.0.0.1:54323)
// Precisa do Docker Desktop aberto. Ver "Banco local" no AGENTS.md.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const WORKDIR = join(ROOT, "local-db");
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const PROJECT_ID = "hunt-tracker-local";
const DB_CONTAINER = `supabase_db_${PROJECT_ID}`;

const DOCKER =
  [
    "docker",
    "C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe",
  ].find((bin) => spawnSync(bin, ["--version"], { stdio: "ignore" }).status === 0) ?? null;

function fail(msg) {
  console.error(`\n[db] ${msg}\n`);
  process.exit(1);
}

/** Roda a CLI do Supabase (instalada no projeto) na pasta local-db. */
export function supabase(args, opts = {}) {
  return spawnSync(`npx supabase ${args} --workdir "${WORKDIR}"`, {
    shell: true,
    cwd: ROOT,
    stdio: "inherit",
    // A CLI lê o .env do repositório; sem isto o SUPABASE_PROJECT_ID de lá vira o nome dos containers.
    env: { ...process.env, SUPABASE_PROJECT_ID: PROJECT_ID },
    ...opts,
  });
}

function psql(sql, { quiet = false } = {}) {
  return spawnSync(DOCKER, ["exec", "-i", DB_CONTAINER, "psql", "-U", "postgres", "-X", "-q", "-At"], {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", quiet ? "ignore" : "pipe"],
  });
}

function ensureDocker() {
  if (!DOCKER) fail("Docker não encontrado. Instale/abra o Docker Desktop.");
  if (spawnSync(DOCKER, ["info"], { stdio: "ignore" }).status !== 0) {
    fail("O Docker não está rodando. Abra o Docker Desktop, espere ele iniciar e tente de novo.");
  }
}

/** Aplica supabase/migrations em ordem, seguindo em frente quando algo "já existe". */
function applyMigrations() {
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort();
  const problems = [];
  for (const file of files) {
    const res = psql(readFileSync(join(MIGRATIONS, file), "utf8"));
    if (res.status !== 0) fail(`Não consegui falar com o banco local (${DB_CONTAINER}): ${res.stderr ?? res.error}`);
    const errors = (res.stderr ?? "")
      .split("\n")
      .filter((l) => /ERROR:/.test(l))
      .map((l) => l.replace(/^.*ERROR:\s*/, "").trim());
    const real = errors.filter((e) => !/already exists|já existe/i.test(e));
    if (real.length) problems.push({ file, errors: real });
  }
  console.log(`[db] ${files.length} migrations aplicadas.`);
  if (problems.length) {
    console.log("[db] Avisos (erros que não são 'já existe'):");
    for (const p of problems) for (const e of p.errors) console.log(`   ${p.file.slice(0, 14)}…  ${e}`);
  }
  // O PostgREST guarda o esquema em cache — avisa que mudou.
  psql("NOTIFY pgrst, 'reload schema';", { quiet: true });
}

function hasSchema() {
  const res = psql("select to_regclass('public.hunt_sessions') is not null;", { quiet: true });
  return (res.stdout ?? "").trim() === "t";
}

function start() {
  ensureDocker();
  const res = supabase("start");
  if (res.status !== 0) fail("O Supabase local não subiu (veja a mensagem acima).");
  if (hasSchema()) console.log("[db] Tabelas já existem — mantendo os dados.");
  else {
    applyMigrations();
    if (!hasSchema()) fail("As migrations rodaram mas as tabelas não foram criadas.");
  }
  console.log("[db] Pronto. Agora: npm run dev:local");
}

const cmd = process.argv[2];
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (!existsSync(join(WORKDIR, "supabase", "config.toml"))) fail("local-db/supabase/config.toml não encontrado.");
  if (cmd === "start") start();
  else if (cmd === "stop") supabase("stop");
  else if (cmd === "status") supabase("status");
  else if (cmd === "reset") {
    ensureDocker();
    supabase("stop --no-backup");
    start();
  } else fail("Use: start | stop | reset | status");
}
