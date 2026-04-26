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

This report presents the development and implementation of "Damk 3alena," an AI-Driven Blood Donation Prediction and Matching System designed for Jordan. The system addresses critical challenges in blood donation management across the country, including fragmented coordination between donors and hospitals, reliance on manual inventory tracking, and the absence of predictive tools for anticipating blood shortages. Damk 3alena integrates three AI modules -- a blood demand forecasting model using XGBoost quantile regression, a shortage detection engine, and a smart donor recommendation system -- into a unified platform comprising a cross-platform donor mobile application and a hospital/blood bank web dashboard. The donor mobile app, built with React Native (Expo), allows donors to register, track eligibility, receive personalized urgent notifications, view nearby blood banks on an interactive map, and book donation appointments. The hospital dashboard, built with React and TypeScript, enables staff to submit blood requests, manage appointments, monitor real-time blood type inventory, and visualize AI-generated forecasts and shortage alerts. The backend uses Supabase (PostgreSQL) for data storage, authentication, and row-level security, while the AI service runs as an independent FastAPI microservice. The system was developed over a 14-week period using the Scrum framework with 2-week sprints, and works end-to-end as an integrated prototype. Black-box testing and informal user feedback confirm that the system meets its core objectives, and the results suggest the approach is a workable starting point for improving blood supply management in Jordan.

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

Healthcare systems depend on a steady supply of safe blood. In Jordan, hospitals run into recurring problems keeping that supply steady — particularly for uncommon blood types and during sudden emergencies. Coordination between hospitals, blood banks, and donors mostly happens over phone calls, social media posts, and each hospital's own internal operations, with no shared real-time view of inventory. The result is shortages that put patients at risk, often discovered only after they have already started.

This project tackles these problems by building an AI-powered blood donation management system that combines predictive analytics with a mobile application for donors and a web dashboard for hospital staff. The aim is to move blood donation management away from a reactive, ad-hoc process and toward something closer to data-driven operations, where shortages are anticipated rather than discovered.

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

- **Limited Use of Data and AI:** Historical data on donations and consumption is rarely used. Few systems in Jordan apply machine learning to forecast demand, estimate donor availability, or plan campaigns.

- **Unstructured Donor Engagement:** Donors are not always notified at the right time or in the right way. There is no intelligent recommender that matches donors with hospitals based on urgency, blood type, and eligibility status.

- **Unorganized Requesting for Donations:** When a hospital experiences a shortage, responses depend heavily on social media posts, WhatsApp groups, or personal networks, which can be slow and unreliable, especially for rare blood types or emergency cases.

### 1.4 Problem Solution

To address the problems identified above, this project implements an AI-Powered Blood Donation Management System with the following solution components:

**AI Demand Forecasting:** The system uses an XGBoost quantile regression model to predict future blood needs by blood type and facility before shortages occur. Three quantile models (q10, q50, q90) provide lower-bound, median, and upper-bound predictions, enabling hospitals to plan donation campaigns proactively rather than waiting until supplies run out.

**Shortage Detection Engine:** A dedicated module compares forecasted demand against current inventory levels and configurable thresholds (warning at 15 units, critical at 5 units) to detect and flag shortage risks. Active alerts are automatically generated and displayed on the hospital dashboard.

**Smart Donor Recommendation:** A recommendation engine matches suitable donors to hospital requests based on blood type compatibility, geographic proximity (calculated using the Haversine formula), eligibility status, and historical donation behavior, producing a ranked list of recommended donors with reasoning.

**Central Digital Platform:** A single platform connects donors with hospitals and blood banks. The donor mobile application (React Native/Expo) handles registration, eligibility tracking, appointment booking, map-based blood bank discovery, and push notifications. The hospital web dashboard (React/TypeScript) provides request management, appointment tracking, inventory monitoring, and AI output visualization.

**Secure Backend Infrastructure:** Supabase (PostgreSQL) is the backend, with built-in authentication, row-level security (RLS) policies, and real-time capabilities. The AI service is an independent FastAPI microservice and talks to the dashboard over REST.

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
- The system shall remain available during normal operation with minimal downtime, using Supabase's managed infrastructure with automatic backups.
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

This project delivered Damk 3alena, an AI-driven blood donation prediction and matching system for Jordan, as a working end-to-end prototype. All six objectives from Section 1.5 were achieved:

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

Although the system met all its objectives, the current prototype has several real limitations:

**Synthetic Training Data:** The XGBoost forecasting model was trained entirely on synthetic data generated to approximate Jordanian donation patterns. While the synthetic data incorporates realistic features (seasonality, Ramadan, facility size and type), it cannot capture the true distribution of blood consumption patterns at Jordanian hospitals. Real forecasting accuracy would require at least 12 months of historical donation and consumption data from actual facilities.

**No Push Notification Delivery:** The notifications system stores notifications in the database and displays them in the app's Notifications tab, but does not deliver real-time push notifications to devices when a new urgent request is created. Implementation of push notifications (e.g., via Expo Push Notifications or Firebase Cloud Messaging) was out of scope for this prototype phase.

**Prototype Scale:** The system was developed and tested as a proof-of-concept with synthetic data, 15 seeded facilities, and a small number of test donor accounts. Production deployment would require performance testing at scale, security auditing, and integration with existing hospital information systems.

**AI Service Deployment:** The FastAPI AI service currently runs as a local process for demonstration purposes. A production deployment would require containerizing the service with Docker, deploying it to a cloud host with GPU access for retraining, and implementing model versioning and monitoring.

**No Real Clinical Integration:** The system does not connect to laboratory information systems (LIS), electronic health records (EHR), or existing hospital inventory systems. Blood inventory is currently updated manually by staff through the dashboard, rather than being automatically synchronized from existing systems.

### 6.4 Future Work

The following are the natural next steps if the prototype were to be carried forward:

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
