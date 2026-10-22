"use client";

import { Plus, TrashBin } from "@gravity-ui/icons";
import { Button, Card, toast } from "@heroui/react";
import { useState, useTransition } from "react";
import MapView from "@/components/MapView";
import SortSelect from "@/components/SortSelect";
import { type Zone, formatDistance } from "@/lib/geo";
import { ZONE_SORTS, type ZoneSort, sortZones } from "@/lib/sort";
import { useFormAction } from "@/lib/useFormAction";
import { createZone, deleteZone } from "./actions";

export default function ZonesClient({ zones }: { zones: Zone[] }) {
  const [picked, setPicked] = useState<[number, number] | null>(null);
  const { state, onSubmit, pending } = useFormAction(createZone, () => {
    toast.success("Zone added");
    setPicked(null);
  });
  const [deleting, startDelete] = useTransition();
  const [sort, setSort] = useState<ZoneSort>("radius-desc");
  const sorted = sortZones(zones, sort);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Zones</h1>

      <Card>
        <Card.Header>
          <Card.Title>New zone</Card.Title>
          <Card.Description>Tap the map to set the zone center, then name it and set a radius.</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-4">
          <MapView zones={zones} picked={picked} onPick={(lat, lng) => setPicked([lat, lng])} />
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
            <input type="hidden" name="lat" value={picked?.[0] ?? ""} />
            <input type="hidden" name="lng" value={picked?.[1] ?? ""} />
            <label className="label">
              Name
              <input name="name" required className="input mt-1" placeholder="e.g. Maarif" />
            </label>
            <label className="label">
              Radius (m)
              <input name="radius_m" type="number" min={1} step="any" required defaultValue={1000} className="input mt-1" />
            </label>
            <Button type="submit" isPending={pending} isDisabled={!picked}>
              <Plus />
              Add zone
            </Button>
          </form>
          <p className="text-xs text-muted">
            {picked ? `Center: ${picked[0].toFixed(5)}, ${picked[1].toFixed(5)}` : "No center selected yet."}
          </p>
          {state.error && <p role="alert" className="alert-error">{state.error}</p>}
        </Card.Content>
      </Card>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">All zones ({zones.length})</h2>
          <SortSelect value={sort} onChange={setSort} options={ZONE_SORTS} />
        </div>
        {zones.length === 0 && <p className="text-sm text-muted">No zones yet.</p>}
        <ul className="grid gap-2 sm:grid-cols-2">
          {sorted.map((z) => (
            <li key={z.id} className="card flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: z.color }} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{z.name}</p>
                <p className="text-xs text-muted">
                  Radius {formatDistance(z.radius_m)} · {z.lat.toFixed(4)}, {z.lng.toFixed(4)}
                </p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={`Delete ${z.name}`}
                isDisabled={deleting}
                className="text-danger"
                onPress={() => {
                  if (!confirm(`Delete zone ${z.name}?`)) return;
                  startDelete(async () => {
                    const r = await deleteZone(z.id);
                    if (r.error) toast.danger(r.error);
                    else toast.success("Zone deleted");
                  });
                }}
              >
                <TrashBin />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
