<div align="center">

# Socketless

Websockets **made simple**.

[Homepage](https://socketless.ws) | [Dashboard](https://app.socketless.ws) | [Docs](https://docs.socketless.ws)

</div>

## Why Socketless?

- **Simple**: Socketless is designed to be easy to use and understand.

- **Fast**: Socketless is built using [Bun](https://bun.sh) [(benchmarks)](https://bun.sh/docs/api/websockets) and Dragonfly [(benchmarks)](https://github.com/dragonflydb/dragonfly?tab=readme-ov-file#benchmarks).

- **Scalable**: Socketless is built to scale horizontally with ease. [Check out the infrastructure](https://docs.socketless.ws/docs/infrastructure)

- **Global**: Socketless is built to be used globally. [Check out our cloud locations](https://docs.socketless.ws/docs/locations)

## Setup

To setup socketless in your project, you can check out our [Get Started](https://docs.socketless.ws/docs/introduction) guide.

### Cloud

To use Socketless in the cloud, you can sign up today at [app.socketless.ws](https://app.socketless.ws).

### Self-Hosted

To self-host Socketless, you can follow the [Self-Hosted](https://docs.socketless.ws/docs/self-hosted) guide.

In a nutshell, you can clone the Repository and build the Docker Images:

```bash
git clone https://github.com/wosherco/socketless.git
docker compose build
```

- You will need to configure the `.env` file. (Reference on `.env.example`)
- You will need a PostgreSQL Database, and a Dragonfly (or any redis-like database) instance. Deploy them using the `docker-compose.db.yml` file.

## Packages

Here are the available packages in Socketless:

- [socketless.ws](https://npmjs.com/package/socketless.ws): The main package for Socketless.

- [@socketless/shared](https://npmjs.com/package/@socketless/shared): Shared types and interfaces for Socketless.

## Development

To develop Socketless, you will need to have Node 20.16 or higher and PNPM 9.10 or higher installed.

```bash
pnpm install
pnpm dev
```

You have more information on Development and Contribution in [CONTRIBUTING.md](CONTRIBUTING.md).

### Development Ports

- Dashboard (localhost:3000)
- Landing (localhost:3001)
- Docs (localhost:3002)
- Connect (localhost:3100)
- Master (localhost:3101)

## Feature Requests

If you want to request a feature, check out our [insigh.to board](https://insigh.to/b/socketless). If the feature request has already been created, just upvote it.

Feature Requests that are accepted will be moved into a GitHub Issue.
