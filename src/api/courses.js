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

function buildCoursesUrl(page) {
  const base = `${API_BASE_URL}/courses`;

  if (!Number.isFinite(page)) {
    return base;
  }

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}page=${String(page)}`;
}

export async function getCourses() {
  const firstPayload = await jsonFetch(buildCoursesUrl(1), {
    method: "GET",
  });

  if (Array.isArray(firstPayload)) {
    return firstPayload;
  }

  const firstPageCourses = normalizeListResponse(firstPayload);
  const meta = firstPayload?.meta;

  if (!meta || !meta.hasNextPage) {
    return firstPageCourses;
  }

  const allCourses = [...firstPageCourses];
  const maxPages = Number(meta.totalPages) || 1;
  let page = Number(meta.page) || 1;
  let hasNextPage = Boolean(meta.hasNextPage);

  // Follow backend pagination metadata to build a complete course list.
  while (hasNextPage && page < maxPages) {
    const nextPage = page + 1;
    const payload = await jsonFetch(buildCoursesUrl(nextPage), {
      method: "GET",
    });

    if (Array.isArray(payload)) {
      allCourses.push(...payload);
      break;
    }

    allCourses.push(...normalizeListResponse(payload));

    const nextMeta = payload?.meta;
    if (!nextMeta) {
      break;
    }

    page = Number(nextMeta.page) || nextPage;
    hasNextPage = Boolean(nextMeta.hasNextPage);
  }

  return allCourses;
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
