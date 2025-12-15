const API_URL = "https://junera-backend.onrender.com/api";


function getAuthHeaders() {
  const token = localStorage.getItem("junera_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getObligations() {
  const res = await fetch(`${API_URL}/obligations`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

async function getActions() {
  const res = await fetch(`${API_URL}/actions`, {
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}

/* OBLIGATIONS CRUD */
async function createObligation(payload) {
  const res = await fetch(`${API_URL}/obligations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function updateObligation(id, payload) {
  const res = await fetch(`${API_URL}/obligations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders()
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

async function deleteObligation(id) {
  const res = await fetch(`${API_URL}/obligations/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() }
  });
  return res.json();
}
