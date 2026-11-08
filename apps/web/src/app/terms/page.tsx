import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use · Lunhaw",
  description: "The terms for using Lunhaw, a guide to public spaces in Metro Manila.",
};

export default function TermsPage() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return (
    <LegalPage
      title="Terms of Use"
      intro="These terms apply when you use the Lunhaw website and app. By using Lunhaw or creating an account, you agree to them. Lunhaw is operated by HLN."
    >
      <h2>What Lunhaw is</h2>
      <p>
        Lunhaw is a free guide to parks, gardens and public libraries in Metro Manila, with simple estimates of how to
        get there. Every detail we show carries one of three labels:
      </p>
      <ul>
        <li>
          <strong>Verified</strong>: confirmed from an official source, with the date it was checked;
        </li>
        <li>
          <strong>Estimate</strong>: worked out or compiled by us, with a note explaining how; or
        </li>
        <li>
          <strong>Not available yet</strong>: we don’t have reliable information, so we don’t guess.
        </li>
      </ul>

      <h2>Check before you go</h2>
      <p>
        Opening hours, access rules and facilities can change without notice. Always confirm with the facility before
        you travel. Walking times and distances are rough estimates based on straight-line distance, not turn-by-turn
        directions. Use your own judgment about weather, heat, traffic and personal safety.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information when you sign up, and keep your password private.</li>
        <li>You are responsible for activity on your account. Tell us at once if you think someone else has used it.</li>
        <li>You can delete your account at any time by emailing {mail}.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Please don’t:</p>
      <ul>
        <li>try to break, overload or get around the security or rate limits of the website or API;</li>
        <li>copy the directory in bulk, or use automated tools in a way that disrupts the service;</li>
        <li>use Lunhaw for anything unlawful, or to harass or harm others.</li>
      </ul>
      <p>We may suspend or close accounts that break these terms.</p>

      <h2>Content and ownership</h2>
      <p>
        The Lunhaw name, grasshopper mascot, design and software belong to HLN. Facility information is compiled from
        public sources and from people who help us confirm it. You may share links to Lunhaw freely.
      </p>

      <h2>No warranty</h2>
      <p>
        Lunhaw is provided “as is”. We work to keep information accurate and clearly labelled, but we can’t guarantee it
        is complete, current or error-free, or that the service will always be available.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by Philippine law, HLN is not liable for any loss or inconvenience arising from your use
        of Lunhaw. That includes a trip to a facility that turns out to be closed, or relying on an estimate. Nothing in
        these terms limits liability that cannot be limited by law.
      </p>

      <h2>Privacy</h2>
      <p>
        How we handle personal data is explained in our <a href="/privacy">Privacy Notice</a>.
      </p>

      <h2>Changes and governing law</h2>
      <p>
        We may update these terms. If we do, we will change the date above, and for significant changes we will tell
        account holders by email. These terms are governed by the laws of the Republic of the Philippines.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: {mail}.</p>
    </LegalPage>
  );
}
