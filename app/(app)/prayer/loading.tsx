import { Skeleton } from "@/components/ui/skeleton";

export default function PrayerLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-11 w-11 rounded-xl" />
        </div>
      </div>

      <section className="card-glow space-y-3 rounded-3xl border border-primary/20 p-4 shadow-[0_0_32px_-18px_hsl(var(--primary)/0.45)]">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex justify-between gap-3">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-11 w-24 rounded-xl" />
        </div>
      </section>

      {Array.from({ length: 3 }).map((_, i) => (
        <section
          key={i}
          className="card-glow space-y-3 rounded-2xl border border-border p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
          </div>
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-8 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-full" />
          </div>
        </section>
      ))}
    </div>
  );
}
