/**
 * Generate dynamic text insights comparing scenarios.
 *
 * Design philosophy:
 * - Not financial advice — point out trade-offs, not recommendations
 * - Separate "what's better" by dimension: interest, cashflow, debt-free date, affordability
 * - Be honest about offset benefits
 * - Highlight when different scenarios "win" on different metrics
 *
 * @param {Array<object>} summary - From buildComparison().summary
 * @param {Array<{name: string, config: object}>} scenarioConfigs - Scenario configs
 * @returns {Array<string>} Array of insight strings
 */
export function generateInsights(summary, scenarioConfigs) {
  if (!summary || summary.length < 2) return [];

  const baseline = summary[0];
  const insights = [];

  const nonBaseline = summary.slice(1);

  // --- Strategic Trade-off Analysis ---
  if (nonBaseline.length > 0) {
    const dimensions = analyzeDimensions(baseline, nonBaseline);
    for (const trade of dimensions.tradeOffs) {
      insights.push(trade);
    }
  }

  // --- Per-Scenario Interest Comparison ---
  for (let i = 1; i < summary.length; i++) {
    const s = summary[i];
    const config = scenarioConfigs[i]?.config;

    if (s.interestSavedVsBaseline > 0) {
      const pct = ((s.interestSavedVsBaseline / baseline.totalInterest) * 100).toFixed(1);
      const repaymentDiff = getRepaymentDirection(s.monthlyRepayment, baseline.monthlyRepayment);
      insights.push(
        `${s.name} saves ${formatMoney(s.interestSavedVsBaseline)} in interest (${pct}% less) ` +
        `with ${repaymentDiff} repayments of ${formatMoney(s.monthlyRepayment)}/mo. ` +
        `Pays off in ${formatTerm(s.loanTermMonths)} vs ${baseline.name}'s ${formatTerm(baseline.loanTermMonths)}.`
      );
    } else if (s.interestSavedVsBaseline < 0) {
      const extraCost = Math.abs(s.interestSavedVsBaseline);
      const repaymentDiff = getRepaymentDirection(s.monthlyRepayment, baseline.monthlyRepayment);
      insights.push(
        `${s.name} costs ${formatMoney(extraCost)} more in interest than ${baseline.name}, ` +
        `with ${repaymentDiff} repayments (${formatMoney(s.monthlyRepayment)}/mo vs ${formatMoney(baseline.monthlyRepayment)}/mo).`
      );
    }

    // FHSS-specific (only if different from baseline's FHSS)
    const baselineConfig = scenarioConfigs[0]?.config;
    const baselineFhssTotal = (baselineConfig?.fhssIndividuals || []).reduce((sum, a) => sum + a, 0);
    if (config?.fhssIndividuals?.length > 0 && config.fhssIndividuals.some((a) => a > 0)) {
      const scenarioFhssTotal = config.fhssIndividuals.reduce((sum, a) => sum + a, 0);
      // Only show if different from baseline
      if (scenarioFhssTotal !== baselineFhssTotal) {
        const count = config.fhssIndividuals.filter((a) => a > 0).length;
        const label = count > 1 ? `${count} individuals' FHSS` : 'FHSS';
        insights.push(`${label} contributions in ${s.name} total ${formatMoney(scenarioFhssTotal)}.`);
      }
    }
  }

  // --- Offset Benefit (per-scenario, honest) ---
  const withOffset = summary.filter(s => s.offsetBonus !== null && s.offsetBonus > 0);
  for (const s of withOffset) {
    const config = scenarioConfigs.find(sc => sc.name === s.name)?.config;
    const offsetAmt = config?.offsetBalance || 0;
    const offsetGrowth = config?.offsetMonthlyGrowth || 0;

    if (offsetAmt > 0) {
      insights.push(
        `${s.name}'s ${formatMoney(offsetAmt)} offset account saves ${formatMoney(s.offsetBonus)} in interest ` +
        `and ${formatMonthsSaved(s.offsetMonthsSaved)} in loan term vs having no offset.`
      );
    } else if (offsetGrowth > 0) {
      insights.push(
        `${s.name}'s growing offset ($${offsetGrowth}/mo) saves ${formatMoney(s.offsetBonus)} in interest ` +
        `and ${formatMonthsSaved(s.offsetMonthsSaved)} in loan term vs having no offset.`
      );
    }
  }

  // --- Offset Efficiency (per dollar) ---
  const withOffsetEff = summary.filter(s => s.offsetEfficiency !== null && s.offsetEfficiency > 0);
  for (const s of withOffsetEff) {
    const config = scenarioConfigs.find(sc => sc.name === s.name)?.config;
    const isStaticOffset = (config?.offsetBalance || 0) > 0;
    if (isStaticOffset) {
      insights.push(
        `${s.name}: Every $1 in the offset account saves $${s.offsetEfficiency.toFixed(2)} in interest over the loan life.`
      );
    }
    // For growing-only offsets, skip the per-$1 metric as it's less intuitive
  }

  // --- Affordability Context ---
  const withIncome = summary.filter(s => s.combinedAnnualIncome > 0);
  if (withIncome.length > 0) {
    for (const s of withIncome) {
      if (s.debtToIncome !== null && s.debtToIncome > 4) {
        insights.push(
          `${s.name}: Debt-to-income ratio of ${s.debtToIncome.toFixed(1)}x ` +
          (s.debtToIncome > 6 ? 'is above the 6x regulatory threshold — high risk.' : 'is above 4x — considered stretched by regulators.')
        );
      }
    }

    const worstInterest = withIncome.reduce((worst, s) =>
      (s.yearsOfSalaryForInterest ?? 0) > (worst.yearsOfSalaryForInterest ?? 0) ? s : worst
    );
    if (worstInterest.yearsOfSalaryForInterest > 0) {
      insights.push(
        `${worstInterest.name}: You'll spend ${worstInterest.yearsOfSalaryForInterest.toFixed(1)} years of combined salary ` +
        `just on interest — that's ${formatMoney(worstInterest.totalInterest)} going to the bank, not your home.`
      );
    }

    for (const s of withIncome) {
      if (s.repaymentToIncome !== null && s.repaymentToIncome > 35) {
        insights.push(
          `${s.name}: Repayments consume ${s.repaymentToIncome.toFixed(0)}% of estimated take-home pay. ` +
          `Above 35% is considered mortgage stress.`
        );
      }
    }
  }

  return insights;
}

/**
 * Analyze which scenario wins on each dimension, and detect trade-offs.
 */
function analyzeDimensions(baseline, nonBaseline) {
  const tradeOffs = [];

  const DTI_TOLERANCE = 0.01; // Ignore DTI differences smaller than 0.01x

  for (const s of nonBaseline) {
    const winsInterest = s.interestSavedVsBaseline > 0;
    const winsCashflow = s.monthlyRepayment < baseline.monthlyRepayment - 1;
    const winsDebtFree = s.loanTermMonths < baseline.loanTermMonths;
    const winsAffordability = s.debtToIncome !== null && baseline.debtToIncome !== null && (baseline.debtToIncome - s.debtToIncome) > DTI_TOLERANCE;

    const wins = [winsInterest, winsCashflow, winsDebtFree, winsAffordability].filter(Boolean).length;
    const losses = [!winsInterest, !winsCashflow, !winsDebtFree, !winsAffordability].filter(Boolean).length;

    if (wins > 0 && losses > 0) {
      const winLabels = [];
      const lossLabels = [];

      if (winsInterest) winLabels.push(`saves ${formatMoney(s.interestSavedVsBaseline)} in interest`);
      else if (s.interestSavedVsBaseline < 0) lossLabels.push(`costs ${formatMoney(Math.abs(s.interestSavedVsBaseline))} more in interest`);

      if (winsCashflow) winLabels.push(`lower repayments (${formatMoney(s.monthlyRepayment)}/mo vs ${formatMoney(baseline.monthlyRepayment)})`);
      else if (s.monthlyRepayment > baseline.monthlyRepayment + 1) lossLabels.push(`higher repayments (${formatMoney(s.monthlyRepayment)}/mo vs ${formatMoney(baseline.monthlyRepayment)})`);

      if (winsDebtFree) winLabels.push(`debt-free ${formatMonthsSaved(baseline.loanTermMonths - s.loanTermMonths)} sooner`);
      else if (s.loanTermMonths > baseline.loanTermMonths) lossLabels.push(`takes ${formatMonthsSaved(s.loanTermMonths - baseline.loanTermMonths)} longer to pay off`);

      if (winsAffordability) winLabels.push('lower debt-to-income ratio');
      else if (s.debtToIncome !== null && baseline.debtToIncome !== null && (s.debtToIncome - baseline.debtToIncome) > DTI_TOLERANCE) lossLabels.push('higher debt-to-income ratio');

      if (winLabels.length > 0 && lossLabels.length > 0) {
        tradeOffs.push(
          `${s.name}: ${winLabels.join(', ')}. However, it ${lossLabels.join(' and ')}.`
        );
      }
    }
  }

  return { tradeOffs };
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
  if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
}

function formatTerm(months) {
  if (!months) return '0 months';
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (years > 0 && remainMonths > 0) return `${years}y ${remainMonths}m`;
  if (years > 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${months} months`;
}

function getRepaymentDirection(a, b) {
  if (Math.abs(a - b) < 1) return 'the same';
  return a > b ? 'higher' : 'lower';
}
