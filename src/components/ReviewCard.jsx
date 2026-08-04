// ReviewCard.jsx
import { Card, Text, Button, Group, Badge, Stack } from "@mantine/core";
import { useMemo } from "react";

function shuffleAnswers(answers) {
  return [...answers].sort(() => Math.random() - 0.5);
}

export default function ReviewCard({ card, onAnswered, answerState }) {
  const selectedAnswer = answerState?.selectedAnswer ?? null;
  const answered = selectedAnswer !== null;

  const answers = useMemo(() => {
    const base =
      card?.question?.options ??
      [
        ...(card?.question?.incorrectAnswers ?? []),
        card?.question?.correctAnswer,
      ].filter(Boolean);
    return shuffleAnswers(Array.from(new Set(base)));
  }, [
    card?.question?.options,
    card?.question?.incorrectAnswers,
    card?.question?.correctAnswer,
  ]);

  const handleAnswer = (answer) => {
    if (answered) return;

    // Record only the selected answer; backend decides correctness at submit time.
    onAnswered?.({
      _id: card._id,
      selectedAnswer: answer,
    });
  };

  return (
    <Card
      shadow="sm"
      radius="md"
      withBorder
      style={{
        backgroundColor: answered ? "#eef2ff" : "white",
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
            const color = isSelected ? "blue" : "gray";
            const variant = isSelected ? "filled" : "light";

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
          <Text c="dimmed">Answer recorded. Submit to grade this round.</Text>
        )}
      </Stack>
    </Card>
  );
}
