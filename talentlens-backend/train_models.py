"""
TalentLens — ML Training Pipeline
Trains and serializes all 5 models (DSO1–DSO5) from ai_job_dataset.csv
Run: python train_models.py
"""

import os, json, warnings
import numpy as np
import pandas as pd
import joblib
import scipy.sparse as sp
from collections import Counter

from sklearn.preprocessing import (
    OrdinalEncoder, StandardScaler, MinMaxScaler, MultiLabelBinarizer
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score, davies_bouldin_score
)
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor, NearestNeighbors
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
import xgboost as xgb

warnings.filterwarnings("ignore")

# ── Paths ────────────────────────────────────────────────────────────────────
DATA_PATH   = os.environ.get("DATA_PATH", "ai_job_dataset.csv")
MODELS_DIR  = os.environ.get("MODELS_DIR", "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def save(obj, name):
    path = os.path.join(MODELS_DIR, f"{name}.joblib")
    joblib.dump(obj, path)
    print(f"  ✅ Saved  →  {path}")

def save_json(obj, name):
    path = os.path.join(MODELS_DIR, f"{name}.json")
    with open(path, "w") as f:
        json.dump(obj, f, indent=2)
    print(f"  ✅ Saved  →  {path}")


# ═══════════════════════════════════════════════════════════════════════════
#  0. LOAD & DECODE RAW DATA
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  STEP 0 — Loading & Decoding Dataset")
print("="*65)

df_raw = pd.read_csv(DATA_PATH)
print(f"  Loaded  : {df_raw.shape[0]:,} rows × {df_raw.shape[1]} cols")

df = df_raw.copy()

# Decode ordinal categories
df["experience_level"] = df["experience_level"].map({
    "EN": "Entry Level", "MI": "Mid Level",
    "SE": "Senior Level", "EX": "Executive Level"
})
df["company_size"] = df["company_size"].map(
    {"S": "Small", "M": "Medium", "L": "Large"}
)
df["employment_type"] = df["employment_type"].map({
    "FT": "Full-Time", "FL": "Freelance",
    "CT": "Contract", "PT": "Part-Time"
})

# Parse skills list
df["required_skills"] = df["required_skills"].str.split(",").apply(
    lambda x: [s.strip() for s in x if s.strip()]
)

df_orig = df.copy()   # keep human-readable copy for DSO4 results

# ── Feature engineering ────────────────────────────────────────────────────
df_ml = df.copy()
drop_cols = ["job_id", "salary_currency", "job_description_length",
             "company_name", "posting_date", "application_deadline"]
df_ml.drop(columns=drop_cols, inplace=True, errors="ignore")

# MultiLabelBinarizer for skills
mlb = MultiLabelBinarizer()
skills_enc = pd.DataFrame(
    mlb.fit_transform(df_ml["required_skills"]),
    columns=mlb.classes_, index=df_ml.index
)
df_ml.drop(columns=["required_skills"], inplace=True)
df_ml = pd.concat([df_ml, skills_enc], axis=1)

# Frequency encoding for location columns
freq_maps = {}
for col in ["company_location", "employee_residence"]:
    freq_map = df_ml[col].value_counts().to_dict()
    df_ml[col] = df_ml[col].map(freq_map)
    freq_maps[col] = freq_map

# Ordinal encoding
ordinal_cols = ["experience_level", "company_size", "education_required"]
ordinal_cats = [
    ["Entry Level", "Mid Level", "Senior Level", "Executive Level"],
    ["Small", "Medium", "Large"],
    ["Associate", "Bachelor", "Master", "PhD"],
]
ordinal_enc = OrdinalEncoder(categories=ordinal_cats)
df_ml[ordinal_cols] = ordinal_enc.fit_transform(df_ml[ordinal_cols])

# One-hot encoding
df_ml = pd.get_dummies(df_ml, columns=["employment_type", "industry"], drop_first=False)

# Store industry column names
industry_cols = [c for c in df_ml.columns if c.startswith("industry_")]

print(f"  ML dataset : {df_ml.shape[0]:,} rows × {df_ml.shape[1]} cols")

# Save preprocessing artifacts
save(mlb,         "mlb_skills")
save(ordinal_enc, "ordinal_enc")
save_json(freq_maps, "freq_maps")
save_json({
    "ordinal_cols":  ordinal_cols,
    "ordinal_cats":  ordinal_cats,
    "drop_cols":     drop_cols,
    "industry_cols": industry_cols,
    "skill_classes": list(mlb.classes_),
}, "feature_config")

# Save df_orig for DSO4 job lookups
df_orig_save = df_orig.copy()
df_orig_save["required_skills"] = df_orig_save["required_skills"].apply(
    lambda x: ",".join(x) if isinstance(x, list) else x
)
df_orig_save.to_parquet(os.path.join(MODELS_DIR, "df_orig.parquet"), index=False)
print("  ✅ Saved  →  models/df_orig.parquet")


# ═══════════════════════════════════════════════════════════════════════════
#  1. DSO1 — ANOMALY DETECTION (Isolation Forest)
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  DSO1 — Anomaly Detection : Isolation Forest")
print("="*65)

anomaly_features = [
    "salary_usd", "years_experience", "remote_ratio",
    "benefits_score", "experience_level"
]
X_anom = df_ml[anomaly_features].copy()

scaler_anom = StandardScaler()
X_anom_scaled = scaler_anom.fit_transform(X_anom)

iso = IsolationForest(n_estimators=200, contamination=0.05,
                      random_state=42, n_jobs=-1)
iso.fit(X_anom_scaled)
iso_labels = iso.predict(X_anom_scaled)

n_anom = (iso_labels == -1).sum()
print(f"  Anomalies detected : {n_anom} ({n_anom/len(iso_labels)*100:.1f}%)")

# Percentile thresholds for the API output
sal_anom = df_orig.loc[iso_labels == -1, "salary_usd"]
print(f"  Anomaly salary median : ${sal_anom.median():,.0f}")

save(iso,         "dso1_isolation_forest")
save(scaler_anom, "dso1_scaler")
save_json({"anomaly_features": anomaly_features}, "dso1_config")


# ═══════════════════════════════════════════════════════════════════════════
#  2. DSO2 — SALARY REGRESSION (XGBoost)
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  DSO2 — Salary Regression : XGBoost")
print("="*65)

feature_cols_reg = [
    c for c in df_ml.columns
    if c not in ["salary_usd", "job_title"]
    and df_ml[c].dtype in ["float64", "int64", "uint8"]
]

X_reg = df_ml[feature_cols_reg]
y_reg = df_ml["salary_usd"]

X_tr, X_te, y_tr, y_te = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

xgb_reg = xgb.XGBRegressor(
    n_estimators=300, max_depth=8, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    reg_alpha=0.1, reg_lambda=1.0,
    random_state=42, verbosity=0, n_jobs=-1
)
xgb_reg.fit(X_tr, y_tr, eval_set=[(X_te, y_te)], verbose=False)
pred = xgb_reg.predict(X_te)

rmse = np.sqrt(mean_squared_error(y_te, pred))
mae  = mean_absolute_error(y_te, pred)
r2   = r2_score(y_te, pred)
print(f"  R² = {r2:.4f}  |  RMSE = ${rmse:,.0f}  |  MAE = ${mae:,.0f}")

# Salary percentiles for confidence bands
salary_percentiles = {
    "p10": float(np.percentile(y_reg, 10)),
    "p25": float(np.percentile(y_reg, 25)),
    "p50": float(np.percentile(y_reg, 50)),
    "p75": float(np.percentile(y_reg, 75)),
    "p90": float(np.percentile(y_reg, 90)),
    "mean": float(y_reg.mean()),
    "std": float(y_reg.std()),
}

# By experience level medians (for comparison table in API)
exp_labels = ["Entry Level", "Mid Level", "Senior Level", "Executive Level"]
exp_medians = {}
for i, lbl in enumerate(exp_labels):
    mask = df_ml["experience_level"] == i
    exp_medians[lbl] = float(df_orig.loc[mask, "salary_usd"].median())

save(xgb_reg,  "dso2_xgboost_reg")
save_json({
    "feature_cols": feature_cols_reg,
    "r2": r2, "rmse": rmse, "mae": mae,
    "salary_percentiles": salary_percentiles,
    "exp_medians": exp_medians,
    "market_median": float(y_reg.median()),
    "training_mean": float(y_reg.mean()),
    "training_std":  float(y_reg.std()),
}, "dso2_config")


# ═══════════════════════════════════════════════════════════════════════════
#  3. DSO3 — MARKET SEGMENTATION (K-Means k=4)
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  DSO3 — Market Segmentation : K-Means (k=4)")
print("="*65)

clust_features = [
    "salary_usd", "years_experience", "remote_ratio",
    "benefits_score", "experience_level"
]
X_clust = df_ml[clust_features].copy()

scaler_clust = StandardScaler()
X_scaled = scaler_clust.fit_transform(X_clust)

km = KMeans(n_clusters=4, random_state=42, n_init=10)
km_labels = km.fit_predict(X_scaled)
df_ml["cluster_km"] = km_labels

sil = silhouette_score(X_scaled, km_labels, sample_size=3000)
dbi = davies_bouldin_score(X_scaled, km_labels)
print(f"  Silhouette = {sil:.4f}  |  Davies-Bouldin = {dbi:.4f}")

# Build cluster profiles (real means)
cluster_profile = (
    df_ml.groupby("cluster_km")[
        ["salary_usd", "years_experience", "remote_ratio",
         "benefits_score", "experience_level"]
    ]
    .mean()
)
# Assign human-readable names by salary order
salary_order = cluster_profile["salary_usd"].sort_values().index.tolist()
SEGMENT_NAMES = {
    salary_order[0]: "Junior",
    salary_order[1]: "Mid-Level",
    salary_order[2]: "Senior",
    salary_order[3]: "Executive",
}
cluster_meta = {}
for km_id, name in SEGMENT_NAMES.items():
    row = cluster_profile.loc[km_id]
    count = int((km_labels == km_id).sum())
    cluster_meta[str(km_id)] = {
        "name": name,
        "count": count,
        "pct_market": round(count / len(km_labels) * 100, 1),
        "avg_salary": round(float(row["salary_usd"])),
        "avg_years_exp": round(float(row["years_experience"]), 1),
        "avg_remote": round(float(row["remote_ratio"])),
        "avg_benefits": round(float(row["benefits_score"]), 1),
    }

# Top skills per cluster
df_cluster_skills = df_orig.copy()
df_cluster_skills["cluster"] = km_labels
skill_by_cluster = {}
for km_id, name in SEGMENT_NAMES.items():
    subset = df_cluster_skills[df_cluster_skills["cluster"] == km_id]["required_skills"]
    all_skills = [s for sublist in subset for s in sublist]
    top10 = [skill for skill, _ in Counter(all_skills).most_common(10)]
    skill_by_cluster[str(km_id)] = top10

save(km,           "dso3_kmeans")
save(scaler_clust, "dso3_scaler")
save_json({
    "clust_features": clust_features,
    "segment_names": {str(k): v for k, v in SEGMENT_NAMES.items()},
    "cluster_meta": cluster_meta,
    "top_skills_per_cluster": skill_by_cluster,
    "silhouette": sil, "davies_bouldin": dbi,
}, "dso3_config")


# ═══════════════════════════════════════════════════════════════════════════
#  4. DSO4 — JOB RECOMMENDER (KNN Euclidean)
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  DSO4 — Job Recommender : KNN Euclidean (k=5)")
print("="*65)

rec_base_features = [
    "years_experience", "experience_level",
    "remote_ratio", "benefits_score", "education_required"
]
top_industry_cols = industry_cols[:10]
rec_all_features = rec_base_features + top_industry_cols

X_rec = df_ml[rec_all_features].copy()

scaler_rec = StandardScaler()
X_rec_scaled = scaler_rec.fit_transform(X_rec)

knn = NearestNeighbors(n_neighbors=6, algorithm="ball_tree",
                       metric="euclidean", n_jobs=-1)
knn.fit(X_rec_scaled)

print(f"  KNN index built on {X_rec_scaled.shape[0]:,} jobs × "
      f"{X_rec_scaled.shape[1]} features")

save(knn,       "dso4_knn")
save(scaler_rec,"dso4_scaler")
save(X_rec_scaled, "dso4_rec_matrix")   # needed for inference
save_json({
    "rec_base_features": rec_base_features,
    "rec_all_features":  rec_all_features,
    "top_industry_cols": top_industry_cols,
    "n_neighbors": 6,
}, "dso4_config")


# ═══════════════════════════════════════════════════════════════════════════
#  5. DSO5 — CAUSAL CAREER OPTIMIZER
#     XGBoost (salary) + LightGBM (demand) + TF-IDF + SHAP + Counterfactual
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  DSO5 — Causal Career Optimizer")
print("="*65)

# Build demand_score proxy (normalised job_title frequency, 0–10)
job_counts = df_raw["job_title"].map(df_raw["job_title"].value_counts())
denom = job_counts.max() - job_counts.min()
df_ml["demand_score"] = ((job_counts - job_counts.min()) / denom * 10
                          ).clip(0, 10)

# TF-IDF on job_title
title_col = df_raw["job_title"].fillna("")
tfidf = TfidfVectorizer(max_features=50, stop_words="english",
                         ngram_range=(1, 2))
X_title_tfidf = tfidf.fit_transform(title_col)

numeric_cols_dso5 = [
    c for c in df_ml.columns
    if c not in ["salary_usd", "demand_score", "job_title", "benefits_score"]
    and df_ml[c].dtype in ["float64", "int64", "uint8"]
]

X_numeric = sp.csr_matrix(df_ml[numeric_cols_dso5].fillna(0).values)
n_rows = min(X_title_tfidf.shape[0], X_numeric.shape[0])
X_combined = sp.hstack([X_numeric[:n_rows], X_title_tfidf[:n_rows]])

y_salary = df_ml["salary_usd"].values[:n_rows]
y_demand = df_ml["demand_score"].values[:n_rows]

X_tr5, X_te5, y_tr_s, y_te_s, y_tr_d, y_te_d = train_test_split(
    X_combined, y_salary, y_demand, test_size=0.2, random_state=42
)

# XGBoost → salary
xgb_sal = xgb.XGBRegressor(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.7,
    reg_alpha=0.1, reg_lambda=1.0,
    random_state=42, verbosity=0, n_jobs=-1
)
xgb_sal.fit(X_tr5, y_tr_s, eval_set=[(X_te5, y_te_s)], verbose=False)
pred_sal = xgb_sal.predict(X_te5)
r2_sal   = r2_score(y_te_s, pred_sal)
rmse_sal = np.sqrt(mean_squared_error(y_te_s, pred_sal))
print(f"  XGBoost salary  → R² = {r2_sal:.4f}  RMSE = ${rmse_sal:,.0f}")

# LightGBM → demand (fallback to XGBoost if not installed)
try:
    import lightgbm as lgb
    lgb_dem = lgb.LGBMRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.7,
        reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, verbose=-1, n_jobs=-1
    )
    lgb_dem.fit(X_tr5, y_tr_d)
    dem_model_name = "LightGBM"
    save(lgb_dem, "dso5_lgbm_demand")
except ImportError:
    lgb_dem = xgb.XGBRegressor(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        random_state=42, verbosity=0, n_jobs=-1
    )
    lgb_dem.fit(X_tr5, y_tr_d)
    dem_model_name = "XGBoost (fallback)"
    save(lgb_dem, "dso5_lgbm_demand")

pred_dem = lgb_dem.predict(X_te5)
r2_dem   = r2_score(y_te_d, pred_dem)
rmse_dem = np.sqrt(mean_squared_error(y_te_d, pred_dem))
print(f"  {dem_model_name} demand → R² = {r2_dem:.4f}  RMSE = {rmse_dem:.4f}")

# SHAP feature importance (top 15, computed once at training time)
try:
    import shap
    X_dense_sample = X_te5[:500].toarray()
    explainer = shap.TreeExplainer(xgb_sal)
    shap_vals  = explainer.shap_values(X_dense_sample)
    tfidf_names = [f"title_tfidf_{t}" for t in tfidf.get_feature_names_out()]
    all_feat_names = numeric_cols_dso5 + tfidf_names
    shap_importance = dict(
        sorted(
            {all_feat_names[i]: float(np.abs(shap_vals).mean(axis=0)[i])
             for i in range(len(all_feat_names))}.items(),
            key=lambda x: x[1], reverse=True
        )
    )
    top15_shap = dict(list(shap_importance.items())[:15])
    print(f"  SHAP top feature: {list(top15_shap.keys())[0]}")
except Exception as e:
    top15_shap = {}
    print(f"  SHAP skipped: {e}")

save(xgb_sal, "dso5_xgboost_salary")
save(tfidf,   "dso5_tfidf")
save_json({
    "numeric_cols_dso5":  numeric_cols_dso5,
    "dem_model_name":     dem_model_name,
    "r2_salary":  r2_sal,
    "rmse_salary": rmse_sal,
    "r2_demand":  r2_dem,
    "rmse_demand": rmse_dem,
    "top15_shap": top15_shap,
    "counterfactual_features": [
        "years_experience", "remote_ratio", "experience_level"
    ],
    "demand_score_range": [
        float(df_ml["demand_score"].min()),
        float(df_ml["demand_score"].max())
    ],
}, "dso5_config")


# ═══════════════════════════════════════════════════════════════════════════
#  FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════
print("\n" + "="*65)
print("  ALL MODELS TRAINED & SERIALIZED")
print("="*65)
models_dir = os.listdir(MODELS_DIR)
total_bytes = sum(
    os.path.getsize(os.path.join(MODELS_DIR, f))
    for f in models_dir
)
print(f"  Files  : {len(models_dir)}")
print(f"  Size   : {total_bytes / 1024 / 1024:.1f} MB")
print(f"  Dir    : {os.path.abspath(MODELS_DIR)}/")
print()
for f in sorted(models_dir):
    size = os.path.getsize(os.path.join(MODELS_DIR, f)) / 1024
    print(f"    {f:<40}  {size:>8.1f} KB")
print()
print("  ✅ Ready for FastAPI deployment — run: uvicorn app.main:app --reload")
