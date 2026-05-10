# TalentLens — ML Backend

**AI-powered HR Intelligence Platform · FastAPI + 5 ML Models**  
Built by BuildDream · 2025

---

## Quick Start

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Train all models (once)
Place `ai_job_dataset.csv` in the project root, then:
```bash
python train_models.py
# → Creates models/ directory with 21 serialized files (~15 MB)
```

### 3. Start the API server
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Open interactive docs
```
http://localhost:8000/docs
```

---

## Architecture

```
talentlens-backend/
├── train_models.py        # One-time training pipeline (all 5 DSOs)
├── app/
│   ├── main.py            # FastAPI endpoints
│   └── schemas.py         # Pydantic request/response models
├── models/                # Serialized models + configs (generated)
│   ├── dso1_isolation_forest.joblib
│   ├── dso2_xgboost_reg.joblib
│   ├── dso3_kmeans.joblib
│   ├── dso4_knn.joblib
│   ├── dso4_rec_matrix.joblib
│   ├── dso5_xgboost_salary.joblib
│   ├── dso5_lgbm_demand.joblib
│   ├── dso5_tfidf.joblib
│   └── ...configs + preprocessors
├── requirements.txt
└── README.md
```

---

## API Endpoints

### `GET /health`
Returns server status and loaded model list.

---

### DSO1 — `POST /api/anomaly/check`
**Detect if a salary offer is anomalous (Isolation Forest)**

```json
// Request
{
  "salary_usd": 45000,
  "years_experience": 8,
  "remote_ratio": 100,
  "benefits_score": 7.5,
  "experience_level": "Senior Level"
}

// Response
{
  "is_anomaly": false,
  "risk_label": "RED",          // GREEN / YELLOW / RED
  "risk_message": "Likely to Lose Candidates",
  "anomaly_score": -0.52,
  "market_median": 99681,
  "deviation_pct": -54.86,
  "insight": "This offer is 55% below the market median..."
}
```

**Used by:** Recruiter Portal → Offer Intelligence (Page R3)

---

### DSO2 — `POST /api/salary/predict`
**Predict salary for a role (XGBoost · R² ≈ 0.87)**

```json
// Request
{
  "experience_level": "Senior Level",
  "years_experience": 8,
  "education_required": "Master",
  "remote_ratio": 100,
  "benefits_score": 8.0,
  "industry": "Technology",
  "company_size": "Large"
}

// Response
{
  "predicted_salary": 189245,
  "confidence_low": 167809,
  "confidence_high": 210681,
  "market_median": 99681,
  "percentile_position": 89.0,
  "comparison_by_level": { "Entry Level": 98178, ... },
  "negotiation_low": 198707,
  "negotiation_high": 211955,
  "insight": "..."
}
```

**Used by:** All portals → `/api/salary/predict` is the single shared endpoint (Recruiter: Post a Role, Candidate: Salary Check, Admin: Compensation Audit)

---

### DSO3 — `POST /api/segment/assign`
**Assign to market segment (K-Means k=4 · Silhouette ≈ 0.20)**

```json
// Request
{
  "salary_usd": 130000,
  "years_experience": 8,
  "remote_ratio": 100,
  "benefits_score": 8.0,
  "experience_level": "Senior Level"
}

// Response
{
  "assigned_segment": { "name": "Senior", "pct_market": 20.0, "avg_salary": 91010, ... },
  "all_segments": [ {...Junior}, {...Mid-Level}, {...Senior}, {...Executive} ],
  "peer_comparison": "You are in the 'Senior' segment...",
  "market_overview": "The AI job market has 4 segments..."
}
```

**Used by:** Recruiter: Market Pulse (R5) · Candidate: Market Position (C5) · Admin: Talent Segment Map

---

### DSO4 — `POST /api/recommend/jobs`
**Recommend matching jobs (KNN Euclidean · top-K)**

```json
// Request
{
  "years_experience": 5,
  "experience_level": "Mid Level",
  "remote_ratio": 100,
  "benefits_score": 7.0,
  "education_required": "Bachelor",
  "preferred_industry": "Technology",
  "top_k": 5
}

// Response
{
  "jobs": [
    {
      "rank": 1,
      "job_title": "Data Scientist",
      "match_score": 89.5,
      "match_label": "Excellent",
      "salary_usd": 94142,
      "skills_required": ["PyTorch", "Python", "Data Analysis"]
    }
  ],
  "profile_summary": "Mid Level | 5.0 yrs | Remote | Bachelor"
}
```

**Used by:** Candidate Portal → Job Matches (C2)

---

### DSO5 — `POST /api/career/optimize`
**Career optimization with SHAP + counterfactuals (XGBoost + LightGBM + TF-IDF)**

```json
// Request
{
  "job_title": "Data Scientist",
  "years_experience": 5,
  "experience_level": "Mid Level",
  "remote_ratio": 50,
  "counterfactuals": [
    { "scenario": "Get PhD", "feature": "education_required", "delta": 2 }
  ]
}

// Response
{
  "predicted_salary": 107378,
  "predicted_demand": 9.25,
  "demand_label": "High",
  "top_shap_factors": [
    { "feature": "years_experience", "importance": 37691 }, ...
  ],
  "counterfactuals": [
    { "scenario": "+5 years experience", "delta_salary": 51815, ... }
  ],
  "growth_recommendation": "Your highest salary impact comes from..."
}
```

**Used by:** Candidate Portal → Growth Plan (C4) · Admin: Hiring Signals

---

## CORS

The API has `allow_origins=["*"]` configured. For production, restrict this to your React frontend's domain:

```python
allow_origins=["https://app.talentlens.io"]
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODELS_DIR` | `models` | Path to serialized models directory |
| `DATA_PATH` | `ai_job_dataset.csv` | Path to training CSV (only needed for `train_models.py`) |

## Model Performance Summary

| DSO | Model | Metric |
|-----|-------|--------|
| DSO1 Anomaly | Isolation Forest | 750 anomalies (5%) detected |
| DSO2 Salary | XGBoost Regressor | R² = 0.874 · RMSE = $21,436 |
| DSO3 Segments | K-Means (k=4) | Silhouette = 0.199 |
| DSO4 Recommender | KNN Euclidean (k=5) | Top-1 match score ~89% |
| DSO5 Career | XGBoost + LightGBM + TF-IDF + SHAP | Salary R² = 0.880 · Demand R² = 0.922 |
