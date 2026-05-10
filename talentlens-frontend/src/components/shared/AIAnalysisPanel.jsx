import { Sparkles, WandSparkles } from "lucide-react";
import { AnalyticsCard } from "./AnalyticsCard.jsx";
import { Badge } from "../ui/Badge.jsx";

export function AIAnalysisPanel({ title = "AI Analysis", summary, bullets }) {
  return (
    <AnalyticsCard
      title={title}
      subtitle="Model-backed interpretation designed for non-technical hiring teams"
      actions={<Badge tone="purple">Notion AI style briefing</Badge>}
    >
      <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-accent/10 via-transparent to-primary/10 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-text">Executive Summary</p>
            <p className="text-xs text-muted">Generated in business language</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-7 text-muted">{summary}</p>
      </div>
      <div className="mt-5 space-y-3">
        {bullets.map((item) => (
          <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <p className="text-sm leading-6 text-text/90">{item}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}
