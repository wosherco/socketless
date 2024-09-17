import { createContext, useContext, useEffect, useRef, useState } from "react";
import { SocketlessWebsocket } from "socketless.ws/client";

import type { WebsocketMessage } from "@socketless/shared";

interface HookReturnType<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage> {
  lastMessage: TResponse | null;
  client: SocketlessWebsocket<TMessage, TResponse> | null;
}

type ContextType<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage> = ReturnType<
    typeof createContext<HookReturnType<TMessage, TResponse> | null>
  >

function SocketlessProvider<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>(
  context: ContextType<TMessage, TResponse>,
  { url, children }: { url: string; children: React.ReactNode },
) {
  const hookReturn = useSocketlessWebsocket<TMessage, TResponse>(url);

  return <context.Provider value={hookReturn}>{children}</context.Provider>;
}

function useSocketless<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>(
  context: ContextType<TMessage, TResponse>,
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
>(url: string): HookReturnType<TMessage, TResponse> {
  const [lastMessage, setLastMessage] = useState<TResponse | null>(null);
  const client = useRef<SocketlessWebsocket<TMessage, TResponse> | null>(null);

  useEffect(() => {
    client.current = new SocketlessWebsocket<TMessage, TResponse>(
      url,
      setLastMessage,
    );

    return () => {
      client.current?.close();
    };
  }, []);

  useEffect(() => {
    client.current?.updateUrl(url);
  }, [url, client]);

  return { client: client.current, lastMessage };
}

export function generateSocketlessReact<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage = string,
>() {
  const context: ContextType<TMessage, TResponse> = createContext<HookReturnType<
    TMessage,
    TResponse
  > | null>(null);

  const bindedSocketlessProvider = SocketlessProvider.bind<null, [context: ContextType<TMessage, TResponse>], [{
    url: string;
    children: React.ReactNode;
  }], React.JSX.Element>(null, context);
  const bindedUseSocketless = useSocketless.bind<null, [context: ContextType<TMessage, TResponse>], [], HookReturnType<TMessage, TResponse>>(null, context);

  return {
    useSocketlessWebsocket: (
      ...args: Parameters<typeof useSocketlessWebsocket<TMessage, TResponse>>
    ) => useSocketlessWebsocket<TMessage, TResponse>(...args),
    SocketlessProvider: bindedSocketlessProvider,
    useSocketless: bindedUseSocketless,
  };
}
