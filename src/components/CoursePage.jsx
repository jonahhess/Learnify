import { useEffect, useState } from "react";
import { Container, Title, Text, Stack, Button } from "@mantine/core";
import CoursewarePlayer from "./CoursewarePlayer.jsx";
import CourseSummary from "./CourseSummary.jsx";
import CoursewareList from "./CoursewareList.jsx";
import { startCourseware } from "../api/coursewares.js";
import { getCourseById } from "../api/courses.js";

export default function CoursePage({ course, user, updateUser }) {
  const [courseData, setCourseData] = useState(course);
  const [selectedCourseware, setSelectedCourseware] = useState(null);
  const [pendingCoursewareKey, setPendingCoursewareKey] = useState("");
  const availableCoursewares = courseData?.coursewares || [];

  function getId(value) {
    return String(value?.coursewareId ?? value?._id ?? value?.id ?? "");
  }

  function getCourseId(value) {
    return String(value?.courseId ?? value?._id ?? value?.id ?? "");
  }

  function getCoursewareKey(value, fallback = "") {
    return String(value?._id ?? value?.id ?? value?.coursewareId ?? fallback);
  }

  const courseId = getCourseId(courseData);

  useEffect(() => {
    setCourseData(course);
  }, [course]);

  useEffect(() => {
    if (!courseId || selectedCourseware) return;

    let isMounted = true;
    let isPolling = false;

    async function refreshCourse() {
      if (isPolling) return;

      try {
        isPolling = true;
        const latestCourse = await getCourseById(courseId);
        if (isMounted) {
          setCourseData(latestCourse);
        }
      } catch (err) {
        console.error("Failed to refresh courseware availability:", err);
      } finally {
        isPolling = false;
      }
    }

    const intervalId = setInterval(refreshCourse, 10000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [courseId, selectedCourseware]);

  const completedIds = new Set(
    (user?.myCompletedCoursewares || [])
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
    } else {
      acc[id] = cw.coursewareId ? "ready" : "idle";
    }

    return acc;
  }, {});

  function handleComplete(passed) {
    if (!passed) return;
    updateUser();
    setSelectedCourseware(null);
  }

  async function handleSelectCourseware(courseware) {
    const coursewareId = courseware?.coursewareId || courseware?._id;
    const status = statusById[getId(courseware)];
    const coursewareKey = getCoursewareKey(courseware);

    if (status === "idle") {
      if (!user?._id || !coursewareId) return;

      setPendingCoursewareKey(coursewareKey);
      try {
        await startCourseware(user._id, coursewareId);
        const latestCourse = await getCourseById(courseId);
        setCourseData(latestCourse);
      } catch (err) {
        console.error("Failed to start courseware:", err);
      } finally {
        setPendingCoursewareKey("");
      }

      return;
    }

    if (user?._id && coursewareId && status === "ready") {
      await startCourseware(user._id, coursewareId);
    }

    setSelectedCourseware(courseware);
  }

  if (allCompleted) {
    return (
      <CourseSummary course={courseData} coursewares={availableCoursewares} />
    );
  }

  return (
    <Container py="xl">
      {!selectedCourseware ? (
        <>
          <Title order={2} mb="md">
            {courseData?.title}
          </Title>

          {availableCoursewares.length > 0 ? (
            <CoursewareList
              coursewares={availableCoursewares}
              statusById={statusById}
              pendingCoursewareKey={pendingCoursewareKey}
              getCoursewareKey={getCoursewareKey}
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
