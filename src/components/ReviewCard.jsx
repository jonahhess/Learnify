// ReviewCard.jsx
import { Card, Text, Button, Group, Badge, Stack } from "@mantine/core";
import { useMemo } from "react";

function shuffleAnswers(answers) {
  return [...answers].sort(() => Math.random() - 0.5);
}

export default function ReviewCard({
  card,
  onAnswered,
  correctAnswerOverride,
  answerState,
}) {
  const correctAnswer = correctAnswerOverride ?? card?.question?.correctAnswer;
  const selectedAnswer = answerState?.selectedAnswer ?? null;
  const answered = selectedAnswer !== null;
  const correct = answered && selectedAnswer === correctAnswer;

  const answers = useMemo(() => {
    const base = [
      ...(card?.question?.incorrectAnswers ?? []),
      correctAnswer,
    ].filter(Boolean);
    return shuffleAnswers(Array.from(new Set(base)));
  }, [card?.question?.incorrectAnswers, correctAnswer]);

  const handleAnswer = (answer) => {
    if (answered) return;

    const success = answer === correctAnswer;

    // tell parent result and keep selected answer for batch-mode feedback/redo history
    onAnswered?.({
      _id: card._id,
      success: success ? 1 : 0,
      selectedAnswer: answer,
      correctAnswer,
    });
  };

  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      style={{
        backgroundColor: answered ? (correct ? "#d4edda" : "#f8d7da") : "white",
        transition: "background-color 0.3s ease",
      }}
    >
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>{card.question.questionText}</Text>
          <Badge color="blue">
            {new Date(card.nextReviewDate).toLocaleDateString()}
          </Badge>
        </Group>

        <Stack>
          {answers.map((ans) => {
            const isSelected = ans === selectedAnswer;
            const isCorrectOption = ans === correctAnswer;

            let color = "blue";
            let variant = "light";

            if (answered) {
              if (isCorrectOption) {
                color = "green";
                variant = "filled";
              } else if (isSelected && !correct) {
                color = "red";
                variant = "filled";
              } else {
                color = "gray";
                variant = "light";
              }
            }

            return (
              <Button
                key={ans}
                onClick={() => handleAnswer(ans)}
                variant={variant}
                color={color}
                w="100%"
                disabled={answered}
                styles={{
                  root: {
                    flexWrap: "wrap",
                  },
                  inner: {
                    whiteSpace: "normal",
                    textAlign: "center",
                  },
                  label: {
                    whiteSpace: "normal",
                  },
                }}
              >
                {ans}
              </Button>
            );
          })}
        </Stack>

        {answered && (
          <Text c={correct ? "green" : "red"}>
            {correct
              ? "✅ Correct!"
              : "❌ Wrong. The correct answer is highlighted in green."}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
