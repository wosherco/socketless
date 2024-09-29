import 'dart:convert';

import 'package:socketless_dart/socketless.dart';

void main() {
  // Initialize the client
  final client = SocketlessClient(
    url: 'your socketless url',
    onMessage: (message) => print(message),
    onStateChange: (newState) => print("New Websocket State: $newState"),
  );

  // Sending a message
  client.send("Hello!");

  client.send(jsonEncode({
    "message": "json also works :D",
  }));

  // Update the url
  client.updateUrl("new socketless url");

  // Disconnect the client
  client.disconnect();

  // Close the client (will terminate and clean up the client, you won't be able to use it again)
  client.close();
}
