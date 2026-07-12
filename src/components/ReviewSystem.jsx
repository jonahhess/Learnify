import { useEffect, useState } from "react";
import { Container, Title, Stack, Loader, Text, Button } from "@mantine/core";
import ReviewCard from "../components/ReviewCard";
import { batchSubmitReviewCards } from "../api/users";
import { useAuth } from "../context/useAuth.jsx";

export default function ReviewSystem() {
  const [cards, setCards] = useState([]);
  const [results, setResults] = useState([]);
  const { user, loading: authLoading, reloadUser } = useAuth();

  useEffect(() => {
    setCards(user?.myReviewCards ?? []);
  }, [user]);

  const handleAnswered = (result) => {
    setResults((prev) => [...prev, result]);
    // optionally remove card from view immediately:
    setCards((prev) => prev.filter((c) => c._id !== result._id));
  };

  const handleSubmit = async () => {
    if (!user?._id || results.length === 0) return;

    try {
      await batchSubmitReviewCards(user._id, results);
      await reloadUser();
      setResults([]);
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
      <Stack>
        {cards.map((card) => (
          <ReviewCard key={card._id} card={card} onAnswered={handleAnswered} />
        ))}
      </Stack>
      {results.length > 0 && (
        <Button mt="lg" onClick={handleSubmit}>
          Submit {results.length} Results
        </Button>
      )}
    </Container>
  );
}
