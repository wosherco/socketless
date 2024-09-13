# Contributing to Socketless

First of all, thank you for your interest on contributing to Socketless. Don't worry, I'll keep this explanation simple and straight-forward.

## Code of conduct

Everyone that participates inside this project is under the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Any violation of this code will result in consequences. Report any violation to [pol@socketless.ws](mailto:pol@socketless.ws) directly.

## Licensing

Socketless is distributed under a dual licensing model ([LICENSE.md](LICENSE.md)). The licenses applicable to different parts of the project are as follows:

- **Apache License, Version 2.0**: Most files are under this license. You won't need to worry about anything when contributing to parts of the repo under this license.

- **Server Side Public License (SSPL)**: Files and folders under the directories `/apps/connect` and `/apps/master` are licensed under the Server Side Public License (SSPL). You must agree to the Contributor License Agreement (CLA) before contributing to these parts.

## Project Structure

The project is a Turbo monorepo. It's divided into four parts:

- **Tooling**: Contains the tools used to build and test the project. It's under [tooling/](tooling/).

- **Internal Packages**: Contains the packages that are used internally by the project. It's under [internal-packages/](internal-packages/).

- **Apps**: Contains the apps that are part of the project. It's under [apps/](apps/).

- **Packages**: Contains public packages that are available in the npm registry. It's under [packages/](packages/).

## Project Setup

For little changes you won't need this, but if you're planning to make a big change, you'll need to set up the project locally. Here's how you can do it:

### Requirements

- Node.js (version specified on [.nvmrc](.nvmrc))

- PNPM (version specified on [package.json](package.json) under `packageManager`)

- Docker Engine 1.23 or higher

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/wosherco/socketless.git
   ```

2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Start necessary services for development, such as postgres and dragonfly (redis):

   ```bash
   docker compose -f docker-comopse.db.yaml up
   ```

4. Start the project:

   ```bash
   pnpm dev
   ```

#### Development Ports

- Dashboard (localhost:3000)
- Landing (localhost:3001)
- Docs (localhost:3002)
- Connect (localhost:3100)
- Master (localhost:3101)

### Testing

To run the tests, you can use the following command:

```bash
pnpm test
```

> **Note**: Test coverage is low to non-existent. Don't worry about it for now.

### Typecheck

To run the typecheck, you can use the following command:

```bash
pnpm typecheck
```

### Linting

To run the linting, you can use the following command:

```bash
pnpm lint
```

> **Note**: Linting is required for all contributions.

### Formatting

To run the formatting, you can use the following command:

```bash
pnpm format
```

> **Note**: Formatting is required for all contributions.

### Building

Build with the following command:

```bash
pnpm build

# or for documentation
pnpm -F docs build:cf
```

### Building with Docker

Build with the following command:

```bash
docker compose build
```

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue or discussions. If it's a small change, you can open a pull request directly.

Automatic checks will be performed on your pull request. If any of the checks fail, you'll need to fix them before your pull request can be merged. The checks are:

- **Typecheck**: Ensures that the code is type-safe.

- **Linting**: Ensures that the code follows the project's style guide.

- **Formatting**: Ensures that the code is formatted correctly.

- **Tests**: Ensures that the code is working as expected.
