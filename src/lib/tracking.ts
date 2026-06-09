export function generateTrackingNumber(): string {
  let n = "";
  for (let i = 0; i < 9; i++) n += Math.floor(Math.random() * 10);
  return `TRK${n}`;
}

export const SHIPMENT_STATUSES = [
  "Origin Warehouse",
  "In-Transit",
  "On Hold",
  "Arrived At Nearest Airport",
  "Pick-Up",
  "Delivered",
  "Failed",
  "Returned To Warehouse",
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export function statusBadgeClass(status?: string | null) {
  const base = "inline-block rounded-full px-3 py-1 font-semibold whitespace-nowrap border-0 text-white";
  switch (status) {
    case "Origin Warehouse":
      return `${base} bg-blue-700`;
    case "In-Transit":
      return `${base} bg-red-700`;
    case "On Hold":
      return `${base} bg-orange-500`;
    case "Arrived At Nearest Airport":
      return `${base} bg-cyan-500 text-[10px]`;
    case "Pick-Up":
      return `${base} bg-blue-600`;
    case "Delivered":
      return `${base} bg-green-600`;
    case "Failed":
      return `${base} bg-gray-600`;
    case "Returned To Warehouse":
      return `${base} bg-gray-600 text-[10px]`;
    default:
      return `${base} bg-gray-500`;
  }
}

