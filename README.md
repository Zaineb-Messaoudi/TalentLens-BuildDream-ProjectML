# TalentLens Platform

TalentLens is an AI-powered HR intelligence platform built on top of an AI jobs market dataset.  
The project combines a React frontend, a FastAPI backend, and a machine learning pipeline designed around five DSOs (Data Science Objectives) defined and developed in the notebook [ML_Modelisation_Complete.ipynb](C:\Users\ASUS\ML_Modelisation_Complete.ipynb).

The platform is designed to support three product perspectives:

- Recruiters: salary benchmarking, offer anomaly detection, candidate fit scoring, and market pulse.
- Candidates: job recommendations, salary estimation, growth planning, and market positioning.
- Admin and leadership: workforce intelligence, compensation audit previews, segment mapping, and hiring signals.

## Project Structure

```text
talentlens-platform/
├── README.md
├── talentlens-backend/
│   ├── ai_job_dataset.csv
│   ├── train_models.py
│   ├── app/
│   │   ├── main.py
│   │   └── schemas.py
│   ├── models/
│   │   ├── dso1_*.joblib / json
│   │   ├── dso2_*.joblib / json
│   │   ├── dso3_*.joblib / json
│   │   ├── dso4_*.joblib / json
│   │   ├── dso5_*.joblib / json
│   │   └── df_orig.parquet
│   └── requirements.txt
└── talentlens-frontend/
    ├── src/
    ├── package.json
    └── vite.config.js
```

## End-to-End Flow

1. The dataset `ai_job_dataset.csv` provides the market source data with 15,000 AI job postings.
2. The notebook formalizes preprocessing, feature engineering, model comparison, and DSO evaluation.
3. `train_models.py` serializes the retained models and configuration files into `talentlens-backend/models/`.
4. The FastAPI backend loads those artifacts and exposes prediction and platform endpoints.
5. The React frontend consumes backend responses to render recruiter, candidate, and admin experiences.

## Machine Learning Foundation

The backend is not an isolated API layer; it is a deployment of the ML work prepared in the notebook.

The notebook documents:

- Data loading and cleaning.
- Encoding of ordinal, categorical, and skill-related variables.
- Per-DSO feature selection.
- Benchmarking of several candidate models.
- Selection of retained models for deployment.
- Interpretation through feature importance, SHAP, clustering summaries, and counterfactual analysis.

### Dataset

The training dataset is `ai_job_dataset.csv`. It contains AI job market attributes such as:

- `job_title`
- `salary_usd`
- `experience_level`
- `remote_ratio`
- `required_skills`
- `education_required`
- `years_experience`
- `industry`
- `benefits_score`
- `posting_date`

This dataset feeds both:

- The model training pipeline.
- The backend summary endpoints used by dashboards and charts.

## The 5 DSOs

### DSO1: Anomaly Detection for Salary Offers

Business objective:
- Detect abnormal salary offers that are too high or too low relative to the market.

Notebook approach:
- Features include salary, years of experience, remote ratio, benefits score, and experience level.
- Multiple anomaly detection models were tested:
- `Isolation Forest`
- `Local Outlier Factor`
- `One-Class SVM`

Retained deployment model:
- `Isolation Forest`

Why it matters in the app:
- Powers offer intelligence.
- Helps recruiters identify risky offers likely to hurt acceptance rate or indicate budget inconsistency.

Backend endpoint:
- `POST /api/anomaly/check`

### DSO2: Salary Prediction

Business objective:
- Estimate a fair market salary for an AI role profile.

Notebook approach:
- Regression pipeline on encoded structured features.
- Several regression models were benchmarked:
- Linear Regression
- Polynomial Regression
- Random Forest Regressor
- `XGBoost Regressor`

Retained deployment model:
- `XGBoost Regressor`

Why it matters in the app:
- Used for recruiter salary benchmarking.
- Used for candidate salary check.
- Feeds compensation-related admin insights.

Backend endpoint:
- `POST /api/salary/predict`

### DSO3: Market Segmentation

Business objective:
- Discover natural segments in the AI jobs market and group similar roles.

Notebook approach:
- Standardized clustering features such as salary, experience, remote ratio, benefits score, and experience level.
- PCA was used for dimensional understanding and visualization.
- Clustering algorithms benchmarked:
- `K-Means`
- `DBSCAN`

Retained deployment model:
- `K-Means` with `k=4`

Resulting business segmentation:
- Junior
- Mid
- Senior
- Executive

Why it matters in the app:
- Supports market positioning.
- Drives cluster maps and workforce segmentation views.

Backend endpoint:
- `POST /api/segment/assign`

### DSO4: Job Recommendation Engine

Business objective:
- Match candidate-style profiles to the most relevant jobs.

Notebook approach:
- Recommendation built on structured ML features instead of NLP-only matching.
- The notebook explicitly frames this as a feature-space matching problem.
- Retained approach:
- `K-Nearest Neighbors` using Euclidean distance

Why this choice is important:
- It keeps the recommendation engine aligned with the same encoded feature space used elsewhere in the project.
- It is interpretable because distance between profiles and jobs can be explained.

Why it matters in the app:
- Powers candidate job matches.
- Also supports candidate-fit style reasoning on the recruiter side.

Backend endpoint:
- `POST /api/recommend/jobs`

### DSO5: Causal Career Optimization Engine

Business objective:
- Estimate salary and demand impact for a profile, then simulate growth scenarios.

Notebook approach:
- Mixed representation using:
- Numeric features
- TF-IDF on `job_title`
- Separate predictive layers for salary and demand
- Explainability and prescriptive layers:
- SHAP for feature influence
- Counterfactual analysis for “what-if” scenarios

Benchmarking and retained deployment models:
- `XGBoost` for salary prediction
- `LightGBM` for demand prediction
- `TF-IDF` for text encoding

Why it matters in the app:
- Powers candidate growth plan simulations.
- Feeds hiring signal and career optimization narratives.

Backend endpoint:
- `POST /api/career/optimize`

## Models Retained for Deployment

According to the notebook and the backend artifacts, the deployed stack is:

| DSO | Retained Model | Role in Platform |
|-----|----------------|------------------|
| DSO1 | Isolation Forest | Salary anomaly detection |
| DSO2 | XGBoost Regressor | Salary prediction |
| DSO3 | K-Means (k=4) | Market segmentation |
| DSO4 | KNN Euclidean | Job recommendation |
| DSO5 | XGBoost + LightGBM + TF-IDF + SHAP | Career optimization and demand analysis |

## Backend Responsibilities

The backend has two major responsibilities.

### 1. ML inference

It loads serialized artifacts from `talentlens-backend/models/` and exposes prediction endpoints for the five DSOs.

### 2. Product intelligence layer

It also computes dashboard-friendly summaries from the market data, such as:

- platform overview
- recruiter dashboard KPIs
- candidate home recommendations
- workforce segment summaries
- compensation audit previews
- hiring signal trends

This makes the frontend lighter and ensures that most business-facing insights come from backend logic and dataset-driven computation.

## Frontend Responsibilities

The frontend in `talentlens-frontend/` is the presentation layer.

It is responsible for:

- route-based product experiences
- forms for recruiter, candidate, and admin workflows
- data visualization
- rendering backend outputs in a polished product UI

The frontend should ideally avoid hardcoded business metrics and instead consume backend and dataset-derived responses.

## Main Product Screens Mapped to ML

| Product Screen | Primary DSO / Logic |
|----------------|---------------------|
| Recruiter Post a Role | DSO2 |
| Recruiter Offer Intelligence | DSO1 |
| Recruiter Candidate Fit | DSO4-derived fit logic |
| Recruiter Market Pulse | DSO3 + summary analytics |
| Candidate Job Matches | DSO4 |
| Candidate Salary Check | DSO2 |
| Candidate Growth Plan | DSO5 |
| Candidate Market Position | DSO3 |
| Admin Compensation Audit | DSO1 + DSO2 market comparison |
| Admin Talent Segment Map | DSO3 |
| Admin Hiring Signals | DSO5-inspired trend layer |

## Running the Project

### Backend

```bash
cd talentlens-backend
pip install -r requirements.txt
python train_models.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd talentlens-frontend
npm install
npm run dev
```

## Key ML-to-Backend Artifacts

The `models/` directory contains persisted assets generated from the notebook workflow and training script, including:

- trained model binaries
- scalers
- configuration files
- frequency maps
- recommender matrices
- parquet snapshots for backend market logic

These files let the backend reproduce notebook decisions in an API-friendly runtime form.

## Why This Project Is Strong

This project is stronger than a simple single-model demo because it combines multiple ML problem families in one coherent product:

- anomaly detection
- regression
- clustering
- recommendation
- explainable and prescriptive modeling

The DSOs are not isolated experiments. They are integrated into a platform where each model supports a real user workflow.

## Notebook Reference

The ML design and evaluation logic comes from:

- [ML_Modelisation_Complete.ipynb](C:\Users\ASUS\ML_Modelisation_Complete.ipynb)

That notebook is the best reference for:

- model benchmarking details
- visual diagnostics
- DSO reasoning
- feature engineering choices
- interpretation of results

## Future Improvements

- Add experiment tracking for model versioning.
- Add automated retraining and evaluation pipelines.
- Expose model metadata and evaluation metrics through a dedicated API endpoint.
- Add upload-driven scoring workflows for bulk recruiter and admin use cases.
- Strengthen documentation around preprocessing assumptions and feature contracts.
