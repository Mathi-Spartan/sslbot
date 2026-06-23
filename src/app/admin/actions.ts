"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function assertIsAdmin() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) throw new Error("Not authorized — admin only.");
}

function randomPassword() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export async function createPartner(formData: FormData) {
  await assertIsAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const allocationType = String(formData.get("allocation_type") ?? "credits");
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
    throw new Error(authError?.message ?? "Failed to create login for partner.");
  }

  const { error: insertError } = await admin.from("partners").insert({
    name,
    email,
    allocation_type: allocationType,
    credit_balance: creditBalance,
    wallet_balance_usd: walletBalance,
    user_id: authUser.user.id,
  });
  if (insertError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(insertError.message);
  }

  revalidatePath("/admin");
  return { email, tempPassword };
}
