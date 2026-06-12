import { Skeleton } from "@/components/ui/skeleton";

export type SkeletonColType = "text" | "mono" | "emoji" | "badge" | "actions";

export function TableRowSkeleton({
  columns,
  rows = 5,
  colTypes,
}: {
  columns: number;
  rows?: number;
  /** Optional array describing each column's shape, e.g. ["mono","emoji","text","text","badge","text","text","text","text","actions"] */
  colTypes?: SkeletonColType[];
}) {
  const types: SkeletonColType[] =
    colTypes ?? Array.from({ length: columns }, () => "text");

  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="bg-gray-100 border-t border-white">
          {Array.from({ length: columns }).map((_, c) => {
            const type = types[c] ?? "text";
            return (
              <td key={c} className="px-4 py-6">
                {type === "mono" && <Skeleton className="h-4 w-20" />}
                {type === "emoji" && <Skeleton className="mx-auto h-5 w-5 rounded-full" />}
                {type === "badge" && <Skeleton className="h-6 w-24 rounded-full" />}
                {type === "actions" && (
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-9 w-[90px] rounded-md" />
                    <Skeleton className="h-9 w-[90px] rounded-md" />
                  </div>
                )}
                {type === "text" && <Skeleton className="h-4 w-full max-w-[140px]" />}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
