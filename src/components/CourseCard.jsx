import { Card, Text, Progress } from "@mantine/core";
export default function CourseCard({ course, coursewares, onClick }) {
  const currentCW = coursewares.find((cw) => cw.courseId === course.courseId);

  const total = course.length;
  const index = currentCW ? currentCW.index : 0;
  const progress = Math.round(((index + 1) / total) * 100);

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

      {currentCW && (
        <Text size="sm" c="dimmed" mb="sm">
          Lesson {index + 1}: {currentCW.title}
        </Text>
      )}

      <Progress value={progress} label={`${progress}%`} />
    </Card>
  );
}
