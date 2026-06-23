export type AllocationType = "credits" | "wallet" | "both";
export type OrderType = "csr" | "acme";
export type LedgerEntryType =
  | "credit_grant"
  | "credit_debit"
  | "wallet_grant"
  | "wallet_debit";

export interface Product {
  id: string;
  product_code: string;
  display_name: string;
  ca_vendor: string;
  validation_type: string;
  order_type: OrderType;
  supports_wildcard: boolean;
  base_price_usd: number;
  wildcard_price_usd: number | null;
  srp_usd: number | null;
  active: boolean;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
  allocation_type: AllocationType;
  credit_balance: number;
  wallet_balance_usd: number;
  status: "active" | "suspended";
  created_at: string;
}

export interface Customer {
  id: string;
  partner_id: string;
  name: string;
  email: string;
  credit_balance: number;
  wallet_balance_usd: number;
  status: "active" | "suspended";
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  partner_id: string;
  product_id: string;
  domain_name: string;
  is_wildcard: boolean;
  order_type: OrderType;
  status: string;
  csr: string | null;
  approver_email: string | null;
  sslstore_order_id: string | null;
  sslstore_subscription_id: string | null;
  acme_server_url: string | null;
  eab_kid: string | null;
  eab_hmac_key: string | null;
  sso_login_link: string | null;
  auto_install_token: string | null;
  raw_response: unknown;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

// The six SKUs this storefront sells. Mirrors the `products` table seed.
export const PRODUCT_CODES = [
  "rapidssl_automate",
  "rapidssl_wc_automate",
  "geotrust_automate",
  "geotrust_wc_automate",
  "sectigo_caas_dv",
  "positivessl_caas_dv",
] as const;

export type ProductCode = (typeof PRODUCT_CODES)[number];
