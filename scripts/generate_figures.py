"""Generate all programmatic figures for the GP2 report.

Emits PNG files to damk-3alena/figures/ named figNN_<slug>.png.
Run from inside the venv:
    /Users/.../damk-3alena/scripts/.venv/bin/python generate_figures.py
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, Rectangle
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
FIGURES = ROOT / "figures"
PLANTUML_JAR = Path(__file__).resolve().parent / "plantuml.jar"

FIGURES.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# PlantUML helper
# ---------------------------------------------------------------------------

def plantuml_to_png(puml_text: str, out_name: str) -> None:
    """Render a PlantUML source string to figures/<out_name>.png via java jar."""
    tmp = FIGURES / f"_{out_name}.puml"
    tmp.write_text(puml_text, encoding="utf-8")
    cmd = [
        "java", "-jar", str(PLANTUML_JAR),
        "-tpng",
        "-Sdpi=160",
        "-o", str(FIGURES.resolve()),
        str(tmp),
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"[plantuml ERROR] {out_name}\nSTDOUT: {res.stdout}\nSTDERR: {res.stderr}")
        raise SystemExit(1)
    produced = FIGURES / f"_{out_name}.png"
    target = FIGURES / f"{out_name}.png"
    if produced.exists():
        produced.replace(target)
    tmp.unlink(missing_ok=True)
    print(f"  wrote {target.name}  ({target.stat().st_size // 1024} KB)")


def save_mpl(fig, out_name: str) -> None:
    target = FIGURES / f"{out_name}.png"
    fig.savefig(target, dpi=200, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    print(f"  wrote {target.name}  ({target.stat().st_size // 1024} KB)")


# ---------------------------------------------------------------------------
# Figure 1 — Gantt chart
# ---------------------------------------------------------------------------

def fig01_gantt() -> None:
    print("Fig 1  Gantt chart")
    tasks = [
        # (label, phase_color, start_day, duration_days)
        ("Project setup & environment",       "P1", 0,   7),
        ("Dataset selection & generation",    "P1", 4,   10),
        ("Data cleaning & EDA",               "P1", 10,  10),
        ("Schema & feature design",           "P1", 14,  7),
        ("Demand forecast (XGBoost)",         "P2", 21,  14),
        ("Shortage detection module",         "P2", 28,  10),
        ("Donor recommendation engine",       "P2", 32,  10),
        ("ER diagram & REST API design",      "P2", 21,  10),
        ("Supabase backend + RLS",            "P2", 30,  18),
        ("Mobile UI (Expo / React Native)",   "P3", 49,  14),
        ("Mobile <-> Supabase integration",   "P3", 56,  10),
        ("Dashboard UI (React / Tailwind)",   "P3", 49,  18),
        ("AI service integration",            "P3", 60,  10),
        ("End-to-end integration testing",    "P4", 70,  14),
        ("System evaluation (test cases)",    "P4", 75,  14),
        ("Dashboard AI visualization",        "P4", 70,  10),
        ("Bilingual (EN/AR) localization",    "P4", 80,  10),
        ("Performance optimization",          "P4", 85,  8),
        ("Docs, presentation, demo",          "P4", 84,  14),
    ]
    phase_colors = {
        "P1": "#8B5E3C",  # warm brown
        "P2": "#C0392B",  # red (Damk)
        "P3": "#1F4E79",  # blue
        "P4": "#5B7553",  # green
    }
    phase_labels = {
        "P1": "Phase 1: Setup & Data (Mar 1 – Mar 21)",
        "P2": "Phase 2: AI & Backend (Mar 22 – Apr 18)",
        "P3": "Phase 3: Integration & Frontend (Apr 19 – May 9)",
        "P4": "Phase 4: Testing & Delivery (May 10 – Jun 6)",
    }

    fig, ax = plt.subplots(figsize=(14, 8))
    y_positions = list(range(len(tasks)))
    for i, (label, phase, start, dur) in enumerate(tasks):
        ax.barh(i, dur, left=start, color=phase_colors[phase], edgecolor="black", linewidth=0.4, height=0.6)
    ax.set_yticks(y_positions)
    ax.set_yticklabels([t[0] for t in tasks], fontsize=9)
    ax.invert_yaxis()
    ax.set_xlabel("Days from project start (Mar 1, 2026)", fontsize=10)
    ax.set_title("Damk 3alena — GP2 Project Gantt Chart", fontsize=13, fontweight="bold", pad=14)

    # Phase boundary markers
    for boundary, txt in [(21, "Mar 22"), (49, "Apr 19"), (70, "May 10"), (98, "Jun 6")]:
        ax.axvline(boundary, color="gray", linestyle="--", linewidth=0.5, alpha=0.7)
    ax.set_xlim(0, 100)
    ax.grid(axis="x", linestyle=":", alpha=0.3)

    handles = [mpatches.Patch(color=c, label=phase_labels[p]) for p, c in phase_colors.items()]
    ax.legend(handles=handles, loc="lower right", fontsize=9, framealpha=0.95)

    save_mpl(fig, "fig01_gantt")


# ---------------------------------------------------------------------------
# Figure 2 — PERT chart
# ---------------------------------------------------------------------------

def fig02_pert() -> None:
    print("Fig 2  PERT chart")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityBorderColor #333333
skinparam ArrowColor #555555
skinparam ActivityDiamondBackgroundColor #FAFAFA

title Damk 3alena — PERT Network (Phases & Critical Path)

start
:**A** Project Setup & Env  \n(7 days);
:**B** Dataset Generation \n(10 days);
:**C** Data Cleaning & EDA \n(10 days);
:**D** Schema & Feature Design \n(7 days);
fork
  :**E** Demand Forecast (XGBoost) \n(14 days);
  :**F** Shortage Detection \n(10 days);
  :**G** Donor Recommender \n(10 days);
fork again
  :**H** ER Diagram & API Design \n(10 days);
  :**I** Supabase + RLS \n(18 days);
end fork
fork
  :**J** Mobile UI (Expo) \n(14 days);
  :**K** Mobile <-> Supabase \n(10 days);
fork again
  :**L** Dashboard UI \n(18 days);
  :**M** AI Service Integration \n(10 days);
end fork
:**N** End-to-End Testing \n(14 days);
:**O** System Evaluation \n(14 days);
:**P** Localization EN/AR \n(10 days);
:**Q** Documentation & Demo \n(14 days);
stop

note right
  **Critical Path** (longest):
  A → B → C → D → I → L → N → O → Q
  ~ 100 working days
end note
@enduml
"""
    plantuml_to_png(src, "fig02_pert")


# ---------------------------------------------------------------------------
# Figure 3 — Agile/Scrum methodology
# ---------------------------------------------------------------------------

def fig03_agile() -> None:
    print("Fig 3  Agile/Scrum methodology")
    fig, ax = plt.subplots(figsize=(12, 7))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis("off")

    # Backlog box
    backlog = FancyBboxPatch((0.3, 4.2), 2.6, 1.6, boxstyle="round,pad=0.06",
                             linewidth=1.2, edgecolor="#333", facecolor="#FCE3D5")
    ax.add_patch(backlog)
    ax.text(1.6, 5.4, "Product\nBacklog", ha="center", va="center", fontsize=11, fontweight="bold")
    ax.text(1.6, 4.7, "Prioritized\nuser stories", ha="center", va="center", fontsize=8, color="#555")

    # Sprint planning -> sprint backlog
    sprint_backlog = FancyBboxPatch((4.0, 4.2), 2.4, 1.6, boxstyle="round,pad=0.06",
                                    linewidth=1.2, edgecolor="#333", facecolor="#FBE6A2")
    ax.add_patch(sprint_backlog)
    ax.text(5.2, 5.4, "Sprint\nBacklog", ha="center", va="center", fontsize=11, fontweight="bold")
    ax.text(5.2, 4.7, "Selected for\n2-week sprint", ha="center", va="center", fontsize=8, color="#555")

    # Sprint loop circle
    circle_x, circle_y, radius = 8.6, 5.0, 1.4
    circle = mpatches.Circle((circle_x, circle_y), radius, linewidth=1.6,
                             edgecolor="#C0392B", facecolor="#FFF1EE")
    ax.add_patch(circle)
    ax.text(circle_x, circle_y + 0.4, "2-week\nSprint", ha="center", va="center",
            fontsize=11, fontweight="bold", color="#C0392B")
    ax.text(circle_x, circle_y - 0.4, "Daily Scrum\nDevelopment", ha="center", va="center",
            fontsize=8, color="#555")

    # Increment box
    increment = FancyBboxPatch((10.4, 4.2), 1.4, 1.6, boxstyle="round,pad=0.06",
                               linewidth=1.2, edgecolor="#333", facecolor="#D5E8C4")
    ax.add_patch(increment)
    ax.text(11.1, 5.0, "Increment\n(Working\nSoftware)", ha="center", va="center",
            fontsize=9, fontweight="bold")

    # Arrows top row
    for x_start, x_end in [(2.95, 3.95), (6.45, 7.15), (10.05, 10.35)]:
        ax.annotate("", xy=(x_end, 5.0), xytext=(x_start, 5.0),
                    arrowprops=dict(arrowstyle="->", lw=1.4, color="#333"))

    # Sprint Review / Retrospective box (below)
    review = FancyBboxPatch((6.6, 1.2), 4.0, 1.5, boxstyle="round,pad=0.06",
                            linewidth=1.2, edgecolor="#333", facecolor="#E1D5E7")
    ax.add_patch(review)
    ax.text(8.6, 2.2, "Sprint Review &\nRetrospective", ha="center", va="center",
            fontsize=11, fontweight="bold")
    ax.text(8.6, 1.55, "Stakeholder feedback → adapt backlog", ha="center", va="center",
            fontsize=8, color="#555")

    # Feedback loop arrow back to Backlog
    ax.annotate("", xy=(1.6, 4.15), xytext=(7.0, 1.95),
                arrowprops=dict(arrowstyle="->", lw=1.2, color="#888",
                                connectionstyle="arc3,rad=-0.35", linestyle="--"))
    ax.text(3.3, 2.6, "Feedback loop", fontsize=8, color="#888", style="italic")

    # Roles labels at bottom
    ax.text(2.0, 0.45, "Product Owner", fontsize=9, ha="center", color="#333", fontweight="bold")
    ax.text(2.0, 0.15, "owns the backlog", fontsize=7, ha="center", color="#777")

    ax.text(6.0, 0.45, "Developers", fontsize=9, ha="center", color="#333", fontweight="bold")
    ax.text(6.0, 0.15, "build the increment", fontsize=7, ha="center", color="#777")

    ax.text(10.0, 0.45, "Scrum Master", fontsize=9, ha="center", color="#333", fontweight="bold")
    ax.text(10.0, 0.15, "removes impediments", fontsize=7, ha="center", color="#777")

    ax.set_title("Agile / Scrum Framework — adapted to Damk 3alena", fontsize=13, fontweight="bold", pad=10)
    save_mpl(fig, "fig03_agile_scrum")


# ---------------------------------------------------------------------------
# Figure 4 — Use case diagram
# ---------------------------------------------------------------------------

def fig04_usecase() -> None:
    print("Fig 4  Use case diagram")
    src = r"""
@startuml
!pragma layout smetana
left to right direction
skinparam packageStyle rectangle
skinparam defaultFontName Helvetica
skinparam actorStyle awesome

actor "Donor" as D
actor "Hospital Staff" as S
actor "Administrator" as A

rectangle "Damk 3alena System" {
  usecase "UC-01 Register / Sign Up" as UC01
  usecase "UC-02 Login" as UC02
  usecase "UC-03 Request Location Access" as UC03
  usecase "UC-04 View Map & Blood Banks" as UC04
  usecase "UC-05 Book Appointment" as UC05
  usecase "UC-06 Cancel Appointment" as UC06
  usecase "UC-07 View Notifications" as UC07
  usecase "UC-08 View Personal Info\n& Donation History" as UC08
  usecase "UC-09 Forgot Password" as UC09
  usecase "UC-10 Dashboard Login" as UC10
  usecase "UC-11 Create Blood Request" as UC11
  usecase "UC-12 View / Manage\nAppointments" as UC12
  usecase "UC-13 Manage Request Status" as UC13
  usecase "UC-14 View AI Outputs" as UC14
  usecase "UC-15 Manage User Roles" as UC15
  usecase "UC-16 Configure System\nParameters" as UC16
}

D --> UC01
D --> UC02
D --> UC03
D --> UC04
D --> UC05
D --> UC06
D --> UC07
D --> UC08
D --> UC09

S --> UC10
S --> UC11
S --> UC12
S --> UC13
S --> UC14

A --> UC10
A --> UC15
A --> UC16
A --> UC14
@enduml
"""
    plantuml_to_png(src, "fig04_usecase")


# ---------------------------------------------------------------------------
# Figures 5-8 — Activity diagrams
# ---------------------------------------------------------------------------

def fig05_activity_register() -> None:
    print("Fig 5  Activity: Donor Registration")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
skinparam ActivityBackgroundColor #FFFFFF
skinparam ActivityDiamondBackgroundColor #FAFAFA

title Activity Diagram — Donor Registration with OTP (UC-01)

start
:Open Sign Up;
:Enter registration details
(name, email, phone, blood type,
gender, DOB, city, weight);
if (Fields valid?) then (no)
  :Show validation errors;
  stop
else (yes)
  :Create auth account in Supabase;
  :Send 6-digit OTP to email;
  :Donor enters OTP;
  if (OTP valid?) then (no)
    if (Expired?) then (yes)
      :Resend OTP;
    else (no)
      :Show error;
    endif
    stop
  else (yes)
    :Create user record;
    :Create donor profile;
    :Request location permission;
    :Navigate to Home screen;
  endif
endif
stop
@enduml
"""
    plantuml_to_png(src, "fig05_activity_register")


def fig06_activity_book() -> None:
    print("Fig 6  Activity: Book Appointment")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Activity Diagram — Book Appointment (UC-05)

start
:Select facility from Map;
:View facility details &
working hours;
:Select date from calendar;
:Select time slot;
:Press Confirm Booking;
if (Has active appointment?) then (yes)
  :Show error: already booked;
  stop
else (no)
  if (Within 90-day cooldown?) then (yes)
    :Show next eligible date;
    stop
  else (no)
    :Insert appointment record;
    :Generate ticket code;
    :Generate QR code;
    :Display appointment ticket;
  endif
endif
stop
@enduml
"""
    plantuml_to_png(src, "fig06_activity_book")


def fig07_activity_forgot() -> None:
    print("Fig 7  Activity: Forgot Password")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Activity Diagram — Forgot Password with OTP (UC-09)

start
:Enter email address;
if (Email format valid?) then (no)
  :Show error;
  stop
else (yes)
  :Send reset OTP via Supabase;
  :Donor enters 6-digit OTP;
  if (OTP valid?) then (no)
    :Show error, clear code;
    stop
  else (yes)
    :Show new-password form;
    :Enter new password + confirm;
    if (Passwords match
and length OK?) then (no)
      :Show mismatch / length error;
      stop
    else (yes)
      :Update password
      via Supabase Auth;
      :Show success message;
      :Navigate to Login;
    endif
  endif
endif
stop
@enduml
"""
    plantuml_to_png(src, "fig07_activity_forgot")


def fig08_activity_create_request() -> None:
    print("Fig 8  Activity: Create Blood Request")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Activity Diagram — Create Blood Request (UC-11)

start
:Staff opens Create Request page;
:Enter blood type, units, urgency,
patient name, file number, notes;
if (Required fields valid?) then (no)
  :Highlight errors;
  stop
else (yes)
  :Insert request with status = "open";
  :Trigger donor notifications
  (matching blood type & city);
  :Navigate to Requests page;
endif
stop
@enduml
"""
    plantuml_to_png(src, "fig08_activity_create_request")


# ---------------------------------------------------------------------------
# Figures 9-12 — Sequence diagrams
# ---------------------------------------------------------------------------

def fig09_seq_register() -> None:
    print("Fig 9  Sequence: Donor Registration")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
skinparam sequenceMessageAlign center
title Sequence Diagram — Donor Registration with OTP

actor Donor
participant "Mobile App" as App
participant "Supabase Auth" as Auth
database "users" as UDB
database "donors" as DDB

Donor -> App: fill registration form
App -> Auth: signUp(email, password, metadata)
Auth -> Auth: INSERT auth.users
Auth -> Donor: send 6-digit OTP (email)
Auth --> App: needs verification
App --> Donor: show OTP screen

Donor -> App: enter OTP
App -> Auth: verifyOtp(email, token, type=signup)
Auth -> Auth: validate token
Auth -> UDB: trigger INSERT user row
Auth --> App: session

App -> UDB: poll for user row
UDB --> App: user.id
App -> UDB: UPDATE phone
App -> DDB: INSERT donor(user_id, blood_type,\nnational_id, gender, birth_date)
DDB --> App: success
App --> Donor: navigate to Home
@enduml
"""
    plantuml_to_png(src, "fig09_seq_register")


def fig10_seq_book() -> None:
    print("Fig 10 Sequence: Book Appointment")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Sequence Diagram — Book Appointment

actor Donor
participant "Mobile App" as App
database "appointments" as ADB
database "donors" as DDB

Donor -> App: select facility
Donor -> App: select date
Donor -> App: select time slot
Donor -> App: confirm booking

App -> ADB: SELECT active appts WHERE\ndonor_id AND status='booked'
ADB --> App: count = 0
App -> DDB: SELECT last_donation_date
DDB --> App: > 90 days ago
App -> ADB: INSERT appointment\n(donor_id, facility_id, date,\ntime, status='booked', ticket)
ADB --> App: appointment.id
App -> App: generate QR code
App --> Donor: show appointment ticket
@enduml
"""
    plantuml_to_png(src, "fig10_seq_book")


def fig11_seq_forecast() -> None:
    print("Fig 11 Sequence: AI Demand Forecast")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Sequence Diagram — AI Demand Forecast

actor Staff
participant "Dashboard" as Dash
participant "AI Service\n(FastAPI)" as AI
participant "Forecast Model\n(XGBoost q10/q50/q90)" as Model

Staff -> Dash: open AI Insights
Dash -> AI: POST /forecast\n{facility_idx, blood_types,\nweeks_ahead}
AI -> Model: predict(features)
Model -> Model: q10 quantile
Model -> Model: q50 quantile
Model -> Model: q90 quantile
Model --> AI: predictions
AI --> Dash: ForecastResponse\n[{blood_type, week,\npredicted, low, high}]
Dash -> Dash: render charts
Dash --> Staff: display forecast
@enduml
"""
    plantuml_to_png(src, "fig11_seq_forecast")


def fig12_seq_shortage() -> None:
    print("Fig 12 Sequence: Shortage Detection")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
title Sequence Diagram — Shortage Detection

actor Staff
participant "Dashboard" as Dash
participant "AI Service\n(FastAPI)" as AI

Staff -> Dash: open AI Insights
Dash -> AI: POST /shortage-detect\n{forecasts, inventory,\nthresholds}
AI -> AI: compare forecast vs inventory
loop for each blood type
  alt units < critical_threshold
    AI -> AI: severity = "critical"
  else units < warning_threshold
    AI -> AI: severity = "warning"
  end
end
AI --> Dash: ShortageResponse\n{alerts: [...]}
Dash -> Dash: render alert cards
Dash --> Staff: display alerts
@enduml
"""
    plantuml_to_png(src, "fig12_seq_shortage")


# ---------------------------------------------------------------------------
# Figure 13 — Class diagram
# ---------------------------------------------------------------------------

def fig13_class() -> None:
    print("Fig 13 Class diagram")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
skinparam classBackgroundColor #FFFFFF
skinparam classBorderColor #333

title Detailed Class Diagram — Damk 3alena

class User {
  +id: UUID
  +auth_id: UUID
  +role: user_role
  +first_name: String
  +last_name: String
  +phone: String
  +email: String
}

class Donor {
  +national_id: String
  +blood_type: blood_type
  +gender: String
  +birth_date: Date
  +is_eligible: Boolean
  +total_donations: Int
  +latitude: Float
  +longitude: Float
  +last_donation_date: Date
}

class Staff {
  +facility_id: UUID
  +position: String
  +is_approved: Boolean
}

class Facility {
  +id: UUID
  +name: String
  +type: String
  +city: String
  +latitude: Float
  +longitude: Float
  +phone: String
  +working_hours: Json
}

class BloodRequest {
  +id: UUID
  +blood_type: blood_type
  +units_needed: Int
  +urgency: request_urgency
  +status: request_status
  +patient_name: String
  +created_at: Timestamp
}

class Appointment {
  +id: UUID
  +appointment_date: Date
  +appointment_time: Time
  +status: appointment_status
  +ticket_code: String
}

class DonationRecord {
  +id: UUID
  +donation_date: Date
  +units: Int
  +blood_type: blood_type
}

class Notification {
  +id: UUID
  +title: String
  +body: String
  +is_read: Boolean
  +sent_at: Timestamp
}

class AIOutput {
  +id: UUID
  +output_type: String
  +generated_at: Timestamp
  +metadata: Json
}

class ForecastResult {
  +forecast_week: Date
  +predicted_units: Float
  +confidence_low: Float
  +confidence_high: Float
}

class ShortageAlert {
  +severity: String
  +current_units: Int
  +threshold: Int
  +is_active: Boolean
}

class DonorRecommendation {
  +score: Float
  +distance_km: Float
  +reasoning: String
}

class SystemParameter {
  +key: String
  +value: String
}

User <|-- Donor
User <|-- Staff
Staff "*" -- "1" Facility
Facility "1" -- "*" BloodRequest : creates
Staff "1" -- "*" BloodRequest
Donor "1" -- "*" Appointment
Facility "1" -- "*" Appointment
Donor "1" -- "*" DonationRecord
Facility "1" -- "*" DonationRecord
Donor "1" -- "*" Notification
Facility "1" -- "*" AIOutput
AIOutput <|-- ForecastResult
AIOutput <|-- ShortageAlert
AIOutput <|-- DonorRecommendation
BloodRequest "1" -- "*" DonorRecommendation
@enduml
"""
    plantuml_to_png(src, "fig13_class")


# ---------------------------------------------------------------------------
# Figure 14 — ER diagram
# ---------------------------------------------------------------------------

def fig14_er() -> None:
    print("Fig 14 ER diagram")
    src = r"""
@startuml
!pragma layout smetana
skinparam defaultFontName Helvetica
skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #333
}
hide circle
hide methods

title Database ER Diagram — PostgreSQL via Supabase (14 core tables)

entity "users" as users {
  *id: UUID <<PK>>
  --
  auth_id: UUID
  role: user_role
  first_name, last_name: text
  phone, email: text
}

entity "donors" as donors {
  *id: UUID <<PK>>
  --
  user_id: UUID <<FK users.id>>
  national_id: text
  blood_type: blood_type
  gender, birth_date
  is_eligible: bool
  total_donations: int
  latitude, longitude: float
}

entity "staff" as staff {
  *id: UUID <<PK>>
  --
  user_id: UUID <<FK users.id>>
  facility_id: UUID <<FK>>
  position, is_approved
}

entity "facilities" as facilities {
  *id: UUID <<PK>>
  --
  name, type, address, city
  latitude, longitude
  phone, working_hours
}

entity "blood_requests" as br {
  *id: UUID <<PK>>
  --
  facility_id: UUID <<FK>>
  created_by: UUID <<FK staff>>
  blood_type, units_needed
  urgency, status
}

entity "appointments" as appts {
  *id: UUID <<PK>>
  --
  donor_id: UUID <<FK>>
  facility_id: UUID <<FK>>
  appointment_date, time
  status, ticket_code
}

entity "donations" as don {
  *id: UUID <<PK>>
  --
  donor_id: UUID <<FK>>
  facility_id: UUID <<FK>>
  donation_date, units
  blood_type
}

entity "notifications" as notif {
  *id: UUID <<PK>>
  --
  donor_id: UUID <<FK>>
  title, body, is_read
  sent_at
}

entity "facility_inventory" as inv {
  *id: UUID <<PK>>
  --
  facility_id: UUID <<FK>>
  blood_type, units
  updated_at
}

entity "ai_outputs" as aio {
  *id: UUID <<PK>>
  --
  facility_id: UUID <<FK>>
  output_type, metadata
  generated_at
}

entity "forecast_results" as fc {
  *id: UUID <<PK>>
  --
  ai_output_id: UUID <<FK>>
  forecast_week
  predicted_units, low, high
}

entity "shortage_alerts" as sa {
  *id: UUID <<PK>>
  --
  ai_output_id: UUID <<FK>>
  severity, current_units
  threshold, is_active
}

entity "donor_recommendations" as rec {
  *id: UUID <<PK>>
  --
  ai_output_id: UUID <<FK>>
  request_id: UUID <<FK>>
  donor_id: UUID <<FK>>
  score, distance_km
}

entity "action_logs" as logs {
  *id: UUID <<PK>>
  --
  user_id: UUID <<FK>>
  action_type, payload
  created_at
}

users ||--o| donors
users ||--o| staff
facilities ||--o{ staff
facilities ||--o{ br
staff ||--o{ br
donors ||--o{ appts
facilities ||--o{ appts
donors ||--o{ don
facilities ||--o{ don
donors ||--o{ notif
facilities ||--o{ inv
facilities ||--o{ aio
aio ||--o{ fc
aio ||--o{ sa
aio ||--o{ rec
br  ||--o{ rec
donors ||--o{ rec
users ||--o{ logs
@enduml
"""
    plantuml_to_png(src, "fig14_er")


# ---------------------------------------------------------------------------
# Figure 15 — Supabase schema overview (table list view)
# ---------------------------------------------------------------------------

def fig15_supabase_schema() -> None:
    print("Fig 15 Supabase schema overview")
    tables = [
        ("users",                  "Auth & profile core",       9),
        ("donors",                 "Donor profile + geo",       12),
        ("staff",                  "Hospital staff link",       6),
        ("facilities",             "Hospitals & blood banks",   10),
        ("blood_requests",         "Open / in-progress / closed", 9),
        ("appointments",           "Donor bookings + ticket",   8),
        ("donations",              "Historical donations",      6),
        ("notifications",          "Donor alerts",              7),
        ("facility_inventory",     "Stock per blood type",      5),
        ("ai_outputs",             "Parent for AI artefacts",   5),
        ("forecast_results",       "XGBoost q10/q50/q90",       7),
        ("shortage_alerts",        "Severity + threshold",      7),
        ("donor_recommendations",  "Match score + reasoning",   8),
        ("action_logs",            "Audit / evaluation trail",  5),
    ]

    fig, ax = plt.subplots(figsize=(12, 8))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, len(tables) + 2)
    ax.axis("off")

    ax.text(6, len(tables) + 1.4, "Supabase Schema Overview — 14 Core Tables",
            ha="center", fontsize=13, fontweight="bold")
    ax.text(6, len(tables) + 0.85, "PostgreSQL via Supabase  ·  Row-Level Security enabled  ·  5 ENUM types",
            ha="center", fontsize=9, color="#666")

    # Header row
    header_y = len(tables) + 0.1
    ax.add_patch(Rectangle((0.3, header_y), 11.4, 0.6, facecolor="#C0392B", edgecolor="black"))
    ax.text(0.6, header_y + 0.3,  "Table",         color="white", fontsize=10, fontweight="bold", va="center")
    ax.text(4.5, header_y + 0.3,  "Purpose",       color="white", fontsize=10, fontweight="bold", va="center")
    ax.text(10.5, header_y + 0.3, "Cols",         color="white", fontsize=10, fontweight="bold", va="center", ha="center")

    for i, (name, purpose, cols) in enumerate(tables):
        y = len(tables) - i - 0.5
        bg = "#FCE3D5" if i % 2 == 0 else "#FFF8F4"
        ax.add_patch(Rectangle((0.3, y), 11.4, 0.55, facecolor=bg, edgecolor="#999", linewidth=0.4))
        ax.text(0.6, y + 0.27,  name,    fontsize=10, family="monospace", va="center", fontweight="bold")
        ax.text(4.5, y + 0.27,  purpose, fontsize=9.5, va="center", color="#333")
        ax.text(10.5, y + 0.27, str(cols), fontsize=10, va="center", ha="center", color="#555")

    save_mpl(fig, "fig15_supabase_schema")


# ---------------------------------------------------------------------------
# Figures 16-18 — AI service output samples
# ---------------------------------------------------------------------------

def fig16_ai_forecast() -> None:
    print("Fig 16 AI: Forecast sample")
    rng = np.random.default_rng(7)
    weeks = np.arange(1, 9)
    blood_types = ["O+", "O-", "A+", "B+"]
    colors = {"O+": "#C0392B", "O-": "#E67E22", "A+": "#2980B9", "B+": "#27AE60"}

    fig, ax = plt.subplots(figsize=(11, 6))
    for bt in blood_types:
        base = rng.uniform(15, 45)
        trend = rng.uniform(-1.5, 2.5)
        noise = rng.normal(0, 1.8, size=len(weeks))
        median = base + trend * weeks + noise
        median = np.clip(median, 5, 80)
        low  = median - rng.uniform(3, 7, size=len(weeks))
        high = median + rng.uniform(3, 7, size=len(weeks))
        ax.fill_between(weeks, low, high, alpha=0.18, color=colors[bt])
        ax.plot(weeks, median, marker="o", linewidth=2.0, label=f"{bt} (median)", color=colors[bt])

    ax.set_xlabel("Forecast Week", fontsize=10)
    ax.set_ylabel("Predicted Units Needed", fontsize=10)
    ax.set_title("AI Service — Sample Demand Forecast (XGBoost Quantile Regression)\n"
                 "Shaded band = q10–q90 confidence interval",
                 fontsize=12, fontweight="bold", pad=10)
    ax.grid(True, linestyle=":", alpha=0.4)
    ax.legend(title="Blood Type", loc="upper left", fontsize=9)
    ax.set_xticks(weeks)

    save_mpl(fig, "fig16_ai_forecast")


def fig17_ai_shortage() -> None:
    print("Fig 17 AI: Shortage sample")
    blood = ["O-", "B-", "A-", "AB-", "O+", "A+", "B+", "AB+"]
    current  = np.array([3, 4, 6, 9, 32, 18, 22, 11])
    forecast = np.array([12, 9, 8, 6, 28, 15, 16, 4])
    warning_thr  = 15
    critical_thr = 5

    severities = []
    for c, f in zip(current, forecast):
        if c <= critical_thr or (f > c and c <= critical_thr + 2):
            severities.append("critical")
        elif c <= warning_thr or f > c:
            severities.append("warning")
        else:
            severities.append("ok")
    sev_color = {"critical": "#C0392B", "warning": "#E67E22", "ok": "#27AE60"}
    bar_colors = [sev_color[s] for s in severities]

    fig, ax = plt.subplots(figsize=(11, 6))
    x = np.arange(len(blood))
    w = 0.38
    ax.bar(x - w/2, current,  width=w, label="Current stock",     color=bar_colors, edgecolor="black", linewidth=0.4)
    ax.bar(x + w/2, forecast, width=w, label="Forecast demand",   color="#888888", edgecolor="black", linewidth=0.4, alpha=0.85)
    ax.axhline(critical_thr, color="#C0392B", linestyle="--", linewidth=1, label=f"Critical threshold ({critical_thr})")
    ax.axhline(warning_thr,  color="#E67E22", linestyle="--", linewidth=1, label=f"Warning threshold ({warning_thr})")
    ax.set_xticks(x)
    ax.set_xticklabels(blood, fontsize=10)
    ax.set_ylabel("Units", fontsize=10)
    ax.set_title("AI Service — Sample Shortage Detection Output\n"
                 "Colored bar = current stock severity  ·  Grey bar = next-week forecast",
                 fontsize=12, fontweight="bold", pad=10)
    ax.grid(axis="y", linestyle=":", alpha=0.4)
    ax.legend(loc="upper right", fontsize=9)
    save_mpl(fig, "fig17_ai_shortage")


def fig18_ai_donor_recs() -> None:
    print("Fig 18 AI: Donor recommendations sample")
    donors = [
        ("Donor #218", "O+", 1.4,  "eligible", 92),
        ("Donor #145", "O+", 2.1,  "eligible", 87),
        ("Donor #309", "O+", 3.6,  "eligible", 79),
        ("Donor #272", "O+", 4.2,  "eligible", 74),
        ("Donor #084", "O-", 0.9,  "eligible", 71),  # universal donor, slightly farther
        ("Donor #511", "O+", 5.7,  "eligible", 65),
        ("Donor #062", "O+", 7.1,  "eligible", 58),
        ("Donor #410", "O+", 8.5,  "eligible", 51),
    ]
    fig, ax = plt.subplots(figsize=(11, 6))
    names  = [d[0] for d in donors]
    scores = [d[4] for d in donors]
    dist   = [d[2] for d in donors]
    btypes = [d[1] for d in donors]
    color  = ["#C0392B" if b == "O-" else "#1F4E79" for b in btypes]

    y = np.arange(len(names))
    ax.barh(y, scores, color=color, edgecolor="black", linewidth=0.4, alpha=0.92)
    for i, (s, d, bt) in enumerate(zip(scores, dist, btypes)):
        ax.text(s + 1.2, i, f"{bt}  ·  {d:.1f} km", va="center", fontsize=9, color="#333")
    ax.set_yticks(y)
    ax.set_yticklabels(names, fontsize=10)
    ax.invert_yaxis()
    ax.set_xlim(0, 105)
    ax.set_xlabel("Match Score (0–100)", fontsize=10)
    ax.set_title("AI Service — Sample Donor Recommendations\n"
                 "Ranked by match score: blood compatibility + distance + eligibility + history",
                 fontsize=12, fontweight="bold", pad=10)
    ax.grid(axis="x", linestyle=":", alpha=0.4)
    save_mpl(fig, "fig18_ai_donor_recs")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    if not PLANTUML_JAR.exists():
        print(f"ERROR: missing {PLANTUML_JAR}")
        sys.exit(2)

    figures = [
        fig01_gantt,
        fig02_pert,
        fig03_agile,
        fig04_usecase,
        fig05_activity_register,
        fig06_activity_book,
        fig07_activity_forgot,
        fig08_activity_create_request,
        fig09_seq_register,
        fig10_seq_book,
        fig11_seq_forecast,
        fig12_seq_shortage,
        fig13_class,
        fig14_er,
        fig15_supabase_schema,
        fig16_ai_forecast,
        fig17_ai_shortage,
        fig18_ai_donor_recs,
    ]
    for fn in figures:
        try:
            fn()
        except Exception as exc:
            print(f"!! FAILED {fn.__name__}: {exc}")
            raise

    print("\nAll programmatic figures generated.")


if __name__ == "__main__":
    main()
