/**
 * Inspired by crypto module on @uploadthing/shared (https://github.com/pingdotgg/uploadthing/blob/5ff7648b7537cac33f60411ae670f2113e97539c/packages/shared/src/crypto.ts)
 */
const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };

// Function to encode a Uint8Array into a hex string
function encodeHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    })
    .join("");
}

// Function to decode a hex string into a Uint8Array
function decodeHex(hex: string): Uint8Array {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
}

export async function signPayload(payload: string, secret: string) {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    algorithm,
    false,
    ["sign"],
  );

  const signature = await crypto.subtle
    .sign(algorithm, signingKey, encoder.encode(payload))
    .then(function (arrayBuffer) {
      return encodeHex(new Uint8Array(arrayBuffer));
    });

  return `${signaturePrefix}${signature}`;
}

export async function verifySignature(
  payload: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  const sig = signature?.slice(signaturePrefix.length);
  if (sig == null) return false;

  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    algorithm,
    false,
    ["verify"],
  );

  const isVerified = await crypto.subtle.verify(
    algorithm,
    signingKey,
    decodeHex(sig),
    encoder.encode(payload),
  );

  return isVerified;
}
