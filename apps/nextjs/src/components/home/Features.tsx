"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BarChart3, Bell, Clock10, ListPlus, Rss, Webhook } from "lucide-react";

import { cn } from "@socketless/ui";

interface FeatureType {
  name: string;
  icon: ReactNode;
  description: ReactNode;
}

const featuresData: [FeatureType, ...FeatureType[]] = [
  {
    name: "Channels",
    icon: <ListPlus />,
    description: (
      <>
        <p>
          Manage your connections in a channel level. Use channels to distribute
          clients on our infrastructure, and make it easier for you 😉.
        </p>
      </>
    ),
  },
  {
    name: "Broadcast",
    icon: <Rss />,
    description: (
      <>
        <p>
          Publish messages to specific channels, and specific connected clients,
          with a simple Http Request. No need to maintain an opened connection.
        </p>
        <p className="mt-2 text-sm opacity-70">
          <em>Psst,</em> you won't get charged for publishing messages to
          channels that don't have any client connected.
        </p>
      </>
    ),
  },
  {
    name: "Webhooks",
    icon: <Webhook />,
    description: (
      <>
        <p>
          Communicate with your clients through Webhooks! You can receive a
          Request when a client connects, sends a message, and when a clients
          disconnects, with the ability to respond.
        </p>
        <br />
        <a
          href="https://docs.socketless.ws"
          target="_blank"
          className="underline"
        >
          Check out more on our documentation →
        </a>
      </>
    ),
  },
  {
    name: "Push Notifications",
    icon: <Bell />,
    description: (
      <>
        <p>
          <em>Soon</em> you'll be able to send Push notifications to Android an
          iOS Applications, as well as Websites. Keep tuned!
        </p>
      </>
    ),
  },
  {
    name: "Scheduling",
    icon: <Clock10 />,
    description: (
      <>
        <p>
          Need to send a message later? Don't worry, <em>soon</em> you'll be
          able to schedule a message (or a push notification) to be sent later
          to a channel!
        </p>
      </>
    ),
  },
  {
    name: "Analytics & Logs",
    icon: <BarChart3 />,
    description: (
      <>
        <p>
          Keep track of your channels and connections right on your panel. You
          can see active connections, when your clients or webhooks fail, and
          jump-in to any channel you want.
        </p>
        <br />
        <a
          href="https://docs.socketless.ws"
          target="_blank"
          className="underline"
        >
          Check out more on our documentation →
        </a>
      </>
    ),
  },
];

export default function Features() {
  const [featureIndex, setFeatureIndex] = useState(0);
  const [feature, setFeature] = useState<FeatureType>(featuresData[0]);

  useEffect(() => {
    const f = featuresData[featureIndex];
    if (!f) {
      setFeatureIndex(0);
      return;
    }
    setFeature(f);
  }, [featureIndex, setFeature]);

  return (
    <>
      <div className="mx-auto flex w-full max-w-screen-md flex-wrap justify-around space-y-4 px-4 py-4">
        {featuresData.map((f, i) => (
          <button
            onClick={() => setFeatureIndex(i)}
            className={cn(
              "flex flex-col items-center justify-center text-lg transition-opacity",
              featureIndex === i ? "opacity-100" : "opacity-40",
            )}
          >
            <div className="scale-[200%]">{f.icon}</div>
            <p className="mt-4">{f.name}</p>
          </button>
        ))}
      </div>
      <div className="bg-primary py-16 text-secondary">
        <div className="mx-auto max-w-screen-lg px-4">
          <h5 className="mb-4 text-2xl font-bold">{feature.name}</h5>
          {feature.description}
        </div>
      </div>
    </>
  );
}
