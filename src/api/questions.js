import { jsonFetch } from "./auth.js";
import { API_BASE_URL } from "./baseUrl.js";

export function getQuestionsByCourseware(coursewareId) {
  return jsonFetch(`${API_BASE_URL}/questions/courseware/${coursewareId}`, {
    method: "GET",
    cache: "no-store",
  });
}
