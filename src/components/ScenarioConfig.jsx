import { useState } from 'react';

const defaultConfig = {
  propertyPrice: 600000,
  deposit: 100000,
  annualRate: 6.5,
  termYears: 30,
  offsetBalance: 0,
  offsetMonthlyGrowth: 0,
  offsetAnnualGrowth: 0,
  extraMonthly: 0,
  fhssIndividuals: [0],
  salaries: [],
  fhssAdvanced: false,
  repaymentFrequency: 'monthly',
};

export { defaultConfig };

function ScenarioConfig({ scenario, isBaseline, onChange, onRemove, fhssResult }) {
  const config = scenario.config;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFhss, setShowFhss] = useState((config.fhssIndividuals || []).some((a) => a > 0));
  const [showFhssAdvanced, setShowFhssAdvanced] = useState(config.fhssAdvanced || false);

  const update = (field, value) => {
    onChange({ ...scenario, config: { ...config, [field]: value } });
  };

  const parseNum = (value) => value === '' ? '' : Number(value);

  const inputClass = "block w-full border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";
  const labelClass = "text-sm font-medium text-muted-foreground";
  const compactInputClass = "w-full border border-border rounded px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";

  const combinedNet = fhssResult?.combinedNetWithdrawal ?? 0;
  const effectiveDeposit = config.deposit + combinedNet;

  const individuals = config.fhssIndividuals || [0];
  const salaries = config.salaries || [];
  const personCount = Math.max(individuals.length, salaries.length > 0 ? salaries.length : individuals.length > 1 ? individuals.length : 1);

  // Ensure arrays are padded to personCount
  const paddedSalaries = Array.from({ length: personCount }, (_, i) => salaries[i] || 0);
  const paddedIndividuals = Array.from({ length: personCount }, (_, i) => individuals[i] || 0);

  const ensureArrays = (newSalaries, newIndividuals) => {
    const maxLen = Math.max(newSalaries.length, newIndividuals.length, personCount);
    const s = Array.from({ length: maxLen }, (_, i) => newSalaries[i] ?? 0);
    const ind = Array.from({ length: maxLen }, (_, i) => newIndividuals[i] ?? 0);
    return { salaries: s, fhssIndividuals: ind };
  };

  const addIndividual = () => {
    const newCount = personCount + 1;
    const newSalaries = Array.from({ length: newCount }, (_, i) => paddedSalaries[i] || 0);
    const newIndividuals = Array.from({ length: newCount }, (_, i) => paddedIndividuals[i] || 0);
    onChange({
      ...scenario,
      config: { ...config, salaries: newSalaries, fhssIndividuals: newIndividuals },
    });
  };

  const removeIndividual = (index) => {
    if (personCount <= 1) return;
    const newSalaries = paddedSalaries.filter((_, i) => i !== index);
    const newIndividuals = paddedIndividuals.filter((_, i) => i !== index);
    onChange({
      ...scenario,
      config: { ...config, salaries: newSalaries, fhssIndividuals: newIndividuals },
    });
  };

  const updateIndividual = (index, value) => {
    const updated = [...paddedIndividuals];
    updated[index] = parseNum(value);
    const { salaries: s } = ensureArrays(paddedSalaries, updated);
    onChange({
      ...scenario,
      config: { ...config, fhssIndividuals: ensureArrays(s, updated).fhssIndividuals, salaries: s },
    });
  };

  const updateSalary = (index, value) => {
    const updated = [...paddedSalaries];
    updated[index] = parseNum(value);
    const { fhssIndividuals: ind } = ensureArrays(updated, paddedIndividuals);
    onChange({
      ...scenario,
      config: { ...config, salaries: ensureArrays(updated, ind).salaries, fhssIndividuals: ind },
    });
  };

  const combinedAnnualIncome = paddedSalaries.reduce((sum, s) => sum + (s || 0), 0);
  const showPersonLabels = personCount > 1;

  return (
    <div className="border border-border rounded-lg p-4 bg-card shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <input
          value={scenario.name}
          onChange={(e) => onChange({ ...scenario, name: e.target.value })}
          className="text-lg font-semibold border-b border-transparent hover:border-border focus:border-primary focus:outline-none px-1 bg-transparent text-card-foreground"
        />
        {!isBaseline && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive text-sm transition-colors">
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Property Price ($)</span>
          <input
            type="number"
            min="0"
            value={config.propertyPrice}
            onChange={(e) => update('propertyPrice', parseNum(e.target.value))}
            className={inputClass}
          />
        </label>

        <div>
          <div className="flex items-center justify-between">
            <span className={labelClass}>Cash Deposit ($)</span>
            {config.propertyPrice > 0 && (
              <button
                onClick={() => update('deposit', Math.round(config.propertyPrice * 0.2))}
                className="text-xs px-2 py-0.5 rounded border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                20%
              </button>
            )}
          </div>
          <input
            type="number"
            min="0"
            value={config.deposit}
            onChange={(e) => update('deposit', parseNum(e.target.value))}
            className={inputClass}
          />
        </div>

        {/* Salary Info Header */}
        <div>
          <span className={labelClass}>Pre-tax Salary</span>
          <div className="mt-1">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1 px-2 text-xs text-muted-foreground font-medium w-8"></th>
                  {Array.from({ length: personCount }, (_, i) => (
                    <th key={i} className="text-center py-1 px-2 text-xs text-muted-foreground font-medium">
                      {showPersonLabels ? `P${i + 1}` : ''}
                    </th>
                  ))}
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 px-2 text-xs text-muted-foreground">Salary</td>
                  {Array.from({ length: personCount }, (_, i) => (
                    <td key={i} className="py-1 px-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="95,000"
                        value={paddedSalaries[i] || ''}
                        onChange={(e) => updateSalary(i, e.target.value)}
                        className={compactInputClass}
                      />
                    </td>
                  ))}
                  <td className="py-1 px-1">
                    {personCount < 2 && (
                      <button onClick={addIndividual} className="text-primary hover:text-primary/80 text-xs" title="Add individual">+</button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            {personCount >= 2 && (
              <div className="flex items-center justify-between mt-1">
                <button onClick={() => removeIndividual(personCount - 1)} className="text-xs text-destructive hover:text-destructive/80">
                  Remove P{personCount}
                </button>
                <button onClick={addIndividual} className="text-xs text-primary hover:underline">
                  + Add individual
                </button>
              </div>
            )}
            {combinedAnnualIncome > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Combined: <span className="text-card-foreground font-medium">${Math.round(combinedAnnualIncome).toLocaleString()}/yr</span>
              </p>
            )}
          </div>
        </div>

        {/* FHSS Section */}
        <div>
          <button
            onClick={() => setShowFhss(!showFhss)}
            className="text-sm text-primary hover:underline"
          >
            {showFhss ? 'Hide' : 'Add'} FHSS Super Saver
          </button>

          {showFhss && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-1 px-2 text-xs text-muted-foreground w-8"></td>
                    {Array.from({ length: personCount }, (_, i) => (
                      <td key={i} className="text-center py-1 px-2 text-xs text-muted-foreground font-medium">
                        {showPersonLabels ? `P${i + 1}` : ''}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap">FHSS $</td>
                    {Array.from({ length: personCount }, (_, i) => (
                      <td key={i} className="py-1 px-1">
                        <input
                          type="number"
                          min="0"
                          placeholder="Amount"
                          value={paddedIndividuals[i] || ''}
                          onChange={(e) => updateIndividual(i, e.target.value)}
                          className={compactInputClass}
                        />
                      </td>
                    ))}
                  </tr>
                  {/* FHSS net results per person */}
                  {fhssResult && paddedIndividuals.some((a) => a > 0) && (
                    <tr>
                      <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap">Net</td>
                      {fhssResult.individuals.map((r, i) => (
                        <td key={i} className="py-1 px-1 text-center">
                          {r.netWithdrawal > 0 ? (
                            <span>
                              <span className="text-primary font-medium text-xs">${Math.round(r.netWithdrawal).toLocaleString()}</span>
                              {r.effectiveTaxRate > 0 && (
                                <span className="text-[10px] text-muted-foreground ml-0.5">({r.effectiveTaxRate.toFixed(1)}%)</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>

              {/* FHSS Advanced toggle */}
              <button
                onClick={() => {
                  const newVal = !showFhssAdvanced;
                  setShowFhssAdvanced(newVal);
                  update('fhssAdvanced', newVal);
                }}
                className="text-xs text-muted-foreground hover:text-primary transition-colors block mt-2"
              >
                {showFhssAdvanced ? 'Hide' : 'Show'} advanced tax calculation
              </button>

              {showFhssAdvanced && (
                <div className="mt-2 p-2 bg-background rounded border border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    Withdrawal-year salary per individual. Defaults to salary above (or median $95,000).
                  </p>
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap w-8"></td>
                        {Array.from({ length: personCount }, (_, i) => (
                          <td key={i} className="text-center py-1 px-2 text-xs text-muted-foreground font-medium">
                            {showPersonLabels ? `P${i + 1}` : ''}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap">W/draw $</td>
                        {Array.from({ length: personCount }, (_, i) => (
                          <td key={i} className="py-1 px-1">
                            <input
                              type="number"
                              min="0"
                              placeholder={String(paddedSalaries[i] || 95000)}
                              value={config.fhssWithdrawalSalaries?.[i] || ''}
                              onChange={(e) => {
                                const updated = [...(config.fhssWithdrawalSalaries || Array(personCount).fill(''))];
                                updated[i] = parseNum(e.target.value);
                                update('fhssWithdrawalSalaries', updated);
                              }}
                              className={compactInputClass}
                            />
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                  <a
                    href="https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline block mt-2"
                  >
                    ATO FHSS scheme info ↗
                  </a>
                </div>
              )}

              {/* Combined net for couples */}
              {fhssResult && paddedIndividuals.some((a) => a > 0) && personCount > 1 && combinedNet > 0 && (
                <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                  Combined net: <span className="text-primary font-semibold">${Math.round(combinedNet).toLocaleString()}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Total deposit summary */}
        {(combinedNet > 0 || config.deposit > 0) && (
          <p className="text-sm text-muted-foreground">
            Total deposit: <span className="text-card-foreground font-semibold">${Math.round(effectiveDeposit).toLocaleString()}</span>
            {combinedNet > 0 && <span className="text-muted-foreground"> (cash + FHSS)</span>}
          </p>
        )}

        <label className="block">
          <span className={labelClass}>Interest Rate (%)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={config.annualRate}
            onChange={(e) => update('annualRate', parseNum(e.target.value))}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Loan Term (years)</span>
          <input
            type="number"
            min="0"
            value={config.termYears}
            onChange={(e) => update('termYears', parseNum(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 text-sm text-primary hover:underline"
      >
        {showAdvanced ? 'Hide' : 'Show'} advanced options
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <label className="block">
            <span className={labelClass}>Offset Balance ($)</span>
            <input
              type="number"
              min="0"
              value={config.offsetBalance}
              onChange={(e) => update('offsetBalance', parseNum(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Offset grows by $/month</span>
            <input
              type="number"
              min="0"
              value={config.offsetMonthlyGrowth}
              onChange={(e) => update('offsetMonthlyGrowth', parseNum(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Offset grows by %/year</span>
            <input
              type="number"
              min="0"
              step="0.1"
              value={config.offsetAnnualGrowth}
              onChange={(e) => update('offsetAnnualGrowth', parseNum(e.target.value))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Extra Monthly Repayment ($)</span>
            <input
              type="number"
              min="0"
              value={config.extraMonthly}
              onChange={(e) => update('extraMonthly', parseNum(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default ScenarioConfig;
