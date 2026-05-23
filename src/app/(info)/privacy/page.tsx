import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { InfoSection } from "@/components/layout/info-section";
import { pageMetadata } from "@/lib/seo";
import { SITE_APP_NAME, SITE_OWNER_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy policy",
  description: `How ${SITE_APP_NAME} stores portfolio data on your device and what is sent when fetching public market quotes.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography component="h1" variant="h1">
        Privacy policy
      </Typography>
      <Stack spacing={3}>
        <InfoSection title="Summary">
          <p>
            {SITE_APP_NAME} is built so your portfolio stays on your device.
            {SITE_OWNER_NAME} does not receive your holdings through an Elliott
            account—there isn&apos;t one. This policy describes what the app
            stores locally and what may be sent when it fetches market data.
          </p>
        </InfoSection>

        <InfoSection title="Data stored on your device">
          <p>
            Portfolio positions, UI preferences, cached quote snapshots, and
            related keys are kept in your browser (IndexedDB). Only you (or
            someone with access to your device or backup file) can read that data
            unless you choose to share it.
          </p>
        </InfoSection>

        <InfoSection title="Market and network requests">
          <p>
            When quotes or charts update, the app requests public market
            information for the symbols and time ranges you are viewing. Some
            calls go directly from your browser; others go through Elliott&apos;s
            Next.js API routes so API keys never ship to the client. Those
            third-party services have their own privacy policies and may log
            requests according to their terms.
          </p>
        </InfoSection>

        <InfoSection title="Backups">
          <p>
            Export creates a JSON file you control. Import reads a file you
            select. Elliott does not upload backups to a central server as part
            of normal use.
          </p>
        </InfoSection>

        <InfoSection title="Hosting">
          <p>
            If you use a hosted build of Elliott (for example on Vercel), the
            host may process HTTP logs for the app shell and API routes. That
            does not include your IndexedDB portfolio contents unless you send
            them in a request body (portfolio CRUD does not use the server).
          </p>
        </InfoSection>

        <InfoSection title="Changes and contact">
          <p>
            This policy may be updated as the product evolves. For common
            questions, see the <NextLink href="/faq">FAQ</NextLink>. The app is
            maintained by {SITE_OWNER_NAME}.
          </p>
        </InfoSection>
      </Stack>
    </Stack>
  );
}
