import { supabaseAdmin } from "@/lib/supabase";
import type { Partner } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPartners(): Promise<Partner[]> {
  const { data, error } = await supabaseAdmin()
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export default async function AdminPage() {
  const partners = await getPartners();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-slate-900">Partner accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          {partners.length} partner{partners.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Partner</th>
                <th className="px-4 py-2">Allocation type</th>
                <th className="px-4 py-2">Credits</th>
                <th className="px-4 py-2">Wallet</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No partners yet.
                  </td>
                </tr>
              )}
              {partners.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{p.allocation_type}</td>
                  <td className="px-4 py-2 text-slate-600">{p.credit_balance}</td>
                  <td className="px-4 py-2 text-slate-600">
                    ${Number(p.wallet_balance_usd).toFixed(2)}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        p.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.status}
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
