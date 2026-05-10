import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { GlassPanel } from "./GlassPanel.jsx";
import { Badge } from "../ui/Badge.jsx";

export function KPIWidget({ label, value, delta, icon: Icon, tone = "cyan", helper }) {
  return (
    <GlassPanel className="min-h-[168px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-4xl font-semibold tracking-tight text-text"
          >
            {value}
          </motion.h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
          <Icon className="h-5 w-5 text-text" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Badge tone={tone}>
          <TrendingUp className="mr-1 h-3.5 w-3.5" />
          {delta}
        </Badge>
        <span className="text-xs text-muted">{helper}</span>
      </div>
    </GlassPanel>
  );
}
