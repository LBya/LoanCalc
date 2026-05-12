# LoanCalc Calculation Reference

This document explains how every metric in LoanCalc is calculated. Each section covers the formula, plain-English explanation, and edge cases.

---

## Core Amortization

### Monthly Repayment

The standard annuity formula calculates the fixed monthly payment required to fully repay a loan.

**Formula:**
```
M = P x [r(1+r)^n] / [(1+r)^n - 1]
```

Where:
- `M` = monthly repayment
- `P` = principal (loan amount after deposit and FHSS)
- `r` = monthly interest rate = annual rate / 12
- `n` = total number of payments = term years x 12

**Example:** $500,000 loan at 6.5% over 30 years:
- r = 0.065 / 12 = 0.005417
- n = 360
- M = $500,000 x [0.005417 x (1.005417)^360] / [(1.005417)^360 - 1] = **$3,160**

**Edge case:** At 0% interest rate, repayment = principal / n.

### Total Interest

The sum of all interest payments across the entire amortization schedule.

**Formula:**
```
Total Interest = Sum of (balance x monthly rate) for each month
```

**Example:** On a $500k loan at 6.5% over 30 years, total interest ≈ $637,722.

### Loan Term

The actual number of months until the loan balance reaches $0. For scenarios with offset or extra repayments, this will be shorter than the original contracted term.

**Formula:** Count of months in the schedule until balance = $0.

---

## Comparison Metrics

### Interest Saved vs Baseline

How much total interest is saved compared to the Baseline scenario.

**Formula:**
```
Interest Saved = Baseline Total Interest - This Scenario Total Interest
```

### Time Saved vs Baseline

How many months sooner the loan is paid off compared to Baseline.

**Formula:**
```
Time Saved = Baseline Loan Term (months) - This Scenario Loan Term (months)
```

### Principal Borrowed

The actual loan amount borrowed after deducting deposit and FHSS net withdrawal.

**Formula:**
```
Principal = Property Price - Cash Deposit - FHSS Net Withdrawal
```

### Cash Tied Up

Total cash you need to have available upfront.

**Formula:**
```
Cash Tied Up = Cash Deposit + Offset Balance
```

### Effective Rate

The average annual interest rate you effectively pay, accounting for the full loan life.

**Formula:**
```
Effective Rate = (Total Interest / Principal) / Term Years x 100
```

This differs from the nominal rate because it reflects the actual cost over time, not the headline rate.

### Interest-Free Months

Months where the offset balance fully covers the remaining principal, resulting in zero interest charged.

**Formula:** Count of months where `balance - offsetBalance <= 0`.

---

## Offset Decomposition

### The Offset Fallacy

When a scenario has both a smaller loan (higher repayments) AND an offset account, the total savings vs baseline come from two sources:

1. **Cash-flow discipline savings** — The benefit of paying more per month than the baseline
2. **Offset bonus** — The additional savings from the offset account itself

### Shadow Calculation

To separate these, we run a "shadow" amortization: same principal, same monthly repayment, but **zero offset**.

**Formula:**
```
Cash-flow Savings = Baseline Total Interest - Shadow Total Interest
Offset Bonus = Shadow Total Interest - Actual Scenario Total Interest
```

**Example:** Baseline interest = $637k, Scenario with offset interest = $386k, Shadow (no offset) interest = $457k
- Cash-flow savings = $637k - $457k = $180k (71%)
- Offset bonus = $457k - $386k = $71k (29%)
- The insight honestly reports: "71% comes from your higher repayments, 29% from the offset."

---

## FHSS (First Home Super Saver Scheme)

### Standard Mode

Uses the median Australian full-time salary ($95,000) for both contribution and withdrawal tax calculations. This gives a realistic estimate without requiring personal income data.

### Advanced Mode (Marginal Tax Bracket Method)

The ATO calculates FHSS tax using your actual marginal tax rate, not a flat percentage. The full calculation:

**Step 1: Entry Tax**
```
Entry Tax = Gross Contribution x 15%  (or 30% if income >= $250,000 — Division 293)
After-tax Contributions = Gross Contribution - Entry Tax
```

**Step 2: Deemed Earnings**
```
Deemed Earnings = After-tax Contributions x [(1 + deemed rate)^years - 1]
```
ATO deemed earnings rate: 3% (updated annually).

**Step 3: Assessable Amount**
```
Assessable Amount = After-tax Contributions + Deemed Earnings
```

**Step 4: Baseline Tax**
```
Baseline Tax = Standard ATO income tax on salary alone
```

**Step 5: Combined Tax**
```
Combined Tax = Standard ATO income tax on (salary + assessable amount)
```

**Step 6: FHSS Tax**
```
Gross FHSS Tax = max(0, Combined Tax - Baseline Tax)
Tax Offset = 30% x Assessable Amount
Final FHSS Tax = max(0, Gross FHSS Tax - Tax Offset)
```

**Net Withdrawal = Assessable Amount - Final FHSS Tax**

### ATO Tax Brackets (2024-25)

| Taxable Income | Rate |
|---------------|------|
| $0 – $18,200 | 0% |
| $18,201 – $45,000 | 16% |
| $45,001 – $120,000 | 30% |
| $120,001 – $180,000 | 37% |
| $180,001+ | 45% |

Note: Does not include Medicare levy (2%).

### FHSS Constants

| Parameter | Value |
|-----------|-------|
| Max contribution per year | $15,000 |
| Max total releasable | $50,000 |
| Deemed earnings rate | 3% |
| Division 293 threshold | $250,000 |

For the latest ATO FHSS rules, see: [ATO First Home Super Saver Scheme](https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme)

---

## Affordability Metrics

These metrics only appear when you provide pre-tax salary information in the scenario config.

### Debt-to-Income (DTI) Ratio

Measures how many times your annual income the loan principal represents.

**Formula:**
```
DTI = Principal Borrowed / Combined Annual Income
```

| Rating | DTI |
|--------|-----|
| Green (Low risk) | < 4x |
| Amber (Moderate) | 4x – 6x |
| Red (High risk) | > 6x |

### Repayment Stress

What percentage of your estimated take-home pay goes to loan repayments. Uses 75% of gross as a rough after-tax estimate.

**Formula:**
```
Repayment Stress = Monthly Repayment / (Monthly Gross Income x 0.75) x 100
```

| Rating | Stress |
|--------|--------|
| Green (Low) | < 35% |
| Amber (Stretched) | 35% – 50% |
| Red (Mortgage stress) | > 50% |

### Years of Salary for Interest

A visceral metric showing how many years of your combined salary equal the total interest paid.

**Formula:**
```
Years = Total Interest / Combined Annual Income
```

### Offset Efficiency

How much interest each dollar in your offset account saves over the loan life.

**Formula:**
```
Efficiency = Offset Bonus / Offset Balance
```

For example, if your $110k offset saves $71k in interest, efficiency = $0.65 per dollar.

### Risk Rating

An overall assessment combining DTI and repayment stress.

| Rating | Criteria |
|--------|----------|
| Green | DTI < 4x AND stress < 35% |
| Amber | DTI < 6x AND stress < 50% |
| Red | DTI >= 6x OR stress >= 50% |

---

## Offset Account

When an offset balance is held against the loan, interest is calculated on the effective balance each month.

**Formula:**
```
Effective Balance = max(0, Loan Balance - Offset Balance)
Interest = Effective Balance x Monthly Rate
```

The offset can also grow over time:
- **Monthly growth**: Fixed dollar amount added each month
- **Annual growth**: Percentage increase applied every 12 months

---

## Extra Repayments

Additional payments beyond the minimum repayment go directly to reducing principal.

**Formula:**
```
Total Monthly Payment = Minimum Repayment + Extra Monthly
Principal Reduction = Total Monthly Payment - Interest
```

This shortens the loan term without changing the contractual repayment amount.
