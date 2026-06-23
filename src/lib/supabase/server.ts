import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Use this in server components / server actions. It reads the user's
// session from cookies, so queries respect RLS and only return data the
// logged-in user is allowed to see.
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component without write access to
            // cookies — safe to ignore, middleware refreshes the session.
          }
        },
      },
    },
  );
}
