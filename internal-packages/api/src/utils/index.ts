import { nanoid } from "nanoid";

export function generateClientSecret() {
  return nanoid(40);
}

export function generateConnectionToken() {
  return nanoid(40);
}

export function generateWebhookSecret() {
  return nanoid(40);
}
