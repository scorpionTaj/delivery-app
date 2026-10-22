"use server";

import { revalidatePath } from "next/cache";
import { type Zone, findZone, formatDistance } from "@/lib/geo";
import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";

export type OrderState = { error?: string; ok?: boolean; message?: string };

/**
 * Validates the delivery point server-side: it must fall inside a zone where
 * the product is assigned (plus the configured edge tolerance). The zone is
 * picked by the workspace's zone strategy. Stock is decremented atomically by
 * the place_order database function.
 */
export async function placeOrder(_prev: OrderState, formData: FormData): Promise<OrderState> {
  const productId = String(formData.get("product_id") ?? "");
  const quantity = Number(formData.get("quantity"));
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!productId) return { error: "Choose a product." };
  if (!Number.isInteger(quantity) || quantity <= 0) return { error: "Quantity must be a whole number above 0." };
  if (!formData.get("lat") || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "Tap the map to set the delivery location." };
  }

  const supabase = await createClient();
  const [settings, productRes] = await Promise.all([
    getSettings(supabase),
    supabase
      .from("products")
      .select("name, quantity, product_zones(zones(id, name, lat, lng, radius_m))")
      .eq("id", productId)
      .maybeSingle(),
  ]);
  const { data: product, error: productError } = productRes;
  if (productError) return { error: productError.message };
  if (!product) return { error: "Product not found." };

  if (quantity > settings.max_order_quantity) {
    return { error: `Orders are limited to ${settings.max_order_quantity} units (see Settings).` };
  }

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
