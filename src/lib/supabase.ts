import { createClient } from "@supabase/supabase-js";

// Both clients are created lazily, inside functions, rather than at module
// load time. Next.js collects page data for every route at build time even
// for routes using `dynamic = "force-dynamic"`, so a top-level
// `createClient()` call would throw during build if env vars aren't set yet
// (e.g. before they've been added in the Vercel dashboard).

export function supabaseBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Server-only client using the service role key. Never import this in
// client components — it bypasses RLS entirely.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
