import { useState } from 'react';
import { calculateStampDuty } from '../engine/acquisition';

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const defaultConfig = {
  propertyPrice: 600000,
  deposit: 100000,
  annualRate: 6.5,
  termYears: 30,
  state: 'NSW',
  isFHB: true,
  app1Salary: 0,
  app1Fhss: 0,
  app2Salary: 0,
  app2Fhss: 0,
  offsetBalance: 0,
  offsetMonthlyGrowth: 0,
  offsetAnnualGrowth: 0,
  extraMonthly: 0,
  fhssAdvanced: false,
  repaymentFrequency: 'monthly',
};

export { defaultConfig };

function ScenarioConfig({ scenario, isBaseline, onChange, onRemove, fhssResult, acquisitionCosts }) {
  const config = scenario.config;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFhss, setShowFhss] = useState(
    (config.app1Fhss > 0) || (config.app2Fhss > 0)
  );
  const [showFhssAdvanced, setShowFhssAdvanced] = useState(config.fhssAdvanced || false);
  const [showApp2, setShowApp2] = useState((config.app2Salary > 0) || (config.app2Fhss > 0));

  const update = (field, value) => {
    onChange({ ...scenario, config: { ...config, [field]: value } });
  };

  const parseNum = (value) => value === '' ? '' : Number(value);

  const inputClass = "block w-full border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";
  const labelClass = "text-sm font-medium text-muted-foreground";
  const compactInputClass = "w-full border border-border rounded px-2 py-1 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";

  const combinedNet = fhssResult?.combinedNetWithdrawal ?? 0;
  const stampDuty = acquisitionCosts?.stampDuty ?? 0;
  const lmi = acquisitionCosts?.lmi ?? 0;
  const effectiveDeposit = config.deposit + combinedNet - stampDuty;

  const combinedAnnualIncome = (config.app1Salary || 0) + (config.app2Salary || 0);

  // Determine which FHSS person is which index in the result
  const fhssPersonCount = (showApp2 || config.app2Fhss > 0) ? 2 : 1;

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
              <div className="flex gap-1">
                <button
                  onClick={() => update('deposit', Math.round(config.propertyPrice * 0.2))}
                  className="text-xs px-2 py-0.5 rounded border border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  20%
                </button>
                <button
                  onClick={() => {
                    const sd = calculateStampDuty(config.propertyPrice, config.state || 'NSW', config.isFHB !== false);
                    update('deposit', Math.round(config.propertyPrice * 0.2 + sd));
                  }}
                  className="text-xs px-2 py-0.5 rounded border border-primary text-primary hover:bg-primary/10 transition-colors"
                >
                  20% + SD
                </button>
              </div>
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

        {/* State & FHB */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={labelClass}>State</span>
            <select
              value={config.state || 'NSW'}
              onChange={(e) => update('state', e.target.value)}
              className={inputClass}
            >
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>First Home Buyer</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={config.isFHB !== false}
                onChange={(e) => update('isFHB', e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground">Eligible for exemptions</span>
            </div>
          </label>
        </div>

        {/* Acquisition cost badges */}
        {(stampDuty > 0 || lmi > 0) && (
          <div className="flex flex-wrap gap-2">
            {stampDuty > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                Stamp Duty: ${Math.round(stampDuty).toLocaleString()}
              </span>
            )}
            {lmi > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                LMI: ${Math.round(lmi).toLocaleString()}
              </span>
            )}
          </div>
        )}
        {stampDuty === 0 && config.isFHB && config.propertyPrice > 0 && (
          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Stamp Duty: $0 (FHB exempt)
          </span>
        )}

        {/* Applicant 1 */}
        <div>
          <span className={labelClass}>Applicant 1</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <input
              type="number"
              min="0"
              placeholder="Pre-tax Salary"
              value={config.app1Salary || ''}
              onChange={(e) => update('app1Salary', parseNum(e.target.value))}
              className={compactInputClass}
            />
            {showFhss && (
              <input
                type="number"
                min="0"
                placeholder="FHSS Amount"
                value={config.app1Fhss || ''}
                onChange={(e) => update('app1Fhss', parseNum(e.target.value))}
                className={compactInputClass}
              />
            )}
          </div>
          {showFhss && fhssResult?.individuals?.[0]?.netWithdrawal > 0 && config.app1Fhss > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              FHSS net: <span className="text-primary font-medium">${Math.round(fhssResult.individuals[0].netWithdrawal).toLocaleString()}</span>
              {fhssResult.individuals[0].effectiveTaxRate > 0 && (
                <span className="text-muted-foreground ml-1">({fhssResult.individuals[0].effectiveTaxRate.toFixed(1)}% tax)</span>
              )}
            </p>
          )}
        </div>

        {/* Applicant 2 (Optional) */}
        {!showApp2 ? (
          <button onClick={() => setShowApp2(true)} className="text-sm text-primary hover:underline">
            + Add Applicant 2
          </button>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <span className={labelClass}>Applicant 2 (Optional)</span>
              <button
                onClick={() => {
                  setShowApp2(false);
                  update('app2Salary', 0);
                  update('app2Fhss', 0);
                }}
                className="text-xs text-destructive hover:text-destructive/80"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                min="0"
                placeholder="Pre-tax Salary"
                value={config.app2Salary || ''}
                onChange={(e) => update('app2Salary', parseNum(e.target.value))}
                className={compactInputClass}
              />
              {showFhss && (
                <input
                  type="number"
                  min="0"
                  placeholder="FHSS Amount"
                  value={config.app2Fhss || ''}
                  onChange={(e) => update('app2Fhss', parseNum(e.target.value))}
                  className={compactInputClass}
                />
              )}
            </div>
            {showFhss && fhssResult?.individuals?.[1]?.netWithdrawal > 0 && config.app2Fhss > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                FHSS net: <span className="text-primary font-medium">${Math.round(fhssResult.individuals[1].netWithdrawal).toLocaleString()}</span>
                {fhssResult.individuals[1].effectiveTaxRate > 0 && (
                  <span className="text-muted-foreground ml-1">({fhssResult.individuals[1].effectiveTaxRate.toFixed(1)}% tax)</span>
                )}
              </p>
            )}
          </div>
        )}

        {/* Combined income display */}
        {combinedAnnualIncome > 0 && (
          <p className="text-xs text-muted-foreground">
            Combined: <span className="text-card-foreground font-medium">${Math.round(combinedAnnualIncome).toLocaleString()}/yr</span>
          </p>
        )}

        {/* FHSS toggle */}
        {!showFhss && (
          <button
            onClick={() => setShowFhss(true)}
            className="text-sm text-primary hover:underline"
          >
            Add FHSS Super Saver
          </button>
        )}

        {showFhss && (
          <div className="p-3 bg-muted rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-card-foreground">FHSS Super Saver</span>
              <button
                onClick={() => {
                  setShowFhss(false);
                  update('app1Fhss', 0);
                  update('app2Fhss', 0);
                }}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Hide
              </button>
            </div>

            {/* FHSS Advanced toggle */}
            <button
              onClick={() => {
                const newVal = !showFhssAdvanced;
                setShowFhssAdvanced(newVal);
                update('fhssAdvanced', newVal);
              }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors block mb-2"
            >
              {showFhssAdvanced ? 'Hide' : 'Show'} advanced tax calculation
            </button>

            {showFhssAdvanced && (
              <div className="p-2 bg-background rounded border border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Withdrawal-year salary per applicant. Defaults to salary above (or median $95,000).
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder={`Withdraw salary (P1)`}
                    value={config.fhssWithdrawalSalaries?.[0] || ''}
                    onChange={(e) => {
                      const updated = [...(config.fhssWithdrawalSalaries || ['', ''])];
                      updated[0] = parseNum(e.target.value);
                      update('fhssWithdrawalSalaries', updated);
                    }}
                    className={compactInputClass}
                  />
                  {showApp2 && (
                    <input
                      type="number"
                      min="0"
                      placeholder={`Withdraw salary (P2)`}
                      value={config.fhssWithdrawalSalaries?.[1] || ''}
                      onChange={(e) => {
                        const updated = [...(config.fhssWithdrawalSalaries || ['', ''])];
                        updated[1] = parseNum(e.target.value);
                        update('fhssWithdrawalSalaries', updated);
                      }}
                      className={compactInputClass}
                    />
                  )}
                </div>
                <a
                  href="https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/first-home-super-saver-scheme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline block mt-2"
                >
                  ATO FHSS scheme info
                </a>
              </div>
            )}

            {/* Combined net display */}
            {fhssResult && combinedNet > 0 && (
              <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                Combined net: <span className="text-primary font-semibold">${Math.round(combinedNet).toLocaleString()}</span>
              </p>
            )}
          </div>
        )}

        {/* Total deposit summary */}
        {(combinedNet > 0 || config.deposit > 0) && (
          <p className="text-sm text-muted-foreground">
            Effective deposit: <span className="text-card-foreground font-semibold">${Math.round(effectiveDeposit).toLocaleString()}</span>
            {combinedNet > 0 && <span className="text-muted-foreground"> (cash + FHSS - stamp duty)</span>}
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
