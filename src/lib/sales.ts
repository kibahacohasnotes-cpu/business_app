import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";

/* =========================================================
   UPLOAD SALE RECEIPT
========================================================= */

export async function uploadSaleReceipt(
  saleId: string,
  uri: string
): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const filePath = `sales/${saleId}/receipt-${Date.now()}.jpg`;

    const binary = Uint8Array.from(
      atob(base64),
      (char) => char.charCodeAt(0)
    );

    const { error } = await supabase.storage
      .from("sale-receipts")
      .upload(filePath, binary, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Return the STORAGE PATH, not a public URL.
    return filePath;
  } catch (error) {
    console.error(
      "SALE RECEIPT UPLOAD ERROR:",
      error
    );

    throw new Error(
      "Unable to upload sale receipt."
    );
  }
}

/* =========================================================
   GET SALE RECEIPT URL
========================================================= */

export async function getSaleReceiptUrl(
  filePath: string
): Promise<string> {
  const { data, error } =
    await supabase.storage
      .from("sale-receipts")
      .createSignedUrl(
        filePath,
        60 * 60 // 1 hour
      );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

/* =========================================================
   DELETE SALE RECEIPT
========================================================= */

export async function deleteSaleReceipt(
  filePath: string
): Promise<void> {
  const { error } =
    await supabase.storage
      .from("sale-receipts")
      .remove([filePath]);

  if (error) {
    throw error;
  }
}

import { getMyBusiness } from "./business";
import { getCachedBusiness, saveBusinessCache } from "./businessCache";
import { saveSalesCache } from "./salesCache";

export type Sale = {
  id: string;
  business_id: string;
  customer_id: string | null;
  created_by: string | null;
  sale_date: string;
  status: "draft" | "completed" | "cancelled";
  payment_method:
    | "cash"
    | "card"
    | "mobile_money"
    | "bank_transfer"
    | "credit"
    | "other"
    | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;

  // Products contained in this sale
 sale_items?: {
  product_name: string;
  qty: number;
}[];
};

export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  created_at: string;

  product?: {
    image_url: string | null;
  } | null;
};


/* =========================================================
   GET SALES
========================================================= */

export async function getSales(): Promise<Sale[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;

  if (!userId) {
    return [];
  }

  let business = await getCachedBusiness(userId);

  if (!business) {
    const freshBusiness = await getMyBusiness();

    if (!freshBusiness) {
      return [];
    }

    business = {
      id: freshBusiness.id,
      name: freshBusiness.name,
      currency: freshBusiness.currency || "TZS",
      cachedAt: new Date().toISOString(),
    };

    await saveBusinessCache(userId, {
      id: freshBusiness.id,
      name: freshBusiness.name,
      currency: freshBusiness.currency || "TZS",
    });
  }

  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      business_id,
      customer_id,
      created_by,
      sale_date,
      status,
      payment_method,
      subtotal,
      tax,
      discount,
      total,
      notes,
      receipt_url,
      created_at,
      updated_at,
      sale_items (
        product_name,
        qty
      )
    `)
    .eq("business_id", business.id)
    .order("sale_date", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  const sales = (data ?? []) as Sale[];

  await saveSalesCache(business.id, sales);

  return sales;
}

/* =========================================================
   GET SINGLE SALE
========================================================= */

export async function getSaleById(
  saleId: string
): Promise<Sale> {
  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      business_id,
      customer_id,
      created_by,
      sale_date,
      status,
      payment_method,
      subtotal,
      tax,
      discount,
      total,
      notes,
      receipt_url,
      created_at,
      updated_at
    `)
    .eq("id", saleId)
    .single();

  if (error) {
    throw error;
  }

  return data as Sale;
}


/* =========================================================
   GET SALE ITEMS
========================================================= */

export async function getSaleItems(
  saleId: string
): Promise<SaleItem[]> {
  const { data, error } = await supabase
    .from("sale_items")
    .select(`
      id,
      sale_id,
      product_id,
      product_name,
      qty,
      unit_price,
      cost_price,
      subtotal,
      created_at,
      product:products (
        image_url
      )
    `)
    .eq("sale_id", saleId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("GET SALE ITEMS ERROR:", error);
    throw error;
  }

  return (data ?? []).map((item) => ({
  ...item,
  product: Array.isArray(item.product)
    ? item.product[0] ?? { image_url: null }
    : item.product ?? { image_url: null },
})) as SaleItem[];
}