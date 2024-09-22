"use client";

import type { WebsocketMessage } from '@socketless/shared';
import { generateSocketlessReact } from '@socketless/react';
import type { GeneratedNextComponents } from './types/types';

export function generateSocketlessNext<TMessage extends WebsocketMessage = string, TResponse extends WebsocketMessage = string>(): GeneratedNextComponents<TMessage, TResponse> {
  const reactComponents = generateSocketlessReact<TMessage, TResponse>();

  return {
    useSocketlessWebsocket: reactComponents.useSocketlessWebsocket,
    useSocketless: reactComponents.useSocketless
  }
}