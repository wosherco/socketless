"use client";

import type { WebsocketMessage } from "@socketless/shared";
import { generateSocketlessReact } from "@socketless/react";

export function generateSocketlessReactClientProxy<
  TMessage extends WebsocketMessage,
  TResponse extends WebsocketMessage,
>() {
  return generateSocketlessReact<TMessage, TResponse>();
}
