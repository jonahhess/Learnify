import { Stack, Button } from "@mantine/core";

function getId(value) {
  return String(value?.coursewareId ?? value?._id ?? value?.id ?? "");
}

export default function CoursewareList({
  coursewares,
  statusById = {},
  onSelect,
}) {
  return (
    <Stack>
      {coursewares.map((cw, idx) => {
        const status = statusById[getId(cw)] || "idle";
        const isReady = status === "ready";
        const isCompleted = status === "completed";

        let color = "gray";
        if (isReady) {
          color = "blue";
        } else if (isCompleted) {
          color = "green";
        }

        return (
          <Button
            key={cw._id || idx}
            fullWidth
            color={color}
            variant="light"
            onClick={() => {
              onSelect(cw);
            }}
          >
            {cw.title}
          </Button>
        );
      })}
    </Stack>
  );
}
