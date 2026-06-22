// TheSSLStore Subscription Service (v1) — used for the 2 ACME CaaS products
// (Sectigo CaaS, PositiveSSL CaaS). Auth is via headers, not a JSON body.
// Server-side only — never call from the client.
//
// NOTE: the sandbox base URL for this v1 API has not been confirmed yet.
// The legacy API has a clear sandbox-wbapi.thesslstore.com split, but the
// swagger doc we have only shows api.thesslstore.com (production). Ask
// TheSSLStore support or check the partner portal for a v1 sandbox host
// before going live with this client — SSLSTORE_V1_BASE_URL below is a
// placeholder until that's confirmed.

const BASE_URL = process.env.SSLSTORE_V1_BASE_URL ?? "https://api.thesslstore.com";

function authHeaders(): HeadersInit {
  return {
    "X-DEV-APIKEY": process.env.SSLSTORE_DEV_API_KEY ?? "",
    "X-PARTNER-CODE": process.env.SSLSTORE_PARTNER_CODE ?? "",
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

export interface CreateSubscriptionParams {
  productCode: string;
  domainName: string;
  isWildcard: boolean;
  customerEmail: string;
}

export async function createSubscription(params: CreateSubscriptionParams) {
  return request<{ subscriptionId: string; status: string }>("/v1/subscriptions", {
    method: "POST",
    body: {
      ProductCode: params.productCode,
      DomainName: params.domainName,
      IsWildcard: params.isWildcard,
      CustomerEmail: params.customerEmail,
    },
  });
}

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
