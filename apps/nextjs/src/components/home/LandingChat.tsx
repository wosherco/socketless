"use client";

import { useCallback, useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@socketless/ui/card";
import { Textarea } from "@socketless/ui/textarea";
import { Button } from "@socketless/ui/button";
import { Loader, Send } from "lucide-react";
import { useCookies } from "next-client-cookies";
import { Input } from "@socketless/ui/input";

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

  const [message, setMessage] = useState("");
  const [valid, setValid] = useState(false);

  useEffect(() => {
    const length = message.trim().length;
    if (length <= 0 || length >= 950) {
      setValid(false);
    } else {
      setValid(true);
    }
  }, [message, setValid]);

  const sendMessageCallback = useCallback(() => {
    if (!valid) return;

    sendMessage(message);
    setMessage("");
  }, [sendMessage, message, setMessage, valid])

  return <div className="h-screen w-full flex items-center justify-center">
    <Card className="max-w-[500px] w-full mx-4">
      <CardHeader>
        <CardTitle>
          Chat
        </CardTitle>
        <CardDescription>
          You are <b>{name}</b>
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[400px]">
        {
          readyState === ReadyState.OPEN ?

            // Socket is connected, showing messages
            <MessagesHistory messages={messageHistory} /> :

            // Socket is connecting, showing spinner
            <div className="w-full min-h-[390px] flex items-center justify-center">
              <Loader className="animate-spin" />
            </div>
        }
      </CardContent>
      <CardFooter>
        <div className="flex flex-row gap-2 w-full">
          <form className="w-full flex-grow" onSubmit={(e) => {
            e.preventDefault();
            sendMessageCallback();
          }}>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} />
          </form>
          <Button disabled={!valid} onClick={sendMessageCallback}>
            <Send />
          </Button>
        </div>
      </CardFooter>
    </Card>
  </div>
}