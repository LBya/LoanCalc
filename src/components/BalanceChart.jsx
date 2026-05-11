import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04'];

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

function BalanceChart({ trajectories }) {
  if (!trajectories || trajectories.length === 0) return null;

  const data = mergeTrajectories(trajectories);

  const formatYAxis = (value) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
    return `$${value}`;
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-4">Balance Trajectory</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            label={{ value: 'Months', position: 'insideBottom', offset: -5 }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            label={{ value: 'Balance', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            formatter={(value) => value !== null ? `$${Math.round(value).toLocaleString()}` : 'Paid off'}
            labelFormatter={(month) => `Month ${month}`}
          />
          <Legend />
          {trajectories.map((t, index) => (
            <Line
              key={t.name}
              type="monotone"
              dataKey={t.name}
              stroke={COLORS[index]}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BalanceChart;
