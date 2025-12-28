import "~/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "MD Cerámica Dashboard",
  description:
    "Full-stack MD Cerámica control panel powered by Next.js, tRPC and Prisma.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const fontClass =
    typeof GeistSans.variable === "string" ? GeistSans.variable : "";
  return (
    <html lang="en" className={fontClass}>
      <body className="bg-sand text-ink">
        <TRPCReactProvider>
          <MantineProvider>
            <Notifications zIndex={1100} position="top-right" />
            {children}
          </MantineProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
