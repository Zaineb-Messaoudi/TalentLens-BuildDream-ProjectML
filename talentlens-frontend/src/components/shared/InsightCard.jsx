import { ArrowUpRight } from "lucide-react";
import { GlassPanel } from "./GlassPanel.jsx";
import { Badge } from "../ui/Badge.jsx";

export function InsightCard({ eyebrow, title, body, tone = "cyan", metric, action }) {
  return (
    <GlassPanel className="h-full">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge tone={tone}>{eyebrow}</Badge>
          <h3 className="mt-4 text-xl font-semibold text-text">{title}</h3>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted">{body}</p>
      <div className="mt-6 flex items-end justify-between">
        <div className="text-3xl font-semibold text-text">{metric}</div>
        <span className="text-xs uppercase tracking-[0.24em] text-muted">{action}</span>
      </div>
    </GlassPanel>
  );
}
