const API_URL = window.JUNERA_API_URL || "https://junera-backend.onrender.com/api";

function getAuthHeaders() {
  const token = localStorage.getItem("junera_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth/")) {
      localStorage.removeItem("junera_token");
      localStorage.removeItem("junera_user");
    }
    throw new Error(data.message || data.error || `Erreur API (${response.status})`);
  }
  return data;
}

async function loginUser(payload) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  localStorage.setItem("junera_token", data.token);
  localStorage.setItem("junera_user", JSON.stringify(data.user));
  return data;
}

async function registerUser(payload) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  localStorage.setItem("junera_token", data.token);
  localStorage.setItem("junera_user", JSON.stringify(data.user));
  return data;
}

function logoutUser() {
  localStorage.removeItem("junera_token");
  localStorage.removeItem("junera_user");
  window.location.href = "login.html";
}

const getCurrentUser = () => apiRequest("/auth/me");
const getObligations = () => apiRequest("/obligations");
const getActions = () => apiRequest("/actions");
const updateObligation = (id, payload) => apiRequest(`/obligations/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
const updateAction = (id, payload) => apiRequest(`/actions/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

Object.assign(window, {
  API_URL,
  apiRequest,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getObligations,
  getActions,
  updateObligation,
  updateAction,
});
