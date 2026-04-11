"use client";

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { AllocationSlice } from "@/lib/calculations/portfolio-kpis";
import { formatQuoteMoney } from "@/lib/format/numbers";

export function AllocationList({
  slices,
  weightsDisabled,
}: {
  slices: AllocationSlice[];
  weightsDisabled?: boolean;
}) {
  if (slices.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Add positions to see allocation.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {slices.map((s) => (
        <Box key={s.id}>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="body2" component="div">
              {s.symbol}{" "}
              <Box
                component="span"
                sx={{ typography: "caption", color: "text.secondary" }}
              >
                {s.kind}
                {s.exchange ? ` · ${s.exchange}` : ""}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatQuoteMoney(s.value, s.currency)}
              {weightsDisabled
                ? ""
                : ` · ${(s.weight * 100).toFixed(1)}%`}
            </Typography>
          </Stack>
          {weightsDisabled ? null : (
            <LinearProgress
              variant="determinate"
              value={Math.min(100, s.weight * 100)}
              sx={{
                height: 6,
                borderRadius: 1,
                "& .MuiLinearProgress-bar": { borderRadius: 1 },
              }}
            />
          )}
        </Box>
      ))}
    </Stack>
  );
}
