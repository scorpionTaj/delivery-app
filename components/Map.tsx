"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`, so it must only load in the browser.
const Map = dynamic(() => import("./ZoneMap"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-2xl bg-default md:h-96" />,
});

export default Map;
