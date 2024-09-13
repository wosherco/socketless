import { nanoid } from "nanoid";

import { DefaultLimits } from "@socketless/db/schema";

export function generateClientSecret() {
  return nanoid(40);
}

export function generateWebhookSecret() {
  return nanoid(40);
}

interface PlanLimits {
  concurrentConnectionsLimit: number;
  incomingMessagesLimit: number;
  outgoingMessagesLimit: number;
}

export const FreePlanLimits: PlanLimits = {
  ...DefaultLimits,
} as const;

export const PaidPlanLimits: PlanLimits = {
  concurrentConnectionsLimit: 10000,
  incomingMessagesLimit: 10000000,
  outgoingMessagesLimit: 10000000,
} as const;
