import { jsonFetch } from "./auth.js";
import { API_BASE_URL } from "./baseUrl.js";

export function submitCourseware(userId, coursewareId) {
  return jsonFetch(
    `${API_BASE_URL}/users/${userId}/coursewares/${coursewareId}`,
    {
      method: "PUT",
    },
  );
}
