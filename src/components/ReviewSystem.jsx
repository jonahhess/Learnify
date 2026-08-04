import { useEffect, useMemo, useState } from "react";
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
  const [redoResults, setRedoResults] = useState([]);
  const [answerStateById, setAnswerStateById] = useState({});
  const [redoAnswerStateById, setRedoAnswerStateById] = useState({});
  const [incorrectAnswerLog, setIncorrectAnswerLog] = useState([]);
  const [redoCards, setRedoCards] = useState([]);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const { user, loading: authLoading, reloadUser } = useAuth();

  const isRedoMode = redoCards.length > 0;
  const sourceCards = useMemo(
    () => (isRedoMode ? redoCards : (user?.myReviewCards ?? [])),
    [isRedoMode, redoCards, user?.myReviewCards],
  );
  const activeResults = isRedoMode ? redoResults : results;
  const activeAnswerStateById = isRedoMode
    ? redoAnswerStateById
    : answerStateById;

  const cards = useMemo(
    () =>
      sourceCards.map((card) => {
        const options = [
          ...(card?.question?.incorrectAnswers ?? []),
          card?.question?.correctAnswer,
        ].filter(Boolean);

        return {
          ...card,
          question: {
            ...card.question,
            options: Array.from(new Set(options)),
            correctAnswer: undefined,
          },
        };
      }),
    [sourceCards],
  );
  const currentCard = cards[currentIndex] ?? null;

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
    const upsert = (prev) => {
      const next = prev.filter((item) => item._id !== result._id);
      next.push(result);
      return next;
    };

    if (isRedoMode) {
      setRedoResults(upsert);
      setRedoAnswerStateById((prev) => ({ ...prev, [result._id]: result }));
      return;
    }

    setResults(upsert);
    setAnswerStateById((prev) => ({ ...prev, [result._id]: result }));
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const handleDeleteCurrent = async () => {
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

  const deriveIncorrectPayload = (response) => {
    const incorrectCards = Array.isArray(response?.incorrectCards)
      ? response.incorrectCards
      : [];

    const idToCard = new Map(
      sourceCards.map((card) => [String(card._id), card]),
    );

    const nextRedoCards = [];
    const incorrectIds = [];

    for (const item of incorrectCards) {
      const id = String(item?.id ?? "");
      const card = idToCard.get(id);
      if (!id || !card) continue;

      nextRedoCards.push(card);
      incorrectIds.push(id);
    }

    return { nextRedoCards, incorrectIds };
  };

  const handleSubmit = async () => {
    if (!user?._id || activeResults.length === 0 || submitting) return;

    try {
      setSubmitting(true);
      const response = await batchSubmitReviewCards(user._id, activeResults);

      setReviewSummary({
        reviewedCount: response?.reviewedCount ?? activeResults.length,
        incorrectCount: response?.incorrectCount ?? 0,
      });

      const { nextRedoCards, incorrectIds } = deriveIncorrectPayload(response);

      if (incorrectIds.length > 0) {
        setIncorrectAnswerLog((prev) => [
          ...prev,
          ...incorrectIds.map((cardId) => ({
            cardId,
            phase: isRedoMode ? "redo" : "initial",
            at: Date.now(),
          })),
        ]);
      }

      if (nextRedoCards.length > 0) {
        setRedoCards(nextRedoCards);
        setRedoResults([]);
        setRedoAnswerStateById({});
      } else {
        setRedoCards([]);
        setRedoResults([]);
        setRedoAnswerStateById({});
        setResults([]);
        setAnswerStateById({});
        await reloadUser();
      }

      setCurrentIndex(0);
    } catch (err) {
      console.error("Batch submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <Container size="lg" py="xl">
        <Loader />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container py="xl">
        <Title order={2}>Please log in to access your review cards.</Title>
      </Container>
    );
  }

  if (!cards.length) {
    return (
      <Container size="lg" py="xl" mt="40px">
        <Title order={2}>
          {isRedoMode ? "Redo Incorrect Cards" : "Review"}
        </Title>
        {isRedoMode ? (
          <Text c="dimmed">
            You have finished this redo round. Submit to continue.
          </Text>
        ) : (
          <Text c="dimmed">No review cards due today 🎉</Text>
        )}
        {reviewSummary && (
          <Text mt="sm">
            Last submit: {reviewSummary.reviewedCount} reviewed,{" "}
            {reviewSummary.incorrectCount} incorrect.
          </Text>
        )}
        {incorrectAnswerLog.length > 0 && (
          <Text size="sm" c="dimmed" mt="xs">
            Incorrect answers tracked this session: {incorrectAnswerLog.length}
          </Text>
        )}
        {activeResults.length > 0 && (
          <Button mt="md" onClick={handleSubmit}>
            {isRedoMode
              ? `Submit ${activeResults.length} Redo Result${activeResults.length === 1 ? "" : "s"}`
              : `Submit ${activeResults.length} Result${activeResults.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </Container>
    );
  }

  if (!currentCard) {
    return (
      <Container size="lg" py="xl">
        <Loader />
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        {isRedoMode ? "Redo Incorrect Cards" : "Review"}
      </Title>
      <Stack gap="md">
        <Text c="dimmed">
          {isRedoMode ? "Redo" : "Card"} {currentIndex + 1} of {cards.length}
        </Text>
        {reviewSummary && (
          <Text size="sm" c="dimmed">
            Last submit: {reviewSummary.reviewedCount} reviewed,{" "}
            {reviewSummary.incorrectCount} incorrect.
          </Text>
        )}
        {incorrectAnswerLog.length > 0 && (
          <Text size="sm" c="dimmed">
            Incorrect answers tracked this session: {incorrectAnswerLog.length}
          </Text>
        )}
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
            loading={deletingCardId === currentCard._id}
            disabled={Boolean(deletingCardId) || isRedoMode}
          >
            Delete This Card
          </Button>
        </Group>

        <Center>
          <ReviewCard
            key={currentCard._id}
            card={currentCard}
            answerState={activeAnswerStateById[currentCard._id]}
            onAnswered={handleAnswered}
          />
        </Center>
      </Stack>
      {activeResults.length > 0 && (
        <Button mt="lg" onClick={handleSubmit} loading={submitting}>
          {isRedoMode
            ? `Submit ${activeResults.length} Redo Result${activeResults.length === 1 ? "" : "s"}`
            : `Submit ${activeResults.length} Result${activeResults.length === 1 ? "" : "s"}`}
        </Button>
      )}
    </Container>
  );
}
