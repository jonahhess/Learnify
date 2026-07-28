import { jsonFetch } from "./auth";
import { API_BASE_URL } from "./baseUrl.js";

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export async function getCourses() {
  const payload = await jsonFetch(`${API_BASE_URL}/courses`, {
    method: "GET",
  });

  return normalizeListResponse(payload);
}

export function getCoursewares() {
  return jsonFetch(`${API_BASE_URL}/coursewares`, {
    method: "GET",
  });
}

export function getCourseById(courseId) {
  return jsonFetch(`${API_BASE_URL}/courses/${courseId}`, {
    method: "GET",
  });
}

export function getCoursewareById(coursewareId) {
  return jsonFetch(`${API_BASE_URL}/coursewares/${coursewareId}`, {
    method: "GET",
  });
}
