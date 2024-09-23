# Language Agnostic Client

Socketless is built with the goal of being language and framework agnostic. Yes, specific libraries exist to make development easier, but you can also create your own.

## Api Reference

Most of the stuff is based on HTTP Requests. You can check the [API Reference](https://docs.socketless.ws/api) to see how to interact with the server.

## Websockets

Websockets have nothing special in the middle. You can use any websocket library to connect to the server. The only thing you need to know is the heartbeat.

### Heartbeat

The only thing we defer from the standard is the heartbeat. We reserve empty frames (`""`) to be used as heartbeats. The server will send a heartbeat every 15 seconds. If the client misses 3 heartbeats in a row, the server will close the connection.
