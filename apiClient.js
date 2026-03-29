const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function loginAdmin(payload) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function fetchDashboard() {
  return request("/dashboard");
}

export async function fetchUsers() {
  return request("/users");
}

export async function saveUserToApi(user) {
  const method = user.id ? "PUT" : "POST";
  const path = user.id ? `/users/${user.id}` : "/users";
  return request(path, { method, body: JSON.stringify(user) });
}

export async function deleteUserFromApi(userId) {
  return request(`/users/${userId}`, { method: "DELETE" });
}

export async function fetchActivity() {
  return request("/activity");
}

export async function saveActivityToApi(entry) {
  return request("/activity", { method: "POST", body: JSON.stringify(entry) });
}

export async function resetApiData() {
  return request("/dashboard/reset", { method: "POST" });
}
