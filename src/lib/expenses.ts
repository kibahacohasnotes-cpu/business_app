import { supabase } from "./supabase";

export type Expense = {
  id: string;
  business_id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
  description: string | null;
  payment_method: string | null;
  reference: string | null;
  vendor: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  recurrence_period: string | null;
  status: "Paid" | "Pending" | "Cancelled";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get all expenses belonging to a business
 */
export async function getExpenses(
  businessId: string
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}


/**
 * Get one expense
 */
export async function getExpense(
  expenseId: string
): Promise<Expense | null> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", expenseId)
    .maybeSingle();

  if (error) throw error;

  return data;
}


/**
 * Create a new expense
 */
export async function createExpense(
  expense: {
    business_id: string;
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    description?: string;
    payment_method?: string;
    reference?: string;
    vendor?: string;
    receipt_url?: string;
    is_recurring?: boolean;
    recurrence_period?: string;
    status?: "Paid" | "Pending" | "Cancelled";
  }
): Promise<Expense> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("You must be logged in to create an expense.");
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      business_id: expense.business_id,
      title: expense.title.trim(),
      category: expense.category,
      amount: expense.amount,
      expense_date: expense.expense_date,
      description: expense.description?.trim() || null,
      payment_method: expense.payment_method || "Cash",
      reference: expense.reference?.trim() || null,
      vendor: expense.vendor?.trim() || null,
      receipt_url: expense.receipt_url || null,
      is_recurring: expense.is_recurring ?? false,
      recurrence_period: expense.recurrence_period || null,
      status: expense.status || "Paid",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}


/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  updates: Partial<{
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    description: string | null;
    payment_method: string | null;
    reference: string | null;
    vendor: string | null;
    receipt_url: string | null;
    is_recurring: boolean;
    recurrence_period: string | null;
    status: "Paid" | "Pending" | "Cancelled";
  }>
): Promise<Expense> {
  const { data, error } = await supabase
    .from("expenses")
    .update({
      ...updates,
      title: updates.title?.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", expenseId)
    .select()
    .single();

  if (error) throw error;

  return data;
}


/**
 * Delete an expense
 */
export async function deleteExpense(
  expenseId: string
): Promise<void> {
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId);

  if (error) throw error;
}

export async function uploadExpenseReceipt(
  businessId: string,
  fileUri: string
): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error(
      "You must be logged in to upload a receipt."
    );
  }

  const response = await fetch(fileUri);

  const arrayBuffer = await response.arrayBuffer();

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error(
      "The selected receipt image is empty or could not be read."
    );
  }

  const extension =
    fileUri
      .split(".")
      .pop()
      ?.split("?")[0]
      ?.toLowerCase() || "jpg";

  const contentType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
      ? "image/webp"
      : "image/jpeg";

  const filePath = `${businessId}/${user.id}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("expense-receipts")
    .upload(filePath, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from("expense-receipts")
    .getPublicUrl(filePath);

  return data.publicUrl;
}
/**
 * Get total expenses
 */
export async function getTotalExpenses(
  businessId: string
): Promise<number> {
  const { data, error } = await supabase
    .from("expenses")
    .select("amount")
    .eq("business_id", businessId);

  if (error) throw error;

  return (data ?? []).reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );
}


/**
 * Get expenses for a date range
 */
export async function getExpensesByDateRange(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("business_id", businessId)
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

