import { useEffect, useState } from "react";
import { AnalyticsCard } from "../../components/shared/AnalyticsCard.jsx";
import { MatchScoreCard } from "../../components/shared/MatchScoreCard.jsx";
import { SkillGapChart } from "../../components/shared/SkillGapChart.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { getCandidateFit, getFrontendBootstrap } from "../../services/talentlensService.jsx";

export function CandidateFitPage() {
  const [fit, setFit] = useState(null);
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

  async function runFit(payload = form) {
    setLoading(true);
    const response = await getCandidateFit({
      ...payload,
      years_experience: Number(payload.years_experience),
      remote_ratio: Number(payload.remote_ratio),
      benefits_score: Number(payload.benefits_score),
      top_k: Number(payload.top_k || 5),
    });
    setFit(response.data);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      const nextOptions = response.data.form_options || {};
      const defaults = nextOptions.default_inputs?.candidate_fit || {};
      setOptions(nextOptions);
      setForm(defaults);
      runFit(defaults);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <AnalyticsCard title="Candidate Fit Inputs" subtitle="Generate a backend-derived fit profile for a target hiring lane">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runFit();
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
          <Button type="submit" className="w-full">{loading ? "Scoring..." : "Score Candidate"}</Button>
        </form>
      </AnalyticsCard>
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <MatchScoreCard score={Math.round(fit?.score || 0)} title={fit?.role_title || "Candidate Fit Score"} description={fit?.insight || "Awaiting backend fit analysis."} />
        <AnalyticsCard title="Skill Gap Comparison" subtitle="Backend-derived candidate versus role fit profile">
          <SkillGapChart data={fit?.skill_gap || []} />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Salary compatibility</p>
              <p className="mt-2 text-2xl text-text">{fit?.salary_compatibility || "Unknown"}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Experience alignment</p>
              <p className="mt-2 text-2xl text-text">{fit?.experience_alignment || 0} / 10</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-muted">Readiness timeline</p>
              <p className="mt-2 text-2xl text-text">{fit?.readiness_timeline || "Unknown"}</p>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
