/**
 * Aggregate multiple scenario results into comparison data.
 *
 * @param {Array<{name: string, result: {monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array}}>} scenarios
 * @returns {{ summary: Array, trajectories: Array }}
 */
export function buildComparison(scenarios) {
  if (!scenarios || scenarios.length === 0) {
    return { summary: [], trajectories: [] };
  }

  const baseline = scenarios[0];

  const summary = scenarios.map((scenario) => ({
    name: scenario.name,
    monthlyRepayment: scenario.result.monthlyRepayment,
    totalInterest: scenario.result.totalInterest,
    totalPaid: scenario.result.totalPaid,
    loanTermMonths: scenario.result.schedule.length,
    interestSavedVsBaseline: baseline.result.totalInterest - scenario.result.totalInterest,
    monthsSavedVsBaseline: baseline.result.schedule.length - scenario.result.schedule.length,
  }));

  const trajectories = scenarios.map((scenario) => ({
    name: scenario.name,
    data: scenario.result.schedule.map((entry) => ({
      month: entry.month,
      balance: entry.balance,
    })),
  }));

  return { summary, trajectories };
}
