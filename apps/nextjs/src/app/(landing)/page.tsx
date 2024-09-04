import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Info, Mail, Percent } from "lucide-react";

import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";

import ContactForm from "~/components/home/ContactForm";
// import Faq from "~/components/home/Faq";
import CodeDemo from "~/components/home/CodeDemo";
import DemoExamples from "~/components/home/DemoExamples";
import Chat from "~/components/home/LandingChat";
import { socketless } from "~/server/socketless";
import { generate } from "random-words";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { CookiesProvider } from "next-client-cookies/server";

function Cross({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#e8eaed"
      className={className}
    >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  );
}

async function LandingChat() {
  let name = cookies().get("socketless_name")?.value;
  let url = cookies().get("socketless_url")?.value;

  if (!name || !url) {
    name = generate({
      exactly: 3, join: "", formatter: (word, index) => {
        return index === 0
          ? word.slice(0, 1).toUpperCase().concat(word.slice(1))
          : word;
      },
    })

    const response = await socketless.getConnection(name, ["landing"]);
    url = response.url;
  }

  if (url == null) {
    return <div>Couldn't connect to the server</div>;
  }

  return <Chat websocketUrl={url} name={name} />
}

export default function HomePage() {
  // You can await this here if you don't want to show Suspense fallback below
  return (
    <>
      <section
        id="hero"
        className="mx-auto flex min-h-[80vh] max-w-screen-xl flex-col items-center gap-6 px-4 pt-32 text-center lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:pt-0 lg:text-start"
      >
        <div>
          <h1 className="text-5xl font-bold">
            Websockets <span className="font-black text-primary">without sockets </span>
          </h1>
          <h2 className="my-6 text-lg">
            Serverless Websockets that work everywhere. Low-latency, globally distributed, easy to use. What more do you want?{" "}
          </h2>
          <div className="flex flex-row justify-center gap-4 lg:justify-start">
            <Button asChild>
              <Link href="/dashboard">
                Register for Free
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="https://docs.socketless.ws" target="_blank">
                Documentation <ArrowRight className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
        <div>
          {/* <Image
            src="hero.svg"
            width={1080}
            height={1080}
            alt="Simple steps: create project, create connection, connect through wscat"
          /> */}
          <CookiesProvider>
            <Suspense fallback={<p>Loading...</p>}>
              <LandingChat />
            </Suspense>
          </CookiesProvider>
        </div>
      </section>

      {/* Pros, cons */}
      <section id="pros-cons">
        <h3 className="text-center text-4xl font-bold">
          What does it take to create a Realtime Experience?
        </h3>
        <h4 className="mx-auto max-w-[700px] p-4 text-center text-lg">
          Let's say you want to build a Realtime Experience in a traditional
          way, here's what you're going to encounter:
        </h4>

        <div className="my-8 flex flex-col items-center gap-8 md:grid md:grid-cols-2 md:grid-rows-1 md:items-start md:gap-20">
          <div className="rounded-lg border-2 border-secondary-foreground bg-[#00bd10] p-4 text-white md:ml-auto">
            <p className="text-xl font-medium">Pros</p>
            <hr className="my-2 rounded-lg border-2 border-white" />
            <ul className="ml-2 mt-4 flex flex-col gap-4">
              <li className="inline-flex">
                <Check className="mr-2" />
                <p>
                  Provide <b>Realtime Data</b> to Frontend
                </p>
              </li>
              <li className="flex flex-row">
                <Check className="mr-2" />
                <p>
                  Better <b>User Experience</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Check className="mr-2" />
                <p>
                  Capture many <b>more users</b>
                </p>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border-2 border-secondary-foreground bg-[#df0000] p-4 text-white md:mr-auto">
            <p className="text-xl font-medium">Cons</p>
            <hr className="my-2 rounded-lg border-2 border-white" />
            <ul className="ml-2 mt-4 flex flex-col gap-4">
              <li className="inline-flex">
                <Cross className="mr-2" />
                <p>
                  Handle <b>persistent client connections</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Cross className="mr-2" />
                <p>
                  Maintain <b>complex infrastructure</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Cross className="mr-2" />
                <p>
                  Hard to <b>scale</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Cross className="mr-2" />
                <p>
                  High <b>latency</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Cross className="mr-2" />
                <p>
                  High <b>bandwidth</b>
                </p>
              </li>
              <li className="flex flex-row">
                <Cross className="mr-2" />
                <p>And more...</p>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-6 inline-flex w-full items-center justify-center text-xl underline">
          <ArrowDown className="mr-2" />
          There's an easier way
        </p>
      </section>

      {/* Demo */}
      <section id="features" className="pt-16">
        <h3 className="w-full px-4 text-center text-4xl font-bold">
          Create realtime apps without a server
        </h3>
        <h4 className="mx-auto max-w-[700px] p-4 px-4 text-center text-lg">
          Define what you need, and we'll handle the rest. You just build your app.
        </h4>

        <div className="max-w-screen-xl mx-auto py-8">
          <CodeDemo />
        </div>

        <div className="text-center">
          <p className="text-lg font-medium pt-8">Check our examples:</p>

          <DemoExamples />
        </div>
      </section>

      {/* Features */}
      {/* <section id="features" className="pt-16">
        <h3 className="w-full px-4 text-center text-4xl font-bold">
          Create realtime apps without a server
        </h3>
        <h4 className="mx-auto max-w-[700px] p-4 px-4 text-center text-lg">
          Create, manage and broadcast to Websockets without having to worry.
          You build your app, we handle your connections and messages. Combine
          our features to make your product successful:
        </h4>

        <Features />
      </section> */}

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-screen-xl px-4 py-8">
        <h3 className="w-full pt-4 text-center text-4xl font-bold">
          We keep princing simple.
        </h3>
        <h4 className="mx-auto max-w-screen-lg py-8 text-lg">
          Three simple plans, with three simple specifications. You can try us
          for free, and upgrade to Pay-as.you-go plan whenever you want. If you
          still have specific needs, we have an Enterprise Plan.
        </h4>
        <div className="flex flex-wrap justify-around gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>
                Try us for free, no strings attached.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Included in this plan:</p>
              <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
                <li>10k Connections</li>
                <li>50k Incoming Messages</li>
                <li>50k Outgoing Messages</li>
                <li>5 connections per channel</li>
                <li>Unlimited Channels</li>
                <li>Unlimited Concurrent Connections</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/auth">Create a project</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Pay-as-you-go</CardTitle>
              <CardDescription>
                You decide your limits, we scale for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Included in this plan:</p>
              <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
                <li>25k Connections</li>
                <li>250k Incoming Messages</li>
                <li>200k Outgoing Messages</li>
                <li>100 connections per channel</li>
                <li>Unlimited Channels</li>
                <li>Unlimited Concurrent Connections</li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild>
                <Link href="/#start">Request a Demo</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card className="border-primary-foreground bg-primary text-white">
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>
                Benefit your business from exclusive features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Included in this plan:</p>
              <ul className="flex list-disc flex-col gap-2 px-4 pt-2">
                <li>Flexible pricing model</li>
                <li>Unlimited Connections & Messages</li>
                <li>Unlimited Connections per Channel</li>
                <li>CNAME, SSO, & more...</li>
                <li>99.999% uptime SLAs</li>
                <li>24/7 Support</li>
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button variant="secondary" asChild>
                <Link href="/#start">Contact with Sales</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Why */}
      <section id="why" className="mx-auto max-w-screen-xl px-4 py-8">
        <h3 className="text-center text-4xl font-bold">Why use Socketless?</h3>
        {/* <h4></h4> */}
        <ul className="flex flex-wrap items-center justify-center gap-8 py-8">
          <li className="max-w-[500px]">
            <Card>
              <CardHeader>
                <CardTitle>Simple to use</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Based on technology that's everywhere. Use HTTP request or
                  Websockets however you like, no need to use a bloated SDK on
                  the middle.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws"
                  target="_blank"
                  className="underline"
                >
                  Read the docs →
                </a>
              </CardFooter>
            </Card>
          </li>

          <li className="max-w-[500px]">
            <Card>
              <CardHeader>
                <CardTitle>Low latency</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Sending messages is really fast. We've design our systems globally to
                  process requests in milliseconds across the globe.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws/infrastructure"
                  target="_blank"
                  className="underline"
                >
                  Our infrastructure →
                </a>
              </CardFooter>
            </Card>
          </li>

          <li className="max-w-[500px]">
            <Card>
              <CardHeader>
                <CardTitle>World-wide</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Doesn't matter where you are, and where your users are. We use multiple locations to provide the best experience.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws/locations"
                  target="_blank"
                  className="underline"
                >
                  Check out our locations →
                </a>
              </CardFooter>
            </Card>
          </li>

          <li className="max-w-[500px]">
            <Card>
              <CardHeader>
                <CardTitle>Secure</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  You have the full control to allow connections to specific
                  channels and you decide who receives messages.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws"
                  target="_blank"
                  className="underline"
                >
                  Read the docs →
                </a>
              </CardFooter>
            </Card>
          </li>
        </ul>
      </section>

      {/* Ready to start */}
      <section id="start" className="mx-auto max-w-screen-xl p-4">
        <h3 className="py-4 text-center text-4xl font-bold">Ready to start?</h3>

        <div className="my-8 flex flex-col gap-8 md:grid md:grid-cols-2">
          <div>
            <h4 className="text-lg">
              Are you ready to start with Socketless, or have any inquire? Don't
              hesitate to contact us! We're here to listen to you.
            </h4>
            <div className="flex flex-col justify-start gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <p className="inline-flex">
                  <Percent className="mr-2" />
                  Sales Email:
                </p>
                <a
                  href="mailto:sales@socketless.ws"
                  target="_blank"
                  className="ml-8 underline"
                >
                  sales@socketless.ws
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <p className="inline-flex">
                  <Mail className="mr-2" /> Contact Email:
                </p>
                <a
                  href="mailto:contact@socketless.ws"
                  target="_blank"
                  className="ml-8 underline"
                >
                  contact@socketless.ws
                </a>
              </div>

              <div className="flex flex-col gap-2">
                <p className="inline-flex">
                  <Info className="mr-2" />
                  Support Email:
                </p>
                <a
                  href="mailto:support@socketless.ws"
                  target="_blank"
                  className="ml-8 underline"
                >
                  support@socketless.ws
                </a>
              </div>
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FAQ */}
      {/* <section id="faq" className="max-w-screen-lg mx-auto py-4">
        <h3 className="text-4xl text-center font-bold py-4">Frequently Asked Questions</h3>
        <h4 className="text-lg py-6">Here you have some of our most requested questions answered:</h4>

        <Card>
          <div className="px-4 py-2">
            <Faq />
          </div>
        </Card>
      </section> */}
    </>
  );
}
