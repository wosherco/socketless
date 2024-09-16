import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SocketlessWebsocket } from "socketless.ws/client";

import type { WebsocketMessage } from "@socketless/shared";

function SocketlessProvider<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>(
  context: ReturnType<
    typeof createContext<SocketlessWebsocket<TMessage, TResponse> | null>
  >,
  { url, children }: { url: string; children: React.ReactNode },
) {
  const { client } = useSocketlessWebsocket<TMessage, TResponse>(url);

  return <context.Provider value={client}>{children}</context.Provider>;
}

function useSocketless<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>(
  context: ReturnType<
    typeof createContext<SocketlessWebsocket<TMessage, TResponse> | null>
  >,
) {
  const ctx = useContext(context);

  if (!ctx) {
    throw new Error("useSocketless must be used within a SocketlessProvider");
  }

  return ctx;
}

export function useSocketlessWebsocket<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>(url: string) {
  const [lastMessage, setLastMessage] = useState<TResponse | null>(null);
  const client = useRef<SocketlessWebsocket<TMessage, TResponse> | null>(null);

  useEffect(() => {
    client.current = new SocketlessWebsocket<TMessage, TResponse>(url, setLastMessage);

    return () => {
      client.current?.close();
    };
  }, []);

  useEffect(() => {
    client.current?.updateUrl(url)
  }, [url, client]);

  return { client: client.current, lastMessage };
}

export function generateSocketlessReact<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage = string,
>() {
  const context = createContext<SocketlessWebsocket<
    TMessage,
    TResponse
  > | null>(null);

  const bindedSocketlessProvider = SocketlessProvider.bind(null, context);
  const bindedUseSocketless = useSocketless.bind(null, context);

  return {
    useSocketlessWebsocket: (
      ...args: Parameters<typeof useSocketlessWebsocket<TMessage, TResponse>>
    ) => useSocketlessWebsocket<TMessage, TResponse>(...args),
    SocketlessProvider: bindedSocketlessProvider,
    useSocketless: bindedUseSocketless,
  };
}
