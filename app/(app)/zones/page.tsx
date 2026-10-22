import { withColors } from "@/lib/geo";
import { createClient } from "@/lib/supabase/server";
import ZonesClient from "./ZonesClient";

export default async function ZonesPage() {
  const supabase = await createClient();
  const { data: zones, error } = await supabase
    .from("zones")
    .select("id, name, lat, lng, radius_m")
    .order("created_at");
  if (error) throw error;

  return <ZonesClient zones={withColors(zones)} />;
}
