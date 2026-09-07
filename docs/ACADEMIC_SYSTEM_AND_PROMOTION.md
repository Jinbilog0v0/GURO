# GURO Academic Period, Diagnostic Pre/Post-Test, & EOSY Promotion System

## 1. Executive Summary

This document details the architecture, data models, pedagogical formulas, and user workflows for GURO's **DepEd-Aligned Academic Period Structure**, **Pre/Post-Test Learning Gain Tracking**, and **End-of-School-Year (EOSY) Promotion & School Form 9 (SF9) Transcript Console**.

These features allow Philippine elementary schools (Grades 4–6) to:
1. Organize instructional sessions by **School Year (SY)** (e.g., `2026-2027`) and **Quarters / Terms** (`Quarter 1` through `Quarter 4`).
2. Establish baseline competencies via **Diagnostic Pre-Tests** and evaluate summative progress via **Post-Tests** using normalized gain metrics ($g$).
3. Review quarterly academic standing and execute grade-level promotions ($\ge 75\%$ passing standard) with permanent SF9/SF10 transcript archiving.

---

## 2. DepEd Academic Period Structure

### 2.1 Elementary School Term Breakdown
In accordance with Department of Education (DepEd) elementary standards, the school calendar is structured into four distinct grading quarters per School Year:

| Academic Period | Focus & Assessment Scope | DepEd Standard |
|---|---|---|
| **Quarter 1 (Term 1)** | First Quarter MELC Competencies & Baseline Diagnostic Tests | Formative & Summative Grading |
| **Quarter 2 (Term 2)** | Second Quarter Competencies & Mid-Year Evaluation | Formative & Summative Grading |
| **Quarter 3 (Term 3)** | Third Quarter Competencies | Formative & Summative Grading |
| **Quarter 4 (Term 4)** | Fourth Quarter Competencies & Year-End Summative Evaluations | Year-End Grading Consolidation |

### 2.2 Classroom Session Pairing
When a teacher generates a classroom session code:
* The teacher selects the **Grade Level** (4, 5, or 6), **Subject** (Mathematics or English), **School Year** (e.g. `2026-2027`), and **Academic Term** (`Quarter 1` to `Quarter 4`).
* Mobile devices and web student sessions enrolled in the classroom automatically tag telemetry with the active School Year and Quarter.

---

## 3. Diagnostic Pre-Test & Summative Post-Test Methodology

### 3.1 Assessment Types
Telemetry events in GURO are classified into three assessment types:
1. `pre-test`: **Diagnostic Entry Assessment** — Administered before the student reviews lesson guides to establish an unassisted baseline. Does not negatively impact overall standing.
2. `post-test`: **Summative Mastery Assessment** — Administered upon completing study slides and reading checkpoints to measure knowledge acquisition.
3. `practice`: **Formative Practice Quizzes** — Adaptive self-paced study quizzes for review and streak building.

### 3.2 Learning Gain Formulations

#### Absolute Gain ($\Delta\%$)
$$\Delta\% = \text{Score}_{\text{Post}} - \text{Score}_{\text{Pre}}$$

#### Hake's Normalized Learning Gain ($g$)
To measure instructional effectiveness regardless of entry baseline, GURO calculates the Hake Normalized Gain (Hake, 1998):

$$g = \begin{cases} \frac{\text{Score}_{\text{Post}} - \text{Score}_{\text{Pre}}}{100 - \text{Score}_{\text{Pre}}} \times 100 & \text{if } \text{Score}_{\text{Pre}} < 100 \\ \text{Score}_{\text{Post}} - \text{Score}_{\text{Pre}} & \text{if } \text{Score}_{\text{Pre}} = 100 \end{cases}$$

#### Progress Categorization Thresholds
| Normalized Gain ($g$) | Growth Classification | Instructional Interpretation |
|---|---|---|
| $g \ge 70\%$ | 🟢 **High Gain (Mastery)** | Strong concept retention; ready for advanced enrichment. |
| $30\% \le g < 70\%$ | 🔵 **Medium Gain (Progressing)** | Satisfactory instructional gain; standard progression. |
| $0\% \le g < 30\%$ | 🟡 **Low Gain (Needs Review)** | Minimal concept gain; recommends refresher practice. |
| $g < 0\%$ | 🔴 **Needs Remediation** | Score regression; triggers teacher diagnostic alert. |

---

## 4. End-of-School-Year (EOSY) Promotion & Grading Review

### 4.1 DepEd General Average Computation
At the close of the academic year, the system calculates the student's cumulative General Final Average across all completed quarters:

$$\text{General Final Average} = \frac{Q_1 + Q_2 + Q_3 + Q_4}{4}$$

*(If fewer than 4 quarters have taken place, the average is calculated over all active completed term records).*

### 4.2 DepEd Promotion Standard
Following DepEd Order No. 8, s. 2015 (Policy Guidelines on Classroom Assessment):
* **General Final Average $\ge 75\%$**: **ELIGIBLE FOR PROMOTION** $\to$ Promoted to the next grade level (e.g. Grade 4 $\to$ Grade 5, Grade 5 $\to$ Grade 6).
* **General Final Average between $60\% - 74\%$**: **CONDITIONAL / REMEDIAL** $\to$ Requires remedial instruction before promotional confirmation.
* **General Final Average $< 60\%$**: **RETAINED** $\to$ Retained in the current grade level.

### 4.3 Permanent School Form 9 (SF9) Transcript Archiving
When the teacher executes promotion in the EOSY Console:
1. The student's `classroom_members` record updates `status = 'promoted'`, `promoted_to_grade = nextGrade`, `final_average = finalAvg`, and `promoted_at = now()`.
2. A permanent academic transcript entry is created in `student_academic_records` storing:
   - Learner Reference ID
   - School Year & Grade Level
   - Subject Focus
   - Diagnostic Pre-Test Average & Summative Post-Test Average
   - Overall Normalized Gain ($g$)
   - Quarterly Scores (Q1, Q2, Q3, Q4)
   - Final General Average
   - Official Promotional Action & Remarks

---

## 5. Database Schema & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                              classrooms                                │
├────────────────────────────────────────────────────────────────────────┤
│ classroom_id (PK) | teacher_user_id | subject | grade_level            │
│ school_year (e.g. '2026-2027')      | term (e.g. 'Quarter 1')          │
└────────────────────────────────────────────────────────────────────────┘
                                │ 1:N
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           progress_logs                                │
├────────────────────────────────────────────────────────────────────────┤
│ event_id (PK) | student_id | classroom_id | subject | grade_level     │
│ score         | total_questions           | topic                      │
│ assessment_type ('pre-test' | 'post-test' | 'practice')                │
│ school_year   | term                      | timestamp                  │
└────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     student_academic_records (SF9)                     │
├────────────────────────────────────────────────────────────────────────┤
│ id (PK)       | student_id        | school_year     | grade_level      │
│ subject       | classroom_id      | pre_test_score  | post_test_score  │
│ learning_gain | term_1_score      | term_2_score    | term_3_score     │
│ term_4_score  | final_average     | promotional_status                 │
│ promoted_to_grade | teacher_user_id | remarks       | timestamps       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 6. API Endpoints

### 1. `GET /api/classroom/eosy-report`
* **Query Params**: `classroomId` (required)
* **Response**: Returns roster with Q1–Q4 quarterly scores, pre/post averages, normalized gain, general average, and promotional eligibility.

### 2. `POST /api/classroom/promote`
* **Body**: `{ classroomId: string, studentIds: string[], remarks?: string }`
* **Response**: Promotes selected learners to the next grade level and logs permanent SF9 transcript records.

### 3. `GET /api/student/academic-history`
* **Query Params**: `studentId` (required)
* **Response**: Returns permanent historical SF9 records across all school years and grade levels.

### 4. `GET /api/progress`
* **Query Params**: `classroomId`, `term` (optional), `schoolYear` (optional), `assessmentType` (optional).
* **Response**: Filtered progress telemetry logs.

---

## 7. User Interfaces

### 7.1 Web Teacher Space (`frontend/Guro-Web`)
* **Pre/Post Growth Tab** (`PrePostTestAnalytics.tsx`): Metric cards for class-wide baseline, summative average, and normalized gains, paired with a filterable comparison roster.
* **EOSY Promotion Tab** (`EosyPromotionConsole.tsx`): Form 138-style table with quarterly grade breakdowns, multi-student promotion checkboxes, and printable SF9 transcript modals.
* **Mastery Matrix** (`MasteryMatrix.tsx`): Multi-filter support for specific quarters (Q1–Q4) and assessment types (*Pre-Test*, *Post-Test*, *Practice*).

### 7.2 Mobile Client (`frontend/Guro-Mobile`)
* **Study Guide Pre-Test Trigger** (`StudyScreen.tsx`): Embeds a diagnostic pre-test launcher directly on the introductory slide.
* **Post-Test Assessment** (`AssessmentScreen.tsx`): Calculates score gains and displays normalized learning gain feedback upon test completion.
* **Student Progress Report** (`StudentProgressReportScreen.tsx`): Displays DepEd Academic Period status (School Year & Quarter) and comparative pre/post growth tables.
