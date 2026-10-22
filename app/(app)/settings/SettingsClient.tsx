"use client";

import { Button, Card, toast } from "@heroui/react";
import { CURRENCIES, type Settings } from "@/lib/settings";
import { useFormAction } from "@/lib/useFormAction";
import { updateSettings } from "./actions";

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      {children}
      <span className="block text-xs text-muted">{hint}</span>
    </label>
  );
}

export default function SettingsClient({ settings }: { settings: Settings }) {
  const { state, onSubmit, pending } = useFormAction(updateSettings, () => toast.success("Settings saved"), {
    reset: false,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <Card.Header>
            <Card.Title>Inventory</Card.Title>
            <Card.Description>Shared by everyone in the workspace.</Card.Description>
          </Card.Header>
          <Card.Content className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency" hint="Used for every price and total in the app.">
              <select name="currency" defaultValue={settings.currency} className="input">
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Low-stock threshold" hint="Products at or below this quantity are flagged.">
              <input
                name="low_stock_threshold"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={settings.low_stock_threshold}
                className="input"
              />
            </Field>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Advanced order rules</Card.Title>
            <Card.Description>Enforced on the server for every new order.</Card.Description>
          </Card.Header>
          <Card.Content className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="label">When a location is inside several zones</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { value: "nearest", title: "Nearest center", desc: "Pick the zone whose center is closest." },
                  { value: "smallest", title: "Smallest zone", desc: "Pick the tightest zone (most local hub)." },
                ].map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer gap-3 rounded-2xl p-3 ring-1 ring-border has-[:checked]:bg-accent-soft has-[:checked]:ring-accent"
                  >
                    <input
                      type="radio"
                      name="zone_strategy"
                      value={o.value}
                      defaultChecked={settings.zone_strategy === o.value}
                      className="mt-1 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium">{o.title}</span>
                      <span className="block text-xs text-muted">{o.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Edge tolerance (meters)" hint="Accept locations this far outside a zone edge. 0 = strict.">
                <input
                  name="edge_tolerance_m"
                  type="number"
                  min={0}
                  max={5000}
                  step="any"
                  required
                  defaultValue={settings.edge_tolerance_m}
                  className="input"
                />
              </Field>
              <Field label="Max quantity per order" hint="Orders above this are rejected.">
                <input
                  name="max_order_quantity"
                  type="number"
                  min={1}
                  step={1}
                  required
                  defaultValue={settings.max_order_quantity}
                  className="input"
                />
              </Field>
            </div>
          </Card.Content>
        </Card>

        {state.error && <p role="alert" className="alert-error">{state.error}</p>}
        <Button type="submit" isPending={pending}>
          Save settings
        </Button>
      </form>
    </div>
  );
}
