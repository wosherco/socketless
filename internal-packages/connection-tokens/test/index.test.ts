import { expect, test } from "bun:test";

import { createToken } from "../src";

const sampleTokenContents = {
  clientId: "testClientId",
  feeds: [""],
  identifier: "identifier",
  projectId: 69,
};

test("tokenCreation", () => {
  expect(createToken(sampleTokenContents)).pass();
});

// test("tokenVerification", async () => {
//   const sampleToken = await createToken(sampleTokenContents);
//   expect(await verifyToken(sampleToken)).toContainKeys(sampleTokenContents);
// });
