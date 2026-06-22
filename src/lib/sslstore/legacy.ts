// Legacy TheSSLStore REST API — used for the 4 CSR-based products
// (RapidSSL Automate, RapidSSL Wildcard Automate, GeoTrust Automate,
// GeoTrust Wildcard Automate). Auth is a JSON body with PartnerCode +
// AuthToken, not headers. Server-side only — never call from the client.

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
  if (!res.ok) {
    throw new Error(`TheSSLStore legacy API error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export interface NewOrderParams {
  productCode: string;
  csr: string;
  domainName: string;
  approverEmail: string;
  customOrderId: string;
  validityMonths?: number;
}

// Places a CSR-based order (RapidSSL/GeoTrust Automate).
// See: https://www.thesslstore.com/api/new-order
export async function placeNewOrder(params: NewOrderParams) {
  return post<{ TheSSLStoreOrderID: number; OrderStatus: string }>(
    "/order/neworder",
    {
      AuthRequest: authRequest(),
      NewOrderRequest: {
        ProductCode: params.productCode,
        CSR: params.csr,
        DomainName: params.domainName,
        ApproverEmail: params.approverEmail,
        CustomOrderID: params.customOrderId,
        ServerCount: 1,
        ValidityPeriod: params.validityMonths ?? 12,
        isCUOrder: false,
        isRenewalOrder: false,
      },
    },
  );
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
