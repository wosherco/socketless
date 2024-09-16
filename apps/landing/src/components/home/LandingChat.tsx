"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader } from "lucide-react";
import { useCookies } from "next-client-cookies";

import { useSocketlessWebsocket } from "@socketless/react";
import { Button } from "@socketless/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@socketless/ui/card";

function MessagesHistory({ messages }: { messages: string[] }) {
  return (
    <div className="max-h-[200px] overflow-auto lg:max-h-[300px]">
      {messages.map((message) => (
        <p>{message}</p>
      ))}
    </div>
  );
}

const emojis = ["😄", "😂", "😛", "🫡", "🤗"];

export default function Chat({
  websocketUrl,
  name,
}: {
  websocketUrl: string;
  name: string;
}) {
  const cookies = useCookies();
  // Saving cookies
  useEffect(() => {
    cookies.set("socketless_url", websocketUrl, {
      expires: new Date(Date.now() + 1000 * 60 * 60),
    });
    cookies.set("socketless_name", name, {
      expires: new Date(Date.now() + 1000 * 60 * 60),
    });
  }, [cookies, websocketUrl, name]);

  // Opening websocket and creating a message history
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const { client, lastMessage } = useSocketlessWebsocket(websocketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  const sendMessageCallback = useCallback(
    (emoji: string) => {
      client?.send(emoji);
    },
    [client],
  );

  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Try it yourself</CardTitle>
          <CardDescription>
            You are <b>{name}</b>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] lg:min-h-[300px]">
          {client?.getState() === "CONNECTED" ? (
            // Socket is connected, showing messages
            <MessagesHistory messages={messageHistory} />
          ) : (
            // Socket is connecting, showing spinner
            <div className="flex min-h-[200px] w-full items-center justify-center lg:min-h-[300px]">
              <Loader className="animate-spin" />
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-row items-center justify-around gap-2">
            {emojis.map((emoji) => (
              <Button
                key={emoji}
                variant="outline"
                onClick={() => sendMessageCallback(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Try it yourself</CardTitle>
          <CardDescription>
            You are <b>Loading...</b>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] lg:min-h-[300px]">
          <div className="flex min-h-[200px] w-full items-center justify-center lg:min-h-[300px]">
            <Loader className="animate-spin" />
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-row items-center justify-around gap-2">
            {emojis.map((emoji) => (
              <Button key={emoji} variant="outline" disabled>
                {emoji}
              </Button>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export function ChatError({ name }: { name: string }) {
  return (
    <div className="flex w-full items-center justify-center py-8">
      <Card className="mx-4 w-full max-w-[500px]">
        <CardHeader>
          <CardTitle>Try it yourself</CardTitle>
          <CardDescription>
            You are <b>{name}</b>
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] lg:min-h-[300px]">
          <div className="flex min-h-[200px] w-full items-center justify-center lg:min-h-[300px]">
            An error has ocurred. Refresh to try again.
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full flex-row items-center justify-around gap-2">
            {emojis.map((emoji) => (
              <Button key={emoji} variant="outline" disabled>
                {emoji}
              </Button>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
