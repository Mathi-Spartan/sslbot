import Link from "next/link";

const roles = [
  {
    href: "/admin",
    title: "Master reseller",
    description: "Manage partners, allocations, and the order ledger.",
  },
  {
    href: "/partner",
    title: "Partner",
    description: "Manage your end customers and their allocations.",
  },
  {
    href: "/customer",
    title: "End customer",
    description: "Place and manage your SSL certificate orders.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-semibold text-slate-900">SSLSecurity</h1>
        <p className="mt-2 text-slate-600">
          Multi-tenant SSL certificate reseller platform, built on TheSSLStore API.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {roles.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="rounded-lg border border-slate-200 bg-white p-5 transition-colors hover:border-slate-400"
            >
              <h2 className="font-medium text-slate-900">{role.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{role.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
