# Phase 3: Charts, Insights & Polish

> **Prerequisite:** Phase 2 complete. Multi-scenario comparison table working. All engine tests passing.
> **Verification Gate:** Chart renders all scenarios. Text insights show accurate comparisons. App feels complete and functional.

---

## Folder Structure at End of Phase 3

```
LoanCalc/
├── docs/
│   ├── design.md
│   ├── original_prd.md
│   ├── phase-1-foundation.md
│   ├── phase-2-scenarios.md
│   ├── phase-3-visualization.md   ← You are here
│   └── progress-tracker.md
├── public/
│   └── index.html
├── src/
│   ├── index.css                  # Tailwind directives
│   ├── main.jsx
│   ├── App.jsx                    ← Updated: adds chart and insights sections
│   ├── engine/
│   │   ├── amortization.js
│   │   ├── constants.js
│   │   ├── offset.js
│   │   ├── extraRepayments.js
│   │   ├── fhbss.js
│   │   ├── comparison.js
│   │   └── insights.js            ← NEW: dynamic text insight generator
│   ├── components/
│   │   ├── ScenarioConfig.jsx     # Tailwind utility classes
│   │   ├── ComparisonTable.jsx    # Tailwind utility classes
│   │   ├── BalanceChart.jsx       ← NEW: Recharts line graph (Tailwind wrapper)
│   │   └── TextInsights.jsx       ← NEW: dynamic text highlights (Tailwind classes)
│   └── hooks/
│       └── useCalculator.js       ← Updated: returns insights data
├── tests/
│   ├── amortization.test.js
│   ├── offset.test.js
│   ├── extraRepayments.test.js
│   ├── fhbss.test.js
│   ├── comparison.test.js
│   └── insights.test.js           ← NEW
├── package.json
├── vite.config.js
├── vitest.config.js
└── .gitignore
```

---

## Task 3.1: Install Recharts

### What to do

Add Recharts as a project dependency.

### How

```bash
npm install recharts
```

**Why Recharts specifically?** It's a React-native charting library — components are JSX, data is passed as props, and it handles responsive sizing. The API is declarative: you describe what the chart should look like, not how to draw it. This makes it the best fit for AI-assisted development because the documentation maps directly to JSX code.

### Verification

- [ ] `npm install` completes without errors
- [ ] `import { LineChart, Line } from 'recharts'` does not throw in a component

---

## Task 3.2: Implement the Insights Engine

### What to do

Create `src/engine/insights.js` — a pure function that generates text insights from comparison data.

### Why the insights engine comes before the chart

The insights engine is pure logic (no UI). It's easier to test and verify independently. Once it works, the `TextInsights` component is just a thin wrapper that renders strings. Building the simpler, more testable piece first is the right order.

### The function

```js
/**
 * Generate dynamic text insights comparing scenarios.
 *
 * @param {Array<Object>} summary - From comparison.js buildComparison().summary
 * @returns {Array<string>} Array of insight strings
 */
export function generateInsights(summary) {
  // Implementation
}
```

### Insight generation rules

The function should produce an array of strings. Each string is a complete sentence. The rules below define what insights to generate and how to phrase them.

**Rule 1: Biggest interest saver**
Find the scenario (non-baseline) with the highest `interestSavedVsBaseline`. Generate:
```
"[Scenario Name] offers the most interest savings at $[X], [Y]% less than [Baseline Name]'s total interest."
```
The percentage is `interestSavedVsBaseline / baseline.totalInterest * 100`.

**Why this insight?** Users want to quickly know "which scenario saves the most money?" This is usually the primary decision factor.

**Rule 2: Fastest payoff**
Find the scenario with the highest `monthsSavedVsBaseline`. Generate:
```
"[Scenario Name] pays off the loan fastest, [X years and Y months] sooner than [Baseline Name]."
```
Format years/months naturally: "2 years and 3 months", "11 months", "1 year".

**Rule 3: Per-scenario summary**
For each non-baseline scenario, generate one sentence about what makes it different:
```
"[Scenario Name]: [higher/lower] monthly payments of $[X], saving $[Y] in interest and [Z months/years] in time."
```

**Rule 4: Offset-specific insight** (conditional)
If a scenario has an offset balance configured:
```
"[Scenario Name]'s offset of $[X] reduces the effective loan balance, cutting $[Y] in interest."
```
Check this by looking at the scenario config's `offsetBalance` field.

**Rule 5: Extra repayment-specific insight** (conditional)
If a scenario has extra monthly repayments:
```
"Adding $[X]/month in extra repayments under [Scenario Name] cuts the loan term by [Y months/years]."
```

**Rule 6: FHBSS-specific insight** (conditional)
If a scenario has FHBSS contributions:
```
"FHBSS contributions in [Scenario Name] boost the deposit by $[X] (after tax), reducing the loan principal."
```

### Why conditional rules?

Not all insights apply to all scenarios. A scenario without an offset shouldn't mention offset. A scenario without FHBSS shouldn't mention FHBSS. The conditional rules keep insights relevant and concise.

### Implementation pattern

```js
export function generateInsights(summary, scenarios) {
  const baseline = summary[0];
  const insights = [];

  // Rule 1: Biggest interest saver
  const bestSaver = summary.slice(1).reduce((best, s) =>
    s.interestSavedVsBaseline > best.interestSavedVsBaseline ? s : best
  , summary[1]);

  if (bestSaver && bestSaver.interestSavedVsBaseline > 0) {
    const pct = ((bestSaver.interestSavedVsBaseline / baseline.totalInterest) * 100).toFixed(1);
    insights.push(
      `${bestSaver.name} offers the most interest savings at ${formatMoney(bestSaver.interestSavedVsBaseline)}, ` +
      `${pct}% less than ${baseline.name}'s total interest.`
    );
  }

  // Rule 2: Fastest payoff
  // ...similar pattern

  // Rules 3-6: Per-scenario insights
  for (let i = 1; i < summary.length; i++) {
    const s = summary[i];
    const config = scenarios[i]?.config;

    // Only add if there's something meaningful to say
    if (s.interestSavedVsBaseline > 0 || s.monthsSavedVsBaseline > 0) {
      // Generate per-scenario sentence
    }

    // Conditional rules for offset, extra, FHBSS
    if (config?.offsetBalance > 0) { /* ... */ }
    if (config?.extraMonthly > 0) { /* ... */ }
    if (config?.fhbssContributions?.length > 0) { /* ... */ }
  }

  return insights;
}
```

**Why `formatMoney` and `formatTerm` helper functions inside this module?** The insights engine needs to format numbers into human-readable strings. Using the same formatting logic as the comparison table ensures consistency. Extract a shared `formatters.js` if needed, or duplicate the two small functions — at this scale, either is fine.

### Verification (tests)

Create `tests/insights.test.js`:

- **Two identical scenarios:** Insights array is empty (nothing to compare).
- **Scenario with interest savings:** Generated string contains the correct dollar amount.
- **Scenario with time savings:** Generated string contains correct years/months.
- **Multiple scenarios:** "Biggest saver" insight names the correct scenario.
- **Offset scenario:** Contains offset-specific insight string.
- **Extra repayment scenario:** Contains extra repayment insight string.
- **FHBSS scenario:** Contains FHBSS insight string.
- **Snapshot test:** Take a snapshot of insights output for a fixed input to catch unintended changes.

---

## Task 3.3: Build the BalanceChart Component

### What to do

Create `src/components/BalanceChart.jsx` — an interactive line chart showing loan balance over time for all active scenarios.

### Why a chart matters

Numbers in a table tell you *what* the difference is. A chart shows you *how* the difference evolves over time. Two scenarios might have similar total interest but very different trajectories — the chart reveals this at a glance.

### The component

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
```

**Why `ResponsiveContainer`?** It makes the chart fill its parent container's width. The chart automatically resizes if the window changes. No manual width calculations.

### Data preparation challenge

Each scenario has a different schedule length (e.g., baseline is 360 months, scenario B is 264 months). Recharts expects a single data array for the chart. You need to merge the trajectories into a unified format.

**Solution:** Create a merged data array where each entry has `month`, `baseline`, `scenarioA`, etc. Scenarios that have ended show `0` (or `null` to break the line) for months beyond their term.

```js
function mergeTrajectories(trajectories) {
  const maxMonths = Math.max(...trajectories.map(t => t.data.length));

  const merged = [];
  for (let month = 0; month < maxMonths; month++) {
    const entry = { month: month + 1 };
    for (const trajectory of trajectories) {
      const point = trajectory.data[month];
      entry[trajectory.name] = point ? point.balance : null;
    }
    merged.push(entry);
  }
  return merged;
}
```

**Why `null` instead of `0` for months beyond a scenario's term?** Recharts renders `null` as a gap in the line. Showing `0` would draw a horizontal line at zero for months the loan is already paid off. A gap is more honest — the loan is done, there's no balance to plot.

### Component implementation

```jsx
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04']; // Blue, Red, Green, Yellow

function BalanceChart({ trajectories }) {
  const data = mergeTrajectories(trajectories);

  const formatYAxis = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">Balance Trajectory</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value) => value !== null ? `$${value.toLocaleString()}` : 'Paid off'}
            labelFormatter={(month) => `Month ${month}`}
          />
          <Legend />
          {trajectories.map((t, index) => (
            <Line
              key={t.name}
              type="monotone"
              dataKey={t.name}
              stroke={COLORS[index]}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### Why these specific Recharts props?

- **`type="monotone"`** — Smooth curve interpolation. Financial trajectories are always decreasing, so monotone is appropriate.
- **`dot={false}`** — With 360 data points, showing dots would be a mess. The line itself tells the story.
- **`connectNulls={false}`** — Don't draw lines through `null` values. This ensures paid-off scenarios show a clean endpoint.
- **`strokeWidth={2}`** — Visible enough to distinguish, thin enough not to obscure overlaps.
- **`CartesianGrid`** — Subtle reference lines help users read approximate values.

### Color choices

The four colors (blue, red, green, yellow) are distinguishable for color-blind users (the most common form affects red-green, but blue+yellow+green+red provides enough contrast). If this were a production app, we'd use a color-blind-safe palette. For a hobby project, this is sufficient.

### Verification

- [ ] Chart renders with one scenario (single line)
- [ ] Chart renders with four scenarios (four colored lines)
- [ ] Lines end at different months (shorter terms end sooner)
- [ ] Tooltip shows correct values on hover
- [ ] Legend identifies each scenario by name and color
- [ ] Y-axis shows readable dollar values ($Xk format)
- [ ] Chart fills available width

---

## Task 3.4: Build the TextInsights Component

### What to do

Create `src/components/TextInsights.jsx` — a component that renders the dynamically generated insight strings.

### Why this is the simplest component

The `insights.js` engine does all the work. This component just renders strings. It's intentionally thin — logic belongs in the engine (testable, pure), not in the component.

### Implementation

```jsx
function TextInsights({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Insights</h2>
        <p className="text-gray-400">Configure scenarios to see comparison insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-3">Key Insights</h2>
      <ul className="list-none p-0">
        {insights.map((insight, index) => (
          <li key={index} className="py-2 px-3 border-l-4 border-blue-600 mb-2 bg-gray-50">
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Styling with Tailwind

Use Tailwind utility classes directly in the JSX:
- `insightList`: `className="list-none p-0"` (replaces `list-style: none; padding: 0;`)
- `insightItem`: `className="py-2 px-3 border-l-4 border-blue-600 mb-2 bg-gray-50"` (left border accent with subtle background)
- `empty`: `className="text-gray-400"` (subtle gray text for the no-data state)

No CSS file needed — all styling is inline via Tailwind classes.

### Verification

- [ ] Renders insight strings as list items
- [ ] Shows empty state when no insights
- [ ] Each insight is readable and correctly formatted

---

## Task 3.5: Update useCalculator Hook to Include Insights

### What to do

Update `src/hooks/useCalculator.js` to also return generated insights.

### How

Add the insights generation inside the `useMemo`:

```js
import { generateInsights } from '../engine/insights';

export function useCalculator(scenarios) {
  return useMemo(() => {
    // ... existing pipeline code ...

    const comparison = buildComparison(computedScenarios);

    // Generate insights from comparison summary + scenario configs
    const insights = generateInsights(
      comparison.summary,
      computedScenarios.map(cs => ({ name: cs.name, config: cs.config }))
    );

    return { computedScenarios, comparison, insights };
  }, [scenarios]);
}
```

**Why pass scenario configs to `generateInsights`?** The conditional insight rules (offset, extra repayments, FHBSS) need to know what inputs the user configured. The comparison summary alone doesn't include this information.

### Verification

- [ ] Hook returns `insights` array
- [ ] Insights update when scenario inputs change
- [ ] No insights when only baseline is configured with no modifications

---

## Task 3.6: Update App.jsx to Wire Everything Together

### What to do

Add the `BalanceChart` and `TextInsights` components to the main content area in `App.jsx`.

### Updated layout

```jsx
function App() {
  // ... existing state and handlers ...

  const { comparison, insights } = useCalculator(scenarios);

  return (
    <div className={styles.app}>
      <h1>LoanCalc - Home Loan Scenario Comparison</h1>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
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
            <button onClick={addScenario}>+ Add Scenario</button>
          )}
        </aside>

        <main className={styles.main}>
          <ComparisonTable summary={comparison.summary} />
          <BalanceChart trajectories={comparison.trajectories} />
          <TextInsights insights={insights} />
        </main>
      </div>
    </div>
  );
}
```

### Visual polish at this stage

The layout is functional but may need spacing and typography refinements:

1. **Heading hierarchy:** `<h1>` for app title, `<h2>` for section headings (Comparison, Chart, Insights), `<h3>` for scenario names.
2. **Spacing:** Consistent 24px gap between main content sections. 16px gap between sidebar scenarios.
3. **Scenario cards:** Each `ScenarioConfig` should have a subtle border and padding to visually separate them.
4. **Comparison table:** Alternating row backgrounds for readability.
5. **Empty states:** What shows when only baseline exists with default values? The chart and insights should handle this gracefully.

### Why not a full design system?

This is a single-page calculator. A design system (Storybook, design tokens, theme provider) would be massive over-engineering for ~6 components. Tailwind utility classes provide consistent spacing, colors, and typography without any additional infrastructure.

### Verification

- [ ] All three sections render in the main content area: table, chart, insights
- [ ] Editing any scenario input updates all three sections
- [ ] Adding/removing scenarios updates all sections
- [ ] Layout is clean and readable on a 1440px+ wide screen
- [ ] No visual overflow or layout breaks
- [ ] `npm run build` succeeds
- [ ] No console errors

---

## Task 3.7: Final Testing Pass

### What to do

Run all tests and verify the complete application end-to-end.

### End-to-end verification scenarios

Walk through these manual test scenarios:

1. **Baseline only:** Enter a $600,000 property, $100,000 deposit, 6.5% rate, 30-year term. Verify the monthly repayment matches an external calculator. The chart should show a single declining curve.

2. **Offset comparison:** Add Scenario A with $50,000 offset. Verify:
   - Comparison table shows lower total interest
   - Chart shows a steeper decline (pays off sooner)
   - Insights mention the offset savings

3. **Extra repayments:** Add Scenario B with $500/month extra. Verify:
   - Total interest is lower than baseline
   - Loan term is shorter
   - Insights mention the extra repayment impact

4. **FHBSS:** Add FHBSS contributions of $15,000/year for 3 years to any scenario. Verify:
   - Principal is reduced by the net FHBSS withdrawal amount
   - Comparison reflects the lower loan amount
   - Insights mention the FHBSS deposit boost

5. **Combined strategies:** Configure one scenario with offset AND extra repayments AND FHBSS. Verify the pipeline applies all three correctly.

6. **Edge cases:**
   - Zero deposit (100% loan): Should still calculate correctly
   - Very high interest rate (15%): Verify no overflow or NaN
   - All scenarios identical: Insights should be empty or minimal

### Test suite

```bash
npm test
```

All tests from Phase 1 and Phase 2 must still pass. The new `insights.test.js` adds to the suite.

### Verification

- [ ] All 6 manual test scenarios produce correct results
- [ ] `npm test` passes all tests (amortization, offset, extraRepayments, fhbss, comparison, insights)
- [ ] No console errors in browser
- [ ] `npm run build` succeeds
- [ ] `npm run preview` serves a working production build

---

## Phase 3 Completion Checklist

- [ ] Recharts installed and working
- [ ] Balance chart renders with 1-4 scenario lines
- [ ] Chart tooltip and legend work correctly
- [ ] Insights engine generates accurate text comparisons
- [ ] Text insights render in the UI
- [ ] Conditional insights (offset, extra, FHBSS) appear when relevant
- [ ] Full layout: sidebar + table + chart + insights working together
- [ ] All engine tests pass
- [ ] Manual end-to-end verification complete
- [ ] `npm run build` produces a working production build
- [ ] No regressions from Phase 1 or Phase 2
