import { Container } from "@mantine/core";
import { Navigate } from "react-router-dom";
import ReviewSystem from "../components/ReviewSystem2.jsx";
import { useAuth } from "../context/useAuth.jsx";

export default function Review() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container size="lg" py="xl">
      <ReviewSystem />
    </Container>
  );
}
