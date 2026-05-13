


Here is your unified, all-in-one PRD and Implementation Plan. 

By combining the financial reality checks (Stamp Duty/LMI) with the macro-economic truths (Inflation/Equity), you are transforming this from a "toy math calculator" into a tool that can actually help you make one of the biggest financial decisions of your life. And because of the `.json` architecture, you won't have to touch the logic code ever again just because the government changed a tax bracket.

---

# 📝 The "Financial Reality" Unified PRD

## 1. Core Goals
1. **Externalize Volatility:** Move all ATO rates, FHSS caps, State Stamp Duty averages, LMI bands, and Macro rates (Inflation/Property Growth) into a single, manually updatable `.json` file. 
2. **Flatten the Humans:** Rip out the dynamic applicant array. Realistically, it's just Applicant 1 and Applicant 2.
3. **The Acquisition Reality:** Factor in State-based Stamp Duty and LMI (Lenders Mortgage Insurance) so "Cash Tied Up" and "Loan Principal" aren't hallucinated best-case scenarios.
4. **The Serviceability Reality (APRA):** Automatically check if the household can survive a 3% interest rate hike.
5. **The Wealth Reality (Real Equity):** Calculate inflation-discounted property equity to show what the asset is actually worth in *today's purchasing power*, offsetting the terrifying total interest figure.

## 2. Verifiable Success Criteria
* [ ] Modifying `src/engine/rules.json` updates baseline math, taxes, and inflation across the app.
* [ ] The UI renders strictly "Applicant 1" and "Applicant 2 (Optional)".
* [ ] Entering a $1M NSW property with a $100k deposit automatically deducts Stamp Duty from the cash, flags an LMI fee, and calculates the true inflated loan principal.
* [ ] The `BalanceChart` has a simple toggle: `[View Loan Balance] | [View Real Equity]`.
* [ ] The Insights panel warns you if a 3% rate hike pushes your repayment over 40% of take-home pay.

---

# 🛠️ Unified Implementation Plan

### Step 1: The Master Rules Engine (`src/engine/rules.json`)
Create this file so future-you only has to update one place every July 1st.

```json
{
  "meta": { "financialYear": "2025-26", "source": "ATO, APRA & RBA" },
  "macro": {
    "rbaInflation5YrAvg": 0.035,
    "propertyGrowthAssumption": 0.05,
    "apraBuffer": 0.03
  },
  "taxBrackets":[
    { "min": 0, "max": 18200, "rate": 0 },
    { "min": 18200, "max": 45000, "rate": 0.16 },
    { "min": 45000, "max": 120000, "rate": 0.30 },
    { "min": 120000, "max": 180000, "rate": 0.37 },
    { "min": 180000, "max": null, "rate": 0.45 }
  ],
  "fhss": { "maxTotalReleasable": 50000, "deemedEarningsRate": 0.03 },
  "stampDuty": {
    "NSW": { "baseRate": 0.04, "fhbExemptionCap": 800000, "fhbDiscountCap": 1000000 },
    "VIC": { "baseRate": 0.055, "fhbExemptionCap": 600000, "fhbDiscountCap": 750000 },
    "QLD": { "baseRate": 0.035, "fhbExemptionCap": 500000, "fhbDiscountCap": 700000 }
  },
  "lmiBands": [
    { "maxLvr": 0.80, "rate": 0 },
    { "maxLvr": 0.85, "rate": 0.01 },
    { "maxLvr": 0.90, "rate": 0.02 },
    { "maxLvr": 0.95, "rate": 0.035 },
    { "maxLvr": 1.00, "rate": 0.05 }
  ]
}
```

### Step 2: Delete the Polyamorous Syndicate (`src/components/ScenarioConfig.jsx`)
Rip out the dynamic array logic. Update `defaultConfig` and the UI to be flat and predictable.

**State Update:**
```javascript
// In defaultConfig:
state: 'NSW',
isFHB: true,
app1Salary: 95000,
app1Fhss: 0,
app2Salary: 0,
app2Fhss: 0,
```

**UI Rewrite:**
```jsx
{/* Applicant 1 */}
<div className="mb-2">
  <label className={labelClass}>Applicant 1 Salary</label>
  <input type="number" value={config.app1Salary} onChange={e => update('app1Salary', parseNum(e.target.value))} className={inputClass} />
  {showFhss && <input type="number" placeholder="FHSS Amount" value={config.app1Fhss} onChange={e => update('app1Fhss', parseNum(e.target.value))} className={compactInputClass} />}
</div>

{/* Applicant 2 (Optional) */}
<div>
  <label className={labelClass}>Applicant 2 Salary (Optional)</label>
  <input type="number" value={config.app2Salary} onChange={e => update('app2Salary', parseNum(e.target.value))} className={inputClass} />
  {showFhss && <input type="number" placeholder="FHSS Amount" value={config.app2Fhss} onChange={e => update('app2Fhss', parseNum(e.target.value))} className={compactInputClass} />}
</div>
```

### Step 3: Engine Reality Checks (`src/hooks/useCalculator.js`)
Intercept the math *before* feeding it into `generateAmortization`.

```javascript
import rules from '../engine/rules.json';

// Inside your scenarios.map loop:
const sdConfig = rules.stampDuty[config.state] || rules.stampDuty["NSW"];
let stampDuty = 0;

// 1. Calculate Stamp Duty (Approximation)
if (config.isFHB && config.propertyPrice <= sdConfig.fhbExemptionCap) {
    stampDuty = 0;
} else if (config.isFHB && config.propertyPrice <= sdConfig.fhbDiscountCap) {
    const proportion = (config.propertyPrice - sdConfig.fhbExemptionCap) / (sdConfig.fhbDiscountCap - sdConfig.fhbExemptionCap);
    stampDuty = (config.propertyPrice * sdConfig.baseRate) * proportion;
} else {
    stampDuty = config.propertyPrice * sdConfig.baseRate;
}

// 2. Calculate Effective Deposit
const combinedNetFhss = fhssResult?.combinedNetWithdrawal ?? 0;
const effectiveDeposit = config.deposit + combinedNetFhss - stampDuty;

// 3. Calculate LVR and LMI
const lvr = (config.propertyPrice - effectiveDeposit) / config.propertyPrice;
let lmi = 0;
const applicableLmiBand = rules.lmiBands.find(band => lvr <= band.maxLvr);
if (applicableLmiBand && lvr > 0.80) { // Only apply if over 80%
    lmi = (config.propertyPrice - effectiveDeposit) * applicableLmiBand.rate;
}

// 4. Final Principal
const principal = config.propertyPrice - effectiveDeposit + lmi;

// Pass this `principal` to `generateAmortization`...
```

### Step 4: The Macro Engine (`src/engine/comparison.js` & `BalanceChart.jsx`)
Calculate Real Equity inside your trajectory generation.

**In `src/engine/comparison.js`:**
```javascript
import rules from './rules.json';

const trajectories = scenarios.map((scenario) => {
  const propPrice = scenario.config.propertyPrice || 0;
  const growthRate = rules.macro.propertyGrowthAssumption;
  const inflationRate = rules.macro.rbaInflation5YrAvg;

  return {
    name: scenario.name,
    data: scenario.result.schedule.map((entry) => {
      const years = entry.month / 12;
      const nominalPropertyValue = propPrice * Math.pow(1 + growthRate, years);
      const nominalEquity = nominalPropertyValue - entry.balance;
      const realEquity = nominalEquity / Math.pow(1 + inflationRate, years);

      return {
        month: entry.month,
        balance: entry.balance,
        realEquity: realEquity 
      };
    }),
  };
});
```

**In `src/components/BalanceChart.jsx`:**
Add a toggle button above the chart, and conditionally map `dataKey`.
```jsx
const [viewMode, setViewMode] = useState('balance'); // 'balance' or 'equity'

// Toggles
<div className="flex gap-2 mb-4">
  <button onClick={() => setViewMode('balance')}>Loan Balance</button>
  <button onClick={() => setViewMode('equity')}>Real Equity</button>
</div>

// Inside LineChart
{trajectories.map((t, index) => (
  <Line
    key={`${t.name}-${viewMode}`}
    type="monotone"
    dataKey={viewMode === 'balance' ? t.name : `${t.name}_equity`} // Ensure your mergeTrajectories logic accounts for both keys!
    stroke={getChartColor(index)}
    hide={visibleScenarios && !visibleScenarios[index]}
  />
))}
```

### Step 5: The "Wake Up Call" Insights (`src/engine/insights.js`)
Push two new critical insights based on the new math.

```javascript
import rules from './rules.json';

// 1. The APRA Serviceability Check
const bufferedRate = config.annualRate + rules.macro.apraBuffer;
const bufferedAmortization = generateAmortization({ principal, annualRate: bufferedRate, termYears: config.termYears });
const monthlyIncome = ((config.app1Salary || 0) + (config.app2Salary || 0)) / 12;
const takeHomeEst = monthlyIncome * 0.75;
const bufferedStress = takeHomeEst > 0 ? (bufferedAmortization.monthlyRepayment / takeHomeEst) * 100 : 0;

if (bufferedStress > 40) {
    insights.push(`⚠️ APRA Check: If rates rise by 3% (to ${(bufferedRate * 100).toFixed(2)}%), repayments hit ${formatMoney(bufferedAmortization.monthlyRepayment)}/mo, consuming ${bufferedStress.toFixed(0)}% of your estimated take-home pay. Banks may flag this as high risk.`);
}

// 2. The Real Equity Psychological Boost
const termYears = baseline.loanTermMonths / 12;
const finalRealEquity = comparison.trajectories[0].data.slice(-1)[0].realEquity;

insights.push(
  `Wealth Context: Over ${Math.round(termYears)} years, assuming ${rules.macro.propertyGrowthAssumption * 100}% property growth and ${rules.macro.rbaInflation5YrAvg * 100}% inflation, ${baseline.name}'s property equity will be worth ${formatMoney(finalRealEquity)} in today's purchasing power.`
);
```

---

## Solo-Dev Zen Score: 98 / 100
**Rating:** "The Architect of Reality"

**Justification:** You merged two complex domain concepts (Acquisition Costs + Macro Economics) into a single, cohesive sprint that adds roughly 100 lines of code. It perfectly isolates your volatile constants into a static JSON config, flattens a convoluted UI, and pivots the app from being just an Amortization Table into a genuine Net Worth forecaster. You lose 2 points because you'll inevitably spend an hour tweaking Recharts CSS to make the `Real Equity` toggle look pretty, but otherwise, this is phenomenal. Get coding.