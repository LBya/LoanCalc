/**
 * Generate a month-by-month amortization schedule for a fixed-rate loan.
 *
 * @param {Object} params
 * @param {number} params.principal - Loan amount in dollars
 * @param {number} params.annualRate - Annual interest rate as decimal (e.g., 0.065 for 6.5%)
 * @param {number} params.termYears - Loan term in years
 * @returns {{ monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array<{month: number, payment: number, principal: number, interest: number, balance: number}> }}
 */
export function generateAmortization({ principal, annualRate, termYears }) {
  const r = annualRate / 12;
  const n = termYears * 12;

  // Edge case: zero interest rate
  if (annualRate === 0) {
    const monthlyRepayment = principal / n;
    const schedule = [];
    let balance = principal;
    for (let month = 1; month <= n; month++) {
      balance -= monthlyRepayment;
      schedule.push({
        month,
        payment: monthlyRepayment,
        principal: monthlyRepayment,
        interest: 0,
        balance: Math.max(0, balance),
      });
    }
    return {
      monthlyRepayment,
      totalInterest: 0,
      totalPaid: principal,
      schedule,
    };
  }

  // Standard annuity formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyRepayment = principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  const schedule = [];
  let balance = principal;

  for (let month = 1; month <= n; month++) {
    const interestPayment = balance * r;
    let principalPayment = monthlyRepayment - interestPayment;
    let payment = monthlyRepayment;

    // Final month: pay off remaining balance exactly
    if (principalPayment >= balance) {
      principalPayment = balance;
      payment = principalPayment + interestPayment;
    }

    balance -= principalPayment;
    if (balance < 0.01) balance = 0;

    schedule.push({
      month,
      payment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
    });

    if (balance === 0) break;
  }

  const totalInterest = schedule.reduce((sum, entry) => sum + entry.interest, 0);
  const totalPaid = schedule.reduce((sum, entry) => sum + entry.payment, 0);

  return {
    monthlyRepayment,
    totalInterest,
    totalPaid,
    schedule,
  };
}

/**
 * Convert a monthly repayment to a different frequency.
 * The amortization schedule is always monthly internally.
 *
 * @param {number} monthlyRepayment
 * @param {'monthly'|'fortnightly'|'weekly'} frequency
 * @returns {number} Repayment amount for the given frequency
 */
export function convertRepayment(monthlyRepayment, frequency) {
  switch (frequency) {
    case 'weekly':
      return monthlyRepayment * 12 / 52;
    case 'fortnightly':
      return monthlyRepayment * 12 / 26;
    case 'monthly':
    default:
      return monthlyRepayment;
  }
}

/**
 * Get the label for a repayment frequency.
 * @param {'monthly'|'fortnightly'|'weekly'} frequency
 * @returns {string}
 */
export function frequencyLabel(frequency) {
  switch (frequency) {
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    default: return 'Monthly';
  }
}
