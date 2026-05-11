import { useState } from 'react';

const defaultConfig = {
  propertyPrice: 600000,
  deposit: 100000,
  annualRate: 6.5,
  termYears: 30,
  offsetBalance: 0,
  extraMonthly: 0,
  lumpSums: [],
  fhbssContributions: [],
};

export { defaultConfig };

function ScenarioConfig({ scenario, isBaseline, onChange, onRemove }) {
  const config = scenario.config;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (field, value) => {
    onChange({ ...scenario, config: { ...config, [field]: value } });
  };

  const addLumpSum = () => {
    update('lumpSums', [...(config.lumpSums || []), { month: 12, amount: 0 }]);
  };

  const removeLumpSum = (index) => {
    const updated = [...config.lumpSums];
    updated.splice(index, 1);
    update('lumpSums', updated);
  };

  const updateLumpSum = (index, field, value) => {
    const updated = [...config.lumpSums];
    updated[index] = { ...updated[index], [field]: Number(value) };
    update('lumpSums', updated);
  };

  const addFhbssYear = () => {
    update('fhbssContributions', [...(config.fhbssContributions || []), 0]);
  };

  const removeFhbssYear = (index) => {
    const updated = [...config.fhbssContributions];
    updated.splice(index, 1);
    update('fhbssContributions', updated);
  };

  const updateFhbssYear = (index, value) => {
    const updated = [...config.fhbssContributions];
    updated[index] = Number(value);
    update('fhbssContributions', updated);
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <input
          value={scenario.name}
          onChange={(e) => onChange({ ...scenario, name: e.target.value })}
          className="text-lg font-semibold border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none px-1"
        />
        {!isBaseline && (
          <button onClick={onRemove} className="text-gray-400 hover:text-red-500 text-sm">
            Remove
          </button>
        )}
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Property Price ($)</span>
          <input
            type="number"
            value={config.propertyPrice}
            onChange={(e) => update('propertyPrice', Number(e.target.value))}
            className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Deposit ($)</span>
          <input
            type="number"
            value={config.deposit}
            onChange={(e) => update('deposit', Number(e.target.value))}
            className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Interest Rate (%)</span>
          <input
            type="number"
            step="0.01"
            value={config.annualRate}
            onChange={(e) => update('annualRate', Number(e.target.value))}
            className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Loan Term (years)</span>
          <input
            type="number"
            value={config.termYears}
            onChange={(e) => update('termYears', Number(e.target.value))}
            className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 text-sm text-blue-600 hover:underline"
      >
        {showAdvanced ? 'Hide' : 'Show'} advanced options
      </button>

      {showAdvanced && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Offset Balance ($)</span>
            <input
              type="number"
              value={config.offsetBalance}
              onChange={(e) => update('offsetBalance', Number(e.target.value))}
              className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Extra Monthly Repayment ($)</span>
            <input
              type="number"
              value={config.extraMonthly}
              onChange={(e) => update('extraMonthly', Number(e.target.value))}
              className="block w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
          </label>

          {/* Lump sums */}
          <div>
            <span className="text-sm font-medium text-gray-700">Lump Sum Repayments</span>
            {(config.lumpSums || []).map((ls, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Month"
                  value={ls.month}
                  onChange={(e) => updateLumpSum(i, 'month', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={ls.amount}
                  onChange={(e) => updateLumpSum(i, 'amount', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                />
                <button onClick={() => removeLumpSum(i)} className="text-red-400 hover:text-red-600 text-sm">
                  X
                </button>
              </div>
            ))}
            <button onClick={addLumpSum} className="text-sm text-blue-600 hover:underline mt-1">
              + Add lump sum
            </button>
          </div>

          {/* FHBSS */}
          <div>
            <span className="text-sm font-medium text-gray-700">FHBSS Contributions ($/year)</span>
            {(config.fhbssContributions || []).map((amount, i) => (
              <div key={i} className="flex gap-2 mt-1">
                <span className="text-sm text-gray-500 w-16">Year {i + 1}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => updateFhbssYear(i, e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm flex-1"
                />
                <button onClick={() => removeFhbssYear(i)} className="text-red-400 hover:text-red-600 text-sm">
                  X
                </button>
              </div>
            ))}
            <button onClick={addFhbssYear} className="text-sm text-blue-600 hover:underline mt-1">
              + Add year
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScenarioConfig;
