# Self Hosting

:::info

You will have to maintain the infrastructure, scaling, and latency if you self-host Socketless. If you want a hassle-free experience, you can use our cloud at [app.socketless.ws](https://app.socketless.ws).

:::

We base self-hosting on Docker and Docker Compose. We hope to provide easier options in the future, but for now you will need to build the Docker images yourself.

## Prerequisites

- [Docker Engine 1.23+](https://docs.docker.com/engine/install/)

- Docker Compose

- Cloning the repository

  ```bash
  git clone https://github.com/wosherco/socketless.git
  ```

## Building images

To build the Docker images we use Docker compose:

```bash
docker compose build
```

You will get the following images:

- `socketless/nextjs`: The dashboard (includes api routes) for Socketless. This is your main service to configure and manage Socketless.
- `socketless/connect`: The connection service for Socketless. This is the service that handles the connections.
- `socketless/master`: The master service for Socketless. This is the service that manages the connections `socketless/connect` containers.

- `socketless/landing`: The landing page for Socketless. Not needed for Self-Hosting.
- `socketless/docs`: This documentation. Not needed for Self-Hosting.

## Deploying

You will need to configure the `.env` file. You can use the `.env.example` file as a reference.

You will also need a PostgreSQL Database and a Dragonfly (or any redis-like database) instance. You can deploy them using the `docker-compose.db.yml` file.

```bash
docker compose -f docker-compose.db.yml up -d
```
