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
  const [optimisticReadyIds, setOptimisticReadyIds] = useState(new Set());
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
    setOptimisticReadyIds(new Set());
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
    } else if (optimisticReadyIds.has(id) || cw.coursewareId) {
      acc[id] = "ready";
    } else {
      acc[id] = "idle";
    }

    return acc;
  }, {});

  function handleComplete(passed) {
    if (!passed) return;
    updateUser();
    setSelectedCourseware(null);
  }

  async function handleSelectCourseware(courseware) {
    if (!user?._id) {
      setSelectedCourseware(null);
      return;
    }

    const coursewareId = courseware?.coursewareId || courseware?._id;
    const localId = getId(courseware);
    const status = statusById[localId];
    const coursewareKey = getCoursewareKey(courseware);

    if (status === "idle") {
      if (!coursewareId) return;

      setPendingCoursewareKey(coursewareKey);
      try {
        await startCourseware(user._id, coursewareId);
        setOptimisticReadyIds((prev) => new Set([...prev, localId]));
        const latestCourse = await getCourseById(courseId);
        setCourseData(latestCourse);
      } catch (err) {
        console.error("Failed to start courseware:", err);
      } finally {
        setPendingCoursewareKey("");
      }

      return;
    }

    if (coursewareId && status === "ready") {
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
