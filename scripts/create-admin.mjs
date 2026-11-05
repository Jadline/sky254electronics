// Makes someone an admin:  npm run create-admin -- you@example.com
// New accounts get a random password, shown once in this terminal only.
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: npm run create-admin -- you@example.com");
  process.exit(1);
}

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) throw new Error(listError.message);
let user = list.users.find((u) => u.email?.toLowerCase() === email);
let password = null;

if (!user) {
  password = randomBytes(15).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(error.message);
  user = data.user;
}

const { error } = await supabase.from("admins").upsert({ user_id: user.id });
if (error) throw new Error(error.message);

console.log(`\n${email} is now an admin.`);
if (password) {
  console.log(`Temporary password: ${password}`);
  console.log("Save it now. It won't be shown again.\n");
} else {
  console.log("This account already existed, so its password is unchanged.\n");
}
