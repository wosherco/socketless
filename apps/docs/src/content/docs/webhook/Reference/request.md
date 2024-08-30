---
title: Request
description: Learn how to receive messages from websockets to a http server.

sidebar:
  order: 0
---

Once you have the socket endpoint setup, you will start receiving `POST` requests from Socketless when the configured events are runned.

## Authenticate Webhook

Most probably you will want to make sure that is Socketless who is really sending the request. For that, you can grab your Webhook Secret from the Dashboard, and save it.

The Webhook will contain an `Authorization` header containing that same token:

```ts
HEADERS: {
  "Authorization": "Bearer " + webhook_secret
}
```

## Parsing body

The request will come in a JSON Format that will follow the same schema:

```json
{
  "action": "CONNECTION_OPEN" | "MESSAGE" | "CONNECTION_CLOSE",
  "data": {}
}
```

## Event data

Check what data contains on the reference for each event:

- [CONNECTION_OPEN](https://docs.socketless.ws/webhook/reference/connection)
- [MESSAGE](https://docs.socketless.ws/webhook/reference/message)
- [CONNECTION_CLOSE](https://docs.socketless.ws/webhook/reference/disconnect)
