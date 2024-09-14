# Local Development

Socketless in mainly based on Webhooks. If you just need to push data to the client, you won't need any additional setup. But if you need to receive data from the client, you will need to setup a public tunnel to your local machine.

## Using ngrok

[ngrok](https://ngrok.com) is a tool that allows you to expose your local server to the internet. This is useful when you need to receive data from the client.

1. Download [ngrok](https://ngrok.com/) and install it on your local machine.

2. Start ngrok, and point to your local server port. For example, if you are using port 3000:

   ```bash
   ngrok http 3000
   ```

3. You will get a public URL that you can use to connect to your local server. Set that URL in your Socketless configuration.

   ```typescript
   const socketless = createSocketless({
     // ...
     // highlight-next-line
     url: "https://your-ngrok-url.ngrok.io/api/socketless",
   });
   ```
