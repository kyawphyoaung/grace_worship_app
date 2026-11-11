import { Skeleton } from "@/components/ui/skeleton";

export default function BibleLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-11 w-44 rounded-xl" />
      </div>

      <div className="grid grid-cols-5 gap-1 rounded-2xl border border-border/70 bg-card/50 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-xl" />
        ))}
      </div>

      <div className="card-glow flex flex-wrap items-center gap-3 rounded-2xl border border-border p-4">
        <Skeleton className="h-11 w-36 rounded-xl" />
        <Skeleton className="h-11 w-24 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>

      <div className="card-glow space-y-4 rounded-2xl border border-border p-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-8 rounded-full" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-[92%] rounded-lg" />
            <Skeleton className="h-4 w-4/5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
