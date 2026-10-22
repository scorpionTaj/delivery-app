import type { SupabaseClient } from "@supabase/supabase-js";

export type ZoneStrategy = "nearest" | "smallest";

export type Settings = {
  currency: string;
  low_stock_threshold: number;
  max_order_quantity: number;
  zone_strategy: ZoneStrategy;
  edge_tolerance_m: number;
};

export const DEFAULT_SETTINGS: Settings = {
  currency: "MAD",
  low_stock_threshold: 5,
  max_order_quantity: 50,
  zone_strategy: "nearest",
  edge_tolerance_m: 0,
};

/** Workspace-wide settings (single row). Falls back to defaults if missing. */
export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase
    .from("app_settings")
    .select("currency, low_stock_threshold, max_order_quantity, zone_strategy, edge_tolerance_m")
    .eq("id", 1)
    .maybeSingle();
  return { ...DEFAULT_SETTINGS, ...data };
}

export function formatMoney(amount: number, currency: string) {
  return `${amount.toFixed(2)} ${currency}`;
}
