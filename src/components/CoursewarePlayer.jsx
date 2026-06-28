import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Button,
  Group,
  Radio,
  Stack,
  Loader,
  Center,
} from "@mantine/core";
import { getQuestionsByCourseware } from "../api/questions.js";
import { submitCourseware } from "../api/coursewares.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./CoursewarePlayer.css";
import Markdown from "react-markdown";

const pastelColors = [
  "#f8d7da",
  "#d1ecf1",
  "#d4edda",
  "#fff3cd",
  "#e2d6f3",
  "#fde2e4",
  "#e0f7fa",
  "#f3e5f5",
  "#f9fbe7",
  "#ffe0b2",
];

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function buildHighlightedText(text, wrongQuestions, colorMap) {
  if (!wrongQuestions.length) return text;

  const sorted = [...wrongQuestions].sort(
    (a, b) => a.answerStartIndex - b.answerStartIndex,
  );

  const parts = [];
  let lastIndex = 0;

  sorted.forEach((q, idx) => {
    const start = q.answerStartIndex;
    const end = q.answerEndIndex;
    const color = colorMap[q._id] || pastelColors[idx % pastelColors.length];

    if (lastIndex < start) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex, start)}</span>,
      );
    }

    parts.push(
      <span
        key={`highlight-${idx}`}
        className="highlight"
        style={{ backgroundColor: color }}
      >
        {text.slice(start, end)}
      </span>,
    );

    lastIndex = end;
  });

  if (lastIndex < text.length) {
    parts.push(<span key="end">{text.slice(lastIndex)}</span>);
  }

  return parts;
}

export default function CoursewarePlayer({ courseware, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const { user, reloadUser } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getQuestionsByCourseware(courseware._id);

        const withOptions = data.map((q) => ({
          ...q,
          options: shuffleArray([
            q.correctAnswer,
            ...(q.incorrectAnswers || []),
          ]),
        }));

        setQuestions(withOptions);
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseware]);

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  if (questions.length === 0) {
    return <Text>No questions found for this courseware.</Text>;
  }

  const q = questions[currentQuestion];

  function handleSelect(questionId, value) {
    if (!submitted) {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    }
  }

  function getOptionColor(q, option) {
    if (!submitted) return "blue";

    if (option === q.correctAnswer) return "green";
    if (answers[q._id] === option) return "red";
    return "gray";
  }

  async function handleSubmit() {
    setSubmitted(true);

    let correctCount = 0;
    const wrong = [];
    const newColorMap = {};

    questions.forEach((ques, idx) => {
      if (answers[ques._id] === ques.correctAnswer) {
        correctCount++;
      } else {
        wrong.push(ques);
        const color = pastelColors[wrong.length % pastelColors.length];
        newColorMap[ques._id] = color;
      }
    });

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setWrongQuestions(wrong);
    setColorMap(newColorMap);

    if (finalScore >= 80) {
      try {
        await submitCourseware(user._id, courseware._id);
        await reloadUser();
        console.log("Courseware submitted successfully");
      } catch (err) {
        console.error("Failed to submit courseware:", err);
      }
    }

    onComplete(finalScore >= 80);
  }

  return (
    <div>
      <Markdown mb="lg">
        {submitted && wrongQuestions.length > 0
          ? buildHighlightedText(courseware.text, wrongQuestions, colorMap)
          : courseware.text}
      </Markdown>

      <Title order={4} mb="sm">
        Question {currentQuestion + 1}/{questions.length}
      </Title>
      <Text
        mb="sm"
        style={{
          backgroundColor:
            submitted && wrongQuestions.includes(q)
              ? colorMap[q._id]
              : "transparent",
          padding: "6px 10px",
          borderRadius: "6px",
        }}
      >
        {q.questionText}
      </Text>

      <Radio.Group
        value={answers[q._id] || ""}
        onChange={(val) => handleSelect(q._id, val)}
        orientation="vertical"
      >
        <Stack>
          {q.options.map((option, i) => (
            <Radio
              key={i}
              value={option}
              label={
                <span style={{ color: getOptionColor(q, option) }}>
                  {option}
                </span>
              }
              disabled={submitted}
            />
          ))}
        </Stack>
      </Radio.Group>

      <Group mt="lg">
        <Button
          onClick={() => setCurrentQuestion((i) => Math.max(i - 1, 0))}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </Button>
        {currentQuestion < questions.length - 1 ? (
          <Button
            onClick={() =>
              setCurrentQuestion((i) => Math.min(i + 1, questions.length - 1))
            }
          >
            Next →
          </Button>
        ) : (
          <Button color="green" onClick={handleSubmit} disabled={submitted}>
            Submit
          </Button>
        )}
      </Group>

      {submitted && (
        <div style={{ marginTop: "20px" }}>
          <Text fw={700}>Your Score: {score}%</Text>
          {score >= 80 ? (
            <Text c="green">Congratulations! You passed this courseware.</Text>
          ) : (
            <Text c="red">You did not pass. Try again!</Text>
          )}
        </div>
      )}
    </div>
  );
}
