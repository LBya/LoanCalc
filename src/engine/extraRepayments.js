/**
 * Recalculate amortization with extra recurring and/or lump-sum repayments.
 *
 * Extra repayments go directly to reducing principal, shortening the loan term.
 *
 * @param {Object} params
 * @param {number} params.principal - Original loan principal
 * @param {number} params.annualRate - Annual interest rate as decimal
 * @param {number} params.monthlyRepayment - Contractual monthly repayment
 * @param {number} params.extraMonthly - Additional amount paid each month (default 0)
 * @param {Array<{month: number, amount: number}>} params.lumpSums - One-time payments at specific months
 * @returns {{ monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array<{month: number, payment: number, principal: number, interest: number, balance: number}> }}
 */
export function applyExtraRepayments({ principal, annualRate, monthlyRepayment, extraMonthly = 0, lumpSums = [] }) {
  const r = annualRate / 12;

  // Build a lookup map for lump sums
  const lumpSumMap = {};
  for (const { month, amount } of lumpSums) {
    lumpSumMap[month] = (lumpSumMap[month] || 0) + amount;
  }

  const schedule = [];
  let balance = principal;
  let month = 0;

  while (balance > 0) {
    month += 1;
    const interestPayment = balance * r;
    const totalPayment = monthlyRepayment + extraMonthly + (lumpSumMap[month] || 0);
    let principalPayment = totalPayment - interestPayment;
    let payment = totalPayment;

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

    // Safety valve
    if (month > 600) break;
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
