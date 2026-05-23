import type { Metadata } from "next";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { InfoSection } from "@/components/layout/info-section";
import { pageMetadata } from "@/lib/seo";
import { SITE_APP_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: `Frequently asked questions about ${SITE_APP_NAME} — local storage, market data, backups, and quotes.`,
  path: "/faq",
});

export default function FaqPage() {
  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Typography component="h1" variant="h1">
        FAQ
      </Typography>
      <Stack spacing={3}>
        <InfoSection title="What is Elliott?">
          <p>
            Elliott is a portfolio tracker that runs in your browser. You add
            positions (stocks, crypto, fixed income you describe yourself), and
            the app shows allocation, KPIs, and charts using public market data
            where available.
          </p>
        </InfoSection>

        <InfoSection title="Where is my portfolio stored?">
          <p>
            Your holdings live on your device in IndexedDB. Elliott does not
            operate a server database of your positions. Export and import
            backups are available from the toolbar menu if you want a copy of
            your data.
          </p>
        </InfoSection>

        <InfoSection title="What data leaves my browser?">
          <p>
            To refresh prices and charts, the app calls public market APIs (for
            example CoinGecko and Binance from the browser, and TwelveData or
            listing providers through Elliott&apos;s server routes where keys
            must stay private). Those requests send symbols and ranges needed
            for quotes—not your full portfolio backup unless you export it
            yourself.
          </p>
        </InfoSection>

        <InfoSection title="Do I need an account?">
          <p>
            No. There is no Elliott login. Clearing site data in your browser
            removes local portfolio storage unless you have a backup file.
          </p>
        </InfoSection>

        <InfoSection title="Why are some quotes missing or stale?">
          <p>
            Free and demo API tiers can rate-limit or fail. Elliott caches
            recent quotes locally and may show last-known values when a live
            fetch fails. Crypto from CoinGecko is usually the most reliable path
            in the browser; some venues depend on server-side providers.
          </p>
        </InfoSection>

        <InfoSection title="More about privacy">
          <p>
            See the{" "}
            <NextLink href="/privacy">privacy policy</NextLink> for how local
            storage, market requests, and backups are handled.
          </p>
        </InfoSection>
      </Stack>
    </Stack>
  );
}
