# Message Validation with Zod

You can validate messages sent by clients with Zod schemas by just passing a schema when creating the Socketless server.

## Creating schema

Grabbing the example from the [Type Safety guide](type-safety), let's create a schema for the `SocketlessMessage` type:

```ts
import { z } from "zod";

const SocketlessMessageSchema = z.object({
  message: z.string().min(1).max(500),
});

type SocketlessMessage = z.infer<typeof SocketlessMessageSchema>;
```

## Using the schema

Now you can pass the schema to the `createSocketless` function:

```ts
import { createSocketless } from "socketless.ws/server";

const socketless = createSocketless<SocketlessMessage, SocketlessResponse>({
  // Your configuration here
  messageValidator: SocketlessMessageSchema,
});
```

Now when a message is received, it will be validated against the schema. If the message doesn't match the schema, the message will be discarted.

## Socketless-Side Validation

We hope in a future to validate messages on our own servers before reaching yours. This will help you to avoid unnecessary requests on your server.
