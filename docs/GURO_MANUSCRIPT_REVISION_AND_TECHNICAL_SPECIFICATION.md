# GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION
## Comprehensive Thesis Manuscript Revision Guide & Technical Source of Truth
**Target Audience**: Research Team & Group Members Updating Chapters 1–5  
**System Status Baseline**: Completed & Verified System State (September 2026)

---

## Executive Overview for the Group

This document compiles the **panel and reviewer feedback**, the **actual technical implementation of the GURO platform**, and the **exact textual, tabular, and architectural specifications** required to update the main manuscript. 

It aligns:
$$\text{Title} \longrightarrow \text{Problem Statement} \longrightarrow \text{Objectives} \longrightarrow \text{Scope} \longrightarrow \text{Architecture} \longrightarrow \text{Methodology} \longrightarrow \text{Evaluation} \longrightarrow \text{Conclusions}$$

---

# SECTION 1: SYSTEM IDENTITY & TITLE STANDARDIZATION

### 1.1 Official System Name & Acronym
* **Official Acronym**: **GURO**
* **Official Meaning**: **Guided Unified Resource Optimization**
* **Official Full Title of the Study**:  
  > **GURO: Guided Unified Resource Optimization — An AI-Assisted and Rule-Based Adaptive Tutoring System with Offline-First Learning Capabilities for Primary Education**

### 1.2 Standardized System Description
> **GURO** is an AI-assisted, rule-based adaptive tutoring platform designed with an offline-first architecture to support Mathematics and English learning among Grades 4 to 6 elementary students under limited or unstable internet connectivity. The platform couples generative AI lesson drafting (via Google Gemini) with deterministic rule-based mastery progression, offline local caching with queue-based synchronization, and role-differentiated dashboards for students, teachers, parents, and system administrators.

### 1.3 System Component Paradigm
| System Component | Actual Approach in GURO | Research Justification |
|---|---|---|
| **Content Generation** | AI-Assisted (Google Gemini API) with human-in-the-loop review | Accelerates structured lesson & item creation; requires teacher validation prior to student delivery. |
| **Lesson Progression** | Rule-Based Adaptive Progression ($\ge 80\%$ mastery threshold) | Ensures deterministic, transparent progression aligned with Mastery Learning Theory without unpredictable black-box routing. |
| **Client Operation** | Offline-First (SQLite Local DB & Caching) | Eliminates internet dependency during active study and testing in low-connectivity classrooms. |
| **Telemetry Sync** | Asynchronous HTTP Sync with Event Deduplication (`event_id`) | Preserves student progress across connectivity drops; guarantees idempotency during batch upload retries. |
| **Academic Tracking** | DepEd Academic Period Structure (SY & Quarters 1–4) with Pre/Post Diagnostic Gain | Measures baseline vs summative growth ($g$-gain) and supports End-of-School-Year (EOSY) promotion reviews. |
| **Software Evaluation** | ISO/IEC 25010 Quality Model (5 Selected Dimensions) | Measures Functional Suitability, Performance Efficiency, Usability, Reliability, and Portability. |

---

# SECTION 2: SCOPE & MVP FEATURE CLASSIFICATION

### 2.1 Core MVP Scope (Included in Primary Research Objectives)
1. **Target Grade Levels & Subjects**:
   - **Grade 4**: Mathematics (*Fractions*), English (*Figures of Speech*)
   - **Grade 5**: Mathematics (*Decimals*), English (*Reading & Paragraph Comprehension*)
   - **Grade 6**: Mathematics (*Algebraic Equations*), English (*Idiomatic Expressions*)
2. **Student Module**:
   - Offline lesson guide consumption with paginated checkpoint questions.
   - Interactive diagnostic pre-tests, practice quizzes, and summative post-tests.
   - Rule-based adaptive lesson unlocking upon achieving $\ge 80\%$ score.
   - Immediate feedback with bilingual explanations (English & Filipino).
   - Local progress recording and automatic synchronization upon network reconnection.
   - Visual gamification feedback (XP points, star ratings, streaks, and achievement badges).
3. **Teacher Module**:
   - Account authentication and classroom creation with invite code generation.
   - Setting DepEd School Year (e.g. `2026-2027`) and Academic Term (`Quarter 1` to `Quarter 4`).
   - Claiming curriculum templates and managing classroom lesson catalogs.
   - AI-assisted lesson generation with teacher review and manual lesson authoring.
   - Student telemetry monitoring via Mastery Matrix heatmap and Diagnostic Alerts.
4. **Parent Module**:
   - Parent registration and student account creation (protecting minors from direct open sign-ups).
   - Student progress exploration via 6-digit access code.
   - Progress breakdown, attendance/activity heatmap, and badge case inspection.
5. **Offline-First Synchronization**:
   - Local SQLite database on mobile storing cached lessons, questions, and progress queue.
   - Background telemetry sync with server-side deduplication.

### 2.2 Feature Classification Matrix for the Thesis Scope
| Feature | Implementation Status | Thesis Classification | How to Treat in the Manuscript |
|---|---|---|---|
| Offline Study & Quiz Taking | Implemented | **Core Research Scope** | Central focus of Chapter 1 & 3; evaluated under Reliability & Usability. |
| Rule-Based Adaptive Routing | Implemented | **Core Research Scope** | Core objective; documented with explicit Rule Matrix and test cases. |
| AI Lesson Generation (Gemini) | Implemented | **Core Research Scope** | Documented as AI-assisted drafting subject to teacher review/validation. |
| Parent Progress Monitoring | Implemented | **Core Research Scope** | Documented under parental engagement and minor data protection. |
| Pre/Post Normalized Gain ($g$) | Implemented | **Supporting / Evaluation** | Methodological metric for assessing student growth between baseline and post-test. |
| EOSY Promotion / SF9 Console | Implemented | **Supporting Feature** | Documented under Teacher Dashboard; provides Form 138 academic records. |
| AI Rate Limiting Governance | Implemented | **Technical Supporting** | Documented in Chapter 3 under API Architecture and cost safeguards. |
| Gamification (XP, Badges) | Implemented | **Supporting Feature** | Discussed under Gamification Theory in Chapter 2; evaluated under Usability. |
| Voice Guidance / Haptics | Implemented | **Supporting Feature** | Discussed as accessibility aids within the mobile client interface. |
| Predictive AI / Division Analytics | *Not Implemented* | **Future Enhancement** | Remove from Chapters 1–3; place exclusively in Chapter 5 Recommendations. |

---

# SECTION 3: CHAPTER 1 REVISION PACKAGE

### 3.1 Background of the Study
* **Problem Focus**: Philippine elementary public schools frequently suffer from **limited, unstable, or intermittent internet connectivity**, creating a digital divide in computer-assisted learning.
* **Pedagogical Gap**: Traditional web-based Learning Management Systems (LMS) require persistent high-speed connectivity, causing session drops, data loss, and disrupted learning flow when network coverage fluctuates.
* **GURO's Solution**: An offline-first mobile learning environment where lesson delivery and assessment occur locally without network latency, coupled with rule-based adaptive routing ($\ge 80\%$ mastery requirement) and asynchronous sync to give teachers and parents consolidated progress visibility.

### 3.2 Statement of the Problem
#### General Problem
> How can an AI-assisted and rule-based adaptive tutoring system with offline-first capabilities be designed, developed, and evaluated to support Mathematics and English learning among Grades 4 to 6 elementary students under limited internet connectivity?

#### Specific Problems
1. How can an offline-first mobile client architecture be designed to allow continuous lesson study and assessment without persistent internet connectivity?
2. How can a rule-based adaptive progression mechanism be implemented using student assessment thresholds to govern access to succeeding instructional modules?
3. How can an AI-assisted lesson generation pipeline utilizing Google Gemini be integrated to assist teachers in creating structured, curriculum-aligned instructional guides and item pools?
4. How can role-differentiated management and monitoring interfaces be developed for teachers, parents, and school administrators?
5. How can an asynchronous synchronization protocol be implemented to reliably transmit queued offline student progress to the central backend upon network restoration?
6. What is the level of software quality of the GURO system as evaluated by students, teachers, and IT experts using the ISO/IEC 25010 standard across Functional Suitability, Performance Efficiency, Usability, Reliability, and Portability?

### 3.3 Objectives of the Study
#### General Objective
> To design, develop, and evaluate **GURO: Guided Unified Resource Optimization**, an AI-assisted and rule-based adaptive tutoring system with offline-first capabilities for Grades 4 to 6 Mathematics and English education.

#### Specific Objectives
1. To design an offline-first mobile learning system utilizing local SQLite databases and persistent caching to support uninterrupted study and quiz execution without continuous internet access.
2. To develop a rule-based adaptive routing engine enforcing an $80\%$ mastery threshold and prerequisite completion rules for module progression.
3. To integrate an AI-assisted lesson generation module powered by Google Gemini 2.5 Flash with role-based rate-limiting and human-in-the-loop validation for structured content authoring.
4. To develop dedicated web and mobile interfaces for teachers (classroom setup, mastery heatmap, EOSY promotion), parents (student progress tracking, account creation), and administrators (curriculum governance).
5. To implement an idempotent, event-driven synchronization protocol with server-side deduplication (`event_id`) to reliably merge offline telemetry records.
6. To evaluate the software quality of GURO based on the ISO/IEC 25010 international standard in terms of Functional Suitability, Performance Efficiency, Usability, Reliability, and Portability.

### 3.4 Operational Definition of Terms
* **AI-Assisted Content Generation**: The process of utilizing Google Gemini large language models to draft structured lesson outlines, definitions, and assessment items, which are subsequently reviewed, edited, and validated by teachers before release.
* **Rule-Based Adaptive Progression**: A deterministic branching mechanism where student access to subsequent learning topics is unlocked strictly when quiz performance meets or exceeds a predefined threshold ($\ge 80\%$).
* **Offline-First Operation**: A software architectural pattern where all core instructional viewing, interactive questioning, and score recording execute against local device storage (SQLite/AsyncStorage) without requiring an active network connection.
* **Progress Synchronization**: The asynchronous, idempotent transmission of queued local progress logs from the client to the Laravel backend when network connectivity is detected.
* **Normalized Learning Gain ($g$)**: A metric formulated by Hake (1998) measuring the ratio of actual student score improvement to the maximum possible improvement between diagnostic pre-tests and summative post-tests:
  $$g = \frac{\text{Post-Test \%} - \text{Pre-Test \%}}{100 - \text{Pre-Test \%}} \times 100$$
* **End-of-School-Year (EOSY) Promotion**: The consolidated evaluation of learner performance across DepEd quarters against the national $75\%$ passing standard, resulting in promotional advancement to the next grade level and archiving of Form 138 (SF9) academic records.

---

# SECTION 4: CHAPTER 2 REVISION PACKAGE

### 4.1 Theoretical Framework

```
┌───────────────────────────────────────────────────────────────────────────┐
│                          THEORETICAL FOUNDATIONS                          │
├───────────────────────────────────────────────────────────────────────────┤
│ 1. Intelligent Tutoring Systems (ITS) ──► Guided, personalized learning   │
│ 2. Mastery Learning Theory (Bloom)    ──► 80% mastery advancement rule    │
│ 3. Adaptive Learning Theory           ──► Performance-based lesson routing│
│ 4. Gamification Theory (Deterding)    ──► XP, stars, badges, streaks      │
│ 5. Learning Analytics (Siemens)       ──► Heatmap matrices, alerts, SF9   │
└───────────────────────────────────────────────────────────────────────────┘
```

#### Theory-to-Feature Mapping Table
| Theory | Key Proponent | Core Proposition | GURO Implementation |
|---|---|---|---|
| **Mastery Learning Theory** | Benjamin Bloom (1968) | Learners must achieve a high level of prerequisite competence before moving to subsequent topics. | Enforces an **$80\%$ score threshold** on module quizzes; dependent modules remain locked until prerequisite mastery is demonstrated. |
| **Adaptive Learning Theory** | Various (Park & Lee, 2004) | Instructional pathways adapt dynamically to individual learner performance. | Implements **Rule-Based Routing** directing struggling students ($< 50\%$) to remediation, progressing students ($50-79\%$) to review, and mastery students ($\ge 80\%$) to advanced lessons. |
| **Intelligent Tutoring Systems (ITS)** | Sleeman & Brown (1982) | Computer systems provide direct, customized instruction and immediate diagnostic feedback. | Delivers **paginated study guide checkpoints** and **bilingual diagnostic feedback** (English & Filipino) explaining why answers are correct or incorrect. |
| **Gamification in Education** | Deterding et al. (2011) | Game-design elements in non-game contexts enhance user engagement and motivation. | Implements **XP points, star ratings (1–3 stars), daily streaks, sound effects, mascot companions, and visual badge cases**. |
| **Learning Analytics** | Siemens & Long (2011) | Measurement, collection, and analysis of learner data optimizes learning environments. | Powers the **Classroom Mastery Matrix**, **Diagnostic Alert Triggers**, **Pre/Post Normalized Gain reports**, and **Parent Progress Heatmaps**. |

### 4.2 Synthesis of Related Literature & Research Gap Matrix
| Study & Author | System / Approach | Key Features | Limitations Identified | Relevance & Specific Contribution to GURO |
|---|---|---|---|---|
| **Study 1**: Mendoza et al. (2022) | Mobile LMS for Elementary Science | Offline content caching; interactive quizzes | No adaptive routing; monolithic static PDF downloads; high storage overhead. | Informs GURO's paginated micro-lesson format and structured SQLite caching. |
| **Study 2**: Santos & Cruz (2023) | Web-based Gamified Math Drill System | Streaks, XP badges, leaderboard | Purely web-dependent; fails completely during connectivity drops; no parental portal. | Highlights the necessity of GURO's offline gamification state persistence. |
| **Study 3**: Dela Rama et al. (2024) | AI Question Generation for High School | LLM-based quiz item generation from text | No rate-limiting safeguards; no minor privacy safeguards; uncurated direct-to-student output. | Guides GURO's teacher-in-the-loop review pipeline and role-based AI token rate limiting. |
| **Study 4**: Alcantara (2023) | Rule-Based Adaptive Tutoring | Conditional question branching based on scores | Closed proprietary content; cannot add custom teacher curricula; no cloud sync. | Serves as the foundation for GURO's deterministic rule-based progression matrix. |
| **Study 5**: Tan & Bautista (2025) | Offline-First Data Collection App | SQLite queue; sync on reconnect | Generic survey form tool; lacks educational mastery modeling and academic grading. | Informs GURO's idempotent event queue synchronization protocol (`event_id` deduplication). |

#### Synthesized Research Gap
> While existing literature addresses intelligent tutoring, adaptive branching, AI question drafting, and offline data collection independently, **no single unified platform synthesizes AI-assisted curriculum drafting, deterministic rule-based mastery progression, offline-first SQLite execution, automated synchronization recovery, and multi-role (student-teacher-parent) telemetry** tailored specifically for Philippine primary education (Grades 4–6 Mathematics and English).

### 4.3 Conceptual Framework (IPO Paradigm)

```
┌─────────────────────────────────┐
│             INPUT               │
├─────────────────────────────────┤
│ • Grade 4–6 MELC Competencies   │
│ • DepEd Academic Period (SY/Qtr)│
│ • Teacher Lesson Input / PDFs   │
│ • Student Quiz Responses        │
│ • User Account Credentials      │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│            PROCESS              │
├─────────────────────────────────┤
│ • AI-Assisted Content Generation│
│ • Teacher Review & Claiming     │
│ • Offline-First Lesson Caching  │
│ • Rule-Based Adaptive Routing   │
│ • Asynchronous Telemetry Sync   │
│ • Mastery Matrix & Gain ($g$)   │
│ • ISO/IEC 25010 Quality Eval    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│             OUTPUT              │
├─────────────────────────────────┤
│ • GURO Web & Mobile App         │
│ • MELC-Aligned Structured Items │
│ • Synchronized Telemetry DB     │
│ • Form 138 (SF9) Transcripts    │
│ • ISO 25010 Evaluation Results  │
└─────────────────────────────────┘
```

---

# SECTION 5: CHAPTER 3 TECHNICAL SPECIFICATIONS

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT TIER                                     │
│                                                                             │
│   ┌───────────────────────────────┐     ┌───────────────────────────────┐   │
│   │   Guro-Mobile (React Native)  │     │    Guro-Web (React + Vite)    │   │
│   │  • Expo 56 / Android / iOS    │     │  • Teacher Console            │   │
│   │  • Offline SQLite DB          │     │  • Parent Explorer Portal     │   │
│   │  • Zustand + AsyncStorage     │     │  • Admin / Developer Console  │   │
│   │  • Sound & Haptic Engines     │     │  • Pre/Post Gain & SF9 Matrix │   │
│   └───────────────┬───────────────┘     └───────────────┬───────────────┘   │
│                   │ (REST / JSON)                       │ (REST / JSON)     │
└───────────────────┼─────────────────────────────────────┼───────────────────┘
                    ▼                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API TIER                                       │
│                                                                             │
│                  Laravel 13 REST API + PHP 8.3 + Sanctum                    │
│                                                                             │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────────────┐  │
│  │  AuthController  │ │ClassroomControl. │ │       SyncController        │  │
│  │  • Login/Register│ │ • Verify / Claim │ │ • Telemetry Batch Ingestion │  │
│  │  • OTP Dispatch  │ │ • EOSY Report    │ │ • Query by Term / Assmt Type│  │
│  │  • Student Tokens│ │ • Promote Learner│ └─────────────────────────────┘  │
│  └──────────────────┘ └──────────────────┘ ┌─────────────────────────────┐  │
│  ┌──────────────────┐ ┌──────────────────┐ │    RateLimitController      │  │
│  │ AdminController  │ │  GeminiService   │ │ • Window / Quota Management │  │
│  │ • DB Stats / RBAC│ │ • 2.5 Flash API  │ └─────────────────────────────┘  │
│  └──────────────────┘ └──────────────────┘                                  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA TIER                                      │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │ Database Tables (PostgreSQL / SQLite):                               │  │
│   │  1. users                    5. student_academic_records (SF9)       │  │
│   │  2. classrooms               6. ai_generation_logs                   │  │
│   │  3. classroom_members        7. rate_limit_configs                   │  │
│   │  4. progress_logs            8. otps / personal_access_tokens        │  │
│   │ Item Bank Storage: /assets/item_bank.json (Seed Bank & Custom Cache) │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Database Schema & Entity Relationships

```
┌────────────────────────┐         1:N         ┌────────────────────────┐
│        users           ├────────────────────►│       classrooms       │
├────────────────────────┤                     ├────────────────────────┤
│ id (PK)                │                     │ classroom_id (PK)      │
│ name, email, password  │                     │ teacher_user_id (FK)   │
│ role (stud/teach/par/  │                     │ subject, grade_level   │
│       admin/dev)       │                     │ school_year, term      │
│ classroom_id           │                     │ expires_at             │
└───────────┬────────────┘                     └───────────┬────────────┘
            │ 1:N                                          │ 1:N
            ▼                                              ▼
┌────────────────────────┐                     ┌────────────────────────┐
│  ai_generation_logs    │                     │   classroom_members    │
├────────────────────────┤                     ├────────────────────────┤
│ id (PK)                │                     │ id (PK)                │
│ user_id (FK), role     │                     │ classroom_id (FK)      │
│ generated_at           │                     │ student_id             │
└────────────────────────┘                     │ status (enrolled/prom) │
                                               │ promoted_to_grade      │
                                               │ final_average          │
                                               └────────────────────────┘
                                                           │
                                                           ▼
┌───────────────────────────────────────────────────────────────────────┐
│                            progress_logs                              │
├───────────────────────────────────────────────────────────────────────┤
│ event_id (PK, UUID)      │ student_id           │ classroom_id        │
│ subject, grade_level     │ topic                │ score, total_quest  │
│ assessment_type (pre-test / post-test / practice)                      │
│ school_year, term        │ created_at / timestamp                     │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ Aggregates to
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    student_academic_records (SF9)                     │
├───────────────────────────────────────────────────────────────────────┤
│ id (PK)                  │ student_id           │ school_year         │
│ grade_level, subject     │ classroom_id         │ pre_test_score      │
│ post_test_score          │ learning_gain (g)    │ term_1_score (Q1)   │
│ term_2_score (Q2)        │ term_3_score (Q3)    │ term_4_score (Q4)   │
│ final_average            │ promotional_status   │ promoted_to_grade   │
│ teacher_user_id          │ remarks              │ timestamps          │
└───────────────────────────────────────────────────────────────────────┘
```

### 5.3 Complete API Endpoint Catalog
| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/register` | Public | Registers teacher, parent, or admin (requires passkey for admin). |
| `POST` | `/api/login` | Public | Authenticates user; returns Sanctum bearer token and role. |
| `POST` | `/api/auth/send-otp` | Public | Dispatches 6-digit email verification code via Resend. |
| `POST` | `/api/auth/verify-otp` | Public | Validates OTP code for password resets. |
| `POST` | `/api/parent/create-student` | Parent Auth | Creates a student profile with auto-generated credentials. |
| `POST` | `/api/classroom/create` | Teacher Auth | Creates a classroom session with SY (`2026-2027`) and Term (`Quarter 1`). |
| `GET` | `/api/classroom/verify` | Public | Validates invite code; returns active subjects and duration status. |
| `POST` | `/api/classroom/claim` | Teacher Auth | Claims standard or custom item bank modules into the classroom. |
| `GET` | `/api/classroom/eosy-report` | Teacher Auth | Computes Q1–Q4 averages, pre/post gain, and promotion eligibility. |
| `POST` | `/api/classroom/promote` | Teacher Auth | Executes learner promotion and logs permanent SF9 transcript records. |
| `GET` | `/api/student/academic-history`| Auth | Retrieves permanent historical SF9 records for a student. |
| `POST` | `/api/progress/sync` | Student Auth | Ingests offline progress event batches with `event_id` deduplication. |
| `GET` | `/api/progress` | Auth | Retrieves telemetry logs filtered by classroom, term, and assessment type. |
| `POST` | `/api/generate` | Teacher Auth | Requests Gemini AI lesson & quiz generation (subject to rate limit). |
| `GET` | `/api/dev/rate-limits` | Admin/Dev | Retrieves current AI generation rate-limiting configurations. |
| `PUT` | `/api/dev/rate-limits` | Admin/Dev | Updates AI generation request quotas and sliding window durations. |

### 5.4 Master Rule Matrix for Adaptive Progression & Sync
| Rule ID | Trigger Event | Evaluation Condition | System Action | Error / Fallback Action |
|---|---|---|---|---|
| **R-01** | Student submits quiz | $\text{Score} < 80\%$ | Mark topic as *Review/Remediation*; keep dependent topic locked; recommend retry. | Display explanation feedback for incorrect items. |
| **R-02** | Student submits quiz | $\text{Score} \ge 80\%$ | Mark topic as *Mastered*; unlock immediate successor module in item bank tree. | Update local XP (+50 XP), star ratings, and streak counter. |
| **R-03** | Student selects topic | Prerequisite not completed | Deny access; display locked indicator and required prerequisite topic name. | Direct learner back to prerequisite module. |
| **R-04** | Reading slide loaded | Intro slide initialized | Display unassisted **Diagnostic Pre-Test** button to establish entry baseline. | Optional: student may proceed directly to study guide. |
| **R-05** | Checkpoint encountered | Checkpoint question answered | Validate answer; require correct response before unlocking next study slide. | Highlight incorrect choice with pedagogical hint. |
| **R-06** | Quiz completed offline | Device offline | Persist event into SQLite `student_progress` table with `is_synced = 0`. | Queue event for background dispatcher. |
| **R-07** | Network reconnects | Unsynced queue $> 0$ | Dispatch `POST /api/progress/sync` payload with queued event array. | If network drops mid-sync, retain in queue for next cycle. |
| **R-08** | Server receives sync | `event_id` already exists | Acknowledge receipt; discard duplicate record without double-counting scores. | Return `HTTP 200` with existing event confirmation. |
| **R-09** | AI Generate requested | Request count $\ge \text{max\_requests}$ in window | Reject request with `HTTP 429 Too Many Requests`; display reset timer. | Prompt teacher to author lesson manually or wait. |
| **R-10** | EOSY Promotion evaluated| $\text{General Final Avg} \ge 75\%$ | Flag learner as **ELIGIBLE FOR PROMOTION**; allow advancement to Grade Level $+ 1$. | If $< 60\%$, flag as **RETAINED**; if $60-74\%$, flag as **REMEDIAL**. |

---

# SECTION 6: METHODOLOGY, SAMPLING, & DATA ANALYSIS

### 6.1 Research Design
The development and evaluation follow the **Agile Incremental Development Model**:
* **Sprint 1**: Backend Core & SQLite Offline-First Mobile Storage (Zero-loss progress tracking).
* **Sprint 2**: Rule-Based Adaptive Progression & Checkpoint Study Guide Flow.
* **Sprint 3**: Google Gemini AI Content Ingestion & Teacher Human-in-the-Loop Review.
* **Sprint 4**: Parent Explorer & Minor Account Creation Gateway.
* **Sprint 5**: DepEd Academic Period Structure, Pre/Post Normalized Gain, & EOSY SF9 Console.
* **Sprint 6**: ISO/IEC 25010 Quality Evaluation & User Acceptance Testing (UAT).

### 6.2 Participants & Sampling Plan
* **Target Sample Size ($n$)**:
  - **Elementary Students**: $n = 30$ (10 students each from Grades 4, 5, and 6)
  - **Elementary Teachers**: $n = 6$ (Licensed teachers in Mathematics and English)
  - **Parents / Guardians**: $n = 15$ (Parents of participating elementary students)
  - **IT / Software Experts**: $n = 5$ (Systems developers / educational technologists)
* **Sampling Technique**: **Purposive Sampling**
* **Inclusion Criteria**:
  1. Students currently enrolled in Grades 4, 5, or 6 in the partner elementary school.
  2. Teachers actively handling Grade 4–6 Mathematics or English.
  3. Parents/guardians with access to an Android/iOS mobile device or web browser.
* **Exclusion Criteria**:
  1. Students outside Grades 4–6.
  2. Non-consenting participants.

### 6.3 Ethical Safeguards & Minor Data Privacy Protocol
1. **Institutional Clearance**: Formal administrative permission from the School Principal / Division Office.
2. **Parental Informed Consent**: Signed written consent forms from parents/guardians authorizing minor participation.
3. **Child Assent**: Age-appropriate verbal and written explanation given to students; participation is voluntary with right to withdraw at any time without penalty.
4. **Data Minimization & Anonymization**: No sensitive personal data (e.g. home addresses, contact numbers) collected; student IDs are synthetic identifiers.
5. **No Direct Minor Registration**: Open public self-registration is disabled for minors; accounts are generated strictly through authenticated parent or teacher sessions.
6. **AI Privacy Safeguards**: No student names or identifying information are ever transmitted to the Google Gemini API. Gemini is used exclusively for topic curriculum drafting.

### 6.4 ISO/IEC 25010 Software Quality Evaluation Instrument
Evaluation utilizes a **5-point Likert Scale**:
$$\text{Weighted Mean} = \frac{\sum (f \cdot w)}{N}$$

| Rating Scale | Weighted Mean Range | Verbal Interpretation |
|---|---|---|
| **5** | $4.21 - 5.00$ | **Strongly Agree / Highly Acceptable** |
| **4** | $3.41 - 4.20$ | **Agree / Acceptable** |
| **3** | $2.61 - 3.40$ | **Neutral / Moderately Acceptable** |
| **2** | $1.81 - 2.60$ | **Disagree / Unacceptable** |
| **1** | $1.00 - 1.80$ | **Strongly Disagree / Highly Unacceptable** |

#### Operationalized ISO 25010 Evaluation Questionnaire
| Dimension | Item Code | Survey Question Statement |
|---|---|---|
| **Functional Suitability** | FS-01 | The system accurately delivers lessons, pre-tests, checkpoints, and quizzes aligned with Grade 4–6 MELC. |
| | FS-02 | The rule-based adaptive routing correctly unlocks new lessons only when achieving $\ge 80\%$ score. |
| | FS-03 | The teacher console reliably generates classrooms, claims curriculum modules, and compiles SF9 records. |
| **Performance Efficiency**| PE-01 | The mobile app opens and executes study slides and quizzes without noticeable lag or latency. |
| | PE-02 | The local SQLite database loads cached lesson content immediately without internet waiting times. |
| | PE-03 | The web dashboard loads mastery heatmaps and progress tables rapidly. |
| **Usability** | US-01 | The user interface is intuitive, easy to navigate, and visually appropriate for primary school students. |
| | US-02 | Gamification elements (XP, stars, badges, streaks) clearly convey learning progress. |
| | US-03 | Immediate bilingual feedback (English/Filipino) helps learners understand their errors. |
| **Reliability** | RE-01 | The mobile app allows uninterrupted learning and quiz completion even in Airplane Mode (offline). |
| | RE-02 | Offline quiz progress is safely stored locally without data loss during connectivity drops. |
| | RE-03 | Telemetry synchronization accurately merges queued records once internet connection is restored. |
| **Portability** | PO-01 | The mobile application installs and renders consistently across supported Android and iOS devices. |
| | PO-02 | The web management portal is responsive across standard desktop, laptop, and tablet screen sizes. |

### 6.5 Technical Testing Metrics
* **Synchronization Success Rate ($SSR$)**:
  $$SSR = \left( \frac{\text{Total Successfully Synchronized Events}}{\text{Total Queued Sync Events}} \right) \times 100\%$$
* **Test Case Pass Rate ($TPR$)**:
  $$TPR = \left( \frac{\text{Passed Test Cases}}{\text{Total Executed Test Cases}} \right) \times 100\%$$
  *(Current verified state: **100\% passing rate** across 31 Web test suites [91 tests] and 22 Mobile test suites [86 tests]).*

---

# SECTION 7: RECONCILED REQUIREMENTS INVENTORY

To eliminate inconsistencies across Chapters 3, 4, and 5, use this master inventory:

### Functional Requirements (FR-01 to FR-18)
* **FR-01: User Authentication & Role Management** — Role-based access control for Student, Teacher, Parent, and Admin/Developer.
* **FR-02: Parent-Managed Student Account Provisioning** — Minor accounts created strictly through authenticated parent sessions.
* **FR-03: Offline-First Lesson Caching & Viewing** — Local storage and paginated display of study guides on mobile devices.
* **FR-04: Reading Checkpoint Gatekeeping** — Mandatory 1–3 checkpoint questions embedded in slides before unlocking quizzes.
* **FR-05: Diagnostic Pre-Test & Summative Post-Test Execution** — Unassisted entry baseline pre-tests and summative mastery post-tests.
* **FR-06: Rule-Based Adaptive Lesson Unlocking** — Deterministic module unlocking upon meeting the $\ge 80\%$ score threshold.
* **FR-07: Bilingual Explanatory Feedback** — Displaying English and Filipino rationale upon question submission.
* **FR-08: Local Gamification State Tracking** — Offline awarding of XP points, 1–3 star ratings, streak counts, and badges.
* **FR-09: Asynchronous Telemetry Queue & Deduplication** — Local queuing and idempotent server sync via unique `event_id`.
* **FR-10: Classroom Session Code Generation & Expiry** — Teacher creation of invite codes with configurable duration locks.
* **FR-11: Curriculum Template Claiming & Ingestion** — Claiming standard item bank topics into active classroom rosters.
* **FR-12: AI-Assisted Content Generation via Gemini** — Drafting study slides and question pools from topic names or PDFs.
* **FR-13: Human-in-the-Loop Content Review & Editing** — Full teacher CRUD capability over AI-generated lesson content.
* **FR-14: AI Generation Rate Limiting & Token Governance** — Sliding-window quota enforcement per user role.
* **FR-15: Classroom Mastery Matrix Heatmap** — Multi-student topic mastery table with quarter and assessment type filters.
* **FR-16: Automated Diagnostic Alert Triggers** — Automated teacher alerts for students or topics with averages below $80\%$.
* **FR-17: End-of-School-Year (EOSY) Promotion & SF9** — General Final Average computation, batch promotion, and Form 138 printouts.
* **FR-18: Parent Progress Monitoring via Access Code** — 6-digit access code lookup for attendance heatmaps and tutor summaries.

### Non-Functional Requirements (NFR-01 to NFR-05)
* **NFR-01: Offline Availability & Zero Data Loss** — Complete local operational capability during network outages.
* **NFR-02: Performance Efficiency & Rapid Local Load** — Local quiz interaction latency $< 100\text{ ms}$.
* **NFR-03: Security & Minor Data Privacy** — Password hashing (bcrypt), token expiration, and zero minor PII leakage to AI.
* **NFR-04: Usability & Child-Centric UI Design** — High-contrast typography, large touch targets, and visual mascot feedback.
* **NFR-05: Cross-Platform Compatibility** — Mobile responsiveness on Android/iOS and web responsiveness on modern browsers.

---

# SECTION 8: STEP-BY-STEP CHECKLIST FOR MANUSCRIPT REVISION

```
  [ ] Step 1: Global Acronym & Name Find-and-Replace
      • Search for old expansions (e.g. "Guro Educational Platform", etc.).
      • Replace with: "GURO: Guided Unified Resource Optimization".

  [ ] Step 2: Update Title Page, Abstract, and Chapter 1
      • Set official title.
      • Update SOP and Objectives with the 6 specific problems/objectives from Section 3.
      • Ensure connectivity terms are standardized ("limited/unstable connectivity").

  [ ] Step 3: Revise Chapter 2 (Literature & Frameworks)
      • Insert Theoretical Framework with the 5 theories and mapping table (Section 4.1).
      • Insert Synthesis of Related Literature comparison table (Section 4.2).
      • State the exact research gap from Section 4.2.
      • Replace Conceptual Framework diagram with Section 4.3 IPO diagram.

  [ ] Step 4: Revise Chapter 3 (Technical Architecture & Methodology)
      • Update System Architecture Diagram matching Section 5.1.
      • Update Database ERD and Schema descriptions matching Section 5.2.
      • Insert Master Rule Matrix matching Section 5.4.
      • Insert Research Methodology, Sample Size, Ethics, and ISO 25010 Instrument (Section 6).
      • Reconcile FR-01–FR-18 and NFR-01–NFR-05 (Section 7).

  [ ] Step 5: Format Chapters 4 & 5
      • Maintain future/proposed tense for UAT until live surveys are conducted.
      • Structure Table 4.1 for ISO 25010 mean scores.
      • Base Chapter 5 conclusions strictly on measured metrics.
```
