import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Bot, BriefcaseBusiness, Users, Zap } from "lucide-react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { InsightCard } from "../../components/shared/InsightCard.jsx";
import { KPIWidget } from "../../components/shared/KPIWidget.jsx";
import { getRecruiterDashboard } from "../../services/talentlensService.jsx";

export function RecruiterDashboard() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;
    getRecruiterDashboard().then((response) => {
      if (!active) return;
      setDashboard(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const kpis = dashboard?.kpis || [];
  const hiringVelocity = (dashboard?.hiring_velocity || []).map((item) => ({
    month: item.label,
    velocity: item.metric_a,
    pipeline: item.metric_b,
  }));
  const donutData = Object.entries(dashboard?.pipeline_mix || {}).map(([name, value], index) => ({
    name,
    value,
    fill: ["#00A8E8", "#7B61FF", "#00875A", "#E07B00"][index % 4],
  }));
  const insights = dashboard?.insights || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-4">
        {kpis.map((item, index) => (
          <KPIWidget
            key={item.label}
            label={item.label}
            value={item.value}
            delta={item.delta}
            helper={item.helper}
            icon={[BriefcaseBusiness, Users, Activity, Zap][index]}
            tone={item.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <AnalyticsCard title="Hiring Velocity" subtitle="Pipeline movement across sourced and qualified talent">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hiringVelocity}>
                <defs>
                  <linearGradient id="velocityArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A8E8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00A8E8" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
                <Area type="monotone" dataKey="pipeline" stroke="#7B61FF" fillOpacity={0} strokeWidth={3} />
                <Area type="monotone" dataKey="velocity" stroke="#00A8E8" fill="url(#velocityArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Candidate Pipeline" subtitle="Weighted stage mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={5}>
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {insights.slice(0, 3).map((item) => (
          <InsightCard
            key={item.title}
            eyebrow={item.eyebrow}
            title={item.title}
            body={item.body}
            metric={item.metric}
            tone={item.tone}
            action="live signal"
          />
        ))}
      </div>

      <AIAnalysisPanel
        title="Recruiter Copilot"
        summary={insights[0]?.body || "Awaiting backend recruiter insight."}
        bullets={insights.map((item) => item.title).slice(0, 3)}
      />
    </div>
  );
}
