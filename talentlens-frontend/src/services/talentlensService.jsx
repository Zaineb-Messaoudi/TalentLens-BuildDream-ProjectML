import { api } from "./api.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function fetchJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    throw new Error(`request failed for ${path}`);
  }
  return response.json();
}

let bootstrapPromise = null;

const emptyBootstrap = {
  navigation: [],
  landing_features: [],
  preview_portals: [],
  search_placeholder: "Search views, metrics, segments, or AI job signals",
  profile: { name: "TalentLens User", role: "Platform User" },
  sidebar_card: { badge: "AI Copilot", title: "Market summary", message: "Backend data is unavailable." },
  assistant_card: { badge: "AI Assistant", title: "Live market guidance", message: "Backend data is unavailable." },
  notifications: [],
  form_options: {
    experience_levels: [],
    education_levels: [],
    company_sizes: [],
    remote_modes: [],
    industries: [],
    default_inputs: {},
  },
};

export async function getFrontendBootstrap() {
  if (!bootstrapPromise) {
    bootstrapPromise = fetchJson("/api/frontend/bootstrap")
      .then((data) => ({ data, source: "backend" }))
      .catch(() => ({ data: emptyBootstrap, source: "fallback" }));
  }
  return bootstrapPromise;
}

export async function getHealth() {
  try {
    const data = await fetchJson("/health");
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        status: "offline",
        models_loaded: [],
        dataset_size: 0,
        version: "unavailable",
      },
    };
  }
}

async function fetchResource(path, emptyData) {
  try {
    const data = await fetchJson(path);
    return { data, source: "backend" };
  } catch {
    return { data: emptyData, source: "fallback" };
  }
}

export function getPlatformOverview() {
  return fetchResource("/api/platform/overview", {
    hero_stats: [],
    landing_insights: [],
    notifications: [],
    testimonials: [],
    salary_trend: [],
    demand_forecast: [],
  });
}

export function getRecruiterDashboard() {
  return fetchResource("/api/recruiter/dashboard", {
    kpis: [],
    hiring_velocity: [],
    pipeline_mix: {},
    insights: [],
  });
}

export function getCandidateHome() {
  return fetchResource("/api/candidate/home", {
    greeting: "",
    kpis: [],
    top_recommendations: [],
    insights: [],
  });
}

export function getWorkforceOverview() {
  return fetchResource("/api/admin/workforce", {
    kpis: [],
    segment_distribution: [],
    notifications: [],
    insights: [],
  });
}

export function getMarketPulse() {
  return fetchResource("/api/recruiter/market-pulse", {
    market_heat: [],
    segmentation_scatter: [],
    demand_forecast: [],
  });
}

export async function getCandidateFit(payload) {
  try {
    const data = await fetchJson("/api/recruiter/candidate-fit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        score: 0,
        role_title: "Candidate Fit Score",
        market_salary: 0,
        salary_compatibility: "Unknown",
        experience_alignment: 0,
        readiness_timeline: "Unknown",
        skill_gap: [],
        insight: "",
      },
    };
  }
}

export function getHiringSignals() {
  return fetchResource("/api/admin/hiring-signals", {
    demand_forecast: [],
    insights: [],
  });
}

export async function getSalaryPrediction(payload) {
  try {
    const data = await api.salaryPredict(payload);
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        predicted_salary: 0,
        confidence_low: 0,
        confidence_high: 0,
        market_median: 0,
        percentile_position: 0,
        comparison_by_level: {},
        negotiation_low: 0,
        negotiation_high: 0,
        top_factors: [],
        factor_importance: [],
        salary_progression: [],
        insight: "",
      },
    };
  }
}

export async function getAnomalyCheck(payload) {
  try {
    const data = await api.anomalyCheck(payload);
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        is_anomaly: false,
        risk_label: "UNKNOWN",
        risk_message: "Unavailable",
        anomaly_score: 0,
        market_median: 0,
        deviation_pct: 0,
        insight: "",
        recommendations: [],
      },
    };
  }
}

export async function getJobRecommendations(payload) {
  try {
    const data = await api.recommendJobs(payload);
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        jobs: [],
        profile_summary: "",
        total_candidates: 0,
      },
    };
  }
}

export async function getCareerOptimization(payload) {
  try {
    const data = await api.careerOptimize(payload);
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        predicted_salary: 0,
        predicted_demand: 0,
        demand_label: "Unknown",
        top_shap_factors: [],
        counterfactuals: [],
        growth_recommendation: "",
        market_segment_hint: "",
      },
    };
  }
}

export async function getSegmentAssignment(payload) {
  try {
    const data = await api.segmentAssign(payload);
    return { data, source: "backend" };
  } catch {
    return {
      source: "fallback",
      data: {
        assigned_segment: null,
        all_segments: [],
        peer_comparison: "",
        market_overview: "",
      },
    };
  }
}

export async function getCompensationAuditPreview() {
  try {
    const data = await fetchJson("/api/admin/compensation-audit-preview");
    return { source: "backend", data };
  } catch {
    return {
      source: "fallback",
      data: {
        rows: [],
        summary: "",
        summary_bullets: [],
      },
    };
  }
}
