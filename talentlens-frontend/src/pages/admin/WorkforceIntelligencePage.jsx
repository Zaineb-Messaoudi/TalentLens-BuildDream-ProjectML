import { useEffect, useState } from "react";
import { Building2, Layers3, ShieldAlert, TrendingUp } from "lucide-react";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { KPIWidget } from "../../components/shared/KPIWidget.jsx";
import { ClusterPosition } from "../../components/shared/ClusterPosition.jsx";
import { getHealth, getWorkforceOverview } from "../../services/talentlensService.jsx";

export function WorkforceIntelligencePage() {
  const [health, setHealth] = useState(null);
  const [workforce, setWorkforce] = useState(null);

  useEffect(() => {
    let active = true;
    getHealth().then((response) => {
      if (!active) return;
      setHealth(response);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getWorkforceOverview().then((response) => {
      if (!active) return;
      setWorkforce(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const kpis = workforce?.kpis || [];
  const insights = workforce?.insights || [];
  const notifications = workforce?.notifications || [];
  const clusterData = (workforce?.segment_distribution || []).map((item) => ({
    salary: item.avg_salary,
    demand: item.avg_remote,
    size: item.pct_market * 10,
    label: item.name,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-4">
        {kpis.slice(0, 3).map((item, index) => (
          <KPIWidget
            key={item.label}
            label={item.label}
            value={item.value}
            delta={item.delta}
            helper={item.helper}
            icon={[ShieldAlert, TrendingUp, Layers3][index]}
            tone={item.tone}
          />
        ))}
        <KPIWidget label="API Health" value={health?.data?.status || "loading"} delta={health?.source || "checking"} helper="backend status" icon={Building2} tone="orange" />
      </div>
      <ClusterPosition data={clusterData} focusLabel={clusterData[0]?.label || "Executive AI operations cluster"} />
      <AIAnalysisPanel
        title="Executive Intelligence Brief"
        summary={insights[0]?.body || "Awaiting backend workforce insight."}
        bullets={notifications.slice(0, 3).map((item) => item.message)}
      />
    </div>
  );
}
