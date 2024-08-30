import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { cn } from "@socketless/ui";
import { ThemeProvider } from "@socketless/ui/theme";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import dynamic from "next/dynamic";
import Link from "next/link";

import { Button } from "@socketless/ui/button";
import { Toaster } from "@socketless/ui/toast";

import UserMenu from "~/components/UserMenu";
import { PHProvider } from "~/providers/posthogProvider";
import { validateRequest } from "~/server/auth";

export const runtime = "edge";

export const metadata: Metadata = {
  metadataBase: new URL("https://socketless.ws"),
  title: {
    absolute: "Realtime connections without server | Socketless",
    template: "%s | Socketless",
  },
  description:
    "Realtime connections without server, scalable to the Moon. Serverless Websockets that work everywhere. Create realtime experiences like Chats, Collaboration Spaces, Push Notifications, without mantaining your own servers.",
  openGraph: {
    url: "https://socketless.ws",
    siteName: "Socketless",
  },
  twitter: {
    card: "summary_large_image",
    site: "@pol_vallverdu",
    creator: "@pol_vallverdu",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
});

const PostHogPageView = dynamic(() => import("../providers/posthogPageView"), {
  ssr: false,
});

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { user } = await validateRequest();

  return (
    <html lang="en" suppressHydrationWarning>
      <TRPCReactProvider>
        <PHProvider>
          <body
            className={cn(
              "bg-background text-foreground antialiased",
              inter.className,
            )}
          >
            <PostHogPageView />
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              forcedTheme="light"
            >
              <header className="fixed left-0 top-0 z-40 h-[50px] w-full bg-secondary/50 backdrop-blur">
                <nav className="mx-auto flex h-full max-w-screen-xl flex-row items-center justify-between px-4 py-0.5">
                  <Link
                    href="/"
                    className="font-black transition-transform hover:scale-125"
                  >
                    Socketless
                  </Link>
                  <ul className="flex flex-row gap-4">
                    <li>
                      <Button asChild variant={"ghost"}>
                        <Link href="/#features">Features</Link>
                      </Button>
                    </li>
                    <li>
                      <Button asChild variant={"ghost"}>
                        <Link href="/#pricing">Pricing</Link>
                      </Button>
                    </li>
                    <li>
                      <Button asChild variant={"ghost"}>
                        <Link href="https://docs.socketless.ws" target="_blank">
                          Docs
                        </Link>
                      </Button>
                    </li>
                  </ul>
                  <div className="flex flex-row items-center gap-2">
                    <Button asChild variant="ghost">
                      <Link href={user === null ? "/auth" : "/dashboard"}>
                        Dashboard
                      </Link>
                    </Button>
                    {user === null ? (
                      <Button asChild variant="default">
                        <Link href="/#start">Get Started</Link>
                      </Button>
                    ) : (
                      // <Link href="/auth">Get Started</Link>
                      <UserMenu user={user} />
                    )}
                  </div>
                </nav>
              </header>
              <main className="min-h-screen">{props.children}</main>
              <Toaster />
            </ThemeProvider>
          </body>
        </PHProvider>
      </TRPCReactProvider>
    </html>
  );
}
