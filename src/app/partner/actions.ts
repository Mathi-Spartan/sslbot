"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function getCallingPartnerId() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: partner } = await supabase
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!partner) throw new Error("Not authorized — partner accounts only.");
  return partner.id;
}

function randomPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function createCustomer(formData: FormData) {
  const partnerId = await getCallingPartnerId();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const creditBalance = Number(formData.get("credit_balance") ?? 0);
  const walletBalance = Number(formData.get("wallet_balance") ?? 0);

  if (!name || !email) throw new Error("Name and email are required.");

  const admin = supabaseAdmin();
  const tempPassword = randomPassword();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError || !authUser.user) {
    throw new Error(authError?.message ?? "Failed to create login for customer.");
  }

  const { error: insertError } = await admin.from("customers").insert({
    partner_id: partnerId,
    name,
    email,
    credit_balance: creditBalance,
    wallet_balance_usd: walletBalance,
    user_id: authUser.user.id,
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(insertError.message);
  }

  revalidatePath("/partner");
  return { email, tempPassword };
}
