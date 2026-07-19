import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Loader,
  Text,
  Button,
  Group,
  Stack,
  Center,
} from "@mantine/core";
import ReviewCard from "../components/ReviewCard";
import { batchSubmitReviewCards } from "../api/users";
import { deleteReviewCard } from "../api/reviewCard";
import { useAuth } from "../context/useAuth.jsx";

export default function ReviewSystem() {
  const [results, setResults] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const { user, loading: authLoading, reloadUser } = useAuth();

  const answeredIds = new Set(results.map((item) => item._id));
  const deletedIds = new Set(deletingCardId ? [deletingCardId] : []);
  const cards = (user?.myReviewCards ?? []).filter(
    (card) => !answeredIds.has(card._id) && !deletedIds.has(card._id),
  );

  useEffect(() => {
    if (cards.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex > cards.length - 1) {
      setCurrentIndex(cards.length - 1);
    }
  }, [cards.length, currentIndex]);

  const handleAnswered = (result) => {
    setResults((prev) => [...prev, result]);
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const handleDeleteCurrent = async () => {
    const currentCard = cards[currentIndex];
    if (!currentCard?._id || deletingCardId) return;

    const cardId = currentCard._id;

    try {
      setDeletingCardId(cardId);
      await deleteReviewCard(cardId);
      setResults((prev) => prev.filter((item) => item._id !== cardId));
      await reloadUser();
    } catch (err) {
      console.error("Failed to delete review card:", err);
    } finally {
      setDeletingCardId(null);
    }
  };

  const handleSubmit = async () => {
    if (!user?._id || results.length === 0) return;

    try {
      await batchSubmitReviewCards(user._id, results);
      await reloadUser();
      setResults([]);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Batch submit failed:", err);
    }
  };

  if (authLoading) {
    return (
      <Container size="lg" py="xl" mt="40px">
        <Loader />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container py="xl" mt="40px">
        <Title order={2}>Please log in to access your review cards.</Title>
      </Container>
    );
  }

  if (!cards.length) {
    return (
      <Container size="lg" py="xl" mt="40px">
        <Title order={2}>Review</Title>
        <Text c="dimmed">No review cards due today 🎉</Text>
        {results.length > 0 && (
          <Button mt="md" onClick={handleSubmit}>
            Submit Results
          </Button>
        )}
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        Review
      </Title>
      <Stack gap="md">
        <Text c="dimmed">
          Card {currentIndex + 1} of {cards.length}
        </Text>
        <Group justify="space-between" align="center">
          <Button
            variant="default"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            ← Previous
          </Button>
          <Button
            variant="default"
            onClick={handleNext}
            disabled={currentIndex >= cards.length - 1}
          >
            Next →
          </Button>
          <Button
            color="red"
            variant="light"
            onClick={handleDeleteCurrent}
            loading={Boolean(deletingCardId)}
            disabled={!cards[currentIndex] || Boolean(deletingCardId)}
          >
            Delete This Card
          </Button>
        </Group>

        <Center>
          <ReviewCard
            key={cards[currentIndex]?._id}
            card={cards[currentIndex]}
            onAnswered={handleAnswered}
          />
        </Center>
      </Stack>
      {results.length > 0 && (
        <Button mt="lg" onClick={handleSubmit}>
          Submit {results.length} Results
        </Button>
      )}
    </Container>
  );
}
