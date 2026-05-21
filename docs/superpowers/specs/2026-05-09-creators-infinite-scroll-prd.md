# PRD: Creators Infinite Scroll (TanStack Query)

## Document Control
- Product: `zexy_fan_web_app`
- Feature: Creators listing infinite scroll
- Date: 2026-05-09
- Status: Draft for implementation

## 1) Problem Statement
The current creators listing fetches creators as a single payload. This does not scale well for large creator inventories and can cause:
- Slow initial load time
- Higher memory usage on mobile devices
- Poor perceived performance as dataset grows

We need production-grade infinite scroll behavior using TanStack Query with predictable API contracts, robust error handling, and smooth UX.

## 2) Goals
- Show first page quickly with creators list.
- Load additional pages automatically on scroll.
- Default page size target: 40 creators per page.
- Maintain existing search/filter behavior with pagination compatibility.
- Keep scroll stable and avoid duplicates/flicker across page loads.
- Support production observability and safe rollout.

## 3) Non-Goals
- Redesigning creator card UI.
- Introducing server-side rendering for creators list in this iteration.
- Adding advanced list virtualization in v1 (can be phase 2 if needed).

## 4) Success Metrics
- P50 time-to-first-visible-creators under current baseline by at least 30%.
- API payload per request bounded to page size.
- Zero duplicate creator cards while paginating.
- Pagination error recovery rate > 99% via retry/manual retry.
- No regression in existing filters/search behavior.

## 5) User Experience Requirements
- Initial load:
  - Fetch page 1 with 40 creators.
  - Show skeleton cards while first page is loading.
- On scroll near bottom:
  - Fetch next page automatically.
  - Show inline loading indicator at list bottom.
- End of list:
  - Show subtle “No more creators” indicator.
- Error states:
  - First page error: full empty/error placeholder with retry.
  - Next page error: inline retry at bottom; already loaded pages remain visible.
- Pull-to-refresh/manual refresh (future): should reset to page 1 cleanly.

## 6) Technical Approach

### 6.1 Recommended Pagination Contract (Backend)
Use cursor pagination for consistency and stability under inserts/updates.

Endpoint:
- `GET /api/v1/fan/creators?limit=40&cursor=<opaque>&search=<q>&city=<v>&gender=<v>&category=<v>`

Response shape:
```json
{
  "data": {
    "items": [],
    "nextCursor": "opaque_cursor_or_null",
    "hasMore": true
  }
}
```

Rules:
- `limit` max: 40 (server-enforced upper bound to protect DB/API).
- Stable sort key required (e.g., `created_on DESC, id DESC`).
- Cursor must encode sort boundary, not page number.
- `hasMore=false` and `nextCursor=null` means end reached.

### 6.2 Frontend Query Strategy (TanStack)
Use `useInfiniteQuery` in place of single `useQuery`.

Core behavior:
- `initialPageParam: null`
- `queryFn` calls paginated API with `{ cursor, limit: 40, filters... }`
- `getNextPageParam` returns `lastPage.nextCursor` when `hasMore=true`
- flatten: `pages.flatMap(p => p.items)`

Recommended TanStack settings:
- `staleTime: 30_000` (or tuned per product)
- `gcTime: 5 * 60_000`
- `retry: 2` for page fetches
- `refetchOnWindowFocus: false` for mobile UX stability

### 6.3 Scroll Trigger
Use `IntersectionObserver` sentinel at list end:
- Trigger `fetchNextPage()` when sentinel intersects and `hasNextPage && !isFetchingNextPage`.
- Avoid scroll event listeners unless needed for fallback.

### 6.4 Filters + Search Compatibility
- Query key includes filters/search:
  - `['creators', 'infinite', { search, city, gender, category }]`
- Changing any filter resets pagination and starts from page 1.
- Debounce search input (250–400ms recommended).

### 6.5 Data Integrity Guarantees
- Deduplicate creators by `id` when flattening pages (defensive).
- Preserve loaded pages while next page loads.
- Avoid race conditions by guarding multiple `fetchNextPage` calls.

## 7) API + Data Model Changes

### Existing
- `feedService.getCreators(): Promise<Creator[]>`
- `useCreators()` uses single `useQuery`.

### Proposed
- `feedService.getCreatorsPage(params): Promise<{ items: Creator[]; nextCursor: string | null; hasMore: boolean }>`
- `useInfiniteCreators(filters)` using `useInfiniteQuery`.

Backward compatibility:
- Keep old `getCreators` temporarily until migration complete.

## 8) Performance & Production Considerations
- Page size:
  - Default 40 creators.
  - TanStack does not require 40 specifically; tune via real metrics if 20/30 yields better p95.
- Render cost:
  - Use memoized card components where needed.
  - Consider list virtualization if creator count grows very high.
- Network:
  - Keep response minimal (only fields required for listing).
- Security:
  - Validate/sanitize filter inputs server-side.
  - Enforce max limit on API.

## 9) Observability
- Frontend events:
  - `creators_page_loaded` with page size and latency
  - `creators_next_page_requested`
  - `creators_next_page_failed`
- Backend metrics:
  - latency by endpoint
  - DB query time
  - records returned
  - error rate by filter combination

## 10) Rollout Plan
1. Implement paginated endpoint in API (cursor-based).
2. Add new client service method and hook (`useInfiniteCreators`).
3. Wire creators page to infinite hook behind feature flag.
4. A/B internal testing (old list vs infinite).
5. Enable for all users after monitoring error/latency.

## 11) Testing Strategy
- Unit:
  - `getNextPageParam` behavior
  - filter reset behavior
  - deduplication logic
- Integration:
  - initial load + next page append
  - end-of-list handling
  - inline retry on next page failure
- E2E:
  - scroll loads additional creators
  - filter change resets list and reloads from page 1
  - no duplicate cards

## 12) Acceptance Criteria
- First page loads 40 creators (or fewer if unavailable).
- Scrolling near bottom appends next page seamlessly.
- Filters/search work with infinite pagination.
- No duplicate cards across pages.
- Footer/header and existing page structure remain stable.
- Error and end states are clearly visible and actionable.

## 13) Risks & Mitigations
- Risk: duplicate creators due to unstable ordering.
  - Mitigation: stable sort + cursor boundary + frontend dedupe.
- Risk: over-fetch on fast scroll.
  - Mitigation: in-flight guard + observer throttling behavior.
- Risk: filter/search API latency spikes.
  - Mitigation: indexing strategy and query monitoring.

## 14) Recommendation
Proceed with cursor-based backend pagination + TanStack `useInfiniteQuery` in frontend as the production-grade approach.  
Use 40 as initial limit, then tune using production telemetry.
