"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean; message?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Only well-formed UUIDs: the ids are also interpolated into a PostgREST filter.
function zoneIds(formData: FormData) {
  return formData.getAll("zone_ids").map(String).filter((id) => UUID.test(id));
}

function parseFields(formData: FormData) {
  const price = Number(formData.get("price"));
  const quantity = Number(formData.get("quantity"));
  const zones = zoneIds(formData);
  if (!Number.isFinite(price) || price < 0) return { error: "Price must be 0 or more." };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: "Quantity must be a whole number, 0 or more." };
  if (zones.length === 0) return { error: "Assign the product to at least one zone." };
  return { price, quantity, zones };
}

export async function createProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Product name is required." };
  const fields = parseFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createClient();
  const { data: product, error } = await supabase
    .from("products")
    .insert({ name, price: fields.price, quantity: fields.quantity })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: linkError } = await supabase
    .from("product_zones")
    .insert(fields.zones.map((zone_id) => ({ product_id: product.id, zone_id })));
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
  const fields = parseFields(formData);
  if ("error" in fields) return fields;

  const supabase = await createClient();
  const { error: updError } = await supabase
    .from("products")
    .update({ price: fields.price, quantity: fields.quantity })
    .eq("id", productId);
  if (updError) return { error: updError.message };

  const { error: delError } = await supabase
    .from("product_zones")
    .delete()
    .eq("product_id", productId)
    .not("zone_id", "in", `(${fields.zones.join(",")})`);
  if (delError) return { error: delError.message };

  const { error } = await supabase
    .from("product_zones")
    .upsert(fields.zones.map((zone_id) => ({ product_id: productId, zone_id })), { ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Product updated." };
}

export async function deleteProduct(productId: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    return {
      error: error.code === "23503" ? "This product has orders and can't be deleted. Set its stock to 0 instead." : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Product deleted." };
}
