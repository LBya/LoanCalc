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
  { label: 'Monthly Payment', key: 'monthlyRepayment', format: formatMoney },
  { label: 'Total Interest', key: 'totalInterest', format: formatMoney },
  { label: 'Total Paid', key: 'totalPaid', format: formatMoney },
  { label: 'Loan Term', key: 'loanTermMonths', format: formatTerm },
  { label: 'Interest Saved', key: 'interestSavedVsBaseline', format: formatSavings },
  { label: 'Time Saved', key: 'monthsSavedVsBaseline', format: formatMonthsSaved },
];

function ComparisonTable({ summary }) {
  if (!summary || summary.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border p-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">Comparison</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 px-3 font-medium">Metric</th>
            {summary.map((s) => (
              <th key={s.name} className="text-right py-2 px-3 font-medium">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map(({ label, key, format }, index) => (
            <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-2 px-3 font-medium">{label}</td>
              {summary.map((s) => (
                <td key={s.name} className="text-right py-2 px-3 tabular-nums">{format(s[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ComparisonTable;
