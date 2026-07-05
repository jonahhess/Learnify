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
  Alert,
} from "@mantine/core";
import { getQuestionsByCourseware } from "../api/questions.js";
import { getCoursewareById } from "../api/courses.js";
import { submitCourseware } from "../api/coursewares.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./CoursewarePlayer.css";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

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

const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    mark: [...(defaultSchema.attributes?.mark || []), "data-qid"],
  },
};

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildHighlightedMarkdown(text, wrongQuestions) {
  if (!wrongQuestions.length) return text;

  const sorted = [...wrongQuestions].sort(
    (a, b) => b.answerStartIndex - a.answerStartIndex,
  );

  let highlightedText = text;

  sorted.forEach((q) => {
    const start = Math.max(0, Math.min(text.length, q.answerStartIndex ?? 0));
    const end = Math.max(
      start,
      Math.min(text.length, q.answerEndIndex ?? start),
    );

    if (start === end) return;

    const questionId = escapeAttribute(q._id);
    highlightedText = `${highlightedText.slice(0, start)}<mark data-qid="${questionId}">${highlightedText.slice(start, end)}</mark>${highlightedText.slice(end)}`;
  });

  return highlightedText;
}

export default function CoursewarePlayer({ courseware, onComplete, cwStatus }) {
  const [coursewareText, setCoursewareText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(null);
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [colorMap, setColorMap] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const { user, reloadUser } = useAuth();

  const coursewareId = courseware.coursewareId || courseware._id;

  async function persistCoursewareCompletion() {
    if (cwStatus === "completed") {
      onComplete(true);
    }
    setSubmitError("");
    setSubmittingProgress(true);

    try {
      await submitCourseware(user._id, coursewareId);
      await reloadUser();
      onComplete(true);
    } catch (err) {
      console.error("Failed to submit courseware:", err);
      setSubmitError(
        err?.message ||
          "We could not save your courseware progress. Please try again.",
      );
    } finally {
      setSubmittingProgress(false);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const coursewareData = await getCoursewareById(coursewareId);
        setCoursewareText(coursewareData?.text || "");

        const questionsData =
          (await getQuestionsByCourseware(coursewareId)) || [];
        const questions = (
          Array.isArray(questionsData) ? questionsData : []
        ).map((q) => ({
          ...q,
          options: shuffleArray([
            q.correctAnswer,
            ...(q.incorrectAnswers || []),
          ]),
        }));

        setQuestions(questions);
      } catch (err) {
        console.error("Failed to load questions:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [coursewareId, user?._id]);

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

  async function handleSubmit() {
    setSubmitError("");
    setSubmitted(true);

    const wrong = questions.filter(
      (ques) => answers[ques._id] !== ques.correctAnswer,
    );
    const correctCount = questions.length - wrong.length;
    const newColorMap = Object.fromEntries(
      wrong.map((ques, idx) => [
        ques._id,
        pastelColors[(idx + 1) % pastelColors.length],
      ]),
    );

    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setWrongQuestions(wrong);
    setColorMap(newColorMap);

    if (finalScore >= 80) {
      await persistCoursewareCompletion();
      return;
    }

    onComplete(false);
  }

  const renderedCoursewareText =
    submitted && wrongQuestions.length > 0
      ? buildHighlightedMarkdown(coursewareText, wrongQuestions)
      : coursewareText;

  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
          components={{
            mark: ({ node, ...props }) => {
              const questionId = node?.properties?.["data-qid"];
              const color =
                typeof questionId === "string" && colorMap[questionId]
                  ? colorMap[questionId]
                  : "#fff3cd";

              return (
                <mark
                  {...props}
                  className="highlight"
                  style={{ backgroundColor: color, padding: "0 2px" }}
                />
              );
            },
          }}
        >
          {renderedCoursewareText}
        </Markdown>
      </div>

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
        onChange={(val) => {
          if (!submitted) {
            setAnswers((prev) => ({ ...prev, [q._id]: val }));
          }
        }}
        orientation="vertical"
      >
        <Stack>
          {q.options.map((option, i) => (
            <Radio
              key={i}
              value={option}
              label={
                <span
                  style={{
                    color: !submitted
                      ? "blue"
                      : option === q.correctAnswer
                        ? "green"
                        : answers[q._id] === option
                          ? "red"
                          : "gray",
                  }}
                >
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

          {submitError && (
            <Alert color="red" mt="md" title="Could not save progress">
              {submitError}
            </Alert>
          )}

          {score >= 80 && submitError && (
            <Button
              mt="md"
              onClick={persistCoursewareCompletion}
              loading={submittingProgress}
            >
              Retry Save Progress
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
