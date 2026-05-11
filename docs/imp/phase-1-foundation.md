# Phase 1: Project Scaffolding & Base Calculator

> **Prerequisite:** Read `docs/design.md` first. This document assumes you understand the architecture.
> **Verification Gate:** All tests must pass before proceeding to Phase 2.

---

## Folder Structure at End of Phase 1

```
LoanCalc/
├── docs/
│   ├── design.md
│   ├── original_prd.md
│   ├── phase-1-foundation.md      ← You are here
│   └── progress-tracker.md
├── public/
│   └── index.html
├── src/
│   ├── index.css                  # Tailwind directives
│   ├── main.jsx
│   ├── App.jsx                    # Uses Tailwind utility classes
│   ├── engine/
│   │   ├── amortization.js        ← Core math (this phase)
│   │   └── constants.js           ← Shared constants (this phase)
│   └── components/
│       └── (empty — built in Phase 2)
├── tests/
│   └── amortization.test.js       ← Verification tests (this phase)
├── package.json
├── vite.config.js
├── vitest.config.js
└── .gitignore
```

---

## Task 1.1: Scaffold the Vite + React Project

### What to do

Run the Vite scaffolding command to create a React project inside this folder.

### How

```bash
# From the LoanCalc root directory
npm create vite@latest . -- --template react
npm install
```

**Why this command:** `npm create vite@latest .` uses the current directory. The `--template react` flag gives you a minimal React setup without TypeScript. You're not using TypeScript (see design.md Section 9).

### After scaffolding

1. **Clean up boilerplate.** Delete everything Vite generates that you don't need:
   - Delete `src/assets/` folder (no assets needed yet)
   - Delete `src/App.css` (you'll use Tailwind instead)
   - Replace the contents of `src/App.jsx` with an empty shell component
   - Replace the contents of `src/main.jsx` to remove the strict CSS import

2. **Install Tailwind CSS.** This is your styling framework:
   ```bash
   npm install -D tailwindcss @tailwindcss/vite
   ```

3. **Configure Tailwind.** Add the Tailwind plugin to `vite.config.js`:
   ```js
   import { defineConfig } from 'vite';
   import react from '@vitejs/plugin-react';
   import tailwindcss from '@tailwindcss/vite';

   export default defineConfig({
     plugins: [react(), tailwindcss()],
   });
   ```

4. **Create `src/index.css`** with Tailwind directives:
   ```css
   @import "tailwindcss";
   ```
   This single line imports Tailwind's base, components, and utility layers. All styling is done via utility classes in JSX.

5. **Update `src/main.jsx`** to import `index.css`:
   ```jsx
   import { StrictMode } from 'react';
   import { createRoot } from 'react-dom/client';
   import './index.css';
   import App from './App';

   createRoot(document.getElementById('root')).render(
     <StrictMode>
       <App />
     </StrictMode>
   );
   ```

6. **Install Vitest.** This is your test runner:
   ```bash
   npm install -D vitest
   ```

7. **Create `vitest.config.js`:**
   ```js
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       globals: true,
     },
   });
   ```
   **Why separate config:** For now it's simple. If needed later, it can be merged into `vite.config.js`. Keeping them separate is clearer for a junior developer who might not know Vite well.

8. **Add test script to `package.json`:**
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview",
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```
   **Why both `test` and `test:watch`:** `vitest run` executes once (for CI/final verification). `vitest` runs in watch mode (for development feedback loop).

9. **Create folder structure:**
   ```bash
   mkdir src/engine
   mkdir src/components
   mkdir src/hooks
   mkdir tests
   ```

10. **Create `.gitignore`** (Vite may generate one, verify it includes `node_modules/` and `dist/`).

### Verification

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` runs (0 tests found, but no errors)
- [ ] Folder structure matches the diagram above
- [ ] Tailwind classes work (try adding `className="text-blue-500"` to an element and verify it renders blue)

---

## Task 1.2: Implement the Amortization Engine

### What to do

Create `src/engine/amortization.js` — a single function that generates a complete month-by-month amortization schedule.

### How

**Create `src/engine/constants.js` first.** This file will grow in later phases, but for now it only needs:

```js
// ATO and financial constants
// Update these values annually when ATO releases new financial year rules

export const FINANCIAL = {
  monthsPerYear: 12,
};
```

**Why a constants file at all?** The number 12 (months per year) appears in multiple calculations. Extracting it avoids magic numbers and makes the intent clear. This file will later hold FHBSS thresholds and tax rates.

**Then create `src/engine/amortization.js`.** This is the most important file in the project. Get it right here and everything else builds on solid ground.

### The function signature

```js
/**
 * Generate a month-by-month amortization schedule for a fixed-rate loan.
 *
 * @param {Object} params
 * @param {number} params.principal - Loan amount in dollars
 * @param {number} params.annualRate - Annual interest rate (e.g., 0.065 for 6.5%)
 * @param {number} params.termYears - Loan term in years
 * @returns {Object} Amortization result
 */
export function generateAmortization({ principal, annualRate, termYears }) {
  // Your implementation here
}
```

### The math (step by step)

1. **Calculate the monthly interest rate:**
   ```
   r = annualRate / 12
   ```

2. **Calculate the total number of payments:**
   ```
   n = termYears * 12
   ```

3. **Calculate the fixed monthly repayment using the standard annuity formula:**
   ```
   monthlyRepayment = principal * [r * (1 + r)^n] / [(1 + r)^n - 1]
   ```

   **Edge case:** If `annualRate` is 0, then `monthlyRepayment = principal / n` (simple division).

   **Why this formula:** This is the standard amortization formula used by every Australian bank. It calculates the fixed payment that exactly pays off principal + interest over the term.

4. **Generate the schedule array.** Loop from month 1 to n:
   ```
   For each month:
     interestPayment = remainingBalance * r
     principalPayment = monthlyRepayment - interestPayment
     remainingBalance = remainingBalance - principalPayment

     // Handle floating point: if remainingBalance < 0, set it to 0
     // Handle final month: if remainingBalance < monthlyRepayment,
     //   the actual payment is remainingBalance + interestPayment
   ```

5. **Accumulate totals:**
   ```
   totalInterest = sum of all interestPayment values
   totalPaid = sum of all actual payment values
   ```

### The return shape

```js
return {
  monthlyRepayment,    // The fixed payment amount (number)
  totalInterest,       // Sum of all interest (number)
  totalPaid,           // Sum of all payments (number)
  schedule: [          // Array of objects, one per month
    {
      month: 1,
      payment: 3160.34,
      principal: 454.51,
      interest: 2708.33,
      balance: 499545.49
    },
    // ... month 2 through n
  ]
};
```

### Why pure functions matter here

This function must have **zero side effects**. It takes inputs, returns outputs, touches nothing else. Why?
- It's testable in isolation
- It's predictable (same inputs always produce same outputs)
- Multiple scenarios can call it with different inputs without interference
- It doesn't depend on React, the DOM, or any external state

If you're tempted to `console.log` inside it, don't. If you're tempted to mutate the inputs, don't. If you're tempted to use a global variable, don't.

### Verification

- [ ] Function accepts `{ principal, annualRate, termYears }` and returns the expected shape
- [ ] Works with zero interest rate (edge case)
- [ ] Works with a 1-year term (short edge case)
- [ ] No rounding errors visible at 2 decimal places
- [ ] `schedule` array has exactly `termYears * 12` entries
- [ ] Final `balance` in schedule is 0 (or within $0.01 due to floating point)

---

## Task 1.3: Write Amortization Tests

### What to do

Create `tests/amortization.test.js` with tests that verify the engine against known values.

### How

**Why test against external calculators?** You're not testing whether the amortization formula is mathematically correct — you're testing whether YOUR IMPLEMENTATION produces the same results as trusted tools. This is the PRD's Success Criterion #1.

**Test case sources (use these to calculate expected values):**
- Any major bank's online calculator (Commonwealth Bank, ANZ, etc.)
- The Figura reference from the PRD: `https://figura.com.au/calculators/repayments`
- ASIC's Moneysmart calculator: `https://moneysmart.gov.au/home-loans/mortgage-calculator`

**Write these test cases:**

```js
import { describe, it, expect } from 'vitest';
import { generateAmortization } from '../src/engine/amortization';

describe('generateAmortization', () => {
  it('calculates correct monthly repayment for a standard 30-year loan', () => {
    // $500,000 at 6.5% over 30 years
    const result = generateAmortization({
      principal: 500000,
      annualRate: 0.065,
      termYears: 30,
    });

    // Expected: ~$3,160.34/month (verify with external calculator)
    expect(result.monthlyRepayment).toBeCloseTo(3160.34, 2);
    expect(result.totalPaid).toBeCloseTo(1137722.40, 0);
    expect(result.totalInterest).toBeCloseTo(637722.40, 0);
  });

  it('handles zero interest rate', () => {
    const result = generateAmortization({
      principal: 60000,
      annualRate: 0,
      termYears: 5,
    });

    expect(result.monthlyRepayment).toBe(1000); // 60000 / 60
    expect(result.totalInterest).toBe(0);
    expect(result.totalPaid).toBe(60000);
  });

  it('handles a 1-year term', () => {
    const result = generateAmortization({
      principal: 12000,
      annualRate: 0.05,
      termYears: 1,
    });

    expect(result.schedule).toHaveLength(12);
    expect(result.schedule[11].balance).toBeCloseTo(0, 1);
  });

  it('generates a schedule with correct length', () => {
    const result = generateAmortization({
      principal: 300000,
      annualRate: 0.06,
      termYears: 25,
    });

    expect(result.schedule).toHaveLength(300); // 25 * 12
  });

  it('schedule ends with zero balance', () => {
    const result = generateAmortization({
      principal: 250000,
      annualRate: 0.07,
      termYears: 20,
    });

    const lastEntry = result.schedule[result.schedule.length - 1];
    expect(lastEntry.balance).toBeCloseTo(0, 1);
  });

  it('sum of all payments equals totalPaid', () => {
    const result = generateAmortization({
      principal: 400000,
      annualRate: 0.055,
      termYears: 30,
    });

    const sumOfPayments = result.schedule.reduce((sum, entry) => sum + entry.payment, 0);
    expect(sumOfPayments).toBeCloseTo(result.totalPaid, 2);
  });

  it('sum of all interest equals totalInterest', () => {
    const result = generateAmortization({
      principal: 400000,
      annualRate: 0.055,
      termYears: 30,
    });

    const sumOfInterest = result.schedule.reduce((sum, entry) => sum + entry.interest, 0);
    expect(sumOfInterest).toBeCloseTo(result.totalInterest, 2);
  });
});
```

### Why these specific tests

- **The standard loan test** verifies the happy path against known values. This is the single most important test.
- **Zero interest** tests an edge case where the formula changes (division by zero prevention).
- **1-year term** tests the shortest reasonable input.
- **Schedule length** catches off-by-one errors.
- **Zero balance at end** catches accumulated rounding drift.
- **Payment/interest sums** catch if individual entries don't add up to totals.

### Verification

- [ ] `npm test` passes all tests
- [ ] Test values verified against at least one external calculator
- [ ] No `console.log` statements in test file

---

## Task 1.4: Create the App Shell and Basic UI

### What to do

Wire up a minimal React UI that lets a user input loan parameters for a single scenario and see the amortization result.

### How

**1. Create `src/App.jsx`:**

This is a temporary, single-scenario version. It will be restructured in Phase 2. For now, it needs:
- Input fields for: property price, deposit, interest rate, loan term
- A "Calculate" button
- A results display showing: monthly repayment, total interest, total paid

**Why start with a single scenario?** Building the UI for one scenario first lets you verify the engine works end-to-end before adding the complexity of multi-scenario comparison. This is incremental development — each phase adds one layer of capability.

**2. State management for this phase:**

Use React's `useState` directly in `App.jsx`. No custom hooks yet — that comes in Phase 2 when we have multiple scenarios.

```jsx
import { useState } from 'react';
import { generateAmortization } from './engine/amortization';

function App() {
  const [inputs, setInputs] = useState({
    propertyPrice: 600000,
    deposit: 100000,
    annualRate: 0.065,
    termYears: 30,
  });
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const principal = inputs.propertyPrice - inputs.deposit;
    const amort = generateAmortization({
      principal,
      annualRate: inputs.annualRate,
      termYears: inputs.termYears,
    });
    setResult(amort);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">LoanCalc</h1>
      {/* Input fields — use Tailwind utility classes for layout and spacing */}
      {/* Calculate button */}
      {/* Results display */}
    </div>
  );
}
```

**Why default values in state?** Default values let you click "Calculate" immediately and see a result. This makes development faster and gives you a quick sanity check that the whole pipeline works.

**3. No separate CSS file needed.** All styling uses Tailwind utility classes directly in JSX. The `src/index.css` file (with `@import "tailwindcss"`) is the only CSS file in the project. This eliminates the need for `App.module.css` or any component-level CSS files.

### Input field considerations

- **Interest rate:** Users think in percentages (6.5), not decimals (0.065). Display as percentage, convert to decimal internally.
- **Property price and deposit:** Use number inputs. Display as formatted dollars in the output only.
- **Loan term:** Dropdown or number input. Common terms are 15, 20, 25, 30 years.

### Formatting utility

Create a small helper in the component or a shared utility:

```js
function formatMoney(value) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(value);
}
```

**Why `Intl.NumberFormat`?** It's built into JavaScript. No library needed. It handles locale-specific formatting automatically.

### Verification

- [ ] App renders with default input values
- [ ] Clicking "Calculate" shows correct results
- [ ] Results match the values from the test cases (cross-check $500k at 6.5% for 30 years)
- [ ] Changing inputs and recalculating updates the results
- [ ] `npm run build` succeeds (no build errors)

---

## Phase 1 Completion Checklist

Before moving to Phase 2, verify ALL of the following:

- [ ] `npm run dev` starts the dev server without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes all amortization tests
- [ ] Test values match at least one external calculator (document which one in a comment)
- [ ] Single-scenario UI works: enter inputs, click calculate, see results
- [ ] No console errors in the browser
- [ ] Folder structure matches the diagram at the top of this document
- [ ] All files have clear, minimal purpose — no dead code or unused imports

**If any checklist item fails, fix it before proceeding.** Phase 2 builds directly on this foundation. Carrying bugs forward compounds the problem.
