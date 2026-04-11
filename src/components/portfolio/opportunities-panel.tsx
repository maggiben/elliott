"use client";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Opportunity } from "@/lib/opportunities/rules";

export function OpportunitiesPanel({ items }: { items: Opportunity[] }) {
  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No rule-based alerts right now.
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((o) => (
        <Alert
          key={o.id}
          severity={o.severity === "warn" ? "warning" : "info"}
          variant="outlined"
        >
          <Typography variant="subtitle2">{o.title}</Typography>
          <Typography variant="body2">{o.detail}</Typography>
        </Alert>
      ))}
    </Stack>
  );
}
