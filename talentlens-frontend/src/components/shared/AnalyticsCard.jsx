import { GlassPanel } from "./GlassPanel.jsx";
import { cn } from "../../lib/utils.jsx";

export function AnalyticsCard({ title, subtitle, actions, children, className, contentClassName }) {
  return (
    <GlassPanel className={cn("h-full", className)} hover={false}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className={contentClassName}>{children}</div>
    </GlassPanel>
  );
}
