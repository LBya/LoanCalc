import { MEDIAN_SALARY, MACRO } from './constants';
import { generateAmortization } from './amortization';

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

    // Offset efficiency: interest saved per dollar of total capital deployed into offset.
    // Total capital = initial lump sum + all growth contributions over the loan life.
    // This gives an honest blended rate for hybrid offsets (both initial + growth),
    // and naturally degrades correctly for pure static or pure growing offsets.
    let offsetEfficiency = null;
    let offsetBonus = decomposition?.offsetInterestSaved ?? null;

    if (hasOffsetEffect && offsetBonus !== null && offsetBonus > 0) {
      const totalCapitalDeployed = offsetBalance
        + (scenario.config?.offsetMonthlyGrowth || 0) * loanTermMonths;
      if (totalCapitalDeployed > 0) {
        offsetEfficiency = offsetBonus / totalCapitalDeployed;
      }
    }

    // Risk rating based on DTI and repayment stress
    const riskRating = calculateRiskRating(debtToIncome, repaymentToIncome);

    // APRA serviceability test: can the borrower survive a 3% rate hike?
    const apraBuffer = MACRO.apraBuffer;
    let apraStressRatio = null;
    if (combinedAnnualIncome > 0 && scenario.config?.annualRate) {
      const bufferedRate = scenario.config.annualRate + apraBuffer;
      const bufferedAmort = generateAmortization({
        principal: principalBorrowed,
        annualRate: bufferedRate,
        termYears: scenario.config?.termYears || 30,
      });
      apraStressRatio = afterTaxMonthly > 0
        ? (bufferedAmort.monthlyRepayment / afterTaxMonthly) * 100
        : null;
    }

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
      // Liquidity & cashflow
      totalMonthlyOutflow: scenario.result.monthlyRepayment
        + (scenario.config?.offsetMonthlyGrowth || 0)
        + (scenario.config?.extraMonthly || 0),
      lockedEquity: deposit,
      liquidReserve: offsetBalance,
      // Decomposition
      cashFlowSavings: decomposition?.cashFlowSavings ?? null,
      offsetBonus: offsetBonus,
      cashFlowMonthsSaved: decomposition?.cashFlowMonthsSaved ?? null,
      offsetMonthsSaved: decomposition?.offsetMonthsSaved ?? null,
      // APRA stress test
      apraStressRatio,
    };
  });

  const growthRate = MACRO.propertyGrowthAssumption;
  const inflationRate = MACRO.rbaInflation5YrAvg;

  const trajectories = scenarios.map((scenario) => {
    const propPrice = scenario.config?.propertyPrice || 0;

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
          realEquity: propPrice > 0 ? realEquity : null,
        };
      }),
    };
  });

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
