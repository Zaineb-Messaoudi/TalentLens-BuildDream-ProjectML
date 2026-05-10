import { motion } from "framer-motion";
import { GlassPanel } from "./GlassPanel.jsx";
import { Badge } from "../ui/Badge.jsx";

export function MatchScoreCard({ score, title, description }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <GlassPanel className="flex h-full flex-col justify-between">
      <div>
        <Badge tone="purple">{title}</Badge>
        <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="mt-4 flex items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-40 w-40 -rotate-90">
            <circle cx="80" cy="80" r="54" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
            <motion.circle
              cx="80"
              cy="80"
              r="54"
              stroke="url(#score-gradient)"
              strokeWidth="14"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="score-gradient">
                <stop offset="0%" stopColor="#00A8E8" />
                <stop offset="100%" stopColor="#7B61FF" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold text-text">{score}</span>
            <span className="text-xs uppercase tracking-[0.24em] text-muted">Match</span>
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
