import { createTheme } from "@mui/material/styles";

/** Dark-first palette; light scheme can be layered later via MUI color scheme APIs. */
export const elliottTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7dd3c0" },
    secondary: { main: "#a78bfa" },
    background: {
      default: "#0b0d10",
      paper: "#12151c",
    },
    divider: "rgba(255,255,255,0.08)",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    h1: { fontWeight: 600, fontSize: "1.75rem", letterSpacing: "-0.02em" },
    h2: { fontWeight: 600, fontSize: "1.25rem" },
    body2: { fontSize: "0.8125rem" },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiButton: {
      defaultProps: { variant: "outlined", size: "small" },
    },
  },
});
