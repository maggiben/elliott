"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useSetAtom } from "jotai";
import { positionDialogAtom } from "@/state/ui-atoms";

export function AppShell({ children }: { children: React.ReactNode }) {
  const setDialog = useSetAtom(positionDialogAtom);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          backdropFilter: "blur(10px)",
          bgcolor: "rgba(18,21,28,0.85)",
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h2" sx={{ fontSize: "1.1rem", flexGrow: 1 }}>
            Elliott
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Client-only · IndexedDB
          </Typography>
          <Button
            variant="contained"
            onClick={() =>
              setDialog({ mode: "create", nonce: Date.now() })
            }
          >
            Add position
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}
