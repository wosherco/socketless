import type { generateSocketlessReact } from "@socketless/react";
import type { WebsocketMessage } from "@socketless/shared";

export type GeneratedNextComponents<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
> = Omit<
  ReturnType<typeof generateSocketlessReact<TMessage, TResponse>>,
  "SocketlessProvider"
>;
