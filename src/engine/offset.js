/**
 * Recalculate amortization schedule with an offset balance.
 *
 * An offset account reduces the interest-bearing balance each month.
 * The contractual repayment stays the same, but more goes to principal,
 * so the loan pays off sooner.
 *
 * @param {Object} params
 * @param {number} params.principal - Original loan principal
 * @param {number} params.annualRate - Annual interest rate as decimal
 * @param {number} params.termYears - Original loan term in years
 * @param {number} params.offsetBalance - Amount held in offset account
 * @param {number} params.monthlyRepayment - Contractual monthly repayment from base amortization
 * @returns {{ monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array<{month: number, payment: number, principal: number, interest: number, balance: number}> }}
 */
export function applyOffset({ principal, annualRate, termYears, offsetBalance, monthlyRepayment }) {
  const r = annualRate / 12;
  const schedule = [];
  let balance = principal;
  let month = 0;

  while (balance > 0) {
    month += 1;
    const effectiveBalance = Math.max(0, balance - offsetBalance);
    const interestPayment = effectiveBalance * r;
    let principalPayment = monthlyRepayment - interestPayment;
    let payment = monthlyRepayment;

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

    // Safety: shouldn't exceed original term by much
    if (month > termYears * 12 + 1) break;
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
