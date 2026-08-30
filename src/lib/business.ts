import { supabase } from "./supabase";

export async function createBusiness(
  name: string,
  currency: string,
  taxRate: number
) {
  const { data, error } = await supabase.rpc("create_business", {
    p_name: name.trim(),
    p_currency: currency.trim().toUpperCase(),
    p_tax_rate: taxRate,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getMyBusiness() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    if (
      userError.message.includes(
        "User from sub claim in JWT does not exist"
      )
    ) {
      await supabase.auth.signOut();
      return null;
    }

    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const {
    data: business,
    error: businessError,
  } = await supabase
    .from("businesses")
    .select("id, name, currency, tax_rate")
    .eq("id", data.business_id)
    .single();

  if (businessError) {
    throw businessError;
  }

  return {
    ...business,
    role: data.role,
  };
}

// Keep this alias because index.tsx currently uses getUserBusiness()
export async function getUserBusiness() {
  return getMyBusiness();
}