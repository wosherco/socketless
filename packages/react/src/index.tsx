import { createContext, useContext } from "react";
import { useEffect, useRef, useState } from "react";
import { SocketlessWebsocket } from "socketless.ws/client";

import type { WebsocketMessage } from "@socketless/shared";

function SocketlessProvider<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>(context: ReturnType<typeof createContext<SocketlessWebsocket<TMessage, TResponse> | null>>, { url, children }: { url: string; children: React.ReactNode }) {
  const { client } = useSocketlessWebsocket<TMessage, TResponse>({ url });

  return (
    <context.Provider value={client}>
      {children}
    </context.Provider>
  );
}

function useSocketless<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>(context: ReturnType<typeof createContext<SocketlessWebsocket<TMessage, TResponse> | null>>) {
  const ctx = useContext(context);

  if (!ctx) {
    throw new Error("useSocketless must be used within a SocketlessProvider");
  }

  return ctx;
}

export function useSocketlessWebsocket<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>({ url }: { url: string }) {
  const isMounted = useRef(false);
  const [lastMessage, setLastMessage] = useState<TResponse | null>(null);

  const [client, setClient] = useState<
    SocketlessWebsocket<TMessage, TResponse>
  >(new SocketlessWebsocket<TMessage, TResponse>(url, setLastMessage));

  useEffect(() => {
    if (isMounted.current) {
      const client = new SocketlessWebsocket<TMessage, TResponse>(
        url,
        setLastMessage,
      );

      setClient(client);
    } else {
      isMounted.current = true;
    }

    return () => {
      client.close();
    };
  }, [url, setLastMessage]);

  return { client, lastMessage };
}

export function generateSocketlessReact<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage = string,
>() {
  const context = createContext<SocketlessWebsocket<TMessage, TResponse> | null>(null);

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
