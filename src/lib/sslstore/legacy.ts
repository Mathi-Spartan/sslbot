// Legacy TheSSLStore REST API — used for RapidSSL/GeoTrust Automate
// products. Auth is a JSON body with PartnerCode + AuthToken, not headers.
// Server-side only — never call from the client.
//
// IMPORTANT: "Automate" products use AutoInstall SSL — a cPanel/Plesk
// plugin that runs on the CUSTOMER's own hosting account. It generates the
// CSR, validates the domain, installs, and verifies the cert automatically
// on their server. We do not collect a CSR from the customer for these —
// we place the order, get back a Token + TheSSLStoreOrderID, and the
// customer redeems that Token inside their own cPanel's AutoInstall SSL
// panel to complete everything else. See:
// https://www.thesslstore.com/knowledgebase/autoinstall-ssl/use-autoinstall-ssl-cpanel/

const BASE_URL =
  process.env.SSLSTORE_LEGACY_BASE_URL ??
  "https://sandbox-wbapi.thesslstore.com/rest";

function authRequest() {
  return {
    PartnerCode: process.env.SSLSTORE_PARTNER_CODE,
    AuthToken: process.env.SSLSTORE_AUTH_TOKEN,
  };
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`TheSSLStore legacy API error ${res.status}: ${text}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`TheSSLStore legacy API returned non-JSON response: ${text}`);
  }
  const authResponse = (json as { AuthResponse?: { isError?: boolean; Message?: string[] } })
    .AuthResponse;
  if (authResponse?.isError) {
    throw new Error(
      `TheSSLStore legacy API error: ${authResponse.Message?.join("; ") ?? "Unknown error"}`,
    );
  }
  return json as T;
}

export interface NewOrderParams {
  productCode: string;
  domainName: string;
  customOrderId: string;
  validityMonths?: number;
  // CSR/ApproverEmail are only used for non-Automate DV products. For
  // Automate products, leave undefined — AutoInstall SSL generates these
  // on the customer's own server.
  csr?: string;
  approverEmail?: string;
}

export interface NewOrderResponse {
  // Capturing the full raw shape — AutoInstall-enabled products return a
  // Token field (per TheSSLStore/Blesta docs) that isn't yet confirmed in
  // our own sandbox testing. Treat as unknown until verified.
  [key: string]: unknown;
}

// Places an order. See: https://www.thesslstore.com/api/new-order
export async function placeNewOrder(params: NewOrderParams) {
  return post<NewOrderResponse>("/order/neworder", {
    AuthRequest: authRequest(),
    NewOrderRequest: {
      ProductCode: params.productCode,
      DomainName: params.domainName,
      CSR: params.csr ?? "",
      ApproverEmail: params.approverEmail ?? "",
      CustomOrderID: params.customOrderId,
      ServerCount: 1,
      ValidityPeriod: params.validityMonths ?? 12,
      isCUOrder: false,
      isRenewalOrder: false,
    },
  });
}

export async function getOrderStatus(theSslStoreOrderId: number) {
  return post<{ OrderStatus: string; isError: boolean }>("/order/status", {
    AuthRequest: authRequest(),
    QueryRequest: { TheSSLStoreOrderID: theSslStoreOrderId },
  });
}

export async function queryProducts() {
  return post<unknown[]>("/product/query", { AuthRequest: authRequest() });
}
