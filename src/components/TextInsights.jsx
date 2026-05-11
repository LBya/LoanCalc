function TextInsights({ insights }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-2 text-card-foreground">Key Insights</h2>
        <p className="text-muted-foreground">Add scenarios with different settings to see comparison insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <h2 className="text-lg font-semibold mb-3 text-card-foreground">Key Insights</h2>
      <ul className="list-none p-0">
        {insights.map((insight, index) => (
          <li key={index} className="py-2 px-3 border-l-4 border-primary mb-2 bg-muted text-card-foreground rounded-r-md">
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TextInsights;
