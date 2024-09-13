"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { z } from "zod";

import type { ApiPostConnectRequestSchema } from "@socketless/shared";
import { ApiPostConnectResponseSchema } from "@socketless/shared";
import { Button } from "@socketless/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@socketless/ui/form";
import { Input } from "@socketless/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@socketless/ui/select";
import { Textarea } from "@socketless/ui/textarea";

interface Token {
  name: string;
  token: string;
}
interface ConnectDashboardProps {
  tokens: Token[];
  projectId: number;
}

export default function ConnectDashboard(props: ConnectDashboardProps) {
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div>
      <ConnectForm
        onConnect={setUrl}
        tokens={props.tokens}
        projectId={props.projectId}
      />
      {url !== null && <SimpleClient url={url} />}
    </div>
  );
}

function ConnectForm({
  onConnect,
  tokens,
  projectId,
}: {
  onConnect: (url: string) => void;
  tokens: Token[];
  projectId: number;
}) {
  const form = useForm({
    schema: z.object({
      identifier: z.string().min(1),
      token: z.string().min(1),
      webhook: z.string().optional(),
    }),
    defaultValues: {
      identifier: "",
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex w-full max-w-2xl flex-col gap-4"
        onSubmit={form.handleSubmit(async (data) => {
          const req = await fetch("/api/v0/connection", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${data.token}`,
            },
            body: JSON.stringify({
              identifier: data.identifier,
            } satisfies z.infer<typeof ApiPostConnectRequestSchema>),
          });

          if (!req.ok) {
            return alert("Failed to connect.");
          }

          const res = ApiPostConnectResponseSchema.parse(await req.json());

          //! For development
          // onConnect(res.url.replace("wss://connect.socketless.ws", "ws://localhost:3100"));

          onConnect(res.url);
        })}
      >
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Identifier</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="token"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the token you want to use" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem value={token.token}>{token.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select the token you want to use. You can manage your tokens
                <Link href={`/${projectId}/tokens`}>here</Link>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="webhook"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook URL (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="https://example.com/api/socketless"
                  type="url"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="ml-auto w-fit">Connect</Button>
      </form>
    </Form>
  );
}

function SimpleClient({ url }: { url: string }) {
  const [messageHistory, setMessageHistory] = useState("");
  const [message, setMessage] = useState("");
  const { sendMessage, lastMessage, readyState } = useWebSocket(url);

  useEffect(() => {
    if (lastMessage) {
      setMessageHistory(messageHistory + lastMessage.data + "\n");
    }
  }, [lastMessage, messageHistory]);

  const submitMessage = useCallback(() => {
    sendMessage(message);
    setMessageHistory(messageHistory + "➡️" + message + "\n");
    setMessage("");
  }, [message, sendMessage, messageHistory]);

  return (
    <div>
      <p>
        Status: {readyState === ReadyState.OPEN ? "Connected" : "Disconnected"}
      </p>
      <Textarea readOnly className="mt-4 rounded-lg border-[1px]">
        {messageHistory}
      </Textarea>

      <div className="mt-4 flex flex-row gap-4">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
          className="w-full"
          onSubmit={submitMessage}
        />
        <Button onClick={submitMessage}>Send</Button>
      </div>
    </div>
  );
}
