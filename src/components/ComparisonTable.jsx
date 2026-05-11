const formatMoney = (value) => {
  if (value === 0 || value === null || value === undefined) return '\u2014';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const formatTerm = (months) => {
  const years = Math.floor(months / 12);
  const remainMonths = months % 12;
  if (remainMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  if (years === 0) return `${remainMonths} month${remainMonths !== 1 ? 's' : ''}`;
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

const metrics = [
  { label: 'Repayment', key: 'repayment', format: formatMoney },
  { label: 'Total Interest', key: 'totalInterest', format: formatMoney },
  { label: 'Total Paid', key: 'totalPaid', format: formatMoney },
  { label: 'Loan Term', key: 'loanTermMonths', format: formatTerm },
  { label: 'Interest Saved', key: 'interestSavedVsBaseline', format: formatSavings },
  { label: 'Time Saved', key: 'monthsSavedVsBaseline', format: formatMonthsSaved },
];

function ComparisonTable({ summary, frequency }) {
  if (!summary || summary.length === 0) return null;

  const repaymentLabel = summary[0]?.repaymentLabel || 'Monthly';

  return (
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
        {metrics.map(({ label, key, format }, index) => (
          <tr key={key} className={index % 2 === 0 ? 'bg-muted' : ''}>
            <td className="py-2 px-3 font-medium text-card-foreground">
              {key === 'repayment' ? `${repaymentLabel} Repayment` : label}
            </td>
            {summary.map((s) => (
              <td key={s.name} className="text-right py-2 px-3 tabular-nums text-card-foreground">{format(s[key])}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ComparisonTable;
