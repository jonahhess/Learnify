import { SimpleGrid } from "@mantine/core";
import CourseCard from "./CourseCard.jsx";

export default function CourseList({ courses = [], onSelectCourse, isNew }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      {courses.map((course) => (
        <CourseCard
          key={course._id}
          course={course}
          isNew={isNew}
          onClick={() => onSelectCourse(course)}
        />
      ))}
    </SimpleGrid>
  );
}
