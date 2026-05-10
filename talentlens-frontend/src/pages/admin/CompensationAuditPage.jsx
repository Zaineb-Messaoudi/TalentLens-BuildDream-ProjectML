import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { AnomalyBadge } from "../../components/shared/AnomalyBadge.jsx";
import { getCompensationAuditPreview } from "../../services/talentlensService.jsx";

export function CompensationAuditPage() {
  const [audit, setAudit] = useState({ rows: [], summary: "", summary_bullets: [] });
  const [source, setSource] = useState("loading");

  useEffect(() => {
    let active = true;
    getCompensationAuditPreview().then((response) => {
      if (!active) return;
      setAudit(response.data);
      setSource(response.source);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Compensation Audit" subtitle={`CSV intake with anomaly review, severity routing, and AI interpretation (${source})`}>
        <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-center">
          <Upload className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-4 text-lg font-medium text-text">Drag and drop compensation CSV</p>
          <p className="mt-2 text-sm text-muted">Audit roles, salary bands, and segment outliers in one executive-grade workflow.</p>
        </div>
        <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-muted">{audit.summary}</div>
        <div className="mt-6 space-y-4">
          {audit.rows.map((row) => (
            <div key={`${row.role}-${row.salary}`} className="grid gap-4 rounded-[24px] border border-white/10 bg-white/5 p-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto] md:items-center">
              <div>
                <p className="font-medium text-text">{row.role}</p>
                <p className="text-sm text-muted">{row.team}</p>
              </div>
              <div className="text-sm text-muted">{row.salary}</div>
              <div className="text-sm text-muted">{row.anomaly}</div>
              <AnomalyBadge label={row.severity} message={row.severity} />
            </div>
          ))}
        </div>
      </AnalyticsCard>
      <AIAnalysisPanel
        title="Audit Summary"
        summary={audit.summary || "Awaiting backend audit summary."}
        bullets={audit.summary_bullets || []}
      />
    </div>
  );
}
