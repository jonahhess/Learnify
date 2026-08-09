// ReviewCardAI.jsx
import { Card, Text, Button, Group, Badge, Stack } from "@mantine/core";
import { useState } from "react";
import { deleteReviewCard } from "../api/reviewCard";

export default function ReviewCard({ card, onAnswered, onDeleted }) {
  const [correct, setCorrect] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const answered = correct !== null;

  const answers = [
    ...card.question.incorrectAnswers,
    card.question.correctAnswer,
  ].sort(() => Math.random() - 0.5);

  const handleAnswer = (answer) => {
    const success = answer === card.question.correctAnswer;
    setCorrect(success);
    onAnswered?.({ questionId: card.question._id, success });
  };

  const handleDelete = async () => {
    if (!card?._id || deleting) return;

    setDeleteError("");
    setDeleting(true);
    try {
      await deleteReviewCard(card._id);
      onDeleted?.({ cardId: card._id, questionId: card.question._id });
    } catch (err) {
      console.error("Failed to delete review card:", err);
      setDeleteError("Could not delete this review card. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={500}>{card.question.questionText}</Text>
          <Group gap="xs">
            <Badge color="blue">
              {new Date(card.nextReviewDate).toLocaleDateString()}
            </Badge>
            <Button
              size="compact-xs"
              variant="subtle"
              color="red"
              onClick={handleDelete}
              loading={deleting}
              aria-label="Delete review card"
            >
              Delete
            </Button>
          </Group>
        </Group>

        {!answered ? (
          <Group grow>
            {answers.map((ans) => (
              <Button
                key={ans}
                onClick={() => handleAnswer(ans)}
                variant="light"
                styles={{
                  root: {
                    height: "auto",
                    minHeight: 42,
                  },
                  label: {
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    textAlign: "left",
                    lineHeight: 1.25,
                    paddingTop: 6,
                    paddingBottom: 6,
                  },
                }}
              >
                {ans}
              </Button>
            ))}
          </Group>
        ) : (
          <Text c={correct ? "green" : "red"}>
            {correct
              ? "✅ Correct!"
              : "❌ Wrong. Correct: " + card.question.correctAnswer}
          </Text>
        )}

        <Group justify="space-between">
          <Text size="sm">Reviews: {card.reviews}</Text>
          <Text size="sm">Successes: {card.successes}</Text>
        </Group>

        {deleteError ? (
          <Text size="sm" c="red">
            {deleteError}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
