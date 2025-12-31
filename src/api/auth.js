const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error("Request failed");
    data = {};
  }
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function signup({ name, email, password }) {
  return jsonFetch(`${API}/users`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return jsonFetch(`${API}/users/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return jsonFetch(`${API}/users/me`, {
    method: "GET",
  });
}

export async function logout() {
  return jsonFetch(`${API}/users/logout`, {
    method: "POST",
  });
}

export { jsonFetch };
