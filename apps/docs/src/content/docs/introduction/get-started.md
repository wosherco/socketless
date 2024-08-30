---
title: Get started
description: Get started with Socketless and build serverless real-time applications.
sidebar:
  order: 0
---

# Welcome to Socketless

Are you ready to create WebSockets in a serverless environment? It's easier than it sounds, thanks to Socketless.

## What's Socketless?

Socketless is a simple service that offers the ability to create real-time connections (in this case, WebSockets) that work in different ways to adapt to your needs.

Let's say, for example, you want to build an invitation system. Most likely, you will want to notify clients of invitations sent by another user instantly. Traditionally, you'd need to have a server that sends a message to a specific client when an invitation is received. Let's make it clear from the start: that won't scale.

The idea behind a serverless infrastructure is that it will scale independently of how many users you have. With Socketless, sending invitations is easier than ever. You just need to connect the application to a Socketless channel and make a request to Socketless when an invitation is created to push the invitation notification through that channel. As easy as it sounds.

Impressed yet? Let's continue!

## Why Socketless

There are tons of services out there that offer real-time connections, but we found that most of them overcomplicate things or are just too expensive. That's why we created Socketless:

- Simple to use: Based on technology that's everywhere. Use HTTP requests or WebSockets however you like; no need to use a bloated SDK in the middle.
- Fast by design: Sending messages is really fast. We've designed our systems to process critical requests, like publishing a message, within a matter of milliseconds.
- Lives on the edge: Our service lives on the edge, which means that latency won't be a problem. [Check it out for yourself (coming soon)]().
- Secure: You have full control to allow connections to specific channels, and you decide who receives messages. You can also decide which logs remain on our servers for you.
- Fair pricing: Prices and limits are fair. We set our prices based on client data and the value that it brings to companies and start-ups. Limit your usage to prevent surprises and get notified.

## Ready to start?

Now you should be convinced to start using Socketless. First, let's learn a few basic concepts to get started!
