import { useState } from "react";
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { signup } from "../api/auth.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Signup() {
  const nav = useNavigate();
  const { reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { name: "", email: "", password: "" },
    validate: {
      name: (v) => (v.trim().length < 2 ? "Name is too short" : null),
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 6 ? "Use at least 6 characters" : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      setLoading(true);
      await signup(values);
      notifications.show({ message: "Account created! 🎉" });
      await reloadUser();
      nav("/");
    } catch (e) {
      notifications.show({ color: "red", message: e.message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Container size="xs" py="xl">
      <Paper withBorder shadow="sm" p="lg" radius="md">
        <Title order={2} mb="md">
          Create your account
        </Title>
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Name"
            {...form.getInputProps("name")}
            required
            mb="sm"
          />
          <TextInput
            label="Email"
            placeholder="you@learnify.com"
            {...form.getInputProps("email")}
            required
            mb="sm"
          />
          <PasswordInput
            label="Password"
            {...form.getInputProps("password")}
            required
            mb="md"
          />
          <Button type="submit" fullWidth loading={loading}>
            Sign up
          </Button>
        </form>
        <Group justify="space-between" mt="sm">
          <div />
          <Anchor component={Link} to="/login" size="sm">
            Already have an account? Log in
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
