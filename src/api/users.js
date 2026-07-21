import { jsonFetch } from "./auth.js";
import { API_BASE_URL } from "./baseUrl.js";

export function getUserById(userId) {
  return jsonFetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
  });
}

export function startCourse(userId, courseId) {
  return jsonFetch(`${API_BASE_URL}/users/${userId}/courses/`, {
    method: "POST",
    body: JSON.stringify({ id: courseId }),
  });
}

export function stopCourse(userId, courseId) {
  return jsonFetch(`${API_BASE_URL}/users/${userId}/courses/`, {
    method: "DELETE",
    body: JSON.stringify({ id: courseId }),
  });
}

export function batchSubmitReviewCards(userId, reviewedCards) {
  return jsonFetch(`${API_BASE_URL}/users/${userId}/reviewcards`, {
    method: "POST",
    body: JSON.stringify({ reviewedCards }),
  });
}
