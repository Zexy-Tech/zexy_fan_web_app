# PRD: Fan Web App — Real API Integration

**Feature ID:** `002-fan-real-api-integration`  
**Created:** 2026-05-19  
**Status:** Draft (awaiting grill sign-off)  
**Repos:** `zexy_api` (source of truth), `zexy_fan_web_app` (consumer)  
**Principle:** Backend field names, paths, and response shapes win. Frontend types, services, and UI adapt.

---

## 1. Problem

The fan web app mixes three integration modes:

| Mode | What happens |
|------|----------------|
| `NEXT_PUBLIC_USE_MOCK=true` | Auth, profile, content detail, Q&A short-circuit to in-memory mocks |
| Always-real + UI simulation | Feed, messages, payments call API; checkout uses fake `pay_mock_*` / `pay_web_*` IDs |
| Hardcoded demo | Categories, saved content, membership list fallback, empty-plan upsell |

Backend APIs exist for most fan flows but responses use **snake_case** at the root (`creator_id`, `action_buttons`) while some frontend types use **camelCase** (`creatorId`, `actionButtons`). Several frontend paths **do not exist** on the backend or use the wrong HTTP method/path.

Goal: one spec-backed integration plan — implement what exists, fix mismatches, build missing APIs only where product requires them.

---

## 2. Integration matrix

Legend: **READY** = backend exists, frontend fix only · **PARTIAL** = backend exists, gaps on one side · **STUB** = backend stub/empty · **MISSING-BE** = backend endpoint needed · **MISSING-FE** = frontend not wired · **MOCK-ONLY** = frontend mock/hardcoded only

### 2.1 Authentication & sessions

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Send OTP | `POST /api/v1/auth/otp/send` | `authService.sendOTP` | READY | Remove `IS_MOCK` branch; keep types (`mobile`, `role`) |
| Verify OTP | `POST /api/v1/auth/otp/verify` | `authService.verifyOTP` | READY | Same |
| PIN setup/login/reset | `/api/v1/auth/pin/*` | `authService.*` | READY | Same |
| Current user | `GET /api/v1/auth/me` | `getMe` | READY | Align `AuthUserResponse` fields |
| Logout | `POST /api/v1/sessions/logout` | `logout` | READY | — |
| Onboarding status/step | `/api/v1/auth/onboarding/*` | Not wired in fan app | MISSING-FE | Add if onboarding UI needs it |
| Delete account | `POST /common/profile/send-deletion-otp` + `verify-deletion-otp` | `DELETE /api/v1/auth/account` | **BROKEN** | **FE:** switch to profile deletion OTP flow (no `/auth/account`) |

### 2.2 Fan profile & settings

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Get/update profile | `GET/PUT /api/v1/common/profile` | `commonProfileService` | READY | Remove `IS_MOCK`; use `ProfileResponse` snake_case |
| Avatar upload | `POST /common/profile/avatar` | Not wired | MISSING-FE | Wire edit-profile if in scope |
| Settings language | `GET/PATCH /common/settings` | settings page partial | PARTIAL | Align `language` field |
| Role switch creator | `POST /common/profile/role/creator` | switch-to-creator page | PARTIAL | Verify wired |
| Account deactivation OTP | `/common/profile/send-deactivation-otp` | — | MISSING-FE | Out of scope unless settings needs it |

### 2.3 Creators & discovery

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| List creators (paginated) | `GET /fan/creators` → `{ data, total, has_more, next_cursor }` | `getCreators()` expects flat array | **BROKEN** | **FE:** use `getCreatorsPage` everywhere or fix `getCreators` |
| Creator detail | `GET /fan/creators/{identifier}` | `getCreatorByUsername` | READY | Response wrapped in `{ data }` — verify unwrap |
| Creator content | `GET /fan/creators/{id}/content` | `getCreatorContentByUsername` | READY | — |
| Creator products | `GET /fan/creators/{id}/products` | `getCreatorProductsByUsername` | READY | — |
| Profile config | `GET /fan/creators/{id}/profile-config` → snake_case root | `CreatorProfileConfig` camelCase | **BROKEN** | **FE:** map `creator_id`→display layer or rename types to snake_case |
| Intro greeting | Not in `IntroConfig` schema | `intro.greeting` required in UI | **BROKEN** | **Decision:** derive greeting from `creator.name` on FE, or **BE:** add optional `greeting` |
| Categories browse | Filter `?category=` on list endpoint | Hardcoded `creatorCategories.ts` | PARTIAL | **FE:** use API `category` query; remove demo grid or keep as empty-state only |
| Q&A list | `GET /fan/creators/{id}/qa` (stub empty) | `qaService.getQAItems` + mocks | STUB | **BE:** replace stub with real list response · **FE:** snake_case `created_at`, remove mock |
| Q&A submit | No `POST /fan/creators/{id}/qa` endpoint | `qaService.submitQuestion` posts to missing path | MISSING-BE | **BE:** add submit endpoint before removing submit mock, or hide submit UI |

### 2.4 Feed & content

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Home feed | `GET /fan/feed` | `getFeed` | READY | `ContentResponse` fields: `is_locked`, `creator_uid`, `media`, etc. |
| Content detail | `GET /fan/content/items/{id}` | `getContentDetail` | READY | Remove `IS_MOCK` |
| Signed media URL | `GET /fan/content/items/{id}/signed-url` (fan role) | Not wired in content page | MISSING-FE | Wire locked content playback |
| Unlock after payment | **Not in API** | `POST /common/content/{id}/unlock-after-payment` | **BROKEN** | **FE:** remove call; rely on `POST /fan/payments/verify` side effects |
| Content pay intent | `purpose: content` on create-intent | payment modal | PARTIAL | Verify `reference_id` = content id |

### 2.5 Subscriptions & membership

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Creator plans | `GET /fan/creators/{id}/subscriptions` | `getCreatorPlans` + demo fallback | PARTIAL | **FE:** remove demo fallback in prod; show empty state |
| My subscriptions | `GET /fan/subscriptions` → `FanSubscriptionResponse` | `ActiveSubscription` with extra display fields | **BROKEN** | **FE:** map minimal fields; join creator metadata via separate fetch or **BE:** enrich response |
| Subscribe (free/trial?) | `POST /fan/subscriptions/subscribe` | Not used (payment flow only) | PARTIAL | Document when to call vs payment-only |
| Payment intent | `POST /fan/payments/intents` `{ purpose, reference_id }` | `createSubscriptionIntent(planId)` | READY | `reference_id` = plan id ✓ |
| Verify payment | `POST /fan/payments/verify` | modals use `pay_mock_*` | PARTIAL | Wire `mock_checkout_url` when `MOCK_PAYMENTS` enabled |
| Activate subscription | `POST /fan/subscriptions/{id}/activate` — **path param ignored**; uses `gateway_order_id` only | passes plan id as path param | PARTIAL | **FE:** any int path ok today; document; optional cleanup |
| Cancel subscription | `DELETE /common/subscriptions/{id}` | `POST /fan/subscriptions/{id}/cancel` | **BROKEN** | **FE:** `DELETE` on common path; `id` = fan mapping id |

### 2.6 Payments & billing

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Create intent (alt path) | `POST /fan/payments/create-intent` | `paymentService.createIntent` | READY | Consolidate on one path (`intents` preferred) |
| Payment history | `GET /fan/payments` | `getHistory` | READY | — |
| Invoice PDF | `GET /fan/payments/transactions/{id}/invoice` | `downloadInvoice` | READY | — |
| Razorpay live checkout | Webhook + verify | Not wired | MISSING-FE | Phase 2+ |

### 2.7 Messages

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Conversations | `GET /fan/messages/conversations` | `getConversations` | READY | — |
| Thread | `GET /fan/messages/thread/{other_uid}` | `getThread` | READY | — |
| Send text | `POST /fan/messages/send` | `sendMessage` | READY | `{ receiver_uid, body }` |
| Send media | `POST /common/messages/media` | Not wired | MISSING-FE | Phase 2 if fan can send images |
| Mark read | `POST /common/messages/{id}/read` | `markAsRead` | READY | — |
| Signed DM media | `GET /common/messages/{id}/signed-media-url` | `getSignedMediaUrl` | READY | — |
| Tip demand pay | `POST /fan/messages/tip-demands/{id}/intents` | `createTipDemandIntent` + simulated pay | PARTIAL | Same checkout pattern as subscriptions |

### 2.8 Products, tips, live, activity

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Browse creator products | public on creator page | wired | READY | Purchase via `POST /fan/products/{id}/purchase` raises PAY_002 — use payment intent + `post_payment confirm` |
| Product confirm | `POST /fan/products/{id}/confirm` exists, but `POST /fan/payments/verify` already dispatches product side effects | Not wired | OPTIONAL | Prefer verify-first flow; wire confirm only if backend keeps it as required idempotency check |
| Tips history | `GET /fan/tips` | Not wired | MISSING-FE | Low priority |
| Live list/join | `/common/live/*` | Not in fan web app | MISSING-FE | Out of scope unless pages exist |
| Activity log | `GET /fan/activity` | `activityService` | READY | Event types fixed set on BE |

### 2.9 Saved content & notifications

| Capability | Backend | Frontend | Status | Action |
|------------|---------|----------|--------|--------|
| Saved/bookmarks | **No fan endpoint found** | `saved-content-view.tsx` hardcoded | MISSING-BE | **Decision:** build API or hide feature |
| Notification prefs | `/common/notifications/preferences` | Not wired | MISSING-FE | Phase 2 |
| FCM token | `PUT /common/notifications/fcm-token` | Not wired | MISSING-FE | Phase 2 |

---

## 3. Field naming contract (backend wins)

### 3.1 Must use on frontend (from API)

```ts
// Profile config (ProfileConfigData)
creator_id, action_buttons, bottom_nav, created_at, updated_at
// intro nested: bio, showAvatar, avatarStyle (camelCase nested — matches BE schema)
// theme nested: camelCase (matches BE)

// Content (ContentResponse)
creator_uid, creator_username, creator_name, creator_avatar, is_locked,
allowed_plan_ids, allowed_plan_names, media, media_urls, created_on

// Subscription mapping (FanSubscriptionResponse)
id, fan_uid, creator_uid, subscription_id, status, started_at, expires_at, created_at

// Message (MessageResponse)
sender_uid, receiver_uid, message_type, media_url, created_at, ...
```

### 3.2 Frontend-only fields to remove or compute client-side

| Frontend field | Resolution |
|----------------|------------|
| `intro.greeting` | Compute: `` `Hi, I'm ${creator.name}` `` or add BE field |
| `ActiveSubscription.creator_name`, `plan_name`, `monthly_amount`, counts | Fetch creator + plan by `creator_uid` / `subscription_id`, or BE enrichment |
| `CreatorProfileConfig.creatorId` | Use `creator_id` from API |
| `QAItem.createdAt` | Use `created_at` |
| Demo `DEMO_MEMBERSHIP_*`, `MOCK_*` arrays | Delete for production integration |

---

## 4. Phased delivery (proposed)

### Phase 1 — Fix broken wires (no new backend)

- Remove `IS_MOCK` for auth, profile, content (env default false)
- Fix creators pagination, profile-config snake_case mapping
- Fix subscription cancel method/path; remove unlock-after-payment
- Fix delete-account → OTP deletion flow
- Payment: use `mock_checkout_url` from intent response
- Remove dead mock constants; demo fallbacks behind explicit dev flag only

### Phase 2 — Complete fan UX on existing APIs

- Signed content URL for locked media playback
- Product purchase verify-first flow; optional confirm call only if backend makes it required
- Media messages (common API)
- Settings language PATCH
- Enriched membership list (FE join or BE aggregate endpoint)

### Phase 3 — New backend + features

- Q&A implementation (currently stub)
- Saved content API + FE
- Categories: optional dedicated taxonomy endpoint
- Razorpay live checkout
- Notifications / FCM

---

## 5. Open decisions (grill queue)

1. **Phase 1 scope** — which domains in first implementation sprint?
2. **Membership list enrichment** — frontend N+1 fetch vs new `GET /fan/subscriptions?include=creator,plan`?
3. **Intro greeting** — client-derived vs new backend field?
4. **Saved content** — build API, hide UI, or static placeholder?
5. **Demo fallbacks** — delete entirely vs `NEXT_PUBLIC_DEV_DEMO=true`?
6. **Payment checkout** — mock-only Phase 1 vs Razorpay in Phase 1?

---

## 6. Success criteria

- `NEXT_PUBLIC_USE_MOCK=false` + local API: login, profile, feed, creator page, subscribe (mock pay), messages work without console 404s
- Zero calls to non-existent endpoints (`/auth/account`, `/unlock-after-payment`, wrong cancel path)
- ESLint + typecheck pass; services use backend field names or explicit mappers in one module (`lib/api-mappers.ts`)
- Task list in `tasks.md` tracks each file change

---

## 7. References

| Area | Backend | Frontend |
|------|---------|----------|
| Fan routes | `zexy_api/app/api/v1/fan/` | `services/*.ts` |
| Schemas | `zexy_api/app/schemas/` | `types/`, service interfaces |
| Mock gate | — | `constants/env.ts` `IS_MOCK` |
| Payment POC | `zexy_api/specs/001-payment-poc-foundation/` | `specs/001-fan-payment-ui/` |
