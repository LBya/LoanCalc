import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function getChartColor(index) {
  const colors = ['chart-1', 'chart-2', 'chart-3', 'chart-4'];
  const varName = colors[index % colors.length];
  return `var(--${varName})`;
}

function mergeTrajectories(trajectories, viewMode) {
  const maxMonths = Math.max(...trajectories.map(t => t.data.length));
  const merged = [];

  for (let month = 0; month < maxMonths; month++) {
    const entry = { month: month + 1 };
    for (const trajectory of trajectories) {
      const point = trajectory.data[month];
      const dataKey = viewMode === 'equity' ? `${trajectory.name}_equity` : trajectory.name;
      entry[dataKey] = point
        ? (viewMode === 'equity' ? point.realEquity : point.balance)
        : null;
    }
    merged.push(entry);
  }
  return merged;
}

function CustomLegend({ payload, trajectories }) {
  if (!payload || payload.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mt-2">
      {payload.map((entry) => {
        const isOffset = entry.value?.endsWith(' Offset') || entry.value?.endsWith('_equity Offset');
        return (
          <span key={entry.value} className="flex items-center gap-1.5 text-xs sm:text-sm text-card-foreground">
            <svg width="24" height="4" className="shrink-0">
              <line
                x1="0" y1="2" x2="24" y2="2"
                stroke={entry.color}
                strokeWidth={2}
                strokeDasharray={isOffset ? "4 3" : "none"}
              />
            </svg>
            {entry.value.replace('_equity', '')}
          </span>
        );
      })}
    </div>
  );
}

function useBreakpoint(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);
  return isMobile;
}

function BalanceChart({ trajectories, offsetTrajectories, visibleScenarios, onToggleScenario }) {
  const [viewMode, setViewMode] = useState('balance');
  const isMobile = useBreakpoint(640);

  if (!trajectories || trajectories.length === 0) return null;

  // Build equity versions of offset trajectories
  const equityOffsetTrajectories = (offsetTrajectories || []).map(t => ({
    ...t,
    name: `${t.name.replace(' Offset', '')}_equity Offset`,
    data: t.data, // offset trajectories don't have realEquity, but we keep them for offset balance display
  }));

  const allTrajectories = viewMode === 'equity'
    ? [...trajectories, ...equityOffsetTrajectories]
    : [...trajectories, ...(offsetTrajectories || [])];

  const hasEquityData = trajectories.some(t =>
    t.data.some(d => d.realEquity !== null && d.realEquity !== undefined)
  );

  const data = mergeTrajectories(
    viewMode === 'equity' ? trajectories : allTrajectories,
    viewMode
  );

  const formatYAxis = (value) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    if (value <= -1000000) return `-$${(Math.abs(value) / 1000000).toFixed(1)}M`;
    if (value <= -1000) return `-$${(Math.abs(value) / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  // Calculate nice Y-axis domain with padding
  const allValues = data.flatMap(d =>
    Object.entries(d)
      .filter(([key]) => key !== 'month')
      .map(([, val]) => val)
      .filter(v => v !== null && v !== undefined)
  );
  const yMin = allValues.length > 0 ? Math.min(...allValues) : 0;
  const yMax = allValues.length > 0 ? Math.max(...allValues) : 100000;
  const yPadding = (yMax - yMin) * 0.05;
  const yDomain = [Math.floor((yMin - yPadding) / 10000) * 10000, Math.ceil((yMax + yPadding) / 10000) * 10000];

  // Calculate Y-axis tick interval: aim for ~5 ticks
  const yRange = yDomain[1] - yDomain[0];
  const rawInterval = yRange / 5;
  const niceIntervals = [10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const yInterval = niceIntervals.find(n => n >= rawInterval) || 1000000;
  const yTicks = [];
  for (let v = Math.ceil(yDomain[0] / yInterval) * yInterval; v <= yDomain[1]; v += yInterval) {
    yTicks.push(v);
  }

  const maxMonth = data.length;
  // X-axis: fewer ticks on mobile, more on desktop
  const yearTicks = [];
  const maxTicks = isMobile ? 5 : 8;
  const targetInterval = maxMonth > 0 ? Math.ceil(maxMonth / 12 / maxTicks) * 12 : 12;
  const xInterval = Math.max(12, targetInterval);
  for (let m = xInterval; m < maxMonth; m += xInterval) yearTicks.push(m);
  if (yearTicks.length === 0 && maxMonth > 0) yearTicks.push(maxMonth);
  // Always include the final month if not already there
  if (yearTicks.length > 0 && yearTicks[yearTicks.length - 1] !== maxMonth) {
    yearTicks.push(maxMonth);
  }

  // Build data keys for lines
  const getLineDataKey = (trajectoryName) => {
    if (viewMode === 'equity') return `${trajectoryName}_equity`;
    return trajectoryName;
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 sm:p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold text-card-foreground">Balance Trajectory</h2>
        {hasEquityData && (
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode('balance')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'balance'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-card-foreground'
              }`}
            >
              Loan Balance
            </button>
            <button
              onClick={() => setViewMode('equity')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                viewMode === 'equity'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-card-foreground'
              }`}
            >
              Real Equity
            </button>
          </div>
        )}
      </div>

      {viewMode === 'equity' && (
        <p className="text-xs text-muted-foreground mb-3">
          Inflation-adjusted property equity (5% growth, 3.5% inflation assumption)
        </p>
      )}

      <ResponsiveContainer width="100%" height={isMobile ? 300 : 420}>
        <LineChart data={data} margin={{ bottom: isMobile ? 36 : 32, left: isMobile ? 4 : 12, top: 8, right: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            ticks={yearTicks}
            tickMargin={8}
            tickFormatter={(month) => {
              if (month === maxMonth) {
                const years = month / 12;
                return Number.isInteger(years) ? `${years}yr` : `${(month / 12).toFixed(1)}yr`;
              }
              const years = month / 12;
              return Number.isInteger(years) ? `${years}yr` : month;
            }}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            label={{ value: 'Months / Years', position: 'insideBottom', offset: 0, fill: 'var(--muted-foreground)', style: { fontSize: isMobile ? 10 : 12 } }}
            interval={0}
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="var(--muted-foreground)"
            tickMargin={4}
            width={isMobile ? 56 : 72}
            ticks={yTicks}
            domain={yDomain}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            label={{
              value: viewMode === 'equity' ? 'Real Equity' : 'Balance',
              angle: -90,
              position: 'insideLeft',
              offset: isMobile ? 4 : 10,
              fill: 'var(--muted-foreground)',
              style: { fontSize: isMobile ? 10 : 12 },
            }}
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
          <Legend content={<CustomLegend trajectories={trajectories} />} />
          {/* Balance / Equity lines */}
          {trajectories.map((t, index) => (
            <Line
              key={`${t.name}-${viewMode}`}
              type="monotone"
              dataKey={getLineDataKey(t.name)}
              stroke={getChartColor(index)}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              hide={visibleScenarios && !visibleScenarios[index]}
            />
          ))}
          {/* Offset lines (dashed) — only in balance mode */}
          {viewMode === 'balance' && (offsetTrajectories || []).map((t, index) => {
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
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 border-t border-border pt-3">
          {trajectories.map((t, index) => {
            const visible = visibleScenarios ? visibleScenarios[index] : true;
            return (
              <button
                key={t.name}
                onClick={() => onToggleScenario(index)}
                className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 rounded-full text-xs sm:text-sm border transition-colors ${
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
