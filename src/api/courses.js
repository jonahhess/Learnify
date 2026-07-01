import { jsonFetch } from "./auth";
import { API_BASE_URL } from "./baseUrl.js";

export function getCourses() {
  return jsonFetch(`${API_BASE_URL}/courses`, {
    method: "GET",
  });
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
