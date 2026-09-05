import { supabase } from "./supabase";

export async function getDashboardStats(businessId: string) {
  const { data, error } = await supabase.rpc("get_dashboard_stats", {
    target_business_id: businessId,
  });

  if (error) {
    throw error;
  }

  const stats = data as {
    products: number;
    customers: number;
    sales: number;
    revenue: number;
    lowStock: {
      id: string;
      name: string;
      stock_qty: number;
      low_stock_threshold: number;
    }[];
  };

  return {
    products: Number(stats.products ?? 0),
    customers: Number(stats.customers ?? 0),
    sales: Number(stats.sales ?? 0),
    revenue: Number(stats.revenue ?? 0),
    lowStock: stats.lowStock ?? [],
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
  const { data, error } = await supabase.rpc(
    "get_business_performance",
    {
      target_business_id: businessId,
      target_start_date: startDate,
      target_end_date: endDate,
    }
  );

  if (error) {
    throw error;
  }

  const points = (data ?? []) as {
    label: string;
    revenue: number | string;
    expenses: number | string;
    profit: number | string;
    sales: number | string;
  }[];

  return points.map((point) => ({
    label: point.label,
    revenue: Number(point.revenue ?? 0),
    expenses: Number(point.expenses ?? 0),
    profit: Number(point.profit ?? 0),
    sales: Number(point.sales ?? 0),
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
  const { data, error } = await supabase.rpc(
    "get_business_performance_summary",
    {
      target_business_id: businessId,
      target_start_date: startDate,
      target_end_date: endDate,
    }
  );

  if (error) {
    throw error;
  }

  const summary = data as {
    revenue: number;
    expenses: number;
    sales: number;
  };

  const revenue = Number(summary?.revenue ?? 0);
  const expenses = Number(summary?.expenses ?? 0);
  const sales = Number(summary?.sales ?? 0);

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    sales,
  };
}

