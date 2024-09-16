import { useEffect, useRef, useState } from "react";
import { SocketlessWebsocket } from "socketless.ws/client";

import type { WebsocketMessage } from "@socketless/shared";

type OnMessageFunc = ConstructorParameters<typeof SocketlessWebsocket>[1];

export function useSocketlessWebsocket<
  TMessage extends WebsocketMessage = string,
  TResponse extends WebsocketMessage = string,
>({ url, onMessage }: { url: string; onMessage: OnMessageFunc }) {
  const isMounted = useRef(false);
  const lastMessage = useState<TResponse | null>(null);

  const [client, setClient] = useState<
    SocketlessWebsocket<TMessage, TResponse>
  >(new SocketlessWebsocket<TMessage, TResponse>(url, onMessage));

  useEffect(() => {
    if (isMounted.current) {
      const client = new SocketlessWebsocket<TMessage, TResponse>(
        url,
        onMessage,
      );

      setClient(client);
    } else {
      isMounted.current = true;
    }

    return () => {
      client.close();
    };
  }, [url, onMessage]);

  return { client, lastMessage };
}
