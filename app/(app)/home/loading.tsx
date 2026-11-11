import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5" aria-busy="true">
      <section className="card-glow space-y-3 rounded-3xl border border-primary/20 p-5 shadow-[0_0_40px_-18px_hsl(var(--primary))]">
        <Skeleton className="h-5 w-11/12 rounded-lg" />
        <Skeleton className="h-5 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-3/5 rounded-lg" />
        <Skeleton className="mt-2 h-3 w-32 rounded-full" />
      </section>

      <section className="card-glow space-y-3 rounded-3xl border border-border p-5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-36 rounded-lg" />
        <Skeleton className="mt-2 h-11 w-40 rounded-xl" />
      </section>

      <section className="card-glow flex flex-col items-center gap-4 rounded-[1.75rem] border border-primary/25 px-5 py-7">
        <div className="flex items-center gap-4">
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-[72px] w-[72px] rounded-full" />
        </div>
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-12 w-24 rounded-xl" />
        <Skeleton className="h-3 w-40 rounded-lg" />
      </section>
    </div>
  );
}
