import { useEffect, useState } from "react";
import {
  Container,
  Title,
  Center,
  Button,
  Progress,
  Stack,
} from "@mantine/core";
import ReviewCard from "./ReviewCardAI.jsx";
import { batchSubmitReviewCards } from "../api/users.js";

export default function ReviewPage({ user }) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [cards, setCards] = useState(user.myReviewCards ?? []);

  useEffect(() => {
    setCards(user.myReviewCards ?? []);
  }, [user.myReviewCards]);

  const handleAnswered = (result) => {
    // Collect result
    setResults((prev) => [...prev, result]);
    // Advance after short delay
    setTimeout(() => setIndex((prev) => prev + 1), 1000);
  };

  const handleSubmit = async () => {
    try {
      await batchSubmitReviewCards(results); // send partial/full list
      console.log("Submitted:", results);
      setResults([]); // reset buffer if you want
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleted = ({ cardId, questionId }) => {
    setCards((prev) => {
      const nextCards = prev.filter((card) => card._id !== cardId);
      setIndex((current) =>
        Math.min(current, Math.max(nextCards.length - 1, 0)),
      );
      return nextCards;
    });
    if (questionId) {
      setResults((prev) =>
        prev.filter((item) => item.questionId !== questionId),
      );
    }
  };

  if (index >= cards.length) {
    return (
      <Center h="100vh" w="100%">
        <Stack align="center">
          <Title order={2}>🎉 Review Complete!</Title>
          <Button onClick={handleSubmit} disabled={!results.length}>
            Submit Results
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center h="100vh" w="100%">
      <Stack align="center" w="100%" maw={600}>
        <Progress value={(index / cards.length) * 100} w="100%" />
        <ReviewCard
          card={cards[index]}
          onAnswered={handleAnswered}
          onDeleted={handleDeleted}
        />
        <Button onClick={handleSubmit} disabled={!results.length}>
          Submit {results.length} card(s)
        </Button>
      </Stack>
    </Center>
  );
}
