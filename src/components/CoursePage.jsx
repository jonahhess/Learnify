import { useState } from "react";
import { Container, Title, Text, Stack, Button } from "@mantine/core";
import CoursewarePlayer from "./CoursewarePlayer.jsx";
import CourseSummary from "./CourseSummary.jsx";
import CoursewareList from "./CoursewareList.jsx";
import { startCourseware } from "../api/coursewares.js";

export default function CoursePage({ course, user, updateUser }) {
  const [selectedCourseware, setSelectedCourseware] = useState(null);
  const availableCoursewares = course?.coursewares || [];

  function getId(value) {
    return String(value?.coursewareId ?? value?._id ?? value?.id ?? "");
  }

  function getCourseId(value) {
    return String(value?.courseId ?? value?._id ?? value?.id ?? "");
  }

  const courseId = getCourseId(course);

  const completedIds = new Set(
    (user?.myCompletedCoursewares || [])
      .filter((cw) => {
        const cwCourseId = getCourseId(cw);
        return !cwCourseId || cwCourseId === courseId;
      })
      .map(getId),
  );

  const currentIds = new Set(
    (user?.myCurrentCoursewares || [])
      .filter((cw) => {
        const cwCourseId = getCourseId(cw);
        return !cwCourseId || cwCourseId === courseId;
      })
      .map(getId),
  );

  const completedCount = availableCoursewares.filter((cw) =>
    completedIds.has(getId(cw)),
  ).length;
  const allCompleted =
    availableCoursewares.length > 0 &&
    completedCount === availableCoursewares.length;

  const statusById = availableCoursewares.reduce((acc, cw) => {
    const id = getId(cw);

    if (completedIds.has(id)) {
      acc[id] = "completed";
    } else if (currentIds.has(id)) {
      acc[id] = "current";
    } else {
      acc[id] = cw.coursewareId ? "ready" : "idle";
    }

    return acc;
  }, {});

  function handleComplete(passed) {
    if (!passed) return;
    setSelectedCourseware(null);
    updateUser();
  }

  async function handleSelectCourseware(courseware) {
    const coursewareId = courseware?.coursewareId || courseware?._id;
    const status = statusById[getId(courseware)];

    if (
      user?._id &&
      coursewareId &&
      (status === "ready" || status === "idle")
    ) {
      await startCourseware(user._id, coursewareId);
    }

    setSelectedCourseware(courseware);
  }

  if (allCompleted) {
    return <CourseSummary course={course} coursewares={course.coursewares} />;
  }

  return (
    <Container py="xl">
      {!selectedCourseware ? (
        <>
          <Title order={2} mb="md">
            {course.title}
          </Title>

          {availableCoursewares.length > 0 ? (
            <CoursewareList
              coursewares={availableCoursewares}
              statusById={statusById}
              onSelect={handleSelectCourseware}
            />
          ) : (
            <Stack>
              <Text c="dimmed">
                No coursewares available for this course yet.
              </Text>
              <Button color="blue" variant="outline">
                Generate new courseware for this course
              </Button>
            </Stack>
          )}
        </>
      ) : (
        <CoursewarePlayer
          courseware={selectedCourseware}
          onComplete={handleComplete}
          cwStatus={statusById[getId(selectedCourseware)]}
        />
      )}
    </Container>
  );
}
