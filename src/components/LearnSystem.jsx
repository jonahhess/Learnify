import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Loader,
  Center,
  Button,
  Group,
  TextInput,
} from "@mantine/core";
import { useAuth } from "../context/AuthContext.jsx";
import CourseList from "./CourseList.jsx";
import CoursePage from "./CoursePage.jsx";
import NewCoursePage from "./NewCoursePage.jsx";
import { getCourses, getCoursewares, getCourseById } from "../api/courses.js";
import { startCourse } from "../api/users.js";
import { generateCourseOutline } from "../api/ai.js";

export default function LearnSystem() {
  const { user, loading, reloadUser } = useAuth();

  const [allCourses, setAllCourses] = useState([]);
  const [coursewares, setCoursewares] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);
  const [showNewCourses, setShowNewCourses] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [newCoursewares, setNewCoursewares] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  // ---- Load courses when user is available ----
  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      setDataLoading(true);
      const [coursesData, coursewaresData] = await Promise.all([
        getCourses(),
        getCoursewares(),
      ]);
      setAllCourses(coursesData);
      setCoursewares(coursewaresData);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setDataLoading(false);
    }
  }

  function getCurrentCourses() {
    return user?.myCurrentCourses || [];
  }

  function getAvailableCourses() {
    const currentIds = getCurrentCourses().map((c) => String(c.courseId));
    return allCourses.filter((c) => !currentIds.includes(String(c._id)));
  }

  async function getCourseTitles(courseId) {
    try {
      const course = await getCourseById(courseId);
      return course.coursewares || [];
    } catch (err) {
      console.error("Failed to fetch course titles:", err);
      return [];
    }
  }

  async function handleGenerateCourse() {
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const newCourse = await generateCourseOutline({ title: newTitle });
      setAllCourses((prev) => [...prev, newCourse]);
      setNewTitle("");
      setShowNewCourses(true);
    } catch (err) {
      console.error("Failed to generate course:", err);
    } finally {
      setCreating(false);
    }
  }

  // ---- Guard for auth loading ----
  if (loading || dataLoading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
        <Title order={3}>Loading...</Title>
      </Center>
    );
  }

  // ---- User not logged in ----
  if (!user) {
    return (
      <Container py="xl">
        <Title order={2}>Please log in to access your courses.</Title>
      </Container>
    );
  }

  // ---- Current Course Selected ----
  if (selectedCourse) {
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          mb="md"
          onClick={() => setSelectedCourse(null)}
        >
          ← Back to Courses
        </Button>

        <CoursePage
          course={selectedCourse}
          coursewares={coursewares.filter(
            (cw) => String(cw.courseId) === String(selectedCourse.courseId)
          )}
          user={user}
          updateUser={reloadUser}
        />
      </Container>
    );
  }

  // ---- New Course Selected ----
  if (selectedNewCourse) {
    return (
      <Container size="lg" py="xl">
        <Button
          variant="subtle"
          mb="md"
          onClick={() => setSelectedNewCourse(null)}
        >
          ← Back to Courses
        </Button>

        <NewCoursePage
          course={selectedNewCourse}
          coursewares={newCoursewares}
          onStart={async () => {
            if (!user?._id) {
              console.error("Cannot start course: user not loaded yet");
              return;
            }
            try {
              await startCourse(user._id, selectedNewCourse._id);
              await reloadUser();
              setShowNewCourses(false);
              setSelectedNewCourse(null);
            } catch (err) {
              console.error("Failed to start course:", err);
            }
          }}
        />
      </Container>
    );
  }

  // ---- Main Courses List ----
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
        isNew={showNewCourses}
        onSelectCourse={async (course) => {
          if (showNewCourses) {
            const cw = await getCourseTitles(course._id || course.courseId);
            setNewCoursewares(cw);
            setSelectedNewCourse(course);
          } else {
            setSelectedCourse(course);
          }
        }}
      />

      {showNewCourses && (
        <Group mt="lg">
          <TextInput
            placeholder="Enter course title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={handleGenerateCourse} loading={creating}>
            Generate Course
          </Button>
        </Group>
      )}
    </Container>
  );
}
