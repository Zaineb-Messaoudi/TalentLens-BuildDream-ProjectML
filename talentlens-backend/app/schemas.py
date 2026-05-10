"""
TalentLens — API Schemas (Pydantic v2 compatible)
"""

from __future__ import annotations
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ── Shared enums / literals ──────────────────────────────────────────────────

EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Executive Level"]
REMOTE_OPTIONS    = [0, 50, 100]


# ══════════════════════════════════════════════════════════════════════════
#  DSO1 — Anomaly Detection
# ══════════════════════════════════════════════════════════════════════════

class AnomalyRequest(BaseModel):
    salary_usd: float         = Field(..., ge=0,    description="Proposed salary in USD")
    years_experience: float   = Field(..., ge=0, le=40)
    remote_ratio: int         = Field(..., ge=0, le=100)
    benefits_score: float     = Field(..., ge=0, le=10)
    experience_level: str     = Field(..., description="Entry Level / Mid Level / Senior Level / Executive Level")

class AnomalyResponse(BaseModel):
    is_anomaly: bool
    risk_label: str           # GREEN / YELLOW / RED
    risk_message: str
    anomaly_score: float      # raw isolation forest score (more negative = more anomalous)
    market_median: float
    deviation_pct: float      # % deviation from market median
    insight: str
    recommendations: List[str] = []


# ══════════════════════════════════════════════════════════════════════════
#  DSO2 — Salary Prediction
# ══════════════════════════════════════════════════════════════════════════

class SalaryRequest(BaseModel):
    experience_level: str   = Field(..., description="Entry Level / Mid Level / Senior Level / Executive Level")
    years_experience: float = Field(..., ge=0, le=40)
    education_required: str = Field(..., description="Associate / Bachelor / Master / PhD")
    remote_ratio: int       = Field(50, ge=0, le=100)
    benefits_score: float   = Field(5.0, ge=0, le=10)
    industry: Optional[str] = Field(None, description="e.g. Technology, Finance, Healthcare")
    company_size: str       = Field("Medium", description="Small / Medium / Large")
    company_location: Optional[str] = Field(None)
    employee_residence: Optional[str] = Field(None)

class SalaryResponse(BaseModel):
    predicted_salary: float
    confidence_low: float
    confidence_high: float
    market_median: float
    percentile_position: float    # 0–100 where this prediction sits
    comparison_by_level: Dict[str, float]
    negotiation_low: float
    negotiation_high: float
    top_factors: List[str]
    factor_importance: List[Dict[str, Any]] = []
    salary_progression: List[Dict[str, Any]] = []
    insight: str


# ══════════════════════════════════════════════════════════════════════════
#  DSO3 — Market Segmentation
# ══════════════════════════════════════════════════════════════════════════

class SegmentRequest(BaseModel):
    salary_usd: float         = Field(..., ge=0)
    years_experience: float   = Field(..., ge=0, le=40)
    remote_ratio: int         = Field(50, ge=0, le=100)
    benefits_score: float     = Field(5.0, ge=0, le=10)
    experience_level: str     = Field(..., description="Entry Level / Mid Level / Senior Level / Executive Level")

class SegmentInfo(BaseModel):
    cluster_id: int
    name: str
    pct_market: float
    avg_salary: float
    avg_years_exp: float
    avg_remote: float
    top_skills: List[str]

class SegmentResponse(BaseModel):
    assigned_segment: SegmentInfo
    all_segments: List[SegmentInfo]
    peer_comparison: str     # human-readable insight sentence
    market_overview: str


# ══════════════════════════════════════════════════════════════════════════
#  DSO4 — Job Recommender
# ══════════════════════════════════════════════════════════════════════════

class RecommendRequest(BaseModel):
    years_experience: float   = Field(..., ge=0, le=40)
    experience_level: str     = Field(..., description="Entry Level / Mid Level / Senior Level / Executive Level")
    remote_ratio: int         = Field(50, ge=0, le=100)
    benefits_score: float     = Field(5.0, ge=0, le=10)
    education_required: str   = Field("Bachelor", description="Associate / Bachelor / Master / PhD")
    preferred_industry: Optional[str] = Field(None)
    top_k: int                = Field(5, ge=1, le=20)

class JobCard(BaseModel):
    rank: int
    job_title: str
    experience_level: str
    industry: str
    salary_usd: int
    remote_ratio: int
    years_experience: int
    benefits_score: float
    match_score: float        # 0–100
    match_label: str          # Excellent / Good / Fair
    skills_required: List[str]

class RecommendResponse(BaseModel):
    jobs: List[JobCard]
    profile_summary: str
    total_candidates: int


# ══════════════════════════════════════════════════════════════════════════
#  DSO5 — Career Optimizer
# ══════════════════════════════════════════════════════════════════════════

class CareerRequest(BaseModel):
    job_title: str            = Field("Data Scientist")
    years_experience: float   = Field(..., ge=0, le=40)
    experience_level: str     = Field(..., description="Entry Level / Mid Level / Senior Level / Executive Level")
    remote_ratio: int         = Field(50, ge=0, le=100)
    counterfactuals: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="List of what-if scenarios, e.g. [{'feature': 'years_experience', 'delta': 5}]"
    )

class CounterfactualResult(BaseModel):
    scenario: str
    feature: str
    delta: float
    new_salary: float
    delta_salary: float
    new_demand: float
    delta_demand: float

class CareerResponse(BaseModel):
    predicted_salary: float
    predicted_demand: float
    demand_label: str            # Low / Medium / High
    top_shap_factors: List[Dict[str, Any]]
    counterfactuals: List[CounterfactualResult]
    growth_recommendation: str
    market_segment_hint: str


# ══════════════════════════════════════════════════════════════════════════
#  Health / Info
# ══════════════════════════════════════════════════════════════════════════

class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
    dataset_size: int
    version: str = "1.0.0"


class KpiItem(BaseModel):
    label: str
    value: str
    delta: str
    helper: str
    tone: str = "cyan"


class TrendPoint(BaseModel):
    label: str
    metric_a: float
    metric_b: float


class InsightItem(BaseModel):
    eyebrow: str
    title: str
    body: str
    metric: str
    tone: str = "cyan"


class NotificationItem(BaseModel):
    title: str
    message: str
    timestamp: str
    priority: str = "medium"


class TestimonialItem(BaseModel):
    name: str
    company: str
    quote: str


class PlatformOverviewResponse(BaseModel):
    hero_stats: List[KpiItem]
    landing_insights: List[InsightItem]
    notifications: List[NotificationItem]
    testimonials: List[TestimonialItem]
    salary_trend: List[Dict[str, Any]] = []
    demand_forecast: List[ForecastPoint] = []


class RecruiterDashboardResponse(BaseModel):
    kpis: List[KpiItem]
    hiring_velocity: List[TrendPoint]
    pipeline_mix: Dict[str, int]
    insights: List[InsightItem]


class CandidateHomeResponse(BaseModel):
    greeting: str
    kpis: List[KpiItem]
    top_recommendations: List[JobCard]
    insights: List[InsightItem]


class WorkforceOverviewResponse(BaseModel):
    kpis: List[KpiItem]
    segment_distribution: List[SegmentInfo]
    notifications: List[NotificationItem]
    insights: List[InsightItem]


class CompensationAuditRow(BaseModel):
    role: str
    team: str
    salary: str
    anomaly: str
    severity: str
    market_median: float
    deviation_pct: float


class CompensationAuditPreviewResponse(BaseModel):
    rows: List[CompensationAuditRow]
    summary: str
    summary_bullets: List[str] = []


class ForecastPoint(BaseModel):
    month: str
    actual: float
    forecast: float


class ScatterPoint(BaseModel):
    salary: float
    demand: float
    size: float
    label: str


class HeatmapPoint(BaseModel):
    name: str
    demand: float
    supply: float


class SkillGapPoint(BaseModel):
    skill: str
    candidate: float
    role: float


class MarketPulseResponse(BaseModel):
    market_heat: List[HeatmapPoint]
    segmentation_scatter: List[ScatterPoint]
    demand_forecast: List[ForecastPoint]


class CandidateFitResponse(BaseModel):
    score: float
    role_title: str
    market_salary: float
    salary_compatibility: str
    experience_alignment: float
    readiness_timeline: str
    skill_gap: List[SkillGapPoint]
    insight: str


class HiringSignalsResponse(BaseModel):
    demand_forecast: List[ForecastPoint]
    insights: List[InsightItem]


class NavItem(BaseModel):
    label: str
    href: str
    icon: str


class NavGroup(BaseModel):
    title: str
    items: List[NavItem]


class FeatureItem(BaseModel):
    title: str
    metric: str
    description: str
    icon_key: str
    tint: str


class ShellProfile(BaseModel):
    name: str
    role: str


class ShellCard(BaseModel):
    badge: str
    title: str
    message: str


class ShellNotification(BaseModel):
    title: str
    message: str
    timestamp: str


class FormOptionsResponse(BaseModel):
    experience_levels: List[str]
    education_levels: List[str]
    company_sizes: List[str]
    remote_modes: List[Dict[str, Any]]
    industries: List[str]
    default_inputs: Dict[str, Dict[str, Any]]


class FrontendBootstrapResponse(BaseModel):
    navigation: List[NavGroup]
    landing_features: List[FeatureItem]
    preview_portals: List[str]
    search_placeholder: str
    profile: ShellProfile
    sidebar_card: ShellCard
    assistant_card: ShellCard
    notifications: List[ShellNotification]
    form_options: FormOptionsResponse
