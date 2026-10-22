"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseProduct } from "@/lib/validation";

export type FormState = { error?: string; ok?: boolean; message?: string };

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseProduct(formData, { requireName: true });
  if (!parsed.data) return { error: parsed.error };
  const { name, price, quantity, zoneIds } = parsed.data;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, price, quantity })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: linkError } = await supabase
    .from("product_zones")
    .insert(zoneIds.map((zone_id) => ({ product_id: product.id, zone_id })));
  if (linkError) {
    // Don't leave a product with no zones behind.
    await supabase.from("products").delete().eq("id", product.id);
    return { error: linkError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: `${name} added.` };
}

/** Edit price, set stock (restock) and change zone assignment. */
export async function updateProduct(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!isUuid(productId)) return { error: "Unknown product." };
  const parsed = parseProduct(formData, { requireName: false });
  if (!parsed.data) return { error: parsed.error };
  const { price, quantity, zoneIds } = parsed.data;

  const supabase = await createClient();
  // Independent writes: run them together.
  const [upd, del, ins] = await Promise.all([
    supabase.from("products").update({ price, quantity }).eq("id", productId),
    supabase.from("product_zones").delete().eq("product_id", productId).not("zone_id", "in", `(${zoneIds.join(",")})`),
    supabase
      .from("product_zones")
      .upsert(zoneIds.map((zone_id) => ({ product_id: productId, zone_id })), { ignoreDuplicates: true }),
  ]);
  const error = upd.error ?? del.error ?? ins.error;
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Product updated." };
}

export async function deleteProduct(productId: string): Promise<FormState> {
  if (!isUuid(productId)) return { error: "Unknown product." };
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    return {
      error:
        error.code === "23503" ? "This product has orders and can't be deleted. Set its stock to 0 instead." : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Product deleted." };
}
