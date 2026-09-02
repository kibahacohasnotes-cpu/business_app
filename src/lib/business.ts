import { supabase } from "./supabase";

export async function createBusiness(
  name: string,
  currency: string,
  businessType?: string,
  description?: string,
  phone?: string,
  email?: string,
  address?: string,
  city?: string,
  country?: string,
  registrationNumber?: string,
  website?: string
) {
  const { data, error } = await supabase.rpc(
    "create_business",
    {
      p_name: name,
      p_currency: currency,
      p_business_type: businessType || null,
      p_description: description || null,
      p_phone: phone || null,
      p_email: email || null,
      p_address: address || null,
      p_city: city || null,
      p_country: country || null,
      p_registration_number:
        registrationNumber || null,
      p_website: website || null,
    }
  );

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
    .select(`
      id,
      name,
      currency,
      business_type,
      description,
      phone,
      email,
      address,
      city,
      country,
      registration_number,
      website,
      avatar_url,
      cover_url,
      created_at,
      updated_at
    `)
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


export async function updateBusiness(
  businessId: string,
  updates: {
    name: string;
    business_type: string | null;
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    currency: string;
    registration_number: string | null;
    website: string | null;
  }
) {
  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: updates.name.trim(),
      business_type: updates.business_type,
      description: updates.description,
      phone: updates.phone,
      email: updates.email,
      address: updates.address,
      city: updates.city,
      country: updates.country,
      currency: updates.currency,
      registration_number:
        updates.registration_number,
      website: updates.website,
      updated_at: new Date().toISOString(),
    })
    .eq("id", businessId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}