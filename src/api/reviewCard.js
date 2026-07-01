import { jsonFetch } from "./auth.js";
import { API_BASE_URL } from "./baseUrl.js";

export function getReviewCards() {
  return jsonFetch(`${API_BASE_URL}/review-cards`, { method: "GET" });
}

export function getReviewCardById(id) {
  return jsonFetch(`${API_BASE_URL}/review-cards/${id}`, { method: "GET" });
}

export function updateReviewCard(id, success) {
  return jsonFetch(`${API_BASE_URL}/review-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify({ success }),
  });
}

export function deleteReviewCard(id) {
  return jsonFetch(`${API_BASE_URL}/review-cards/${id}`, { method: "DELETE" });
}
