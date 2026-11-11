import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5" aria-busy="true">
      <Skeleton className="h-9 w-36 rounded-xl" />

      <section className="card-glow space-y-4 rounded-3xl border border-border p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </section>

      <section className="card-glow space-y-3 rounded-3xl border border-border p-5">
        <Skeleton className="h-5 w-32 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </section>

      <section className="card-glow space-y-3 rounded-3xl border border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-3"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
        ))}
      </section>
    </div>
  );
}
