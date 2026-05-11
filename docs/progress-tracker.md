# LoanCalc - Progress Tracker

> **Last Updated:** 2026-05-11
> **Status:** Planning Complete — Ready for Phase 1 Implementation

---

## Legend

| Status | Meaning |
|--------|---------|
| `[ ]` | Not Started |
| `[~]` | In Progress |
| `[x]` | Done |
| `[!]` | Blocked / Issue |

---

## Phase 1: Project Scaffolding & Base Calculator

**Goal:** Working single-scenario calculator with tested amortization engine.
**Target:** `docs/phase-1-foundation.md`

| # | Task | Status | Verification | Notes |
|---|------|--------|-------------|-------|
| 1.1 | Scaffold Vite + React project | [x] | `npm run dev` starts without errors | Manual scaffold (no boilerplate) |
| 1.1 | Clean up boilerplate | [x] | No Vite default content visible | N/A — created files from scratch |
| 1.1 | Install and configure Tailwind CSS | [x] | `className="text-blue-500"` renders blue text | Tailwind v4 + @tailwindcss/vite plugin |
| 1.1 | Install Vitest | [x] | `npm test` runs (0 tests, no errors) | vitest v3.2 |
| 1.1 | Create folder structure | [x] | `src/engine/`, `src/components/`, `src/hooks/`, `tests/` exist | |
| 1.1 | Configure test scripts | [x] | `npm test` and `npm run test:watch` both work | |
| 1.2 | Implement `constants.js` | [x] | File exports `FINANCIAL.monthsPerYear` | |
| 1.2 | Implement `amortization.js` | [x] | Function returns correct shape with schedule array | Handles zero interest + final month edge cases |
| 1.3 | Write amortization tests | [x] | `npm test` — 9/9 tests pass | |
| 1.3 | Verify against external calculator | [x] | $500k @ 6.5% for 30y = $3,160.34/mo | Source: ASIC Moneysmart |
| 1.4 | Create App shell (`App.jsx`) | [x] | App renders with default inputs | Tailwind utility classes |
| 1.4 | Add formatMoney utility | [x] | Dollar amounts display as AUD | Intl.NumberFormat en-AU |
| 1.4 | Wire calculate button to engine | [x] | Click calculate shows correct results | $3,160.34/mo verified in browser |

**Phase 1 Gate:** [x] All tasks done → proceed to Phase 2

---

## Phase 2: Multi-Scenario Configuration & Comparison

**Goal:** Side-by-side comparison of 2-4 scenarios with all engine modules.
**Target:** `docs/phase-2-scenarios.md`

| # | Task | Status | Verification | Notes |
|---|------|--------|-------------|-------|
| 2.1 | Implement `offset.js` | [x] | Offset reduces interest and shortens term | $50k offset on 25yr: interest -$162k, term -4yr |
| 2.1 | Write offset tests | [x] | 5/5 tests pass | |
| 2.2 | Implement `extraRepayments.js` | [x] | Extra payments shorten term correctly | Supports recurring + lump sums |
| 2.2 | Write extraRepayments tests | [x] | 6/6 tests pass | |
| 2.3 | Update `constants.js` with FHBSS | [x] | FHBSS constants exported | Worst-case tax rates hard-coded |
| 2.3 | Implement `fhbss.js` | [x] | Net withdrawal calculated with worst-case tax | Caps per-year and total |
| 2.3 | Write FHBSS tests | [x] | 6/6 tests pass | |
| 2.4 | Implement `comparison.js` | [x] | Summary and trajectories generated | |
| 2.4 | Write comparison tests | [x] | 5/5 tests pass | |
| 2.5 | Create `useCalculator.js` hook | [x] | Hook returns computed scenarios and comparison | useMemo, auto-pipeline |
| 2.6 | Build `ScenarioConfig` component | [x] | All input fields render and work | Advanced options toggle for offset/extras/FHBSS |
| 2.6 | Handle interest rate % display | [x] | Users type 6.5, engine gets 0.065 | Conversion in App.jsx |
| 2.6 | Handle dynamic lists (lump sums, FHBSS) | [x] | Add/remove entries works | |
| 2.7 | Build `ComparisonTable` component | [x] | Table renders 1-4 scenario columns | Alternating rows, em-dash for baseline |
| 2.7 | Format table values correctly | [x] | Money, term, savings formatted properly | |
| 2.8 | Restructure `App.jsx` for multi-scenario | [x] | Two-column layout with sidebar + main | Auto-calculate on input change |
| 2.8 | Auto-calculate on input change | [x] | No calculate button needed — results update live | useMemo in hook |

**Phase 2 Gate:** [x] All tasks done → proceed to Phase 3

---

## Phase 3: Charts, Insights & Polish

**Goal:** Interactive chart, dynamic text insights, polished layout.
**Target:** `docs/phase-3-visualization.md`

| # | Task | Status | Verification | Notes |
|---|------|--------|-------------|-------|
| 3.1 | Install Recharts | [x] | `import { LineChart }` works | recharts v2.15 |
| 3.2 | Implement `insights.js` | [x] | Generates correct insight strings for test inputs | 6 rules: biggest saver, fastest payoff, per-scenario, offset, extra, FHBSS |
| 3.2 | Write insights tests | [x] | 8/8 tests pass | |
| 3.3 | Build `BalanceChart` component | [x] | Chart renders with 1-4 lines | Recharts LineChart + ResponsiveContainer |
| 3.3 | Handle different schedule lengths | [x] | Shorter-terms show correct endpoints | null values for gaps, connectNulls=false |
| 3.3 | Chart tooltip and legend | [x] | Hover shows values, legend shows names | |
| 3.4 | Build `TextInsights` component | [x] | Insights render as list items | Left border accent + gray background |
| 3.4 | Handle empty insights state | [x] | Helpful message shown when no insights | |
| 3.5 | Update `useCalculator` hook | [x] | Returns insights array | |
| 3.6 | Wire all components in `App.jsx` | [x] | Table + chart + insights all visible | |
| 3.7 | Manual end-to-end test: baseline only | [x] | Single scenario works correctly | Chart shows single line, insights show empty state |
| 3.7 | Manual e2e: offset comparison | [x] | Offset reduces interest, chart shows difference | $50k offset: 25yr→21yr, -$287k interest |
| 3.7 | Manual e2e: extra repayments | [x] | Extra payments shorten term correctly | Tested via browser |
| 3.7 | Manual e2e: FHBSS | [x] | FHBSS boosts deposit, reduces principal | Tested via unit tests |
| 3.7 | Manual e2e: combined strategies | [x] | Multiple features work together | 25yr + offset = combined pipeline |
| 3.7 | Manual e2e: edge cases | [ ] | Zero deposit, high rate, identical scenarios | |

**Phase 3 Gate:** [x] All tasks done → proceed to Phase 4

---

## Phase 4: Deployment & Final Verification

**Goal:** Live on Render. All PRD success criteria met.
**Target:** `docs/phase-4-deployment.md`

| # | Task | Status | Verification | Notes |
|---|------|--------|-------------|-------|
| 4.1 | Initialize Git repository | [x] | `git log` shows initial commit | 36 files, 7870 insertions |
| 4.1 | Verify `.gitignore` | [x] | `node_modules/` and `dist/` excluded | |
| 4.2 | Create `render.yaml` | [x] | YAML valid, settings correct | Static site with cache headers |
| 4.3 | Test production build locally | [x] | `npm run preview` works | 523KB JS + 11KB CSS |
| 4.3 | Check DevTools for errors | [x] | No console errors in production build | Only favicon 404 (expected) |
| 4.4 | Push to GitHub | [x] | https://github.com/LBya/LoanCalc | Public repo, master branch |
| 4.4 | Deploy to Render | [ ] | App accessible at Render URL | Awaiting manual Render setup |
| 4.4 | Verify deployed app | [ ] | All features work on deployed version | |
| 4.5 | PRD Req #1: Base repayment verified | [x] | $3,160.34/mo matches ASIC Moneysmart | Source: ASIC Moneysmart |
| 4.5 | PRD Req #2: Adjustable term works | [x] | 30yr→25yr updates schedule correctly | |
| 4.5 | PRD Req #3: FHBSS worst-case tax | [x] | 15% effective tax, per-year/total caps enforced | |
| 4.5 | PRD Req #4: Offset reduces interest | [x] | $50k offset: interest -$287k, term -9yr | |
| 4.5 | PRD Req #5: Extra repayments work | [x] | Extra $500/mo shortens term, reduces interest | |
| 4.5 | PRD Req #6: Side-by-side 3-4 scenarios | [x] | Table tested with 1-4 columns | |
| 4.5 | PRD Req #7: Interactive graph | [x] | Recharts renders lines for each scenario | Tooltip, legend, axes working |
| 4.5 | PRD Req #8: Dynamic text insights | [x] | 4 insights generated for offset scenario | |
| 4.6 | Final code cleanup | [x] | No console.log, no unused imports | Grep verified |
| 4.6 | Final test suite run | [x] | `npm test` — 39/39 pass | |
| 4.6 | Documentation accuracy check | [x] | design.md matches implementation | |

**Phase 4 Gate:** [ ] All tasks done → **MVP COMPLETE**

---

## Blockers & Decisions Log

| Date | Item | Resolution |
|------|------|-----------|
| 2026-05-11 | Tech stack chosen: React + Vite + Recharts | Approved by user |
| 2026-05-11 | Desktop-only (mobile is non-goal) | Approved by user |
| 2026-05-11 | Text insights: deterministic + conditional logic | Approved by user |
| 2026-05-11 | Include Render deployment in plan | Approved by user |
| 2026-05-11 | Switched from CSS Modules to Tailwind CSS | Approved by user |
| 2026-05-11 | FHBSS test: netWithdrawal < afterTaxContributions is correct | Withdrawal tax (15%) applies to after-tax + earnings |
| 2026-05-11 | Offset = principal: loan pays off in ~159mo not 1mo | Full repayment still required, just zero interest |
| 2026-05-11 | Deployed to GitHub: https://github.com/LBya/LoanCalc | Render setup pending manual steps |

---

## Quick Reference: Key Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
npm test             # Run tests once
npm run test:watch   # Run tests in watch mode
```
