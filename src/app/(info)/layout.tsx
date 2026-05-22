import { InfoShell } from "@/components/layout/info-shell";

export default function InfoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <InfoShell>{children}</InfoShell>;
}
