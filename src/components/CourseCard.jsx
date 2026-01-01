import { useState, useEffect } from "react";
import { Card, Text, Progress } from "@mantine/core";
import { useAuth } from "../context/AuthContext.jsx";
import { getCourseById } from "../api/courses.js";

export default function CourseCard({ course, coursewares, onClick, isNew }) {
  const { user } = useAuth();
  const [courseTitles, setCourseTitles] = useState([]);

  useEffect(() => {
    console.log(course);
    setCourseTitles(course.coursewares || []);
  }, []);

  const currentCW = (user.myCurrentCoursewares || []).find(
    (cw) => String(cw.courseId) === String(course.courseId)
  );

  const total = courseTitles.length;
  const index = currentCW ? currentCW.index : 0;
  const progress = Math.round((index / total) * 100);

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

      {!isNew && (
        <>
          {currentCW ? (
            <Text size="sm" c="dimmed" mb="sm">
              Lesson {index + 1}: {currentCW.title}
            </Text>
          ) : (
            <Text size="sm" c="dimmed" mb="sm">
              Generate new courseware
            </Text>
          )}

          <Progress value={progress} label={`${progress}%`} />
        </>
      )}
    </Card>
  );
}
