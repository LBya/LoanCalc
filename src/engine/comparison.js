import { MEDIAN_SALARY } from './constants';

/**
 * Aggregate multiple scenario results into comparison data.
 *
 * @param {Array<{name: string, config?: {deposit?: number, offsetBalance?: number, salaries?: number[]}, result: {monthlyRepayment: number, totalInterest: number, totalPaid: number, schedule: Array}, shadowDecomposition?: object}>} scenarios
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

    // Affordability metrics
    const salaries = scenario.config?.salaries || [];
    const combinedAnnualIncome = salaries.length > 0
      ? salaries.reduce((sum, s) => sum + (s || 0), 0)
      : 0;

    const debtToIncome = combinedAnnualIncome > 0 && principalBorrowed > 0
      ? principalBorrowed / combinedAnnualIncome
      : null;

    const monthlyIncome = combinedAnnualIncome / 12;
    // After-tax approximation (rough) at 75% take-home
    const afterTaxMonthly = monthlyIncome * 0.75;
    const repaymentToIncome = afterTaxMonthly > 0
      ? (scenario.result.monthlyRepayment / afterTaxMonthly) * 100
      : null;

    const yearsOfSalaryForInterest = combinedAnnualIncome > 0
      ? scenario.result.totalInterest / combinedAnnualIncome
      : null;

    // Offset decomposition
    const decomposition = scenario.shadowDecomposition || null;
    const hasOffsetEffect = (offsetBalance > 0) || (scenario.config?.offsetMonthlyGrowth > 0);

    // Offset efficiency: interest saved per dollar of initial offset.
    // For static offsets, divide by the initial offset balance.
    // For growing offsets (no initial balance), divide by total contributed over loan life.
    let offsetEfficiency = null;
    let offsetBonus = decomposition?.offsetInterestSaved ?? null;

    if (hasOffsetEffect && offsetBonus !== null && offsetBonus > 0) {
      if (offsetBalance > 0) {
        // Static offset: efficiency per dollar of initial balance
        offsetEfficiency = offsetBonus / offsetBalance;
      } else if (scenario.config?.offsetMonthlyGrowth > 0 && loanTermMonths > 0) {
        // Growing offset only: efficiency per total dollar contributed
        const totalContributed = scenario.config.offsetMonthlyGrowth * loanTermMonths;
        if (totalContributed > 0) {
          offsetEfficiency = offsetBonus / totalContributed;
        }
      }
    }

    // Risk rating based on DTI and repayment stress
    const riskRating = calculateRiskRating(debtToIncome, repaymentToIncome);

    // Color ratings for individual affordability metrics
    const debtToIncomeColor = debtToIncome !== null
      ? (debtToIncome > 6 ? 'red' : debtToIncome > 4 ? 'amber' : 'green')
      : null;
    const repaymentToIncomeColor = repaymentToIncome !== null
      ? (repaymentToIncome > 50 ? 'red' : repaymentToIncome > 35 ? 'amber' : 'green')
      : null;
    const yearsOfSalaryColor = yearsOfSalaryForInterest !== null
      ? (yearsOfSalaryForInterest > 5 ? 'red' : yearsOfSalaryForInterest > 3 ? 'amber' : 'green')
      : null;

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
      // Affordability
      combinedAnnualIncome,
      debtToIncome,
      repaymentToIncome,
      yearsOfSalaryForInterest,
      offsetEfficiency,
      riskRating,
      // Color indicators
      debtToIncomeColor,
      repaymentToIncomeColor,
      yearsOfSalaryColor,
      // Decomposition
      cashFlowSavings: decomposition?.cashFlowSavings ?? null,
      offsetBonus: offsetBonus,
      cashFlowMonthsSaved: decomposition?.cashFlowMonthsSaved ?? null,
      offsetMonthsSaved: decomposition?.offsetMonthsSaved ?? null,
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

/**
 * Calculate a risk rating based on DTI and repayment-to-income ratio.
 * Returns 'green' | 'amber' | 'red' | null (null if no income data).
 */
function calculateRiskRating(debtToIncome, repaymentToIncome) {
  if (debtToIncome === null && repaymentToIncome === null) return null;

  const dti = debtToIncome ?? 0;
  const rti = repaymentToIncome ?? 0;

  if (dti > 6 || rti > 50) return 'red';
  if (dti > 4 || rti > 35) return 'amber';
  return 'green';
}
