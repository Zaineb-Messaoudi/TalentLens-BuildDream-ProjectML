import { useEffect, useState } from "react";
import { BriefcaseBusiness, Compass, Sparkles, Wallet } from "lucide-react";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { KPIWidget } from "../../components/shared/KPIWidget.jsx";
import { InsightCard } from "../../components/shared/InsightCard.jsx";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { getCandidateHome } from "../../services/talentlensService.jsx";

export function CandidateHome() {
  const [home, setHome] = useState(null);

  useEffect(() => {
    let active = true;
    getCandidateHome().then((response) => {
      if (!active) return;
      setHome(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const kpis = home?.kpis || [];
  const insights = home?.insights || [];
  const topRecommendations = home?.top_recommendations || [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.26em] text-muted">Welcome back</p>
        <h1 className="mt-3 text-4xl font-semibold">{home?.greeting || "Your career momentum is accelerating"}</h1>
      </div>
      <div className="grid gap-5 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <KPIWidget
            key={item.label}
            label={item.label}
            value={item.value}
            delta={item.delta}
            helper={item.helper}
            icon={[Compass, BriefcaseBusiness, Wallet, Sparkles][index]}
            tone={item.tone}
          />
        ))}
      </div>
      <AnalyticsCard title="Top Recommendations" subtitle="Live suggestions from the backend recommendation engine">
        <div className="grid gap-4 lg:grid-cols-3">
          {topRecommendations.map((job) => (
            <div key={job.rank} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-medium text-text">{job.job_title}</p>
                  <p className="text-sm text-muted">{job.industry}</p>
                </div>
                <Badge tone="cyan">{job.match_score}%</Badge>
              </div>
              <p className="mt-4 text-sm text-muted">
                ${Number(job.salary_usd).toLocaleString()} • {job.remote_ratio === 100 ? "Remote" : job.remote_ratio === 50 ? "Hybrid" : "On-site"}
              </p>
            </div>
          ))}
        </div>
      </AnalyticsCard>
      <div className="grid gap-6 xl:grid-cols-3">
        {insights.slice(0, 3).map((item) => (
          <InsightCard
            key={item.title}
            eyebrow={item.eyebrow}
            title={item.title}
            body={item.body}
            metric={item.metric}
            tone={item.tone}
            action="market view"
          />
        ))}
      </div>
      <AIAnalysisPanel
        title="Personal AI Brief"
        summary={insights[0]?.body || "Awaiting backend candidate insight."}
        bullets={topRecommendations.slice(0, 3).map((job) => `${job.job_title} at ${job.industry}`)}
      />
    </div>
  );
}
