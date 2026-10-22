"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid, parseZone } from "@/lib/validation";

export type FormState = { error?: string; ok?: boolean; message?: string };

export async function createZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseZone(formData);
  if (!parsed.data) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("zones").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true, message: `${parsed.data.name} added.` };
}

export async function deleteZone(id: string): Promise<FormState> {
  if (!isUuid(id)) return { error: "Unknown zone." };
  const supabase = await createClient();
  const { error } = await supabase.from("zones").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503" ? "This zone has orders and can't be deleted." : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true, message: "Zone deleted." };
}
