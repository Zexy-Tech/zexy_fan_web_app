# Empty States Design Spec

## Objective
Update the Creator Profile component (`MobileCreatorProfile`) and its sub-sections to display meaningful "Empty States" when no data is available from the backend API. This prevents the profile from appearing broken or incomplete for new creators who lack content, Q&A items, or subscription plans.

## Architecture & Data Flow
Currently, `MobileCreatorProfile.tsx` uses strict length checks (`items && items.length > 0`) before rendering section components. 
We will:
1. Remove length-based conditional rendering in `MobileCreatorProfile.tsx`.
2. Allow arrays (`[]`) to pass down to the section components once data fetching completes.
3. Update the section components (`FanConnectQASection`, `ExclusivesGridSection`, `MembershipCardSection`) to handle empty arrays gracefully by returning placeholder UI instead of `null`.

## Component Updates

### 1. `MobileCreatorProfile` (`components/mobile-creator-profile.tsx`)
*   **Change:** Modify the `switch` statement cases (`qa`, `exclusives`, `membership`) to only check if the data variables are defined (i.e., not loading), rather than checking `.length > 0`.
*   **Result:** `qaItems`, `content`, and `plans` will be passed down to the components even if they are empty arrays.

### 2. `FanConnectQASection` (`components/fan-connect-qa-section.tsx`)
*   **Current Behavior:** `if (!items || items.length === 0) return null;`
*   **New Behavior:** If `items.length === 0`, render the section header (with the "Ask Question" button if enabled) and show an empty state message below.
*   **Empty State UI:** A subtle `<div className="text-center py-8 text-muted-foreground">` containing a `MessageSquare` icon and text: *"No questions yet. Be the first to ask!"*

### 3. `ExclusivesGridSection` (`components/exclusives-grid-section.tsx`)
*   **Current Behavior:** `if (exclusiveContent.length === 0) return null;`
*   **New Behavior:** Render the "Exclusives" header, followed by a placeholder.
*   **Empty State UI:** A placeholder card containing a Lock icon and text: *"No exclusive content available yet."* styled with standard `Card` UI and glassmorphic touches.

### 4. `MembershipCardSection` (`components/membership-card-section.tsx`)
*   **Current Behavior:** `if (!plans || plans.length === 0) return null;`
*   **New Behavior:** Render a generic, disabled "Coming Soon" card indicating that the creator is yet to configure plans.
*   **Empty State UI:** 
    *   Title: "Coming Soon"
    *   Price: "$0.00 / 0 days"
    *   Benefits: Empty or generic lock list.
    *   Button: Disabled, labeled "Coming Soon".

## Error Handling & Edge Cases
*   **Loading State:** If `qaItems`, `content`, or `plans` are `undefined` (still loading), the sections will safely return `null` or skip rendering via optional chaining, matching current behavior. Empty states will only show when an empty array `[]` is explicitly returned by the API.
*   **Undefined Configuration:** The `actions` section and `intro` sections are handled via configuration; their current null checks are correct and will remain untouched.

## Testing
1. Load `http://localhost:3000/creator/alice_creator` (a creator with no content/Q&A/plans).
2. Verify all sections appear with their respective empty states.
3. Validate that asking a new question triggers the UI correctly.
