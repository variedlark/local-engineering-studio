import type { Recommendation } from "../recommendations";

type RecommendationsPanelProps = {
  recommendations: Recommendation[];
};

function severityClass(severity: Recommendation["severity"]) {
  if (severity === "critical") {
    return "recommendation-critical";
  }
  if (severity === "warn") {
    return "recommendation-warn";
  }
  return "recommendation-info";
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  return (
    <section className="stack recommendations-panel">
      <h2 className="panel-title">Recommendations</h2>
      <p className="panel-subtle">Context-aware suggestions generated from project state.</p>
      <ul className="list recommendations-list">
        {recommendations.map((recommendation) => (
          <li
            className={`list-item recommendation-item ${severityClass(recommendation.severity)}`}
            key={recommendation.id}
          >
            <div className="recommendation-head">
              <strong>{recommendation.title}</strong>
              <span>{recommendation.severity}</span>
            </div>
            <p>{recommendation.detail}</p>
            <div className="recommendation-tags">
              {recommendation.tags.map((tag) => (
                <span className="recommendation-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
