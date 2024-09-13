import { nanoid } from "nanoid";

function getNodeName() {
  return `node:connect:${nanoid(20)}`;
}

export const NODE_NAME = getNodeName();
