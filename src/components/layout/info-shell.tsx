"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_APP_NAME } from "@/lib/site";

/** Minimal chrome for FAQ / privacy — no portfolio toolbar or dialogs. */
export function InfoShell({ children }: { children: React.ReactNode }) {
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
          <Link
            component={NextLink}
            href="/"
            underline="none"
            color="inherit"
            aria-label={`${SITE_APP_NAME} home`}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              "&:hover": { opacity: 0.85 },
            }}
          >
            <Box
              component="img"
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              fetchPriority="high"
              sx={{ height: 28, width: 28, flexShrink: 0, objectFit: "contain" }}
            />
            <Typography
              component="span"
              sx={{ fontSize: "1.1rem", fontWeight: 600 }}
            >
              {SITE_APP_NAME}
            </Typography>
          </Link>
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            <Link
              component={NextLink}
              href="/"
              color="inherit"
              underline="hover"
              sx={{ fontSize: "inherit" }}
            >
              Portfolio
            </Link>
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1, py: 3 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
      <SiteFooter />
    </Box>
  );
}
