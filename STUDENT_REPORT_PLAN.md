# Student Progress Report — Implementation Plan

## Overview
A parent-accessible progress report triggered from the **Parent Rules** tab in the student
`SettingsScreen`. After tapping "View Progress Report", a full-stack screen slides in showing
all of the student's offline progress data. A "Save to Device" button at the bottom writes a
plain-text report file via the existing `FileService`.

---

## Feature Flow

```
SettingsScreen
  └─ Parent Rules tab (PIN-protected)
       └─ [View Progress Report] button
            └─ navigation.push('StudentProgressReport')
                 └─ StudentProgressReportScreen
                      ├─ Student profile header
                      ├─ Summary stat cards
                      ├─ Per-subject / per-topic breakdown (scrollable)
                      ├─ Badge status grid
                      └─ [Save to Device] → FileService.writeFile()
```

---

## Files to Create

### `src/screens/StudentProgressReportScreen.tsx`
The new full-stack screen. Read-only. Contains:

| Section | Content |
|---|---|
| **Header** | Student name, grade level, XP, level, studentId |
| **Summary Cards** | Total sessions · Avg accuracy · Synced · Unsynced |
| **Subject Breakdown** | Per-subject list → per-topic rows (avg score, session count, pass/fail badge) |
| **Badge Status** | Grid of topic badges — unlocked (✅) or locked (🔒) based on avg ≥ 80% |
| **Footer** | "Save to Device" button |

Data sources (all from `useAppStore`):
- `studentProgress` — array of `ProgressEvent` for sessions
- `studentId`, `guestName`, `currentUser`, `preferredGrade` — profile
- `xpPoints` — for level calculation (`Math.floor(xp / 100) + 1`)

### `src/styles/StudentProgressReport.styles.ts`
StyleSheet for the report screen. Follows existing style file conventions
(`TeacherDashboard.styles.ts` as reference).

---

## Files to Modify

### `src/navigation/AppNavigator.tsx`
1. Add `StudentProgressReport: undefined` to `RootStackParamList`
2. Import `StudentProgressReportScreen`
3. Register `Stack.Screen` with `options={{ title: 'Progress Report' }}`

### `src/screens/SettingsScreen.tsx`
In the `'rules'` (Parent Rules) case of `renderSettingsBox()`:
1. Import `useNavigation`
2. Add a `PrimaryButton` labeled **"View Progress Report"** with a `BarChart2` icon
3. `onPress` → `navigation.push('StudentProgressReport')`

Place it **after** the existing parent controls (screen time, PIN settings) and
**before** the close/footer area so it reads as a summary action at the end of
the parent section.

---

## Step-by-Step Implementation

### Step 1 — Navigation
- Add route to `RootStackParamList` in `AppNavigator.tsx`
- Register the screen in the Stack navigator

### Step 2 — Styles file
- Create `StudentProgressReport.styles.ts`
- Reuse tokens: `Colors`, `Spacing`, `Radius`, `Fonts`, `FontSizes`

### Step 3 — Report screen scaffold
- Create `StudentProgressReportScreen.tsx`
- Wire up `useAppStore` selectors for all data
- Build the SafeAreaView + ScrollView shell with header

### Step 4 — Summary stat cards
- Compute: `totalSessions`, `avgAccuracy`, `syncedCount`, `unsyncedCount`
- Render using existing `StatCard` component

### Step 5 — Subject/topic breakdown
- Group `studentProgress` events by `subject` → `topic`
- Per topic: compute avg score %, session count, best score
- Render as expandable or flat list rows with color-coded score badges

### Step 6 — Badge grid
- Reuse badge unlock logic from `ParentDashboard`:
  avg of all topic attempts ≥ 80% = unlocked
- Display topic name + lock/unlock icon in a 2-column grid

### Step 7 — Save to Device button
- On press: build a plain-text report string (student name, date, all stats)
- Call `FileService.writeFile(fileName, content)` — same pattern as
  TeacherSettingsScreen diagnostic reports
- Show `toast.success('Report saved to device')` on success

### Step 8 — Entry point in SettingsScreen
- Add `PrimaryButton` in the `'rules'` case
- Import `useNavigation` from `@react-navigation/native`

### Step 9 — Offline logout guard (Option A)
- Audit all screens that call `navigation.replace('Login')`
- Wrap each with: `if (appMode === 'offline') return;` (redirect to StudentDashboard instead)
- Screens to check: `ParentDashboard`, `SettingsScreen`, `TeacherDashboardScreen`

### Step 10 — Lint + Tests
- Run `npx tsc --noEmit` on mobile
- Run `npx jest --passWithNoTests`
- Fix any type errors before marking done

---

## Save File Format

```
GURO Student Progress Report
==============================
Generated : 2026-07-06
Student   : Juan dela Cruz
Grade     : 5
Level     : 4  (XP: 380)
Student ID: JUAN-DELA-CRUZ-GUEST

SUMMARY
-------
Total Sessions  : 24
Average Accuracy: 76%
Synced Records  : 18
Unsynced Records: 6

SUBJECT BREAKDOWN
-----------------
Mathematics
  • Fractions        — 3 sessions | avg 82% ✅
  • Place Value      — 5 sessions | avg 68% ❌
  • Geometry         — 2 sessions | avg 90% ✅

English
  • Nouns            — 4 sessions | avg 75% ❌
  • Reading Comp.    — 2 sessions | avg 85% ✅

BADGES UNLOCKED
---------------
✅ Fractions   ✅ Geometry   ✅ Reading Comp.
🔒 Place Value  🔒 Nouns

==============================
Saved by GURO Mobile App
```

---

## Acceptance Criteria

- [ ] Parent Rules tab shows "View Progress Report" button (no extra PIN prompt needed — parent is already authenticated in this tab)
- [ ] Tapping it pushes `StudentProgressReportScreen` with a back button
- [ ] All student progress data renders correctly for both online and offline students
- [ ] "Save to Device" creates a `.txt` file readable from the device file manager
- [ ] `toast.success` / `toast.error` feedback on save
- [ ] Offline logout guard prevents offline students from reaching LoginScreen
- [ ] `tsc --noEmit` passes with 0 errors
- [ ] All 77 Jest tests still pass
