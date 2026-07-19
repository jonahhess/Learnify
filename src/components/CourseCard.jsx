import { Card, Text, Progress } from "@mantine/core";
import { useAuth } from "../context/useAuth.jsx";

export default function CourseCard({ course, onClick, isNew }) {
  const { user } = useAuth();

  function getId(value) {
    return String(value?.coursewareId ?? value?._id ?? value?.id ?? "");
  }

  function getCourseId(value) {
    return String(value?.courseId ?? value?._id ?? value?.id ?? "");
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

  const currentTitle = currentForCourse ? currentForCourse[0]?.title : "";
  const subtitle = "Ready to start";

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <Text fw={500} size="lg" mb="sm">
        {course.title}
      </Text>

      <Text size="sm" c="dimmed" mb="sm">
        {subtitle}
      </Text>

      {!isNew && totalCount > 0 && (
        <>
          <Progress value={progress} size="sm" radius="xl" mb="xs" />
          <Text size="xs" c="dimmed">
            {completedCount}/{totalCount} coursewares completed
          </Text>
        </>
      )}
    </Card>
  );
}
