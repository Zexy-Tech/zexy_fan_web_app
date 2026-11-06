/**
 * Instant placeholder shown by the route-group loading.tsx files while a page's code/data arrives.
 * Server component, no JS: it paints immediately on tap and lets Next prefetch dynamic routes up to here.
 */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl animate-pulse space-y-4 px-4 py-5" aria-busy="true" aria-label="Loading">
      <div className="h-10 w-full rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[3/4] rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
