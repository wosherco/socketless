"use client";

import { generateSocketlessReact } from "@socketless/react";
import type { WebsocketMessage } from "@socketless/shared";

export function generateSocketlessReactClientProxy<TMessage extends WebsocketMessage, TResponse extends WebsocketMessage>() {
  return generateSocketlessReact<TMessage, TResponse>();
}