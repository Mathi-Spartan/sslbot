import { supabaseAdmin } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .eq("active", true)
    .order("base_price_usd", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function CustomerPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-slate-900">Order a certificate</h1>
        <p className="mt-1 text-sm text-slate-500">
          {products.length} products available
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-medium text-slate-900">{p.display_name}</h2>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {p.order_type === "acme" ? "ACME / no CSR" : "CSR required"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.ca_vendor} &middot; {p.validation_type}</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                ${Number(p.base_price_usd).toFixed(2)}
                <span className="text-sm font-normal text-slate-400"> / yr</span>
              </p>
              {p.wildcard_price_usd && (
                <p className="text-xs text-slate-400">
                  Wildcard: ${Number(p.wildcard_price_usd).toFixed(2)} / yr
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
