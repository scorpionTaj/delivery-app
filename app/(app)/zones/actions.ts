"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function createZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const radius = Number(formData.get("radius_m"));
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!name) return { error: "Zone name is required." };
  if (!Number.isFinite(radius) || radius <= 0) return { error: "Radius must be a positive number of meters." };
  if (!formData.get("lat") || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { error: "Click the map to set the zone center." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("zones").insert({ name, radius_m: radius, lat, lng });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteZone(id: string): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.from("zones").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503" ? "This zone has orders and can't be deleted." : error.message,
    };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
