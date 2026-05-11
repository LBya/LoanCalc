import { useState } from 'react';
import ScenarioConfig, { defaultConfig } from './components/ScenarioConfig';
import ComparisonTable from './components/ComparisonTable';
import BalanceChart from './components/BalanceChart';
import TextInsights from './components/TextInsights';
import { useCalculator } from './hooks/useCalculator';

const scenarioNames = ['Baseline', 'Scenario A', 'Scenario B', 'Scenario C'];

function App() {
  const [scenarios, setScenarios] = useState([
    {
      name: 'Baseline',
      config: { ...defaultConfig },
    },
  ]);

  const { comparison, insights } = useCalculator(
    scenarios.map((s) => ({
      ...s,
      config: { ...s.config, annualRate: s.config.annualRate / 100 },
    }))
  );

  const addScenario = () => {
    if (scenarios.length >= 4) return;
    setScenarios((prev) => [
      ...prev,
      { name: scenarioNames[prev.length], config: { ...defaultConfig } },
    ]);
  };

  const removeScenario = (index) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScenario = (index, updated) => {
    setScenarios((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">LoanCalc - Home Loan Scenario Comparison</h1>

      <div className="grid grid-cols-[384px_1fr] gap-6">
        <aside className="space-y-4 max-h-screen overflow-y-auto">
          {scenarios.map((scenario, index) => (
            <ScenarioConfig
              key={index}
              scenario={scenario}
              isBaseline={index === 0}
              onChange={(updated) => updateScenario(index, updated)}
              onRemove={() => removeScenario(index)}
            />
          ))}
          {scenarios.length < 4 && (
            <button
              onClick={addScenario}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500"
            >
              + Add Scenario
            </button>
          )}
        </aside>

        <main className="flex flex-col gap-6">
          <ComparisonTable summary={comparison.summary} />
          <BalanceChart trajectories={comparison.trajectories} />
          <TextInsights insights={insights} />
        </main>
      </div>
    </div>
  );
}

export default App;
