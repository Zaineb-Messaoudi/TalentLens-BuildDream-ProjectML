import { useEffect, useState } from "react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { ClusterPosition } from "../../components/shared/ClusterPosition.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getFrontendBootstrap, getSegmentAssignment } from "../../services/talentlensService.jsx";

export function MarketPositionPage() {
  const [label, setLabel] = useState("Market segment");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ experience_levels: [], remote_modes: [], default_inputs: {} });
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState({
    salary_usd: 0,
    years_experience: 0,
    remote_ratio: 50,
    benefits_score: 0,
    experience_level: "",
  });

  async function runAssignment(payload = form) {
    setLoading(true);
    const response = await getSegmentAssignment({
      ...payload,
      salary_usd: Number(payload.salary_usd),
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
      benefits_score: Number(payload.benefits_score),
    });
    setLabel(response.data.assigned_segment?.name || "Market segment");
    setSegments(
      (response.data.all_segments || []).map((item) => ({
        salary: item.avg_salary,
        demand: item.avg_remote,
        size: item.pct_market * 10,
        label: item.name,
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      const nextOptions = response.data.form_options || {};
      const defaults = nextOptions.default_inputs?.market_position || {};
      setOptions(nextOptions);
      setForm(defaults);
      runAssignment(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Segment Inputs" subtitle="Place a profile into the live market segmentation model">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runAssignment();
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
          <Button type="submit" className="xl:col-span-5">{loading ? "Mapping..." : "Map Position"}</Button>
        </form>
      </AnalyticsCard>
      <ClusterPosition data={segments} focusLabel={label} />
    </div>
  );
}
