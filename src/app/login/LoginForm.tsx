"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const [{ data: admin }, { data: partner }, { data: customer }] = await Promise.all([
      supabase.from("admins").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("partners").select("id").eq("user_id", userId).maybeSingle(),
      supabase.from("customers").select("id").eq("user_id", userId).maybeSingle(),
    ]);

    const next = searchParams.get("next");
    if (admin) {
      router.push(next?.startsWith("/admin") ? next : "/admin");
    } else if (partner) {
      router.push(next?.startsWith("/partner") ? next : "/partner");
    } else if (customer) {
      router.push(next?.startsWith("/customer") ? next : "/customer");
    } else {
      setError("Your account isn't linked to a role yet. Contact your administrator.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">SSLSecurity</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
