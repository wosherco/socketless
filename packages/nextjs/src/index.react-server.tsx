import "server-only";

import React from "react";

import type { WebsocketMessage } from "@socketless/shared";

import type {
  GeneratedNextComponents,
  NextSocketlessProviderProps,
} from "./types";
import { generateSocketlessReactClientProxy } from "./client-providers";

async function NextSocketlessProvider<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>({
  socketless,
  identifier,
  feeds,
  overrideFeeds,
  children,
}: NextSocketlessProviderProps<TMessage, TResponse>) {
  const { SocketlessProvider } = generateSocketlessReactClientProxy<
    TMessage,
    TResponse
  >();

  const connection = await socketless.getConnection(
    identifier,
    feeds,
    overrideFeeds,
  );

  return (
    <SocketlessProvider url={connection.url}>{children}</SocketlessProvider>
  );
}

export function generateSocketlessNext<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>(): GeneratedNextComponents<TMessage, TResponse> {
  const reactComponents = generateSocketlessReactClientProxy<
    TMessage,
    TResponse
  >();

  return {
    useSocketlessWebsocket: reactComponents.useSocketlessWebsocket,
    useSocketless: reactComponents.useSocketless,
    SocketlessProvider: reactComponents.SocketlessProvider,
    NextSocketlessProvider: (
      ...args: Parameters<typeof NextSocketlessProvider<TMessage, TResponse>>
    ) => NextSocketlessProvider<TMessage, TResponse>(...args),
  };
}
