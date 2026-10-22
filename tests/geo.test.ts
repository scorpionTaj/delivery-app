import assert from "node:assert/strict";
import { test } from "node:test";
import { findZone, haversine, type Zone } from "../lib/geo.ts";

const maarif: Zone = { id: "a", name: "Maarif", lat: 33.5731, lng: -7.6298, radius_m: 2000 };
const center: Zone = { id: "b", name: "Center", lat: 33.5731, lng: -7.6098, radius_m: 3000 };

test("haversine: Casablanca → Rabat is about 87 km", () => {
  const d = haversine(33.5731, -7.5898, 34.0209, -6.8416);
  assert.ok(Math.abs(d - 87_000) < 2_000, `got ${d}`);
});

test("haversine: same point is 0", () => {
  assert.equal(haversine(33.5, -7.6, 33.5, -7.6), 0);
});

test("point inside a zone is accepted", () => {
  const r = findZone(33.574, -7.63, [maarif]);
  assert.equal(r.zone?.id, "a");
});

test("point inside two zones picks the nearest center", () => {
  const r = findZone(33.5731, -7.627, [center, maarif]);
  assert.equal(r.zone?.id, "a");
});

test("point outside every zone is rejected with the gap to the nearest edge", () => {
  const r = findZone(33.5731, -7.7, [maarif]);
  assert.equal(r.zone, null);
  assert.ok(!r.zone && r.outsideBy !== null && r.outsideBy > 4000 && r.outsideBy < 5000);
});

test("'smallest' strategy prefers the tighter zone over the nearer center", () => {
  const big: Zone = { id: "big", name: "Big", lat: 33.5731, lng: -7.627, radius_m: 5000 };
  const r = findZone(33.5731, -7.627, [big, maarif], { strategy: "smallest" });
  assert.equal(r.zone?.id, "a");
});

test("edge tolerance accepts a point just outside the radius", () => {
  // ~300 m outside Maarif's 2 km edge.
  const lng = -7.6298 + 2300 / (111_320 * Math.cos((33.5731 * Math.PI) / 180));
  assert.equal(findZone(33.5731, lng, [maarif]).zone, null);
  assert.equal(findZone(33.5731, lng, [maarif], { toleranceM: 500 }).zone?.id, "a");
});

test("no zones means no match", () => {
  const r = findZone(33.5, -7.6, []);
  assert.deepEqual(r, { zone: null, outsideBy: null });
});
