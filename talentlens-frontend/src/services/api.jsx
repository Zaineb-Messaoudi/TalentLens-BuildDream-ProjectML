const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}`);
  }

  return response.json();
}

export const api = {
  salaryPredict(payload) {
    return request("/api/salary/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  anomalyCheck(payload) {
    return request("/api/anomaly/check", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  segmentAssign(payload) {
    return request("/api/segment/assign", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  recommendJobs(payload) {
    return request("/api/recommend/jobs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  careerOptimize(payload) {
    return request("/api/career/optimize", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
