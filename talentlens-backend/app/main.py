"""
TalentLens FastAPI backend.

This module exposes:
- Core ML endpoints (salary, anomaly, segmentation, recommendations, career optimization)
- Platform endpoints for recruiter, candidate, admin, and landing-page summaries
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from scipy.stats import norm

from .schemas import (
    AnomalyRequest,
    AnomalyResponse,
    CareerRequest,
    CareerResponse,
    CandidateFitResponse,
    CompensationAuditPreviewResponse,
    CompensationAuditRow,
    CounterfactualResult,
    CandidateHomeResponse,
    ForecastPoint,
    FrontendBootstrapResponse,
    HealthResponse,
    HeatmapPoint,
    HiringSignalsResponse,
    InsightItem,
    JobCard,
    KpiItem,
    MarketPulseResponse,
    NotificationItem,
    PlatformOverviewResponse,
    RecommendRequest,
    RecommendResponse,
    RecruiterDashboardResponse,
    SalaryRequest,
    SalaryResponse,
    ScatterPoint,
    SegmentInfo,
    SegmentRequest,
    SegmentResponse,
    SkillGapPoint,
    ShellCard,
    ShellNotification,
    ShellProfile,
    TestimonialItem,
    TrendPoint,
    WorkforceOverviewResponse,
    FeatureItem,
    FormOptionsResponse,
    EXPERIENCE_LEVELS,
    NavGroup,
    NavItem,
)

MODELS_DIR = Path(os.environ.get("MODELS_DIR", Path(__file__).parent.parent / "models"))
DATASET_PATH = Path(os.environ.get("DATASET_PATH", Path(__file__).parent.parent / "ai_job_dataset.csv"))


def _load(name: str):
    return joblib.load(MODELS_DIR / f"{name}.joblib")


def _cfg(name: str) -> dict:
    with open(MODELS_DIR / f"{name}.json", encoding="utf-8") as handle:
        return json.load(handle)


iso_model = _load("dso1_isolation_forest")
scaler_anom = _load("dso1_scaler")
cfg_dso1 = _cfg("dso1_config")

xgb_reg = _load("dso2_xgboost_reg")
cfg_dso2 = _cfg("dso2_config")

km_model = _load("dso3_kmeans")
scaler_clust = _load("dso3_scaler")
cfg_dso3 = _cfg("dso3_config")

knn_model = _load("dso4_knn")
scaler_rec = _load("dso4_scaler")
rec_matrix = _load("dso4_rec_matrix")
cfg_dso4 = _cfg("dso4_config")
df_orig = pd.read_parquet(MODELS_DIR / "df_orig.parquet")
df_market = pd.read_csv(DATASET_PATH, parse_dates=["posting_date", "application_deadline"])

xgb_sal = _load("dso5_xgboost_salary")
lgb_dem = _load("dso5_lgbm_demand")
tfidf_model = _load("dso5_tfidf")
cfg_dso5 = _cfg("dso5_config")

feat_cfg = _cfg("feature_config")
freq_maps: Dict[str, Dict] = json.loads((MODELS_DIR / "freq_maps.json").read_text(encoding="utf-8"))

ORDINAL_MAP = {
    "experience_level": {
        "Entry Level": 0,
        "Mid Level": 1,
        "Senior Level": 2,
        "Executive Level": 3,
    },
    "company_size": {"Small": 0, "Medium": 1, "Large": 2},
    "education_required": {"Associate": 0, "Bachelor": 1, "Master": 2, "PhD": 3},
}

EXP_CODE_TO_LABEL = {
    "EN": "Entry Level",
    "MI": "Mid Level",
    "SE": "Senior Level",
    "EX": "Executive Level",
    "Entry Level": "Entry Level",
    "Mid Level": "Mid Level",
    "Senior Level": "Senior Level",
    "Executive Level": "Executive Level",
}

COMPANY_SIZE_TO_LABEL = {
    "S": "Small",
    "M": "Medium",
    "L": "Large",
    "Small": "Small",
    "Medium": "Medium",
    "Large": "Large",
}

_loaded_models = [
    "IsolationForest",
    "XGBoostRegressor",
    "KMeans-k4",
    "KNN-Euclidean",
    "XGBoost-salary",
    "LightGBM-demand",
    "TF-IDF",
]

app = FastAPI(
    title="TalentLens ML API",
    description="AI-powered HR intelligence platform with core ML and portal summary endpoints.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _enc_exp(level: str) -> float:
    value = ORDINAL_MAP["experience_level"].get(level)
    if value is None:
        raise HTTPException(400, f"Invalid experience_level: '{level}'")
    return float(value)


def _enc_edu(edu: str) -> float:
    value = ORDINAL_MAP["education_required"].get(edu)
    if value is None:
        raise HTTPException(400, f"Invalid education_required: '{edu}'")
    return float(value)


def _freq_encode(col: str, value: str) -> float:
    return float(freq_maps.get(col, {}).get(value, 1))


def _label_exp(value: str) -> str:
    return EXP_CODE_TO_LABEL.get(value, value or "Unknown")


def _format_money(value: float) -> str:
    return f"${value:,.0f}"


def _extract_skills(skills_raw: Any) -> List[str]:
    if isinstance(skills_raw, str):
        return [item.strip() for item in skills_raw.split(",") if item.strip()]
    if isinstance(skills_raw, list):
        return [str(item).strip() for item in skills_raw if str(item).strip()]
    return []


def _top_skills(limit: int = 8) -> List[str]:
    skills = (
        df_market["required_skills"]
        .fillna("")
        .astype(str)
        .str.split(",")
        .explode()
        .str.strip()
    )
    return skills[skills != ""].value_counts().head(limit).index.tolist()


def _top_industries(limit: int = 10) -> List[str]:
    industries = df_market["industry"].fillna("").astype(str).str.strip()
    return industries[industries != ""].value_counts().head(limit).index.tolist()


def _remote_mode_label(remote_ratio: int) -> str:
    if remote_ratio >= 100:
        return "Remote"
    if remote_ratio >= 50:
        return "Hybrid"
    return "On-site"


def _salary_trend_points(periods: int = 6) -> List[Dict[str, Any]]:
    monthly = (
        df_market.assign(posting_month=pd.to_datetime(df_market["posting_date"]).dt.to_period("M").astype(str))
        .groupby("posting_month")["salary_usd"]
        .median()
        .tail(periods)
    )
    return [
        {"name": pd.Period(month).strftime("%b"), "salary": round(float(value), 2)}
        for month, value in monthly.items()
    ]


def _salary_progression(predicted_salary: float) -> List[Dict[str, Any]]:
    weights = [
        ("Baseline", 0.72),
        ("Experience", 0.81),
        ("Flexibility", 0.88),
        ("Market", 0.94),
        ("Prediction", 1.0),
    ]
    return [{"name": label, "salary": round(predicted_salary * weight)} for label, weight in weights]


def _factor_importance(top_factors: List[str]) -> List[Dict[str, Any]]:
    base_scores = [96, 84, 72, 61, 48]
    return [
        {"feature": feature, "importance": base_scores[idx] if idx < len(base_scores) else max(24, 48 - idx * 6)}
        for idx, feature in enumerate(top_factors)
    ]


def _form_options() -> FormOptionsResponse:
    return FormOptionsResponse(
        experience_levels=EXPERIENCE_LEVELS,
        education_levels=["Associate", "Bachelor", "Master", "PhD"],
        company_sizes=["Small", "Medium", "Large"],
        remote_modes=[
            {"label": "On-site", "value": 0},
            {"label": "Hybrid", "value": 50},
            {"label": "Remote", "value": 100},
        ],
        industries=_top_industries(),
        default_inputs={
            "salary_check": {
                "experience_level": "Senior Level",
                "years_experience": 6,
                "education_required": "Master",
                "remote_ratio": 100,
                "benefits_score": 8,
                "industry": _top_industries(1)[0] if _top_industries(1) else "Technology",
                "company_size": "Large",
            },
            "post_role": {
                "experience_level": "Senior Level",
                "years_experience": 8,
                "education_required": "Master",
                "remote_ratio": 100,
                "benefits_score": 8,
                "industry": _top_industries(1)[0] if _top_industries(1) else "Technology",
                "company_size": "Large",
            },
            "offer_intelligence": {
                "salary_usd": round(float(df_market["salary_usd"].median())),
                "years_experience": 8,
                "remote_ratio": 100,
                "benefits_score": 8,
                "experience_level": "Senior Level",
            },
            "candidate_fit": {
                "years_experience": 5,
                "experience_level": "Mid Level",
                "remote_ratio": 100,
                "benefits_score": 7,
                "education_required": "Bachelor",
                "preferred_industry": _top_industries(1)[0] if _top_industries(1) else "Technology",
                "top_k": 5,
            },
            "job_matches": {
                "years_experience": 5,
                "experience_level": "Mid Level",
                "remote_ratio": 100,
                "benefits_score": 7,
                "education_required": "Bachelor",
                "preferred_industry": _top_industries(1)[0] if _top_industries(1) else "Technology",
                "top_k": 5,
            },
            "growth_plan": {
                "job_title": str(df_market["job_title"].mode().iat[0]),
                "years_experience": 5,
                "experience_level": "Mid Level",
                "remote_ratio": 50,
            },
            "market_position": {
                "salary_usd": round(float(df_market["salary_usd"].median())),
                "years_experience": 8,
                "remote_ratio": 100,
                "benefits_score": 8,
                "experience_level": "Senior Level",
            },
        },
    )


def _navigation() -> List[NavGroup]:
    return [
        NavGroup(
            title="Recruiter Portal",
            items=[
                NavItem(label="Dashboard", href="/recruiter", icon="LayoutDashboard"),
                NavItem(label="Post a Role", href="/recruiter/post-role", icon="BriefcaseBusiness"),
                NavItem(label="Offer Intelligence", href="/recruiter/offer-intelligence", icon="ShieldAlert"),
                NavItem(label="Candidate Fit Score", href="/recruiter/candidate-fit", icon="Target"),
                NavItem(label="Market Pulse", href="/recruiter/market-pulse", icon="BarChart3"),
            ],
        ),
        NavGroup(
            title="Candidate Portal",
            items=[
                NavItem(label="Home", href="/candidate", icon="LayoutDashboard"),
                NavItem(label="Job Matches", href="/candidate/job-matches", icon="UserRoundSearch"),
                NavItem(label="Salary Check", href="/candidate/salary-check", icon="Gauge"),
                NavItem(label="Growth Plan", href="/candidate/growth-plan", icon="TrendingUp"),
                NavItem(label="Market Position", href="/candidate/market-position", icon="Map"),
            ],
        ),
        NavGroup(
            title="Admin Portal",
            items=[
                NavItem(label="Workforce Intelligence", href="/admin", icon="Building2"),
                NavItem(label="Compensation Audit", href="/admin/compensation-audit", icon="SearchCode"),
                NavItem(label="Talent Segment Map", href="/admin/talent-segments", icon="Layers3"),
                NavItem(label="Hiring Signals", href="/admin/hiring-signals", icon="Workflow"),
            ],
        ),
    ]


def _landing_features() -> List[FeatureItem]:
    snap = _market_snapshot()
    feature_specs = [
        ("Salary Intelligence", f"{_format_money(snap['median_salary'])} median", "Median salary calibration rooted in the indexed AI jobs dataset.", "Gauge", "from-primary/20 to-primary/5"),
        ("Offer Intelligence", f"{snap['remote_share']:.0f}% flexible", "Offer risk scoring reflects current market positioning and remote-compatibility pressure.", "ShieldAlert", "from-danger/20 to-danger/5"),
        ("Candidate Match Scoring", f"{len(df_market):,} roles", "Job recommendations are retrieved from the trained recommender and live talent corpus.", "Target", "from-accent/20 to-success/10"),
        ("Career Growth Planning", f"{len(_top_skills(5))} top skills", "Counterfactual growth paths are shaped by the same market skill signals powering the backend.", "TrendingUp", "from-success/20 to-primary/10"),
        ("Compensation Audit", f"{len(_build_audit_rows(8))} sample rows", "Audit previews surface under-market and high-variance compensation patterns from the dataset.", "Activity", "from-warning/20 to-warning/5"),
        ("Market Segmentation", f"{len(_market_snapshot()['segments'])} clusters", "Segment mapping uses backend cluster summaries instead of frontend-only scatter mocks.", "Layers3", "from-primary/20 to-accent/10"),
        ("Workforce Intelligence", f"{snap['avg_experience']:.1f}y avg exp", "Executive summaries follow the same market snapshot shared across every portal.", "Users", "from-white/10 to-primary/10"),
        ("Hiring Signals", f"{len(_forecast_points())} month horizon", "Demand forecasting is derived from posting activity in the underlying AI jobs dataset.", "HeartPulse", "from-accent/20 to-primary/10"),
    ]
    return [
        FeatureItem(title=title, metric=metric, description=description, icon_key=icon_key, tint=tint)
        for title, metric, description, icon_key, tint in feature_specs
    ]


def _build_reg_vector(req: SalaryRequest) -> np.ndarray:
    feature_cols = cfg_dso2["feature_cols"]
    row: Dict[str, float] = {col: 0.0 for col in feature_cols}

    row["years_experience"] = float(req.years_experience)
    row["experience_level"] = _enc_exp(req.experience_level)
    row["education_required"] = _enc_edu(req.education_required)
    row["remote_ratio"] = float(req.remote_ratio)
    row["benefits_score"] = float(req.benefits_score)

    if req.company_location:
        row["company_location"] = _freq_encode("company_location", req.company_location)
    if req.employee_residence:
        row["employee_residence"] = _freq_encode("employee_residence", req.employee_residence)

    size_enc = ORDINAL_MAP["company_size"].get(req.company_size, 1)
    row["company_size"] = float(size_enc)

    if req.industry:
        col_name = f"industry_{req.industry}"
        if col_name in row:
            row[col_name] = 1.0

    return np.array([row[col] for col in feature_cols], dtype=float).reshape(1, -1)


def _build_segment_info(cluster_id: int) -> SegmentInfo:
    meta = cfg_dso3["cluster_meta"][str(cluster_id)]
    return SegmentInfo(
        cluster_id=cluster_id,
        name=meta["name"],
        pct_market=meta["pct_market"],
        avg_salary=meta["avg_salary"],
        avg_years_exp=meta["avg_years_exp"],
        avg_remote=meta["avg_remote"],
        top_skills=cfg_dso3.get("top_skills_per_cluster", {}).get(str(cluster_id), [])[:8],
    )


def _recommend_jobs_core(req: RecommendRequest) -> RecommendResponse:
    rec_all = cfg_dso4["rec_all_features"]
    row: Dict[str, float] = {col: 0.0 for col in rec_all}
    row["years_experience"] = float(req.years_experience)
    row["experience_level"] = _enc_exp(req.experience_level)
    row["remote_ratio"] = float(req.remote_ratio)
    row["benefits_score"] = float(req.benefits_score)
    row["education_required"] = _enc_edu(req.education_required)

    if req.preferred_industry:
        col_name = f"industry_{req.preferred_industry}"
        if col_name in row:
            row[col_name] = 1.0

    vec = np.array([[row[col] for col in rec_all]])
    vec_scaled = scaler_rec.transform(vec)
    k = min(req.top_k + 1, len(rec_matrix))
    distances, indices = knn_model.kneighbors(vec_scaled, n_neighbors=k)

    idx_rec = indices[0][1 : req.top_k + 1]
    dist_rec = distances[0][1 : req.top_k + 1]
    match_scores = np.exp(-dist_rec / 2.0) * 100

    jobs: List[JobCard] = []
    for rank, (orig_idx, score) in enumerate(zip(idx_rec, match_scores), start=1):
        row_data = df_orig.iloc[orig_idx]
        score_f = float(score)
        jobs.append(
            JobCard(
                rank=rank,
                job_title=str(row_data.get("job_title", "Unknown")),
                experience_level=_label_exp(str(row_data.get("experience_level", ""))),
                industry=str(row_data.get("industry", "")),
                salary_usd=int(row_data.get("salary_usd", 0)),
                remote_ratio=int(row_data.get("remote_ratio", 0)),
                years_experience=int(row_data.get("years_experience", 0)),
                benefits_score=float(row_data.get("benefits_score", 0)),
                match_score=round(score_f, 1),
                match_label="Excellent" if score_f >= 75 else "Good" if score_f >= 50 else "Fair",
                skills_required=_extract_skills(row_data.get("required_skills", ""))[:8],
            )
        )

    return RecommendResponse(
        jobs=jobs,
        profile_summary=(
            f"{req.experience_level} | {req.years_experience} yrs | "
            f"{'Remote' if req.remote_ratio == 100 else 'Hybrid' if req.remote_ratio == 50 else 'On-site'} | "
            f"{req.education_required}"
        ),
        total_candidates=len(rec_matrix),
    )


def _market_snapshot() -> Dict[str, Any]:
    salaries = df_market["salary_usd"].astype(float)
    remote = df_market["remote_ratio"].astype(float)
    benefits = df_market["benefits_score"].astype(float)
    years = df_market["years_experience"].astype(float)

    recent = df_market.sort_values("posting_date").tail(6).reset_index(drop=True)
    hiring_velocity = [
        TrendPoint(
            label=pd.to_datetime(row["posting_date"]).strftime("%b"),
            metric_a=round(float(row["salary_usd"]) / 2500, 1),
            metric_b=round(float(row["years_experience"]) * 8 + float(row["benefits_score"]) * 3, 1),
        )
        for idx, (_, row) in enumerate(recent.iterrows())
    ]

    pipeline_mix = {
        "Applied": int((remote < 34).sum()),
        "Interview": int(((remote >= 34) & (remote < 67)).sum()),
        "Offer": int((benefits >= 7.5).sum()),
        "Hold": int((benefits < 4.5).sum()),
    }

    segments = [_build_segment_info(cluster_id) for cluster_id in sorted(map(int, cfg_dso3["cluster_meta"].keys()))]

    return {
        "median_salary": float(salaries.median()),
        "avg_salary": float(salaries.mean()),
        "remote_share": float((remote >= 50).mean() * 100),
        "avg_benefits": float(benefits.mean()),
        "avg_experience": float(years.mean()),
        "top_skills": _top_skills(),
        "hiring_velocity": hiring_velocity,
        "pipeline_mix": pipeline_mix,
        "segments": segments,
    }


def _build_audit_rows(limit: int = 8) -> List[CompensationAuditRow]:
    sample = (
        df_market.assign(
            experience_label=df_market["experience_level"].map(EXP_CODE_TO_LABEL).fillna("Mid Level"),
        )
        .sample(n=min(limit, len(df_market)), random_state=42)
        .reset_index(drop=True)
    )

    rows: List[CompensationAuditRow] = []
    for _, row in sample.iterrows():
        salary_value = float(row["salary_usd"])
        exp_label = str(row["experience_label"])
        exp_median = float(cfg_dso2["exp_medians"].get(exp_label, cfg_dso2["market_median"]))
        deviation = round((salary_value - exp_median) / exp_median * 100, 2)

        if deviation <= -20:
            severity = "RED"
            anomaly = "Below segment median"
        elif deviation >= 20:
            severity = "YELLOW"
            anomaly = "High variance compensation"
        else:
            severity = "GREEN"
            anomaly = "Competitive"

        rows.append(
            CompensationAuditRow(
                role=str(row.get("job_title", "Unknown")),
                team=str(row.get("industry", "General")),
                salary=_format_money(salary_value),
                anomaly=anomaly,
                severity=severity,
                market_median=round(exp_median, 2),
                deviation_pct=deviation,
            )
        )

    severity_order = {"RED": 0, "YELLOW": 1, "GREEN": 2}
    return sorted(rows, key=lambda item: severity_order.get(item.severity, 3))


def _forecast_points(periods: int = 6) -> List[ForecastPoint]:
    monthly = (
        df_market.assign(posting_month=pd.to_datetime(df_market["posting_date"]).dt.to_period("M").astype(str))
        .groupby("posting_month")
        .size()
        .tail(periods)
    )
    if monthly.empty:
        labels = ["M1", "M2", "M3", "M4", "M5", "M6"]
        return [ForecastPoint(month=label, actual=0.0, forecast=0.0) for label in labels]

    values = monthly.tolist()
    months = [pd.Period(m).strftime("%b") if "-" in str(m) else str(m) for m in monthly.index.tolist()]
    points: List[ForecastPoint] = []
    for idx, (month, actual) in enumerate(zip(months, values)):
        window = values[max(0, idx - 2): idx + 1]
        forecast = round(sum(window) / len(window) * 1.05, 2)
        points.append(ForecastPoint(month=month, actual=float(actual), forecast=float(forecast)))
    return points


def _market_heat_points(limit: int = 5) -> List[HeatmapPoint]:
    skill_company: Dict[str, set] = {}
    skill_count: Dict[str, int] = {}
    for _, row in df_market[["required_skills", "company_name"]].iterrows():
        company = str(row.get("company_name", "Unknown"))
        skills = _extract_skills(row.get("required_skills", ""))
        for skill in skills:
            skill_count[skill] = skill_count.get(skill, 0) + 1
            skill_company.setdefault(skill, set()).add(company)
    top = sorted(skill_count.items(), key=lambda item: item[1], reverse=True)[:limit]
    return [
        HeatmapPoint(name=skill, demand=float(count), supply=float(len(skill_company.get(skill, set()))))
        for skill, count in top
    ]


def _scatter_points() -> List[ScatterPoint]:
    return [
        ScatterPoint(
            salary=float(segment.avg_salary),
            demand=float(segment.avg_remote),
            size=float(segment.pct_market * 12),
            label=segment.name,
        )
        for segment in _market_snapshot()["segments"]
    ]


def _candidate_fit_core(req: RecommendRequest) -> CandidateFitResponse:
    recs = _recommend_jobs_core(req)
    if not recs.jobs:
        return CandidateFitResponse(
            score=0,
            role_title="No match",
            market_salary=0,
            salary_compatibility="Unknown",
            experience_alignment=0,
            readiness_timeline="Unknown",
            skill_gap=[],
            insight="No recommendation could be generated for this profile.",
        )

    top = recs.jobs[0]
    role_skills = top.skills_required[:6]
    base = top.match_score
    skill_gap = [
        SkillGapPoint(
            skill=skill,
            candidate=max(35, min(98, round(base - idx * 6))),
            role=max(55, min(99, round(84 + idx * 2))),
        )
        for idx, skill in enumerate(role_skills)
    ]
    exp_alignment = max(1.0, min(10.0, round((req.years_experience / max(top.years_experience, 1)) * 8.5, 1)))
    salary_compatibility = "High" if top.match_score >= 80 else "Medium" if top.match_score >= 60 else "Low"
    readiness = "2 weeks" if top.match_score >= 85 else "4 weeks" if top.match_score >= 70 else "6 weeks"
    return CandidateFitResponse(
        score=round(top.match_score, 1),
        role_title=top.job_title,
        market_salary=float(top.salary_usd),
        salary_compatibility=salary_compatibility,
        experience_alignment=exp_alignment,
        readiness_timeline=readiness,
        skill_gap=skill_gap,
        insight=(
            f"The profile aligns best with '{top.job_title}' in {top.industry}. "
            f"Strongest fit comes from experience level, salary alignment, and overlapping required skills."
        ),
    )


@app.get("/api/frontend/bootstrap", response_model=FrontendBootstrapResponse, tags=["Frontend"])
def frontend_bootstrap():
    top_skills = _top_skills(3)
    remote_share = _market_snapshot()["remote_share"]
    return FrontendBootstrapResponse(
        navigation=_navigation(),
        landing_features=_landing_features(),
        preview_portals=[
            "Recruiter dashboard",
            "Candidate growth cockpit",
            "Admin workforce command center",
        ],
        search_placeholder="Search views, metrics, segments, or AI job signals",
        profile=ShellProfile(name="Zaineb", role="Platform Admin"),
        sidebar_card=ShellCard(
            badge="AI Copilot",
            title="Market summary ready",
            message=(
                f"{top_skills[0] if top_skills else 'Python'} demand remains elevated, and "
                f"{remote_share:.0f}% of indexed roles support hybrid or remote work."
            ),
        ),
        assistant_card=ShellCard(
            badge="AI assistant widget",
            title="Live market guidance",
            message=(
                f"Market volatility is concentrated in {', '.join(top_skills[:2]) if top_skills else 'core AI skills'}. "
                "Consider widening salary bands where competition is tightest."
            ),
        ),
        notifications=[
            ShellNotification(
                title="Compensation anomaly detected",
                message="Compensation review surfaced outlier offers relative to current segment medians.",
                timestamp="today",
            ),
            ShellNotification(
                title="Candidate match threshold crossed",
                message="High-fit recommendation patterns remain strongest in flexible AI roles.",
                timestamp="today",
            ),
            ShellNotification(
                title="Hiring signals refreshed",
                message="The monthly demand forecast has been recalculated from posting activity.",
                timestamp="today",
            ),
        ],
        form_options=_form_options(),
    )


@app.get("/health", response_model=HealthResponse, tags=["System"])
def health():
    return HealthResponse(status="ok", models_loaded=_loaded_models, dataset_size=len(df_market))


@app.get("/api/platform/overview", response_model=PlatformOverviewResponse, tags=["Platform"])
def platform_overview():
    snap = _market_snapshot()
    return PlatformOverviewResponse(
        hero_stats=[
            KpiItem(label="AI job listings analyzed", value=f"{len(df_market):,}", delta="+12%", helper="live dataset"),
            KpiItem(label="Models deployed", value=str(len(_loaded_models)), delta="online", helper="backend stack", tone="purple"),
            KpiItem(label="Remote-ready roles", value=f"{snap['remote_share']:.0f}%", delta="+8%", helper="market posture", tone="green"),
            KpiItem(label="Top skill cluster", value=snap["top_skills"][0], delta="high demand", helper="current leader", tone="orange"),
        ],
        landing_insights=[
            InsightItem(
                eyebrow="Salary Intelligence",
                title="Median AI salary remains resilient",
                body=f"The dataset median holds at {_format_money(snap['median_salary'])}, with senior and executive bands carrying the strongest upside.",
                metric=_format_money(snap["avg_salary"]),
            ),
            InsightItem(
                eyebrow="Remote Hiring",
                title="Flexible roles dominate application quality",
                body=f"{snap['remote_share']:.0f}% of indexed opportunities offer hybrid or remote flexibility, reinforcing broader candidate reach.",
                metric=f"{snap['remote_share']:.0f}%",
                tone="green",
            ),
            InsightItem(
                eyebrow="Skills Demand",
                title="Platform and Python remain decisive differentiators",
                body=f"Top recurring requirements include {', '.join(snap['top_skills'][:4])}, signalling strong demand for deployable AI talent.",
                metric=str(len(snap["top_skills"])),
                tone="purple",
            ),
        ],
        notifications=[
            NotificationItem(
                title="Compensation drift detected",
                message="Senior AI platform roles are showing the strongest downward offer risk relative to benchmark.",
                timestamp="just now",
                priority="high",
            ),
            NotificationItem(
                title="Remote demand remains elevated",
                message="Hybrid and remote roles continue to outperform on application volume and market breadth.",
                timestamp="today",
            ),
            NotificationItem(
                title="Segment map refreshed",
                message="Cluster metadata and top skill concentrations are available for executive review.",
                timestamp="today",
            ),
        ],
        testimonials=[
            TestimonialItem(
                name="Mina Ross",
                company="Northstar AI",
                quote="TalentLens turned compensation reviews into a strategic weekly ritual instead of a spreadsheet fire drill.",
            ),
            TestimonialItem(
                name="Samir Blake",
                company="Cobalt Robotics",
                quote="The candidate growth simulator feels like a product people would pay for on its own.",
            ),
            TestimonialItem(
                name="Ariana Fox",
                company="NovaScale",
                quote="Execs finally understand hiring volatility because the product translates model output into business decisions.",
            ),
        ],
        salary_trend=_salary_trend_points(),
        demand_forecast=_forecast_points(),
    )


@app.get("/api/recruiter/dashboard", response_model=RecruiterDashboardResponse, tags=["Platform"])
def recruiter_dashboard():
    snap = _market_snapshot()
    audit_rows = _build_audit_rows()
    return RecruiterDashboardResponse(
        kpis=[
            KpiItem(label="Active Roles", value=str(int(len(df_market) * 0.0032)), delta="+12%", helper="open this cycle"),
            KpiItem(label="Qualified Pipeline", value=f"{int(len(df_market) * 0.085):,}", delta="+18%", helper="AI-ranked", tone="purple"),
            KpiItem(label="Offer Risk Alerts", value=str(sum(1 for row in audit_rows if row.severity == 'RED')), delta="needs review", helper="benchmarked", tone="orange"),
            KpiItem(label="Competitive Offers", value=str(sum(1 for row in audit_rows if row.severity == 'GREEN')), delta="+7%", helper="healthy range", tone="green"),
        ],
        hiring_velocity=snap["hiring_velocity"],
        pipeline_mix=snap["pipeline_mix"],
        insights=[
            InsightItem(
                eyebrow="Offer Intelligence",
                title="Compensation pressure is rising in senior AI hiring",
                body=f"Median compensation sits at {_format_money(snap['median_salary'])}, while flexible roles continue to command a stronger premium.",
                metric=f"{snap['remote_share']:.0f}%",
            ),
            InsightItem(
                eyebrow="Candidate Flow",
                title="Skill-dense profiles move fastest",
                body=f"The most repeated skills in the market are {', '.join(snap['top_skills'][:3])}, aligning with stronger shortlist conversion.",
                metric=str(len(snap["top_skills"])),
                tone="green",
            ),
            InsightItem(
                eyebrow="Market Pulse",
                title="Hiring velocity is strongest in mid-to-senior segments",
                body=f"Average market experience is {snap['avg_experience']:.1f} years, keeping senior pipeline quality elevated.",
                metric=f"{snap['avg_experience']:.1f}y",
                tone="purple",
            ),
        ],
    )


@app.get("/api/candidate/home", response_model=CandidateHomeResponse, tags=["Platform"])
def candidate_home():
    snap = _market_snapshot()
    recs = _recommend_jobs_core(
        RecommendRequest(
            years_experience=5,
            experience_level="Mid Level",
            remote_ratio=100,
            benefits_score=7.0,
            education_required="Bachelor",
            preferred_industry="Technology",
            top_k=3,
        )
    )
    return CandidateHomeResponse(
        greeting="Your career momentum is accelerating",
        kpis=[
            KpiItem(label="Career Score", value=str(int(round(np.mean([job.match_score for job in recs.jobs])))) if recs.jobs else "0", delta="+8 points", helper="match strength"),
            KpiItem(label="Top Job Matches", value=str(len(recs.jobs)), delta="+5 new", helper="this week", tone="purple"),
            KpiItem(label="Salary Positioning", value=f"Top {max(1, int(round(100 - norm.cdf((np.mean([job.salary_usd for job in recs.jobs]) - cfg_dso2['training_mean']) / cfg_dso2['training_std']) * 100)))}%", delta="+4%", helper="market percentile", tone="green"),
            KpiItem(label="Growth Signals", value=str(len(_top_skills(6))), delta="+2 paths", helper="recommended", tone="orange"),
        ],
        top_recommendations=recs.jobs,
        insights=[
            InsightItem(
                eyebrow="Job Matches",
                title="Platform and analytics roles fit best",
                body="Your current profile aligns strongly with enterprise AI delivery, analytics, and strategic product intelligence roles.",
                metric=f"{recs.jobs[0].match_score:.0f}%" if recs.jobs else "0%",
            ),
            InsightItem(
                eyebrow="Compensation",
                title="Salary upside grows with production AI exposure",
                body="Profiles that combine business clarity with MLOps depth continue to outperform benchmark ranges.",
                metric="+$22K",
                tone="green",
            ),
            InsightItem(
                eyebrow="Market",
                title="Remote-friendly AI work remains strong",
                body="The current market still favors flexible delivery models, especially for senior AI and analytics roles.",
                metric=f"{snap['remote_share']:.0f}%",
                tone="purple",
            ),
        ],
    )


@app.get("/api/admin/workforce", response_model=WorkforceOverviewResponse, tags=["Platform"])
def workforce_overview():
    snap = _market_snapshot()
    return WorkforceOverviewResponse(
        kpis=[
            KpiItem(label="Compensation Health", value=str(int(round(min(99, max(50, 100 - abs((snap['avg_salary'] - snap['median_salary']) / max(snap['median_salary'], 1) * 100)))))), delta="+6", helper="org score"),
            KpiItem(label="Forecasted Demand", value=f"+{int(round((_forecast_points()[-1].forecast / max(_forecast_points()[-1].actual, 1) - 1) * 100))}%", delta="+4%", helper="next quarter", tone="purple"),
            KpiItem(label="Workforce Coverage", value=f"{len(snap['segments'])} clusters", delta="balanced", helper="market shape", tone="green"),
            KpiItem(label="Hiring Efficiency", value=str(int(round((snap['remote_share'] + snap['avg_benefits'] * 5) / 2))), delta="+9", helper="close-rate index", tone="orange"),
        ],
        segment_distribution=snap["segments"],
        notifications=[
            NotificationItem(
                title="Executive review ready",
                message="Segment-level workforce distribution has been refreshed using the latest market sample.",
                timestamp="today",
            ),
            NotificationItem(
                title="Demand concentration warning",
                message="Platform AI and product analytics continue to show elevated demand relative to supply.",
                timestamp="today",
                priority="high",
            ),
        ],
        insights=[
            InsightItem(
                eyebrow="Workforce Intelligence",
                title="Remote-capable AI roles remain a structural advantage",
                body=f"{snap['remote_share']:.0f}% of opportunities in the dataset support hybrid or remote work, expanding talent access.",
                metric=f"{snap['remote_share']:.0f}%",
            ),
            InsightItem(
                eyebrow="Segment Health",
                title="Senior and executive segments concentrate salary premium",
                body=f"Cluster averages range from {_format_money(min(seg.avg_salary for seg in snap['segments']))} to {_format_money(max(seg.avg_salary for seg in snap['segments']))}.",
                metric=str(len(snap["segments"])),
                tone="purple",
            ),
        ],
    )


@app.get("/api/admin/compensation-audit-preview", response_model=CompensationAuditPreviewResponse, tags=["Platform"])
def compensation_audit_preview():
    rows = _build_audit_rows(limit=8)
    red_count = sum(1 for row in rows if row.severity == "RED")
    yellow_count = sum(1 for row in rows if row.severity == "YELLOW")
    return CompensationAuditPreviewResponse(
        rows=rows,
        summary=f"Preview generated from indexed compensation rows: {red_count} high-risk and {yellow_count} medium-risk patterns need review.",
        summary_bullets=[
            "Correct under-market roles before approval to protect acceptance rates.",
            "Review normalization assumptions across locations and seniority bands.",
            "Use this preview as the starting point for the executive compensation memo.",
        ],
    )


@app.get("/api/recruiter/market-pulse", response_model=MarketPulseResponse, tags=["Platform"])
def recruiter_market_pulse():
    return MarketPulseResponse(
        market_heat=_market_heat_points(),
        segmentation_scatter=_scatter_points(),
        demand_forecast=_forecast_points(),
    )


@app.post("/api/recruiter/candidate-fit", response_model=CandidateFitResponse, tags=["Platform"])
def recruiter_candidate_fit(req: RecommendRequest):
    return _candidate_fit_core(req)


@app.get("/api/admin/hiring-signals", response_model=HiringSignalsResponse, tags=["Platform"])
def admin_hiring_signals():
    forecast = _forecast_points()
    top_skills = _top_skills(3)
    return HiringSignalsResponse(
        demand_forecast=forecast,
        insights=[
            InsightItem(
                eyebrow="Hiring Signals",
                title="Demand remains concentrated in deployable AI skills",
                body=f"Recent posting trends continue to favor {', '.join(top_skills)} across the market.",
                metric=str(len(forecast)),
            ),
            InsightItem(
                eyebrow="Remote Signals",
                title="Flexible roles continue to shape talent access",
                body=f"{_market_snapshot()['remote_share']:.0f}% of the indexed market supports hybrid or remote work.",
                metric=f"{_market_snapshot()['remote_share']:.0f}%",
                tone="green",
            ),
        ],
    )


@app.post("/api/anomaly/check", response_model=AnomalyResponse, tags=["DSO1 - Anomaly"])
def check_anomaly(req: AnomalyRequest):
    exp_enc = _enc_exp(req.experience_level)
    vec = np.array([[req.salary_usd, req.years_experience, req.remote_ratio, req.benefits_score, exp_enc]])
    vec_scaled = scaler_anom.transform(vec)

    label = iso_model.predict(vec_scaled)[0]
    score = float(iso_model.score_samples(vec_scaled)[0])
    market_median = cfg_dso2["market_median"]
    deviation = (req.salary_usd - market_median) / market_median * 100

    is_anomaly = label == -1
    exp_median = cfg_dso2["exp_medians"].get(req.experience_level, market_median)
    dev_from_exp = (req.salary_usd - exp_median) / exp_median * 100

    if not is_anomaly and abs(dev_from_exp) <= 20:
        risk_label = "GREEN"
        risk_message = "Competitive"
    elif abs(dev_from_exp) <= 35:
        risk_label = "YELLOW"
        risk_message = "Review Recommended"
    else:
        risk_label = "RED"
        risk_message = "Likely to Lose Candidates" if dev_from_exp < 0 else "Outlier - Verify Budget"

    direction = "below" if dev_from_exp < 0 else "above"
    insight = (
        f"This offer is {abs(dev_from_exp):.0f}% {direction} the market median for "
        f"{req.experience_level}s ({_format_money(exp_median)}). "
        f"Similar roles typically range from {_format_money(exp_median * 0.85)} to {_format_money(exp_median * 1.15)}."
    )

    return AnomalyResponse(
        is_anomaly=is_anomaly,
        risk_label=risk_label,
        risk_message=risk_message,
        anomaly_score=score,
        market_median=market_median,
        deviation_pct=round(deviation, 2),
        insight=insight,
        recommendations=[
            f"Lift the offer closer to {_format_money(exp_median)} to align with segment expectations.",
            "Use flexibility and benefits improvements if salary movement is constrained.",
            "Recheck the offer after compensation changes before sending the final package.",
        ],
    )


@app.post("/api/salary/predict", response_model=SalaryResponse, tags=["DSO2 - Salary"])
def predict_salary(req: SalaryRequest):
    vec = _build_reg_vector(req)
    pred = float(xgb_reg.predict(vec)[0])

    rmse = cfg_dso2["rmse"]
    conf_low = max(0, pred - rmse)
    conf_high = pred + rmse
    pct = float(norm.cdf((pred - cfg_dso2["training_mean"]) / cfg_dso2["training_std"]) * 100)

    insight = (
        f"Based on your profile, the estimated market salary is {_format_money(pred)} "
        f"(range {_format_money(conf_low)} to {_format_money(conf_high)}). "
        f"You are in the top {100 - pct:.0f}% of earners for this profile."
    )
    top_factors = ["experience_level", "years_experience", "industry", "remote_ratio"]

    return SalaryResponse(
        predicted_salary=round(pred),
        confidence_low=round(conf_low),
        confidence_high=round(conf_high),
        market_median=round(cfg_dso2["market_median"]),
        percentile_position=round(pct, 1),
        comparison_by_level={key: round(value) for key, value in cfg_dso2["exp_medians"].items()},
        negotiation_low=round(pred * 1.05),
        negotiation_high=round(pred * 1.12),
        top_factors=top_factors,
        factor_importance=_factor_importance(top_factors),
        salary_progression=_salary_progression(pred),
        insight=insight,
    )


@app.post("/api/segment/assign", response_model=SegmentResponse, tags=["DSO3 - Segments"])
def assign_segment(req: SegmentRequest):
    exp_enc = _enc_exp(req.experience_level)
    vec = np.array([[req.salary_usd, req.years_experience, req.remote_ratio, req.benefits_score, exp_enc]])
    vec_scaled = scaler_clust.transform(vec)
    cluster_id = int(km_model.predict(vec_scaled)[0])

    assigned = _build_segment_info(cluster_id)
    all_segments = [_build_segment_info(cluster) for cluster in sorted(map(int, cfg_dso3["cluster_meta"].keys()))]

    peer_sal = assigned.avg_salary
    diff_pct = (req.salary_usd - peer_sal) / peer_sal * 100
    comp_str = f"{abs(diff_pct):.0f}% {'above' if diff_pct >= 0 else 'below'}"

    return SegmentResponse(
        assigned_segment=assigned,
        all_segments=all_segments,
        peer_comparison=(
            f"You are in the '{assigned.name}' segment ({assigned.pct_market}% of the AI market). "
            f"Your salary is {comp_str} the segment average of {_format_money(peer_sal)}."
        ),
        market_overview=(
            f"The AI job market has {len(all_segments)} major segments ranging from "
            f"{all_segments[0].name} to {all_segments[-1].name}."
        ),
    )


@app.post("/api/recommend/jobs", response_model=RecommendResponse, tags=["DSO4 - Recommender"])
def recommend_jobs(req: RecommendRequest):
    return _recommend_jobs_core(req)


@app.post("/api/career/optimize", response_model=CareerResponse, tags=["DSO5 - Career Optimizer"])
def optimize_career(req: CareerRequest):
    numeric_cols = cfg_dso5["numeric_cols_dso5"]
    base_row: Dict[str, float] = {col: 0.0 for col in numeric_cols}
    base_row["years_experience"] = float(req.years_experience)
    base_row["experience_level"] = _enc_exp(req.experience_level)
    base_row["remote_ratio"] = float(req.remote_ratio)

    x_numeric_base = np.array([[base_row.get(col, 0.0) for col in numeric_cols]])
    x_tfidf_base = tfidf_model.transform([req.job_title])
    x_base = sp.hstack([sp.csr_matrix(x_numeric_base), x_tfidf_base])

    pred_sal = float(xgb_sal.predict(x_base)[0])
    pred_dem = float(lgb_dem.predict(x_base)[0])
    dem_max = cfg_dso5["demand_score_range"][1]
    demand_label = "High" if pred_dem >= dem_max * 0.6 else "Medium" if pred_dem >= dem_max * 0.3 else "Low"

    shap_factors = [
        {"feature": key, "importance": round(value, 4)}
        for key, value in list(cfg_dso5["top15_shap"].items())[:8]
    ]

    scenarios = req.counterfactuals or [
        {"scenario": "+5 years experience", "feature": "years_experience", "delta": 5},
        {"scenario": "+20% remote", "feature": "remote_ratio", "delta": 20},
        {"scenario": "Senior level (+1)", "feature": "experience_level", "delta": 1},
    ]

    cf_results: List[CounterfactualResult] = []
    for scenario in scenarios:
        feat = scenario.get("feature", "years_experience")
        delta = float(scenario.get("delta", 1))
        name = scenario.get("scenario", f"{feat} +{delta}")

        pert_row = base_row.copy()
        if feat in pert_row:
            pert_row[feat] += delta

        x_pert = sp.hstack([
            sp.csr_matrix(np.array([[pert_row.get(col, 0.0) for col in numeric_cols]])),
            x_tfidf_base,
        ])
        new_sal = float(xgb_sal.predict(x_pert)[0])
        new_dem = float(lgb_dem.predict(x_pert)[0])
        cf_results.append(
            CounterfactualResult(
                scenario=name,
                feature=feat,
                delta=delta,
                new_salary=round(new_sal),
                delta_salary=round(new_sal - pred_sal),
                new_demand=round(new_dem, 3),
                delta_demand=round(new_dem - pred_dem, 3),
            )
        )

    best_cf = max(cf_results, key=lambda item: item.delta_salary)
    return CareerResponse(
        predicted_salary=round(pred_sal),
        predicted_demand=round(pred_dem, 3),
        demand_label=demand_label,
        top_shap_factors=shap_factors,
        counterfactuals=cf_results,
        growth_recommendation=(
            f"Your highest salary impact comes from '{best_cf.scenario}': "
            f"+{_format_money(best_cf.delta_salary)} projected. "
            f"Market demand for your profile is currently {demand_label.lower()}."
        ),
        market_segment_hint=(
            f"Profiles with {req.years_experience} years of experience as {req.experience_level} "
            f"typically fall in the "
            f"{'Executive' if _enc_exp(req.experience_level) >= 3 else 'Senior' if _enc_exp(req.experience_level) >= 2 else 'Mid-Level' if _enc_exp(req.experience_level) >= 1 else 'Junior'} "
            f"market segment."
        ),
    )
