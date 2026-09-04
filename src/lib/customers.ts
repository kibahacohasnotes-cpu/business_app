import { getMyBusiness } from "./business";
import { supabase } from "./supabase";

/* =========================================================
   CUSTOMER TYPE
========================================================= */

export type CustomerAccount = {
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
};

export type Customer = {
  id: string;
  business_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
};

export async function getCustomers(): Promise<Customer[]> {
  const business = await getMyBusiness();

  if (!business) {
    return [];
  }

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      business_id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at
    `)
    .eq("business_id", business.id)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Customer[];
}
/* =========================================================
   GET SINGLE CUSTOMER
========================================================= */

export async function getCustomerById(
  customerId: string
): Promise<Customer> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      business_id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at
    `)
    .eq("id", customerId)
    .eq("business_id", business.id)
    .single();

  if (error) {
    console.error(
      "GET CUSTOMER ERROR:",
      error
    );

    throw error;
  }

  return data as Customer;
}

/* =========================================================
   CREATE CUSTOMER
========================================================= */

export async function createCustomer({
  name,
  phone,
  email,
  address,
}: {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): Promise<Customer> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  /* -------------------------------------------------------
     SANITIZE INPUT
  ------------------------------------------------------- */

  const cleanName = name.trim();

  const cleanPhone =
    phone?.trim() || null;

  const cleanEmail =
    email?.trim().toLowerCase() || null;

  const cleanAddress =
    address?.trim() || null;

  if (!cleanName) {
    throw new Error(
      "Customer name is required."
    );
  }

  /* -------------------------------------------------------
     CREATE
  ------------------------------------------------------- */

  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      address: cleanAddress,
    })
    .select(`
      id,
      business_id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error(
      "CREATE CUSTOMER ERROR:",
      error
    );

    throw error;
  }

  return data as Customer;
}

/* =========================================================
   UPDATE CUSTOMER
========================================================= */

export async function updateCustomer(
  customerId: string,
  updates: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }
): Promise<Customer> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  const cleanUpdates: Record<
    string,
    string | null
  > = {};

  if (updates.name !== undefined) {
    const cleanName = updates.name.trim();

    if (!cleanName) {
      throw new Error(
        "Customer name is required."
      );
    }

    cleanUpdates.name = cleanName;
  }

  if (updates.phone !== undefined) {
    cleanUpdates.phone =
      updates.phone?.trim() || null;
  }

  if (updates.email !== undefined) {
    cleanUpdates.email =
      updates.email?.trim().toLowerCase() ||
      null;
  }

  if (updates.address !== undefined) {
    cleanUpdates.address =
      updates.address?.trim() || null;
  }

  const { data, error } = await supabase
    .from("customers")
    .update(cleanUpdates)
    .eq("id", customerId)
    .eq("business_id", business.id)
    .select(`
      id,
      business_id,
      name,
      phone,
      email,
      address,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error(
      "UPDATE CUSTOMER ERROR:",
      error
    );

    throw error;
  }

  return data as Customer;
}

/* =========================================================
   DELETE CUSTOMER
========================================================= */

export async function deleteCustomer(
  customerId: string
): Promise<void> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId)
    .eq("business_id", business.id);

  if (error) {
    console.error(
      "DELETE CUSTOMER ERROR:",
      error
    );

    throw error;
  }
}

/* =========================================================
   GET CUSTOMER ACCOUNT
========================================================= */

export async function getCustomerAccount(
  customerId: string
): Promise<CustomerAccount> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  /* -------------------------------------------------------
     GET CUSTOMER SALES
  ------------------------------------------------------- */

  const { data: sales, error: salesError } =
    await supabase
      .from("sales")
      .select(`
        id,
        total,
        status
      `)
      .eq("business_id", business.id)
      .eq("customer_id", customerId);

  if (salesError) {
    console.error(
      "GET CUSTOMER SALES ERROR:",
      salesError
    );

    throw salesError;
  }

  const completedSales =
    (sales ?? []).filter(
      (sale) =>
        sale.status === "completed"
    );

  const totalPurchases =
    completedSales.reduce(
      (sum, sale) =>
        sum + Number(sale.total),
      0
    );

  /* -------------------------------------------------------
     GET CUSTOMER PAYMENTS
  ------------------------------------------------------- */

  const saleIds =
    completedSales.map(
      (sale) => sale.id
    );

  let totalPaid = 0;

  if (saleIds.length > 0) {
    const { data: payments, error: paymentsError } =
      await supabase
        .from("payments")
        .select(`
          amount,
          sale_id
        `)
        .eq("business_id", business.id)
        .in("sale_id", saleIds);

    if (paymentsError) {
      console.error(
        "GET CUSTOMER PAYMENTS ERROR:",
        paymentsError
      );

      throw paymentsError;
    }

    totalPaid =
      (payments ?? []).reduce(
        (sum, payment) =>
          sum + Number(payment.amount),
        0
      );
  }

  /* -------------------------------------------------------
     CALCULATE BALANCE
  ------------------------------------------------------- */

  const outstandingBalance =
    Math.max(
      totalPurchases - totalPaid,
      0
    );

  return {
    totalPurchases,
    totalPaid,
    outstandingBalance,
  };
}


/* =========================================================
   CUSTOMER PAYMENT TYPE
========================================================= */

export type Payment = {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string | null;
  sale_id?: string;
};

export type CustomerPayment = Payment;
/* =========================================================
   GET CUSTOMER PAYMENTS
========================================================= */

export async function getCustomerPayments(
  customerId: string
): Promise<CustomerPayment[]> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_method,
      payment_date,
      reference,
      sale_id
    `)
    .eq("business_id", business.id)
    .order("payment_date", {
      ascending: false,
    });

  if (error) {
    console.error(
      "GET CUSTOMER PAYMENTS ERROR:",
      error
    );

    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  const { data: sales, error: salesError } =
    await supabase
      .from("sales")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_id", customerId);

  if (salesError) {
    console.error(
      "GET CUSTOMER PAYMENT SALES ERROR:",
      salesError
    );

    throw salesError;
  }

  const saleIds = new Set(
    (sales ?? []).map((sale) => sale.id)
  );

  return data
    .filter((payment) =>
      saleIds.has(payment.sale_id)
    )
    .map((payment) => ({
      id: payment.id,
      amount: Number(payment.amount),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference: payment.reference,
    }));
}




