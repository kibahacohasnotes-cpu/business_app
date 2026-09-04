import { supabase } from "./supabase";

export async function getDashboardStats(businessId: string) {
  const [
    productsResult,
    customersResult,
    salesResult,
    lowStockResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId),

    supabase
      .from("sales")
      .select("total")
      .eq("business_id", businessId)
      .eq("status", "completed"),

    supabase
      .from("products")
      .select("id, name, stock_qty, low_stock_threshold")
      .eq("business_id", businessId),
  ]);

  if (productsResult.error) {
    throw productsResult.error;
  }

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (salesResult.error) {
    throw salesResult.error;
  }

  if (lowStockResult.error) {
    throw lowStockResult.error;
  }

  const revenue =
    salesResult.data?.reduce(
      (total, sale) => total + Number(sale.total ?? 0),
      0
    ) ?? 0;

  const lowStock =
    lowStockResult.data?.filter(
      (product) =>
        Number(product.stock_qty) <=
        Number(product.low_stock_threshold)
    ) ?? [];

  return {
    products: productsResult.count ?? 0,
    customers: customersResult.count ?? 0,
    sales: salesResult.data?.length ?? 0,
    revenue,
    lowStock,
  };
}

export type BusinessPerformancePoint = {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
  sales: number;
};

export async function getBusinessPerformance(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<BusinessPerformancePoint[]> {
  const [salesResult, expensesResult] = await Promise.all([
    supabase
      .from("sales")
      .select("sale_date, total")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .gte("sale_date", startDate)
      .lte("sale_date", endDate)
      .order("sale_date", { ascending: true }),

    supabase
      .from("expenses")
      .select("expense_date, amount")
      .eq("business_id", businessId)
      .eq("status", "Paid")
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
      .order("expense_date", { ascending: true }),
  ]);

  if (salesResult.error) {
    throw salesResult.error;
  }

  if (expensesResult.error) {
    throw expensesResult.error;
  }


  const points = new Map<
    string,
    {
      revenue: number;
      expenses: number;
      sales: number;
    }
  >();

  // Create every day in the requested range.
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(
      current.getMonth() + 1
    ).padStart(2, "0");
    const day = String(
      current.getDate()
    ).padStart(2, "0");

    const date = `${year}-${month}-${day}`;

    points.set(date, {
      revenue: 0,
      expenses: 0,
      sales: 0,
    });

    current.setDate(current.getDate() + 1);
  }

  // Add completed sales.
  for (const sale of salesResult.data ?? []) {
    const date = sale.sale_date.split("T")[0];
    const existing = points.get(date);
    if (!existing) continue;
    existing.revenue += Number(sale.total ?? 0);
    existing.sales += 1;
  }

  // Add paid expenses.
for (const expense of expensesResult.data ?? []) {
  const date = expense.expense_date.split("T")[0];

  const existing = points.get(date);

  if (!existing) continue;

  existing.expenses += Number(expense.amount ?? 0);
}

  return Array.from(points.entries())
    .sort(([dateA], [dateB]) =>
      dateA.localeCompare(dateB)
    )
    .map(([date, values]) => ({
      label: date,
      revenue: values.revenue,
      expenses: values.expenses,
      profit: values.revenue - values.expenses,
      sales: values.sales,
    }));
}


export type BusinessPerformanceSummary = {
  revenue: number;
  expenses: number;
  profit: number;
  sales: number;
};


export async function getBusinessPerformanceSummary(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<BusinessPerformanceSummary> {
  const [salesResult, expensesResult] =
    await Promise.all([
      supabase
        .from("sales")
        .select("total")
        .eq("business_id", businessId)
        .eq("status", "completed")
        .gte("sale_date", startDate)
        .lte("sale_date", endDate),

      supabase
        .from("expenses")
        .select("amount")
        .eq("business_id", businessId)
        .eq("status", "Paid")
        .gte("expense_date", startDate)
        .lte("expense_date", endDate),
    ]);

  if (salesResult.error) {
    throw salesResult.error;
  }

  if (expensesResult.error) {
    throw expensesResult.error;
  }

  const revenue =
    salesResult.data?.reduce(
      (total, sale) =>
        total + Number(sale.total ?? 0),
      0
    ) ?? 0;

  const expenses =
    expensesResult.data?.reduce(
      (total, expense) =>
        total + Number(expense.amount ?? 0),
      0
    ) ?? 0;

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    sales: salesResult.data?.length ?? 0,
  };
}

