/**
 * Aggregate multiple scenario results into comparison data.
 *
 * @param {Array<{name: string, config?: {deposit?: number, offsetBalance?: number}, result: {monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array}}>} scenarios
 * @returns {{ summary: Array, trajectories: Array, offsetTrajectories: Array }}
 */
export function buildComparison(scenarios) {
  if (!scenarios || scenarios.length === 0) {
    return { summary: [], trajectories: [], offsetTrajectories: [] };
  }

  const baseline = scenarios[0];

  const summary = scenarios.map((scenario) => {
    const deposit = scenario.config?.deposit || 0;
    const offsetBalance = scenario.config?.offsetBalance || 0;
    const schedule = scenario.result.schedule;
    const loanTermMonths = schedule.length;
    const principalBorrowed = scenario.result.totalPaid - scenario.result.totalInterest;
    const interestFreeMonths = schedule.filter((e) => e.interest === 0).length;
    const termYears = loanTermMonths / 12;
    const effectiveRate = principalBorrowed > 0 && termYears > 0
      ? (scenario.result.totalInterest / principalBorrowed / termYears) * 100
      : 0;

    return {
      name: scenario.name,
      monthlyRepayment: scenario.result.monthlyRepayment,
      totalInterest: scenario.result.totalInterest,
      totalPaid: scenario.result.totalPaid,
      loanTermMonths,
      interestSavedVsBaseline: baseline.result.totalInterest - scenario.result.totalInterest,
      monthsSavedVsBaseline: baseline.result.schedule.length - loanTermMonths,
      principalBorrowed,
      cashTiedUp: deposit + offsetBalance,
      effectiveRate,
      interestFreeMonths,
    };
  });

  const trajectories = scenarios.map((scenario) => ({
    name: scenario.name,
    data: scenario.result.schedule.map((entry) => ({
      month: entry.month,
      balance: entry.balance,
    })),
  }));

  // Offset trajectories for scenarios that have offset data
  const offsetTrajectories = scenarios
    .filter((scenario) => scenario.result.schedule.some((entry) => entry.offsetBalance > 0))
    .map((scenario) => ({
      name: `${scenario.name} Offset`,
      data: scenario.result.schedule
        .filter((entry) => entry.offsetBalance > 0)
        .map((entry) => ({
          month: entry.month,
          balance: entry.offsetBalance,
        })),
    }));

  return { summary, trajectories, offsetTrajectories };
}
