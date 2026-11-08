import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Notice · Lunhaw",
  description: "How Lunhaw collects, uses and protects personal data under the Philippine Data Privacy Act of 2012.",
};

export default function PrivacyPage() {
  const mail = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
  return (
    <LegalPage
      title="Privacy Notice"
      intro="Lunhaw helps people in Metro Manila find parks, gardens and public libraries, and how to get there. We collect as little personal data as we can. This notice explains what we collect, why, and the rights you have under the Data Privacy Act of 2012 (Republic Act No. 10173)."
    >
      <h2>Who we are</h2>
      <p>
        Lunhaw is operated by HLN, the personal information controller for the data described here. For any privacy
        question or request, including reaching our Data Protection Officer, email {mail}.
      </p>

      <h2>What we collect and why</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Why</th>
            <th scope="col">Legal basis</th>
            <th scope="col">How long we keep it</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Data">Account: your name, email address and password (stored only as a secure hash)</td>
            <td data-label="Why">To create your account and let you sign in</td>
            <td data-label="Legal basis">Your consent when you sign up, and to provide the service you asked for</td>
            <td data-label="How long we keep it">Until you delete your account</td>
          </tr>
          <tr>
            <td data-label="Data">Newsletter: your email address and when you agreed to receive emails</td>
            <td data-label="Why">To send occasional updates about Lunhaw</td>
            <td data-label="Legal basis">Your consent</td>
            <td data-label="How long we keep it">Until you unsubscribe</td>
          </tr>
          <tr>
            <td data-label="Data">Technical data: IP address, browser type and request times</td>
            <td data-label="Why">To deliver the website, keep it secure and prevent abuse (for example, rate limiting)</td>
            <td data-label="Legal basis">Our legitimate interest in running a secure service</td>
            <td data-label="How long we keep it">Short-term service logs kept by our hosting providers</td>
          </tr>
        </tbody>
      </table>

      <h2>What stays on your device</h2>
      <ul>
        <li>
          <strong>Your location.</strong> Lunhaw only asks for it when you tap “Use my current location”. It is used in
          your browser to estimate walking distance and is never sent to our servers or stored by us. You can always
          type a starting point instead.
        </li>
        <li>
          <strong>Saved places</strong> and your sign-in session are kept in your browser’s local storage. Clearing your
          browser data removes them.
        </li>
      </ul>

      <h2>What we don’t do</h2>
      <ul>
        <li>We don’t sell or rent personal data.</li>
        <li>We don’t use advertising, analytics or tracking tools.</li>
        <li>We don’t record the locations you search from.</li>
      </ul>

      <h2>Who processes data for us</h2>
      <p>We use a small number of service providers, who process data only on our instructions:</p>
      <ul>
        <li>
          <strong>Supabase</strong>: database and account sign-in.
        </li>
        <li>
          <strong>Cloudflare</strong>: hosting for the website and API.
        </li>
        <li>
          <strong>Google Fonts</strong>: serves the typefaces used on the site, which means your browser requests them
          from Google.
        </li>
      </ul>
      <p>
        These providers may store or process data on servers outside the Philippines. Where that happens, we rely on
        their contractual and security commitments to protect it to a standard comparable to the Data Privacy Act.
      </p>

      <h2>How we protect your data</h2>
      <p>
        All connections use HTTPS. Passwords are never stored in readable form. Database access is restricted, and the
        newsletter list can only be read by the operator. If a personal data breach occurs that is likely to put you at
        risk, we will notify the National Privacy Commission and the people affected within 72 hours of learning of it,
        as the law requires.
      </p>

      <h2>Your rights</h2>
      <p>Under the Data Privacy Act you have the right to:</p>
      <ul>
        <li>be informed about how your personal data is processed;</li>
        <li>access the personal data we hold about you;</li>
        <li>correct inaccurate data;</li>
        <li>object to processing, or withdraw your consent at any time;</li>
        <li>have your data erased or blocked;</li>
        <li>receive your data in a portable format;</li>
        <li>claim damages for misuse of your data; and</li>
        <li>
          file a complaint with the National Privacy Commission (
          <a href="https://privacy.gov.ph" rel="noopener noreferrer">
            privacy.gov.ph
          </a>
          ).
        </li>
      </ul>
      <p>
        To use any of these rights, including deleting your account or unsubscribing, email {mail}. We will respond
        within 30 days.
      </p>

      <h2>Children</h2>
      <p>If you are under 18, please use Lunhaw with the permission of a parent or guardian.</p>

      <h2>Changes to this notice</h2>
      <p>
        If we change how we handle personal data, we will update this page and the date above. For significant
        changes, we will tell account holders by email before the change takes effect.
      </p>
    </LegalPage>
  );
}
