# Tasks: 002-fan-real-api-integration

**Spec:** [spec.md](./spec.md)  
**Rule:** Backend names/paths win. Check off in order within each phase unless noted parallel.

---

## Phase 0 — Spec sign-off

- [ ] T0.1 Grill decisions closed (see spec §5)
- [ ] T0.2 Confirm `NEXT_PUBLIC_USE_MOCK` default for dev/prod

---

## Phase 1 — Broken wires & mock removal

### Auth & account

- [ ] T1.1 `services/auth.ts` — remove `IS_MOCK` branches; keep snake_case request bodies
- [ ] T1.2 `services/auth.ts` — replace `DELETE /auth/account` with `send-deletion-otp` + `verify-deletion-otp` on `/common/profile`
- [ ] T1.3 `hooks/useAuth.tsx` + `profile/delete-account/page.tsx` — two-step OTP deletion UX
- [ ] T1.4 `constants/env.ts` / `.env.local.example` — document `USE_MOCK=false` for real API dev

### Profile

- [ ] T1.5 `services/commonProfile.ts` — remove `IS_MOCK`
- [ ] T1.6 Align `FanCommonProfile` type with `ProfileResponse` (snake_case)

### Feed & creators

- [ ] T1.7 `services/feed.ts` — fix `getCreators()` to return paginated shape or deprecate in favor of `getCreatorsPage`
- [ ] T1.8 `hooks/useFeed.ts` / `creators-grid.tsx` — use cursor pagination consistently
- [ ] T1.9 `services/feed.ts` — delete unused `MOCK_CREATORS`, `MOCK_CONTENT`
- [ ] T1.10 `services/creatorProfile.ts` — add mapper `mapProfileConfig(data: ProfileConfigData)` snake_case → UI types
- [ ] T1.11 `types/creator-profile.ts` — split API DTO vs UI model OR rename to snake_case
- [ ] T1.12 `components/creator-intro-section.tsx` — derive greeting from creator name if BE has no `greeting`

### Content

- [ ] T1.13 `services/content.ts` — remove `IS_MOCK`
- [ ] T1.14 `services/content.ts` — delete `unlockContent` / `unlock-after-payment` call; document verify-only unlock
- [ ] T1.15 `components/content/payment-modal.tsx` — after verify, refresh content detail only

### Subscriptions

- [ ] T1.16 `services/subscriptions.ts` — cancel: `DELETE /api/v1/common/subscriptions/{fan_mapping_id}`
- [ ] T1.17 `services/subscriptions.ts` — trim `ActiveSubscription` to BE fields + optional joined display type
- [ ] T1.18 `hooks/useResolvedSubscriptionRows.ts` — remove `DEMO_MEMBERSHIP_SUBSCRIPTIONS` fallback (or gate dev flag)
- [ ] T1.19 `services/subscriptions.ts` — remove `getDemoCreatorMembershipPlans` prod fallback; empty state UI

### Payments

- [ ] T1.20 `components/subscription-modal.tsx` — open `mock_checkout_url` from intent when present
- [ ] T1.21 `components/content/payment-modal.tsx` — same
- [ ] T1.22 `hooks/useMessages.ts` `usePayTipDemand` — reuse shared checkout helper
- [ ] T1.23 Add `lib/checkout.ts` — shared verify payload from mock checkout redirect/query

### Cleanup

- [ ] T1.24 Delete dead mocks in `services/messages.ts`, `services/creatorProfile.ts`
- [ ] T1.25 `services/qa.ts` — remove `IS_MOCK` but keep graceful empty until BE implements
- [ ] T1.26 Run `npm run lint` + manual smoke: login → creators → profile → subscribe (mock pay)

---

## Phase 2 — Complete existing API coverage

### Content playback

- [ ] T2.1 `services/content.ts` — add `getSignedContentUrl(contentId)`
- [ ] T2.2 `app/(main)/content/[id]/page.tsx` — fetch signed URL when `is_locked` false after sub

### Products

- [ ] T2.3 `services/payment.ts` or `products.ts` — `confirmProductPurchase(productId, gatewayOrderId)`
- [ ] T2.4 Wire product buy flow on creator profile shop section

### Messages

- [ ] T2.5 `services/messages.ts` — `sendMediaMessage` → `POST /common/messages/media`
- [ ] T2.6 Message composer UI for image upload (if in scope)

### Membership display

- [ ] T2.7 Implement `lib/subscription-display.ts` — join `FanSubscriptionResponse` + creator + plan fetches
- [ ] T2.8 `app/(main)/membership/page.tsx` — use joined rows

### Settings & categories

- [ ] T2.9 Settings language — `GET/PATCH /common/settings`
- [ ] T2.10 Categories pages — `GET /fan/creators?category=` instead of `creatorCategories.ts` demo

---

## Phase 3 — New backend work

### Backend (zexy_api)

- [ ] T3.1 Implement Q&A endpoints (replace stub in `fan/creators.py`)
- [ ] T3.2 Design + implement saved content endpoints (fan bookmarks)
- [ ] T3.3 Optional: `GET /fan/subscriptions?include=creator,plan` aggregate
- [ ] T3.4 Optional: `intro.greeting` on `IntroConfig`

### Frontend (after BE)

- [ ] T3.5 `services/qa.ts` — real list/submit, `created_at`
- [ ] T3.6 `saved-content-view.tsx` — wire saved API
- [ ] T3.7 Razorpay checkout (replace mock overlay)
- [ ] T3.8 Notification preferences + FCM token

---

## Verification checklist

- [ ] V1 No 404 on happy path with local API + seed data
- [ ] V2 `grep -r "IS_MOCK" services/` only qa dev stub if agreed
- [ ] V3 `grep -r "unlock-after-payment\|/auth/account"` returns empty in fan app
- [ ] V4 Subscription cancel succeeds against `DELETE /common/subscriptions/{id}`
- [ ] V5 Profile config renders action buttons + bottom nav from API
