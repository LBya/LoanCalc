function TextInsights({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Key Insights</h2>
        <p className="text-gray-400">Add scenarios with different settings to see comparison insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-3">Key Insights</h2>
      <ul className="list-none p-0">
        {insights.map((insight, index) => (
          <li key={index} className="py-2 px-3 border-l-4 border-blue-600 mb-2 bg-gray-50">
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TextInsights;
