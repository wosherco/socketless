# Type Safety

Socketless is built with TypeScript in mind. This means that you can use it with TypeScript and get all the benefits of type safety. As we say, we make websockets simple, not magic, so you will need to do some work to get type safety.

## Default types

By default socketless assumes that you use strings as messages.

## Defining your types

First of all you will need to define your types. We differenciate between two types:

- **TMessage**: Type of messages sent by clients.
- **TResponse**: Type of messages sent by the server.

Knowing that, let's define our types somewhere in your project:

```ts
type SocketlessMessage = {
  message: string;
};

type SocketlessResponse = {
  user: string;
  message: string;
  action: "connect" | "disconnect" | "message";
};
```

:::info

Internally, your types should meet the following type:

```ts
type WebsocketMessage = string | Record<string, unknown> | unknown[];
```

:::

## Using your types

To use types we use generic types. All publicly accesible methods from Socketless accept two generic types: `TMessage` and `TResponse`.

Let's go to out most basic object, the Socketless Server:

```ts
import { createSocketless } from "socketless.ws/server";

const socketless = createSocketless<SocketlessMessage, SocketlessResponse>({
  // Your configuration here
});
```

With that you now reinforce the types of your messages and responses.

## Using your types on the client

On the client side you can also use your types. Here's an example using the generic client class:

```ts
const websocket = new SocketlessWebsocket<
  SocketlessMessage,
  SocketlessResponse
>({
  url: "ws://localhost:8080",
  onMessage: (message) => {
    console.log(message.message);
  },
});
```

### Using @socketless/react

With the React library you can also use your types. There are two ways to do it:

1. When directly using the `useSocketlessWebsocket` hook you can pass the types as generic types:

   ```tsx
   import { useSocketlessWebsocket } from "@socketless/react";

   function ReactComponent({ url }: { url: string }) {
     const { client, lastMessage } = useSocketlessWebsocket<
       SocketlessMessage,
       SocketlessResponse
     >(url);

     // `lastMessage` is of type SocketlessResponse

     return null;
   }
   ```

2. You can generate React Components that already have the types inferred for more easier usage, as well as a Provider and a Context:

   ```tsx title="src/lib/socketless.ts"
   import { generateSocketlessReact } from "@socketless/react";

   export const { SocketlessProvider, useSocketless, useSocketlessWebsocket } =
     generateSocketlessReact<SocketlessMessage, SocketlessResponse>();
   ```

   ```tsx
   import { SocketlessProvider, useSocketless } from "@/lib/socketless";

   function TopLevelComponent() {
     const url = "websocket url";

     return (
       <SocketlessProvider url={url}>
         <ReactComponent />
       </SocketlessProvider>
     );
   }

   function ReactComponent() {
     const { client, lastMessage } = useSocketless();

     // `lastMessage` is of type SocketlessResponse

     return null;
   }
   ```

## Next Step

If you want to go further, and validate messages, you can use Zod schemas. [Read more about it here](message-validation).
