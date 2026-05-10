import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { AnalyticsCard } from "./AnalyticsCard.jsx";

export function ClusterPosition({ data, focusLabel }) {
  return (
    <AnalyticsCard title="Cluster Position" subtitle="Market segment mapping across salary, demand, and remote intensity">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 16, bottom: 16, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="salary" name="Salary" tick={{ fill: "#8ea0c3" }} stroke="rgba(255,255,255,0.12)" />
            <YAxis dataKey="demand" name="Demand" tick={{ fill: "#8ea0c3" }} stroke="rgba(255,255,255,0.12)" />
            <ZAxis dataKey="size" range={[80, 360]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#101C30",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "18px",
              }}
            />
            <Scatter data={data} fill="#00A8E8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4 text-sm text-muted">
        Focus cluster: <span className="text-text">{focusLabel}</span>
      </p>
    </AnalyticsCard>
  );
}
