import { Container } from "@mantine/core";
import { Navigate } from "react-router-dom";
import LearnSystem from "../components/LearnSystem";
import { useAuth } from "../context/useAuth.jsx";

export default function Learn() {
  const { user, loading } = useAuth();

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Container size="lg" py="xl">
      <LearnSystem />
    </Container>
  );
}
