// TheSSLStore Subscription Service (v1) — used for the 2 ACME CaaS products
// (Sectigo CaaS, PositiveSSL CaaS). Auth confirmed from the live swagger at
// https://api.thesslstore.com/swagger/index.html#/Subscription%20Service —
// it accepts a single X-TOKEN header as an alternative to X-DEV-APIKEY +
// X-PARTNER-CODE. We use X-TOKEN with the existing AuthToken — no separate
// dev key needed. Server-side only — never call from the client.

const BASE_URL = process.env.SSLSTORE_V1_BASE_URL ?? "https://api.thesslstore.com";

function authHeaders(): HeadersInit {
  return {
    "X-TOKEN": process.env.SSLSTORE_AUTH_TOKEN ?? "",
    "Content-Type": "application/json",
  };
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: authHeaders(),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`TheSSLStore v1 API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title?: string;
  fax?: string;
}

export interface CreateSubscriptionParams {
  productCode: string;
  domainName: string;
  isWildcard: boolean;
  customOrderId: string;
  validityMonths: number;
  adminContact: Contact;
  technicalContact: Contact;
}

export interface CreateSubscriptionResponse {
  // Exact response shape not yet confirmed from swagger — capturing the
  // raw response and adjusting field access once we see a real result.
  [key: string]: unknown;
}

export async function createSubscription(params: CreateSubscriptionParams) {
  const contactPayload = (c: Contact) => ({
    FirstName: c.firstName,
    LastName: c.lastName,
    Phone: c.phone,
    Fax: c.fax ?? "",
    Email: c.email,
    Title: c.title ?? "",
  });

  return request<CreateSubscriptionResponse>("/v1/subscriptions", {
    method: "POST",
    body: {
      DomainName: params.domainName,
      StandardDomainNames: params.isWildcard ? "" : params.domainName,
      StandardReservedCount: params.isWildcard ? 0 : 1,
      WildcardDomainNames: params.isWildcard ? params.domainName : "",
      WildcardReservedCount: params.isWildcard ? 1 : 0,
      ProductCode: params.productCode,
      CustomOrderID: params.customOrderId,
      ValidityPeriod: params.validityMonths,
      AdminContact: contactPayload(params.adminContact),
      TechnicalContact: contactPayload(params.technicalContact),
      IsSendNotificationToContact: true,
      InstallMethod: "",
    },
  });
}

// NOTE: paths below are not yet confirmed against the live swagger — same
// source as Create Subscription should be checked for:
// GET  /v1/subscriptions/{subscriptionId}/status
// GET  /v1/subscriptions/acme/{subscriptionId}/eab
// POST /v1/subscriptions/{subscriptionId}/sso-link
// Update these once confirmed.

export async function getSubscriptionStatus(subscriptionId: string) {
  return request<{ status: string }>(`/v1/subscriptions/${subscriptionId}/status`);
}

export async function getEabCredential(subscriptionId: string) {
  return request<{ eabKid: string; eabHmacKey: string; acmeServerUrl: string }>(
    `/v1/subscriptions/acme/${subscriptionId}/eab`,
  );
}

export async function getSsoLoginLink(subscriptionId: string) {
  return request<{ ssoUrl: string }>(`/v1/subscriptions/${subscriptionId}/sso-link`, {
    method: "POST",
  });
}
