"use server";

import { revalidatePath } from "next/cache";
import { type Zone, findZone, formatDistance } from "@/lib/geo";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import { parseOrder } from "@/lib/validation";

export type OrderState = { error?: string; ok?: boolean; message?: string };

/**
 * Validates the delivery point server-side: it must fall inside a zone where
 * the product is assigned (plus the configured edge tolerance). The zone is
 * picked by the workspace's zone strategy. Stock is decremented atomically by
 * the place_order database function.
 */
export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const supabase = await createClient();
  const settings = await getSettings(supabase);
  const parsed = parseOrder(formData, { maxQuantity: settings.max_order_quantity });
  if (!parsed.data) return { error: parsed.error };
  const { productId, quantity, lat, lng } = parsed.data;

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("name, quantity, product_zones(zones(id, name, lat, lng, radius_m))")
    .eq("id", productId)
    .maybeSingle();
  if (productError) return { error: productError.message };
  if (!product) return { error: "Product not found." };

  const zones = (product.product_zones as unknown as { zones: Zone }[]).map((pz) => pz.zones);
  const match = findZone(lat, lng, zones, {
    strategy: settings.zone_strategy,
    toleranceM: settings.edge_tolerance_m,
  });
  if (!match.zone) {
    return {
      error:
        match.outsideBy === null
          ? `${product.name} isn't assigned to any delivery zone.`
          : `Location is ${formatDistance(match.outsideBy)} outside the nearest zone that delivers ${product.name}.`,
    };
  }

  if (product.quantity < quantity) {
    return { error: `Not enough stock: only ${product.quantity} ${product.name} left.` };
  }

  const { error } = await supabase.rpc("place_order", {
    p_product_id: productId,
    p_zone_id: match.zone.id,
    p_quantity: quantity,
    p_lat: lat,
    p_lng: lng,
  });
  // The DB re-checks stock atomically, in case another order got there first.
  if (error) return { error: error.message === "Not enough stock" ? "Not enough stock left." : error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: `Order accepted: ${quantity} × ${product.name}, delivered from ${match.zone.name}.` };
}
