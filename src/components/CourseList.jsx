import { useMemo, useState } from "react";
import {
  Button,
  Collapse,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import CourseCard from "./CourseCard.jsx";

function getCourseId(value) {
  if (value == null) return "";

  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }

  if (typeof value !== "object") return "";

  const candidates = [
    value.courseId,
    value._id,
    value.id,
    value.coursewareId,
    value.$oid,
  ];

  for (const candidate of candidates) {
    const normalized = getCourseId(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getCourseTitle(course) {
  return String(course?.title ?? course?.name ?? "");
}

function getCourseKeywords(course) {
  const candidates = [
    course?.keywords,
    course?.keyword,
    course?.tags,
    course?.tag,
    course?.topics,
    course?.category,
    course?.categories,
  ];

  const values = [];

  candidates.forEach((candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach((item) => {
        if (typeof item === "string") {
          values.push(item);
        } else if (item && typeof item === "object") {
          values.push(item.name ?? item.label ?? item.title ?? "");
        }
      });
      return;
    }

    if (typeof candidate === "string") {
      values.push(candidate);
    }
  });

  return values.map((value) => normalizeText(value)).filter(Boolean);
}

export default function CourseList({
  courses = [],
  onSelectCourse,
  isNew,
  onRemoveCourse,
  removingCourseId,
}) {
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [titleFilter, setTitleFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");

  const normalizedTitleFilter = normalizeText(titleFilter);
  const keywordTerms = normalizeText(keywordFilter)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const title = normalizeText(getCourseTitle(course));
      const keywords = getCourseKeywords(course);

      const titleMatch =
        !normalizedTitleFilter || title.includes(normalizedTitleFilter);
      const keywordMatch =
        keywordTerms.length === 0 ||
        keywordTerms.every((term) =>
          keywords.some((keyword) => keyword.includes(term)),
        );

      return titleMatch && keywordMatch;
    });
  }, [courses, normalizedTitleFilter, keywordTerms]);

  const courseCards = filteredCourses.map((course) => (
    <CourseCard
      key={getCourseId(course) || getCourseTitle(course)}
      course={course}
      isNew={isNew}
      viewMode={viewMode}
      onClick={() => onSelectCourse?.(course)}
      onRemove={onRemoveCourse}
      removing={removingCourseId === getCourseId(course)}
    />
  ));

  return (
    <Stack>
      <Paper withBorder p="md" radius="md">
        <Stack gap="sm">
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="xs">
              <Text fw={600}>Courses</Text>
              <Button
                variant="light"
                size="xs"
                onClick={() => setShowFilters((value) => !value)}
              >
                {showFilters ? "Hide filters" : "Show filters"}
              </Button>
            </Group>

            <SegmentedControl
              value={viewMode}
              onChange={setViewMode}
              data={[
                { label: "Grid", value: "grid" },
                { label: "List", value: "list" },
              ]}
            />
          </Group>

          <Collapse in={showFilters}>
            <Group wrap="wrap" grow align="flex-end">
              <TextInput
                label="Filter by course name"
                placeholder="Search titles"
                value={titleFilter}
                onChange={(event) => setTitleFilter(event.currentTarget.value)}
                w={{ base: "100%", sm: 280 }}
              />
              <TextInput
                label="Filter by keywords"
                placeholder="e.g. react, backend"
                description="Separate multiple keywords with commas"
                value={keywordFilter}
                onChange={(event) =>
                  setKeywordFilter(event.currentTarget.value)
                }
                w={{ base: "100%", sm: 320 }}
              />
            </Group>
          </Collapse>
        </Stack>
      </Paper>

      <Text size="sm" c="dimmed">
        Showing {filteredCourses.length} of {courses.length} courses
      </Text>

      {filteredCourses.length === 0 ? (
        <Text c="dimmed">No courses match the current filters.</Text>
      ) : viewMode === "grid" ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>{courseCards}</SimpleGrid>
      ) : (
        <Stack>{courseCards}</Stack>
      )}
    </Stack>
  );
}
