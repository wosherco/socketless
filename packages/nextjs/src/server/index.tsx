import "server-only";

import type { WebsocketMessage } from '@socketless/shared';
import { generateSocketlessReact } from '@socketless/react';
import type { GeneratedNextComponents } from '../types/types';

export function generateSocketlessNext<TMessage extends WebsocketMessage = string, TResponse extends WebsocketMessage = string>(): GeneratedNextComponents<TMessage, TResponse> {
  const reactComponents = generateSocketlessReact<TMessage, TResponse>();

  return {
    useSocketlessWebsocket: () => { throw Error("You cannot use this hook in the server") },
    useSocketless: () => { throw Error("You cannot use this hook in the server") }
  }
}
