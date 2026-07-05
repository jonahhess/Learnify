import {
  Container,
  Title,
  Timeline,
  Text,
  Button,
  Center,
} from "@mantine/core";

export default function NewCoursePage({ course, onStart }) {
  const coursewares = course.coursewares;

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        {course.title}
      </Title>

      {coursewares && coursewares.length > 0 ? (
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {coursewares.map((cw, i) => (
            <Timeline.Item
              key={cw._id || i}
              title={cw.title}
              bullet={<span>{i + 1}</span>}
            >
              <Text c="dimmed" size="sm">
                Module {i + 1}
              </Text>
            </Timeline.Item>
          ))}
        </Timeline>
      ) : (
        <Center my="xl">
          <Text c="dimmed" size="sm">
            Generate new courseware for this course
          </Text>
        </Center>
      )}

      <Button mt="xl" fullWidth color="blue" onClick={onStart}>
        Start Course
      </Button>
    </Container>
  );
}
