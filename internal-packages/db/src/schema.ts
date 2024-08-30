import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

import type { ProjectConfigType } from "@socketless/validators";
import { EWebhookActions } from "@socketless/validators";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  githubId: integer("github_id").notNull().unique(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionTable = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectTable = pgTable(
  "project",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    clientId: text("client_id").notNull().unique(),
    clientSecret: text("client_secret").notNull().unique(),
    stripeCustomerId: text("stripe_customer_id").notNull().unique(),
    stripePlan: text("stripe_plan", { enum: ["FREE", "PAID", "CUSTOM"] })
      .notNull()
      .default("FREE"),
    stripeSubscriptionId: text("stripe_subscription_id").unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => userTable.id),
    config: json("config")
      .$type<ProjectConfigType>()
      .$defaultFn(
        () =>
          ({
            webhookUrl: null,
            webhookSecret: nanoid(40),
            webhookEvents: [
              EWebhookActions.CONNECTION_CLOSE,
              EWebhookActions.CONNECTION_CLOSE,
              EWebhookActions.MESSAGE,
            ],
            messagePrivacyLevel: "ALWAYS",
          }) satisfies ProjectConfigType,
      )
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deleted: boolean("deleted").notNull().default(false),
  },
  (t) => ({
    project__ownedId_idx: index("project__ownedId_idx").on(t.ownerId),
    project__ownedId_deleted_idx: index("project__ownedId_deleted_idx").on(
      t.ownerId,
      t.deleted,
    ),
    project__ownedId_id_idx: index("project__ownedId_id_deleted_idx").on(
      t.ownerId,
      t.id,
      t.deleted,
    ),
  }),
);

export const feedTable = pgTable(
  "feed",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    feed__projectId_name_idx: unique("feed__projectId_name_idx").on(
      t.name,
      t.projectId,
    ),
    feed__projectId_idx: index("feed__projectId_idx").on(t.projectId),
  }),
);

export const connectionTable = pgTable(
  "connection",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // feedId: bigint("feed_id", { mode: "number" })
    //   .notNull()
    //   .references(() => feedTable.id),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectTable.id),
    token: text("token").notNull(),
    identifier: text("identifier").notNull(),
    data: text("data"),
    // data: json<ConnectionDataType>("data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    connection__identifier_projectId_idx: unique(
      "connection__identifier_projectId_idx",
    ).on(t.identifier, t.projectId),
    connection__token_idx: unique("connection__token_idx").on(t.token),
  }),
);

export const clientTable = pgTable(
  "client",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    connectionId: bigint("connection_id", { mode: "number" })
      .notNull()
      .references(() => connectionTable.id),
    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    feed: text("feed").notNull(),
    disconnected: boolean("disconnected").notNull().default(false),
  },
  (t) => ({
    client__feed_disconnected_idx: index("client__feed_disconnected_idx").on(
      t.feed,
      t.disconnected,
    ),
  }),
);

type LogDataType = unknown;

export const logsTable = pgTable("logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectTable.id),
  action: text("action", {
    enum: ["INCOMING", "OUTGOING", "CONNECTION", "DISCONNECT"],
  }).notNull(),
  data: json("data").$type<LogDataType>(),
  timestamp: timestamp("timestamp", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
