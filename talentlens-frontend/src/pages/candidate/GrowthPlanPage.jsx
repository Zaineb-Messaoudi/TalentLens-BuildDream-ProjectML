import { useEffect, useState } from "react";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { CareerPathSimulator } from "../../components/shared/CareerPathSimulator.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getCareerOptimization, getFrontendBootstrap } from "../../services/talentlensService.jsx";

export function GrowthPlanPage() {
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ experience_levels: [], remote_modes: [], default_inputs: {} });
  const [form, setForm] = useState({
    job_title: "",
    years_experience: 0,
    experience_level: "",
    remote_ratio: 50,
  });

  async function runOptimization(payload = form) {
    setLoading(true);
    const response = await getCareerOptimization({
      ...payload,
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
    });
    setResult(response.data);
    setSource(response.source);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      const nextOptions = response.data.form_options || {};
      const defaults = nextOptions.default_inputs?.growth_plan || {};
      setOptions(nextOptions);
      setForm(defaults);
      runOptimization(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  const scenarios = (result?.counterfactuals || []).map((item) => ({
    scenario: item.scenario,
    salary: item.new_salary,
    demand: item.new_demand,
    deltaSalary: item.delta_salary,
    summary: `${item.scenario} changes demand by ${item.delta_demand}.`,
  }));

  const shapFactors = (result?.top_shap_factors || []).map((item) => ({
    factor: item.feature,
    impact: Math.min(100, Math.round(item.importance)),
  }));

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Growth Simulation Inputs" subtitle="Run the career optimizer with your target role profile">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runOptimization();
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.job_title} onChange={(event) => setForm((current) => ({ ...current, job_title: event.target.value }))} placeholder="Job title" />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="40" value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Years experience" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.experience_level} onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}>
            {(options.experience_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.remote_ratio} onChange={(event) => setForm((current) => ({ ...current, remote_ratio: event.target.value }))}>
            {(options.remote_modes || []).map((item) => <option key={item.value} value={item.value} className="bg-surface">{item.label}</option>)}
          </select>
          <Button type="submit" className="w-full">{loading ? "Optimizing..." : "Run Optimizer"}</Button>
        </form>
      </AnalyticsCard>

      <CareerPathSimulator scenarios={scenarios.length ? scenarios : [{ scenario: "Waiting for backend", salary: 0, demand: 0, deltaSalary: 0, summary: "No counterfactuals returned yet." }]} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <AnalyticsCard title="SHAP-style Explainability" subtitle={`Which factors move salary and demand the most (${source})`}>
          <div className="space-y-4">
            {shapFactors.map((item) => (
              <div key={item.factor}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text">{item.factor}</span>
                  <span className="text-muted">{item.impact}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${item.impact}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
        <AIAnalysisPanel
          title="AI-generated Action Plan"
          summary={result?.growth_recommendation || "Awaiting backend growth recommendation."}
          bullets={(result?.counterfactuals || []).slice(0, 3).map((item) => `${item.scenario}: salary delta ${item.delta_salary >= 0 ? "+" : ""}$${Number(item.delta_salary).toLocaleString()}`)}
        />
      </div>
    </div>
  );
}
