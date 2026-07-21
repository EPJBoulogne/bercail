// Crée des comptes de test directement confirmés, sans envoyer aucun
// email — utile pour tester sans dépendre des limites d'envoi de Supabase.
//
// Usage : node scripts/seed-test-users.mjs
// (à lancer depuis la racine du projet, .env.local doit être rempli)

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Charge .env.local à la main (pas de dépendance dotenv nécessaire).
function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim();
  }
}
loadEnvLocal();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TEST_PASSWORD = "TestBercail1234!";

const testUsers = [
  { email: "test.membre@bercail.local", name: "Test Membre", role: "member" },
  { email: "test.responsable@bercail.local", name: "Test Responsable", role: "dept_manager" },
  { email: "test.pending@bercail.local", name: "Test En Attente", role: "member", pending: true },
];

for (const u of testUsers) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: u.name,
      created_by_admin: !u.pending,
    },
  });

  if (error) {
    console.error(`❌ ${u.email} : ${error.message}`);
    continue;
  }

  if (!u.pending && u.role !== "member") {
    await admin.from("profiles").update({ system_role: u.role }).eq("id", data.user.id);
  }

  console.log(`✅ ${u.email} / ${TEST_PASSWORD}${u.pending ? " (en attente)" : ""}`);
}

console.log("\nTerminé. Ces comptes sont utilisables tout de suite, sans email.");