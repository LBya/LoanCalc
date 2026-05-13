import { useState } from 'react';
import ScenarioConfig, { defaultConfig } from './components/ScenarioConfig';
import ComparisonTable from './components/ComparisonTable';
import BalanceChart from './components/BalanceChart';
import TextInsights from './components/TextInsights';
import ThemeToggle from './components/ThemeToggle';
import { useCalculator } from './hooks/useCalculator';
import { convertRepayment, frequencyLabel } from './engine/amortization';

const scenarioNames = ['Scenario A', 'Scenario B', 'Scenario C', 'Scenario D'];

function App() {
  const [scenarios, setScenarios] = useState([
    { name: 'Scenario A', config: { ...defaultConfig } },
  ]);
  const [frequency, setFrequency] = useState('monthly');
  const [visibleScenarios, setVisibleScenarios] = useState([true, true, true, true]);

  const { computedScenarios, comparison, insights } = useCalculator(
    scenarios.map((s) => ({
      ...s,
      config: { ...s.config, annualRate: s.config.annualRate / 100 },
    }))
  );

  const addScenario = (copyBaseline = false) => {
    if (scenarios.length >= 4) return;
    const baseConfig = copyBaseline ? { ...scenarios[0].config } : { ...defaultConfig };
    setScenarios((prev) => [
      ...prev,
      { name: scenarioNames[prev.length], config: baseConfig },
    ]);
  };

  const removeScenario = (index) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const updateScenario = (index, updated) => {
    setScenarios((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const toggleScenarioVisibility = (index) => {
    setVisibleScenarios((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const exportLog = () => {
    const log = {
      frequency,
      scenarios: computedScenarios.map((cs, i) => ({
        name: cs.name,
        inputs: scenarios[i].config,
        fhbss: cs.fhssResult || null,
        outputs: {
          monthlyRepayment: cs.result.monthlyRepayment,
          totalInterest: cs.result.totalInterest,
          totalPaid: cs.result.totalPaid,
          loanTermMonths: cs.result.schedule.length,
        },
        schedulePreview: {
          first3: cs.result.schedule.slice(0, 3),
          last3: cs.result.schedule.slice(-3),
        },
      })),
      comparison: comparison.summary,
      insights,
    };

    const text = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API unavailable — log to console as fallback
      console.log('LoanCalc Export (clipboard unavailable):\n', text);
    });
  };

  // Convert summary for selected frequency
  const frequencySummary = comparison.summary.map((s) => ({
    ...s,
    repayment: convertRepayment(s.monthlyRepayment, frequency),
    repaymentLabel: frequencyLabel(frequency),
  }));

  const frequencies = ['monthly', 'fortnightly', 'weekly'];

  return (
    <div className="min-h-screen w-full bg-background text-foreground p-3 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-2xl font-bold text-foreground">LoanCalc</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLog}
            className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-border bg-card hover:bg-accent text-card-foreground text-xs sm:text-sm font-medium transition-colors"
          >
            Export Log
          </button>
          <ThemeToggle />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        <aside className="flex flex-col lg:flex-col gap-4 lg:w-[400px] lg:shrink-0">
          {scenarios.map((scenario, index) => (
            <div key={index} className="lg:min-w-0">
              <ScenarioConfig
                scenario={scenario}
                isBaseline={index === 0}
                onChange={(updated) => updateScenario(index, updated)}
                onRemove={() => removeScenario(index)}
                fhssResult={computedScenarios[index]?.fhssResult}
                acquisitionCosts={computedScenarios[index] ? { stampDuty: computedScenarios[index].stampDuty, lmi: computedScenarios[index].lmi } : undefined}
              />
            </div>
          ))}
          {scenarios.length < 4 && (
            <div className="flex border-2 border-dashed border-border rounded-lg overflow-hidden">
              <button
                onClick={() => addScenario(true)}
                className="flex-1 py-2 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border-r border-border"
              >
                Copy First
              </button>
              <button
                onClick={() => addScenario(false)}
                className="flex-1 py-2 text-sm text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                + Add Scenario
              </button>
            </div>
          )}
        </aside>

        <main className="flex flex-col gap-6 min-w-0 flex-1">
          {/* Frequency tabs */}
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center gap-1 mb-4 border-b border-border">
              {frequencies.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    frequency === f
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-card-foreground'
                  }`}
                >
                  {frequencyLabel(f)}
                </button>
              ))}
            </div>
            <ComparisonTable summary={frequencySummary} frequency={frequency} />
          </div>

          <BalanceChart
            trajectories={comparison.trajectories}
            offsetTrajectories={comparison.offsetTrajectories}
            visibleScenarios={visibleScenarios}
            onToggleScenario={toggleScenarioVisibility}
          />
          <TextInsights insights={insights} />
        </main>
      </div>
    </div>
  );
}

export default App;
