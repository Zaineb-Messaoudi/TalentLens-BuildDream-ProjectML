import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { SalaryEstimator } from "../../components/shared/SalaryEstimator.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getFrontendBootstrap, getSalaryPrediction } from "../../services/talentlensService.jsx";

export function PostRolePage() {
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
      const defaults = nextOptions.default_inputs?.post_role || {};
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
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AnalyticsCard title="Post a Role" subtitle="Premium intake form with live salary benchmarking">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              runPrediction();
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <input className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" type="number" min="0" max="40" value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Years experience" />
            <select className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" value={form.industry} onChange={(event) => setForm((current) => ({ ...current, industry: event.target.value }))}>
              {(options.industries || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
            </select>
            <select className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" value={form.experience_level} onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}>
              {(options.experience_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
            </select>
            <select className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" value={form.education_required} onChange={(event) => setForm((current) => ({ ...current, education_required: event.target.value }))}>
              {(options.education_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
            </select>
            <select className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" value={form.remote_ratio} onChange={(event) => setForm((current) => ({ ...current, remote_ratio: event.target.value }))}>
              {(options.remote_modes || []).map((item) => <option key={item.value} value={item.value} className="bg-surface">{item.label}</option>)}
            </select>
            <select className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none" value={form.company_size} onChange={(event) => setForm((current) => ({ ...current, company_size: event.target.value }))}>
              {(options.company_sizes || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
            </select>
            <input className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-text outline-none md:col-span-2" type="number" min="0" max="10" step="0.1" value={form.benefits_score} onChange={(event) => setForm((current) => ({ ...current, benefits_score: event.target.value }))} placeholder="Benefits score" />
            <Button type="submit" className="md:col-span-2">{loading ? "Benchmarking..." : "Benchmark Role"}</Button>
          </form>
          <div className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-text">Realtime recommendation</p>
                <p className="text-sm text-muted">{prediction?.insight || "Awaiting backend salary benchmark."}</p>
              </div>
            </div>
          </div>
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
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          ["Competitiveness meter", `${Math.min(99, Math.max(0, Math.round(prediction?.percentile_position || 0)))} / 100`, "cyan"],
          ["Market median", `$${Number(prediction?.market_median || 0).toLocaleString()}`, "orange"],
          ["Employer appeal delta", source === "backend" ? "Live API" : "Offline", "green"],
        ].map(([title, value, tone]) => (
          <AnalyticsCard key={title} title={title} actions={<Badge tone={tone}>{value}</Badge>}>
            <div className="text-sm leading-7 text-muted">
              This role specification is benchmarked against backend model output and dataset-derived market conditions.
            </div>
          </AnalyticsCard>
        ))}
      </div>
    </div>
  );
}
