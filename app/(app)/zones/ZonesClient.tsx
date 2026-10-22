"use client";

import { useActionState, useState, useTransition } from "react";
import Map from "@/components/Map";
import { type Zone, formatDistance, zoneColor } from "@/lib/geo";
import { type FormState, createZone, deleteZone } from "./actions";

export default function ZonesClient({ zones }: { zones: Zone[] }) {
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await createZone(prev, formData);
    if (result.ok) setPicked(null);
    return result;
  }, {});
  const [deleteError, setDeleteError] = useState<string>();
  const [deleting, startDelete] = useTransition();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Zones</h1>

      <section className="card space-y-4">
        <p className="text-sm text-slate-600">Tap the map to set the zone center, then name it and set a radius.</p>
        <Map zones={zones} picked={picked} onPick={(lat, lng) => setPicked([lat, lng])} />
        <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <input type="hidden" name="lat" value={picked?.[0] ?? ""} />
          <input type="hidden" name="lng" value={picked?.[1] ?? ""} />
          <label className="text-sm font-medium text-slate-700">
            Name
            <input name="name" required className="input mt-1" placeholder="e.g. Maarif" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Radius (m)
            <input name="radius_m" type="number" min={1} step="any" required defaultValue={1000} className="input mt-1" />
          </label>
          <button disabled={pending || !picked} className="btn-primary">
            {pending ? "Saving…" : "Add zone"}
          </button>
        </form>
        <p className="text-xs text-slate-500">
          {picked ? `Center: ${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}` : "No center selected yet."}
        </p>
        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">All zones ({zones.length})</h2>
        {deleteError && <p role="alert" className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{deleteError}</p>}
        {zones.length === 0 && <p className="text-sm text-slate-500">No zones yet.</p>}
        <ul className="grid gap-2 sm:grid-cols-2">
          {zones.map((z) => (
            <li key={z.id} className="card flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: zoneColor(z.id) }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{z.name}</p>
                <p className="text-xs text-slate-500">
                  Radius {formatDistance(z.radius_m)} · {z.lat.toFixed(4)}, {z.lng.toFixed(4)}
                </p>
              </div>
              <button
                disabled={deleting}
                onClick={() =>
                  startDelete(async () => {
                    setDeleteError((await deleteZone(z.id)).error);
                  })
                }
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
