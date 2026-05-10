import { useEffect, useState } from "react";
import { AlertTriangle, Gauge, ShieldCheck } from "lucide-react";
import { AIAnalysisPanel } from "../../components/shared/AIAnalysisPanel.jsx";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { AnomalyBadge } from "../../components/shared/AnomalyBadge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getAnomalyCheck, getFrontendBootstrap } from "../../services/talentlensService.jsx";

export function OfferIntelligencePage() {
  const [result, setResult] = useState(null);
  const [source, setSource] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ experience_levels: [], remote_modes: [], default_inputs: {} });
  const [form, setForm] = useState({
    salary_usd: 0,
    years_experience: 0,
    remote_ratio: 50,
    benefits_score: 0,
    experience_level: "",
  });

  async function runAnalysis(payload = form) {
    setLoading(true);
    const response = await getAnomalyCheck({
      ...payload,
      salary_usd: Number(payload.salary_usd),
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
      benefits_score: Number(payload.benefits_score),
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
      const defaults = nextOptions.default_inputs?.offer_intelligence || {};
      setOptions(nextOptions);
      setForm(defaults);
      runAnalysis(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Offer Inputs" subtitle="Submit a real offer package to the anomaly engine">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runAnalysis();
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        >
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" value={form.salary_usd} onChange={(event) => setForm((current) => ({ ...current, salary_usd: event.target.value }))} placeholder="Salary USD" />
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="40" value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Years experience" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.remote_ratio} onChange={(event) => setForm((current) => ({ ...current, remote_ratio: event.target.value }))}>
            {(options.remote_modes || []).map((item) => <option key={item.value} value={item.value} className="bg-surface">{item.label}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="10" step="0.1" value={form.benefits_score} onChange={(event) => setForm((current) => ({ ...current, benefits_score: event.target.value }))} placeholder="Benefits score" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.experience_level} onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}>
            {(options.experience_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <Button type="submit" className="xl:col-span-5">{loading ? "Analyzing..." : "Analyze Offer"}</Button>
        </form>
      </AnalyticsCard>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <AnalyticsCard title="Offer Risk Status" subtitle="Traffic-light risk system with anomaly visualization">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-danger/20 bg-danger/10 p-6">
              <AnomalyBadge label={result?.risk_label || "UNKNOWN"} message={result?.risk_message || "Unavailable"} />
              <div className="mt-5 text-6xl font-semibold text-danger">{result?.deviation_pct || 0}%</div>
              <p className="mt-3 text-sm leading-7 text-muted">
                {result?.insight || "Awaiting backend anomaly analysis."}
              </p>
            </div>
            <div className="grid gap-4">
              {[
                ["Market median", `$${Number(result?.market_median || 0).toLocaleString()}`, ShieldCheck],
                ["Offered salary", `$${Number(form.salary_usd || 0).toLocaleString()}`, AlertTriangle],
                ["Calibration score", source === "backend" ? "Live API" : "Offline", Gauge],
              ].map(([label, value, Icon]) => (
                <div key={label} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3"><Icon className="h-4 w-4 text-primary" /></div>
                    <span className="text-sm text-muted">{label}</span>
                  </div>
                  <span className="text-lg font-semibold text-text">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </AnalyticsCard>

        <AIAnalysisPanel
          title="Offer Analysis Drawer"
          summary={result?.insight || "Awaiting backend anomaly analysis."}
          bullets={result?.recommendations || []}
        />
      </div>
    </div>
  );
}
