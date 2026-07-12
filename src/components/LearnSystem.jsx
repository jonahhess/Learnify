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
import { useAuth } from "../context/useAuth.jsx";
import CourseList from "./CourseList.jsx";
import CoursePage from "./CoursePage.jsx";
import NewCoursePage from "./NewCoursePage.jsx";
import { getCourses } from "../api/courses.js";
import { startCourse } from "../api/users.js";
import { generateCourseOutline } from "../api/ai.js";

export default function LearnSystem() {
  const { user, loading, reloadUser } = useAuth();

  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);
  const [showNewCourses, setShowNewCourses] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  function getCourseId(value) {
    return String(value?.courseId ?? value?._id ?? value?.id ?? "");
  }

  // ---- Load courses when user is available ----
  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    try {
      setDataLoading(true);
      const [coursesData] = await Promise.all([getCourses()]);
      setAllCourses(coursesData);
    } catch (err) {
      console.error("Failed to load courses:", err);
    } finally {
      setDataLoading(false);
    }
  }

  function getCurrentCourses() {
    const rawCurrentCourses = user?.myCurrentCourses || [];
    const allCoursesById = new Map(
      allCourses.map((course) => [getCourseId(course), course]),
    );

    return rawCurrentCourses
      .map((course) => {
        const courseId = getCourseId(course);
        if (!courseId) return null;

        return allCoursesById.get(courseId) || course;
      })
      .filter(Boolean);
  }

  function getAvailableCourses() {
    const currentIds = new Set(
      (user?.myCurrentCourses || []).map((course) => getCourseId(course)),
    );

    return allCourses.filter((course) => !currentIds.has(getCourseId(course)));
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
  if (loading || (user && dataLoading)) {
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
      <Container py="xl" mt="40px">
        <Title order={2}>Please log in to access your courses.</Title>
      </Container>
    );
  }

  // ---- Current Course Selected ----
  if (selectedCourse) {
    return (
      <Container size="lg" py="xl" mt="40px">
        <Button
          variant="subtle"
          mb="md"
          onClick={() => setSelectedCourse(null)}
        >
          ← Back to Courses
        </Button>

        <CoursePage
          course={selectedCourse}
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
        isNew={showNewCourses}
        onSelectCourse={(course) => {
          if (showNewCourses) {
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
