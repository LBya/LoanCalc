# LoanCalc - Detailed Design Document

> **Status:** Draft
> **Last Updated:** 2026-05-11
> **Project Type:** Solo hobby project / MVP

---

## 1. Architecture Overview

**Single-page application (SPA), client-side only, no backend.**

Why no backend? This is a calculator. All computation happens in the browser from user-supplied inputs. There is no data persistence, no authentication, no API. A static site on Render is the simplest deployment that meets the PRD requirements.

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│                                                  │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │  React UI    │───>│  Calculation Engine     │ │
│  │  Components  │<───│  (pure JS functions)    │ │
│  └──────────────┘    └────────────────────────┘ │
│         │                                          │
│         ▼                                          │
│  ┌──────────────┐    ┌────────────────────────┐ │
│  │  Recharts    │    │  Text Insights Engine   │ │
│  │  Charts      │    │  (template functions)   │ │
│  └──────────────┘    └────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Build tool | Vite | Fastest dev server, zero-config React support |
| UI framework | React 18+ | Largest ecosystem, best AI-assisted development |
| Charting | Recharts | React-native, simple declarative API, well-documented |
| Styling | Tailwind CSS | Utility-first, consistent design system, excellent AI-assisted dev support |
| Language | JavaScript (ES2022+) | Simpler than TypeScript for a hobby project; TS-compatible conventions for future migration |
| Testing | Vitest | Vite-native test runner, Jest-compatible API |
| Deployment | Render (static site) | Free tier, Git-based deploys, meets PRD requirement |

**Why not TypeScript yet?** This is a hobby project with a single developer. TypeScript adds config overhead, type definition hunting, and build complexity that doesn't pay for itself in a codebase this size. However, we follow TypeScript-compatible conventions (JSDoc types on all engine functions, named exports, clean module boundaries) so a future `jsconfig.json` → `tsconfig.json` migration is straightforward.

**Why Tailwind CSS?** Utility classes give us a consistent design system (spacing, colors, typography) without writing custom CSS for every component. Tailwind is the best-documented CSS framework for AI-assisted development. It adds ~10KB to the production bundle (tree-shaken), which is negligible. If the project grows, Tailwind scales well — no custom CSS sprawl.

### TypeScript Compatibility Conventions

We write JavaScript but follow patterns that make a future TypeScript migration painless:

1. **JSDoc on all engine functions** — `@param` and `@returns` with type annotations. VS Code uses these for IntelliSense, and `ts-check` can validate them.
2. **Named exports only** — No `export default`. Named exports make refactoring and type-checking easier.
3. **Explicit return objects** — Engine functions return plain objects with known shapes (documented in JSDoc). No dynamic keys, no mixed types.
4. **No implicit `any`** — Every parameter has a documented type in JSDoc. No "just pass an object" patterns.
5. **Engine/UI boundary** — The `engine/` folder has zero React imports. If we add TypeScript, we can type-check engine code independently before touching UI code.

**Migration path when ready:** Rename `.js` → `.ts` (engine first), add `tsconfig.json`, fix type errors. JSDoc annotations become the starting point for actual types. No rewrite needed.

---

## 2. Folder Structure

```
LoanCalc/
├── docs/                          # Design & planning documents
│   ├── design.md                  # This file
│   ├── original_prd.md            # Original requirements
│   ├── phase-1-foundation.md      # Phase 1 implementation plan
│   ├── phase-2-scenarios.md       # Phase 2 implementation plan
│   ├── phase-3-visualization.md   # Phase 3 implementation plan
│   ├── phase-4-deployment.md      # Phase 4 implementation plan
│   └── progress-tracker.md        # Progress tracking
├── public/                        # Static assets served as-is
│   └── index.html                 # HTML shell (Vite generates this)
├── src/
│   ├── index.css                  # Tailwind directives (@tailwind base/components/utilities)
│   ├── main.jsx                   # React entry point (imports index.css)
│   ├── App.jsx                    # Root component, layout shell (Tailwind classes)
│   │
│   ├── engine/                    # Pure calculation functions (NO React deps)
│   │   ├── amortization.js        # Core amortization schedule generator
│   │   ├── offset.js              # Offset account simulation
│   │   ├── extraRepayments.js     # Extra repayment modeling
│   │   ├── fhbss.js               # FHBSS calculation logic
│   │   ├── comparison.js          # Multi-scenario comparison aggregator
│   │   ├── insights.js            # Dynamic text insight generator
│   │   └── constants.js           # FHBSS thresholds, tax rates, ATO rules
│   │
│   ├── components/                # React UI components (Tailwind classes for styling)
│   │   ├── ScenarioConfig.jsx     # Single scenario input form
│   │   ├── ComparisonTable.jsx    # Side-by-side TLDR table
│   │   ├── BalanceChart.jsx       # Recharts line graph
│   │   └── TextInsights.jsx       # Dynamic text highlights
│   │
│   └── hooks/                     # Custom React hooks
│       └── useCalculator.js       # Orchestrates engine calls from UI state
│
├── tests/                         # Unit tests for engine functions
│   ├── amortization.test.js
│   ├── offset.test.js
│   ├── extraRepayments.test.js
│   ├── fhbss.test.js
│   ├── comparison.test.js
│   └── insights.test.js
│
├── package.json
├── vite.config.js
├── vitest.config.js               # Can be merged into vite.config.js
└── render.yaml                    # Render deployment config
```

### Why this structure?

- **`engine/` is separate from `components/`** — The calculation engine is pure JavaScript with zero React dependencies. This is deliberate: you can test it in isolation, reason about it without understanding React, and swap the UI layer without touching the math.
- **No `services/` or `utils/` folders** — Every function in this codebase has a clear home. "Utils" becomes a junk drawer. If a function doesn't fit, it's either in the wrong place or shouldn't exist.
- **Tests mirror `engine/` structure** — One test file per engine module. Tests for components are unnecessary for this project size (the engine is where correctness matters).

---

## 3. Data Flow

```
User inputs (per scenario)
        │
        ▼
┌──────────────────┐
│ useCalculator.js  │  ← Custom hook: receives scenario configs, calls engine
│   (React hook)    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐
│ amortization.js  │────>│ offset.js   │────>│ extraRepayments  │
│ (base schedule)  │     │ (adjusted)  │     │ (further adj.)   │
└──────────────────┘     └─────────────┘     └──────────────────┘
                                                      │
                                                      ▼
                                            ┌──────────────────┐
                                            │ comparison.js    │
                                            │ (aggregate all)  │
                                            └──────┬───────────┘
                                                   │
                                      ┌────────────┼────────────┐
                                      ▼            ▼            ▼
                               ComparisonTable  BalanceChart  TextInsights
```

### Key design decisions in data flow:

1. **Each engine function is a pure transformation** — input in, output out. No mutation, no side effects, no shared state.
2. **The pipeline is linear**: base amortization → offset adjustment → extra repayment adjustment → comparison aggregation. This matches how a loan actually works: start with the base, then layer modifications on top.
3. **`useCalculator` is the only hook needed** — It takes an array of scenario configs and returns the computed results. No context, no reducer, no state management library. For 4 scenarios with ~6 inputs each, prop drilling from one hook is trivially simple.

---

## 4. Calculation Engine Design

### 4.1 Core Amortization (`amortization.js`)

**Purpose:** Generate a month-by-month amortization schedule for a standard principal-and-interest loan.

**Inputs:**
```js
{
  principal: number,      // Loan amount in dollars (e.g., 500000)
  annualRate: number,     // Annual interest rate as decimal (e.g., 0.065 for 6.5%)
  termYears: number,      // Loan term in years (e.g., 30)
  repaymentFrequency: 'monthly'  // Always monthly for this MVP
}
```

**Outputs:**
```js
{
  monthlyRepayment: number,           // Fixed monthly payment
  totalInterest: number,              // Sum of all interest payments
  totalPaid: number,                  // Sum of all payments (principal + interest)
  schedule: [                         // Array of period entries
    {
      month: number,                  // 1-based month number
      payment: number,                // Payment for this period
      principal: number,              // Principal component
      interest: number,               // Interest component
      balance: number                 // Remaining balance after payment
    }
  ]
}
```

**Formula:**
```
Monthly repayment = P * [r(1+r)^n] / [(1+r)^n - 1]

Where:
  P = principal
  r = annualRate / 12  (monthly interest rate)
  n = termYears * 12   (total number of payments)
```

**Why this output shape?** The `schedule` array is the single source of truth that all other modules build on. The chart plots `schedule[].balance` over `schedule[].month`. The comparison table reads `totalInterest` and `totalPaid`. The insights engine diffs these values between scenarios.

### 4.2 Offset Account Simulation (`offset.js`)

**Purpose:** Recalculate the amortization schedule assuming an offset balance reduces the effective principal for interest calculation.

**How offset accounts work:** The offset balance doesn't reduce the principal itself — it reduces the interest charged each period. The borrower still pays the contractual monthly repayment, but more of it goes to principal because less goes to interest. This means the loan pays off faster.

**Inputs:**
```js
{
  baseSchedule: object,   // Output from amortization.js
  offsetBalance: number,  // Amount in offset account
  principal: number,      // Original loan principal (needed to calc effective rate)
  annualRate: number      // Annual interest rate
}
```

**Logic:**
For each month in the schedule:
1. `effectiveBalance = remainingBalance - offsetBalance` (but never below 0)
2. `interestForMonth = effectiveBalance * (annualRate / 12)`
3. `principalForMonth = contractualRepayment - interestForMonth`
4. `newBalance = remainingBalance - principalForMonth`
5. Continue until balance reaches 0 (loan may end before the original term)

**Why take `baseSchedule` as input?** Instead of recalculating everything from scratch, we transform the existing schedule. This keeps the pipeline composable and makes it easy to see "what changed" by comparing base vs. offset outputs.

### 4.3 Extra Repayment Modeling (`extraRepayments.js`)

**Purpose:** Model the effect of recurring extra payments and/or one-time lump sums on top of any schedule (base or offset-adjusted).

**Inputs:**
```js
{
  schedule: object,              // Output from amortization.js or offset.js
  extraMonthly: number,          // Additional amount paid each month (e.g., 500)
  lumpSums: [{ month: number, amount: number }],  // One-time payments at specific months
  annualRate: number
}
```

**Logic:**
For each month:
1. Start with the existing payment + `extraMonthly`
2. Check if this month has a lump sum entry, add it
3. Calculate interest on remaining balance normally
4. Apply excess to principal
5. Stop when balance reaches 0

**Output shape:** Same as amortization output (monthlyRepayment, totalInterest, totalPaid, schedule) but the schedule may be shorter than the original term.

**Why separate recurring and lump-sum?** They serve different modeling purposes. A user might want to see "what if I pay $500 extra every month" vs. "what if I put my $10,000 bonus in at month 24." Keeping them as separate inputs gives maximum flexibility without adding complexity.

### 4.4 FHBSS Integration (`fhbss.js`)

**Purpose:** Calculate the net withdrawal amount from the First Home Buyer Super Saver Scheme and its impact on the required loan size.

**How FHBSS works (simplified for worst-case):**
1. Individuals can voluntarily contribute up to $15,000 per financial year into superannuation (within existing caps).
2. Maximum total releasable amount is $50,000 across all years.
3. Upon withdrawal, the ATO assesses tax and applies a deemed earnings rate.
4. The net amount can be used as part of the home deposit.

**Worst-case tax assumption:** We use the highest marginal tax rate for the withdrawal assessment. This means:
- Contributions tax: 15% (standard super contribution tax)
- Withdrawal tax: As per ATO rules, the amounts are taxed at the individual's marginal rate minus a 30% tax offset. For worst-case, we assume the highest marginal rate (45%) minus 30% offset = 15% effective tax on withdrawals.

**Hard-coded constants (`constants.js`):**
```js
export const FHBSS = {
  maxContributionPerYear: 15000,        // FY 2024-25 — update annually
  maxTotalReleasable: 50000,            // Current cap — update if ATO changes
  contributionsTaxRate: 0.15,           // Standard super contributions tax
  withdrawalTaxRate: 0.15,              // Worst-case effective rate (see above)
  deemedEarningsRate: 0.03,             // ATO deemed earnings rate — update annually
};
```

**Why hard-code?** The PRD explicitly requires this. These values change once per year at most. A config file or environment variable adds complexity with no benefit for a single-user tool. The comment `// update annually` on each constant is sufficient.

**Inputs:**
```js
{
  yearlyContributions: [number],  // e.g., [15000, 15000, 10000] = 3 years of contributions
  fhbssConstants: object          // From constants.js (passed in for testability)
}
```

**Outputs:**
```js
{
  grossContribution: number,       // Total amount contributed
  deemedEarnings: number,          // Earnings calculated by ATO formula
  taxPayable: number,              // Tax on withdrawal
  netWithdrawal: number,           // Actual cash available for deposit
  effectiveDepositBoost: number    // netWithdrawal - what they'd have saved outside super
}
```

### 4.5 Comparison Aggregator (`comparison.js`)

**Purpose:** Take multiple scenario results and produce a unified comparison object.

**Inputs:**
```js
{
  scenarios: [
    {
      name: string,
      config: object,      // The user's input configuration
      result: object       // Output from the engine pipeline
    }
  ]
}
```

**Outputs:**
```js
{
  summary: [
    {
      name: string,
      monthlyRepayment: number,
      totalInterest: number,
      totalPaid: number,
      loanTermMonths: number,
      interestSavedVsBaseline: number,  // 0 for baseline scenario
      monthsSavedVsBaseline: number     // 0 for baseline scenario
    }
  ],
  trajectories: [
    {
      name: string,
      data: [{ month: number, balance: number }]  // For charting
    }
  ]
}
```

**Why separate `summary` and `trajectories`?** The summary feeds the comparison table (a few numbers). The trajectories feed the chart (hundreds of data points). Separating them means each consumer gets exactly what it needs.

### 4.6 Dynamic Text Insights (`insights.js`)

**Purpose:** Generate human-readable comparison highlights.

**Approach:** Deterministic template strings with conditional logic. No LLM, no AI — pure string interpolation based on computed values.

**Pattern:**
```js
export function generateInsights(comparisonSummary) {
  const baseline = comparisonSummary[0];  // First scenario is always baseline
  const insights = [];

  for (const scenario of comparisonSummary.slice(1)) {
    // Interest savings
    if (scenario.interestSavedVsBaseline > 0) {
      insights.push(
        `${scenario.name} saves $${formatMoney(scenario.interestSavedVsBaseline)} ` +
        `in total interest compared to ${baseline.name}.`
      );
    }

    // Time savings
    if (scenario.monthsSavedVsBaseline > 0) {
      const years = Math.floor(scenario.monthsSavedVsBaseline / 12);
      const months = scenario.monthsSavedVsBaseline % 12;
      const timeStr = years > 0
        ? `${years} year${years > 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`
        : `${months} month${months !== 1 ? 's' : ''}`;
      insights.push(`${scenario.name} pays off the loan ${timeStr} sooner.`);
    }

    // Best value highlight (conditional — only if one scenario clearly wins)
    // ... more conditional rules
  }

  return insights;
}
```

**Why not LLM?** The PRD asks about this. Deterministic output is:
- Testable (same input always produces same output)
- Fast (no API calls)
- Offline-capable
- Predictable (no hallucinated financial advice)

The "hybrid" approach means we use conditional logic to make sentences feel natural (e.g., "pays off 2 years and 3 months sooner" vs. "pays off 27 months sooner"), but every word is generated from a template.

---

## 5. Component Design

### 5.1 Component Hierarchy

```
App
├── ScenarioConfig (x1-4, one per scenario)
│   ├── Property price input
│   ├── Deposit input
│   ├── FHBSS contributions input
│   ├── Interest rate input
│   ├── Loan term input
│   ├── Offset balance input
│   ├── Extra monthly repayment input
│   └── Lump sum repayment input(s)
│
├── ComparisonTable
│   └── One column per scenario
│
├── BalanceChart
│   └── Recharts LineChart with one Line per scenario
│
└── TextInsights
    └── One paragraph per non-baseline scenario
```

### 5.2 Component Details

**`ScenarioConfig`** — Each scenario is a self-contained form. The first scenario is the "baseline" and is always present. Scenarios 2-4 can be added/removed. Each scenario has a name field (defaults to "Baseline", "Scenario A", "Scenario B", "Scenario C").

**Why repeat the form instead of sharing inputs?** Each scenario needs independent values. Sharing inputs would require "which fields differ from baseline" logic — more complex, not simpler. Four copies of the same form is straightforward.

**`ComparisonTable`** — A simple HTML table. Columns are scenarios. Rows are metrics (monthly repayment, total interest, total paid, loan term, savings vs baseline). This is the "TLDR" view.

**`BalanceChart`** — Recharts `<LineChart>` with `<Line>` components for each scenario. X-axis is months, Y-axis is remaining balance. Tooltip shows exact values on hover. Legend identifies each scenario by name and color.

**`TextInsights`** — Renders an array of strings as `<p>` elements. Simple. The intelligence is in `insights.js`, not in this component.

### 5.3 State Management

**`useCalculator` hook:**

```js
function useCalculator(scenarios) {
  // scenarios = [{ name, config: { principal, rate, term, offset, extraMonthly, lumpSums, fhbss } }]

  const results = useMemo(() => {
    return scenarios.map(scenario => {
      // 1. Calculate FHBSS net deposit boost (if applicable)
      const fhbssResult = scenario.config.fhbss
        ? calculateFHBSS(scenario.config.fhbss)
        : null;

      // 2. Adjust principal for deposit + FHBSS
      const adjustedPrincipal = scenario.config.propertyPrice
        - scenario.config.deposit
        - (fhbssResult?.netWithdrawal ?? 0);

      // 3. Generate base amortization
      let result = generateAmortization({
        principal: adjustedPrincipal,
        annualRate: scenario.config.rate,
        termYears: scenario.config.term
      });

      // 4. Apply offset
      if (scenario.config.offsetBalance > 0) {
        result = applyOffset(result, scenario.config.offsetBalance, adjustedPrincipal, scenario.config.rate);
      }

      // 5. Apply extra repayments
      if (scenario.config.extraMonthly > 0 || scenario.config.lumpSums?.length > 0) {
        result = applyExtraRepayments(result, {
          extraMonthly: scenario.config.extraMonthly,
          lumpSums: scenario.config.lumpSums,
          annualRate: scenario.config.rate
        });
      }

      return { ...scenario, result };
    });
  }, [scenarios]);

  return results;
}
```

**Why `useMemo`?** Calculation is deterministic and potentially expensive (360-month schedule x 4 scenarios). Memoizing on the scenario configs prevents unnecessary recalculations on every render.

**Why a custom hook instead of Context?** There's one consumer: `App.jsx`. Context adds indirection without benefit for a single-level tree. A hook is the simplest abstraction that works.

---

## 6. UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  LoanCalc - Home Loan Scenario Comparison                           │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  Scenario 1  │  ┌──────────────────────────────────────────────┐   │
│  (Baseline)  │  │           COMPARISON TABLE (TLDR)            │   │
│  ──────────  │  │  Metric     │ Base  │ Scn A │ Scn B │ Scn C │   │
│  [inputs]    │  │  Monthly $  │ xxxx  │ xxxx  │ xxxx  │ xxxx  │   │
│              │  │  Total Int  │ xxxx  │ xxxx  │ xxxx  │ xxxx  │   │
│──────────────│  │  Total Paid │ xxxx  │ xxxx  │ xxxx  │ xxxx  │   │
│              │  │  Term       │ xxxx  │ xxxx  │ xxxx  │ xxxx  │   │
│  Scenario 2  │  │  Saved      │   -   │ xxxx  │ xxxx  │ xxxx  │   │
│  ──────────  │  └──────────────────────────────────────────────┘   │
│  [inputs]    │                                                      │
│              │  ┌──────────────────────────────────────────────┐   │
│──────────────│  │                                              │   │
│              │  │           BALANCE TRAJECTORY CHART           │   │
│  Scenario 3  │  │                                              │   │
│  ──────────  │  │    \                                         │   │
│  [inputs]    │  │     \  \                                     │   │
│              │  │      \  \  \                                 │   │
│──────────────│  │       \  \  \  ───                           │   │
│              │  │        ───                               X  │   │
│  Scenario 4  │  │       Months ─────────────────────────────>  │   │
│  ──────────  │  │       Legend: ── Baseline ── Scn A ...       │   │
│  [inputs]    │  └──────────────────────────────────────────────┘   │
│              │                                                      │
│  [+ Add]     │  ┌──────────────────────────────────────────────┐   │
│  [Calculate] │  │           TEXT INSIGHTS                       │   │
│              │  │  • Scenario A saves $X in interest and pays   │   │
│              │  │    off Y months sooner than the baseline.     │   │
│              │  │  • Scenario B's offset account reduces the    │   │
│              │  │    effective loan term by Z years.            │   │
│              │  └──────────────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────┘
```

**Layout approach:** Tailwind CSS Grid utilities. Two columns: left sidebar (scenario configs, `w-96` / 384px) and main content area (`flex-1`). The main content area is a vertical stack (`flex flex-col gap-6`) of comparison table, chart, and text insights.

**Why not tabs or accordion?** The whole point is simultaneous comparison. Hiding scenarios behind tabs defeats the purpose. Everything visible at once is the simplest way to meet the PRD's comparison requirement.

---

## 7. Deployment

**Target:** Render static site (free tier).

**Configuration (`render.yaml`):**
```yaml
services:
  - type: web
    name: loancalc
    runtime: static
    buildCommand: npm run build
    staticPublishPath: dist
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=3600
```

**Why Render?** PRD specifies Render as preferred. Free tier is sufficient. Git-based deploys mean pushing to main triggers a rebuild.

---

## 8. Testing Strategy

**What to test:** Only the `engine/` functions. UI components are visual — if the engine is correct and the UI renders without errors, the output is correct.

**Test approach per module:**
- `amortization.test.js` — Verify monthly repayment, total interest, total paid, and schedule against known values from external calculators (e.g., a $500,000 loan at 6.5% over 30 years = $3,160.34/month). Test edge cases: zero interest rate, 1-year term.
- `offset.test.js` — Verify that an offset equal to the principal eliminates all interest. Verify partial offset reduces total interest and shortens the term.
- `extraRepayments.test.js` — Verify that extra payments shorten the term and reduce total interest. Verify lump sums at specific months.
- `fhbss.test.js` — Verify net withdrawal calculation with worst-case tax. Verify the contribution cap is respected.
- `comparison.test.js` — Verify that baseline scenarios show zero savings. Verify diff calculations are correct.
- `insights.test.js` — Verify output strings contain expected values given known inputs.

**Test runner:** Vitest (Vite-native, zero additional config).

---

## 9. Key Design Decisions Summary

| Decision | Choice | Why |
|----------|--------|-----|
| Backend | None (static SPA) | Calculator needs no server, no persistence |
| State management | Custom hook + useMemo | 4 scenarios, 6 inputs each — no library needed |
| CSS | Tailwind CSS | Consistent design system, AI-friendly, ~10KB gzipped |
| TypeScript | JS with TS-compatible conventions | Hobby project now; JSDoc types enable easy migration later |
| Testing | Engine only | UI is a thin layer over tested math functions |
| Chart library | Recharts | React-native, declarative, well-documented |
| FHBSS values | Hard-coded constants | Change once/year, config file is over-engineering |
| Text insights | Deterministic templates | Testable, fast, offline, no hallucination risk |
| Mobile | Desktop-only | Personal tool, comparison requires wide screen |
| Deployment | Render static | Free, Git-based, meets PRD requirement |

---

## 10. Out of Scope

These are explicitly NOT part of this MVP, per the agents_kaparthy.md principle of "no features beyond what was asked":

- User accounts or data persistence
- Backend server or database
- PWA / offline support
- Mobile-responsive layout
- Dark mode / theming
- Internationalization
- Accessibility beyond basic HTML semantics
- Export to PDF/CSV
- Multiple currencies
- Variable/fixed rate toggling (single rate assumption per scenario)
- API integrations (rate lookups, property data)
- TypeScript (planned for future migration — conventions in place now)
