"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean; message?: string };

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const currency = String(formData.get("currency") ?? "").trim().toUpperCase();
  const lowStock = Number(formData.get("low_stock_threshold"));
  const maxQty = Number(formData.get("max_order_quantity"));
  const strategy = String(formData.get("zone_strategy"));
  const tolerance = Number(formData.get("edge_tolerance_m"));

  if (!/^[A-Z]{1,5}$/.test(currency)) return { error: "Currency must be 1–5 letters, e.g. MAD." };
  if (!Number.isInteger(lowStock) || lowStock < 0) return { error: "Low-stock threshold must be a whole number, 0 or more." };
  if (!Number.isInteger(maxQty) || maxQty < 1) return { error: "Max order quantity must be at least 1." };
  if (strategy !== "nearest" && strategy !== "smallest") return { error: "Pick a zone selection rule." };
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 5000) {
    return { error: "Edge tolerance must be between 0 and 5000 meters." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      currency,
      low_stock_threshold: lowStock,
      max_order_quantity: maxQty,
      zone_strategy: strategy,
      edge_tolerance_m: tolerance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
