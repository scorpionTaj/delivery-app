"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseSettings } from "@/lib/validation";

export type FormState = { error?: string; ok?: boolean; message?: string };

export async function updateSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseSettings(formData);
  if (!parsed.data) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("app_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
