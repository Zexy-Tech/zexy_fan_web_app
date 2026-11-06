# 🏗️ Zexy Fan Web App - Architecture Documentation

## 📋 Overview

Production-grade Next.js 14 fan application following strict architectural patterns for scalability and maintainability.

## 🎯 Architecture Rules (ENFORCED)

### Layer Separation

```
services/  → ONLY API calls (axios)
hooks/     → ONLY React Query logic
components/ → ONLY UI rendering (NO fetching)
```

### Data Flow

```
User Action → Hook → Service → API → Hook → Component
```

## 📁 Folder Structure

```
zexy_fan_web_app/
├── app/
│   ├── (auth)/
│   │   └── login/              # OTP authentication
│   ├── (main)/
│   │   ├── feed/               # Content feed
│   │   ├── creator/[id]/       # Creator profile
│   │   ├── content/[id]/       # Content detail
│   │   ├── messages/           # Messaging
│   │   ├── subscriptions/      # Active subscriptions
│   │   └── profile/            # User profile
│   ├── layout.tsx              # Root layout
│   ├── providers.tsx           # React Query + Auth providers
│   └── globals.css             # Tailwind styles
│
├── services/                   # API Layer (NO React)
│   ├── auth.ts                 # Authentication API
│   ├── feed.ts                 # Feed & creators API
│   ├── content.ts              # Content API
│   ├── payment.ts              # Payment API
│   ├── subscriptions.ts        # Subscriptions API
│   └── messages.ts             # Messaging API
│
├── hooks/                      # React Query Layer
│   ├── useAuth.tsx             # Auth context + hooks
│   ├── useFeed.ts              # Feed queries
│   ├── useContent.ts           # Content queries
│   ├── usePayment.ts           # Payment mutations
│   ├── useSubscriptions.ts     # Subscription queries
│   └── useMessages.ts          # Message queries
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── layout/                 # Header, BottomNav
│   ├── feed/                   # ContentCard
│   ├── content/                # PaymentModal
│   └── common/                 # Shared components
│
├── lib/
│   ├── axios.ts                # Axios instance + interceptors
│   ├── queryClient.ts          # React Query config
│   └── utils.ts                # Utility functions
│
└── constants/
    └── env.ts                  # Environment variables
```

## 🔌 API Integration

### Mock Mode (Default)

All services have built-in mock responses for development:

```typescript
if (ENV.IS_MOCK) {
  await sleep(800); // Simulate network delay
  return MOCK_DATA;
}
```

### Real API Mode

Set `NEXT_PUBLIC_USE_MOCK=false` in `.env.local` to connect to real backend.

### API Endpoints Mapped

```
Auth:
- POST /api/v1/auth/otp/send
- POST /api/v1/auth/otp/verify
- GET  /api/v1/auth/me

Feed:
- GET  /api/v1/fan/creators
- GET  /api/v1/fan/feed
- GET  /api/v1/fan/content/{creator_id}

Content:
- GET  /api/v1/fan/content/{id}/detail
- POST /api/v1/common/content/{id}/unlock-after-payment

Payment:
- POST /api/v1/common/payments/create-intent
- POST /api/v1/common/payments/verify

Subscriptions:
- GET  /api/v1/fan/creators/{id}/subscriptions
- GET  /api/v1/fan/subscriptions
- POST /api/v1/fan/subscriptions/{id}/cancel

Messages:
- GET  /api/v1/fan/messages/conversations
- GET  /api/v1/fan/messages/thread/{creator_id}
- POST /api/v1/fan/messages/send
- POST /api/v1/common/messages/{id}/read
```

## 💰 Monetization Flows

### 1. Content Unlock Flow

```
User clicks "Unlock" → PaymentModal opens
→ createIntent() → Razorpay modal (simulated)
→ verifyPayment() → unlockContent()
→ Redirect to content page
```

### 2. Subscription Flow

```
User clicks "Subscribe" → createIntent(purpose: 'subscription')
→ Razorpay payment → verifyPayment()
→ Backend creates fan_creator_subscription_mapping
→ User can access membership content
```

### 3. Tip Flow

```
User sends tip → createIntent(purpose: 'tip')
→ Razorpay payment → verifyPayment()
→ Backend creates tip record
→ Creator receives notification
```

## 🎨 UI/UX Patterns

### Dark Premium Theme

- Dark mode by default
- Purple-to-pink gradients for creator avatars
- Clean card-based layouts
- Smooth transitions

### Loading States

Every data-fetching component shows:
- Spinner during load
- Error message on failure
- Empty state when no data

### Mobile-First

- Bottom navigation on mobile
- Responsive grid layouts
- Touch-friendly interactions

## 🔒 Authentication

### OTP Flow

```
1. User enters mobile number
2. Backend sends OTP (mock: any 4 digits work)
3. User enters OTP
4. Backend returns access_token + refresh_token
5. Token stored in localStorage
6. Auto-logout on 401/403
```

### Session Management

- Access token in localStorage
- Axios interceptor adds token to requests
- Auto-redirect to /login on auth errors
- Session expiry event handling

## 🧪 Testing Strategy

### Mock API

All services have realistic mock data:
- Simulated network delays (600-1200ms)
- Realistic data shapes matching backend
- Error states for testing

### Manual Testing Checklist

- [ ] Login with any mobile + 4-digit OTP
- [ ] View feed with locked/unlocked content
- [ ] Click locked content → payment modal
- [ ] Complete payment flow (simulated)
- [ ] View unlocked content
- [ ] Navigate to creator profile
- [ ] View subscriptions
- [ ] View messages
- [ ] Logout

## 🚀 Deployment

### Environment Variables

```bash
# Production
NEXT_PUBLIC_API_BASE_URL=https://api.zexy.live
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx

# Development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Build Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```

## ✅ Architecture Compliance

### ✅ Services Layer
- ✅ Only API calls (axios)
- ✅ No React hooks
- ✅ Mock data for development
- ✅ Realistic delays

### ✅ Hooks Layer
- ✅ Only React Query logic
- ✅ Returns { data, isLoading, error, refetch }
- ✅ No direct API calls
- ✅ Cache invalidation on mutations

### ✅ Components Layer
- ✅ Only UI rendering
- ✅ No API calls
- ✅ No business logic
- ✅ Props-driven

## 🔄 Ready for Real API

### Zero Rewrite Required

1. Set `NEXT_PUBLIC_USE_MOCK=false`
2. Update `NEXT_PUBLIC_API_BASE_URL`
3. All services automatically use real API
4. Same data shapes, same flows

### Backend Integration Checklist

- [ ] Backend running on configured URL
- [ ] CORS enabled for frontend domain
- [ ] JWT tokens working
- [ ] All endpoints returning expected shapes
- [ ] Razorpay keys configured

## 📊 Performance

- React Query caching (5min stale time)
- Optimistic updates on mutations
- Automatic refetching on window focus (disabled)
- Request deduplication

## 🎯 Next Steps

1. **WebRTC Integration** - Live streaming
2. **Real-time Messaging** - Socket.io
3. **Push Notifications** - FCM
4. **Offline Support** - Service workers
5. **Analytics** - User behavior tracking
