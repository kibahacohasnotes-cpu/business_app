import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";

/* =========================================================
   UPLOAD BUSINESS IMAGE
========================================================= */

async function uploadBusinessImage(
  businessId: string,
  uri: string,
  type: "avatar" | "cover"
): Promise<string> {
  try {
    const base64 =
      await FileSystem.readAsStringAsync(uri, {
        encoding:
          FileSystem.EncodingType.Base64,
      });

    const filePath =
      `businesses/${businessId}/${type}-${Date.now()}.jpg`;

    const binary = Uint8Array.from(
      atob(base64),
      (char) =>
        char.charCodeAt(0)
    );

    const { error } =
      await supabase.storage
        .from("business-images")
        .upload(
          filePath,
          binary,
          {
            contentType:
              "image/jpeg",
            upsert: false,
          }
        );

    if (error) {
      throw error;
    }

    return filePath;
  } catch (error) {
    console.error(
      `UPLOAD BUSINESS ${type.toUpperCase()} ERROR:`,
      error
    );

    throw new Error(
      `Unable to upload business ${type} image.`
    );
  }
}

/* =========================================================
   UPLOAD AVATAR
========================================================= */

export async function uploadBusinessAvatar(
  businessId: string,
  uri: string
): Promise<string> {
  return uploadBusinessImage(
    businessId,
    uri,
    "avatar"
  );
}

/* =========================================================
   UPLOAD COVER
========================================================= */

export async function uploadBusinessCover(
  businessId: string,
  uri: string
): Promise<string> {
  return uploadBusinessImage(
    businessId,
    uri,
    "cover"
  );
}

/* =========================================================
   GET SIGNED IMAGE URL
========================================================= */

export async function getBusinessImageUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("business-images")
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error("SIGNED URL ERROR:", error);
    throw error;
  }

  console.log("SIGNED IMAGE URL:", data.signedUrl);

  return data.signedUrl;
}

/* =========================================================
   DELETE BUSINESS IMAGE
========================================================= */

export async function deleteBusinessImage(
  filePath: string
): Promise<void> {
  const { error } =
    await supabase.storage
      .from("business-images")
      .remove([filePath]);

  if (error) {
    throw error;
  }
}