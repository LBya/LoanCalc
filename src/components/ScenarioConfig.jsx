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
  fhbssAmount: 0,
  repaymentFrequency: 'monthly',
};

export { defaultConfig };

function ScenarioConfig({ scenario, isBaseline, onChange, onRemove, fhbssResult }) {
  const config = scenario.config;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFhbss, setShowFhbss] = useState(config.fhbssAmount > 0);

  const update = (field, value) => {
    onChange({ ...scenario, config: { ...config, [field]: value } });
  };

  const parseNum = (value) => value === '' ? '' : Number(value);

  const inputClass = "block w-full border border-border rounded-md px-3 py-1.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent";
  const labelClass = "text-sm font-medium text-muted-foreground";

  const fhbssNet = fhbssResult?.netWithdrawal ?? 0;
  const effectiveDeposit = config.deposit + fhbssNet;

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

          {/* FHBSS sub-section under deposit */}
          <div className="mt-2">
            <button
              onClick={() => { setShowFhbss(!showFhbss); if (showFhbss && config.fhbssAmount === 0) return; }}
              className="text-sm text-primary hover:underline"
            >
              {showFhbss ? 'Hide' : 'Add'} FHBSS Super Saver
            </button>

            {showFhbss && (
              <div className="mt-2 p-3 bg-muted rounded-md space-y-2">
                <label className="block">
                  <span className={labelClass}>Amount in Super ($)</span>
                  <input
                    type="number"
                    min="0"
                    value={config.fhbssAmount}
                    onChange={(e) => update('fhbssAmount', parseNum(e.target.value))}
                    className={inputClass}
                  />
                </label>
                {config.fhbssAmount > 0 && fhbssResult && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Tax on withdrawal: <span className="text-foreground font-medium">${Math.round(fhbssResult.taxPayable).toLocaleString()}</span></p>
                    <p>Net amount for deposit: <span className="text-primary font-medium">${Math.round(fhbssNet).toLocaleString()}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>

          {(fhbssNet > 0) && (
            <p className="text-sm text-muted-foreground mt-2">
              Total deposit: <span className="text-card-foreground font-semibold">${Math.round(effectiveDeposit).toLocaleString()}</span>
              <span className="text-muted-foreground"> (cash + FHBSS)</span>
            </p>
          )}
        </div>

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
