import { useEffect, useState } from "react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getFrontendBootstrap, getJobRecommendations } from "../../services/talentlensService.jsx";

export function JobMatchesPage() {
  const [result, setResult] = useState({ jobs: [] });
  const [source, setSource] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState({ experience_levels: [], education_levels: [], remote_modes: [], industries: [], default_inputs: {} });
  const [form, setForm] = useState({
    years_experience: 0,
    experience_level: "",
    remote_ratio: 50,
    benefits_score: 0,
    education_required: "",
    preferred_industry: "",
    top_k: 5,
  });

  async function runRecommendations(payload = form) {
    setLoading(true);
    const response = await getJobRecommendations({
      ...payload,
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
      benefits_score: Number(payload.benefits_score),
      top_k: Number(payload.top_k),
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
      const defaults = nextOptions.default_inputs?.job_matches || {};
      setOptions(nextOptions);
      setForm(defaults);
      runRecommendations(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Recommendation Inputs" subtitle="Tune your profile and fetch live job matches">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runRecommendations();
          }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="40" value={form.years_experience} onChange={(event) => setForm((current) => ({ ...current, years_experience: event.target.value }))} placeholder="Years experience" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.experience_level} onChange={(event) => setForm((current) => ({ ...current, experience_level: event.target.value }))}>
            {(options.experience_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.remote_ratio} onChange={(event) => setForm((current) => ({ ...current, remote_ratio: event.target.value }))}>
            {(options.remote_modes || []).map((item) => <option key={item.value} value={item.value} className="bg-surface">{item.label}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="0" max="10" step="0.1" value={form.benefits_score} onChange={(event) => setForm((current) => ({ ...current, benefits_score: event.target.value }))} placeholder="Benefits score" />
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.education_required} onChange={(event) => setForm((current) => ({ ...current, education_required: event.target.value }))}>
            {(options.education_levels || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <select className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" value={form.preferred_industry} onChange={(event) => setForm((current) => ({ ...current, preferred_industry: event.target.value }))}>
            {(options.industries || []).map((item) => <option key={item} value={item} className="bg-surface">{item}</option>)}
          </select>
          <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-text outline-none" type="number" min="1" max="20" value={form.top_k} onChange={(event) => setForm((current) => ({ ...current, top_k: event.target.value }))} placeholder="Top K" />
          <Button type="submit" className="w-full">{loading ? "Matching..." : "Find Matches"}</Button>
        </form>
      </AnalyticsCard>

      <AnalyticsCard title="Top Job Matches" subtitle={`Rich match cards with fit, salary, and skill context (${source})`}>
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {result.jobs.map((job) => (
            <div key={`${job.rank}-${job.job_title}`} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-text">{job.job_title}</h3>
                  <p className="mt-1 text-sm text-muted">{job.industry}</p>
                </div>
                <Badge tone="cyan">{job.match_score}% match</Badge>
              </div>
              <div className="mt-5 flex items-center gap-3 text-sm text-muted">
                <span>${Number(job.salary_usd).toLocaleString()}</span>
                <span>•</span>
                <span>{job.remote_ratio === 100 ? "Remote" : job.remote_ratio === 50 ? "Hybrid" : "On-site"}</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {job.skills_required.map((skill) => (
                  <Badge key={skill} tone="purple">{skill}</Badge>
                ))}
              </div>
              <div className="mt-5 rounded-[24px] border border-warning/20 bg-warning/10 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-warning">Match label</p>
                <p className="mt-2 text-sm text-text">{job.match_label}</p>
              </div>
            </div>
          ))}
        </div>
      </AnalyticsCard>
    </div>
  );
}
