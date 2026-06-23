"use client";

import { useState } from "react";
import { createCustomer } from "./actions";

export function CreateCustomerForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createCustomer(formData);
      setCreated(result);
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
        Create customer
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      {created ? (
        <div>
          <p className="text-sm font-medium text-slate-900">Customer created.</p>
          <p className="mt-2 text-sm text-slate-600">
            Share these login details with the customer — they should change the password
            after first sign-in.
          </p>
          <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
            <p>Email: <span className="font-mono">{created.email}</span></p>
            <p>Temporary password: <span className="font-mono">{created.tempPassword}</span></p>
          </div>
          <button
            onClick={() => { setCreated(null); setOpen(false); }}
            className="mt-4 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Name</label>
              <input name="name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Email</label>
              <input name="email" type="email" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Credits to allocate</label>
              <input name="credit_balance" type="number" defaultValue={0} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700">Wallet to allocate ($)</label>
              <input name="wallet_balance" type="number" step="0.01" defaultValue={0} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
