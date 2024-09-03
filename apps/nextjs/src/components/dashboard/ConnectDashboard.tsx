"use client";

import { ApiPostConnectResponseSchema } from "@socketless/shared";
import type { ApiPostConnectRequestSchema } from "@socketless/shared";
import { Button } from "@socketless/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useForm } from "@socketless/ui/form";
import { Input } from "@socketless/ui/input";
import { useState } from "react";
import { z } from "zod";
import useWebSocket from 'react-use-websocket';

export default function ConnectDashboard() {
  const [url, setUrl] = useState<string | null>(null);

  return <div>
    <ConnectForm onConnect={setUrl} />
    {url !== null && <SimpleClient url={url} />}
  </div>
}

function ConnectForm({ onConnect }: { onConnect: (url: string) => void }) {
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

  return <Form {...form}>
    <form
      className="flex w-full max-w-2xl flex-col gap-4"
      onSubmit={form.handleSubmit(async (data) => {
        const req = await fetch("/api/v0/connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${data.token}`,
          },
          body: JSON.stringify({
            identifier: data.identifier,
          } satisfies z.infer<typeof ApiPostConnectRequestSchema>),
        })

        if (!req.ok) {
          return alert("Failed to connect.");
        }

        const res = ApiPostConnectResponseSchema.parse(await req.json());

        //! For development
        onConnect(res.url.replace("wss://connect.socketless.ws", "ws://localhost:3100"));

        // onConnect(res.url);
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
            <FormControl>
              <Input {...field} placeholder="******" type="password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Button className="ml-auto w-fit">
        Connect
      </Button>
    </form>
  </Form>
}

function SimpleClient({ url }: { url: string }) {
  const { sendMessage, lastMessage, readyState } = useWebSocket(url);

  return <p>{readyState}</p>
}