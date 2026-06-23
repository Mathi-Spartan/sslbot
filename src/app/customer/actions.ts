"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { placeNewOrder } from "@/lib/sslstore/legacy";
import { createSubscription } from "@/lib/sslstore/subscription";

async function getCallingCustomer() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: customer } = await supabase
    .from("customers")
    .select("id, partner_id, name, email, credit_balance, wallet_balance_usd")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customer) throw new Error("Not authorized — customer accounts only.");
  return customer;
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? fullName;
  return {
    firstName: first,
    lastName: parts.slice(1).join(" ") || first,
  };
}

export async function placeOrder(formData: FormData) {
  const customer = await getCallingCustomer();
  const admin = supabaseAdmin();

  const productId = String(formData.get("product_id") ?? "");
  const domainName = String(formData.get("domain_name") ?? "").trim();
  const isWildcard = formData.get("is_wildcard") === "on";
  const csr = String(formData.get("csr") ?? "").trim();
  const approverEmail = String(formData.get("approver_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();

  if (!productId || !domainName) throw new Error("Product and domain are required.");

  const { data: product, error: productError } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  if (productError || !product) throw new Error("Product not found.");

  if (product.order_type === "csr" && (!csr || !approverEmail)) {
    throw new Error("CSR and approver email are required for this product.");
  }
  if (product.order_type === "acme" && !contactPhone) {
    throw new Error("A contact phone number is required for this product.");
  }

  // Deduct from the customer's own balance: prefer credits, fall back to wallet.
  if (customer.credit_balance > 0) {
    await admin
      .from("customers")
      .update({ credit_balance: customer.credit_balance - 1 })
      .eq("id", customer.id);
    await admin.from("customer_ledger").insert({
      customer_id: customer.id,
      entry_type: "credit_debit",
      amount: 1,
      note: `Order: ${product.display_name} (${domainName})`,
    });
  } else {
    const price = isWildcard && product.wildcard_price_usd
      ? Number(product.wildcard_price_usd)
      : Number(product.base_price_usd);
    if (Number(customer.wallet_balance_usd) < price) {
      throw new Error("Insufficient credits or wallet balance for this order.");
    }
    await admin
      .from("customers")
      .update({ wallet_balance_usd: Number(customer.wallet_balance_usd) - price })
      .eq("id", customer.id);
    await admin.from("customer_ledger").insert({
      customer_id: customer.id,
      entry_type: "wallet_debit",
      amount: price,
      note: `Order: ${product.display_name} (${domainName})`,
    });
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      customer_id: customer.id,
      partner_id: customer.partner_id,
      product_id: product.id,
      domain_name: domainName,
      is_wildcard: isWildcard,
      order_type: product.order_type,
      status: "pending",
      csr: csr || null,
      approver_email: approverEmail || null,
    })
    .select()
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order.");

  // Attempt the real TheSSLStore call. If it fails (e.g. sandbox creds not
  // yet finalized), the order still exists locally as "pending" — it isn't
  // blocked on the upstream call succeeding.
  try {
    if (product.order_type === "csr") {
      const result = await placeNewOrder({
        productCode: product.product_code,
        csr,
        domainName,
        approverEmail,
        customOrderId: order.id,
      });
      await admin
        .from("orders")
        .update({ sslstore_order_id: String(result.TheSSLStoreOrderID), status: "submitted" })
        .eq("id", order.id);
      await admin.from("order_events").insert({
        order_id: order.id,
        event_type: "submitted",
        message: `Submitted to TheSSLStore, order ID ${result.TheSSLStoreOrderID}`,
      });
    } else {
      const { firstName, lastName } = splitName(customer.name);
      const contact = {
        firstName,
        lastName,
        email: customer.email,
        phone: contactPhone,
      };
      const sub = await createSubscription({
        productCode: product.product_code,
        domainName,
        isWildcard,
        customOrderId: order.id,
        validityMonths: 12,
        adminContact: contact,
        technicalContact: contact,
      });
      await admin
        .from("orders")
        .update({
          sslstore_subscription_id: JSON.stringify(sub),
          status: "submitted",
        })
        .eq("id", order.id);
      await admin.from("order_events").insert({
        order_id: order.id,
        event_type: "submitted",
        message: `Subscription created: ${JSON.stringify(sub)}`,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error calling TheSSLStore API.";
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    await admin.from("order_events").insert({
      order_id: order.id,
      event_type: "api_error",
      message,
    });
  }

  revalidatePath("/customer");
}
