import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { cn } from "@socketless/ui";
import { ThemeProvider } from "@socketless/ui/theme";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@socketless/ui/button";
import { Toaster } from "@socketless/ui/toast";

import UserMenu from "~/components/UserMenu";
import { PHProvider } from "~/providers/posthogProvider";
import { validateRequest } from "~/server/auth";

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
                  <div className="flex flex-row items-center gap-4">
                    <Link
                      href="/"
                      className="font-black transition-transform hover:scale-125"
                    >
                      Socketless
                    </Link>
                    <Link
                      href="https://github.com/wosherco/socketless"
                      target="_blank"
                      className="hidden sm:block"
                    >
                      <Image
                        src="/logos/github.svg"
                        width={24}
                        height={24}
                        alt="Github Repository"
                      />
                    </Link>
                  </div>
                  {/* <ul className="flex flex-row gap-4">
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
                    <li className="lg:block hidden">
                      
                    </li>
                  </ul> */}
                  <div className="flex flex-row items-center gap-2">
                    <Button asChild variant={"ghost"}>
                      <Link href="https://docs.socketless.ws" target="_blank">
                        Documentation
                      </Link>
                    </Button>
                    {user === null ? (
                      <Button asChild variant="default">
                        <Link href="/auth">Get Started</Link>
                      </Button>
                    ) : (
                      <>
                        <Button asChild variant={"outline"} className="mr-2">
                          <Link href="/">Dashboard</Link>
                        </Button>
                        <UserMenu user={user} />
                      </>
                    )}
                  </div>
                </nav>
              </header>

              <main className="mx-auto min-h-[100dvh] max-w-screen-xl pt-[50px]">
                {props.children}
              </main>

              <footer className="mt-10 bg-primary text-white">
                <div className="mx-auto flex max-w-screen-xl justify-between gap-4 p-16">
                  <p>
                    Created with 💓 by{" "}
                    <a
                      className="hover:underline"
                      href="https://polv.dev"
                      target="_blank"
                    >
                      Pol Vallverdu
                    </a>
                    .
                  </p>
                  <div className="flex flex-row items-center gap-4">
                    <Link
                      href="https://github.com/wosherco/socketless"
                      target="_blank"
                      className="invert"
                    >
                      <Image
                        src="/logos/github.svg"
                        width={24}
                        height={24}
                        alt="Github Repository"
                      />
                    </Link>
                    <p>
                      © 2024{" "}
                      <a
                        className="hover:underline"
                        href="https://wosher.co"
                        target="_blank"
                      >
                        wosher.co
                      </a>
                      . All Rights Reserved.
                    </p>
                  </div>
                </div>
              </footer>
              <Toaster />
            </ThemeProvider>
          </body>
        </PHProvider>
      </TRPCReactProvider>
    </html>
  );
}
