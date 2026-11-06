# Implementation Specification: Categories, Live Streams, and PhonePe Payments

This document outlines the execution plan for finalizing the missing features in the Fan App and integrating them with the real backend.

## 1. Feature Removal: Creator Q&A
- **Goal:** Completely scrub the unfinalized Creator Q&A feature from the Fan App ecosystem.
- **Tasks:**
  - Delete `zexy_fan_web_app/components/fan-connect-qa-section.tsx`.
  - Delete `zexy_fan_web_app/services/qa.ts`.
  - Remove all references to Q&A in `mobile-creator-profile.tsx` and `linkme-creator-profile.tsx`.
  - Remove any Q&A types or mock data.

## 2. Categories API Integration
- **Goal:** Replace hardcoded `creatorCategories.ts` with real API integration.
- **Backend Updates:** 
  - Create a new public endpoint `GET /api/v1/common/categories` in `zexy_api/app/api/v1/common/` that returns the static `CategoryEnum` list.
- **Frontend Updates:**
  - Create a new service function in the Fan App to fetch categories from the backend.
  - Map the backend `CategoryEnum` strings to local frontend SVGs/icons.
  - Wire up the Category cards on the Categories screen to call the existing `GET /api/v1/fan/creators?category={slug}` endpoint (already supported by the backend) when clicked.

## 3. Live Streams Integration
- **Goal:** Show when creators are live and allow fans to join a simulated live room.
- **Backend Updates:**
  - Update `CreatorListItem` and `ProfileConfigResponse` schemas in `zexy_api/app/schemas/creators.py`.
  - Modify `crud_creators.get_creators_list_with_counts_cursor` and `get_creator_profile_config` to check `live_sessions` (where `status="active"`) and append `is_live` (boolean) and `active_room_id` (string).
- **Frontend Updates:**
  - **Profile Page:** Display a "Live Now" badge on the Creator's Profile if `is_live` is true. Clicking it will trigger the intent/payment flow (if the live session is paid) and navigate to a new mock video room route (e.g., `/live/[room_id]`).
  - **Sidebar/Nav:** Fetch `GET /api/v1/common/live` in `layout/header.tsx` (desktop sidebar) and `linkme-creator-profile.tsx` (mobile drawer) to display a list of "Live Now" creators.
  - **Live Room Screen:** Create a new page `app/(main)/live/[roomId]/page.tsx` that simulates a basic video stream UI.

## 4. Payment Integration (PhonePe)
- **Goal:** Transition from simulated mock sleeps to a PhonePe-based payment gateway flow.
- **Backend State:** The backend already supports `phonepe` natively via `PhonePePaymentProvider`.
- **Frontend Updates:**
  - Remove any legacy Razorpay types/references if they exist.
  - Update `payment.ts` service: `createIntent` should expect a PhonePe payment URL in the response (`mock_checkout_url` or equivalent, or we extract the PhonePe intent redirect URL).
  - Since we don't have real credentials yet, the backend with `MOCK_PAYMENTS=True` will return a mock URL. We will create a local "Mock PhonePe Simulator" page in the Fan App (`app/(public)/mock-pg/page.tsx`) that acts as the PG gateway. It will display a "Pay Now" button, and on click, redirect back to the Fan App verification route.
  - When real PhonePe credentials are added to the backend, it will return the real PhonePe Hermes redirect URL, and the frontend flow will automatically work without changes.