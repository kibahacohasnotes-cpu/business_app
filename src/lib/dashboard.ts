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