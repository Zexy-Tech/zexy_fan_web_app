# Mock Data for creator_one Profile

**URL**: `http://10.78.234.19:3000/creator/creator_one`

---

## Creator Profile

```json
{
  "id": 1,
  "username": "creator_one",
  "name": "Sarah Johnson",
  "avatar": null,
  "category": "Fitness",
  "subscriber_count": 1250,
  "is_subscribed": false
}
```

### Visual Display

```
┌─────────────────────────────────────────────┐
│  [S]  Sarah Johnson                         │
│       @creator_one                          │
│       🏷️ Fitness                            │
│       👥 1,250 subscribers                  │
└─────────────────────────────────────────────┘
```

---

## Subscription Plans

```json
[
  {
    "id": 1,
    "creator_uid": 1,
    "name": "Monthly Access",
    "price": 299,
    "duration_days": 30,
    "description": "Full access to all exclusive content for 30 days",
    "is_active": true
  },
  {
    "id": 2,
    "creator_uid": 1,
    "name": "Quarterly Access",
    "price": 799,
    "duration_days": 90,
    "description": "Save 10% with quarterly subscription",
    "is_active": true
  }
]
```

### Visual Display

```
Subscription Plans
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Monthly Access               │ │ Quarterly Access             │
│ Full access to all exclusive │ │ Save 10% with quarterly      │
│ content for 30 days          │ │ subscription                 │
│                              │ │                              │
│              ₹299            │ │              ₹799            │
│              30 days         │ │              90 days         │
│                              │ │                              │
│  [Subscribe Now]             │ │  [Subscribe Now]             │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## Posts (4 total, 3 public)

### Post 1: Morning Yoga Routine (FREE) ✅

```json
{
  "id": 1,
  "creator_uid": 1,
  "creator_username": "creator_one",
  "creator_name": "Sarah Johnson",
  "type": "video",
  "title": "Morning Yoga Routine",
  "description": "Start your day with this energizing 15-minute yoga flow",
  "url": "https://example.com/video1.mp4",
  "is_paid": false,
  "price": 0,
  "visibility": "public",
  "is_locked": false,
  "created_at": "2026-05-05T..."
}
```

**Visual Display**:
```
┌─────────────────────────────────────────────┐
│ Morning Yoga Routine                        │
│ Start your day with this energizing         │
│ 15-minute yoga flow                         │
│                                             │
│ [Content Preview]                           │
│                                             │
│ [Login to View] or [View Full Content]     │
│                                             │
│ video                          Today        │
└─────────────────────────────────────────────┘
```

---

### Post 2: Full Body Workout (FREE) ✅

```json
{
  "id": 4,
  "creator_uid": 1,
  "creator_username": "creator_one",
  "creator_name": "Sarah Johnson",
  "type": "video",
  "title": "Full Body Workout",
  "description": "Intense 30-minute workout to build strength",
  "url": "https://example.com/video4.mp4",
  "is_paid": false,
  "price": 0,
  "visibility": "public",
  "is_locked": false,
  "created_at": "2026-05-04T..."
}
```

**Visual Display**:
```
┌─────────────────────────────────────────────┐
│ Full Body Workout                           │
│ Intense 30-minute workout to build strength │
│                                             │
│ [Content Preview]                           │
│                                             │
│ [Login to View] or [View Full Content]     │
│                                             │
│ video                          1 day ago    │
└─────────────────────────────────────────────┘
```

---

### Post 3: Advanced Core Training (LOCKED) 🔒

```json
{
  "id": 5,
  "creator_uid": 1,
  "creator_username": "creator_one",
  "creator_name": "Sarah Johnson",
  "type": "video",
  "title": "Advanced Core Training",
  "description": "Premium workout for advanced fitness enthusiasts",
  "url": null,
  "is_paid": true,
  "price": 149,
  "visibility": "public",
  "is_locked": true,
  "created_at": "2026-05-03T..."
}
```

**Visual Display**:
```
┌─────────────────────────────────────────────┐
│ Advanced Core Training              ₹149   │
│ Premium workout for advanced fitness        │
│ enthusiasts                                 │
│                                             │
│ [Blurred Background with Blur Effect]      │
│                                             │
│         🔒                                  │
│    Premium Content                          │
│    Login to unlock                          │
│                                             │
│  [Login to Unlock] or [Unlock for ₹149]    │
│                                             │
│ video                          2 days ago   │
└─────────────────────────────────────────────┘
```

---

### Post 4: Nutrition Guide (HIDDEN) ❌

```json
{
  "id": 6,
  "creator_uid": 1,
  "creator_username": "creator_one",
  "creator_name": "Sarah Johnson",
  "type": "image",
  "title": "Nutrition Guide",
  "description": "Complete meal plan for fitness goals",
  "url": null,
  "is_paid": true,
  "price": 99,
  "visibility": "membership",  // ← HIDDEN (not public)
  "is_locked": true,
  "created_at": "2026-05-02T..."
}
```

**Visual Display**: ❌ **NOT SHOWN** (visibility: "membership")

---

## Summary

### What's Displayed

| Post | Title | Type | Price | Visibility | Shown? |
|------|-------|------|-------|------------|--------|
| 1 | Morning Yoga Routine | video | Free | public | ✅ Yes |
| 4 | Full Body Workout | video | Free | public | ✅ Yes |
| 5 | Advanced Core Training | video | ₹149 | public | ✅ Yes (locked) |
| 6 | Nutrition Guide | image | ₹99 | membership | ❌ No (hidden) |

**Total Posts Shown**: 3 out of 4

---

## User Experience

### Not Logged In

```
Profile Header:
  [S] Sarah Johnson
      @creator_one
      🏷️ Fitness
      👥 1,250 subscribers

Subscription Plans:
  [Monthly Access - ₹299/30 days]  [Subscribe Now]
  [Quarterly Access - ₹799/90 days] [Subscribe Now]

Posts (3 posts):
  
  1. Morning Yoga Routine (FREE)
     [Content Preview]
     [Login to View] ← Click → Login Modal
  
  2. Full Body Workout (FREE)
     [Content Preview]
     [Login to View] ← Click → Login Modal
  
  3. Advanced Core Training (₹149)
     [Blurred Preview]
     🔒 Premium Content
     [Login to Unlock] ← Click → Login Modal
```

### Logged In

```
Profile Header:
  [S] Sarah Johnson
      @creator_one
      🏷️ Fitness
      👥 1,250 subscribers

Subscription Plans:
  [Monthly Access - ₹299/30 days]  [Subscribe Now]
  [Quarterly Access - ₹799/90 days] [Subscribe Now]

Posts (3 posts):
  
  1. Morning Yoga Routine (FREE)
     [Content Preview]
     [View Full Content] ← Click → /content/1
  
  2. Full Body Workout (FREE)
     [Content Preview]
     [View Full Content] ← Click → /content/4
  
  3. Advanced Core Training (₹149)
     [Blurred Preview]
     🔒 Premium Content
     [Unlock for ₹149] ← Click → Payment Modal
```

---

## Login Modal (When Not Logged In)

Appears when clicking:
- "Login to View" (free content)
- "Login to Unlock" (locked content)
- "Subscribe Now" (subscription plans)

```
┌─────────────────────────────────────┐
│  🔐 Login Required                  │
├─────────────────────────────────────┤
│                                     │
│  You need to login to access       │
│  premium content and subscribe to  │
│  creators.                          │
│                                     │
│  [Cancel]      [Login Now]          │
│                                     │
└─────────────────────────────────────┘
```

---

## API Calls (Mock Mode)

When visiting `/creator/creator_one`:

1. **Get Creator**:
   ```
   feedService.getCreatorByUsername('creator_one')
   → Returns: Sarah Johnson data
   → Delay: 600ms
   ```

2. **Get Content**:
   ```
   feedService.getCreatorContentByUsername('creator_one')
   → Returns: 4 posts (3 shown, 1 hidden)
   → Delay: 700ms
   ```

3. **Get Plans**:
   ```
   subscriptionService.getCreatorPlans(1)
   → Returns: 2 subscription plans
   → Delay: 600ms
   ```

---

## Complete Page Structure

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]                                                │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │  [S]  Sarah Johnson                             │   │
│ │       @creator_one                              │   │
│ │       🏷️ Fitness                                │   │
│ │       👥 1,250 subscribers                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Subscription Plans                                      │
│ ┌──────────────────┐ ┌──────────────────┐             │
│ │ Monthly Access   │ │ Quarterly Access │             │
│ │ ₹299 / 30 days   │ │ ₹799 / 90 days   │             │
│ │ [Subscribe Now]  │ │ [Subscribe Now]  │             │
│ └──────────────────┘ └──────────────────┘             │
│                                                         │
│ Posts (3 posts)                                         │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Morning Yoga Routine                            │   │
│ │ [Content Preview]                               │   │
│ │ [Login to View / View Full Content]             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Full Body Workout                               │   │
│ │ [Content Preview]                               │   │
│ │ [Login to View / View Full Content]             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Advanced Core Training                  ₹149    │   │
│ │ [Blurred Preview]                               │   │
│ │ 🔒 Premium Content                              │   │
│ │ [Login to Unlock / Unlock for ₹149]             │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Test It Now!

```bash
# Open in browser (works without login!)
http://10.78.234.19:3000/creator/creator_one
```

**Expected**:
- ✅ Shows Sarah Johnson profile
- ✅ Shows 2 subscription plans
- ✅ Shows 3 public posts (1 hidden)
- ✅ Free posts have "Login to View" button
- ✅ Locked post has "Login to Unlock" button
- ✅ Clicking buttons shows login modal

