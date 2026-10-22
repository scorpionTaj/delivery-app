"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only well-formed UUIDs: the ids are also interpolated into a PostgREST filter.
function zoneIds(formData: FormData) {
  return formData.getAll("zone_ids").map(String).filter((id) => UUID.test(id));
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const zones = zoneIds(formData);

  if (!name) return { error: "Product name is required." };
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be 0 or more." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number, 0 or more." };
  if (zones.length === 0) return { error: "Assign the product to at least one zone." };

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, price, quantity })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: linkError } = await supabase
    .from("product_zones")
    .insert(zones.map((zone_id) => ({ product_id: product.id, zone_id })));
  if (linkError) {
    // Don't leave a product with no zones behind.
    await supabase.from("products").delete().eq("id", product.id);
    return { error: linkError.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setProductZones(productId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const zones = zoneIds(formData);
  if (zones.length === 0) return { error: "Keep at least one zone." };

  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("product_zones")
    .delete()
    .eq("product_id", productId)
    .not("zone_id", "in", `(${zones.join(",")})`);
  if (delError) return { error: delError.message };

  const { error } = await supabase
    .from("product_zones")
    .upsert(zones.map((zone_id) => ({ product_id: productId, zone_id })), { ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}
