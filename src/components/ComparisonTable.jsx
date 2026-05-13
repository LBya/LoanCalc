import { useState } from 'react';
import CalculationPopover from './CalculationPopover';

const formatMoney = (value) => {
  if (value === 0 || value === null || value === undefined) return '\u2014';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatTerm = (months) => {
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (remainMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  if (years === 0) return `${remainMonths} month${months !== 1 ? 's' : ''}`;
  return `${years}y ${remainMonths}m`;
};

const formatSavings = (value) => {
  if (value <= 0) return '\u2014';
  return formatMoney(value);
};

const formatMonthsSaved = (months) => {
  if (months <= 0) return '\u2014';
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (years > 0 && remainMonths > 0) return `${years}y ${remainMonths}m`;
  if (years > 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}`;
};

const formatPercent = (value) => {
  if (value === 0 || value === null || value === undefined) return '\u2014';
  return `${value.toFixed(2)}%`;
};

const formatCount = (value) => {
  if (value === 0 || value === null || value === undefined) return '\u2014';
  return `${value} mo`;
};

const formatRatio = (value) => {
  if (value === null || value === undefined) return '\u2014';
  return `${value.toFixed(1)}x`;
};

const formatYears = (value) => {
  if (value === null || value === undefined) return '\u2014';
  return `${value.toFixed(1)} yrs`;
};

const riskBadge = (rating) => {
  if (!rating) return '\u2014';
  const colors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  const labels = { green: 'Low', amber: 'Moderate', red: 'High' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[rating]}`}>
      {labels[rating]}
    </span>
  );
};

const mainMetrics = [
  {
    label: 'Repayment',
    key: 'repayment',
    format: formatMoney,
    explanation: 'The regular payment amount required to repay the loan over the selected term.',
    formula: 'M = P x [r(1+r)^n] / [(1+r)^n - 1]',
  },
  {
    label: 'Total Interest',
    key: 'totalInterest',
    format: formatMoney,
    explanation: 'The total interest paid over the entire loan life.',
    formula: 'Sum of all interest payments across the amortization schedule.',
  },
  {
    label: 'Loan Term',
    key: 'loanTermMonths',
    format: formatTerm,
    explanation: 'The actual number of months until the loan is fully repaid.',
    formula: 'Count of months until balance reaches $0.',
  },
  {
    label: 'Interest Saved',
    key: 'interestSavedVsBaseline',
    format: formatSavings,
    explanation: 'Total interest saved compared to the Baseline scenario.',
    formula: 'Baseline Total Interest - This Scenario Total Interest',
  },
  {
    label: 'Time Saved',
    key: 'monthsSavedVsBaseline',
    format: formatMonthsSaved,
    explanation: 'How much sooner the loan is paid off compared to Baseline.',
    formula: 'Baseline Loan Term - This Scenario Loan Term',
  },
];

const advancedMetrics = [
  {
    label: 'Principal Borrowed',
    key: 'principalBorrowed',
    format: formatMoney,
    explanation: 'The actual loan amount borrowed after deposit and FHSS.',
    formula: 'Property Price - Cash Deposit - FHSS Net Withdrawal',
  },
  {
    label: 'Cash Tied Up',
    key: 'cashTiedUp',
    format: formatMoney,
    explanation: 'Total cash you need upfront: deposit plus offset balance.',
    formula: 'Cash Deposit + Offset Balance',
  },
  {
    label: 'Effective Rate',
    key: 'effectiveRate',
    format: formatPercent,
    explanation: 'The average annual interest rate you effectively pay on the principal over the loan life.',
    formula: '(Total Interest / Principal) / Term Years x 100',
  },
  {
    label: 'Interest-Free Months',
    key: 'interestFreeMonths',
    format: formatCount,
    explanation: 'Months where offset fully covers the principal, so zero interest is charged.',
    formula: 'Count of months where effective balance = 0',
  },
];

const colorClasses = {
  green: 'text-green-700 dark:text-green-400',
  amber: 'text-amber-700 dark:text-amber-400',
  red: 'text-red-700 dark:text-red-400',
};

const badgeClasses = {
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const affordabilityMetrics = [
  {
    label: 'Debt-to-Income',
    key: 'debtToIncome',
    colorKey: 'debtToIncomeColor',
    format: formatRatio,
    explanation: 'How many times your combined annual income the loan principal is. Above 6x is high risk.',
    formula: 'Principal Borrowed / Combined Annual Income',
  },
  {
    label: 'Repayment Stress',
    key: 'repaymentToIncome',
    colorKey: 'repaymentToIncomeColor',
    format: (v) => v === null || v === undefined ? '\u2014' : `${v.toFixed(0)}%`,
    explanation: 'Percentage of estimated take-home pay (75% of gross) consumed by repayments. Above 35% is mortgage stress.',
    formula: 'Monthly Repayment / (Monthly Gross Income x 0.75) x 100',
  },
  {
    label: 'Years of Salary for Interest',
    key: 'yearsOfSalaryForInterest',
    colorKey: 'yearsOfSalaryColor',
    format: formatYears,
    explanation: 'How many years of your combined annual salary equal the total interest paid. Shows the true cost of borrowing.',
    formula: 'Total Interest / Combined Annual Income',
  },
  {
    label: 'Offset Efficiency',
    key: 'offsetEfficiency',
    format: (v) => v === null || v === undefined ? '\u2014' : `$${v.toFixed(2)}/$1`,
    explanation: 'How much interest each dollar in your offset account saves over the loan life.',
    formula: 'Offset Bonus Interest Savings / Offset Balance',
  },
  {
    label: 'Risk Rating',
    key: 'riskRating',
    format: riskBadge,
    explanation: 'Overall risk assessment based on debt-to-income ratio and repayment stress.',
    formula: 'Green: DTI < 4x & stress < 35% | Amber: DTI < 6x & stress < 50% | Red: above either threshold',
  },
];

function MetricRows({ metrics: metricDefs, summary, repaymentLabel, startIndex, isAffordability }) {
  return metricDefs.map(({ label, key, colorKey, format, explanation, formula }, i) => (
    <tr key={key} className={(startIndex + i) % 2 === 0 ? 'bg-muted' : ''}>
      <td className="py-1.5 px-2 sm:py-2 sm:px-3 font-medium text-card-foreground whitespace-normal sm:whitespace-nowrap">
        {key === 'repayment' ? `${repaymentLabel} Repayment` : label}
        <CalculationPopover
          explanation={explanation}
          formula={formula}
        />
      </td>
      {summary.map((s) => {
        const colorClass = isAffordability && colorKey && s[colorKey] ? colorClasses[s[colorKey]] : '';
        return (
          <td key={s.name} className={`text-right py-1.5 px-2 sm:py-2 sm:px-3 tabular-nums whitespace-nowrap ${colorClass || 'text-card-foreground'}`}>
            {typeof format === 'function' ? format(s[key]) : s[key]}
          </td>
        );
      })}
    </tr>
  ));
}

function ComparisonTable({ summary, frequency }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAffordability, setShowAffordability] = useState(false);

  if (!summary || summary.length === 0) return null;

  const repaymentLabel = summary[0]?.repaymentLabel || 'Monthly';

  // Check if any scenario has income data
  const hasIncomeData = summary.some((s) => s.combinedAnnualIncome > 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-1.5 px-2 sm:py-2 sm:px-3 font-medium text-muted-foreground whitespace-nowrap">Metric</th>
            {summary.map((s) => (
              <th key={s.name} className="text-right py-1.5 px-2 sm:py-2 sm:px-3 font-medium text-card-foreground whitespace-nowrap">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <MetricRows metrics={mainMetrics} summary={summary} repaymentLabel={repaymentLabel} startIndex={0} />
        </tbody>
      </table>

      <div className="flex flex-wrap gap-4 mt-3">
        <button
          onClick={() => setShowAdvanced((prev) => !prev)}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>&#9654;</span>
          Advanced Comparison
        </button>

        {hasIncomeData && (
          <button
            onClick={() => setShowAffordability((prev) => !prev)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <span className={`transition-transform ${showAffordability ? 'rotate-90' : ''}`}>&#9654;</span>
            Affordability
          </button>
        )}
      </div>

      {showAdvanced && (
        <table className="w-full border-collapse text-sm mt-1">
          <tbody>
            <MetricRows metrics={advancedMetrics} summary={summary} repaymentLabel={repaymentLabel} startIndex={mainMetrics.length} />
          </tbody>
        </table>
      )}

      {showAffordability && hasIncomeData && (
        <table className="w-full border-collapse text-sm mt-1">
          <tbody>
            <MetricRows metrics={affordabilityMetrics} summary={summary} repaymentLabel={repaymentLabel} startIndex={mainMetrics.length + advancedMetrics.length} isAffordability={true} />
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ComparisonTable;
