import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username, twoFactor } from "better-auth/plugins";
import { db } from "./db";

export const auth = betterAuth({
  appName: "MTC Inventory",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true,
  },
  advanced: {
    cookiePrefix: "mtc_inventory",
    useSecureCookies: process.env.BETTER_AUTH_URL?.startsWith("https://"),
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 30,
    cookieCache: { enabled: false },
  },
  rateLimit: { enabled: true, storage: "database", window: 60, max: 30 },
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "TECHNICIAN", input: false },
      isActive: { type: "boolean", defaultValue: true, input: false },
      mustChangePassword: { type: "boolean", defaultValue: true, input: false },
      emergencyIssue: { type: "boolean", defaultValue: false, input: false },
    },
  },
  plugins: [
    username({ usernameValidator: (value) => /^[a-zA-Z0-9_.-]+$/.test(value) }),
    twoFactor({ issuer: "MTC Inventory" }),
  ],
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          await db.audit.create({
            data: {
              actorId: user.id,
              action: "AUTH_PROFILE_UPDATED",
              entityId: user.id,
              payload: { twoFactorEnabled: user.twoFactorEnabled ?? false },
            },
          });
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
          });
          if (!user?.isActive) return false;
          return { data: session };
        },
      },
    },
  },
});
