/**
 * Generate dynamic text insights comparing scenarios.
 *
 * @param {Array<{name: string, monthlyRepayment: number, totalInterest: number, totalPaid: number, loanTermMonths: number, interestSavedVsBaseline: number, monthsSavedVsBaseline: number}>} summary - From buildComparison().summary
 * @param {Array<{name: string, config: object}>} scenarioConfigs - Scenario configs for conditional rules
 * @returns {Array<string>} Array of insight strings
 */
export function generateInsights(summary, scenarioConfigs) {
  if (!summary || summary.length < 2) return [];

  const baseline = summary[0];
  const insights = [];

  // Rule 1: Biggest interest saver
  const nonBaseline = summary.slice(1).filter(s => s.interestSavedVsBaseline > 0);
  if (nonBaseline.length > 0) {
    const bestSaver = nonBaseline.reduce((best, s) =>
      s.interestSavedVsBaseline > best.interestSavedVsBaseline ? s : best
    );
    const pct = ((bestSaver.interestSavedVsBaseline / baseline.totalInterest) * 100).toFixed(1);
    insights.push(
      `${bestSaver.name} offers the most interest savings at ${formatMoney(bestSaver.interestSavedVsBaseline)}, ` +
      `${pct}% less than ${baseline.name}'s total interest.`
    );
  }

  // Rule 2: Fastest payoff
  const fastest = summary.slice(1).filter(s => s.monthsSavedVsBaseline > 0);
  if (fastest.length > 0) {
    const best = fastest.reduce((top, s) =>
      s.monthsSavedVsBaseline > top.monthsSavedVsBaseline ? s : top
    );
    insights.push(
      `${best.name} pays off the loan fastest, ${formatMonthsSaved(best.monthsSavedVsBaseline)} sooner than ${baseline.name}.`
    );
  }

  // Rules 3-6: Per-scenario insights
  for (let i = 1; i < summary.length; i++) {
    const s = summary[i];
    const config = scenarioConfigs[i]?.config;

    // Rule 3: Per-scenario summary (only if different from baseline)
    if (s.interestSavedVsBaseline > 0 || s.monthsSavedVsBaseline > 0) {
      const higher = s.monthlyRepayment > baseline.monthlyRepayment;
      const diff = Math.abs(s.monthlyRepayment - baseline.monthlyRepayment);
      insights.push(
        `${s.name}: ${higher ? 'higher' : 'lower'} monthly payments of ${formatMoney(s.monthlyRepayment)}, ` +
        `saving ${formatMoney(s.interestSavedVsBaseline)} in interest and ${formatMonthsSaved(s.monthsSavedVsBaseline)} in time.`
      );
    }

    // Rule 4: Offset-specific
    if (config?.offsetBalance > 0) {
      insights.push(
        `${s.name}'s offset of ${formatMoney(config.offsetBalance)} reduces the effective loan balance, ` +
        `cutting ${formatMoney(s.interestSavedVsBaseline)} in interest.`
      );
    }

    // Rule 5: Extra repayment-specific
    if (config?.extraMonthly > 0) {
      insights.push(
        `Adding ${formatMoney(config.extraMonthly)}/month in extra repayments under ${s.name} cuts the loan term by ${formatMonthsSaved(s.monthsSavedVsBaseline)}.`
      );
    }

    // Rule 6: FHSS-specific
    if (config?.fhssIndividuals?.length > 0 && config.fhssIndividuals.some((a) => a > 0)) {
      const count = config.fhssIndividuals.filter((a) => a > 0).length;
      const total = config.fhssIndividuals.reduce((sum, a) => sum + a, 0);
      const label = count > 1 ? `${count} individuals' FHSS` : 'FHSS';
      insights.push(
        `${label} contributions in ${s.name} total ${formatMoney(total)}, reducing the loan principal.`
      );
    }
  }

  return insights;
}

function formatMoney(value) {
  if (!value || value === 0) return '$0';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatMonthsSaved(months) {
  if (!months || months <= 0) return '0 months';
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (years > 0 && remainMonths > 0) return `${years} year${years > 1 ? 's' : ''} and ${remainMonths} month${remainMonths !== 1 ? 's' : ''}`;
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}
