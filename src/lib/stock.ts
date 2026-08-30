import { supabase } from "./supabase";

export async function createStockMovement(data: {
  productId: string;
  type: "restock" | "adjustment" | "sale";
  qtyChange: number;
  note?: string;
}) {
  const { data: movement, error } = await supabase
    .from("stock_movements")
    .insert({
      product_id: data.productId,
      type: data.type,
      qty_change: data.qtyChange,
      note: data.note ?? null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return movement;
}