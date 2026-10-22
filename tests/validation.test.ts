import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isUuid, parseOrder, parseProduct, parseSettings, parseZone } from "../lib/validation.ts";

const ZONE_ID = "b64fe7d2-bdac-49d7-8565-bc558d16ab43";
const PRODUCT_ID = "0f8fad5b-d9cb-469f-a165-70867728950e";

function form(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) for (const item of [v].flat()) fd.append(k, item);
  return fd;
}

describe("isUuid", () => {
  test("accepts UUIDs and rejects anything else", () => {
    assert.equal(isUuid(ZONE_ID), true);
    assert.equal(isUuid("1,2)"), false);
    assert.equal(isUuid(""), false);
  });
});

describe("parseZone", () => {
  test("valid zone", () => {
    const r = parseZone(form({ name: " Maarif ", radius_m: "2500", lat: "33.57", lng: "-7.63" }));
    assert.deepEqual(r.data, { name: "Maarif", radius_m: 2500, lat: 33.57, lng: -7.63 });
  });
  test("missing center is rejected", () => {
    assert.match(parseZone(form({ name: "A", radius_m: "100", lat: "", lng: "" })).error!, /map/);
  });
  test("non-positive or huge radius is rejected", () => {
    assert.ok(parseZone(form({ name: "A", radius_m: "0", lat: "1", lng: "1" })).error);
    assert.ok(parseZone(form({ name: "A", radius_m: "200000", lat: "1", lng: "1" })).error);
  });
  test("out-of-range coordinates are rejected", () => {
    assert.ok(parseZone(form({ name: "A", radius_m: "100", lat: "91", lng: "0" })).error);
  });
});

describe("parseProduct", () => {
  const base = { name: "Water", price: "6.499", quantity: "10", zone_ids: [ZONE_ID, ZONE_ID, "bad-id"] };

  test("valid product: price rounded to cents, zone ids de-duplicated, junk ids dropped", () => {
    const r = parseProduct(form(base), { requireName: true });
    assert.deepEqual(r.data, { name: "Water", price: 6.5, quantity: 10, zoneIds: [ZONE_ID] });
  });
  test("name is required only on create", () => {
    assert.ok(parseProduct(form({ ...base, name: "" }), { requireName: true }).error);
    assert.ok(parseProduct(form({ ...base, name: "" }), { requireName: false }).data);
  });
  test("negative price, fractional quantity and no zones are rejected", () => {
    assert.ok(parseProduct(form({ ...base, price: "-1" }), { requireName: true }).error);
    assert.ok(parseProduct(form({ ...base, quantity: "1.5" }), { requireName: true }).error);
    assert.match(parseProduct(form({ ...base, zone_ids: [] }), { requireName: true }).error!, /zone/);
  });
});

describe("parseOrder", () => {
  const base = { product_id: PRODUCT_ID, quantity: "2", lat: "33.5", lng: "-7.6" };

  test("valid order", () => {
    assert.deepEqual(parseOrder(form(base), { maxQuantity: 50 }).data, {
      productId: PRODUCT_ID,
      quantity: 2,
      lat: 33.5,
      lng: -7.6,
    });
  });
  test("quantity above the configured maximum is rejected", () => {
    assert.match(parseOrder(form({ ...base, quantity: "51" }), { maxQuantity: 50 }).error!, /limited to 50/);
  });
  test("zero quantity, bad product id and missing location are rejected", () => {
    assert.ok(parseOrder(form({ ...base, quantity: "0" }), { maxQuantity: 50 }).error);
    assert.ok(parseOrder(form({ ...base, product_id: "x" }), { maxQuantity: 50 }).error);
    assert.ok(parseOrder(form({ ...base, lat: "" }), { maxQuantity: 50 }).error);
  });
});

describe("parseSettings", () => {
  const base = {
    currency: "EUR",
    low_stock_threshold: "5",
    max_order_quantity: "20",
    zone_strategy: "smallest",
    edge_tolerance_m: "150",
  };

  test("valid settings", () => {
    assert.deepEqual(parseSettings(form(base)).data, {
      currency: "EUR",
      low_stock_threshold: 5,
      max_order_quantity: 20,
      zone_strategy: "smallest",
      edge_tolerance_m: 150,
    });
  });
  test("only MAD, USD and EUR are allowed", () => {
    assert.match(parseSettings(form({ ...base, currency: "GBP" })).error!, /MAD, USD, EUR/);
  });
  test("unknown strategy and out-of-range tolerance are rejected", () => {
    assert.ok(parseSettings(form({ ...base, zone_strategy: "random" })).error);
    assert.ok(parseSettings(form({ ...base, edge_tolerance_m: "6000" })).error);
    assert.ok(parseSettings(form({ ...base, max_order_quantity: "0" })).error);
  });
});
