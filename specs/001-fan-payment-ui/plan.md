# Implementation Plan: Fan Payment UI (Mock & Simulation)

**Branch**: `feature/payment-poc-foundation` | **Date**: 2026-05-13 | **Spec**: [specs/001-fan-payment-ui/spec.md](spec.md)

## Summary
Implement a frontend simulation layer for payments. This allows testing the full checkout flow without real payment gateway credentials by intercepting the `mock_checkout_url` and providing a manual "Success/Failure" selection.

## Project Structure
```text
zexy_fan_web_app/
├── components/
│   └── payments/
│       └── MockCheckoutOverlay.tsx  # The simulation UI
├── services/
│   └── payment.ts                   # Updated startCheckout logic
└── app/
    └── payment-test/                # Temporary route for testing
        └── page.tsx
```

## Technical Decisions
- **Simulation Strategy**: When the API returns `payment_gateway: "mock"`, the app will display a `MockCheckoutOverlay` instead of attempting to load an external SDK.
- **Verification**: The overlay will trigger the existing `paymentService.verify()` method upon "Success".
