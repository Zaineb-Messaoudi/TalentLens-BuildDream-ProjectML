import { useState } from "react";
import { motion } from "framer-motion";
import { AnalyticsCard } from "./AnalyticsCard.jsx";
import { formatMoney } from "../../lib/utils.jsx";

export function CareerPathSimulator({ scenarios }) {
  const [active, setActive] = useState(0);
  const current = scenarios[active];

  return (
    <AnalyticsCard title="Career Path Simulator" subtitle="Counterfactual salary and demand shifts under alternate moves">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-3">
          {scenarios.map((item, index) => (
            <button
              key={item.scenario}
              onClick={() => setActive(index)}
              className={`w-full rounded-[24px] border p-4 text-left transition ${
                index === active
                  ? "border-primary/40 bg-primary/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <p className="text-sm font-medium text-text">{item.scenario}</p>
              <p className="mt-1 text-xs text-muted">
                {item.deltaSalary > 0 ? "+" : ""}
                {formatMoney(item.deltaSalary)} salary impact
              </p>
            </button>
          ))}
        </div>
        <motion.div
          key={current.scenario}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-white/10 bg-gradient-to-br from-primary/10 to-accent/10 p-6"
        >
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Selected Scenario</p>
          <h3 className="mt-3 text-2xl font-semibold text-text">{current.scenario}</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-background/40 p-5">
              <p className="text-sm text-muted">Projected Salary</p>
              <p className="mt-2 text-3xl font-semibold text-text">{formatMoney(current.salary)}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-background/40 p-5">
              <p className="text-sm text-muted">Demand Score</p>
              <p className="mt-2 text-3xl font-semibold text-text">{current.demand}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">{current.summary}</p>
        </motion.div>
      </div>
    </AnalyticsCard>
  );
}
