import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AppShell } from "@/components/layout/app-shell";

export function InfoPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <Typography component="h1" variant="h1">
          {title}
        </Typography>
        {children}
      </Stack>
    </AppShell>
  );
}
