// `npm run dev:local` — sobe o app (vite dev) apontando para o Supabase LOCAL (Docker), nunca
// para a produção. Lê URL e chaves do `supabase status`, garante o usuário de teste e o bucket, e
// passa tudo por variável de ambiente (que tem prioridade sobre o .env do repositório).
//
// Antes: `npm run db:start` (Docker Desktop aberto). Ver "Banco local" no AGENTS.md.
import { execSync, spawn } from "node:child_process";
import { WORKDIR } from "./db-local.mjs";

const TEST_EMAIL = "teste@localhost.dev";
const TEST_PASSWORD = "teste-local-123";
const BUCKET = "feedback-attachments";

function fail(msg) {
  console.error(`\n[dev:local] ${msg}\n`);
  process.exit(1);
}

let status;
try {
  const out = execSync(`npx supabase status -o json --workdir "${WORKDIR}"`, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, SUPABASE_PROJECT_ID: "hunt-tracker-local" },
  }).toString();
  status = JSON.parse(out.slice(out.indexOf("{")));
} catch {
  fail("O Supabase local não está rodando. Abra o Docker Desktop e rode: npm run db:start");
}

const url = status.API_URL;
const publicKey = status.ANON_KEY ?? status.PUBLISHABLE_KEY;
const serviceKey = status.SERVICE_ROLE_KEY ?? status.SECRET_KEY;
if (!url || !publicKey || !serviceKey) fail("Não consegui ler a URL/chaves do `supabase status`.");

// Trava de segurança: este script só fala com banco na própria máquina.
const host = new URL(url).hostname;
if (host !== "127.0.0.1" && host !== "localhost") fail(`URL inesperada (${url}) — abortando.`);

const admin = (path, init = {}) =>
  fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

// Usuário de teste (login por e-mail/senha — o Google não existe no banco local).
let userId = null;
const created = await admin("/auth/v1/admin/users", {
  method: "POST",
  body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true }),
});
if (created.ok) {
  userId = (await created.json()).id;
  console.log("[dev:local] Usuário de teste criado.");
} else {
  const list = await admin("/auth/v1/admin/users?per_page=200");
  const users = list.ok ? ((await list.json()).users ?? []) : [];
  userId = users.find((u) => u.email === TEST_EMAIL)?.id ?? null;
  if (!userId) fail(`Não consegui criar o usuário de teste: ${await created.text()}`);
}

// Admin no banco local, pra dar pra testar as telas de admin (ex.: sincronizar o catálogo de bosses).
await admin("/rest/v1/user_roles", {
  method: "POST",
  headers: { Prefer: "resolution=ignore-duplicates" },
  body: JSON.stringify({ user_id: userId, role: "admin" }),
});

// Bucket dos anexos de Sugestões e bugs (as policies vêm das migrations; o bucket não).
await admin("/storage/v1/bucket", {
  method: "POST",
  body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
});

console.log(`[dev:local] Banco local: ${url} — nada aqui chega na produção.`);
console.log('[dev:local] Na tela de login use o botão "Entrar como usuário de teste".\n');

const child = spawn("npx vite dev", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_PUBLISHABLE_KEY: publicKey,
    VITE_SUPABASE_PROJECT_ID: "local",
    SUPABASE_URL: url,
    SUPABASE_PUBLISHABLE_KEY: publicKey,
    SUPABASE_SERVICE_ROLE_KEY: serviceKey,
    VITE_DEV_LOGIN_EMAIL: TEST_EMAIL,
    VITE_DEV_LOGIN_PASSWORD: TEST_PASSWORD,
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
