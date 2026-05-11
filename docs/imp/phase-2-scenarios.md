# Phase 2: Multi-Scenario Configuration & Comparison

> **Prerequisite:** Phase 1 complete. All amortization tests passing. Single-scenario UI working.
> **Verification Gate:** All engine tests pass. Comparison table renders with 2-4 scenarios showing correct values.

---

## Folder Structure at End of Phase 2

```
LoanCalc/
├── docs/
│   ├── design.md
│   ├── original_prd.md
│   ├── phase-1-foundation.md
│   ├── phase-2-scenarios.md      ← You are here
│   └── progress-tracker.md
├── public/
│   └── index.html
├── src/
│   ├── index.css                  # Tailwind directives
│   ├── main.jsx
│   ├── App.jsx                    ← Updated: multi-scenario layout (Tailwind classes)
│   ├── engine/
│   │   ├── amortization.js        ← Unchanged from Phase 1
│   │   ├── constants.js           ← Updated: FHBSS constants added
│   │   ├── offset.js              ← NEW: offset account simulation
│   │   ├── extraRepayments.js     ← NEW: extra repayment modeling
│   │   ├── fhbss.js               ← NEW: FHBSS calculation
│   │   └── comparison.js          ← NEW: multi-scenario aggregator
│   ├── components/
│   │   ├── ScenarioConfig.jsx     ← NEW: per-scenario input form (Tailwind classes)
│   │   └── ComparisonTable.jsx    ← NEW: side-by-side TLDR table (Tailwind classes)
│   └── hooks/
│       └── useCalculator.js       ← NEW: orchestrates engine pipeline
├── tests/
│   ├── amortization.test.js       ← Unchanged from Phase 1
│   ├── offset.test.js             ← NEW
│   ├── extraRepayments.test.js    ← NEW
│   ├── fhbss.test.js              ← NEW
│   └── comparison.test.js         ← NEW
├── package.json
├── vite.config.js
├── vitest.config.js
└── .gitignore
```

---

## Task 2.1: Implement Offset Account Simulation

### What to do

Create `src/engine/offset.js` — a function that recalculates an amortization schedule with an offset account reducing the effective interest-bearing balance.

### How offset accounts work (and why this matters)

An offset account is a savings account linked to your mortgage. The balance in this account is "offset" against your loan principal when calculating interest. **You still owe the full principal**, but you pay less interest each month because the interest is calculated on `(principal - offsetBalance)` instead of just `principal`.

**Example:** $500,000 loan with $50,000 in offset. Interest is calculated on $450,000, not $500,000. You still make the contractual monthly repayment, but more of it goes to principal (because less goes to interest). This means the loan pays off sooner.

### The function

```js
/**
 * Recalculate amortization schedule with an offset balance.
 *
 * @param {Object} params
 * @param {number} params.principal - Original loan principal
 * @param {number} params.annualRate - Annual interest rate
 * @param {number} params.termYears - Original loan term in years
 * @param {number} params.offsetBalance - Amount held in offset account
 * @param {number} params.monthlyRepayment - The contractual monthly repayment
 *                                           (from base amortization)
 * @returns {Object} Same shape as generateAmortization output
 */
export function applyOffset({ principal, annualRate, termYears, offsetBalance, monthlyRepayment }) {
  // Implementation
}
```

### Step-by-step logic

1. **Validate input:** If `offsetBalance <= 0`, return a standard amortization (no effect). If `offsetBalance >= principal`, the loan is effectively interest-free — handle this edge case.

2. **Monthly loop:** Instead of a fixed number of iterations (like base amortization), loop until balance reaches 0. The offset may cause early payoff.
   ```
   remainingBalance = principal
   r = annualRate / 12
   month = 0

   while (remainingBalance > 0):
     month += 1
     effectiveBalance = max(0, remainingBalance - offsetBalance)
     interestPayment = effectiveBalance * r
     principalPayment = monthlyRepayment - interestPayment

     // If principalPayment > remainingBalance, this is the last month
     if principalPayment >= remainingBalance:
       principalPayment = remainingBalance
       actualPayment = principalPayment + interestPayment
       remainingBalance = 0
     else:
       actualPayment = monthlyRepayment
       remainingBalance -= principalPayment
   ```

3. **Build the output** in the same shape as `generateAmortization`:
   - `monthlyRepayment` — the original contractual payment (unchanged)
   - `totalPaid` — sum of all `actualPayment` values
   - `totalInterest` — sum of all `interestPayment` values
   - `schedule` — array of `{ month, payment, principal, interest, balance }` objects

### Why take `monthlyRepayment` as a parameter instead of recalculating it?

The contractual repayment stays the same regardless of the offset. The offset only changes how that payment is split between principal and interest. Taking it as input avoids duplicating the annuity formula and makes it clear that this function transforms an existing schedule.

### Why not modify the schedule array in place?

Pure functions. You take the base schedule parameters and return a new result. The caller can compare base vs. offset to see the difference. Mutating shared data is a source of subtle bugs.

### Verification (tests)

Create `tests/offset.test.js`:

- **Offset equal to principal:** Interest should be 0, loan pays off immediately (or nearly — depending on when offset is applied, there may be 1 month of near-zero interest).
- **Small offset ($10k on $500k):** Total interest should be measurably less than base. Verify the difference is sensible (roughly: $10k * 6.5% / 12 * number_of_months_saved in interest reduction).
- **No offset (0):** Result should match base amortization exactly.
- **Term reduction:** Verify the schedule is shorter than the original term.
- **Schedule sums:** Sum of payments = totalPaid, sum of interest = totalInterest.

---

## Task 2.2: Implement Extra Repayment Modeling

### What to do

Create `src/engine/extraRepayments.js` — a function that models recurring extra payments and lump-sum payments on top of any amortization schedule.

### How extra repayments work

Extra repayments go directly to reducing the principal. The borrower pays their normal monthly amount PLUS an additional amount. This reduces the principal faster, which means less interest in subsequent months, which means the loan ends sooner.

Lump sums are one-time extra payments at a specific month (e.g., a tax refund or bonus).

### The function

```js
/**
 * Recalculate amortization with extra recurring and lump-sum repayments.
 *
 * @param {Object} params
 * @param {number} params.principal - Original loan principal
 * @param {number} params.annualRate - Annual interest rate
 * @param {number} params.termYears - Original loan term in years
 * @param {number} params.monthlyRepayment - Contractual monthly repayment
 * @param {number} params.extraMonthly - Additional amount paid each month (default 0)
 * @param {Array<{month: number, amount: number}>} params.lumpSums - One-time payments
 * @returns {Object} Same shape as generateAmortization output
 */
export function applyExtraRepayments({ principal, annualRate, termYears, monthlyRepayment, extraMonthly = 0, lumpSums = [] }) {
  // Implementation
}
```

### Step-by-step logic

1. **Normalize lump sums:** Convert the array into a lookup for fast access:
   ```js
   const lumpSumMap = {};
   for (const { month, amount } of lumpSums) {
     lumpSumMap[month] = (lumpSumMap[month] || 0) + amount;
   }
   ```

   **Why a map instead of searching the array each iteration?** Performance and clarity. For a 360-month schedule, searching an array 360 times is wasteful. A map lookup is O(1).

2. **Monthly loop** (same while-loop pattern as offset):
   ```
   remainingBalance = principal
   r = annualRate / 12
   month = 0

   while (remainingBalance > 0):
     month += 1
     interestPayment = remainingBalance * r

     totalPayment = monthlyRepayment + extraMonthly + (lumpSumMap[month] || 0)
     principalPayment = totalPayment - interestPayment

     if principalPayment >= remainingBalance:
       // Final month — only pay what's owed
       actualPayment = remainingBalance + interestPayment
       remainingBalance = 0
     else:
       actualPayment = totalPayment
       remainingBalance -= principalPayment
   ```

3. **Build output** in standard shape.

### Why combine recurring and lump-sum in one function?

They both do the same thing: add extra money to principal in a given month. Splitting them into separate functions would mean running the amortization loop twice and merging results — more complex, not simpler. Combining them in one loop is straightforward because they're additive.

### Verification (tests)

Create `tests/extraRepayments.test.js`:

- **No extra payments:** Result matches base amortization.
- **Extra $500/month on $500k at 6.5% for 30 years:** Verify term shortens (should be roughly 22-23 years — verify with external calculator). Verify total interest savings.
- **Single lump sum of $50,000 at month 12:** Verify term shortens and total interest decreases.
- **Combined extra monthly + lump sum:** Both effects compound correctly.
- **Extreme extra payment:** If extra payment would pay off loan in month 1, verify it stops at month 1.
- **Lump sum at month beyond original term:** Should be ignored (loan already paid off).

---

## Task 2.3: Implement FHBSS Calculation

### What to do

Create `src/engine/constants.js` (updated) and `src/engine/fhbss.js`.

### How FHBSS works (for this tool)

The First Home Buyer Super Saver Scheme lets you contribute extra money into your superannuation, then withdraw it (with tax concessions) to buy your first home.

The simplified worst-case model:
1. You contribute up to $15,000/year into super (within existing contribution caps)
2. The ATO applies a deemed earnings rate to estimate growth
3. Upon withdrawal, tax is applied at an effective rate (worst case)
4. The net amount is available for your deposit

### Update `constants.js`

```js
export const FINANCIAL = {
  monthsPerYear: 12,
};

// FHBSS constants — update annually when ATO releases new financial year rules
// Source: https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme
export const FHBSS = {
  maxContributionPerYear: 15000,     // FY 2024-25 cap
  maxTotalReleasable: 50000,         // Maximum total release amount
  contributionsTaxRate: 0.15,        // 15% tax on concessional contributions
  withdrawalTaxRate: 0.15,           // Worst-case effective rate (see design.md)
  deemedEarningsRate: 0.03,          // ATO deemed earnings rate — update annually
};
```

**Why all these comments?** Per the PRD: "System logic must facilitate manual code updates corresponding to yearly ATO policy changes." Comments with the source URL and "update annually" markers make this self-documenting. A junior developer (or future-you) can find the source and know what to change.

### The function

```js
import { FHBSS } from './constants';

/**
 * Calculate the net FHBSS withdrawal amount.
 *
 * @param {Object} params
 * @param {Array<number>} params.yearlyContributions - Amounts contributed per year
 *                                                     e.g., [15000, 15000, 10000]
 * @returns {Object} FHBSS result
 */
export function calculateFHBSS({ yearlyContributions }) {
  // Implementation
}
```

### Step-by-step logic

1. **Validate contributions:** Cap each year at `FHBSS.maxContributionPerYear`. Sum must not exceed `FHBSS.maxTotalReleasable`. If it does, cap at the max.

   **Why cap instead of error?** This is a calculator, not a compliance tool. If someone enters too much, show them the maximum benefit, not an error message. They'll see the cap in the output.

2. **Calculate gross contribution:**
   ```js
   grossContribution = sum of yearlyContributions
   ```

3. **Apply contributions tax:**
   ```js
   afterTaxContributions = sum of (contribution * (1 - FHBSS.contributionsTaxRate)) for each year
   ```

4. **Calculate deemed earnings:** For each year of contribution, the amount earns deemed interest until withdrawal:
   ```js
   deemedEarnings = 0
   for (let i = 0; i < yearlyContributions.length; i++) {
     yearsToWithdraw = yearlyContributions.length - i  // Later contributions earn less
     afterTax = yearlyContributions[i] * (1 - FHBSS.contributionsTaxRate)
     deemedEarnings += afterTax * (Math.pow(1 + FHBSS.deemedEarningsRate, yearsToWithdraw) - 1)
   }
   ```

   **Why compound growth?** The ATO calculates deemed earnings based on how long the money has been in super. Earlier contributions earn more.

5. **Calculate tax on withdrawal:**
   ```js
   grossWithdrawal = afterTaxContributions + deemedEarnings
   taxPayable = grossWithdrawal * FHBSS.withdrawalTaxRate
   netWithdrawal = grossWithdrawal - taxPayable
   ```

6. **Return the full breakdown:**
   ```js
   return {
     grossContribution,
     afterTaxContributions,
     deemedEarnings,
     taxPayable,
     netWithdrawal,       // This is what can go toward the deposit
     contributionsCount: yearlyContributions.length,
   };
   ```

### Verification (tests)

Create `tests/fhbss.test.js`:

- **No contributions:** Returns all zeros.
- **Single year at max ($15,000):** Verify net withdrawal after contributions tax, deemed earnings, and withdrawal tax.
- **Three years at max ($45,000 total):** Verify compounding works (earlier years earn more).
- **Exceeds max total:** Verify total is capped at $50,000.
- **Exceeds per-year cap:** Verify individual years are capped at $15,000.
- **Known value:** Manually calculate a simple case and verify the output matches.

---

## Task 2.4: Implement Comparison Aggregator

### What to do

Create `src/engine/comparison.js` — a function that takes multiple scenario results and produces unified summary + trajectory data.

### Why a separate aggregator?

Each engine function (amortization, offset, extra repayments) operates on a single scenario. The comparison function is the layer that says "given these 2-4 computed scenarios, what are the key differences?" It bridges the gap between raw math and UI display.

### The function

```js
/**
 * Aggregate multiple scenario results into comparison data.
 *
 * @param {Array<Object>} scenarios - Array of { name, result } objects
 *                                    where result is from the engine pipeline
 * @returns {Object} { summary: [...], trajectories: [...] }
 */
export function buildComparison(scenarios) {
  // Implementation
}
```

### Step-by-step logic

1. **Extract summary metrics** for each scenario:
   ```js
   const baseline = scenarios[0];  // First scenario is always the baseline

   const summary = scenarios.map((scenario, index) => ({
     name: scenario.name,
     monthlyRepayment: scenario.result.monthlyRepayment,
     totalInterest: scenario.result.totalInterest,
     totalPaid: scenario.result.totalPaid,
     loanTermMonths: scenario.result.schedule.length,
     interestSavedVsBaseline: baseline.result.totalInterest - scenario.result.totalInterest,
     monthsSavedVsBaseline: baseline.result.schedule.length - scenario.result.schedule.length,
   }));
   ```

2. **Extract trajectory data** for the chart:
   ```js
   const maxMonths = Math.max(...scenarios.map(s => s.result.schedule.length));

   const trajectories = scenarios.map(scenario => ({
     name: scenario.name,
     data: scenario.result.schedule.map(entry => ({
       month: entry.month,
       balance: entry.balance,
     })),
   }));
   ```

   **Why `maxMonths`?** Scenarios may have different lengths (one is 30 years, another pays off in 22). Recharts handles different-length arrays, but knowing the maximum helps with axis scaling.

3. **Return both:**
   ```js
   return { summary, trajectories };
   ```

### Why is the baseline always `scenarios[0]`?

Convention. The UI will enforce that the first scenario is the baseline. This eliminates ambiguity about what "saved" means — it's always relative to scenario 0. No configuration, no toggle, no "set as baseline" button. Simple.

### Verification (tests)

Create `tests/comparison.test.js`:

- **Two identical scenarios:** Savings are 0 for both.
- **Different scenarios:** Verify interestSaved and monthsSaved calculations.
- **Three scenarios:** Verify all three are in the output.
- **Scenario that pays off sooner:** Verify positive monthsSavedVsBaseline.
- **Trajectory data shape:** Verify it's an array of `{ month, balance }` objects.

---

## Task 2.5: Create the useCalculator Hook

### What to do

Create `src/hooks/useCalculator.js` — the single custom hook that orchestrates the engine pipeline for all scenarios.

### Why a hook?

The UI needs computed results that depend on scenario inputs. A hook encapsulates the "given these inputs, compute these outputs" logic so `App.jsx` stays clean. The hook is the single bridge between UI state and engine functions.

### The implementation

```js
import { useMemo } from 'react';
import { generateAmortization } from '../engine/amortization';
import { applyOffset } from '../engine/offset';
import { applyExtraRepayments } from '../engine/extraRepayments';
import { calculateFHBSS } from '../engine/fhbss';
import { buildComparison } from '../engine/comparison';

export function useCalculator(scenarios) {
  return useMemo(() => {
    // 1. Compute each scenario's result through the engine pipeline
    const computedScenarios = scenarios.map(scenario => {
      const config = scenario.config;

      // Calculate FHBSS boost (if applicable)
      const fhbssResult = config.fhbssContributions?.length > 0
        ? calculateFHBSS({ yearlyContributions: config.fhbssContributions })
        : null;

      // Effective principal = property price - deposit - FHBSS net withdrawal
      const principal = config.propertyPrice
        - config.deposit
        - (fhbssResult?.netWithdrawal ?? 0);

      // Base amortization
      const base = generateAmortization({
        principal,
        annualRate: config.annualRate,
        termYears: config.termYears,
      });

      // Apply offset
      let result = base;
      if (config.offsetBalance > 0) {
        result = applyOffset({
          principal,
          annualRate: config.annualRate,
          termYears: config.termYears,
          offsetBalance: config.offsetBalance,
          monthlyRepayment: base.monthlyRepayment,
        });
      }

      // Apply extra repayments
      if (config.extraMonthly > 0 || config.lumpSums?.length > 0) {
        result = applyExtraRepayments({
          principal: config.offsetBalance > 0
            ? principal  // Use original principal for the base
            : principal,
          annualRate: config.annualRate,
          termYears: config.termYears,
          monthlyRepayment: base.monthlyRepayment,
          extraMonthly: config.extraMonthly || 0,
          lumpSums: config.lumpSums || [],
        });
      }

      return {
        name: scenario.name,
        config,
        fhbssResult,
        result,
      };
    });

    // 2. Build comparison data
    const comparison = buildComparison(computedScenarios);

    return { computedScenarios, comparison };
  }, [scenarios]);
}
```

### Why `useMemo`?

Recalculating 4 scenarios of 360-month schedules on every render is wasteful. `useMemo` only recomputes when `scenarios` changes. The dependency is the scenario configurations, which only change when the user edits inputs.

### Why process offset and extra repayments separately?

They represent two different financial strategies. Offset reduces interest on the existing balance. Extra repayments actively pay down principal. In reality, both can be active simultaneously, but for the MVP, they're applied sequentially in the pipeline. If both are active, offset is applied first (reducing the interest base), then extra repayments accelerate further.

### Verification

- [ ] Hook returns correct results for a single baseline scenario
- [ ] Hook correctly applies offset when offsetBalance > 0
- [ ] Hook correctly applies extra repayments when configured
- [ ] Hook correctly applies FHBSS net withdrawal to reduce principal
- [ ] Comparison summary has correct savings calculations

---

## Task 2.6: Build the ScenarioConfig Component

### What to do

Create `src/components/ScenarioConfig.jsx` and its CSS module. This is a self-contained form for a single scenario's inputs.

### Input fields per scenario

| Field | Type | Default (Baseline) | Notes |
|-------|------|-------------------|-------|
| Scenario name | text | "Baseline" / "Scenario A" etc. | Editable |
| Property price | number | 600000 | In dollars |
| Deposit | number | 100000 | In dollars |
| Interest rate | number | 6.5 | Displayed as %, stored as decimal internally |
| Loan term | number (or dropdown) | 30 | In years |
| Offset balance | number | 0 | In dollars |
| Extra monthly repayment | number | 0 | In dollars |
| Lump sum repayments | dynamic list | [] | Each has month + amount |
| FHBSS yearly contributions | dynamic list | [] | Array of yearly amounts |

### Implementation approach

```jsx
function ScenarioConfig({ scenario, onChange, onRemove, isBaseline }) {
  const updateField = (field, value) => {
    onChange({ ...scenario, config: { ...scenario.config, [field]: value } });
  };

  return (
    <div className={styles.config}>
      <h3>
        <input
          value={scenario.name}
          onChange={(e) => onChange({ ...scenario, name: e.target.value })}
        />
        {!isBaseline && <button onClick={onRemove}>Remove</button>}
      </h3>

      {/* Property price */}
      <label>
        Property Price ($)
        <input
          type="number"
          value={scenario.config.propertyPrice}
          onChange={(e) => updateField('propertyPrice', Number(e.target.value))}
        />
      </label>

      {/* ... other fields follow the same pattern ... */}
    </div>
  );
}
```

### Design decisions

**Why controlled components?** The parent (`App.jsx`) owns all scenario state. Each `ScenarioConfig` receives its scenario data and an `onChange` callback. This is the simplest React pattern for forms and makes it trivial to add/remove scenarios.

**Why not a form library?** This is a calculator with ~8 input fields per scenario. A form library (Formik, React Hook Form) adds a dependency and abstraction layer for something that vanilla React handles fine at this scale.

**Styling with Tailwind:** Use Tailwind utility classes directly in the JSX. Common patterns:
- `className="border border-gray-300 rounded px-3 py-2 w-full"` for inputs
- `className="text-sm font-medium text-gray-700 mb-1"` for labels
- `className="border rounded-lg p-4 mb-4"` for the scenario card container
- No CSS files needed — all styling is inline via Tailwind classes.

**Interest rate display vs. storage:** Users type `6.5`, the engine needs `0.065`. The conversion happens in the `onChange` handler: `updateField('annualRate', Number(e.target.value) / 100)`. Display the value multiplied by 100. This is a UX detail that prevents confusion.

**Lump sum and FHBSS as dynamic lists:** These are arrays of objects. Start with "Add lump sum" / "Add FHBSS year" buttons that append entries. Each entry has its own remove button. Keep the UI minimal — a row of two inputs (month + amount, or year + amount).

### Verification

- [ ] Component renders all input fields with correct defaults
- [ ] Editing a field calls `onChange` with updated scenario
- [ ] Remove button calls `onRemove` (hidden for baseline)
- [ ] Interest rate displays as percentage but is stored as decimal

---

## Task 2.7: Build the ComparisonTable Component

### What to do

Create `src/components/ComparisonTable.jsx` — the side-by-side "TLDR" comparison view.

### Layout

```
┌──────────────────┬────────────┬────────────┬────────────┬────────────┐
│ Metric           │ Baseline   │ Scenario A │ Scenario B │ Scenario C │
├──────────────────┼────────────┼────────────┼────────────┼────────────┤
│ Monthly Payment  │ $3,160.34  │ $3,160.34  │ $3,660.34  │ $3,160.34  │
│ Total Interest   │ $637,722   │ $485,200   │ $412,340   │ $380,100   │
│ Total Paid       │ $1,137,722 │ $985,200   │ $912,340   │ $880,100   │
│ Loan Term        │ 30 years   │ 24 years   │ 22 years   │ 20 years   │
│ Interest Saved   │ —          │ $152,522   │ $225,382   │ $257,622   │
│ Time Saved       │ —          │ 6 years    │ 8 years    │ 10 years   │
└──────────────────┴────────────┴────────────┴────────────┴────────────┘
```

### Implementation

This is a straightforward HTML table styled with Tailwind utility classes. The `summary` array from `comparison.js` maps directly to table rows.

```jsx
function ComparisonTable({ summary }) {
  const metrics = [
    { label: 'Monthly Payment', key: 'monthlyRepayment', format: formatMoney },
    { label: 'Total Interest', key: 'totalInterest', format: formatMoney },
    { label: 'Total Paid', key: 'totalPaid', format: formatMoney },
    { label: 'Loan Term', key: 'loanTermMonths', format: formatTerm },
    { label: 'Interest Saved', key: 'interestSavedVsBaseline', format: formatSavings },
    { label: 'Time Saved', key: 'monthsSavedVsBaseline', format: formatMonthsSaved },
  ];

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b-2 border-gray-300">
          <th className="text-left py-2 px-3">Metric</th>
          {summary.map(s => (
            <th key={s.name} className="text-right py-2 px-3">{s.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {metrics.map(({ label, key, format }, index) => (
          <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
            <td className="py-2 px-3 font-medium">{label}</td>
            {summary.map(s => (
              <td key={s.name} className="text-right py-2 px-3">{format(s[key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Formatting functions

```js
function formatMoney(value) {
  if (value === 0 || value === null) return '—';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value);
}

function formatTerm(months) {
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (remainMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${remainMonths}m`;
}

function formatSavings(value) {
  if (value <= 0) return '—';
  return formatMoney(value);
}

function formatMonthsSaved(months) {
  if (months <= 0) return '—';
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (years > 0 && remainMonths > 0) return `${years}y ${remainMonths}m`;
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}
```

**Why "—" for baseline savings?** The baseline can't save compared to itself. A dash is cleaner than "$0" or "0 months."

### Verification

- [ ] Table renders with 1-4 scenario columns
- [ ] All metric rows display correctly formatted values
- [ ] Baseline column shows "—" for savings rows
- [ ] Values match manual calculation spot-checks

---

## Task 2.8: Restructure App.jsx for Multi-Scenario Layout

### What to do

Update `App.jsx` from the single-scenario Phase 1 version to a multi-scenario layout.

### State shape

```js
const [scenarios, setScenarios] = useState([
  {
    name: 'Baseline',
    config: {
      propertyPrice: 600000,
      deposit: 100000,
      annualRate: 0.065,
      termYears: 30,
      offsetBalance: 0,
      extraMonthly: 0,
      lumpSums: [],
      fhbssContributions: [],
    },
  },
]);
```

### Layout structure (using the design from design.md)

```jsx
function App() {
  const [scenarios, setScenarios] = useState(defaultScenarios);
  const { comparison } = useCalculator(scenarios);

  const addScenario = () => {
    if (scenarios.length >= 4) return; // Max 4 scenarios
    const names = ['Baseline', 'Scenario A', 'Scenario B', 'Scenario C'];
    setScenarios(prev => [...prev, {
      name: names[prev.length],
      config: { ...defaultConfig },
    }]);
  };

  const removeScenario = (index) => {
    setScenarios(prev => prev.filter((_, i) => i !== index));
  };

  const updateScenario = (index, updated) => {
    setScenarios(prev => prev.map((s, i) => i === index ? updated : s));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">LoanCalc - Home Loan Scenario Comparison</h1>

      <div className="grid grid-cols-[384px_1fr] gap-6">
        <aside className="space-y-4 max-h-screen overflow-y-auto">
          {scenarios.map((scenario, index) => (
            <ScenarioConfig
              key={index}
              scenario={scenario}
              isBaseline={index === 0}
              onChange={(updated) => updateScenario(index, updated)}
              onRemove={() => removeScenario(index)}
            />
          ))}
          {scenarios.length < 4 && (
            <button
              onClick={addScenario}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500"
            >
              + Add Scenario
            </button>
          )}
        </aside>

        <main className="flex flex-col gap-6">
          <ComparisonTable summary={comparison.summary} />
          {/* Chart and insights will be added in Phase 3 */}
        </main>
      </div>
    </div>
  );
}
```

### Why auto-calculate (no Calculate button)?

In Phase 1, we had a button. Now with `useMemo` in the hook, results update automatically when inputs change. This is better UX — no extra click to see results. If performance becomes an issue (unlikely at this scale), we can add debouncing later.

### Tailwind layout notes

The two-column grid uses `grid-cols-[384px_1fr]` for a fixed sidebar width and flexible main content. The sidebar uses `space-y-4` for consistent gap between scenario cards and `max-h-screen overflow-y-auto` for scrolling when scenarios overflow. All layout is handled by Tailwind utility classes — no separate CSS files.

### Verification

- [ ] App renders with baseline scenario visible
- [ ] Adding scenarios (up to 4) works
- [ ] Removing scenarios works (baseline cannot be removed)
- [ ] Editing inputs in any scenario updates the comparison table
- [ ] Comparison table shows all active scenarios
- [ ] Layout matches the ASCII diagram in design.md

---

## Phase 2 Completion Checklist

- [ ] All new engine tests pass: `npm test`
- [ ] Offset simulation produces lower interest and shorter term than base
- [ ] Extra repayment simulation produces lower interest and shorter term than base
- [ ] FHBSS calculation produces reasonable net withdrawal values
- [ ] Comparison aggregator correctly computes savings vs baseline
- [ ] ScenarioConfig component works for all input types including lump sums and FHBSS
- [ ] ComparisonTable renders with correct values for 1-4 scenarios
- [ ] App layout is a functional two-column design
- [ ] `npm run build` succeeds
- [ ] No console errors in browser
- [ ] All Phase 1 tests still pass (no regressions)
