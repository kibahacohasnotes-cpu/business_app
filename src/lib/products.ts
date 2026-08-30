
import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";
export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};
export type Product = {
  id: string;
  business_id: string;
  category_id: string | null;
  name: string;
  sku: string | null;
  description: string | null;
  cost_price: number;
  sale_price: number;
  stock_qty: number;
  unit: string;
  low_stock_threshold: number;
  is_active: boolean;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
};



/* =========================================================
   GET PRODUCTS
========================================================= */

export async function getProducts(
  businessId: string
): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      business_id,
      category_id,
      name,
      sku,
      description,
      cost_price,
      sale_price,
      stock_qty,
      unit,
      low_stock_threshold,
      is_active,
      image_url,
      created_at,
      updated_at
    `)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/* =========================================================
   CREATE PRODUCT
========================================================= */

export async function createProduct(
  product: Omit<
    Product,
    "id" | "created_at" | "updated_at" | "business_id"
  >
) {
  const { data, error } = await supabase.rpc(
    "create_product",
    {
      p_name: product.name.trim(),
      p_sku: product.sku?.trim() || null,
      p_cost_price: product.cost_price,
      p_sale_price: product.sale_price,
      p_stock_qty: product.stock_qty,
      p_unit: product.unit.trim(),
      p_category_id: product.category_id || null,
      p_low_stock_threshold: product.low_stock_threshold,
      p_image_url: product.image_url || null,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export async function updateProduct(
  productId: string,
  updates: Partial<
    Omit<Product, "id" | "business_id" | "created_at">
  >
) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/* =========================================================
   DELETE PRODUCT
========================================================= */

export async function deleteProduct(productId: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    throw error;
  }
}

/* =========================================================
   SAVE PRODUCT IMAGE
========================================================= */

export async function saveProductImage({
  productId,
  imageUrl,
  sortOrder,
  isPrimary = false,
}: {
  productId: string;
  imageUrl: string;
  sortOrder: number;
  isPrimary?: boolean;
}): Promise<ProductImage> {
  if (isPrimary) {
    await supabase
      .from("product_images")
      .update({
        is_primary: false,
      })
      .eq("product_id", productId);
  }

  const { data, error } = await supabase
    .from("product_images")
    .insert({
      product_id: productId,
      image_url: imageUrl,
      sort_order: sortOrder,
      is_primary: isPrimary,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as ProductImage;
}

/* =========================================================
   UPLOAD PRODUCT IMAGE
========================================================= */

export async function uploadProductImage(
  uri: string,
  productId: string,
  sortOrder: number
): Promise<string> {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("Unable to read selected image.");
  }

  const blob = await response.blob();

  const filePath =
    `products/${productId}/${sortOrder}.jpg`;

  const { error: uploadError } =
    await supabase.storage
      .from("product-images")
      .upload(filePath, blob, {
        contentType: "image/jpeg",
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: publicUrlData,
  } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/* =========================================================
   UPLOAD MULTIPLE PRODUCT IMAGES
========================================================= */

export async function uploadProductImages(
  productId: string,
  imageUris: string[]
): Promise<ProductImage[]> {
  if (imageUris.length === 0) {
    return [];
  }

  const uploadedImages: ProductImage[] = [];

  for (let index = 0; index < imageUris.length; index++) {
    const uri = imageUris[index];

    const imageUrl = await uploadProductImage(
      uri,
      productId,
      index
    );

    const image = await saveProductImage({
      productId,
      imageUrl,
      sortOrder: index,
      isPrimary: index === 0,
    });

    uploadedImages.push(image);
  }

  return uploadedImages;
}


export async function getProductImages(
  productId: string
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProductImage[];
}

export async function deleteProductImage(
  image: ProductImage
): Promise<void> {
  const url = image.image_url;

  const marker = "/product-images/";

  const markerIndex = url.indexOf(marker);

  if (markerIndex !== -1) {
    const filePath = url.substring(
      markerIndex + marker.length
    );

    const { error: storageError } =
      await supabase.storage
        .from("product-images")
        .remove([filePath]);

    if (storageError) {
      console.warn(
        "Storage delete failed:",
        storageError
      );
    }
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id);

  if (error) {
    throw error;
  }
}

export async function updateProductImageOrder(
  images: ProductImage[]
): Promise<void> {
  for (let index = 0; index < images.length; index++) {
    const { error } = await supabase
      .from("product_images")
      .update({
        sort_order: index,
      })
      .eq("id", images[index].id);

    if (error) {
      throw error;
    }
  }
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  const { error: resetError } =
    await supabase
      .from("product_images")
      .update({
        is_primary: false,
      })
      .eq("product_id", productId);

  if (resetError) {
    throw resetError;
  }

  const { error } = await supabase
    .from("product_images")
    .update({
      is_primary: true,
    })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (error) {
    throw error;
  }
}