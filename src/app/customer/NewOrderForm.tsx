"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { placeOrder } from "./actions";

export function NewOrderForm({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      await placeOrder(formData);
      setSuccess(true);
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
      >
        New order
      </button>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-900">Order placed.</p>
        <p className="mt-1 text-sm text-slate-500">
          Check the table below for status — CaaS orders show EAB credentials once issued.
        </p>
        <button
          onClick={() => { setSuccess(false); setOpen(false); }}
          className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700">Product</label>
          <select
            name="product_id"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700">Domain name</label>
          <input
            name="domain_name"
            required
            placeholder="example.com"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {selectedProduct?.supports_wildcard && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="is_wildcard" />
            Wildcard (*.{`{domain}`})
          </label>
        )}

        {selectedProduct?.order_type === "csr" ? (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                CSR (Certificate Signing Request)
              </label>
              <textarea
                name="csr"
                required
                rows={5}
                placeholder="-----BEGIN CERTIFICATE REQUEST-----"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Approver email</label>
              <input
                name="approver_email"
                type="email"
                required
                placeholder="admin@example.com"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-700">
                Contact phone number
              </label>
              <input
                name="contact_phone"
                required
                placeholder="+1 555 0100"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
            </div>
            <p className="rounded-md bg-slate-50 p-3 text-xs text-slate-500">
              No CSR needed — this is an ACME-based certificate. Once placed, you&apos;ll receive
              EAB credentials to register your ACME client (certbot, acme.sh) directly with the
              CA, and certificates will issue and renew automatically.
            </p>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
            {loading ? "Placing order..." : "Place order"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
