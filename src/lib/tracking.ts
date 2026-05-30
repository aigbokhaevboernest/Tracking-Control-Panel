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
  switch (status) {
    case "Delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "In-Transit":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "On Hold":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Failed":
      return "bg-red-100 text-red-800 border-red-200";
    case "Returned To Warehouse":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "Pick-Up":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Arrived At Nearest Airport":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
