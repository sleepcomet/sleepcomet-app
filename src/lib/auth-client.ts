import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: (process.env.NEXT_PUBLIC_CONSOLE_URL || process.env.BETTER_AUTH_URL || "").replace(/\/$/, ""),
  plugins: [
    magicLinkClient()
  ]
});
