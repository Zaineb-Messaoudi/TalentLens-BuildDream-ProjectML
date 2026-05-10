import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { getHiringSignals } from "../../services/talentlensService.jsx";

export function HiringSignalsPage() {
  const [signals, setSignals] = useState(null);

  useEffect(() => {
    let active = true;
    getHiringSignals().then((response) => {
      if (!active) return;
      setSignals(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const insights = signals?.insights || [];

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Hiring Demand Forecasting" subtitle="Forward-looking signal layer derived from posting activity">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={signals?.demand_forecast || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
              <Line type="monotone" dataKey="actual" stroke="#00A8E8" strokeWidth={3} />
              <Line type="monotone" dataKey="forecast" stroke="#7B61FF" strokeWidth={3} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsCard>
      <AIAnalysisPanel
        title="Hiring Signals Brief"
        summary={insights[0]?.body || "Forecasting suggests elevated pressure in production AI and analytics roles."}
        bullets={insights.map((item) => item.title)}
      />
    </div>
  );
}
