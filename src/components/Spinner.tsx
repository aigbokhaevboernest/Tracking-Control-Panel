import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600",
        className,
      )}
    />
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </div>
  );
}

export function CenteredSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-center justify-center py-10", className)}>
      <Spinner />
    </div>
  );
}
