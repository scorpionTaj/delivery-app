"use client";

import { ShoppingCart } from "@gravity-ui/icons";
import { Button, Card } from "@heroui/react";
import { useActionState } from "react";
import ThemeSwitch from "@/components/ThemeSwitch";
import { authenticate } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(authenticate, {});

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-accent-soft via-background to-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeSwitch compact />
      </div>
      <Card className="w-full max-w-sm">
        <Card.Header className="items-center text-center">
          <span className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <ShoppingCart width={24} height={24} />
          </span>
          <Card.Title className="text-xl">Delivery Manager</Card.Title>
          <Card.Description>Sign in or create an account</Card.Description>
        </Card.Header>
        <Card.Content>
          <form action={formAction} className="space-y-4">
            <label className="label block">
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
            <label className="label block">
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
              <p role="alert" className="alert-error">
                {state.error}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit" name="mode" value="login" isPending={pending} fullWidth>
                Log in
              </Button>
              <Button type="submit" name="mode" value="signup" isPending={pending} variant="secondary" fullWidth>
                Sign up
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </main>
  );
}
