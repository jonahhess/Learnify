import { jsonFetch } from "./auth.js";
import { API_BASE_URL } from "./baseUrl.js";

export function generateCourseOutline({ title }) {
  return jsonFetch(`${API_BASE_URL}/ai/outline`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function generateCourseware({ courseId, courseTitle, title }) {
  return jsonFetch(`${API_BASE_URL}/ai/courseware`, {
    method: "POST",
    body: JSON.stringify({ courseId, courseTitle, title }),
  });
}
