import { useState } from 'react';

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

const mainMetrics = [
  { label: 'Repayment', key: 'repayment', format: formatMoney },
  { label: 'Total Interest', key: 'totalInterest', format: formatMoney },
  { label: 'Loan Term', key: 'loanTermMonths', format: formatTerm },
  { label: 'Interest Saved', key: 'interestSavedVsBaseline', format: formatSavings },
  { label: 'Time Saved', key: 'monthsSavedVsBaseline', format: formatMonthsSaved },
];

const advancedMetrics = [
  { label: 'Principal Borrowed', key: 'principalBorrowed', format: formatMoney },
  { label: 'Cash Tied Up', key: 'cashTiedUp', format: formatMoney },
  { label: 'Effective Rate', key: 'effectiveRate', format: formatPercent },
  { label: 'Interest-Free Months', key: 'interestFreeMonths', format: formatCount },
];

function MetricRows({ metrics: metricDefs, summary, repaymentLabel, startIndex }) {
  return metricDefs.map(({ label, key, format }, i) => (
    <tr key={key} className={(startIndex + i) % 2 === 0 ? 'bg-muted' : ''}>
      <td className="py-2 px-3 font-medium text-card-foreground">
        {key === 'repayment' ? `${repaymentLabel} Repayment` : label}
      </td>
      {summary.map((s) => (
        <td key={s.name} className="text-right py-2 px-3 tabular-nums text-card-foreground">{format(s[key])}</td>
      ))}
    </tr>
  ));
}

function ComparisonTable({ summary, frequency }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!summary || summary.length === 0) return null;

  const repaymentLabel = summary[0]?.repaymentLabel || 'Monthly';

  return (
    <div>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Metric</th>
            {summary.map((s) => (
              <th key={s.name} className="text-right py-2 px-3 font-medium text-card-foreground">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <MetricRows metrics={mainMetrics} summary={summary} repaymentLabel={repaymentLabel} startIndex={0} />
        </tbody>
      </table>

      <button
        onClick={() => setShowAdvanced((prev) => !prev)}
        className="flex items-center gap-1 mt-3 text-sm font-medium text-primary hover:underline"
      >
        <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>&#9654;</span>
        Advanced Comparison
      </button>

      {showAdvanced && (
        <table className="w-full border-collapse text-sm mt-1">
          <tbody>
            <MetricRows metrics={advancedMetrics} summary={summary} repaymentLabel={repaymentLabel} startIndex={mainMetrics.length} />
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ComparisonTable;
