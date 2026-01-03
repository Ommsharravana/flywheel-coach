# Judge Scoring - Quick Start Testing Guide
**5-Minute Setup → 5-Minute Test → Done**

---

## Step 1: Enable Trial Mode (30 seconds)

Copy-paste into Supabase SQL Editor:

```sql
SELECT set_judging_trial_mode(
  '003089a3-8b28-4844-9714-b94f9b838462'::uuid,
  true
);
```

Verify it worked:
```sql
SELECT get_judging_trial_mode(
  '003089a3-8b28-4844-9714-b94f9b838462'::uuid
);
-- Should return: true
```

---

## Step 2: Verify You're a Judge (30 seconds)

```sql
-- Check if you're assigned
SELECT * FROM get_event_judges(
  '003089a3-8b28-4844-9714-b94f9b838462'::uuid
)
WHERE user_email = 'YOUR-EMAIL@example.com';
```

If not assigned, run:
```sql
SELECT * FROM assign_judge_to_track(
  'YOUR-EMAIL@example.com',
  'health-wellness',  -- Replace with actual track theme
  '003089a3-8b28-4844-9714-b94f9b838462'::uuid,
  false  -- is_lead
);
```

---

## Step 3: Run Smoke Test (5 minutes)

### Checklist
```
[ ] 1. Go to: https://jkkn-solution-studio.vercel.app/judge
[ ] 2. Login with your credentials
[ ] 3. See track name + submissions list (NOT countdown)
[ ] 4. Click first submission
[ ] 5. Scoring form loads with 6 sliders + 4 checkboxes
[ ] 6. Drag sliders to: 8, 7, 9, 6, 8, 5
[ ] 7. Check "Cross-disciplinary" bonus
[ ] 8. Verify score shows ~84.12
[ ] 9. Type "Great work!" in Strengths
[ ] 10. Wait 1 second → "Saving..." appears
[ ] 11. Click "Submit Score"
[ ] 12. Success toast + "Submitted" badge shows
[ ] 13. Click "Back to List"
[ ] 14. Submission shows "Completed" status
[ ] 15. Refresh page → Score persists
```

**Result:** PASS / FAIL
**Time:** _____ mins
**Issues:** ______________________________

---

## Step 4: Verify Score Calculation (2 minutes)

Test these scenarios:

| Sliders | Bonuses | Expected Score |
|---------|---------|----------------|
| All 1s | None | **11.76** |
| All 5s | None | **58.82** |
| 8,7,9,6,8,5 | Cross-disc only | **84.12** |
| All 8s | All 4 bonuses | **92.00** |
| All 10s | All 4 bonuses | **135.29** |

**How to test:**
1. Score a submission
2. Enter values from table
3. Compare calculated score to "Expected Score"
4. If match → ✅ PASS
5. If mismatch → ❌ FAIL (report as P0 bug)

---

## If Something Breaks

### Error: "Not authorized"
- **Fix:** Verify you're assigned as judge (Step 2)

### Error: "Panel not revealed yet" (shows countdown)
- **Fix:** Trial mode not enabled (Step 1)

### Error: "No submissions assigned"
- **Fix:** Ask admin to assign submissions to your track

### Score calculation wrong
- **Fix:** Report exact values tested + expected vs actual

### Auto-save doesn't work
- **Fix:** Check browser console for errors, report with screenshot

---

## Quick Reference

### Production URL
https://jkkn-solution-studio.vercel.app/judge

### Event ID (Appathon 2.0)
`003089a3-8b28-4844-9714-b94f9b838462`

### Score Formula
```
weighted = sum(criteria * weights) * (100/0.85)
bonus = 0-15% (5+5+3+2)
total = weighted * (1 + bonus/100)
```

### Weights
- Problem Impact: 20%
- Solution Innovation: 20%
- Working Prototype: 20%
- User Validation: 15%
- Presentation Quality: 5%
- Bioconvergence: 5%

### Bonuses
- Cross-disciplinary: +5%
- Cross-institutional: +5%
- First-year: +3%
- User testimonials: +2%

---

## Full Test Suite

**After smoke test passes**, run the comprehensive test:

See: [JUDGE-SCORING-TEST-REPORT.md](./JUDGE-SCORING-TEST-REPORT.md)
- 77 detailed test cases
- 10 categories (navigation, scoring, auto-save, etc.)
- ~1-2 hours to complete

---

## Report Results

### If PASS
✅ All good! Mark feature as ready for Demo Day.

### If FAIL
Document using this template:

```markdown
**Bug #1**
- **Severity:** P0 / P1 / P2 / P3
- **Description:** [What went wrong]
- **Steps to Reproduce:**
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected:** [What should happen]
- **Actual:** [What actually happened]
- **Screenshot:** [Attach if visual]
- **Browser:** Chrome/Safari/Firefox
- **Device:** Desktop/Mobile
```

---

## Contact

**Developer:** [Name]
**Support:** [Email/Phone]
**Documentation:** All test docs in project root

---

**REMEMBER:** This is a quick smoke test. Full testing (77 cases) still needed before Demo Day!

*Quick Start Guide v1.0 - January 3, 2026*
