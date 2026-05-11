/**
 * Recalculate amortization schedule with an offset balance.
 * Supports static offset or growing offset (fixed monthly + annual percentage).
 *
 * @param {Object} params
 * @param {number} params.principal - Original loan principal
 * @param {number} params.annualRate - Annual interest rate as decimal
 * @param {number} params.termYears - Original loan term in years
 * @param {number} params.offsetBalance - Initial amount in offset account
 * @param {number} params.monthlyRepayment - Contractual monthly repayment from base amortization
 * @param {number} params.offsetMonthlyGrowth - Fixed amount added to offset each month (default 0)
 * @param {number} params.offsetAnnualGrowth - Annual percentage growth on offset (default 0, e.g. 5 = 5%)
 * @returns {{ monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array<{month: number, payment: number, principal: number, interest: number, balance: number, offsetBalance: number}> }}
 */
export function applyOffset({ principal, annualRate, termYears, offsetBalance, monthlyRepayment, offsetMonthlyGrowth = 0, offsetAnnualGrowth = 0 }) {
  const r = annualRate / 12;
  const schedule = [];
  let balance = principal;
  let currentOffset = offsetBalance;
  let month = 0;

  while (balance > 0) {
    month += 1;

    // Grow offset
    currentOffset += offsetMonthlyGrowth;
    // Annual growth applied every 12 months
    if (offsetAnnualGrowth > 0 && month > 1 && (month - 1) % 12 === 0) {
      currentOffset *= (1 + offsetAnnualGrowth / 100);
    }
    // Cap offset at remaining principal
    currentOffset = Math.min(currentOffset, balance + currentOffset);

    const effectiveBalance = Math.max(0, balance - currentOffset);
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
      offsetBalance: currentOffset,
    });

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
