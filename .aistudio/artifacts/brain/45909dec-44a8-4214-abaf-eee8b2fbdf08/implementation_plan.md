# 21 Fitness — Email Authentication, Member Subscription Dashboard & Cumulative Plan Expansion

This update introduces an Email & Password authentication flow so gym members must sign in with their Email ID before making a QR payment or joining a membership plan. Once logged in, members see a dedicated personal dashboard displaying their current plan, live remaining subscription days, payment history, and a **Expand Current Subscription** workflow that cumulatively adds new plan days (`+30`, `+180`, or `+365` days) onto their existing expiry date as soon as the Admin approves their payment screenshot.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product and architecture choices have been confirmed from your answers and will guide the implementation:

- **Confirmed Decision 1 — Built-In Email & Password Login with Demo Accounts**: Members authenticate using their Email ID and password (or create a new account in one step), with 1-click demo member accounts pre-loaded (`vikram.singh@example.com`, `priya.nair@example.com`, `rohan.sharma@example.com`, `karan.m@example.com`) for instant testing. Unauthenticated visitors attempting to join or pay are prompted to log in with their email first.
- **Confirmed Decision 2 — Admin-Approved Cumulative Plan Expansion**: When an active or expiring member chooses to expand their subscription (`+30 Days · ₹1,200`, `+180 Days · ₹6,000`, or `+365 Days · ₹10,000`), they scan the QR code and upload their payment screenshot. The extension request enters `Pending Admin Approval` while keeping their current active subscription running uninterrupted; once the Admin clicks **Approve**, the new days are added directly onto their current expiry date (`newEndDate = max(now, currentEndDate) + addedDays`).
- **Confirmed Decision 3 — Member Dashboard Features**: The logged-in Member Dashboard displays a cumulative days breakdown, a live preview of the new extended expiry date before and after payment, and a full payment & screenshot verification history ledger.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Mandatory Email Login Gate for Checkout**: Visitors browsing the 3D gym floor, machines, and macro calculator can explore freely, but clicking **Join / Pay via QR** or attempting to purchase a membership requires signing in with an Email ID and password (or registering a new email account).
  2. **Personal Member Subscription Dashboard**: Immediately upon logging in, members see their personal subscription card showing their active plan, live remaining days countdown bar, exact start and end dates, and a complete history of their submitted QR payment screenshots and UTR references.
  3. **Expand Subscription (Cumulative Day Stacking)**: Logged-in members with an existing subscription can click **Expand Subscription (+Add Days)**, pick any plan (`1 Month +30d`, `6 Months +180d`, or `1 Year +365d`), preview their new stacked total days and projected expiry date, and submit a QR payment screenshot.
  4. **Admin Screenshot Approval for Both New Joins & Plan Expansions**: The Owner Admin Panel clearly distinguishes between **New Membership** and **Plan Expansion (+Days Top-Up)** screenshot submissions, showing the exact cumulative day math (`Current 3d left + 180d expansion = 183d total`) when approving.
- **Target Audience / Persona**:
  - **Gym Members**: Want a personal email account where they can log in anytime, check their exact remaining gym days, and extend their membership before it expires without losing any remaining days.
  - **21 Fitness Owner / Admin**: Wants every payment tied to a verified member email account and wants extensions to stack cleanly onto existing plans only after verifying the UPI payment screenshot.
- **Key Value**: Eliminates anonymous or duplicate submissions, guarantees that early renewals never forfeit a member's remaining active days, and gives every member a transparent self-service portal.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Email Sign-In / Sign-Up Flow**:
     - Clicking **Member Login** in the header or clicking **Select Plan / Pay via QR** while logged out opens the Email Authentication panel.
     - Users can either sign in with an existing Email & Password, switch to **Create Member Account** (Name, Email ID, 10-digit Phone, Password, Fitness Goal), or click one of the **1-Click Demo Member Logins** (e.g., *Priya Nair — Active, 3 Days Left* or *Vikram Singh — Active, 340 Days Left*) to test the member experience immediately.
  2. **Logged-In Member Subscription Dashboard**:
     - Displays the member's profile badge (`Name`, `Email ID`, `Member ID`), current subscription status badge (`Active`, `Expiring Soon`, `Pending Admin Approval`, `Expired · Fee Pending`), and a high-precision progress bar showing `Days Remaining / Total Cumulative Days`.
     - If the member has a pending expansion or initial payment awaiting Admin approval, a highlighted banner shows the pending screenshot, UTR number, and the projected new expiry date once approved.
     - Includes a **Payment & Screenshot History** table listing every initial join and expansion transaction submitted under that Email ID.
  3. **Expand Subscription Flow (Cumulative Days Preview)**:
     - Inside the Member Dashboard or QR Checkout section, logged-in members see a **Cumulative Days Calculator Banner**:
       - Example: `Current Remaining: 3 Days` + `Selected 6 Months Plan: +180 Days` = `183 Total Days (New Expiry: 13 May 2027)`.
     - The member scans the UPI QR code for the selected plan (`₹1,200`, `₹6,000`, or `₹10,000`), uploads the payment screenshot, and submits the expansion request.
  4. **Admin Approval & Day Stacking Flow**:
     - In the Owner Admin Panel (`PIN: 2121`), pending expansion requests display a **`PLAN EXPANSION (+180d)`** badge alongside the member's email and current remaining days.
     - Clicking **Approve & Add Days** marks the payment verified, adds the new duration (`30`, `180`, or `365` days) onto the member's existing `endDate` (or starts from today if already expired), and logs the payment in the member's history.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Architectural Dark Luxury (`#09090B` obsidian canvas, `#111114` flat card surfaces with `1px solid rgba(255,255,255,0.08)` borders, `#D4AF37` champagne gold accents).
  - **Typography & Hierarchy**: `Outfit` for headings, `Plus Jakarta Sans` for UI copy, and `JetBrains Mono` with `tabular-nums` for all day counters, cumulative expiry projections, INR prices, and UTR numbers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Email-Gated Checkout with Non-Destructive Pending Extensions**:
  - *Chosen Approach*: Require email authentication before showing the QR payment submission form, and store pending expansion requests separately on the member's account (`pendingExtension`) until the Admin approves the screenshot.
  - *Why*: If an active member with 5 days left submits an expansion screenshot, their current 5-day active access must remain active while the Admin reviews the new screenshot. Storing the pending expansion on their record ensures their active countdown is never interrupted or prematurely overwritten before Admin verification.
- **Decision 2 — Exact Cumulative Date Arithmetic**:
  - *Chosen Approach*: When approving an expansion of `D` days, if the member's current `endDate` is in the future, the new `endDate` is `currentEndDate + D days` and `durationDays` increases by `D`. If the member's subscription had already expired (`endDate < now`), the new cycle starts from `now` (`now + D days`).
  - *Why*: Rewards members who renew early by preserving 100% of their remaining days while resetting overdue dates cleanly for expired members.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     21 FITNESS APPLICATION STATE STORE                     │
│  • Authenticated Member Session (currentMemberEmail, login/register/logout)│
│  • Member Accounts & Subscriptions (email, password, active plan,          │
│    startDate, endDate, pendingExtension, paymentHistory[])                 │
│  • Admin QR Config (UPI ID, Payee Name, Dynamic/Custom QR, Owner PIN)      │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌───────────────────────────────────────┐  ┌─────────────────────────────────┐
│     MEMBER AUTH & PORTAL WORKSPACE    │  │       OWNER ADMIN CONSOLE       │
│  ┌─────────────────────────────────┐  │  │  • Pending Screenshot Queue     │
│  │ Email Login / Register Gate     │  │  │    (New Joins & +Days Expansions│
│  │ + 1-Click Demo Account Switcher │  │  │     with zoomable lightbox)     │
│  └───────────────┬─────────────────┘  │  │  • Approve & Stack Days Handler │
│                  ▼                    │  │    (max(now, endDate) + days)   │
│  ┌─────────────────────────────────┐  │  │  • Member Directory, Search,    │
│  │ Logged-In Member Dashboard      │  │  │    WhatsApp Reminders & CSV     │
│  │ • Current Plan & Live Days Left │  │  └─────────────────────────────────┘
│  │ • Cumulative Expansion Preview  │  │
│  │ • Payment & Screenshot History  │  │
│  └───────────────┬─────────────────┘  │
│                  ▼                    │
│  ┌─────────────────────────────────┐  │
│  │ Authenticated QR Checkout Flow  │  │
│  │ • Dynamic / Custom UPI QR       │  │
│  │ • Screenshot Upload & UTR Input │  │
│  └─────────────────────────────────┘  │
└───────────────────────────────────────┘
```

### Data Model & State
- **Member Account & Subscription Entity**:
  - Account credentials: `id`, `name`, `email` (unique primary login key), `password`, `phone`, `goal`.
  - Current subscription state: `planId`, `planName`, `amountInr`, `durationDays` (cumulative total days), `status` (`no_plan` | `pending_approval` | `active` | `rejected`), `startDate`, `endDate`.
  - Pending Expansion / Renewal request (`pendingExtension`): `{ id, planId, planName, addedDays, amountInr, utrNumber, screenshotDataUrl, submittedAt } | null`.
  - Payment History Ledger (`paymentHistory[]`): Array of all submitted and verified transactions (`id`, `type`: `'initial_join' | 'plan_expansion' | 'admin_topup'`, `planName`, `addedDays`, `amountInr`, `utrNumber`, `screenshotDataUrl`, `status`, `submittedAt`, `approvedAt`).

### Interactive Component & State Mapping
- **Authentication Gate (`MemberAuthModal` / Inline Gate)**: Validates email format and password, supports instant account registration or 1-click demo login, and persists the logged-in member session in `localStorage`.
- **Logged-In Member Dashboard**: Reactive to the authenticated user's record; computes live remaining days (`computeSubscriptionHealth`), previews cumulative extension math (`currentRemainingDays + selectedPlan.durationDays`), and triggers the QR expansion checkout.
- **Authenticated QR Checkout**: Locked behind email login; automatically populates the logged-in member's `name`, `email`, and `phone`, and submits either an initial membership request or a `pendingExtension` request with the uploaded screenshot.
- **Admin Screenshot Approval Handler**: Checks whether a member has a `pendingExtension` or initial `pending_approval`, calculates the stacked `endDate` and cumulative `durationDays`, updates the payment history ledger to `'approved'`, and persists to `localStorage`.
