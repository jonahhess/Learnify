import { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Loader,
  Text,
  Button,
  Group,
  Stack,
  Center,
  Card,
  Badge,
  Collapse,
  Switch,
  Slider,
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
  const { user, loading: authLoading, reloadUser } = useAuth();

  const [answerStateById, setAnswerStateById] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoContinue, setAutoContinue] = useState(true);
  const [autoContinueDelayMs, setAutoContinueDelayMs] = useState(700);
  const [showAutoControls, setShowAutoControls] = useState(false);
  const [isRefreshingCards, setIsRefreshingCards] = useState(false);
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
  const waitingCount = useMemo(
    () =>
      Math.max(
        totalCards -
          cards.reduce((count, card) => {
            const state = answerStateById[card._id];
            return state?.syncStatus === "success" ? count + 1 : count;
          }, 0),
        0,
      ),
    [cards, totalCards, answerStateById],
  );

  const answeredCount = useMemo(
    () =>
      cards.reduce((count, card) => {
        const state = answerStateById[card._id];
        return state?.locked ? count + 1 : count;
      }, 0),
    [cards, answerStateById],
  );

  const currentCard = cards[currentIndex] ?? null;
  const failedCardIds = useMemo(
    () =>
      cards
        .filter((card) => answerStateById[card._id]?.syncStatus === "failed")
        .map((card) => card._id),
    [cards, answerStateById],
  );
  const hasFailedSync = failedCardIds.length > 0;
  const allAnswered = totalCards > 0 && answeredCount === totalCards;
  const allSynced = allAnswered && waitingCount === 0 && !hasFailedSync;

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

  useEffect(() => {
    if (!allSynced || isRefreshingCards) return;

    let cancelled = false;

    (async () => {
      try {
        setIsRefreshingCards(true);
        await reloadUser();
      } finally {
        if (!cancelled) {
          setIsRefreshingCards(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allSynced, isRefreshingCards, reloadUser]);

  const handleNextUnanswered = () => {
    setCurrentIndex((prevIndex) => {
      const target = nextUnansweredIndex(cards, answerStateById, prevIndex);
      return target === -1 ? prevIndex : target;
    });
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

  const retryFailedSync = async () => {
    if (!user?._id || failedCardIds.length === 0) return;

    await Promise.all(
      failedCardIds.map(async (cardId) => {
        const state = answerStateById[cardId];
        if (!state?.selectedAnswer) return;

        setAnswerStateById((prev) => {
          const existing = prev[cardId];
          if (!existing) return prev;
          return {
            ...prev,
            [cardId]: {
              ...existing,
              syncStatus: "pending",
            },
          };
        });

        try {
          await submitReviewCardAnswer(user._id, {
            _id: cardId,
            selectedAnswer: state.selectedAnswer,
          });

          setAnswerStateById((prev) => {
            const existing = prev[cardId];
            if (!existing) return prev;
            return {
              ...prev,
              [cardId]: {
                ...existing,
                syncStatus: "success",
              },
            };
          });
        } catch (err) {
          console.error("Retry failed for review card:", err);
          setAnswerStateById((prev) => {
            const existing = prev[cardId];
            if (!existing) return prev;
            return {
              ...prev,
              [cardId]: {
                ...existing,
                syncStatus: "failed",
              },
            };
          });
        }
      }),
    );
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
        <Text fw={600}>Please log in to access your review cards.</Text>
      </Container>
    );
  }

  if (!cards.length) {
    return (
      <Container size="lg" py="xl" mt="40px">
        <Text c="dimmed">No review cards due today.</Text>
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
      <Stack gap="md">
        <Text fw={700}>Cards Remaining: {waitingCount}</Text>

        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          px={0}
          style={{ alignSelf: "flex-start" }}
          onClick={() => setShowAutoControls((prev) => !prev)}
        >
          {showAutoControls ? "Hide Settings" : "Show Settings"}
        </Button>

        <Collapse in={showAutoControls}>
          <Card withBorder radius="md" p="md">
            <Stack gap="sm">
              <Switch
                label="Auto-continue"
                checked={autoContinue}
                onChange={(event) =>
                  setAutoContinue(event.currentTarget.checked)
                }
              />

              <Text size="sm" c="dimmed">
                Delay: {autoContinueDelayMs}ms
              </Text>

              <Slider
                min={0}
                max={2000}
                step={100}
                value={autoContinueDelayMs}
                onChange={setAutoContinueDelayMs}
                disabled={!autoContinue}
                label={(value) => `${value}ms`}
              />
            </Stack>
          </Card>
        </Collapse>

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

                  let color = "blue";
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
                      aria-disabled={isCurrentLocked}
                      color={color}
                      variant={variant}
                      styles={{
                        root: {
                          cursor: isCurrentLocked ? "not-allowed" : "pointer",
                          pointerEvents: isCurrentLocked ? "none" : "auto",
                          opacity: 1,
                          filter: "none",
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

              {isCurrentLocked && (
                <Text fw={700} c={currentState?.isCorrect ? "green" : "red"}>
                  {currentState?.isCorrect ? "Correct" : "Incorrect"}
                </Text>
              )}

              {isCurrentLocked && currentState?.syncStatus === "failed" && (
                <Text size="sm" c="yellow">
                  Sync failed. Card remains locked for this session.
                </Text>
              )}

              {!autoContinue && isCurrentLocked && waitingCount > 0 && (
                <Button onClick={handleNextUnanswered}>Next</Button>
              )}
            </Stack>
          </Card>
        </Center>

        {allAnswered && waitingCount > 0 && (
          <Text size="sm" c="dimmed">
            Syncing {waitingCount} card{waitingCount === 1 ? "" : "s"}... Avoid
            refreshing until sync completes.
          </Text>
        )}

        {hasFailedSync && (
          <Group>
            <Text size="sm" c="yellow">
              {failedCardIds.length} card{failedCardIds.length === 1 ? "" : "s"}{" "}
              failed to sync.
            </Text>
            <Button
              size="xs"
              variant="light"
              color="yellow"
              onClick={retryFailedSync}
            >
              Retry Failed Sync
            </Button>
          </Group>
        )}

        {allSynced && isRefreshingCards && (
          <Text size="sm" c="dimmed">
            Finalizing review session...
          </Text>
        )}
      </Stack>
    </Container>
  );
}
