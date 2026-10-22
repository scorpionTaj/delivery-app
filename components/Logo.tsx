import { useId } from "react";

/** App mark: a delivery pin with a parcel inside. Same artwork as app/icon.svg. */
export default function Logo({ size = 32 }: { size?: number }) {
  // Unique per instance: a gradient defined inside a hidden (display:none) SVG doesn't render elsewhere.
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path d="M16 5.5c-4.4 0-8 3.5-8 7.9 0 5.6 8 13.1 8 13.1s8-7.5 8-13.1c0-4.4-3.6-7.9-8-7.9Z" fill="#fff" />
      <path d="M12.6 11.2 16 9.4l3.4 1.8v3.9L16 16.9l-3.4-1.8Z" fill="#4f46e5" />
      <path d="M12.6 11.2 16 13l3.4-1.8M16 13v3.9" stroke="#fff" strokeWidth="0.9" fill="none" strokeLinejoin="round" />
    </svg>
  );
}
