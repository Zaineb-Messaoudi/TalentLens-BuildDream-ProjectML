import { useEffect, useState } from "react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { SalaryEstimator } from "../../components/shared/SalaryEstimator.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getFrontendBootstrap, getSalaryPrediction } from "../../services/talentlensService.jsx";

export function SalaryCheckPage() {
  const [prediction, setPrediction] = useState(null);
  const [source, setSource] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ experience_levels: [], education_levels: [], company_sizes: [], remote_modes: [], industries: [], default_inputs: {} });
  const [form, setForm] = useState({
    experience_level: "",
    years_experience: 0,
    education_required: "",
    remote_ratio: 50,
    benefits_score: 0,
    industry: "",
    company_size: "",
  });

  async function runPrediction(payload = form) {
    setLoading(true);
    const result = await getSalaryPrediction({
      ...payload,
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
      benefits_score: Number(payload.benefits_score),
    });
    setPrediction(result.data);
    setSource(result.source);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      const nextOptions = response.data.form_options || {};
      const defaults = nextOptions.default_inputs?.salary_check || {};
      setOptions(nextOptions);
      setForm(defaults);
      runPrediction(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Salary Inputs" subtitle="Adjust your profile and run a live salary prediction">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runPrediction();
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.experience_level} onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}>
            {(options.experience_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="40" value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Years experience" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.education_required} onChange={(event) => setForm((current) => ({ ...current, education_required: event.target.value }))}>
            {(options.education_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.remote_ratio} onChange={(event) => setForm((current) => ({ ...current, remote_ratio: event.target.value }))}>
            {(options.remote_modes || []).map((item) => <option key={item.value} value={item.value} className="bg-surface">{item.label}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="10" step="0.1" value={form.benefits_score} onChange={(event) => setForm((current) => ({ ...current, benefits_score: event.target.value }))} placeholder="Benefits score" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}>
            {(options.industries || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.company_size} onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}>
            {(options.company_sizes || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <Button className="w-full" type="submit">{loading ? "Running..." : "Run Prediction"}</Button>
        </form>
      </AnalyticsCard>

      <SalaryEstimator
        prediction={{
          base: prediction?.predicted_salary || 0,
          low: prediction?.confidence_low || 0,
          high: prediction?.confidence_high || 0,
          negotiationLow: prediction?.negotiation_low || 0,
          negotiationHigh: prediction?.negotiation_high || 0,
        }}
        history={prediction?.salary_progression || []}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <AnalyticsCard title="Percentile Ranking" subtitle={`Source: ${source}`}>
          <div className="text-5xl font-semibold text-text">{Math.round(prediction?.percentile_position || 0)}th</div>
          <p className="mt-3 text-sm leading-7 text-muted">{prediction?.insight || "Awaiting backend salary estimate."}</p>
        </AnalyticsCard>
        <AnalyticsCard title="Negotiation Readiness">
          <div className="text-5xl font-semibold text-text">{source === "backend" ? "Live" : "Offline"}</div>
          <p className="mt-3 text-sm leading-7 text-muted">Use the predicted range and percentile band to anchor compensation discussions.</p>
        </AnalyticsCard>
        <AnalyticsCard title="Factor Importance">
          <div className="space-y-3">
            {(prediction?.factor_importance || []).slice(0, 3).map((item) => (
              <div key={item.feature}>
                <div className="flex justify-between text-sm text-muted"><span>{item.feature.replace(/_/g, " ")}</span><span>{item.importance}</span></div>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${item.importance}%` }} />
                </div>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
