"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; email?: string };

export async function authenticate(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mode = formData.get("mode");

  if (!email || password.length < 6) {
    return { error: "Enter an email and a password of at least 6 characters.", email };
  }

  const supabase = await createClient();
  const { data, error } =
    mode === "signup"
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message, email };
  // Sign-up returns no session when "Confirm email" is enabled in Supabase.
  if (!data.session) return { error: "Account created. Confirm your email, then log in.", email };
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
