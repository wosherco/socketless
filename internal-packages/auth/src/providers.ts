import { GitHub } from "arctic";

import { env } from "../env";

export const github = new GitHub(
  env.OAUTH_GITHUB_CLIENT_ID,
  env.OAUTH_GITHUB_CLIENT_SECRET,
);
