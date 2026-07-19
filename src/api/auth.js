import { API_BASE_URL } from "./baseUrl.js";

async function jsonFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      const err = new Error("Request failed");
      err.status = res.status;
      throw err;
    }
    data = {};
  }
  if (!res.ok) {
    const err = new Error(data.message || "Request failed");
    err.status = res.status;
    throw err;
  }
  return data;
}

export function signup({ name, email, password }) {
  return jsonFetch(`${API_BASE_URL}/users`, {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login({ email, password }) {
  return jsonFetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return jsonFetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
  });
}

export async function logout() {
  return jsonFetch(`${API_BASE_URL}/users/logout`, {
    method: "POST",
  });
}

export { jsonFetch };
