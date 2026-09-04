import { supabase } from "./supabase";

export type ReportPeriod = "daily" | "weekly" | "monthly" | "annual";

export type ProductReport = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type BusinessReport = {
  businessId: string;
  startDate: string;
  endDate: string;

  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMargin: number;

  expenses: number;
  profit: number;
  profitMargin: number;

  sales: number;
  averageSale: number;

  products: ProductReport[];

  businessName: string;
  currency: string;
};

export async function getBusinessReport(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<BusinessReport> {
  const [businessResult, salesResult, expensesResult] = await Promise.all([
    supabase
      .from("businesses")
      .select("name, currency")
      .eq("id", businessId)
      .single(),

    supabase
      .from("sales")
      .select("id, total")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .gte("sale_date", `${startDate}T00:00:00`)
      .lte("sale_date", `${endDate}T23:59:59`),

    supabase
      .from("expenses")
      .select("amount")
      .eq("business_id", businessId)
      .eq("status", "Paid")
      .gte("expense_date", `${startDate}T00:00:00`)
      .lte("expense_date", `${endDate}T23:59:59`),
  ]);

  if (businessResult.error) throw businessResult.error;
  if (salesResult.error) throw salesResult.error;
  if (expensesResult.error) throw expensesResult.error;

  const sales = salesResult.data ?? [];
  const saleIds = sales.map((sale) => sale.id);

  let saleItems: {
    product_id: string;
    product_name: string;
    qty: number | string;
    cost_price: number | string;
    subtotal: number | string;
  }[] = [];

  if (saleIds.length > 0) {
    const { data, error } = await supabase
      .from("sale_items")
      .select(
        "product_id, product_name, qty, cost_price, subtotal"
      )
      .in("sale_id", saleIds);

    if (error) throw error;

    saleItems = data ?? [];
  }

  const revenue =
    sales.reduce(
      (total, sale) => total + Number(sale.total ?? 0),
      0
    );

  const expenses =
    expensesResult.data?.reduce(
      (total, expense) => total + Number(expense.amount ?? 0),
      0
    ) ?? 0;

  const productMap = new Map<string, ProductReport>();

  for (const item of saleItems) {
    const productId = item.product_id;
    const productName = item.product_name || "Unknown Product";

    const quantity = Number(item.qty ?? 0);
    const itemRevenue = Number(item.subtotal ?? 0);
    const itemCost = quantity * Number(item.cost_price ?? 0);

    const existing = productMap.get(productId);

    if (existing) {
      existing.quantity += quantity;
      existing.revenue += itemRevenue;
      existing.cost += itemCost;
      existing.profit += itemRevenue - itemCost;
    } else {
      productMap.set(productId, {
        productId,
        productName,
        quantity,
        revenue: itemRevenue,
        cost: itemCost,
        profit: itemRevenue - itemCost,
      });
    }
  }

  const products = Array.from(productMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  );

  const costOfGoodsSold = products.reduce(
    (total, product) => total + product.cost,
    0
  );

  const grossProfit = revenue - costOfGoodsSold;

  const grossMargin =
    revenue > 0
      ? (grossProfit / revenue) * 100
      : 0;

  const profit = grossProfit - expenses;

  const profitMargin =
    revenue > 0
      ? (profit / revenue) * 100
      : 0;

  return {
    businessId,
    startDate,
    endDate,

    revenue,

    costOfGoodsSold,

    grossProfit,

    grossMargin,

    expenses,

    profit,

    profitMargin,

    sales: sales.length,

    averageSale:
      sales.length > 0
        ? revenue / sales.length
        : 0,

    products,

    businessName: businessResult.data.name,

    currency: businessResult.data.currency,
  };
}