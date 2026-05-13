import { MACRO } from './constants';
import { generateAmortization } from './amortization';

/**
 * Generate dynamic text insights comparing scenarios.
 *
 * Design philosophy:
 * - Not financial advice — point out trade-offs, not recommendations
 * - Detect structural patterns (capital-matched, cashflow arbitrage) before generic analysis
 * - Be honest about offset benefits
 * - Highlight when different scenarios "win" on different metrics
 *
 * @param {Array<object>} summary - From buildComparison().summary
 * @param {Array<{name: string, config: object}>} scenarioConfigs - Scenario configs
 * @returns {Array<string>} Array of insight strings
 */
export function generateInsights(summary, scenarioConfigs) {
  if (!summary || summary.length < 2) return [];

  const first = summary[0];
  const insights = [];

  // --- Phase 1: Structural Pattern Detection ---
  // Detects capital-matched liquidity trade-offs and cashflow arbitrage across ALL pairs.
  // Returns which scenario indices were "consumed" by structural insights (skip generic for those).
  const structuralResult = detectStructuralPatterns(summary, scenarioConfigs);
  for (const insight of structuralResult.insights) {
    insights.push(insight);
  }
  const consumedIndices = structuralResult.consumedIndices;

  // --- Phase 2: Generic Trade-off Analysis (only for unconsumed scenarios) ---
  const unconsumedNonFirst = summary.slice(1).filter((_, i) => !consumedIndices.has(i + 1));
  if (unconsumedNonFirst.length > 0) {
    const dimensions = analyzeDimensions(first, unconsumedNonFirst);
    for (const trade of dimensions.tradeOffs) {
      insights.push(trade);
    }
  }

  // --- Phase 3: Per-Scenario Interest Comparison (skip consumed) ---
  for (let i = 1; i < summary.length; i++) {
    if (consumedIndices.has(i)) continue;

    const s = summary[i];
    const config = scenarioConfigs[i]?.config;

    if (s.interestSavedVsBaseline > 0) {
      const pct = ((s.interestSavedVsBaseline / first.totalInterest) * 100).toFixed(1);
      const repaymentDiff = getRepaymentDirection(s.monthlyRepayment, first.monthlyRepayment);
      insights.push(
        `${s.name} saves ${formatMoney(s.interestSavedVsBaseline)} in interest (${pct}% less) ` +
        `with ${repaymentDiff} repayments of ${formatMoney(s.monthlyRepayment)}/mo. ` +
        `Pays off in ${formatTerm(s.loanTermMonths)} vs ${first.name}'s ${formatTerm(first.loanTermMonths)}.`
      );
    } else if (s.interestSavedVsBaseline < 0) {
      const extraCost = Math.abs(s.interestSavedVsBaseline);
      const repaymentDiff = getRepaymentDirection(s.monthlyRepayment, first.monthlyRepayment);
      insights.push(
        `${s.name} costs ${formatMoney(extraCost)} more in interest than ${first.name}, ` +
        `with ${repaymentDiff} repayments (${formatMoney(s.monthlyRepayment)}/mo vs ${formatMoney(first.monthlyRepayment)}/mo).`
      );
    }

    // FHSS-specific (only if different from first scenario's FHSS)
    const firstConfig = scenarioConfigs[0]?.config;
    const firstFhssTotal = (firstConfig?.fhssIndividuals || []).reduce((sum, a) => sum + a, 0);
    if (config?.fhssIndividuals?.length > 0 && config.fhssIndividuals.some((a) => a > 0)) {
      const scenarioFhssTotal = config.fhssIndividuals.reduce((sum, a) => sum + a, 0);
      if (scenarioFhssTotal !== firstFhssTotal) {
        const count = config.fhssIndividuals.filter((a) => a > 0).length;
        const label = count > 1 ? `${count} individuals' FHSS` : 'FHSS';
        insights.push(`${label} contributions in ${s.name} total ${formatMoney(scenarioFhssTotal)}.`);
      }
    }
  }

  // --- Phase 4: Offset Benefit (per-scenario, all scenarios) ---
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

  // --- Phase 5: Offset Efficiency (per dollar of total capital deployed) ---
  const withOffsetEff = summary.filter(s => s.offsetEfficiency !== null && s.offsetEfficiency > 0);
  for (const s of withOffsetEff) {
    const config = scenarioConfigs.find(sc => sc.name === s.name)?.config;
    const hasGrowth = (config?.offsetMonthlyGrowth || 0) > 0;
    if (hasGrowth) {
      insights.push(
        `${s.name}: Every $1 deployed into the offset over the loan life saves $${s.offsetEfficiency.toFixed(2)} in interest.`
      );
    } else {
      insights.push(
        `${s.name}: Every $1 in the offset account saves $${s.offsetEfficiency.toFixed(2)} in interest over the loan life.`
      );
    }
  }

  // --- Phase 6: Affordability Context ---
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

  // --- Phase 7: APRA Serviceability Check ---
  const apraBuffer = MACRO.apraBuffer;
  const withApra = summary.filter(s => s.apraStressRatio !== null);
  for (const s of withApra) {
    if (s.apraStressRatio > 40) {
      const config = scenarioConfigs.find(sc => sc.name === s.name)?.config;
      const bufferedRate = ((config?.annualRate || 0) + apraBuffer) * 100;
      const bufferedAmort = generateAmortization({
        principal: s.principalBorrowed,
        annualRate: (config?.annualRate || 0) + apraBuffer,
        termYears: config?.termYears || 30,
      });
      insights.push(
        `APRA Check: If rates rise by ${(apraBuffer * 100).toFixed(0)}% (to ${bufferedRate.toFixed(2)}%), ` +
        `${s.name}'s repayments hit ${formatMoney(bufferedAmort.monthlyRepayment)}/mo, ` +
        `consuming ${s.apraStressRatio.toFixed(0)}% of estimated take-home pay. ` +
        `Banks may flag this as high risk.`
      );
    }
  }

  // --- Phase 8: Real Equity Context ---
  const growthRate = MACRO.propertyGrowthAssumption;
  const inflationRate = MACRO.rbaInflation5YrAvg;
  const withProperty = summary.filter(s => s.loanTermMonths > 0);
  for (const s of withProperty) {
    const config = scenarioConfigs.find(sc => sc.name === s.name)?.config;
    const propPrice = config?.propertyPrice || 0;
    if (propPrice <= 0) continue;

    const years = s.loanTermMonths / 12;
    const nominalPropertyValue = propPrice * Math.pow(1 + growthRate, years);
    const schedule = config ? null : null; // We estimate final balance as 0 (paid off)
    const nominalEquity = nominalPropertyValue; // Balance is 0 at end
    const realEquity = nominalEquity / Math.pow(1 + inflationRate, years);

    if (realEquity > 0) {
      insights.push(
        `Wealth Context: Over ${Math.round(years)} years, assuming ${(growthRate * 100).toFixed(1)}% property growth ` +
        `and ${(inflationRate * 100).toFixed(1)}% inflation, ${s.name}'s property will be worth ` +
        `${formatMoney(nominalPropertyValue)} nominal or ${formatMoney(realEquity)} in today's purchasing power ` +
        `(after accounting for ${formatMoney(s.totalInterest)} in interest paid).`
      );
      break; // Only show for the first scenario to avoid clutter
    }
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Structural Pattern Detection
// ---------------------------------------------------------------------------

/**
 * Detect capital-matched liquidity trade-offs and cashflow arbitrage across all scenario pairs.
 * Returns structural insights and a set of "consumed" scenario indices that should skip generic analysis.
 */
function detectStructuralPatterns(summary, scenarioConfigs) {
  const insights = [];
  const consumedIndices = new Set();

  for (let i = 0; i < summary.length; i++) {
    for (let j = i + 1; j < summary.length; j++) {
      const a = summary[i];
      const b = summary[j];
      const configA = scenarioConfigs[i]?.config;
      const configB = scenarioConfigs[j]?.config;

      if (!configA || !configB) continue;

      // Check rate & term match
      const sameRate = Math.abs((configA.annualRate || 0) - (configB.annualRate || 0)) < 0.001;
      const sameTerm = (configA.termYears || 0) === (configB.termYears || 0);

      if (!sameRate || !sameTerm) continue;

      // Check capital match (cashTiedUp within $1k)
      const capitalA = a.cashTiedUp ?? 0;
      const capitalB = b.cashTiedUp ?? 0;
      const capitalDiff = Math.abs(capitalA - capitalB);
      if (capitalDiff > 1000) continue;

      // Must have meaningful capital deployed
      if (capitalA < 1000) continue;

      // Check deposit/offset split differs
      const depositDiff = Math.abs((a.lockedEquity ?? 0) - (b.lockedEquity ?? 0));
      if (depositDiff < 1000) continue; // No meaningful deposit/offset split difference

      // --- Pattern A: Capital-Matched Liquidity Trade-Off ---
      // One has larger deposit (locked equity) + growing offset, other has smaller deposit + lump-sum offset
      const higherDeposit = a.lockedEquity > b.lockedEquity ? a : b;
      const lowerDeposit = a.lockedEquity > b.lockedEquity ? b : a;
      const higherDepositConfig = a.lockedEquity > b.lockedEquity ? configA : configB;
      const lowerDepositConfig = a.lockedEquity > b.lockedEquity ? configB : configA;

      const equityLocked = depositDiff;
      const interestDiff = Math.abs(a.totalInterest - b.totalInterest);
      const interestVerdict = interestDiff < 5000
        ? `The interest difference of ${formatMoney(interestDiff)} over ${Math.round(Math.max(a.loanTermMonths, b.loanTermMonths) / 12)} years is negligible — this decision is about risk, not returns.`
        : `${higherDeposit.name} saves ${formatMoney(interestDiff)} in interest over the loan life.`;

      insights.push(
        `The Liquidity Trade-Off: Both scenarios deploy your ${formatMoney(a.cashTiedUp)} capital, but differently. ` +
        `${higherDeposit.name} locks ${formatMoney(equityLocked)} more into equity, lowering your mandatory repayment to ${formatMoney(higherDeposit.monthlyRepayment)}/mo. ` +
        `${lowerDeposit.name} keeps ${formatMoney(equityLocked)} liquid in offset but commits you to ${formatMoney(lowerDeposit.monthlyRepayment)}/mo.`
      );

      insights.push(
        `Cash-flow safety: ${higherDeposit.name}'s mandatory minimum is ${formatMoney(Math.abs(lowerDeposit.monthlyRepayment - higherDeposit.monthlyRepayment))}/mo lower. ` +
        `If income drops, you can pause voluntary offset contributions and survive on the lower baseline.`
      );

      insights.push(
        `Liquidity advantage: ${lowerDeposit.name} keeps ${formatMoney(equityLocked)} instantly accessible without bank approval. ` +
        `${higherDeposit.name}'s offset grows over time but starts with less liquid cash.`
      );

      insights.push(interestVerdict);

      consumedIndices.add(i);
      consumedIndices.add(j);
    }
  }

  // --- Pattern B: Cashflow Arbitrage (across unconsumed pairs) ---
  // For any pair where total monthly outflows differ, suggest redirecting surplus to offset.
  for (let i = 0; i < summary.length; i++) {
    for (let j = i + 1; j < summary.length; j++) {
      if (consumedIndices.has(i) && consumedIndices.has(j)) continue; // Already handled by Pattern A

      const a = summary[i];
      const b = summary[j];
      const configA = scenarioConfigs[i]?.config;
      const configB = scenarioConfigs[j]?.config;

      if (!configA || !configB) continue;

      const outflowA = a.totalMonthlyOutflow ?? 0;
      const outflowB = b.totalMonthlyOutflow ?? 0;
      const outflowDiff = Math.abs(outflowA - outflowB);
      // Only trigger if outflows differ by more than $50/mo and less than $2000/mo
      if (outflowDiff < 50 || outflowDiff > 2000) continue;

      // Same rate/term required for fair comparison
      const sameRate = Math.abs((configA.annualRate || 0) - (configB.annualRate || 0)) < 0.001;
      const sameTerm = (configA.termYears || 0) === (configB.termYears || 0);
      if (!sameRate || !sameTerm) continue;

      const lowerOutflow = a.totalMonthlyOutflow < b.totalMonthlyOutflow ? a : b;
      const higherOutflow = a.totalMonthlyOutflow < b.totalMonthlyOutflow ? b : a;
      const lowerConfig = a.totalMonthlyOutflow < b.totalMonthlyOutflow ? configA : configB;
      const lowerIndex = a.totalMonthlyOutflow < b.totalMonthlyOutflow ? i : j;

      // Don't add duplicate arbitrage if this pair was already handled
      if (consumedIndices.has(lowerIndex)) continue;

      // Compute what-if: redirect the surplus into the lower-outflow scenario's offset
      const arbitrage = computeArbitrageImpact(lowerConfig, lowerOutflow, outflowDiff);

      if (arbitrage.additionalInterestSaved > 0) {
        insights.push(
          `Cashflow arbitrage: ${lowerOutflow.name}'s total monthly commitment is ${formatMoney(lowerOutflow.totalMonthlyOutflow)}/mo ` +
          `(repayment${lowerConfig.offsetMonthlyGrowth > 0 ? ' + offset' : ''}${lowerConfig.extraMonthly > 0 ? ' + extra' : ''}), ` +
          `${formatMoney(outflowDiff)}/mo less than ${higherOutflow.name}'s ${formatMoney(higherOutflow.totalMonthlyOutflow)}/mo. ` +
          `If you redirected that ${formatMoney(outflowDiff)}/mo surplus into ${lowerOutflow.name}'s offset, ` +
          `you'd save an additional ${formatMoney(arbitrage.additionalInterestSaved)} in interest ` +
          `and pay off ~${formatMonthsSaved(arbitrage.additionalMonthsSaved)} sooner.`
        );
      } else {
        insights.push(
          `Cashflow comparison: ${lowerOutflow.name}'s total monthly outflow is ${formatMoney(outflowDiff)}/mo less than ${higherOutflow.name}. ` +
          `${higherOutflow.name} pays off ${formatMonthsSaved(Math.abs(higherOutflow.loanTermMonths - lowerOutflow.loanTermMonths))} sooner ` +
          `by committing more per month.`
        );
      }
    }
  }

  return { insights, consumedIndices };
}

/**
 * Compute the impact of redirecting a monthly surplus into a scenario's offset.
 * Runs a lightweight what-if calculation using the offset engine.
 */
function computeArbitrageImpact(config, currentSummary, surplusAmount) {
  // We need principal and rate from the config to run the offset engine
  const principal = (config.propertyPrice || 0)
    - (config.deposit || 0)
    - 0; // FHSS net would need to be recalculated, approximate as 0 for what-if
  const annualRate = config.annualRate || 0.06;
  const termYears = config.termYears || 30;
  const currentOffsetGrowth = config.offsetMonthlyGrowth || 0;
  const extraMonthly = config.extraMonthly || 0;

  // Current total interest (from summary) accounts for extra repayments
  // We approximate the offset-only improvement by running applyOffset with the extra growth
  // Simple approximation: extra $X/mo in offset saves roughly $X * effectiveMonthlyRate * remainingTerm / 2
  const r = annualRate / 12;
  const remainingMonths = currentSummary.loanTermMonths || termYears * 12;
  const effectiveExtraOffset = surplusAmount;

  // Rough model: each extra dollar in offset saves r * average_remaining_balance over the life
  // More precise: run a mini amortization with the extra offset growth
  let additionalInterestSaved = 0;
  let additionalMonthsSaved = 0;

  if (effectiveExtraOffset > 0 && principal > 0 && annualRate > 0) {
    // Current offset growth
    const currentGrowth = currentOffsetGrowth;
    // What-if: add surplus to offset growth
    const boostedGrowth = currentGrowth + effectiveExtraOffset;

    // Mini calculation: interest saved ≈ sum of (extraOffset * r) each month
    // assuming linear balance decline
    let balance = currentSummary.principalBorrowed || principal;
    let totalExtraInterestSaved = 0;
    let monthsSaved = 0;
    const currentTerm = remainingMonths;

    for (let m = 1; m <= currentTerm + 60; m++) {
      const currentOffset = currentGrowth * m;
      const boostedOffset = boostedGrowth * m;
      const extraOffset = boostedOffset - currentOffset;

      const effectiveBalance = Math.max(0, balance - extraOffset);
      const interestSaving = Math.min(balance, extraOffset) * r;

      totalExtraInterestSaved += interestSaving;

      const normalInterest = balance * r;
      const normalPrincipal = currentSummary.monthlyRepayment + extraMonthly - normalInterest;
      balance -= normalPrincipal;
      if (balance < 0) {
        monthsSaved = currentTerm - m;
        break;
      }
    }

    additionalInterestSaved = totalExtraInterestSaved;
    additionalMonthsSaved = Math.max(0, monthsSaved);
  }

  return {
    additionalInterestSaved,
    additionalMonthsSaved,
  };
}

// ---------------------------------------------------------------------------
// Generic Dimension Analysis
// ---------------------------------------------------------------------------

function analyzeDimensions(baseline, nonBaseline) {
  const tradeOffs = [];

  const DTI_TOLERANCE = 0.01;

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

// ---------------------------------------------------------------------------
// Formatting Helpers
// ---------------------------------------------------------------------------

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
