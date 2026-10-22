import { getSettings } from "@/lib/settings";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);
  return <SettingsClient settings={settings} />;
}
