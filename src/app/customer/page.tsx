import { supabaseServer } from "@/lib/supabase/server";
import type { Product, Order } from "@/lib/types";
import { NewOrderForm } from "./NewOrderForm";
import { signOut } from "@/app/actions";

export const dynamic = "force-dynamic";

async function getCustomerData() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (customerError || !customer) throw new Error("Customer profile not found.");

  const [{ data: products }, { data: orders }] = await Promise.all([
    supabase.from("products").select("*").eq("active", true).order("base_price_usd"),
    supabase.from("orders").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }),
  ]);

  return {
    customer,
    products: (products ?? []) as Product[],
    orders: (orders ?? []) as Order[],
  };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    submitted: "bg-blue-50 text-blue-700",
    eab_issued: "bg-emerald-50 text-emerald-700",
    active: "bg-emerald-50 text-emerald-700",
    failed: "bg-red-50 text-red-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-600";
}

export default async function CustomerPage() {
  const { customer, products, orders } = await getCustomerData();

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{customer.name}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {customer.credit_balance} credits &middot; ${Number(customer.wallet_balance_usd).toFixed(2)} wallet
            </p>
          </div>
          <form action={signOut}>
            <button className="text-sm text-slate-500 underline">Sign out</button>
          </form>
        </div>

        <div className="mt-6 mb-6">
          <NewOrderForm products={products} />
        </div>

        <p className="mb-2 text-sm font-medium text-slate-700">My orders</p>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2">Domain</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    No orders yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {o.is_wildcard ? "*." : ""}{o.domain_name}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {o.order_type === "acme" && o.eab_kid ? (
                      <div className="space-y-1 font-mono">
                        <p>Server: {o.acme_server_url}</p>
                        <p>EAB KID: {o.eab_kid}</p>
                        <p>EAB HMAC: {o.eab_hmac_key}</p>
                      </div>
                    ) : o.sslstore_order_id ? (
                      <p>TheSSLStore order #{o.sslstore_order_id}</p>
                    ) : (
                      <p>Awaiting submission</p>
                    )}
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
