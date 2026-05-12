/**
 * Run a shadow amortization to isolate the true offset benefit for a single scenario.
 *
 * For any scenario with an offset, we want to answer: "How much does the offset
 * actually save on THIS specific loan?" The answer is the difference between
 * the actual result (with offset) and a plain amortization with the same
 * principal, rate, and term but NO offset.
 *
 * This is a per-scenario calculation — it does NOT compare against the named
 * "Baseline" scenario. Cross-scenario comparisons are handled by the insights engine.
 *
 * @param {Object} params
 * @param {number} params.principal - Loan principal for this scenario
 * @param {number} params.annualRate - Annual interest rate as decimal
 * @param {number} params.termYears - Original loan term in years
 * @param {number} params.scenarioTotalInterest - Scenario's actual total interest (with offset)
 * @param {number} params.scenarioLoanTermMonths - Scenario's actual loan term (with offset)
 * @returns {{ plainTotalInterest: number, plainLoanTermMonths: number, offsetInterestSaved: number, offsetMonthsSaved: number }}
 */
export function calculateOffsetBenefit({
  principal,
  annualRate,
  termYears,
  scenarioTotalInterest,
  scenarioLoanTermMonths,
}) {
  // Plain amortization: same principal, rate, term — no offset
  const r = annualRate / 12;
  const n = termYears * 12;

  let plainTotalInterest = 0;
  let plainLoanTermMonths = n;

  if (annualRate === 0) {
    plainTotalInterest = 0;
  } else {
    const monthlyRepayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    let balance = principal;

    for (let month = 1; month <= n; month++) {
      const interestPayment = balance * r;
      let principalPayment = monthlyRepayment - interestPayment;

      if (principalPayment >= balance) {
        plainTotalInterest += balance * r;
        plainLoanTermMonths = month;
        break;
      }

      balance -= principalPayment;
      plainTotalInterest += interestPayment;
    }
  }

  const offsetInterestSaved = Math.max(0, plainTotalInterest - scenarioTotalInterest);
  const offsetMonthsSaved = Math.max(0, plainLoanTermMonths - scenarioLoanTermMonths);

  return {
    plainTotalInterest,
    plainLoanTermMonths,
    offsetInterestSaved,
    offsetMonthsSaved,
  };
}
