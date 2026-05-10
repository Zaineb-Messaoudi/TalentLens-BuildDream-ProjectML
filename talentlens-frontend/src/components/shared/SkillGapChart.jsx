import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";

export function SkillGapChart({ data }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.14)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#9fb0d1", fontSize: 12 }} />
          <Radar
            name="Candidate"
            dataKey="candidate"
            stroke="#00A8E8"
            fill="#00A8E8"
            fillOpacity={0.3}
          />
          <Radar
            name="Role"
            dataKey="role"
            stroke="#7B61FF"
            fill="#7B61FF"
            fillOpacity={0.22}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
