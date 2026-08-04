import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Title,
  Loader,
  Text,
  Button,
  Group,
  Stack,
  Center,
  Card,
  Badge,
  Switch,
  Slider,
  Alert,
} from "@mantine/core";
import { useAuth } from "../context/useAuth.jsx";
import { submitReviewCardAnswer } from "../api/users";

function shuffleAnswers(answers) {
  return [...answers].sort(() => Math.random() - 0.5);
}

function nextUnansweredIndex(cards, answerStateById, fromIndex) {
  for (let i = fromIndex + 1; i < cards.length; i += 1) {
    const state = answerStateById[cards[i]?._id];
    if (!state?.locked) return i;
  }

  for (let i = 0; i <= fromIndex; i += 1) {
    const state = answerStateById[cards[i]?._id];
    if (!state?.locked) return i;
  }

  return -1;
}

export default function ReviewSystem2() {
  const { user, loading: authLoading } = useAuth();

  const [answerStateById, setAnswerStateById] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoContinue, setAutoContinue] = useState(true);
  const [autoContinueDelayMs, setAutoContinueDelayMs] = useState(700);
  const [ended, setEnded] = useState(false);
  const autoContinueTimerRef = useRef(null);

  const cards = useMemo(() => {
    const sourceCards = user?.myReviewCards ?? [];

    return sourceCards.map((card) => {
      const options = [
        ...(card?.question?.incorrectAnswers ?? []),
        card?.question?.correctAnswer,
      ].filter(Boolean);

      return {
        ...card,
        question: {
          ...card.question,
          options: shuffleAnswers(Array.from(new Set(options))),
          correctAnswer: card?.question?.correctAnswer,
        },
      };
    });
  }, [user?.myReviewCards]);

  const totalCards = cards.length;
  const reviewedCount = useMemo(
    () =>
      cards.reduce((count, card) => {
        const state = answerStateById[card._id];
        return state?.syncStatus === "success" ? count + 1 : count;
      }, 0),
    [cards, answerStateById],
  );
  const waitingCount = Math.max(totalCards - reviewedCount, 0);

  const answeredCount = useMemo(
    () =>
      cards.reduce((count, card) => {
        const state = answerStateById[card._id];
        return state?.locked ? count + 1 : count;
      }, 0),
    [cards, answerStateById],
  );

  const firstUnansweredIndex = useMemo(() => {
    for (let i = 0; i < cards.length; i += 1) {
      const state = answerStateById[cards[i]._id];
      if (!state?.locked) return i;
    }
    return -1;
  }, [cards, answerStateById]);

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

  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
      }
    };
  }, []);

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, cards.length - 1));
  };

  const handleJumpToNextCard = () => {
    if (firstUnansweredIndex >= 0) {
      setCurrentIndex(firstUnansweredIndex);
    }
  };

  const handleEndReviewSession = () => {
    setEnded(true);
  };

  const handleAnswer = async (card, selectedAnswer) => {
    if (!user?._id || !card?._id) return;

    const existingState = answerStateById[card._id];
    if (existingState?.locked) return;

    const correctAnswer = card?.question?.correctAnswer;
    const isCorrect = selectedAnswer === correctAnswer;

    setAnswerStateById((prev) => ({
      ...prev,
      [card._id]: {
        cardId: card._id,
        selectedAnswer,
        correctAnswer,
        isCorrect,
        locked: true,
        syncStatus: "pending",
        answeredAt: Date.now(),
      },
    }));

    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }

    if (autoContinue) {
      autoContinueTimerRef.current = setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const target = nextUnansweredIndex(
            cards,
            {
              ...answerStateById,
              [card._id]: {
                locked: true,
              },
            },
            prevIndex,
          );
          return target === -1 ? prevIndex : target;
        });
      }, autoContinueDelayMs);
    }

    try {
      await submitReviewCardAnswer(user._id, {
        _id: card._id,
        selectedAnswer,
      });

      setAnswerStateById((prev) => {
        const state = prev[card._id];
        if (!state) return prev;

        return {
          ...prev,
          [card._id]: {
            ...state,
            syncStatus: "success",
          },
        };
      });
    } catch (err) {
      console.error("Failed to submit review card:", err);

      setAnswerStateById((prev) => {
        const state = prev[card._id];
        if (!state) return prev;

        return {
          ...prev,
          [card._id]: {
            ...state,
            syncStatus: "failed",
          },
        };
      });
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
        <Title order={2}>Review</Title>
        <Text c="dimmed">No review cards due today.</Text>
      </Container>
    );
  }

  if (ended) {
    return (
      <Container size="lg" py="xl">
        <Title order={2}>Review Complete</Title>
        <Text mt="sm">Total Cards: {totalCards}</Text>
        <Text>Cards Reviewed: {reviewedCount}</Text>
        <Text>Cards Waiting: {waitingCount}</Text>
        <Text c="dimmed" mt="sm">
          Session ended locally. No session finalize API was called.
        </Text>
        <Button mt="md" variant="default" onClick={() => setEnded(false)}>
          View Cards Again
        </Button>
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

  const currentState = answerStateById[currentCard._id];
  const isCurrentLocked = Boolean(currentState?.locked);
  const currentAnswers = currentCard.question.options ?? [];

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="lg">
        Review
      </Title>

      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={2}>
            <Text fw={600}>Total Cards: {totalCards}</Text>
            <Text fw={600}>Cards Reviewed: {reviewedCount}</Text>
            <Text fw={600}>Cards Waiting: {waitingCount}</Text>
          </Stack>

          <Stack gap={2}>
            <Text c="dimmed">
              Card {currentIndex + 1} of {cards.length}
            </Text>
            <Text c="dimmed">Answered: {answeredCount}</Text>
          </Stack>
        </Group>

        <Group justify="space-between" align="center" wrap="wrap">
          <Group>
            <Switch
              label="Auto-continue"
              checked={autoContinue}
              onChange={(event) => setAutoContinue(event.currentTarget.checked)}
            />
          </Group>

          <Text c="dimmed">Delay: {autoContinueDelayMs}ms</Text>
        </Group>

        <Slider
          min={0}
          max={2000}
          step={100}
          value={autoContinueDelayMs}
          onChange={setAutoContinueDelayMs}
          disabled={!autoContinue}
          label={(value) => `${value}ms`}
        />

        <Group justify="space-between" align="center" wrap="wrap">
          <Group>
            <Button
              variant="default"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="default"
              onClick={handleNext}
              disabled={currentIndex >= cards.length - 1}
            >
              Next
            </Button>
          </Group>

          {firstUnansweredIndex >= 0 &&
            currentIndex !== firstUnansweredIndex && (
              <Button onClick={handleJumpToNextCard}>Jump to Next Card</Button>
            )}
        </Group>

        <Group gap="xs" wrap="wrap">
          {cards.map((card, index) => {
            const state = answerStateById[card._id];
            const locked = Boolean(state?.locked);
            const active = index === currentIndex;

            return (
              <Button
                key={card._id}
                variant={active ? "filled" : "light"}
                color={locked ? "gray" : "blue"}
                onClick={() => setCurrentIndex(index)}
                styles={{
                  root: {
                    opacity: locked ? 0.7 : 1,
                  },
                }}
              >
                {index + 1}
              </Button>
            );
          })}
        </Group>

        <Center>
          <Card
            shadow="sm"
            radius="md"
            withBorder
            style={{
              width: "100%",
              maxWidth: 760,
              backgroundColor: isCurrentLocked ? "#f5f5f5" : "white",
            }}
          >
            <Stack gap="sm">
              <Group justify="space-between" align="flex-start">
                <Text fw={600}>{currentCard.question.questionText}</Text>
                <Badge color="blue" variant="light">
                  {new Date(currentCard.nextReviewDate).toLocaleDateString()}
                </Badge>
              </Group>

              <Stack>
                {currentAnswers.map((answer) => {
                  const isSelected = currentState?.selectedAnswer === answer;
                  const isCorrect =
                    currentCard.question.correctAnswer === answer;

                  let color = "gray";
                  let variant = "light";

                  if (isCurrentLocked) {
                    if (isCorrect) {
                      color = "green";
                      variant = "filled";
                    } else if (isSelected && !isCorrect) {
                      color = "red";
                      variant = "filled";
                    }
                  }

                  return (
                    <Button
                      key={answer}
                      onClick={() => handleAnswer(currentCard, answer)}
                      disabled={isCurrentLocked}
                      color={color}
                      variant={variant}
                      styles={{
                        root: {
                          cursor: isCurrentLocked ? "not-allowed" : "pointer",
                          pointerEvents: isCurrentLocked ? "none" : "auto",
                        },
                        inner: {
                          whiteSpace: "normal",
                        },
                        label: {
                          whiteSpace: "normal",
                        },
                      }}
                    >
                      {answer}
                    </Button>
                  );
                })}
              </Stack>

              {isCurrentLocked && currentState?.syncStatus === "pending" && (
                <Text size="sm" c="dimmed">
                  Saving answer...
                </Text>
              )}

              {isCurrentLocked && currentState?.syncStatus === "success" && (
                <Text size="sm" c="dimmed">
                  Answer saved.
                </Text>
              )}

              {isCurrentLocked && currentState?.syncStatus === "failed" && (
                <Alert color="yellow" variant="light" title="Sync issue">
                  Answer is locked for this session, but backend save failed.
                </Alert>
              )}
            </Stack>
          </Card>
        </Center>

        {answeredCount === totalCards && (
          <Button onClick={handleEndReviewSession}>End Review Session</Button>
        )}
      </Stack>
    </Container>
  );
}
