import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function getChartColor(index) {
  const colors = ['chart-1', 'chart-2', 'chart-3', 'chart-4'];
  const varName = colors[index % colors.length];
  return `var(--${varName})`;
}

function mergeTrajectories(trajectories) {
  const maxMonths = Math.max(...trajectories.map(t => t.data.length));
  const merged = [];

  for (let month = 0; month < maxMonths; month++) {
    const entry = { month: month + 1 };
    for (const trajectory of trajectories) {
      const point = trajectory.data[month];
      entry[trajectory.name] = point ? point.balance : null;
    }
    merged.push(entry);
  }
  return merged;
}

function BalanceChart({ trajectories, offsetTrajectories, visibleScenarios, onToggleScenario }) {
  if (!trajectories || trajectories.length === 0) return null;

  // Merge balance trajectories + offset trajectories
  const allTrajectories = [...trajectories, ...(offsetTrajectories || [])];
  const data = mergeTrajectories(allTrajectories);

  const formatYAxis = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  // Map offset trajectory index to its parent scenario index for visibility
  const offsetCount = offsetTrajectories?.length || 0;

  // Build explicit tick arrays for dual x-axis
  const maxMonth = data.length;
  const yearTicks = [];
  for (let m = 12; m < maxMonth; m += 12) yearTicks.push(m);

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-card-foreground">Balance Trajectory</h2>
      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={data} margin={{ bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          {/* Month axis (top) - ticks every 12 months, showing month number within year */}
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            ticks={yearTicks}
            tickFormatter={(month) => month}
            tick={{ fontSize: 11 }}
          />
          {/* Year axis (bottom) - ticks at same positions, showing year label */}
          <XAxis
            dataKey="month"
            xAxisId="years"
            orientation="bottom"
            stroke="var(--muted-foreground)"
            ticks={yearTicks}
            tickFormatter={(month) => `${month / 12}yr`}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Months / Years', position: 'insideBottom', offset: -5, fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="var(--muted-foreground)"
            label={{ value: 'Balance', angle: -90, position: 'insideLeft', fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            formatter={(value) => value !== null ? `$${Math.round(value).toLocaleString()}` : 'Paid off'}
            labelFormatter={(month) => {
              const years = Math.floor(month / 12);
              const remain = month % 12;
              if (years > 0 && remain > 0) return `Month ${month} (${years}yr ${remain}mo)`;
              if (years > 0) return `Month ${month} (${years}yr)`;
              return `Month ${month}`;
            }}
            contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
          />
          <Legend />
          {/* Balance lines */}
          {trajectories.map((t, index) => (
            <Line
              key={t.name}
              type="monotone"
              dataKey={t.name}
              stroke={getChartColor(index)}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              hide={visibleScenarios && !visibleScenarios[index]}
            />
          ))}
          {/* Offset lines (dashed) */}
          {(offsetTrajectories || []).map((t, index) => {
            // Find parent scenario index for visibility
            const parentIndex = trajectories.findIndex(
              (bt) => t.name === `${bt.name} Offset`
            );
            return (
              <Line
                key={t.name}
                type="monotone"
                dataKey={t.name}
                stroke={getChartColor(parentIndex >= 0 ? parentIndex : index)}
                strokeWidth={1.5}
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
                hide={visibleScenarios && parentIndex >= 0 && !visibleScenarios[parentIndex]}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {onToggleScenario && (
        <div className="flex flex-wrap gap-2 mt-3 border-t border-border pt-3">
          {trajectories.map((t, index) => {
            const visible = visibleScenarios ? visibleScenarios[index] : true;
            return (
              <button
                key={t.name}
                onClick={() => onToggleScenario(index)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors ${
                  visible
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getChartColor(index), opacity: visible ? 1 : 0.4 }}
                />
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BalanceChart;
