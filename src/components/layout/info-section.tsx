import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function InfoSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Stack spacing={1} component="section">
      <Typography component="h2" variant="h2" sx={{ fontSize: "1.05rem" }}>
        {title}
      </Typography>
      <Typography component="div" variant="body2" color="text.secondary" sx={{ "& p": { m: 0, mb: 1.25 }, "& p:last-child": { mb: 0 } }}>
        {children}
      </Typography>
    </Stack>
  );
}
