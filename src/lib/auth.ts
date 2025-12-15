import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

import { magicLink } from "better-auth/plugins";
import { Resend } from "resend";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean) as string[],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      scope: ["user"],
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const html = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Access Your Account</title>
    </head>
    <body style="margin:0;padding:0;background:#0b0f19;color:#e5e7eb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b0f19,#0e1424,#111827);">
        <tr>
          <td align="center" style="padding:40px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
              <tr>
                <td style="text-align:center;padding-bottom:6px;">
                  <div style="font-size:20px;font-weight:700;color:#f3f4f6;letter-spacing:0.3px;">SleepComet</div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding-bottom:22px;">
                  <div style="font-size:12px;color:#9ca3af;">Secure magic link sign‑in</div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding:0 12px;">
                  <div style="font-size:18px;font-weight:600;color:#e5e7eb;">Your Magic Link is Ready</div>
                  <p style="margin:12px 0 22px 0;font-size:12px;line-height:1.7;color:#cbd5e1;">Click the button below to sign in. If the button doesn’t work, copy and paste the link into your browser.</p>
                  <div style="margin:0 0 18px 0;">
                    <a href="${url}" style="display:inline-block;background:#e5e7eb;color:#0b0f19;text-decoration:none;font-weight:600;font-size:14px;padding:12px 22px;border-radius:10px;">Sign in with Magic Link</a>
                  </div>
                  <div style="font-size:10px;color:#94a3b8;word-break:break-all;">${url}</div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding-top:22px;">
                  <div style="height:1px;background:#1f2937;width:100%;"></div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding-top:16px;">
                  <div style="font-size:12px;color:#94a3b8;">If you didn’t request this, you can safely ignore this email.</div>
                </td>
              </tr>
              <tr>
                <td style="text-align:center;padding-top:18px;">
                  <div style="font-size:11px;color:#6b7280;">© ${new Date().getFullYear()} SleepComet</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "SleepComet <onboarding@resend.dev>",
          to: email,
          subject: "Seu acesso à SleepComet",
          html,
        });
      },
    }),
    nextCookies()
  ],
});
