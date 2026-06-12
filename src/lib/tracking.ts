export function generateTrackingNumber(): string {
  let n = "";
  for (let i = 0; i < 9; i++) n += Math.floor(Math.random() * 10);
  return `TRK${n}`;
}

export type TransportMode = "land" | "air" | "sea";

export const LAND_STATUSES = [
  "Origin Warehouse",
  "In-Transit",
  "On Hold",
  "Arrived At Depot",
  "Pick-Up",
  "Delivered",
  "Failed",
  "Returned To Warehouse",
] as const;

export const AIR_STATUSES = [
  "Origin Airport",
  "Departed",
  "In Flight",
  "On Hold",
  "Arrived At Nearest Airport",
  "Pick-Up",
  "Delivered",
  "Failed",
  "Returned To Origin",
] as const;

export const SEA_STATUSES = [
  "Origin Port",
  "Departed Port",
  "At Sea",
  "On Hold",
  "Arrived At Destination Port",
  "Pick-Up",
  "Delivered",
  "Failed",
  "Returned To Origin",
] as const;

export function statusesForMode(mode?: string | null): readonly string[] {
  const m = (mode ?? "land").toLowerCase();
  if (m === "air") return AIR_STATUSES;
  if (m === "sea") return SEA_STATUSES;
  return LAND_STATUSES;
}

export const TRANSPORT_MODES: { value: TransportMode; emoji: string; label: string }[] = [
  { value: "land", emoji: "🚛", label: "Land" },
  { value: "air",  emoji: "✈️", label: "Air" },
  { value: "sea",  emoji: "🌊", label: "Sea" },
];

export function transportEmoji(mode?: string | null): string {
  const m = (mode ?? "land").toLowerCase();
  if (m === "air") return "✈️";
  if (m === "sea") return "🚢";
  return "🚛";
}

// Union of all statuses (deduped) — used by filters that need every option.
export const SHIPMENT_STATUSES = Array.from(
  new Set<string>([...LAND_STATUSES, ...AIR_STATUSES, ...SEA_STATUSES])
);

export type ShipmentStatus = string;

export function statusBadgeClass(status?: string | null) {
  const base = "inline-block rounded-full px-3 py-1 font-semibold whitespace-nowrap border-0 text-white";
  switch (status) {
    // Origin
    case "Origin Warehouse":
    case "Origin Airport":
    case "Origin Port":
      return `${base} bg-blue-700`;
    // Moving
    case "In-Transit":
    case "Departed":
    case "In Flight":
    case "Departed Port":
    case "At Sea":
      return `${base} bg-red-700`;
    // Hold
    case "On Hold":
      return `${base} bg-orange-500`;
    // Arrived hub
    case "Arrived At Nearest Airport":
    case "Arrived At Depot":
    case "Arrived At Destination Port":
      return `${base} bg-cyan-500 text-[10px]`;
    case "Pick-Up":
      return `${base} bg-blue-600`;
    case "Delivered":
      return `${base} bg-green-600`;
    case "Failed":
      return `${base} bg-gray-600`;
    case "Returned To Warehouse":
    case "Returned To Origin":
      return `${base} bg-gray-600 text-[10px]`;
    default:
      return `${base} bg-gray-500`;
  }
}
