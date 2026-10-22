"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticate, {});

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Delivery Manager</h1>
          <p className="text-sm text-slate-500">Sign in or create an account</p>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.email}
            key={state.email}
            className="input mt-1"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="input mt-1"
          />
        </label>
        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button name="mode" value="login" disabled={pending} className="btn-primary">
            Log in
          </button>
          <button name="mode" value="signup" disabled={pending} className="btn-secondary">
            Sign up
          </button>
        </div>
      </form>
    </main>
  );
}
