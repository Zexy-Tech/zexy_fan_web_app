# Feature Specification: Fan Payment UI (Mock & Simulation)

**Feature Branch**: `feature/payment-poc-foundation`

**Created**: 2026-05-13

**Status**: Draft

## User Scenarios & Testing

### User Story 1 - Simulated Checkout
As a Fan, I want to see a payment simulation page when using the "mock" gateway, so I can choose a success or failure outcome.

**Acceptance Scenarios**:
1. **Given** a mock intent is created, **When** I open the `mock_checkout_url`, **Then** I see buttons for "Simulate Success", "Simulate Failure", and "Cancel".
2. **When** I click "Simulate Success", **Then** the app calls the backend `/verify` endpoint and redirects me to a success page.

## Requirements

### Functional Requirements
- **FR-001**: Update `paymentService` to handle `mock_checkout_url`.
- **FR-002**: Create a `MockCheckout` component/page to handle simulation.
- **FR-003**: Implement `startCheckout` to conditionally route to the mock page or real PG (stubbed).

## Success Criteria
- **SC-001**: End-to-end simulation works without real PG keys.
- **SC-002**: Verification call is triggered automatically on simulation success.
