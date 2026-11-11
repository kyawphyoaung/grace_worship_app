import { Skeleton } from "@/components/ui/skeleton";

export default function WorshipLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
      </header>

      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="card-glow space-y-3 rounded-2xl border border-primary/15 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-40 rounded-lg" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-12 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
