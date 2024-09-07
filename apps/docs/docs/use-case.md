# Use Cases

Socketless is designed to simplify the process of publishing updates to clients in real-time. Some of its key use cases include:

## Finance

In finance, real-time data is crucial, whether it's for stock updates, auctions, or market data. With Socketless, you can implement global updates with low latency, ensuring that your users always have access to the latest information without delay.

## Data Broadcast

Socketless excels at broadcasting data updates to many clients simultaneously. Whether you need to send updates to a wide audience or a specific group, Socketless ensures efficient distribution of real-time data without complex infrastructure. This makes it perfect for applications like sports scores, news updates, or any scenario where pushing data to multiple users is essential.

## Live Dashboards

For applications requiring live dashboards that display real-time data, Socketless is a perfect fit. It enables quick and seamless updates from the server to the client, ensuring that dashboards always reflect the most up-to-date information. This use case is common in analytics, monitoring systems, and business intelligence platforms.

## Synchronizing Data with Clients

Keeping data in sync between the server and multiple clients is a common challenge in real-time applications. With Socketless, you can easily synchronize data across clients without worrying about the complexities of managing WebSocket connections or server infrastructure. It is ideal for collaborative tools, multiplayer games, or any application where users need to share and update data in real time.

## WebSocket-Intensive Applications

Socketless is not intended as a full replacement for WebSockets but rather occupies a middle ground. Since it leverages edge hosting services (like Cloudflare Workers or Vercel) that charge per request, each message sent by clients to the server translates into a request. This can become expensive in high-traffic applications. For WebSocket-heavy use cases, where constant two-way communication is required, we recommend using your own server infrastructure to avoid excessive costs.
