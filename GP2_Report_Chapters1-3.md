# Damk 3alena - Graduation Project 2 Report

**Applied Science Private University**
**Faculty of Information Technology**

**Graduation Project (2) Report**

**Damk 3alena**
**AI-Driven Blood Donation Prediction and Matching System for Jordan**

**Prepared by:**
- Saad Abulihyeh - 202210883
- Sondos Abulihyeh - 202210881
- Raghad Al-Basha - 202210479
- Rawan Daoud - 202210309

**Supervised by:**
Dr. Jaber Al-Widian

**June 2026**

Copyright (c) 2025-2026 Applied Science Private University. All rights are reserved.

---

## Abstract

This report presents the development and implementation of "Damk 3alena," an AI-Driven Blood Donation Prediction and Matching System designed for Jordan. The system addresses critical challenges in blood donation management across the country, including fragmented coordination between donors and hospitals, reliance on manual inventory tracking, and the absence of predictive tools for anticipating blood shortages. Damk 3alena integrates three AI modules -- a blood demand forecasting model using XGBoost quantile regression, a shortage detection engine, and a smart donor recommendation system -- into a unified platform comprising a cross-platform donor mobile application and a hospital/blood bank web dashboard. The donor mobile app, built with React Native (Expo), allows donors to register, track eligibility, receive personalized urgent notifications, view nearby blood banks on an interactive map, and book donation appointments. The hospital dashboard, built with React and TypeScript, enables staff to submit blood requests, manage appointments, monitor real-time blood type inventory, and visualize AI-generated forecasts and shortage alerts. The backend leverages Supabase (PostgreSQL) for data storage, authentication, and row-level security, while the AI service runs as an independent FastAPI microservice. The system was developed over a 14-week period using the Scrum framework with 2-week sprints, and demonstrates a functional proof-of-concept that connects all components end-to-end. Evaluation through black-box testing and user feedback confirms that the system meets its core objectives and offers a viable foundation for improving blood supply management in Jordan.

---

## Contents

- List of Figures
- List of Tables
- List of Symbols
- Abstract
- Chapter 1: Introduction
  - 1.1 Description of the current situation and opportunity
  - 1.2 Related work
  - 1.3 Problem statement (limitation of current systems)
  - 1.4 Problem solution
  - 1.5 Project objectives
  - 1.6 Technology and tools used
  - 1.7 Project Plan (Gantt chart, PERT chart)
- Chapter 2: Requirements and Analysis
  - 2.1 Software Process Model with explanation
  - 2.2 System scope with explanation
  - 2.3 Functional Requirements & Non-Functional Requirements
  - 2.4 Use Case Diagram with Use Cases descriptions
  - 2.5 Activity Diagrams for some use case scenarios
- Chapter 3: Design
  - 3.1 Sequence Diagrams for some use case scenarios
  - 3.2 Detailed Class Diagram
  - 3.3 Database ER Diagram

---

## Chapter 1: Introduction

An essential component of every healthcare system is access to safe and sufficient blood supplies. Healthcare facilities in Jordan experience recurring challenges with blood supply management, including difficulty maintaining adequate reserves for uncommon blood types and responding to unexpected medical emergencies. The current blood donation coordination relies heavily on phone calls, social media requests, and independent hospital operations without real-time tracking capabilities. This situation frequently leads to shortages that create dangerous situations for patients in need.

This project addresses these challenges by developing an AI-powered blood donation management system that integrates predictive analytics with a mobile application and web dashboard. By connecting donors, hospitals, and blood banks through a single intelligent platform, the system transforms blood donation management from a reactive process into a proactive, data-driven operation.

### 1.1 Description of the Current Situation and Opportunity

In Jordan, blood donation activities are organized through a combination of hospital information systems, phone communication, and informal channels such as social media campaigns and personal networks. These methods have several limitations:

- Hospitals do not have a unified, real-time view of blood inventories across different centers.
- Donors often receive information in an unstructured way -- through WhatsApp messages, Instagram posts -- and may not know which hospital is closest or most in need.
- There is no centralized platform that systematically tracks donor eligibility, donation history, and upcoming needs.
- Decisions about when and where to run blood donation campaigns are typically based on experience and rough estimates rather than data-driven forecasting.

This situation creates a clear opportunity to introduce a system that connects donors, hospitals, and blood banks through a single platform. Using AI to analyze historical donation and consumption patterns, the system can predict blood demand, detect shortages early, and suggest appropriate donors to hospitals autonomously. Donors can participate easily through a mobile application, and hospital staff can benefit from a web dashboard with real-time analytics.

### 1.2 Related Work

Several blood donation applications and systems exist worldwide, offering useful baselines for this project:

**Mendami:** An official Libyan application launched to manage blood donations in Libya. Mendami provides appointment booking, location-based search for blood banks, campaign notifications, and unified donation records across multiple hospitals. It improves coordination and accessibility for donors. However, it does not incorporate advanced AI modules such as demand forecasting, shortage prediction, or personalized recommender systems as core capabilities [6].

**Red Cross and NGO Apps:** Donor applications for registration, appointment scheduling, and basic notifications are available from numerous Red Cross societies and non-governmental organizations. Though they frequently rely on static criteria rather than dynamic AI-driven predictions, these applications usually prioritize convenience and engagement [2].

**Academic Prototypes:** Numerous machine-learning models for forecasting blood demand, donor return behavior, or categorizing eligible donors exist in the research literature. However, these models are frequently employed as stand-alone experiments rather than being integrated into complete operational systems that hospitals and donors use.

In contrast to existing solutions, Damk 3alena integrates the coordination features of applications like Mendami with explicit AI modules for: (1) forecasting blood demand at Jordanian hospitals, (2) identifying present and future shortages, and (3) suggesting donors based on data-driven insights including blood type compatibility, geographic proximity, and eligibility status.

### 1.3 Problem Statement (Limitation of Current Systems)

The main problems and limitations that this project addresses are:

- **Lack of Predictive Capabilities:** Existing systems do not forecast blood demand or identify shortages in advance using AI. Hospitals often realize shortages only when inventory is already low, leading to urgent appeals and stress on staff and donors.

- **Manual and Fragmented Coordination:** Communication between donors, hospitals, and blood banks is largely manual. There is no unified digital platform specifically designed for Jordan that centralizes requests, inventory visibility, and donor engagement.

- **Limited Use of Data and AI:** Historical data on donations and consumption is rarely leveraged. Few systems in Jordan apply machine learning to forecast demand, estimate donor availability, or optimize campaign planning.

- **Unstructured Donor Engagement:** Donors are not always notified at the right time or in the right way. There is no intelligent recommender that matches donors with hospitals based on urgency, blood type, and eligibility status.

- **Unorganized Requesting for Donations:** When a hospital experiences a shortage, responses depend heavily on social media posts, WhatsApp groups, or personal networks, which can be slow and unreliable, especially for rare blood types or emergency cases.

### 1.4 Problem Solution

To address the problems identified above, this project implements an AI-Powered Blood Donation Management System with the following solution components:

**AI Demand Forecasting:** The system uses an XGBoost quantile regression model to predict future blood needs by blood type and facility before shortages occur. Three quantile models (q10, q50, q90) provide lower-bound, median, and upper-bound predictions, enabling hospitals to plan donation campaigns proactively rather than waiting until supplies run out.

**Shortage Detection Engine:** A dedicated module compares forecasted demand against current inventory levels and configurable thresholds (warning at 15 units, critical at 5 units) to detect and flag shortage risks. Active alerts are automatically generated and displayed on the hospital dashboard.

**Smart Donor Recommendation:** A recommendation engine matches suitable donors to hospital requests based on blood type compatibility, geographic proximity (calculated using the Haversine formula), eligibility status, and historical donation behavior, producing a ranked list of recommended donors with reasoning.

**Central Digital Platform:** A single platform connects donors with hospitals and blood banks. The donor mobile application (React Native/Expo) handles registration, eligibility tracking, appointment booking, map-based blood bank discovery, and push notifications. The hospital web dashboard (React/TypeScript) provides request management, appointment tracking, inventory monitoring, and AI output visualization.

**Secure Backend Infrastructure:** Supabase (PostgreSQL) serves as the backend with built-in authentication, row-level security (RLS) policies, and real-time capabilities. The AI service operates as an independent FastAPI microservice, communicating with the dashboard via REST API endpoints.

### 1.5 Project Objectives

The objectives of this project are to:

1. Design and develop the "Damk 3alena" cross-platform mobile application to enable donor registration, eligibility tracking, location-based blood bank search, appointment scheduling with QR-code tickets, and personalized notification services.

2. Build and deploy an AI demand forecasting model using XGBoost quantile regression to predict weekly blood needs by blood type and facility using synthetic datasets representative of Jordanian donation patterns.

3. Create a shortage detection system that compares forecasted demand against current inventory and configurable thresholds, automatically generating warning and critical alerts.

4. Develop a donor recommendation engine that matches suitable donors to hospital requests based on blood type compatibility, geographic proximity, eligibility status, and donation history.

5. Implement a web dashboard for hospitals and blood banks to submit blood requests, manage appointments, monitor blood type inventory levels, and visualize AI-generated forecasts, shortage alerts, and donor recommendations.

6. Integrate all system components (mobile app, dashboard, backend database, and AI microservice) into a functional end-to-end prototype demonstrating the complete workflow.

### 1.6 Technology and Tools Used

The project uses the following technologies organized by system component:

**Front-End: Donor Mobile Application**
| Technology | Purpose |
|---|---|
| React Native 0.81 | Cross-platform mobile framework for Android and iOS |
| Expo SDK 54 | Development toolchain, build system, and native module management |
| Expo Router 6 | File-based routing for navigation |
| TypeScript 5.9 | Type-safe JavaScript for development |
| React Context API | State management for user session, profile, and app data |
| react-native-maps 1.20 | Interactive Google Maps integration with markers and callouts |
| react-native-qrcode-svg | QR code generation for appointment tickets |
| expo-location | GPS-based donor location tracking |
| expo-haptics | Haptic feedback for user interactions |
| Zod 3.25 | Runtime schema validation |

**Front-End: Hospital/Blood Bank Dashboard**
| Technology | Purpose |
|---|---|
| React 19 | UI component library |
| TypeScript 5.9 | Type-safe development |
| Vite 8 | Build tool and development server |
| Tailwind CSS 4 | Utility-first CSS framework for responsive styling |
| React Router 7 | Client-side routing |
| Recharts 3 | Data visualization library for charts and graphs |
| Framer Motion 12 | Animation library for UI transitions |
| Supabase JS Client | Database access and authentication |

**Back-End & Database**
| Technology | Purpose |
|---|---|
| Supabase | Backend-as-a-Service platform (authentication, database, real-time) |
| PostgreSQL | Relational database with custom ENUM types and indexes |
| Row-Level Security (RLS) | Fine-grained access control policies per user role |
| Supabase Auth | Email/password authentication with OTP verification |
| Database Functions | SQL helper functions for role/ID lookups and auto-timestamps |

**AI / Data Science**
| Technology | Purpose |
|---|---|
| Python 3.11 | Primary language for AI modules |
| FastAPI 0.115 | REST API framework for serving AI endpoints |
| XGBoost 2.0 | Gradient boosting for demand forecasting (quantile regression) |
| Scikit-learn 1.6 | Model evaluation metrics and preprocessing |
| Pandas 2.2 / NumPy 2.2 | Data manipulation and numerical computation |
| Uvicorn 0.34 | ASGI server for production deployment |

**Development & Collaboration Tools**
| Tool | Purpose |
|---|---|
| Git / GitHub | Version control and code collaboration |
| VS Code | Primary code editor with extensions |
| Postman | API testing and documentation |
| draw.io (diagrams.net) | UML diagrams, ER diagrams, and flowcharts |
| Supabase Dashboard | Database management, migrations, and monitoring |

### 1.7 Project Plan (Gantt Chart, PERT Chart)

The GP2 development timeline spans from March 1st to June 6th, 2026, organized into four sequential phases with 2-week sprint cycles following the Scrum framework.

**Phase One (01/03 - 21/03): Project Setup & Data Preparation**
This phase focuses on foundational activities including project environment setup, dataset selection and generation, data cleaning and preprocessing, exploratory data analysis (EDA), and design of the data schema and AI features. These tasks establish the data and system groundwork required for subsequent development.

**Phase Two (22/03 - 18/04): AI Model & Backend Development**
Phase Two centers on building core system intelligence and infrastructure. It includes developing the demand forecasting model using XGBoost, implementing the shortage detection module, building the donor recommendation engine, designing the database ER diagram and REST APIs, and implementing the Supabase backend with RLS policies. Several tasks run in parallel to accelerate development.

**Phase Three (19/04 - 09/05): AI Integration & Frontend Development**
This phase integrates AI modules into the backend while advancing user-facing components. Key tasks include developing the donor mobile application UI with React Native/Expo, connecting the mobile app to Supabase, building the hospital dashboard UI with React/Tailwind, and integrating the AI FastAPI service with the dashboard. The overlap reflects coordinated frontend-backend integration.

**Phase Four (10/05 - 06/06): Testing, Evaluation & Delivery**
The final phase focuses on system-level completion including end-to-end integration testing, system evaluation with test cases, dashboard visualization of AI outputs, bilingual (English/Arabic) localization, performance optimization, and preparation of documentation, presentations, and the final demonstration.

*[Gantt Chart - Figure 1]*
*[PERT Chart - Figure 2]*

*(Note: Gantt and PERT chart images to be inserted from draw.io)*

---

## Chapter 2: Requirements and Analysis

### 2.1 Software Process Model

The project follows the **Agile methodology** using the **Scrum framework**, where the system is delivered in incremental iterations (Sprints) rather than a single release at the end. Agile development emphasizes collaboration, flexibility, continuous delivery, and stakeholder feedback [3][8]. The Agile Manifesto values prioritize individuals and interactions, working software, customer collaboration, and responding to change [1].

**Why Scrum:** Scrum was selected because the project is a proof-of-concept system with multiple components (AI modules + backend + mobile app + dashboard). Scrum supports incremental delivery, allowing the team to build a usable version early and then improve it through repeated Sprint cycles and feedback. Scrum also makes the effectiveness of current work practices visible so the team can continuously improve [9].

**Scrum Team Roles:** According to the Scrum Guide [9], the Scrum Team consists of:
- **Product Owner (PO):** Accountable for maximizing product value and managing the Product Backlog -- creating, ordering, and ensuring the backlog is understood by the team.
- **Developers:** Responsible for creating a usable Increment each Sprint, producing the Sprint Backlog plan, and meeting the Definition of Done.
- **Scrum Master:** Accountable for establishing Scrum as defined in the Scrum Guide, ensuring Scrum events occur, supporting team effectiveness, and helping remove impediments.

**Scrum Events:** Sprints are fixed-length events of two weeks each. The core Scrum events include [9]:
- **Sprint Planning:** Initiates the Sprint and defines the work to be performed.
- **Daily Scrum:** A short daily event to inspect progress toward the Sprint Goal and adapt the Sprint Backlog.
- **Sprint Review:** Inspects the Sprint outcome with stakeholders and discusses next steps.
- **Sprint Retrospective:** Improves quality and effectiveness by identifying improvements.

**Scrum Artifacts:** The three formal artifacts that increase transparency [9]:
- **Product Backlog:** An ordered list of what is needed to improve the product; the single source of work for the Scrum Team.
- **Sprint Backlog:** The Sprint Goal, selected backlog items, and the actionable plan to deliver them.
- **Increment:** A usable, verified piece of the product that is a step toward the Product Goal.

For GP2 (14 weeks), we used **2-week Sprints** (7 sprints total) to ensure continuous progress and frequent integration across all four components: donor mobile app, hospital dashboard, Supabase backend, and AI microservice.

*[Figure 3 - Agile/Scrum Methodology Diagram]*

### 2.2 System Scope with Explanation

The proposed system targets three stakeholder groups involved in the blood donation process: **blood donors**, **hospital/blood bank staff**, and **system administrators**. Donors interact with the solution through a cross-platform mobile application, while hospital and blood bank staff use a web-based dashboard. Administrators oversee access control and system configuration through the same dashboard with elevated privileges.

**Project Scope for GP2:**

The scope is to deliver a proof-of-concept platform demonstrating an end-to-end workflow for blood donation management enhanced by AI. The key deliverables include:

1. **Donor Mobile Application Prototype:** A cross-platform (Android/iOS) mobile app built with React Native and Expo, supporting donor registration with email OTP verification, eligibility tracking with 90-day cooldown, interactive map with Google Maps integration, appointment booking with QR-code tickets, push notifications for urgent requests, and bilingual (English/Arabic) interface with RTL support.

2. **Hospital/Blood Bank Dashboard Prototype:** A responsive web application built with React and Tailwind CSS, supporting staff authentication, blood request creation and management, appointment viewing, blood type inventory monitoring with visual indicators, AI output visualization (forecasts, shortage alerts, donor recommendations), user role management, and bilingual interface.

3. **Backend Database and API Layer:** A Supabase (PostgreSQL) backend with 14 tables, custom ENUM types, row-level security policies for role-based access control, database functions for user/role lookups, and real-time data synchronization between mobile app and dashboard.

4. **AI Microservice:** A FastAPI-based Python microservice providing three REST endpoints: `/forecast` for blood demand prediction, `/shortage-detect` for shortage identification, and `/recommend-donors` for intelligent donor-hospital matching.

**Scope Exclusions:**
This scope excludes clinical/laboratory activities (blood testing and transfusion procedures), real national-scale deployment, integration with existing hospital information systems, and real patient data. The focus is on producing a working prototype within the GP2 timeline that can be demonstrated through realistic scenarios using synthetic data and evaluated based on the defined requirements.

### 2.3 Functional Requirements & Non-Functional Requirements

#### 2.3.1 Donor Mobile Application Functional Requirements

- **FR-01:** The system shall allow a donor to sign up using email, password, first name, last name, phone number, national ID, blood type, gender, date of birth, city, and weight.
- **FR-02:** The system shall verify donor email through a 6-digit OTP code sent to the registered email address before activating the account.
- **FR-03:** The system shall allow a donor to log in using email/phone number and password.
- **FR-04:** The system shall request location access after login/signup to enable distance-based features.
- **FR-05:** The Home page shall display: donor name and avatar, donation statistics (total donations, eligibility status), next eligible donation date with visual countdown, and an appointment status widget with a "Book Appointment" action.
- **FR-06:** The Map page shall display the locations of hospitals and blood banks on an interactive Google Map with markers indicating blood need severity (critical, low, moderate, adequate). Each facility shall show a card with name, address, city, working hours, blood type needs, a "Directions" button (opening Google Maps navigation), and a "Donate Here" button to book an appointment. The Map page shall support search by name/city and filtering by facility type and critical need.
- **FR-07:** The system shall allow donors to book donation appointments by selecting a facility, date, and time slot. The system shall prevent double-booking (one active appointment at a time) and enforce a 90-day cooldown between donations.
- **FR-08:** Upon booking confirmation, the system shall generate an appointment ticket containing a QR code, hospital name, date/time, and a unique ticket code.
- **FR-09:** The system shall allow donors to cancel a booked appointment, updating the status and removing the active ticket.
- **FR-10:** The Notifications page shall display alerts for urgent blood requests relevant to the donor's blood type, eligibility reminders, and campaign announcements. Notifications shall show type, title, body, timestamp, and read/unread status.
- **FR-11:** The Personal Information page shall display: profile details (name, blood type, gender, date of birth, city, weight), donation history, and settings including theme (light/dark/system), language (English/Arabic), and account management (edit email, reset password).
- **FR-12:** The system shall support a "Forgot Password" flow using a 6-digit OTP sent to the donor's email, followed by a new password entry screen.

#### 2.3.2 Hospital/Blood Bank Dashboard Functional Requirements

- **FR-13:** The system shall allow authorized hospital/blood bank staff to log in to the dashboard using email and password.
- **FR-14:** The dashboard home page shall display summary statistics: open requests count, total requests count, today's appointments count, and active donors count. It shall also display a blood type inventory chart showing units available per blood type with LOW indicators for types below threshold, a weekly donor bookings bar chart, and a gender distribution pie chart.
- **FR-15:** The system shall allow staff to create a blood request specifying blood type, units needed, urgency level (normal/urgent/critical), patient name, patient file number, and notes.
- **FR-16:** The Appointments page shall display all donor appointments for the facility with donor details, date/time, status, and actions to update status.
- **FR-17:** The Requests page shall display submitted blood requests with filtering and status management (open, in-progress, fulfilled, closed).
- **FR-18:** The AI Insights page shall display AI-generated outputs: demand forecast charts with confidence intervals, active shortage alerts with severity levels, and recommended donors for open requests with matching scores and reasoning.
- **FR-19:** The User Management page (admin only) shall allow viewing all users, assigning roles (donor/staff/admin), and approving staff accounts.
- **FR-20:** The System Settings page (admin only) shall allow configuring system parameters: shortage thresholds, eligibility days between donations, notification radius, and forecast horizon.
- **FR-21:** The dashboard shall support bilingual interface (English/Arabic) with RTL layout support.

#### 2.3.3 Back-End Services

- **FR-22:** The system shall store and manage data for users, donors, staff, facilities, blood requests, appointments, donation records, notifications, facility inventory, AI outputs, forecast results, shortage alerts, donor recommendations, system parameters, and action logs in a PostgreSQL database through Supabase.
- **FR-23:** The system shall enforce row-level security (RLS) policies ensuring donors can only access their own data, staff can only access data related to their facility, and administrators have full access.
- **FR-24:** The system shall provide authentication using Supabase Auth with email/password and OTP verification.
- **FR-25:** The system shall log key actions (request created, notification triggered, appointment booked/cancelled) in an action_logs table for evaluation and auditing.

#### 2.3.4 AI Functions

- **FR-26:** The AI service shall generate blood demand forecasts for a selected facility and blood types using XGBoost quantile regression, providing median predictions with lower-bound (q10) and upper-bound (q90) confidence intervals for a configurable forecast horizon (default: 4 weeks).
- **FR-27:** The AI service shall detect and flag shortage risks by comparing forecasted demand against current inventory and configurable thresholds (warning at 15 units, critical at 5 units), generating structured alerts with severity levels and descriptive messages.
- **FR-28:** The AI service shall generate ranked donor recommendations for a given blood request based on: blood type compatibility, geographic proximity (Haversine distance), eligibility status, and donation history, providing a match score and human-readable reasoning for each recommendation.

#### 2.3.5 Non-Functional Requirements

**Security**
- The system shall protect donor and staff data using Supabase Auth with secure email/password authentication and OTP-based email verification.
- Sensitive personal information (national ID, phone, date of birth, donation history) shall be protected during storage and transmission using HTTPS and PostgreSQL encryption at rest.
- Row-level security (RLS) policies shall ensure role-based data isolation: donors access only their own records, staff access only their facility's data, and administrators have full system access.

**Reliability**
- The system shall remain available during normal operation with minimal downtime, leveraging Supabase's managed infrastructure with automatic backups.
- Core data (donor profiles, appointments, donation history, requests) shall be persisted in PostgreSQL with referential integrity constraints and cascading deletes where appropriate.

**Performance**
- The system shall provide fast response times for critical user actions including login, loading map data, booking appointments, and viewing notifications without noticeable delays.
- AI predictions shall be pre-computed and cached, with the forecasting model loaded at service startup to eliminate per-request training latency.
- The dashboard shall use a real-time "Live" indicator with manual refresh capability to keep displayed data current.

**Scalability**
- The system architecture separates concerns into four independent components (mobile app, dashboard, Supabase backend, AI microservice) that can be scaled independently.
- The AI service is containerized with Docker support, allowing horizontal scaling as data volume increases.
- Database indexes on frequently queried columns (blood_type, status, facility_id, donor_id) ensure query performance at scale.

**Usability**
- The donor mobile application shall provide a user-friendly interface with clear bottom-tab navigation across four main pages (Home, Map, Urgent Requests, Profile).
- Both mobile app and dashboard shall support bilingual interface (English and Arabic) with automatic RTL layout switching.
- The booking workflow shall be straightforward: select facility, choose date/time, receive QR-code ticket.
- Theme support (light, dark, system) shall be available on both mobile and dashboard interfaces.

**Compatibility**
- The donor application shall support Android and iOS devices through React Native cross-platform development with Expo.
- The hospital dashboard shall be accessible using modern web browsers (Chrome, Firefox, Safari, Edge) on desktop and laptop devices.
- The system shall function correctly across common screen sizes and resolutions.

**Maintainability**
- The system follows a modular architecture with four separate codebases: mobile/ (Expo/React Native), dashboard/ (React/Vite), ai-service/ (FastAPI/Python), and supabase/ (migrations and policies).
- All internationalization uses a centralized translation dictionary pattern with a t(key) helper function, ensuring no hardcoded strings.
- Database schema changes are managed through versioned SQL migration files.
- The codebase is version-controlled with Git.

### 2.4 Use Case Diagram with Use Cases Descriptions

*[Figure 4 - Damk 3alena Use Case Diagram]*

The use case diagram identifies three primary actors (Donor, Hospital/Blood Bank Staff, Administrator) and their interactions with the system. The following tables describe each use case in detail.

**Table 3: UC-01 - Donor Registration/Sign Up**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Create a donor account |
| Preconditions | User has selected "Donor" role |
| Trigger | Donor clicks "Sign up" |
| Main Flow | 1) System shows sign-up form. 2) Donor enters: first name, last name, email, phone number, password, national ID, blood type, gender, date of birth, city, weight. 3) System validates required fields. 4) System creates auth account via Supabase Auth. 5) System sends 6-digit OTP to donor's email. 6) Donor enters OTP on verification screen. 7) System verifies OTP and creates donor profile in database. 8) System navigates to location access request. |
| Alternate/Exceptions | A1) Email already registered -> show error and suggest login. A2) Missing/invalid fields -> highlight and prevent submission. A3) OTP incorrect -> show error, allow retry or resend. A4) OTP expired -> allow resend with 60-second cooldown. |
| Postconditions | Donor account is created, email is verified, and profile is stored in users and donors tables. |

**Table 4: UC-02 - Donor Login**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Access donor account |
| Preconditions | Donor account exists and email is verified |
| Trigger | Donor clicks "Login" |
| Main Flow | 1) System shows login form. 2) Donor enters email or phone number + password. 3) If phone number entered, system looks up associated email. 4) System validates credentials via Supabase Auth. 5) System loads donor profile, appointments, donations, and notifications. 6) System navigates to Home page. |
| Alternate/Exceptions | A1) Wrong credentials -> show error message. A2) Phone number not found -> show "No account found with this phone number." |
| Postconditions | Donor session is active with full profile loaded. |

**Table 5: UC-03 - Request Location Access**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Obtain location permission to enable distance/map features |
| Preconditions | Donor has just signed up or logged in |
| Trigger | System requests location permission |
| Main Flow | 1) System prompts location permission (Allow / Don't Allow). 2) Donor selects an option. 3) System saves permission and updates donor coordinates if granted. |
| Alternate/Exceptions | A1) Donor denies -> system continues with limited functionality (no distance sorting; map shows all facilities without proximity ranking). |
| Postconditions | Location permission preference is stored; donor coordinates saved if granted. |

**Table 6: UC-04 - View Map and Blood Banks**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Discover nearby hospitals/blood banks and their blood needs |
| Preconditions | Donor logged in |
| Trigger | Donor opens "Map" tab |
| Main Flow | 1) System loads all facilities with their blood type inventory. 2) System displays interactive Google Map with markers (red for critical, green for adequate). 3) System displays facility cards below the map with name, address, working hours, blood type needs with severity dots. 4) Donor can search by name/city and filter by type (all, critical, hospital, blood bank). 5) Donor can tap "Directions" to open Google Maps navigation or "Donate Here" to book an appointment. |
| Alternate/Exceptions | A1) No facilities match search/filter -> show "No results" with suggestion to adjust search. |
| Postconditions | Facilities are displayed with current blood needs. |

**Table 7: UC-05 - Book Appointment**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Book a donation appointment at a selected facility |
| Preconditions | Donor logged in; donor is eligible (no active appointment, past 90-day cooldown) |
| Trigger | Donor presses "Donate Here" on a facility card or "Book Appointment" from home |
| Main Flow | 1) System opens booking page showing facility name and working hours. 2) Donor selects date from calendar. 3) Donor selects time slot. 4) Donor presses "Confirm Booking." 5) System validates: no existing active appointment, 90-day cooldown passed. 6) System creates appointment record with status "booked." 7) System generates QR-code ticket with unique ticket code, hospital name, and date/time. 8) System navigates to ticket view. |
| Alternate/Exceptions | A1) Donor already has active appointment -> show error "You already have an appointment booked." A2) Donor within 90-day cooldown -> show error with next eligible date. A3) Selected slot unavailable -> ask donor to choose another. |
| Postconditions | Appointment is stored in database; QR-code ticket is generated and visible to donor. |

**Table 8: UC-06 - Cancel Appointment**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Cancel an existing booked appointment |
| Preconditions | Donor has an active appointment with status "booked" |
| Trigger | Donor presses "Cancel Appointment" |
| Main Flow | 1) System shows cancellation confirmation dialog. 2) Donor confirms cancellation. 3) System updates appointment status to "cancelled." 4) System removes active ticket from donor's view. 5) System updates home appointment widget. |
| Alternate/Exceptions | A1) Donor cancels the confirmation dialog -> no changes made. |
| Postconditions | Appointment status is "cancelled"; donor can book a new appointment. |

**Table 9: UC-07 - View Notifications**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | View urgent requests and system alerts |
| Preconditions | Donor logged in |
| Trigger | Donor taps notification icon or opens notifications page |
| Main Flow | 1) System loads notifications for the donor ordered by timestamp. 2) System displays each notification with type icon, title, body, timestamp, and read/unread indicator. 3) Donor can tap a notification to mark it as read. 4) Donor can use "Mark All Read" to clear all unread indicators. |
| Alternate/Exceptions | A1) No notifications -> show empty state message. |
| Postconditions | Notifications are displayed; read status is updated in database. |

**Table 10: UC-08 - View Personal Info & Donation History**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | View personal profile, donation records, and manage settings |
| Preconditions | Donor logged in |
| Trigger | Donor opens "Profile" tab |
| Main Flow | 1) System displays profile card (name, blood type, gender, date of birth, city, weight, total donations, eligibility). 2) System displays donation history list. 3) System displays settings: theme toggle, language toggle, edit email, change password, sign out. |
| Alternate/Exceptions | A1) No donation history -> show empty-state message. |
| Postconditions | Donor information is displayed. |

**Table 11: UC-09 - Forgot Password**

| Field | Details |
|---|---|
| Primary Actor | Donor |
| Goal | Reset forgotten password using email OTP |
| Preconditions | Donor account exists |
| Trigger | Donor taps "Forgot Password" on login screen |
| Main Flow | 1) System shows email input form. 2) Donor enters registered email. 3) System sends 6-digit OTP to email. 4) Donor enters OTP. 5) System verifies OTP. 6) System shows new password form. 7) Donor enters and confirms new password. 8) System updates password. 9) System shows success and navigates to login. |
| Alternate/Exceptions | A1) Email not registered -> Supabase still sends no email (security: no user enumeration). A2) OTP incorrect -> show error, allow retry. A3) Passwords don't match -> show validation error. |
| Postconditions | Donor password is updated; donor must log in with new password. |

**Table 12: UC-10 - Dashboard Login**

| Field | Details |
|---|---|
| Primary Actor | Hospital/Blood Bank Staff, Administrator |
| Goal | Authenticate to access dashboard |
| Preconditions | Staff/admin account exists |
| Trigger | User enters email + password and clicks Login |
| Main Flow | 1) System shows dashboard login page. 2) User enters email + password. 3) System validates credentials via Supabase Auth. 4) System loads facility data and navigates to dashboard home. |
| Alternate/Exceptions | A1) Invalid credentials -> show error message. |
| Postconditions | Dashboard session is active with appropriate role permissions. |

**Table 13: UC-11 - Create Blood Request**

| Field | Details |
|---|---|
| Primary Actor | Hospital/Blood Bank Staff |
| Goal | Submit a new blood request |
| Preconditions | Staff logged in (UC-10) |
| Trigger | Staff clicks "Create Request" |
| Main Flow | 1) System shows request form. 2) Staff enters blood type, units needed, urgency (normal/urgent/critical), patient name, file number, notes. 3) Staff clicks Submit. 4) System saves request with status "open." 5) System navigates to Requests page. |
| Alternate/Exceptions | A1) Missing required fields (blood type, urgency) -> prevent submission and show validation. |
| Postconditions | Request is created and visible to donors through notifications. |

**Table 14: UC-12 - View and Manage Appointments**

| Field | Details |
|---|---|
| Primary Actor | Hospital/Blood Bank Staff |
| Goal | View donors who booked appointments at the facility |
| Preconditions | Staff logged in (UC-10) |
| Trigger | Staff opens "Appointments" page |
| Main Flow | 1) System loads appointments for the staff's facility. 2) System displays appointment cards with donor name, blood type, date/time, ticket code, and status. 3) Staff can filter by status (upcoming, completed, cancelled). |
| Alternate/Exceptions | A1) No appointments -> show empty-state message. |
| Postconditions | Appointments are displayed. |

**Table 15: UC-13 - Manage Request Status**

| Field | Details |
|---|---|
| Primary Actor | Hospital/Blood Bank Staff |
| Goal | Update status of submitted blood requests |
| Preconditions | Staff logged in (UC-10); requests exist |
| Trigger | Staff opens "Requests" page |
| Main Flow | 1) System displays request cards with status badges. 2) Staff selects a request. 3) Staff updates status (open -> in_progress -> fulfilled -> closed). 4) System saves status change with timestamp. |
| Alternate/Exceptions | A1) Invalid status transition -> show message and prevent update. |
| Postconditions | Request status is updated in database. |

**Table 16: UC-14 - View AI Outputs**

| Field | Details |
|---|---|
| Primary Actor | Hospital/Blood Bank Staff |
| Goal | View AI-generated forecasts, shortage alerts, and donor recommendations |
| Preconditions | Staff logged in (UC-10) |
| Trigger | Staff opens "AI Insights" page |
| Main Flow | 1) System displays demand forecast charts with confidence intervals per blood type. 2) System displays active shortage alerts with severity indicators. 3) System displays recommended donors for open requests with match scores. |
| Alternate/Exceptions | A1) AI service unavailable -> show error message with last cached results if available. |
| Postconditions | AI results are displayed to staff for decision support. |

**Table 17: UC-15 - Manage User Roles (Admin)**

| Field | Details |
|---|---|
| Primary Actor | Administrator |
| Goal | Manage user roles and access permissions |
| Preconditions | Logged in (UC-10) as Admin |
| Trigger | Admin opens "User Management" |
| Main Flow | 1) Admin views paginated users list with search. 2) Admin can change user role (donor/staff/admin). 3) Admin can approve or reject staff accounts. 4) System saves role changes. |
| Alternate/Exceptions | A1) Admin tries to remove last admin -> prevent action. |
| Postconditions | User roles and approvals are updated. |

**Table 18: UC-16 - Configure System Parameters (Admin)**

| Field | Details |
|---|---|
| Primary Actor | Administrator |
| Goal | Configure system thresholds and rules |
| Preconditions | Logged in (UC-10) as Admin |
| Trigger | Admin opens "System Settings" |
| Main Flow | 1) Admin views configurable parameters (shortage thresholds, eligibility days, notification radius, forecast horizon). 2) Admin edits values. 3) Admin saves changes. 4) System applies updated settings. |
| Alternate/Exceptions | A1) Invalid value -> show validation error. |
| Postconditions | System parameters are updated in system_parameters table. |

### 2.5 Activity Diagrams for Some Use Case Scenarios

Activity diagrams illustrate the flow of control for key use case scenarios, showing decision points, parallel activities, and the sequence of operations.

**Activity Diagram 1: Donor Registration with OTP Verification (UC-01)**

```
[Start] --> [Select Sign Up]
  --> [Enter Registration Details]
  --> <Validate Fields>
      -- Invalid --> [Show Validation Errors] --> [Enter Registration Details]
      -- Valid --> [Create Auth Account in Supabase]
  --> [Send 6-digit OTP to Email]
  --> [Enter OTP Code]
  --> <Verify OTP>
      -- Invalid --> [Show Error] --> [Enter OTP Code]
      -- Expired --> [Resend OTP] --> [Enter OTP Code]
      -- Valid --> [Create User Record]
  --> [Create Donor Profile]
  --> [Request Location Permission]
  --> [Navigate to Home]
  --> [End]
```

*[Figure 5 - Activity Diagram: Donor Registration]*

**Activity Diagram 2: Book Appointment (UC-05)**

```
[Start] --> [Select Facility]
  --> [View Facility Details & Working Hours]
  --> [Select Date from Calendar]
  --> [Select Time Slot]
  --> [Press Confirm Booking]
  --> <Check Active Appointment>
      -- Has Active --> [Show Error: Already Booked] --> [End]
      -- No Active --> <Check 90-day Cooldown>
          -- Within Cooldown --> [Show Error: Next Eligible Date] --> [End]
          -- Eligible --> [Insert Appointment Record]
  --> [Generate Ticket Code]
  --> [Generate QR Code]
  --> [Display Appointment Ticket]
  --> [End]
```

*[Figure 6 - Activity Diagram: Book Appointment]*

**Activity Diagram 3: Forgot Password with OTP (UC-09)**

```
[Start] --> [Enter Email Address]
  --> <Validate Email Format>
      -- Invalid --> [Show Error] --> [Enter Email Address]
      -- Valid --> [Send Reset OTP via Supabase]
  --> [Enter 6-digit OTP]
  --> <Verify OTP>
      -- Invalid --> [Show Error, Clear Code] --> [Enter 6-digit OTP]
      -- Valid --> [Show New Password Form]
  --> [Enter New Password + Confirm]
  --> <Validate Passwords>
      -- Don't Match --> [Show Mismatch Error] --> [Enter New Password + Confirm]
      -- Too Short --> [Show Length Error] --> [Enter New Password + Confirm]
      -- Valid --> [Update Password via Supabase Auth]
  --> [Show Success Message]
  --> [Navigate to Login]
  --> [End]
```

*[Figure 7 - Activity Diagram: Forgot Password]*

**Activity Diagram 4: Create Blood Request (UC-11)**

```
[Start] --> [Staff Opens Create Request Page]
  --> [Enter Blood Type, Units, Urgency, Patient Info]
  --> <Validate Required Fields>
      -- Missing Fields --> [Highlight Errors] --> [Enter Details]
      -- Valid --> [Insert Request with Status "open"]
  --> [Trigger Donor Notifications (matching blood type)]
  --> [Navigate to Requests Page]
  --> [End]
```

*[Figure 8 - Activity Diagram: Create Blood Request]*

---

## Chapter 3: Design

### 3.1 Sequence Diagrams for Some Use Case Scenarios

Sequence diagrams describe how objects interact in a particular order to accomplish a specific task. The following diagrams illustrate the key workflows of the system.

**Sequence Diagram 1: Donor Registration with OTP Verification**

```
Donor          MobileApp         SupabaseAuth       Database(users)    Database(donors)
  |                |                  |                   |                  |
  |--fillForm----->|                  |                   |                  |
  |                |--signUp(email,   |                   |                  |
  |                |   password,meta)->|                   |                  |
  |                |                  |--INSERT auth.users |                  |
  |                |                  |--sendOTP(email)--->|                  |
  |                |<-needsVerify-----|                   |                  |
  |<-showOTPScreen-|                  |                   |                  |
  |--enterOTP----->|                  |                   |                  |
  |                |--verifyOtp(      |                   |                  |
  |                |  email,token,    |                   |                  |
  |                |  type:"signup")->|                   |                  |
  |                |                  |--validate token   |                  |
  |                |<-session---------|                   |                  |
  |                |                  |  (auth trigger)   |                  |
  |                |                  |------------------>|--INSERT user row |
  |                |--poll for user row----------------->|                  |
  |                |<-user.id-----------------------------|                  |
  |                |--UPDATE phone--->|                   |                  |
  |                |--INSERT donor(user_id, blood_type,-->|                  |
  |                |   nationalId, gender, birthDate)     |----------------->|
  |                |<-success-----------------------------|                  |
  |<-navigateHome--|                  |                   |                  |
```

*[Figure 9 - Sequence Diagram: Donor Registration]*

**Sequence Diagram 2: Book Appointment**

```
Donor          MobileApp         Database(appointments)   Database(donors)
  |                |                      |                      |
  |--selectFacility|                      |                      |
  |--selectDate--->|                      |                      |
  |--selectTime--->|                      |                      |
  |--confirmBook-->|                      |                      |
  |                |--SELECT active appts |                      |
  |                |  WHERE donor_id AND  |                      |
  |                |  status='booked'---->|                      |
  |                |<-count=0-------------|                      |
  |                |--SELECT last_donation|--------------------->|
  |                |<-date (>90 days ago)-|----------------------|
  |                |--INSERT appointment  |                      |
  |                |  (donor_id,facility, |                      |
  |                |   date,time,status=  |                      |
  |                |   'booked',ticket)-->|                      |
  |                |<-appointment.id------|                      |
  |                |--generateQRCode()    |                      |
  |<-showTicket----|                      |                      |
```

*[Figure 10 - Sequence Diagram: Book Appointment]*

**Sequence Diagram 3: AI Demand Forecast Flow**

```
Staff         Dashboard          AIService(FastAPI)      ForecastModel(XGBoost)
  |               |                     |                        |
  |--openAI------>|                     |                        |
  |               |--POST /forecast     |                        |
  |               |  {facility_idx,     |                        |
  |               |   blood_types,      |                        |
  |               |   weeks_ahead}----->|                        |
  |               |                     |--predict(features)---->|
  |               |                     |                        |--q10 model
  |               |                     |                        |--q50 model
  |               |                     |                        |--q90 model
  |               |                     |<-predictions-----------|
  |               |                     |  [{blood_type, week,   |
  |               |                     |    predicted, low,high}]|
  |               |<-ForecastResponse---|                        |
  |               |--renderCharts()     |                        |
  |<-displayCharts|                     |                        |
```

*[Figure 11 - Sequence Diagram: AI Demand Forecast]*

**Sequence Diagram 4: Shortage Detection**

```
Staff         Dashboard          AIService(FastAPI)
  |               |                     |
  |               |--POST /shortage-    |
  |               |  detect             |
  |               |  {forecasts,        |
  |               |   inventory,        |
  |               |   thresholds}------>|
  |               |                     |--compare forecast vs inventory
  |               |                     |--FOR each blood_type:
  |               |                     |    IF units < critical_threshold
  |               |                     |      -> severity = "critical"
  |               |                     |    ELIF units < warning_threshold
  |               |                     |      -> severity = "warning"
  |               |<-ShortageResponse---|
  |               |  {alerts: [{        |
  |               |    blood_type,      |
  |               |    severity,        |
  |               |    current_units,   |
  |               |    message}]}       |
  |               |--renderAlerts()     |
  |<-displayAlerts|                     |
```

*[Figure 12 - Sequence Diagram: Shortage Detection]*

### 3.2 Detailed Class Diagram

The detailed class diagram represents the implemented system structure showing all classes, their attributes, methods, and relationships. The diagram reflects the actual TypeScript/Python implementation.

*[Figure 13 - Detailed Class Diagram]*

The system is organized into the following class categories:

**Data Model Classes (Database Tables):**

| Class | Key Attributes | Relationships |
|---|---|---|
| User | id, auth_id, role, first_name, last_name, phone, email | Superclass for Donor, Staff |
| Donor | id, user_id, national_id, blood_type, gender, birth_date, is_eligible, total_donations, latitude, longitude | Extends User; has many Appointments, DonationRecords, Notifications |
| Staff | id, user_id, facility_id, position, is_approved | Extends User; belongs to Facility |
| Facility | id, name, type, address, city, latitude, longitude, phone, working_hours | Has many Staff, BloodRequests, Appointments, FacilityInventory |
| BloodRequest | id, facility_id, created_by, blood_type, units_needed, urgency, status, patient_name | Created by Staff; belongs to Facility |
| Appointment | id, donor_id, facility_id, appointment_date, appointment_time, status, ticket_code | Belongs to Donor and Facility |
| DonationRecord | id, donor_id, facility_id, blood_type, donation_date, units | Belongs to Donor and Facility |
| Notification | id, donor_id, title, body, is_read, sent_at | Belongs to Donor |
| SystemParameter | id, key, value, description, updated_by | Managed by Admin |

**AI Output Classes:**

| Class | Key Attributes | Relationships |
|---|---|---|
| AIOutput | id, facility_id, output_type, generated_at, metadata | Parent for all AI results |
| ForecastResult | id, ai_output_id, facility_id, blood_type, forecast_week, predicted_units, confidence | Extends AIOutput |
| ShortageAlert | id, ai_output_id, facility_id, blood_type, severity, current_units, threshold, is_active | Extends AIOutput |
| DonorRecommendation | id, ai_output_id, request_id, donor_id, score, distance_km, reasoning | Extends AIOutput; references BloodRequest and Donor |

**AI Service Classes (Python):**

| Class | Key Methods |
|---|---|
| BloodDemandForecaster | train(), predict(), load(), save() |
| ShortageDetector | detect_shortages(forecasts, inventory, thresholds) |
| DonorRecommender | recommend_donors(request, donors, facilities) |

### 3.3 Database ER Diagram

The Entity-Relationship diagram represents the implemented PostgreSQL database schema with 14 core tables, custom ENUM types, foreign key relationships, and indexes.

*[Figure 14 - Database ER Diagram]*

**ENUM Types:**
- `user_role`: donor, staff, admin
- `blood_type`: A+, A-, B+, B-, AB+, AB-, O+, O-
- `request_urgency`: normal, urgent, critical
- `request_status`: open, in_progress, fulfilled, closed
- `appointment_status`: booked, completed, cancelled, no_show

**Entity Relationships:**

| Relationship | Type | Description |
|---|---|---|
| User -- Donor | 1:1 | Each donor extends a user record |
| User -- Staff | 1:1 | Each staff member extends a user record |
| Staff -- Facility | N:1 | Multiple staff belong to one facility |
| Facility -- BloodRequest | 1:N | A facility creates multiple requests |
| Staff -- BloodRequest | 1:N | A staff member creates multiple requests |
| Donor -- Appointment | 1:N | A donor has multiple appointments |
| Facility -- Appointment | 1:N | A facility hosts multiple appointments |
| Donor -- DonationRecord | 1:N | A donor has multiple donation records |
| Facility -- DonationRecord | 1:N | A facility records multiple donations |
| Donor -- Notification | 1:N | A donor receives multiple notifications |
| Facility -- AIOutput | 1:N | A facility has multiple AI outputs |
| AIOutput -- ForecastResult | 1:N | An AI output contains forecast results |
| AIOutput -- ShortageAlert | 1:N | An AI output contains shortage alerts |
| AIOutput -- DonorRecommendation | 1:N | An AI output contains recommendations |
| BloodRequest -- DonorRecommendation | 1:N | A request has multiple donor recommendations |
| User -- ActionLog | 1:N | A user generates multiple action logs |
| User -- SystemParameter | N:1 | Parameters track which admin last updated them |

**Database Helper Functions:**
- `get_user_role()`: Returns the current authenticated user's role
- `get_user_id()`: Returns the current authenticated user's UUID
- `get_donor_id()`: Returns the current authenticated donor's UUID
- `get_staff_facility_id()`: Returns the facility UUID for the current staff member
- `update_updated_at()`: Trigger function that auto-updates the `updated_at` timestamp

**Indexes for Performance:**
- `idx_donors_blood_type` on donors(blood_type)
- `idx_donors_eligible` partial index on donors(is_eligible) WHERE is_eligible = true
- `idx_blood_requests_status` on blood_requests(status)
- `idx_blood_requests_facility` on blood_requests(facility_id)
- `idx_appointments_donor` on appointments(donor_id)
- `idx_appointments_facility` on appointments(facility_id)
- `idx_notifications_donor` on notifications(donor_id)
- `idx_forecast_facility_week` composite index on forecast_results(facility_id, forecast_week)
- `idx_shortage_active` partial index on shortage_alerts(is_active) WHERE is_active = true

---

## References

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
