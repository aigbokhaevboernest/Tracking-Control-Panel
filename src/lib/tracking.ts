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
    case "Origin Warehouse":
      return "bg-blue-700 text-white border-blue-700 whitespace-nowrap";
    case "In-Transit":
      return "bg-red-700 text-white border-red-700 whitespace-nowrap";
    case "On Hold":
      return "bg-orange-500 text-white border-orange-500 whitespace-nowrap";
    case "Arrived At Nearest Airport":
      return "bg-cyan-500 text-white border-cyan-500 whitespace-nowrap text-[10px]";
    case "Pick-Up":
      return "bg-blue-600 text-white border-blue-600 whitespace-nowrap";
    case "Delivered":
      return "bg-green-600 text-white border-green-600 whitespace-nowrap";
    case "Failed":
      return "bg-red-600 text-white border-red-600 whitespace-nowrap";
    case "Returned To Warehouse":
      return "bg-gray-600 text-white border-gray-600 whitespace-nowrap text-[10px]";
    default:
      return "bg-gray-500 text-white border-gray-500 whitespace-nowrap";
  }
}

