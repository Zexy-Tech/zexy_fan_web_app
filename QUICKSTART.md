# 🚀 Zexy Fan Web App - Quick Start Guide

Get the app running in **under 2 minutes**.

---

## ⚡ Quick Start (3 Steps)

### 1. Install Dependencies
```bash
cd zexy_fan_web_app
npm install
```

**Note**: If you see errors about missing packages during `npm run dev`, install them:
```bash
npm install tailwindcss-animate
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

The default `.env.local` is already configured for mock mode:
```env
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🎮 Try It Out

### Login
1. Enter any mobile number (e.g., `9876543210`)
2. Enter any 4-digit OTP (e.g., `1234`)
3. Click "Verify OTP"

**You're in!** 🎉

### Explore Features

#### 1. Feed
- Browse content from creators
- See locked (🔒) and unlocked content
- Click any content card

#### 2. Unlock Content
- Click a locked content
- Payment modal opens
- Click "Pay ₹99"
- Wait 2 seconds (simulated payment)
- Content unlocks automatically!

#### 3. Creator Profile
- Click a creator's avatar or name
- View their content
- See subscription plans
- Click "Subscribe" to test subscription flow

#### 4. Subscriptions
- Click "Subscriptions" in bottom nav
- View active subscriptions
- See expiry dates

#### 5. Messages
- Click "Messages" in bottom nav
- View conversations
- Click a conversation
- Send a message

#### 6. Profile
- Click "Profile" in bottom nav
- View your info
- Click "Logout" to test logout flow

---

## 🎨 What You'll See

### Dark Premium Theme
- Dark background with purple-pink gradients
- Creator avatars with gradient borders
- Clean card-based layouts
- Smooth animations

### Mobile-First Design
- Bottom navigation (mobile)
- Responsive grid layouts
- Touch-friendly buttons

### Loading States
- Spinners during data fetch
- Error messages on failure
- Empty states when no data

---

## 🔧 Development Tips

### Mock Mode (Default)
- All API calls are simulated
- Realistic delays (600-1200ms)
- Any OTP works (4 digits)
- Payments auto-succeed after 2s

### Hot Reload
- Edit any file
- Browser auto-refreshes
- Changes appear instantly

### Check Console
- Open browser DevTools (F12)
- See API calls in Console
- Check Network tab for requests

---

## 📱 Test on Mobile

### Option 1: Local Network
```bash
# Find your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from phone
http://YOUR_LOCAL_IP:3000
```

### Option 2: ngrok
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the https URL on your phone
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Dependencies Not Installing
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Build Errors
```bash
# Check Node version (need 18+)
node --version

# Update Node if needed
nvm install 18
nvm use 18
```

---

## 🚀 Ready for Production?

### Switch to Real API

1. Update `.env.local`:
```env
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://api.zexy.live
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
```

2. Build for production:
```bash
npm run build
npm start
```

3. Deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

**That's it! Zero code changes needed.** ✅

---

## 📚 Learn More

- [README.md](./README.md) - Full documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
- [STATUS.md](./STATUS.md) - Implementation status

---

## 🎯 What's Next?

### Explore the Code
```bash
# Services (API layer)
cat services/payment.ts

# Hooks (React Query layer)
cat hooks/usePayment.ts

# Components (UI layer)
cat components/content/payment-modal.tsx
```

### Modify Something
1. Edit `app/(main)/feed/page.tsx`
2. Change the title
3. Save and see it update!

### Add a Feature
1. Create new service in `services/`
2. Create new hook in `hooks/`
3. Use hook in component
4. Follow the architecture pattern!

---

**Happy coding! 🎉**

