import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDistance, withColors } from "../lib/geo.ts";
import { formatMoney } from "../lib/settings.ts";

test("formatMoney per currency", () => {
  assert.equal(formatMoney(6.5, "MAD"), "6.50 MAD");
  assert.equal(formatMoney(6.5, "USD"), "$6.50");
  assert.equal(formatMoney(6.5, "EUR"), "€6.50");
});

test("formatDistance switches to km at 1000 m", () => {
  assert.equal(formatDistance(999.4), "999 m");
  assert.equal(formatDistance(2345), "2.3 km");
});

test("withColors gives distinct colors by position and wraps the palette", () => {
  const zones = withColors(Array.from({ length: 9 }, (_, i) => ({ id: String(i) })));
  assert.notEqual(zones[0].color, zones[1].color);
  assert.equal(zones[8].color, zones[0].color);
});
