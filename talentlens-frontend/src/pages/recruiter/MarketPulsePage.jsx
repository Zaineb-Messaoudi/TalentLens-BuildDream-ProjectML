import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { getMarketPulse } from "../../services/talentlensService.jsx";

export function MarketPulsePage() {
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    let active = true;
    getMarketPulse().then((response) => {
      if (!active) return;
      setPulse(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AnalyticsCard title="Skills Demand Heatmap" subtitle="High-demand lanes derived from the indexed skills market">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pulse?.market_heat || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
              <Bar dataKey="demand" fill="#00A8E8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="supply" fill="#7B61FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsCard>

      <AnalyticsCard title="Segment Distribution" subtitle="Scatter mapping from backend segment summaries">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="salary" tick={{ fill: "#8ea0c3" }} />
              <YAxis dataKey="demand" tick={{ fill: "#8ea0c3" }} />
              <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
              <Scatter data={pulse?.segmentation_scatter || []} fill="#00A8E8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsCard>

      <AnalyticsCard title="Remote Work Trend" subtitle="Monthly hiring signal and forecast derived from posting activity" className="xl:col-span-2">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pulse?.demand_forecast || []}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8ea0c3" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }} />
              <Line type="monotone" dataKey="actual" stroke="#00A8E8" strokeWidth={3} />
              <Line type="monotone" dataKey="forecast" stroke="#7B61FF" strokeWidth={3} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnalyticsCard>
    </div>
  );
}
