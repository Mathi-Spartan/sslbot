import { createClient } from "@supabase/supabase-js";

// Server-only client using the service role key. Bypasses RLS entirely —
// only use for admin operations (creating auth users, system-level writes)
// that intentionally need to act outside a user's own permissions.
// Never import this in client components.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
