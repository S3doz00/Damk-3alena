## Chapter 4: Implementation

This chapter describes the actual implementation of the Damk 3alena system, covering the development environment, the backend database layer, the AI microservice, the donor mobile application, and the hospital dashboard. Implementation followed the Scrum sprint plan outlined in Chapter 1, with each phase building on the previous one.

### 4.1 Development Environment

The system was developed on macOS using VS Code as the primary code editor. The four independent components each have their own development environment:

- **Dashboard:** Node.js 22, Vite 8 dev server running on `localhost:5173`, TypeScript compiler in watch mode, ESLint for linting.
- **Mobile App:** Expo CLI with Expo Go for live testing on physical Android and iOS devices, Metro bundler for fast refresh.
- **AI Service:** Python 3.11 virtual environment (`venv`) with all dependencies in `requirements.txt`, Uvicorn ASGI server running on `localhost:8000`.
- **Database:** Supabase cloud project (`fyushkwhotqyihzuekhr`, region: ap-southeast-2), migrations applied through the Supabase Dashboard SQL editor.

Version control was managed using Git with GitHub as the remote repository. Each component was developed in its own subdirectory (`dashboard/`, `mobile/`, `ai-service/`, `supabase/`) within a single monorepo. The dashboard is deployed to Vercel and the Supabase project is live, making the system accessible from any browser.

### 4.2 Database Implementation (Supabase/PostgreSQL)

The database layer was implemented in Supabase using three versioned SQL migration files:

- `001_create_tables.sql` — Creates all 14 core tables, custom ENUM types, indexes, and trigger functions.
- `002_rls_policies.sql` — Defines all Row-Level Security (RLS) policies for the three roles.
- `003_seed_facilities.sql` — Seeds 15 Jordanian hospitals and blood banks with realistic names, coordinates, addresses, and working hours.

#### 4.2.1 Table Structure and ENUM Types

The database schema defines five custom PostgreSQL ENUM types to enforce data integrity at the database level:

```sql
CREATE TYPE user_role         AS ENUM ('donor', 'staff', 'admin');
CREATE TYPE blood_type        AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE request_urgency   AS ENUM ('normal', 'urgent', 'critical');
CREATE TYPE request_status    AS ENUM ('open', 'in_progress', 'fulfilled', 'closed');
CREATE TYPE appointment_status AS ENUM ('booked', 'completed', 'cancelled', 'no_show');
```

The central `users` table is linked to Supabase Auth via a `auth_id UUID` foreign key referencing `auth.users(id)`. An `after insert` trigger on `auth.users` automatically creates the corresponding `users` row, ensuring no orphaned auth accounts exist. Each donor record in the `donors` table stores eligibility flags (`is_eligible`, `last_donation_date`) and GPS coordinates (`latitude`, `longitude`) for proximity-based features.

#### 4.2.2 Row-Level Security Policies

RLS is enabled on all 14 tables. The policies use helper SQL functions to resolve the current user's role and linked IDs without exposing those values in application code:

```sql
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_donor_id() RETURNS UUID AS $$
  SELECT d.id FROM donors d
  JOIN users u ON d.user_id = u.id
  WHERE u.auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

A representative set of RLS policies illustrates the three-tier access model:

```sql
-- Donors can only read their own notifications
CREATE POLICY "donors_read_own_notifications"
ON notifications FOR SELECT
USING (donor_id = get_donor_id());

-- Staff can only read appointments at their facility
CREATE POLICY "staff_read_facility_appointments"
ON appointments FOR SELECT
USING (facility_id = get_staff_facility_id());

-- Admins have full access
CREATE POLICY "admin_full_access_users"
ON users FOR ALL
USING (get_user_role() = 'admin');
```

For cancelled appointment deletion (which requires bypassing RLS to allow staff to clean up records), a `SECURITY DEFINER` stored procedure `delete_cancelled_appointments()` was implemented, granting controlled elevated access only for that specific operation.

#### 4.2.3 Seed Data

Fifteen facilities representing real Jordanian hospitals and blood banks across Amman, Irbid, Zarqa, and southern governorates were seeded into the `facilities` table. Each facility record includes GPS coordinates for map display and distance calculations, working hours in the format `"08:00 - 16:00"`, and initial blood type inventory values in the `facility_inventory` table.

*[Figure 15 - Supabase Dashboard: Schema Overview]*

### 4.3 AI Service Implementation (FastAPI)

The AI microservice was implemented as an independent FastAPI application in `ai-service/`. It exposes four endpoints: a health check (`GET /health`), and three prediction endpoints (`POST /api/forecast`, `POST /api/shortage-detect`, `POST /api/recommend-donors`). The service uses Pydantic models for strict request/response validation, which prevents malformed inputs from reaching the models.

On startup, the service automatically loads pre-trained model files from disk or trains fresh models from synthetic data if no saved models are found:

```python
@app.on_event("startup")
async def startup():
    if not forecaster.load():
        print("No pre-trained model found. Training from synthetic data...")
        metrics = forecaster.train()
        print(f"Model trained: {metrics}")
```

#### 4.3.1 Blood Demand Forecasting (XGBoost Quantile Regression)

The `BloodDemandForecaster` class in `models/forecaster.py` trains three XGBoost models — one per quantile (q10, q50, q90) — using synthetic weekly blood consumption data generated to reflect Jordanian donation patterns across 15 facilities and 8 blood types.

**Feature Engineering:** The forecaster uses 14 input features including facility characteristics (size, region, type), blood type encoding, temporal features (week of year, month, cyclical sine/cosine encoding), cultural indicators (Ramadan week, public holiday flag), and rolling averages over 4, 8, and 12-week windows:

```python
FEATURE_COLS = [
    'facility_size_enc', 'facility_region_enc', 'facility_type_enc',
    'blood_type_encoded', 'week_of_year', 'week_sin', 'week_cos',
    'month', 'is_ramadan', 'is_holiday',
    'rolling_avg_4w', 'rolling_avg_8w', 'rolling_avg_12w', 'last_week_consumed',
]
```

**Model Configuration:** Each quantile model uses the `reg:quantileerror` objective with 500 estimators, max depth of 6, learning rate of 0.05, and regularization terms (reg_alpha=0.1, reg_lambda=1.0) to reduce overfitting:

```python
def _make_xgb(quantile_alpha: float) -> XGBRegressor:
    return XGBRegressor(
        n_estimators=500, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
        reg_alpha=0.1, reg_lambda=1.0,
        objective='reg:quantileerror', quantile_alpha=quantile_alpha,
        random_state=42, n_jobs=-1,
    )
```

The three models (q10, q50, q90) are saved as pickle files for fast loading on subsequent startups. Predictions are returned as structured JSON with one record per blood type per week containing `predicted_units` (q50), `low` (q10), and `high` (q90) values.

#### 4.3.2 Shortage Detection

The shortage detection module in `models/shortage.py` implements a rule-based algorithm that compares forecasted demand against current inventory. The algorithm evaluates both immediate (first-week) and medium-term (full forecast horizon) risk, applying configurable warning and critical thresholds:

```python
if after_first_week <= threshold_critical:      # e.g. <= 5 units
    severity = 'critical'
elif after_first_week <= threshold_warning:     # e.g. <= 15 units
    severity = 'warning'
elif projected <= threshold_critical:           # future critical
    severity = 'warning'
```

Each alert returned includes the blood type, severity level, current units, predicted demand, projected inventory after the forecast period, and a human-readable message. Alerts are sorted so critical alerts appear before warnings.

#### 4.3.3 Donor Recommendation Engine

The recommendation engine in `models/recommender.py` uses a weighted scoring function (100-point scale) across four criteria:

| Criterion | Max Points | Detail |
|---|---|---|
| Blood type compatibility | 40 | Exact match = 40 pts; compatible type = 20 pts; incompatible = excluded |
| Eligibility | 25 | Donor must be eligible (past 90-day cooldown); ineligible donors are excluded |
| Proximity | 20 | ≤5 km = 20 pts; ≤15 km = 15 pts; ≤30 km = 10 pts; ≤50 km = 5 pts |
| Donation history | 15 | ≥5 donations = 15 pts; ≥3 = 10 pts; ≥1 = 5 pts; first-time = 0 pts |

Distance is calculated using the Haversine formula, which accounts for the Earth's curvature to give accurate great-circle distances between the donor's GPS coordinates and the hospital's location. The blood type compatibility matrix explicitly encodes the universal donor (O-) and universal recipient (AB+) rules and all intermediate compatibilities.

Each recommendation includes the donor ID, final score, distance in km, compatibility and eligibility flags, and a human-readable reasoning string composed from each scoring criterion that passed.

*[Figure 16 - AI Service: Sample Forecast Output]*
*[Figure 17 - AI Service: Sample Shortage Alerts]*
*[Figure 18 - AI Service: Sample Donor Recommendations]*

### 4.4 Donor Mobile Application Implementation

The donor mobile application was built with Expo SDK 54 and React Native 0.81. Navigation is handled by Expo Router (file-based routing), with the root `_layout.tsx` managing auth state and redirecting between the `auth/` screens and the `(tabs)/` group based on the Supabase session. All global state (session, donor profile, appointments, notifications) is managed through React Context API in `AppContext.tsx`.

#### 4.4.1 Authentication Flow

The authentication flow covers registration, login, email OTP verification, and password reset. The `signUp()` function in `AppContext.tsx` calls Supabase Auth, then uses an `upsert` on conflict to create the donor profile row — this prevents a duplicate key error if the trigger fires and the app also attempts an insert:

```typescript
const { error: donorError } = await supabase
  .from('donors')
  .upsert(
    { user_id: userId, national_id, blood_type, gender, birth_date, weight },
    { onConflict: 'user_id' }
  );
```

Email OTP verification uses a 6-box input UI with auto-focus advancement, backspace handling, and paste detection. The OTP auto-submits when all 6 digits are entered. A 60-second resend cooldown prevents rate-limit issues with Supabase's email service.

The password reset flow intercepts the `PASSWORD_RECOVERY` auth event in `AppContext.tsx` to prevent the automatic redirect to the home screen, allowing the reset password form to appear without signing the user in:

```typescript
if (event === "PASSWORD_RECOVERY") {
  isRecoveringPasswordRef.current = true;
  setSession(s);
  return;
}
if (event === "USER_UPDATED" && isRecoveringPasswordRef.current) {
  isRecoveringPasswordRef.current = false;
  supabase.auth.signOut();
  return;
}
```

*[Figure 19 - Mobile: Registration Screen]*
*[Figure 20 - Mobile: OTP Verification Screen]*

#### 4.4.2 Home Screen

The Home screen displays a donor summary card with the donor's name and blood type, a donation statistics section (total donations, eligibility status), a visual countdown to the next eligible donation date, and an appointment widget. If the donor has an active appointment, it shows the facility name, date, and a "View Ticket" button. Otherwise, it shows a "Book Appointment" call-to-action.

*[Figure 21 - Mobile: Home Screen]*

#### 4.4.3 Map Screen

The Map screen integrates Google Maps through `react-native-maps` with custom markers color-coded by blood need severity (red for critical, orange for moderate, green for adequate). Below the map, facility cards display the facility name, type badge, address, working hours, and blood type need indicators as colored dots. Two action buttons on each card open Google Maps navigation (using the `comgooglemaps://` URL scheme on iOS with a web fallback) or navigate to the booking screen. The map supports free-text search and filtering by facility type and critical-need status.

```typescript
// iOS: open Google Maps app with driving directions
Linking.openURL(
  `comgooglemaps://?daddr=${facility.latitude},${facility.longitude}&directionsmode=driving`
).catch(() => {
  Linking.openURL(webFallback);  // fallback to browser Google Maps
});
```

*[Figure 22 - Mobile: Map Screen with Facility Cards]*

#### 4.4.4 Appointment Booking and QR Ticket

The booking screen allows donors to select a facility (or arrives pre-selected from the map), pick a date from a calendar picker, and select a time slot from the facility's working hours. On confirmation, the system performs two validation checks before inserting: (1) no existing active appointment, and (2) 90-day donation cooldown. On success, a QR-code ticket is generated using `react-native-qrcode-svg` containing a unique alphanumeric ticket code. The ticket displays the hospital name, appointment date and time, blood type, and QR code.

*[Figure 23 - Mobile: Appointment Booking Screen]*
*[Figure 24 - Mobile: QR-Code Appointment Ticket]*

#### 4.4.5 Profile Screen

The Profile screen is divided into three sections: (1) a profile card with donor details and donation count; (2) a donation history list showing all completed donations; (3) a settings section with theme (light/dark/system), language (English/Arabic), edit email, change password, and sign out options. The edit email flow uses Supabase's `updateUser()` followed by a 6-digit OTP verification to confirm the new email address.

*[Figure 25 - Mobile: Profile Screen]*

### 4.5 Hospital Dashboard Implementation

The hospital dashboard is a React 19 + TypeScript single-page application deployed to Vercel. It uses React Router 7 for client-side routing with a persistent sidebar layout component. Authentication is handled with Supabase Auth; staff and admin users log in with email/password credentials.

#### 4.5.1 Layout and Sidebar

The sidebar (`Layout.tsx`) is collapsible, persisting its state in `localStorage`. In the expanded state, it shows the Damk 3alena logo, navigation items with icons and labels, a language switcher (EN/AR with flag icons), and a theme toggle (light/dark/system). In the collapsed state, it shows icon-only navigation with tooltips. The toggle button uses a red-tinted icon button (`left_panel_close` Material Symbol) inline with the header, and the collapsed logo doubles as the expand button.

*[Figure 26 - Dashboard: Sidebar Expanded]*
*[Figure 27 - Dashboard: Sidebar Collapsed]*

#### 4.5.2 Dashboard Home

The home page (`Dashboard.tsx`) displays four summary KPI cards (open requests, total requests, today's appointments, active donors) and three charts powered by Recharts: a bar chart of current blood type inventory with LOW indicators for types below threshold, a weekly donor bookings bar chart for the past 7 weeks, and a gender distribution pie chart. Data is loaded from Supabase on mount with a manual refresh button and a "Live" timestamp indicator.

*[Figure 28 - Dashboard: Home Page with Charts]*

#### 4.5.3 Blood Request Management

The Create Request page presents a form for staff to submit blood requests specifying blood type, units needed, urgency (normal/urgent/critical), patient name, file number, and optional notes. Submitted requests appear on the Requests page in a card/table view with status badges. Staff can update the status through the workflow: open → in_progress → fulfilled → closed. Filtering by status, blood type, and urgency is supported.

*[Figure 29 - Dashboard: Create Request Form]*
*[Figure 30 - Dashboard: Requests Page]*

#### 4.5.4 AI Insights Page

The AI Insights page (`AIOutputs.tsx`) is the primary interface for the AI microservice. It sends the current facility's inventory to the three AI endpoints and renders the results in three sections:

1. **Demand Forecast:** Area charts per blood type showing the median prediction (q50) as a solid line with an upper/lower confidence band (q10–q90) shaded beneath it, rendered using Recharts `AreaChart` with `ReferenceLine` for the current week.

2. **Shortage Alerts:** Alert cards for each active shortage, color-coded by severity (red for critical, yellow for warning), displaying the blood type, current units, projected units, and the AI-generated descriptive message.

3. **Donor Recommendations:** A ranked list of up to 20 compatible, eligible donors for each open blood request, showing the donor's blood type, score out of 100, distance in km, and reasoning text.

*[Figure 31 - Dashboard: AI Insights - Forecast Chart]*
*[Figure 32 - Dashboard: AI Insights - Shortage Alerts]*
*[Figure 33 - Dashboard: AI Insights - Donor Recommendations]*

#### 4.5.5 Admin Pages

The User Management page (admin only) shows a paginated list of all users with role badges, a role-change dropdown, and staff approval toggles. The System Settings page shows current configurable parameters (shortage thresholds, eligibility days, notification radius, forecast horizon) loaded from the `system_parameters` table, with inline edit fields and a save button.

### 4.6 Internationalization Implementation

Both the mobile app and dashboard support full bilingual operation in English and Arabic with automatic RTL layout switching.

**Dashboard:** The `LanguageContext.tsx` stores the current language in `localStorage` and sets `document.documentElement.dir` and `document.documentElement.lang` on every language change. All string constants are stored in a single `Record<string, Record<'en' | 'ar', string>>` dictionary in `LanguageContext.tsx`, accessed through a `t(key)` helper function. This ensures no hardcoded strings appear in component code.

**Mobile:** The same translation pattern is used in `mobile/context/LanguageContext.tsx`, persisting the language selection in `AsyncStorage`. The `I18nManager.forceRTL()` call from `react-native` is invoked when Arabic is selected, triggering a full app restart to apply the RTL layout across all native components.

*[Figure 34 - Mobile: Arabic RTL Interface]*
*[Figure 35 - Dashboard: Arabic RTL Interface]*

---

## Chapter 5: Testing and Evaluation

### 5.1 Testing Approach

The system was evaluated using **black-box functional testing**, which verifies that the system behaves according to its specified requirements without examining internal implementation details [15]. Each test case defines an input action, the expected output, and the observed actual result, following the functional requirements defined in Chapter 2.

The testing was organized into four categories matching the system's component architecture:
1. Mobile Application Functional Tests
2. Hospital Dashboard Functional Tests
3. AI Service Endpoint Tests
4. Integration and Cross-Component Tests

All tests were executed manually against the live Supabase project and the deployed dashboard (Vercel). Mobile tests were performed on both Android (physical device) and iOS (simulator). AI service tests were performed using Postman against the local FastAPI server on port 8000.

### 5.2 Mobile Application Test Cases

**Table 19: TC-01 — Donor Registration with Valid Data**

| Field | Details |
|---|---|
| Test ID | TC-01 |
| Requirement | FR-01, FR-02 |
| Description | Register a new donor with complete valid information |
| Input | First name: Ahmad, Last name: Ali, Email: ahmad.ali@test.com, Password: Test1234!, Phone: 0791234567, National ID: 1234567890, Blood type: A+, Gender: Male, DOB: 1995-05-01, City: Amman, Weight: 72 |
| Expected Result | Account created; OTP sent to email; OTP screen appears |
| Actual Result | Account created successfully; 6-digit OTP email received; Verification screen displayed |
| Status | **PASS** |

**Table 20: TC-02 — Registration with Duplicate Email**

| Field | Details |
|---|---|
| Test ID | TC-02 |
| Requirement | FR-01 |
| Description | Attempt registration with an already-registered email |
| Input | Email already registered in Supabase Auth |
| Expected Result | Error message displayed; registration blocked |
| Actual Result | Error displayed: "User already registered" |
| Status | **PASS** |

**Table 21: TC-03 — OTP Verification: Valid Code**

| Field | Details |
|---|---|
| Test ID | TC-03 |
| Requirement | FR-02 |
| Description | Enter correct 6-digit OTP to verify email |
| Input | Correct OTP from email |
| Expected Result | Account verified; navigates to Home screen |
| Actual Result | Verification succeeded; redirected to Home screen |
| Status | **PASS** |

**Table 22: TC-04 — OTP Verification: Invalid Code**

| Field | Details |
|---|---|
| Test ID | TC-04 |
| Requirement | FR-02 |
| Description | Enter incorrect OTP code |
| Input | Wrong 6-digit code |
| Expected Result | Error shown; code cleared; first input refocused |
| Actual Result | "Token has expired or is invalid" displayed; inputs cleared |
| Status | **PASS** |

**Table 23: TC-05 — Donor Login with Valid Credentials**

| Field | Details |
|---|---|
| Test ID | TC-05 |
| Requirement | FR-03 |
| Description | Log in with a verified donor account |
| Input | Registered email + correct password |
| Expected Result | Session created; Home screen displayed with donor profile |
| Actual Result | Login successful; Home screen loaded with name, blood type, and stats |
| Status | **PASS** |

**Table 24: TC-06 — Login with Wrong Password**

| Field | Details |
|---|---|
| Test ID | TC-06 |
| Requirement | FR-03 |
| Description | Attempt login with incorrect password |
| Input | Valid email + wrong password |
| Expected Result | Error message displayed |
| Actual Result | "Invalid login credentials" error shown |
| Status | **PASS** |

**Table 25: TC-07 — Map Display and Facility Cards**

| Field | Details |
|---|---|
| Test ID | TC-07 |
| Requirement | FR-06 |
| Description | Open map screen and verify facilities load |
| Input | Open Map tab after login |
| Expected Result | Google Map renders; facility markers appear; facility cards shown below map |
| Actual Result | Map loaded with 15 facility markers; cards with name, blood type needs, working hours displayed |
| Status | **PASS** |

**Table 26: TC-08 — Book Appointment (Eligible Donor)**

| Field | Details |
|---|---|
| Test ID | TC-08 |
| Requirement | FR-07, FR-08 |
| Description | Book appointment as an eligible donor |
| Input | Select facility → select tomorrow's date → select 10:00 AM slot → confirm |
| Expected Result | Appointment created; QR-code ticket displayed |
| Actual Result | Appointment inserted in DB; QR-code ticket shown with correct details |
| Status | **PASS** |

**Table 27: TC-09 — Book Appointment (Already Has Active Booking)**

| Field | Details |
|---|---|
| Test ID | TC-09 |
| Requirement | FR-07 |
| Description | Attempt to book a second appointment when one is already active |
| Input | Attempt booking with existing active appointment |
| Expected Result | Error shown; booking blocked |
| Actual Result | "You already have an active appointment" error displayed |
| Status | **PASS** |

**Table 28: TC-10 — Cancel Appointment**

| Field | Details |
|---|---|
| Test ID | TC-10 |
| Requirement | FR-09 |
| Description | Cancel an active appointment |
| Input | Press "Cancel Appointment" → confirm in dialog |
| Expected Result | Appointment status updated to "cancelled"; ticket removed |
| Actual Result | Status updated in DB; ticket no longer shown; "Book Appointment" button reappears |
| Status | **PASS** |

**Table 29: TC-11 — Forgot Password: Reset via OTP**

| Field | Details |
|---|---|
| Test ID | TC-11 |
| Requirement | FR-12 |
| Description | Reset forgotten password using email OTP flow |
| Input | Enter registered email → receive OTP → enter correct OTP → enter new password |
| Expected Result | Password updated; success message; redirected to login |
| Actual Result | Password changed successfully; user signed out; login screen shown |
| Status | **PASS** |

**Table 30: TC-12 — Language Switch (Arabic/RTL)**

| Field | Details |
|---|---|
| Test ID | TC-12 |
| Requirement | NFR - Usability |
| Description | Switch interface language to Arabic |
| Input | Open Profile → Settings → toggle to Arabic |
| Expected Result | All UI text switches to Arabic; layout mirrors to RTL |
| Actual Result | All labels translated to Arabic; layout correctly mirrored |
| Status | **PASS** |

### 5.3 Dashboard Test Cases

**Table 31: TC-13 — Dashboard Login**

| Field | Details |
|---|---|
| Test ID | TC-13 |
| Requirement | FR-13 |
| Description | Log in to dashboard with valid staff credentials |
| Input | Valid staff email + password |
| Expected Result | Authenticated; redirected to Dashboard home page |
| Actual Result | Login successful; dashboard home with stats displayed |
| Status | **PASS** |

**Table 32: TC-14 — Dashboard Home Statistics Display**

| Field | Details |
|---|---|
| Test ID | TC-14 |
| Requirement | FR-14 |
| Description | Verify home page KPIs and charts render correctly |
| Input | Load dashboard home page |
| Expected Result | Four KPI cards, inventory bar chart, weekly bookings chart, gender pie chart displayed |
| Actual Result | All four KPI cards loaded with correct counts; all three charts rendered with data |
| Status | **PASS** |

**Table 33: TC-15 — Create Blood Request**

| Field | Details |
|---|---|
| Test ID | TC-15 |
| Requirement | FR-15 |
| Description | Submit a new blood request |
| Input | Blood type: O+, Units: 3, Urgency: urgent, Patient name: Mohammad Salem, File: 20231001 |
| Expected Result | Request saved with status "open"; visible on Requests page |
| Actual Result | Request created and appeared on Requests page with correct details and "open" badge |
| Status | **PASS** |

**Table 34: TC-16 — Create Request: Missing Required Fields**

| Field | Details |
|---|---|
| Test ID | TC-16 |
| Requirement | FR-15 |
| Description | Attempt to submit request without required fields |
| Input | Leave blood type and urgency empty; press Submit |
| Expected Result | Validation error shown; form not submitted |
| Actual Result | Required field errors displayed; no request created |
| Status | **PASS** |

**Table 35: TC-17 — View Appointments**

| Field | Details |
|---|---|
| Test ID | TC-17 |
| Requirement | FR-16 |
| Description | View donor appointments for the facility |
| Input | Open Appointments page |
| Expected Result | Appointment list with donor names, blood types, times, ticket codes, and statuses |
| Actual Result | All appointments for the facility displayed correctly |
| Status | **PASS** |

**Table 36: TC-18 — Update Request Status**

| Field | Details |
|---|---|
| Test ID | TC-18 |
| Requirement | FR-17 |
| Description | Update a blood request from "open" to "in_progress" |
| Input | Select request → change status to in_progress |
| Expected Result | Status badge updates to "in_progress" in database and UI |
| Actual Result | Status updated correctly and reflected immediately |
| Status | **PASS** |

**Table 37: TC-19 — Language Switch (Arabic Dashboard)**

| Field | Details |
|---|---|
| Test ID | TC-19 |
| Requirement | FR-21 |
| Description | Switch dashboard to Arabic with RTL layout |
| Input | Click Arabic language selector in sidebar |
| Expected Result | All labels in Arabic; sidebar and layout mirror to RTL |
| Actual Result | Arabic translations applied; layout correctly mirrored using `dir="rtl"` |
| Status | **PASS** |

**Table 38: TC-20 — Theme Switch**

| Field | Details |
|---|---|
| Test ID | TC-20 |
| Requirement | NFR - Usability |
| Description | Switch between light, dark, and system themes |
| Input | Click each theme button in sidebar |
| Expected Result | Dashboard visual theme changes immediately |
| Actual Result | Light, dark, and system themes applied correctly on selection |
| Status | **PASS** |

### 5.4 AI Service Test Cases

All AI service tests were performed using Postman against the local FastAPI server at `http://localhost:8000`.

**Table 39: TC-21 — Demand Forecast Endpoint**

| Field | Details |
|---|---|
| Test ID | TC-21 |
| Requirement | FR-26 |
| Description | Request blood demand forecast for a facility |
| Input | `POST /api/forecast` with `{"facility_idx": 0, "blood_types": ["A+", "O+", "B+"], "weeks_ahead": 4}` |
| Expected Result | 200 OK; predictions array with 12 records (3 blood types × 4 weeks); each with `blood_type`, `week_offset`, `predicted_units`, `low`, `high` |
| Actual Result | Response contained correct structure; q50 values higher than q10, lower than q90 as expected |
| Status | **PASS** |

**Table 40: TC-22 — Shortage Detection: Critical Alert**

| Field | Details |
|---|---|
| Test ID | TC-22 |
| Requirement | FR-27 |
| Description | Detect critical shortage when inventory is very low |
| Input | `POST /api/shortage-detect` with forecast predicting 8 units demand; current_inventory: {"O+": 3}; threshold_critical: 5 |
| Expected Result | Alert returned with severity "critical" for O+ |
| Actual Result | Critical alert returned: "CRITICAL: O+ projected to drop to -5 units after this week" |
| Status | **PASS** |

**Table 41: TC-23 — Donor Recommendation: Exact Match Priority**

| Field | Details |
|---|---|
| Test ID | TC-23 |
| Requirement | FR-28 |
| Description | Verify exact blood type match ranks higher than compatible type |
| Input | Request blood type A+; donors: one A+ eligible donor at 5 km; one O- eligible donor at 2 km |
| Expected Result | A+ donor ranks first (40+25+20 = 85 points vs 20+25+20 = 65 points for O-) |
| Actual Result | A+ donor scored 85, O- donor scored 65; A+ ranked first |
| Status | **PASS** |

**Table 42: TC-24 — Donor Recommendation: Ineligible Donor Excluded**

| Field | Details |
|---|---|
| Test ID | TC-24 |
| Requirement | FR-28 |
| Description | Confirm ineligible donors do not appear in recommendations |
| Input | Request A+ blood; one eligible A+ donor; one ineligible A+ donor |
| Expected Result | Only eligible donor returned |
| Actual Result | Ineligible donor excluded from results; only eligible donor in response |
| Status | **PASS** |

**Table 43: TC-25 — Health Check Endpoint**

| Field | Details |
|---|---|
| Test ID | TC-25 |
| Requirement | FR-26, FR-27, FR-28 |
| Description | Verify service is running and model is loaded |
| Input | `GET /health` |
| Expected Result | `{"status": "healthy", "model_loaded": true}` |
| Actual Result | Response matched expected; model_loaded = true after startup training |
| Status | **PASS** |

### 5.5 Integration Test Cases

**Table 44: TC-26 — End-to-End: Donor Books Appointment Visible on Dashboard**

| Field | Details |
|---|---|
| Test ID | TC-26 |
| Requirement | FR-07, FR-16 |
| Description | Donor books appointment on mobile; staff sees it on dashboard |
| Input | Donor books appointment on mobile app → staff opens Appointments page on dashboard |
| Expected Result | New appointment visible on dashboard within seconds of booking |
| Actual Result | Appointment appeared on dashboard immediately after booking on mobile |
| Status | **PASS** |

**Table 45: TC-27 — End-to-End: Request Creation Triggers AI Recommendation Display**

| Field | Details |
|---|---|
| Test ID | TC-27 |
| Requirement | FR-15, FR-18 |
| Description | Create a blood request; verify it appears on AI Insights page with donor recommendations |
| Input | Staff creates blood request → staff opens AI Insights page |
| Expected Result | New request appears in recommendations section with matching donors |
| Actual Result | Open requests shown in recommendations section; donor list rendered with scores |
| Status | **PASS** |

### 5.6 Testing Results Summary

**Table 46: Test Execution Summary**

| Test Category | Total Cases | Passed | Failed |
|---|---|---|---|
| Mobile App Functional | 12 | 12 | 0 |
| Dashboard Functional | 8 | 8 | 0 |
| AI Service Endpoints | 5 | 5 | 0 |
| Integration Tests | 2 | 2 | 0 |
| **Total** | **27** | **27** | **0** |

All 27 test cases passed successfully. The system correctly implements all functional requirements specified in Chapter 2.

### 5.7 Non-Functional Requirements Evaluation

**Security:** RLS policies were verified by attempting cross-user data access from the Supabase Dashboard SQL editor. Donor queries returned only the authenticated donor's own records; staff queries returned only their facility's data. HTTPS is enforced through Supabase's managed infrastructure and Vercel's TLS termination.

**Performance:** Dashboard home page load time from Supabase query to rendered charts averaged under 2 seconds on a standard broadband connection. AI endpoint response times averaged under 500ms per request (forecast: ~350ms, shortage: ~50ms, recommendations: ~80ms) with the model pre-loaded. Mobile app map data loaded within 1.5 seconds for all 15 facilities.

**Usability:** Bilingual English/Arabic interface with RTL switching was verified across all pages on both mobile and dashboard. Bottom tab navigation on mobile and sidebar navigation on dashboard were confirmed intuitive across all tested users during informal walkthrough testing.

**Reliability:** The system was operated continuously for multiple testing sessions with no crashes observed in the mobile app, dashboard, or AI service. Supabase's managed PostgreSQL with automatic backups provides baseline data reliability.

**Compatibility:** The mobile app was tested on Android 14 (physical device) and iOS 17 (Xcode simulator). The dashboard was tested on Chrome 124, Firefox 125, and Safari 17.4 without browser-specific issues.

---

## Chapter 6: Conclusion

### 6.1 Summary of Achieved Objectives

This project successfully delivered Damk 3alena, an AI-driven blood donation prediction and matching system for Jordan, as a functional end-to-end prototype. All six objectives defined in Section 1.5 were achieved:

1. **Donor Mobile Application:** The cross-platform React Native/Expo application was fully implemented, supporting donor registration with email OTP verification, GPS-based map with Google Maps integration, appointment booking with QR-code tickets, eligibility tracking with a 90-day cooldown, urgent blood request notifications, bilingual English/Arabic interface with RTL support, and account management features including email change and password reset.

2. **Blood Demand Forecasting:** An XGBoost quantile regression model was trained on a synthetic dataset representing Jordanian blood donation patterns across 15 facilities. The three-model approach (q10, q50, q90) produces median predictions with configurable confidence intervals, enabling hospitals to anticipate demand rather than react to shortages.

3. **Shortage Detection:** The shortage detection module compares forecasted demand against current inventory in real time, generating warning and critical alerts with configurable thresholds. Alerts are presented prominently on the AI Insights dashboard page with color-coded severity indicators and descriptive messages.

4. **Donor Recommendation Engine:** The recommendation engine successfully ranks compatible, eligible donors based on blood type match, geographic proximity, eligibility status, and donation history, providing staff with a ranked shortlist and reasoning text for each recommendation.

5. **Hospital/Blood Bank Dashboard:** The React/TypeScript dashboard was deployed to Vercel and provides staff with request management, appointment oversight, inventory monitoring with visual charts, and full access to all AI outputs in a single interface.

6. **System Integration:** All four components (mobile app, dashboard, Supabase backend, AI microservice) are connected into a functional end-to-end prototype. Donors book appointments on mobile that immediately appear on the dashboard; staff create blood requests that trigger AI recommendations; AI forecasts reflect current inventory levels. This was confirmed through integration testing in Section 5.5.

### 6.2 Contributions

The Damk 3alena system makes the following contributions to the domain of digital health and blood donation management in Jordan:

**Unified Platform:** Unlike existing disconnected approaches that rely on social media, phone calls, and fragmented hospital systems, Damk 3alena integrates donors, hospitals, and blood banks into a single platform. Both the mobile app and web dashboard are operational and accessible to real users.

**AI Integration for Blood Management:** The integration of XGBoost quantile regression for blood demand forecasting within a hospital dashboard -- providing confidence intervals, not just point estimates -- addresses a gap identified in the literature review. Most existing blood donation applications provide coordination features without predictive AI; Damk 3alena demonstrates that these can be combined in a practical system.

**Localization for Jordan:** The system is specifically designed for the Jordanian context, with Arabic RTL support, Arabic translations throughout both interfaces, facilities seeded with real Jordanian hospital names and coordinates, and cultural features such as Ramadan week flagging in the forecasting model.

**Open Architecture:** The separation of concerns into four independent components (mobile, dashboard, database, AI service) with well-defined REST interfaces means each component can be replaced, scaled, or improved independently. The AI microservice exposes a documented API that any frontend could call, and the Supabase backend's row-level security architecture means adding new applications or integrations would not require changing the backend.

### 6.3 Limitations

Despite the system meeting all its defined objectives, several limitations should be acknowledged:

**Synthetic Training Data:** The XGBoost forecasting model was trained entirely on synthetic data generated to approximate Jordanian donation patterns. While the synthetic data incorporates realistic features (seasonality, Ramadan, facility size and type), it cannot capture the true distribution of blood consumption patterns at Jordanian hospitals. Real forecasting accuracy would require at least 12 months of historical donation and consumption data from actual facilities.

**No Push Notification Delivery:** The notifications system stores notifications in the database and displays them in the app's Notifications tab, but does not deliver real-time push notifications to devices when a new urgent request is created. Implementation of push notifications (e.g., via Expo Push Notifications or Firebase Cloud Messaging) was out of scope for this prototype phase.

**Prototype Scale:** The system was developed and tested as a proof-of-concept with synthetic data, 15 seeded facilities, and a small number of test donor accounts. Production deployment would require performance testing at scale, security auditing, and integration with existing hospital information systems.

**AI Service Deployment:** The FastAPI AI service currently runs as a local process for demonstration purposes. A production deployment would require containerizing the service with Docker, deploying it to a cloud host with GPU access for retraining, and implementing model versioning and monitoring.

**No Real Clinical Integration:** The system does not connect to laboratory information systems (LIS), electronic health records (EHR), or existing hospital inventory systems. Blood inventory is currently updated manually by staff through the dashboard, rather than being automatically synchronized from existing systems.

### 6.4 Future Work

Building on the current prototype, the following enhancements are recommended for future development:

**Real Data Collection and Model Retraining:** Partner with Jordanian hospitals and blood banks to collect anonymized historical blood consumption and donation data. Retrain the XGBoost models on real data and implement a scheduled retraining pipeline that updates the model as new data accumulates, improving forecast accuracy over time.

**Push Notifications:** Implement real-time push notification delivery using Expo Push Notification services. This would allow donors to receive immediate alerts when an urgent blood request matching their blood type is submitted near their location, significantly improving response times for critical cases.

**Donor Eligibility Automation:** Integrate with laboratory information systems or allow staff to mark donation records directly (including results such as blood type confirmation and any deferral reasons) so that donor eligibility is automatically updated in real time without manual staff intervention.

**Expanded AI Capabilities:** Extend the AI modules to include: (1) a donor retention model predicting which donors are likely to return, enabling proactive re-engagement campaigns; (2) a seasonal campaign planner that recommends optimal times and locations for blood drives based on demand forecasts; and (3) a blood type rarity-aware recommendation model that factors in national supply levels, not just local facility inventory.

**Mobile Blood Bank Integration:** Add QR code scanning functionality to the mobile app allowing blood bank staff to scan a donor's appointment ticket on arrival, automating the check-in process and triggering a donation record upon completion.

**Production Security Audit:** Conduct a formal penetration test and security review before any clinical deployment, including OWASP top-10 assessment, Supabase RLS policy audit, API authentication hardening (replace CORS `allow_origins: ["*"]` with allowlist), and compliance review against Jordanian health data regulations.

---

## References (Complete List)

[1] Agile Manifesto. (2001). Manifesto for Agile Software Development. https://agilemanifesto.org/

[2] American Red Cross. (n.d.). Blood Donor App (Schedule/manage appointments, reminders, etc.).

[3] Atlassian. (n.d.). Agile project management (Agile overview/definition). https://www.atlassian.com/agile

[4] Chen, P. P.-S. (1976). The entity-relationship model -- Toward a unified view of data. ACM Transactions on Database Systems, 1(1), 9-36.

[5] draw.io (diagrams.net). (2021). Work with entity relationship table shapes in draw.io.

[6] Google Play. (2025). Mendami -- Apps on Google Play (mobile app listing/description).

[7] Object Management Group (OMG). (2017). Unified Modeling Language (UML) v2.5.1 (formal specification).

[8] Project Management Institute (PMI). (n.d.). What is Agile? https://www.pmi.org/

[9] Schwaber, K., & Sutherland, J. (2020). The Scrum Guide (The Definitive Guide to Scrum). https://scrumguides.org/scrum-guide.html

[10] Supabase. (2024). Supabase Documentation -- Open Source Firebase Alternative. https://supabase.com/docs

[11] Meta. (2024). React Native Documentation. https://reactnative.dev/docs/getting-started

[12] Expo. (2024). Expo Documentation. https://docs.expo.dev/

[13] FastAPI. (2024). FastAPI Documentation. https://fastapi.tiangolo.com/

[14] XGBoost Developers. (2024). XGBoost Documentation. https://xgboost.readthedocs.io/

[15] Myers, G. J., Sandler, C., & Badgett, T. (2011). The Art of Software Testing (3rd ed.). John Wiley & Sons.

[16] Kager, L., Lanzer, G., & Pittenger, A. L. (2020). Digital health solutions for blood supply management. The Lancet Haematology, 7(4), e279-e281.

[17] React Documentation. (2024). React -- The library for web and native user interfaces. https://react.dev/

[18] Tailwind CSS. (2024). Tailwind CSS Documentation. https://tailwindcss.com/docs

[19] Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining, 785-794.
