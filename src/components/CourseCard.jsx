import { Badge, Button, Card, Group, Progress, Text } from "@mantine/core";
import { useState } from "react";
import { useAuth } from "../context/useAuth.jsx";

export default function CourseCard({
  course,
  onClick,
  isNew,
  onRemove,
  removing,
  viewMode = "grid",
}) {
  const { user } = useAuth();
  const [showAllTags, setShowAllTags] = useState(false);

  function normalizeIdValue(value) {
    if (value == null) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    if (typeof value !== "object") return "";

    const candidates = [
      value.coursewareId,
      value.courseId,
      value._id,
      value.id,
      value.$oid,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeIdValue(candidate);
      if (normalized) return normalized;
    }

    return "";
  }

  function getId(value) {
    return normalizeIdValue(value);
  }

  function getCourseId(value) {
    return normalizeIdValue(value);
  }

  const courseId = getCourseId(course);
  const allCoursewares = course?.coursewares || [];

  const completedForCourse = (user?.myCompletedCoursewares || []).filter(
    (cw) => {
      const cwCourseId = getCourseId(cw);
      return !cwCourseId || cwCourseId === courseId;
    },
  );

  const totalCount = allCoursewares.length;
  const completedCount = allCoursewares.length
    ? allCoursewares.filter((cw) =>
        completedForCourse.some((done) => getId(done) === getId(cw)),
      ).length
    : completedForCourse.length;

  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isList = viewMode === "list";

  function getKeywordPartsFromString(value) {
    return String(value ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function getKeywordLabel(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return String(value.name ?? value.label ?? value.title ?? "").trim();
    }
    return "";
  }

  function getCourseKeywords(value) {
    const sources = [
      value?.keywords,
      value?.keyword,
      value?.tags,
      value?.tag,
      value?.topics,
      value?.category,
      value?.categories,
    ];

    const rawKeywords = [];

    sources.forEach((source) => {
      if (Array.isArray(source)) {
        source.forEach((item) => {
          const label = getKeywordLabel(item);
          if (!label) return;
          rawKeywords.push(...getKeywordPartsFromString(label));
        });
        return;
      }

      const label = getKeywordLabel(source);
      if (!label) return;
      rawKeywords.push(...getKeywordPartsFromString(label));
    });

    const uniqueKeywords = [];
    const seen = new Set();

    rawKeywords.forEach((keyword) => {
      const normalized = keyword.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      uniqueKeywords.push(keyword);
    });

    return uniqueKeywords;
  }

  const keywordChips = getCourseKeywords(course);
  const maxVisibleTags = 3;
  const hasMoreTags = keywordChips.length > maxVisibleTags;
  const visibleTags = showAllTags
    ? keywordChips
    : keywordChips.slice(0, maxVisibleTags);

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {isList ? (
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <div style={{ flex: 1 }}>
            <Text fw={500} size="lg" mb="sm">
              {course.title}
            </Text>

            {!isNew && totalCount > 0 && (
              <>
                <Progress value={progress} size="sm" radius="xl" mb="xs" />
                <Text size="xs" c="dimmed">
                  {completedCount}/{totalCount} coursewares completed
                </Text>
              </>
            )}
          </div>

          {!isNew && onRemove && (
            <Button
              color="red"
              variant="light"
              size="xs"
              loading={removing}
              onClick={(event) => {
                event.stopPropagation();
                onRemove(course);
              }}
            >
              Remove Course
            </Button>
          )}
        </Group>
      ) : (
        <>
          <Text fw={500} size="lg" mb="sm">
            {course.title}
          </Text>

          {keywordChips.length > 0 && (
            <>
              <Group gap="xs" mb="xs">
                {visibleTags.map((keyword) => (
                  <Badge key={keyword} variant="light" color="gray">
                    {keyword}
                  </Badge>
                ))}
              </Group>
              {hasMoreTags && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="compact-xs"
                  px={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowAllTags((prev) => !prev);
                  }}
                >
                  {showAllTags
                    ? "Show less"
                    : `Show ${keywordChips.length - maxVisibleTags} more`}
                </Button>
              )}
            </>
          )}

          {!isNew && totalCount > 0 && (
            <>
              <Progress value={progress} size="sm" radius="xl" mb="xs" />
              <Text size="xs" c="dimmed">
                {completedCount}/{totalCount} coursewares completed
              </Text>
            </>
          )}

          {!isNew && onRemove && (
            <Group justify="flex-end" mt="md">
              <Button
                color="red"
                variant="light"
                size="xs"
                loading={removing}
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(course);
                }}
              >
                Remove Course
              </Button>
            </Group>
          )}
        </>
      )}
    </Card>
  );
}
