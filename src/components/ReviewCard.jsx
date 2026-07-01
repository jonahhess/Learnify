// ReviewCard.jsx
import { Card, Text, Button, Group, Badge, Stack } from "@mantine/core";
import { useState } from "react";

export default function ReviewCard({ card, onAnswered }) {
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(null);

  const answers = [
    ...card.question.incorrectAnswers,
    card.question.correctAnswer,
  ].sort(() => Math.random() - 0.5);

  const handleAnswer = (answer) => {
    const success = answer === card.question.correctAnswer;
    setCorrect(success);
    setAnswered(true);

    // tell parent result (_id + success flag)
    onAnswered?.({ _id: card._id, success: success ? 1 : 0 });
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

        {!answered ? (
          <Stack>
            {answers.map((ans) => (
              <Button
                key={ans}
                onClick={() => handleAnswer(ans)}
                variant="light"
                w="100%"
                styles={{
                  root: {
                    flexWrap: "wrap",
                  },
                  inner: {
                    whiteSpace: "normal",
                    textAlign: "left",
                  },
                  label: {
                    whiteSpace: "normal",
                  },
                }}
              >
                {ans}
              </Button>
            ))}
          </Stack>
        ) : (
          <Text c={correct ? "green" : "red"}>
            {correct
              ? "✅ Correct!"
              : "❌ Wrong. Correct: " + card.question.correctAnswer}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
