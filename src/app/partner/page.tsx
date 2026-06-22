import { supabaseAdmin } from "@/lib/supabase";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

// NOTE: this lists all customers across all partners. Once partner auth
// is wired up, scope this query to the logged-in partner's id.
async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabaseAdmin()
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function PartnerPage() {
  const customers = await getCustomers();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-slate-900">My end customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          {customers.length} customer{customers.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Credits</th>
                <th className="px-4 py-2">Wallet</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No customers yet.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-2 text-slate-600">{c.credit_balance}</td>
                  <td className="px-4 py-2 text-slate-600">
                    ${Number(c.wallet_balance_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        c.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
