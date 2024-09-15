import { Suspense } from "react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Info, Mail, Percent } from "lucide-react";
// import Faq from "~/components/home/Faq";
import { CookiesProvider } from "next-client-cookies/server";
import { generate } from "random-words";

import Pricing from "@socketless/components/pricing";
import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";

import CodeDemo from "~/components/home/CodeDemo";
import ContactForm from "~/components/home/ContactForm";
import DemoExamples from "~/components/home/DemoExamples";
import Chat, { ChatError, ChatSkeleton } from "~/components/home/LandingChat";
import { socketless } from "~/server/socketless";

async function LandingChat() {
  let name = cookies().get("socketless_name")?.value;
  let url = cookies().get("socketless_url")?.value;

  if (name == null || url == null) {
    name = generate({
      exactly: 3,
      join: "",
      formatter: (word, index) => {
        return index === 0
          ? word.slice(0, 1).toUpperCase().concat(word.slice(1))
          : word;
      },
    });

    try {
      const response = await socketless.getConnection(name, ["landing"]);
      url = response.url;
    } catch (error) {
      console.error(error);
      return <ChatError name={name} />;
    }
  }

  return <Chat websocketUrl={url} name={name} />;
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
          {/* <div className="pb-8 w-fit mx-auto lg:mx-0">
            <a href="https://www.producthunt.com/posts/socketless?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-socketless" target="_blank">
              <Image src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=487474&theme=light" alt="Socketless - Publish&#0032;data&#0032;to&#0032;your&#0032;front&#0045;end&#0032;with&#0032;serverless&#0032;platforms | Product Hunt" style={{ width: 250, height: 54 }} width="250" height="54" />
            </a>
          </div> */}
          <h1 className="text-5xl font-bold">
            Websockets{" "}
            <span className="font-black text-primary">made simple</span>
          </h1>
          <h2 className="my-6 text-lg">
            Serverless Websockets that work everywhere. Low-latency, globally
            distributed, easy to use. What more do you want?{" "}
          </h2>
          <div className="flex flex-row justify-center gap-4 lg:justify-start">
            <Button asChild>
              <Link href="https://app.socketless.ws">Register for Free</Link>
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
            <Suspense fallback={<ChatSkeleton />}>
              <LandingChat />
            </Suspense>
          </CookiesProvider>
        </div>
      </section>

      {/* Powering */}
      <div className="w-full">
        <p className="text-center opacity-70">Proudly powering</p>
        <div className="flex items-center justify-center pt-4">
          <Link
            href="https://shoplist.wosher.co"
            target="_blank"
            className="flex flex-row items-center gap-2 opacity-40"
          >
            <Image
              src="/logos/powering/shoplist.png"
              width={50}
              height={50}
              alt="Shoplist logo"
            />
            <p className="text-xl">Shoplist</p>
          </Link>
        </div>
      </div>

      {/* Pros, cons */}
      {/* <ProsCons /> */}

      {/* Demo */}
      <section id="features" className="pt-16">
        <h3 className="w-full px-4 text-center text-4xl font-bold">
          Create realtime apps without a server
        </h3>
        <h4 className="mx-auto max-w-[700px] px-4 pt-4 text-center text-lg">
          Define what you need, and we'll handle the rest. You just build your
          app.
        </h4>

        <DemoExamples />

        <div className="mx-auto max-w-screen-xl py-8">
          <CodeDemo />
        </div>

        <div className="text-center">
          <p className="pt-8 text-lg font-medium">Works everywhere</p>

          <div className="flex flex-wrap items-center justify-center gap-8 pb-16 pt-4">
            <Image
              src="/logos/vercel.svg"
              width={800}
              height={200}
              alt="Vercel"
              draggable={false}
              className="h-8 w-fit"
            />
            <Image
              src="/logos/netlify.svg"
              width={800}
              height={200}
              alt="Vercel"
              draggable={false}
              className="h-10 w-fit"
            />
            <Image
              src="/logos/cfworkers.svg"
              width={800}
              height={200}
              alt="Vercel"
              draggable={false}
              className="h-8 w-fit"
            />
          </div>
        </div>

        <div className="mx-auto w-fit pb-12">
          <Button asChild className="">
            <Link href="https://app.socketless.ws">Try it right now</Link>
          </Button>
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
                  Sending messages is really fast. We've design our systems
                  globally to process requests in milliseconds across the globe.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws/docs/infrastructure"
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
                  Doesn't matter where you are, and where your users are. We use
                  multiple locations to provide the best experience.
                </p>
              </CardContent>
              <CardFooter>
                <a
                  href="https://docs.socketless.ws/docs/locations"
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
                  feeds and you decide who receives messages.
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
      <section id="pricing" className="mx-auto max-w-screen-xl px-4 pb-8 pt-16">
        <h3 className="w-full pt-4 text-center text-4xl font-bold">
          We keep pricing simple.
        </h3>
        <h4 className="mx-auto max-w-screen-lg py-8 text-center text-lg">
          Don't worry about hidden fees or complex pricing models. Just pay for
          what you use.
        </h4>

        <Pricing
          FreePlanFooter={
            <Button variant="outline" asChild>
              <Link href="https://app.socketless.ws">Create a project</Link>
            </Button>
          }
          LaunchPlanFooter={
            <Button asChild>
              <Link href="/#start">Request a Demo</Link>
            </Button>
          }
          EnterprisePlanFooter={
            <Button variant="secondary" asChild>
              <Link href="/#start">Contact with Sales</Link>
            </Button>
          }
        />
      </section>

      {/* Ready to start */}
      <section id="start" className="mx-auto max-w-screen-xl p-4">
        <h3 className="py-4 text-center text-4xl font-bold">Ready to start?</h3>
        <div className="mx-auto w-fit py-4">
          <Button asChild className="scale-125 text-center text-lg">
            <Link href="https://app.socketless.ws">Register today</Link>
          </Button>
        </div>

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
