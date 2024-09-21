FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copying needed files
COPY ./package.json /app/package.json
COPY ./.npmrc /app/.npmrc
COPY ./.nvmrc /app/.nvmrc
COPY ./pnpm-lock.yaml /app/pnpm-lock.yaml
COPY ./pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY ./turbo.json /app/turbo.json

# Copying needed folders
COPY ./apps /app/apps
COPY ./packages /app/packages
COPY ./internal-packages /app/internal-packages
COPY ./tooling /app/tooling
COPY ./turbo /app/turbo

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base as dev-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM dev-deps AS build
ENV CI=1
RUN pnpm run build

FROM dev-deps AS build-docs
ENV CI=1
RUN pnpm -F docs build:cf


##########################
#      apps/landing      #
##########################
FROM build AS landing
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# COPY --from=prod-deps /app/node_modules /app/node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "landing", "start"]

###########################
#      apps/dashboard     #
###########################
FROM build AS dashboard
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# COPY --from=prod-deps /app/node_modules /app/node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "dashboard", "start"]

##########################
#      apps/connect      #
##########################
FROM build AS connect
ENV NODE_ENV=production
# COPY --from=prod-deps /app/node_modules /app/node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "connect", "start"]

#########################
#      apps/master      #
#########################
FROM build AS master
ENV NODE_ENV=production
# COPY --from=prod-deps /app/node_modules /app/node_modules

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "-F", "master", "start"]

#########################
#       apps/docs       #
#########################
# Use the official Nginx image as the base image
FROM nginx:alpine AS docs

# Set the working directory
WORKDIR /app

# Copy the build-docs files from apps/docs/build to Nginx's html directory
COPY --from=build-docs /app/apps/docs/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]