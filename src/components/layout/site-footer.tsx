import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { SITE_OWNER_NAME } from "@/lib/site";

const CURRENT_YEAR = new Date().getFullYear();

const footerLinkSx = {
  color: "text.secondary",
  textDecoration: "none",
  fontSize: "0.8125rem",
  "&:hover": {
    color: "primary.main",
    textDecoration: "underline",
  },
} as const;

export function SiteFooter() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "rgba(18,21,28,0.6)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
            alignItems: "center",
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ justifySelf: { sm: "start" } }}
          >
            © {CURRENT_YEAR}{" "}
            <Box
              component="span"
              sx={{ color: "text.primary", fontWeight: 500 }}
            >
              {SITE_OWNER_NAME}
            </Box>
            . All rights reserved.
          </Typography>
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{
              justifySelf: { xs: "start", sm: "center" },
              textAlign: { xs: "left", sm: "center" },
              whiteSpace: { sm: "nowrap" },
            }}
          >
            Made with{" "}
            <Box component="span" aria-label="love" role="img">
              ❤️
            </Box>{" "}
            in Patagonia, Argentina
          </Typography>
          <Stack
            direction="row"
            spacing={2.5}
            sx={{ justifySelf: { sm: "end" } }}
            divider={
              <Typography
                component="span"
                variant="body2"
                color="text.disabled"
                aria-hidden
              >
                ·
              </Typography>
            }
          >
            <Link component={NextLink} href="/faq" sx={footerLinkSx}>
              FAQ
            </Link>
            <Link component={NextLink} href="/privacy" sx={footerLinkSx}>
              Privacy policy
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
