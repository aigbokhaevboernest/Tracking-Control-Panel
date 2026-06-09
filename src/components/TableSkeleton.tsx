import { Skeleton } from "@/components/ui/skeleton";

export function TableRowSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="bg-gray-100 border-t border-white">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-6">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
