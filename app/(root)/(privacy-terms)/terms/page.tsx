import type { Metadata } from "next";
import Link from "next/link";
import LegalDocument, { type LegalSection } from "@/components/Legal/LegalConfig"
import { LEGAL } from "@/constants/legal-config";

export const metadata: Metadata = {
  title: "Terms of Service | NekkoDojo",
  description: "The agreement between you and NekkoDojo.",
};

const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    body: (
      <>
        <p>
          These terms are a binding agreement between you and {LEGAL.operator}, which operates{" "}
          {LEGAL.serviceName}. By creating an account or using the service, you agree to them and to
          our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the
          service.
        </p>
        <p>
          You must be at least {LEGAL.minAge} years old. If you are under the age of majority where
          you live, you confirm that a parent or guardian has reviewed and accepted these terms.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for the activity on your account and for keeping your sign-in details
          secure. Give us accurate information, keep it up to date, and tell us immediately if you
          suspect unauthorised use.
        </p>
        <p>
          One person may hold one account. You may not share an account, or buy, sell or transfer
          one.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>
          You agree to follow our <Link href="/community-guidelines">Community Guidelines</Link> and
          the <Link href="/code-of-bushido">Code of Bushido</Link>. In addition, you must not:
        </p>
        <ul>
          <li>break the law or infringe anyone&rsquo;s rights;</li>
          <li>
            attack, probe, overload or try to gain unauthorised access to the service, its code
            execution environment, or other members&rsquo; accounts;
          </li>
          <li>
            submit code that is malicious or designed to damage systems, mine cryptocurrency, send
            spam, or consume resources beyond reasonable use;
          </li>
          <li>use bots, scripts or automation to submit solutions or scrape the service;</li>
          <li>cheat on ranked problems or misrepresent your progress; or</li>
          <li>harass others, or post hateful, unsafe or deceptive content.</li>
        </ul>
        <p>
          If you find a security vulnerability, report it privately to {mail} instead of exploiting
          or publishing it.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          You keep ownership of what you post, including discussions, comments, messages and the
          code you write. You are responsible for it, and you confirm you have the right to share
          it.
        </p>
        <p>
          To operate the service, you give us a worldwide, non-exclusive, royalty-free licence to
          host, store, display, reproduce and distribute your content within {LEGAL.serviceName}.
          This licence lasts as long as your content is on the service and ends when you delete it,
          except for copies in backups and content that others have already shared or quoted.
        </p>
        <p>
          We may remove content that breaks these terms or the law, and we may preserve and disclose
          it where required.
        </p>
      </>
    ),
  },
  {
    id: "our-content",
    title: "Our content and third-party material",
    body: (
      <>
        <p>
          The service, including its design, text, graphics, software and original learning
          materials, belongs to us or our licensors and is protected by intellectual property law.
          We give you a limited, personal, non-transferable licence to use it for your own learning.
          You may not copy, resell or build a competing service from it.
        </p>
        <p>
          Some problems link to external platforms, and some solutions come from the community.
          Those belong to their respective owners and are subject to their own terms. We are not
          responsible for third-party sites.
        </p>
      </>
    ),
  },
  {
    id: "ranks",
    title: "Belts, ranks and leaderboards",
    body: (
      <p>
        Belts, ranks and leaderboard positions are for motivation and recognition only. They carry
        no monetary value. We may adjust, reset or remove them to correct errors, fix abuse, or
        change how progress works.
      </p>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    body: (
      <p>
        Parts of the service rely on third parties, for example sign-in through Google or GitHub.
        Your use of those services is governed by their own terms and privacy policies, and we are
        not responsible for them.
      </p>
    ),
  },
  {
    id: "changes-to-service",
    title: "Changes to the service",
    body: (
      <p>
        We are always improving the dojo. We may add, change or remove features, or suspend the
        service for maintenance. We will try to give notice of changes that significantly affect
        you, but we do not promise the service will always be available or free of errors.
      </p>
    ),
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          You may stop using the service and delete your account at any time. We may suspend or end
          your access, with or without notice, if you break these terms, put others or the service
          at risk, or if required by law.
        </p>
        <p>
          Sections that by their nature should survive termination, including those on content,
          disclaimers, liability and governing law, will continue to apply.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The service is provided “as is” and “as available”. To the fullest extent permitted by law,
        we do not make any warranties, express or implied, including about fitness for a particular
        purpose, accuracy, or uninterrupted operation. We do not guarantee that using the service
        will lead to any particular result, such as passing an interview or getting a job.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by law, we are not liable for indirect, incidental,
          special, consequential or punitive damages, or for loss of data, profits or goodwill,
          arising from your use of the service.
        </p>
        <p>
          Our total liability to you for any claim relating to the service is limited to the greater
          of the amount you paid us in the 12 months before the claim, or [amount, e.g. USD 100].
          Nothing in these terms limits liability that cannot be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Your responsibility for claims",
    body: (
      <p>
        You agree to defend and compensate us against claims and costs arising from your content or
        from your breach of these terms, to the extent permitted by law.
      </p>
    ),
  },
  {
    id: "changes-to-terms",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. If a change is significant we will tell you in the service or by
        email before it takes effect. Continuing to use the service afterwards means you accept the
        updated terms.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by {LEGAL.jurisdiction}, without regard to conflict-of-law rules.
        Any dispute will be handled by the courts of that jurisdiction, unless the law where you
        live gives you the right to bring a claim elsewhere.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: <p>Questions about these terms? Email {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      intro="The rules for using the dojo, and what you can expect from us in return."
      summary={[
        "You must be old enough, keep your account secure, and follow the Community Guidelines.",
        "You keep ownership of what you create, and let us display it to run the service.",
        "Do not attack the service, cheat on ranked problems, or submit harmful code.",
        "We may suspend accounts that break the rules, and the service is provided as is.",
      ]}
      sections={SECTIONS}
      related={[
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Community Guidelines", href: "/community-guidelines" },
        { label: "Code of Bushido", href: "/code-of-bushido" },
      ]}
    />
  );
}
