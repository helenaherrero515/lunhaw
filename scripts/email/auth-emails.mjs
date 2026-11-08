#!/usr/bin/env node
/**
 * Lunhaw account emails (sign-up confirmation, password reset, magic link, email change, invite, re-auth).
 *
 * One branded layout, six messages. Writes supabase/templates/*.html (used by the local stack via config.toml).
 * With --apply, also uploads subjects + templates to the hosted Supabase project through the Management API,
 * reading SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN from .env.deploy.local (or the environment).
 *
 * Usage: node scripts/email/auth-emails.mjs [--apply]
 *
 * Email-client rules followed here: table layout, inline styles, no web fonts required, absolute image URLs,
 * a "bulletproof" button, the link also shown as text, and a hidden preheader line for the inbox preview.
 * {{ .ConfirmationURL }} etc. are Supabase (Go template) placeholders and must stay as written.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SITE = "https://lunhaw.pages.dev";
const CONTACT = "lunhaw.hln@gmail.com";

const C = { bg: "#F7F7F0", card: "#FFFFFF", fg: "#26332D", muted: "#55605A", line: "#DDE5DF", green: "#245C43", lime: "#98D746", mint: "#DDF3E6" };
const FONT = "'Kufam', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const DISPLAY = "'MedievalSharp', Georgia, 'Times New Roman', serif";

const layout = ({ preheader, title, intro, button, url, after, note }) => `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Kufam:wght@400;600&family=MedievalSharp&display=swap" rel="stylesheet">
<style>
  body { margin:0; padding:0; background:${C.bg}; }
  a { color:${C.green}; }
  @media (max-width: 520px) {
    .card { border-radius:0 !important; }
    .pad { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:26px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};font-size:1px;line-height:1px;">${preheader}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
<tr><td align="center" style="padding:32px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
    <!-- Wordmark -->
    <tr><td align="center" style="padding:0 0 20px;">
      <a href="${SITE}" style="text-decoration:none;color:${C.green};">
        <img src="${SITE}/email/lunhaw-icon.png" width="36" height="36" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:9px;">
        <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${DISPLAY};font-size:26px;letter-spacing:.06em;color:${C.green};">LUNHAW</span>
      </a>
    </td></tr>
    <!-- Card -->
    <tr><td class="card" style="background:${C.card};border:1px solid ${C.line};border-radius:20px;overflow:hidden;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center" style="background:${C.mint};padding:28px 24px 0;">
          <img src="${SITE}/email/lunti-wave.png" width="132" alt="Lunti, the Lunhaw grasshopper, waving" style="display:block;border:0;width:132px;height:auto;">
        </td></tr>
        <tr><td style="height:6px;background:${C.lime};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td class="pad" style="padding:36px 40px 8px;font-family:${FONT};color:${C.fg};">
          <h1 class="h1" style="margin:0 0 14px;font-family:${DISPLAY};font-weight:400;font-size:30px;line-height:1.2;color:${C.green};">${title}</h1>
          <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${C.fg};">${intro}</p>
          <!-- Button -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
            <tr><td align="center" bgcolor="${C.green}" style="border-radius:999px;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:16px;font-weight:600;line-height:1;color:#FFFFFF;text-decoration:none;border-radius:999px;">${button}</a>
            </td></tr>
          </table>
          ${after ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${C.fg};">${after}</p>` : ""}
          <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${C.muted};">Button not working? Copy this link into your browser:</p>
          <p style="margin:0 0 28px;font-size:13px;line-height:1.5;word-break:break-all;"><a href="${url}" style="color:${C.green};">${url}</a></p>
        </td></tr>
        <tr><td class="pad" style="padding:0 40px 32px;font-family:${FONT};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="border-top:1px solid ${C.line};padding-top:18px;font-size:13px;line-height:1.55;color:${C.muted};">${note}</td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>
    <!-- Footer -->
    <tr><td align="center" style="padding:24px 16px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.muted};">
      Lunhaw helps you find parks, gardens and public libraries across Metro Manila.<br>
      Questions? <a href="mailto:${CONTACT}" style="color:${C.green};">${CONTACT}</a><br>
      <a href="${SITE}/privacy" style="color:${C.muted};">Privacy Notice</a> &nbsp;·&nbsp; <a href="${SITE}/terms" style="color:${C.muted};">Terms of Use</a><br>
      <span style="color:#8A958F;">Operated by HLN · Metro Manila, Philippines</span>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;

const NOT_YOU = "Didn't ask for this? You can safely ignore this email. Nothing changes unless the link is used.";

// key = Supabase template name; [subject, layout fields]
const EMAILS = {
  confirmation: ["Confirm your email for Lunhaw", {
    preheader: "One tap to finish setting up your Lunhaw account.",
    title: "Welcome to Lunhaw!",
    intro: "You're one step away from finding parks, gardens and public libraries near you. Confirm <strong>{{ .Email }}</strong> to finish creating your account.",
    button: "Confirm my email", url: "{{ .ConfirmationURL }}",
    note: `This link expires in 1 hour. If it runs out, just sign up again with the same email. ${NOT_YOU}`,
  }],
  recovery: ["Reset your Lunhaw password", {
    preheader: "Choose a new password for your Lunhaw account.",
    title: "Reset your password",
    intro: "We got a request to reset the password for <strong>{{ .Email }}</strong>. Tap the button to choose a new one.",
    button: "Choose a new password", url: "{{ .ConfirmationURL }}",
    note: `This link expires in 1 hour. ${NOT_YOU}`,
  }],
  magic_link: ["Your Lunhaw sign-in link", {
    preheader: "Tap to sign in to Lunhaw. No password needed.",
    title: "Sign in to Lunhaw",
    intro: "Tap the button to sign in as <strong>{{ .Email }}</strong>. No password needed.",
    button: "Sign me in", url: "{{ .ConfirmationURL }}",
    note: `This link works once and expires in 1 hour. ${NOT_YOU}`,
  }],
  email_change: ["Confirm your new email for Lunhaw", {
    preheader: "Confirm the new email address on your Lunhaw account.",
    title: "Confirm your new email",
    intro: "You asked to change your Lunhaw email from <strong>{{ .Email }}</strong> to <strong>{{ .NewEmail }}</strong>. Confirm to make the switch.",
    button: "Confirm new email", url: "{{ .ConfirmationURL }}",
    note: `If you didn't ask for this change, ignore this email and your address stays the same. Worried? Write to ${CONTACT}.`,
  }],
  invite: ["You're invited to Lunhaw", {
    preheader: "Someone invited you to Lunhaw. Accept to set up your account.",
    title: "You're invited!",
    intro: "You've been invited to join Lunhaw, a guide to parks, gardens and public libraries across Metro Manila. Accept to set up your account.",
    button: "Accept invitation", url: "{{ .ConfirmationURL }}",
    note: NOT_YOU,
  }],
};

// Re-authentication sends a code, not a link, so it gets its own small body.
const reauth = layout({
  preheader: "Your Lunhaw verification code is inside.",
  title: "Your verification code",
  intro: `Enter this code in Lunhaw to confirm it's you:</p>
          <p style="margin:0 0 28px;font-family:Consolas,'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:.3em;color:${C.green};">{{ .Token }}`,
  button: "Open Lunhaw", url: SITE,
  note: `This code expires in 1 hour. ${NOT_YOU}`,
});

const out = { ...Object.fromEntries(Object.entries(EMAILS).map(([k, [subject, f]]) => [k, { subject, html: layout(f) }])),
  reauthentication: { subject: "Your Lunhaw verification code", html: reauth } };

const dir = resolve(root, "supabase/templates");
mkdirSync(dir, { recursive: true });
for (const [k, { html }] of Object.entries(out)) writeFileSync(resolve(dir, `${k}.html`), html);
console.log(`Wrote ${Object.keys(out).length} templates to supabase/templates/`);

if (process.argv.includes("--apply")) {
  const envFile = resolve(root, ".env.deploy.local");
  const env = { ...process.env };
  if (existsSync(envFile)) for (const l of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && m[2] && !env[m[1]]) env[m[1]] = m[2];
  }
  const { SUPABASE_PROJECT_REF: ref, SUPABASE_ACCESS_TOKEN: token } = env;
  if (!ref || !token) { console.error("Need SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN."); process.exit(1); }
  const body = {};
  for (const [k, { subject, html }] of Object.entries(out)) {
    body[`mailer_subjects_${k}`] = subject;
    body[`mailer_templates_${k}_content`] = html;
  }
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`Supabase rejected the update: ${res.status} ${await res.text()}`); process.exit(1); }
  console.log(`Applied ${Object.keys(out).length} email templates to project ${ref}.`);
}
