import { useState } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Anchor,
  Group,
  Stack,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { login } from "../api/auth.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  IconMail,
  IconLock,
  IconBrandGoogle,
  IconBrandGithub,
} from "@tabler/icons-react";

export default function Login() {
  const nav = useNavigate();
  const { reloadUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (!v ? "Password is required" : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      setLoading(true);
      await login(values);
      notifications.show({ message: "Welcome back! ✅" });
      await reloadUser();
      nav("/");
    } catch (e) {
      notifications.show({ color: "red", message: e.message });
    } finally {
      setLoading(false);
    }
  });

  return (
    <Container
      size={420}
      style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper
        withBorder
        shadow="xl"
        radius="lg"
        p="xl"
        style={{ width: "100%" }}
      >
        {/* Header */}
        <Stack align="center" mb="lg">
          <Title order={2} style={{ fontWeight: 800, color: "#1c7ed6" }}>
            Welcome back 👋
          </Title>
          <Text c="dimmed" size="sm">
            Sign in to <strong>Learnify</strong> to continue
          </Text>
        </Stack>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <TextInput
            leftSection={<IconMail size={18} />}
            label="Email"
            placeholder="you@learnify.com"
            {...form.getInputProps("email")}
            required
            mb="sm"
          />
          <PasswordInput
            leftSection={<IconLock size={18} />}
            label="Password"
            placeholder="••••••••"
            {...form.getInputProps("password")}
            required
            mb="md"
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            radius="md"
            size="md"
            variant="gradient"
            gradient={{ from: "indigo", to: "cyan" }}
            style={{ fontWeight: 600 }}
          >
            Log in
          </Button>
        </form>

        {/* Links */}
        <Group justify="space-between" mt="lg">
          <Anchor component={Link} to="/forgot" size="sm" c="blue">
            Forgot password?
          </Anchor>
          <Anchor component={Link} to="/signup" size="sm" c="blue">
            No account? Sign up
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
}
