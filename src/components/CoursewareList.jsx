import { Stack, Button } from "@mantine/core";

function getId(value) {
  return String(value?.coursewareId ?? value?._id ?? value?.id ?? "");
}

export default function CoursewareList({
  coursewares,
  statusById = {},
  pendingCoursewareKey = "",
  getCoursewareKey,
  onSelect,
}) {
  return (
    <Stack>
      {coursewares.map((cw, idx) => {
        const status = statusById[getId(cw)] || "idle";
        const itemKey = getCoursewareKey
          ? getCoursewareKey(cw, idx)
          : String(cw?._id || cw?.id || cw?.coursewareId || idx);
        const isLoading = pendingCoursewareKey === itemKey;
        const hasPendingRequest = pendingCoursewareKey !== "";
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
            data-courseware-id={getId(cw)}
            fullWidth
            color={color}
            variant="light"
            loading={isLoading}
            disabled={hasPendingRequest}
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
