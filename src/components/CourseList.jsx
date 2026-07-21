import { SimpleGrid } from "@mantine/core";
import CourseCard from "./CourseCard.jsx";

function getCourseId(value) {
  return String(value?.courseId ?? value?._id ?? value?.id ?? "");
}

export default function CourseList({
  courses = [],
  onSelectCourse,
  isNew,
  onRemoveCourse,
  removingCourseId,
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {courses.map((course) => (
        <CourseCard
          key={getCourseId(course)}
          course={course}
          isNew={isNew}
          onClick={() => onSelectCourse(course)}
          onRemove={onRemoveCourse}
          removing={removingCourseId === getCourseId(course)}
        />
      ))}
    </SimpleGrid>
  );
}
