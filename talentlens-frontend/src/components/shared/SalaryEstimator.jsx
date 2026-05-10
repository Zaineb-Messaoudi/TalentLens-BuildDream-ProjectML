import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoney } from "../../lib/utils.jsx";
import { AnalyticsCard } from "./AnalyticsCard.jsx";
import { Badge } from "../ui/Badge.jsx";

export function SalaryEstimator({ prediction, history }) {
  return (
    <AnalyticsCard
      title="Salary Estimator"
      subtitle="Predicted compensation range with confidence bands"
      actions={<Badge tone="cyan">98% calibration</Badge>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="salaryArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A8E8" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#00A8E8" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "#101C30",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                }}
              />
              <Area type="monotone" dataKey="salary" stroke="#00A8E8" fill="url(#salaryArea)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-muted">Predicted Base</p>
            <div className="mt-2 text-4xl font-semibold text-text">{formatMoney(prediction.base)}</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Confidence Interval</p>
              <p className="mt-2 text-lg text-text">
                {formatMoney(prediction.low)} to {formatMoney(prediction.high)}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Negotiation Zone</p>
              <p className="mt-2 text-lg text-text">
                {formatMoney(prediction.negotiationLow)} to {formatMoney(prediction.negotiationHigh)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}
