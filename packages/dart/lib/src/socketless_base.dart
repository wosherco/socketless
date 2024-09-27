import 'package:web_socket_channel/web_socket_channel.dart';

enum SocketlessClientState {
  CONNECTING,
  CONNECTED,
  DISCONNECTED,
  CLOSED,
}

typedef StateChangeCallback = void Function(SocketlessClientState newState);
typedef MessageCallback = void Function(String message);

/// Client class for Socketless
class SocketlessClient {
  String _url;
  bool _manualDisconnect = false;
  final List<String> _queue = [];
  final StateChangeCallback? onStateChange;
  final MessageCallback? onMessage;

  SocketlessClientState _state = SocketlessClientState.DISCONNECTED;

  late WebSocketChannel _channel;

  SocketlessClient({
    required String url,
    this.onStateChange,
    this.onMessage,
  }) : _url = url;

  void connect() async {
    if (this._state != SocketlessClientState.DISCONNECTED) {
      throw Exception('Client is already connected');
    }

    _manualDisconnect = false;
    this._changeState(SocketlessClientState.CONNECTING);

    final uri = Uri.parse(_url);
    _channel = WebSocketChannel.connect(uri);

    try {
      await _channel.ready;
    } catch (e) {
      _changeState(SocketlessClientState.DISCONNECTED);
      rethrow;
    }

    _changeState(SocketlessClientState.CONNECTED);

    _channel.stream.listen(
      _onMessage,
      onDone: _onDone,
      onError: _onError,
    );

    for (var message in _queue) {
      send(message);
    }

    _queue.clear();
  }

  void _changeState(SocketlessClientState newState) {
    _state = newState;
    onStateChange?.call(newState);
  }

  void _onMessage(dynamic message) {
    if (message is String) {
      onMessage?.call(message);
    }
  }

  void _onError(error) {
    print('WebSocket error: $error');

    if (this._state == SocketlessClientState.CLOSED) {
      return;
    }

    this._changeState(SocketlessClientState.DISCONNECTED);

    // Reconnect
    Future.delayed(Duration(milliseconds: 500), () {
      if (this._state == SocketlessClientState.DISCONNECTED &&
          !_manualDisconnect) {
        connect();
      }
    });
  }

  void _onDone() {
    print('WebSocket connection closed');

    if (this._state == SocketlessClientState.CLOSED) {
      return;
    }

    this._changeState(SocketlessClientState.DISCONNECTED);

    // Reconnect
    Future.delayed(Duration(milliseconds: 500), () {
      if (this._state == SocketlessClientState.DISCONNECTED &&
          !_manualDisconnect) {
        connect();
      }
    });
  }

  /// Send a message to the server
  void send(
    String message, {
    /// If true, the message will be queued if the client is not connected. If false, an exception will be thrown if the client is not connected.
    bool appendToQueue = true,
  }) {
    if (this._state != SocketlessClientState.CONNECTED) {
      if (appendToQueue) {
        _queue.add(message);
        return;
      }

      throw Exception('Client is not connected');
    }

    _channel.sink.add(message);
  }

  void updateUrl(String url) {
    if (this._state == SocketlessClientState.CLOSED) {
      throw Exception('Client is closed');
    }

    _url = url;
  }

  void disconnect() {
    if (this._state == SocketlessClientState.DISCONNECTED) {
      return;
    }

    if (this._state == SocketlessClientState.CONNECTED ||
        this._state == SocketlessClientState.CONNECTING) {
      _channel.sink.close();
    }

    _manualDisconnect = true;
    _changeState(SocketlessClientState.DISCONNECTED);
  }

  void close() {
    if (this._state == SocketlessClientState.CLOSED) {
      return;
    }

    if (this._state == SocketlessClientState.CONNECTED ||
        this._state == SocketlessClientState.CONNECTING) {
      _channel.sink.close();
    }

    _changeState(SocketlessClientState.CLOSED);
  }

  SocketlessClientState get state => _state;
  WebSocketChannel get raw => _channel;
}
