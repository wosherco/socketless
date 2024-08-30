"use client";

import { useEffect, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import useSWRMutation from "swr/mutation";

import { Button } from "@socketless/ui/button";
import { Input } from "@socketless/ui/input";
import { Label } from "@socketless/ui/label";
import { toast } from "@socketless/ui/toast";
import { ChannelNameValidator } from "@socketless/validators";

import type { api as apiserver } from "~/trpc/server";

export default function ConnectTesting({
  project,
}: {
  project: Exclude<
    Awaited<ReturnType<typeof apiserver.projects.getProject.query>>,
    undefined
  >;
}) {
  const [channelName, setChannelName] = useState<string | null>(null);
  const [customData, setCustomData] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [websocketUrl, setWebsocketUrl] = useState<string | null>(null);
  // const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const { sendMessage, lastMessage, readyState } = useWebSocket(websocketUrl);

  // useEffect(() => {
  //   if (lastMessage !== null) {
  //     setMessageHistory((prev) => prev.concat(lastMessage));
  //   }
  // }, [lastMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      toast.success("Connected to channel successfully.");
    }
  }, [readyState]);

  async function requestConnectionToken(url: string) {
    return fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${project.clientSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientId: project.clientId,
        feed: channelName,
        connectionData: customData,
      }),
    }).then((res) => res.json());
  }

  const { trigger, isMutating } = useSWRMutation<unknown>(
    "http://localhost:3100/api/generateConnection",
    requestConnectionToken,
    {
      onError() {
        toast.error(
          "There was an issue getting a connection. Please, try again later.",
        );
      },
      onSuccess(data) {
        const token = (data as { token: string }).token;
        setWebsocketUrl(
          `ws://localhost:3100/api/connect?token=${token}&feed=${channelName}`,
        );
      },
    },
  );

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="channel">Channel Name</Label>
        <Input
          id="channel"
          placeholder="Channel"
          onChange={(e) => {
            const val = e.target.value;
            if (!ChannelNameValidator.safeParse(val).success) {
              e.target.setCustomValidity("Invalid channel name");
              setChannelName(null);
            } else {
              setChannelName(val);
            }
          }}
        />
        <Label htmlFor="cdata">Connection Data</Label>
        <Input
          id="cdata"
          placeholder="Identify your connection"
          onChange={(e) => setCustomData(e.target.value)}
        />
        <p>State: {connectionStatus}</p>
        <Button
          type="submit"
          disabled={!channelName || isMutating}
          onClick={() => {
            void trigger();
          }}
        >
          Connect
        </Button>
      </div>

      {lastMessage?.data}

      {readyState === ReadyState.OPEN && (
        <div className="my-8">
          <p>Send message through websocket</p>
          <Label htmlFor="message">Message</Label>
          <Input
            id="message"
            placeholder="Message to publish"
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            type="submit"
            disabled={message.trim().length === 0}
            onClick={() => {
              sendMessage(message);
            }}
          >
            Send
          </Button>
        </div>
      )}

      <PublishHTTP secret={project.clientSecret ?? "An issue occured"} />
    </>
  );
}

function PublishHTTP({ secret }: { secret: string }) {
  const [channelName, setChannelName] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [submitTime, setSubmitTime] = useState<Date>(new Date());

  async function publish(url: string) {
    const req = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: channelName,
        message: message,
      }),
    });

    if (req.status > 204) {
      if (req.status === 429) {
        throw new Error(
          "You've reach the API Rate Limit, or your own limit. Check it on the Dashboard.",
        );
      }
      throw new Error("Failed to publish message");
    }

    return req;
  }

  const { trigger, isMutating } = useSWRMutation<unknown>(
    "http://localhost:3100/api/broadcast",
    publish,
    {
      onError(err) {
        toast.error(
          "There was an issue publishing the message. Please, try again later. " +
            err,
        );
      },
      onSuccess() {
        toast.success(
          `Message published successfully in ${(new Date().getTime() - submitTime.getTime()) / 1000}ms`,
        );
      },
    },
  );

  return (
    <div>
      <p>Publish through http</p>
      <Label htmlFor="pchannel">Channel Name</Label>
      <Input
        id="pchannel"
        placeholder="Channel"
        onChange={(e) => {
          const val = e.target.value;
          if (!ChannelNameValidator.safeParse(val).success) {
            e.target.setCustomValidity("Invalid channel name");
            setChannelName(null);
          } else {
            setChannelName(val);
          }
        }}
      />
      <Label htmlFor="pmessage">Message</Label>
      <Input
        id="pmessage"
        placeholder="Message to publish"
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        type="submit"
        disabled={!channelName || isMutating}
        onClick={() => {
          setSubmitTime(new Date());
          void trigger();
        }}
      >
        Publish
      </Button>
    </div>
  );
}
