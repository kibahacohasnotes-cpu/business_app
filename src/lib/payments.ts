import { supabase } from "./supabase";
import { getMyBusiness } from "./business";

/* =========================================================
   TYPES
========================================================= */

export type PaymentMethod =
  | "cash"
  | "card"
  | "mobile_money"
  | "bank_transfer"
  | "credit"
  | "other";

export type Payment = {
  id: string;
  business_id: string;
  invoice_id: string | null;
  sale_id: string | null;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

/* =========================================================
   GET PAYMENTS
========================================================= */

export async function getPayments(): Promise<Payment[]> {
  const business = await getMyBusiness();

  if (!business) {
    return [];
  }

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      business_id,
      invoice_id,
      sale_id,
      amount,
      payment_method,
      payment_date,
      reference,
      notes,
      created_by,
      created_at
    `)
    .eq("business_id", business.id)
    .order("payment_date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Payment[];
}

/* =========================================================
   GET PAYMENT BY ID
========================================================= */
/* =========================================================
   GET PAYMENT BY ID
========================================================= */

export async function getPaymentById(
  paymentId: string
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      business_id,
      invoice_id,
      sale_id,
      amount,
      payment_method,
      payment_date,
      reference,
      notes,
      created_by,
      created_at
    `)
    .eq("id", paymentId)
    .single();

  if (error) {
    console.error(
      "GET PAYMENT ERROR:",
      error
    );

    throw error;
  }

  return data as Payment;
}

/* =========================================================
   GET PAYMENTS FOR SALE
========================================================= */

export async function getSalePayments(
  saleId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      business_id,
      invoice_id,
      sale_id,
      amount,
      payment_method,
      payment_date,
      reference,
      notes,
      created_by,
      created_at
    `)
    .eq("sale_id", saleId)
    .order("payment_date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Payment[];
}

/* =========================================================
   CREATE PAYMENT
========================================================= */

export async function createPayment({
  saleId,
  amount,
  paymentMethod,
  paymentDate,
  reference,
  notes,
}: {
  saleId?: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  reference?: string | null;
  notes?: string | null;
}): Promise<Payment> {
  const business = await getMyBusiness();

  if (!business) {
    throw new Error("Business not found.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Payment amount must be greater than zero."
    );
  }

  /* -------------------------------------------------------
   VALIDATE PAYMENT AGAINST SALE BALANCE
------------------------------------------------------- */

    if (saleId) {
      const { data: sale, error: saleError } =
        await supabase
          .from("sales")
          .select(`
            id,
            total,
            status
          `)
          .eq("id", saleId)
          .eq("business_id", business.id)
          .single();

      if (saleError) {
        throw saleError;
      }

      if (sale.status !== "completed") {
        throw new Error(
          "Payments can only be recorded for completed sales."
        );
      }

      const { data: existingPayments, error: paymentsError } =
        await supabase
          .from("payments")
          .select("amount")
          .eq("sale_id", saleId)
          .eq("business_id", business.id);

      if (paymentsError) {
        throw paymentsError;
      }

      const totalPaid =
        (existingPayments ?? []).reduce(
          (sum, payment) =>
            sum + Number(payment.amount),
          0
        );

      const outstanding =
        Math.max(
          Number(sale.total) - totalPaid,
          0
        );

      if (amount > outstanding) {
        throw new Error(
          `Payment cannot exceed the outstanding balance of TZS ${new Intl.NumberFormat(
            "en-TZ"
          ).format(outstanding)}.`
        );
      }
    }


  const cleanReference =
    reference?.trim() || null;

  const cleanNotes =
    notes?.trim() || null;

  const { data, error } = await supabase
    .from("payments")
    .insert({
      business_id: business.id,
      sale_id: saleId || null,
      invoice_id: null,
      amount,
      payment_method: paymentMethod,
      payment_date:
        paymentDate || new Date().toISOString(),
      reference: cleanReference,
      notes: cleanNotes,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Payment;
}

/* =========================================================
   DELETE PAYMENT
========================================================= */

export async function deletePayment(
  paymentId: string
): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    throw error;
  }
}

/* =========================================================
   GET PAYMENTS FOR CUSTOMER
========================================================= */

export async function getCustomerPayments(
  customerId: string
): Promise<Payment[]> {
  const business = await getMyBusiness();

  if (!business) {
    return [];
  }

  /* -------------------------------------------------------
     GET CUSTOMER SALES
  ------------------------------------------------------- */

  const { data: sales, error: salesError } =
    await supabase
      .from("sales")
      .select("id")
      .eq("business_id", business.id)
      .eq("customer_id", customerId);

  if (salesError) {
    console.error(
      "GET CUSTOMER SALES ERROR:",
      salesError
    );

    throw salesError;
  }

  const saleIds =
    (sales ?? []).map(
      (sale) => sale.id
    );

  if (saleIds.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
     GET PAYMENTS
  ------------------------------------------------------- */

  const { data, error } =
    await supabase
      .from("payments")
      .select(`
        id,
        business_id,
        invoice_id,
        sale_id,
        amount,
        payment_method,
        payment_date,
        reference,
        notes,
        created_by,
        created_at
      `)
      .eq("business_id", business.id)
      .in("sale_id", saleIds)
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

  return (data ?? []) as Payment[];
}


