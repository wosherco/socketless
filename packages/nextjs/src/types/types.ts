import type React from "react";
import type { SocketlessServer } from "socketless.ws/server";

import type { generateSocketlessReact } from "@socketless/react";
import type { WebsocketMessage } from "@socketless/shared";

export interface NextSocketlessProviderProps<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> {
  socketless: SocketlessServer<TMessage, TResponse>;
  identifier: string;
  feeds?: string[];
  overrideFeeds?: boolean;
  children?: React.ReactNode;
}

export type GeneratedNextComponents<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> = ReturnType<typeof generateSocketlessReact<TMessage, TResponse>> & {
  NextSocketlessProvider: (
    props: NextSocketlessProviderProps<TMessage, TResponse>,
  ) => Promise<JSX.Element>;
};
