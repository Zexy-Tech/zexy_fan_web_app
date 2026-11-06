# 💻 Zexy Fan Web App

## 📌 Project Overview

Production-grade Next.js 14 fan application for the Zexy creator monetization platform. Built with strict architectural patterns for scalability, maintainability, and seamless real API integration.

**Target User**: Fans / Content Consumers

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **HTTP Client**: Axios
- **Server State**: @tanstack/react-query
- **Icons**: Lucide React
- **Notifications**: Sonner

## ✨ Key Features

### ✅ Implemented Flows

1. **Authentication Flow** ✅
   - OTP-based login
   - Token management
   - Auto-logout on session expiry

2. **Feed Flow** ✅
   - Browse creator content
   - View locked/unlocked content
   - Navigate to creator profiles

3. **Content Unlock Flow** ✅
   - Click locked content
   - Payment modal with Razorpay simulation
   - Verify payment
   - Unlock and view content

4. **Subscription Flow** ✅
   - View creator subscription plans
   - Subscribe to creators
   - Manage active subscriptions

5. **Messaging Flow** ✅
   - View conversations
   - Send messages to creators
   - Real-time message updates

## 🏗 Architecture

### Strict Layer Separation

```
services/   → API calls ONLY (axios)
hooks/      → React Query logic ONLY
components/ → UI rendering ONLY (NO fetching)
```

### Data Flow

```
User Action → Hook → Service → API → Hook → Component
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Use mock API for development
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# For production
# NEXT_PUBLIC_USE_MOCK=false
# NEXT_PUBLIC_API_BASE_URL=https://api.zexy.live
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Login

- Enter any mobile number
- Enter any 4-digit OTP (mock mode accepts all)
- Explore the app!

## 📱 Features Walkthrough

### 1. Login
- OTP-based authentication
- Mobile number + 4-digit OTP
- Mock mode: any OTP works

### 2. Feed
- Browse content from all creators
- See locked (paid) and unlocked (free) content
- Click to view or unlock

### 3. Content Unlock
- Click locked content
- Payment modal opens
- Simulated Razorpay payment (2 seconds)
- Content unlocks automatically
- Redirect to content page

### 4. Creator Profile
- View creator's content
- See subscription plans
- Subscribe to creator

### 5. Subscriptions
- View active subscriptions
- See expiry dates
- Manage subscriptions

### 6. Messages
- View conversations
- Send messages to creators
- Real-time updates

### 7. Profile
- View user information
- Account status
- Logout

## 🔌 API Integration

### Mock Mode (Default)

All services have built-in mock responses:
- Realistic network delays (600-1200ms)
- Realistic data shapes
- Error states for testing

### Real API Mode

Set `NEXT_PUBLIC_USE_MOCK=false` to connect to real backend.

**Zero code changes required!**

## 💰 Monetization Flows

### Content Unlock
```
Locked Content → Payment Intent → Razorpay → Verify → Unlock
```

### Subscription
```
Creator Profile → Subscribe → Payment → Verify → Active Subscription
```

### Tips
```
Creator Profile → Send Tip → Payment → Verify → Tip Recorded
```

## 🎨 UI/UX

- **Dark Premium Theme** - Purple-to-pink gradients
- **Mobile-First** - Bottom navigation, responsive layouts
- **Loading States** - Spinners, error messages, empty states
- **Smooth Animations** - Transitions, hover effects

## 📂 Project Structure

```
zexy_fan_web_app/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Authentication
│   ├── (main)/             # Protected routes
│   │   ├── feed/           # Content feed
│   │   ├── creator/[id]/   # Creator profile
│   │   ├── content/[id]/   # Content detail
│   │   ├── messages/       # Messaging
│   │   ├── subscriptions/  # Subscriptions
│   │   └── profile/        # User profile
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # React Query + Auth
│
├── services/               # API Layer
│   ├── auth.ts
│   ├── feed.ts
│   ├── content.ts
│   ├── payment.ts
│   ├── subscriptions.ts
│   └── messages.ts
│
├── hooks/                  # React Query Layer
│   ├── useAuth.tsx
│   ├── useFeed.ts
│   ├── useContent.ts
│   ├── usePayment.ts
│   ├── useSubscriptions.ts
│   └── useMessages.ts
│
├── components/             # UI Layer
│   ├── ui/                 # shadcn/ui
│   ├── layout/             # Header, BottomNav
│   ├── feed/               # ContentCard
│   └── content/            # PaymentModal
│
├── lib/                    # Utilities
│   ├── axios.ts            # HTTP client
│   ├── queryClient.ts      # React Query config
│   └── utils.ts            # Helpers
│
└── constants/
    └── env.ts              # Environment config
```

## 🧪 Testing

### Manual Testing

1. **Login Flow**
   - Enter mobile: `9876543210`
   - Enter OTP: `1234` (any 4 digits)
   - Should redirect to feed

2. **Content Unlock**
   - Click locked content
   - Click "Pay ₹99"
   - Wait 2 seconds (simulated payment)
   - Should unlock and redirect

3. **Navigation**
   - Use bottom nav to switch pages
   - All pages should load without errors

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://api.zexy.live
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

### Deploy to Vercel

```bash
vercel --prod
```

## ✅ Architecture Compliance

- ✅ Services = API calls only
- ✅ Hooks = React Query logic only
- ✅ Components = UI only (no fetching)
- ✅ Return format: `{ data, isLoading, error, refetch }`
- ✅ Mock API layer with realistic delays
- ✅ Ready for real API (zero rewrite)

## 📊 Performance

- React Query caching (5min stale time)
- Optimistic updates
- Request deduplication
- Automatic refetching disabled

## 🔮 Future Enhancements

- WebRTC live streaming
- Real-time messaging (Socket.io)
- Push notifications (FCM)
- Offline support
- Analytics integration

## 📝 License

Proprietary - Zexy Platform

## 🤝 Support

For issues or questions, contact the development team.

---

**Built with ❤️ following strict architectural patterns**
