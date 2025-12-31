import { useEffect, useState } from "react";
import { Container, Title, Loader, Center, Button, Group } from "@mantine/core";
import { useAuth } from "../context/AuthContext.jsx";
import CourseList from "./CourseList.jsx";
import CoursewarePage from "./CoursewarePage.jsx";
import { getCourses, getCoursewares } from "../api/courses.js";
import { generateCoursewareFromTitle } from "../api/ai.js";

export default function LearnSystem() {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState([]);
  const [coursewares, setCoursewares] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedCourseware, setSelectedCourseware] = useState(null);
  const [showNewCourses, setShowNewCourses] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      const [coursesData, coursewaresData] = await Promise.all([
        getCourses(),
        getCoursewares(),
      ]);
      setAllCourses(coursesData);
      setCoursewares(coursewaresData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectCourse(course) {
    setLoading(true);
    setSelectedCourse(course);

    // Find the user's courseware for this course
    const userCW = (user.myCurrentCoursewares || []).find(
      (cw) => String(cw.courseId) === String(course.courseId)
    );

    // If courseware doesn't exist, generate it
    if (!userCW?.coursewareId && userCW?.title) {
      try {
        await generateCoursewareFromTitle(
          course.title,
          course.courseId,
          userCW.title
        );
        await loadData();
        await reloadUser();
      } catch (err) {
        console.error(err);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }

  function getCurrentCourses() {
    return user.myCurrentCourses || [];
  }

  function getAvailableCourses() {
    const currentIds = (user.myCurrentCourses || []).map((c) =>
      String(c.courseId)
    );
    return allCourses.filter((c) => !currentIds.includes(String(c._id)));
  }

  function getCurrentCoursewareForUser(courseId) {
    const currentCW = (user.myCurrentCoursewares || []).find(
      (cw) => String(cw.courseId) === String(courseId)
    );
    if (!currentCW) return null;
    return coursewares.find(
      (cw) => String(cw._id) === String(currentCW.coursewareId)
    );
  }

  if (!user) {
    return (
      <Container py="xl">
        <Title order={2}>Please log in to access your courses.</Title>
      </Container>
    );
  }

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (selectedCourseware) {
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          mb="md"
          onClick={() => setSelectedCourseware(null)}
        >
          ← Back to Course
        </Button>
        <CoursewarePage courseware={selectedCourseware} />
      </Container>
    );
  }

  if (selectedCourse) {
    const currentCW = getCurrentCoursewareForUser(selectedCourse.courseId);
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          mb="md"
          onClick={() => setSelectedCourse(null)}
        >
          ← Back to Courses
        </Button>
        <Title order={2} mb="md">
          {selectedCourse.title}
        </Title>
        {currentCW ? (
          <Button
            onClick={() => setSelectedCourseware(currentCW)}
            variant="light"
          >
            Start "{currentCW.title}"
          </Button>
        ) : (
          <Title order={4}>No current courseware assigned</Title>
        )}
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>
          {showNewCourses ? "Available Courses" : "My Current Courses"}
        </Title>
        <Button
          variant="light"
          onClick={() => setShowNewCourses((prev) => !prev)}
        >
          {showNewCourses ? "← Back" : "+ New Course"}
        </Button>
      </Group>

      <CourseList
        courses={showNewCourses ? getAvailableCourses() : getCurrentCourses()}
        coursewares={coursewares}
        onSelectCourse={(course) => handleSelectCourse(course)}
      />
    </Container>
  );
}
