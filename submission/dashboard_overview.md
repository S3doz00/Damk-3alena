# Damk 3alena — Blood Dashboard
## Companion Web Platform: Comprehensive Feature Overview

**URL:** https://damk-3alena.vercel.app  
**Access:** Restricted to authorized hospital staff and system administrators  
**Stack:** React 19, TypeScript, Vite, Supabase, Recharts  
**Languages:** English / Arabic (full RTL support)  
**Themes:** Light, Dark, System

---

## Purpose

The Damk 3alena Blood Dashboard is the hospital-facing control panel that complements the donor mobile app. While the mobile app empowers donors to book appointments, respond to campaigns, and track their donation history, the dashboard gives medical staff and system administrators the tools to manage requests, monitor blood supply in real time, run AI-driven shortage forecasts, and coordinate donation campaigns — all from a single web interface.

The dashboard and the mobile app share the same Supabase backend, ensuring that every action taken on one platform is immediately reflected on the other.

---

## Navigation

The left sidebar provides access to all modules:

| Section | Access Level |
|---|---|
| Dashboard | Staff, Admin |
| Create Request | Staff, Admin |
| Appointments | Staff, Admin |
| Requests | Staff, Admin |
| Campaigns | Staff, Admin |
| AI Insights | Staff, Admin |
| Blood Map | Staff, Admin |
| User Management | Admin only |
| System Settings | Admin only |
| Profile | All |

A language toggle (EN / AR) and appearance switcher (Light / Dark / System) are pinned to the bottom of the sidebar.

---

## 1. Dashboard (Main Overview)

The main dashboard provides an at-a-glance picture of the blood supply ecosystem.

### KPI Cards (Top Row)
Four summary cards show the most critical real-time metrics:
- **Total Donors** — number of registered donors in the system
- **Active Requests** — open blood requests awaiting fulfillment
- **Donations This Month** — completed donations in the current calendar month
- **Available Blood Units** — total units across all registered facilities

### Donation by Day of Week (Bar Chart)
A bar chart breaks down donation frequency by day (Sunday–Friday), helping administrators identify peak donation days and schedule staffing accordingly.

### Activity Trend (Line Chart)
A 4-week rolling line chart tracks three parallel metrics:
- **Donations** (green) — total donation events
- **Requests** (red) — blood requests submitted by facilities
- **Fulfilled** (blue) — requests that have been fulfilled

The chart highlights whether the fulfillment rate is keeping pace with demand — a diverging gap between requests and fulfilled is an early warning of supply pressure.

### Blood Type Distribution (Donut Chart)
An interactive donut chart shows the proportion of donors by blood type (A+, A−, B+, B−, AB+, AB−, O+, O−), giving administrators a demographic snapshot of the donor pool and helping forecast which blood types are at risk of shortage.

---

## 2. Create Blood Request

Hospital staff use this form to submit urgent blood requests that are immediately pushed as notifications to eligible donors on the mobile app.

### Form Fields
- **Blood Type Required** — 8-option grid (A+, A−, B+, B−, AB+, AB−, O+, O−)
- **Units Needed** — numeric field for quantity
- **Urgency Level** — three-option selector: Normal / Urgent / Critical
- **Patient Name** — optional, for internal tracking
- **File Number** — patient file reference for hospital records
- **Additional Notes** — free-text for special requirements

On submission, the system:
1. Creates a blood request record in the database
2. Queries the AI service to find the most compatible eligible donors nearby
3. Sends push notifications to those donors via the mobile app

---

## 3. Appointments

The Appointments screen gives staff a live view of all donor appointments booked at their facility through the mobile app.

### Features
- **Status badges:** Booked (green), Cancelled (red)
- **Sort control:** Most Recent / Oldest
- **Clear Cancelled action:** A single-click button removes all cancelled entries, keeping the list clean (implemented as a secure RPC function that bypasses row-level security for admin operations)
- **Donor details:** Name, blood type, scheduled date and time

Each row shows the blood type the donor registered with, enabling staff to prioritize high-need blood types.

---

## 4. Submitted Requests (Request Management)

The Requests screen lists all blood requests submitted by the facility, with full lifecycle management.

### Request Card Details
Each card displays:
- Blood type badge (e.g., A+, B+)
- Urgency level badge: Normal / Urgent / Critical
- Patient name and file number
- Fulfillment progress bar (units received / units needed)
- Current status: Open / In Progress / Fulfilled / Closed

### Status Workflow
Staff can manually advance or revert a request's status using the inline status buttons:
**Open → In Progress → Fulfilled → Closed**

Closed requests can be cleared in bulk using the "Clear Closed" button. This keeps the active list focused on pending needs.

---

## 5. Campaigns

The Campaigns module allows hospital staff to create and manage organized blood donation drives.

### Campaign Cards Display
- Campaign name and hosting facility
- Blood type target (e.g., AB+)
- Urgency badge (Critical / Urgent / Normal)
- Scheduled date and time window
- **Donor progress bar** — live count of confirmed donors vs. the target (e.g., 0/50 donors, 0%)

### Tabs
- **Active** — currently running or upcoming campaigns
- **Past** — completed campaigns for historical reference
- **All** — unfiltered view

### Creating a Campaign
Staff click "+ New Campaign" to open a creation form specifying blood type, urgency, target donor count, date, time, and description. Once published, the campaign appears on the donor mobile app, allowing donors to browse and sign up directly.

### Safeguards
The system automatically archives campaigns that pass their scheduled end date without requiring manual intervention — preventing stale campaigns from misleading donors on the mobile app.

---

## 6. AI Insights

The AI Insights page integrates the Damk 3alena AI microservice (FastAPI + scikit-learn) to provide data-driven decision support.

### Supply Warnings
A panel lists blood types currently at critical or low stock levels, with severity color coding:
- **Red (Critical)** — immediate action required
- **Orange (Warning)** — supply is thinning

Example: "O− is critically low — only 5 units available across all facilities."

### Shortage Detection Alerts
The AI service analyzes historical consumption rates, current inventory, and scheduled appointments to detect impending shortages before they occur. Each alert includes:
- Affected blood type
- Predicted shortage window
- Recommended action (launch campaign, send urgent request)

### Demand Forecast
A 7-day forecast chart shows predicted blood demand by type, generated by the AI service's time-series model. This allows procurement teams to plan transfusion stock in advance rather than reacting to crises.

### Recommended Donors
When a blood request is active, the AI Recommended Donors list ranks eligible donors by a composite score:

| Factor | Weight |
|---|---|
| Blood type compatibility (exact match) | High |
| Distance from facility | High |
| Donation eligibility (≥60 days since last donation) | Required |
| Prior donation history | Moderate |

Each ranked entry shows:
- Donor name and blood type
- Match description ("Exact blood type match (O+). Eligible to donate. 1.9 km away.")
- Distance in kilometers
- Compatibility score (e.g., 85 pts)

Staff can contact the top-ranked donors directly to maximize the chance of fast fulfillment.

---

## 7. Blood Map

The Blood Map provides a real-time geographic view of blood supply status across Jordan.

### Map Overview
An interactive map (powered by Google Maps) displays all registered healthcare facilities as color-coded dots:
- **Red dot** — Critical supply (immediate shortage)
- **Orange dot** — Warning (supply falling below safe threshold)
- **Green dot** — Adequate supply

A heat layer (demand intensity) overlaid on the map shows geographic concentrations of blood demand, helping planners identify underserved areas.

**Summary bar** at the bottom: Total critical facilities, warning facilities, total registered facilities, and total blood units system-wide.

### Facility Detail Panel
Clicking any map marker opens a right-side panel with complete facility information:

- **Facility name and type** (e.g., King Hussein Medical Center — Hospital)
- **Location and operating hours** (e.g., 24/7)
- **Contact number**
- **Stock in Hand** — current total units
- **Predicted Need Next Week** — AI-generated forecast

**Inventory breakdown by blood type with status badges:**
- O− → 5 units left (Critical)
- A+ → 10 units left (Critical)
- A− → 6 units left (Critical)
- B− → 5 units left (Critical)
- O+ → 32 units left (Warning)
- B+ → 20 units left (Warning)
- AB− → 11 units left (Warning)

**Supply vs. Predicted Demand chart:** A horizontal bar chart comparing current inventory (solid bar) against next-week predicted demand (lighter bar) for each blood type — revealing which types will run short before the next restocking cycle.

---

## 8. User Management *(Admin only)*

Administrators manage all registered users from this screen.

### User List
Each user card displays:
- Full name
- Email address
- Join date
- Role badges: **Donor** / **Staff** / **Admin**

Highlighted badges indicate the user's active role. Administrators can toggle roles by clicking the badge buttons — instantly granting or revoking staff or admin privileges without requiring a separate settings page.

### Create User
The "+ Create User" button allows administrators to manually provision accounts — useful for onboarding new hospital staff.

---

## 9. System Settings *(Admin only)*

System Settings allows administrators to configure the platform's core operational parameters without touching the codebase.

### AI Pipeline Panel
- **Run AI Forecast** button — manually triggers the AI microservice to refresh shortage predictions and donor recommendations outside the scheduled run interval
- **Service status indicator** — shows whether the AI microservice is online or offline

### Configurable Thresholds

| Setting | Default | Description |
|---|---|---|
| Donor Eligibility Gap (Days) | 60 | Minimum days between donations before a donor is eligible again |
| Maximum Donor Age (Years) | 65 | Upper age limit for donor eligibility |
| Minimum Donor Age (Years) | 18 | Lower age limit for donor eligibility |
| Minimum Donor Weight (kg) | 50 | Minimum weight requirement for donation |

Each setting has its own Save button, allowing individual parameters to be updated without affecting others. These thresholds feed directly into the eligibility gauge shown to donors on the mobile app.

---

## 10. Profile

The Profile page allows staff and administrators to view and edit their personal account details — name, contact information, and password.

---

## Security Model

- All routes require authentication via Supabase Auth (email + password)
- Row-level security (RLS) policies on the Supabase database ensure users can only access data belonging to their registered facility
- Admin-only pages (User Management, System Settings) are restricted both at the route level (React Router) and the database level (RLS policies check the `role` column)
- Destructive operations (Clear Cancelled, Clear Closed) use SECURITY DEFINER RPC functions to ensure only authorized roles can execute them

---

## Bilingual Support

The dashboard supports full English/Arabic switching. Clicking "AR" in the sidebar language toggle:
- Switches all UI text to Arabic
- Flips the entire layout to RTL (right-to-left) using `document.documentElement.dir = 'rtl'`
- Adjusts chart labels, form placeholders, and navigation items

This makes the platform accessible to Arabic-speaking hospital staff and administrators across Jordan.

---

*Damk 3alena Blood Dashboard — developed as part of the Damk 3alena graduation project, Applied Science University, 2026*
