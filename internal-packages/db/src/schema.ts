import {
  bigserial,
  boolean,
  index,
  integer,
  json,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const oauthAccountTable = pgTable(
  "oauth_account",
  {
    providerId: text("provider_id", { enum: ["github"] }).notNull(),
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.providerId, t.providerUserId] }),
  }),
);

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

export const projectTokenTable = pgTable("project_token", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projectTable.id),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectWebhookTable = pgTable(
  "project_webhook",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectTable.id),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("text").notNull(),
    sendOnConnect: boolean("send_on_connect").notNull().default(false),
    sendOnMessage: boolean("send_on_message").notNull().default(true),
    sendOnDisconnect: boolean("send_on_disconnect").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    project_webhook__project_id_idx: index(
      "project_webhook__project_id_idx",
    ).on(t.projectId),
  }),
);

export const roomTable = pgTable(
  "room",
  {
    name: text("name").notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.name, t.projectId] }),
    room__projectId_idx: index("room__projectId_idx").on(t.projectId),
  }),
);

export const connectionRoomsTable = pgTable(
  "connection_rooms",
  {
    room: text("room").notNull(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projectTable.id),
    identifier: text("identifier").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.room, t.projectId, t.identifier] }),
    connection_rooms__identifier_project_id_idx: index(
      "connection_rooms__identifier_project_id_idx",
    ).on(t.identifier, t.projectId),
  }),
);

type LogDataType = unknown;

export const logsTable = pgTable(
  "logs",
  {
    id: bigserial("id", { mode: "number" }),
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
  },
  (t) => ({
    pk: primaryKey({ columns: [t.id, t.timestamp] }),
  }),
);
