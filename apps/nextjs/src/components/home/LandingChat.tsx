"use client";

import { Button } from "@socketless/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@socketless/ui/card";
import { Loader } from "lucide-react";
import { useCookies } from "next-client-cookies";
import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";

function MessagesHistory({ messages }: { messages: any }) {
  return <div>
    {messages.map((message: any, index: number) => {
      const jsonData = JSON.parse(message.data)
      return <div key={index}>
        {`${jsonData.name}: ${jsonData.message}`}
      </div>
    })}
  </div>
}

export default function Chat({ websocketUrl, name }: { websocketUrl: string; name: string; }) {
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
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(websocketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
    }
  }, [lastMessage]);

  const sendMessageCallback = useCallback((emoji: string) => {
    sendMessage(emoji);
  }, [sendMessage])

  const emojis = ["😄", "😂", "😛", "🫡", "🤗"]

  return <div className="w-full flex items-center justify-center py-8">
    <Card className="max-w-[500px] w-full mx-4">
      <CardHeader>
        <CardTitle>
          Try it yourself
        </CardTitle>
        <CardDescription>
          You are <b>{name}</b>
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[200px] lg:min-h-[300px]">
        {
          readyState === ReadyState.OPEN ?

            // Socket is connected, showing messages
            <MessagesHistory messages={messageHistory} /> :

            // Socket is connecting, showing spinner
            <div className="w-full min-h-[200px] lg:min-h-[300px] flex items-center justify-center">
              <Loader className="animate-spin" />
            </div>
        }
      </CardContent>
      <CardFooter>
        <div className="flex flex-row gap-2 w-full items-center justify-around">
          {emojis.map((emoji) =>
            <Button key={emoji} variant="outline" onClick={() => sendMessageCallback(emoji)}>
              {emoji}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  </div>
}