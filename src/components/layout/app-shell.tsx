"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useAtom, useSetAtom } from "jotai";
import { positionDialogAtom, portfolioDisplayCurrencyAtom } from "@/state/ui-atoms";

const BOOK_CURRENCIES = [
  { code: "USD", label: "USD" },
  { code: "ARS", label: "ARS" },
  { code: "EUR", label: "EUR" },
  { code: "GBP", label: "GBP" },
  { code: "BRL", label: "BRL" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const setDialog = useSetAtom(positionDialogAtom);
  const [bookCurrency, setBookCurrency] = useAtom(portfolioDisplayCurrencyAtom);

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
          <FormControl size="small" sx={{ minWidth: 112 }}>
            <InputLabel id="book-currency-label">Book</InputLabel>
            <Select
              labelId="book-currency-label"
              id="book-currency"
              value={bookCurrency}
              label="Book"
              onChange={(e) => setBookCurrency(String(e.target.value))}
            >
              {BOOK_CURRENCIES.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
