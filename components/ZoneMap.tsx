"use client";

import { latLng } from "leaflet";
import { useEffect } from "react";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { type Zone, zoneColor } from "@/lib/geo";

export type MapPoint = { lat: number; lng: number; color: string; label?: string };

type Props = {
  zones: Zone[];
  picked?: [number, number] | null;
  onPick?: (lat: number, lng: number) => void;
  points?: MapPoint[];
};

const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898]; // Casablanca

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FitZones({ zones }: { zones: Zone[] }) {
  const map = useMap();
  const key = zones.map((z) => z.id).join();
  useEffect(() => {
    if (zones.length === 0) return;
    const bounds = zones
      .map((z) => latLng(z.lat, z.lng).toBounds(z.radius_m * 2))
      .reduce((acc, b) => acc.extend(b));
    map.fitBounds(bounds, { padding: [20, 20] });
    // Refit only when the set of zones changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export default function ZoneMap({ zones, picked, onPick, points = [] }: Props) {
  return (
    <MapContainer center={DEFAULT_CENTER} zoom={12} className="h-72 w-full rounded-2xl md:h-96">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitZones zones={zones} />
      {onPick && <ClickHandler onPick={onPick} />}
      {zones.map((z) => (
        <Circle
          key={z.id}
          center={[z.lat, z.lng]}
          radius={z.radius_m}
          pathOptions={{ color: zoneColor(z.id), fillOpacity: 0.15 }}
        >
          <Tooltip>{z.name}</Tooltip>
        </Circle>
      ))}
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: p.color, fillColor: p.color, fillOpacity: 0.9 }}
        >
          {p.label && <Tooltip>{p.label}</Tooltip>}
        </CircleMarker>
      ))}
      {picked && (
        <CircleMarker
          center={picked}
          radius={8}
          pathOptions={{ color: "#111827", fillColor: "#fbbf24", fillOpacity: 1, weight: 2 }}
        />
      )}
    </MapContainer>
  );
}
